// SOTA - processarTask.js v2.1
// Refinamento de rascunhos para Tasks SOTA com Hierarquia e UX aprimorada.
// Adicionado suporte inteligente para notas de 'projeto_anotacoes'.

module.exports = async (params) => {
    const { app, obsidian } = params;
    const { Modal, Setting, Notice, moment } = obsidian;

    // --- 1. CAPTURA E LIMPEZA ---
    const activeView = app.workspace.getActiveViewOfType(obsidian.MarkdownView);
    if (!activeView) return;

    const editor = activeView.editor;
    const selection = editor.getSelection();

    if (!selection || selection.trim() === "") {
        new Notice("⚠️ Selecione o texto primeiro.");
        return;
    }

    // Identificação de contexto (Herança de tags)
    const file = activeView.file;
    const cache = app.metadataCache.getFileCache(file);
    const fm = cache?.frontmatter || {};

    let contextTag = "";

    // 1. Contexto Direto (Se já estiver no HUB ou arquivo com ID)
    if (fm.id_projeto) {
        contextTag = `#projeto/${fm.id_projeto}`;
    } else if (fm.id_midia) {
        const tipo = fm.tipo?.replace('_hub', '') || 'midia';
        const ciclo = fm.ciclo_de_consumo_atual || 1;
        contextTag = `#midia/${tipo}/${fm.id_midia}/ciclo_${ciclo}`;
    } 
    // 2. Contexto Indireto (Se for uma nota de Anotações de Projeto)
    else if (fm.tags && (fm.tags.includes("projeto_anotacoes") || fm.tipo === "projeto_anotacoes") && fm.hub_uid) {
        // Busca o HUB pai pelo UID
        const allFiles = app.vault.getMarkdownFiles();
        const hubFile = allFiles.find(f => {
            const c = app.metadataCache.getFileCache(f);
            return c?.frontmatter?.sota_uid === fm.hub_uid;
        });

        if (hubFile) {
            const hubCache = app.metadataCache.getFileCache(hubFile);
            const hubId = hubCache?.frontmatter?.id_projeto;
            if (hubId) {
                contextTag = `#projeto/${hubId}`;
                // Nota: Não adicionamos a Fase aqui porque notas de anotações são globais do projeto.
                // A tarefa será criada "solta" no contexto do projeto, sem vínculo de fase.
            }
        }
    }

    // --- 2. MODAL COM UX REFINADA ---
    class ProcessarTaskModal extends Modal {
        constructor(app, onSubmit) {
            super(app);
            this.onSubmit = onSubmit;
            this.result = {
                name: "",
                difficulty: "facil",
                sessions: 1,
                soberania: fm.soberania || "interna"
            };
        }

        onOpen() {
            const { contentEl } = this;
            contentEl.empty();
            
            // Estilização do Modal
            contentEl.createEl("h2", { text: "🚀 Processar Task SOTA", attr: { style: "margin-bottom: 25px; color: var(--text-accent); font-weight: 700;" } });

            // CAMPO: NOME (Destaque)
            const nameSetting = new Setting(contentEl)
                .setName("Nome da Task:")
                .addText(text => {
                    text.setPlaceholder("Ex: Planejamento X")
                        .setValue(this.result.name)
                        .onChange(v => this.result.name = v);
                    text.inputEl.style.width = "100%";
                    text.inputEl.style.fontSize = "1.0em";
                });
            nameSetting.settingEl.style.flexDirection = "column";
            nameSetting.settingEl.style.alignItems = "flex-start";
            nameSetting.settingEl.style.gap = "10px";

            // GRID DE CONFIGURAÇÃO
            const grid = contentEl.createDiv({ 
                attr: { style: "display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin: 25px 0; border-top: 1px solid var(--background-modifier-border); padding-top: 20px;" } 
            });

            // Coluna 1: Dificuldade
            const col1 = grid.createDiv();
            const s1 = new Setting(col1).setName("⚡ Dificuldade").addDropdown(drp => drp
                .addOption("trivial", "👌 Trivial (5 XP)")
                .addOption("facil", "👍 Fácil (15 XP)")
                .addOption("moderado", "💪 Moderado (40 XP)")
                .addOption("desafiador", "🔥 Desafiador (80 XP)")
                .addOption("hardcore", "🏆 Hardcore (150 XP)")
                .setValue(this.result.difficulty)
                .onChange(v => this.result.difficulty = v)
            );
            this.formatGridSetting(s1);

            // Coluna 2: Sessões
            const col2 = grid.createDiv();
            const s2 = new Setting(col2).setName("🍅 Sessões").addText(txt => {
                txt.inputEl.type = "number";
                txt.setValue("1").onChange(v => this.result.sessions = parseInt(v) || 1);
                txt.inputEl.style.width = "100%";
            });
            this.formatGridSetting(s2);

            // Coluna 3: Tipo
            const col3 = grid.createDiv();
            const s3 = new Setting(col3).setName("🌍 Tipo").addDropdown(drp => drp
                .addOption("interna", "👑 Interna")
                .addOption("externa", "💼 Externa")
                .setValue(this.result.soberania)
                .onChange(v => this.result.soberania = v)
            );
            this.formatGridSetting(s3);

            // FOOTER: Botões
            const footer = contentEl.createDiv({ attr: { style: "display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;" } });
            
            const btnCancel = footer.createEl("button", { text: "Cancelar" });
            btnCancel.onclick = () => this.close();

            const btnConfirm = footer.createEl("button", { 
                text: "Finalizar e Inserir", 
                cls: "mod-cta",
                attr: { style: "padding: 8px 20px;" }
            });
            btnConfirm.onclick = () => {
                if (!this.result.name) {
                    new Notice("❌ Nome da task é obrigatório.");
                    return;
                }
                this.onSubmit(this.result);
                this.close();
            };
        }

        formatGridSetting(setting) {
            setting.settingEl.style.flexDirection = "column";
            setting.settingEl.style.alignItems = "flex-start";
            setting.settingEl.style.border = "none";
            setting.settingEl.style.padding = "0";
            setting.controlEl.style.width = "100%";
            setting.infoEl.style.marginBottom = "5px";
        }
    }

    // --- 3. EXECUÇÃO E TRANSFORMAÇÃO ---
    new ProcessarTaskModal(app, async (res) => {
        // Processa as linhas selecionadas: transforma em sub-itens indentados
        const processedLines = selection
            .split("\n")
            .map(line => {
                let content = line.trim();
                if (content.startsWith("- [ ] ") || content.startsWith("- [x] ")) {
                    content = content.substring(6);
                } else if (content.startsWith("- ")) {
                    content = content.substring(2);
                }
                
                // **MUDANÇA AQUI:** A indentação agora é com tab/espaços, sem o '>' do callout.
                return `    - ${content}`; 
            })
            .join("\n");

        // Tags e Sanitização (inalterado)
        const tagDificuldade = `#nivel/dificuldade/${res.difficulty}`;
        const tagSoberania = `#soberania/${res.soberania}`;
        const sanitizar = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/\s+/g, '_').replace(/[^\w-]/g, '');
        const tagHierarquia = contextTag ? `${contextTag}/${sanitizar(res.name)}` : "";

        // --- INÍCIO DA ATUALIZAÇÃO (Sem Callout) ---
        const blockId = ` ^${Math.random().toString(36).substring(2, 8)}`;
        
        // **MUDANÇA AQUI:** Construção do Bloco sem a sintaxe de callout.
        // Apenas a task principal e os sub-itens indentados.
        const finalBlock = `\n- [ ] [🍅:: 0/${res.sessions}] **${res.name}** ${tagHierarquia} ${tagDificuldade} ${tagSoberania}${blockId}\n${processedLines}\n`;
        // --- FIM DA ATUALIZAÇÃO ---

        // Injeta no editor
        editor.replaceSelection(finalBlock);
        new Notice("✅ Task SOTA Processada!");
    }).open();
};