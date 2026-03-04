// 99 - BACKEND/Scripts/Views/Daily/renderChartFocoDiario.js
// SOTA v3.0 - Ritmo Completo (Foco, Pausa e Treino)
// Inclui sessões de exercício na visualização cronológica.

(() => {
    return async function renderChart(dv, input) {
        try {
            // 1. Identificar a DATA da nota atual
            const page = dv.current();
            const dateStr = page.file.name;
            
            if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                return `\`\`\`chartsview\ntype: Column\noptions:\n  title: { text: "Nome do arquivo não é uma data válida" }\n\`\`\``;
            }

            // 2. Construir o caminho do Log Backend
            const logPath = `99 - BACKEND/Logs_Metricas/Daily/${dateStr}.md`;
            const logFile = app.vault.getAbstractFileByPath(logPath);

            if (!logFile) {
                return `\`\`\`chartsview\ntype: Column\noptions:\n  title: { text: "Sem logs de foco para hoje" }\n\`\`\``;
            }

            // 3. Ler o conteúdo bruto
            const content = await app.vault.cachedRead(logFile);
            const lines = content.split('\n');
            
            // Inicializa estrutura de dados (foco, pausa, treino)
            const dadosHorarios = {};
            for (let i = 0; i < 24; i++) { dadosHorarios[i] = { foco: 0, pausa: 0, treino: 0 }; }

            let dadosEncontrados = false;

            // 4. Processamento de Precisão (Distribuição Matemática)
            lines.forEach(line => {
                if (!line.includes("(sessao_fim::")) return;

                const timeMatch = line.match(/\(log_time::\s*(\d{2}):(\d{2}):(\d{2})\)/);
                const duracaoMatch = line.match(/\(duracao_total_sessao_segundos::\s*(\d+)\)/) || line.match(/\(duracao_segundos::\s*(\d+)\)/);
                const tipoMatch = line.match(/\(sessao_fim::(WORK|BREAK)\)/);

                if (timeMatch && duracaoMatch && tipoMatch) {
                    let tipo = 'foco';
                    
                    // Identificação do Tipo
                    if (tipoMatch[1] === 'BREAK') {
                        tipo = 'pausa';
                    } else if (line.includes("#exercicio/") || line.includes("(exercicio_id::")) {
                        tipo = 'treino';
                    }
                    
                    let duracaoRestanteSeg = parseInt(duracaoMatch[1], 10);

                    if (duracaoRestanteSeg <= 0) return;

                    // Converte o tempo de FIM para segundos totais no dia
                    const fimH = parseInt(timeMatch[1]);
                    const fimM = parseInt(timeMatch[2]);
                    const fimS = parseInt(timeMatch[3]);
                    const fimTotalSeg = fimH * 3600 + fimM * 60 + fimS;
                    
                    // Calcula o tempo de INÍCIO em segundos totais no dia
                    const inicioTotalSeg = fimTotalSeg - duracaoRestanteSeg;

                    let cursorSeg = inicioTotalSeg;

                    while (cursorSeg < fimTotalSeg) {
                        // Descobre em qual "slot" de hora o cursor está
                        const horaAtual = Math.floor(cursorSeg / 3600);

                        // Calcula o próximo limite de hora em segundos
                        const proximaHoraSeg = (horaAtual + 1) * 3600;

                        // O fim do segmento é o que vier primeiro
                        const fimSegmentoSeg = Math.min(fimTotalSeg, proximaHoraSeg);

                        // A duração nesta hora é a diferença
                        const segundosNestaHora = fimSegmentoSeg - cursorSeg;

                        if (segundosNestaHora > 0 && horaAtual >= 0 && horaAtual <= 23) {
                            dadosHorarios[horaAtual][tipo] += segundosNestaHora;
                            dadosEncontrados = true;
                        }

                        // Avança o cursor
                        cursorSeg = fimSegmentoSeg;
                    }
                }
            });

            if (!dadosEncontrados) {
                 return `\`\`\`chartsview\ntype: Column\noptions:\n  title: { text: "Nenhuma sessão válida nos logs" }\n\`\`\``;
            }

            // 5. Determinar o intervalo de horas ativas
            let minHora = 23;
            let maxHora = 0;
            
            Object.keys(dadosHorarios).forEach(h => {
                const horaInt = parseInt(h, 10);
                if (dadosHorarios[horaInt].foco > 0 || dadosHorarios[horaInt].pausa > 0 || dadosHorarios[horaInt].treino > 0) {
                    if (horaInt < minHora) minHora = horaInt;
                    if (horaInt > maxHora) maxHora = horaInt;
                }
            });

            if (minHora === maxHora) {
                minHora = Math.max(0, minHora - 1);
                maxHora = Math.min(23, maxHora + 1);
            }

            // 6. Montagem do Dataset Contínuo
            const chartData = [];
            for (let h = minHora; h <= maxHora; h++) {
                const focoSeg = dadosHorarios[h].foco;
                const pausaSeg = dadosHorarios[h].pausa;
                const treinoSeg = dadosHorarios[h].treino;
                
                chartData.push({ 
                    hora: `${h}h`, valor: parseFloat((focoSeg / 3600).toFixed(3)), segundos: focoSeg, tipo: "Foco" 
                });
                chartData.push({ 
                    hora: `${h}h`, valor: parseFloat((pausaSeg / 3600).toFixed(3)), segundos: pausaSeg, tipo: "Pausa" 
                });
                chartData.push({ 
                    hora: `${h}h`, valor: parseFloat((treinoSeg / 3600).toFixed(3)), segundos: treinoSeg, tipo: "Treino" 
                });
            }
            
            // 7. Renderização
            const viewMode = input.view_mode || 'column';
            const chartType = viewMode === 'line' ? 'Line' : 'Column';
            
            let specificOptions = "";
            if (viewMode === 'column') {
                specificOptions = `
  isStack: true
  columnStyle:
    radius: [4, 4, 0, 0]
`;
            } else {
                specificOptions = `
  smooth: true
  point:
    shape: 'circle'
    size: 3
`;
            }

            const yamlString = `
\`\`\`chartsview
type: ${chartType}
data: ${JSON.stringify(chartData)}
options:
  xField: 'hora'
  yField: 'valor'
  seriesField: 'tipo'
  ${specificOptions}
  yAxis:
    title: { text: 'Horas', style: { fill: '#cccccc' } }
  xAxis: 
    title: { text: 'Hora do Dia', style: { fill: '#cccccc' } }
  color: ['#79c0ff', '#e67e22', '#2ecc71']
  legend: { position: 'top' }
  tooltip:
    fields: ['tipo', 'valor', 'segundos']
    formatter: |
      function(datum) {
        var secs = Number(datum.segundos || 0);
        var h = Math.floor(secs / 3600).toString().padStart(2, '0');
        var m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
        var s = (secs % 60).toString().padStart(2, '0');
        return { name: datum.tipo, value: h + ':' + m + ':' + s };
      }
  title: { visible: true, text: 'Ritmo de Trabalho & Treino' }
\`\`\`
`;
            return yamlString.trim();

        } catch (e) {
            return `\`\`\`chartsview\ntype: Column\noptions:\n  title: { text: "ERRO: ${e.message.replace(/"/g, "'")}" }\n\`\`\``;
        }
    }
})();