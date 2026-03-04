// SOTA - Script para Iniciar Novo Ciclo de Consumo (Podcast Único) v2.0
// Cria a estrutura de pastas e arquivos para o novo ciclo.

module.exports = async (params) => {
    const { app, obsidian } = params;
    const { Notice, Modal, Setting, TFile } = obsidian;
    const moment = params.obsidian.moment;

    class ConfirmarNovoCicloModal extends Modal {
        constructor(app) {
            super(app);
            this.promise = new Promise((resolve) => { this.resolvePromise = resolve; });
            this.decisionMade = false;
        }
        waitForDecision() { return this.promise; }
        onOpen() {
            this.contentEl.createEl("h2", { text: "Iniciar um Novo Ciclo de Consumo?" });
            this.contentEl.createEl("p", { text: "Esta ação é para assistir novamente o Podcast. O ciclo atual será arquivado e um novo será criado." });
            new Setting(this.contentEl)
                .addButton(btn => btn.setButtonText("Confirmar e Iniciar Novo Ciclo").setCta().onClick(() => {
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
        // --- ETAPA 1: VALIDAÇÃO ---
        const filePath = params.variables?.active_file_path || params.variables?.activeFilePath;
        if (!filePath) { new Notice("❌ ERRO: Caminho do arquivo não recebido."); return; }

        const activeFile = app.vault.getAbstractFileByPath(filePath);
        if (!(activeFile instanceof TFile)) { new Notice("❌ ERRO: Arquivo HUB do documentário não encontrado."); return; }

        const fm = app.metadataCache.getFileCache(activeFile)?.frontmatter;
        if (!fm) { throw new Error("Frontmatter não pôde ser lido."); }
        
        const cicloAtualNum = fm.ciclo_de_consumo_atual;
        const cicloObj = Array.isArray(fm.ciclos) ? fm.ciclos.find(c => c.ciclo === cicloAtualNum) : null;
        
        if (cicloObj && cicloObj.status !== 'concluido') {
            new Notice(`⚠️ Ação bloqueada: O Ciclo ${cicloAtualNum} ainda está ativo. Finalize-o antes de iniciar um novo.`);
            return;
        }

        // --- ETAPA 2: CONFIRMAÇÃO ---
        const modal = new ConfirmarNovoCicloModal(app);
        modal.open();
        const confirmado = await modal.waitForDecision();
        if (!confirmado) { new Notice("Ação cancelada."); return; }

        new Notice("🚀 Iniciando novo ciclo de consumo...");

        // --- ETAPA 3: AÇÃO ---
        const novoCicloNum = cicloAtualNum + 1;
        const pastaPodcastCompleta = activeFile.parent.parent.path; // Sobe do /HUB para a raiz do projeto do documentário
        const sota_uid = fm.sota_uid;

        // Cria a pasta para o novo ciclo
        const pastaCicloNovo = `${pastaPodcastCompleta}/Anotações/Ciclo_${String(novoCicloNum).padStart(2, '0')}`;
        if (await app.vault.adapter.exists(pastaCicloNovo)) {
            new Notice(`⚠️ AVISO: A pasta para o Ciclo ${novoCicloNum} já existe.`);
        } else {
            await app.vault.createFolder(pastaCicloNovo);

            const criarArquivo = async (caminhoDestino, caminhoTemplate, placeholders = {}) => {
                const templateFile = app.vault.getAbstractFileByPath(caminhoTemplate);
                if (!(templateFile instanceof TFile)) throw new Error(`Template não encontrado: ${caminhoTemplate}`);
                let conteudo = await app.vault.read(templateFile);
                for (const key in placeholders) {
                    conteudo = conteudo.replaceAll(key, placeholders[key]);
                }
                await app.vault.create(caminhoDestino, conteudo);
            };

            // Cria os artefatos do novo ciclo
            const nomeAnotacoes = `00. Anotações.md`;
            const nomeExcalidraw = `01. Mapa Mental.excalidraw.md`;

            await criarArquivo(
                `${pastaCicloNovo}/${nomeAnotacoes}`,
                "99 - BACKEND/Templates/Midias/Podcast/PodcastAtomico/Podcast_Unico_Anotacoes_Template.md",
                { '%%SOTA_UID%%': sota_uid, '%%NUMERO_CICLO%%': novoCicloNum }
            );

            await criarArquivo(
                `${pastaCicloNovo}/${nomeExcalidraw}`,
                "99 - BACKEND/Templates/Midias/Podcast/PodcastAtomico/Excalidraw_Template_Vazio_Podcast_Unico.md"
            );
        }
        
        // Atualiza o HUB principal
        await app.fileManager.processFrontMatter(activeFile, (fm) => {
            const cicloAtual = fm.ciclos.find(c => c.ciclo === fm.ciclo_de_consumo_atual);
            if (cicloAtual && !cicloAtual.data_arquivamento) {
                cicloAtual.data_arquivamento = moment().format("YYYY-MM-DD");
                cicloAtual.hora_arquivamento = moment().format("HH:mm");
            }

            fm.ciclo_de_consumo_atual = novoCicloNum;
            const novoCicloObj = {
                ciclo: novoCicloNum,
                status: "assistindo",
                data_inicio: moment().format("YYYY-MM-DD"),
                hora_inicio: moment().format("HH:mm"),
                data_conclusao: "",
                hora_conclusao: ""
            };
            if (!Array.isArray(fm.ciclos)) fm.ciclos = [];
            fm.ciclos.push(novoCicloObj);
            
            fm.consumo_status = "parado";
            fm.sessao_ativa_timestamp_inicio = "";
        });

        new Notice(`✅ Novo Ciclo de Consumo (${novoCicloNum}) iniciado para o Podcast!`);

    } catch (e) {
        new Notice("❌ ERRO crítico ao iniciar novo ciclo. Verifique o console.");
        console.error("Erro em iniciarNovoCicloPodcastUnico.js:", e);
    }
};