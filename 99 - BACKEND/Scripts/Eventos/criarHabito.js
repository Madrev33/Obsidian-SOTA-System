// SOTA - criarHabito.js v3.1 (Dual Log Setup)
// Modal interativo para criação de hábitos com suporte a Contadores e Setup Automático de Logs.

module.exports = async (params) => {
    const { app, quickAddApi: qa, obsidian } = params;
    const { Notice, Modal, Setting, ButtonComponent, TextComponent, DropdownComponent, ToggleComponent } = obsidian;

    // --- 1. INJEÇÃO DE ESTILOS CSS ---
    const existingStyle = document.getElementById('sota-habit-modal-styles');
    if (existingStyle) existingStyle.remove();

    const style = document.createElement('style');
    style.id = 'sota-habit-modal-styles';
    style.innerHTML = `
        .sota-modal-container { padding: 0 20px 20px 20px; }
        .sota-header { text-align: center; margin-bottom: 25px; font-size: 1.5em; font-weight: 700; color: var(--text-normal); }
        
        .sota-input-wrapper { display: flex; flex-direction: column; gap: 5px; margin-bottom: 15px; }
        .sota-label { font-size: 0.8em; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
        
        /* Grid Layout */
        .sota-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }

        /* Card de Tipo - Design Refinado */
        .sota-type-selector {
            display: flex;
            background-color: var(--background-primary);
            border: 1px solid var(--background-modifier-border);
            border-radius: 8px;
            padding: 4px;
            margin-bottom: 20px;
            gap: 4px;
        }
        .sota-type-option {
            flex: 1;
            text-align: center;
            padding: 8px;
            cursor: pointer;
            border-radius: 6px;
            font-size: 0.9em;
            color: var(--text-muted);
            transition: all 0.2s;
            border: 1px solid transparent;
        }
        
        /* Estado Hover */
        .sota-type-option:hover {
            background-color: var(--background-modifier-hover);
            color: var(--text-normal);
        }

        /* Estado Ativo (Selecionado) */
        .sota-type-option.active {
            background-color: var(--background-modifier-active-hover); /* Cinza mais claro/destaque sutil */
            color: var(--text-normal);
            font-weight: 600;
            border-color: var(--interactive-accent); /* Borda colorida sutil */
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        /* Área Condicional */
        .sota-conditional-area {
            background-color: var(--background-secondary);
            border: 1px dashed var(--background-modifier-border);
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
            animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }

        .sota-footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid var(--background-modifier-border); display: flex; justify-content: flex-end; gap: 10px; }
        
        .sota-input-full input, .sota-input-full select { width: 100%; }
    `;
    document.head.appendChild(style);

    // --- 2. CONFIGURAÇÃO ---
    const config = {
        templatePath: "99 - BACKEND/Templates/Habitos/Habito_Template.md",
        folderPath: "07 - Engenharia de Hábitos/01 - Hábitos"
    };

    // --- 3. CLASSE DO MODAL ---
    class HabitCreatorModal extends Modal {
        constructor(app) {
            super(app);
            this.data = {
                nome: "",
                tipo: "binario", // binario | contador
                meta: 1, // Default para contador
                frequencia: "diaria",
                impacto: "Saúde",
                dificuldade: "Fácil"
            };
        }

        onOpen() {
            const { contentEl } = this;
            contentEl.empty();
            contentEl.addClass("sota-modal-container");
            this.modalEl.style.width = "500px";

            contentEl.createDiv({ cls: "sota-header", text: "✨ Criar Novo Hábito" });

            // 1. Nome
            const nameWrap = contentEl.createDiv({ cls: "sota-input-wrapper sota-input-full" });
            nameWrap.createDiv({ cls: "sota-label", text: "Nome do Hábito" });
            const nameInput = new TextComponent(nameWrap);
            nameInput.setPlaceholder("Ex: Beber Água, Ler...").onChange(v => this.data.nome = v);
            nameInput.inputEl.focus();

            // 2. Seletor de Tipo (Visual Toggle)
            contentEl.createDiv({ cls: "sota-label", text: "Tipo de Registro", style: "margin-bottom: 5px;" });
            const typeContainer = contentEl.createDiv({ cls: "sota-type-selector" });
            
            const btnBinario = typeContainer.createDiv({ cls: "sota-type-option active", text: "✅ Sim/Não" });
            const btnContador = typeContainer.createDiv({ cls: "sota-type-option", text: "🔢 Contador" });

            // Container para a meta (inicialmente oculto)
            const metaContainer = contentEl.createDiv({ cls: "sota-conditional-area" });
            metaContainer.style.display = "none";
            
            metaContainer.createDiv({ cls: "sota-label", text: "Meta Diária (Quantidade)" });
            const metaInput = new TextComponent(metaContainer);
            metaInput.inputEl.type = "number";
            metaInput.setValue("1").onChange(v => this.data.meta = parseInt(v));
            metaInput.inputEl.style.width = "100%";
            metaInput.inputEl.style.textAlign = "center";
            metaInput.inputEl.style.fontWeight = "bold";

            // Lógica de Troca de Abas
            btnBinario.onclick = () => {
                this.data.tipo = "binario";
                btnBinario.addClass("active");
                btnContador.removeClass("active");
                metaContainer.style.display = "none";
            };
            btnContador.onclick = () => {
                this.data.tipo = "contador";
                btnContador.addClass("active");
                btnBinario.removeClass("active");
                metaContainer.style.display = "block";
                // Foca no input de meta ao abrir
                setTimeout(() => metaInput.inputEl.focus(), 100);
            };

            // 3. Grid de Gamificação
            const grid = contentEl.createDiv({ cls: "sota-grid" });
            
            // Coluna 1: Impacto
            const col1 = grid.createDiv({ cls: "sota-input-wrapper sota-input-full" });
            col1.createDiv({ cls: "sota-label", text: "Impacto (Pilar)" });
            new DropdownComponent(col1)
                .addOption("Saúde", "❤️ Saúde")
                .addOption("Gênio", "🧠 Gênio")
                .addOption("Paz de Espírito", "🕊️ Paz")
                .setValue(this.data.impacto)
                .onChange(v => this.data.impacto = v);

            // Coluna 2: Dificuldade
            const col2 = grid.createDiv({ cls: "sota-input-wrapper sota-input-full" });
            col2.createDiv({ cls: "sota-label", text: "Dificuldade (XP)" });
            new DropdownComponent(col2)
                .addOption("Trivial", "👌 Trivial (5 XP)")
                .addOption("Fácil", "👍 Fácil (10 XP)")
                .addOption("Moderado", "💪 Moderado (25 XP)")
                .addOption("Desafiador", "🔥 Desafiador (50 XP)")
                .addOption("Hardcore", "🏆 Hardcore (100 XP)")
                .setValue(this.data.dificuldade)
                .onChange(v => this.data.dificuldade = v);

            // 4. Footer
            const footer = contentEl.createDiv({ cls: "sota-footer" });
            new ButtonComponent(footer).setButtonText("Cancelar").onClick(() => this.close());
            new ButtonComponent(footer).setButtonText("Criar Hábito").setCta().onClick(() => this.salvar());
        }

        async salvar() {
            if (!this.data.nome) { new Notice("⚠️ O nome é obrigatório."); return; }

            const sanitizar = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[-\s]+/g, '_').replace(/[^\w_]+/g, '');
            const idHabito = sanitizar(this.data.nome);
            const nomeArquivo = `${this.data.nome.replace(/[\\/:"*?<>|#^\[\]]+/g, '')}.md`;
            const pathCompleto = `${config.folderPath}/${nomeArquivo}`;

            if (await app.vault.adapter.exists(pathCompleto)) {
                new Notice("❌ Já existe um hábito com este nome.");
                return;
            }

            // --- SOTA DUAL LOG SETUP (REFATORADO) ---
            // Cria a estrutura de pastas e arquivo de log para o novo hábito automaticamente.
            const logsRoot = "99 - BACKEND/Logs_Metricas/Habitos";
            const habitLogFolder = `${logsRoot}/${idHabito}`;
            const rawLogFile = `${habitLogFolder}/raw_logs.md`;

            try {
                // Garante que a raiz de hábitos exista
                if (!await app.vault.adapter.exists(logsRoot)) {
                    await app.vault.createFolder(logsRoot);
                }
                // Cria a pasta específica do hábito
                if (!await app.vault.adapter.exists(habitLogFolder)) {
                    await app.vault.createFolder(habitLogFolder);
                }
                // Cria o arquivo raw_logs.md vazio
                if (!await app.vault.adapter.exists(rawLogFile)) {
                    await app.vault.create(rawLogFile, "");
                }
            } catch (err) {
                console.error("SOTA: Erro ao criar estrutura de logs do hábito.", err);
                new Notice("⚠️ Hábito criado, mas houve erro na estrutura de logs.");
            }
            // -----------------------------------------

            const templateFile = app.vault.getAbstractFileByPath(config.templatePath);
            if (!templateFile) { new Notice("❌ Template não encontrado."); return; }

            let content = await app.vault.read(templateFile);
            
            // Substituição de Placeholders
            content = content
                .replace(/%%ID_HABITO%%/g, idHabito)
                .replace(/%%NOME_HABITO%%/g, this.data.nome);

            const newFile = await app.vault.create(pathCompleto, content);

            // Atualização do Frontmatter
            await app.fileManager.processFrontMatter(newFile, (fm) => {
                fm.tipo_comportamento = this.data.tipo;
                fm.categoria_impacto = this.data.impacto;
                fm.tier_desafio = this.data.dificuldade;
                fm.frequencia = "diaria"; // Default fixo por enquanto
                
                // Configuração Específica de Contador
                if (this.data.tipo === "contador") {
                    fm.meta_numerica = this.data.meta || 1;
                    fm.tipo_input = "numerico";
                } else {
                    fm.tipo_input = "booleano";
                    delete fm.meta_numerica;
                }
            });

            new Notice(`✅ Hábito "${this.data.nome}" criado!`);
            this.close();
            
            // Opcional: Abrir arquivo
            // app.workspace.getLeaf(true).openFile(newFile);
        }

        onClose() {
            this.contentEl.empty();
        }
    }

    new HabitCreatorModal(app).open();
};