// 99 - BACKEND/Scripts/Views/DashboardEstudos/renderChartEsforcoDiarioEstudo.js
// SOTA v2.0 - Gráfico de Esforço Diário Agregado (HH:mm:ss e Estilo Dash)

(() => {
    return async function renderChart(dv, input) {
        try {
            const hubUID = input.hub_uid;
            const viewMode = input.view_mode || 'column';

            if (!hubUID) return `\`\`\`chartsview\ntype: Column\noptions:\n  title: { text: "Selecione um Estudo" }\n\`\`\``;

            const hub = dv.pages().where(p => p.sota_uid === hubUID)[0];
            if (!hub) return `\`\`\`chartsview\ntype: Column\noptions:\n  title: { text: "HUB não encontrado" }\n\`\`\``;

            // Coleta Links
            const fontes = [];
            if (hub.midias_associadas) { if (dv.isArray(hub.midias_associadas)) fontes.push(...hub.midias_associadas); else fontes.push(hub.midias_associadas); }
            if (hub.projetos_relacionados) { if (dv.isArray(hub.projetos_relacionados)) fontes.push(...hub.projetos_relacionados); else fontes.push(hub.projetos_relacionados); }

            if (fontes.length === 0) return `\`\`\`chartsview\ntype: Column\noptions:\n  title: { text: "Sem fontes associadas" }\n\`\`\``;

            const dadosAgregados = {};

            // Agregação
            for (const link of fontes) {
                const path = link.path;
                const fonteFile = app.vault.getAbstractFileByPath(path);
                
                if (fonteFile) {
                    const cacheFonte = app.metadataCache.getFileCache(fonteFile);
                    const idFonte = cacheFonte?.frontmatter?.id_midia || cacheFonte?.frontmatter?.id_projeto;
                    const tipoFonte = cacheFonte?.frontmatter?.tipo;

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
                        else if (tipoFonte.includes("jogo")) pastaTipo = "Jogos";
                        else if (tipoFonte.includes("documentacao")) pastaTipo = "Documentacoes";

                        const logPath = `99 - BACKEND/Logs_Metricas/${pastaTipo}/${idFonte}/raw_logs.md`;
                        const logFile = app.vault.getAbstractFileByPath(logPath);

                        if (logFile) {
                            const content = await app.vault.cachedRead(logFile);
                            const lines = content.split('\n');
                            
                            for (const line of lines) {
                                if (!/sessao_fim::(WORK|BREAK)/.test(line)) continue;

                                const dateMatch = line.match(/\(log_date::\s*(\d{4}-\d{2}-\d{2})\)/);
                                const duracaoMatch = line.match(/\(duracao_total_sessao_segundos::\s*(\d+)\)/);
                                const tipoMatch = line.match(/\(sessao_fim::(WORK|BREAK)\)/);

                                if (dateMatch && duracaoMatch && tipoMatch) {
                                    const date = dateMatch[1];
                                    const segundos = parseInt(duracaoMatch[1]);
                                    // Soma segundos para precisão
                                    const tipoSessao = tipoMatch[1] === 'WORK' ? 'Foco' : 'Pausa';

                                    if (!dadosAgregados[date]) dadosAgregados[date] = { Foco: 0, Pausa: 0 };
                                    dadosAgregados[date][tipoSessao] += segundos;
                                }
                            }
                        }
                    }
                }
            }

            const chartData = [];
            Object.keys(dadosAgregados).sort().forEach(date => {
                const minFoco = Math.round(dadosAgregados[date].Foco / 60);
                const minPausa = Math.round(dadosAgregados[date].Pausa / 60);

                chartData.push({ 
                    dia: date, 
                    tipo: "Foco", 
                    minutos: minFoco, 
                    segundos: dadosAgregados[date].Foco 
                });
                chartData.push({ 
                    dia: date, 
                    tipo: "Pausa", 
                    minutos: minPausa, 
                    segundos: dadosAgregados[date].Pausa 
                });
            });

            if (chartData.length === 0) return `\`\`\`chartsview\ntype: Column\noptions:\n  title: { text: "Nenhum esforço registrado" }\n\`\`\``;

            const chartType = viewMode === 'line' ? 'Line' : 'Column';
            let specificOptions = viewMode === 'column' 
                ? `isGroup: true\n  columnStyle: { radius: [4, 4, 0, 0] }` 
                : `smooth: true\n  point: { shape: 'circle', size: 3 }`;

            const yamlString = `
\`\`\`chartsview
type: ${chartType}
data: ${JSON.stringify(chartData)}
options:
  xField: 'dia'
  yField: 'minutos'
  seriesField: 'tipo'
  ${specificOptions}
  yAxis:
    title: { text: 'Minutos', style: { fill: '#cccccc' } }
    grid:
      line:
        style:
          stroke: 'rgba(255, 255, 255, 0.1)'
          lineDash: [4, 4]
  xAxis: 
    title: { text: 'Data', style: { fill: '#cccccc' } }
    label: { autoRotate: true, autoHide: false }
  color: ['#3498db', '#e67e22']
  legend: { position: 'top' }
  tooltip:
    fields: ['tipo', 'minutos', 'segundos']
    formatter: |
      function(datum) {
        var secs = datum.segundos;
        if (secs === undefined) secs = datum.minutos * 60;
        secs = Number(secs);

        var h = Math.floor(secs / 3600).toString().padStart(2, '0');
        var m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
        var s = (secs % 60).toString().padStart(2, '0');
        return { name: datum.tipo, value: h + ':' + m + ':' + s };
      }
  title: { visible: true, text: 'Volume de Estudo por Dia' }
\`\`\`
`;
            return yamlString.trim();

        } catch (e) {
            return `\`\`\`chartsview\ntype: Column\noptions:\n  title: { text: "ERRO: ${e.message.replace(/"/g, "'")}" }\n\`\`\``;
        }
    }
})();