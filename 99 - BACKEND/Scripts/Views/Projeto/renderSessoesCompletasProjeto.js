// Componente SOTA: renderSessoesCompletasProjeto.js v1.2
// Exibe a lista cronológica de TODAS as sessões de Foco e Pausa de um projeto, incluindo Duração Extra e Autoavaliação de Foco.

async function main() {
    const dashboard = input.dashboard;
    const sortBy = dashboard.sort_by_sessoes || 'fimMoment';
    const sortOrder = dashboard.sort_order_sessoes || 'desc';

    if (!dashboard) { dv.paragraph("❌ ERRO: Contexto do dashboard não fornecido."); return; }
    const hubUID = dashboard.hub_uid;
    if (!hubUID) { dv.paragraph("❌ ERRO: 'hub_uid' não encontrado."); return; }
    
    // Padrão SOTA: Usar findHubByUid_Robust para evitar falhas de cache
    const findHubByUid_Robust = (uid) => {
        if (!uid) return null;
        for (const file of app.vault.getMarkdownFiles()) {
            const cache = app.metadataCache.getFileCache(file);
            if (cache?.frontmatter?.sota_uid === uid) return dv.page(file.path);
        }
        return null;
    };
    const hub = findHubByUid_Robust(hubUID);
    if (!hub) { dv.paragraph(`❌ ERRO: HUB com UID ${hubUID} não encontrado.`); return; }

    const idProjeto = hub.id_projeto;
    const logBrutoPath = `99 - BACKEND/Logs_Metricas/Projetos/${idProjeto}/raw_logs.md`;
    
    const logFile = app.vault.getAbstractFileByPath(logBrutoPath);
    if (!logFile) { dv.paragraph("Nenhum log de atividade encontrado para este projeto."); return; }

    const content = await app.vault.cachedRead(logFile);
    const todosOsLogs = content.split('\n').filter(line => line.trim() !== '' && line.includes("(sessao_fim::"));
    
    if (todosOsLogs.length === 0) { dv.paragraph("Nenhuma sessão de Pomodoro encontrada para este projeto."); return; }
    
    const sessoesProcessadas = todosOsLogs.map(log => {
        const dateMatch = log.match(/\(log_date::\s*([^)]+)\)/);
        const timeMatch = log.match(/\(log_time::\s*([^)]+)\)/);
        const totalDurMatch = log.match(/\(duracao_total_sessao_segundos::\s*(\d+)\)/);
        const extraDurMatch = log.match(/\(duracao_extra_segundos::\s*(\d+)\)/);
        const tipoMatch = log.match(/\(sessao_fim::(WORK|BREAK)\)/);
        const tarefaMatch = log.match(/\(tarefa_focada::\s*"(.*?)"\)/);
        const tagMatch = log.match(/#projeto\/[^\/]+\/([^\/]+)/);
        const focoMatch = log.match(/\(foco_autoavaliado::\s*(\d+)\)/); // <-- ADICIONADO

        const dataStr = dateMatch ? dateMatch[1] : null;
        const duracaoTotalSeg = totalDurMatch ? parseInt(totalDurMatch[1]) : 0;
        const duracaoExtraSeg = extraDurMatch ? parseInt(extraDurMatch[1]) : 0;
        const focoScore = focoMatch ? parseInt(focoMatch[1]) : null; // <-- ADICIONADO
        const fimMoment = dataStr && timeMatch ? dv.date(`${dataStr}T${timeMatch[1]}`) : null;

        return {
            dataStr: dataStr,
            inicioMoment: fimMoment ? fimMoment.minus({ seconds: duracaoTotalSeg }) : null,
            fimMoment: fimMoment,
            tipoSessao: tipoMatch ? (tipoMatch[1] === 'WORK' ? 'Foco' : 'Pausa') : 'N/A',
            duracaoTotalSeg: duracaoTotalSeg,
            duracaoExtraSeg: duracaoExtraSeg,
            focoScore: focoScore, // <-- ADICIONADO
            tarefa: tarefaMatch ? tarefaMatch[1].replace(/\[🍅::\s*\d+\/\d+\]/g, '').replace(/#\S+/g, '').trim() : "N/A",
            fase: tagMatch ? tagMatch[1].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : "N/A"
        };
    });

    sessoesProcessadas.sort((a, b) => {
        let valA = a[sortBy];
        let valB = b[sortBy];
        if (sortBy.includes('Moment')) {
            valA = valA ? valA.toMillis() : 0;
            valB = valB ? valB.toMillis() : 0;
        }
        if (valA === valB) return 0;
        const comparison = valA < valB ? -1 : 1;
        return sortOrder === 'asc' ? comparison : -comparison;
    });

    const formatarSegundos = (s) => {
        if (isNaN(s) || s === 0) return "0s";
        const m = Math.floor(s / 60);
        const secs = Math.round(s % 60);
        return [m > 0 ? `${m}m` : '', (secs > 0 || m === 0) ? `${secs}s` : ''].filter(Boolean).join(' ');
    };

    // Função de formatação para a autoavaliação de foco
    const gerarVisualizacaoFoco = (score) => {
        if (score === null || score === undefined) return "N/A";
        const emoji = score <= 4 ? "🔴" : score <= 7 ? "🟡" : "🟢";
        return `${emoji} ${score}/10`;
    };

    const headers = ["Tarefa", "Fase", "Início", "Fim", "Sessão", "Duração Total", "Duração Extra", "Qualidade Foco", "Data"]; // <-- ATUALIZADO

    const tableData = sessoesProcessadas.map(p => {
        const dataLink = p.dataStr ? dv.fileLink(`01 - Registros/01. Daily/${dv.date(p.dataStr).toFormat("yyyy/MM")}/${p.dataStr}.md`, false, p.dataStr) : "N/A";
        return [
            p.tarefa,
            p.fase,
            p.inicioMoment ? p.inicioMoment.toFormat("HH:mm") : "N/A",
            p.fimMoment ? p.fimMoment.toFormat("HH:mm") : "N/A",
            p.tipoSessao === 'Foco' ? '🍅 Foco' : '☕ Pausa',
            formatarSegundos(p.duracaoTotalSeg),
            formatarSegundos(p.duracaoExtraSeg),
            gerarVisualizacaoFoco(p.focoScore), // <-- ADICIONADO
            dataLink
        ];
    });

    dv.table(headers, tableData);
}
main();