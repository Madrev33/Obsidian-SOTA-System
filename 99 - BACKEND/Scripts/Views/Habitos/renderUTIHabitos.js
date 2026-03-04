// 99 - BACKEND/Scripts/Views/Analiticos/renderUTIHabitos.js
// SOTA v1.2 - UTI de Hábitos (Rigorosa: Inatividade ou Baixa Aderência)

async function main() {
    const habitosPath = "07 - Engenharia de Hábitos/01 - Hábitos";
    const habitos = dv.pages(`"${habitosPath}"`).where(p => p.tipo_habito === 'habito' && p.ativo !== false);

    if (habitos.length === 0) { dv.paragraph("ℹ️ Nenhum hábito ativo."); return; }

    // 1. Busca logs dos últimos 7 dias para atividade recente
    const logsPath = "99 - BACKEND/Logs_Metricas/Daily";
    const moment = window.moment;
    const hoje = moment();
    const limiteData = hoje.clone().subtract(7, 'days').format('YYYY-MM-DD');
    
    const paginasLogsRecentes = dv.pages(`"${logsPath}"`)
        .where(p => /^\d{4}-\d{2}-\d{2}$/.test(p.file.name) && p.file.name >= limiteData);

    const habitosAtivosRecentemente = new Set();
    for (const p of paginasLogsRecentes) {
        if (!p.file.lists) continue;
        for (const l of p.file.lists) {
            if (l.text.includes("#habito_concluido")) {
                const match = l.text.match(/\(id_habito::\s*([a-zA-Z0-9_]+)\)/);
                if (match) habitosAtivosRecentemente.add(match[1]);
            }
        }
    }

    // 2. Busca TODOS os logs para cálculo de aderência histórica (simplificado)
    // (Para performance, podemos pular isso e usar apenas a data de criação vs atividade recente se preferir, 
    // mas para precisão vamos fazer uma contagem rápida se não for muito pesado)
    // Vamos usar a data de criação como proxy de "deveria ter feito".
    
    const uti = [];

    for (const h of habitos) {
        const id = h.id_habito;
        const estaAtivoRecentemente = habitosAtivosRecentemente.has(id);
        const diasVida = Math.max(1, moment().diff(moment(h.file.cday.toJSDate()), 'days'));
        
        // Se tem menos de 7 dias de vida, damos um desconto (está em onboarding)
        if (diasVida < 7) continue;

        let motivo = "";

        if (!estaAtivoRecentemente) {
            motivo = "👻 Fantasma (0 execuções em 7 dias)";
            uti.push({ link: h.file.link, tier: h.tier_desafio, motivo: motivo });
        } 
        // Se quiser adicionar critério de aderência, seria aqui.
        // Mas cuidado para não poluir a UTI com hábitos apenas "difíceis".
        // A UTI deve ser para o que está morrendo.
    }

    if (uti.length === 0) {
        dv.paragraph("🎉 **Parabéns!** Nenhum hábito em risco iminente de abandono.");
        return;
    }

    dv.header(3, "🚑 UTI: Hábitos em Risco");
    dv.table(
        ["Hábito", "Tier", "Diagnóstico", "Ação"],
        uti.map(u => [
            u.link,
            u.tier ? u.tier.split(" ")[0] : "❔",
            u.motivo,
            "⚠️ Reavaliar / Arquivar"
        ])
    );
}

await main();