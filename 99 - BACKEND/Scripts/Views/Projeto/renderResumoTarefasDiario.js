// Componente SOTA: renderResumoTarefasDiario.js v1.0
// Agrega e exibe o esforço total (foco e pausas) por tarefa no dia corrente.

async function main() {
    const dashboard = input.dashboard;
    const sortBy = dashboard.sort_by_resumo_tarefa_dia || 'tempoFocoSegundos';
    const sortOrder = dashboard.sort_order_resumo_tarefa_dia || 'desc';

    if (!dashboard) { dv.paragraph("❌ ERRO: Contexto do dashboard não fornecido."); return; }
    const hubUID = dashboard.hub_uid;
    if (!hubUID) { dv.paragraph("❌ ERRO: 'hub_uid' não encontrado."); return; }
    
    const hub = dv.pages().where(p => p.sota_uid === hubUID)[0];
    if (!hub) { dv.paragraph(`❌ ERRO: HUB com UID ${hubUID} não encontrado.`); return; }

    const idProjeto = hub.id_projeto;
    const logBrutoPath = `99 - BACKEND/Logs_Metricas/Projetos/${idProjeto}/raw_logs.md`;
    
    const logFile = app.vault.getAbstractFileByPath(logBrutoPath);
    if (!logFile) { dv.paragraph("Nenhum log de atividade encontrado para este projeto hoje."); return; }

    const content = await app.vault.cachedRead(logFile);
    const hojeStr = moment().format("YYYY-MM-DD");

    const logsDeHoje = content.split('\n').filter(line => line.includes(`(log_date::${hojeStr})`) && line.includes("(sessao_fim::"));
    
    if (logsDeHoje.length === 0) { dv.paragraph("Nenhuma sessão de Pomodoro encontrada hoje para este projeto."); return; }
    
    const dadosPorTarefa = logsDeHoje.reduce((acc, log) => {
        const tarefaMatch = log.match(/\(tarefa_focada::\s*"(.*?)"\)/);
        if (!tarefaMatch) return acc;

        const tarefaCompleta = tarefaMatch[1];
        // Limpa a string da tarefa para usar como chave, removendo contadores e tags
        const chaveTarefa = tarefaCompleta.replace(/\[🍅::\s*\d+\/\d+\]/g, '').replace(/#\S+/g, '').trim();
        
        if (!acc[chaveTarefa]) {
            const tagMatch = tarefaCompleta.match(/#projeto\/[^\/]+\/([^\/]+)/);
            const fase = tagMatch ? tagMatch[1].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : "N/A";
            acc[chaveTarefa] = { tarefa: chaveTarefa, fase: fase, tempoFocoSegundos: 0, sessoesFoco: 0, tempoPausasSegundos: 0, sessoesPausas: 0 };
        }

        const duracaoMatch = log.match(/\(duracao_total_sessao_segundos::\s*(\d+)\)/);
        const duracao = duracaoMatch ? parseInt(duracaoMatch[1]) : 0;

        if (log.includes("(sessao_fim::WORK)")) {
            acc[chaveTarefa].tempoFocoSegundos += duracao;
            acc[chaveTarefa].sessoesFoco += 1;
        } else if (log.includes("(sessao_fim::BREAK)")) {
            acc[chaveTarefa].tempoPausasSegundos += duracao;
            acc[chaveTarefa].sessoesPausas += 1;
        }
        
        return acc;
    }, {});

    if (Object.keys(dadosPorTarefa).length === 0) { dv.paragraph("Nenhuma tarefa trabalhada hoje."); return; }

    const dadosProcessados = Object.values(dadosPorTarefa);
    
    dadosProcessados.sort((a, b) => {
        const valA = a[sortBy] ?? 0;
        const valB = b[sortBy] ?? 0;
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

    const headers = ["Tarefa", "Fase", "Tempo de Foco", "Tempo de Pausa", "Sessões de Foco", "Sessões de Pausa"];

    const tabelaArray = dadosProcessados.map(p => {
        return [
            p.tarefa, 
            p.fase, 
            formatarSegundos(p.tempoFocoSegundos),
            formatarSegundos(p.tempoPausasSegundos),
            p.sessoesFoco,
            p.sessoesPausas,
        ];
    });

    dv.table(headers, tabelaArray);
}
main();