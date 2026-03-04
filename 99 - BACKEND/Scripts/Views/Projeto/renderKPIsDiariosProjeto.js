// Componente SOTA: renderKPIsDiariosProjeto.js v1.0
// Calcula e exibe os KPIs do dia atual para o Dashboard Diário de um Projeto.

async function main() {
    const dashboard = input.dashboard;
    if (!dashboard) { dv.paragraph("❌ ERRO: Contexto do dashboard não fornecido."); return; }
    const hubUID = dashboard.hub_uid;
    if (!hubUID) { dv.paragraph("❌ ERRO: 'hub_uid' não encontrado."); return; }
    
    const hub = dv.pages().where(p => p.sota_uid === hubUID)[0];
    if (!hub) { dv.paragraph(`❌ ERRO: HUB do projeto com UID ${hubUID} não encontrado.`); return; }

    const idProjeto = hub.id_projeto;
    const logBrutoPath = `99 - BACKEND/Logs_Metricas/Projetos/${idProjeto}/raw_logs.md`;
    const logFile = app.vault.getAbstractFileByPath(logBrutoPath);

    const hojeStr = moment().format("YYYY-MM-DD");
    let focoTotalSegundos = 0;
    let pausasTotalSegundos = 0;
    let fasesTrabalhadas = new Set();

    if (logFile) {
        const content = await app.vault.cachedRead(logFile);
        const logsDeHoje = content.split('\n').filter(line => line.includes(`(log_date::${hojeStr})`));

        const logsFoco = logsDeHoje.filter(l => l.includes("(sessao_fim::WORK)"));
        const logsPausa = logsDeHoje.filter(l => l.includes("(sessao_fim::BREAK)"));

        const extrairSegundos = (log) => parseInt(log.match(/\(duracao_total_sessao_segundos::\s*(\d+)\)/)?.[1] || '0');
        
        focoTotalSegundos = logsFoco.reduce((sum, log) => sum + extrairSegundos(log), 0);
        pausasTotalSegundos = logsPausa.reduce((sum, log) => sum + extrairSegundos(log), 0);

        logsDeHoje.forEach(log => {
            const tagMatch = log.match(/#projeto\/[^\/]+\/([^\/]+)/);
            if (tagMatch) {
                const faseFormatada = tagMatch[1].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                fasesTrabalhadas.add(faseFormatada);
            }
        });
    }

    const tarefasConcluidasHoje = hub.file.tasks
        .where(t => t.completed && t.completion && t.completion.toFormat('yyyy-MM-dd') === hojeStr)
        .length;

    const formatarSegundosTotal = (s) => {
        if (isNaN(s) || s === 0) return "0s";
        const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), secs = Math.round(s % 60);
        return [h > 0 ? `${h}h` : '', m > 0 ? `${m}m` : '', (secs > 0 || (h === 0 && m === 0)) ? `${secs}s` : ''].filter(Boolean).join(' ');
    };
    
    const minutosRecuperacaoPorHoraFoco = focoTotalSegundos > 0 ? Math.round((pausasTotalSegundos / focoTotalSegundos) * 60) : 0;

    const kpis = [
        `**Tempo de Foco (Hoje):** ${formatarSegundosTotal(focoTotalSegundos)}`,
        `**Tempo em Pausas (Hoje):** ${formatarSegundosTotal(pausasTotalSegundos)}`,
        `**Tarefas Concluídas (Hoje):** ${tarefasConcluidasHoje}`,
        `**Fases Trabalhadas (Hoje):** ${fasesTrabalhadas.size > 0 ? Array.from(fasesTrabalhadas).join(', ') : "Nenhuma"}`,
        `**Proporção de Recuperação (Hoje):** Para cada hora de foco, você se permitiu **${minutosRecuperacaoPorHoraFoco} minutos de descanso**.`
    ];

    if (focoTotalSegundos === 0 && tarefasConcluidasHoje === 0) {
        dv.paragraph("Nenhuma atividade registrada para este projeto hoje.");
    } else {
        dv.list(kpis);
    }
}

main();