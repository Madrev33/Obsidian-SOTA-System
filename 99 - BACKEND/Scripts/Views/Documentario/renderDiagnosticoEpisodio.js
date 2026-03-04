// Componente SOTA: renderDiagnosticoEpisodio.js (v2.1 - Fix de Regex para Documentários)
async function main() {
    const idMidia = dv.current().midia_selecionada_id;
    const tipoMidia = dv.current().midia_selecionada_tipo;
    const cicloSelecionado = dv.current().ciclo_selecionado_view;
    const sortBy = dv.current().sort_by_foco_episodio || 'episodio';
    const sortOrder = dv.current().sort_order_foco_episodio || 'asc';

    if (!idMidia) { dv.paragraph("❌ ERRO: 'midia_selecionada_id' não encontrado."); return; }
    
    // Suporte para Documentário Serializado, Série e Podcast (mesma estrutura)
    const hub = dv.pages().where(p => p.id_midia === idMidia && (p.tipo === "documentario_serializado_hub" || p.tipo === "serie_hub" || p.tipo === "podcast_hub"))[0];
    if (!hub) { dv.paragraph(`❌ ERRO: HUB não encontrado.`); return; }

    if (!cicloSelecionado) { dv.paragraph("⚠️ Selecione um ciclo."); return; }

    if (cicloSelecionado === "Visão Agregada (Todos os Ciclos)") { dv.span("**Diagnóstico Geral**"); } 
    else { dv.span(`**Diagnóstico do ${cicloSelecionado}**`); }

    // Determina a pasta correta baseado no tipo
    let tipoPasta = "Documentarios";
    if (hub.tipo === "serie_hub") tipoPasta = "Series";
    if (hub.tipo === "podcast_hub") tipoPasta = "Podcasts";

    const sanitizar = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[-\s]+/g, '_').replace(/[^\w_]+/g, '') : "";
    const nomeSanitizado = hub.id_midia || sanitizar(hub.file.name.replace('00. HUB - ', ''));
    const logBrutoPath = `99 - BACKEND/Logs_Metricas/${tipoPasta}/${nomeSanitizado}/raw_logs.md`;
    
    const logFile = app.vault.getAbstractFileByPath(logBrutoPath);
    if (!logFile) { dv.paragraph("Nenhum log encontrado."); return; }

    const content = await app.vault.cachedRead(logFile);
    let todosOsLogs = content.split('\n').filter(line => line.trim() !== '' && line.includes("(sessao_fim::"));

    if (cicloSelecionado !== "Visão Agregada (Todos os Ciclos)") {
        const numeroCiclo = parseInt(cicloSelecionado.replace('Ciclo ', ''));
        if (!isNaN(numeroCiclo)) {
            todosOsLogs = todosOsLogs.filter(log => {
                const cicloMatch = log.match(/\(ciclo::\s*(\d+)\)/);
                return cicloMatch && parseInt(cicloMatch[1]) === numeroCiclo;
            });
        }
    }
    
    if (todosOsLogs.length === 0) { dv.paragraph("Nenhuma sessão encontrada."); return; }
    
    const dadosPorEpisodio = todosOsLogs.reduce((acc, log) => {
        const duracaoMatch = log.match(/\(duracao_total_sessao_segundos::\s*(\d+)\)/);
        const duracao = duracaoMatch ? parseInt(duracaoMatch[1]) : 0;
        
        const dataMatch = log.match(/\(log_date::\s*(.*?)\)/);
        const data = dataMatch ? dataMatch[1] : null;

        const cicloMatch = log.match(/\(ciclo::(\d+)\)/);
        
        // CORREÇÃO: Regex para Temporada e Episódio (Não Módulo/Aula)
        const temporadaMatch = log.match(/\(temporada::(\d+)\)/) || log.match(/\(modulo::(\d+)\)/); // Fallback para compatibilidade
        const episodioMatch = log.match(/\(episodio::(\d+)\)/) || log.match(/\(aula::(\d+)\)/);     // Fallback para compatibilidade

        if (!cicloMatch || !temporadaMatch || !episodioMatch) return acc;

        const [_, ciclo, temporada, episodio] = [null, ...[cicloMatch, temporadaMatch, episodioMatch].map(m => parseInt(m[1]))];
        
        const key = `${ciclo}-${temporada}-${episodio}`;
        if (!acc[key]) {
            acc[key] = { ciclo, temporada, episodio, tempoFocoSegundos: 0, sessoesFoco: 0, tempoPausasSegundos: 0, sessoesPausas: 0, datas: new Set() };
        }

        if (log.includes("(sessao_fim::WORK)")) {
            acc[key].tempoFocoSegundos += duracao;
            acc[key].sessoesFoco += 1;
        } else if (log.includes("(sessao_fim::BREAK)")) {
            acc[key].tempoPausasSegundos += duracao;
            acc[key].sessoesPausas += 1;
        }
        
        if (data) acc[key].datas.add(data);

        return acc;
    }, {});

    if (Object.keys(dadosPorEpisodio).length === 0) { dv.paragraph("Nenhum registro processável encontrado."); return; }

    const dadosProcessados = Object.values(dadosPorEpisodio);
    
    dadosProcessados.sort((a, b) => {
        let valA, valB;
        // Lógica de ordenação dinâmica baseada no frontmatter (opcional) ou padrão
        if (sortBy === 'tempoFoco') { valA = a.tempoFocoSegundos; valB = b.tempoFocoSegundos; }
        else { valA = a.episodio; valB = b.episodio; }
        
        if (valA === valB) return 0;
        const comparison = valA < valB ? -1 : 1;
        return sortOrder === 'asc' ? comparison : -comparison;
    });

    const formatarSegundos = (s) => {
        if (isNaN(s) || s === 0) return "00h 00m 00s";
        const h = Math.floor(s / 3600).toString().padStart(2, '0');
        const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
        const secs = Math.round(s % 60).toString().padStart(2, '0');
        return `${h}h ${m}m ${secs}s`;
    };

    const headers = cicloSelecionado === "Visão Agregada (Todos os Ciclos)"
        ? ["Ciclo", "Temporada", "Episódio", "Tempo Foco", "Tempo Pausa", "Sessões Foco", "Sessões Pausa", "Data(s)"]
        : ["Temporada", "Episódio", "Tempo Foco", "Tempo Pausa", "Sessões Foco", "Sessões Pausa", "Data(s)"];

    const tabelaArray = dadosProcessados.map(p => {
        const datasLinks = Array.from(p.datas).sort().map(dataStr => {
            const dt = dv.date(dataStr);
            // Link para a nota diária
            return dt ? `[[01 - Registros/01. Daily/${dt.toFormat("yyyy/MM")}/${dataStr}|${dataStr}]]` : dataStr;
        }).join('<br>');
        
        const row = [
            `T${p.temporada}`, 
            `E${p.episodio}`, 
            formatarSegundos(p.tempoFocoSegundos),
            formatarSegundos(p.tempoPausasSegundos),
            p.sessoesFoco,
            p.sessoesPausas,
            datasLinks
        ];
        
        if (cicloSelecionado === "Visão Agregada (Todos os Ciclos)") {
            row.unshift(`C${p.ciclo}`);
        }
        return row;
    });

    dv.table(headers, tabelaArray);
}
main();