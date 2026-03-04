// SOTA - pausarProjeto.js v1.0
// Define o status do projeto como 'pausado'.

module.exports = async (params) => {
    const { app, obsidian } = params;
    const { Notice, TFile } = obsidian;

    try {
        const filePath = params.variables?.active_file_path;
        if (!filePath) { new Notice("❌ ERRO: Caminho do arquivo não recebido."); return; }

        const activeFile = app.vault.getAbstractFileByPath(filePath);
        if (!(activeFile instanceof TFile)) { new Notice("❌ ERRO: Arquivo HUB não encontrado."); return; }

        await app.fileManager.processFrontMatter(activeFile, (fm) => {
            if (fm.status !== 'ativo') {
                new Notice(`⚠️ Ação inválida. O projeto está com status '${fm.status}'.`);
                return; // Só pode pausar se estiver ativo
            }
            
            fm.status = "pausado";
            new Notice("⏸️ Projeto pausado.");
        });
        setTimeout(() => app.workspace.trigger("dataview:refresh-views"), 300);

    } catch (e) {
        console.error("Erro ao pausar projeto:", e);
        new Notice("❌ Ocorreu um erro. Verifique o console.");
    }
};