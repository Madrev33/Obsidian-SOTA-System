// 99 - BACKEND/Scripts/Views/Exercicios/renderChartProgressoCarga.js
// SOTA v2.0 - Gráfico de Progressão (Hierarchical Sharding Support)

(() => {
    return async function renderChart(dv, input) {
        try {
            // 1. CONTEXTO E VALIDAÇÃO
            const exercicioId = input.exercicio_id || dv.current().exercicio_id;
            const viewMode = input.view_mode || 'line'; // line (padrão) ou point

            if (!exercicioId) {
                return `\`\`\`chartsview\ntype: Line\noptions:\n  title: { text: "Exercício não identificado" }\n\`\`\``;
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
            
            if (!logFile) {
                return `\`\`\`chartsview\ntype: Line\noptions:\n  title: { text: "Log não encontrado para este exercício" }\n\`\`\``;
            }

            // 2. PROCESSAMENTO DE DADOS
            const content = await app.vault.cachedRead(logFile);
            const logsDoExercicio = content.split('\n').filter(line => 
                line.includes("(sessao_fim::WORK)")
            );

            if (logsDoExercicio.length === 0) {
                return `\`\`\`chartsview\ntype: Line\ndata: [{"dia": "Sem Dados", "valor": 0, "tipo": "Carga"}]\noptions:\n  title: { text: "Sem histórico de carga para este exercício", visible: true }\n\`\`\``;
            }

            const seriesPorDia = logsDoExercicio.reduce((acc, log) => {
                const dataMatch = log.match(/\(log_date::\s*([^)]+)\)/);
                if (!dataMatch) return acc;
                const data = dataMatch[1];

                const carga = parseFloat(log.match(/\(carga_kg::\s*([\d.]+)\)/)?.[1] || '0');
                const reps = parseInt(log.match(/\(reps_feito::\s*(\d+)\)/)?.[1] || '0');
                
                if (carga > 0 && reps > 0) {
                    if (!acc[data] || carga > acc[data].carga) {
                        acc[data] = { carga, reps };
                    }
                }
                return acc;
            }, {});

            const brzycki1RM = (carga, reps) => {
                if (reps > 12) return null;
                return carga / (1.0278 - (0.0278 * reps));
            };
            
            const chartData = Object.entries(seriesPorDia).flatMap(([dia, { carga, reps }]) => {
                const dataPoints = [{ dia, tipo: 'Carga Máxima', valor: carga }];
                
                const rmEstimado = brzycki1RM(carga, reps);
                if (rmEstimado !== null) {
                    dataPoints.push({ dia, tipo: '1RM Estimado', valor: Math.round(rmEstimado) });
                }
                return dataPoints;
            });
            
            chartData.sort((a, b) => a.dia.localeCompare(b.dia));

            // 3. CONFIGURAÇÃO VISUAL
            const chartType = viewMode === 'point' ? 'Scatter' : 'Line';
            
            let specificOptions = "";
            if (viewMode === 'line') {
                specificOptions = `
  smooth: true
  point:
    shape: circle
    size: 4
  lineStyle:
    lineWidth: 2`;
            } else {
                specificOptions = `
  size: 5
  shape: circle`;
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
  yAxis:
    title: { text: 'Peso (kg)', style: { fill: '#cccccc' } }
  xAxis:
    title: { text: 'Data', style: { fill: '#cccccc' } }
    label: { autoRotate: true, autoHide: false }
  legend: { position: 'top' }
  color: ['#3498db', '#e74c3c']
  tooltip:
    formatter: |
      function(datum) {
        return { name: datum.tipo, value: datum.valor + ' kg' };
      }
  title: { visible: true, text: 'Progressão de Carga & 1RM Estimado' }
\`\`\`
`;
            return yamlString.trim();

        } catch (e) {
            return `\`\`\`chartsview\ntype: Line\noptions:\n  title: { text: "ERRO NO SCRIPT: ${e.message.replace(/"/g, "'")}" }\n\`\`\``;
        }
    }
})();