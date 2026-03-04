// SOTA v2.4 - Correção de Cálculo de Segundos

(() => {
    return async function renderChart(dv, input) {
        try {
            const dashboard = dv.current();
            let startDate = dashboard.start_date, endDate = dashboard.end_date;
            const viewMode = input.view_mode || 'pie';
            
            if (!startDate || !endDate) return `\`\`\`chartsview\ntype: Pie\noptions:\n  title: { text: "Selecione um período" }\n\`\`\``;
            
            if (typeof startDate === 'string') startDate = startDate.substring(0, 10);
            if (typeof endDate === 'string') endDate = endDate.substring(0, 10);
            if (startDate.toFormat) startDate = startDate.toFormat('yyyy-MM-dd');
            if (endDate.toFormat) endDate = endDate.toFormat('yyyy-MM-dd');

            const logsPath = "99 - BACKEND/Logs_Metricas/Daily";
            const filesInRange = app.vault.getMarkdownFiles().filter(f => 
                f.path.startsWith(logsPath) && 
                f.basename >= startDate && 
                f.basename <= endDate
            );

            if (filesInRange.length === 0) return `\`\`\`chartsview\ntype: Pie\noptions:\n  title: { text: "Sem logs no período" }\n\`\`\``;

            const focoPorCategoria = {};
            let totalSegundosGeral = 0;

            for (const file of filesInRange) {
                const content = await app.vault.cachedRead(file);
                const lines = content.split('\n');
                for (const line of lines) {
                    if (line.includes("sessao_fim::WORK")) {
                        const duracao = parseInt(line.match(/\(duracao_total_sessao_segundos::\s*(\d+)\)/)?.[1] || '0');
                        if (duracao === 0) continue;

                        let categoria = "Outros";
                        if (line.includes("#projeto/")) categoria = "🚀 Projetos";
                        else if (line.includes("#midia/")) categoria = "📚 Mídias";
                        else if (line.includes("#estudo/")) categoria = "🧠 Estudos";
                        else if (line.includes("#exercicio/")) categoria = "🏋️‍♂️ Saúde";

                        focoPorCategoria[categoria] = (focoPorCategoria[categoria] || 0) + duracao;
                        totalSegundosGeral += duracao;
                    }
                }
            }

            if (totalSegundosGeral === 0) return `\`\`\`chartsview\ntype: Pie\noptions:\n  title: { text: "Nenhum tempo de foco registrado" }\n\`\`\``;
            
            // --- INÍCIO DA CORREÇÃO ---
            const formatarHHMMSS = (s) => {
                const h = Math.floor(s / 3600).toString().padStart(2, '0');
                const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
                // Usa o operador de módulo para garantir que os segundos fiquem entre 0 e 59
                const sec = (s % 60).toString().padStart(2, '0');
                return `${h}:${m}:${sec}`;
            };
            // --- FIM DA CORREÇÃO ---

            const chartData = Object.entries(focoPorCategoria).map(([cat, seg]) => ({
                categoria: cat,
                segundos: seg,
                valor: seg
            }));
            
            chartData.sort((a, b) => b.valor - a.valor);

            const chartType = viewMode === 'bar' ? 'Bar' : 'Pie';
            let specificOptions = "";

            const tooltipConfig = `
  tooltip:
    formatter: |
      function(datum) {
        const total = ${totalSegundosGeral};
        const segundos = datum.valor;
        
        const h = Math.floor(segundos / 3600).toString().padStart(2, '0');
        const m = Math.floor((segundos % 3600) / 60).toString().padStart(2, '0');
        const s = (segundos % 60).toString().padStart(2, '0');
        const tempoFormatado = h + ':' + m + ':' + s;
        
        const percentual = ((segundos / total) * 100).toFixed(1);
        return { name: datum.categoria, value: tempoFormatado + ' (' + percentual + '%)' };
      }`;

            if (viewMode === 'pie') {
                specificOptions = `
  angleField: 'valor'
  colorField: 'categoria'
  radius: 0.85
  innerRadius: 0.5
  label:
    type: 'spider'
    labelHeight: 28
    formatter: |
      function(datum) {
        const percentual = ((datum.valor / ${totalSegundosGeral}) * 100).toFixed(1);
        return datum.categoria + '\\n' + percentual + '%';
      }
  statistic:
    title:
      content: 'Foco Total'
    content:
      content: '${formatarHHMMSS(totalSegundosGeral)}'
  legend:
    position: 'right'`;
            } else {
                specificOptions = `
  xField: 'valor'
  yField: 'categoria'
  seriesField: 'categoria'
  legend: false`;
            }

            const yamlString = `
\`\`\`chartsview
type: ${chartType}
data: ${JSON.stringify(chartData)}
options:
  ${specificOptions}
  ${tooltipConfig}
  title:
    visible: true
    text: 'Distribuição de Foco por Categoria'
\`\`\`
`;
            return yamlString.trim();

        } catch (e) {
            return `\`\`\`chartsview\ntype: Pie\noptions:\n  title: { text: "ERRO: ${e.message.replace(/"/g, "'")}" }\n\`\`\``;
        }
    }
})();