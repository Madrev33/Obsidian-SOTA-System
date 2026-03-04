// SOTA - Script de Criação de Vídeo v3.0 (Rich UI)
// Interface unificada para criar micro-projetos de vídeo.

module.exports = async (params) => {
    const { app, obsidian } = params;
    const { Notice, TFile, Modal, Setting, ButtonComponent, TextComponent, DropdownComponent } = obsidian;
    const moment = params.obsidian.moment;

    const gerarUID = () => `sota-${Math.random().toString(36).substring(2, 9)}${Date.now().toString(36).slice(-4)}`;
    const sanitizar = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[-\s]+/g, '_').replace(/[^\w_]+/g, '') : "";

    // --- 1. ESTILOS CSS ---
    const styleId = 'sota-create-video-styles';
    const existingStyle = document.getElementById(styleId);
    if (!existingStyle) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
            .sota-modal-container { padding: 0 20px 20px 20px; }
            .sota-header { text-align: center; margin-bottom: 25px; font-size: 1.5em; font-weight: 700; color: var(--text-normal); }
            .sota-input-wrapper { display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px; }
            .sota-label { font-size: 0.85em; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
            
            /* CSS ROBUSTO */
            .sota-input, .sota-dropdown { 
                width: 100%; 
                background-color: var(--background-primary); 
                border: 1px solid var(--background-modifier-border); 
                border-radius: 6px; 
                padding: 5px 12px;
                color: var(--text-normal);
            }
            .sota-input:focus, .sota-dropdown:focus { 
                border-color: var(--interactive-accent); 
                box-shadow: 0 0 0 2px rgba(var(--interactive-accent-rgb), 0.15); 
            }
            .sota-footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid var(--background-modifier-border); display: flex; justify-content: flex-end; gap: 10px; }
        `;
        document.head.appendChild(style);
    }

    // --- 2. CLASSE DO MODAL ---
    class CreateVideoModal extends Modal {
        constructor(app) {
            super(app);
            this.data = {
                nome: "",
                soberania: "interna",
                acao: "backlog"
            };
        }

        onOpen() {
            const { contentEl } = this;
            contentEl.empty();
            contentEl.addClass("sota-modal-container");
            this.modalEl.style.width = "450px";

            contentEl.createDiv({ cls: "sota-header", text: "📹 Novo Vídeo" });

            // 1. Nome
            const wrapName = contentEl.createDiv({ cls: "sota-input-wrapper" });
            wrapName.createDiv({ cls: "sota-label", text: "Título do Vídeo" });
            const nameInput = new TextComponent(wrapName);
            nameInput.inputEl.addClass("sota-input");
            nameInput.setPlaceholder("Ex: Tutorial de Blender").onChange(v => this.data.nome = v);
            setTimeout(() => nameInput.inputEl.focus(), 50);

            // 2. Soberania
            const wrapSob = contentEl.createDiv({ cls: "sota-input-wrapper" });
            wrapSob.createDiv({ cls: "sota-label", text: "Tipo de Motivação" });
            const sobDropdown = new DropdownComponent(wrapSob);
            sobDropdown.selectEl.addClass("sota-dropdown");
            sobDropdown
                .addOption("interna", "👑 Interna (Vontade Própria)")
                .addOption("externa", "💼 Externa (Obrigação)")
                .setValue("interna")
                .onChange(v => this.data.soberania = v);

            // 3. Ação
            const wrapAction = contentEl.createDiv({ cls: "sota-input-wrapper" });
            wrapAction.createDiv({ cls: "sota-label", text: "Status Inicial" });
            const actDropdown = new DropdownComponent(wrapAction);
            actDropdown.selectEl.addClass("sota-dropdown");
            actDropdown
                .addOption("backlog", "📥 Salvar para Depois")
                .addOption("ativo", "🔥 Assistir Agora")
                .setValue("backlog")
                .onChange(v => this.data.acao = v);

            // Footer
            const footer = contentEl.createDiv({ cls: "sota-footer" });
            new ButtonComponent(footer).setButtonText("Cancelar").onClick(() => this.close());
            new ButtonComponent(footer).setButtonText("Criar").setCta().onClick(() => this.save());
        }

        async save() {
            if (!this.data.nome) { new Notice("⚠️ O título é obrigatório."); return; }
            this.close();
            await processarCriacao(this.data);
        }

        onClose() { this.contentEl.empty(); }
    }

    // --- 3. LÓGICA DE CRIAÇÃO (Extraída) ---
    async function processarCriacao(data) {
        const nomeDoVídeo = data.nome;
        const soberaniaSelecionada = data.soberania;
        const escolhaAcao = data.acao;

        new Notice("🚀 Criando micro-projeto de vídeo, aguarde...");

        const config = {
            template_hub: "99 - BACKEND/Templates/Midias/Video/Video_Template.md",
            template_anotacoes_ciclo: "99 - BACKEND/Templates/Midias/Video/Video_Anotacoes_Template.md",
            template_excalidraw: "99 - BACKEND/Templates/Midias/Video/Excalidraw_Template_Vazio_Video.md",
            pastaConsumir: "03 - Conhecimento/01 - Mídias/01. Para Consumir/Vídeos",
            pastaProgresso: "03 - Conhecimento/01 - Mídias/02. Em Progresso/Vídeos"
        };
        
        const nomePastaVídeo = nomeDoVídeo.replace(/[\\/:"*?<>|#^\[\]]+/g, '').trim();
        const pastaDestinoRaiz = escolhaAcao === 'ativo' ? config.pastaProgresso : config.pastaConsumir;
        const pastaVídeoCompleta = `${pastaDestinoRaiz}/${nomePastaVídeo}`;

        if (await app.vault.adapter.exists(pastaVídeoCompleta)) {
            new Notice(`❌ ERRO: Uma pasta para "${nomePastaVídeo}" já existe.`);
            return;
        }

        try {
            // --- CRIAÇÃO DA ESTRUTURA DE PASTAS ---
            await app.vault.createFolder(pastaVídeoCompleta);
            await app.vault.createFolder(`${pastaVídeoCompleta}/HUB`);
            const pastaCiclosRaiz = `${pastaVídeoCompleta}/Anotações`;
            const pastaCiclo1 = `${pastaCiclosRaiz}/Ciclo_01`;
            await app.vault.createFolder(pastaCiclosRaiz);
            await app.vault.createFolder(pastaCiclo1);
            
            const id_midia = sanitizar(nomePastaVídeo);
            const pastaLogMetricas = `99 - BACKEND/Logs_Metricas/Videos/${id_midia}`;
            if (!await app.vault.adapter.exists(pastaLogMetricas)) {
                await app.vault.createFolder(pastaLogMetricas);
            }

            const sota_uid = gerarUID();

            const criarArquivo = async (caminhoDestino, caminhoTemplate, placeholders = {}) => {
                const templateFile = app.vault.getAbstractFileByPath(caminhoTemplate);
                if (!(templateFile instanceof TFile)) throw new Error(`Template não encontrado: ${caminhoTemplate}`);
                let conteudo = await app.vault.read(templateFile);
                for (const key in placeholders) {
                    conteudo = conteudo.replaceAll(key, placeholders[key]);
                }
                return await app.vault.create(caminhoDestino, conteudo);
            };
            
            // --- CRIAÇÃO DOS ARQUIVOS ---
            
            // 1. HUB (Arquivo principal)
            const nomeHub = `00. HUB - ${nomePastaVídeo}.md`;
            const caminhoHub = `${pastaVídeoCompleta}/HUB/${nomeHub}`;
            const placeholdersHub = {
                '%%TITLE%%': nomeDoVídeo, '%%SOTA_UID%%': sota_uid, '%%ID_MIDIA%%': id_midia,
                '%%STATUS_MANUAL%%': escolhaAcao === 'ativo' ? 'assistindo' : 'para-assistir',
                '%%DATA_INICIO%%': escolhaAcao === 'ativo' ? moment().format("YYYY-MM-DD") : "",
                '%%HORA_INICIO%%': escolhaAcao === 'ativo' ? moment().format("HH:mm") : "",
                '%%DATA_CRIACAO%%': moment().format("YYYY-MM-DD"), '%%HORA_CRIACAO%%': moment().format("HH:mm"),
                '%%SOBERANIA%%': soberaniaSelecionada
            };
            const arquivoHub = await criarArquivo(caminhoHub, config.template_hub, placeholdersHub);

            // 2. Artefatos do Ciclo 1
            const nomeAnotacoesCiclo1 = `00. Anotações.md`;
            const nomeExcalidrawCiclo1 = `01. Mapa Mental.excalidraw.md`;
            
            await criarArquivo(`${pastaCiclo1}/${nomeAnotacoesCiclo1}`, config.template_anotacoes_ciclo, {
                '%%SOTA_UID%%': sota_uid, '%%NUMERO_CICLO%%': 1
            });
            await criarArquivo(`${pastaCiclo1}/${nomeExcalidrawCiclo1}`, config.template_excalidraw);

            new Notice(`✅ Projeto de Vídeo "${nomeDoVídeo}" criado com sucesso!`);
            app.workspace.getLeaf(true).openFile(arquivoHub);
        
        } catch (error) {
            console.error("Erro ao criar Vídeo:", error);
            new Notice(`❌ Ocorreu um erro. Verifique o console: ${error.message}`);
        }
    }

    // --- 4. EXECUÇÃO ---
    new CreateVideoModal(app).open();
};