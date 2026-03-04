// Componente SOTA: renderDiagnosticoEpisodio.js (v2.1 - Fix de Regex Temporada/Episódio)

async function main() {
    const idMidia = dv.current().midia_selecionada_id;
    const tipoMidia = dv.current().midia_selecionada_tipo;
    const cicloSelecionado = dv.current().ciclo_selecionado_view;
    const sortBy = dv.current().sort_by_foco_episodio || 'episodio';
    const sortOrder = dv.current().sort_order_foco_episodio || 'asc';

    if (!idMidia) { dv.paragraph("❌ ERRO: 'midia_selecionada_id' não encontrado."); return; }
    
    // Suporte para Serie, Podcast e Documentario (Todos usam Temporada/Episódio)
    const hub = dv.pages().where(p => p.id_midia === idMidia && (p.tipo === "serie_hub" || p.tipo === "podcast_hub" || p.tipo === "documentario_serializado_hub"))[0];
    
    if (!hub) { dv.paragraph(`❌ ERRO: HUB não encontrado.`); return; }

    if (!cicloSelecionado) { dv.paragraph("⚠️ Selecione um ciclo."); return; }

    // Determina a pasta base baseada no tipo (para achar o log correto)
    let tipoPasta = "Series";
    if (hub.tipo === "podcast_hub") tipoPasta = "Podcasts";
    if (hub.tipo === "documentario_serializado_hub") tipoPasta = "Documentarios";

    const sanitizar = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[-\s]+/g, '_').replace(/[^\w_]+/g, '') : "";
    const nomeSanitizado = hub.id_midia || sanitizar(hub.file.name.replace('00. HUB - ', ''));
    const logBrutoPath = `99 - BACKEND/Logs_Metricas/${tipoPasta}/${nomeSanitizado}/raw_logs.md`;
    
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
        // FIX: Regexes corretas para Séries
        const temporadaMatch = log.match(/\(temporada::(\d+)\)/);
        const episodioMatch = log.match(/\(episodio::(\d+)\)/);

        if (!cicloMatch || !temporadaMatch || !episodioMatch) return acc;

        const [_, ciclo, temporada, episodio] = [null, ...[cicloMatch, temporadaMatch, episodioMatch].map(m => parseInt(m[1]))];
        
        const key = `${ciclo}-${temporada}-${episodio}`;
        if (!acc[key]) {
            acc[key] = { 
                ciclo, 
                temporada, 
                episodio, 
                tempoFocoSegundos: 0, 
                sessoesFoco: 0, 
                tempoPausasSegundos: 0, 
                sessoesPausas: 0, 
                datas: new Set(), 
                ultimaData: null 
            };
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

    // ... (Resto da lógica de ordenação e renderização permanece igual) ...
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
        if (isNaN(s) || s === 0) return "00h 00m 00s"; // Padronizado com HH:mm:ss
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
            return dt ? dv.fileLink(`01 - Registros/01. Daily/${dt.toFormat("yyyy/MM")}/${dataStr}.md`, false, dataStr).toString() : dataStr;
        }).join('<br>');
        
        const row = [
            `Temporada ${p.temporada}`, 
            `Episódio ${p.episodio}`, 
            formatarSegundos(p.tempoFocoSegundos),
            formatarSegundos(p.tempoPausasSegundos),
            p.sessoesFoco,
            p.sessoesPausas,
            datasLinks
        ];
        
        if (cicloSelecionado === "Visão Agregada (Todos os Ciclos)") {
            row.unshift(`**Ciclo ${p.ciclo}**`);
        }
        return row;
    });

    dv.table(headers, tabelaArray);
}

main();