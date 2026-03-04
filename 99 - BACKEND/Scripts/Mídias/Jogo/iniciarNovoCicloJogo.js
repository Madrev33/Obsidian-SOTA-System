// SOTA - Script para Iniciar Novo Ciclo de Jogo (New Game+) v1.0

module.exports = async (params) => {
    const { app, obsidian } = params;
    const { Notice, TFile, Modal, Setting } = obsidian;
    const moment = params.obsidian.moment;

    // --- 1. DEFINIÇÃO DO MODAL DE CONFIRMAÇÃO ---
    class ConfirmarArquivamentoModal extends Modal {
        constructor(app, onSubmit) {
            super(app);
            this.onSubmit = onSubmit;
            this.decisionMade = false;
        }

        onOpen() {
            this.contentEl.createEl("h2", { text: "Novo Jogo+ (Arquivar e Reiniciar?)" });
            this.contentEl.createEl("p", { text: "Uma nova estrutura de pastas será criada para o próximo ciclo, permitindo que você jogue tudo novamente do zero." });
            this.contentEl.createEl("strong", { text: "USE ESSA OPÇÃO APENAS QUANDO QUISER COMEÇAR O JOGO DO ZERO NOVAMENTE!" });

            new Setting(this.contentEl)
                .addButton(btn => btn
                    .setButtonText("Confirmar e Reiniciar")
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
    try {
        const hubFilePath = params.variables?.activeFilePath;
        if (!hubFilePath) { new Notice("❌ ERRO: Caminho do arquivo HUB não recebido."); return; }

        const hubFile = app.vault.getAbstractFileByPath(hubFilePath);
        if (!(hubFile instanceof TFile)) { new Notice("❌ ERRO: Não foi possível encontrar o HUB do Jogo."); return; }
        
        const confirmado = await new Promise((resolve) => {
            new ConfirmarArquivamentoModal(app, (resultado) => resolve(resultado)).open();
        });

        if (!confirmado) {
            new Notice("Ação cancelada.");
            return;
        }

        new Notice("🚀 Arquivando ciclo atual e iniciando Novo Jogo+...");
        
        const fileCache = app.metadataCache.getFileCache(hubFile);
        let fm = fileCache?.frontmatter;
        if (!fm) { new Notice("❌ ERRO: Não foi possível ler o frontmatter do HUB."); return; }

        const cicloAtualNum = fm.ciclo_de_consumo_atual || 0;
        const novoCicloNum = cicloAtualNum + 1;
        const pastaJogoCompleta = hubFile.parent.path; // Raiz do Jogo
        const sota_uid = fm.sota_uid;

        if (!sota_uid) { new Notice("❌ ERRO: 'sota_uid' não encontrado."); return; }
        
        // Arquiva o ciclo anterior no Frontmatter
        await app.fileManager.processFrontMatter(hubFile, (fm) => {
            if (Array.isArray(fm.ciclos)) {
                const cicloAtualObj = fm.ciclos.find(c => c.ciclo === cicloAtualNum);
                if (cicloAtualObj && !cicloAtualObj.data_arquivamento) {
                    cicloAtualObj.data_arquivamento = moment().format("YYYY-MM-DD");
                    cicloAtualObj.hora_arquivamento = moment().format("HH:mm");
                    cicloAtualObj.status = "concluido";
                }
            }
        });
        new Notice(`✅ Ciclo ${cicloAtualNum} arquivado com sucesso.`);

        // Cria a pasta para o novo ciclo de missões
        const pastaCicloNovo = `${pastaJogoCompleta}/Missões/Ciclo_${String(novoCicloNum).padStart(2, '0')}`;
        if (!await app.vault.adapter.exists(pastaCicloNovo)) {
            await app.vault.createFolder(pastaCicloNovo);
            // Diferente de séries, não pré-criamos missões aqui, pois jogos variam muito.
            // O usuário adicionará missões conforme progride usando o botão "Adicionar Missão".
        } else {
            new Notice(`⚠️ AVISO: A pasta para o Ciclo ${novoCicloNum} já existe.`);
        }
        
        // Atualiza o HUB com o novo ciclo ativo
        await app.fileManager.processFrontMatter(hubFile, (fm) => {
            fm.ciclo_de_consumo_atual = novoCicloNum;
            const novoCicloObj = {
                ciclo: novoCicloNum, status: "Jogando", 
                data_inicio: moment().format("YYYY-MM-DD"), hora_inicio: moment().format("HH:mm"),
                data_arquivamento: "", hora_arquivamento: "", historico: []
            };
            if (!Array.isArray(fm.ciclos)) fm.ciclos = [];
            
            // Limpeza de campos legados nos ciclos antigos
            fm.ciclos.forEach(ciclo => {
                if (ciclo.hasOwnProperty('data_conclusao')) {
                    ciclo.data_arquivamento = ciclo.data_conclusao;
                    delete ciclo.data_conclusao;
                }
                if (ciclo.hasOwnProperty('hora_conclusao')) {
                    ciclo.hora_arquivamento = ciclo.hora_conclusao;
                    delete ciclo.hora_conclusao;
                }
            });
            
            fm.ciclos.push(novoCicloObj);
            
            // Reseta ponteiros de progresso
            fm.missao_atual = 1; 
            fm.status = "parado";
            fm.sessao_ativa_timestamp_inicio = ""; 
            fm.missoes_jogadas = 0;
            fm.ultima_missao_jogada = 0; 
            fm.tempo_acumulado_episodio_atual_segundos = 0; // Reusa campo de tempo de episódio
        });

        new Notice(`✅ Novo Jogo+ (Ciclo ${novoCicloNum}) iniciado!`);

    } catch (error) {
        console.error("Erro no script iniciarNovoCicloJogo:", error);
        new Notice("❌ Ocorreu um erro. Verifique o console.");
    }
};