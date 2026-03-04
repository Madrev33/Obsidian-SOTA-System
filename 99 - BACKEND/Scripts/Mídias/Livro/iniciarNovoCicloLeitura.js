// SOTA - iniciarNovoCicloLeitura.js v4.0
// Adiciona validação de status do ciclo atual e modal de confirmação para o usuário.

module.exports = async (params) => {
    const { app, quickAddApi: qa, obsidian } = params;
    const { Notice, TFile, Modal, Setting } = obsidian;
    const moment = params.obsidian.moment;

    // --- CLASSE DO MODAL DE CONFIRMAÇÃO (PADRÃO SOTA) ---
    class ConfirmarNovoCicloModal extends Modal {
        constructor(app) {
            super(app);
            this.promise = new Promise((resolve) => { this.resolvePromise = resolve; });
            this.decisionMade = false;
        }

        waitForDecision() { return this.promise; }

        onOpen() {
            this.contentEl.createEl("h2", { text: "Iniciar um Novo Ciclo de Leitura?" });
            this.contentEl.createEl("p", { text: "Esta ação é recomendada para quando você deseja reler o livro do zero. Uma nova estrutura de pastas será criada para o próximo ciclo." });

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
        // --- ETAPA 1: LER E VALIDAR O ESTADO ATUAL ---
        const hubFilePath = params.variables?.activeFilePath;
        if (!hubFilePath) { new Notice("❌ ERRO: Caminho do arquivo HUB não recebido."); return; }

        const hubFile = app.vault.getAbstractFileByPath(hubFilePath);
        if (!(hubFile instanceof TFile)) { new Notice("❌ ERRO: Não foi possível encontrar o arquivo HUB."); return; }
        
        const fileCache = app.metadataCache.getFileCache(hubFile);
        const fm = fileCache?.frontmatter;
        if (!fm) { new Notice("❌ ERRO: Não foi possível ler o frontmatter do HUB."); return; }

        const cicloAtualNum = fm.ciclo_de_consumo_atual;
        if (cicloAtualNum === undefined || !Array.isArray(fm.ciclos)) {
            new Notice("❌ ERRO: Metadados de ciclo estão ausentes ou malformados.");
            return;
        }

        const cicloObj = fm.ciclos.find(c => c.ciclo === cicloAtualNum);
        if (cicloObj && cicloObj.status !== 'concluido') {
            new Notice(`⚠️ Ação bloqueada: O Ciclo ${cicloAtualNum} ainda está ativo. Finalize-o antes de iniciar um novo.`);
            return; // ABORTA A EXECUÇÃO
        }

        // --- ETAPA 2: CONFIRMAR COM O USUÁRIO ---
        const modal = new ConfirmarNovoCicloModal(app);
        modal.open();
        const confirmado = await modal.waitForDecision();

        if (!confirmado) {
            new Notice("Ação cancelada.");
            return;
        }

        // --- ETAPA 3: AGIR (CRIAR NOVO CICLO) ---
        new Notice("🚀 Iniciando novo ciclo de leitura...");
        
        const totalCapitulos = fm.total_capitulos || 0;
        const novoCicloNum = cicloAtualNum + 1;
        const pastaLivroCompleta = hubFile.parent.parent.path;
        const sota_uid = fm.sota_uid;

        const pastaCicloNovo = `${pastaLivroCompleta}/Capitulos/Ciclo_${String(novoCicloNum).padStart(2, '0')}`;
        if (await app.vault.adapter.exists(pastaCicloNovo)) {
            new Notice(`⚠️ AVISO: A pasta para o Ciclo ${novoCicloNum} já existe.`);
        } else {
            await app.vault.createFolder(pastaCicloNovo);

            if (totalCapitulos > 0) {
                const templateCapituloPath = `99 - BACKEND/Templates/Midias/Livro/Capitulo_Livro_Template.md`;
                const templateFile = app.vault.getAbstractFileByPath(templateCapituloPath);
                if (!templateFile) throw new Error(`Template de capítulo '${templateCapituloPath}' não encontrado.`);
                const conteudoCapituloBase = await app.vault.read(templateFile);

                for (let i = 1; i <= totalCapitulos; i++) {
                    const numeroCapitulo = i.toString().padStart(2, '0');
                    const nomePastaCapitulo = `${numeroCapitulo} - Inserir Título do Capítulo`;
                    const pastaCapituloPath = `${pastaCicloNovo}/${nomePastaCapitulo}`;
                    await app.vault.createFolder(pastaCapituloPath);

                    try {
                        const templatePath = "99 - BACKEND/Templates/Midias/Livro/Excalidraw_Template_Vazio_Livro.md";
                        const excalidrawTemplateFile = app.vault.getAbstractFileByPath(templatePath); // Corrigido `this.app` para `app`

                        if (excalidrawTemplateFile instanceof TFile) {
                            const templateContent = await app.vault.read(excalidrawTemplateFile); // Corrigido `this.app` para `app`
                            const nomeArquivoExcalidraw = `Mapa Mental - Capítulo ${numeroCapitulo}.excalidraw.md`;
                            const caminhoExcalidraw = `${pastaCapituloPath}/${nomeArquivoExcalidraw}`;
                            await app.vault.create(caminhoExcalidraw, templateContent); // Corrigido `this.app` para `app`
                        } else {
                            new Notice("⚠️ Template de Excalidraw não encontrado.");
                        }
                    } catch (error) {
                        console.error("SOTA - Erro ao criar Excalidraw: ", error);
                    }

                    const nomeArquivoAnotacoes = `Notes - Capítulo ${numeroCapitulo}.md`;
                    const caminhoAnotacoes = `${pastaCapituloPath}/${nomeArquivoAnotacoes}`;
                    
                    let conteudoCapitulo = conteudoCapituloBase
                        .replace(/%%HUB_UID%%/g, sota_uid)
                        .replace(/%%NUMERO_CAPITULO%%/g, i.toString())
                        .replace(/%%NUMERO_CICLO%%/g, novoCicloNum.toString());
        
                    await app.vault.create(caminhoAnotacoes, conteudoCapitulo);
                }
            }
        }
        
        await app.fileManager.processFrontMatter(hubFile, (fm) => {
            fm.ciclo_de_consumo_atual = novoCicloNum;
            const novoCicloObj = {
                ciclo: novoCicloNum,
                status: "lendo", // O novo ciclo começa ativo
                data_inicio: moment().format("YYYY-MM-DD"),
                hora_inicio: moment().format("HH:mm"),
                data_conclusao: "",
                hora_conclusao: ""
            };
            if (!Array.isArray(fm.ciclos)) fm.ciclos = [];
            fm.ciclos.push(novoCicloObj);

            // Reseta todos os contadores e status de leitura para o novo ciclo
            fm.leitura_pagina_atual = 1;
            fm.leitura_capitulo_atual = 1;
            fm.ultima_pagina_lida = 0;
            fm.paginas_lidas = 0;
            fm.leitura_maior_pagina_alcancada = 0; // Importante zerar este
            fm.leitura_status = "parado";
            fm.leitura_sessao_ativa_timestamp_inicio = "";
        });

        new Notice(`✅ Novo Ciclo de Leitura (${novoCicloNum}) iniciado!`);

    } catch (error) {
        console.error("Erro no script iniciarNovoCicloLeitura:", error);
        new Notice("❌ Ocorreu um erro. Verifique o console.");
    }
};