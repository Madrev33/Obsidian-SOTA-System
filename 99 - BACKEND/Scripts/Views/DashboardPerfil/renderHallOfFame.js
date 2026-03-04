// 99 - BACKEND/Scripts/Views/DashboardPerfil/renderHallOfFame.js
// SOTA v1.2 - Hall of Fame (Correct Date Scoping)
// Garante que cada recorde armazene sua data de forma independente para evitar sobreposição.

async function main() {
    try {
        const metricsPath = "99 - BACKEND/Logs_Metricas/Daily/Processed";
        
        const paginas = dv.pages(`"${metricsPath}"`)
            .where(p => p.file.name.endsWith("_metrics"));

        if (!paginas || paginas.length === 0) {
            dv.paragraph("ℹ️ Sem histórico suficiente para gerar Hall of Fame.");
            return;
        }

        // --- 2. PROCESSAMENTO (BUSCA DE RECORDES) ---
        let recordeFoco = { valor: 0, data: null };
        let recordeXP = { valor: 0, data: null };
        let recordePaz = { valor: -Infinity, data: null };
        let recordeInsights = { valor: 0, data: null };

        const diasSemana = {};
        for(let i=1; i<=7; i++) diasSemana[i] = { somaXP: 0, count: 0, nome: "" };
        const nomesDias = ["", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

        for (let p of paginas) {
            // A data específica DESTE arquivo/loop
            const dataDoDia = p.data || p.file.name.substring(0, 10);
            
            const focoHoras = Number(p.total_foco_horas) || 0;
            const xpTotal = Number(p.xp_dia_total) || 0;
            const paz = Number(p.xp_paz_espirito) || 0;
            const insights = Number(p.qtd_insights) || 0;

            // --- CORREÇÃO: CRIAÇÃO DE OBJETOS NOVOS E INDEPENDENTES ---
            if (focoHoras > recordeFoco.valor) {
                recordeFoco = { valor: focoHoras, data: dataDoDia };
            }

            if (xpTotal > recordeXP.valor) {
                recordeXP = { valor: xpTotal, data: dataDoDia };
            }

            if (paz > recordePaz.valor) {
                recordePaz = { valor: paz, data: dataDoDia };
            }

            if (insights > recordeInsights.valor) {
                recordeInsights = { valor: insights, data: dataDoDia };
            }
            // --- FIM DA CORREÇÃO ---

            // Agregação Dia da Semana
            if (p.file.day) {
                const diaSemana = p.file.day.weekday;
                if (diasSemana[diaSemana]) {
                    diasSemana[diaSemana].somaXP += xpTotal;
                    diasSemana[diaSemana].count++;
                    diasSemana[diaSemana].nome = nomesDias[diaSemana];
                }
            }
        }

        // 3. CÁLCULO DE MELHOR DIA DA SEMANA
        let melhorDiaSemana = { nome: "N/A", media: 0 };
        for(let i=1; i<=7; i++) {
            const d = diasSemana[i];
            if (d.count > 0) {
                const media = Math.round(d.somaXP / d.count);
                if (media > melhorDiaSemana.media) {
                    melhorDiaSemana = { nome: d.nome, media: media };
                }
            }
        }

        // 4. FORMATAÇÃO VISUAL (CORRIGIDA)
        const formatarData = (dataObj) => {
            if (!dataObj) return "-";
            // Se for string, usa direto. Se for objeto Luxon (do dataview), converte para string.
            const dataStr = typeof dataObj === 'string' ? dataObj : dataObj.toFormat("yyyy-MM-dd");
            const m = window.moment(dataStr, "YYYY-MM-DD");
            return m.isValid() ? m.format("DD/MM/YYYY") : "Data Inválida";
        };

        const formatarHorasPreciso = (horasDecimais) => {
            if (isNaN(horasDecimais) || horasDecimais <= 0) return "00:00:00";
            const totalSegundos = Math.round(horasDecimais * 3600);
            const h = Math.floor(totalSegundos / 3600).toString().padStart(2, '0');
            const m = Math.floor((totalSegundos % 3600) / 60).toString().padStart(2, '0');
            const s = (totalSegundos % 60).toString().padStart(2, '0');
            return `${h}:${m}:${s}`;
        };

        // 5. RENDERIZAÇÃO
        const cardStyle = `
            flex: 1; min-width: 140px; background-color: var(--background-secondary); 
            border: 1px solid var(--background-modifier-border); border-radius: 8px; 
            padding: 15px; display: flex; flex-direction: column; 
            gap: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center;
        `;

        const labelStyle = `font-size: 0.85em; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;`;
        const valueStyle = `font-size: 1.8em; font-weight: 800; color: var(--text-normal); line-height: 1.2;`;
        const subStyle = `font-size: 0.75em; color: var(--text-faint); margin-top: 4px;`;
        const iconStyle = `font-size: 1.5em; margin-bottom: 5px;`;

        let html = `<div style="display: flex; flex-wrap: wrap; gap: 10px; width: 100%;">`;

        html += `
        <div style="${cardStyle}">
            <div style="${iconStyle}">⚡</div>
            <div style="${labelStyle}">Tempo de Foco</div>
            <div style="${valueStyle}; color: #3498db;">${formatarHorasPreciso(recordeFoco.valor)}</div>
            <div style="${subStyle}">em ${formatarData(recordeFoco.data)}</div>
        </div>`;

        html += `
        <div style="${cardStyle}">
            <div style="${iconStyle}">🏆</div>
            <div style="${labelStyle}">Mais XP</div>
            <div style="${valueStyle}; color: var(--interactive-accent);">${recordeXP.valor} XP</div>
            <div style="${subStyle}">em ${formatarData(recordeXP.data)}</div>
        </div>`;

        html += `
        <div style="${cardStyle}">
            <div style="${iconStyle}">🧘</div>
            <div style="${labelStyle}">Dia Zen</div>
            <div style="${valueStyle}; color: #2ecc71;">${recordePaz.valor} pts</div>
            <div style="${subStyle}">em ${formatarData(recordePaz.data)}</div>
        </div>`;

        html += `
        <div style="${cardStyle}">
            <div style="${iconStyle}">📅</div>
            <div style="${labelStyle}">Prime Date</div>
            <div style="${valueStyle}">${melhorDiaSemana.nome}</div>
            <div style="${subStyle}">Média: ${melhorDiaSemana.media} XP</div>
        </div>`;

        if (recordeInsights.valor > 0) {
            html += `
            <div style="${cardStyle}">
                <div style="${iconStyle}">💡</div>
                <div style="${labelStyle}">Insights</div>
                <div style="${valueStyle}">${recordeInsights.valor}</div>
                <div style="${subStyle}">em ${formatarData(recordeInsights.data)}</div>
            </div>`;
        }

        html += `</div>`;

        dv.paragraph(html);

    } catch (e) {
        dv.paragraph(`❌ Erro no Hall of Fame: ${e.message}`);
        console.error(e);
    }
}

await main();