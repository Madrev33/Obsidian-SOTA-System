// SOTA - Script para Finalizar o Consumo de um Artigo Atômico v1.0

module.exports = async (params) => {
    const { app, obsidian } = params;
    const { Notice, Modal, Setting, TFile } = obsidian;
    const moment = params.obsidian.moment;

    class ConfirmarFinalizacaoModal extends Modal {
        constructor(app) {
            super(app);
            this.promise = new Promise((resolve) => { this.resolvePromise = resolve; });
            this.decisionMade = false;
        }
        waitForDecision() { return this.promise; }
        onOpen() {
            this.contentEl.createEl("h2", { text: "Finalizar Consumo do Artigo?" });
            this.contentEl.createEl("p", { text: "Esta ação marcará o ciclo de leitura atual como 'concluído' e registrará a data de finalização." });
            new Setting(this.contentEl)
                .addButton(btn => btn.setButtonText("Confirmar e Finalizar").setCta().onClick(() => {
                    this.decisionMade = true; this.close(); this.resolvePromise(true);
                }))
                .addButton(btn => btn.setButtonText("Cancelar").onClick(() => {
                    this.decisionMade = true; this.close(); this.resolvePromise(false);
                }));
        }
        onClose() {
            this.contentEl.empty();
            if (!this.decisionMade) { this.resolvePromise(false); }
        }
    }

    try {
        const filePath = params.variables?.active_file_path || params.variables?.activeFilePath;
        if (!filePath) { new Notice("❌ ERRO: Caminho do arquivo não recebido."); return; }
        
        const activeFile = app.vault.getAbstractFileByPath(filePath);
        if (!(activeFile instanceof TFile)) { new Notice("❌ ERRO: Arquivo HUB do artigo não encontrado."); return; }

        const fm = app.metadataCache.getFileCache(activeFile)?.frontmatter;
        if (!fm) { throw new Error("Frontmatter não pôde ser lido."); }

        const cicloAtualNum = fm.ciclo_de_consumo_atual;
        const cicloObj = Array.isArray(fm.ciclos) ? fm.ciclos.find(c => c.ciclo === cicloAtualNum) : null;
        
        if (cicloObj && cicloObj.status === 'concluido') {
            new Notice(`ℹ️ O Ciclo ${cicloAtualNum} deste artigo já está finalizado.`);
            return;
        }

        const modal = new ConfirmarFinalizacaoModal(app);
        modal.open();
        const confirmado = await modal.waitForDecision();
        if (!confirmado) { new Notice("Ação cancelada."); return; }

        new Notice("🚀 Finalizando ciclo de leitura do artigo...");
        
        await app.fileManager.processFrontMatter(activeFile, (fm) => {
            const cicloAtual = fm.ciclos.find(c => c.ciclo === fm.ciclo_de_consumo_atual);
            if (cicloAtual) {
                cicloAtual.status = "concluido";
                cicloAtual.data_conclusao = moment().format("YYYY-MM-DD");
                cicloAtual.hora_conclusao = moment().format("HH:mm");
            }
            fm.leitura_status = "concluido";
        });

        new Notice(`✅ Consumo do artigo finalizado!`);

    } catch (e) {
        new Notice("❌ ERRO crítico ao finalizar consumo. Verifique o console.");
        console.error("Erro em finalizarConsumoArtigoAtomico.js:", e);
    }
};