// SOTA - consultarCoach.js v2.2
// Coleta inventário, histórico, contexto temporal, ANOTAÇÕES subjetivas e BIO-DADOS (Sono/Nutrição).

module.exports = async (params) => {
    const { app, quickAddApi: qa, obsidian } = params;
    const { Notice, TFile, moment } = obsidian;


    // --- INÍCIO DO BLOCO DE AVISO ---
    const confirmacao = await qa.yesNoPrompt(
        "⚠️ Aviso de Validação Humana", 
        "Lembre-se: O Documento gerado vai alimentar uma IA. A IA pode alucinar ou sugerir exercícios inadequados. Use seu julgamento e conhecimento para validar o plano final. Você é o responsável."
    );
    if (!confirmacao) {
        new Notice("Operação cancelada.");
        return; // Aborta o script se o usuário clicar em "Não"
    }
    // --- FIM DO BLOCO DE AVISO ---


    // --- CONFIGURAÇÃO ---
    const config = {
        logs_path: "99 - BACKEND/Logs_Metricas/Exercicios/raw_logs.md",
        briefing_folder: "01 - Registros/Análises (AI)", 
        exercicios_folder: "04 - Corpo & Movimento/01 - Exercícios Físicos/01. Manual/Exercícios",
        grupos_folder: "04 - Corpo & Movimento/01 - Exercícios Físicos/01. Manual/Grupos Musculares",
        sessoes_folder: "04 - Corpo & Movimento/01 - Exercícios Físicos/03. Sessões de Treino",
        metrics_processed_folder: "99 - BACKEND/Logs_Metricas/Daily/Processed" // NOVO CAMINHO
    };

    // --- FUNÇÕES AUXILIARES ---
    const sanitizarParaId = (str) => {
        if (!str) return "";
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[-\s]+/g, '_').replace(/[^\w_]+/g, '');
    };

    try {
        // 1. CONTEXTO TEMPORAL
        const agora = moment();
        const dataHoje = agora.format("YYYY-MM-DD");
        const horaAtual = agora.format("HH:mm");
        const startDateLogs = agora.clone().subtract(14, 'days');
        const startDateBio = agora.clone().subtract(7, 'days'); // Janela curta para Bio-dados

        new Notice("📡 Coletando dados integrados do S.O.T.A...");

        // 2. LEVANTAMENTO DE INVENTÁRIO
        const arquivosExercicios = app.vault.getMarkdownFiles().filter(f => f.path.startsWith(config.exercicios_folder));
        let inventarioMap = [];
        arquivosExercicios.forEach(f => {
            inventarioMap.push(`- **Nome:** "${f.basename}" | **ID:** ${sanitizarParaId(f.basename)} | **Grupo:** ${f.parent.name}`);
        });

        // 3. LEVANTAMENTO DE ESTRUTURA
        const arquivosGrupos = app.vault.getMarkdownFiles().filter(f => f.path.startsWith(config.grupos_folder));
        let whitelistPastas = arquivosGrupos.map(f => f.basename);

        // 4. ESTADO DA SESSÃO DE HOJE
        let statusHoje = "Nenhuma sessão criada para hoje.";
        let tarefasConcluidasHoje = [];
        let tarefasPendentesHoje = [];
        
        const pathHoje = `${config.sessoes_folder}/${agora.format("YYYY")}/${agora.format("MM")}/${dataHoje}.md`;
        const fileHoje = app.vault.getAbstractFileByPath(pathHoje);

        if (fileHoje instanceof TFile) {
            const contentHoje = await app.vault.read(fileHoje);
            const linhas = contentHoje.split('\n');
            let temCheckbox = false;

            linhas.forEach(linha => {
                if (linha.includes("- [x]")) {
                    tarefasConcluidasHoje.push(linha.trim());
                    temCheckbox = true;
                } else if (linha.includes("- [ ]")) {
                    tarefasPendentesHoje.push(linha.trim());
                    temCheckbox = true;
                }
            });

            if (temCheckbox) {
                statusHoje = `Sessão existente. Concluídas: ${tarefasConcluidasHoje.length} | Pendentes: ${tarefasPendentesHoje.length}`;
            }
        }

        // 5. PROCESSAMENTO DE LOGS (HISTÓRICO RECENTE)
        // Nota: Este é o log antigo/centralizado. Idealmente deveria varrer pastas shardadas, 
        // mas mantemos a lógica v2.1 para compatibilidade rápida se ainda houver uso.
        // A lógica de shard já está nos dashboards, aqui é um resumo rápido.
        const logFile = app.vault.getAbstractFileByPath(config.logs_path);
        let resumoLogs = [];
        
        if (logFile) {
            const rawLogs = await app.vault.read(logFile);
            const logsArray = rawLogs.split('\n').filter(l => l.includes("(sessao_fim::WORK)"));
            const logsRecentes = logsArray.filter(log => {
                const dateMatch = log.match(/\(log_date::\s*(\d{4}-\d{2}-\d{2})\)/);
                if (!dateMatch) return false;
                return moment(dateMatch[1]).isSameOrAfter(startDateLogs);
            });

            logsRecentes.forEach(log => {
                const data = log.match(/\(log_date::\s*(.*?)\)/)?.[1] || "N/D";
                const exercicio = log.match(/#exercicio\/[\w-]+\/([\w-]+)/)?.[1] || "N/D";
                const carga = log.match(/\(carga_kg::\s*([\d.]+)\)/)?.[1] || "0";
                const reps = log.match(/\(reps_feito::\s*(\d+)\)/)?.[1] || "0";
                const rpe = log.match(/\(esforco_rpe::\s*(\d+)\)/)?.[1] || "-";
                resumoLogs.push(`| ${data} | ${exercicio} | ${carga}kg | ${reps} reps | RPE ${rpe} |`);
            });
        }

        // 6. EXTRAÇÃO DE ANOTAÇÕES (Últimos 14 dias)
        const arquivosSessao = app.vault.getMarkdownFiles().filter(f => 
            f.path.startsWith(config.sessoes_folder) && 
            moment(f.basename, "YYYY-MM-DD", true).isValid() &&
            moment(f.basename).isSameOrAfter(startDateLogs)
        );

        let anotacoesFm = [];
        for (const file of arquivosSessao) {
            const cache = app.metadataCache.getFileCache(file);
            const anotacao = cache?.frontmatter?.anotacao;
            if (anotacao && anotacao.trim() !== "") {
                anotacoesFm.push(`- **${file.basename}**: "${anotacao.trim()}"`);
            }
        }
        anotacoesFm.sort().reverse();

        // --- NOVA LÓGICA: COLETA DE BIO-DADOS (NUTRIÇÃO E SONO) ---
        let bioDados = [];
        
        const diasBio = [];
        let currBio = startDateBio.clone();
        while (currBio.isSameOrBefore(agora)) {
            diasBio.push(currBio.format("YYYY-MM-DD"));
            currBio.add(1, 'days');
        }

        for (const dia of diasBio) {
            // 1. Lê Métricas Processadas (Para Sono e Energia)
            const metricsFile = app.vault.getAbstractFileByPath(`${config.metrics_processed_folder}/${dia}_metrics.md`);
            let sonoStr = "N/D";
            let energiaStr = "N/D";
            
            if (metricsFile) {
                const fm = app.metadataCache.getFileCache(metricsFile)?.frontmatter || {};
                
                // Formatação Decimal Segura para Sono
                const sonoVal = fm.total_horas_sono || 0;
                const sonoFmt = typeof sonoVal === 'number' ? sonoVal.toFixed(1) : sonoVal;
                
                sonoStr = `${sonoFmt}h (${fm.qualidade_sono_calculada || 0}%)`;
                energiaStr = `${fm.energia_media_dia || 0}%`;
            }

            // 2. Lê Log Bruto (Para o texto da Nutrição com Horário)
            const rawDailyPath = `99 - BACKEND/Logs_Metricas/Daily/${dia}.md`;
            const rawDailyFile = app.vault.getAbstractFileByPath(rawDailyPath);
            let nutricaoTexto = [];

            if (rawDailyFile) {
                const content = await app.vault.cachedRead(rawDailyFile);
                const lines = content.split('\n');
                
                lines.forEach(l => {
                    if (l.includes("#refeicao_boa") || l.includes("#refeicao_ruim")) {
                        const alimento = l.match(/\(Alimentos::\s*(.*?)\)/);
                        // Captura o horário do log
                        const timeMatch = l.match(/\(log_time::\s*(\d{2}:\d{2})/);
                        const horaLog = timeMatch ? timeMatch[1] : "";

                        if (alimento && alimento[1]) {
                            const tipo = l.includes("boa") ? "✅" : "❌";
                            // Adiciona o horário ao texto
                            const textoAlimento = horaLog ? `[${horaLog}] ${alimento[1]}` : alimento[1];
                            nutricaoTexto.push(`${tipo} ${textoAlimento}`);
                        }
                    }
                });
            }

            const nutricaoFinal = nutricaoTexto.length > 0 ? nutricaoTexto.join(", ") : "Sem registro";
            
            // Só adiciona se houver algum dado relevante
            if (metricsFile || nutricaoTexto.length > 0) {
                bioDados.push(`| ${dia} | ${sonoStr} | ${energiaStr} | ${nutricaoFinal} |`);
            }
        }
        
        bioDados.reverse();


        // 8. CONSTRUÇÃO DO ARQUIVO DE BRIEFING
        let briefing = `# 📋 Briefing para Coach S.O.T.A.\n`;
        briefing += `> **Data Atual:** ${dataHoje} | **Hora:** ${horaAtual}\n`;
        briefing += `> **Contexto:** Análise de performance, subjetividade e recuperação biológica.\n\n`;

        briefing += `## 1. Estado Atual (Hoje: ${dataHoje})\n`;
        briefing += `**Status:** ${statusHoje}\n`;
        if (tarefasConcluidasHoje.length > 0) {
            briefing += `**Já Realizado Hoje:**\n${tarefasConcluidasHoje.map(t => `> ${t}`).join('\n')}\n`;
        }
        if (tarefasPendentesHoje.length > 0) {
            briefing += `**Ainda Pendente Hoje (Se houver):**\n${tarefasPendentesHoje.map(t => `> ${t}`).join('\n')}\n`;
        }
        briefing += `\n---\n`;
        
        // NOVA SEÇÃO NO BRIEFING
        briefing += `## 2. Recuperação & Nutrição (Últimos 7 dias)\n`;
        briefing += `*Instrução: Analise a correlação entre Sono/Nutrição e a performance de treino. Se a recuperação estiver baixa, reduza o volume sugerido.*\n\n`;
        briefing += `| Data | Sono & Qualidade | Energia | Nutrição |\n|---|---|---|---|\n`;
        briefing += bioDados.length > 0 ? bioDados.join('\n') : "| - | Sem dados recentes | - | - |";
        briefing += `\n\n---\n`;

        briefing += `## 3. Anotações Subjetivas (Últimos 14 dias)\n`;
        briefing += `*Instrução: Feedbacks diretos sobre dor ou cansaço.*\n\n`;
        briefing += anotacoesFm.length > 0 ? anotacoesFm.join('\n') : "Nenhuma anotação subjetiva encontrada no período.";
        briefing += `\n\n---\n`;

        briefing += `## 4. Histórico de Carga (Últimos 14 dias)\n`;
        briefing += `| Data | Exercício (ID) | Carga | Reps | RPE |\n|---|---|---|---|---|\n`;
        briefing += resumoLogs.join('\n');
        briefing += `\n\n---\n`;

        briefing += `## 5. Inventário de Exercícios (Use estes nomes)\n`;
        briefing += `*Instrução: Se for necessário criar novos exercícios, crie. Não hesite em criar novos Exercícios. Você pode usar os exercícios que já existem nesta lista abaixo.*\n\n`;
        briefing += inventarioMap.join('\n');
        briefing += `\n\n---\n`;

        briefing += `## 6. Estrutura de Pastas (Whitelist)\n`;
        briefing += whitelistPastas.map(p => `- ${p}`).join('\n');
        
        // 7. SALVAR E ABRIR
        const nomeArquivo = `Contexto_Coach_${agora.format("YYYYMMDD_HHmm")}.md`;
        const pastaDestino = `${config.briefing_folder}/${agora.format("YYYY")}/${agora.format("MM")}`;
        if (!await app.vault.adapter.exists(pastaDestino)) await app.vault.createFolder(pastaDestino);
        
        const pathFinal = `${pastaDestino}/${nomeArquivo}`;
        const novoArquivo = await app.vault.create(pathFinal, briefing);

        await navigator.clipboard.writeText(briefing);
        new Notice(`✅ Dossiê Completo gerado!`);
        app.workspace.getLeaf(true).openFile(novoArquivo);

    } catch (error) {
        console.error("Erro no consultarCoach:", error);
        new Notice("❌ Erro ao gerar contexto. Verifique o console.");
    }
};