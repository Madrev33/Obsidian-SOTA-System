// SOTA - registrarProgressoHabito.js v1.1 (Dual Write)
// Registra progresso (binário ou contador) no log diário E no log histórico do hábito.

module.exports = async (params) => {
    const { app, obsidian } = params;
    const { Notice } = obsidian;
    const moment = params.obsidian.moment;

    // Recebe variáveis do botão
    const idHabito = params.variables?.id_habito;
    const nomeHabito = params.variables?.nome_habito;
    const tipo = params.variables?.tipo || "binario"; // binario | contador
    const valor = params.variables?.valor || 1; // Incremento

    if (!idHabito || !nomeHabito) { new Notice("❌ Erro: Dados do hábito incompletos."); return; }

    const hoje = moment();
    const agora = moment();
    const dataFormatada = hoje.format("YYYY-MM-DD");
    const timestamp = agora.format("HH:mm:ss");
    
    // --- 1. CONSTRUÇÃO DA LINHA DE LOG ---
    let linhaDeLog = "";
    if (tipo === "contador") {
        linhaDeLog = `\n- 🔢 Registro Hábito: ${nomeHabito} (+${valor}) #habito_registro (id_habito:: ${idHabito}) (valor:: ${valor}) (log_date::${dataFormatada}) (log_time::${timestamp})`;
    } else {
        linhaDeLog = `\n- [x] Hábito Concluído: ${nomeHabito} #habito_concluido (id_habito:: ${idHabito}) (log_date::${dataFormatada}) (log_time::${timestamp})`;
    }

    // --- 2. LOG DIÁRIO (ETL & Timeline) ---
    const dailyLogPath = `99 - BACKEND/Logs_Metricas/Daily/${dataFormatada}.md`;
    let arquivoDiario = app.vault.getAbstractFileByPath(dailyLogPath);

    if (!arquivoDiario) {
        try {
            const dailyLogFolderPath = `99 - BACKEND/Logs_Metricas/Daily`;
            if (!await app.vault.adapter.exists(dailyLogFolderPath)) await app.vault.createFolder(dailyLogFolderPath);
            arquivoDiario = await app.vault.create(dailyLogPath, "");
        } catch (error) {
            new Notice("❌ Erro crítico ao criar log diário.");
            return;
        }
    }

    // --- 3. LOG CONTEXTUAL (Histórico) ---
    const habitLogFolderPath = `99 - BACKEND/Logs_Metricas/Habitos/${idHabito}`;
    const habitLogPath = `${habitLogFolderPath}/raw_logs.md`;
    let arquivoHabito = app.vault.getAbstractFileByPath(habitLogPath);

    if (!arquivoHabito) {
        try {
            const rootHabits = "99 - BACKEND/Logs_Metricas/Habitos";
            if (!await app.vault.adapter.exists(rootHabits)) await app.vault.createFolder(rootHabits);
            if (!await app.vault.adapter.exists(habitLogFolderPath)) await app.vault.createFolder(habitLogFolderPath);
            arquivoHabito = await app.vault.create(habitLogPath, "");
        } catch (error) {
            console.error("Erro ao criar log do hábito (Dual Write falhou parcialmente):", error);
        }
    }

    // --- 4. ESCRITA ---
    const writes = [app.vault.append(arquivoDiario, linhaDeLog)];
    if (arquivoHabito) writes.push(app.vault.append(arquivoHabito, linhaDeLog));
    
    await Promise.all(writes);

    // Feedback
    const msg = tipo === "contador" ? `➕ Registrado: +${valor} em ${nomeHabito}` : `✅ ${nomeHabito} concluído!`;
    new Notice(msg);

    // Refresh na UI
    setTimeout(() => app.workspace.trigger("dataview:refresh-views"), 200);
};