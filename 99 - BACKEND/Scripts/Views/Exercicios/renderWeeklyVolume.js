// SOTA - renderWeeklyVolume.js v1.0
// Plota o volume de carga (kg) agregado por semana do ano.

(() => {
    return async function renderView(dv, input) {
        try {
            // --- 1. CARREGAMENTO DE DADOS ---
            const logsRootPath = "99 - BACKEND/Logs_Metricas/Exercicios";
            const rootFolder = app.vault.getAbstractFileByPath(logsRootPath);
            
            const volumePorSemana = {}; // { "YYYY-WW": volume }

            const processarPasta = async (pasta) => {
                if (!pasta.children) return;
                for (const child of pasta.children) {
                    if (child.name === "raw_logs.md") await lerLog(child);
                    else if (!child.extension) await processarPasta(child);
                }
            };

            const lerLog = async (file) => {
                const content = await app.vault.cachedRead(file);
                const lines = content.split('\n');
                
                lines.forEach(line => {
                    if (!line.includes("(sessao_fim::WORK)")) return;
                    
                    // Extrai Carga e Reps
                    const carga = parseFloat(line.match(/\(carga_kg::\s*([\d.]+)\)/)?.[1] || 0);
                    const reps = parseInt(line.match(/\(reps_feito::\s*(\d+)\)/)?.[1] || 0);
                    const data = line.match(/\(log_date::\s*(\d{4}-\d{2}-\d{2})\)/)?.[1];

                    if (data && carga > 0 && reps > 0) {
                        const semana = window.moment(data).format("YYYY-[W]WW");
                        const vol = carga * reps;
                        volumePorSemana[semana] = (volumePorSemana[semana] || 0) + vol;
                    }
                });
            };

            await processarPasta(rootFolder);

            // --- 2. PREPARAÇÃO PARA CHARTSVIEW ---
            // Pega as últimas 12 semanas para não poluir
            const semanasOrdenadas = Object.keys(volumePorSemana).sort().slice(-12);
            
            if (semanasOrdenadas.length === 0) {
                dv.paragraph("ℹ️ Sem dados de volume de carga (Força) registrados.");
                return;
            }

            const chartData = semanasOrdenadas.map(sem => ({
                semana: sem,
                volume: Math.round(volumePorSemana[sem]),
                tipo: "Volume (kg)"
            }));

            const yaml = `\`\`\`chartsview
type: Column
data: ${JSON.stringify(chartData)}
options:
  xField: 'semana'
  yField: 'volume'
  seriesField: 'tipo'
  color: '#3498db'
  columnStyle:
    radius: [4, 4, 0, 0]
  yAxis:
    title: { text: 'Tonelagem (kg)' }
    label:
      formatter: |
        function(v) { return (v/1000).toFixed(0) + 't'; }
  title: { visible: true, text: 'Volume Sistêmico Semanal' }
\`\`\``;

            dv.paragraph(yaml);

        } catch (e) {
            dv.paragraph(`❌ Erro WeeklyVolume: ${e.message}`);
        }
    }
})();