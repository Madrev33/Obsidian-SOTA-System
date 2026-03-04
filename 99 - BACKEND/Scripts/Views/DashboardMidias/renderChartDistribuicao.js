// 99 - BACKEND/Scripts/Views/DashboardMidias/renderChartDistribuicao.js
// SOTA v3.0 - Gráfico de Distribuição Híbrido (Página vs Sessão)
// Livros/Artigos/Docs usam 'pagina_fim'. Outros usam 'sessao_fim'.

(() => {
    return async function renderChart(dv, input) {
        try {
            const dashboard = dv.current();
            const idMidia = dashboard.midia_selecionada_id;
            const cicloSelecionado = dashboard.ciclo_selecionado_view;
            const viewMode = dashboard.view_mode_distribuicao || 'pie';

            if (!idMidia) return `\`\`\`chartsview\ntype: Pie\noptions:\n  title: { text: "Selecione uma mídia" }\n\`\`\``;

            const hub = dv.pages().where(p => p.id_midia === idMidia && p.file.path.includes("00. HUB"))[0];
            if (!hub) return `\`\`\`chartsview\ntype: Pie\noptions:\n  title: { text: "HUB não encontrado" }\n\`\`\``;

            const sanitizar = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[-\s]+/g, '_').replace(/[^\w_]+/g, '') : "";
            
            // Configuração Híbrida
            let tipoPasta = "Outros";
            let unidadeLabel = "Unidade";
            
            let regexUnidade = null;
            let logTypeFilter = null; 
            let durationRegex = null;

            const tipo = hub.tipo || "";

            // GRUPO 1: Baseado em PÁGINA (Micro)
            if (tipo.includes("livro") || tipo.includes("artigo") || tipo.includes("documentacao")) {
                if (tipo.includes("livro")) { tipoPasta = "Livros"; unidadeLabel = "Capítulo"; regexUnidade = /\(capitulo::\s*(\d+)\)/i; }
                else if (tipo.includes("artigo")) { tipoPasta = "Artigos"; unidadeLabel = "Seção"; regexUnidade = /\(secao::\s*(\d+)\)/i; }
                else { tipoPasta = "Documentacoes"; unidadeLabel = "Seção"; regexUnidade = /\(secao::\s*(\d+)\)/i; } // Assumindo seção para docs

                logTypeFilter = "(pagina_fim::";
                durationRegex = /\(duracao_segundos::\s*(\d+)\)/i; // Duração da página
            }
            // GRUPO 2: Baseado em SESSÃO (Macro)
            else {
                logTypeFilter = "(sessao_fim::WORK)";
                durationRegex = /\(duracao_total_sessao_segundos::\s*(\d+)\)/i; // Duração da sessão

                if (tipo.includes("curso")) { tipoPasta = "Cursos"; unidadeLabel = "Módulo"; regexUnidade = /\(modulo::\s*(\d+)\)/i; }
                else if (tipo.includes("serie")) { tipoPasta = "Series"; unidadeLabel = "Temporada"; regexUnidade = /\(temporada::\s*(\d+)\)/i; }
                else if (tipo.includes("documentario")) { tipoPasta = "Documentarios"; unidadeLabel = "Temporada"; regexUnidade = /\((?:temporada|modulo)::\s*(\d+)\)/i; } 
                else if (tipo.includes("podcast")) { tipoPasta = "Podcasts"; unidadeLabel = "Temporada"; regexUnidade = /\((?:temporada|modulo)::\s*(\d+)\)/i; }
                else if (tipo.includes("jogo")) { tipoPasta = "Jogos"; unidadeLabel = "Missão"; regexUnidade = /\(missao::\s*(\d+)\)/i; }
                else { return `\`\`\`chartsview\ntype: Pie\noptions:\n  title: { text: "Tipo não suportado para distribuição" }\n\`\`\``; }
            }

            const idSanitizado = sanitizar(hub.file.name.replace(/00\. HUB - |HUB - /g, '')) || idMidia;
            const logPath = `99 - BACKEND/Logs_Metricas/${tipoPasta}/${idSanitizado}/raw_logs.md`;
            const logFile = app.vault.getAbstractFileByPath(logPath);
            if (!logFile) return `\`\`\`chartsview\ntype: Pie\noptions:\n  title: { text: "Sem log" }\n\`\`\``;

            const content = await app.vault.cachedRead(logFile);
            const lines = content.split('\n');
            const filtrarPorCiclo = cicloSelecionado && !cicloSelecionado.toLowerCase().includes("todos");
            const numeroCicloAlvo = filtrarPorCiclo ? parseInt(cicloSelecionado.replace(/\D/g, '')) : null;
            
            const dadosUnidadeSegundos = {};
            let totalSegundosGeral = 0;

            lines.forEach(line => {
                if (!line.includes(logTypeFilter)) return;

                if (filtrarPorCiclo) {
                    const cicloMatch = line.match(/\(ciclo::\s*(\d+)\)/);
                    const cicloLog = cicloMatch ? parseInt(cicloMatch[1]) : 1; 
                    if (cicloLog !== numeroCicloAlvo) return;
                }

                const unidadeMatch = line.match(regexUnidade);
                const duracaoMatch = line.match(durationRegex);

                if (unidadeMatch && duracaoMatch) {
                    const valorUnidade = parseInt(unidadeMatch[1]);
                    const segundos = parseInt(duracaoMatch[1]);
                    
                    if (!isNaN(valorUnidade) && segundos > 0) {
                        const chave = `${unidadeLabel} ${valorUnidade}`;
                        dadosUnidadeSegundos[chave] = (dadosUnidadeSegundos[chave] || 0) + segundos;
                        totalSegundosGeral += segundos;
                    }
                }
            });

            const chartData = [];
            Object.entries(dadosUnidadeSegundos).forEach(([nome, totalSegundos]) => {
                const minutos = Math.max(1, Math.round(totalSegundos / 60));
                
                chartData.push({
                    unidade: String(nome),
                    valor: totalSegundos, 
                    percentual: ((totalSegundos / totalSegundosGeral) * 100).toFixed(1)
                });
            });

            if (chartData.length === 0) {
                const emptyData = [{ unidade: "Sem Dados", valor: 1 }];
                return `\`\`\`chartsview\ntype: Pie\ndata: ${JSON.stringify(emptyData)}\noptions:\n  title: { text: "Distribuição Vazia", visible: true }\n  legend: false\n\`\`\``;
            }

            chartData.sort((a, b) => {
                try {
                    const numA = parseInt(a.unidade.replace(/\D/g, '')) || 0;
                    const numB = parseInt(b.unidade.replace(/\D/g, '')) || 0;
                    return numA - numB;
                } catch (e) { return 0; }
            });

            // ... (Resto do código de renderização permanece igual) ...

            const chartType = viewMode === 'bar' ? 'Bar' : 'Pie';
            let specificOptions = "";

            const formatarHHMMSS = (totalSecs) => {
                const h = Math.floor(totalSecs / 3600).toString().padStart(2, '0');
                const m = Math.floor((totalSecs % 3600) / 60).toString().padStart(2, '0');
                const s = Math.round(totalSecs % 60).toString().padStart(2, '0');
                return `${h}:${m}:${s}`;
            };
            const totalFormatado = formatarHHMMSS(totalSegundosGeral);

            const tooltipConfig = `
  tooltip:
    fields: ['unidade', 'valor', 'percentual']
    formatter: |
      function(datum) {
        var secs = Number(datum.valor);
        var h = Math.floor(secs / 3600).toString().padStart(2, '0');
        var m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
        var s = (secs % 60).toString().padStart(2, '0');
        var tempo = h + ':' + m + ':' + s;
        return { name: datum.unidade, value: tempo + ' (' + datum.percentual + '%)' };
      }
`;

            if (viewMode === 'pie') {
                specificOptions = `
  angleField: 'valor'
  colorField: 'unidade'
  radius: 0.8
  innerRadius: 0.64
  label:
    type: 'spider'
    labelHeight: 28
    formatter: |
      function(datum) {
        return datum.unidade + '\\n' + datum.percentual + '%';
      }
  statistic:
    title:
      style:
        fontSize: '16px'
        color: '#8c8c8c'
        fontWeight: 300
      content: 'Tempo Total'
    content:
      style:
        fontSize: '24px'
        fontWeight: 'bold'
        color: '#dadada'
      content: '${totalFormatado}'
`;
            } else { 
                specificOptions = `
  xField: 'valor'
  yField: 'unidade'
  seriesField: 'unidade'
  barStyle: { radius: [0, 2, 2, 0] }
  legend: false
  xAxis:
    label:
      formatter: |
        function(val) {
          return (val / 60).toFixed(1) + 'm';
        }
`;
            }

            const yamlString = `
\`\`\`chartsview
type: ${chartType}
data: ${JSON.stringify(chartData)}
options:
  ${specificOptions}
  ${tooltipConfig}
  title: { visible: true, text: 'Distribuição de Tempo por ${unidadeLabel}' }
\`\`\`
`;
            return yamlString.trim();

        } catch (e) {
            return `\`\`\`chartsview\ntype: Pie\noptions:\n  title: { text: "ERRO: ${e.message.replace(/"/g, "'")}" }\n\`\`\``;
        }
    }
})();