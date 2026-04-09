import { App, Modal, Setting, Notice, ButtonComponent } from 'obsidian';

// Interface Simplificada: Apenas o Essencial
export interface TaskInfo {
    name: string;
    difficulty: string;
    expectedSessions: number;
    soberania: 'interna' | 'externa';
}

export class CreateTaskModal extends Modal {
    onSubmit: (result: TaskInfo[]) => void;
    
    private taskQueue: TaskInfo[] = [];
    private currentTask!: TaskInfo;
    private queueContainerEl!: HTMLElement;
    // MODIFICADO: Agora aceita string ou null
    private lockedSoberania: string | null; 

    // MODIFICADO: Construtor atualizado
    constructor(app: App, lockedSoberania: string | null, onSubmit: (result: TaskInfo[]) => void) {
        super(app);
        this.lockedSoberania = lockedSoberania; 
        this.onSubmit = onSubmit;
        this.resetCurrentTask();
    }

    private resetCurrentTask() {
        this.currentTask = {
            name: '',
            difficulty: 'facil',
            expectedSessions: 1,
            // MODIFICADO: Se houver valor travado, usa ele. Se não, padrão é 'interna'
            soberania: (this.lockedSoberania as 'interna' | 'externa') || 'interna',
        };
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('sota-create-task-modal'); // Classe para CSS se necessário

        contentEl.createEl("h2", { text: "Criar Tarefa" });

        // --- 1. CAMPO DE NOME (FOCO PRINCIPAL) ---
        const nameContainer = contentEl.createDiv();
        const nameSetting = new Setting(nameContainer)
            .setName("O que precisa ser feito?")
            .addText((text) => {
                text.setPlaceholder("Digite o nome da tarefa e aperte Enter")
                text.setValue(this.currentTask.name);
                text.onChange((value) => {
                    this.currentTask.name = value;
                });
                text.inputEl.style.width = "100%";
                text.inputEl.addClass('sota-main-input');
                
                // Atalho de Enter para adicionar à fila rapidamente
                text.inputEl.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.addTaskToQueue();
                    }
                });
            });

        // Estilização inline para garantir layout limpo
        this.styleSetting(nameSetting);
        contentEl.createDiv({ attr: { style: "height: 15px;" } });

        // --- 2. GRID DE CONFIGURAÇÕES (XP E POMODOROS) ---
        const gridContainer = contentEl.createDiv();
        gridContainer.style.display = "grid";
        gridContainer.style.gridTemplateColumns = "1fr 1fr 1fr";
        gridContainer.style.gap = "15px";
        gridContainer.style.marginBottom = "15px";

        // XP
        const col1 = gridContainer.createDiv();
        const xpSetting = new Setting(col1)
            .setName("⚡ Dificuldade")
            .addDropdown((dropdown) => {
                dropdown
                    .addOption('trivial', '👌 Trivial (5 XP)')
                    .addOption('facil', '👍 Fácil (15 XP)')
                    .addOption('moderado', '💪 Moderado (40 XP)')
                    .addOption('desafiador', '🔥 Desafiador (80 XP)')
                    .addOption('hardcore', '🏆 Hardcore (150 XP)')
                    .setValue(this.currentTask.difficulty)
                    .onChange((value) => this.currentTask.difficulty = value);
                dropdown.selectEl.style.width = "100%";
            });
        this.styleSetting(xpSetting, true);

        // Pomodoros
        const col2 = gridContainer.createDiv();
        const pomSetting = new Setting(col2)
            .setName("🍅 Sessões")
            .addText((text) => {
                text.inputEl.type = 'number';
                text.inputEl.style.width = "100%";
                text.setValue(this.currentTask.expectedSessions.toString());
                text.onChange((value) => {
                    const num = parseInt(value);
                    this.currentTask.expectedSessions = isNaN(num) || num < 0 ? 0 : num;
                });
            });
        this.styleSetting(pomSetting, true);

        const col3 = gridContainer.createDiv();
        const sobSetting = new Setting(col3)
            .setName("🌍 Tipo")
            .addDropdown((dropdown) => {
                dropdown
                    .addOption('interna', '👑 Interna')
                    .addOption('externa', '💼 Externa')
                    .setValue(this.currentTask.soberania)
                    .onChange((value) => this.currentTask.soberania = value as 'interna' | 'externa');
                
                dropdown.selectEl.style.width = "100%";

                // --- MODIFICADO: LÓGICA DE BLOQUEIO INTELIGENTE ---
                if (this.lockedSoberania) {
                    // Trava o valor recebido do TaskInjector (pode ser 'externa' ou 'interna')
                    dropdown.setValue(this.lockedSoberania);
                    dropdown.setDisabled(true);

                    // Estilização "Cinza Escuro / Bloqueado"
                    dropdown.selectEl.style.backgroundColor = "rgba(30, 30, 30, 0.5)";
                    dropdown.selectEl.style.color = "var(--text-muted)";
                    dropdown.selectEl.style.cursor = "not-allowed";
                    dropdown.selectEl.style.opacity = "0.6";
                    dropdown.selectEl.style.borderStyle = "dashed";
                    dropdown.selectEl.title = `Contexto travado pelo HUB (${this.lockedSoberania.toUpperCase()})`;
                }
            });
        this.styleSetting(sobSetting, true);

        // --- 3. BOTÃO DE ADICIONAR À FILA ---
        const btnContainer = contentEl.createDiv();
        btnContainer.style.display = "flex";
        btnContainer.style.justifyContent = "flex-end";
        
        new ButtonComponent(btnContainer)
            .setButtonText("Adicionar à Fila (+)")
            .setCta() // Call to Action (Azul/Accent)
            .onClick(() => this.addTaskToQueue())
            .buttonEl.style.width = "100%";

        contentEl.createEl("hr", { attr: { style: "margin: 20px 0; border-color: var(--background-modifier-border);" } });

        // --- 4. ÁREA DA FILA (VISUALIZAÇÃO) ---
        contentEl.createEl("h4", { text: "Fila de Injeção", attr: { style: "margin: 0 0 10px 0; font-size: 0.9em; color: var(--text-muted);" } });
        
        this.queueContainerEl = contentEl.createDiv();
        this.queueContainerEl.style.maxHeight = "150px";
        this.queueContainerEl.style.overflowY = "auto";
        this.queueContainerEl.style.marginBottom = "20px";
        
        this.renderQueue();

        // --- 5. RODAPÉ (AÇÕES FINAIS) ---
        const footer = contentEl.createDiv();
        footer.style.display = 'flex';
        footer.style.justifyContent = 'flex-end';
        footer.style.gap = '10px';

        new ButtonComponent(footer)
            .setButtonText("Cancelar")
            .onClick(() => this.close());

        new ButtonComponent(footer)
            .setButtonText("Concluir e Inserir")
            .setCta()
            .onClick(() => this.submitAll());
        
        // Foco inicial no campo de nome
        setTimeout(() => {
            const input = this.contentEl.querySelector('.sota-main-input') as HTMLInputElement;
            input?.focus();
        }, 50);
    }

    private styleSetting(setting: Setting, isGridItem: boolean = false) {
        setting.settingEl.style.display = "block";
        setting.settingEl.style.borderTop = "none";
        setting.settingEl.style.padding = "0";
        setting.settingEl.style.marginBottom = isGridItem ? "5px" : "0";
        
        // Ajuste fino da label
        setting.infoEl.style.marginBottom = "5px";
        if (isGridItem) {
            setting.infoEl.style.fontSize = "0.8em";
            setting.infoEl.style.fontWeight = "600";
            setting.infoEl.style.color = "var(--text-muted)";
        }
        
        setting.controlEl.style.width = "100%";
        setting.controlEl.style.justifyContent = "flex-start";
    }

    private addTaskToQueue() {
        if (!this.currentTask.name.trim()) {
            new Notice("O nome da tarefa não pode ser vazio.");
            return;
        }

        // Adiciona cópia do objeto atual à fila
        this.taskQueue.push({ ...this.currentTask });
        
        // Reseta apenas o nome para permitir inserção rápida sequencial
        this.currentTask.name = "";
        
        // Re-renderiza a fila e foca no input novamente
        this.renderQueue();
        
        const nameInput = this.contentEl.querySelector('.sota-main-input') as HTMLInputElement;
        if (nameInput) {
            nameInput.value = "";
            nameInput.focus();
        }
    }

    private removeTaskFromQueue(index: number) {
        this.taskQueue.splice(index, 1);
        this.renderQueue();
    }

    private renderQueue() {
        this.queueContainerEl.empty();
        
        if (this.taskQueue.length === 0) {
            this.queueContainerEl.createDiv({ 
                text: "Nenhuma tarefa na fila.", 
                attr: { style: "color: var(--text-muted); font-style: italic; text-align: center; padding: 10px; border: 1px dashed var(--background-modifier-border); border-radius: 6px;" }
            });
            return;
        }

        this.taskQueue.forEach((task, index) => {
            const item = this.queueContainerEl.createDiv();
            
            // Estilo do item da fila (Card)
            item.style.display = 'flex';
            item.style.justifyContent = 'space-between';
            item.style.alignItems = 'center';
            item.style.padding = '8px 12px';
            item.style.marginBottom = '6px';
            item.style.backgroundColor = 'var(--background-primary-alt)';
            item.style.borderRadius = '6px';
            item.style.border = '1px solid var(--background-modifier-border)';

            // Nome da tarefa
            const textSpan = item.createSpan({ text: `${index + 1}. ${task.name}` });
            textSpan.style.fontWeight = "500";
            textSpan.style.overflow = "hidden";
            textSpan.style.textOverflow = "ellipsis";
            textSpan.style.whiteSpace = "nowrap";
            textSpan.style.marginRight = "10px";
            textSpan.style.flex = "1";

            // Metadados visuais
            const sobLabel = task.soberania === 'interna' ? 'INT' : 'EXT';
            const metaText = `[${task.difficulty.toUpperCase()} | 🍅 ${task.expectedSessions} | ${sobLabel}]`;
            item.createSpan({ 
                text: metaText,
                attr: { style: "color: var(--text-muted); font-size: 0.75em; font-family: monospace; margin-right: 10px; white-space: nowrap;" }
            });

            // Botão de remover
            const btnDelete = new ButtonComponent(item)
                .setIcon("trash")
                .setTooltip("Remover")
                .onClick(() => this.removeTaskFromQueue(index));
            btnDelete.buttonEl.style.boxShadow = "none";
            btnDelete.buttonEl.style.backgroundColor = "transparent";
            btnDelete.buttonEl.style.color = "var(--text-muted)";
            btnDelete.buttonEl.style.padding = "0 5px";
            btnDelete.buttonEl.style.height = "auto";
        });
    }

    private submitAll() {
        // Se houver texto no input mas não na fila, adiciona automaticamente antes de enviar
        if (this.taskQueue.length === 0 && this.currentTask.name.trim()) {
            this.taskQueue.push({ ...this.currentTask });
        } else if (this.taskQueue.length === 0) {
            this.close();
            return;
        }

        this.onSubmit(this.taskQueue);
        this.close();
    }

    onClose() {
        this.contentEl.empty();
    }
}