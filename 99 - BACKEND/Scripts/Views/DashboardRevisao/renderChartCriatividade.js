// 99 - BACKEND/Scripts/Views/DashboardRevisao/renderChartCriatividade.js
// SOTA v2.0 - Criatividade Pós-Processada (Fonte Confiável)
// Lê dos arquivos de métricas processadas para garantir consistência com o restante do sistema.

(() => {
    return async function renderChart(dv, input) {
        try {
            // 1. CONTEXTO E VALIDAÇÃO
            const dashboard = dv.current();
            let startDate = dashboard.start_date;
            let endDate = dashboard.end_date;
            const viewMode = input.view_mode || 'column'; 
            const moment = window.moment;

            if (!startDate || !endDate) return `\`\`\`chartsview\ntype: Column\noptions:\n  title: { text: "Selecione um período" }\n\`\`\``;

            if (typeof startDate === 'string') startDate = startDate.substring(0, 10);
            if (typeof endDate === 'string') endDate = endDate.substring(0, 10);
            if (startDate.toFormat) startDate = startDate.toFormat('yyyy-MM-dd');
            if (endDate.toFormat) endDate = endDate.toFormat('yyyy-MM-dd');

            // 2. PREPARAÇÃO DO INTERVALO
            const diasNoPeriodo = [];
            let currDate = moment(startDate);
            const lastDate = moment(endDate);
            let diasCount = 0;
            while (currDate.isSameOrBefore(lastDate, 'day') && diasCount < 366) {
                diasNoPeriodo.push(currDate.format("YYYY-MM-DD"));
                currDate.add(1, 'days');
                diasCount++;
            }

            // 3. LEITURA DE DADOS (PROCESSED METRICS)
            const processedPath = "99 - BACKEND/Logs_Metricas/Daily/Processed";
            const chartData = [];
            let dadosEncontrados = false;

            for (const dia of diasNoPeriodo) {
                // Tenta ler o arquivo de métricas
                const metricsFile = dv.page(`${processedPath}/${dia}_metrics.md`);

                let insights = 0;
                let aprendizados = 0;
                let conquistas = 0;

                if (metricsFile) {
                    insights = metricsFile.qtd_insights || 0; // Soma de Ideias + Reflexões
                    aprendizados = metricsFile.qtd_erros || 0; // Erros/Aprendizados
                    conquistas = metricsFile.qtd_wins || 0; // Wins
                }
                
                // Adiciona os dados ao array do gráfico
                chartData.push({ dia: dia, valor: insights, categoria: "💡 Insights" });
                chartData.push({ dia: dia, valor: aprendizados, categoria: "🛑 Aprendizados" });
                chartData.push({ dia: dia, valor: conquistas, categoria: "✨ Conquistas" });

                if (insights > 0 || aprendizados > 0 || conquistas > 0) {
                    dadosEncontrados = true;
                }
            }

            if (!dadosEncontrados) {
                const dummyData = [{ dia: "Sem Dados", valor: 0, categoria: "N/A" }];
                return `\`\`\`chartsview\ntype: Column\ndata: ${JSON.stringify(dummyData)}\noptions:\n  title: { text: "Nenhuma atividade criativa registrada no período", visible: true }\n\`\`\``;
            }

            // 4. CONFIGURAÇÃO VISUAL
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
    shape: 'circle'
    size: 3
  line:
    style:
      lineWidth: 2
`;
            }

            // Cores: Amarelo (Insights), Vermelho (Erros), Verde (Wins)
            const cores = ['#f1c40f', '#e74c3c', '#2ecc71'];

            const yamlString = `
\`\`\`chartsview
type: ${chartType}
data: ${JSON.stringify(chartData)}
options:
  xField: 'dia'
  yField: 'valor'
  seriesField: 'categoria'
  color: ${JSON.stringify(cores)}
  ${specificOptions}
  xAxis:
    label:
      autoRotate: true
      autoHide: true
    title:
      text: 'Data'
      style: { fill: '#cccccc' }
  yAxis:
    title: { text: 'Quantidade', style: { fill: '#cccccc' } }
    min: 0
    tickInterval: 1
    grid:
      line:
        style:
          stroke: 'rgba(255, 255, 255, 0.1)'
          lineDash: [4, 4]
  legend: { position: 'top' }
  tooltip:
    formatter: |
      function(datum) {
        return { name: datum.categoria, value: datum.valor + ' ocorrência(s)' };
      }
  title: { visible: true, text: 'Volume de Insights & Criatividade' }
\`\`\`
`;
            return yamlString.trim();

        } catch (e) {
            return `\`\`\`chartsview\ntype: Column\noptions:\n  title: { text: "ERRO CRÍTICO: ${e.message.replace(/"/g, "'")}" }\n\`\`\``;
        }
    }
})();