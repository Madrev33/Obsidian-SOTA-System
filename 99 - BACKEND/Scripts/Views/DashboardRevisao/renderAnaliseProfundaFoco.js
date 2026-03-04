// 99 - BACKEND/Scripts/Views/DashboardRevisao/renderAnaliseProfundaFoco.js
// SOTA v2.1 - Deep Focus Analytics (UX Refined: Clean Titles & Duration)
// Exibe nome da tarefa limpo e adiciona a duração exata da sessão.

(() => {
    return async function renderAnalysis(dv, input) {
        try {
            // 1. CONTEXTO (Inalterado)
            const dashboard = dv.current();
            let startDate = dashboard.start_date;
            let endDate = dashboard.end_date;
            const moment = window.moment;

            if (!startDate || !endDate) return `\`\`\`chartsview\ntype: Scatter\noptions:\n  title: { text: "Selecione um período" }\n\`\`\``;

            if (typeof startDate === 'string') startDate = startDate.substring(0, 10);
            if (typeof endDate === 'string') endDate = endDate.substring(0, 10);
            if (startDate.toFormat) startDate = startDate.toFormat('yyyy-MM-dd');
            if (endDate.toFormat) endDate = endDate.toFormat('yyyy-MM-dd');

            // 2. COLETA DE DADOS (Com novos campos)
            const logsPath = "99 - BACKEND/Logs_Metricas/Daily";
            const files = app.vault.getMarkdownFiles().filter(f => {
                return f.path.startsWith(logsPath) &&
                       f.basename >= startDate &&
                       f.basename <= endDate &&
                       /^\d{4}-\d{2}-\d{2}$/.test(f.basename);
            });

            if (files.length === 0) return `\`\`\`chartsview\ntype: Scatter\noptions:\n  title: { text: "Sem logs diários no período" }\n\`\`\``;

            const sessoes = [];

            for (const file of files) {
                const content = await app.vault.cachedRead(file);
                const lines = content.split('\n');
                
                lines.forEach(line => {
                    if (!line.includes("sessao_fim::WORK")) return;

                    // *** CORREÇÃO GRÁFICO: Usa a chave 'foco' ***
                    const focoMatch = line.match(/\(foco::\s*(\d+)\)/);
                    const timeMatch = line.match(/\(log_time::\s*(\d{2}):(\d{2}):\d{2}\)/);
                    const duracaoMatch = line.match(/\(duracao_total_sessao_segundos::\s*(\d+)\)/);
                    const soberaniaMatch = line.match(/\(soberania::\s*(interna|externa)\)/);
                    const tarefaMatch = line.match(/\(tarefa_focada::"(.*?)"\)/);
                    const feitoMatch = line.match(/\(feito::"(.*?)"\)/);
                    const melhoraMatch = line.match(/\(melhora::"(.*?)"\)/);

                    if (focoMatch && timeMatch) {
                        const nota = parseInt(focoMatch[1]);
                        // *** MELHORIA DURAÇÃO: Captura segundos brutos ***
                        const duracaoSeg = duracaoMatch ? parseInt(duracaoMatch[1]) : 0;
                        const duracaoMin = Math.round(duracaoSeg / 60);
                        
                        const horaFimDecimal = parseInt(timeMatch[1]) + (parseInt(timeMatch[2]) / 60);
                        let hora = horaFimDecimal - (duracaoMin / 60 / 2);
                        if (hora < 0) hora += 24; 

                        const soberania = soberaniaMatch ? soberaniaMatch[1] : "indefinida";
                        const tarefa = tarefaMatch ? tarefaMatch[1] : "Tarefa sem nome";

                        sessoes.push({
                            data: file.basename,
                            horaDecimal: hora,
                            nota: nota,
                            duracao: duracaoMin,
                            duracaoSegundos: duracaoSeg, // Armazena segundos
                            soberania: soberania === 'interna' ? 'Interna (Eu)' : (soberania === 'externa' ? 'Externa (Outros)' : 'Indefinida'),
                            tarefa: tarefa,
                            feito: feitoMatch ? feitoMatch[1] : null,
                            melhora: melhoraMatch ? melhoraMatch[1] : null
                        });
                    }
                });
            }

            if (sessoes.length === 0) return `\`\`\`chartsview\ntype: Scatter\noptions:\n  title: { text: "Nenhuma sessão avaliada no período" }\n\`\`\``;

            // 3. PREPARAÇÃO DO GRÁFICO (Inalterado)
            const chartData = sessoes.map(s => ({
                hora: s.horaDecimal,
                nota: s.nota,
                soberania: s.soberania,
                duracao: s.duracao,
                tarefa: s.tarefa,
                data: s.data
            }));

            // Gráfico YAML (Inalterado)
            const scatterYaml = `
\`\`\`chartsview
type: Scatter
data: ${JSON.stringify(chartData)}
options:
  xField: 'hora'
  yField: 'nota'
  colorField: 'soberania'
  sizeField: 'duracao'
  size: [4, 10]
  shape: 'circle'
  color: ['#95a5a6', '#f1c40f', '#34495e']
  xAxis:
    title: { text: 'Hora do Dia (0-24h)', style: { fill: '#cccccc' } }
    min: 0
    max: 24
    grid: { line: { style: { stroke: '#333', lineDash: [4, 4] } } }
  yAxis:
    title: { text: 'Nota de Foco (0-10)', style: { fill: '#cccccc' } }
    min: 0
    max: 10
    grid: { line: { style: { stroke: '#333' } } }
  legend: { position: 'top' }
  tooltip:
    fields: ['soberania', 'hora', 'nota', 'duracao'] 
    formatter: |
      function(datum) {
        var h = Math.floor(datum.hora);
        var m = Math.round((datum.hora - h) * 60);
        var horaFormatada = h + 'h' + (m < 10 ? '0' : '') + m;
        return { 
            name: datum.soberania, 
            value: 'Nota: ' + datum.nota + ' | ' + datum.duracao + ' min | ' + horaFormatada 
        };
      }
  title: { visible: true, text: 'Matriz de Qualidade de Foco (Tamanho = Duração)' }
\`\`\`
`;
            
            // --- INÍCIO DAS MELHORIAS DE RENDERIZAÇÃO ---
            
            // 4. PREPARAÇÃO DAS TABELAS (Falhas e Sucessos)
            const sessoesFalha = sessoes.filter(s => s.nota <= 6).sort((a, b) => b.data.localeCompare(a.data) || b.horaDecimal - a.horaDecimal).slice(0, 10);
            const sessoesSucesso = sessoes.filter(s => s.nota >= 8).sort((a, b) => b.data.localeCompare(a.data) || b.horaDecimal - a.horaDecimal).slice(0, 10);

            // *** NOVA FUNÇÃO: Limpa e formata o nome da tarefa ***
            const formatarNomeTarefa = (tarefaBruta) => {
                if (!tarefaBruta) return "N/A";
                return tarefaBruta
                    .replace(/\[🍅::.*?\]/g, '') // Remove contador
                    .replace(/#\S+/g, '')          // Remove todas as tags
                    .replace(/\*\*/g, '')          // Remove negrito
                    .trim();
            };
            
            // *** NOVA FUNÇÃO: Formata segundos para HH:MM:SS ***
            const formatarHHMMSS = (segundos) => {
                if (isNaN(segundos)) return '00:00:00';
                const h = Math.floor(segundos / 3600).toString().padStart(2, '0');
                const m = Math.floor((segundos % 3600) / 60).toString().padStart(2, '0');
                const s = (segundos % 60).toString().padStart(2, '0');
                return `${h}:${m}:${s}`;
            };

            const gerarTabelaHTML = (titulo, dados, campoQualitativo, icone, cor) => {
                let html = `<div style="flex:1; background:var(--background-secondary); border:1px solid var(--background-modifier-border); border-radius:8px; padding:15px;">`;
                html += `<div style="font-weight:bold; color:var(--text-normal); margin-bottom:10px; border-bottom:1px solid var(--background-modifier-border); padding-bottom:5px;">${icone} ${titulo}</div>`;
                if (dados.length === 0) {
                    html += `<div style="font-size:0.85em; color:var(--text-muted); font-style:italic;">Sem registros nesta categoria.</div>`;
                } else {
                    html += `<table style="width:100%; font-size:0.85em; border-collapse:collapse;">
                                <tr style="text-align:left; border-bottom:1px solid var(--text-faint);">
                                    <th style="padding:5px;">Data</th>
                                    <th style="padding:5px;">Nota</th>
                                    <th style="padding:5px;">Tarefa</th>
                                    <th style="padding:5px;">Duração</th>
                                    <th style="padding:5px;">${campoQualitativo.label}</th>
                                </tr>`;
                    dados.forEach(s => {
                        html += `<tr style="border-bottom:1px solid var(--background-modifier-border);">
                                    <td style="padding:5px; color:var(--text-muted);">${window.moment(s.data).format("DD/MM")}</td>
                                    <td style="padding:5px; font-weight:bold; color:${cor};">${s.nota}</td>
                                    <td style="padding:5px;">${formatarNomeTarefa(s.tarefa).substring(0, 35)}${s.tarefa.length > 35 ? '' : ''}</td>
                                    <td style="padding:5px; font-family:monospace; color:var(--text-muted);">${formatarHHMMSS(s.duracaoSegundos)}</td>
                                    <td style="padding:5px; color:var(--text-accent);">${s[campoQualitativo.key] || "-"}</td>
                                 </tr>`;
                    });
                    html += `</table>`;
                }
                html += `</div>`;
                return html;
            };

            const htmlTabelas = `
<div style="display:flex; flex-direction: column; gap:15px; margin-top:15px; margin-bottom:15px;">
    ${gerarTabelaHTML("Análise de Falhas (Notas ≤ 6)", sessoesFalha, {key: "melhora", label: "Sugestão de Melhora"}, "📉", "#e74c3c")}
    ${gerarTabelaHTML("Análise de Sucessos (Notas ≥ 8)", sessoesSucesso, {key: "feito", label: "O que foi Feito"}, "📈", "#2ecc71")}
</div>
`;
            // --- FIM DAS MELHORIAS DE RENDERIZAÇÃO ---

            return scatterYaml + htmlTabelas;

        } catch (e) {
            return `\`\`\`chartsview\ntype: Scatter\noptions:\n  title: { text: "ERRO: ${e.message.replace(/"/g, "'")}" }\n\`\`\``;
        }
    }
})();