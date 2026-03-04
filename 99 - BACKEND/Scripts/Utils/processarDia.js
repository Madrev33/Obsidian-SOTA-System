// SOTA v5.0 - processarDia.js (Precision Time Engine & Quantified Self)
// Motor de ETL Definitivo: Separação de Esforço (Foco) vs Resultado (Tasks)
// Integra Bio-Ritmo Baseado em Eventos, Higiene do Sono Retroativa e Contexto Hierárquico.

module.exports = async (params) => {
    const { app, obsidian, quickAddApi: qa } = params;
    const { Notice, TFile } = obsidian;
    const moment = params.obsidian.moment;

    // --- 1. CONFIGURAÇÃO & CONSTANTES ---
    const config = {
        codexHabitosPath: "07 - Engenharia de Hábitos/01 - Hábitos",
        logsDiariosPath: "99 - BACKEND/Logs_Metricas/Daily",
        metricasProcessadasPath: "99 - BACKEND/Logs_Metricas/Daily/Processed",
        perfilSotaPath: "00 - Dashboard/00 - Perfil & Stats.md",
        fatorXpNivel: 1.5,
    };

    // Matriz de XP (Balanceamento de RPG - SOTA v4.1 Tuned)
    const matrizXP = {
        habitos: { 'Trivial': 5, 'Fácil': 10, 'Moderado': 25, 'Desafiador': 50, 'Hardcore': 100 },
        
        tarefas: { 
            'trivial': 5,    
            'facil': 15,     
            'moderado': 40,  
            'desafiador': 80, 
            'hardcore': 150  
        },
        
        pomodoro_base: 10, 
            
        exercicio: 10,     
        insight: 10,       
        aprendizado_erro: 20, 
        win: 20,           
        felicidade: 10,
        refeicao_boa: 5,
        refeicao_ruim: -10 
    };

    // Multiplicadores Contextuais (Preservados)
    const MULT_ALVORADA = 1.5;
    const MULT_GUERILLA = 1.3;
    const MULT_RESILIENCIA_MAX = 1.5; 
    const MULT_RESILIENCIA_MIN = 1.2; 
    const MULT_COMPLEXIDADE_2 = 1.2;
    const MULT_COMPLEXIDADE_3 = 1.5;

    // --- 2. HELPERS ---

    const sotaLog = (msg, data) => console.log(`[SOTA Precision Engine] - ${msg}`, data || "");

    const formatHumanTime = (totalSeconds) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const formatDecimalHours = (totalSeconds) => parseFloat((totalSeconds / 3600).toFixed(2));

    const parseBlockedHours = (listaHorarios, dataReferencia) => {
        if (!listaHorarios || !Array.isArray(listaHorarios)) return [];
        return listaHorarios.map(intervalo => {
            const [inicioStr, fimStr] = intervalo.split('-');
            if (!inicioStr || !fimStr) return null;
            return {
                start: moment(`${dataReferencia} ${inicioStr.trim()}`, "YYYY-MM-DD HH:mm"),
                end: moment(`${dataReferencia} ${fimStr.trim()}`, "YYYY-MM-DD HH:mm")
            };
        }).filter(Boolean).sort((a, b) => a.start - b.start);
    };

    // Helper seguro para números do Frontmatter
    const getNum = (val) => {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? 0 : parsed;
    };

    try {
        new Notice("⏱️ Iniciando SOTA Precision Engine v5.0...", 2000);

        // ====================================================================
        // FASE 3: EXTRAÇÃO (E)
        // ====================================================================
        
        const notaDiariaFile = app.workspace.getActiveFile();
        if (!notaDiariaFile || !notaDiariaFile.basename.match(/^\d{4}-\d{2}-\d{2}$/)) {
            new Notice("❌ ERRO: Execute a partir de uma Nota Diária.");
            return;
        }
        const dataDoDia = notaDiariaFile.basename;
        const hojeMoment = moment(dataDoDia, "YYYY-MM-DD");

        // 3.1 Logs Brutos (Timeline)
        const logBrutoPath = `${config.logsDiariosPath}/${dataDoDia}.md`;
        const logBrutoFile = app.vault.getAbstractFileByPath(logBrutoPath);
        let logsDoDia = [];
        if (logBrutoFile instanceof TFile) {
            const logContent = await app.vault.cachedRead(logBrutoFile);
            logsDoDia = logContent.split('\n').filter(l => l.trim() !== '');
        }

        // 3.2 Metadados da Nota Diária (Agora focados em Sono e Texto)
        const cacheNotaDiaria = app.metadataCache.getFileCache(notaDiariaFile);
        const fm = cacheNotaDiaria?.frontmatter || {};

        // 3.3 Dados do Dataview (Tarefas & Hábitos)
        const dv = app.plugins.plugins.dataview?.api;
        if (!dv) { new Notice("❌ ERRO: Dataview inativo."); return; }
        
        // Removido filtro de frequência para garantir captura de todos os ativos
        const habitosAtivos = dv.pages(`"${config.codexHabitosPath}"`)
            .where(p => p.tipo_habito === 'habito' && p.ativo !== false).values;
        
        sotaLog(`Hábitos ativos encontrados: ${habitosAtivos.length}`);
        
        // --- LÓGICA DE TAREFAS (SOTA v4.2 - Robustez Temporal) ---
        // 1. Otimização de Busca
        const pagesTouched = dv.pages().where(p => p.file.mtime >= hojeMoment.startOf('day'));

        // 2. Filtro Cirúrgico
        const rawTasks = pagesTouched.file.tasks.where(t => {
            if (!t.completed || !t.completion) return false;
            const dataTaskStr = t.completion.toFormat("yyyy-MM-dd");
            return dataTaskStr === dataDoDia; 
        });

        // 3. Desduplicação
        const uniqueTasksMap = new Map();
        for (const t of rawTasks) {
            const uniqueKey = t.id ? t.id : t.text.replace(/\[.*?\]/g, '').trim();
            if (!uniqueTasksMap.has(uniqueKey)) {
                uniqueTasksMap.set(uniqueKey, t);
            }
        }
        
        const tarefasConcluidasHoje = Array.from(uniqueTasksMap.values());

        // 3.4 Perfil (Multiplicadores)
        const perfilFile = app.vault.getAbstractFileByPath(config.perfilSotaPath);
        const cachePerfil = app.metadataCache.getFileCache(perfilFile);
        const fmPerfil = cachePerfil?.frontmatter || {};

        // Calculo de Load Factor (Complexidade do Dia)
        const layersAtivas = [
            fmPerfil.layer_natureza_blocada,
            fmPerfil.layer_natureza_fluida,
            fmPerfil.layer_natureza_fragmentada
        ].filter(Boolean).length;
        
        let loadFactor = 1.0;
        if (layersAtivas === 2) loadFactor = MULT_COMPLEXIDADE_2;
        if (layersAtivas >= 3) loadFactor = MULT_COMPLEXIDADE_3;

        // ====================================================================
        // FASE 4: TRANSFORMAÇÃO (T) - O Coração Atômico
        // ====================================================================

        // Buckets de Tempo
        let bucketFoco = { interna: 0, externa: 0 };
        let bucketPausa = { interna: 0, externa: 0 };
        let countSessoesFoco = { interna: 0, externa: 0 };
        let countSessoesPausa = { interna: 0, externa: 0 };

        // Buckets de XP Separados
        let xpOriundoFoco = 0;   
        let xpOriundoEventos = 0; 
        let xpOriundoTreinoTempo = 0;

        const breakdownLogs = {
            foco: [],
            tarefas: [],
            habitos: [],
            eventos: []
        };

        const destaques = {
            tarefa: { nome: "N/A", xp: 0 },
            habito: { nome: "N/A", xp: 0 },
            evento: { tipo: "N/A", xp: 0 }
        };

        // Contadores de Eventos (Quantified Self)
        let counters = {
            refeicoesBoas: 0,
            refeicoesRuins: 0,
            distracoes: 0,
            wins: 0,
            insights: 0, 
            erros: 0,
            felicidade: 0,
            estresse: 0,
            tristeza: 0,
            exerciciosLogados: 0
        };

        // Acumuladores de Bio-Ritmo (Event-Based SOTA v5.0)
        let bioAcumulador = {
            energiaSoma: 0,
            humorSoma: 0,
            countEnergia: 0,
            countHumor: 0
        };

        // Sets para Contexto
        let contextSets = {
            midias: new Set(),
            projetos: new Set(),
            exercicios: new Set()
        };

        // --- 4.1 PROCESSAMENTO DE LOGS (TEMPO E EVENTOS) ---
        logsDoDia.forEach(log => {
            // Extração de Dados Comuns
            const soberaniaMatch = log.match(/\(soberania::(interna|externa)\)/);
            const soberania = soberaniaMatch ? soberaniaMatch[1] : 'externa';
            const duracaoMatch = log.match(/\(duracao_total_sessao_segundos::\s*(\d+)\)/);
            const segundosRaw = duracaoMatch ? parseInt(duracaoMatch[1]) : 0;

            // Extração de Bio-Ritmo por Evento
            const energiaMatch = log.match(/\(energia::(\d+)\)/);
            const humorMatch = log.match(/\(humor::(\d+)\)/);

            if (energiaMatch) {
                bioAcumulador.energiaSoma += parseInt(energiaMatch[1]);
                bioAcumulador.countEnergia++;
            }
            if (humorMatch) {
                // Humor vem de 1 a 5, normalizamos para 0-100 para cálculo de média consistente
                bioAcumulador.humorSoma += parseInt(humorMatch[1]);
                bioAcumulador.countHumor++;
            }

            // A. LÓGICA DE FOCO (WORK)
            if (log.includes('(sessao_fim::WORK)')) {
                const isTreino = log.includes("#exercicio/") || log.includes("exercicio_id");
                
                if (soberania === 'interna') {
                    bucketFoco.interna += segundosRaw;
                    countSessoesFoco.interna++;
                } else {
                    bucketFoco.externa += segundosRaw;
                    countSessoesFoco.externa++;
                }

                // Cálculo de XP de Foco (Base)
                let xpSessao = 0;

                if (isTreino) {
                    // MUDANÇA: XP Turbinado para Treino (50 XP por hora = ~0.833 XP/min)
                    // (segundos / 60) * 0.833
                    xpSessao = (segundosRaw / 60) * 0.833;
                    xpOriundoTreinoTempo += xpSessao;
                } else {
                    // Padrão para Intelecto (10 XP por 25min = 0.4 XP/min)
                    xpSessao = (segundosRaw / 1500) * matrizXP.pomodoro_base;
                }

                // Bônus de Overtime
                const extraMatch = log.match(/\(duracao_extra_segundos::\s*(\d+)\)/);
                if (extraMatch) {
                    const extraSeg = parseInt(extraMatch[1]);
                    const baseSeg = Math.max(0, segundosRaw - extraSeg);
                    if (baseSeg > 2700) {
                        const blocosOvertime = Math.floor(extraSeg / 480); 
                        if (blocosOvertime > 0) xpSessao *= (1 + (blocosOvertime * 0.15));
                    }
                }
                
                // MUDANÇA: Separação de Destino do XP
                if (isTreino) {
                    // Cria uma propriedade temporária no objeto global 'counters' ou similar para somar XP de treino
                    // Ou simplesmente adicionamos ao xpOriundoEventos por enquanto, mas marcando a origem
                    // Vamos criar uma variável nova lá em cima? Não, vamos somar em xpOriundoFoco mas saberemos separar depois?
                    // Melhor: Vamos criar uma variável específica.
                    
                    // Adicione 'xpTempoTreino' nas variáveis lá no início do script (veja passo 0 abaixo)
                    xpOriundoTreinoTempo += xpSessao; 
                } else {
                    xpOriundoFoco += xpSessao;
                }

                // Rastreia o breakdown
                const tarefaNome = log.match(/\(tarefa_focada::"(.*?)"\)/)?.[1] || "Sessão sem nome";
                breakdownLogs.foco.push({
                    tarefa: tarefaNome.replace(/\[🍅.*?\]/, '').replace(/\*\*/g, '').trim(),
                    duracao_seg: segundosRaw,
                    xp: Math.round(xpSessao)
                });

                // Extração de Contexto
                const projetoMatch = log.match(/#projeto\/([\w-]+)/);
                if (projetoMatch) contextSets.projetos.add(projetoMatch[1]);

                const midiaMatch = log.match(/#midia\/[\w-]+\/([\w-]+)/);
                if (midiaMatch) contextSets.midias.add(midiaMatch[1]);
                
                const exercicioMatch = log.match(/#exercicio\/[^\/]+\/([^\/\s]+)/) || log.match(/\(exercicio_id::(.*?)\)/);
                if (exercicioMatch) {
                    contextSets.exercicios.add(exercicioMatch[1]);
                }
            }

            // B. LÓGICA DE PAUSA (BREAK)
            else if (log.includes('(sessao_fim::BREAK)')) {
                if (soberania === 'interna') {
                    bucketPausa.interna += segundosRaw;
                    countSessoesPausa.interna++;
                } else {
                    bucketPausa.externa += segundosRaw;
                    countSessoesPausa.externa++;
                }
            }

            // C. EVENTOS E ESTADOS
            if (log.includes('#exercicio/')) {
                counters.exerciciosLogados++;
            }
            if (log.includes('#ideia') || log.includes('#reflexao')) {
                counters.insights++;
                const xp = matrizXP.insight;
                xpOriundoEventos += xp;
                breakdownLogs.eventos.push({ tipo: "Insight", xp: xp });
                if (xp > destaques.evento.xp) destaques.evento = { tipo: "Insight", xp: xp };
            }
            if (log.includes('#aprendizado_erro')) {
                counters.erros++;
                const xp = matrizXP.aprendizado_erro;
                xpOriundoEventos += xp;
                breakdownLogs.eventos.push({ tipo: "Erro", xp: xp });
                if (xp > destaques.evento.xp) destaques.evento = { tipo: "Erro", xp: xp };
            }
            if (log.includes('#win')) {
                counters.wins++;
                const xp = matrizXP.win;
                xpOriundoEventos += xp;
                breakdownLogs.eventos.push({ tipo: "Win", xp: xp });
                if (xp > destaques.evento.xp) destaques.evento = { tipo: "Win", xp: xp };
            }
            if (log.includes('#distracao')) {
                counters.distracoes++;
                const xp = matrizXP.distracao;
                xpOriundoEventos += xp;
                breakdownLogs.eventos.push({ tipo: "Distração", xp: xp });
                if (xp > destaques.evento.xp) destaques.evento = { tipo: "Distração", xp: xp };
            }
            
            // Nutrição e Emoções
            if (log.includes('#refeicao_boa')) {
                counters.refeicoesBoas++;
                const xp = matrizXP.refeicao_boa;
                xpOriundoEventos += xp;
                breakdownLogs.eventos.push({ tipo: "Refeição Boa", xp: xp });
                if (xp > destaques.evento.xp) destaques.evento = { tipo: "Refeição Boa", xp: xp };
            }
            if (log.includes('#refeicao_ruim')) {
                counters.refeicoesRuins++;
                const xp = matrizXP.refeicao_ruim;
                xpOriundoEventos += xp;
                breakdownLogs.eventos.push({ tipo: "Refeição Ruim", xp: xp });
                if (xp > destaques.evento.xp) destaques.evento = { tipo: "Refeição Ruim", xp: xp };
            }
            
            if (log.includes('#log_felicidade')) {
                counters.felicidade++;
                const xp = matrizXP.felicidade;
                xpOriundoEventos += xp;
                breakdownLogs.eventos.push({ tipo: "Felicidade", xp: xp });
                if (xp > destaques.evento.xp) destaques.evento = { tipo: "Felicidade", xp: xp };
            }
            if (log.includes('#log_estresse')) {
                counters.estresse++;
                const xp = -2;
                xpOriundoEventos += xp;
                breakdownLogs.eventos.push({ tipo: "Estresse", xp: xp });
                if (xp > destaques.evento.xp) destaques.evento = { tipo: "Estresse", xp: xp };
            }
            if (log.includes('#log_tristeza')) {
                counters.tristeza++;
                const xp = matrizXP.tristeza;
                xpOriundoEventos += xp;
                breakdownLogs.eventos.push({ tipo: "Tristeza", xp: xp });
                if (xp > destaques.evento.xp) destaques.evento = { tipo: "Tristeza", xp: xp };
            }
        });

        // --- 4.2 PROCESSAMENTO DE TAREFAS (RESULTADO) ---
        let xpOriundoTasks = 0;
        let countTasksPorDif = { trivial: 0, facil: 0, moderado: 0, desafiador: 0, hardcore: 0 };

        tarefasConcluidasHoje.forEach(task => {
            const matchDificuldade = task.text.match(/#nivel\/dificuldade\/(\w+)/);
            let xp = matrizXP.tarefas['trivial'];
            let dif = 'trivial';

            if (matchDificuldade) {
                dif = matchDificuldade[1].toLowerCase();
                if (matrizXP.tarefas[dif]) {
                    xp = matrizXP.tarefas[dif];
                }
            }
            
            xpOriundoTasks += xp;
            if (countTasksPorDif[dif] !== undefined) countTasksPorDif[dif]++;
            
            const nomeLimpo = task.text.replace(/\[.*?\]/g, '').replace(/#\S+/g, '').replace(/\*\*/g, '').trim();
            breakdownLogs.tarefas.push({ nome: nomeLimpo, dificuldade: dif, xp: xp });
            if (xp > destaques.tarefa.xp) destaques.tarefa = { nome: nomeLimpo, xp: xp };
        });

        // --- 4.3 PROCESSAMENTO DE HÁBITOS (CONSISTÊNCIA) ---
        let xpOriundoHabitos = { saude: 0, genio: 0, paz: 0 };
        let habitosCompletosCount = 0;
        let potencialXPHabitos = 0;

        habitosAtivos.forEach(habito => {
            const valorXP = matrizXP.habitos[habito.tier_desafio] || 5;
            potencialXPHabitos += valorXP;
            
            // Tenta ID sanitizado ou ID direto
            const idRaw = habito.id_habito;
            // O registrarProgressoHabito.js usa id_habito direto, mas pode ter sanitização diferente
            // A chave no frontmatter da daily note é sempre "habito_{ID}"?
            // Vamos verificar se o script de registro salva no frontmatter.
            // ESPERA! O registrarConclusaoHabito.js SALVA NO LOG, mas NÃO ATUALIZA O FRONTMATTER da nota diária com "habito_X: true".
            // Ele apenas adiciona a linha de log "- [x] Hábito...".
            
            // CORREÇÃO CRÍTICA: Se o script não lê as linhas de log para hábitos, ele nunca vai achar.
            // O script atual CONFIA no frontmatter (fm[habitoId]).
            // Se o seu registrarProgresso não salva no frontmatter, essa lógica falha.
            
            // Vamos mudar a estratégia para LER OS LOGS (logsDoDia), que é a fonte da verdade.
            
            let cumprido = false;
            const regexBinario = new RegExp(`#habito_concluido.*\\(id_habito::\\s*${idRaw}\\)`);
            const regexContador = new RegExp(`#habito_registro.*\\(id_habito::\\s*${idRaw}\\).*\\(valor::\\s*(\\d+)`);
            
            // Verifica nos logs do dia
            const logBinario = logsDoDia.some(l => regexBinario.test(l));
            
            if (habito.tipo_input === 'numerico') {
                let somaValor = 0;
                logsDoDia.forEach(l => {
                    const match = l.match(regexContador);
                    if (match) somaValor += parseInt(match[1]);
                });
                if (somaValor >= (habito.meta_numerica || 1)) cumprido = true;
            } else {
                if (logBinario) cumprido = true;
            }

            if (cumprido) {
                habitosCompletosCount++;
                const pilar = (habito.categoria_impacto || "Geral").toLowerCase().replace(' de espírito', '');
                
                if (xpOriundoHabitos[pilar] !== undefined) xpOriundoHabitos[pilar] += valorXP;
                else xpOriundoHabitos['genio'] += valorXP; // Fallback

                breakdownLogs.habitos.push({ nome: habito.nome_habito, pilar: pilar, xp: valorXP });
                if (valorXP > destaques.habito.xp) destaques.habito = { nome: habito.nome_habito, xp: valorXP };
            }
        });

        // --- 4.4 BIO-RITMO (Médias Reais dos Logs) ---
        // SOTA v5.0: Se não houver logs (dia off), assume neutro (50 energia, 3 humor)
        const energiaMedia = bioAcumulador.countEnergia > 0 
            ? Math.round(bioAcumulador.energiaSoma / bioAcumulador.countEnergia) 
            : 50;

        // Humor médio mantido na escala 1-5 float para precisão
        const humorMedia = bioAcumulador.countHumor > 0 
            ? parseFloat((bioAcumulador.humorSoma / bioAcumulador.countHumor).toFixed(1)) 
            : 3;


        // ====================================================================
        // FASE 5: ALGORITMO DE SONO SOTA v5.0 (Higiene Retroativa)
        // ====================================================================
        
        // 6.1 Leitura do Arquivo de Ontem
        const dataOntem = hojeMoment.clone().subtract(1, 'days').format("YYYY-MM-DD");
        const caminhoNotaOntem = `01 - Registros/01. Daily/${hojeMoment.format("YYYY")}/${hojeMoment.format("MM")}/${dataOntem}.md`; // Ajuste de mês pode ser tricky se virou o mês, mas moment resolve
        // Correção de caminho para virada de mês/ano seguro:
        const pathOntemSafe = `01 - Registros/01. Daily/${moment(dataOntem).format("YYYY")}/${moment(dataOntem).format("MM")}/${dataOntem}.md`;
        
        const fileOntem = app.vault.getAbstractFileByPath(pathOntemSafe);
        const fmOntem = fileOntem ? app.metadataCache.getFileCache(fileOntem)?.frontmatter : {};

        // 6.2 Pontuação de Higiene (Baseado em Ontem + Ação de Hoje)
        // Cada item vale 10 pontos. Total Possível: 50.
        let scoreHigiene = 0;
        
        // Dados de Ontem (Ações Noturnas)
        if (fmOntem?.higiene_cafeina_off_15h) scoreHigiene += 10;
        if (fmOntem?.higiene_luz_ambiente_noturna) scoreHigiene += 10;
        if (fmOntem?.higiene_sem_telas_antes_dormir) scoreHigiene += 10;
        if (fmOntem?.higiene_ambiente_sono_otimizado) scoreHigiene += 10;
        
        // Dado de Hoje (Ação Matinal)
        if (fm.higiene_luz_solar_manha) scoreHigiene += 10;

        // 6.3 Pontuação de Duração (Base 50 pontos)
        // Conversão de "HH:mm" para float horas
        let horasSono = 0;
        if (fm.total_horas_sono) {
            const [h, m] = fm.total_horas_sono.split(':').map(Number);
            horasSono = h + (m / 60);
        }

        let scoreDuracao = 0;
        if (horasSono >= 7.5 && horasSono <= 9) scoreDuracao = 50; // Otimizado
        else if (horasSono >= 6 && horasSono < 7.5) scoreDuracao = 35;
        else if (horasSono >= 4 && horasSono < 6) scoreDuracao = 15;
        else if (horasSono > 9) scoreDuracao = 40; // Excesso leve
        else scoreDuracao = 0; // Crítico (<4h)

        // 6.4 Penalidades e Ajustes
        let penalidade = 0;
        if (fm.sono_interrupcoes) penalidade += 10;
        
        // Verifica Logs de Madrugada (00h-05h)
        // Se houver logs WORK nesse horário, penaliza a arquitetura do sono
        // Nota: logsDoDia já foi lido.
        const temAtividadeMadrugada = logsDoDia.some(l => {
            const timeMatch = l.match(/\(log_time::\s*(\d{2}):/);
            if (timeMatch) {
                const h = parseInt(timeMatch[1]);
                return h >= 0 && h < 5 && l.includes("sessao_fim::WORK");
            }
            return false;
        });

        if (temAtividadeMadrugada) {
            penalidade += 20; // Penalidade Severa por disruptor circadiano
        }

        // 6.5 Cálculo Final
        let qualidadeSonoFinal = (scoreHigiene + scoreDuracao) - penalidade;
        qualidadeSonoFinal = Math.max(0, Math.min(100, qualidadeSonoFinal)); // Clamp 0-100


        // ====================================================================
        // FASE 6: CONSOLIDAÇÃO & MATEMÁTICA DE XP
        // ====================================================================

        const totalFocoSegundos = bucketFoco.interna + bucketFoco.externa;
        const totalPausaSegundos = bucketPausa.interna + bucketPausa.externa;
        const tempoTotalSegundos = totalFocoSegundos + totalPausaSegundos;
        
        let ratioEficiencia = 0;
        if (tempoTotalSegundos > 0) ratioEficiencia = parseFloat(((totalFocoSegundos / tempoTotalSegundos) * 100).toFixed(2));

        // 1. PILAR GÊNIO
        let xpEsforcoAtivo = xpOriundoTasks + xpOriundoFoco;
        let xpEsforcoComBonus = xpEsforcoAtivo * loadFactor;
        let xpOutrosGenio = (counters.insights * matrizXP.insight) + 
                            (counters.erros * matrizXP.aprendizado_erro) + 
                            xpOriundoHabitos.genio;
        let totalGenio = xpEsforcoComBonus + xpOutrosGenio;

        // 2. PILAR SAÚDE
        let xpNutri = (counters.refeicoesBoas * matrizXP.refeicao_boa) + 
                      (counters.refeicoesRuins * matrizXP.refeicao_ruim);
        
        // MUDANÇA: XP de Sono (Metade do Score de Qualidade)
        let xpSono = Math.round(qualidadeSonoFinal / 2); // Ex: 80% = 40 XP

        let totalSaude = (counters.exerciciosLogados * matrizXP.exercicio) + 
                         xpOriundoHabitos.saude + 
                         xpNutri +
                         xpOriundoTreinoTempo + // Adiciona o tempo de treino
                         xpSono; // Adiciona o sono

        // 3. PILAR PAZ (ESPÍRITO)
        // Bônus de Estado (State-Based XP)
        let bonusHumor = 0;
        if (humorMedia >= 3) bonusHumor = 30;      // Humor Alto (3 ou 5) = +30 XP
        else if (humorMedia >= 2) bonusHumor = 15;  // Humor Neutro (2) = +15 XP

        let bonusEnergia = 0;
        if (energiaMedia > 45) bonusEnergia = 40;  // Energia > 45% = +40 XP

        let totalPaz = (counters.wins * matrizXP.win) + 
                       (counters.felicidade * matrizXP.felicidade) + 
                       xpOriundoHabitos.paz + 
                       bonusHumor + 
                       bonusEnergia - 
                       (counters.estresse * 2);

        let xpDiaTotal = totalGenio + totalSaude + totalPaz;


        // --- CONSTRUÇÃO DOS OBJETOS DE BREAKDOWN (CORRIGIDO) ---
        const xp_breakdown = {
            total: Math.round(xpDiaTotal),
            pilares: {
                genio: Math.round(totalGenio),
                saude: Math.round(totalSaude),
                paz: Math.round(totalPaz)
            },
            fontes: {
                foco: Math.round(xpOriundoFoco),
                tarefas: Math.round(xpOriundoTasks),
                habitos: Math.round(Object.values(xpOriundoHabitos).reduce((a, b) => a + b, 0)),
                
                // MUDANÇA 1: Treino agora soma Tempo + XP Fixo por Sessão
                treino: Math.round(xpOriundoTreinoTempo + (counters.exerciciosLogados * matrizXP.exercicio)),
                
                // MUDANÇA 2: Eventos agora soma Eventos Logados + Bônus de Estado (Humor/Energia)
                eventos: Math.round(xpOriundoEventos + bonusHumor + bonusEnergia),
                
                sono: Math.round(xpSono)
            },
            destaques: destaques,
            logs: breakdownLogs 
        };
        
        const sono_breakdown = {
            score_final: qualidadeSonoFinal,
            componentes: {
                higiene: { score: scoreHigiene, max: 50 },
                duracao: { score: scoreDuracao, max: 50, horas: horasSono.toFixed(1) }
            },
            ajustes: {
                penalidade_interrupcoes: fm.sono_interrupcoes ? -10 : 0,
                penalidade_atividade_madrugada: temAtividadeMadrugada ? -20 : 0
            }
        };

        // --- OBJETO FINAL (OUTPUT DATA) ---
        let outputData = {
            data: dataDoDia,
            xp_breakdown: xp_breakdown,
            sono_breakdown: sono_breakdown,
            
            // --- XP CONSOLIDADO ---
            xp_saude: Math.round(totalSaude),
            xp_genio: Math.round(totalGenio),
            xp_paz_espirito: Math.round(totalPaz),
            xp_dia_total: Math.round(xpDiaTotal),

            // --- DETALHAMENTO ---
            xp_origem_tasks: Math.round(xpOriundoTasks),
            xp_origem_foco: Math.round(xpOriundoFoco),
            xp_origem_habitos: Math.round(xpOriundoHabitos.saude + xpOriundoHabitos.genio + xpOriundoHabitos.paz),
            xp_origem_eventos: Math.round(xpOriundoEventos),
            fator_complexidade_aplicado: loadFactor,

            // --- BIO-RITMO AGREGADO (SOTA v5.0) ---
            // Removemos os campos _manha, _tarde antigos pois não são mais usados no cálculo
            // Mantemos apenas as médias reais calculadas dos logs
            energia_media_dia: energiaMedia,
            humor_media_dia: humorMedia,
            
            // --- QUANTIFIED SELF ---
            qtd_refeicoes_boas: counters.refeicoesBoas,
            qtd_refeicoes_ruins: counters.refeicoesRuins,
            qtd_distracoes: counters.distracoes,
            qtd_wins: counters.wins,
            qtd_insights: counters.insights,
            qtd_erros: counters.erros,
            qtd_exercicios_series: counters.exerciciosLogados,
            estados_emocionais: {
                felicidade: counters.felicidade,
                estresse: counters.estresse,
                tristeza: counters.tristeza
            },

            // --- CONTEXTO ---
            projetos_focados_ids: Array.from(contextSets.projetos),
            midias_consumidas_ids: Array.from(contextSets.midias),
            exercicios_realizados_ids: Array.from(contextSets.exercicios),

            // --- TIME METRICS ---
            foco_interno_segundos: bucketFoco.interna,
            foco_interno_horas: formatDecimalHours(bucketFoco.interna),
            foco_externo_segundos: bucketFoco.externa,
            foco_externo_horas: formatDecimalHours(bucketFoco.externa),
            
            total_foco_segundos: totalFocoSegundos,
            total_foco_horas: formatDecimalHours(totalFocoSegundos),
            total_foco_tempo: formatHumanTime(totalFocoSegundos),
            total_foco_sessoes: countSessoesFoco.interna + countSessoesFoco.externa,

            total_pausa_segundos: totalPausaSegundos,
            total_pausa_tempo: formatHumanTime(totalPausaSegundos),
            total_pausa_sessoes: countSessoesPausa.interna + countSessoesPausa.externa,
            ratio_foco_pausa_percentual: ratioEficiencia,

            // --- TASKS & HABITOS ---
            habitos_completos: habitosCompletosCount,
            tarefas_concluidas_total: tarefasConcluidasHoje.length,
            tarefas_por_dificuldade: countTasksPorDif,

            // --- SONO (SOTA v5.0 Precision) ---
            total_horas_sono: horasSono,
            qualidade_sono_calculada: qualidadeSonoFinal,
            score_higiene_sono: scoreHigiene, // Dado extra para debug/análise
            
            aderencia_habitos: potencialXPHabitos > 0 
                ? Math.round(((xpOriundoHabitos.saude + xpOriundoHabitos.genio + xpOriundoHabitos.paz) / potencialXPHabitos) * 100) 
                : 100
        };

        // 5. Gravação em Disco
        const metricasPath = `${config.metricasProcessadasPath}/${dataDoDia}_metrics.md`;
        const metricasFile = app.vault.getAbstractFileByPath(metricasPath);
        
        if (metricasFile instanceof TFile) {
            await app.fileManager.processFrontMatter(metricasFile, (fmMetricas) => {
                Object.keys(outputData).forEach(key => fmMetricas[key] = outputData[key]);
            });
        } else {
            if (!await app.vault.adapter.exists(config.metricasProcessadasPath)) {
                await app.vault.createFolder(config.metricasProcessadasPath);
            }
            const conteudoInicial = `---\n${obsidian.stringifyYaml(outputData)}---\n\n# Métricas Processadas - ${dataDoDia}`;
            await app.vault.create(metricasPath, conteudoInicial);
        }

        // ====================================================================
        // 6. LEVEL UP SYSTEM
        // ====================================================================

        let xpTotalVitalicio = fmPerfil.xp_total_acumulado || 0;
        let xpBarraAtual = fmPerfil.xp_barra_atual || 0; 
        
        if (!fmPerfil.xp_barra_atual && fmPerfil.xp_total_acumulado < fmPerfil.xp_para_proximo_nivel) {
             xpBarraAtual = fmPerfil.xp_total_acumulado;
        }

        xpTotalVitalicio += outputData.xp_dia_total;
        xpBarraAtual += outputData.xp_dia_total;

        let nivelAtual = fmPerfil.nivel || 1;
        let xpParaProximo = fmPerfil.xp_para_proximo_nivel || 100;
        let levelUpOcorreu = false;

        while (xpBarraAtual >= xpParaProximo) {
            xpBarraAtual -= xpParaProximo;
            nivelAtual++;
            xpParaProximo = Math.floor(100 * (1 + (nivelAtual * 0.25))); 
            levelUpOcorreu = true;
        }

        await app.fileManager.processFrontMatter(perfilFile, (fmPerfilUp) => {
            fmPerfilUp.xp_total_acumulado = Math.round(xpTotalVitalicio);
            fmPerfilUp.xp_barra_atual = Math.round(xpBarraAtual);
            fmPerfilUp.nivel = nivelAtual;
            fmPerfilUp.xp_para_proximo_nivel = xpParaProximo;
            
            fmPerfilUp.total_historico_genio = (fmPerfilUp.total_historico_genio || 0) + outputData.xp_genio;
            fmPerfilUp.total_historico_saude = (fmPerfilUp.total_historico_saude || 0) + outputData.xp_saude;
            fmPerfilUp.total_historico_paz = (fmPerfilUp.total_historico_paz || 0) + outputData.xp_paz_espirito;
        });

        if (levelUpOcorreu) {
            new Notice(`🌟 LEVEL UP! Você alcançou o Nível ${nivelAtual}!`, 10000);
        } else {
            const progresso = Math.round((xpBarraAtual / xpParaProximo) * 100);
            new Notice(`📊 XP do Dia: ${outputData.xp_dia_total} | Progresso: ${progresso}% para Nível ${nivelAtual + 1}`);
        }
        
        setTimeout(() => app.workspace.trigger("dataview:refresh-views"), 500);

    } catch (error) {
        console.error("ERRO CRÍTICO no SOTA Precision Engine:", error);
        new Notice("❌ Falha crítica ao processar o dia. Verifique o console.");
    }
};