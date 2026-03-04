// SOTA - filtrarDashboardEstudos.js v1.1 (Contexto Dinâmico)
// Controlador de Contexto para o Dashboard Central de Estudos.
// Seleciona um Estudo HUB e injeta seu UID no frontmatter do arquivo ativo.

module.exports = async (params) => {
    const { app, quickAddApi: qa, obsidian } = params;
    const { Notice, TFile } = obsidian;
    const dv = app.plugins.plugins["dataview"]?.api;

    if (!dv) {
        new Notice("❌ ERRO: API do Dataview não está disponível.");
        return;
    }

    // --- CONFIGURAÇÃO DINÂMICA DO ARQUIVO MESTRE ---
    const dashboardFile = app.workspace.getActiveFile();

    if (!(dashboardFile instanceof TFile)) {
        new Notice("❌ ERRO CRÍTICO: Nenhum arquivo ativo encontrado.");
        return;
    }

    // Validação de segurança opcional
    const cache = app.metadataCache.getFileCache(dashboardFile);
    if (cache?.frontmatter?.tipo !== 'dashboard_mestre_estudos') {
        console.warn("SOTA AVISO: O arquivo ativo não parece ser um Dashboard de Estudos, mas o script prosseguirá.");
    }

    // --- 1. BUSCAR ESTUDOS (HUBS) ---
    // Filtra por tipo 'estudo_hub' e exclui a pasta de templates do backend
    const estudos = dv.pages()
        .where(p => p.tipo === 'estudo_hub' && !p.file.path.includes("99 - BACKEND"))
        .map(p => ({
            // Remove o prefixo padrão "00. HUB - " para uma lista de seleção mais limpa
            label: p.file.name.replace(/^00\. HUB - /, ''),
            uid: p.sota_uid,
            path: p.file.path
        }))
        .values;

    if (estudos.length === 0) {
        new Notice("ℹ️ Nenhum estudo encontrado no sistema.");
        return;
    }

    // --- 2. SELEÇÃO DO USUÁRIO ---
    const estudoSelecionado = await qa.suggester(
        estudos.map(e => e.label),
        estudos
    );

    if (!estudoSelecionado) return; // Usuário cancelou

    // --- 3. ATUALIZAÇÃO DO ESTADO (FRONTMATTER) ---
    try {
        await app.fileManager.processFrontMatter(dashboardFile, (fm) => {
            fm.estudo_selecionado_uid = estudoSelecionado.uid;
            fm.estudo_selecionado_nome = estudoSelecionado.label;
            
            // Inicializa visualizações padrão se não existirem
            if (!fm.view_mode_distribuicao_fontes) fm.view_mode_distribuicao_fontes = 'column';
        });
    } catch (error) {
        console.error("SOTA: Erro ao atualizar dashboard de estudos.", error);
        new Notice("❌ Erro ao atualizar o Dashboard.");
        return;
    }

    // --- 4. REFRESH DA VIEW (PADRÃO SOTA) ---
    setTimeout(() => {
        const activeLeaf = app.workspace.activeLeaf;
        
        // Se o dashboard já estiver aberto e ativo, força o rebuild da view
        if (activeLeaf && activeLeaf.view.file && activeLeaf.view.file.path === dashboardFile.path) {
            activeLeaf.rebuildView();
        }
        
        new Notice(`📚 Dashboard carregado: ${estudoSelecionado.label}`);
    }, 200);
};