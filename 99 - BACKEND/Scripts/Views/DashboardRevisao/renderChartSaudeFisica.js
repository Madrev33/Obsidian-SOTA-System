// 99 - BACKEND/Scripts/Views/DashboardRevisao/renderChartSaudeFisica.js
// SOTA v3.0 - Dual Log & Otimização (Nutrição Dedicada + Sono Processado)
// Água removida (agora é hábito).

(() => {
    return async function renderChart(dv, input) {
        try {
            // 1. CONTEXTO E VALIDAÇÃO
            const dashboard = dv.current();
            let startDate = dashboard.start_date;
            let endDate = dashboard.end_date;
            const moment = window.moment;

            if (!startDate || !endDate) {
                return `\`\`\`chartsview\ntype: DualAxes\noptions:\n  title: { text: "Selecione um período" }\n\`\`\``;
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

            // 3. LEITURA DE DADOS (HÍBRIDA)
            
            // A) Dados de Nutrição (Log Contextual Otimizado)
            const nutriLogPath = "99 - BACKEND/Logs_Metricas/Saude/Nutricao/raw_logs.md";
            const nutriLogFile = app.vault.getAbstractFileByPath(nutriLogPath);
            const refeicoesMap = new Map(); // { 'YYYY-MM-DD': { boas: 0, ruins: 0 } }

            if (nutriLogFile) {
                const nutriContent = await app.vault.cachedRead(nutriLogFile);
                const nutriLines = nutriContent.split('\n');
                
                nutriLines.forEach(line => {
                    const dateMatch = line.match(/\(log_date::\s*(\d{4}-\d{2}-\d{2})\)/);
                    if (dateMatch) {
                        const date = dateMatch[1];
                        if (date >= startDate && date <= endDate) {
                            if (!refeicoesMap.has(date)) refeicoesMap.set(date, { boas: 0, ruins: 0 });
                            const diaData = refeicoesMap.get(date);
                            
                            // Regex com \b para evitar falso positivo parcial
                            if (/#refeicao_boa\b/.test(line)) diaData.boas++;
                            if (/#refeicao_ruim\b/.test(line)) diaData.ruins++;
                        }
                    }
                });
            }

            // B) Dados de Sono (Métricas Processadas - ETL)
            const metricsPath = "99 - BACKEND/Logs_Metricas/Daily/Processed";
            
            const lineData = []; // Sono
            const barData = [];  // Nutrição
            
            let dadosEncontrados = false;

            for (const dia of diasNoPeriodo) {
                // --- SONO ---
                const metricsFilePath = `${metricsPath}/${dia}_metrics.md`;
                const metricsFile = dv.page(metricsFilePath);
                
                let qualidadeSono = 0;
                
                if (metricsFile && metricsFile.qualidade_sono_calculada !== undefined) {
                    qualidadeSono = metricsFile.qualidade_sono_calculada;
                } else {
                    // Fallback (Nota Diária)
                    const ano = dia.substring(0, 4);
                    const mes = dia.substring(5, 7);
                    const dailyNotePath = `01 - Registros/01. Daily/${ano}/${mes}/${dia}.md`;
                    const dailyNote = dv.page(dailyNotePath);
                    if (dailyNote && dailyNote.sono_qualidade_percebida) {
                        qualidadeSono = dailyNote.sono_qualidade_percebida * 10;
                    }
                }

                // --- NUTRIÇÃO (Do Map Otimizado) ---
                const nutricaoDia = refeicoesMap.get(dia) || { boas: 0, ruins: 0 };
                const refeicoesBoas = nutricaoDia.boas;
                const refeicoesRuins = nutricaoDia.ruins;

                if (qualidadeSono > 0 || refeicoesBoas > 0 || refeicoesRuins > 0) {
                    dadosEncontrados = true;
                }

                // Popula Arrays
                lineData.push({ dia: dia, valor: qualidadeSono, category: "🛌 Qualidade Sono" });
                
                if (refeicoesBoas > 0) barData.push({ dia: dia, count: refeicoesBoas, category: "🥗 Refeições Boas" });
                if (refeicoesRuins > 0) barData.push({ dia: dia, count: refeicoesRuins, category: "🍔 Refeições Ruins" });
                
                // Dummy Zero para alinhamento se vazio
                if (refeicoesBoas === 0 && refeicoesRuins === 0) {
                    barData.push({ dia: dia, count: 0, category: "Neutro" });
                }
            }

            if (!dadosEncontrados) {
                 const dummyData = [{ dia: "Sem Dados", valor: 0, category: "N/A" }];
                 return `\`\`\`chartsview\ntype: Line\ndata: ${JSON.stringify(dummyData)}\noptions:\n  title: { text: "Nenhum dado de saúde no período", visible: true }\n\`\`\``;
            }

            // 4. CONFIGURAÇÃO VISUAL
            const dualData = [lineData, barData];

            const yamlString = `
\`\`\`chartsview
type: DualAxes
data: ${JSON.stringify(dualData)}
options:
  xField: 'dia'
  yField: ['valor', 'count']
  yAxis:
    valor:
      min: 0
      max: 100
      title: { text: "Sono (%)", style: { fill: '#9b59b6' } }
      grid:
        line:
          style:
            stroke: 'rgba(255, 255, 255, 0.1)'
            lineDash: [4, 4]
    count:
      min: 0
      tickInterval: 1
      title: { text: "Refeições", style: { fill: '#3498db' } }
      grid: null
  geometryOptions:
    - geometry: 'line'
      seriesField: 'category'
      smooth: true
      color: '#9b59b6'
      point: { size: 4, shape: 'circle' }
      lineStyle: { lineWidth: 3 }
    - geometry: 'column'
      seriesField: 'category'
      isStack: true
      columnWidthRatio: 0.5
  color:
    callback: |
      function(cat) {
        if (cat === '🛌 Qualidade Sono') return '#9b59b6';
        if (cat === '🥗 Refeições Boas') return '#2ecc71';
        if (cat === '🍔 Refeições Ruins') return '#e74c3c';
        return 'transparent';
      }
  legend: { position: 'top' }
  tooltip:
    formatter: |
      function(datum) {
        if (datum.category === 'Neutro') return { name: '', value: '' };
        let val = datum.valor || datum.count;
        if (datum.category.includes('Sono')) val += '%';
        return { name: datum.category, value: val };
      }
  title: { visible: true, text: 'Saúde Física Integrada (Sono & Nutrição)' }
\`\`\`
`;
            return yamlString.trim();

        } catch (e) {
            return `\`\`\`chartsview\ntype: Line\noptions:\n  title: { text: "ERRO CRÍTICO: ${e.message.replace(/"/g, "'")}" }\n\`\`\``;
        }
    }
})();