// 99 - BACKEND/Scripts/Views/Charts/renderChartVelocity.js
// SOTA v1.0 - Gráfico de Velocity (Tarefas Concluídas por Dia)
// Lê as tarefas do HUB do Projeto e plota a frequência de conclusão.

(() => {
    return async function renderChart(dv, input) {
        try {
            // --- 1. CONTEXTO & VALIDAÇÃO ---
            const hubUID = input.hub_uid;
            const viewMode = input.view_mode || 'column';

            if (!hubUID) {
                return `\`\`\`chartsview\ntype: Column\noptions:\n  title: { text: "Selecione um Projeto para ver o Velocity" }\n\`\`\``;
            }

            // Busca Robusta por UID
            const hub = dv.pages().where(p => p.sota_uid === hubUID)[0];
            
            if (!hub) {
                return `\`\`\`chartsview\ntype: Column\noptions:\n  title: { text: "HUB do Projeto não encontrado" }\n\`\`\``;
            }

            // --- 2. PROCESSAMENTO DE DADOS (TASKS) ---
            // Acessa as tarefas indexadas do arquivo HUB
            const tarefasConcluidas = hub.file.tasks.where(t => t.completed && t.completion);

            if (tarefasConcluidas.length === 0) {
                return `\`\`\`chartsview\ntype: Column\ndata: [{"data": "Sem Dados", "qtd": 0, "tipo": "Tarefas"}]\noptions:\n  title: { text: "Nenhuma tarefa concluída com data registrada", visible: true }\n\`\`\``;
            }

            // Agrupamento por Data
            const dadosPorDia = {};
            
            tarefasConcluidas.forEach(t => {
                // O campo 'completion' é um objeto DateTime do Luxon (nativo do Dataview)
                const dataFormatada = t.completion.toFormat('yyyy-MM-dd');
                dadosPorDia[dataFormatada] = (dadosPorDia[dataFormatada] || 0) + 1;
            });

            // Transformação para Array do ChartsView
            const chartData = Object.keys(dadosPorDia).sort().map(data => ({
                data: data,
                qtd: dadosPorDia[data],
                tipo: "Velocity"
            }));

            // --- 3. CONFIGURAÇÃO VISUAL (POLIMORFISMO) ---
            const chartType = viewMode === 'line' ? 'Line' : 'Column';
            
            let specificOptions = "";
            if (viewMode === 'column') {
                specificOptions = `
  columnStyle:
    radius: [4, 4, 0, 0]
    fillOpacity: 0.8
`;
            } else { // Line
                specificOptions = `
  smooth: true
  point:
    shape: circle
    size: 4
  lineStyle:
    lineWidth: 3
  area:
    style:
      fillOpacity: 0.1
`;
            }

            // --- 4. GERAÇÃO DO BLOCO ---
            const yamlString = `
\`\`\`chartsview
type: ${chartType}
data: ${JSON.stringify(chartData)}
options:
  xField: 'data'
  yField: 'qtd'
  seriesField: 'tipo'
  ${specificOptions}
  yAxis:
    title: { text: 'Tarefas Concluídas', style: { fill: '#cccccc' } }
    min: 0
    tickInterval: 1
  xAxis: 
    title: { text: 'Data', style: { fill: '#cccccc' } }
    label: { autoRotate: true, autoHide: false }
  color: ['#3498db']
  legend: false
  tooltip:
    formatter: |
      function(datum) {
        return { name: 'Tarefas', value: datum.qtd };
      }
  title: { visible: true, text: 'Velocity: Ritmo de Entrega' }
\`\`\`
`;
            return yamlString.trim();

        } catch (e) {
            return `\`\`\`chartsview\ntype: Column\noptions:\n  title: { text: "ERRO NO SCRIPT: ${e.message.replace(/"/g, "'")}" }\n\`\`\``;
        }
    }
})();