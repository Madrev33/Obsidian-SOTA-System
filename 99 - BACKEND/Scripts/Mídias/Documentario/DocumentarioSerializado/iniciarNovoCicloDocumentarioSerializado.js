// SOTA - iniciarNovoCiclodocumentario.js v4.0
// Adiciona modal de confirmação para a ação de arquivamento.

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
            this.contentEl.createEl("h2", { text: "Arquivar Ciclo e Iniciar Novo?" });
            this.contentEl.createEl("p", { text: "Uma nova estrutura de pastas será criada para o próximo ciclo, permitindo que vc assista todo o Documentário novamente do zero." });
            this.contentEl.createEl("strong", { text: "USE ESSA OPÇÃO APENAS QUANDO QUISER ASSISTIR TODO O DOCUMENTÁRIO DO ZERO NOVAMENTE!" });

            new Setting(this.contentEl)
                .addButton(btn => btn
                    .setButtonText("Confirmar e Arquivar")
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
    try {
        const hubFilePath = params.variables?.activeFilePath;
        if (!hubFilePath) { new Notice("❌ ERRO: Caminho do arquivo HUB não recebido."); return; }

        const hubFile = app.vault.getAbstractFileByPath(hubFilePath);
        if (!(hubFile instanceof TFile)) { new Notice("❌ ERRO: Não foi possível encontrar o HUB da Documentário."); return; }
        
        const confirmado = await new Promise((resolve) => {
            new ConfirmarArquivamentoModal(app, (resultado) => resolve(resultado)).open();
        });

        if (!confirmado) {
            new Notice("Ação cancelada.");
            return;
        }

        new Notice("🚀 Arquivando ciclo atual e iniciando novo...");
        
        const fileCache = app.metadataCache.getFileCache(hubFile);
        let fm = fileCache?.frontmatter;
        if (!fm) { new Notice("❌ ERRO: Não foi possível ler o frontmatter do HUB."); return; }

        const totalModulos = fm.total_temporadas || 0;
        const cicloAtualNum = fm.ciclo_de_consumo_atual || 0;
        const novoCicloNum = cicloAtualNum + 1;
        const pastaCursoCompleta = hubFile.parent.parent.path;
        const sota_uid = fm.sota_uid;

        if (!sota_uid) { new Notice("❌ ERRO: 'sota_uid' não encontrado."); return; }
        
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

        const pastaCicloNovo = `${pastaCursoCompleta}/Temporadas/Ciclo_${String(novoCicloNum).padStart(2, '0')}`;
        if (!await app.vault.adapter.exists(pastaCicloNovo)) {
            await app.vault.createFolder(pastaCicloNovo);
            if (totalModulos > 0) {
                const templateModuloPath = "99 - BACKEND/Templates/Midias/Documentario/DocumentarioSerializado/Temporada_Template.md";
                const templateModuloFile = app.vault.getAbstractFileByPath(templateModuloPath);
                if (!(templateModuloFile instanceof TFile)) throw new Error(`Template de Temporada não encontrado.`);
                const conteudoModuloBase = await app.vault.read(templateModuloFile);
                for (let i = 1; i <= totalModulos; i++) {
                    const numeroModulo = i.toString().padStart(2, '0');
                    const nomePastaModulo = `Temporada ${numeroModulo}`;
                    const pastaModuloPath = `${pastaCicloNovo}/${nomePastaModulo}`;
                    await app.vault.createFolder(pastaModuloPath);
                    const nomeHubModulo = `00 - HUB Temporada ${numeroModulo}.md`;
                    const caminhoHubModulo = `${pastaModuloPath}/${nomeHubModulo}`;
                    let conteudoFinalModulo = conteudoModuloBase
                        .replace(/%%HUB_UID%%/g, sota_uid)
                        .replace(/%%NUMERO_TEMPORADA%%/g, i.toString())
                        .replace(/%%NOME_DOCUMENTARIO%%/g, hubFile.basename.replace('00. HUB - ', ''));
                    await app.vault.create(caminhoHubModulo, conteudoFinalModulo);
                }
            }
        } else {
            new Notice(`⚠️ AVISO: A pasta para o Ciclo ${novoCicloNum} já existe.`);
        }
        
        await app.fileManager.processFrontMatter(hubFile, (fm) => {
            fm.ciclo_de_consumo_atual = novoCicloNum;
            const novoCicloObj = {
                ciclo: novoCicloNum, status: "assistindo",
                data_inicio: moment().format("YYYY-MM-DD"), hora_inicio: moment().format("HH:mm"),
                data_arquivamento: "", hora_arquivamento: "", historico: []
            };
            if (!Array.isArray(fm.ciclos)) fm.ciclos = [];
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
            fm.temporada_atual = 1; fm.episodio_atual = 1; fm.status = "parado";
            fm.sessao_ativa_timestamp_inicio = ""; fm.episodios_assistidos = 0;
            fm.ultimo_aula_assistidas = 0; fm.tempo_acumulado_episodio_atual_segundos = 0;
        });

        new Notice(`✅ Novo Ciclo (${novoCicloNum}) iniciado!`);

    } catch (error) {
        console.error("Erro no script iniciarNovoCiclodocumentario:", error);
        new Notice("❌ Ocorreu um erro. Verifique o console.");
    }
};