// SOTA - agendarTreinos.js v3.1 (Polyfill Parser)
// Matriz de agendamento de treinos com suporte total a Cardio, Isométrico e BW.

module.exports = async (params) => {
    const { app, quickAddApi: qa, obsidian } = params;
    const { Notice, Modal, Setting, ButtonComponent, TextComponent, TextAreaComponent, DropdownComponent, moment } = obsidian;

    // --- 1. ESTILOS CSS ---
    const existingStyle = document.getElementById('sota-scheduler-styles');
    if (existingStyle) existingStyle.remove();

    const style = document.createElement('style');
    style.id = 'sota-scheduler-styles';
    style.innerHTML = `
            .sota-modal { padding: 0 20px 20px 20px; }
            .sota-title { text-align: center; margin-bottom: 20px; font-size: 1.4em; font-weight: 700; color: var(--text-normal); }
            .sota-tabs { display: flex; justify-content: center; gap: 15px; margin-bottom: 25px; border-bottom: 1px solid var(--background-modifier-border); padding-bottom: 15px; }
            .sota-tab-btn { border: 1px solid var(--background-modifier-border) !important; padding: 6px 15px !important; background: transparent; color: var(--text-muted); }
            .sota-tab-btn.active { background: var(--background-modifier-border-hover) !important; color: var(--text-normal) !important; border-color: var(--text-muted) !important; }
            .sota-date-control { display: flex; justify-content: center; align-items: center; gap: 15px; background-color: var(--background-secondary); padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid var(--background-modifier-border); }
            .sota-date-input { background: var(--background-primary); border: 1px solid var(--background-modifier-border); color: var(--text-normal); padding: 5px 10px; border-radius: 4px; font-family: var(--font-interface); }
            .sota-schedule-list { display: flex; flex-direction: column; gap: 10px; max-height: 400px; overflow-y: auto; padding-right: 5px; }
            .sota-day-row { display: grid; grid-template-columns: 120px 1fr 1fr auto; gap: 10px; align-items: center; background-color: var(--background-primary); padding: 10px 15px; border-radius: 6px; border: 1px solid var(--background-modifier-border); transition: border-color 0.2s; }
            .sota-day-row:hover { border-color: var(--interactive-accent); }
            .sota-day-label { font-weight: 600; color: var(--text-muted); font-size: 0.9em; }
            .sota-day-today { color: var(--interactive-accent); font-weight: 700; }
            select.sota-dropdown {
                height: auto !important; min-height: 35px !important; padding: 8px 10px !important;
                line-height: 1.1 !important; width: 100%; background-color: var(--background-secondary);
                border: 1px solid var(--background-modifier-border); border-radius: 4px;
                color: var(--text-normal); box-sizing: border-box !important;
            }
            select.sota-dropdown:hover { border-color: var(--interactive-accent); }
            
            /* --- NOVOS ESTILOS --- */
            .sota-json-input-area { display: flex; flex-direction: column; gap: 15px; }
            .sota-json-textarea textarea { 
                font-family: 'JetBrains Mono', monospace; font-size: 0.85em; line-height: 1.5; color: var(--text-muted); 
                border: 1px solid var(--background-modifier-border); padding: 15px; width: 100%; height: 400px; border-radius: 4px;
                background-color: var(--background-primary);
            }
            .sota-json-textarea textarea:focus { color: var(--text-normal); border-color: var(--interactive-accent); }
            .sota-error-box {
                background-color: rgba(var(--color-red-rgb), 0.1); border: 1px solid var(--color-red);
                border-radius: 6px; padding: 15px; font-size: 0.9em; color: var(--text-normal);
            }
            .sota-error-actions { margin-top: 10px; display: flex; justify-content: flex-end; }
            /* --- FIM DOS NOVOS ESTILOS --- */
            
            .sota-footer { margin-top: 25px; padding-top: 15px; border-top: 1px solid var(--background-modifier-border); display: flex; justify-content: flex-end; gap: 10px; }

            /* --- ESTILOS ADICIONAIS PARA STAGING --- */
        .sota-staging-summary {
            padding: 10px; background: var(--background-primary-alt); border-radius: 6px;
            margin-bottom: 20px; text-align: center; font-size: 0.9em; color: var(--text-muted);
        }
        .sota-staging-day-card {
            background-color: var(--background-secondary); border: 1px solid var(--background-modifier-border);
            border-radius: 8px; margin-bottom: 15px;
        }
        .sota-staging-day-header {
            padding: 10px 15px; border-bottom: 1px solid var(--background-modifier-border);
            display: flex; justify-content: space-between; align-items: center;
        }
        .sota-staging-day-title { font-weight: 700; color: var(--text-normal); }
        .sota-staging-day-title.is-today { color: var(--interactive-accent); }
        .sota-staging-day-workout { font-size: 0.9em; color: var(--text-muted); }
        
        .sota-staging-ex-list { padding: 15px; display: flex; flex-direction: column; gap: 8px; }
        .sota-staging-ex-row { display: grid; grid-template-columns: 1fr auto; gap: 15px; align-items: center; }
        .sota-staging-ex-name { font-weight: 500; font-size: 0.9em; }
        .sota-staging-ex-inputs { display: flex; gap: 8px; align-items: center; }
        .sota-staging-ex-inputs input { width: 70px; text-align: center; }

        .sota-ex-fixed-text {
            color: var(--text-muted);
            font-size: 0.9em;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 32px; /* Altura do input */
            padding: 0 10px;
        }

        `;
    document.head.appendChild(style);

    // --- CONFIGURAÇÃO ---
    const config = {
        folder_planos: "04 - Corpo & Movimento/01 - Exercícios Físicos/02. Planos de Treino",
        folder_sessoes: "04 - Corpo & Movimento/01 - Exercícios Físicos/03. Sessões de Treino",
        template_sessao: "99 - BACKEND/Templates/Exercicios/Sessao_Treino_Template.md",
        exercicios_folder: "04 - Corpo & Movimento/01 - Exercícios Físicos/01. Manual/Exercícios",
        grupos_folder: "04 - Corpo & Movimento/01 - Exercícios Físicos/01. Manual/Grupos Musculares",
        template_exercicio: "99 - BACKEND/Templates/Exercicios/Exercicio_Manual_Template.md",
        default_rest: 60
    };

    class SessionSchedulerModal extends Modal {
        constructor(app) {
            super(app);
            this.mode = 'manual'; // manual, json, staging
            this.dates = { start: moment().format("YYYY-MM-DD"), end: moment().format("YYYY-MM-DD") };
            this.schedule = [];
            this.availablePlans = [];
            this.jsonInput = "";
            this.parseError = null;
        }

        async onOpen() {
            this.contentEl.empty();
            this.contentEl.addClass("sota-modal");
            this.modalEl.style.width = "900px"; 
            this.modalEl.style.maxWidth = "95vw";
            await this.loadPlans();
            this.updateScheduleDates(); // Prepara o schedule para o modo manual
            this.render();
        }

        onClose() { this.contentEl.empty(); }

        async loadPlans() {
            const files = app.vault.getMarkdownFiles().filter(f => f.path.startsWith(config.folder_planos));
            this.availablePlans = await Promise.all(files.map(async f => {
                const content = await app.vault.read(f);
                const workouts = content.split('\n')
                    .filter(l => l.trim().startsWith('### '))
                    .map(l => l.replace('### ', '').trim());
                return { name: f.basename, path: f.path, workouts: workouts };
            }));
        }

        updateScheduleDates() {
            const start = moment(this.dates.start);
            const end = moment(this.dates.end);
            const days = end.diff(start, 'days') + 1;
            const newSchedule = [];
            for (let i = 0; i < days; i++) {
                const current = start.clone().add(i, 'days');
                const dateStr = current.format("YYYY-MM-DD");
                const existing = this.schedule.find(s => s.date === dateStr);
                newSchedule.push(existing || {
                    date: dateStr,
                    displayDate: current.format("DD/MM (ddd)"),
                    isToday: current.isSame(moment(), 'day'),
                    selectedPlan: null,
                    selectedWorkout: ""
                });
            }
            this.schedule = newSchedule;
        }

        render() {
            const { contentEl } = this;
            contentEl.empty();
            contentEl.createDiv({ cls: "sota-title", text: "🗓️ Agendar Sessões de Treino" });
            const tabContainer = contentEl.createDiv({ cls: "sota-tabs" });
            this.createTabButton(tabContainer, "🖐️ Agendamento Manual", 'manual');
            this.createTabButton(tabContainer, "🤖 Importar JSON (AI)", 'json');
            
            if (this.mode === 'manual') this.renderManual(contentEl);
            else if (this.mode === 'json') this.renderJSON(contentEl);
            else if (this.mode === 'staging') this.renderStaging(contentEl);
        }

        createTabButton(container, text, mode) {
            const btn = new ButtonComponent(container).setButtonText(text).onClick(() => { this.mode = mode; this.render(); });
            btn.buttonEl.addClass("sota-tab-btn");
            if (this.mode === mode) btn.buttonEl.addClass("active");
        }

        renderManual(el) {
            // ... (Este método permanece INTACTO, apenas copiado) ...
            const dateCtrl = el.createDiv({ cls: "sota-date-control" });
            dateCtrl.createSpan({ text: "De:", style: "font-weight:600" });
            const startInput = dateCtrl.createEl("input", { type: "date", cls: "sota-date-input" });
            startInput.value = this.dates.start;
            startInput.onchange = (e) => {
                this.dates.start = e.target.value;
                if(moment(this.dates.end).isBefore(this.dates.start)) this.dates.end = this.dates.start;
                this.updateScheduleDates(); this.render();
            };
            dateCtrl.createSpan({ text: "Até:", style: "font-weight:600" });
            const endInput = dateCtrl.createEl("input", { type: "date", cls: "sota-date-input" });
            endInput.value = this.dates.end;
            endInput.onchange = (e) => {
                this.dates.end = e.target.value;
                if(moment(this.dates.end).isBefore(this.dates.start)) this.dates.start = this.dates.end;
                this.updateScheduleDates(); this.render();
            };
            new ButtonComponent(dateCtrl).setButtonText("Hoje").onClick(() => {
                const today = moment().format("YYYY-MM-DD");
                this.dates.start = today; this.dates.end = today;
                this.updateScheduleDates(); this.render();
            });

            const list = el.createDiv({ cls: "sota-schedule-list" });
            this.schedule.forEach((day, index) => {
                const row = list.createDiv({ cls: "sota-day-row" });
                const dateLabel = row.createDiv({ cls: "sota-day-label" });
                dateLabel.setText(day.displayDate);
                if (day.isToday) dateLabel.addClass("sota-day-today");

                const planContainer = row.createDiv();
                const planDropdown = new DropdownComponent(planContainer);
                planDropdown.selectEl.addClass("sota-dropdown");
                planDropdown.addOption("", "-- Selecione um Plano --");
                this.availablePlans.forEach((p, idx) => planDropdown.addOption(idx.toString(), p.name));
                if (day.selectedPlan) {
                    const planIdx = this.availablePlans.findIndex(p => p.name === day.selectedPlan.name);
                    if (planIdx >= 0) planDropdown.setValue(planIdx.toString());
                }
                planDropdown.onChange((val) => {
                    if (val === "") { day.selectedPlan = null; day.selectedWorkout = ""; } 
                    else { day.selectedPlan = this.availablePlans[parseInt(val)]; if (day.selectedPlan.workouts.length > 0) day.selectedWorkout = day.selectedPlan.workouts[0]; }
                    this.render();
                });

                const workoutContainer = row.createDiv();
                if (day.selectedPlan) {
                    const wDropdown = new DropdownComponent(workoutContainer);
                    wDropdown.selectEl.addClass("sota-dropdown");
                    day.selectedPlan.workouts.forEach(w => wDropdown.addOption(w, w));
                    wDropdown.setValue(day.selectedWorkout);
                    wDropdown.onChange(val => day.selectedWorkout = val);
                } else {
                    workoutContainer.createEl("span", { text: "-", style: "color:var(--text-faint)" });
                }

                const statusDiv = row.createDiv({ style: "text-align:right" });
                if (day.selectedPlan && day.selectedWorkout) statusDiv.createEl("span", { text: "✅ Pronto", style: "color:var(--color-green); font-size:0.8em" });
                else statusDiv.createEl("span", { text: "⭕ Pendente", style: "color:var(--text-faint); font-size:0.8em" });
            });

            const footer = el.createDiv({ cls: "sota-footer" });
            new ButtonComponent(footer).setButtonText("Cancelar").onClick(() => this.close());
            new ButtonComponent(footer).setButtonText("📅 Confirmar Agendamento").setCta().onClick(() => this.processSchedule());
        }

        // --- INÍCIO DOS NOVOS MÉTODOS ---
        renderJSON(el) {
            const container = el.createDiv({ cls: 'sota-json-input-area' });

            if (this.parseError) {
                this.renderError(container);
                return;
            }

            container.createDiv({ text: "Cole o JSON da agenda gerado pela AI. A interface de revisão permitirá ajustes antes de criar as sessões.", style: "color: var(--text-muted); text-align: center; margin-bottom: 5px;" });
            
            const area = new TextAreaComponent(container);
            area.inputEl.parentNode.addClass("sota-json-textarea");
            area.setPlaceholder('{\n  "agenda": [\n    {\n      "data": "2026-01-20",\n      "tipo_treino": "Push A",\n      "exercicios": [...] \n    }\n  ]\n}');
            area.setValue(this.jsonInput);
            area.onChange(v => this.jsonInput = v);
            
            const footer = container.createDiv({ style: "display: flex; justify-content: flex-end;" });
            new ButtonComponent(footer)
                .setButtonText("⚙️ Processar e Revisar")
                .setCta()
                .onClick(() => this.parseAndStageJSON());
        }

        renderError(container) {
            const errorBox = container.createDiv({ cls: 'sota-error-box' });
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
        
        parseAndStageJSON() {
            try {
                this.parseError = null;
                const cleanJson = this.jsonInput.replace(/```json/g, "").replace(/```/g, "").trim();
                if (!cleanJson) throw new Error("O campo JSON está vazio.");
                
                const json = JSON.parse(cleanJson);
                
                if (!json.agenda || !Array.isArray(json.agenda)) {
                    throw new Error("Estrutura do JSON inválida. A chave 'agenda' (um array) é obrigatória.");
                }

                // Transforma o JSON na estrutura 'this.schedule'
                this.schedule = json.agenda.map(diaData => {
                    // Simula a estrutura do modo manual para reutilização
                    return {
                        date: diaData.data,
                        displayDate: moment(diaData.data).format("DD/MM (ddd)"),
                        isToday: moment(diaData.data).isSame(moment(), 'day'),
                        // Pré-seleciona um plano "Plano AI" para lógica interna
                        selectedPlan: { name: "Plano AI", path: "virtual", workouts: [diaData.tipo_treino || "Treino AI"] },
                        selectedWorkout: diaData.tipo_treino || "Treino AI",
                        // Armazena os exercícios brutos para a função de criação
                        rawExercises: diaData.exercicios || []
                    };
                });
                
                this.mode = 'staging'; // Muda para a nova view de revisão
                this.render();

            } catch (e) {
                this.parseError = e.message;
                this.render(); // Re-renderiza para mostrar o erro
            }
        }
        
        renderStaging(el) {
            const numDias = this.schedule.length;
            
            // Cria um container unificado para o Sumário + Aviso
            const summaryContainer = el.createDiv({ 
                cls: 'sota-staging-summary',
                // Removemos o texto direto aqui para usar HTML interno
            });

            // Injeta o conteúdo HTML combinado
            summaryContainer.innerHTML = `
                <div style="font-size: 1.1em; font-weight: 600; margin-bottom: 8px; color: var(--text-normal);">
                    Revisão do Plano AI: ${numDias} sessões detectadas.
                </div>
                <div style="font-size: 0.85em; color: var(--color-yellow); background: rgba(var(--color-yellow-rgb), 0.1); padding: 8px; border-radius: 6px; display: inline-block; border: 1px solid rgba(var(--color-yellow-rgb), 0.3);">
                    <strong style="text-transform: uppercase;">⚠️ Validação Necessária:</strong> 
                    <span style="color: var(--text-muted);">A IA pode alucinar. Revise os itens abaixo antes de confirmar.</span>
                </div>
            `;

            const listContainer = el.createDiv({ cls: "sota-schedule-list" });

            this.schedule.forEach((day, dayIndex) => {
                const dayCard = listContainer.createDiv({ cls: 'sota-staging-day-card' });
                
                const dayHeader = dayCard.createDiv({ cls: 'sota-staging-day-header' });
                const titleDiv = dayHeader.createDiv();
                const dayTitle = titleDiv.createSpan({ cls: 'sota-staging-day-title', text: day.displayDate });
                if(day.isToday) dayTitle.addClass('is-today');
                titleDiv.createDiv({ cls: 'sota-staging-day-workout', text: day.selectedWorkout });

                new ButtonComponent(dayHeader).setIcon("trash-2").setTooltip("Remover dia").onClick(() => {
                    this.schedule.splice(dayIndex, 1);
                    this.render();
                });

                const exList = dayCard.createDiv({ cls: 'sota-staging-ex-list' });

                (day.rawExercises || []).forEach((ex, exIndex) => {
                    const exRow = exList.createDiv({ cls: 'sota-staging-ex-row' });
                    
                    new TextComponent(exRow)
                        .setValue(ex.nome)
                        .onChange(v => ex.nome = v).inputEl.style.fontWeight = '500';
                    
                    const inputsDiv = exRow.createDiv({ cls: 'sota-staging-ex-inputs' });
                    
                    const proto = ex.protocolo || {};
                    const tipoExec = proto.tipo_execucao || "reps";

                    // Helper para garantir String e evitar crash com nulos
                    const toStr = (val, def) => (val !== undefined && val !== null) ? String(val) : def;

                    if (tipoExec === 'distancia' || tipoExec === 'tempo_continuo') {
                        // CARDIO
                        inputsDiv.createDiv({ cls: 'sota-ex-fixed-text', text: '1 Série' });
                        
                        new TextComponent(inputsDiv)
                            .setValue(toStr(proto.reps, "30min"))
                            .setPlaceholder("Tempo")
                            .onChange(v => proto.reps = v)
                            .inputEl.style.width = "80px";
                            
                        new TextComponent(inputsDiv)
                            .setValue(toStr(proto.carga_alvo, "5km"))
                            .setPlaceholder("Dist")
                            .onChange(v => proto.carga_alvo = v)
                            .inputEl.style.width = "80px";
                            
                        inputsDiv.createDiv({ cls: 'sota-ex-fixed-text', text: 'Sem Pausa' });

                    } else if (tipoExec === 'tempo') {
                        // ISOMÉTRICO
                        new TextComponent(inputsDiv)
                            .setValue(toStr(proto.series, "3"))
                            .setPlaceholder("Sér")
                            .onChange(v => proto.series = v)
                            .inputEl.style.width = "50px";
                        inputsDiv.createSpan({text: "x"});
                        
                        new TextComponent(inputsDiv)
                            .setValue(toStr(proto.reps, "45s"))
                            .setPlaceholder("Tempo")
                            .onChange(v => proto.reps = v)
                            .inputEl.style.width = "70px";
                            
                        new TextComponent(inputsDiv)
                            .setValue(toStr(proto.carga_alvo, "BW"))
                            .setPlaceholder("Carga")
                            .onChange(v => proto.carga_alvo = v)
                            .inputEl.style.width = "80px";
                            
                        new TextComponent(inputsDiv)
                            .setValue(toStr(proto.descanso_segundos, "60"))
                            .setPlaceholder("Seg")
                            .onChange(v => proto.descanso_segundos = v)
                            .inputEl.style.width = "60px";
                        inputsDiv.createSpan({text: "s"});
                        
                    } else {
                        // FORÇA (PADRÃO)
                        new TextComponent(inputsDiv)
                            .setValue(toStr(proto.series, "3"))
                            .setPlaceholder("Sér")
                            .onChange(v => proto.series = v)
                            .inputEl.style.width = "50px";
                        inputsDiv.createSpan({text: "x"});
                        
                        new TextComponent(inputsDiv)
                            .setValue(toStr(proto.reps, "10"))
                            .setPlaceholder("Reps")
                            .onChange(v => proto.reps = v)
                            .inputEl.style.width = "70px";
                            
                        new TextComponent(inputsDiv)
                            .setValue(toStr(proto.carga_alvo, "BW"))
                            .setPlaceholder("Carga")
                            .onChange(v => proto.carga_alvo = v)
                            .inputEl.style.width = "80px";
                            
                        new TextComponent(inputsDiv)
                            .setValue(toStr(proto.descanso_segundos, "60"))
                            .setPlaceholder("Seg")
                            .onChange(v => proto.descanso_segundos = v)
                            .inputEl.style.width = "60px";
                        inputsDiv.createSpan({text: "s"});
                    }
                    
                    new ButtonComponent(inputsDiv).setIcon("x").setTooltip("Remover").onClick(() => {
                        day.rawExercises.splice(exIndex, 1);
                        this.render();
                    });
                });
            });

            const footer = el.createDiv({ cls: "sota-footer" });
            new ButtonComponent(footer).setButtonText("Voltar").onClick(() => { this.mode = 'json'; this.render(); });
            new ButtonComponent(footer).setButtonText(`📅 Agendar ${numDias} Sessões`).setCta().onClick(() => this.processSchedule());
        }

        async processSchedule() {
            if (this.mode === 'staging') {
                await this.processScheduleFromAI();
            } else {
                await this.processScheduleFromManual();
            }
        }
        
        async processScheduleFromManual() {
            const daysToProcess = this.schedule.filter(s => s.selectedPlan && s.selectedWorkout);
            if (daysToProcess.length === 0) { new Notice("⚠️ Nenhum treino configurado na matriz."); return; }
            new Notice(`🔄 Processando ${daysToProcess.length} sessões...`);
            for (const day of daysToProcess) {
                await this.createSessionFromPlan(day.date, day.selectedPlan, day.selectedWorkout);
            }
            new Notice(`✅ ${daysToProcess.length} sessões agendadas com sucesso!`);
            this.close();
        }
        
        async processScheduleFromAI() {
             const daysToProcess = this.schedule.filter(s => s.rawExercises && s.rawExercises.length > 0);
             if (daysToProcess.length === 0) { new Notice("⚠️ Nenhum treino válido na agenda da AI."); return; }
             new Notice(`🔄 Processando ${daysToProcess.length} sessões da AI...`);
             for (const day of daysToProcess) {
                await this.createSessionFromAI(day);
             }
             new Notice(`✅ ${daysToProcess.length} sessões agendadas com sucesso!`);
             this.close();
        }

        async createSessionFromPlan(dateStr, planObj, workoutName) {
            const planFile = app.vault.getAbstractFileByPath(planObj.path);
            const planContent = await app.vault.read(planFile);
            const lines = planContent.split('\n');
            let capture = false;
            let exercisesList = [];
            
            for (let line of lines) {
                if (line.trim() === `### ${workoutName}`) { capture = true; continue; }
                if (capture) {
                    if (line.trim().startsWith('### ') || line.trim().startsWith('---')) break;
                    if (line.trim().startsWith('- ')) exercisesList.push(line.trim());
                }
            }

            let tasksBlock = `### 🏋️‍♂️ ${workoutName} (${moment().format("HH:mm")})\n`;
            
            const allExFiles = app.vault.getMarkdownFiles().filter(f => f.path.startsWith(config.exercicios_folder));
            const exMap = {};
            allExFiles.forEach(f => {
                exMap[this.sanitizar(f.basename)] = { path: f.path, group: this.sanitizar(f.parent.name) };
            });

            for (let line of exercisesList) {
                // Regex Polimórfico (Suporta Cardio e Força)
                // - Nome @ Params [Meta] (Descanso)
                // Cardio: - Corrida @ 30min [10]
                // Força: - Supino @ 3x10 [80] (60s)
                
                // Tenta capturar as partes
                const nomeMatch = line.match(/- (.*?) @/);
                const paramsMatch = line.match(/@ (.*?)( \[|$)/); // Pega tudo entre @ e [ ou fim
                const metaMatch = line.match(/\[(.*?)\]/);
                const restMatch = line.match(/\((.*?)s\)/);

                if (nomeMatch && paramsMatch) {
                    const nome = nomeMatch[1].trim();
                    let params = paramsMatch[1].trim();
                    const meta = metaMatch ? `[${metaMatch[1]}]` : "";
                    const rest = restMatch ? `(${restMatch[1]}s)` : "";
                    
                    const id = this.sanitizar(nome);
                    const exData = exMap[id];
                    const link = exData ? `[[${exData.path}|${nome}]]` : nome;
                    const grupo = exData ? exData.group : "geral"; 

                    tasksBlock += `#### ${link}\n`;

                    // Lógica de Geração de Séries
                    if (params.includes("x")) {
                        // É Força (SxR): 3x10
                        const [series, reps] = params.split("x");
                        for(let i=1; i<=parseInt(series); i++) {
                            tasksBlock += `- [ ] Série ${i} @ ${reps} reps ${rest} ${meta} #exercicio/${grupo}/${id}/serie_${i}\n`;
                        }
                    } else {
                        // É Cardio/Tempo (Sem Séries): 30min
                        // Gera apenas 1 tarefa
                        tasksBlock += `- [ ] Treino @ ${params} ${meta} #exercicio/${grupo}/${id}/treino\n`;
                    }
                    tasksBlock += `\n`;
                } else {
                    tasksBlock += `${line}\n`;
                }
            }

            await this.writeSessionFile(dateStr, tasksBlock, planObj.name);
        }

        async processJSONInjection() {
            try {
                const cleanJson = this.jsonInput.replace(/```json/g, "").replace(/```/g, "").trim();
                const json = JSON.parse(cleanJson);
                if (!json.agenda) throw new Error("Sem agenda no JSON");
                let count = 0;
                for (const dia of json.agenda) { await this.createSessionFromAI(dia); count++; }
                new Notice(`✅ ${count} sessões criadas via AI!`);
                this.close();
            } catch (e) { console.error(e); new Notice("❌ Erro ao processar JSON. Verifique o console."); }
        }

        async createSessionFromAI(day) {
            const dataAlvo = moment(day.date);
            const hoje = moment();
            if (dataAlvo.isBefore(hoje, 'day')) return;

            let blocoTreino = `### 🏋️‍♂️ ${day.selectedWorkout || "Treino AI"}\n`;

            for (const ex of day.rawExercises) {
                const fileInfo = await this.garantirExercicio(ex);
                const link = `[[${fileInfo.path}|${ex.nome}]]`;
                blocoTreino += `#### ${link}\n`;
                if (ex.nota_tatica) blocoTreino += `> *${ex.nota_tatica}*\n`;

                const series = ex.protocolo.series || 3;
                const reps = ex.protocolo.reps || "10";
                const descanso = ex.protocolo.descanso_segundos || config.default_rest;
                const tipoExec = ex.protocolo.tipo_execucao || "reps";
                
                let cargaMeta = "";
                if (ex.protocolo.carga_alvo && ex.protocolo.carga_alvo !== "Peso Corporal") {
                    cargaMeta = ` [${ex.protocolo.carga_alvo}]`; 
                } else if (ex.protocolo.carga_alvo === "Peso Corporal") {
                    cargaMeta = ` [BW]`;
                }

                if (tipoExec === "distancia" || tipoExec === "tempo_continuo") {
                    const parametro = ex.protocolo.reps;
                    const tag = `#exercicio/${fileInfo.group}/${fileInfo.id}/treino`;
                    blocoTreino += `- [ ] ${ex.nome} @ ${parametro}${cargaMeta} ${tag}\n`;
                } else {
                    for (let i = 1; i <= series; i++) {
                        const tag = `#exercicio/${fileInfo.group}/${fileInfo.id}/serie_${i}`;
                        let taskString = "";
                        if (tipoExec === "tempo") {
                            const duracao = ex.protocolo.reps; 
                            taskString = `- [ ] Série ${i} @ ${duracao} (${descanso}s)${cargaMeta} ${tag}\n`;
                        } else {
                            taskString = `- [ ] Série ${i} @ ${reps} reps (${descanso}s)${cargaMeta} ${tag}\n`;
                        }
                        blocoTreino += taskString;
                    }
                }
                blocoTreino += "\n";
            }
            await this.writeSessionFile(day.date, blocoTreino, "Plano AI");
        }

        async writeSessionFile(dateStr, contentBlock, planName) {
            const date = moment(dateStr);
            const folderPath = `${config.folder_sessoes}/${date.format("YYYY")}/${date.format("MM")}`;
            if (!await app.vault.adapter.exists(folderPath)) await app.vault.createFolder(folderPath);
            const filePath = `${folderPath}/${dateStr}.md`;
            const file = app.vault.getAbstractFileByPath(filePath);
            if (file) { await app.vault.append(file, `\n\n---\n${contentBlock}`); } 
            else {
                const templateFile = app.vault.getAbstractFileByPath(config.template_sessao);
                let template = await app.vault.read(templateFile);
                let final = template.replaceAll("%%DATA%%", dateStr).replace("%%PLANO_LINK%%", planName).replace("<!-- INSERIR_TREINOS_AQUI -->", contentBlock);
                await app.vault.create(filePath, final);
            }
        }

        async garantirExercicio(exData) {
            const id = this.sanitizar(exData.nome);
            const allFiles = app.vault.getMarkdownFiles().filter(f => f.path.startsWith(config.exercicios_folder));
            const existe = allFiles.find(f => this.sanitizar(f.basename) === id);
            
            if (existe) return { id, path: existe.path, group: this.sanitizar(existe.parent.name) };

            // Se chegou aqui, é um exercício novo
            
            // --- INÍCIO DA CORREÇÃO ---
            let pastaAlvo = config.exercicios_folder;
            const grupo = exData.metadados?.grupo_muscular || "Geral";
            
            const exerciciosRoot = app.vault.getAbstractFileByPath(config.exercicios_folder);
            if(exerciciosRoot && exerciciosRoot.children) {
                const foundFolder = exerciciosRoot.children.find(f => !f.extension && f.name.toLowerCase().includes(grupo.toLowerCase()));
                if(foundFolder) pastaAlvo = foundFolder.path;
            }

            const tplFile = app.vault.getAbstractFileByPath(config.template_exercicio);
            let content = await app.vault.read(tplFile);

            // Determina os tipos com base no protocolo do JSON
            let tipoMetrica = 'reps';
            if (exData.protocolo?.tipo_execucao === 'distancia') tipoMetrica = 'distancia';
            else if (exData.protocolo?.tipo_execucao === 'tempo') tipoMetrica = 'tempo';

            let tipoResistencia = 'carga_externa';
            if (exData.protocolo?.carga_alvo === 'Peso Corporal') tipoResistencia = 'peso_corporal';
            // --- FIM DA CORREÇÃO ---
            
            content = content
                .replace(/%%NOME_EXERCICIO%%/g, exData.nome)
                .replace(/%%ID_EXERCICIO%%/g, id)
                .replace(/%%GRUPO_MUSCULAR%%/g, this.sanitizar(grupo))
                .replace(/%%EQUIPAMENTO%%/g, exData.metadados?.equipamento || "Geral")
                // --- INÍCIO DA CORREÇÃO ---
                .replace(/%%TIPO_METRICA%%/g, tipoMetrica)
                .replace(/%%TIPO_RESISTENCIA%%/g, tipoResistencia);
                // --- FIM DA CORREÇÃO ---

            const newPath = `${pastaAlvo}/${exData.nome.replace(/[\\/:"*?<>|#^\[\]]+/g, '')}.md`;
            await app.vault.create(newPath, content);
            return { id, path: newPath, group: this.sanitizar(grupo) };
        }

        sanitizar(str) {
            return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[-\s]+/g, '_').replace(/[^\w_]+/g, '');
        }
    }

    new SessionSchedulerModal(app).open();
};