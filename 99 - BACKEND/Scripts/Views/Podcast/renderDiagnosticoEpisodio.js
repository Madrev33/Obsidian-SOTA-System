// Componente SOTA: renderDiagnosticoEpisodio.js (v2.0 - Adicionada Análise de Pausas)
async function main() {
    const idMidia = dv.current().midia_selecionada_id;
    const tipoMidia = dv.current().midia_selecionada_tipo;
    const cicloSelecionado = dv.current().ciclo_selecionado_view;
    // Lendo as variáveis de ordenação do frontmatter do dashboard
    const sortBy = dv.current().sort_by_foco_episodio || 'episodio';
    const sortOrder = dv.current().sort_order_foco_episodio || 'asc';

    if (!idMidia) { dv.paragraph("❌ ERRO: 'midia_selecionada_id' não encontrado no frontmatter do Dashboard."); return; }
    
    const hub = dv.pages().where(p => p.id_midia === idMidia && p.tipo === "podcast_hub")[0];
    if (!hub) { dv.paragraph(`❌ ERRO: HUB de Podcast com ID ${idMidia} não encontrado.`); return; }

    if (!cicloSelecionado) { dv.paragraph("⚠️ Selecione um ciclo para ver o diagnóstico."); return; }

    if (cicloSelecionado === "Visão Agregada (Todos os Ciclos)") { dv.span("**Diagnóstico por Episódio (Todos os Ciclos)**"); } 
    else { dv.span(`**Diagnóstico por Episódio (${cicloSelecionado})**`); }

    const sanitizar = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[-\s]+/g, '_').replace(/[^\w_]+/g, '') : "";
    const nomePodcastSanitizado = hub.id_midia || sanitizar(hub.file.name.replace('00. HUB - ', ''));
    const logBrutoPath = `99 - BACKEND/Logs_Metricas/Podcasts/${nomePodcastSanitizado}/raw_logs.md`;
    
    const logFile = app.vault.getAbstractFileByPath(logBrutoPath);
    if (!logFile) { dv.paragraph("Nenhum log de episódio encontrado."); return; }

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
    
    if (todosOsLogs.length === 0) { dv.paragraph("Nenhuma sessão de foco encontrada para o período selecionado."); return; }
    
    const dadosPorEpisodio = todosOsLogs.reduce((acc, log) => {
        const duracaoMatch = log.match(/\(duracao_total_sessao_segundos::\s*(\d+)\)/);
        const duracao = duracaoMatch ? parseInt(duracaoMatch[1]) : 0;
        
        const dataMatch = log.match(/\(log_date::\s*(.*?)\)/);
        const data = dataMatch ? dataMatch[1] : null;

        const cicloMatch = log.match(/\(ciclo::(\d+)\)/);
        // FIX: Regexes corretas para Podcasts (e Séries/Docs)
        const temporadaMatch = log.match(/\(temporada::(\d+)\)/);
        const episodioMatch = log.match(/\(episodio::(\d+)\)/);

        if (!cicloMatch || !temporadaMatch || !episodioMatch) return acc;

        const [_, ciclo, temporada, episodio] = [null, ...[cicloMatch, temporadaMatch, episodioMatch].map(m => parseInt(m[1]))];
        
        const key = `${ciclo}-${temporada}-${episodio}`;
        if (!acc[key]) {
            acc[key] = { ciclo, temporada, episodio, tempoFocoSegundos: 0, sessoesFoco: 0, tempoPausasSegundos: 0, sessoesPausas: 0, datas: new Set(), ultimaData: null };
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

    for (const key in dadosPorEpisodio) {
        const datasArray = Array.from(dadosPorEpisodio[key].datas).sort();
        dadosPorEpisodio[key].ultimaData = datasArray.length > 0 ? datasArray[datasArray.length - 1] : null;
    }

    if (Object.keys(dadosPorEpisodio).length === 0) { dv.paragraph("Nenhum registro de episódio encontrado. Continue assistindo!"); return; }

    const dadosProcessados = Object.values(dadosPorEpisodio);
    dadosProcessados.sort((a, b) => {
        const valA = a[sortBy] === null || a[sortBy] === undefined ? 0 : a[sortBy];
        const valB = b[sortBy] === null || b[sortBy] === undefined ? 0 : b[sortBy];
        if (valA === valB) return 0;
        const comparison = valA < valB ? -1 : 1;
        return sortOrder === 'asc' ? comparison : -comparison;
    });

    const formatarSegundos = (s) => {
        if (isNaN(s) || s === 0) return "0s";
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const secs = Math.round(s % 60);
        let parts = [];
        if (h > 0) parts.push(`${h}h`);
        if (m > 0) parts.push(`${m}m`);
        if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
        return parts.join(' ');
    };

    const headers = cicloSelecionado === "Visão Agregada (Todos os Ciclos)"
        ? ["Ciclo", "Temporada", "Episódio", "Tempo Total de Foco", "Tempo Total de Pausas", "Nº de Sessões Foco", "Nº de Sessões Pausa", "Data(s)"]
        : ["Temporada", "Episódio", "Tempo Total de Foco", "Tempo Total de Pausas", "Nº de Sessões Foco", "Nº de Sessões Pausa", "Data(s)"];

    const tabelaArray = dadosProcessados.map(p => {
        const datasLinks = Array.from(p.datas).sort().map(dataStr => dv.fileLink(`01 - Registros/01. Daily/${dv.date(dataStr).toFormat("yyyy/MM")}/${dataStr}.md`, false, dataStr).toString()).join('<br>');
        
        const row = [
            `T${p.temporada}`, 
            `EP${p.episodio}`, 
            formatarSegundos(p.tempoFocoSegundos),
            formatarSegundos(p.tempoPausasSegundos),
            p.sessoesFoco,
            p.sessoesPausas,
            datasLinks
        ];
        
        if (cicloSelecionado === "Visão Agregada (Todos os Ciclos)") {
            row.unshift(`**C${p.ciclo}**`);
        }
        return row;
    });

    dv.table(headers, tabelaArray);
}
main();