// SOTA - Script de Criação de Cursos v2.0 (Rich UI)
// Interface unificada para criar cursos com estrutura de módulos.

module.exports = async (params) => {
    const { app, obsidian } = params;
    const { Notice, TFile, Modal, Setting, ButtonComponent, TextComponent, DropdownComponent } = obsidian;
    const moment = params.obsidian.moment;

    const gerarUID = () => `sota-${Math.random().toString(36).substring(2, 9)}${Date.now().toString(36).slice(-4)}`;
    const sanitizar = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[-\s]+/g, '_').replace(/[^\w_]+/g, '') : "";

    // --- 1. ESTILOS CSS ---
    const styleId = 'sota-create-course-styles';
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
    class CreateCourseModal extends Modal {
        constructor(app) {
            super(app);
            this.data = {
                nome: "",
                modulos: 1,
                soberania: "interna",
                acao: "pendente"
            };
        }

        onOpen() {
            const { contentEl } = this;
            contentEl.empty();
            contentEl.addClass("sota-modal-container");
            this.modalEl.style.width = "450px";

            contentEl.createDiv({ cls: "sota-header", text: "🎓 Novo Curso" });

            // 1. Nome
            const wrapName = contentEl.createDiv({ cls: "sota-input-wrapper" });
            wrapName.createDiv({ cls: "sota-label", text: "Nome do Curso" });
            const nameInput = new TextComponent(wrapName);
            nameInput.inputEl.addClass("sota-input");
            nameInput.setPlaceholder("Ex: Masterclass de Python").onChange(v => this.data.nome = v);
            setTimeout(() => nameInput.inputEl.focus(), 50);

            // 2. Módulos
            const wrapModulos = contentEl.createDiv({ cls: "sota-input-wrapper" });
            wrapModulos.createDiv({ cls: "sota-label", text: "Quantidade de Módulos" });
            const modInput = new TextComponent(wrapModulos);
            modInput.inputEl.addClass("sota-input");
            modInput.inputEl.type = "number";
            modInput.setValue("1").onChange(v => this.data.modulos = parseInt(v) || 1);

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
                .addOption("pendente", "📥 Salvar para Depois")
                .addOption("ativo", "🔥 Assistir Agora")
                .setValue("pendente")
                .onChange(v => this.data.acao = v);

            // Footer
            const footer = contentEl.createDiv({ cls: "sota-footer" });
            new ButtonComponent(footer).setButtonText("Cancelar").onClick(() => this.close());
            new ButtonComponent(footer).setButtonText("Criar").setCta().onClick(() => this.save());
        }

        async save() {
            if (!this.data.nome) { new Notice("⚠️ O nome é obrigatório."); return; }
            this.close();
            await processarCriacao(this.data);
        }

        onClose() { this.contentEl.empty(); }
    }

    // --- 3. LÓGICA DE CRIAÇÃO (Extraída) ---
    async function processarCriacao(data) {
        const nomeDoCurso = data.nome;
        const totalModulos = data.modulos;
        const soberaniaSelecionada = data.soberania;
        const escolhaAcao = data.acao;

        // --- CONFIGURAÇÃO DE CAMINHOS E TEMPLATES ---
        const config = {
            template_hub: "99 - BACKEND/Templates/Midias/Curso/Curso_Template.md",
            template_modulo: "99 - BACKEND/Templates/Midias/Curso/Modulo_Template.md",
            template_aula: "99 - BACKEND/Templates/Midias/Curso/Aula_Template.md",
            pastaConsumir: "03 - Conhecimento/01 - Mídias/01. Para Consumir/Cursos",
            pastaProgresso: "03 - Conhecimento/01 - Mídias/02. Em Progresso/Cursos"
        };

        const pastaDestinoRaiz = escolhaAcao === 'ativo' ? config.pastaProgresso : config.pastaConsumir;
        const nomePastaCurso = nomeDoCurso.replace(/[\\/:"*?<>|#^\[\]]+/g, '').trim();
        const pastaCursoCompleta = `${pastaDestinoRaiz}/${nomePastaCurso}`;

        if (await app.vault.adapter.exists(pastaCursoCompleta)) {
            new Notice(`❌ ERRO: Uma pasta para o curso "${nomePastaCurso}" já existe.`);
            return;
        }

        new Notice("🚀 Criando ecossistema do curso...");

        try {
            // Criação de Pastas
            await app.vault.createFolder(pastaCursoCompleta);
            await app.vault.createFolder(`${pastaCursoCompleta}/HUB`);
            const pastaModulosRaiz = `${pastaCursoCompleta}/Módulos`;
            await app.vault.createFolder(pastaModulosRaiz);
            const pastaCiclo1 = `${pastaModulosRaiz}/Ciclo_01`;
            await app.vault.createFolder(pastaCiclo1);

            // Criação Proativa da Pasta de Métricas
            const nomeCursoSanitizado = sanitizar(nomePastaCurso);
            const pastaLogMetricas = `99 - BACKEND/Logs_Metricas/Cursos/${nomeCursoSanitizado}`;
            if (!await app.vault.adapter.exists(pastaLogMetricas)) {
                await app.vault.createFolder(pastaLogMetricas);
            }

            const sota_uid = gerarUID();

            // Nomenclatura de Arquivos
            const nomeArquivoHub = `00. HUB - ${nomePastaCurso}.md`;
            const caminhoHub = `${pastaCursoCompleta}/HUB/${nomeArquivoHub}`;

            // --- CRIAÇÃO DE ARQUIVOS A PARTIR DOS TEMPLATES ---
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
                '%%TITLE%%': nomeDoCurso,
                '%%TOTAL_MODULOS%%': totalModulos,
                '%%STATUS_MANUAL%%': escolhaAcao === 'ativo' ? 'assistindo' : 'para-assistir',
                '%%DATA_INICIO%%': escolhaAcao === 'ativo' ? moment().format("YYYY-MM-DD") : "",
                '%%HORA_INICIO%%': escolhaAcao === 'ativo' ? moment().format("HH:mm") : "",
                '%%DATA_CRIACAO%%': moment().format("YYYY-MM-DD"),
                '%%HORA_CRIACAO%%': moment().format("HH:mm"),
                '%%SOTA_UID%%': sota_uid,
                '%%ID_MIDIA%%': nomeCursoSanitizado,
                '%%SOBERANIA%%': soberaniaSelecionada
            };
            const arquivoHub = await criarArquivo(caminhoHub, config.template_hub, placeholdersHub);

            // Criação de Módulos e Aulas
            if (totalModulos > 0) {
                for (let i = 1; i <= totalModulos; i++) {
                    const numeroModulo = i.toString().padStart(2, '0');
                    const nomePastaModulo = `${numeroModulo} - Inserir Título do Módulo`;
                    const pastaModuloPath = `${pastaCiclo1}/${nomePastaModulo}`;
                    await app.vault.createFolder(pastaModuloPath);

                    const nomeArquivoHubModulo = `00 - HUB Módulo ${numeroModulo}.md`;
                    const caminhoHubModulo = `${pastaModuloPath}/${nomeArquivoHubModulo}`;
                    
                    await criarArquivo(caminhoHubModulo, config.template_modulo, {
                        '%%HUB_UID%%': sota_uid,
                        '%%NUMERO_MODULO%%': i.toString(),
                        '%%NOME_CURSO%%': nomeDoCurso,
                    });
                }
            }

            new Notice(`✅ Curso "${nomeDoCurso}" criado com sucesso!`);
            app.workspace.getLeaf(true).openFile(arquivoHub);

        } catch (error) {
            console.error("Erro ao criar Projeto de Curso:", error);
            new Notice(`❌ Ocorreu um erro. Verifique o console: ${error.message}`);
        }
    }

    // --- 4. EXECUÇÃO ---
    new CreateCourseModal(app).open();
};