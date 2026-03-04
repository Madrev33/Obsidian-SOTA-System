// 99 - BACKEND/Scripts/Views/DashboardProjetos/renderChartDistribuicaoFase.js
// SOTA v1.5 - Gráfico de Pizza/Barras: Formato HH:mm:ss no Centro e Tooltip (Fields Fix)

(() => {
    return async function renderChart(dv, input) {
        try {
            const hubUID = input.hub_uid;
            const viewMode = input.view_mode || 'pie';

            if (!hubUID) return `\`\`\`chartsview\ntype: Pie\noptions:\n  title: { text: "Selecione um Projeto" }\n\`\`\``;

            const hub = dv.pages().where(p => p.sota_uid === hubUID)[0];
            if (!hub) return `\`\`\`chartsview\ntype: Pie\noptions:\n  title: { text: "HUB não encontrado" }\n\`\`\``;

            const idProjeto = hub.id_projeto;
            const logPath = `99 - BACKEND/Logs_Metricas/Projetos/${idProjeto}/raw_logs.md`;
            const logFile = app.vault.getAbstractFileByPath(logPath);

            if (!logFile) return `\`\`\`chartsview\ntype: Pie\noptions:\n  title: { text: "Sem dados de fase" }\n\`\`\``;

            const content = await app.vault.cachedRead(logFile);
            const lines = content.split('\n');
            
            const focoPorFase = {};
            let totalSegundosGeral = 0;

            lines.forEach(line => {
                if (!line.includes("sessao_fim::WORK")) return;
                const tagMatch = line.match(/#projeto\/[^\/]+\/([^\/\s]+)/);
                const duracaoMatch = line.match(/\(duracao_total_sessao_segundos::\s*(\d+)\)/);

                if (tagMatch && duracaoMatch) {
                    let nomeFase = tagMatch[1].replace(/^\d+_/, '').replace(/_/g, ' ');
                    nomeFase = nomeFase.charAt(0).toUpperCase() + nomeFase.slice(1);
                    const segundos = parseInt(duracaoMatch[1]);
                    
                    if (segundos > 0) {
                        focoPorFase[nomeFase] = (focoPorFase[nomeFase] || 0) + segundos;
                        totalSegundosGeral += segundos;
                    }
                }
            });

            if (totalSegundosGeral === 0) return `\`\`\`chartsview\ntype: Pie\noptions:\n  title: { text: "Nenhuma atividade" }\n\`\`\``;

            const formatarHHMMSS = (totalSecs) => {
                const h = Math.floor(totalSecs / 3600).toString().padStart(2, '0');
                const m = Math.floor((totalSecs % 3600) / 60).toString().padStart(2, '0');
                const s = Math.round(totalSecs % 60).toString().padStart(2, '0');
                return `${h}:${m}:${s}`;
            };

            const chartData = Object.entries(focoPorFase).map(([fase, segundos]) => {
                const minutos = Math.round(segundos / 60);
                return {
                    fase: fase,
                    minutos: minutos,
                    segundos: segundos,
                    percentual: ((segundos / totalSegundosGeral) * 100).toFixed(1)
                };
            });

            chartData.sort((a, b) => b.minutos - a.minutos);

            const chartType = viewMode === 'bar' ? 'Bar' : 'Pie';
            let specificOptions = "";
            const totalFormatado = formatarHHMMSS(totalSegundosGeral);

            // CORREÇÃO AQUI: Adicionado 'fields' para garantir acesso aos dados
            const tooltipConfig = `
  tooltip:
    fields: ['fase', 'minutos', 'segundos', 'percentual']
    formatter: |
      function(datum) {
        var sVal = datum.segundos;
        if (sVal === undefined) sVal = datum.minutos * 60;
        var secs = Number(sVal);

        var h = Math.floor(secs / 3600).toString().padStart(2, '0');
        var m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
        var s = (secs % 60).toString().padStart(2, '0');
        var tempo = h + ':' + m + ':' + s;
        
        var perc = datum.percentual;
        if (perc === undefined) perc = ((secs / ${totalSegundosGeral}) * 100).toFixed(1);

        return { name: datum.fase, value: tempo + ' (' + perc + '%)' };
      }
`;

            if (viewMode === 'pie') {
                specificOptions = `
  angleField: 'minutos'
  colorField: 'fase'
  radius: 0.8
  innerRadius: 0.64
  label:
    type: 'spider'
    labelHeight: 28
    formatter: |
      function(datum) {
        return datum.fase + '\\n' + datum.percentual + '%';
      }
  statistic:
    title:
      style:
        fontSize: '16px'
        color: '#8c8c8c'
        fontWeight: 300
      content: 'Tempo Total'
    content:
      style:
        fontSize: '24px'
        fontWeight: 'bold'
        color: '#dadada'
      content: '${totalFormatado}'
  legend:
    position: 'right'
`;
            } else { 
                specificOptions = `
  xField: 'minutos'
  yField: 'fase'
  seriesField: 'fase'
  legend: false
  barStyle:
    radius: [0, 4, 4, 0]
  label:
    position: 'right'
    formatter: |
      function(datum) {
        return datum.percentual + '%';
      }
    style:
      fill: '#cccccc'
`;
            }

            const yamlString = `
\`\`\`chartsview
type: ${chartType}
data: ${JSON.stringify(chartData)}
options:
  ${specificOptions}
  ${tooltipConfig}
  title: { visible: true, text: 'Distribuição de Foco por Fase' }
\`\`\`
`;
            return yamlString.trim();

        } catch (e) {
            return `\`\`\`chartsview\ntype: Pie\noptions:\n  title: { text: "ERRO: ${e.message.replace(/"/g, "'")}" }\n\`\`\``;
        }
    }
})();