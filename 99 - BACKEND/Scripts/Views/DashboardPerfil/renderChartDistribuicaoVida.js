// 99 - BACKEND/Scripts/Views/DashboardPerfil/renderChartDistribuicaoVida.js
// SOTA v1.0 - Distribuição de Vida (Gráfico de Pizza Global)

(() => {
    return async function renderChart(dv, input) {
        try {
            const logsPath = "99 - BACKEND/Logs_Metricas/Daily/Processed";
            const paginas = dv.pages(`"${logsPath}"`).where(p => p.file.name.endsWith("_metrics"));

            if (paginas.length === 0) return `\`\`\`chartsview\ntype: Pie\noptions:\n  title: { text: "Sem dados históricos" }\n\`\`\``;

            // Acumuladores Macro
            let xpSaude = 0;
            let xpIntelecto = 0; // Genio
            let xpEspirito = 0; // Paz
            
            // Se quiser basear em TEMPO em vez de XP (mais preciso para "onde gastei minha vida")
            // Mas o tempo de treino não é logado em segundos sempre, então XP é um proxy melhor de "Esforço/Valor".
            // Vamos usar XP acumulado por pilar.

            for (const p of paginas) {
                xpSaude += (p.xp_saude || 0);
                xpIntelecto += (p.xp_genio || 0);
                xpEspirito += (p.xp_paz_espirito || 0);
            }

            const totalXP = xpSaude + xpIntelecto + xpEspirito;

            if (totalXP === 0) return `\`\`\`chartsview\ntype: Pie\noptions:\n  title: { text: "XP Zerado" }\n\`\`\``;

            const chartData = [
                { area: "Vitalidade", valor: xpSaude, percentual: Math.round((xpSaude / totalXP) * 100) },
                { area: "Intelecto", valor: xpIntelecto, percentual: Math.round((xpIntelecto / totalXP) * 100) },
                { area: "Espírito", valor: xpEspirito, percentual: Math.round((xpEspirito / totalXP) * 100) }
            ];

            const yamlString = `
\`\`\`chartsview
type: Pie
data: ${JSON.stringify(chartData)}
options:
  angleField: 'valor'
  colorField: 'area'
  radius: 0.8
  innerRadius: 0.6
  label:
    type: 'spider'
    labelHeight: 28
    formatter: |
      function(datum) {
        return datum.area + '\\n' + datum.percentual + '%';
      }
  color: ['#e74c3c', '#3498db', '#9b59b6']
  legend:
    position: 'bottom'
  tooltip:
    formatter: |
      function(datum) {
        return { name: datum.area, value: datum.valor + ' XP acumulado' };
      }
  title: { visible: true, text: 'Distribuição de Vida (Baseado em XP)' }
\`\`\`
`;
            return yamlString.trim();

        } catch (e) {
            return `\`\`\`chartsview\ntype: Pie\noptions:\n  title: { text: "ERRO: ${e.message.replace(/"/g, "'")}" }\n\`\`\``;
        }
    }
})();