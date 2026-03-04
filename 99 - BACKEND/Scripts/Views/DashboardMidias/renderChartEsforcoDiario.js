// 99 - BACKEND/Scripts/Views/DashboardMidias/renderChartEsforcoDiario.js
// SOTA v2.0 - Gráfico de Esforço Diário (Correção HH:mm:ss e Estilo Dash)

(() => {
    return async function renderChart(dv, input) {
        try {
            // 1. CONTEXTO
            const dashboard = dv.current();
            const idMidia = dashboard.midia_selecionada_id;
            const cicloSelecionado = dashboard.ciclo_selecionado_view;
            const viewMode = dashboard.view_mode_esforco || 'column';

            if (!idMidia) return `\`\`\`chartsview\ntype: Line\noptions:\n  title: { text: "Selecione uma mídia" }\n\`\`\``;

            // 2. LOCALIZAR LOGS
            const hub = dv.pages().where(p => p.id_midia === idMidia && p.file.path.includes("00. HUB"))[0];
            if (!hub) return `\`\`\`chartsview\ntype: Line\noptions:\n  title: { text: "HUB não encontrado" }\n\`\`\``;

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

            if (!logFile) return `\`\`\`chartsview\ntype: Line\noptions:\n  title: { text: "Sem dados de esforço" }\n\`\`\``;

            // 3. PROCESSAMENTO DE DADOS
            const content = await app.vault.cachedRead(logFile);
            const lines = content.split('\n');
            
            const filtrarPorCiclo = cicloSelecionado && !cicloSelecionado.toLowerCase().includes("todos");
            const numeroCicloAlvo = filtrarPorCiclo ? parseInt(cicloSelecionado.replace(/\D/g, '')) : null;

            const dadosAgregados = {}; 

            lines.forEach(line => {
                if (!/sessao_fim::(WORK|BREAK)/.test(line)) return;

                if (filtrarPorCiclo) {
                    const cicloMatch = line.match(/\(ciclo::\s*(\d+)\)/);
                    const cicloLog = cicloMatch ? parseInt(cicloMatch[1]) : 1; 
                    if (cicloLog !== numeroCicloAlvo) return;
                }

                const dateMatch = line.match(/\(log_date::\s*(\d{4}-\d{2}-\d{2})\)/);
                const duracaoMatch = line.match(/\(duracao_total_sessao_segundos::\s*(\d+)\)/);
                const tipoMatch = line.match(/\(sessao_fim::(WORK|BREAK)\)/);

                if (dateMatch && duracaoMatch && tipoMatch) {
                    const date = dateMatch[1];
                    const segundos = parseInt(duracaoMatch[1]);
                    // Armazena segundos para precisão
                    const tipoSessao = tipoMatch[1] === 'WORK' ? 'Foco' : 'Pausa';
                    
                    if (!dadosAgregados[date]) dadosAgregados[date] = { Foco: 0, Pausa: 0 };
                    dadosAgregados[date][tipoSessao] += segundos;
                }
            });

            const chartData = [];
            Object.keys(dadosAgregados).sort().forEach(date => {
                // Converte para minutos APENAS para o eixo Y visual
                const minFoco = Math.round(dadosAgregados[date].Foco / 60);
                const minPausa = Math.round(dadosAgregados[date].Pausa / 60);

                chartData.push({ 
                    dia: date, 
                    tipo: "Foco", 
                    minutos: minFoco, 
                    segundos: dadosAgregados[date].Foco // Dado bruto oculto
                });
                chartData.push({ 
                    dia: date, 
                    tipo: "Pausa", 
                    minutos: minPausa, 
                    segundos: dadosAgregados[date].Pausa 
                });
            });

            if (chartData.length === 0) {
                return `\`\`\`chartsview\ntype: ${viewMode === 'line' ? 'Line' : 'Column'}\ndata: [{"dia": "Sem Dados", "tipo": "Foco", "minutos": 0}]\noptions:\n  title: { text: "Nenhum dado encontrado para este ciclo", visible: true }\n\`\`\``;
            }

            // 4. CONFIGURAÇÃO VISUAL
            const chartType = viewMode === 'line' ? 'Line' : 'Column';
            
            let specificOptions = "";
            if (viewMode === 'column') {
                specificOptions = `
  isGroup: true
  columnStyle:
    radius: [4, 4, 0, 0]
`;
            } else { // Line
                specificOptions = `
  smooth: true
  point:
    shape: circle
    size: 3
`;
            }

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
    label:
      formatter: |
        function(value) {
          return value + 'm';
        }
    grid:
      line:
        style:
          stroke: 'rgba(255, 255, 255, 0.1)'
          lineDash: [4, 4]
  xAxis: 
    title: { text: 'Data', style: { fill: '#cccccc' } }
    label: { autoRotate: true, autoHide: false }
  color: ['#79c0ff', '#e99b00']
  legend: { position: 'top' }
  tooltip:
    fields: ['tipo', 'minutos', 'segundos']
    formatter: |
      function(datum) {
        var sVal = datum.segundos;
        if (sVal === undefined) sVal = datum.minutos * 60;
        var secs = Number(sVal);

        var h = Math.floor(secs / 3600).toString().padStart(2, '0');
        var m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
        var s = (secs % 60).toString().padStart(2, '0');
        return { name: datum.tipo, value: h + ':' + m + ':' + s };
      }
  title: { visible: true, text: 'Esforço Diário: Foco vs. Pausa' }
\`\`\`
`;
            return yamlString.trim();

        } catch (e) {
            return `\`\`\`chartsview\ntype: Line\noptions:\n  title: { text: "ERRO NO SCRIPT: ${e.message.replace(/"/g, "'")}" }\n\`\`\``;
        }
    }
})();