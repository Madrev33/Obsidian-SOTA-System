// SOTA - renderChartProgressoIsometrico.js v1.0
// Script dv.view para plotar a evolução de Tempo de Segura e Carga Adicional.

(() => {
    return async function renderChart(dv, input) {
        try {
            // 1. CONTEXTO E VALIDAÇÃO
            const exercicioId = input.exercicio_id || dv.current().exercicio_id;
            if (!exercicioId) {
                return `\`\`\`chartsview\ntype: Line\noptions:\n  title: { text: "ID do exercício não definido" }\n\`\`\``;
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
            if (!logFile) return `\`\`\`chartsview\ntype: Line\noptions:\n  title: { text: "Log não encontrado" }\n\`\`\``;

            // 2. PROCESSAMENTO DE DADOS
            const content = await app.vault.cachedRead(logFile);
            const logsDoExercicio = content.split('\n').filter(line => line.includes("(sessao_fim::WORK)"));

            if (logsDoExercicio.length === 0) {
                return `\`\`\`chartsview\ntype: Line\ndata: []\noptions:\n  title: { text: "Sem histórico para este exercício", visible: true }\n\`\`\``;
            }

            // Agrega dados por dia: pega a maior duração e a carga média do dia
            const sessoesPorDia = logsDoExercicio.reduce((acc, log) => {
                const data = log.match(/\(log_date::\s*([^)]+)\)/)?.[1];
                const duracao = parseInt(log.match(/\(duracao_segundos::\s*(\d+)\)/)?.[1] || '0');
                const carga = parseFloat(log.match(/\(carga_kg::\s*([\d.]+)\)/)?.[1] || '0');
                
                if (data && duracao > 0) {
                    if (!acc[data]) acc[data] = { maxDuracao: 0, totalCarga: 0, countCarga: 0 };
                    
                    if (duracao > acc[data].maxDuracao) acc[data].maxDuracao = duracao;
                    
                    if (carga > 0) {
                        acc[data].totalCarga += carga;
                        acc[data].countCarga++;
                    }
                }
                return acc;
            }, {});

            // Transforma no formato do ChartsView
            const chartData = Object.entries(sessoesPorDia).flatMap(([dia, { maxDuracao, totalCarga, countCarga }]) => {
                const dataPoints = [{ dia, tipo: 'Duração Máxima', valor: maxDuracao }];
                
                const cargaMedia = countCarga > 0 ? totalCarga / countCarga : 0;
                if (cargaMedia > 0) {
                    dataPoints.push({ dia, tipo: 'Carga Extra', valor: parseFloat(cargaMedia.toFixed(1)) });
                }
                return dataPoints;
            });
            
            chartData.sort((a, b) => a.dia.localeCompare(b.dia));

            // 3. CONFIGURAÇÃO VISUAL
            const yamlString = `
\`\`\`chartsview
type: Line
data: ${JSON.stringify(chartData)}
options:
  xField: 'dia'
  yField: 'valor'
  seriesField: 'tipo'
  smooth: true
  point: { shape: 'circle', size: 4 }
  legend: { position: 'top' }
  color: ['#2ecc71', '#f1c40f']
  yAxis:
    - title: { text: 'Tempo (segundos)', style: { fill: '#2ecc71' } }
      grid: null
      min: 0
    - title: { text: 'Carga Extra (kg)', style: { fill: '#f1c40f' } }
      position: 'right'
      min: 0
  xAxis:
    title: { text: 'Data', style: { fill: '#cccccc' } }
    label: { autoRotate: true, autoHide: false }
  tooltip:
    formatter: |
      function(datum) {
        if (datum.tipo === 'Carga Extra') {
          return { name: datum.tipo, value: datum.valor + ' kg' };
        }
        return { name: datum.tipo, value: datum.valor + ' s' };
      }
  title: { visible: true, text: 'Progressão Isométrica (Tempo & Carga)' }
\`\`\`
`;
            return yamlString.trim();

        } catch (e) {
            return `\`\`\`chartsview\ntype: Line\noptions:\n  title: { text: "ERRO NO SCRIPT: ${e.message.replace(/"/g, "'")}" }\n\`\`\``;
        }
    }
})();