// SOTA - logAlimentacao.js v3.2 (Dual Log)
// Interface binária rápida para registro alimentar com log duplo.

module.exports = async (params) => {
    const { app, obsidian } = params;
    const { Modal, Notice, TextComponent, ButtonComponent } = obsidian;

    // --- 1. ESTILOS CSS ---
    const styleId = 'sota-nutrition-styles';
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) existingStyle.remove();

    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
        .sota-modal { padding: 20px; }
        .sota-header { text-align: center; margin-bottom: 25px; font-size: 1.4em; font-weight: 700; }
        
        .sota-cards-container { display: flex; gap: 15px; margin-bottom: 25px; }
        .sota-card { 
            flex: 1; 
            padding: 20px; 
            border: 1px solid var(--background-modifier-border); 
            border-radius: 8px; 
            text-align: center; 
            cursor: pointer; 
            transition: all 0.2s;
            background: var(--background-primary);
        }
        .sota-card:hover { transform: translateY(-2px); box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
        .sota-card.selected { border-color: var(--interactive-accent); background: var(--background-modifier-active-hover); }
        
        .sota-card-icon { font-size: 2.5em; margin-bottom: 10px; display: block; }
        .sota-card-title { font-weight: 600; font-size: 1.1em; }
        
        /* Input Area */
        .sota-input-area { 
            margin-top: 20px; 
            opacity: 0; 
            transform: translateY(10px); 
            transition: all 0.3s; 
            pointer-events: none;
            width: 100%;
        }
        .sota-input-area.visible { opacity: 1; transform: translateY(0); pointer-events: all; }
        
        .sota-input input { 
            width: 100% !important; 
            padding: 12px !important; 
            font-size: 1.1em !important; 
            margin-bottom: 20px !important;
            border-radius: 6px;
            background-color: var(--background-primary);
            border: 1px solid var(--background-modifier-border);
        }
        .sota-input input:focus {
            border-color: var(--interactive-accent);
            box-shadow: 0 0 0 2px rgba(var(--interactive-accent-rgb), 0.2);
        }

        .sota-footer { display: flex; justify-content: flex-end; gap: 10px; }
    `;
    document.head.appendChild(style);

    // --- 2. CLASSE DO MODAL ---
    class NutritionModal extends Modal {
        constructor(app) {
            super(app);
            this.tipo = null; 
            this.descricao = "";
        }

        onOpen() {
            const { contentEl } = this;
            contentEl.empty();
            contentEl.addClass("sota-modal");
            this.modalEl.style.width = "600px";

            contentEl.createDiv({ cls: "sota-header", text: "🍽️ Registro Nutricional" });

            // Container dos Cards
            const cardContainer = contentEl.createDiv({ cls: "sota-cards-container" });

            // Card BOM
            const cardGood = cardContainer.createDiv({ cls: "sota-card" });
            cardGood.innerHTML = `<span class="sota-card-icon">🥩</span><span class="sota-card-title">Nutritivo</span>`;
            
            // Card RUIM
            const cardBad = cardContainer.createDiv({ cls: "sota-card" });
            cardBad.innerHTML = `<span class="sota-card-icon">🍔</span><span class="sota-card-title">Lixo</span>`;

            // Área de Input (Escondida inicialmente)
            const inputArea = contentEl.createDiv({ cls: "sota-input-area" });
            
            const inputWrapper = inputArea.createDiv({ cls: "sota-input" });
            const inputEl = new TextComponent(inputWrapper);
            inputEl.onChange(v => this.descricao = v);
            
            const footer = inputArea.createDiv({ cls: "sota-footer" });
            new ButtonComponent(footer).setButtonText("Cancelar").onClick(() => this.close());
            new ButtonComponent(footer)
                .setButtonText("Registrar")
                .setCta()
                .onClick(() => this.salvar());

            // Lógica de Seleção
            const selectType = (type) => {
                this.tipo = type;
                cardGood.classList.toggle("selected", type === 'boa');
                cardBad.classList.toggle("selected", type === 'ruim');
                
                inputArea.addClass("visible");
                inputEl.setPlaceholder(type === 'boa' ? "Ex: Frango com batata doce..." : "Ex: Pizza, Refrigerante...");
                setTimeout(() => inputEl.inputEl.focus(), 100);
            };

            cardGood.onclick = () => selectType('boa');
            cardBad.onclick = () => selectType('ruim');

            inputEl.inputEl.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.salvar();
            });
        }

        async salvar() {
            if (!this.tipo || !this.descricao) {
                new Notice("⚠️ Descreva a refeição.");
                return;
            }

            const m = window.moment;
            const hoje = m().format("YYYY-MM-DD");
            const agora = m().format("HH:mm:ss");
            const periodo = this.getPeriodo(m());
            
            let linhaLog = "";
            if (this.tipo === 'boa') {
                linhaLog = `\n- Refeição BOA registrada. (Alimentos:: ${this.descricao}) #refeicao_boa ${periodo} (log_date::${hoje}) (log_time::${agora})`;
            } else {
                linhaLog = `\n- Refeição RUIM registrada. (Alimentos:: ${this.descricao}) #refeicao_ruim ${periodo} (log_date::${hoje}) (log_time::${agora})`;
            }

            // --- CAMINHO 1: Log Diário (ETL) ---
            const dailyLogPath = `99 - BACKEND/Logs_Metricas/Daily/${hoje}.md`;
            let logFileDaily = app.vault.getAbstractFileByPath(dailyLogPath);
            if (!logFileDaily) {
                const dailyFolder = `99 - BACKEND/Logs_Metricas/Daily`;
                if (!await app.vault.adapter.exists(dailyFolder)) await app.vault.createFolder(dailyFolder);
                logFileDaily = await app.vault.create(dailyLogPath, "");
            }

            // --- CAMINHO 2: Log Contextual (Histórico Nutrição) ---
            const nutriFolder = `99 - BACKEND/Logs_Metricas/Saude/Nutricao`;
            const nutriLogPath = `${nutriFolder}/raw_logs.md`;
            let logFileNutri = app.vault.getAbstractFileByPath(nutriLogPath);

            if (!logFileNutri) {
                try {
                    // Garante estrutura de pastas (recursiva manual para garantir)
                    const saudeRoot = `99 - BACKEND/Logs_Metricas/Saude`;
                    if (!await app.vault.adapter.exists(saudeRoot)) await app.vault.createFolder(saudeRoot);
                    if (!await app.vault.adapter.exists(nutriFolder)) await app.vault.createFolder(nutriFolder);
                    logFileNutri = await app.vault.create(nutriLogPath, "");
                } catch (e) { console.error("Erro ao criar log de nutrição:", e); }
            }

            // --- EXECUÇÃO DUAL ---
            const writes = [app.vault.append(logFileDaily, linhaLog)];
            if (logFileNutri) writes.push(app.vault.append(logFileNutri, linhaLog));
            
            await Promise.all(writes);

            new Notice(this.tipo === 'boa' ? "🥗 Nutrição registrada!" : "🍔 Registro efetuado.");
            this.close();
        }

        getPeriodo(momento) {
            const h = momento.hour();
            if (h < 6) return "#periodo/madrugada";
            if (h < 12) return "#periodo/manha";
            if (h < 18) return "#periodo/tarde";
            return "#periodo/noite";
        }

        onClose() {
            this.contentEl.empty();
        }
    }

    new NutritionModal(app).open();
};