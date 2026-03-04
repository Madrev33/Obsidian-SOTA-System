// SOTA - Script para Reativar o Jogo v1.0

module.exports = async (params) => {
    const { app, obsidian } = params;
    const { Notice, Modal, Setting } = obsidian;
    const moment = params.obsidian.moment;

    // --- 1. DEFINIÇÃO DO MODAL DE CONFIRMAÇÃO ---
    class ConfirmarReativacaoModal extends Modal {
        constructor(app, onSubmit) {
            super(app);
            this.onSubmit = onSubmit;
            this.decisionMade = false;
        }

        onOpen() {
            this.contentEl.createEl("h2", { text: "Reativar Jogo?" });
            this.contentEl.createEl("p", { text: "Esta ação marcará o Jogo como 'ativo' novamente." });
            this.contentEl.createEl("p", { text: "Use esta opção se saíram novas missões/DLCs ou se você decidiu continuar jogando sem reiniciar do zero." });

            new Setting(this.contentEl)
                .addButton(btn => btn
                    .setButtonText("Confirmar e Reativar")
                    .setCta()
                    .onClick(() => {
                        this.decisionMade = true;
                        this.close();
                        this.onSubmit(true);
                    }))
                .addButton(btn => btn
                    .setButtonText("Cancelar")
                    .onClick(() => {
                        this.decisionMade = true;
                        this.close();
                        this.onSubmit(false);
                    }));
        }

        onClose() {
            this.contentEl.empty();
            if (!this.decisionMade) {
                this.onSubmit(false);
            }
        }
    }

    // --- 2. LÓGICA PRINCIPAL ---
    const activeFilePath = params.variables?.active_file_path;
    if (!activeFilePath) { new Notice("❌ ERRO: Caminho do HUB não recebido."); return; }
    
    const activeFile = app.vault.getAbstractFileByPath(activeFilePath);
    if (!activeFile) { new Notice("❌ ERRO: Não foi possível encontrar o HUB do Jogo."); return; }

    const fileCache = app.metadataCache.getFileCache(activeFile);
    const fm = fileCache?.frontmatter;
    if (!fm) { new Notice("❌ ERRO: Não foi possível ler o frontmatter."); return; }

    // **Verificação de estado ANTES do modal**
    if (fm.status !== 'concluido') {
        new Notice("ℹ️ O Jogo já está ativo.");
        return; 
    }

    const confirmado = await new Promise((resolve) => {
        new ConfirmarReativacaoModal(app, (resultado) => resolve(resultado)).open();
    });

    if (!confirmado) {
        new Notice("Ação cancelada.");
        return;
    }

    // --- 3. EXECUÇÃO ---
    new Notice("🚀 Reativando o Jogo...");

    let cicloAfetado = 0;
    let erro = null;

    try {
      await app.fileManager.processFrontMatter(activeFile, (fm) => {
          const cicloAtualNum = fm.ciclo_de_consumo_atual;
          if (!cicloAtualNum) {
              erro = "Campo 'ciclo_de_consumo_atual' não encontrado.";
              return;
          }

          const cicloObj = fm.ciclos.find(c => c.ciclo === cicloAtualNum);
          if (!cicloObj) {
              erro = `Dados para o Ciclo ${cicloAtualNum} não encontrados.`;
              return;
          }
          
          fm.status = 'parado'; // Volta para estado "em pausa", pronto para jogar
          cicloObj.status = 'Jogando';

          if (!Array.isArray(cicloObj.historico)) {
              cicloObj.historico = [];
          }

          const eventoReativacao = {
              evento: "reativacao",
              data: moment().format("YYYY-MM-DD"),
              hora: moment().format("HH:mm")
          };
          cicloObj.historico.push(eventoReativacao);
          
          cicloAfetado = cicloAtualNum;
      });

    } catch (e) {
      erro = `Falha ao processar o frontmatter: ${e.message}`;
    }

    if (erro) {
      new Notice(`⚠️ ${erro}`);
    } else if (cicloAfetado > 0) {
      new Notice(`✅ Jogo reativado! Pronto para continuar no Ciclo ${cicloAfetado}.`);
    } else {
      new Notice("⚠️ Nenhuma ação foi executada.");
    }
};