// SOTA - filtrarDashboardProjetos.js v1.1 (Contexto Dinâmico)
// Controlador de Contexto para o Dashboard Central de Projetos.
// Seleciona um Projeto HUB e injeta seu UID no frontmatter do arquivo ativo.

module.exports = async (params) => {
    const { app, quickAddApi: qa, obsidian } = params;
    const { Notice, TFile } = obsidian;
    const dv = app.plugins.plugins["dataview"]?.api;

    if (!dv) {
        new Notice("❌ ERRO: API do Dataview não está disponível.");
        return;
    }

    // --- CONFIGURAÇÃO DINÂMICA DO ARQUIVO MESTRE ---
    // Assume que o botão foi clicado dentro do próprio Dashboard
    const dashboardFile = app.workspace.getActiveFile();

    if (!(dashboardFile instanceof TFile)) {
        new Notice("❌ ERRO CRÍTICO: Nenhum arquivo ativo encontrado.");
        return;
    }

    // Validação de segurança opcional: garantir que é um dashboard de projeto
    const cache = app.metadataCache.getFileCache(dashboardFile);
    if (cache?.frontmatter?.tipo !== 'dashboard_mestre_projetos') {
        console.warn("SOTA AVISO: O arquivo ativo não parece ser um Dashboard de Projetos, mas o script prosseguirá.");
    }

    // --- 1. BUSCAR PROJETOS (HUBS) ---
    // Filtra por tipo 'projeto_hub' e exclui a pasta de templates do backend
    const projetos = dv.pages()
        .where(p => p.tipo === 'projeto_hub' && !p.file.path.includes("99 - BACKEND"))
        .map(p => ({
            label: p.file.name.replace(/^00\. HUB - /, ''), // Remove prefixo para exibição limpa
            uid: p.sota_uid,
            path: p.file.path
        }))
        .values; // Converte DataArray para Array JS nativo

    if (projetos.length === 0) {
        new Notice("ℹ️ Nenhum projeto encontrado no sistema.");
        return;
    }

    // --- 2. SELEÇÃO DO USUÁRIO ---
    const projetoSelecionado = await qa.suggester(
        projetos.map(p => p.label),
        projetos
    );

    if (!projetoSelecionado) return; // Usuário cancelou

    // --- 3. ATUALIZAÇÃO DO ESTADO (FRONTMATTER) ---
    try {
        await app.fileManager.processFrontMatter(dashboardFile, (fm) => {
            fm.projeto_selecionado_uid = projetoSelecionado.uid;
            fm.projeto_selecionado_nome = projetoSelecionado.label;
            
            // Reset opcional de visualização para garantir consistência ao trocar de projeto
            if (!fm.view_mode_esforco_fase) fm.view_mode_esforco_fase = 'column';
        });
    } catch (error) {
        console.error("SOTA: Erro ao atualizar dashboard.", error);
        new Notice("❌ Erro ao atualizar o Dashboard.");
        return;
    }

    // --- 4. REFRESH DA VIEW (PADRÃO SOTA) ---
    setTimeout(() => {
        const activeLeaf = app.workspace.activeLeaf;
        // Se o dashboard já estiver aberto e ativo, força o rebuild
        if (activeLeaf && activeLeaf.view.file && activeLeaf.view.file.path === dashboardFile.path) {
            // Hack seguro para forçar o Dataview a reler o frontmatter
            activeLeaf.rebuildView(); 
        }
        new Notice(`📊 Dashboard carregado: ${projetoSelecionado.label}`);
    }, 200);
};