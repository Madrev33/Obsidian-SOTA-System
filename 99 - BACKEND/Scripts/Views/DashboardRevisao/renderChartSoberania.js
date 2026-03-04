// 99 - BACKEND/Scripts/Views/DashboardRevisao/renderChartSoberania.js
// SOTA v1.4 - Gráfico de Soberania (Precision HH:MM:SS)

(() => {
    return async function renderChart(dv, input) {
        try {
            const dashboard = dv.current();
            const moment = window.moment;
            
            let startDate = dashboard.start_date;
            let endDate = dashboard.end_date;
            const viewMode = input.view_mode || 'column';

            if (!startDate || !endDate) {
                return `\`\`\`chartsview\ntype: Column\noptions:\n  title: { text: "Selecione um período" }\n\`\`\``;
            }

            if (typeof startDate === 'string') startDate = startDate.substring(0, 10);
            if (typeof endDate === 'string') endDate = endDate.substring(0, 10);
            if (startDate.toFormat) startDate = startDate.toFormat('yyyy-MM-dd');
            if (endDate.toFormat) endDate = endDate.toFormat('yyyy-MM-dd');

            const diasNoPeriodo = [];
            let currDate = moment(startDate);
            const lastDate = moment(endDate);
            let diasCount = 0;
            while (currDate.isSameOrBefore(lastDate, 'day') && diasCount < 366) {
                diasNoPeriodo.push(currDate.format("YYYY-MM-DD"));
                currDate.add(1, 'days');
                diasCount++;
            }

            const logsPath = "99 - BACKEND/Logs_Metricas/Daily";
            const chartData = [];
            let totalSegundosGeral = 0;
            const regexLog = /\(duracao_total_sessao_segundos::\s*(\d+)\).*?\(soberania::\s*(interna|externa)\)/;

            for (const dia of diasNoPeriodo) {
                const arquivoLog = app.vault.getAbstractFileByPath(`${logsPath}/${dia}.md`);
                let segundosInternos = 0;
                let segundosExternos = 0;

                if (arquivoLog) {
                    const content = await app.vault.cachedRead(arquivoLog);
                    const lines = content.split('\n');

                    lines.forEach(line => {
                        if (!line.includes("sessao_fim::WORK")) return;
                        const match = line.match(regexLog);
                        if (match) {
                            const segundos = parseInt(match[1]);
                            const tipo = match[2];
                            if (tipo === 'interna') segundosInternos += segundos;
                            if (tipo === 'externa') segundosExternos += segundos;
                        }
                    });
                }
                
                const valorInterno = segundosInternos / 3600; // Valor para o eixo Y (horas)
                const valorExterno = segundosExternos / 3600;

                chartData.push({ data: dia, valor: valorInterno, segundos: segundosInternos, tipo: "Soberania Interna (Eu)" });
                chartData.push({ data: dia, valor: valorExterno, segundos: segundosExternos, tipo: "Soberania Externa (Eles)" });

                if (viewMode === 'column') {
                    const minutosDiaTotal = 1440;
                    const segundosNeutros = Math.max(0, (minutosDiaTotal * 60) - (segundosInternos + segundosExternos));
                    const valorNeutro = segundosNeutros / 3600;
                    chartData.push({ data: dia, valor: valorNeutro, segundos: segundosNeutros, tipo: "Neutro / Manutenção" });
                }

                totalSegundosGeral += (segundosInternos + segundosExternos);
            }

            if (totalSegundosGeral === 0) {
                 return `\`\`\`chartsview\ntype: ${viewMode === 'line' ? 'Line' : 'Column'}\ndata: [{"data": "${startDate}", "valor": 0, "tipo": "Sem Dados"}]\noptions:\n  title: { text: "Sem registros de soberania", visible: true }\n\`\`\``;
            }

            const chartType = viewMode === 'line' ? 'Line' : 'Column';
            let specificOptions = "";
            let colors = [];

            if (viewMode === 'column') {
                specificOptions = `
  isStack: true
  columnStyle: { radius: [2, 2, 0, 0] }`;
                colors = ["#f1c40f", "#7f8c8d", "rgba(200, 200, 200, 0.1)"]; 
            } else {
                specificOptions = `
  smooth: true
  point: { shape: circle, size: 4 }
  lineStyle: { lineWidth: 3 }`;
                colors = ["#f1c40f", "#7f8c8d"];
            }

            const yamlString = `
\`\`\`chartsview
type: ${chartType}
data: ${JSON.stringify(chartData)}
options:
  xField: 'data'
  yField: 'valor'
  seriesField: 'tipo'
  ${specificOptions}
  color: ${JSON.stringify(colors)}
  xAxis:
    title: { text: 'Data', style: { fill: '#cccccc' } }
    label: { autoRotate: true, autoHide: true }
  yAxis:
    title: { text: 'Horas', style: { fill: '#cccccc' } }
    ${viewMode === 'column' ? 'max: 24' : ''}
    grid:
      line:
        style:
          stroke: 'rgba(255, 255, 255, 0.1)'
          lineDash: [4, 4]
  legend: { position: 'top' }
  tooltip:
    fields: ['tipo', 'segundos']
    formatter: |
      function(datum) {
        if (datum.tipo.includes('Neutro')) return { name: datum.tipo, value: '' };
        var s = Number(datum.segundos || 0);
        var h = Math.floor(s / 3600).toString().padStart(2, '0');
        var m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
        var sec = (s % 60).toString().padStart(2, '0');
        return { name: datum.tipo, value: h + ':' + m + ':' + sec };
      }
  title: { visible: true, text: 'Densidade de Vida (${viewMode === 'line' ? 'Tendência' : 'Volume'})' }
\`\`\`
`;
            return yamlString.trim();

        } catch (e) {
            return `\`\`\`chartsview\ntype: Column\noptions:\n  title: { text: "ERRO: ${e.message.replace(/"/g, "'")}" }\n\`\`\``;
        }
    }
})();