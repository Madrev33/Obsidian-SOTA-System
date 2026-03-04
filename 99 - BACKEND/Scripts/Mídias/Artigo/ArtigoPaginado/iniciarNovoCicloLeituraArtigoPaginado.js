// SOTA - iniciarNovoCicloLeituraArtigoPaginado.js v1.0
// Cria a estrutura de um novo ciclo de leitura para um Artigo Paginado.

module.exports = async (params) => {
    const { app, obsidian } = params;
    const { Notice, TFile, Modal, Setting } = obsidian;
    const moment = params.obsidian.moment;

    class ConfirmarNovoCicloModal extends Modal {
        constructor(app) {
            super(app);
            this.promise = new Promise((resolve) => { this.resolvePromise = resolve; });
            this.decisionMade = false;
        }

        waitForDecision() { return this.promise; }

        onOpen() {
            this.contentEl.createEl("h2", { text: "Iniciar um Novo Ciclo de Leitura?" });
            this.contentEl.createEl("p", { text: "Esta ação é recomendada para quando você deseja reler o artigo do zero. Uma nova estrutura de pastas será criada para o próximo ciclo." });
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
        const hubFilePath = params.variables?.activeFilePath;
        if (!hubFilePath) { new Notice("❌ ERRO: Caminho do arquivo HUB não recebido."); return; }

        const hubFile = app.vault.getAbstractFileByPath(hubFilePath);
        if (!(hubFile instanceof TFile)) { new Notice("❌ ERRO: Não foi possível encontrar o arquivo HUB."); return; }
        
        const fileCache = app.metadataCache.getFileCache(hubFile);
        const fm = fileCache?.frontmatter;
        if (!fm) { new Notice("❌ ERRO: Não foi possível ler o frontmatter do HUB."); return; }

        const cicloAtualNum = fm.ciclo_de_consumo_atual;
        const cicloObj = Array.isArray(fm.ciclos) ? fm.ciclos.find(c => c.ciclo === cicloAtualNum) : null;
        if (cicloObj && cicloObj.status !== 'concluido') {
            new Notice(`⚠️ Ação bloqueada: O Ciclo ${cicloAtualNum} ainda está ativo. Finalize-o antes de iniciar um novo.`);
            return;
        }

        const modal = new ConfirmarNovoCicloModal(app);
        modal.open();
        const confirmado = await modal.waitForDecision();
        if (!confirmado) { new Notice("Ação cancelada."); return; }

        new Notice("🚀 Iniciando novo ciclo de leitura...");
        
        const totalSecoes = fm.total_secoes || 0;
        const novoCicloNum = cicloAtualNum + 1;
        const pastaArtigoCompleta = hubFile.parent.parent.path;
        const sota_uid = fm.sota_uid;

        const pastaCicloNovo = `${pastaArtigoCompleta}/Seções/Ciclo_${String(novoCicloNum).padStart(2, '0')}`;
        if (await app.vault.adapter.exists(pastaCicloNovo)) {
            new Notice(`⚠️ AVISO: A pasta para o Ciclo ${novoCicloNum} já existe.`);
        } else {
            await app.vault.createFolder(pastaCicloNovo);

            if (totalSecoes > 0) {
                const templateSecaoPath = `99 - BACKEND/Templates/Midias/Artigo/ArtigoPaginado/Artigo_Paginado_Secao_Template.md`;
                const templateFile = app.vault.getAbstractFileByPath(templateSecaoPath);
                if (!templateFile) throw new Error(`Template de seção '${templateSecaoPath}' não encontrado.`);
                const conteudoSecaoBase = await app.vault.read(templateFile);

                for (let i = 1; i <= totalSecoes; i++) {
                    const numeroSecao = i.toString().padStart(2, '0');
                    const nomePastaSecao = `${numeroSecao} - Inserir Título da Seção`;
                    const pastaSecaoPath = `${pastaCicloNovo}/${nomePastaSecao}`;
                    await app.vault.createFolder(pastaSecaoPath);

                    try {
                        const templatePath = "99 - BACKEND/Templates/Midias/Artigo/ArtigoPaginado/Excalidraw_Template_Vazio_Artigo_Paginado.md";
                        const excalidrawTemplateFile = app.vault.getAbstractFileByPath(templatePath);

                        if (excalidrawTemplateFile instanceof TFile) {
                            const templateContent = await app.vault.read(excalidrawTemplateFile);
                            const nomeArquivoExcalidraw = `Mapa Mental - Seção ${numeroSecao}.excalidraw.md`;
                            await app.vault.create(`${pastaSecaoPath}/${nomeArquivoExcalidraw}`, templateContent);
                        }
                    } catch (error) { console.error("SOTA - Erro ao criar Excalidraw:", error); }

                    const nomeArquivoAnotacoes = `Notes - Seção ${numeroSecao}.md`;
                    const caminhoAnotacoes = `${pastaSecaoPath}/${nomeArquivoAnotacoes}`;
                    
                    let conteudoSecao = conteudoSecaoBase
                        .replace(/%%HUB_UID%%/g, sota_uid)
                        .replace(/%%NUMERO_SECAO%%/g, i.toString())
                        .replace(/%%NUMERO_CICLO%%/g, novoCicloNum.toString());
        
                    await app.vault.create(caminhoAnotacoes, conteudoSecao);
                }
            }
        }
        
        await app.fileManager.processFrontMatter(hubFile, (fm) => {
            fm.ciclo_de_consumo_atual = novoCicloNum;
            const novoCicloObj = {
                ciclo: novoCicloNum,
                status: "lendo",
                data_inicio: moment().format("YYYY-MM-DD"),
                hora_inicio: moment().format("HH:mm"),
                data_conclusao: "",
                hora_conclusao: ""
            };
            if (!Array.isArray(fm.ciclos)) fm.ciclos = [];
            fm.ciclos.push(novoCicloObj);

            // Reseta todos os contadores e status de leitura para o novo ciclo
            fm.leitura_pagina_atual = 1;
            fm.leitura_secao_atual = 1; // Corrigido de 'capitulo' para 'secao'
            fm.ultima_pagina_lida = 0;
            fm.paginas_lidas = 0;
            fm.leitura_maior_pagina_alcancada = 0;
            fm.leitura_status = "parado";
            fm.leitura_sessao_ativa_timestamp_inicio = "";
        });

        new Notice(`✅ Novo Ciclo de Leitura (${novoCicloNum}) iniciado!`);

    } catch (error) {
        console.error("Erro no script iniciarNovoCicloLeituraArtigoPaginado:", error);
        new Notice("❌ Ocorreu um erro. Verifique o console.");
    }
};