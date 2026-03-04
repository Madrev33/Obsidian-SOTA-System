// SOTA - logDistracaoScript.js v4.0 (Rich UI & Dual Log)
// Registro detalhado de distrações com interface unificada e log duplo.

module.exports = async (params) => {
    const { app, obsidian } = params;
    const { Modal, Notice, TextAreaComponent, ButtonComponent } = obsidian;

    // --- 1. ESTILOS CSS ---
    const styleId = 'sota-distraction-styles';
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) existingStyle.remove();

    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
        .sota-modal { padding: 25px; }
        .sota-header { text-align: center; margin-bottom: 25px; font-size: 1.4em; font-weight: 700; color: var(--color-orange); } /* Laranja para alerta */
        
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
        
        .sota-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 30px; }
    `;
    document.head.appendChild(style);

    const dailyLogFolder = "99 - BACKEND/Logs_Metricas/Daily";

    // --- 2. CLASSE DO MODAL ---
    class DistractionModal extends Modal {
        constructor(app) {
            super(app);
            this.data = {
                distracao: "",
                gatilho: ""
            };
        }

        onOpen() {
            const { contentEl } = this;
            contentEl.empty();
            contentEl.addClass("sota-modal");
            this.modalEl.style.width = "600px";

            contentEl.createDiv({ cls: "sota-header", text: "⚠️ Registro de Distração" });

            // Campo 1: Distração
            this.createField(contentEl, "Com o que você se distraiu?", "distracao", "Ex: Celular, Youtube, Pensamentos...");

            // Campo 2: Gatilho
            this.createField(contentEl, "Qual foi o gatilho? (Causa Raiz)", "gatilho", "Ex: Notificação, Cansaço, Tédio, Fuga de tarefa difícil...");

            const footer = contentEl.createDiv({ cls: "sota-footer" });
            new ButtonComponent(footer).setButtonText("Cancelar").onClick(() => this.close());
            
            new ButtonComponent(footer)
                .setButtonText("Registrar")
                .setCta() // Estilo de destaque padrão (roxo/azul)
                .onClick(() => this.salvar());
        }

        createField(container, label, key, placeholder) {
            const group = container.createDiv({ cls: "sota-field-group" });
            group.createSpan({ cls: "sota-label", text: label });
            
            const el = new TextAreaComponent(group);
            el.inputEl.parentNode.addClass("sota-textarea");
            el.setPlaceholder(placeholder);
            el.onChange(v => this.data[key] = v);
            
            // Foco automático no primeiro campo
            if (key === 'distracao') setTimeout(() => el.inputEl.focus(), 100);
            
            // Atalho Ctrl+Enter para salvar
            el.inputEl.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    this.salvar();
                }
            });
        }

        async salvar() {
            if (!this.data.distracao || !this.data.gatilho) {
                new Notice("⚠️ Preencha a distração e o gatilho.");
                return;
            }

            // Sanitização (Remove quebras de linha)
            const clean = (str) => str ? str.replace(/[\r\n]+/g, "; ").trim() : "";
            const distracaoClean = clean(this.data.distracao);
            const gatilhoClean = clean(this.data.gatilho);

            const m = window.moment;
            const hoje = m().format("YYYY-MM-DD");
            const agora = m().format("HH:mm:ss");
            const periodo = this.getPeriodo(m());
            
            // Formato de Log Padronizado
            const linhaDeLog = `\n- Ponto de Distração registrado. (Distração:: ${distracaoClean}) (Gatilho:: ${gatilhoClean}) #distracao ${periodo} (log_date::${hoje}) (log_time::${agora})`;

            // --- CAMINHO 1: Log Diário ---
            const logPathDaily = `${dailyLogFolder}/${hoje}.md`;
            let logFileDaily = app.vault.getAbstractFileByPath(logPathDaily);
            
            if (!logFileDaily) {
                if (!await app.vault.adapter.exists(dailyLogFolder)) await app.vault.createFolder(dailyLogFolder);
                logFileDaily = await app.vault.create(logPathDaily, "");
            }

            // --- CAMINHO 2: Log Contextual (Distrações) ---
            const distracaoFolder = `99 - BACKEND/Logs_Metricas/Foco/Distracoes`;
            const distracaoLogPath = `${distracaoFolder}/raw_logs.md`;
            let logFileDistraction = app.vault.getAbstractFileByPath(distracaoLogPath);

            if (!logFileDistraction) {
                try {
                    const focoRoot = `99 - BACKEND/Logs_Metricas/Foco`;
                    if (!await app.vault.adapter.exists(focoRoot)) await app.vault.createFolder(focoRoot);
                    if (!await app.vault.adapter.exists(distracaoFolder)) await app.vault.createFolder(distracaoFolder);
                    logFileDistraction = await app.vault.create(distracaoLogPath, "");
                } catch (e) { console.error("Erro ao criar log de Distração:", e); }
            }

            // --- EXECUÇÃO DUAL ---
            const writes = [app.vault.append(logFileDaily, linhaDeLog)];
            if (logFileDistraction) writes.push(app.vault.append(logFileDistraction, linhaDeLog));
            
            await Promise.all(writes);

            new Notice("⚠️ Distração registrada. Volte ao foco!");
            
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

    new DistractionModal(app).open();
};