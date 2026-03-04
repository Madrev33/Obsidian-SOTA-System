// Componente SOTA: renderCronogramaProjeto.js v1.0
// Exibe o status e o cronograma completo de um projeto.

async function main() {
    const dashboard = input.dashboard;
    if (!dashboard) { dv.paragraph("❌ ERRO: Contexto do dashboard não fornecido."); return; }
    const hubUID = dashboard.hub_uid;
    if (!hubUID) { dv.paragraph("❌ ERRO: 'hub_uid' não encontrado."); return; }

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
 
    // --- FUNÇÕES UTILITÁRIAS ---
    const formatarDataHora = (dt) => dt && dt.isValid ? dt.toFormat("dd/MM/yyyy 'às' HH:mm") : "N/A";
 
    const formatarDuracao = (dtFim, dtInicio) => {
        if (!dtInicio || !dtFim || !dtInicio.isValid || !dtFim.isValid) return "N/A";
        const diff = dtFim.diff(dtInicio, ['days', 'hours', 'minutes']).toObject();
        return `${Math.floor(diff.days)}d ${Math.floor(diff.hours)}h ${Math.floor(diff.minutes)}m`;
    };
 
    const parseDateWithTime = (data, horaStr) => {
        if (!data) return null;
        let dt = dv.date(data);
        if (!dt || !dt.isValid) return null;
        if (horaStr) {
            const [hour, minute] = horaStr.split(':').map(Number);
            if (!isNaN(hour) && !isNaN(minute)) return dt.set({ hour, minute });
        }
        return dt;
    };

    // --- LÓGICA DE RENDERIZAÇÃO ---
    dv.span(`**Visão Geral do Projeto**`);
    
    const cronogramaItens = [];
    const statusFormatado = hub.status ? (hub.status.charAt(0).toUpperCase() + hub.status.slice(1)) : "N/D";
    cronogramaItens.push(`**Status:** ${statusFormatado}`);
    
    const criacaoDT = parseDateWithTime(hub.data_criacao_ideia, hub.hora_criacao_ideia);
    const inicioDT = parseDateWithTime(hub.data_inicio, hub.hora_inicio);
    const conclusaoDT = parseDateWithTime(hub.data_conclusao, hub.hora_conclusao);

    if (criacaoDT && inicioDT) {
        cronogramaItens.push(`**Tempo de Incubação:** ${formatarDuracao(inicioDT, criacaoDT)}`);
    } else if (criacaoDT && hub.status === 'planejamento') {
        cronogramaItens.push(`**Tempo em Incubação:** ${formatarDuracao(dv.date("now"), criacaoDT)}`);
    }
    
    cronogramaItens.push(`**Iniciado em:** ${formatarDataHora(inicioDT)}`);
    
    if (conclusaoDT) {
        cronogramaItens.push(`**Concluído em:** ${formatarDataHora(conclusaoDT)}`);
        cronogramaItens.push(`**Duração do Projeto:** ${formatarDuracao(conclusaoDT, inicioDT)}`);
    } else if (inicioDT) {
        cronogramaItens.push(`**Tempo Decorrido:** ${formatarDuracao(dv.date("now"), inicioDT)}`);
    }
    
    dv.list(cronogramaItens);
}
 
main();