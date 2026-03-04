module.exports = async (params) => {
    const { app, obsidian } = params;
    const { Notice } = obsidian;
    const moment = params.obsidian.moment;

    const activeFile = app.workspace.getActiveFile();
    if (!activeFile) return;

    await app.fileManager.processFrontMatter(activeFile, (fm) => {
        if (fm.status !== 'concluido') {
            new Notice("ℹ️ O estudo precisa estar 'concluido' para ser reativado.");
            return;
        }
        fm.status = "ativo";
        fm.data_reativacao = moment().format("YYYY-MM-DD");
        fm.hora_reativacao = moment().format("HH:mm");
        // Limpa conclusão
        fm.data_conclusao_estudo = "";
        fm.hora_conclusao_estudo = "";
        
        new Notice("🔄 Estudo reativado! Pronto para continuar.");
    });
    setTimeout(() => app.workspace.trigger("dataview:refresh-views"), 300);
};