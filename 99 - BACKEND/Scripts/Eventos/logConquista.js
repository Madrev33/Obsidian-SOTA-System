// SOTA - logConquista.js v3.1 (Dual Log)
// Interface de celebração de vitórias com análise de sucesso e log duplo.

module.exports = async (params) => {
    const { app, obsidian } = params;
    const { Modal, Notice, TextAreaComponent, ButtonComponent } = obsidian;

    // --- 1. ESTILOS CSS ---
    const styleId = 'sota-win-styles';
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) existingStyle.remove();

    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
        .sota-modal { padding: 25px; }
        .sota-header { text-align: center; margin-bottom: 25px; font-size: 1.4em; font-weight: 700; color: var(--color-yellow); } /* Amarelo/Dourado */
        
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
            min-height: 80px; 
        }
        
        /* Botão de Destaque Dourado */
        .sota-btn-gold {
            background-color: var(--color-yellow);
            color: var(--background-primary);
            font-weight: 700;
        }
        .sota-btn-gold:hover {
            background-color: var(--color-orange);
            color: var(--text-normal);
        }

        .sota-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 30px; }
    `;
    document.head.appendChild(style);

    const dailyLogFolder = "99 - BACKEND/Logs_Metricas/Daily";

    // --- 2. CLASSE DO MODAL ---
    class WinModal extends Modal {
        constructor(app) {
            super(app);
            this.data = {
                conquista: "",
                fator: ""
            };
        }

        onOpen() {
            const { contentEl } = this;
            contentEl.empty();
            contentEl.addClass("sota-modal");
            this.modalEl.style.width = "600px";

            contentEl.createDiv({ cls: "sota-header", text: "🏆 Registro de Vitória" });

            // Campo 1: Conquista
            this.createField(contentEl, "Qual foi a conquista? (O Win)", "conquista", "Ex: Fechei o contrato, terminei o curso...");

            // Campo 2: Fator Chave
            this.createField(contentEl, "Qual foi o fator chave? (Por que deu certo?)", "fator", "Ex: Preparação antecipada, foco ininterrupto...");

            const footer = contentEl.createDiv({ cls: "sota-footer" });
            new ButtonComponent(footer).setButtonText("Cancelar").onClick(() => this.close());
            
            const btnSave = new ButtonComponent(footer)
                .setButtonText("Celebrar Conquista")
                .onClick(() => this.salvar());
            btnSave.buttonEl.addClass("sota-btn-gold"); // Estilo especial
        }

        createField(container, label, key, placeholder) {
            const group = container.createDiv({ cls: "sota-field-group" });
            group.createSpan({ cls: "sota-label", text: label });
            
            const el = new TextAreaComponent(group);
            el.inputEl.parentNode.addClass("sota-textarea");
            el.setPlaceholder(placeholder);
            el.onChange(v => this.data[key] = v);
            
            if (key === 'conquista') setTimeout(() => el.inputEl.focus(), 100);
        }

        async salvar() {
            if (!this.data.conquista) {
                new Notice("⚠️ Descreva a sua conquista.");
                return;
            }

            // Sanitização
            const clean = (str) => str ? str.replace(/[\r\n]+/g, "; ").trim() : "";
            const conquistaClean = clean(this.data.conquista);
            const fatorClean = clean(this.data.fator);

            const m = window.moment;
            const hoje = m().format("YYYY-MM-DD");
            const agora = m().format("HH:mm:ss");
            const periodo = this.getPeriodo(m());
            
            // Formato de Log
            const logLine = `\n- [ ] ✨ Conquista (Win): ${conquistaClean} (Fator:: ${fatorClean}) #win ${periodo} (log_date::${hoje}) (log_time::${agora})`;

            // --- CAMINHO 1: Log Diário ---
            const logPathDaily = `${dailyLogFolder}/${hoje}.md`;
            let logFileDaily = app.vault.getAbstractFileByPath(logPathDaily);
            
            if (!logFileDaily) {
                if (!await app.vault.adapter.exists(dailyLogFolder)) await app.vault.createFolder(dailyLogFolder);
                logFileDaily = await app.vault.create(logPathDaily, "");
            }

            // --- CAMINHO 2: Log Contextual (Wins) ---
            const winsFolder = `99 - BACKEND/Logs_Metricas/Reflexao/Wins`;
            const winsLogPath = `${winsFolder}/raw_logs.md`;
            let logFileWins = app.vault.getAbstractFileByPath(winsLogPath);

            if (!logFileWins) {
                try {
                    const reflexaoRoot = `99 - BACKEND/Logs_Metricas/Reflexao`;
                    if (!await app.vault.adapter.exists(reflexaoRoot)) await app.vault.createFolder(reflexaoRoot);
                    if (!await app.vault.adapter.exists(winsFolder)) await app.vault.createFolder(winsFolder);
                    logFileWins = await app.vault.create(winsLogPath, "");
                } catch (e) { console.error("Erro ao criar log de Wins:", e); }
            }

            // --- EXECUÇÃO DUAL ---
            const writes = [app.vault.append(logFileDaily, logLine)];
            if (logFileWins) writes.push(app.vault.append(logFileWins, logLine));
            
            await Promise.all(writes);

            new Notice("🏆 Vitória registrada! Continue assim.");
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

    new WinModal(app).open();
};