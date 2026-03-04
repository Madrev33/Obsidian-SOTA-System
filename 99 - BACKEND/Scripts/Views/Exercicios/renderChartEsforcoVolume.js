// 99 - BACKEND/Scripts/Views/Exercicios/renderChartEsforcoVolume.js
// SOTA v2.0 - Gráfico de Dispersão (Hierarchical Sharding Support)

(() => {
    return async function renderChart(dv, input) {
        try {
            // 1. CONTEXTO E VALIDAÇÃO
            const exercicioId = input.exercicio_id || dv.current().exercicio_id;

            if (!exercicioId) {
                return `\`\`\`chartsview\ntype: Scatter\noptions:\n  title: { text: "ID do exercício não definido" }\n\`\`\``;
            }

            // --- LÓGICA DE BUSCA HIERÁRQUICA ---
            const logsRootPath = "99 - BACKEND/Logs_Metricas/Exercicios";
            
            const encontrarArquivoLog = (id) => {
                const root = app.vault.getAbstractFileByPath(logsRootPath);
                if (!root || !root.children) return null;
            
                for (const grupoFolder of root.children) {
                    if (!grupoFolder.extension) { // É pasta
                        const path = `${grupoFolder.path}/${id}/raw_logs.md`;
                        const file = app.vault.getAbstractFileByPath(path);
                        if (file) return file;
                    }
                }
                return null;
            };

            const logFile = encontrarArquivoLog(exercicioId);
            if (!logFile) return `\`\`\`chartsview\ntype: Scatter\noptions:\n  title: { text: "Log não encontrado" }\n\`\`\``;

            // 2. PROCESSAMENTO DE DADOS
            const content = await app.vault.cachedRead(logFile);
            const logsDoExercicio = content.split('\n').filter(line => line.includes("(sessao_fim::WORK)"));

            if (logsDoExercicio.length === 0) {
                return `\`\`\`chartsview\ntype: Scatter\ndata: [{"volume": 0, "rpeMedio": 0}]\noptions:\n  title: { text: "Sem dados suficientes", visible: true }\n\`\`\``;
            }

            // Agrega dados por sessão (dia)
            const sessoes = logsDoExercicio.reduce((acc, log) => {
                const dataMatch = log.match(/\(log_date::\s*([^)]+)\)/);
                if (!dataMatch) return acc;
                const data = dataMatch[1];

                const carga = parseFloat(log.match(/\(carga_kg::\s*([\d.]+)\)/)?.[1] || '0');
                const reps = parseInt(log.match(/\(reps_feito::\s*(\d+)\)/)?.[1] || '0');
                const rpe = parseInt(log.match(/\(esforco_rpe::\s*(\d+)\)/)?.[1]);

                if (!acc[data]) {
                    acc[data] = { volumeTotal: 0, totalRpe: 0, seriesCount: 0 };
                }

                acc[data].volumeTotal += (carga * reps);
                if (!isNaN(rpe)) {
                    acc[data].totalRpe += rpe;
                    acc[data].seriesCount++;
                }
                return acc;
            }, {});
            
            // Formata para o Scatter Plot
            const chartData = Object.entries(sessoes).map(([dia, dados]) => ({
                dia: dia,
                volume: Math.round(dados.volumeTotal),
                rpeMedio: dados.seriesCount > 0 ? parseFloat((dados.totalRpe / dados.seriesCount).toFixed(1)) : 0
            })).filter(d => d.volume > 0 && d.rpeMedio > 0);

            if (chartData.length === 0) return `\`\`\`chartsview\ntype: Scatter\noptions:\n  title: { text: "Dados insuficientes" }\n\`\`\``;

            // 3. CONFIGURAÇÃO VISUAL
            const yamlString = `
\`\`\`chartsview
type: Scatter
data: ${JSON.stringify(chartData)}
options:
  xField: 'volume'
  yField: 'rpeMedio'
  size: 6
  shape: 'circle'
  color: '#3498db'
  pointStyle:
    fillOpacity: 0.8
    stroke: '#fff'
    lineWidth: 1
  yAxis:
    title: { text: 'RPE Médio (Sessão)', style: { fill: '#cccccc' } }
    min: 0
    max: 10
    tickInterval: 1
  xAxis:
    title: { text: 'Volume Total da Sessão (kg)', style: { fill: '#cccccc' } }
  tooltip:
    formatter: |
      function(datum) {
        const dataFormatada = window.moment(datum.dia).format('DD/MM/YY');
        return { 
          name: 'Sessão de ' + dataFormatada, 
          value: 'Volume: ' + datum.volume + 'kg | RPE: ' + datum.rpeMedio 
        };
      }
  title: { visible: true, text: 'Correlação Esforço vs. Volume' }
\`\`\`
`;
            return yamlString.trim();

        } catch (e) {
            return `\`\`\`chartsview\ntype: Scatter\noptions:\n  title: { text: "ERRO NO SCRIPT: ${e.message.replace(/"/g, "'")}" }\n\`\`\``;
        }
    }
})();