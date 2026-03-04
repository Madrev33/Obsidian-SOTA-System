// SOTA - logFazerDepois.js v3.0 (Rich UI & Single Line)
// Captura rápida para Inbox (Fazer Depois) com interface unificada.

module.exports = async (params) => {
    const { app, obsidian } = params;
    const { Modal, Notice, TextAreaComponent, ButtonComponent } = obsidian;

    // --- 1. ESTILOS CSS ---
    const styleId = 'sota-inbox-styles';
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) existingStyle.remove();

    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
        .sota-modal { padding: 25px; }
        .sota-header { text-align: center; margin-bottom: 25px; font-size: 1.4em; font-weight: 700; color: var(--color-blue); } /* Azul para calma/organização */
        
        .sota-field-group { margin-bottom: 20px; }
        .sota-label { font-size: 0.85em; font-weight: 600; color: var(--text-muted); margin-bottom: 8px; display: block; text-transform: uppercase; letter-spacing: 0.05em; }
        
        .sota-textarea textarea { 
            width: 100%; 
            padding: 12px; 
            border-radius: 6px; 
            border: 1px solid var(--background-modifier-border);
            background-color: var(--background-primary);
            font-family: var(--font-text);
            resize: vertical; 
            min-height: 100px; /* Um pouco maior para despejar a mente */
        }
        
        .sota-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 30px; }
    `;
    document.head.appendChild(style);

    const dailyLogFolder = "99 - BACKEND/Logs_Metricas/Daily";

    // --- 2. CLASSE DO MODAL ---
    class InboxModal extends Modal {
        constructor(app) {
            super(app);
            this.tarefa = "";
        }

        onOpen() {
            const { contentEl } = this;
            contentEl.empty();
            contentEl.addClass("sota-modal");
            this.modalEl.style.width = "600px";

            contentEl.createDiv({ cls: "sota-header", text: "📥 Captura Rápida (Inbox)" });

            // Campo Único
            const group = contentEl.createDiv({ cls: "sota-field-group" });
            group.createSpan({ cls: "sota-label", text: "O que você precisa fazer depois?" });
            
            const el = new TextAreaComponent(group);
            el.inputEl.parentNode.addClass("sota-textarea");
            el.setPlaceholder("Despeje sua mente aqui...");
            el.onChange(v => this.tarefa = v);
            
            // Foco e Atalho
            setTimeout(() => el.inputEl.focus(), 100);
            el.inputEl.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    this.salvar();
                }
            });

            const footer = contentEl.createDiv({ cls: "sota-footer" });
            new ButtonComponent(footer).setButtonText("Cancelar").onClick(() => this.close());
            
            new ButtonComponent(footer)
                .setButtonText("Capturar")
                .setCta()
                .onClick(() => this.salvar());
        }

        async salvar() {
            if (!this.tarefa) {
                new Notice("⚠️ O campo está vazio.");
                return;
            }

            // Sanitização (Remove quebras de linha para manter log de 1 linha)
            const clean = this.tarefa.replace(/[\r\n]+/g, "; ").trim();

            const m = window.moment;
            const hoje = m().format("YYYY-MM-DD");
            const agora = m().format("HH:mm:ss");
            const periodo = this.getPeriodo(m());
            
            // Formato de Log Padronizado
            const linhaDeLog = `\n- [ ] ${clean} #fazer_depois ${periodo} (log_date::${hoje}) (log_time::${agora})`;

            // --- CAMINHO 1: Log Diário ---
            const logPathDaily = `${dailyLogFolder}/${hoje}.md`;
            let logFileDaily = app.vault.getAbstractFileByPath(logPathDaily);
            
            if (!logFileDaily) {
                try {
                    if (!await app.vault.adapter.exists(dailyLogFolder)) await app.vault.createFolder(dailyLogFolder);
                    logFileDaily = await app.vault.create(logPathDaily, "");
                } catch (error) {
                    new Notice("❌ Erro crítico ao criar log diário.");
                    return;
                }
            }

            // --- EXECUÇÃO (Single Write - Apenas Diário) ---
            // Inbox rápida vai apenas para o diário, pois é algo a ser processado depois.
            await app.vault.append(logFileDaily, linhaDeLog);

            new Notice("✅ Capturado para a Inbox!");
            
            // Refresh visual
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

    new InboxModal(app).open();
};