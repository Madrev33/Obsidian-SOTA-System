// 99 - BACKEND/Scripts/Views/DashboardPerfil/renderQuadCoreStatus.js
// SOTA v1.1 - Painel Quad-Core HUD (Fix Undefined Props)
// Correção: Adicionados campos faltantes (energia, wins, tristeza) no objeto raw.

(async () => {
    try {
        const app = dv.app;
        const moment = window.moment;
        const container = dv.container;
        container.innerHTML = ""; // Limpa container

        // --- 1. CONFIGURAÇÃO DE METAS ---
        const METAS = {
            acao_horas_dia: 6,      // 6h de execução pura é elite
            estudo_horas_dia: 2,    // 2h de absorção é sólido
            insights_dia: 3,        // Densidade de aprendizado
            sono_score: 85,         // Score SOTA de sono
            energia_score: 80,      // Nível de bateria
            humor_score: 80,        // Estabilidade (4/5)
            habitos_aderencia: 90   // Consistência
        };

        // --- 2. MOTOR DE LEITURA DE LOGS (DEEP SCAN) ---
        const logsPath = "99 - BACKEND/Logs_Metricas/Daily";
        const hoje = moment();
        
        // Define duas janelas: Atual (D0 a D-6) e Anterior (D-7 a D-13)
        const windowCurrent = { start: hoje.clone().subtract(6, 'days'), end: hoje.clone().subtract(1, 'days') };
        const windowPrev = { start: hoje.clone().subtract(13, 'days'), end: hoje.clone().subtract(7, 'days') };

        const getLogsInWindow = async (windowRange) => {
            const days = [];
            let curr = windowRange.start.clone();
            while (curr.isSameOrBefore(windowRange.end)) {
                days.push(curr.format("YYYY-MM-DD"));
                curr.add(1, 'days');
            }

            const stats = {
                acaoSecs: 0,
                intelectoSecs: 0,
                vitalidadeSecs: 0, // Treino
                totalSecs: 0,
                insights: 0,
                erros: 0,
                wins: 0,
                felicidade: 0,
                estresse: 0,
                tristeza: 0,
                sonoScores: [],
                energiaScores: [],
                humorScores: [],
                habitoScores: [],
                diasComDados: 0
            };

            for (const dia of days) {
                // 1. LÊ LOG BRUTO (Para Tempos e Eventos)
                const logFile = app.vault.getAbstractFileByPath(`${logsPath}/${dia}.md`);
                if (logFile) {
                    const content = await app.vault.cachedRead(logFile);
                    const lines = content.split('\n');
                    
                    lines.forEach(line => {
                        // A. TEMPO DE FOCO (WORK)
                        if (line.includes("sessao_fim::WORK")) {
                            const duracao = parseInt(line.match(/\(duracao_total_sessao_segundos::\s*(\d+)\)/)?.[1] || 0);
                            stats.totalSecs += duracao;

                            if (line.includes("#midia/")) {
                                // Mídias (Estudo puro) -> Intelecto
                                stats.intelectoSecs += duracao;
                            } else if (line.includes("#exercicio/") || line.includes("exercicio_id")) {
                                // Exercício -> Vitalidade
                                stats.vitalidadeSecs += duracao;
                            } else if (line.includes("#projeto/")) {
                                // MUDANÇA: Projetos agora pontuam em AÇÃO e INTELECTO
                                // Divisão: 100% para Ação (Execução) e 50% para Intelecto (Bônus Cognitivo)
                                // Ou podemos dividir: 50/50?
                                // Decisão S.O.T.A.: Projetos são primariamente Ação, mas contribuem para Intelecto.
                                stats.acaoSecs += duracao;
                                stats.intelectoSecs += (duracao * 0.5); // Adiciona metade do tempo ao Intelecto como bônus
                            } else {
                                // Inbox/Genérico -> Apenas Ação
                                stats.acaoSecs += duracao;
                            }
                        }

                        // B. EVENTOS
                        if (line.includes("#ideia") || line.includes("#reflexao")) stats.insights++;
                        if (line.includes("#aprendizado_erro")) stats.erros++;
                        if (line.includes("#win")) stats.wins++;
                        if (line.includes("#log_felicidade")) stats.felicidade++;
                        if (line.includes("#log_estresse")) stats.estresse++;
                        if (line.includes("#log_tristeza")) stats.tristeza++;
                    });
                }

                // 2. LÊ MÉTRICAS PROCESSADAS (Para Sono, Bio e Hábitos já calculados)
                const metricsPath = `99 - BACKEND/Logs_Metricas/Daily/Processed/${dia}_metrics.md`;
                const metricsFile = app.vault.getAbstractFileByPath(metricsPath);
                if (metricsFile) {
                    const p = dv.page(metricsPath);
                    if (p) {
                        stats.diasComDados++;
                        if (p.qualidade_sono_calculada !== undefined) stats.sonoScores.push(p.qualidade_sono_calculada);
                        if (p.energia_media_dia !== undefined) stats.energiaScores.push(p.energia_media_dia);
                        if (p.humor_media_dia !== undefined) stats.humorScores.push(p.humor_media_dia);
                        if (p.aderencia_habitos !== undefined) stats.habitoScores.push(p.aderencia_habitos);
                    }
                }
            }
            return stats;
        };

        const currentStats = await getLogsInWindow(windowCurrent);
        const prevStats = await getLogsInWindow(windowPrev);

        // --- 3. CÁLCULO DOS NÚCLEOS (CORE LOGIC) ---

        const calculateScores = (s) => {
            const diasDiv = s.diasComDados || 1;

            // --- NÚCLEO 1: AÇÃO (OUTPUT) ---
            const mediaAcaoHoras = (s.acaoSecs / 7) / 3600;
            const scoreAcao = Math.min(100, Math.round((mediaAcaoHoras / METAS.acao_horas_dia) * 100));

            // --- NÚCLEO 2: INTELECTO (INPUT) ---
            const mediaEstudoHoras = (s.intelectoSecs / 7) / 3600;
            const mediaInsights = s.insights / 7;
            
            const pEstudo = Math.min(100, (mediaEstudoHoras / METAS.estudo_horas_dia) * 100);
            const pInsights = Math.min(100, (mediaInsights / METAS.insights_dia) * 100);
            
            const scoreIntelecto = Math.round((pEstudo * 0.5) + (pInsights * 0.5));

            // --- NÚCLEO 3: VITALIDADE (HARDWARE) ---
            const avgSono = s.sonoScores.length > 0 ? s.sonoScores.reduce((a,b)=>a+b,0)/s.sonoScores.length : 0;
            const avgEnergia = s.energiaScores.length > 0 ? s.energiaScores.reduce((a,b)=>a+b,0)/s.energiaScores.length : 50;
            
            const mediaFocoTotalHoras = (s.totalSecs / 7) / 3600;
            const scoreResistencia = Math.min(100, (mediaFocoTotalHoras / METAS.acao_horas_dia) * 100);

            const scoreVitalidade = Math.round((avgSono * 0.5) + (avgEnergia * 0.25) + (scoreResistencia * 0.25));

            // --- NÚCLEO 4: ESPÍRITO (SOFTWARE) ---
            const avgHumorRaw = s.humorScores.length > 0 ? s.humorScores.reduce((a,b)=>a+b,0)/s.humorScores.length : 3;
            const mapHumor = [0, 0, 35, 70, 85, 100];
            const avgHumorPct = mapHumor[Math.round(avgHumorRaw)] || 70;

            // Reutiliza avgEnergia calculada no bloco de Vitalidade acima
            // Se avgEnergia não estiver acessível aqui por escopo, recalcule ou mova a declaração para cima.
            // (No código original, avgEnergia é declarada dentro de calculateScores, então está acessível).
            
            const avgHabitos = s.habitoScores.length > 0 ? s.habitoScores.reduce((a,b)=>a+b,0)/s.habitoScores.length : 0;
            
            let saldo = 50 + ((s.wins + s.felicidade) * 5) - (s.estresse * 5);
            saldo = Math.min(100, Math.max(0, saldo));

            // NOVA PONDERAÇÃO: Humor (30%) + Energia (20%) + Hábitos (25%) + Saldo Eventos (25%)
            const scoreEspirito = Math.round((avgHumorPct * 0.3) + (avgEnergia * 0.2) + (avgHabitos * 0.25) + (saldo * 0.25));

            return {
                scores: { acao: scoreAcao, intelecto: scoreIntelecto, vitalidade: scoreVitalidade, espirito: scoreEspirito },
                raw: { 
                    acaoH: mediaAcaoHoras, 
                    estudoH: mediaEstudoHoras, 
                    insights: mediaInsights || 0, // Fallback 0
                    sono: avgSono,
                    focoTotal: mediaFocoTotalHoras,
                    felicidade: s.felicidade || 0,
                    estresse: s.estresse || 0,
                    tristeza: s.tristeza || 0, // Adicionado
                    wins: s.wins || 0,         // Adicionado
                    energia: avgEnergia,       // Adicionado
                    humor: avgHumorRaw         // Adicionado
                }
            };
        };

        const current = calculateScores(currentStats);
        const prev = calculateScores(prevStats);

        // --- 4. GERAÇÃO DE DETALHES (NARRATIVA) ---
        const getDetails = (key) => {
            const cRaw = current.raw; 
            const pRaw = prev.raw;    
            const details = [];

            // Helper Blindado para evitar crash com undefined
            const trend = (curr, prev, label, unit = "") => {
                const cVal = Number(curr) || 0;
                const pVal = Number(prev) || 0;
                const diff = cVal - pVal;
                const icon = diff > 0 ? "⬆️" : (diff < 0 ? "⬇️" : "→");
                // Mostra seta se a diferença for relevante
                const showArrow = Math.abs(diff) > (unit === 'h' ? 0.2 : 2); 
                return `${showArrow ? icon : '•'} ${label}: ${cVal.toFixed(1)}${unit}`;
            };

            if (key === 'acao') {
                details.push(trend(cRaw.acaoH, pRaw.acaoH, "Média Ação", "h/dia"));
                const totalHoras = ((cRaw.acaoH || 0) * 7).toFixed(1);
                details.push(`⚡ Total Semana: ${totalHoras}h`);
                
                // Feedback de Alta Ação
                if (cRaw.acaoH > METAS.acao_horas_dia) {
                    details.push(`🔥 Alta Intensidade de Execução`);
                }
            }

            if (key === 'intelecto') {
                details.push(trend(cRaw.estudoH, pRaw.estudoH, "Média Estudo", "h/dia"));
                
                // Correção de Insights (Formatação)
                const totalInsights = Math.round(cRaw.insights); 
                const totalHorasEstudo = cRaw.estudoH * 7;
                const ratio = totalHorasEstudo > 0 ? (totalInsights / totalHorasEstudo).toFixed(1) : "0.0";
                
                if (totalInsights > 0) {
                    details.push(`💡 ${totalInsights} Insights (${ratio}/h)`);
                } else {
                    details.push(`⚠️ Baixa Síntese`);
                }
                
                // Feedback de Projetos (Novo)
                // Se houver muita ação (que contribui para intelecto), mostra isso aqui
                if (cRaw.acaoH > 4) {
                    details.push(`🏗️ Aprendizado via Projetos Ativo`);
                }
            }

            if (key === 'vitalidade') {
                details.push(trend(cRaw.sono, pRaw.sono, "Qualidade Sono", "%"));
                details.push(trend(cRaw.energia, pRaw.energia, "Bateria (Energia)", "%"));
                
                if (cRaw.focoTotal > 6) details.push(`🔋 Alta Resistência (>6h foco)`);
                else if (cRaw.focoTotal < 2) details.push(`🪫 Baixa Resistência`);
                
                // Feedback de Alta Energia (Novo)
                if (cRaw.energia >= 75) {
                    details.push(`⚡ Estado de Pico Energético`);
                }
            }

            if (key === 'espirito') {
                if (cRaw.felicidade > 0) details.push(`😄 ${cRaw.felicidade} Felicidade`);
                if (cRaw.wins > 0) details.push(`🏆 ${cRaw.wins} Wins`);
                
                const cargaNegativa = (cRaw.estresse || 0) + (cRaw.tristeza || 0);
                if (cargaNegativa > 0) {
                    details.push(`🔻 Carga: ${cRaw.estresse} Estresse / ${cRaw.tristeza} Tristeza`);
                } else {
                    details.push(`🛡️ Emocional Estável`);
                }
                
                details.push(trend(cRaw.humor, pRaw.humor, "Humor Médio", "/5"));
                
                // Feedback de Energia no Espírito (Novo)
                if (cRaw.energia >= 70) {
                    details.push(`✨ Vigor Espiritual (Alta Energia)`);
                }
            }

            return details;
        };

        // --- 5. RENDERIZAÇÃO DOM ---
        const style = document.createElement('style');
        style.textContent = `
            .sota-hud-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 10px; font-family: var(--font-ui); }
            .sota-hud-card { 
                background: var(--background-secondary); border: 1px solid var(--background-modifier-border); 
                border-radius: 12px; padding: 15px; display: flex; flex-direction: column; gap: 8px; 
                position: relative; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .sota-hud-header { display: flex; justify-content: space-between; align-items: center; }
            .sota-hud-title { font-weight: 700; font-size: 0.85em; text-transform: uppercase; color: var(--text-muted); letter-spacing: 1px; display: flex; align-items: center; gap: 6px; }
            .sota-hud-val-row { display: flex; align-items: baseline; gap: 8px; }
            .sota-hud-value { font-size: 2.2em; font-weight: 800; line-height: 1; color: var(--text-normal); }
            .sota-hud-trend { font-size: 1em; font-weight: 600; }
            .trend-up { color: var(--color-green); }
            .trend-down { color: var(--color-red); }
            .trend-flat { color: var(--text-muted); }
            .sota-hud-bar-bg { width: 100%; height: 6px; background: var(--background-modifier-border); border-radius: 3px; overflow: hidden; }
            .sota-hud-bar-fill { height: 100%; border-radius: 3px; transition: width 1s ease-out; }
            .bar-acao { background: linear-gradient(90deg, #e74c3c, #c0392b); }
            .bar-intelecto { background: linear-gradient(90deg, #3498db, #2980b9); }
            .bar-vitalidade { background: linear-gradient(90deg, #2ecc71, #27ae60); }
            .bar-espirito { background: linear-gradient(90deg, #9b59b6, #8e44ad); }
            .sota-hud-details { display: flex; flex-direction: column; gap: 2px; margin-top: 5px; }
            .sota-detail-item { font-size: 0.75em; color: var(--text-faint); display: flex; align-items: center; gap: 4px; }
            @media (max-width: 600px) { .sota-hud-grid { grid-template-columns: 1fr; } }
        `;
        container.appendChild(style);

        const grid = document.createElement('div');
        grid.className = 'sota-hud-grid';

        const createCard = (key, title, icon, colorClass) => {
            const score = current.scores[key] || 0;
            const prevScore = prev.scores[key] || 0;
            const diff = score - prevScore;
            
            let trendIcon = "→";
            let trendClass = "trend-flat";
            if (diff >= 2) { trendIcon = "↗"; trendClass = "trend-up"; }
            if (diff <= -2) { trendIcon = "↘"; trendClass = "trend-down"; }

            const card = document.createElement('div');
            card.className = 'sota-hud-card';

            const header = document.createElement('div');
            header.className = 'sota-hud-header';
            header.innerHTML = `<span class="sota-hud-title">${icon} ${title}</span>`;
            card.appendChild(header);

            const valRow = document.createElement('div');
            valRow.className = 'sota-hud-val-row';
            valRow.innerHTML = `<span class="sota-hud-value">${score}%</span><span class="sota-hud-trend ${trendClass}">${trendIcon}</span>`;
            card.appendChild(valRow);

            const barBg = document.createElement('div');
            barBg.className = 'sota-hud-bar-bg';
            const barFill = document.createElement('div');
            barFill.className = `sota-hud-bar-fill ${colorClass}`;
            barFill.style.width = `${score}%`;
            barBg.appendChild(barFill);
            card.appendChild(barBg);

            const detailsDiv = document.createElement('div');
            detailsDiv.className = 'sota-hud-details';
            const detailsList = getDetails(key);
            detailsList.forEach(d => {
                const item = document.createElement('div');
                item.className = 'sota-detail-item';
                item.innerText = d;
                detailsDiv.appendChild(item);
            });
            card.appendChild(detailsDiv);

            return card;
        };

        grid.appendChild(createCard('acao', 'Ação', '⚔️', 'bar-acao'));
        grid.appendChild(createCard('intelecto', 'Intelecto', '🧠', 'bar-intelecto'));
        grid.appendChild(createCard('vitalidade', 'Vitalidade', '🛡️', 'bar-vitalidade'));
        grid.appendChild(createCard('espirito', 'Espírito', '🧘‍♂️', 'bar-espirito'));

        container.appendChild(grid);

    } catch (e) {
        dv.paragraph(`❌ Erro no Quad-Core: ${e.message}`);
        console.error(e);
    }
})();