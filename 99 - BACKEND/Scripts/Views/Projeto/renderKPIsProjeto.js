// Componente SOTA: renderKPIsProjeto.js v1.0
// Calcula e exibe os KPIs agregados para o Dashboard Geral de um Projeto.

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

    let focoTotalSegundos = 0;
    let pausasTotalSegundos = 0;
    let totalSessoesFoco = 0;
    let totalSessoesPausa = 0;
    let diasComFoco = new Set();

    if (logFile) {
        const content = await app.vault.cachedRead(logFile);
        const todosOsLogs = content.split('\n').filter(line => line.trim() !== '' && line.includes("(sessao_fim::"));
        
        const logsFoco = todosOsLogs.filter(l => l.includes("(sessao_fim::WORK)"));
        const logsPausa = todosOsLogs.filter(l => l.includes("(sessao_fim::BREAK)"));

        const extrairSegundos = (log) => parseInt(log.match(/\(duracao_total_sessao_segundos::\s*(\d+)\)/)?.[1] || '0');
        
        focoTotalSegundos = logsFoco.reduce((sum, log) => sum + extrairSegundos(log), 0);
        pausasTotalSegundos = logsPausa.reduce((sum, log) => sum + extrairSegundos(log), 0);
        totalSessoesFoco = logsFoco.length;
        totalSessoesPausa = logsPausa.length;
        
        todosOsLogs.forEach(l => {
            const dateMatch = l.match(/\(log_date::\s*([^)]+)\)/);
            if (dateMatch) diasComFoco.add(dateMatch[1]);
        });
    }

    const totalTarefas = hub.file.tasks.length;
    const tarefasConcluidas = hub.file.tasks.where(t => t.completed).length;
    const progressoGeral = totalTarefas > 0 ? Math.round((tarefasConcluidas / totalTarefas) * 100) : 0;

    const formatarSegundosTotal = (s) => {
        if (isNaN(s) || s === 0) return "0s";
        const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), secs = Math.round(s % 60);
        return [h > 0 ? `${h}h` : '', m > 0 ? `${m}m` : '', (secs > 0 || (h === 0 && m === 0)) ? `${secs}s` : ''].filter(Boolean).join(' ');
    };
    
    const formatarSegundosRitmo = (s) => {
        if (isNaN(s) || s === 0) return "0s";
        const m = Math.floor(s / 60), secs = Math.round(s % 60);
        return [m > 0 ? `${m}m` : '', (secs > 0 || m === 0) ? `${secs}s` : ''].filter(Boolean).join(' ');
    };

    const mediaFocoPorDia = diasComFoco.size > 0 ? focoTotalSegundos / diasComFoco.size : 0;
    const diasComConclusao = new Set();
    hub.file.tasks.where(t => t.completed && t.completion).forEach(t => {
        diasComConclusao.add(t.completion.toFormat('yyyy-MM-dd'));
    });

    // União de dias de foco + dias de entrega
    const diasAtivosTotais = new Set([...diasComFoco, ...diasComConclusao]);
    const numDiasAtivos = diasAtivosTotais.size;

    const velocityMedia = numDiasAtivos > 0 ? (tarefasConcluidas / numDiasAtivos) : 0;
    const mediaFocoSegundos = totalSessoesFoco > 0 ? focoTotalSegundos / totalSessoesFoco : 0;
    const mediaPausaSegundos = totalSessoesPausa > 0 ? pausasTotalSegundos / totalSessoesPausa : 0;
    const minutosRecuperacaoPorHoraFoco = focoTotalSegundos > 0 ? Math.round((pausasTotalSegundos / focoTotalSegundos) * 60) : 0;

    const kpis = [
        `**Tempo Total de Foco:** ${formatarSegundosTotal(focoTotalSegundos)}`,
        `**Tempo Total em Pausas:** ${formatarSegundosTotal(pausasTotalSegundos)}`,
        `**Progresso Geral:** ${progressoGeral}% (${tarefasConcluidas} de ${totalTarefas} tarefas)`,
        `**Média de Foco por Dia:** ${formatarSegundosTotal(Math.round(mediaFocoPorDia))}`,
        `**Velocity Média:** ${velocityMedia.toFixed(1)} tarefas/dia`,
        `**Ritmo Médio de Sessão:** Foco: **${formatarSegundosRitmo(mediaFocoSegundos)}** / Pausa: **${formatarSegundosRitmo(mediaPausaSegundos)}**`,
        `**Proporção de Recuperação:** Para cada hora de foco, você se permitiu **${minutosRecuperacaoPorHoraFoco} minutos de descanso**.`
    ];

    dv.list(kpis);
}

main();