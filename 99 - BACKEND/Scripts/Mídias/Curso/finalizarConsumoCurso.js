// SOTA - Script para Finalizar o Consumo de um Curso (Pausa Longa)
// v3.0 - Adiciona modal de confirmação antes de executar a ação.

module.exports = async (params) => {
    const { app, obsidian } = params;
    const { Notice, Modal, Setting } = obsidian;
    const moment = params.obsidian.moment;

    // --- 1. DEFINIÇÃO DO MODAL DE CONFIRMAÇÃO ---
    class ConfirmarFinalizacaoModal extends Modal {
        constructor(app, onSubmit) {
            super(app);
            this.onSubmit = onSubmit;
            this.decisionMade = false;
        }

        onOpen() {
            this.contentEl.createEl("h2", { text: "Finalizar Consumo do Curso?" });
            this.contentEl.createEl("p", { text: "Esta opção mantém o ciclo atual aberto. Se novos módulos forem lançados no futuro, você poderá simplesmente reativar o aprendizado e continuar de onde parou." });               

            new Setting(this.contentEl)
                .addButton(btn => btn
                    .setButtonText("Confirmar e Finalizar Consumo")
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

    // --- 2. LÓGICA PRINCIPAL DO SCRIPT ---
    const activeFilePath = params.variables?.active_file_path;
    if (!activeFilePath) {
        new Notice("❌ ERRO: Caminho do arquivo HUB não recebido.");
        return;
    }
    
    const activeFile = app.vault.getAbstractFileByPath(activeFilePath);
    if (!activeFile) {
        new Notice("❌ ERRO: Não foi possível encontrar o arquivo HUB do Curso.");
        return;
    }

    // Aguarda a decisão do usuário no modal
    const confirmado = await new Promise((resolve) => {
        new ConfirmarFinalizacaoModal(app, (resultado) => resolve(resultado)).open();
    });

    if (!confirmado) {
        new Notice("Ação cancelada.");
        return;
    }

    // --- 3. EXECUÇÃO DA LÓGICA APÓS CONFIRMAÇÃO ---
    new Notice("🚀 Registrando finalização de consumo...");

    let cicloAfetado = 0;
    let erro = null;

    try {
      await app.fileManager.processFrontMatter(activeFile, (fm) => {
          const cicloAtualNum = fm.ciclo_de_consumo_atual;
          if (!cicloAtualNum) {
              erro = "Campo 'ciclo_de_consumo_atual' não encontrado.";
              return;
          }
          
          if (!Array.isArray(fm.ciclos)) {
              erro = "A estrutura 'ciclos' não é uma lista válida no frontmatter.";
              return;
          }

          const cicloObj = fm.ciclos.find(c => c.ciclo === cicloAtualNum);
          if (!cicloObj) {
              erro = `Não foi possível encontrar os dados para o Ciclo ${cicloAtualNum}.`;
              return;
          }
          
          if (cicloObj.status === 'concluido' && fm.status === 'concluido') {
              erro = `O consumo para o Ciclo ${cicloAtualNum} já está marcado como finalizado.`;
              return;
          }

          cicloObj.status = "concluido";
          fm.status = "concluido";

          if (!Array.isArray(cicloObj.historico)) {
              cicloObj.historico = [];
          }

          const novoEvento = {
              evento: "conclusao_consumo",
              data: moment().format("YYYY-MM-DD"),
              hora: moment().format("HH:mm")
          };
          cicloObj.historico.push(novoEvento);

          if (cicloObj.hasOwnProperty('data_conclusao')) {
              cicloObj.data_arquivamento = cicloObj.data_conclusao;
              delete cicloObj.data_conclusao;
          }
           if (cicloObj.hasOwnProperty('hora_conclusao')) {
              cicloObj.hora_arquivamento = cicloObj.hora_conclusao;
              delete cicloObj.hora_conclusao;
          }

          cicloAfetado = cicloAtualNum;
      });

    } catch (e) {
      erro = `Falha ao processar o frontmatter: ${e.message}`;
    }

    if (erro) {
      new Notice(`⚠️ ${erro}`);
    } else if (cicloAfetado > 0) {
      new Notice(`✅ Consumo do Ciclo ${cicloAfetado} finalizado! O curso está em 'pausa longa'.`);
    } else {
      new Notice("⚠️ Nenhuma ação foi executada. Verifique os dados do arquivo.");
    }
};