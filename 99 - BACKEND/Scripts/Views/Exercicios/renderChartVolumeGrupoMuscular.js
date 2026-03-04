// 99 - BACKEND/Scripts/Views/Exercicios/renderChartVolumeGrupoMuscular.js
// SOTA v3.1 - Gráfico de Evolução de Volume (Força Pura / Tonelagem)

(() => {
    return async function renderChart(dv, input) {
        try {
            // 1. CONTEXTO
            const grupoMuscularId = input.grupo_muscular_id || dv.current().grupo_muscular_id;

            if (!grupoMuscularId) {
                return `\`\`\`chartsview\ntype: Line\noptions:\n  title: { text: "Grupo muscular não identificado" }\n\`\`\``;
            }

            // 2. MAPEAMENTO DE EXERCÍCIOS DO GRUPO
            const exerciciosDoGrupoSet = new Set(
                dv.pages(`"04 - Corpo & Movimento/01 - Exercícios Físicos/01. Manual/Exercícios"`)
                    .where(p => p.tipo === 'manual_exercicio' && p.grupo_muscular_primario === grupoMuscularId)
                    .map(p => p.exercicio_id)
                    .values
            );

            if (exerciciosDoGrupoSet.size === 0) {
                return `\`\`\`chartsview\ntype: Line\noptions:\n  title: { text: "Nenhum exercício vinculado a este grupo" }\n\`\`\``;
            }

            // 3. AGREGAÇÃO DE DADOS (FORÇA PURA)
            const volumePorDia = {}; // { "YYYY-MM-DD": volume_kg }
            let logsProcessados = 0;

            for (const exercicioId of exerciciosDoGrupoSet) {
                const logPath = `99 - BACKEND/Logs_Metricas/Exercicios/${grupoMuscularId}/${exercicioId}/raw_logs.md`;
                const file = app.vault.getAbstractFileByPath(logPath);
                
                if (file) {
                    const content = await app.vault.cachedRead(file);
                    const lines = content.split('\n');
                    
                    lines.forEach(line => {
                        if (!line.includes("(sessao_fim::WORK)")) return;

                        // Verifica se é Cardio (Se tiver distancia > 0, IGNORA)
                        const distancia = parseFloat(line.match(/\(distancia_km::\s*([\d.]+)\)/)?.[1] || '0');
                        if (distancia > 0) return; 

                        const dataMatch = line.match(/\(log_date::\s*(\d{4}-\d{2}-\d{2})\)/);
                        if (!dataMatch) return;
                        
                        const data = dataMatch[1];
                        
                        // Extração de Força (Carga x Reps)
                        const carga = parseFloat(line.match(/\(carga_kg::\s*([\d.]+)\)/)?.[1] || '0');
                        const reps = parseInt(line.match(/\(reps_feito::\s*(\d+)\)/)?.[1] || '0');
                        
                        const volSessao = carga * reps; 

                        if (volSessao > 0) {
                            volumePorDia[data] = (volumePorDia[data] || 0) + volSessao;
                            logsProcessados++;
                        }
                    });
                }
            }

            if (logsProcessados === 0) {
                return `\`\`\`chartsview\ntype: Line\noptions:\n  title: { text: "Sem histórico de carga para este grupo", visible: true }\n\`\`\``;
            }

            // 4. FORMATAÇÃO
            const chartData = Object.entries(volumePorDia)
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([dia, vol]) => ({
                    data: dia,
                    volume: Math.round(vol),
                    tipo: "Tonelagem"
                }));

            // 5. GERAÇÃO DO YAML
            const yamlString = `
\`\`\`chartsview
type: Line
data: ${JSON.stringify(chartData)}
options:
  xField: 'data'
  yField: 'volume'
  seriesField: 'tipo'
  smooth: true
  point:
    shape: circle
    size: 4
  lineStyle:
    lineWidth: 3
  area:
    style:
      fillOpacity: 0.15
  yAxis:
    title: { text: 'Volume Total (kg)', style: { fill: '#cccccc' } }
    label:
      formatter: |
        function(v) { return (v/1000).toFixed(1) + 'k'; }
  xAxis:
    title: { text: 'Data', style: { fill: '#cccccc' } }
    label: { autoRotate: true, autoHide: false }
  color: '#3498db'
  tooltip:
    formatter: |
      function(datum) {
        return { name: 'Tonelagem', value: datum.volume.toLocaleString('pt-BR') + ' kg' };
      }
  title: { visible: true, text: 'Evolução de Volume (Força): ${grupoMuscularId.toUpperCase()}' }
\`\`\`
`;
            return yamlString.trim();

        } catch (e) {
            return `\`\`\`chartsview\ntype: Line\noptions:\n  title: { text: "ERRO: ${e.message.replace(/"/g, "'")}" }\n\`\`\``;
        }
    }
})();