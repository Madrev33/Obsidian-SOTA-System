// 99 - BACKEND/Scripts/Views/DashboardProjetos/renderChartHorariosProjeto.js
// SOTA v1.1 - Gráfico de Cronobiologia com Tooltip HH:mm:ss

(() => {
    return async function renderChart(dv, input) {
        try {
            // --- 1. CONTEXTO ---
            const hubUID = input.hub_uid;
            const viewMode = input.view_mode || 'column';

            if (!hubUID) return `\`\`\`chartsview\ntype: Column\noptions:\n  title: { text: "Selecione um Projeto" }\n\`\`\``;

            // Busca Robusta do HUB
            const hub = dv.pages().where(p => p.sota_uid === hubUID)[0];
            if (!hub) return `\`\`\`chartsview\ntype: Column\noptions:\n  title: { text: "HUB não encontrado" }\n\`\`\``;

            const idProjeto = hub.id_projeto;
            const logPath = `99 - BACKEND/Logs_Metricas/Projetos/${idProjeto}/raw_logs.md`;
            const logFile = app.vault.getAbstractFileByPath(logPath);

            if (!logFile) return `\`\`\`chartsview\ntype: Column\noptions:\n  title: { text: "Sem dados de horário para este projeto" }\n\`\`\``;

            // --- 2. PROCESSAMENTO DE DADOS ---
            const content = await app.vault.cachedRead(logFile);
            const lines = content.split('\n');
            
            // Inicializa as 24h (totalSegundos em vez de totalMinutos)
            const dadosHorarios = {};
            for (let i = 0; i < 24; i++) {
                dadosHorarios[i] = { totalSegundos: 0, countSessoes: 0 };
            }

            let logsEncontrados = 0;

            lines.forEach(line => {
                if (!line.includes("sessao_fim::WORK")) return;

                // Extrai hora e duração
                const timeMatch = line.match(/\(log_time::\s*(\d{2}):\d{2}:\d{2}\)/);
                const duracaoMatch = line.match(/\(duracao_total_sessao_segundos::\s*(\d+)\)/);

                if (timeMatch && duracaoMatch) {
                    const hora = parseInt(timeMatch[1]);
                    const segundos = parseInt(duracaoMatch[1]);

                    if (hora >= 0 && hora <= 23) {
                        dadosHorarios[hora].totalSegundos += segundos;
                        dadosHorarios[hora].countSessoes++;
                        logsEncontrados++;
                    }
                }
            });

            if (logsEncontrados === 0) {
                return `\`\`\`chartsview\ntype: Column\noptions:\n  title: { text: "Nenhuma sessão de foco registrada ainda" }\n\`\`\``;
            }

            // Monta Array para o Gráfico
            const chartData = [];
            Object.keys(dadosHorarios).forEach(h => {
                const horaInt = parseInt(h);
                const dados = dadosHorarios[horaInt];
                
                // Calcula médias
                const mediaSegundos = dados.countSessoes > 0 ? Math.round(dados.totalSegundos / dados.countSessoes) : 0;
                const mediaMinutos = Math.round(mediaSegundos / 60);

                chartData.push({
                    hora: `${horaInt}h`,
                    media: mediaMinutos, // Eixo Y (Visual)
                    mediaSeg: mediaSegundos, // Tooltip (Preciso)
                    tipo: "Média de Foco"
                });
            });

            // --- 3. CONFIGURAÇÃO VISUAL ---
            const chartType = viewMode === 'line' ? 'Line' : 'Column';
            let specificOptions = "";

            if (viewMode === 'column') {
                specificOptions = `
  columnStyle:
    radius: [4, 4, 0, 0]
    fillOpacity: 0.85
`;
            } else { // Line
                specificOptions = `
  smooth: true
  point:
    shape: circle
    size: 4
  area:
    style:
      fillOpacity: 0.2
`;
            }

            const yamlString = `
\`\`\`chartsview
type: ${chartType}
data: ${JSON.stringify(chartData)}
options:
  xField: 'hora'
  yField: 'media'
  seriesField: 'tipo'
  ${specificOptions}
  yAxis:
    title: { text: 'Média (min)', style: { fill: '#cccccc' } }
    min: 0
  xAxis: 
    title: { text: 'Hora do Dia', style: { fill: '#cccccc' } }
  color: ['#3498db']
  legend: false
  tooltip:
    fields: ['tipo', 'media', 'mediaSeg']
    formatter: |
      function(datum) {
        var secs = datum.mediaSeg;
        if (secs === undefined) secs = datum.media * 60;
        secs = Number(secs);

        var h = Math.floor(secs / 3600).toString().padStart(2, '0');
        var m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
        var s = (secs % 60).toString().padStart(2, '0');
        return { name: 'Duração Média', value: h + ':' + m + ':' + s };
      }
  title: { visible: true, text: 'Cronobiologia do Projeto: Foco por Hora' }
\`\`\`
`;
            return yamlString.trim();

        } catch (e) {
            return `\`\`\`chartsview\ntype: Column\noptions:\n  title: { text: "ERRO: ${e.message.replace(/"/g, "'")}" }\n\`\`\``;
        }
    }
})();