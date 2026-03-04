// 99 - BACKEND/Scripts/Views/Daily/renderChartEnergiaHumor.js
// SOTA v2.1 - Bio-Ritmo Contínuo (Zero-Fill)
// Garante eixo X completo para todo o período selecionado.

(() => {
    return async function renderChart(dv, input) {
        try {
            const dashboard = dv.current();
            let startDate = dashboard.start_date;
            let endDate = dashboard.end_date;
            const moment = window.moment;

            if (!startDate || !endDate) return `\`\`\`chartsview\ntype: Line\noptions:\n  title: { text: "Selecione um período" }\n\`\`\``;

            if (typeof startDate === 'string') startDate = startDate.substring(0, 10);
            if (typeof endDate === 'string') endDate = endDate.substring(0, 10);
            if (startDate.toFormat) startDate = startDate.toFormat('yyyy-MM-dd');
            if (endDate.toFormat) endDate = endDate.toFormat('yyyy-MM-dd');

            // 1. GERAR TODOS OS DIAS DO INTERVALO
            const diasNoPeriodo = [];
            let currDate = moment(startDate);
            const lastDate = moment(endDate);
            
            // Limitador de segurança (366 dias)
            let safetyCounter = 0;
            while (currDate.isSameOrBefore(lastDate, 'day') && safetyCounter < 366) {
                diasNoPeriodo.push(currDate.format("YYYY-MM-DD"));
                currDate.add(1, 'days');
                safetyCounter++;
            }

            const processedMetricsPath = "99 - BACKEND/Logs_Metricas/Daily/Processed"; 
            const chartData = [];
            let temDadosReais = false;

            for (const dia of diasNoPeriodo) {
                const metricsFile = dv.page(`${processedMetricsPath}/${dia}_metrics.md`);
                
                // Se não tem arquivo, valor é 0 (ou null para quebrar a linha, aqui usamos 0 para continuidade)
                let energia = metricsFile ? (metricsFile.energia_media_dia || 0) : 0;
                let humor = metricsFile ? ((metricsFile.humor_media_dia || 0) * 20) : 0;

                if (energia > 0 || humor > 0) temDadosReais = true;

                chartData.push({ dia: dia, valor: energia, tipo: "⚡ Energia" });
                chartData.push({ dia: dia, valor: humor, tipo: "🙂 Humor" });
            }

            if (!temDadosReais) return `\`\`\`chartsview\ntype: Line\noptions:\n  title: { text: "Sem dados de bio-ritmo neste período" }\n\`\`\``;

            const yamlString = `
\`\`\`chartsview
type: Line
data: ${JSON.stringify(chartData)}
options:
  xField: 'dia'
  yField: 'valor'
  seriesField: 'tipo'
  smooth: true
  lineStyle: { lineWidth: 3 }
  color: ['#e67e22', '#3498db']
  xAxis:
    title: { text: 'Data', style: { fill: '#cccccc' } }
    label: { autoRotate: true, autoHide: true }
  yAxis:
    min: 0
    max: 100
    title: { text: "Nível (%)", style: { fill: '#cccccc' } }
  legend: { position: 'top' }
  tooltip:
    formatter: |
      function(datum) {
        var val = Number(datum.valor) || 0;
        if (datum.tipo === '🙂 Humor') return { name: datum.tipo, value: (val / 20).toFixed(1) + '/5' };
        return { name: datum.tipo, value: val + '%' };
      }
  title: { visible: true, text: 'Bio-Ritmo: Energia & Humor' }
\`\`\`
`;
            return yamlString.trim();

        } catch (e) {
            return `\`\`\`chartsview\ntype: Line\noptions:\n  title: { text: "ERRO: ${e.message.replace(/"/g, "'")}" }\n\`\`\``;
        }
    }
})();