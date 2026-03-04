// SOTA - renderGroupDashboard.js v1.0
// Controller Unificado para Análise de Grupos Musculares (Macro-Ciclo).
// Agrega dados de múltiplos exercícios filhos e fornece visão sistêmica.

(() => {
    return async function renderView(dv, input) {
        try {
            // --- 1. CONTEXTO E INJEÇÃO ---
            const grupoId = input.grupo_id;
            
            if (!grupoId) {
                dv.paragraph("⚠️ **Erro:** ID do Grupo Muscular não fornecido.");
                return;
            }

            // --- 2. MAPEAMENTO DE EXERCÍCIOS (METADADOS) ---
            // Busca todos os exercícios que declaram pertencer a este grupo no Frontmatter
            const exerciciosDoGrupo = dv.pages('"04 - Corpo & Movimento/01 - Exercícios Físicos/01. Manual/Exercícios"')
                .where(p => p.tipo === 'manual_exercicio' && p.grupo_muscular_primario === grupoId)
                .map(p => ({
                    id: p.exercicio_id,
                    nome: p.file.name.replace('.md', ''),
                    link: p.file.link,
                    metrica: p.tipo_metrica || 'reps'
                }));

            if (exerciciosDoGrupo.length === 0) {
                dv.paragraph(`ℹ️ Nenhum exercício cadastrado para o grupo **${grupoId}**.`);
                return;
            }

            // Mapa para acesso rápido O(1)
            const mapExercicios = new Map(exerciciosDoGrupo.map(e => [e.id, e]));

            // --- 3. DEEP SCAN DE LOGS (AGREGAÇÃO) ---
            const logsRootPath = "99 - BACKEND/Logs_Metricas/Exercicios";
            const rootFolder = app.vault.getAbstractFileByPath(logsRootPath);
            
            // Estrutura de Agregação
            const stats = {
                volumeTotal: 0, // kg ou km (depende do predominante, mas geralmente kg para musc)
                tempoTotal: 0,  // segundos
                seriesTotais: 0,
                rpeSoma: 0,
                qualidadeSoma: 0,
                exerciciosAtivos: new Set(),
                volumePorExercicio: {}, // { id: volume }
                ultimoTreino: null
            };

            // Função Recursiva de Leitura
            const processarPasta = async (pasta) => {
                if (!pasta.children) return;

                for (const child of pasta.children) {
                    if (child.extension === 'md' && child.name === "raw_logs.md") {
                        // O pai do log é o ID do exercício
                        const exId = child.parent.name;
                        
                        // Só processa se o exercício pertencer ao grupo atual
                        if (mapExercicios.has(exId)) {
                            await lerLog(child, exId);
                        }
                    } else if (!child.extension) { // Pasta
                        await processarPasta(child);
                    }
                }
            };

            const lerLog = async (file, exId) => {
                const content = await app.vault.cachedRead(file);
                const lines = content.split('\n');
                
                lines.forEach(line => {
                    if (!line.includes("(sessao_fim::WORK)")) return;

                    const carga = parseFloat(line.match(/\(carga_kg::\s*([\d.]+)\)/)?.[1] || 0);
                    const reps = parseInt(line.match(/\(reps_feito::\s*(\d+)\)/)?.[1] || 0);
                    const duracao = parseInt(line.match(/\(duracao_segundos::\s*(\d+)\)/)?.[1] || 0);
                    const rpe = parseInt(line.match(/\(esforco_rpe::\s*(\d+)\)/)?.[1] || 0);
                    const qualidade = parseInt(line.match(/\(qualidade_forma::\s*(\d+)\)/)?.[1] || 0);
                    const data = line.match(/\(log_date::\s*(\d{4}-\d{2}-\d{2})\)/)?.[1];

                    // Atualiza Stats Globais
                    stats.seriesTotais++;
                    stats.tempoTotal += duracao;
                    if (rpe > 0) stats.rpeSoma += rpe;
                    if (qualidade > 0) stats.qualidadeSoma += qualidade;
                    
                    // Volume Híbrido (Simplificado para visualização de esforço)
                    // Se for cardio, usa distância como "carga" visual, se for força, carga*reps
                    let volSessao = 0;
                    if (mapExercicios.get(exId).metrica === 'distancia') {
                        const dist = parseFloat(line.match(/\(distancia_km::\s*([\d.]+)\)/)?.[1] || 0);
                        volSessao = dist; 
                    } else {
                        volSessao = carga * reps;
                    }

                    stats.volumeTotal += volSessao;
                    stats.exerciciosAtivos.add(exId);
                    
                    // Agregação por Exercicio
                    stats.volumePorExercicio[exId] = (stats.volumePorExercicio[exId] || 0) + volSessao;

                    // Data Recente
                    if (data) {
                        if (!stats.ultimoTreino || data > stats.ultimoTreino) {
                            stats.ultimoTreino = data;
                        }
                    }
                });
            };

            await processarPasta(rootFolder);

            // --- 4. RENDERIZAÇÃO (DASHBOARD) ---

            if (stats.seriesTotais === 0) {
                dv.paragraph(`
                <div style="padding: 15px; border: 1px solid var(--background-modifier-border); border-radius: 8px;">
                    <h3>💤 Grupo Inativo</h3>
                    <p>Nenhum treino registrado para este grupo muscular ainda.</p>
                </div>
                `);
                // Mostra lista de exercícios mesmo sem dados
                dv.header(3, "Exercícios Disponíveis");
                dv.list(exerciciosDoGrupo.map(e => e.link));
                return;
            }

            // 4.1 KPIs
            const rpeMedio = (stats.rpeSoma / stats.seriesTotais).toFixed(1);
            const qualidadeMedia = (stats.qualidadeSoma / stats.seriesTotais).toFixed(1);
            const tempoFormatado = `${Math.floor(stats.tempoTotal / 3600)}h ${Math.floor((stats.tempoTotal % 3600) / 60)}m`;
            
            // Determina unidade do volume principal
            const unidadeVolume = exerciciosDoGrupo.some(e => e.metrica === 'distancia') ? 'Unid. Mista' : 'kg';

            const style = `
                <style>
                    .sota-group-kpi { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 25px; }
                    .sota-card { background: var(--background-primary-alt); padding: 12px; border-radius: 6px; text-align: center; border: 1px solid var(--background-modifier-border); }
                    .sota-val { font-size: 1.4em; font-weight: 800; color: var(--text-normal); }
                    .sota-lbl { font-size: 0.75em; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px; }
                </style>
            `;
            dv.paragraph(style);

            dv.paragraph(`
                <div class="sota-group-kpi">
                    <div class="sota-card"><div class="sota-val">${stats.seriesTotais}</div><div class="sota-lbl">Séries Totais</div></div>
                    <div class="sota-card"><div class="sota-val">${Math.round(stats.volumeTotal).toLocaleString()}</div><div class="sota-lbl">Volume (${unidadeVolume})</div></div>
                    <div class="sota-card"><div class="sota-val">${rpeMedio}</div><div class="sota-lbl">RPE Médio</div></div>
                    <div class="sota-card"><div class="sota-val">${tempoFormatado}</div><div class="sota-lbl">Tempo Total</div></div>
                </div>
            `);

            // 4.2 Gráfico de Distribuição (Pizza)
            // Mostra qual exercício domina o treino deste grupo
            const pieData = Object.entries(stats.volumePorExercicio).map(([id, vol]) => ({
                exercicio: mapExercicios.get(id)?.nome || id,
                volume: Math.round(vol)
            })).sort((a, b) => b.volume - a.volume);

            const pieConfig = {
                type: 'Pie',
                data: pieData,
                options: {
                    angleField: 'volume',
                    colorField: 'exercicio',
                    radius: 0.8,
                    innerRadius: 0.6,
                    label: {
                        type: 'spider',
                        labelHeight: 28,
                        content: '{name}\n{percentage}'
                    },
                    interactions: [{ type: 'element-active' }],
                    title: { visible: true, text: 'Distribuição de Volume' }
                }
            };

            const yamlPie = `\`\`\`chartsview
type: Pie
data: ${JSON.stringify(pieData)}
options: ${JSON.stringify(pieConfig.options)}
\`\`\``;
            
            dv.paragraph(yamlPie);

            // 4.3 Tabela de Diagnóstico (Negligência)
            dv.header(3, "🩺 Diagnóstico de Exercícios");
            
            const tabelaDiag = exerciciosDoGrupo.map(ex => {
                const temDados = stats.exerciciosAtivos.has(ex.id);
                const volume = stats.volumePorExercicio[ex.id] || 0;
                
                return {
                    link: ex.link,
                    status: temDados ? "✅ Ativo" : "⚠️ Negligenciado",
                    volume: volume > 0 ? Math.round(volume).toLocaleString() : "-",
                    share: stats.volumeTotal > 0 ? ((volume / stats.volumeTotal) * 100).toFixed(1) + "%" : "0%"
                };
            }).sort((a, b) => (b.status === "✅ Ativo") - (a.status === "✅ Ativo")); // Ativos primeiro

            dv.table(
                ["Exercício", "Status", "Volume Acumulado", "Share"],
                tabelaDiag.map(l => [l.link, l.status, l.volume, l.share])
            );

        } catch (e) {
            dv.paragraph(`❌ **Erro SOTA Group Controller:** ${e.message}`);
            console.error(e);
        }
    }
})();