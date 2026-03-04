// SOTA - registrarInsightUniversal.js v5.1 (Conditional Frontmatter)
// Interface gráfica para registro rápido de Ideias/Reflexões.
// Ação: Loga no Diário sempre. Atualiza Frontmatter APENAS se for uma nota de Mídia (com campos pré-existentes).

module.exports = async (params) => {
    const { app, obsidian } = params;
    const { Notice, Modal, ButtonComponent } = obsidian;

    // --- 1. VERIFICAÇÃO DE CONTEXTO ---
    const activeFile = app.workspace.getActiveFile();
    if (!activeFile) {
        new Notice("❌ ERRO: Nenhuma nota ativa para vincular o insight.");
        return;
    }

    // --- 2. INJEÇÃO DE ESTILOS CSS ---
    const styleId = 'sota-insight-styles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
            .sota-modal { padding: 20px; }
            .sota-header { text-align: center; margin-bottom: 25px; font-size: 1.4em; font-weight: 700; color: var(--text-normal); }
            .sota-cards-container { display: flex; gap: 15px; justify-content: center; }
            .sota-card { 
                flex: 1; max-width: 200px; padding: 20px; 
                border: 1px solid var(--background-modifier-border); border-radius: 8px; text-align: center; 
                cursor: pointer; transition: all 0.2s; background: var(--background-primary);
                display: flex; flex-direction: column; align-items: center; gap: 10px;
            }
            .sota-card:hover { transform: translateY(-2px); border-color: var(--interactive-accent); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .sota-card-icon { font-size: 2.5em; }
            .sota-card-title { font-weight: 600; font-size: 1.1em; color: var(--text-muted); }
            .sota-card:hover .sota-card-title { color: var(--text-normal); }
            .sota-footer { margin-top: 25px; display: flex; justify-content: center; }
        `;
        document.head.appendChild(style);
    }

    // --- 3. CLASSE DO MODAL ---
    class InsightModal extends Modal {
        constructor(app) {
            super(app);
        }

        onOpen() {
            const { contentEl } = this;
            contentEl.empty();
            contentEl.addClass("sota-modal");
            this.modalEl.style.width = "500px";

            contentEl.createDiv({ cls: "sota-header", text: "🧠 Registrar Insight" });

            const container = contentEl.createDiv({ cls: "sota-cards-container" });

            // Card Ideia
            const cardIdeia = container.createDiv({ cls: "sota-card" });
            cardIdeia.innerHTML = `<span class="sota-card-icon">💡</span><span class="sota-card-title">Ideia</span>`;
            cardIdeia.onclick = () => this.processar("ideia");

            // Card Reflexão
            const cardReflexao = container.createDiv({ cls: "sota-card" });
            cardReflexao.innerHTML = `<span class="sota-card-icon">🤔</span><span class="sota-card-title">Reflexão</span>`;
            cardReflexao.onclick = () => this.processar("reflexao");

            // Footer Cancelar
            const footer = contentEl.createDiv({ cls: "sota-footer" });
            new ButtonComponent(footer).setButtonText("Cancelar").onClick(() => this.close());
        }

        async processar(tipo) {
            this.close();
            
            const config = {
                "ideia": { 
                    tag: "#ideia", 
                    campoFm: "ideias_geradas", 
                    label: "Nova Ideia" 
                },
                "reflexao": { 
                    tag: "#reflexao", 
                    campoFm: "reflexoes_geradas", 
                    label: "Nova Reflexão" 
                }
            };

            const info = config[tipo];
            const m = window.moment;
            const hoje = m();
            const dataStr = hoje.format("YYYY-MM-DD");
            const horaStr = hoje.format("HH:mm:ss");
            const periodo = this.getTagPeriodo(hoje);

            // 1. Atualizar Frontmatter (CONDICIONAL)
            const cache = app.metadataCache.getFileCache(activeFile);
            const fm = cache?.frontmatter || {};

            // Verifica se a chave existe (ou se é explicitamente 0). Se for undefined, não mexe.
            if (fm[info.campoFm] !== undefined) {
                try {
                    await app.fileManager.processFrontMatter(activeFile, (fmEdit) => {
                        fmEdit[info.campoFm] = (fmEdit[info.campoFm] || 0) + 1;
                    });
                    new Notice(`📈 Contador da Mídia atualizado!`);
                } catch (e) {
                    console.error("Erro ao atualizar frontmatter:", e);
                }
            } else {
                // Opcional: Feedback que foi apenas logado
                // console.log("Nota sem contador de mídia. Apenas logando.");
            }

            // 2. Logar no Diário (Evento Silencioso)
            const dailyLogPath = `99 - BACKEND/Logs_Metricas/Daily/${dataStr}.md`;
            let dailyFile = app.vault.getAbstractFileByPath(dailyLogPath);

            if (!dailyFile) {
                try {
                    const dailyFolder = `99 - BACKEND/Logs_Metricas/Daily`;
                    if (!await app.vault.adapter.exists(dailyFolder)) {
                        await app.vault.createFolder(dailyFolder);
                    }
                    dailyFile = await app.vault.create(dailyLogPath, "");
                } catch (e) {
                    new Notice("❌ Erro ao criar log diário.");
                    return;
                }
            }

            // Formatação do Link da Fonte
            const nomeFonte = activeFile.basename.replace(/^(00\. HUB - |HUB - |00\. Anotações - )/g, '');
            const fonteLink = `(Fonte:: [[${activeFile.path}|${nomeFonte}]])`;

            // Linha de Log
            const logLine = `\n- [ ] ${info.tag} ${fonteLink} ${periodo} (log_date::${dataStr}) (log_time::${horaStr})`;

            await app.vault.append(dailyFile, logLine);

            new Notice(`✅ ${info.label} registrada!`);
            
            // Refresh
            setTimeout(() => app.workspace.trigger("dataview:refresh-views"), 200);
        }

        getTagPeriodo(momento) {
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

    new InsightModal(app).open();
};