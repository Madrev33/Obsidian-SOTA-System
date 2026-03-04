// SOTA - criarExercicio.js v3.0 (Polymorphic Support)
// Interface gráfica para criação de exercícios com suporte a tipos de métrica e resistência.

module.exports = async (params) => {
    const { app, quickAddApi: qa, obsidian } = params;
    const { Notice, Modal, Setting, ButtonComponent, TextComponent, DropdownComponent, TFile } = obsidian;

    // --- 1. CONFIGURAÇÃO ---
    const config = {
        template_path: "99 - BACKEND/Templates/Exercicios/Exercicio_Manual_Template.md",
        exercicios_manual_folder: "04 - Corpo & Movimento/01 - Exercícios Físicos/01. Manual/Exercícios",
        grupos_manual_folder: "04 - Corpo & Movimento/01 - Exercícios Físicos/01. Manual/Grupos Musculares",
        logs_root_folder: "99 - BACKEND/Logs_Metricas/Exercicios"
    };

    // --- 2. INJEÇÃO DE ESTILOS (SOTA Design System) ---
    const existingStyle = document.getElementById('sota-exercicio-creator-styles');
    if (existingStyle) existingStyle.remove();

    const style = document.createElement('style');
    style.id = 'sota-exercicio-creator-styles';
    style.innerHTML = `
        .sota-modal-container { padding: 0 20px 20px 20px; }
        .sota-header { text-align: center; margin-bottom: 25px; font-size: 1.5em; font-weight: 700; color: var(--text-normal); }
        
        .sota-form-grid { display: flex; flex-direction: column; gap: 20px; }
        
        .sota-input-wrapper { display: flex; flex-direction: column; gap: 6px; }
        .sota-label { font-size: 0.85em; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
        
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

        .sota-footer { 
            margin-top: 30px; 
            padding-top: 20px; 
            border-top: 1px solid var(--background-modifier-border); 
            display: flex; 
            justify-content: flex-end; 
            gap: 10px; 
        }
    `;
    document.head.appendChild(style);

    // --- 3. FUNÇÕES AUXILIARES ---
    const sanitizarParaId = (str) => {
        if (!str) return "";
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[-\s&]+/g, '_').replace(/[^\w_]+/g, '');
    };

    // --- 4. CLASSE DO MODAL ---
    class ExercicioCreatorModal extends Modal {
        constructor(app) {
            super(app);
            this.app = app;
            this.data = {
                nome: "",
                grupo: "",
                equipamento: "",
                tipoMetrica: "reps",
                tipoResistencia: "carga_externa"
            };
            this.gruposDisponiveis = [];
        }

        async onOpen() {
            this.contentEl.empty();
            this.contentEl.addClass("sota-modal-container");
            this.modalEl.style.width = "500px"; 
            this.modalEl.style.maxWidth = "95vw";

            // Carrega grupos existentes (Pastas ou Arquivos do Manual)
            this.gruposDisponiveis = this.app.vault.getMarkdownFiles()
                .filter(f => f.path.startsWith(config.grupos_manual_folder))
                .map(f => f.basename)
                .sort();

            if (this.gruposDisponiveis.length === 0) {
                new Notice("⚠️ Nenhum Grupo Muscular encontrado no Manual. Crie-os primeiro.");
                this.close();
                return;
            }

            this.render();
        }

        onClose() {
            this.contentEl.empty();
        }

        render() {
            const { contentEl } = this;
            contentEl.empty();

            contentEl.createDiv({ cls: "sota-header", text: "💪 Novo Exercício" });

            const formDiv = contentEl.createDiv({ cls: "sota-form-grid" });

            // 1. Nome do Exercício
            const wrapNome = formDiv.createDiv({ cls: "sota-input-wrapper" });
            wrapNome.createDiv({ cls: "sota-label", text: "Nome do Exercício" });
            const nomeInput = new TextComponent(wrapNome);
            nomeInput.inputEl.addClass("sota-input");
            nomeInput.setPlaceholder("Ex: Supino Inclinado");
            nomeInput.setValue(this.data.nome);
            nomeInput.onChange(v => this.data.nome = v);
            // Foco inicial
            setTimeout(() => nomeInput.inputEl.focus(), 50);

            // 2. Grupo Muscular (Dropdown)
            const wrapGrupo = formDiv.createDiv({ cls: "sota-input-wrapper" });
            wrapGrupo.createDiv({ cls: "sota-label", text: "Grupo Muscular Primário" });
            const grupoDropdown = new DropdownComponent(wrapGrupo);
            grupoDropdown.selectEl.addClass("sota-dropdown");
            
            grupoDropdown.addOption("", "-- Selecione --");
            this.gruposDisponiveis.forEach(g => grupoDropdown.addOption(g, g));
            
            grupoDropdown.setValue(this.data.grupo);
            grupoDropdown.onChange(v => this.data.grupo = v);

            // --- NOVOS INPUTS ---

            // 3. Tipo de Métrica (Dropdown)
            const wrapMetrica = formDiv.createDiv({ cls: "sota-input-wrapper" });
            wrapMetrica.createDiv({ cls: "sota-label", text: "Tipo de Métrica" });
            const metricaDropdown = new DropdownComponent(wrapMetrica);
            metricaDropdown.selectEl.addClass("sota-dropdown");
            
            metricaDropdown.addOption("reps", "Repetições (Padrão)");
            metricaDropdown.addOption("tempo", "Tempo (Isométrico)");
            metricaDropdown.addOption("distancia", "Distância (Cardio)");
            
            metricaDropdown.setValue(this.data.tipoMetrica);
            metricaDropdown.onChange(v => this.data.tipoMetrica = v);

            // 4. Tipo de Resistência (Dropdown)
            const wrapResistencia = formDiv.createDiv({ cls: "sota-input-wrapper" });
            wrapResistencia.createDiv({ cls: "sota-label", text: "Tipo de Resistência" });
            const resistenciaDropdown = new DropdownComponent(wrapResistencia);
            resistenciaDropdown.selectEl.addClass("sota-dropdown");
            
            resistenciaDropdown.addOption("carga_externa", "Carga Externa (Máquinas/Pesos/Elástico)");
            resistenciaDropdown.addOption("peso_corporal", "Peso Corporal (Calistenia)");
            
            resistenciaDropdown.setValue(this.data.tipoResistencia);
            resistenciaDropdown.onChange(v => {
                this.data.tipoResistencia = v;
                // Re-renderiza para atualizar a obrigatoriedade do equipamento
                this.render(); 
            });

            // 5. Equipamento (Texto Livre - Condicional)
            const wrapEq = formDiv.createDiv({ cls: "sota-input-wrapper" });
            
            // Texto do label muda se for opcional
            const labelEq = this.data.tipoResistencia === 'peso_corporal' ? "Equipamento (Opcional)" : "Equipamento Principal";
            wrapEq.createDiv({ cls: "sota-label", text: labelEq });
            
            const eqInput = new TextComponent(wrapEq);
            eqInput.inputEl.addClass("sota-input");
            eqInput.setPlaceholder("Ex: Barra, Halteres, Elástico");
            eqInput.setValue(this.data.equipamento);
            eqInput.onChange(v => this.data.equipamento = v);

            // Footer
            const footer = contentEl.createDiv({ cls: "sota-footer" });
            new ButtonComponent(footer)
                .setButtonText("Cancelar")
                .onClick(() => this.close());
            
            new ButtonComponent(footer)
                .setButtonText("🚀 Criar Exercício")
                .setCta()
                .onClick(() => this.salvarExercicio());
        }

        async salvarExercicio() {
            // Validação
            if (!this.data.nome || !this.data.grupo) {
                new Notice("❌ Nome e Grupo Muscular são obrigatórios.");
                return;
            }

            // Validação condicional de equipamento
            if (this.data.tipoResistencia === 'carga_externa' && !this.data.equipamento) {
                new Notice("⚠️ Para Carga Externa, o Equipamento é obrigatório.");
                return;
            }

            const nomeClean = this.data.nome.trim();
            const idExercicio = sanitizarParaId(nomeClean);
            const idGrupo = sanitizarParaId(this.data.grupo);
            const equipamento = this.data.equipamento || "Nenhum (Peso Corporal)";

            try {
                new Notice("⚙️ Processando criação...");

                // --- PARTE A: CRIAR NOTA NO MANUAL ---
                const pastaManualDestino = `${config.exercicios_manual_folder}/${this.data.grupo}`;
                
                if (!await this.app.vault.adapter.exists(pastaManualDestino)) {
                    await this.app.vault.createFolder(pastaManualDestino);
                }

                const nomeArquivo = `${nomeClean.replace(/[\\/:"*?<>|#^\[\]]+/g, '')}.md`;
                const caminhoManualCompleto = `${pastaManualDestino}/${nomeArquivo}`;

                if (await this.app.vault.adapter.exists(caminhoManualCompleto)) {
                    new Notice("⚠️ Este exercício já existe no Manual.");
                    return;
                }

                const templateFile = this.app.vault.getAbstractFileByPath(config.template_path);
                if (!(templateFile instanceof TFile)) {
                    new Notice("❌ Template não encontrado.");
                    return;
                }
                let templateContent = await this.app.vault.read(templateFile);

                // Substituição de Placeholders (Incluindo os Novos)
                const conteudoFinal = templateContent
                    .replace(/%%NOME_EXERCICIO%%/g, nomeClean)
                    .replace(/%%ID_EXERCICIO%%/g, idExercicio)
                    .replace(/%%GRUPO_MUSCULAR%%/g, idGrupo)
                    .replace(/%%EQUIPAMENTO%%/g, equipamento)
                    .replace(/%%TIPO_METRICA%%/g, this.data.tipoMetrica)
                    .replace(/%%TIPO_RESISTENCIA%%/g, this.data.tipoResistencia);

                const novoArquivoManual = await this.app.vault.create(caminhoManualCompleto, conteudoFinal);

                // --- PARTE B: ESTRUTURA DE LOGS (Mantida igual) ---
                const pastaLogGrupo = `${config.logs_root_folder}/${idGrupo}`;
                const pastaLogExercicio = `${pastaLogGrupo}/${idExercicio}`;
                const arquivoLog = `${pastaLogExercicio}/raw_logs.md`;

                if (!await this.app.vault.adapter.exists(pastaLogGrupo)) {
                    await this.app.vault.createFolder(pastaLogGrupo);
                }
                if (!await this.app.vault.adapter.exists(pastaLogExercicio)) {
                    await this.app.vault.createFolder(pastaLogExercicio);
                }
                if (!await this.app.vault.adapter.exists(arquivoLog)) {
                    await this.app.vault.create(arquivoLog, ""); 
                }

                new Notice(`✅ Exercício "${nomeClean}" criado com sucesso!`);
                this.close();
                
                this.app.workspace.getLeaf(true).openFile(novoArquivoManual);

            } catch (err) {
                console.error("Erro ao criar exercício:", err);
                new Notice("❌ Erro fatal. Verifique o console.");
            }
        }
    }

    // --- 5. EXECUÇÃO ---
    new ExercicioCreatorModal(app).open();
};