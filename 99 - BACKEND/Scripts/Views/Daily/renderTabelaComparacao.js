// 99 - BACKEND/Scripts/Views/Daily/renderTabelaComparacao.js
// SOTA v2.0 - Tabela Comparativa Precisa (HH:MM:SS)
// Lógica corrigida para ler 'total_foco_segundos' e 'total_pausa_segundos'.

async function main() {
    const page = dv.current();
    const hojeData = page.file.name;
    const ontemData = moment(hojeData).subtract(1, 'days').format("YYYY-MM-DD");
    
    const metricsPath = "99 - BACKEND/Logs_Metricas/Daily/Processed";
    const fileHoje = app.vault.getAbstractFileByPath(`${metricsPath}/${hojeData}_metrics.md`);
    
    // Trava de segurança se o dia de hoje ainda não foi processado
    if (!fileHoje) {
        const container = dv.container;
        const card = document.createElement("div");
        card.style.cssText = "text-align: center; color: var(--text-muted); padding: 20px; border: 1px dashed var(--background-modifier-border); border-radius: 8px;";
        card.innerHTML = `⏳ <strong>Análise Pendente</strong><br><small>Processe o dia para gerar o comparativo.</small>`;
        container.appendChild(card);
        return;
    }

    const fileOntem = app.vault.getAbstractFileByPath(`${metricsPath}/${ontemData}_metrics.md`);
    const dadosHoje = dv.page(fileHoje.path);
    const dadosOntem = fileOntem ? dv.page(fileOntem.path) : null;

    // Helper para extrair valor numérico seguro
    const getVal = (obj, key) => (obj && obj[key] !== undefined ? Number(obj[key]) : 0);

    // Função Delta (mantida, já está correta)
    const calcDelta = (valOntem, valHoje, unidade = "") => {
        if (!dadosOntem) return "🆕";
        const diff = valHoje - valOntem;
        const percent = valOntem > 0 ? Math.round((diff / valOntem) * 100) : (valHoje > 0 ? 100 : 0);
        let icon = "➖"; let color = "var(--text-muted)";
        if (diff > 0) { icon = "📈"; color = "var(--color-green)"; }
        if (diff < 0) { icon = "📉"; color = "var(--color-red)"; }
        const sinal = diff > 0 ? "+" : "";
        return `<span style="color:${color}">${icon} ${sinal}${percent}%</span> <small>(${sinal}${Math.round(diff)}${unidade})</small>`;
    };

    // --- NOVA FUNÇÃO DE FORMATAÇÃO DE TEMPO ---
    // Converte segundos para o formato HH:MM:SS
    const formatTimeFromSeconds = (totalSeconds) => {
        if (!totalSeconds || totalSeconds === 0) return "00:00:00";
        const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    // --- DADOS BRUTOS (LENDO AS CHAVES CORRETAS) ---
    const xpOntem = getVal(dadosOntem, 'xp_dia_total');
    const xpHoje = getVal(dadosHoje, 'xp_dia_total');
    
    // CORREÇÃO: Lendo 'total_foco_segundos' em vez de 'minutos_foco_total'
    const focoOntemSeg = getVal(dadosOntem, 'total_foco_segundos');
    const focoHojeSeg = getVal(dadosHoje, 'total_foco_segundos');

    // ADIÇÃO: Lendo 'total_pausa_segundos'
    const pausaOntemSeg = getVal(dadosOntem, 'total_pausa_segundos');
    const pausaHojeSeg = getVal(dadosHoje, 'total_pausa_segundos');

    const habitosOntem = getVal(dadosOntem, 'habitos_completos');
    const habitosHoje = getVal(dadosHoje, 'habitos_completos');

    const sonoOntem = getVal(dadosOntem, 'qualidade_sono_calculada');
    const sonoHoje = getVal(dadosHoje, 'qualidade_sono_calculada');

    // Montagem da Tabela
    const tableData = [
        ["⭐ **XP Total**", xpOntem, xpHoje, calcDelta(xpOntem, xpHoje)],
        ["🍅 **Foco**", formatTimeFromSeconds(focoOntemSeg), formatTimeFromSeconds(focoHojeSeg), calcDelta(focoOntemSeg, focoHojeSeg, "s")],
        ["☕ **Pausa**", formatTimeFromSeconds(pausaOntemSeg), formatTimeFromSeconds(pausaHojeSeg), calcDelta(pausaOntemSeg, pausaHojeSeg, "s")],
        ["✅ **Hábitos**", habitosOntem, habitosHoje, calcDelta(habitosOntem, habitosHoje)],
        ["💤 **Sono**", sonoOntem + "%", sonoHoje + "%", calcDelta(sonoOntem, sonoHoje, "%")]
    ];

    dv.table(["KPI", "Ontem", "Hoje", "Variação"], tableData);
}

await main();