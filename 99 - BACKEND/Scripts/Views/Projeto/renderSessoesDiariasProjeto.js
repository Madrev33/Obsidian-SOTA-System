// Componente SOTA: renderSessoesDiariasProjeto.js v1.2
// Exibe a lista cronológica das sessões de Foco/Pausa do dia, incluindo Duração Extra e Qualidade de Foco.

async function main() {
    const dashboard = input.dashboard;
    const sortBy = dashboard.sort_by_sessoes_dia || 'fimMoment';
    const sortOrder = dashboard.sort_order_sessoes_dia || 'asc';

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
    if (!logFile) { dv.paragraph("Nenhum log de atividade encontrado para este projeto hoje."); return; }

    const content = await app.vault.cachedRead(logFile);
    const hojeStr = moment().format("YYYY-MM-DD");

    const logsDeHoje = content.split('\n').filter(line => 
        line.includes(`(log_date::${hojeStr})`) && line.includes("(sessao_fim::")
    );
    
    if (logsDeHoje.length === 0) { dv.paragraph("Nenhuma sessão de Pomodoro encontrada hoje para este projeto."); return; }
    
    const sessoesProcessadas = logsDeHoje.map(log => {
        const timeMatch = log.match(/\(log_time::\s*([^)]+)\)/);
        const totalDurMatch = log.match(/\(duracao_total_sessao_segundos::\s*(\d+)\)/);
        const extraDurMatch = log.match(/\(duracao_extra_segundos::\s*(\d+)\)/);
        const tipoMatch = log.match(/\(sessao_fim::(WORK|BREAK)\)/);
        const tarefaMatch = log.match(/\(tarefa_focada::\s*"(.*?)"\)/);
        const tagMatch = log.match(/#projeto\/[^\/]+\/([^\/]+)/);
        const focoMatch = log.match(/\(foco_autoavaliado::\s*(\d+)\)/); // <-- ADICIONADO

        const duracaoTotalSeg = totalDurMatch ? parseInt(totalDurMatch[1]) : 0;
        const duracaoExtraSeg = extraDurMatch ? parseInt(extraDurMatch[1]) : 0;
        const focoScore = focoMatch ? parseInt(focoMatch[1]) : null; // <-- ADICIONADO
        const fimMoment = timeMatch ? dv.date(`${hojeStr}T${timeMatch[1]}`) : null;

        return {
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
    
    const gerarVisualizacaoFoco = (score) => {
        if (score === null || score === undefined) return "N/A";
        const emoji = score <= 4 ? "🔴" : score <= 7 ? "🟡" : "🟢";
        return `${emoji} ${score}/10`;
    };

    const headers = ["Fase", "Tarefa", "Início", "Fim", "Sessão", "Duração Total", "Duração Extra", "Qualidade Foco"]; // <-- ATUALIZADO

    const tableData = sessoesProcessadas.map(p => {
        return [
            p.fase,
            p.tarefa,
            p.inicioMoment ? p.inicioMoment.toFormat("HH:mm") : "N/A",
            p.fimMoment ? p.fimMoment.toFormat("HH:mm") : "N/A",
            p.tipoSessao === 'Foco' ? '🍅 Foco' : '☕ Pausa',
            formatarSegundos(p.duracaoTotalSeg),
            formatarSegundos(p.duracaoExtraSeg),
            gerarVisualizacaoFoco(p.focoScore), // <-- ADICIONADO
        ];
    });

    dv.table(headers, tableData);
}
main();