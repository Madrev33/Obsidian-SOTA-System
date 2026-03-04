// SOTA - Script de Criação de Livro v3.0 (Rich UI)
// Interface gráfica unificada para criar livros com estrutura de capítulos.

module.exports = async (params) => {
    const { app, obsidian } = params;
    const { Notice, TFile, Modal, Setting, ButtonComponent, TextComponent, DropdownComponent } = obsidian;
    const moment = params.obsidian.moment;

    const gerarUID = () => `sota-${Math.random().toString(36).substring(2, 9)}${Date.now().toString(36).slice(-4)}`;
    const sanitizar = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[-\s]+/g, '_').replace(/[^\w_]+/g, '') : "";

    // --- 1. ESTILOS CSS ---
    const styleId = 'sota-create-book-styles';
    const existingStyle = document.getElementById(styleId);
    if (!existingStyle) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
            .sota-modal-container { padding: 0 20px 20px 20px; }
            .sota-header { text-align: center; margin-bottom: 25px; font-size: 1.5em; font-weight: 700; color: var(--text-normal); }
            .sota-input-wrapper { display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px; }
            .sota-label { font-size: 0.85em; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
            .sota-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            
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
    class CreateBookModal extends Modal {
        constructor(app) {
            super(app);
            this.data = {
                nome: "",
                paginas: 0,
                capitulos: 1,
                soberania: "interna",
                acao: "backlog"
            };
        }

        onOpen() {
            const { contentEl } = this;
            contentEl.empty();
            contentEl.addClass("sota-modal-container");
            this.modalEl.style.width = "500px";

            contentEl.createDiv({ cls: "sota-header", text: "📚 Novo Livro" });

            // 1. Nome
            const wrapName = contentEl.createDiv({ cls: "sota-input-wrapper" });
            wrapName.createDiv({ cls: "sota-label", text: "Título do Livro" });
            const nameInput = new TextComponent(wrapName);
            nameInput.inputEl.addClass("sota-input");
            nameInput.setPlaceholder("Ex: Sapiens").onChange(v => this.data.nome = v);
            setTimeout(() => nameInput.inputEl.focus(), 50);

            // 2. Metadados Numéricos (Grid)
            const grid = contentEl.createDiv({ cls: "sota-grid-2" });
            
            const wrapPaginas = grid.createDiv({ cls: "sota-input-wrapper" });
            wrapPaginas.createDiv({ cls: "sota-label", text: "Total de Páginas" });
            const paginasInput = new TextComponent(wrapPaginas);
            paginasInput.inputEl.addClass("sota-input");
            paginasInput.inputEl.type = "number";
            paginasInput.setValue("0").onChange(v => this.data.paginas = parseInt(v) || 0);

            const wrapCapitulos = grid.createDiv({ cls: "sota-input-wrapper" });
            wrapCapitulos.createDiv({ cls: "sota-label", text: "Total de Capítulos" });
            const capitulosInput = new TextComponent(wrapCapitulos);
            capitulosInput.inputEl.addClass("sota-input");
            capitulosInput.inputEl.type = "number";
            capitulosInput.setValue("1").onChange(v => this.data.capitulos = parseInt(v) || 1);

            // 3. Soberania
            const wrapSob = contentEl.createDiv({ cls: "sota-input-wrapper" });
            wrapSob.createDiv({ cls: "sota-label", text: "Tipo de Motivação" });
            const sobDropdown = new DropdownComponent(wrapSob);
            sobDropdown.selectEl.addClass("sota-dropdown");
            sobDropdown
                .addOption("interna", "👑 Interna (Vontade Própria)")
                .addOption("externa", "💼 Externa (Obrigação)")
                .setValue("interna")
                .onChange(v => this.data.soberania = v);

            // 4. Ação
            const wrapAction = contentEl.createDiv({ cls: "sota-input-wrapper" });
            wrapAction.createDiv({ cls: "sota-label", text: "Status Inicial" });
            const actDropdown = new DropdownComponent(wrapAction);
            actDropdown.selectEl.addClass("sota-dropdown");
            actDropdown
                .addOption("backlog", "📥 Salvar para Depois")
                .addOption("ativo", "🔥 Ler Agora")
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
        const nomeDoLivro = data.nome;
        const totalPaginas = data.paginas;
        const totalCapitulos = data.capitulos;
        const soberaniaSelecionada = data.soberania;
        const escolhaAcao = data.acao;

        new Notice("🚀 Criando seu projeto de leitura, aguarde um momento...");

        const config = {
            template_hub: "99 - BACKEND/Templates/Midias/Livro/Livro_Template.md",
            template_capitulo: "99 - BACKEND/Templates/Midias/Livro/Capitulo_Livro_Template.md",
            pastaConsumir: "03 - Conhecimento/01 - Mídias/01. Para Consumir/Livros",
            pastaProgresso: "03 - Conhecimento/01 - Mídias/02. Em Progresso/Livros"
        };
        
        const sota_uid = gerarUID();
        const nomePastaLivro = nomeDoLivro.replace(/[\\/:"*?<>|#^\[\]]+/g, '').trim();
        const pastaDestinoRaiz = escolhaAcao === 'ativo' ? config.pastaProgresso : config.pastaConsumir;
        const pastaLivroCompleta = `${pastaDestinoRaiz}/${nomePastaLivro}`;

        if (await app.vault.adapter.exists(pastaLivroCompleta)) {
            new Notice(`❌ ERRO: Uma pasta para "${nomePastaLivro}" já existe.`);
            return;
        }

        try {
            // Criação da estrutura de pastas
            await app.vault.createFolder(pastaLivroCompleta);
            await app.vault.createFolder(`${pastaLivroCompleta}/HUB`);
            const pastaCapitulosRaiz = `${pastaLivroCompleta}/Capitulos`;
            const pastaCiclo1 = `${pastaCapitulosRaiz}/Ciclo_01`;
            await app.vault.createFolder(pastaCapitulosRaiz);
            await app.vault.createFolder(pastaCiclo1);
            
            const nomeLivroSanitizado = sanitizar(nomePastaLivro);
            const pastaLogMetricas = `99 - BACKEND/Logs_Metricas/Livros/${nomeLivroSanitizado}`;
            if (!await app.vault.adapter.exists(pastaLogMetricas)) {
                await app.vault.createFolder(pastaLogMetricas);
            }
        
            const nomeArquivoHub = `00. HUB - ${nomePastaLivro}.md`;
            const caminhoHub = `${pastaLivroCompleta}/HUB/${nomeArquivoHub}`;
            
            // --- ETAPA 3: CRIAÇÃO DE ARQUIVOS ---
            const criarArquivo = async (caminhoDestino, caminhoTemplate, placeholders) => {
                const templateFile = app.vault.getAbstractFileByPath(caminhoTemplate);
                if (!(templateFile instanceof TFile)) throw new Error(`Template não encontrado: ${caminhoTemplate}`);
                let conteudo = await app.vault.read(templateFile);
                for (const key in placeholders) {
                    conteudo = conteudo.replaceAll(key, placeholders[key]);
                }
                return await app.vault.create(caminhoDestino, conteudo);
            };

            const placeholdersHub = {
                '%%TITLE%%': nomeDoLivro,
                '%%TOTAL_PAGINAS%%': totalPaginas,
                '%%TOTAL_CAPITULOS%%': totalCapitulos,
                '%%STATUS_MANUAL%%': escolhaAcao === 'ativo' ? 'lendo' : 'para-ler',
                '%%DATA_INICIO%%': escolhaAcao === 'ativo' ? moment().format("YYYY-MM-DD") : "",
                '%%HORA_INICIO%%': escolhaAcao === 'ativo' ? moment().format("HH:mm") : "",
                '%%DATA_CRIACAO%%': moment().format("YYYY-MM-DD"),
                '%%HORA_CRIACAO%%': moment().format("HH:mm"),
                '%%SOTA_UID%%': sota_uid,
                '%%ID_MIDIA%%': nomeLivroSanitizado,
                '%%SOBERANIA%%': soberaniaSelecionada
            };
            const arquivoHub = await criarArquivo(caminhoHub, config.template_hub, placeholdersHub);

            if (totalCapitulos > 0) {
                const conteudoCapituloBase = await app.vault.read(app.vault.getAbstractFileByPath(config.template_capitulo));
                for (let i = 1; i <= totalCapitulos; i++) {
                    const numeroCapitulo = i.toString().padStart(2, '0');
                    const nomePastaCapitulo = `${numeroCapitulo} - Inserir Título do Capítulo`;
                    const pastaCapituloPath = `${pastaCiclo1}/${nomePastaCapitulo}`;
                    await app.vault.createFolder(pastaCapituloPath);

                    // Criação do Excalidraw
                    try {
                        const templateExcalidrawPath = "99 - BACKEND/Templates/Midias/Livro/Excalidraw_Template_Vazio_Livro.md";
                        const templateExcalidrawFile = app.vault.getAbstractFileByPath(templateExcalidrawPath);
                        if (templateExcalidrawFile instanceof TFile) {
                            const templateContent = await app.vault.read(templateExcalidrawFile);
                            const nomeArquivoExcalidraw = `Mapa Mental - Capítulo ${numeroCapitulo}.excalidraw.md`;
                            await app.vault.create(`${pastaCapituloPath}/${nomeArquivoExcalidraw}`, templateContent);
                        }
                    } catch (error) { console.error("SOTA - Erro ao criar Excalidraw:", error); }

                    // Criação da nota de capítulo
                    const nomeArquivoAnotacoes = `Notes - Capítulo ${numeroCapitulo}.md`;
                    const caminhoAnotacoes = `${pastaCapituloPath}/${nomeArquivoAnotacoes}`;
                    let conteudoCapitulo = conteudoCapituloBase
                        .replace(/%%HUB_UID%%/g, sota_uid)
                        .replace(/%%NUMERO_CAPITULO%%/g, i.toString())
                        .replace(/%%NUMERO_CICLO%%/g, "1");
                    await app.vault.create(caminhoAnotacoes, conteudoCapitulo);
                }
            }

            // --- ETAPA 4: AVISO FINAL E ABERTURA DO ARQUIVO ---
            new Notice(`✅ Projeto de Leitura "${nomeDoLivro}" criado com sucesso!`);
            app.workspace.getLeaf(true).openFile(arquivoHub);
        
        } catch (error) {
            console.error("Erro ao criar Projeto de Livro:", error);
            new Notice(`❌ Ocorreu um erro. Verifique o console: ${error.message}`);
        }
    }

    // --- 4. EXECUÇÃO ---
    new CreateBookModal(app).open();
};