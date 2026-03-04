// SOTA - logAprimoramento.js v1.0 (Dual Log)
// Registra pontos de melhoria no Log Diário e no Histórico de Reflexão.

module.exports = async (params) => {
    const { app, obsidian, quickAddApi: qa } = params;
    const { Notice } = obsidian;
    const moment = params.obsidian.moment;

    // 1. Input do Usuário
    const aprimoramento = await qa.inputPrompt("Qual ponto de melhoria você identificou hoje?");
    if (!aprimoramento) return;

    // 2. Preparação de Dados
    const m = window.moment;
    const hoje = m().format("YYYY-MM-DD");
    const agora = m().format("HH:mm:ss");
    
    // Calcula período para metadados
    let tagPeriodo = "";
    const h = m().hour();
    if (h < 6) tagPeriodo = "#periodo/madrugada";
    else if (h < 12) tagPeriodo = "#periodo/manha";
    else if (h < 18) tagPeriodo = "#periodo/tarde";
    else tagPeriodo = "#periodo/noite";

    // Formato da Tarefa (Compatível com Dataview Tasks)
    const logLine = `\n- [ ] ${aprimoramento} #aprimoramento ${tagPeriodo} (log_date::${hoje}) (log_time::${agora})`;

    // 3. Definição de Caminhos
    const dailyFolder = "99 - BACKEND/Logs_Metricas/Daily";
    const dailyPath = `${dailyFolder}/${hoje}.md`;
    
    const reflectionFolder = "99 - BACKEND/Logs_Metricas/Reflexao/Aprimoramentos";
    const reflectionPath = `${reflectionFolder}/raw_logs.md`;

    // 4. Funções de Garantia de Arquivo
    const garantirArquivo = async (path, folder) => {
        let file = app.vault.getAbstractFileByPath(path);
        if (!file) {
            if (!await app.vault.adapter.exists(folder)) {
                await app.vault.createFolder(folder);
            }
            file = await app.vault.create(path, "");
        }
        return file;
    };

    try {
        // Obter/Criar arquivos
        const fileDaily = await garantirArquivo(dailyPath, dailyFolder);
        const fileReflection = await garantirArquivo(reflectionPath, reflectionFolder);

        // 5. Escrita Dual (Append)
        await Promise.all([
            app.vault.append(fileDaily, logLine),
            app.vault.append(fileReflection, logLine)
        ]);

        new Notice("✅ Aprimoramento registrado com sucesso!");
        
        // Força atualização das views para a tarefa aparecer na lista imediatamente
        setTimeout(() => app.workspace.trigger("dataview:refresh-views"), 500);

    } catch (e) {
        console.error("Erro ao registrar aprimoramento:", e);
        new Notice("❌ Erro ao salvar log. Verifique o console.");
    }
};