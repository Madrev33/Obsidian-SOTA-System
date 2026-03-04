// SOTA - renderModalityDistribution.js v1.0
// Gráfico de Pizza comparando o tempo dedicado a cada modalidade.

(() => {
    return async function renderView(dv, input) {
        try {
            const logsRootPath = "99 - BACKEND/Logs_Metricas/Exercicios";
            const rootFolder = app.vault.getAbstractFileByPath(logsRootPath);
            
            // Stats por Tipo
            const stats = {
                Forca: 0,
                Cardio: 0,
                Isometrico: 0
            };

            // Precisamos saber o tipo de cada exercício. 
            // Como ler o Frontmatter de todos é lento, inferimos pelos campos do log.
            // Se tem 'distancia_km' > 0 -> Cardio
            // Se tem 'duracao' > 0 e 'reps' == 1 e 'carga' == 0 -> Isometria (Heurística)
            // Caso contrário -> Força

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
                    
                    const duracao = parseInt(line.match(/\(duracao_segundos::\s*(\d+)\)/)?.[1] || 0);
                    const distancia = parseFloat(line.match(/\(distancia_km::\s*([\d.]+)\)/)?.[1] || 0);
                    // const reps = parseInt(line.match(/\(reps_feito::\s*(\d+)\)/)?.[1] || 0); // Opcional para refinar isometria

                    if (duracao > 0) {
                        if (distancia > 0) {
                            stats.Cardio += duracao;
                        } else if (line.includes("tipo_resistencia::peso_corporal") || line.includes("isometria")) {
                            // Se tiver marcador explicito ou heuristica de isometria
                            // Como não temos marcador no log antigo, assumimos Força para tudo que não é cardio por enquanto
                            // Para ser SOTA v2, o Logger.ts deveria gravar o tipo_metrica no log.
                            stats.Forca += duracao; 
                        } else {
                            stats.Forca += duracao;
                        }
                    }
                });
            };

            await processarPasta(rootFolder);

            const totalTempo = stats.Forca + stats.Cardio + stats.Isometrico;
            if (totalTempo === 0) {
                dv.paragraph("ℹ️ Sem dados de tempo registrados.");
                return;
            }

            const chartData = [
                { tipo: "Força", valor: Math.round(stats.Forca / 60) },
                { tipo: "Cardio", valor: Math.round(stats.Cardio / 60) }
                // Isometria entra aqui se refinarmos a detecção
            ].filter(d => d.valor > 0);

            const yaml = `\`\`\`chartsview
type: Pie
data: ${JSON.stringify(chartData)}
options:
  angleField: 'valor'
  colorField: 'tipo'
  radius: 0.8
  innerRadius: 0.6
  label:
    type: 'spider'
    labelHeight: 28
    content: '{name}\\n{percentage}'
  title: { visible: true, text: 'Distribuição de Tempo (Min)' }
  legend: { position: 'bottom' }
\`\`\``;

            dv.paragraph(yaml);

        } catch (e) {
            dv.paragraph(`❌ Erro Modality: ${e.message}`);
        }
    }
})();