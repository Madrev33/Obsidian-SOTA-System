// 99 - BACKEND/Scripts/Views/Habitos/renderHabitHeatmap.js
// SOTA v3.0 - Heatmap Otimizado (Leitura Direta de Log Contextual)

async function main() {
    if (!dv) return;
    
    const habitoPage = dv.current();
    const idHabito = habitoPage.id_habito;

    if (!idHabito) {
        dv.paragraph("⚠️ ID do Hábito não encontrado no frontmatter.");
        return;
    }

    // --- NOVA FONTE DE DADOS ---
    const logPath = `99 - BACKEND/Logs_Metricas/Habitos/${idHabito}/raw_logs.md`;
    const logFile = app.vault.getAbstractFileByPath(logPath);

    if (!logFile) {
        dv.paragraph("<small>Sem histórico registrado (Arquivo de log não existe).</small>");
        return;
    }

    // Leitura otimizada do arquivo único
    const content = await app.vault.cachedRead(logFile);
    const lines = content.split('\n');
    
    const dadosMap = new Map(); // Map para agregação rápida por data
    let maxDateFound = null;
    let totalExecucoes = 0;

    // --- PARSING OTIMIZADO ---
    lines.forEach(line => {
        // Verifica se é um log válido de hábito (conclusão ou registro)
        if (!line.includes("#habito_concluido") && !line.includes("#habito_registro")) return;

        // Extrai a data usando regex leve
        const dateMatch = line.match(/\(log_date::\s*(\d{4}-\d{2}-\d{2})\)/);
        if (!dateMatch) return;

        const dataStr = dateMatch[1];
        
        // Extrai valor (se for contador) ou assume 1
        let valor = 1;
        const valMatch = line.match(/\(valor::\s*(\d+)\)/);
        if (valMatch) valor = parseInt(valMatch[1]);

        const currentVal = dadosMap.get(dataStr) || 0;
        dadosMap.set(dataStr, currentVal + valor);
        
        if (!maxDateFound || dataStr > maxDateFound) maxDateFound = dataStr;
        totalExecucoes++;
    });

    if (totalExecucoes === 0) {
        dv.paragraph(`ℹ️ Nenhuma execução registrada para **${habitoPage.file.name}**.`);
        return;
    }

    // Transformação para formato do gráfico
    const dadosPorDia = Array.from(dadosMap.entries()).map(([date, val]) => ({
        date: date,
        value: val,
        summary: `${val}x`
    }));

    const moment = window.moment;
    // Usa a data do último log para definir o ano de visualização, garantindo que hábitos antigos apareçam
    const referenciaData = maxDateFound ? moment(maxDateFound) : moment();
    const fromDate = referenciaData.clone().startOf('year');
    const toDate = referenciaData.clone().endOf('year');

    const config = {
        title: `Histórico: ${habitoPage.file.name}`,
        graphType: 'calendar',
        fromDate: fromDate.format('YYYY-MM-DD'),
        toDate: toDate.format('YYYY-MM-DD'),
        data: dadosPorDia,
        startOfWeek: 1,
        cellStyleRules: [
            { min: 1, max: 999, color: "#2ecc71", text: "✓" }
        ],
        onCellHover: (cellData) => {
            return `${cellData.date}: ${cellData.summary}`;
        }
    };

    const graphContainer = dv.el("div", "", { cls: "sota-contribution-graph-container" });

    if (window.renderContributionGraph) {
        try {
            window.renderContributionGraph(graphContainer, config);
        } catch (e) {
            dv.paragraph(`❌ Erro de Renderização: ${e.message}`);
        }
    }
}

await main();