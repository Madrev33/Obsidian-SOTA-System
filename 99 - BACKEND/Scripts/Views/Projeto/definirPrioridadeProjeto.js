// SOTA - definirPrioridadeProjeto.js v1.0
// Permite ao usuário definir a prioridade do projeto através de um seletor.

module.exports = async (params) => {
    const { app, quickAddApi: qa, obsidian } = params;
    const { Notice, TFile } = obsidian;

    try {
        const filePath = params.variables?.active_file_path;
        if (!filePath) { new Notice("❌ ERRO: Caminho do arquivo não recebido."); return; }

        const activeFile = app.vault.getAbstractFileByPath(filePath);
        if (!(activeFile instanceof TFile)) { new Notice("❌ ERRO: Arquivo HUB não encontrado."); return; }

        const prioridades = ["principal", "secundario", "longo_prazo"];
        const escolha = await qa.suggester(prioridades, prioridades);

        if (!escolha) {
            new Notice("ℹ️ Ação cancelada.");
            return;
        }

        await app.fileManager.processFrontMatter(activeFile, (fm) => {
            fm.prioridade = escolha;
            new Notice(`⭐ Prioridade do projeto definida como: ${escolha}`);
        });
        setTimeout(() => app.workspace.trigger("dataview:refresh-views"), 300);

    } catch (e) {
        console.error("Erro ao definir prioridade do projeto:", e);
        new Notice("❌ Ocorreu um erro. Verifique o console.");
    }
};