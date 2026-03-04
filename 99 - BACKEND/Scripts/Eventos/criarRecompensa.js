// SOTA - criarRecompensa.js v3.0 (Rich UI & Smart Linking)
// Modal interativo para criação de recompensas (Quests) vinculadas a tarefas.

module.exports = async (params) => {
    const { app, obsidian } = params;
    const { Notice, Modal, Setting, ButtonComponent, TextComponent, TFile } = obsidian;

    // --- CONFIGURAÇÃO ---
    const config = {
        recompensasPath: "99 - BACKEND/Recompensas",
        templatePath: "99 - BACKEND/Templates/Habitos/Recompensa_Template.md"
    };

    const gerarUID = () => `sota-${Math.random().toString(36).substring(2, 9)}${Date.now().toString(36).slice(-4)}`;

    // --- 1. ESTILOS CSS ---
    const styleId = 'sota-quest-creator-styles';
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) existingStyle.remove();

    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
        .sota-modal-container { padding: 0 20px 20px 20px; }
        .sota-header { text-align: center; margin-bottom: 25px; font-size: 1.5em; font-weight: 700; color: var(--text-normal); }
        .sota-input-wrapper { margin-bottom: 20px; }
        .sota-label { font-size: 0.85em; font-weight: 600; color: var(--text-muted); text-transform: uppercase; margin-bottom: 5px; display: block; }
        .sota-input { width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--background-modifier-border); background: var(--background-primary); }
        .sota-task-list { max-height: 300px; overflow-y: auto; border: 1px solid var(--background-modifier-border); border-radius: 6px; background: var(--background-primary); padding: 10px; display: flex; flex-direction: column; gap: 4px; }
        .sota-task-item { display: flex; align-items: flex-start; gap: 10px; padding: 8px; border-radius: 4px; cursor: pointer; transition: background 0.2s; }
        .sota-task-item:hover { background: var(--background-modifier-hover); }
        .sota-task-item.selected { background: rgba(var(--interactive-accent-rgb), 0.15); border: 1px solid var(--interactive-accent); }
        .sota-task-text { font-size: 0.9em; line-height: 1.4; color: var(--text-normal); }
        .sota-checkbox { flex-shrink: 0; margin-top: 3px; }
        .sota-footer { margin-top: 25px; padding-top: 15px; border-top: 1px solid var(--background-modifier-border); display: flex; justify-content: flex-end; gap: 10px; }
        .sota-empty-msg { text-align: center; color: var(--text-muted); padding: 20px; font-style: italic; }
    `;
    document.head.appendChild(style);

    // --- 2. CLASSE DO MODAL ---
    class QuestCreatorModal extends Modal {
        constructor(app, activeFile, hubUid) {
            super(app);
            this.app = app;
            this.activeFile = activeFile;
            this.hubUid = hubUid;
            this.questName = "";
            this.tasks = []; // Array de objetos { originalTask, cleanText, selected, line }
        }

        async onOpen() {
            this.contentEl.empty();
            this.contentEl.addClass("sota-modal-container");
            this.modalEl.style.width = "600px";

            await this.loadTasks();
            this.render();
        }

        async loadTasks() {
            const dv = this.app.plugins.plugins.dataview?.api;
            if (!dv) return;

            const page = dv.page(this.activeFile.path);
            if (!page || !page.file.tasks) return;

            // Filtra tarefas não concluídas
            const rawTasks = page.file.tasks.where(t => !t.completed);

            this.tasks = rawTasks.map(t => {
                // Limpeza visual do texto
                const cleanText = t.text
                    .replace(/\[🍅::.*?\]/g, '')     // Remove contador
                    .replace(/#\S+/g, '')             // Remove tags
                    .replace(/\^([a-zA-Z0-9-]+)$/, '') // Remove Block ID (apenas no final)
                    .replace(/\*\*/g, '')             // Remove negrito
                    .trim();

                return {
                    originalTask: t,
                    cleanText: cleanText,
                    selected: false,
                    line: t.line
                };
            });
        }

        render() {
            const { contentEl } = this;
            contentEl.empty();

            contentEl.createDiv({ cls: "sota-header", text: "🎁 Criar Recompensa" });

            // 1. Nome da Recompensa
            const nameWrapper = contentEl.createDiv({ cls: "sota-input-wrapper" });
            nameWrapper.createSpan({ cls: "sota-label", text: "Nome da Recompensa" });
            const nameInput = new TextComponent(nameWrapper);
            nameInput.inputEl.addClass("sota-input");
            nameInput.setPlaceholder("Ex: Comprar Jogo X, Jantar Especial...").onChange(v => this.questName = v);
            setTimeout(() => nameInput.inputEl.focus(), 50);

            // 2. Lista de Tarefas (Seleção)
            const listWrapper = contentEl.createDiv({ cls: "sota-input-wrapper" });
            listWrapper.createSpan({ cls: "sota-label", text: "Vincular Tarefas (Pré-requisitos)" });
            
            const listContainer = listWrapper.createDiv({ cls: "sota-task-list" });

            if (this.tasks.length === 0) {
                listContainer.createDiv({ cls: "sota-empty-msg", text: "Nenhuma tarefa pendente nesta nota." });
            } else {
                this.tasks.forEach((taskObj, index) => {
                    const item = listContainer.createDiv({ cls: `sota-task-item ${taskObj.selected ? 'selected' : ''}` });
                    
                    // Checkbox visual (não funcional nativamente, controlado pelo click do item)
                    const checkbox = item.createEl("input", { type: "checkbox", cls: "sota-checkbox" });
                    checkbox.checked = taskObj.selected;
                    
                    // Texto
                    item.createDiv({ cls: "sota-task-text", text: taskObj.cleanText || "Tarefa sem texto" });

                    // Evento de Click
                    item.onclick = () => {
                        taskObj.selected = !taskObj.selected;
                        checkbox.checked = taskObj.selected;
                        item.classList.toggle("selected", taskObj.selected);
                    };
                });
            }

            // 3. Footer
            const footer = contentEl.createDiv({ cls: "sota-footer" });
            new ButtonComponent(footer).setButtonText("Cancelar").onClick(() => this.close());
            new ButtonComponent(footer).setButtonText("Criar Quest").setCta().onClick(() => this.save());
        }

        async save() {
            if (!this.questName) { new Notice("⚠️ Defina um nome para a recompensa."); return; }
            
            const selectedTasks = this.tasks.filter(t => t.selected);
            if (selectedTasks.length === 0) { new Notice("⚠️ Selecione pelo menos uma tarefa."); return; }

            new Notice("⚙️ Vinculando tarefas...");

            // --- LÓGICA DE ID ROBUSTA ---
            const fileContent = await this.app.vault.read(this.activeFile);
            const lines = fileContent.split('\n');
            const tarefasProcessadas = [];
            let fileModified = false;

            for (const tObj of selectedTasks) {
                const lineIndex = tObj.line;
                let lineText = lines[lineIndex];
                
                // Tenta extrair ID existente
                // Regex procura ^id no final da linha
                const idMatch = lineText.match(/\^([a-zA-Z0-9-]+)$/);
                let blockId = idMatch ? idMatch[1] : null;

                // Se não tem ID, cria e adiciona
                if (!blockId) {
                    blockId = Math.random().toString(36).substring(2, 8);
                    // Remove espaços finais e adiciona o ID
                    lines[lineIndex] = lineText.trimEnd() + ` ^${blockId}`;
                    fileModified = true;
                }

                tarefasProcessadas.push({ hub_uid: this.hubUid, block_id: blockId });
            }

            // Salva alterações na nota original se houver novos IDs
            if (fileModified) {
                await this.app.vault.modify(this.activeFile, lines.join('\n'));
                // Pequeno delay para garantir que o cache atualize se necessário (embora usemos os dados em memória)
                await new Promise(r => setTimeout(r, 200)); 
            }

            // --- CRIAÇÃO DO ARQUIVO DE RECOMPENSA ---
            const tarefasYaml = tarefasProcessadas.map(obj => 
                `  - hub_uid: ${obj.hub_uid}\n    block_id: ${obj.block_id}`
            ).join('\n');

            const uid = gerarUID();
            const safeName = this.questName.replace(/[\\/:"*?<>|#^\[\]]+/g, '').trim();
            const fileName = `${safeName}.md`;
            const filePath = `${config.recompensasPath}/${fileName}`;

            if (await this.app.vault.adapter.exists(filePath)) {
                new Notice("❌ Já existe uma recompensa com este nome.");
                return;
            }

            const tplFile = this.app.vault.getAbstractFileByPath(config.templatePath);
            if (!tplFile) { new Notice("❌ Template não encontrado."); return; }
            
            let tplContent = await this.app.vault.read(tplFile);
            const finalContent = tplContent
                .replace(/%%UID%%/g, uid)
                .replace(/%%NOME_RECOMPENSA%%/g, this.questName)
                .replace(/%%DATA_CRIACAO%%/g, new Date().toISOString().slice(0, 10))
                .replace(/%%TAREFAS_NECESSARIAS%%/g, `\n${tarefasYaml}`);

            await this.app.vault.create(filePath, finalContent);
            
            new Notice(`✅ Quest "${this.questName}" criada!`);
            this.close();
            
            // Refresh visual
            setTimeout(() => this.app.workspace.trigger("dataview:refresh-views"), 500);
        }

        onClose() {
            this.contentEl.empty();
        }
    }

    // --- 3. INICIALIZAÇÃO ---
    const activeFile = app.workspace.getActiveFile();
    if (!activeFile) { new Notice("❌ Nenhuma nota ativa."); return; }

    const dv = app.plugins.plugins.dataview?.api;
    if (!dv) { new Notice("❌ Dataview inativo."); return; }

    // Validação de Contexto (HUB)
    const page = dv.page(activeFile.path);
    // Tenta pegar o UID, se não tiver, usa o caminho do arquivo como identificador único
    // Isso permite criar recompensas de qualquer nota (ex: Daily Note)
    const hubUid = page?.sota_uid || page?.hub_uid || activeFile.path;

    new QuestCreatorModal(app, activeFile, hubUid).open();
};