// 99 - BACKEND/Scripts/Views/DashboardEstudos/renderChartDistribuicaoFontes.js
// SOTA v2.5 - Gráfico de Distribuição de Fontes (Jogos + HH:mm:ss)

(() => {
    return async function renderChart(dv, input) {
        try {
            const hubUID = input.hub_uid;
            const viewMode = input.view_mode || 'pie';

            if (!hubUID) return `\`\`\`chartsview\ntype: Pie\noptions:\n  title: { text: "Selecione um Estudo" }\n\`\`\``;

            const hub = dv.pages().where(p => p.sota_uid === hubUID)[0];
            if (!hub) return `\`\`\`chartsview\ntype: Pie\noptions:\n  title: { text: "HUB não encontrado" }\n\`\`\``;

            // Coleta Links
            const fontes = [];
            const rawMidias = hub.midias_associadas;
            const rawProjetos = hub.projetos_relacionados;

            if (rawMidias) { if (dv.isArray(rawMidias)) fontes.push(...rawMidias); else fontes.push(rawMidias); }
            if (rawProjetos) { if (dv.isArray(rawProjetos)) fontes.push(...rawProjetos); else fontes.push(rawProjetos); }

            if (fontes.length === 0) return `\`\`\`chartsview\ntype: Pie\noptions:\n  title: { text: "Sem fontes associadas" }\n\`\`\``;

            const focoPorFonte = {};
            let totalSegundosGeral = 0;

            for (const link of fontes) {
                const path = link.path;
                const fonteFile = app.vault.getAbstractFileByPath(path);
                
                if (fonteFile) {
                    const cacheFonte = app.metadataCache.getFileCache(fonteFile);
                    const idFonte = cacheFonte?.frontmatter?.id_midia || cacheFonte?.frontmatter?.id_projeto;
                    const tipoFonte = cacheFonte?.frontmatter?.tipo;
                    // Nome Limpo
                    const nomeFonte = fonteFile.basename.replace(/^(00\. HUB - |HUB - )/g, '');

                    if (idFonte && tipoFonte) {
                        let pastaTipo = "Outros";
                        if (tipoFonte.includes("livro")) pastaTipo = "Livros";
                        else if (tipoFonte.includes("curso")) pastaTipo = "Cursos";
                        else if (tipoFonte.includes("serie")) pastaTipo = "Series";
                        else if (tipoFonte.includes("filme")) pastaTipo = "Filmes";
                        else if (tipoFonte.includes("documentario")) pastaTipo = "Documentarios";
                        else if (tipoFonte.includes("podcast")) pastaTipo = "Podcasts";
                        else if (tipoFonte.includes("artigo")) pastaTipo = "Artigos";
                        else if (tipoFonte.includes("video")) pastaTipo = "Videos";
                        else if (tipoFonte.includes("projeto")) pastaTipo = "Projetos";
                        else if (tipoFonte.includes("jogo")) pastaTipo = "Jogos"; // ADICIONADO
                        else if (tipoFonte.includes("documentacao")) pastaTipo = "Documentacoes";

                        const logPath = `99 - BACKEND/Logs_Metricas/${pastaTipo}/${idFonte}/raw_logs.md`;
                        const logFile = app.vault.getAbstractFileByPath(logPath);

                        if (logFile) {
                            const content = await app.vault.cachedRead(logFile);
                            const lines = content.split('\n');
                            
                            for (const line of lines) {
                                if (line.includes("sessao_fim::WORK")) {
                                    const duracao = parseInt(line.match(/\(duracao_total_sessao_segundos::\s*(\d+)\)/)?.[1] || '0');
                                    if (duracao > 0) {
                                        focoPorFonte[nomeFonte] = (focoPorFonte[nomeFonte] || 0) + duracao;
                                        totalSegundosGeral += duracao;
                                    }
                                }
                            }
                        }
                    }
                }
            }

            if (totalSegundosGeral === 0) return `\`\`\`chartsview\ntype: Pie\noptions:\n  title: { text: "Nenhum tempo registrado" }\n\`\`\``;

            // Helper HH:mm:ss
            const formatarHHMMSS = (s) => {
                const h = Math.floor(s / 3600).toString().padStart(2, '0');
                const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
                const sec = Math.round(s % 60).toString().padStart(2, '0');
                return `${h}:${m}:${sec}`;
            };
            const totalFormatado = formatarHHMMSS(totalSegundosGeral);

            const chartData = Object.entries(focoPorFonte).map(([nome, segundos]) => {
                const minutos = Math.round(segundos / 60);
                return {
                    fonte: nome,
                    minutos: minutos,
                    segundos: segundos,
                    percentual: ((segundos / totalSegundosGeral) * 100).toFixed(1)
                };
            });

            chartData.sort((a, b) => b.minutos - a.minutos);
            
            const chartType = viewMode === 'bar' ? 'Bar' : 'Pie';
            let specificOptions = "";

            const tooltipConfig = `
  tooltip:
    fields: ['fonte', 'minutos', 'segundos', 'percentual']
    formatter: |
      function(datum) {
        var secs = Number(datum.segundos);
        var h = Math.floor(secs / 3600).toString().padStart(2, '0');
        var m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
        var s = (secs % 60).toString().padStart(2, '0');
        var tempo = h + ':' + m + ':' + s;
        return { name: datum.fonte, value: tempo + ' (' + datum.percentual + '%)' };
      }
`;

            if (viewMode === 'pie') {
                specificOptions = `
  angleField: 'minutos'
  colorField: 'fonte'
  radius: 0.8
  innerRadius: 0.64
  label:
    type: 'spider'
    labelHeight: 28
    formatter: |
      function(datum) {
        return datum.fonte + '\\n' + datum.percentual + '%';
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
  legend:
    position: 'right'
`;
            } else { 
                specificOptions = `
  xField: 'minutos'
  yField: 'fonte'
  seriesField: 'fonte'
  legend: false
  barStyle:
    radius: [0, 4, 4, 0]
  label:
    position: 'right'
    formatter: |
      function(datum) {
        return datum.percentual + '%';
      }
    style:
      fill: '#cccccc'
`;
            }

            const yamlString = `
\`\`\`chartsview
type: ${chartType}
data: ${JSON.stringify(chartData)}
options:
  ${specificOptions}
  ${tooltipConfig}
  title: { visible: true, text: 'Distribuição de Esforço por Fonte' }
\`\`\`
`;
            return yamlString.trim();

        } catch (e) {
            return `\`\`\`chartsview\ntype: Pie\noptions:\n  title: { text: "ERRO: ${e.message.replace(/"/g, "'")}" }\n\`\`\``;
        }
    }
})();