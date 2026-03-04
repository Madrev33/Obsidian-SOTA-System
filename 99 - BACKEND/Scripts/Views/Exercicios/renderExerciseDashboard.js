// SOTA - renderExerciseDashboard.js v1.0
// Controller Unificado para Visualização de Performance de Exercícios.
// Suporta: Força (Reps/Carga), Cardio (Distância/Ritmo) e Isometria (Tempo/Tensão).

(() => {
    return async function renderView(dv, input) {
        try {
            // --- 1. VALIDAÇÃO DE CONTEXTO ---
            const exercicioId = input.exercicio_id;
            const tipoMetrica = input.tipo_metrica || 'reps'; // Fallback para força

            if (!exercicioId) {
                dv.paragraph("⚠️ **Erro:** ID do exercício não fornecido para o renderizador.");
                return;
            }

            // --- 2. DEEP SCAN: LOCALIZAÇÃO DO LOG (SHARDING) ---
            const logsRootPath = "99 - BACKEND/Logs_Metricas/Exercicios";
            
            // Função auxiliar para encontrar o arquivo de log recursivamente ou diretamente
            const encontrarLog = (rootPath, targetId) => {
                const root = app.vault.getAbstractFileByPath(rootPath);
                if (!root) return null;

                // Tentativa direta (O(1)) se a estrutura for padrão
                // Tenta achar em grupos comuns primeiro para otimização
                if (root.children) {
                    for (const child of root.children) {
                        if (!child.extension) { // É pasta (Grupo Muscular)
                            const pathCand = `${child.path}/${targetId}/raw_logs.md`;
                            const file = app.vault.getAbstractFileByPath(pathCand);
                            if (file) return file;
                        }
                    }
                }
                return null;
            };

            const logFile = encontrarLog(logsRootPath, exercicioId);

            if (!logFile) {
                dv.paragraph(`
                <div style="padding: 20px; border: 1px dashed var(--text-muted); border-radius: 8px; text-align: center;">
                    <h3 style="margin:0;">🆕 Exercício Novo</h3>
                    <p style="color: var(--text-muted);">Nenhum dado registrado ainda. Complete sua primeira sessão para visualizar as métricas.</p>
                </div>`);
                return;
            }

            // --- 3. PARSING DE DADOS (EXTRAÇÃO BRUTA) ---
            const content = await app.vault.cachedRead(logFile);
            const lines = content.split('\n');
            const logsValidos = [];

            // Regex Compilados para Performance
            const RX = {
                date: /\(log_date::\s*(\d{4}-\d{2}-\d{2})\)/,
                carga: /\(carga_kg::\s*([\d.]+)\)/,
                reps: /\(reps_feito::\s*(\d+)\)/,
                distancia: /\(distancia_km::\s*([\d.]+)\)/,
                duracao: /\(duracao_segundos::\s*(\d+)\)/,
                rpe: /\(esforco_rpe::\s*(\d+)\)/,
                qualidade: /\(qualidade_forma::\s*(\d+)\)/
            };

            lines.forEach(line => {
                if (!line.includes("(sessao_fim::WORK)")) return;

                const dateMatch = line.match(RX.date);
                if (!dateMatch) return;

                // Extração Segura com Defaults Matemáticos
                const dados = {
                    data: dateMatch[1],
                    carga: parseFloat(line.match(RX.carga)?.[1] || '0'),
                    reps: parseInt(line.match(RX.reps)?.[1] || '0'),
                    distancia: parseFloat(line.match(RX.distancia)?.[1] || '0'),
                    duracao: parseInt(line.match(RX.duracao)?.[1] || '0'),
                    rpe: parseInt(line.match(RX.rpe)?.[1] || '0'),
                    qualidade: parseInt(line.match(RX.qualidade)?.[1] || '0')
                };

                // Normalização de NaN para 0
                if (isNaN(dados.carga)) dados.carga = 0;
                if (isNaN(dados.reps)) dados.reps = 0;
                if (isNaN(dados.distancia)) dados.distancia = 0;
                if (isNaN(dados.duracao)) dados.duracao = 0;

                logsValidos.push(dados);
            });

            if (logsValidos.length === 0) {
                dv.paragraph("ℹ️ Arquivo de log encontrado, mas sem sessões de treino válidas.");
                return;
            }

            // Ordenação Cronológica (Antigo -> Novo) para Gráficos
            logsValidos.sort((a, b) => a.data.localeCompare(b.data));

            // --- 4. CÁLCULOS MATEMÁTICOS & AGREGAÇÃO ---
            
            // 4.1 Helpers Matemáticos
            const calc1RM = (peso, reps) => {
                if (reps === 0) return 0;
                if (reps === 1) return peso;
                // Fórmula de Brzycki (Mais segura para < 12 reps)
                return peso * (36 / (37 - reps));
            };

            const calcPace = (segundos, km) => {
                if (km <= 0 || segundos <= 0) return 0;
                return (segundos / 60) / km; // min/km
            };

            const formatTempo = (s) => {
                const m = Math.floor(s / 60);
                const sec = Math.round(s % 60);
                return `${m}:${sec < 10 ? '0' : ''}${sec}`;
            };

            const formatTempoLongo = (s) => {
                const h = Math.floor(s / 3600);
                const m = Math.floor((s % 3600) / 60);
                return h > 0 ? `${h}h ${m}m` : `${m}m`;
            };

            // 4.2 Agregação por Dia (Para lidar com múltiplas séries no mesmo dia)
            const diario = {};
            
            logsValidos.forEach(log => {
                const dia = log.data;
                if (!diario[dia]) {
                    diario[dia] = {
                        data: dia,
                        volumeTotal: 0,
                        maxCarga: 0,
                        max1RM: 0,
                        totalDistancia: 0,
                        totalTempo: 0,
                        melhorPace: 9999, // Inicia alto
                        rpeSoma: 0,
                        qualidadeSoma: 0,
                        series: 0
                    };
                }

                const d = diario[dia];
                
                // Volume de Força
                d.volumeTotal += (log.carga * log.reps);
                
                // Max Carga
                if (log.carga > d.maxCarga) d.maxCarga = log.carga;
                
                // 1RM Estimado (Apenas se for força e reps > 0 e <= 12 para precisão)
                if (log.reps > 0 && log.reps <= 12) {
                    const rm = calc1RM(log.carga, log.reps);
                    if (rm > d.max1RM) d.max1RM = rm;
                }

                // Cardio / Tempo
                d.totalDistancia += log.distancia;
                d.totalTempo += log.duracao;

                // Pace (Calculado por sessão para pegar o melhor)
                if (log.distancia > 0) {
                    const pace = calcPace(log.duracao, log.distancia);
                    if (pace < d.melhorPace) d.melhorPace = pace;
                }

                // Médias
                d.rpeSoma += log.rpe;
                d.qualidadeSoma += log.qualidade;
                d.series++;
            });

            // Converte objeto diario para array ordenado
            const dadosGrafico = Object.values(diario).sort((a, b) => a.data.localeCompare(b.data));

            // --- 5. RENDERIZAÇÃO DE INTERFACE (UI) ---

            // Estilos CSS Injetados
            const style = `
                <style>
                    .sota-kpi-container { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
                    .sota-kpi-card { background: var(--background-secondary); padding: 15px; border-radius: 8px; border: 1px solid var(--background-modifier-border); text-align: center; }
                    .sota-kpi-value { font-size: 1.6em; font-weight: 700; color: var(--text-normal); margin-bottom: 5px; }
                    .sota-kpi-label { font-size: 0.8em; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }
                    .sota-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
                    @media (max-width: 700px) { .sota-kpi-container, .sota-grid-2 { grid-template-columns: 1fr; } }
                </style>
            `;
            dv.paragraph(style);

            // 5.1 Lógica de Exibição Baseada no Tipo (POLIMORFISMO DE VIEW)
            
            let kpiHTML = "";
            let chartConfig1 = null; // Gráfico Principal (Progressão)
            let chartConfig2 = null; // Gráfico Secundário (Volume/Esforço)

            // --- FORÇA (REPS) ---
            if (tipoMetrica === 'reps') {
                // KPIs
                const recordeCarga = Math.max(...logsValidos.map(l => l.carga));
                const recordeVol = Math.max(...dadosGrafico.map(d => d.volumeTotal));
                const totalTonelagem = dadosGrafico.reduce((acc, d) => acc + d.volumeTotal, 0);
                const ultCarga = dadosGrafico[dadosGrafico.length-1].maxCarga;

                kpiHTML = `
                    <div class="sota-kpi-container">
                        <div class="sota-kpi-card"><div class="sota-kpi-value">${recordeCarga} kg</div><div class="sota-kpi-label">Carga Máxima</div></div>
                        <div class="sota-kpi-card"><div class="sota-kpi-value">${ultCarga} kg</div><div class="sota-kpi-label">Carga Atual</div></div>
                        <div class="sota-kpi-card"><div class="sota-kpi-value">${(totalTonelagem/1000).toFixed(1)} t</div><div class="sota-kpi-label">Volume Total</div></div>
                        <div class="sota-kpi-card"><div class="sota-kpi-value">${logsValidos.length}</div><div class="sota-kpi-label">Séries Totais</div></div>
                    </div>
                `;

                // Gráfico 1: Progressão de Carga e 1RM
                const dataG1 = dadosGrafico.map(d => [
                    { dia: d.data, tipo: 'Carga Real', valor: d.maxCarga },
                    { dia: d.data, tipo: '1RM Estimado', valor: Math.round(d.max1RM) }
                ]).flat();

                chartConfig1 = {
                    type: 'Line',
                    data: dataG1,
                    options: {
                        xField: 'dia', yField: 'valor', seriesField: 'tipo',
                        smooth: true, point: { size: 3, shape: 'circle' },
                        color: ['#3498db', '#e74c3c'],
                        yAxis: { title: { text: 'Peso (kg)' } },
                        title: { visible: true, text: 'Progressão de Força' }
                    }
                };

                // Gráfico 2: Dispersão Volume vs RPE (Eficiência)
                // Filtrar apenas dias com RPE válido (>0)
                const dataG2 = dadosGrafico.filter(d => d.rpeSoma > 0).map(d => ({
                    volume: Math.round(d.volumeTotal),
                    rpe: parseFloat((d.rpeSoma / d.series).toFixed(1)),
                    dia: d.data
                }));

                chartConfig2 = {
                    type: 'Scatter',
                    data: dataG2,
                    options: {
                        xField: 'volume', yField: 'rpe', size: 5, shape: 'circle',
                        color: '#f1c40f',
                        xAxis: { title: { text: 'Volume (kg)' } },
                        yAxis: { title: { text: 'RPE Médio' }, min: 0, max: 10 },
                        tooltip: { 
                            formatter: (d) => { return { name: d.dia, value: `Vol: ${d.volume} | RPE: ${d.rpe}` }; } 
                        },
                        title: { visible: true, text: 'Relação Esforço x Volume' }
                    }
                };
            }

            // --- CARDIO (DISTANCIA) ---
            else if (tipoMetrica === 'distancia') {
                // KPIs
                const maiorDistancia = Math.max(...logsValidos.map(l => l.distancia));
                const totalKm = dadosGrafico.reduce((acc, d) => acc + d.totalDistancia, 0);
                const melhorPaceGlobal = Math.min(...dadosGrafico.filter(d => d.melhorPace < 999).map(d => d.melhorPace));
                const tempoTotal = dadosGrafico.reduce((acc, d) => acc + d.totalTempo, 0);

                kpiHTML = `
                    <div class="sota-kpi-container">
                        <div class="sota-kpi-card"><div class="sota-kpi-value">${totalKm.toFixed(1)} km</div><div class="sota-kpi-label">Distância Total</div></div>
                        <div class="sota-kpi-card"><div class="sota-kpi-value">${maiorDistancia.toFixed(2)} km</div><div class="sota-kpi-label">Maior Distância</div></div>
                        <div class="sota-kpi-card"><div class="sota-kpi-value">${formatTempo(Math.round(melhorPaceGlobal*60))}</div><div class="sota-kpi-label">Melhor Pace (/km)</div></div>
                        <div class="sota-kpi-card"><div class="sota-kpi-value">${formatTempoLongo(tempoTotal)}</div><div class="sota-kpi-label">Tempo Total</div></div>
                    </div>
                `;

                // Gráfico 1: Distância e Pace
                const dataG1 = dadosGrafico.map(d => {
                    const res = [{ dia: d.data, tipo: 'Distância (km)', valor: parseFloat(d.totalDistancia.toFixed(2)) }];
                    if (d.melhorPace < 999) {
                        res.push({ dia: d.data, tipo: 'Pace (min/km)', valor: parseFloat(d.melhorPace.toFixed(2)) });
                    }
                    return res;
                }).flat();

                chartConfig1 = {
                    type: 'Line', // Usando Dual Axes simulation via Line com formatação
                    data: dataG1,
                    options: {
                        xField: 'dia', yField: 'valor', seriesField: 'tipo',
                        smooth: true,
                        color: ['#2ecc71', '#9b59b6'],
                        yAxis: [
                            { title: { text: 'Valor' } } // Simplificação para view unificada
                        ],
                        tooltip: {
                            formatter: (d) => {
                                if (d.tipo.includes('Pace')) {
                                    return { name: d.tipo, value: formatTempo(d.valor * 60) };
                                }
                                return { name: d.tipo, value: d.valor };
                            }
                        },
                        title: { visible: true, text: 'Evolução Cardio' }
                    }
                };
            }

            // --- ISOMETRIA / TEMPO ---
            else if (tipoMetrica === 'tempo') {
                const maiorTempo = Math.max(...logsValidos.map(l => l.duracao));
                const tempoAcumulado = dadosGrafico.reduce((acc, d) => acc + d.totalTempo, 0);
                
                kpiHTML = `
                    <div class="sota-kpi-container">
                        <div class="sota-kpi-card"><div class="sota-kpi-value">${formatTempo(maiorTempo)}</div><div class="sota-kpi-label">Recorde Tempo</div></div>
                        <div class="sota-kpi-card"><div class="sota-kpi-value">${formatTempoLongo(tempoAcumulado)}</div><div class="sota-kpi-label">Tempo Acumulado</div></div>
                        <div class="sota-kpi-card"><div class="sota-kpi-value">${logsValidos.length}</div><div class="sota-kpi-label">Execuções</div></div>
                        <div class="sota-kpi-card"><div class="sota-kpi-value">${(dadosGrafico[dadosGrafico.length-1]?.qualidadeSoma / dadosGrafico[dadosGrafico.length-1]?.series || 0).toFixed(1)}</div><div class="sota-kpi-label">Qualidade Recente</div></div>
                    </div>
                `;

                // Gráfico 1: Evolução do Tempo Sob Tensão Máximo
                const dataG1 = dadosGrafico.map(d => ({
                    dia: d.data,
                    valor: Math.max(...logsValidos.filter(l => l.data === d.data).map(l => l.duracao)),
                    tipo: 'Tempo Máximo (s)'
                }));

                chartConfig1 = {
                    type: 'Line',
                    data: dataG1,
                    options: {
                        xField: 'dia', yField: 'valor',
                        smooth: true,
                        area: { style: { fillOpacity: 0.2 } },
                        color: '#e67e22',
                        yAxis: { title: { text: 'Segundos' } },
                        title: { visible: true, text: 'Resistência Máxima' }
                    }
                };
            }

            // --- 6. RENDER FINAL ---
            
            dv.paragraph(kpiHTML);

            dv.paragraph('<div class="sota-grid-2" id="sota-charts-grid"></div>');
            // Nota: O dataviewjs não permite injetar facilmente em divs criadas via string HTML complexa
            // então vamos renderizar os gráficos sequencialmente.

            if (chartConfig1) {
                const yaml = `\`\`\`chartsview
type: ${chartConfig1.type}
data: ${JSON.stringify(chartConfig1.data)}
options: ${JSON.stringify(chartConfig1.options)}
\`\`\``;
                dv.paragraph(yaml);
            }

            if (chartConfig2) {
                const yaml2 = `\`\`\`chartsview
type: ${chartConfig2.type}
data: ${JSON.stringify(chartConfig2.data)}
options: ${JSON.stringify(chartConfig2.options)}
\`\`\``;
                dv.paragraph(yaml2);
            }

            // --- 7. TABELA DE HALL OF FAME (RPs) ---
            dv.header(3, "🏅 Hall of Fame (Melhores Marcas)");
            
            let records = [];
            
            if (tipoMetrica === 'reps') {
                // Top 3 Cargas
                const topCargas = [...logsValidos].sort((a,b) => b.carga - a.carga).slice(0, 3);
                records = topCargas.map((l, i) => [`#${i+1} Carga`, `${l.carga} kg`, `${l.reps} reps`, l.data]);
            } else if (tipoMetrica === 'distancia') {
                // Top 3 Distâncias
                const topDist = [...logsValidos].sort((a,b) => b.distancia - a.distancia).slice(0, 3);
                records = topDist.map((l, i) => [`#${i+1} Distância`, `${l.distancia} km`, formatTempo(l.duracao), l.data]);
            } else {
                // Top 3 Tempos
                const topTempo = [...logsValidos].sort((a,b) => b.duracao - a.duracao).slice(0, 3);
                records = topTempo.map((l, i) => [`#${i+1} Tempo`, formatTempo(l.duracao), (l.carga > 0 ? `+${l.carga}kg` : "BW"), l.data]);
            }

            dv.table(["Rank", "Performance", "Detalhe", "Data"], records);

        } catch (e) {
            dv.paragraph(`❌ **Erro SOTA Controller:** ${e.message}`);
            console.error(e);
        }
    }
})();