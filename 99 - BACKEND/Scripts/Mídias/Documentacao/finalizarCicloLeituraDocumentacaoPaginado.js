// SOTA - Script para Finalizar um Ciclo de Leitura de Documentacao Paginado v1.0

module.exports = async (params) => {
    const { app, obsidian } = params;
    const { Notice, Modal, Setting, TFile } = obsidian;
    const moment = params.obsidian.moment;

    // --- CLASSE DO MODAL (ADAPTADA PARA DOCUMENTACAO) ---
    class ConfirmarFinalizacaoModal extends Modal {
        constructor(app) {
            super(app);
            this.promise = new Promise((resolve) => {
                this.resolvePromise = resolve;
            });
            this.decisionMade = false;
        }

        waitForDecision() {
            return this.promise;
        }

        onOpen() {
            this.contentEl.createEl("h2", { text: "Finalizar Ciclo de Leitura da Documentação?" });
            this.contentEl.createEl("p", { text: "Use esta opção quando tiver finalizado completamente a leitura deste ciclo." });
            
            new Setting(this.contentEl)
                .addButton(btn => btn.setButtonText("Confirmar e Finalizar Ciclo").setCta().onClick(() => {
                    this.decisionMade = true;
                    this.close();
                    this.resolvePromise(true);
                }))
                .addButton(btn => btn.setButtonText("Cancelar").onClick(() => {
                    this.decisionMade = true;
                    this.close();
                    this.resolvePromise(false);
                }));
        }

        onClose() {
            this.contentEl.empty();
            if (!this.decisionMade) {
                this.resolvePromise(false);
            }
        }
    }

    // --- ETAPA 1: LER E VALIDAR O ESTADO ATUAL (ROBUSTO) ---
    const activeFilePath = params.variables?.active_file_path;
    if (!activeFilePath) { new Notice("❌ ERRO: Caminho do arquivo HUB não recebido."); return; }
    
    const activeFile = app.vault.getAbstractFileByPath(activeFilePath);
    if (!(activeFile instanceof TFile)) { new Notice("❌ ERRO: Não foi possível encontrar o arquivo HUB da Documentação."); return; }

    try {
        const fm = app.metadataCache.getFileCache(activeFile)?.frontmatter;
        if (!fm) { throw new Error("Frontmatter não pôde ser lido pelo cache."); }

        const cicloAtualNum = fm.ciclo_de_consumo_atual;
        if (cicloAtualNum === undefined || !Array.isArray(fm.ciclos)) {
            new Notice("❌ ERRO: Metadados de ciclo estão ausentes ou malformados.");
            return;
        }

        const cicloObj = fm.ciclos.find(c => c.ciclo === cicloAtualNum);
        
        if (cicloObj && cicloObj.status === 'concluido') {
            new Notice(`ℹ️ O Ciclo ${cicloAtualNum} já está finalizado.`);
            return;
        }

    } catch (e) {
        new Notice("❌ ERRO crítico ao ler e validar o arquivo HUB.");
        console.error("Erro de validação em finalizarCicloLeituraDocumentacaoPaginado.js:", e);
        return;
    }
    // --- FIM DA VALIDAÇÃO ---

    // --- ETAPA 2: CONFIRMAR COM O USUÁRIO (MODAL ASSÍNCRONO) ---
    const modal = new ConfirmarFinalizacaoModal(app);
    modal.open();
    const confirmado = await modal.waitForDecision();

    if (!confirmado) {
        new Notice("Ação cancelada.");
        return;
    }

    // --- ETAPA 3: AGIR SOBRE O ARQUIVO (AÇÃO FINAL) ---
    new Notice("🚀 Finalizando ciclo de leitura da documentação...");
    let cicloFinalizado = 0;
    let erro = null;

    try {
      await app.fileManager.processFrontMatter(activeFile, (fm) => {
          const cicloAtualNum = fm.ciclo_de_consumo_atual;
          const cicloObj = fm.ciclos.find(c => c.ciclo === cicloAtualNum);
          
          if (!cicloObj) { erro = `Dados para o Ciclo ${cicloAtualNum} não encontrados.`; return; }
          if (cicloObj.status === 'concluido') { erro = `O Ciclo ${cicloAtualNum} já foi finalizado por outra ação.`; return; }
          
          cicloObj.status = "concluido";
          cicloObj.data_conclusao = moment().format("YYYY-MM-DD");
          cicloObj.hora_conclusao = moment().format("HH:mm");
          fm.leitura_status = "concluido";

          cicloFinalizado = cicloAtualNum;
      });
    } catch (e) {
      erro = `Falha ao processar o frontmatter: ${e.message}`;
    }

    if (erro) {
      new Notice(`⚠️ ${erro}`);
    } else if (cicloFinalizado > 0) {
      new Notice(`✅ Leitura do Ciclo ${cicloFinalizado} finalizada com sucesso!`);
    } else {
      new Notice("⚠️ Nenhuma ação foi executada.");
    }
};