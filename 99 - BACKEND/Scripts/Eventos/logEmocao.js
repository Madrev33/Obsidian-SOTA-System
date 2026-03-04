// SOTA - logEmocao.js v3.2 (4 Pillars Moods)
// Interface visual para registro de estados emocionais com log duplo.
// Atualização: Separação de Ansiedade e Estresse.

module.exports = async (params) => {
    const { app, obsidian } = params;
    const { Modal, Notice, TextComponent, ButtonComponent } = obsidian;

    // --- 1. ESTILOS CSS ---
    const styleId = 'sota-mood-styles';
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) existingStyle.remove();

    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
        .sota-modal { padding: 20px; }
        .sota-header { text-align: center; margin-bottom: 25px; font-size: 1.4em; font-weight: 700; }
        
        /* Grid de Emojis (Atualizado para 4 colunas) */
        .sota-mood-grid { 
            display: grid; 
            grid-template-columns: repeat(4, 1fr); 
            gap: 10px; 
            margin-bottom: 25px; 
        }
        .sota-mood-card { 
            padding: 15px 5px; 
            border: 1px solid var(--background-modifier-border); 
            border-radius: 8px; 
            text-align: center; 
            cursor: pointer; 
            transition: all 0.2s;
            background: var(--background-primary);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100px;
        }
        .sota-mood-card:hover { transform: translateY(-2px); border-color: var(--interactive-accent); }
        .sota-mood-card.selected { 
            background: var(--background-modifier-active-hover); 
            border-color: var(--interactive-accent); 
            box-shadow: 0 0 0 1px var(--interactive-accent);
        }
        
        .sota-mood-icon { font-size: 2.2em; margin-bottom: 8px; }
        .sota-mood-label { font-size: 0.85em; font-weight: 600; color: var(--text-muted); line-height: 1.2; }
        
        /* Input Area (Animada) */
        .sota-input-area { 
            opacity: 0; 
            transform: translateY(10px); 
            transition: all 0.3s; 
            pointer-events: none;
            height: 0;
            overflow: hidden;
        }
        .sota-input-area.visible { 
            opacity: 1; 
            transform: translateY(0); 
            pointer-events: all; 
            height: auto;
            margin-top: 10px;
        }
        
        .sota-input input { 
            width: 100%; 
            padding: 12px; 
            font-size: 1.1em; 
            margin-bottom: 20px;
            border-radius: 6px;
        }

        .sota-footer { display: flex; justify-content: flex-end; gap: 10px; }
        
        /* Responsividade para telas pequenas */
        @media (max-width: 500px) {
            .sota-mood-grid { grid-template-columns: repeat(2, 1fr); }
        }
    `;
    document.head.appendChild(style);

    // --- 2. CONFIGURAÇÃO (ORDEM REQUISITADA) ---
    const moods = [
        { id: 'tristeza',   icon: '😔', label: 'Tristeza',   tag: '#log_tristeza',   placeholder: "Qual é a fonte da Tristeza?" },
        { id: 'estresse',   icon: '🤯', label: 'Estresse',   tag: '#log_estresse',   placeholder: "Qual é a fonte do Estresse?" },
        { id: 'ansiedade',  icon: '😰', label: 'Ansiedade',  tag: '#log_ansiedade',  placeholder: "Qual é a fonte da Ansiedade?" },
        { id: 'felicidade', icon: '😄', label: 'Felicidade', tag: '#log_felicidade', placeholder: "Qual é a fonte da Felicidade?" }
    ];

    class MoodModal extends Modal {
        constructor(app) {
            super(app);
            this.selectedMood = null;
            this.contexto = "";
        }

        onOpen() {
            const { contentEl } = this;
            contentEl.empty();
            contentEl.addClass("sota-modal");
            this.modalEl.style.width = "600px";

            contentEl.createDiv({ cls: "sota-header", text: "❤️ Como você está?" });

            // Grid
            const grid = contentEl.createDiv({ cls: "sota-mood-grid" });
            const moodCards = [];

            // Input Area
            const inputArea = contentEl.createDiv({ cls: "sota-input-area" });
            const inputWrapper = inputArea.createDiv({ cls: "sota-input" });
            const inputEl = new TextComponent(inputWrapper);
            inputEl.onChange(v => this.contexto = v);

            // Footer
            const footer = inputArea.createDiv({ cls: "sota-footer" });
            new ButtonComponent(footer).setButtonText("Cancelar").onClick(() => this.close());
            new ButtonComponent(footer).setButtonText("Salvar").setCta().onClick(() => this.salvar());

            // Renderizar Cards
            moods.forEach(mood => {
                const card = grid.createDiv({ cls: "sota-mood-card" });
                card.innerHTML = `<span class="sota-mood-icon">${mood.icon}</span><span class="sota-mood-label">${mood.label}</span>`;
                
                card.onclick = () => {
                    this.selectedMood = mood;
                    
                    // Atualiza visual
                    moodCards.forEach(c => c.classList.remove('selected'));
                    card.classList.add('selected');
                    
                    // Mostra input
                    inputArea.addClass("visible");
                    inputEl.setPlaceholder(mood.placeholder);
                    setTimeout(() => inputEl.inputEl.focus(), 100);
                };
                moodCards.push(card);
            });

            inputEl.inputEl.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.salvar();
            });
        }

        async salvar() {
            if (!this.selectedMood) return;
            const texto = this.contexto || "Registro rápido de estado emocional.";

            const m = window.moment;
            const hoje = m().format("YYYY-MM-DD");
            const agora = m().format("HH:mm:ss");
            const periodo = this.getPeriodo(m());
            
            // Formato de Log
            const linhaLog = `\n- Momento de ${this.selectedMood.label}. (Contexto:: ${texto}) ${this.selectedMood.tag} ${periodo} (log_date::${hoje}) (log_time::${agora})`;

            // --- CAMINHO 1: Log Diário ---
            const dailyLogPath = `99 - BACKEND/Logs_Metricas/Daily/${hoje}.md`;
            let logFileDaily = app.vault.getAbstractFileByPath(dailyLogPath);
            if (!logFileDaily) {
                const dailyFolder = `99 - BACKEND/Logs_Metricas/Daily`;
                if (!await app.vault.adapter.exists(dailyFolder)) await app.vault.createFolder(dailyFolder);
                logFileDaily = await app.vault.create(dailyLogPath, "");
            }

            // --- CAMINHO 2: Log Contextual (Emoções) ---
            const moodFolder = `99 - BACKEND/Logs_Metricas/Saude/Emocoes`;
            const moodLogPath = `${moodFolder}/raw_logs.md`;
            let logFileMood = app.vault.getAbstractFileByPath(moodLogPath);

            if (!logFileMood) {
                try {
                    const saudeRoot = `99 - BACKEND/Logs_Metricas/Saude`;
                    if (!await app.vault.adapter.exists(saudeRoot)) await app.vault.createFolder(saudeRoot);
                    if (!await app.vault.adapter.exists(moodFolder)) await app.vault.createFolder(moodFolder);
                    logFileMood = await app.vault.create(moodLogPath, "");
                } catch (e) { console.error("Erro ao criar log de emoções:", e); }
            }

            // --- EXECUÇÃO DUAL ---
            const writes = [app.vault.append(logFileDaily, linhaLog)];
            if (logFileMood) writes.push(app.vault.append(logFileMood, linhaLog));
            
            await Promise.all(writes);

            new Notice(`${this.selectedMood.icon} Sentimento registrado.`);
            
            // Refresh para atualizar o renderLogsPorPeriodo.js e o Quad-Core se já estiverem abertos
            setTimeout(() => app.workspace.trigger("dataview:refresh-views"), 200);
            
            this.close();
        }

        getPeriodo(momento) {
            const h = momento.hour();
            if (h < 6) return "#periodo/madrugada";
            if (h < 12) return "#periodo/manha";
            if (h < 18) return "#periodo/tarde";
            return "#periodo/noite";
        }

        onClose() { this.contentEl.empty(); }
    }

    new MoodModal(app).open();
};