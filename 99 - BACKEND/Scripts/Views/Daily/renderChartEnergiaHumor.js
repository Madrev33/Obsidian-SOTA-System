// 99 - BACKEND/Scripts/Views/Daily/renderChartEnergiaHumor.js
// SOTA v2.0 - Gráfico de Bio-Ritmo por Sessão (Log-Based)
// Lê dados de humor e energia diretamente dos logs de sessão de trabalho.

(() => {
    return async function renderChart(dv, input) {
        try {
            const page = dv.current();
            const dateStr = page.file.name;

            if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                return `\`\`\`chartsview\ntype: Line\noptions:\n  title: { text: "Nota diária inválida" }\n\`\`\``;
            }

            // 1. LER DADOS DOS LOGS
            const logPath = `99 - BACKEND/Logs_Metricas/Daily/${dateStr}.md`;
            const logFile = app.vault.getAbstractFileByPath(logPath);

            if (!logFile) {
                return `\`\`\`chartsview\ntype: Line\noptions:\n  title: { text: "Sem logs para hoje" }\n\`\`\``;
            }

            const content = await app.vault.cachedRead(logFile);
            const lines = content.split('\n');
            const chartData = [];
            let dadosEncontrados = false;

            lines.forEach(line => {
                // Filtra apenas sessões de trabalho que tenham dados de humor e energia
                if (!line.includes("sessao_fim::WORK") || !line.includes("(humor::") || !line.includes("(energia::")) {
                    return;
                }

                const timeMatch = line.match(/\(log_time::\s*(\d{2}:\d{2}):\d{2}\)/);
                const humorMatch = line.match(/\(humor::(\d+)\)/);
                const energiaMatch = line.match(/\(energia::(\d+)\)/);

                if (timeMatch && humorMatch && energiaMatch) {
                    dadosEncontrados = true;
                    const hora = timeMatch[1]; // Formato HH:mm
                    const humorVal = parseInt(humorMatch[1]);
                    const energiaVal = parseInt(energiaMatch[1]);
                    
                    // Normaliza humor (1-5) para escala (0-100)
                    const humorNormalizado = (humorVal - 1) * 25;

                    chartData.push({ hora: hora, valor: energiaVal, tipo: "⚡ Energia" });
                    chartData.push({ hora: hora, valor: humorNormalizado, tipo: "🙂 Humor" });
                }
            });

            if (!dadosEncontrados) {
                return `\`\`\`chartsview\ntype: Line\noptions:\n  title: { text: "Sem dados de bio-ritmo nos logs de hoje" }\n\`\`\``;
            }
            
            // Ordena por hora para garantir que a linha seja desenhada corretamente
            chartData.sort((a, b) => a.hora.localeCompare(b.hora));
            
            // 2. RENDERIZAÇÃO
            const yamlString = `
\`\`\`chartsview
type: Line
data: ${JSON.stringify(chartData)}
options:
  xField: 'hora'
  yField: 'valor'
  seriesField: 'tipo'
  smooth: true
  point:
    shape: 'circle'
    size: 4
  lineStyle:
    lineWidth: 3
  yAxis:
    title: { text: 'Nível', style: { fill: '#cccccc' } }
    min: 0
    max: 100
  xAxis:
    title: { text: 'Hora da Sessão', style: { fill: '#cccccc' } }
  color: ['#e67e22', '#79c0ff']
  legend: { position: 'top' }
  tooltip:
    formatter: |
      function(datum) {
        let valorReal = datum.valor;
        if (datum.tipo.includes("Humor")) {
            // Reverte a normalização para mostrar o valor real (1-5)
            valorReal = (datum.valor / 25 + 1).toFixed(1) + ' / 5';
        } else {
            valorReal = Math.round(valorReal) + '%';
        }
        return { name: datum.tipo + " (" + datum.hora + ")", value: valorReal };
      }
  title: { visible: true, text: 'Bio-Ritmo por Sessão de Foco' }
\`\`\`
`;
            return yamlString.trim();

        } catch (e) {
            return `\`\`\`chartsview\ntype: Line\noptions:\n  title: { text: "ERRO: ${e.message.replace(/"/g, "'")}" }\n\`\`\``;
        }
    }
})();