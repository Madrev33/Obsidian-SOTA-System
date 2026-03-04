// 99 - BACKEND/Scripts/Views/DashboardRevisao/renderPeriodHighlights.js
// SOTA v1.1 - Destaques do Período (Fix Data/Timezone)
// Correção: Força o uso do nome do arquivo para datas, ignorando conversão de fuso do Frontmatter.

async function main() {
    try {
        // 1. CONTEXTO
        const dashboard = dv.current();
        let startDate = dashboard.start_date;
        let endDate = dashboard.end_date;

        if (!startDate || !endDate) {
            dv.paragraph("ℹ️ Selecione um período para ver os destaques.");
            return;
        }

        // Normalização de Datas
        if (startDate.toFormat) startDate = startDate.toFormat('yyyy-MM-dd');
        if (endDate.toFormat) endDate = endDate.toFormat('yyyy-MM-dd');

        // 2. COLETA DE DADOS
        const metricsPath = "99 - BACKEND/Logs_Metricas/Daily/Processed";
        const paginas = dv.pages(`"${metricsPath}"`)
            .where(p => {
                const dia = p.file.day;
                return dia && dia.toFormat('yyyy-MM-dd') >= startDate && dia.toFormat('yyyy-MM-dd') <= endDate;
            });

        if (!paginas || paginas.length === 0) {
            dv.paragraph("ℹ️ Sem dados processados no período selecionado.");
            return;
        }

        // 3. INICIALIZAÇÃO DOS RECORDES
        let recordeXP = { valor: -1, data: null };
        let recordeFoco = { valor: -1, data: null };
        let recordePausa = { valor: -1, data: null };
        let recordePaz = { valor: -Infinity, data: null };
        let valeEstresse = { valor: Infinity, data: null };

        // 4. PROCESSAMENTO LÓGICO
        for (let p of paginas) {
            // CORREÇÃO CRÍTICA: Pega a data ESTRITAMENTE do nome do arquivo (YYYY-MM-DD)
            // Ignora p.data do frontmatter para evitar shift de timezone do Dataview
            const data = p.file.name.substring(0, 10);
            
            // Usamos segundos para a comparação mais precisa
            const focoSeg = Number(p.total_foco_segundos) || 0;
            const pausaSeg = Number(p.total_pausa_segundos) || 0;
            const xpTotal = Number(p.xp_dia_total) || 0;
            const paz = Number(p.xp_paz_espirito) || 0;

            if (xpTotal > recordeXP.valor) {
                recordeXP = { valor: xpTotal, data: data };
            }
            if (focoSeg > recordeFoco.valor) {
                recordeFoco = { valor: focoSeg, data: data };
            }
            if (pausaSeg > recordePausa.valor) {
                recordePausa = { valor: pausaSeg, data: data };
            }
            if (paz > recordePaz.valor) {
                recordePaz = { valor: paz, data: data };
            }
            if (paz < valeEstresse.valor) {
                valeEstresse = { valor: paz, data: data };
            }
        }

        // 5. FORMATAÇÃO E RENDERIZAÇÃO
        const formatarData = (dataStr) => {
            if (!dataStr) return "-";
            // O moment interpreta "YYYY-MM-DD" como data local, preservando o dia correto
            const m = window.moment(dataStr, "YYYY-MM-DD");
            return m.isValid() ? m.format("DD/MM/YYYY") : "N/A";
        };
        
        const formatarSegundos = (s) => {
            if (isNaN(s) || s <= 0) return "00:00:00";
            const h = Math.floor(s / 3600).toString().padStart(2, '0');
            const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
            const sec = Math.round(s % 60).toString().padStart(2, '0');
            return `${h}:${m}:${sec}`;
        };

        const cardStyle = `
            flex: 1; 
            min-width: 140px; 
            background-color: var(--background-secondary); 
            border: 1px solid var(--background-modifier-border); 
            border-radius: 8px; 
            padding: 15px; 
            display: flex; 
            flex-direction: column; 
            gap: 5px; 
            text-align: center;
        `;
        const labelStyle = `font-size: 0.8em; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;`;
        const valueStyle = `font-size: 1.6em; font-weight: 800; line-height: 1.2;`;
        const subStyle = `font-size: 0.75em; color: var(--text-faint); margin-top: 4px;`;
        const iconStyle = `font-size: 1.3em; margin-bottom: 5px;`;

        let html = `<div style="display: flex; flex-wrap: wrap; gap: 10px; width: 100%; margin: 10px 0;">`;

        // Card: Dia de Ouro (XP)
        html += `
        <div style="${cardStyle}">
            <div style="${iconStyle}">🏆</div>
            <div style="${labelStyle}">Dia de Ouro</div>
            <div style="${valueStyle} color: var(--interactive-accent);">${recordeXP.valor} XP</div>
            <div style="${subStyle}">em ${formatarData(recordeXP.data)}</div>
        </div>`;

        // Card: Pico de Foco
        html += `
        <div style="${cardStyle}">
            <div style="${iconStyle}">🧠</div>
            <div style="${labelStyle}">Pico de Foco</div>
            <div style="${valueStyle} color: #3498db;">${formatarSegundos(recordeFoco.valor)}</div>
            <div style="${subStyle}">em ${formatarData(recordeFoco.data)}</div>
        </div>`;

        // Card: Pico de Paz
        html += `
        <div style="${cardStyle}">
            <div style="${iconStyle}">🧘</div>
            <div style="${labelStyle}">Pico de Paz</div>
            <div style="${valueStyle} color: #2ecc71;">${recordePaz.valor} pts</div>
            <div style="${subStyle}">em ${formatarData(recordePaz.data)}</div>
        </div>`;
        
        // Card: Vale de Estresse
        html += `
        <div style="${cardStyle}">
            <div style="${iconStyle}">🌪️</div>
            <div style="${labelStyle}">Vale de Estresse</div>
            <div style="${valueStyle} color: #e74c3c;">${valeEstresse.valor} pts</div>
            <div style="${subStyle}">em ${formatarData(valeEstresse.data)}</div>
        </div>`;

        // Card: Recuperação
        html += `
        <div style="${cardStyle}">
            <div style="${iconStyle}">🔋</div>
            <div style="${labelStyle}">Recuperação Máxima</div>
            <div style="${valueStyle} color: #f1c40f;">${formatarSegundos(recordePausa.valor)}</div>
            <div style="${subStyle}">em ${formatarData(recordePausa.data)}</div>
        </div>`;

        html += `</div>`;

        dv.paragraph(html);

    } catch (e) {
        dv.paragraph(`❌ Erro nos Destaques do Período: ${e.message}`);
        console.error(e);
    }
}

await main();