// 99 - BACKEND/Scripts/Views/Exercicios/renderChartDistribuicaoExercicios.js
// SOTA v2.3 - Fix: Tooltip Undefined (Fields Declaration)

(() => {
    return async function renderChart(dv, input) {
        try {
            // 1. CONTEXTO E VALIDAÇÃO
            const grupoMuscularId = input.grupo_muscular_id || dv.current().grupo_muscular_id;

            if (!grupoMuscularId) {
                return `\`\`\`chartsview\ntype: Column\noptions:\n  title: { text: "Grupo muscular não identificado" }\n\`\`\``;
            }

            // ETAPA 1: Identificar os exercícios que pertencem a este grupo
            const exerciciosDoGrupoSet = new Set(
                dv.pages(`"04 - Corpo & Movimento/01 - Exercícios Físicos/01. Manual/Exercícios"`)
                    .where(p => p.tipo === 'manual_exercicio' && p.grupo_muscular_primario === grupoMuscularId)
                    .map(p => p.exercicio_id)
                    .values
            );

            if (exerciciosDoGrupoSet.size === 0) {
                return `\`\`\`chartsview\ntype: Column\noptions:\n  title: { text: "Nenhum exercício encontrado para este grupo" }\n\`\`\``;
            }

            // 2. PROCESSAMENTO DE DADOS (AGREGAÇÃO COM UNIDADE)
            const dadosPorExercicio = {};

            for (const exercicioId of exerciciosDoGrupoSet) {
                const logPath = `99 - BACKEND/Logs_Metricas/Exercicios/${grupoMuscularId}/${exercicioId}/raw_logs.md`;
                const file = app.vault.getAbstractFileByPath(logPath);
                
                if (file) {
                    const content = await app.vault.cachedRead(file);
                    const lines = content.split('\n');
                    
                    const statsArquivo = lines.reduce((acc, log) => {
                        if (log.includes("(sessao_fim::WORK)")) {
                            const carga = parseFloat(log.match(/\(carga_kg::\s*([\d.]+)\)/)?.[1] || '0');
                            const reps = parseInt(log.match(/\(reps_feito::\s*(\d+)\)/)?.[1] || '0');
                            const distancia = parseFloat(log.match(/\(distancia_km::\s*([\d.]+)\)/)?.[1] || '0');
                            
                            if (distancia > 0) {
                                acc.total += distancia;
                                acc.isCardio = true;
                            } else {
                                acc.total += (carga * reps);
                            }
                        }
                        return acc;
                    }, { total: 0, isCardio: false });
                    
                    if (statsArquivo.total > 0) {
                        if (!dadosPorExercicio[exercicioId]) {
                            dadosPorExercicio[exercicioId] = { 
                                volume: statsArquivo.total, 
                                unit: statsArquivo.isCardio ? 'km' : 'kg' 
                            };
                        } else {
                            dadosPorExercicio[exercicioId].volume += statsArquivo.total;
                            if (statsArquivo.isCardio) dadosPorExercicio[exercicioId].unit = 'km';
                        }
                    }
                }
            }

            if (Object.keys(dadosPorExercicio).length === 0) {
                return `\`\`\`chartsview\ntype: Column\noptions:\n  title: { text: "Sem registros de treino", visible: true }\n\`\`\``;
            }

            // Formata os dados
            const chartData = Object.entries(dadosPorExercicio).map(([exercicioId, dados]) => ({
                exercicio: exercicioId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                volume: Math.round(dados.volume * 100) / 100,
                unit: dados.unit 
            }));

            chartData.sort((a, b) => b.volume - a.volume);

            // 3. CONFIGURAÇÃO VISUAL
            const yamlString = `
\`\`\`chartsview
type: Column
data: ${JSON.stringify(chartData)}
options:
  xField: 'exercicio'
  yField: 'volume'
  yAxis:
    title: { text: 'Volume (kg ou km)', style: { fill: '#cccccc' } }
    label:
      formatter: |
        function(value) {
          if (value >= 1000) return (value / 1000).toFixed(1) + 'k';
          return value;
        }
  xAxis: 
    title: { text: 'Exercício', style: { fill: '#cccccc' } }
    label: { autoRotate: true, autoHide: false }
  tooltip:
    fields: ['exercicio', 'volume', 'unit']
    formatter: |
      function(datum) {
        return { name: datum.exercicio, value: datum.volume.toLocaleString('pt-BR') + ' ' + datum.unit };
      }
  title: { visible: true, text: 'Distribuição de Volume por Exercício' }
  columnStyle:
    radius: [4, 4, 0, 0]
  color: '#3498db'
\`\`\`
`;
            return yamlString.trim();

        } catch (e) {
            return `\`\`\`chartsview\ntype: Column\noptions:\n  title: { text: "ERRO NO SCRIPT: ${e.message.replace(/"/g, "'")}" }\n\`\`\``;
        }
    }
})();