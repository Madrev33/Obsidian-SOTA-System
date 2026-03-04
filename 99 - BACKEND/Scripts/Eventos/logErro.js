// SOTA - logErro.js v3.4 (Dual Log)
// Registro de Aprendizados de Erro com log duplo.

module.exports = async (params) => {
    const { app, obsidian } = params;
    const { Modal, Notice, TextAreaComponent, ButtonComponent } = obsidian;

    // --- 1. ESTILOS CSS ---
    const styleId = 'sota-error-styles';
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) existingStyle.remove();

    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
        .sota-modal { padding: 25px; }
        .sota-header { text-align: center; margin-bottom: 25px; font-size: 1.4em; font-weight: 700; color: var(--color-red); }
        .sota-field-group { margin-bottom: 20px; }
        .sota-label { font-size: 0.85em; font-weight: 600; color: var(--text-muted); margin-bottom: 8px; display: block; text-transform: uppercase; letter-spacing: 0.05em; }
        /* TextArea Unificado */
        .sota-textarea textarea { 
            width: 100%; 
            padding: 12px; 
            border-radius: 6px; 
            border: 1px solid var(--background-modifier-border);
            background-color: var(--background-primary);
            font-family: var(--font-text);
            resize: vertical; 
            min-height: 80px; /* Altura confortável para todos */
        }
        .sota-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 30px; }
    `;
    document.head.appendChild(style);

    const dailyLogFolder = "99 - BACKEND/Logs_Metricas/Daily";

    // --- 2. CLASSE DO MODAL ---
    class ErrorLearningModal extends Modal {
        constructor(app) {
            super(app);
            this.data = {
                situacao: "",
                erro: "",
                aprendizado: ""
            };
        }

        onOpen() {
            const { contentEl } = this;
            contentEl.empty();
            contentEl.addClass("sota-modal");
            this.modalEl.style.width = "600px";

            contentEl.createDiv({ cls: "sota-header", text: "🛑 Análise de Falha" });

            this.createField(contentEl, "O que aconteceu? (Situação)", "situacao", "Ex: Perdi o prazo do projeto...");
            this.createField(contentEl, "Qual foi o erro ou causa raiz?", "erro", "Ex: Subestimei o tempo de pesquisa...");
            this.createField(contentEl, "O que fazer diferente? (Aprendizado)", "aprendizado", "Ex: Quebrar tarefas grandes em blocos de 30min...");

            const footer = contentEl.createDiv({ cls: "sota-footer" });
            new ButtonComponent(footer).setButtonText("Cancelar").onClick(() => this.close());
            new ButtonComponent(footer).setButtonText("Registrar Aprendizado").setCta().onClick(() => this.salvar());
        }

        createField(container, label, key, placeholder) {
            const group = container.createDiv({ cls: "sota-field-group" });
            group.createSpan({ cls: "sota-label", text: label });
            
            const el = new TextAreaComponent(group);
            el.inputEl.parentNode.addClass("sota-textarea");
            el.setPlaceholder(placeholder);
            el.onChange(v => this.data[key] = v);
            
            if (key === 'situacao') setTimeout(() => el.inputEl.focus(), 100);
        }

        async salvar() {
            if (!this.data.situacao || !this.data.aprendizado) {
                new Notice("⚠️ Preencha a situação e o aprendizado.");
                return;
            }

            const clean = (str) => str ? str.replace(/[\r\n]+/g, "; ").trim() : "";
            const situacaoClean = clean(this.data.situacao);
            const erroClean = clean(this.data.erro);
            const aprendizadoClean = clean(this.data.aprendizado);

            const m = window.moment;
            const hoje = m().format("YYYY-MM-DD");
            const agora = m().format("HH:mm:ss");
            const periodo = this.getPeriodo(m());
            
            // Formato de Log
            const logLine = `\n- [ ] 🛑 Aprendizado de Erro. (Situação:: ${situacaoClean}) (Erro:: ${erroClean}) (Aprendizado:: ${aprendizadoClean}) #aprendizado_erro ${periodo} (log_date::${hoje}) (log_time::${agora})`;

            // --- CAMINHO 1: Log Diário ---
            const logPathDaily = `${dailyLogFolder}/${hoje}.md`;
            let logFileDaily = app.vault.getAbstractFileByPath(logPathDaily);
            if (!logFileDaily) {
                if (!await app.vault.adapter.exists(dailyLogFolder)) await app.vault.createFolder(dailyLogFolder);
                logFileDaily = await app.vault.create(logPathDaily, "");
            }

            // --- CAMINHO 2: Log Contextual (Erros) ---
            const errorsFolder = `99 - BACKEND/Logs_Metricas/Reflexao/Erros`;
            const errorsLogPath = `${errorsFolder}/raw_logs.md`;
            let logFileErrors = app.vault.getAbstractFileByPath(errorsLogPath);

            if (!logFileErrors) {
                try {
                    const reflexaoRoot = `99 - BACKEND/Logs_Metricas/Reflexao`;
                    if (!await app.vault.adapter.exists(reflexaoRoot)) await app.vault.createFolder(reflexaoRoot);
                    if (!await app.vault.adapter.exists(errorsFolder)) await app.vault.createFolder(errorsFolder);
                    logFileErrors = await app.vault.create(errorsLogPath, "");
                } catch (e) { console.error("Erro ao criar log de Erros:", e); }
            }

            // --- EXECUÇÃO DUAL ---
            const writes = [app.vault.append(logFileDaily, logLine)];
            if (logFileErrors) writes.push(app.vault.append(logFileErrors, logLine));
            
            await Promise.all(writes);

            new Notice("🧠 Aprendizado Anotado!");
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

    new ErrorLearningModal(app).open();
};