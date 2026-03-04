// SOTA - criarPlanoDeTreino.js v7.0 (Polymorphic Plan Builder)
// Interface unificada para criação de planos com suporte total a Cardio, Força e Peso Corporal.

module.exports = async (params) => {
    const { app, quickAddApi: qa, obsidian } = params;
    const { Notice, Modal, Setting, ButtonComponent, TextComponent, TextAreaComponent, DropdownComponent, moment, TFile } = obsidian;

    // --- 1. ESTILOS CSS ---
    const existingStyle = document.getElementById('sota-plan-builder-styles');
    if (existingStyle) existingStyle.remove();

    const style = document.createElement('style');
    style.id = 'sota-plan-builder-styles';
    style.innerHTML = `
        .sota-modal-container { padding: 0 20px 20px 20px; }
        .sota-header { text-align: center; margin-bottom: 25px; font-size: 1.5em; font-weight: 700; color: var(--text-normal); }
        .sota-meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
        .sota-input-wrapper { display: flex; flex-direction: column; gap: 5px; }
        .sota-label { font-size: 0.8em; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
        
        .sota-input, .sota-dropdown { width: 100%; background-color: var(--background-primary); border: 1px solid var(--background-modifier-border); border-radius: 6px; padding: 8px 12px; color: var(--text-normal); }
        
        /* Workout Card */
        .sota-workout-card { background-color: var(--background-secondary); border: 1px solid var(--background-modifier-border); border-radius: 8px; margin-bottom: 20px; overflow: hidden; }
        .sota-workout-header { background-color: var(--background-primary-alt); padding: 12px 15px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--background-modifier-border); }
        .sota-workout-title-input { font-size: 1.1em; font-weight: 700; background: transparent; border: none; width: 100%; color: var(--text-normal); }
        .sota-workout-title-input:focus { border-bottom: 1px solid var(--interactive-accent); box-shadow: none; }
        .sota-workout-body { padding: 15px; display: flex; flex-direction: column; gap: 10px; }

        /* Exercise Row (Polimórfico) */
        .sota-ex-row { 
            display: grid; 
            /* 1fr para o nome, auto para os inputs (ocupa o que precisar), 30px para o X */
            grid-template-columns: 1fr auto 30px; 
            gap: 15px; 
            align-items: center; /* Centraliza verticalmente */
            background-color: var(--background-primary); 
            padding: 8px 12px; /* Padding reduzido para ficar mais compacto */
            border-radius: 6px; 
            border: 1px solid var(--background-modifier-border); 
        }

        /* Container dos Inputs da Direita */
        .sota-ex-inputs { 
            display: flex; 
            gap: 8px; 
            align-items: center; 
            justify-content: flex-end;
            height: 100%; /* Garante que o flex ocupe a altura para alinhar */
        }
        
        .sota-input-group { position: relative; display: flex; align-items: center; }
        .sota-input-icon { position: absolute; left: 8px; font-size: 0.8em; color: var(--text-muted); pointer-events: none; z-index: 1; }
        .sota-small-input input { padding-left: 24px !important; text-align: center; width: 80px; font-size: 0.9em; background-color: var(--background-secondary); border: 1px solid var(--background-modifier-border); border-radius: 4px; height: 30px; }
        
        .sota-name-col { display: flex; flex-direction: column; gap: 2px; }
        .sota-name-input { 
            border: none !important; 
            background: transparent !important; 
            width: 100%; 
            font-weight: 500; 
            padding: 0 !important; 
            margin: 0 !important;
            height: 30px; /* Força a mesma altura dos inputs pequenos */
        }
        .sota-type-tag { font-size: 0.7em; color: var(--text-muted); text-transform: uppercase; background: var(--background-modifier-hover); padding: 2px 6px; border-radius: 4px; align-self: flex-start; }

        /* Action Buttons Area */
        .sota-actions-row { display: flex; gap: 10px; margin-top: 5px; }
        .sota-btn-dashed { flex: 1; background: transparent; border: 1px dashed var(--background-modifier-border); color: var(--text-muted); cursor: pointer; border-radius: 5px; height: 35px; transition: all 0.2s; }
        .sota-btn-dashed:hover { border-color: var(--interactive-accent); color: var(--interactive-accent); background-color: var(--background-primary); }
        .sota-btn-create { flex: 0 0 auto; padding: 0 15px; border: 1px solid var(--background-modifier-border); background: var(--background-primary); color: var(--text-muted); border-radius: 5px; cursor: pointer; height: 35px; }
        .sota-btn-create:hover { color: var(--text-normal); border-color: var(--text-normal); }

        /* Search Dropdown UI */
        .sota-search-container { background: var(--background-primary); border: 1px solid var(--interactive-accent); border-radius: 6px; padding: 10px; animation: fadeIn 0.2s; }
        .sota-search-input { width: 100%; border: none; border-bottom: 1px solid var(--background-modifier-border); background: transparent; padding: 5px; margin-bottom: 5px; font-size: 1em; }
        .sota-search-input:focus { box-shadow: none; border-bottom-color: var(--interactive-accent); }
        .sota-results-list { max-height: 150px; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }
        .sota-result-item { padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 0.9em; transition: background 0.1s; }
        .sota-result-item:hover, .sota-result-item.selected { background-color: var(--interactive-accent); color: var(--text-on-accent); }
        .sota-search-footer {
            margin-top: 8px;
            padding-top: 8px;
            border-top: 0.5px solid var(--background-modifier-border);
            text-align: center;
            font-size: 0.85em;
            color: var(--text-muted);
            cursor: pointer;
            transition: all 0.2s;
        }
        .sota-search-footer:hover { color: var(--interactive-accent); }
        
        .sota-footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid var(--background-modifier-border); display: flex; justify-content: flex-end; gap: 10px; }
        
        .sota-json-input-area { 
            display: flex; 
            flex-direction: column; 
            gap: 15px;
        }

        .sota-json-textarea textarea { 
            font-family: var(--font-monospace); 
            font-size: 0.85em; 
            line-height: 1.5; 
            color: var(--text-muted); 
            border: 1px solid var(--background-modifier-border); 
            padding: 15px; 
            width: 100%; 
            height: 300px; 
            border-radius: 4px;
            background-color: var(--background-primary);
        }
        
        .sota-json-textarea textarea:focus {
            color: var(--text-normal);
            border-color: var(--interactive-accent);
        }

        .sota-error-box {
            background-color: rgba(var(--color-red-rgb), 0.1);
            border: 1px solid var(--color-red);
            border-radius: 6px;
            padding: 15px;
            font-size: 0.9em;
            color: var(--text-normal);
        }
        .sota-error-actions {
            margin-top: 10px;
            display: flex;
            justify-content: flex-end;
        }

        /* ESTILOS DA STAGING VIEW (REUTILIZA MUITO DO MANUAL) */
        .sota-staging-summary {
            padding: 10px;
            background: var(--background-primary-alt);
            border-radius: 6px;
            margin-bottom: 20px;
            text-align: center;
            font-size: 0.9em;
            color: var(--text-muted);
        }

        .sota-staging-workout-card {
            /* Similar ao sota-workout-card */
            background-color: var(--background-secondary); 
            border: 1px solid var(--background-modifier-border); 
            border-radius: 8px; 
            margin-bottom: 15px; 
            overflow: hidden;
        }

        .sota-staging-workout-header {
            background-color: var(--background-primary-alt); 
            padding: 10px 15px; 
            font-weight: 700;
            color: var(--text-normal);
            border-bottom: 1px solid var(--background-modifier-border);
        }
        
        .sota-staging-workout-body {
             padding: 15px; 
             display: flex; 
             flex-direction: column; 
             gap: 8px;
        }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
    `;
    document.head.appendChild(style);

    // --- CONFIGURAÇÃO ---
    const config = {
        folder_planos: "04 - Corpo & Movimento/01 - Exercícios Físicos/02. Planos de Treino",
        folder_exercicios: "04 - Corpo & Movimento/01 - Exercícios Físicos/01. Manual/Exercícios",
        folder_grupos: "04 - Corpo & Movimento/01 - Exercícios Físicos/01. Manual/Grupos Musculares",
        template_exercicio: "99 - BACKEND/Templates/Exercicios/Exercicio_Manual_Template.md",
        logs_root: "99 - BACKEND/Logs_Metricas/Exercicios"
    };

    // --- CLASSE PRINCIPAL ---
    class PlanoManagerModal extends Modal {
        constructor(app) {
            super(app);
            this.app = app;
            this.mode = 'manual'; // manual, json, staging
            this.planData = { name: "", objective: "", workouts: [] };
            this.allExercises = [];
            this.activeSearch = { workoutIndex: -1, query: "" };
            this.jsonInput = "";
            this.parseError = null;
        }

        async onOpen() {
            this.contentEl.empty();
            this.contentEl.addClass("sota-modal-container");
            this.modalEl.style.width = "850px"; 
            this.modalEl.style.maxWidth = "95vw";
            await this.loadExercises();
            this.render();
        }

        async loadExercises() {
            // ... (Este método permanece INTACTO)
            const files = this.app.vault.getMarkdownFiles().filter(f => f.path.startsWith(config.folder_exercicios));
            this.allExercises = files.map(f => {
                const cache = this.app.metadataCache.getFileCache(f);
                const fm = cache?.frontmatter || {};
                return {
                    name: f.basename, path: f.path,
                    meta: { metric: fm.tipo_metrica || 'reps', resist: fm.tipo_resistencia || 'carga_externa' }
                };
            }).sort((a, b) => a.name.localeCompare(b.name));
        }

        onClose() { this.contentEl.empty(); }

        render() {
            const { contentEl } = this;
            contentEl.empty();
            contentEl.createDiv({ cls: "sota-header", text: "🏋️ Criar Plano de Treino" });

            const tabContainer = contentEl.createDiv({ cls: "sota-tabs" });
            this.createTabButton(tabContainer, "🖐️ Criação Manual", 'manual');
            this.createTabButton(tabContainer, "🤖 Importar JSON (AI)", 'json');
            
            if (this.mode === 'manual') this.renderManual(contentEl);
            else if (this.mode === 'json') this.renderJSON(contentEl);
            else if (this.mode === 'staging') this.renderStaging(contentEl);
        }

        createTabButton(container, text, mode) {
            // ... (Este método permanece INTACTO)
            const btn = new ButtonComponent(container).setButtonText(text).onClick(() => { this.mode = mode; this.render(); });
            btn.buttonEl.addClass("sota-tab-btn");
            if (this.mode === mode) btn.buttonEl.addClass("active");
        }

        renderManual(el) {
            // ... (Este método permanece INTACTO)
            // METADADOS
            const metaGrid = el.createDiv({ cls: "sota-meta-grid" });
            
            const wrapName = metaGrid.createDiv({ cls: "sota-input-wrapper" });
            wrapName.createDiv({ cls: "sota-label", text: "🏷️ Nome do Plano" });
            new TextComponent(wrapName).setPlaceholder("Ex: Hipertrofia PPL").setValue(this.planData.name).onChange(v => this.planData.name = v).inputEl.style.width = "100%";

            const wrapObj = metaGrid.createDiv({ cls: "sota-input-wrapper" });
            wrapObj.createDiv({ cls: "sota-label", text: "🎯 Objetivo Principal" });
            new TextComponent(wrapObj).setPlaceholder("Ex: Força, Resistência").setValue(this.planData.objective).onChange(v => this.planData.objective = v).inputEl.style.width = "100%";

            // ESTRUTURA
            el.createDiv({ cls: "sota-label", text: "Estrutura da Rotina", style: "margin-bottom: 15px;" });
            const workoutsContainer = el.createDiv();

            if (this.planData.workouts.length === 0) {
                workoutsContainer.createDiv({ text: "Lista vazia.", style: "padding: 15px; border: 1px dashed var(--background-modifier-border); border-radius: 6px; color: var(--text-faint); margin-bottom: 20px;" });
            }

            this.planData.workouts.forEach((workout, wIdx) => {
                const card = workoutsContainer.createDiv({ cls: "sota-workout-card" });

                const header = card.createDiv({ cls: "sota-workout-header" });
                const titleInput = new TextComponent(header).setValue(workout.name).setPlaceholder("Nome do Treino (ex: Treino A)").onChange(v => workout.name = v);
                titleInput.inputEl.className = "sota-workout-title-input";

                const btnDel = new ButtonComponent(header).setIcon("trash-2").onClick(() => {
                    this.planData.workouts.splice(wIdx, 1);
                    this.render();
                });
                btnDel.buttonEl.style.background = "transparent"; btnDel.buttonEl.style.boxShadow = "none"; btnDel.buttonEl.style.color = "var(--text-muted)";

                const body = card.createDiv({ cls: "sota-workout-body" });
                
                if (workout.exercises.length === 0 && this.activeSearch.workoutIndex !== wIdx) {
                    body.createDiv({ text: "Lista vazia.", style: "font-style: italic; color: var(--text-faint); font-size: 0.9em;" });
                }

                workout.exercises.forEach((ex, eIdx) => {
                    const row = body.createDiv({ cls: "sota-ex-row" });
                    
                    new TextComponent(row).setValue(ex.name).setPlaceholder("Nome").onChange(v => ex.name = v).inputEl.addClass("sota-name-input");
                    
                    const inputsDiv = row.createDiv({ cls: "sota-ex-inputs" });

                    if (ex.meta.metric === 'distancia') {
                        this.createSmallInput(inputsDiv, ex.reps, "⏱", "Tempo", (v) => ex.reps = v);
                        this.createSmallInput(inputsDiv, ex.cargaMeta, "📏", "Km", (v) => ex.cargaMeta = v);
                    } else if (ex.meta.metric === 'tempo') {
                        this.createSmallInput(inputsDiv, ex.series, "#", "Sér", (v) => ex.series = v);
                        this.createSmallInput(inputsDiv, ex.reps, "⏱", "Seg", (v) => ex.reps = v);
                    } else {
                        this.createSmallInput(inputsDiv, ex.series, "#", "Sér", (v) => ex.series = v);
                        this.createSmallInput(inputsDiv, ex.reps, "↻", "Reps", (v) => ex.reps = v);
                        
                        if (ex.meta.resist === 'peso_corporal') {
                            this.createSmallInput(inputsDiv, ex.cargaMeta || "BW", "⚖️", "Carga", (v) => ex.cargaMeta = v);
                        } else {
                            this.createSmallInput(inputsDiv, ex.cargaMeta, "⚖️", "Kg", (v) => ex.cargaMeta = v);
                        }
                    }
                    
                    this.createSmallInput(inputsDiv, ex.rest, "💤", "Rest", (v) => ex.rest = v);

                    const btnDelEx = new ButtonComponent(row).setIcon("x").onClick(() => {
                        workout.exercises.splice(eIdx, 1);
                        this.render();
                    });
                    btnDelEx.buttonEl.style.background = "transparent"; btnDelEx.buttonEl.style.boxShadow = "none"; btnDelEx.buttonEl.style.padding = "0"; btnDelEx.buttonEl.style.color = "var(--text-muted)";
                });

                if (this.activeSearch.workoutIndex === wIdx) {
                    this.renderSearchUI(body, wIdx);
                } else {
                    const actionsRow = body.createDiv({ cls: "sota-actions-row" });
                    
                    const btnAdd = actionsRow.createEl("button", { cls: "sota-btn-dashed", text: "+ Adicionar Exercício" });
                    btnAdd.onclick = () => {
                        this.activeSearch = { workoutIndex: wIdx, query: "" };
                        this.render();
                    };

                    const btnCreate = actionsRow.createEl("button", { cls: "sota-btn-create", text: "✨ Criar Exercício" });
                    btnCreate.onclick = () => {
                        new QuickExercicioCreator(this.app, async () => {
                            await this.loadExercises(); 
                            this.activeSearch = { workoutIndex: wIdx, query: "" }; 
                            this.render();
                        }).open();
                    };
                }
            });

            const btnNewW = new ButtonComponent(el).setButtonText("➕ Novo Dia de Treino").onClick(() => {
                this.planData.workouts.push({ name: `Treino ${String.fromCharCode(65 + this.planData.workouts.length)}`, exercises: [] });
                this.render();
            });
            btnNewW.buttonEl.style.width = "100%"; btnNewW.buttonEl.style.marginTop = "20px"; btnNewW.buttonEl.style.height = "40px";

            const footer = el.createDiv({ cls: "sota-footer" });
            new ButtonComponent(footer).setButtonText("Cancelar").onClick(() => this.close());
            new ButtonComponent(footer).setButtonText("💾 Salvar Plano").setCta().onClick(() => this.salvarPlano());
        }

        // --- INÍCIO DAS NOVAS FUNÇÕES ---
        renderJSON(el) {
            const container = el.createDiv({ cls: 'sota-json-input-area' });

            // Se houver um erro, mostra a caixa de erro e para
            if (this.parseError) {
                this.renderError(container);
                return;
            }

            container.createDiv({ text: "Cole o JSON gerado pela AI abaixo para iniciar a revisão.", style: "color: var(--text-muted); text-align: center; margin-bottom: 5px;" });
            
            const area = new TextAreaComponent(container);
            area.inputEl.parentNode.addClass("sota-json-textarea");
            area.setPlaceholder('{\n  "nome_plano": "Hipertrofia PPL",\n  "objetivo": "Aumento de massa muscular",\n  "rotina": [\n    {\n      "nome_treino": "Push Day",\n      "exercicios": [...] \n    }\n  ]\n}');
            area.setValue(this.jsonInput);
            area.onChange(v => this.jsonInput = v);
            
            const footer = container.createDiv({ style: "display: flex; justify-content: flex-end;" });
            new ButtonComponent(footer)
                .setButtonText("⚙️ Processar e Revisar")
                .setCta()
                .onClick(() => this.parseAndStageJSON());
        }

        parseAndStageJSON() {
            try {
                this.parseError = null;
                const cleanJson = this.jsonInput.replace(/```json/g, "").replace(/```/g, "").trim();
                if (!cleanJson) throw new Error("O campo JSON está vazio.");
                
                const json = JSON.parse(cleanJson);
                
                // Validação de estrutura
                if (!json.nome_plano || !json.objetivo || !Array.isArray(json.rotina)) {
                    throw new Error("Estrutura do JSON inválida. Faltam 'nome_plano', 'objetivo' ou 'rotina'.");
                }

                // Transformação para a estrutura interna
                this.planData.name = json.nome_plano;
                this.planData.objective = json.objetivo;
                this.planData.workouts = json.rotina.map(workoutData => {
                    const exercises = (workoutData.exercicios || []).map(exData => {
                        // Faz o matching com o exercício do vault
                        const sanitizedName = exData.nome.toLowerCase().replace(/ com /g, ' ').replace(/ /g, '_');
                        const match = this.allExercises.find(e => e.name.toLowerCase().replace(/ /g, '_').includes(sanitizedName));

                        return {
                            name: exData.nome,
                            series: exData.protocolo?.series || "3",
                            reps: exData.protocolo?.reps || "10",
                            rest: exData.protocolo?.descanso_segundos || "60",
                            cargaMeta: exData.protocolo?.carga_alvo || (match?.meta.resist === 'peso_corporal' ? 'BW' : ''),
                            meta: match ? match.meta : { metric: 'reps', resist: 'carga_externa' } // Default fallback
                        };
                    });
                    return { name: workoutData.nome_treino, exercises: exercises };
                });

                this.mode = 'staging';
                this.render();

            } catch (e) {
                this.parseError = e.message;
                this.render();
            }
        }

        renderStaging(el) {
            // Reutiliza o renderManual, pois a estrutura de dados agora é a mesma!
            // Adiciona um sumário no topo
            const numWorkouts = this.planData.workouts.length;
            const numTotalExercises = this.planData.workouts.reduce((sum, w) => sum + w.exercises.length, 0);
            
            el.createDiv({ 
                cls: 'sota-staging-summary', 
                text: `Plano "${this.planData.name}" processado. Revise os ${numWorkouts} treinos e ${numTotalExercises} exercícios antes de salvar.` 
            });
            
            this.renderManual(el);
        }
        // --- FIM DAS NOVAS FUNÇÕES ---

        renderSearchUI(container, wIdx) {
            // ... (Este método permanece INTACTO) ...
            const searchContainer = container.createDiv({ cls: "sota-search-container" });
            const searchInput = searchContainer.createEl("input", { cls: "sota-search-input", type: "text", placeholder: "Digite para pesquisar..." });
            searchInput.value = this.activeSearch.query;
            const resultsList = searchContainer.createDiv({ cls: "sota-results-list" });

            const filterAndRender = (q) => {
                resultsList.empty();
                const termo = q.toLowerCase();
                const matches = this.allExercises.filter(ex => ex.name.toLowerCase().includes(termo));
                if (matches.length === 0) {
                    resultsList.createDiv({ text: "Nenhum exercício encontrado.", style: "padding:10px; color:var(--text-faint); font-size:0.9em;" });
                } else {
                    matches.forEach(ex => {
                        const item = resultsList.createDiv({ cls: "sota-result-item", text: ex.name });
                        item.onclick = () => {
                            this.planData.workouts[wIdx].exercises.push({
                                name: ex.name,
                                series: "3",
                                reps: ex.meta.metric === 'distancia' ? "30min" : "10",
                                rest: "60",
                                meta: ex.meta,
                                cargaMeta: ""
                            });
                            this.activeSearch = { workoutIndex: -1, query: "" };
                            this.render();
                        };
                    });
                }
            };
            searchInput.oninput = (e) => { this.activeSearch.query = e.target.value; filterAndRender(this.activeSearch.query); };
            searchInput.onkeydown = (e) => { if (e.key === 'Escape') { this.activeSearch = { workoutIndex: -1, query: "" }; this.render(); } };
            filterAndRender(this.activeSearch.query);
            setTimeout(() => { searchInput.focus(); searchContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 50);

            const cancelBtn = searchContainer.createDiv({ cls: "sota-search-footer", text: "Cancelar" });
            cancelBtn.onclick = () => { this.activeSearch = { workoutIndex: -1, query: "" }; this.render(); };
        }
        
        createSmallInput(container, value, icon, placeholder, onChange) {
            // ... (Este método permanece INTACTO) ...
            const wrapper = container.createDiv({ cls: "sota-input-group sota-small-input" });
            wrapper.createSpan({ cls: "sota-input-icon", text: icon });
            new TextComponent(wrapper).setValue(value ? value.toString() : "").setPlaceholder(placeholder).onChange(onChange);
        }
        
        async salvarPlano() {
            // ... (Este método permanece INTACTO) ...
            if (!this.planData.name) return new Notice("❌ Nome obrigatório.");
            const filename = `${this.planData.name.replace(/[\\/:"*?<>|#^\[\]]+/g, '')}.md`;
            const path = `${config.folder_planos}/${filename}`;
            if (await this.app.vault.adapter.exists(path)) return new Notice("⚠️ Plano já existe.");
            let md = `---\ntipo: plano_de_treino\nobjetivo: "${this.planData.objective}"\nciclo: 1\nlocal_padrao: "Academia"\nequipamentos:\n  - "Geral"\ntags:\n  - plano_de_treino\n---\n`;
            md += `# ${this.planData.name}\n\n`;
            md += `> [!info] Criado em ${moment().format("DD/MM/YYYY")}\n\n---\n\n`;
            this.planData.workouts.forEach(w => {
                md += `### ${w.name}\n`;
                if(w.exercises.length === 0) md += `- (Vazio)\n`;
                else {
                    w.exercises.forEach(ex => {
                        let metaValor = ex.cargaMeta ? ex.cargaMeta.toString() : "";
                        let metaString = "";
                        if (metaValor) metaString = ` [${metaValor}]`;
                        else if (ex.meta.resist === 'peso_corporal') metaString = ` [BW]`;
                        if (ex.meta.metric === 'distancia') {
                            md += `- ${ex.name} @ ${ex.reps}${metaString}\n`;
                        } else if (ex.meta.metric === 'tempo') {
                            md += `- ${ex.name} @ ${ex.series}x${ex.reps}s${metaString} (${ex.rest}s)\n`;
                        } else {
                            md += `- ${ex.name} @ ${ex.series}x${ex.reps}${metaString} (${ex.rest}s)\n`;
                        }
                    });
                }
                md += `\n`;
            });
            await this.app.vault.create(path, md);
            new Notice(`✅ Plano Salvo!`);
            this.close();
            const file = this.app.vault.getAbstractFileByPath(path);
            if (file) this.app.workspace.getLeaf(true).openFile(file);
        }

        renderError(el) {
            const errorBox = el.createDiv({ cls: 'sota-error-box' });
            errorBox.createEl("p", { text: "Ocorreu um erro ao processar o JSON:", attr: { style: "font-weight: bold;" } });
            errorBox.createEl("pre", { text: this.parseError, attr: { style: "white-space: pre-wrap;" } });
            
            const actions = errorBox.createDiv({ cls: 'sota-error-actions' });
            
            new ButtonComponent(actions)
                .setButtonText("Copiar Erro para AI")
                .setIcon("copy")
                .onClick(() => {
                    const prompt = `O JSON que você forneceu está com o erro abaixo. Por favor, me devolva o JSON completo novamente, com o erro corrigido, sem adicionar nenhum comentário ou explicação fora do JSON:\n\n--- ERRO ---\n${this.parseError}\n--- JSON ORIGINAL ---\n${this.jsonInput}`;
                    navigator.clipboard.writeText(prompt);
                    new Notice("✅ Erro copiado para a área de transferência!");
                });
        }

        renderSearchUI(container, wIdx) {
            const searchContainer = container.createDiv({ cls: "sota-search-container" });
            const searchInput = searchContainer.createEl("input", { cls: "sota-search-input", type: "text", placeholder: "Digite para pesquisar..." });
            searchInput.value = this.activeSearch.query;
            
            const resultsList = searchContainer.createDiv({ cls: "sota-results-list" });

            const filterAndRender = (q) => {
                resultsList.empty();
                const termo = q.toLowerCase();
                const matches = this.allExercises.filter(ex => ex.name.toLowerCase().includes(termo));

                if (matches.length === 0) {
                    resultsList.createDiv({ text: "Nenhum exercício encontrado.", style: "padding:10px; color:var(--text-faint); font-size:0.9em;" });
                } else {
                    matches.forEach(ex => {
                        const item = resultsList.createDiv({ cls: "sota-result-item", text: ex.name });
                        item.onclick = () => {
                            // ADICIONA O EXERCÍCIO COM METADADOS
                            this.planData.workouts[wIdx].exercises.push({
                                name: ex.name,
                                series: "3",
                                reps: ex.meta.metric === 'distancia' ? "30min" : "10",
                                rest: "60",
                                meta: ex.meta, // Guarda os tipos para renderizar a UI correta
                                cargaMeta: "" // Novo campo de meta de carga/distancia
                            });
                            this.activeSearch = { workoutIndex: -1, query: "" };
                            this.render();
                        };
                    });
                }
            };

            searchInput.oninput = (e) => { this.activeSearch.query = e.target.value; filterAndRender(this.activeSearch.query); };
            searchInput.onkeydown = (e) => { if (e.key === 'Escape') { this.activeSearch = { workoutIndex: -1, query: "" }; this.render(); } };

            filterAndRender(this.activeSearch.query);
            setTimeout(() => { searchInput.focus(); searchContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 50);

            const cancelBtn = searchContainer.createDiv({ cls: "sota-search-footer", text: "Cancelar" });
            cancelBtn.onclick = () => { this.activeSearch = { workoutIndex: -1, query: "" }; this.render(); };
        }

        createSmallInput(container, value, icon, placeholder, onChange) {
            const wrapper = container.createDiv({ cls: "sota-input-group sota-small-input" });
            wrapper.createSpan({ cls: "sota-input-icon", text: icon });
            new TextComponent(wrapper).setValue(value ? value.toString() : "").setPlaceholder(placeholder).onChange(onChange);
        }

        async salvarPlano() {
            if (!this.planData.name) return new Notice("❌ Nome obrigatório.");
            
            const filename = `${this.planData.name.replace(/[\\/:"*?<>|#^\[\]]+/g, '')}.md`;
            const path = `${config.folder_planos}/${filename}`;
            
            if (await this.app.vault.adapter.exists(path)) return new Notice("⚠️ Plano já existe.");

            let md = `---
tipo: plano_de_treino
objetivo: "${this.planData.objective}"
ciclo: 1
local_padrao: "${this.planData.local}"
equipamentos:
  - "Geral"
tags:
  - plano_de_treino
---\n`;
            md += `# ${this.planData.name}\n\n`;
            md += `> [!info] Criado em ${moment().format("DD/MM/YYYY")}\n\n---\n\n`;

            this.planData.workouts.forEach(w => {
                md += `### ${w.name}\n`;
                if(w.exercises.length === 0) md += `- (Vazio)\n`;
                else {
                    w.exercises.forEach(ex => {
                        // 1. Sanitização da Meta: Remove letras, mantém apenas números e pontos
                        let metaValor = ex.cargaMeta ? ex.cargaMeta.toString() : "";
                        
                        let metaString = "";
                        if (metaValor) metaString = ` [${metaValor}]`;
                        else if (ex.meta.resist === 'peso_corporal') metaString = ` [BW]`;
                        
                        // 2. Formatação Condicional
                        if (ex.meta.metric === 'distancia') {
                            // Cardio: Corrida @ 30min [10]
                            md += `- ${ex.name} @ ${ex.reps}${metaString}\n`; // Removido #tags
                        } else if (ex.meta.metric === 'tempo') {
                            // Isométrico: Prancha @ 3x60s [BW]
                            // Nota: ex.reps aqui guarda o tempo em segundos
                            md += `- ${ex.name} @ ${ex.series}x${ex.reps}s${metaString} (${ex.rest}s)\n`;
                        } else {
                            // Força: Supino @ 3x10 [80] (60s)
                            md += `- ${ex.name} @ ${ex.series}x${ex.reps}${metaString} (${ex.rest}s)\n`;
                        }
                    });
                }
                md += `\n`;
            });

            await this.app.vault.create(path, md);
            new Notice(`✅ Plano Salvo!`);
            this.close();
            
            const file = this.app.vault.getAbstractFileByPath(path);
            if (file) this.app.workspace.getLeaf(true).openFile(file);
        }
    }

    // --- SUB-MODAL ATUALIZADO: CRIADOR RÁPIDO DE EXERCÍCIO ---
    class QuickExercicioCreator extends Modal {
        constructor(app, onCreated) {
            super(app);
            this.onCreated = onCreated;
            this.data = { nome: "", grupo: "", equipamento: "", tipoMetrica: "reps", tipoResistencia: "carga_externa" };
        }

        onOpen() {
            this.contentEl.empty();
            this.modalEl.style.width = "400px";
            
            this.contentEl.createEl("h3", { text: "✨ Criar Novo Exercício", style: "text-align: center; margin-bottom: 20px;" });
            
            // Campos Básicos
            new Setting(this.contentEl).setName("Nome").addText(t => t.setPlaceholder("Ex: Agachamento").onChange(v => this.data.nome = v).inputEl.style.width = "100%");
            
            const grupos = app.vault.getMarkdownFiles().filter(f => f.path.startsWith(config.folder_grupos)).map(f => f.basename).sort();
            new Setting(this.contentEl).setName("Grupo Muscular").addDropdown(d => {
                d.addOption("", "-- Selecione --");
                grupos.forEach(g => d.addOption(g, g));
                d.onChange(v => this.data.grupo = v);
            });

            // Campos Novos (SOTA v2.0)
            new Setting(this.contentEl).setName("Métrica").addDropdown(d => {
                d.addOption("reps", "Repetições");
                d.addOption("tempo", "Tempo (Isométrico)");
                d.addOption("distancia", "Distância (Cardio)");
                d.setValue("reps");
                d.onChange(v => this.data.tipoMetrica = v);
            });

            new Setting(this.contentEl).setName("Resistência").addDropdown(d => {
                d.addOption("carga_externa", "Carga Externa");
                d.addOption("peso_corporal", "Peso Corporal");
                d.setValue("carga_externa");
                d.onChange(v => {
                    this.data.tipoResistencia = v;
                    // TODO: Poderia re-renderizar para ocultar equipamento, mas simplificamos aqui
                });
            });

            new Setting(this.contentEl).setName("Equipamento").addText(t => t.setPlaceholder("Ex: Barra").onChange(v => this.data.equipamento = v).inputEl.style.width = "100%");

            const footer = this.contentEl.createDiv({ cls: "sota-footer" });
            new ButtonComponent(footer).setButtonText("Cancelar").onClick(() => this.close());
            new ButtonComponent(footer).setButtonText("Criar").setCta().onClick(() => this.save());
        }

        async save() {
            if (!this.data.nome || !this.data.grupo) { new Notice("Nome e Grupo são obrigatórios."); return; }
            
            const sanitize = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[-\s&]+/g, '_').replace(/[^\w_]+/g, '');
            const idEx = sanitize(this.data.nome);
            const idGr = sanitize(this.data.grupo);
            
            const pathFolder = `${config.folder_exercicios}/${this.data.grupo}`;
            if (!await app.vault.adapter.exists(pathFolder)) await app.vault.createFolder(pathFolder);
            
            const pathFile = `${pathFolder}/${this.data.nome.replace(/[\\/:"*?<>|#^\[\]]+/g, '')}.md`;
            if (await app.vault.adapter.exists(pathFile)) { new Notice("Exercício já existe!"); return; }

            const templateFile = app.vault.getAbstractFileByPath(config.template_exercicio);
            let content = templateFile ? await app.vault.read(templateFile) : "";
            content = content
                .replace(/%%NOME_EXERCICIO%%/g, this.data.nome)
                .replace(/%%ID_EXERCICIO%%/g, idEx)
                .replace(/%%GRUPO_MUSCULAR%%/g, idGr)
                .replace(/%%EQUIPAMENTO%%/g, this.data.equipamento || "Geral")
                .replace(/%%TIPO_METRICA%%/g, this.data.tipoMetrica)
                .replace(/%%TIPO_RESISTENCIA%%/g, this.data.tipoResistencia);

            await app.vault.create(pathFile, content);

            // Log Sharding
            const logGroup = `${config.logs_root}/${idGr}`;
            const logEx = `${logGroup}/${idEx}`;
            const logFile = `${logEx}/raw_logs.md`;

            if (!await app.vault.adapter.exists(logGroup)) await app.vault.createFolder(logGroup);
            if (!await app.vault.adapter.exists(logEx)) await app.vault.createFolder(logEx);
            if (!await app.vault.adapter.exists(logFile)) await app.vault.create(logFile, "");

            new Notice("Exercício criado!");
            if (this.onCreated) await this.onCreated();
            this.close();
        }
    }

    new PlanoManagerModal(app).open();
};