// 99 - BACKEND/Scripts/Views/DashboardMidias/renderChartHorarios.js
// SOTA v2.0 - Gráfico de Cronobiologia (Correção HH:mm:ss e Estilo Dash)

(() => {
    return async function renderChart(dv, input) {
        try {
            // 1. CONTEXTO
            const dashboard = dv.current();
            const idMidia = dashboard.midia_selecionada_id;
            const cicloSelecionado = dashboard.ciclo_selecionado_view;
            const viewMode = dashboard.view_mode_horarios || 'column';

            if (!idMidia) return `\`\`\`chartsview\ntype: Column\noptions:\n  title: { text: "Selecione uma mídia" }\n\`\`\``;

            // 2. LOCALIZAR LOGS
            const hub = dv.pages().where(p => p.id_midia === idMidia && p.file.path.includes("00. HUB"))[0];
            if (!hub) return `\`\`\`chartsview\ntype: Column\noptions:\n  title: { text: "HUB não encontrado" }\n\`\`\``;

            const sanitizar = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[-\s]+/g, '_').replace(/[^\w_]+/g, '') : "";
            let tipoPasta = "Outros";
            const tipo = hub.tipo || "";
            if (tipo.includes("livro")) tipoPasta = "Livros";
            else if (tipo.includes("curso")) tipoPasta = "Cursos";
            else if (tipo.includes("serie")) tipoPasta = "Series";
            else if (tipo.includes("filme")) tipoPasta = "Filmes";
            else if (tipo.includes("documentario")) tipoPasta = "Documentarios";
            else if (tipo.includes("podcast")) tipoPasta = "Podcasts";
            else if (tipo.includes("artigo")) tipoPasta = "Artigos";
            else if (tipo.includes("documentacao")) tipoPasta = "Documentacoes";
            else if (tipo.includes("video")) tipoPasta = "Videos";
            else if (tipo.includes("jogo")) tipoPasta = "Jogos";

            const idSanitizado = sanitizar(hub.file.name.replace(/00\. HUB - |HUB - /g, '')) || idMidia;
            const logPath = `99 - BACKEND/Logs_Metricas/${tipoPasta}/${idSanitizado}/raw_logs.md`;
            const logFile = app.vault.getAbstractFileByPath(logPath);

            if (!logFile) return `\`\`\`chartsview\ntype: Column\noptions:\n  title: { text: "Sem dados de horário" }\n\`\`\``;

            // 3. PROCESSAMENTO DE DADOS
            const content = await app.vault.cachedRead(logFile);
            const lines = content.split('\n');
            
            const filtrarPorCiclo = cicloSelecionado && !cicloSelecionado.toLowerCase().includes("todos");
            const numeroCicloAlvo = filtrarPorCiclo ? parseInt(cicloSelecionado.replace(/\D/g, '')) : null;

            // Inicializa todas as 24 horas com 0 para garantir o eixo X
            const dadosHorarios = {};
            for (let i = 0; i < 24; i++) {
                dadosHorarios[i] = { totalSegundos: 0, countSessoes: 0 };
            }

            let logsProcessados = 0;

            lines.forEach(line => {
                // Regex permissiva: pega qualquer sessao_fim::WORK
                if (!/sessao_fim::\s*WORK/.test(line)) return;

                if (filtrarPorCiclo) {
                    const cicloMatch = line.match(/\(ciclo::\s*(\d+)\)/);
                    const cicloLog = cicloMatch ? parseInt(cicloMatch[1]) : 1; 
                    if (cicloLog !== numeroCicloAlvo) return;
                }

                // Regex de hora mais robusta
                const timeMatch = line.match(/\(log_time::\s*(\d{2}):\d{2}:\d{2}\)/);
                const duracaoMatch = line.match(/\(duracao_total_sessao_segundos::\s*(\d+)\)/);

                if (timeMatch && duracaoMatch) {
                    const hora = parseInt(timeMatch[1]); // Pega a hora cheia (0-23)
                    const segundos = parseInt(duracaoMatch[1]);

                    if (hora >= 0 && hora <= 23) {
                        dadosHorarios[hora].totalSegundos += segundos;
                        dadosHorarios[hora].countSessoes++;
                        logsProcessados++;
                    }
                }
            });

            const chartData = [];
            let maxMedia = 0;

            Object.keys(dadosHorarios).forEach(h => {
                const horaInt = parseInt(h);
                const dados = dadosHorarios[horaInt];
                // Calcula média
                const mediaSegundos = dados.countSessoes > 0 ? Math.round(dados.totalSegundos / dados.countSessoes) : 0;
                const mediaMinutos = Math.round(mediaSegundos / 60);
                
                if (mediaMinutos > maxMedia) maxMedia = mediaMinutos;

                chartData.push({
                    hora: `${horaInt}h`,
                    media: mediaMinutos,
                    mediaSeg: mediaSegundos,
                    tipo: "Média de Foco"
                });
            });

            // Se não processou nenhum log ou a média é 0 em tudo
            if (logsProcessados === 0 || maxMedia === 0) {
                // Retorna gráfico zerado mas funcional
                return `\`\`\`chartsview\ntype: ${viewMode === 'line' ? 'Line' : 'Column'}\ndata: [{"hora": "0h", "media": 0, "tipo": "Média"}]\noptions:\n  title: { text: "Nenhum padrão de horário detectado no ciclo", visible: true }\n\`\`\``;
            }

            // 4. CONFIGURAÇÃO VISUAL
            const chartType = viewMode === 'line' ? 'Line' : 'Column';
            
            let specificOptions = "";
            if (viewMode === 'column') {
                specificOptions = `
  columnStyle:
    radius: [4, 4, 0, 0]
    fillOpacity: 0.85
`;
            } else { // Line
                specificOptions = `
  smooth: true
  point:
    shape: circle
    size: 4
  area:
    style:
      fillOpacity: 0.2
`;
            }

            const yamlString = `
\`\`\`chartsview
type: ${chartType}
data: ${JSON.stringify(chartData)}
options:
  xField: 'hora'
  yField: 'media'
  seriesField: 'tipo'
  ${specificOptions}
  yAxis:
    title: { text: 'Média (min)', style: { fill: '#cccccc' } }
    min: 0
    grid:
      line:
        style:
          stroke: 'rgba(255, 255, 255, 0.1)'
          lineDash: [4, 4]
  xAxis: 
    title: { text: 'Hora do Dia', style: { fill: '#cccccc' } }
  color: ['#3498db']
  legend: false
  tooltip:
    fields: ['tipo', 'media', 'mediaSeg']
    formatter: |
      function(datum) {
        var secs = datum.mediaSeg;
        if (secs === undefined) secs = datum.media * 60;
        secs = Number(secs);

        var h = Math.floor(secs / 3600).toString().padStart(2, '0');
        var m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
        var s = (secs % 60).toString().padStart(2, '0');
        return { name: 'Duração Média', value: h + ':' + m + ':' + s };
      }
  title: { visible: true, text: 'Padrão Biológico: Média de Foco por Hora' }
\`\`\`
`;
            return yamlString.trim();

        } catch (e) {
            return `\`\`\`chartsview\ntype: Line\noptions:\n  title: { text: "ERRO: ${e.message.replace(/"/g, "'")}" }\n\`\`\``;
        }
    }
})();