// SOTA - anexarMidiaGaleria.js v1.2 (Targeted Path)
// Renomeia a mídia com timestamp e salva em pasta centralizada.

module.exports = async (params) => {
    const { app, obsidian } = params;
    const { Notice, moment } = obsidian; 

    // --- CONFIGURAÇÃO DO CAMINHO ---
    const TARGET_PATH = "99 - BACKEND/Imagens & Videos/Galerias_Diarias";

    const activeFile = app.workspace.getActiveFile();
    if (!activeFile) { new Notice("❌ Nenhuma nota ativa."); return; }

    // Cria o input de arquivo invisível
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.style.display = "none";
    fileInput.accept = "image/*,video/*";
    document.body.appendChild(fileInput);

    fileInput.onchange = async (e) => {
        if (e.target.files.length === 0) {
            document.body.removeChild(fileInput);
            return;
        }

        const file = e.target.files[0];
        
        try {
            // --- INÍCIO DA LÓGICA DE RENOMEAÇÃO ---

            // 1. Gera o timestamp
            const timestamp = moment().format("YYYYMMDD-HHmmss");

            // 2. Sanitiza o nome original do arquivo
            const originalName = file.name;
            const extension = originalName.split('.').pop();
            const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));
            
            const sanitizedName = nameWithoutExt
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase()
                .replace(/[^a-z0-9_.-]/g, '-')
                .replace(/-+/g, '-');
                
            // 3. Monta o novo nome completo
            const newFileName = `${timestamp}-midia-${sanitizedName}.${extension}`;
            
            // --- FIM DA LÓGICA DE RENOMEAÇÃO ---

            // 4. Salva o arquivo no cofre no CAMINHO ESPECÍFICO
            
            // Garante que a pasta existe
            if (!(await app.vault.adapter.exists(TARGET_PATH))) {
                await app.vault.createFolder(TARGET_PATH);
            }

            // Define o caminho completo
            const attachmentPath = `${TARGET_PATH}/${newFileName}`;
            
            const buffer = await file.arrayBuffer();
            const newFile = await app.vault.createBinary(attachmentPath, buffer);

            // 5. Adiciona ao Frontmatter
            await app.fileManager.processFrontMatter(activeFile, (fm) => {
                if (!fm.galeria_midia) fm.galeria_midia = [];
                fm.galeria_midia.push(newFile.path);
            });

            new Notice(`📸 Mídia adicionada: ${newFile.basename}`);
            
            // Refresh
            setTimeout(() => app.workspace.trigger("dataview:refresh-views"), 500);

        } catch (error) {
            console.error("Erro no upload SOTA:", error);
            new Notice("❌ Erro ao salvar mídia. Verifique se o arquivo já existe.");
        } finally {
            document.body.removeChild(fileInput);
        }
    };

    fileInput.click();
};