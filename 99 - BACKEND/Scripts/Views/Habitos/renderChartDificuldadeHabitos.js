// 99 - BACKEND/Scripts/Views/Charts/renderChartDificuldadeHabitos.js
// SOTA v1.1 - Correção de Labels e Tooltip

(() => {
    return async function renderChart(dv, input) {
        try {
            const habitosPath = "07 - Engenharia de Hábitos/01 - Hábitos";
            const habitos = dv.pages(`"${habitosPath}"`).where(p => p.tipo_habito === 'habito' && p.ativo !== false);

            if (habitos.length === 0) return `\`\`\`chartsview\ntype: Pie\noptions:\n  title: { text: "Sem hábitos" }\n\`\`\``;

            const contagem = {};
            habitos.forEach(h => {
                // Tenta extrair o Tier de várias formas possíveis
                let tier = "Indefinido";
                if (h.tier_desafio) {
                    // Padrão esperado: "🏆 Hardcore (100 XP)" -> split(" ")[1] = "Hardcore"
                    const partes = h.tier_desafio.split(" ");
                    if (partes.length > 1) tier = partes[1];
                    else tier = h.tier_desafio; // Caso não tenha espaço
                }
                contagem[tier] = (contagem[tier] || 0) + 1;
            });

            const chartData = Object.entries(contagem).map(([tier, qtd]) => ({
                tier: tier,
                qtd: qtd,
                percentual: Math.round((qtd / habitos.length) * 100)
            }));

            const ordem = { "Trivial": 1, "Fácil": 2, "Moderado": 3, "Desafiador": 4, "Hardcore": 5 };
            chartData.sort((a, b) => (ordem[a.tier] || 99) - (ordem[b.tier] || 99));

            const yamlString = `
\`\`\`chartsview
type: Pie
data: ${JSON.stringify(chartData)}
options:
  angleField: 'qtd'
  colorField: 'tier'
  radius: 0.8
  label:
    type: 'spider'
    labelHeight: 28
    formatter: |
      function(datum) {
        return datum.tier + '\\n' + datum.percentual + '%';
      }
  legend:
    position: 'bottom'
  tooltip:
    formatter: |
      function(datum) {
        return { name: datum.tier, value: datum.qtd + ' hábitos' };
      }
  title: { visible: true, text: 'Carga Cognitiva (Distribuição por Dificuldade)' }
\`\`\`
`;
            return yamlString.trim();

        } catch (e) {
            return `\`\`\`chartsview\ntype: Pie\noptions:\n  title: { text: "ERRO: ${e.message.replace(/"/g, "'")}" }\n\`\`\``;
        }
    }
})();