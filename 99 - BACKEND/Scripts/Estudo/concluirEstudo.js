module.exports = async (params) => {
    const { app, obsidian } = params;
    const { Notice } = obsidian;
    const moment = params.obsidian.moment;

    const activeFile = app.workspace.getActiveFile();
    if (!activeFile) return;

    await app.fileManager.processFrontMatter(activeFile, (fm) => {
        if (fm.status === 'concluido') {
            new Notice("ℹ️ O estudo já está concluído.");
            return;
        }
        fm.status = "concluido";
        fm.data_conclusao_estudo = moment().format("YYYY-MM-DD");
        fm.hora_conclusao_estudo = moment().format("HH:mm");
        
        new Notice("✅ Estudo concluído com sucesso!");
    });
    setTimeout(() => app.workspace.trigger("dataview:refresh-views"), 300);
};