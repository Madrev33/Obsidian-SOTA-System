module.exports = async (params) => {
    const { app, quickAddApi: qa, obsidian } = params;
    const { Notice } = obsidian;
    const activeFile = app.workspace.getActiveFile();
    if (!activeFile) return;

    const dv = app.plugins.plugins.dataview?.api;
    
    // 1. Obtém projetos já associados
    const cacheEstudo = app.metadataCache.getFileCache(activeFile);
    const projetosJaAssociados = new Set();
    
    if (cacheEstudo?.frontmatter?.projetos_relacionados) {
        const lista = cacheEstudo.frontmatter.projetos_relacionados;
        if (Array.isArray(lista)) {
            lista.forEach(link => {
                const linkStr = link.toString();
                const match = linkStr.match(/\[\[(.*?)(\|.*)?\]\]/);
                const path = match ? match[1] : linkStr;
                projetosJaAssociados.add(path);
            });
        }
    }

    // 2. Busca Projetos Candidatos
    const projetosCandidatos = dv.pages('"02 - Projetos"')
        .where(p => 
            p.tipo === 'projeto_hub' &&
            // Filtra se o caminho JÁ está na lista de associados
            !projetosJaAssociados.has(p.file.path)
        )
        .map(p => ({ 
            label: p.file.name.replace(/^00\. HUB - /, ''), 
            value: p.file.path 
        }))
        .values;

    if (projetosCandidatos.length === 0) {
        new Notice("ℹ️ Todos os projetos disponíveis já estão associados ou nenhum foi encontrado.");
        return;
    }
    
    const escolhaPath = await qa.suggester(
        projetosCandidatos.map(p => p.label), 
        projetosCandidatos.map(p => p.value)
    );
    
    if (!escolhaPath) return;

    const wikiLink = `[[${escolhaPath}]]`;

    await app.fileManager.processFrontMatter(activeFile, (fm) => {
        if (!fm.projetos_relacionados) fm.projetos_relacionados = [];
        fm.projetos_relacionados.push(wikiLink);
        new Notice(`✅ Projeto associado!`);
    });
    setTimeout(() => app.workspace.trigger("dataview:refresh-views"), 300);
};