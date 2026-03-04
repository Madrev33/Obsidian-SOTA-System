// SOTA - registrarMedidasCorporais.js v2.2 (Dynamic Height Update)
// Script QuickAdd para coletar medidas antropométricas, fotos e ATUALIZAR ALTURA no Perfil.

module.exports = async (params) => {
    const { app, quickAddApi: qa, obsidian } = params;
    const { Notice, Modal, Setting, ButtonComponent, TextComponent, moment } = obsidian;

    // --- CONFIGURAÇÃO ---
    const config = {
        log_path: "99 - BACKEND/Logs_Metricas/Exercicios/body_measures_log.md",
        fotos_folder: "04 - Corpo & Movimento/01 - Exercícios Físicos/04. Corpo Evolução (Fotos)",
        // Chaves para encontrar o arquivo de Perfil
        perfil_frontmatter_key: "tipo",
        perfil_frontmatter_value: "dashboard_perfil"
    };

    // --- 1. INJEÇÃO DE ESTILOS CSS ---
    const existingStyle = document.getElementById('sota-body-measures-styles');
    if (existingStyle) existingStyle.remove();

    const style = document.createElement('style');
    style.id = 'sota-body-measures-styles';
    style.innerHTML = `
        .sota-modal-container { padding: 0 20px 20px 20px; }
        .sota-header { text-align: center; margin-bottom: 25px; font-size: 1.5em; font-weight: 700; color: var(--text-normal); }
        .sota-section-title { font-size: 0.9em; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid var(--background-modifier-border); padding-bottom: 5px; }
        .sota-grid-2-col { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .sota-input-wrapper { display: flex; flex-direction: column; gap: 5px; }
        .sota-label { font-size: 0.85em; color: var(--text-normal); }
        .sota-input-field input { width: 100%; background-color: var(--background-primary); border: 1px solid var(--background-modifier-border); border-radius: 4px; padding: 6px 10px; }
        .sota-input-field input:focus { border-color: var(--interactive-accent); box-shadow: 0 0 0 2px rgba(var(--interactive-accent-rgb), 0.2); }
        .sota-footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid var(--background-modifier-border); display: flex; justify-content: flex-end; gap: 10px; }
        /* NOVO ESTILO PARA FEEDBACK VISUAL */
        .sota-photo-feedback { font-size: 0.9em; color: var(--text-muted); font-style: italic; margin-left: 10px; }
        @media (max-width: 600px) { .sota-grid-2-col { grid-template-columns: 1fr; } }
    `;
    document.head.appendChild(style);

    // --- 2. FUNÇÕES AUXILIARES ---
    
    // Retorna o objeto TFile do Perfil para que possamos editá-lo depois
    const getPerfilFile = () => {
        const files = app.vault.getMarkdownFiles();
        return files.find(f => {
            const cache = app.metadataCache.getFileCache(f);
            return cache?.frontmatter?.[config.perfil_frontmatter_key] === config.perfil_frontmatter_value;
        });
    };

    const buscarAlturaUsuario = async () => {
        const perfilFile = getPerfilFile();
        if (perfilFile) {
            const cache = app.metadataCache.getFileCache(perfilFile);
            return cache?.frontmatter?.altura_cm || null;
        }
        return null;
    };

    // --- 3. CLASSE DO MODAL ---
    class BodyMeasuresModal extends Modal {
        constructor(app, alturaUsuario) {
            super(app);
            this.alturaOriginal = alturaUsuario; // Guarda o original para comparar
            this.alturaAtual = alturaUsuario;    // Estado local mutável
            
            this.data = {
                peso: "", pescoco: "", peitoral: "", cintura: "", quadril: "",
                braco_d: "", braco_e: "", coxa_d: "", coxa_e: "",
                panturrilha_d: "", panturrilha_e: "",
                fotos: [] 
            };
        }

        onOpen() {
            const { contentEl } = this;
            contentEl.empty();
            contentEl.addClass("sota-modal-container");
            this.modalEl.style.width = "600px";
            this.modalEl.style.maxWidth = "95vw";

            contentEl.createDiv({ cls: "sota-header", text: "📏 Registro de Medidas Corporais" });
            
            this.renderAllInputs(contentEl);

            const footer = contentEl.createDiv({ cls: "sota-footer" });
            new ButtonComponent(footer).setButtonText("Cancelar").onClick(() => this.close());
            new ButtonComponent(footer).setButtonText("💾 Salvar Medidas").setCta().onClick(() => this.salvar());
        }
        
        renderAllInputs(contentEl) {
            contentEl.createDiv({ cls: "sota-section-title", text: "Métricas Principais" });
            const gridPrincipal = contentEl.createDiv({ cls: "sota-grid-2-col" });
            
            this.createInput(gridPrincipal, "Peso (kg)", "Ex: 75.5", (v) => this.data.peso = v);
            
            // --- CAMPO DE ALTURA EDITÁVEL ---
            const alturaDisplay = gridPrincipal.createDiv({ cls: "sota-input-wrapper" });
            alturaDisplay.createDiv({ cls: "sota-label", text: "Altura (cm)" });
            const alturaInput = new TextComponent(alturaDisplay);
            alturaInput.inputEl.className = "sota-input-field";
            alturaInput.inputEl.type = "number";
            
            // Valor inicial (removemos " cm" para ser numérico puro)
            alturaInput.setValue(this.alturaAtual ? this.alturaAtual.toString() : "");
            
            // Agora é editável!
            alturaInput.onChange(v => this.alturaAtual = v);
            
            contentEl.createDiv({ cls: "sota-section-title", text: "Tronco" });
            const gridTronco = contentEl.createDiv({ cls: "sota-grid-2-col" });
            this.createInput(gridTronco, "Pescoço (cm)", "Ex: 38", (v) => this.data.pescoco = v);
            this.createInput(gridTronco, "Peitoral (cm)", "Ex: 102", (v) => this.data.peitoral = v);
            this.createInput(gridTronco, "Cintura (Umbigo) (cm)", "Ex: 85", (v) => this.data.cintura = v);
            this.createInput(gridTronco, "Quadril (Maior) (cm)", "Ex: 100", (v) => this.data.quadril = v);

            contentEl.createDiv({ cls: "sota-section-title", text: "Membros Superiores" });
            const gridBracos = contentEl.createDiv({ cls: "sota-grid-2-col" });
            this.createInput(gridBracos, "Braço Direito (cm)", "Ex: 36.5", (v) => this.data.braco_d = v);
            this.createInput(gridBracos, "Braço Esquerdo (cm)", "Ex: 36.0", (v) => this.data.braco_e = v);

            contentEl.createDiv({ cls: "sota-section-title", text: "Membros Inferiores" });
            const gridPernas = contentEl.createDiv({ cls: "sota-grid-2-col" });
            this.createInput(gridPernas, "Coxa Direita (cm)", "Ex: 58", (v) => this.data.coxa_d = v);
            this.createInput(gridPernas, "Coxa Esquerda (cm)", "Ex: 58", (v) => this.data.coxa_e = v);
            this.createInput(gridPernas, "Panturrilha Dir. (cm)", "Ex: 39", (v) => this.data.panturrilha_d = v);
            this.createInput(gridPernas, "Panturrilha Esq. (cm)", "Ex: 39", (v) => this.data.panturrilha_e = v);

            contentEl.createDiv({ cls: "sota-section-title", text: "Registro Visual" });
            const photoSetting = new Setting(contentEl).setName("Adicionar Fotos");
            
            const photoFeedbackEl = photoSetting.controlEl.createSpan({
                cls: "sota-photo-feedback",
                text: "Nenhuma foto adicionada."
            });

            new ButtonComponent(photoSetting.controlEl)
                .setButtonText("Selecionar Fotos")
                .setCta()
                .onClick(() => this.handlePhotoUpload(photoFeedbackEl));
        }

        createInput(container, label, placeholder, onChange) {
            const wrapper = container.createDiv({ cls: "sota-input-wrapper" });
            wrapper.createDiv({ cls: "sota-label", text: label });
            const comp = new TextComponent(wrapper);
            comp.setPlaceholder(placeholder).onChange(onChange);
            comp.inputEl.className = "sota-input-field";
            comp.inputEl.type = "number";
        }

        async handlePhotoUpload(feedbackEl) {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.accept = 'image/*';

            input.onchange = async (e) => {
                const files = e.target.files;
                if (!files || files.length === 0) return;

                new Notice(`⚙️ Processando ${files.length} imagem(ns)...`);

                try {
                    const targetFolder = config.fotos_folder;
                    if (!await app.vault.adapter.exists(targetFolder)) {
                        await app.vault.createFolder(targetFolder);
                    }

                    const dateStr = moment().format("YYYY-MM-DD");
                    
                    const vaultFiles = app.vault.getFiles();
                    const existingToday = vaultFiles.filter(f => f.path.startsWith(targetFolder) && f.basename.startsWith(dateStr)).length;
                    let counter = existingToday + 1;

                    for (const file of files) {
                        const extension = file.name.split('.').pop();
                        const newName = `${dateStr} - ${counter}.${extension}`;
                        const newPath = `${targetFolder}/${newName}`;
                        
                        const arrayBuffer = await file.arrayBuffer();
                        await app.vault.createBinary(newPath, arrayBuffer);
                        
                        this.data.fotos.push(`[[${newPath}]]`);
                        counter++;
                    }

                    const totalFotos = this.data.fotos.length;
                    feedbackEl.setText(`✅ ${totalFotos} foto(s) adicionada(s).`);
                    feedbackEl.style.color = "var(--color-green)";
                    feedbackEl.style.fontStyle = "normal";

                    new Notice(`✅ ${files.length} foto(s) importada(s)!`);

                } catch (err) {
                    console.error("SOTA: Erro no upload de fotos:", err);
                    new Notice("❌ Falha no upload. Verifique o console.");
                }
            };
            input.click();
        }

        async salvar() {
            if (!this.data.peso) { new Notice("⚠️ O campo PESO é obrigatório."); return; }

            // --- LÓGICA DE ATUALIZAÇÃO DA ALTURA ---
            // Verifica se a altura mudou em relação ao original
            if (this.alturaAtual && this.alturaAtual !== this.alturaOriginal) {
                const perfilFile = getPerfilFile();
                if (perfilFile) {
                    try {
                        const novaAltura = parseInt(this.alturaAtual);
                        await app.fileManager.processFrontMatter(perfilFile, (fm) => {
                            fm.altura_cm = novaAltura;
                        });
                        new Notice(`✅ Altura atualizada para ${novaAltura}cm no Perfil!`);
                    } catch (e) {
                        console.error("Erro ao atualizar altura no perfil:", e);
                        new Notice("⚠️ Erro ao salvar altura no Perfil.");
                    }
                } else {
                    new Notice("⚠️ Arquivo de Perfil não encontrado para atualizar altura.");
                }
            }

            let imc = null;
            let rcq = null;

            // Usa this.alturaAtual para o cálculo do IMC
            if (this.data.peso && this.alturaAtual) {
                const peso = parseFloat(this.data.peso);
                const alturaMetros = parseFloat(this.alturaAtual) / 100;
                if (alturaMetros > 0) imc = (peso / (alturaMetros * alturaMetros)).toFixed(2);
            }
            if (this.data.cintura && this.data.quadril) {
                const cintura = parseFloat(this.data.cintura);
                const quadril = parseFloat(this.data.quadril);
                if (quadril > 0) rcq = (cintura / quadril).toFixed(2);
            }

            const agora = moment();
            const dataStr = agora.format("YYYY-MM-DD");
            const horaStr = agora.format("HH:mm");

            let logLine = `- (data::${dataStr}) (hora::${horaStr})`;
            logLine += ` (peso_kg::${this.data.peso})`;
            if (imc) logLine += ` (imc_calculado::${imc})`;
            if (rcq) logLine += ` (rcq_calculado::${rcq})`;
            if (this.data.pescoco) logLine += ` (pescoco_cm::${this.data.pescoco})`;
            if (this.data.peitoral) logLine += ` (peitoral_cm::${this.data.peitoral})`;
            if (this.data.cintura) logLine += ` (cintura_cm::${this.data.cintura})`;
            if (this.data.quadril) logLine += ` (quadril_cm::${this.data.quadril})`;
            if (this.data.braco_d) logLine += ` (braco_d_cm::${this.data.braco_d})`;
            if (this.data.braco_e) logLine += ` (braco_e_cm::${this.data.braco_e})`;
            if (this.data.coxa_d) logLine += ` (coxa_d_cm::${this.data.coxa_d})`;
            if (this.data.coxa_e) logLine += ` (coxa_e_cm::${this.data.coxa_e})`;
            if (this.data.panturrilha_d) logLine += ` (panturrilha_d_cm::${this.data.panturrilha_d})`;
            if (this.data.panturrilha_e) logLine += ` (panturrilha_e_cm::${this.data.panturrilha_e})`;
            
            if (this.data.fotos.length > 0) logLine += ` (foto_path::"${this.data.fotos.join(" ")}")`;

            try {
                const folderPath = config.log_path.substring(0, config.log_path.lastIndexOf("/"));
                if (!await app.vault.adapter.exists(folderPath)) await app.vault.createFolder(folderPath);

                const logFile = app.vault.getAbstractFileByPath(config.log_path);
                if (logFile instanceof obsidian.TFile) {
                    await app.vault.append(logFile, `\n${logLine}`);
                } else {
                    await app.vault.create(config.log_path, `# Log de Medidas Corporais\n\n${logLine}`);
                }
                new Notice(`✅ Medidas de ${dataStr} salvas com sucesso!`);
                this.close();
            } catch (error) {
                console.error("SOTA: Erro ao salvar medidas corporais.", error);
                new Notice("❌ Erro ao salvar. Verifique o console.");
            }
        }
    }

    // --- 4. EXECUÇÃO ---
    try {
        const altura = await buscarAlturaUsuario();
        // Não mostra aviso de "altura não encontrada" se for null, 
        // pois o usuário agora pode preencher no modal.
        new BodyMeasuresModal(app, altura).open();
    } catch (e) {
        console.error("SOTA: Erro ao iniciar modal de medidas.", e);
        new Notice("❌ Erro ao abrir o registrador.");
    }
};