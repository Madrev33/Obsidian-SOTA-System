// SOTA - concluirProjeto.js v1.0
// Define o status do projeto como 'concluido' e registra a data/hora de conclusão.

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
            if (fm.status === 'concluido') {
                new Notice("ℹ️ O projeto já está concluído.");
                return;
            }
            
            fm.status = "concluido";
            fm.data_conclusao = moment().format("YYYY-MM-DD");
            fm.hora_conclusao = moment().format("HH:mm");
            new Notice("✅ Projeto concluído com sucesso!");
        });
        setTimeout(() => app.workspace.trigger("dataview:refresh-views"), 300);


    } catch (e) {
        console.error("Erro ao concluir projeto:", e);
        new Notice("❌ Ocorreu um erro. Verifique o console.");
    }
};