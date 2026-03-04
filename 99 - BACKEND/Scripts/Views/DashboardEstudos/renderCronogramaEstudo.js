// Componente SOTA: renderCronogramaEstudo.js v2.0 (Adaptado para Dashboard Central)
async function main() {
    // Tenta obter UID do input direto (Dashboard Central) ou do objeto dashboard (Legado)
    const hubUID = input.hub_uid || (input.dashboard ? input.dashboard.hub_uid : null);
    
    if (!hubUID) { dv.paragraph("❌ ERRO: 'hub_uid' não fornecido para o cronograma."); return; }
 
    const hub = dv.pages().where(p => p.sota_uid === hubUID)[0];
    if (!hub) { dv.paragraph(`❌ ERRO: HUB do Estudo não encontrado.`); return; }
 
    const formatarDataHora = (dt) => dt && dt.isValid ? dt.toFormat("dd/MM/yyyy") : "N/A"; // Removi horas para limpar visual
 
    const formatarDuracao = (dtFim, dtInicio) => {
        if (!dtInicio || !dtFim || !dtInicio.isValid || !dtFim.isValid) return "N/A";
        const diff = dtFim.diff(dtInicio, ['days', 'months']).toObject();
        return `${Math.floor(diff.months || 0)} meses, ${Math.floor(diff.days || 0)} dias`;
    };
 
    const parseDate = (data) => data ? dv.date(data) : null;

    const cronogramaItens = [];
    const statusFormatado = hub.status ? (hub.status.charAt(0).toUpperCase() + hub.status.slice(1)) : "N/D";
    
    // Decoração de Status
    let iconeStatus = "⚪";
    if (hub.status === 'ativo') iconeStatus = "🟢";
    if (hub.status === 'concluido') iconeStatus = "🏁";
    if (hub.status === 'backlog') iconeStatus = "zzz";

    const inicioDT = parseDate(hub.data_criacao_estudo);
    cronogramaItens.push(`**Criado em:** ${formatarDataHora(inicioDT)}`);

    const conclusaoDT = parseDate(hub.data_conclusao_estudo);
    
    if (conclusaoDT && conclusaoDT.isValid) {
        cronogramaItens.push(`**Concluído em:** ${formatarDataHora(conclusaoDT)}`);
        cronogramaItens.push(`**Duração Total:** ${formatarDuracao(conclusaoDT, inicioDT)}`);
    } else if (inicioDT && inicioDT.isValid) {
        cronogramaItens.push(`**Tempo Decorrido:** ${formatarDuracao(dv.date("now"), inicioDT)}`);
    }
    
    dv.list(cronogramaItens);
}
main();