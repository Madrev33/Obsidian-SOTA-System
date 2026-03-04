module.exports = async (params) => {
    const { app, quickAddApi: qa, obsidian } = params;
    const { Notice } = obsidian;
    const activeFile = app.workspace.getActiveFile();
    if (!activeFile) return;

    const dv = app.plugins.plugins.dataview?.api;
    if (!dv) { new Notice("Dataview API não encontrada"); return; }

    // 1. Obtém as mídias já associadas do frontmatter
    // Precisamos ler o cache atual para saber o que filtrar
    const cacheEstudo = app.metadataCache.getFileCache(activeFile);
    const midiasJaAssociadas = new Set();
    
    if (cacheEstudo?.frontmatter?.midias_associadas) {
        const lista = cacheEstudo.frontmatter.midias_associadas;
        if (Array.isArray(lista)) {
            lista.forEach(link => {
                // Extrai o caminho limpo se for um link [[Caminho]] ou string
                const linkStr = link.toString();
                const match = linkStr.match(/\[\[(.*?)(\|.*)?\]\]/);
                const path = match ? match[1] : linkStr;
                midiasJaAssociadas.add(path);
            });
        }
    }

    // 2. Busca Mídias Candidatas
    const midiasCandidatas = dv.pages('"03 - Conhecimento/01 - Mídias"')
        .where(p => 
            p.tipo && 
            p.tipo.includes("_hub") && 
            !p.tipo.includes("_temporada_hub") && 
            !p.tipo.includes("_modulo_hub") &&
            // Filtra: O caminho do arquivo NÃO deve estar no Set de já associadas
            !midiasJaAssociadas.has(p.file.path)
        )
        .map(p => ({ 
            label: p.file.name.replace(/^(00\. HUB - |HUB - )/g, ''), 
            value: p.file.path
        }))
        .values;
    
    if (midiasCandidatas.length === 0) {
        new Notice("ℹ️ Todas as mídias disponíveis já estão associadas ou nenhuma foi encontrada.");
        return;
    }
    
    const escolhaPath = await qa.suggester(
        midiasCandidatas.map(m => m.label), 
        midiasCandidatas.map(m => m.value)
    );
    
    if (!escolhaPath) return;

    const wikiLink = `[[${escolhaPath}]]`;

    await app.fileManager.processFrontMatter(activeFile, (fm) => {
        if (!fm.midias_associadas) fm.midias_associadas = [];
        // Adiciona direto, pois já filtramos na entrada
        fm.midias_associadas.push(wikiLink);
        new Notice(`✅ Mídia associada!`);
    });
    setTimeout(() => app.workspace.trigger("dataview:refresh-views"), 300);
};