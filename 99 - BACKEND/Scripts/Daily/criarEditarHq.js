// SOTA - criarEditarHq.js v1.1 (Multi-select & Centralized Path)
// Estúdio de HQ com upload de múltiplos arquivos e salvamento em pasta dedicada.

module.exports = async (params) => {
    const { app, obsidian } = params;
    const { Modal, Notice, moment } = obsidian;

    // --- PASTA DE DESTINO CENTRALIZADA ---
    const HQ_IMAGES_PATH = "99 - BACKEND/Imagens & Videos/HQ Imagens";

    class HqStudioModal extends Modal {
        constructor(app, file) {
            super(app);
            this.file = file;
            this.pages = [];
            this.coverId = null;
        }

        onOpen() {
            const { contentEl } = this;
            contentEl.empty();
            contentEl.addClass("sota-hq-modal");
            this.modalEl.style.width = "80vw";
            this.modalEl.style.maxWidth = "900px";

            // Estilos (sem alterações)
            const style = document.createElement('style');
            style.textContent = `
                .sota-hq-modal .modal-content { padding: 0; }
                .sota-hq-header { padding: 20px; text-align: center; font-size: 1.5em; font-weight: 700; border-bottom: 1px solid var(--background-modifier-border); }
                .sota-hq-body { padding: 20px; }
                .sota-hq-dropzone { border: 2px dashed var(--background-modifier-border); border-radius: 12px; padding: 40px; text-align: center; color: var(--text-muted); cursor: pointer; transition: all 0.2s; }
                .sota-hq-dropzone:hover { border-color: var(--interactive-accent); background: var(--background-secondary); }
                .sota-hq-preview-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 15px; margin-top: 20px; }
                .sota-preview-card { position: relative; aspect-ratio: 3/4; background: var(--background-secondary); border-radius: 8px; overflow: hidden; border: 2px solid transparent; cursor: grab; }
                .sota-preview-card.is-cover { border-color: var(--interactive-accent); box-shadow: 0 0 10px var(--interactive-accent); }
                .sota-preview-card img { width: 100%; height: 100%; object-fit: cover; }
                .sota-card-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent 60%); display: flex; flex-direction: column; justify-content: flex-end; padding: 8px; opacity: 0; transition: opacity 0.2s; }
                .sota-preview-card:hover .sota-card-overlay { opacity: 1; }
                .sota-card-actions { display: flex; justify-content: space-around; }
                .sota-card-btn { color: white; cursor: pointer; padding: 4px; background: rgba(0,0,0,0.5); border-radius: 50%; }
                .sota-card-btn:hover { color: var(--interactive-accent); }
                .sota-hq-footer { padding: 20px; border-top: 1px solid var(--background-modifier-border); display: flex; justify-content: flex-end; gap: 10px; }
            `;
            contentEl.appendChild(style);
            
            contentEl.createDiv({ cls: "sota-hq-header", text: "Estúdio de HQ do Dia" });
            const body = contentEl.createDiv({ cls: "sota-hq-body" });
            
            const dropzone = body.createDiv({ cls: "sota-hq-dropzone" });
            dropzone.innerHTML = "Arraste as imagens aqui ou <b>clique para selecionar</b>";
            
            // --- ATUALIZAÇÃO: multiple: true ---
            const fileInput = dropzone.createEl("input", { type: "file", multiple: true, accept: "image/*", style: "display: none;" });
            
            dropzone.onclick = () => fileInput.click();
            fileInput.onchange = (e) => this.handleFiles(e.target.files);
            
            // Drag & Drop
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                dropzone.addEventListener(eventName, (e) => { e.preventDefault(); e.stopPropagation(); }, false);
                document.body.addEventListener(eventName, (e) => { e.preventDefault(); e.stopPropagation(); }, false);
            });
            dropzone.addEventListener('drop', (e) => this.handleFiles(e.dataTransfer.files), false);

            this.previewGrid = body.createDiv({ cls: "sota-hq-preview-grid" });

            // Footer
            const footer = contentEl.createDiv({ cls: "sota-hq-footer" });
            new obsidian.ButtonComponent(footer).setButtonText("Cancelar").onClick(() => this.close());
            new obsidian.ButtonComponent(footer).setButtonText("Salvar HQ").setCta().onClick(() => this.saveHq());
        }

        handleFiles(files) {
            for (const file of files) {
                if (!file.type.startsWith('image/')) continue;
                
                const pageData = {
                    file: file,
                    id: `page-${Math.random().toString(36).substr(2, 9)}`,
                    objectUrl: URL.createObjectURL(file)
                };
                this.pages.push(pageData);
            }
            if(this.pages.length > 0 && !this.coverId) {
                this.coverId = this.pages[0].id;
            }
            this.renderPreviews();
        }

        renderPreviews() {
            this.previewGrid.empty();
            
            this.pages.forEach((page, index) => {
                const card = this.previewGrid.createDiv({ cls: `sota-preview-card ${page.id === this.coverId ? 'is-cover' : ''}` });
                card.draggable = true;
                card.dataset.id = page.id;

                card.innerHTML = `
                    <img src="${page.objectUrl}" alt="Página ${index + 1}">
                    <div class="sota-card-overlay">
                        <div class="sota-card-actions">
                            <span class="sota-card-btn" title="Definir como Capa">👑</span>
                            <span class="sota-card-btn" title="Remover">❌</span>
                        </div>
                    </div>
                `;
                
                // Eventos
                card.querySelector('span[title="Definir como Capa"]').onclick = (e) => { e.stopPropagation(); this.coverId = page.id; this.renderPreviews(); };
                card.querySelector('span[title="Remover"]').onclick = (e) => {
                    e.stopPropagation();
                    this.pages = this.pages.filter(p => p.id !== page.id);
                    if (this.coverId === page.id) this.coverId = this.pages.length > 0 ? this.pages[0].id : null;
                    this.renderPreviews();
                };

                // Drag & Drop
                card.ondragstart = (e) => e.dataTransfer.setData('text/plain', page.id);
                card.ondragover = (e) => e.preventDefault();
                card.ondrop = (e) => {
                    e.preventDefault();
                    const draggedId = e.dataTransfer.getData('text/plain');
                    const droppedOnId = page.id;
                    const draggedIndex = this.pages.findIndex(p => p.id === draggedId);
                    const droppedOnIndex = this.pages.findIndex(p => p.id === droppedOnId);
                    const [draggedItem] = this.pages.splice(draggedIndex, 1);
                    this.pages.splice(droppedOnIndex, 0, draggedItem);
                    this.renderPreviews();
                };
            });
        }

        async saveHq() {
            if (this.pages.length === 0) { new Notice("Adicione pelo menos uma imagem."); return; }
            new Notice("⚙️ Processando e salvando HQ...");

            // --- INÍCIO DA CORREÇÃO ---
            // Pega a data base do nome do arquivo da nota (ex: "2026-01-15")
            const dateFromFile = this.file.basename; 
            // Usa a data do arquivo para criar o título e o timestamp do nome do arquivo
            const timestamp = moment(dateFromFile).format("YYYYMMDD");
            
            const hqData = {
                titulo: `HQ do Dia - ${moment(dateFromFile).format("DD/MM/YYYY")}`,
                capa: "",
                paginas: []
            };

            // --- ATUALIZAÇÃO: Garante que a pasta de destino exista ---
            if (!await this.app.vault.adapter.exists(HQ_IMAGES_PATH)) {
                await this.app.vault.createFolder(HQ_IMAGES_PATH);
            }
            // --------------------------------------------------------

            for (let i = 0; i < this.pages.length; i++) {
                const page = this.pages[i];
                const isCover = page.id === this.coverId;
                
                const originalName = page.file.name.split('.').slice(0, -1).join('.');
                const extension = page.file.name.split('.').pop();
                
                const sanitizedName = originalName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9_.-]/g, '-');
                const newFileName = `${timestamp}-hq-${isCover ? 'capa' : `p${i+1}`}-${sanitizedName}.${extension}`;

                // --- ATUALIZAÇÃO: Usa o caminho centralizado ---
                const attachmentPath = `${HQ_IMAGES_PATH}/${newFileName}`;
                
                // Validação para não sobrescrever
                if (await this.app.vault.adapter.exists(attachmentPath)) {
                    // Adiciona um sufixo aleatório se o arquivo já existir (extremamente raro com timestamp)
                    attachmentPath = `${HQ_IMAGES_PATH}/${timestamp}-hq-${isCover ? 'capa' : `p${i+1}`}-${sanitizedName}-${Math.random().toString(36).substr(2, 5)}.${extension}`;
                }
                
                const buffer = await page.file.arrayBuffer();
                const newFile = await this.app.vault.createBinary(attachmentPath, buffer);

                if (isCover) hqData.capa = newFile.path;
                hqData.paginas.push(newFile.path);
            }

            if(hqData.capa && hqData.paginas.length > 0 && !hqData.paginas.includes(hqData.capa)) {
                 hqData.paginas.unshift(hqData.capa);
            }

            await this.app.fileManager.processFrontMatter(this.file, (fm) => {
                fm.hq_do_dia = hqData;
            });
            
            new Notice("✅ HQ salva com sucesso!");
            this.close();
            setTimeout(() => this.app.workspace.trigger("dataview:refresh-views"), 500);
        }

        onClose() {
            this.contentEl.empty();
            this.pages.forEach(p => URL.revokeObjectURL(p.objectUrl));
        }
    }

    const activeFile = app.workspace.getActiveFile();
    if (activeFile) {
        new HqStudioModal(app, activeFile).open();
    } else {
        new Notice("❌ Abra uma nota diária para criar uma HQ.");
    }
};