// 99 - BACKEND/Scripts/Views/Daily/renderChartComparacao.js
// SOTA v1.0 - Gráfico Comparativo Ontem vs Hoje (Pós-Processamento)

(() => {
    return async function renderChart(dv, input) {
        try {
            const page = dv.current();
            const hojeData = page.file.name; // YYYY-MM-DD
            const ontemData = moment(hojeData).subtract(1, 'days').format("YYYY-MM-DD");
            
            const metricsPath = "99 - BACKEND/Logs_Metricas/Daily/Processed";
            const fileHoje = app.vault.getAbstractFileByPath(`${metricsPath}/${hojeData}_metrics.md`);
            const fileOntem = app.vault.getAbstractFileByPath(`${metricsPath}/${ontemData}_metrics.md`);

            // TRAVA DE SEGURANÇA: Só renderiza se HOJE estiver processado
            if (!fileHoje) {
                return `\`\`\`chartsview\ntype: Column\noptions:\n  title: { text: "⏳ Aguardando processamento do dia...", visible: true }\n  xAxis: { visible: false }\n  yAxis: { visible: false }\n\`\`\``;
            }

            // Leitura dos dados
            const dadosHoje = dv.page(fileHoje.path);
            const dadosOntem = fileOntem ? dv.page(fileOntem.path) : null;

            // Helper para evitar nulos
            const getVal = (obj, key) => obj && obj[key] ? obj[key] : 0;

            const chartData = [
                // Vitalidade
                { pilar: "Vitalidade", dia: "Ontem", valor: getVal(dadosOntem, 'xp_saude') },
                { pilar: "Vitalidade", dia: "Hoje", valor: getVal(dadosHoje, 'xp_saude') },
                // Intelecto
                { pilar: "Intelecto", dia: "Ontem", valor: getVal(dadosOntem, 'xp_genio') },
                { pilar: "Intelecto", dia: "Hoje", valor: getVal(dadosHoje, 'xp_genio') },
                // Espírito
                { pilar: "Espírito", dia: "Ontem", valor: getVal(dadosOntem, 'xp_paz_espirito') },
                { pilar: "Espírito", dia: "Hoje", valor: getVal(dadosHoje, 'xp_paz_espirito') },
                // Total (Opcional, pode distorcer a escala se for muito maior, mas útil para visão geral)
                // Vamos manter pilares para comparação qualitativa
            ];

            const viewMode = input.view_mode || 'column';
            const chartType = viewMode === 'line' ? 'Line' : 'Column';
            
            let specificOptions = "";
            if (viewMode === 'column') {
                specificOptions = `
  isGroup: true
  columnStyle:
    radius: [4, 4, 0, 0]
`;
            } else {
                specificOptions = `
  smooth: true
  point:
    size: 4
    shape: circle
`;
            }

            const yamlString = `
\`\`\`chartsview
type: ${chartType}
data: ${JSON.stringify(chartData)}
options:
  xField: 'pilar'
  yField: 'valor'
  seriesField: 'dia'
  ${specificOptions}
  color: ['#bdc3c7', '#3498db'] 
  xAxis:
    title: { text: 'Pilares', style: { fill: '#cccccc' } }
  yAxis:
    title: { text: 'XP', style: { fill: '#cccccc' } }
  legend: { position: 'top' }
  tooltip:
    formatter: |
      function(datum) {
        return { name: datum.dia, value: datum.valor + ' XP' };
      }
  title: { visible: true, text: 'Evolução de XP (Ontem vs Hoje)' }
\`\`\`
`;
            return yamlString.trim();

        } catch (e) {
            return `\`\`\`chartsview\ntype: Column\noptions:\n  title: { text: "ERRO: ${e.message.replace(/"/g, "'")}" }\n\`\`\``;
        }
    }
})();