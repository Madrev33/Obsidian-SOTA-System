// 99 - BACKEND/Scripts/Views/DashboardRevisao/renderChartTendenciaFoco.js
// SOTA v2.2 - Tendência de Foco e Pausa (HH:MM:SS Precision)

(() => {
    return async function renderChart(dv, input) {
        try {
            const dashboard = dv.current();
            let startDate = dashboard.start_date;
            let endDate = dashboard.end_date;
            const viewMode = input.view_mode || 'area'; 
            const moment = window.moment;

            if (!startDate || !endDate) return `\`\`\`chartsview\ntype: Area\noptions:\n  title: { text: "Selecione um período" }\n\`\`\``;

            if (typeof startDate === 'string') startDate = startDate.substring(0, 10);
            if (typeof endDate === 'string') endDate = endDate.substring(0, 10);
            if (startDate.toFormat) startDate = startDate.toFormat('yyyy-MM-dd');
            if (endDate.toFormat) endDate = endDate.toFormat('yyyy-MM-dd');

            const diasNoPeriodo = [];
            let currDate = moment(startDate);
            const lastDate = moment(endDate);
            while (currDate.isSameOrBefore(lastDate, 'day')) {
                diasNoPeriodo.push(currDate.format("YYYY-MM-DD"));
                currDate.add(1, 'days');
            }

            const logsPath = "99 - BACKEND/Logs_Metricas/Daily";
            const dadosPorDia = {};
            diasNoPeriodo.forEach(d => dadosPorDia[d] = { foco: 0, pausa: 0 });

            for (const dia of diasNoPeriodo) {
                const arquivoLog = app.vault.getAbstractFileByPath(`${logsPath}/${dia}.md`);
                if (arquivoLog) {
                    const content = await app.vault.cachedRead(arquivoLog);
                    const lines = content.split('\n');
                    
                    for (const line of lines) {
                        const duracaoMatch = line.match(/\(duracao_total_sessao_segundos::\s*(\d+)\)/);
                        if (duracaoMatch) {
                            // MUDANÇA: Acumula segundos, não minutos
                            const segundos = parseInt(duracaoMatch[1]);
                            
                            if (line.includes("sessao_fim::WORK")) {
                                dadosPorDia[dia].foco += segundos;
                            } else if (line.includes("sessao_fim::BREAK")) {
                                dadosPorDia[dia].pausa += segundos;
                            }
                        }
                    }
                }
            }

            const chartData = [];
            diasNoPeriodo.forEach(dia => {
                // MUDANÇA: Prepara dados com segundos e valor em horas decimais para o eixo
                const focoSegundos = dadosPorDia[dia].foco;
                const pausaSegundos = dadosPorDia[dia].pausa;
                
                chartData.push({ dia: dia, valor: focoSegundos / 3600, segundos: focoSegundos, tipo: "Foco" });
                chartData.push({ dia: dia, valor: pausaSegundos / 3600, segundos: pausaSegundos, tipo: "Pausa" });
            });

            const chartType = viewMode === 'column' ? 'Column' : 'Area';
            let specificOptions = "";

            if (viewMode === 'column') {
                specificOptions = `
  isGroup: true
  columnStyle: { radius: [4, 4, 0, 0] }`;
            } else {
                specificOptions = `
  smooth: true
  area: { style: { fillOpacity: 0.4 } }
  line: { style: { lineWidth: 2 } }
  point: { size: 3, shape: 'circle' }`;
            }

            const yamlString = `
\`\`\`chartsview
type: ${chartType}
data: ${JSON.stringify(chartData)}
options:
  xField: 'dia'
  yField: 'valor'
  seriesField: 'tipo'
  ${specificOptions}
  xAxis:
    label: { autoRotate: true, autoHide: true }
  yAxis:
    title: { text: 'Horas' }
  color: ['#79c0ff', '#e99b00']
  legend: { position: 'top' }
  tooltip:
    fields: ['tipo', 'segundos']
    formatter: |
      function(datum) {
        var secs = Number(datum.segundos || 0);
        var h = Math.floor(secs / 3600).toString().padStart(2, '0');
        var m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
        var s = (secs % 60).toString().padStart(2, '0');
        return { name: datum.tipo, value: h + ':' + m + ':' + s };
      }
  title: { visible: true, text: 'Tendência de Esforço (${startDate} a ${endDate})' }
\`\`\`
`;
            return yamlString.trim();

        } catch (e) {
            return `\`\`\`chartsview\ntype: Area\noptions:\n  title: { text: "ERRO: ${e.message.replace(/"/g, "'")}" }\n\`\`\``;
        }
    }
})();