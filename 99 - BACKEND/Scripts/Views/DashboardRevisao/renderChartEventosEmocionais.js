// 99 - BACKEND/Scripts/Views/DashboardRevisao/renderChartEventosEmocionais.js
// SOTA v2.2 - Mapa Emocional (Standard Stacked)
// Estrutura de dados normalizada: Todo dia possui as 4 séries (mesmo zeradas) para garantir cores consistentes.

(() => {
    return async function renderChart(dv, input) {
        try {
            const dashboard = dv.current();
            let startDate = dashboard.start_date;
            let endDate = dashboard.end_date;
            const moment = window.moment;

            if (!startDate || !endDate) return `\`\`\`chartsview\ntype: Column\noptions:\n  title: { text: "Selecione um período" }\n\`\`\``;

            if (typeof startDate === 'string') startDate = startDate.substring(0, 10);
            if (typeof endDate === 'string') endDate = endDate.substring(0, 10);
            if (startDate.toFormat) startDate = startDate.toFormat('yyyy-MM-dd');
            if (endDate.toFormat) endDate = endDate.toFormat('yyyy-MM-dd');

            // 1. GERAR DIAS
            const diasNoPeriodo = [];
            let currDate = moment(startDate);
            const lastDate = moment(endDate);
            let safetyCounter = 0;
            while (currDate.isSameOrBefore(lastDate, 'day') && safetyCounter < 366) {
                diasNoPeriodo.push(currDate.format("YYYY-MM-DD"));
                currDate.add(1, 'days');
                safetyCounter++;
            }

            // 2. LEITURA DE DADOS
            const emocoesLogPath = "99 - BACKEND/Logs_Metricas/Saude/Emocoes/raw_logs.md";
            const emocoesLogFile = app.vault.getAbstractFileByPath(emocoesLogPath);
            const emocoesMap = new Map();

            if (emocoesLogFile) {
                const emocoesContent = await app.vault.cachedRead(emocoesLogFile);
                const emocoesLines = emocoesContent.split('\n');

                emocoesLines.forEach(line => {
                    const dateMatch = line.match(/\(log_date::\s*(\d{4}-\d{2}-\d{2})\)/);
                    if (dateMatch) {
                        const date = dateMatch[1];
                        if (date >= startDate && date <= endDate) {
                            if (!emocoesMap.has(date)) emocoesMap.set(date, { felicidade: 0, estresse: 0, tristeza: 0, ansiedade: 0 });
                            const diaData = emocoesMap.get(date);

                            if (/#log_felicidade\b/.test(line)) diaData.felicidade++;
                            if (/#log_estresse\b/.test(line)) diaData.estresse++;
                            if (/#log_tristeza\b/.test(line)) diaData.tristeza++;
                            if (/#log_ansiedade\b/.test(line)) diaData.ansiedade++;
                        }
                    }
                });
            }

            const chartData = [];

            // 3. POPULAR DADOS (ESTRUTURA RÍGIDA PARA CORES FUNCIONAREM)
            for (const dia of diasNoPeriodo) {
                const emocoesDia = emocoesMap.get(dia) || { felicidade: 0, estresse: 0, tristeza: 0, ansiedade: 0 };
                
                // A ordem de inserção aqui DEVE bater com a ordem do array de cores no YAML
                chartData.push({ dia: dia, count: emocoesDia.felicidade, type: "1. 😄 Felicidade" });
                chartData.push({ dia: dia, count: emocoesDia.estresse, type: "2. 🤯 Estresse" });
                chartData.push({ dia: dia, count: emocoesDia.ansiedade, type: "3. 😰 Ansiedade" });
                chartData.push({ dia: dia, count: emocoesDia.tristeza, type: "4. 😭 Tristeza" });
            }

            // Definição Padrão de Cores (Array simples)
            // Ordem: Felicidade, Estresse, Ansiedade, Tristeza
            const cores = ['#f1c40f', '#e74c3c', '#9b59b6', '#5e5e5eff'];

            const yamlString = `
\`\`\`chartsview
type: Column
data: ${JSON.stringify(chartData)}
options:
  isStack: true
  xField: 'dia'
  yField: 'count'
  seriesField: 'type'
  color: ${JSON.stringify(cores)}
  columnStyle:
    radius: [4, 4, 0, 0]
  xAxis:
    title: { text: 'Data', style: { fill: '#cccccc' } }
    label: { autoRotate: true, autoHide: true }
  yAxis:
    min: 0
    tickInterval: 1
    title: { text: "Registros", style: { fill: '#cccccc' } }
  legend:
    position: 'top'
    itemName: 
      formatter: |
        function(text) {
          // Remove o número de ordenação da legenda para ficar bonito
          return text.substring(3);
        }
  tooltip:
    formatter: |
      function(datum) {
        // Remove o número de ordenação do tooltip
        return { name: datum.type.substring(3), value: datum.count + 'x' };
      }
  title: { visible: true, text: 'Frequência de Emoções' }
\`\`\`
`;
            return yamlString.trim();

        } catch (e) {
            return `\`\`\`chartsview\ntype: Column\noptions:\n  title: { text: "ERRO: ${e.message.replace(/"/g, "'")}" }\n\`\`\``;
        }
    }
})();