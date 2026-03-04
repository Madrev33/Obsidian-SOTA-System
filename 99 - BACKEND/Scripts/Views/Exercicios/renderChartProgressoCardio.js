// SOTA - renderChartProgressoCardio.js v1.0
// Script dv.view para plotar a evolução de Distância e Pace em exercícios de cardio.

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

            // Agrega distância e tempo por dia
            const sessoesPorDia = logsDoExercicio.reduce((acc, log) => {
                const data = log.match(/\(log_date::\s*([^)]+)\)/)?.[1];
                const distancia = parseFloat(log.match(/\(distancia_km::\s*([\d.]+)\)/)?.[1] || '0');
                const duracao = parseInt(log.match(/\(duracao_segundos::\s*(\d+)\)/)?.[1] || '0');
                
                if (data && distancia > 0 && duracao > 0) {
                    if (!acc[data]) acc[data] = { distanciaTotal: 0, tempoTotal: 0 };
                    acc[data].distanciaTotal += distancia;
                    acc[data].tempoTotal += duracao;
                }
                return acc;
            }, {});

            // Transforma no formato do ChartsView (Flat Array) com cálculo de pace
            const chartData = Object.entries(sessoesPorDia).flatMap(([dia, { distanciaTotal, tempoTotal }]) => {
                const tempoMinutos = tempoTotal / 60;
                const paceDecimal = tempoMinutos / distanciaTotal; // Pace em minutos decimais
                
                const dataPoints = [
                    { dia, tipo: 'Distância', valor: parseFloat(distanciaTotal.toFixed(2)) },
                    { dia, tipo: 'Ritmo (Pace)', valor: paceDecimal }
                ];
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
  color: ['#3498db', '#e74c3c']
  yAxis:
    - title: { text: 'Distância (km)', style: { fill: '#3498db' } }
      grid: null
    - title: { text: 'Ritmo (min/km)', style: { fill: '#e74c3c' } }
      position: 'right'
      min: 0
      reversed: true # Inverte o eixo do pace (menor é melhor)
      label:
        formatter: |
          function(value) {
            const min = Math.floor(value);
            const sec = Math.round((value - min) * 60);
            return min + ':' + (sec < 10 ? '0' : '') + sec;
          }
  xAxis:
    title: { text: 'Data', style: { fill: '#cccccc' } }
    label: { autoRotate: true, autoHide: false }
  tooltip:
    formatter: |
      function(datum) {
        if (datum.tipo === 'Ritmo (Pace)') {
          const min = Math.floor(datum.valor);
          const sec = Math.round((datum.valor - min) * 60);
          return { name: datum.tipo, value: min + ':' + (sec < 10 ? '0' : '') + sec + ' /km' };
        }
        return { name: datum.tipo, value: datum.valor + ' km' };
      }
  title: { visible: true, text: 'Progressão de Distância & Pace' }
\`\`\`
`;
            return yamlString.trim();

        } catch (e) {
            return `\`\`\`chartsview\ntype: Line\noptions:\n  title: { text: "ERRO NO SCRIPT: ${e.message.replace(/"/g, "'")}" }\n\`\`\``;
        }
    }
})();