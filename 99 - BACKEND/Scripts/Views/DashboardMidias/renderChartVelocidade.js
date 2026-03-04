// 99 - BACKEND/Scripts/Views/DashboardMidias/renderChartVelocidade.js
// SOTA v2.3 - Gráfico de Velocidade (Correção de Unicidade por Ciclo)

(() => {
    return async function renderChart(dv, input) {
        try {
            // ... (Contexto e Localização iguais) ...
            const dashboard = dv.current();
            const idMidia = dashboard.midia_selecionada_id;
            const cicloSelecionado = dashboard.ciclo_selecionado_view;
            const viewMode = dashboard.view_mode_velocidade || 'line';

            if (!idMidia) return `\`\`\`chartsview\ntype: Line\noptions:\n  title: { text: "Selecione uma mídia" }\n\`\`\``;

            const hub = dv.pages().where(p => p.id_midia === idMidia && p.file.path.includes("00. HUB"))[0];
            if (!hub) return `\`\`\`chartsview\ntype: Line\noptions:\n  title: { text: "HUB não encontrado" }\n\`\`\``;

            const sanitizar = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[-\s]+/g, '_').replace(/[^\w_]+/g, '') : "";
            
            // ... (Configuração Unificada igual) ...
            let tipoPasta = "Outros";
            let unidadeLabel = "Unidades";
            let regexUnidade = null;
            let regexContexto = null; 

            const tipo = hub.tipo || "";
            // ... (Blocos if/else if de tipos mantidos iguais) ...
            if (tipo.includes("livro")) { 
                tipoPasta = "Livros"; 
                unidadeLabel = "Páginas"; 
                regexUnidade = /\(pagina_fim::\s*(\d+)\)/; 
                regexContexto = null; 
            }
            else if (tipo.includes("artigo")) { 
                tipoPasta = "Artigos"; 
                unidadeLabel = "Páginas"; 
                regexUnidade = /\(pagina_fim::\s*(\d+)\)/;
                regexContexto = null; 
            }
            else if (tipo.includes("documentacao")) { 
                tipoPasta = "Documentacoes"; 
                unidadeLabel = "Páginas"; 
                regexUnidade = /\(pagina_fim::\s*(\d+)\)/; 
            }
            else if (tipo.includes("curso")) { 
                tipoPasta = "Cursos"; 
                unidadeLabel = "Aulas"; 
                regexUnidade = /\(aula_inicio::\s*(\d+)\)/; 
                regexContexto = /\(modulo::\s*(\d+)\)/;
            }
            else if (tipo.includes("serie")) { 
                tipoPasta = "Series"; 
                unidadeLabel = "Episódios"; 
                regexUnidade = /\(episodio_inicio::\s*(\d+)\)/; 
                regexContexto = /\(temporada::\s*(\d+)\)/;
            }
            else if (tipo.includes("documentario")) { 
                tipoPasta = "Documentarios"; 
                unidadeLabel = "Episódios"; 
                regexUnidade = /\(episodio_(?:inicio|fim)::\s*(\d+)\)/; 
                regexContexto = /\(temporada::\s*(\d+)\)/;
            }
            else if (tipo.includes("podcast")) { 
                tipoPasta = "Podcasts"; 
                unidadeLabel = "Episódios"; 
                regexUnidade = /\(episodio_(?:inicio|fim)::\s*(\d+)\)/; 
                regexContexto = /\(temporada::\s*(\d+)\)/;
            }
            else if (tipo.includes("jogo")) { 
                tipoPasta = "Jogos"; 
                unidadeLabel = "Missões"; 
                regexUnidade = /\(missao::\s*(\d+)\)/; 
            }
            else {
                return `\`\`\`chartsview\ntype: Line\noptions:\n  title: { text: "Métrica de velocidade não aplicável para este tipo" }\n\`\`\``;
            }

            const idSanitizado = sanitizar(hub.file.name.replace(/00\. HUB - |HUB - /g, '')) || idMidia;
            const logPath = `99 - BACKEND/Logs_Metricas/${tipoPasta}/${idSanitizado}/raw_logs.md`;
            const logFile = app.vault.getAbstractFileByPath(logPath);

            if (!logFile) return `\`\`\`chartsview\ntype: Line\noptions:\n  title: { text: "Sem dados de consumo" }\n\`\`\``;

            // 3. PROCESSAMENTO DE DADOS
            const content = await app.vault.cachedRead(logFile);
            const lines = content.split('\n');
            
            const filtrarPorCiclo = cicloSelecionado && !cicloSelecionado.toLowerCase().includes("todos");
            const numeroCicloAlvo = filtrarPorCiclo ? parseInt(cicloSelecionado.replace(/\D/g, '')) : null;

            const itensPorDia = {}; 

            lines.forEach(line => {
                // Filtro de Linha Robusto
                if (!line.includes("sessao_fim") && 
                    !line.includes("_fim::") && 
                    !line.includes("aula_inicio") && 
                    !line.includes("episodio_inicio")) return;

                // Captura de Ciclo
                const cicloMatch = line.match(/\(ciclo::\s*(\d+)\)/);
                const cicloLog = cicloMatch ? parseInt(cicloMatch[1]) : 1; // Default 1 se não achar

                if (filtrarPorCiclo) {
                    if (cicloLog !== numeroCicloAlvo) return;
                }

                const dateMatch = line.match(/\(log_date::\s*(\d{4}-\d{2}-\d{2})\)/);
                const itemMatch = line.match(regexUnidade);
                const contextoMatch = regexContexto ? line.match(regexContexto) : null;

                if (regexContexto && !contextoMatch) return;

                if (dateMatch && itemMatch) {
                    const date = dateMatch[1];
                    const itemNum = itemMatch[1];
                    const contextoNum = contextoMatch ? contextoMatch[1] : "0"; 

                    // CORREÇÃO: Chave inclui CICLO para diferenciar releituras/rewatch
                    // "Ciclo-Contexto-Item" (Ex: "1-1-1" = C1 T1 E1 / "2-1-1" = C2 T1 E1)
                    const chaveUnica = `${cicloLog}-${contextoNum}-${itemNum}`;

                    if (!itensPorDia[date]) itensPorDia[date] = new Set();
                    itensPorDia[date].add(chaveUnica);
                }
            });

            // ... (Resto do código igual: chartData, config visual, yaml) ...
            const chartData = [];
            Object.keys(itensPorDia).sort().forEach(date => {
                const qtd = itensPorDia[date].size;
                if (qtd > 0) {
                    chartData.push({ dia: date, qtd: qtd, tipo: unidadeLabel });
                }
            });

            if (chartData.length === 0) {
                return `\`\`\`chartsview\ntype: ${viewMode === 'line' ? 'Line' : 'Column'}\ndata: [{"dia": "Sem Dados", "qtd": 0, "tipo": "${unidadeLabel}"}]\noptions:\n  title: { text: "Nenhum progresso registrado neste ciclo", visible: true }\n\`\`\``;
            }

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
  lineStyle:
    lineWidth: 3
`;
            }
            const yamlString = `
\`\`\`chartsview
type: ${chartType}
data: ${JSON.stringify(chartData)}
options:
  xField: 'dia'
  yField: 'qtd'
  seriesField: 'tipo'
  ${specificOptions}
  yAxis:
    title: { text: '${unidadeLabel}', style: { fill: '#cccccc' } }
    min: 0
    grid:
      line:
        style:
          stroke: 'rgba(255, 255, 255, 0.1)'
          lineDash: [4, 4]
  xAxis: 
    title: { text: 'Data', style: { fill: '#cccccc' } }
    label: { autoRotate: true, autoHide: false }
  color: ['#39d353']
  legend: { position: 'top' }
  tooltip:
    formatter: |
      function(datum) {
        return { name: datum.tipo, value: datum.qtd };
      }
  title: { visible: true, text: 'Velocidade: ${unidadeLabel} por Dia' }
\`\`\`
`;
            return yamlString.trim();

        } catch (e) {
            return `\`\`\`chartsview\ntype: Line\noptions:\n  title: { text: "ERRO: ${e.message.replace(/"/g, "'")}" }\n\`\`\``;
        }
    }
})();