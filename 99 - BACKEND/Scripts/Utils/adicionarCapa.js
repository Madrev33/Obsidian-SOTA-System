// SOTA - adicionarCapa.js v1.2 (Force Path & Rename)
// Força o salvamento no caminho específico com nome timestamped, ignorando configurações globais.

module.exports = async (params) => {
    const { app, obsidian } = params;
    const { Notice, moment } = obsidian;

    // --- CONFIGURAÇÃO (CAMINHO EXATO) ---
    // Nota: O Obsidian aceita espaços e &, mas deve ser exato.
    const TARGET_FOLDER = "99 - BACKEND/Imagens & Videos/Capas_Midias";

    const activeFile = app.workspace.getActiveFile();
    if (!activeFile) {
        new Notice("❌ Nenhuma nota ativa.");
        return;
    }

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.style.display = "none";
    fileInput.accept = "image/*";
    document.body.appendChild(fileInput);

    fileInput.onchange = async (e) => {
        if (!e.target.files || e.target.files.length === 0) {
            document.body.removeChild(fileInput);
            return;
        }

        const file = e.target.files[0];
        
        try {
            // 1. Garante a existência da pasta (Recursivo não é necessário se criarmos direto, mas verificação é bom)
            const folderExists = await app.vault.adapter.exists(TARGET_FOLDER);
            if (!folderExists) {
                await app.vault.createFolder(TARGET_FOLDER);
            }

            // 2. Construção do Novo Nome (Timestamp + Sanitizado)
            const timestamp = moment().format("YYYYMMDD-HHmmss");
            
            // Separa nome e extensão
            const lastDotIndex = file.name.lastIndexOf('.');
            const namePart = lastDotIndex !== -1 ? file.name.substring(0, lastDotIndex) : file.name;
            const extPart = lastDotIndex !== -1 ? file.name.substring(lastDotIndex + 1) : "jpg";

            // Sanitiza o nome (remove tudo que não for letra, numero, hifen)
            const cleanName = namePart
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove acentos
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "-") // Troca símbolos/espaços por hifens
                .replace(/-+/g, "-"); // Remove hifens duplicados

            const finalFileName = `${timestamp}-${cleanName}.${extPart}`;
            
            // 3. Caminho Completo (Hardcoded para garantir)
            const fullPath = `${TARGET_FOLDER}/${finalFileName}`;

            // 4. Leitura e Gravação
            const buffer = await file.arrayBuffer();
            
            // createBinary força a criação no caminho exato especificado
            const newFile = await app.vault.createBinary(fullPath, buffer);

            // 5. Atualização do Frontmatter
            const wikilink = `[[${newFile.path}]]`;
            
            await app.fileManager.processFrontMatter(activeFile, (fm) => {
                fm.capa = wikilink;
            });

            new Notice(`✅ Capa salva em: ${TARGET_FOLDER}`);

            // 6. Refresh
            setTimeout(() => app.workspace.trigger("dataview:refresh-views"), 200);

        } catch (error) {
            console.error("Erro adicionarCapa:", error);
            new Notice(`❌ Erro: ${error.message}`);
        } finally {
            document.body.removeChild(fileInput);
        }
    };

    fileInput.click();
};