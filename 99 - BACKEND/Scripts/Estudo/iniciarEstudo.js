module.exports = async (params) => {
    const { app, obsidian } = params;
    const { Notice } = obsidian;
    const moment = params.obsidian.moment;

    const activeFile = app.workspace.getActiveFile();
    if (!activeFile) return;

    await app.fileManager.processFrontMatter(activeFile, (fm) => {
        if (fm.status === 'ativo') {
            new Notice("ℹ️ O estudo já está ativo.");
            return;
        }
        fm.status = "ativo";
        fm.data_inicio = moment().format("YYYY-MM-DD");
        fm.hora_inicio = moment().format("HH:mm");
        // Limpa dados de conclusão caso seja reinício
        fm.data_conclusao_estudo = "";
        fm.hora_conclusao_estudo = "";
        fm.data_reativacao = "";
        fm.hora_reativacao = "";
        
        new Notice("🚀 Estudo iniciado com sucesso!");
    });
    // Força refresh da view para atualizar o painel
    setTimeout(() => app.workspace.trigger("dataview:refresh-views"), 300);
};