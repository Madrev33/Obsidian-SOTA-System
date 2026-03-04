// SOTA - iniciarProjeto.js v1.0
// Define o status do projeto como 'ativo' e registra a data/hora de início.

module.exports = async (params) => {
    const { app, obsidian } = params;
    const { Notice, TFile } = obsidian;
    const moment = params.obsidian.moment;

    try {
        const filePath = params.variables?.active_file_path;
        if (!filePath) { new Notice("❌ ERRO: Caminho do arquivo não recebido."); return; }

        const activeFile = app.vault.getAbstractFileByPath(filePath);
        if (!(activeFile instanceof TFile)) { new Notice("❌ ERRO: Arquivo HUB não encontrado."); return; }

        await app.fileManager.processFrontMatter(activeFile, (fm) => {
            if (fm.status === 'ativo') {
                new Notice("ℹ️ O projeto já está ativo.");
                return; // Aborta a modificação se já estiver ativo
            }
            
            fm.status = "ativo";
            fm.data_inicio = moment().format("YYYY-MM-DD");
            fm.hora_inicio = moment().format("HH:mm");
            
            // Limpa datas de conclusão caso esteja sendo reativado de um estado 'concluido'
            fm.data_conclusao = ""; 
            fm.hora_conclusao = "";

            new Notice("🚀 Projeto iniciado com sucesso!");
        });
        setTimeout(() => app.workspace.trigger("dataview:refresh-views"), 300);

    } catch (e) {
        console.error("Erro ao iniciar projeto:", e);
        new Notice("❌ Ocorreu um erro. Verifique o console.");
    }
};