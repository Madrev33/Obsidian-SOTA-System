// 99 - BACKEND/Scripts/Views/DashboardRevisao/renderChartXPPerformance.js
// SOTA v1.2 - Alternância Area (Stack) vs Column (Group) + Grid Sutil

(() => {
    return async function renderChart(dv, input) {
        try {
            // 1. CONTEXTO E VALIDAÇÃO
            const dashboard = dv.current();
            let startDate = dashboard.start_date;
            let endDate = dashboard.end_date;
            const viewMode = input.view_mode || 'area'; // 'area' (Empilhado) ou 'column' (Agrupado)
            const moment = window.moment;

            if (!startDate || !endDate) {
                return `\`\`\`chartsview\ntype: Area\noptions:\n  title: { text: "Selecione um período para visualizar o XP" }\n\`\`\``;
            }

            // Normalização de Datas
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

            const metricsPath = "99 - BACKEND/Logs_Metricas/Daily/Processed";
            const dadosPorDia = [];
            let totalXPAcumulado = 0;

            // 3. LEITURA DE DADOS
            for (const dia of diasNoPeriodo) {
                const arquivoPath = `${metricsPath}/${dia}_metrics.md`;
                const arquivoMetrica = app.vault.getAbstractFileByPath(arquivoPath);

                let xpSaude = 0;
                let xpGenio = 0;
                let xpPaz = 0;

                if (arquivoMetrica) {
                    const content = await app.vault.cachedRead(arquivoMetrica);
                    const matchSaude = content.match(/^xp_saude:\s*(\d+)/m);
                    const matchGenio = content.match(/^xp_genio:\s*(\d+)/m);
                    const matchPaz = content.match(/^xp_paz_espirito:\s*(-?\d+)/m);

                    if (matchSaude) xpSaude = parseInt(matchSaude[1]);
                    if (matchGenio) xpGenio = parseInt(matchGenio[1]);
                    if (matchPaz) xpPaz = parseInt(matchPaz[1]);
                }

                dadosPorDia.push({ dia: dia, valor: xpSaude, categoria: "Vitalidade (Saúde)" });
                dadosPorDia.push({ dia: dia, valor: xpGenio, categoria: "Intelecto (Gênio)" });
                dadosPorDia.push({ dia: dia, valor: xpPaz, categoria: "Espírito (Paz)" });
                
                totalXPAcumulado += (xpSaude + xpGenio + xpPaz);
            }

            if (totalXPAcumulado === 0) {
                return `\`\`\`chartsview\ntype: Area\noptions:\n  title: { text: "Nenhum XP registrado neste período", visible: true }\n\`\`\``;
            }

            // 4. CONFIGURAÇÃO VISUAL
            const chartType = viewMode === 'column' ? 'Column' : 'Area';
            let specificOptions = "";

            if (viewMode === 'area') {
                // MODO AREA (Empilhado - Volume Total)
                specificOptions = `
  isStack: true
  area:
    style:
      fillOpacity: 0.6
  line:
    style:
      lineWidth: 1
`;
            } else {
                // MODO COLUMN (Agrupado - Comparativo)
                specificOptions = `
  isGroup: true
  columnStyle:
    radius: [4, 4, 0, 0]
`;
            }

            // Paleta de Cores SOTA
            const colors = ['#2ecc71', '#3498db', '#f1c40f']; 

            const yamlString = `
\`\`\`chartsview
type: ${chartType}
data: ${JSON.stringify(dadosPorDia)}
options:
  xField: 'dia'
  yField: 'valor'
  seriesField: 'categoria'
  ${specificOptions}
  xAxis:
    label:
      autoRotate: true
      autoHide: true
    title:
      text: 'Data'
      style: { fill: '#cccccc' }
  yAxis:
    title: { text: 'XP Ganho', style: { fill: '#cccccc' } }
    grid:
      line:
        style:
          stroke: 'rgba(255, 255, 255, 0.1)'
          lineDash: [4, 4]
  color: ${JSON.stringify(colors)}
  legend: { position: 'top' }
  tooltip:
    formatter: |
      function(datum) {
        return { name: datum.categoria, value: datum.valor + ' XP' };
      }
  title: { visible: true, text: 'Performance de XP (${viewMode === 'area' ? 'Acumulado' : 'Comparativo por Pilar'})' }
\`\`\`
`;
            return yamlString.trim();

        } catch (e) {
            return `\`\`\`chartsview\ntype: Area\noptions:\n  title: { text: "ERRO CRÍTICO: ${e.message.replace(/"/g, "'")}" }\n\`\`\``;
        }
    }
})();