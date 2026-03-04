// SOTA - registrarConclusaoHabito.js v1.1 (Dual Write)
// User Script do QuickAdd para registrar a conclusão de um hábito no log diário E no log histórico do hábito.

module.exports = async (params) => {
    const { app, obsidian } = params;
    const { Notice } = obsidian;
    const moment = params.obsidian.moment;

    const sotaLog = (msg, data) => console.log(`[SOTA registrarHabito] - ${msg}`, data !== undefined ? data : "");
    sotaLog("Iniciando script de registro de hábito...");

    try {
        // --- 1. RECEBER VARIÁVEIS DO BOTÃO META BIND ---
        const idHabito = params.variables?.id_habito;
        const nomeHabito = params.variables?.nome_habito;

        if (!idHabito || !nomeHabito) {
            new Notice("❌ ERRO: ID ou nome do hábito não recebido pelo script.");
            sotaLog("FALHA: Variáveis 'id_habito' ou 'nome_habito' ausentes.", params.variables);
            return;
        }
        sotaLog("Variáveis recebidas:", { idHabito, nomeHabito });

        // --- 2. DETERMINAR ARQUIVOS DE LOG (DUAL WRITE) ---
        const hoje = moment();
        const agora = moment();
        const dataFormatada = hoje.format("YYYY-MM-DD");
        const timestamp = agora.format("HH:mm:ss");

        // Padrão de Ouro: Log auto-contido e estruturado
        const linhaDeLog = `\n- [x] Hábito Concluído: ${nomeHabito} #habito_concluido (id_habito:: ${idHabito}) (log_date::${dataFormatada}) (log_time::${timestamp})`;

        // --- 2.1. Log Diário (Para ETL e Timeline) ---
        const dailyLogPath = `99 - BACKEND/Logs_Metricas/Daily/${dataFormatada}.md`;
        let arquivoDiario = app.vault.getAbstractFileByPath(dailyLogPath);

        if (!arquivoDiario) {
            try {
                const dailyLogFolderPath = `99 - BACKEND/Logs_Metricas/Daily`;
                if (!await app.vault.adapter.exists(dailyLogFolderPath)) {
                    await app.vault.createFolder(dailyLogFolderPath);
                }
                arquivoDiario = await app.vault.create(dailyLogPath, "");
                sotaLog("Arquivo de log diário criado.");
            } catch (error) {
                new Notice("❌ Erro crítico ao criar arquivo de log diário.");
                return;
            }
        }

        // --- 2.2. Log Contextual (Para Dashboards Históricos) ---
        const habitLogFolderPath = `99 - BACKEND/Logs_Metricas/Habitos/${idHabito}`;
        const habitLogPath = `${habitLogFolderPath}/raw_logs.md`;
        let arquivoHabito = app.vault.getAbstractFileByPath(habitLogPath);

        if (!arquivoHabito) {
            try {
                // Garante a existência da árvore de pastas
                const rootHabits = "99 - BACKEND/Logs_Metricas/Habitos";
                if (!await app.vault.adapter.exists(rootHabits)) await app.vault.createFolder(rootHabits);
                if (!await app.vault.adapter.exists(habitLogFolderPath)) await app.vault.createFolder(habitLogFolderPath);
                
                arquivoHabito = await app.vault.create(habitLogPath, "");
                sotaLog("Arquivo de log do hábito criado/restaurado.");
            } catch (error) {
                console.error("Erro ao criar log do hábito:", error);
                // Não abortamos se falhar aqui, prioridade é o diário
            }
        }

        // --- 3. ESCRITA ---
        const promessasEscrita = [];
        
        // Sempre escreve no diário
        promessasEscrita.push(app.vault.append(arquivoDiario, linhaDeLog));
        
        // Escreve no histórico se disponível
        if (arquivoHabito) {
            promessasEscrita.push(app.vault.append(arquivoHabito, linhaDeLog));
        }

        await Promise.all(promessasEscrita);
        
        new Notice(`✅ Hábito "${nomeHabito}" registrado!`);
        sotaLog("Log dual efetuado com sucesso.");

        // --- 4. REFRESH ---
        setTimeout(() => {
            app.workspace.trigger("dataview:refresh-views");
        }, 300);

    } catch (error) {
        new Notice("❌ Ocorreu um erro ao registrar o hábito. Verifique o console.");
        sotaLog("ERRO INESPERADO no script:", error);
    }
};