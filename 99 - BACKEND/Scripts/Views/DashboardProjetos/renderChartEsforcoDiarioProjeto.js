// 99 - BACKEND/Scripts/Views/DashboardProjetos/renderChartEsforcoDiarioProjeto.js
// SOTA v1.2 - Fix NaN no Tooltip (Mapping Explícito)

(() => {
    return async function renderChart(dv, input) {
        try {
            const hubUID = input.hub_uid;
            const viewMode = input.view_mode || 'column';

            if (!hubUID) return `\`\`\`chartsview\ntype: Column\noptions:\n  title: { text: "Selecione um Projeto" }\n\`\`\``;

            const hub = dv.pages().where(p => p.sota_uid === hubUID)[0];
            if (!hub) return `\`\`\`chartsview\ntype: Column\noptions:\n  title: { text: "HUB não encontrado" }\n\`\`\``;

            const idProjeto = hub.id_projeto;
            const logPath = `99 - BACKEND/Logs_Metricas/Projetos/${idProjeto}/raw_logs.md`;
            const logFile = app.vault.getAbstractFileByPath(logPath);

            if (!logFile) return `\`\`\`chartsview\ntype: Column\noptions:\n  title: { text: "Sem dados de esforço" }\n\`\`\``;

            const content = await app.vault.cachedRead(logFile);
            const lines = content.split('\n');
            const dadosAgregados = {};

            lines.forEach(line => {
                if (!/sessao_fim::(WORK|BREAK)/.test(line)) return;

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
  xAxis: 
    title: { text: 'Data', style: { fill: '#cccccc' } }
    label: { autoRotate: true, autoHide: false }
  color: ['#3498db', '#f1c40f']
  legend: { position: 'top' }
  tooltip:
    fields: ['tipo', 'minutos', 'segundos']
    formatter: |
      function(datum) {
        // Fallback de Segurança: Se 'segundos' vier undefined, recalcula dos minutos
        var sVal = datum.segundos;
        if (sVal === undefined || sVal === null) {
            sVal = datum.minutos * 60; 
        }
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
            return `\`\`\`chartsview\ntype: Column\noptions:\n  title: { text: "ERRO: ${e.message.replace(/"/g, "'")}" }\n\`\`\``;
        }
    }
})();