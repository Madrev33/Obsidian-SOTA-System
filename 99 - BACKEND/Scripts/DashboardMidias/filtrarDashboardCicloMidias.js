// SOTA - filtrarDashboardCicloMidias.js v1.1 (Contexto Dinâmico)
// Lê a mídia ativa no arquivo atual e permite selecionar entre os ciclos disponíveis.

module.exports = async (params) => {
    const { app, quickAddApi: qa, obsidian } = params;
    const { Notice, TFile } = obsidian;
    const dv = app.plugins.plugins["dataview"]?.api;

    if (!dv) {
        new Notice("❌ ERRO: API do Dataview não está disponível.");
        return;
    }

    // --- CONFIGURAÇÃO DINÂMICA ---
    const dashboardFile = app.workspace.getActiveFile();

    if (!(dashboardFile instanceof TFile)) {
        new Notice(`❌ ERRO: Nenhum arquivo ativo encontrado.`);
        return;
    }

    // 1. Ler o estado atual do Dashboard (Frontmatter do arquivo ativo)
    // Usamos o cache do Obsidian para leitura síncrona e rápida do estado atual
    const cache = app.metadataCache.getFileCache(dashboardFile);
    const fm = cache?.frontmatter;
    
    const idMidia = fm?.midia_selecionada_id;
    const nomeMidia = fm?.midia_selecionada_nome;

    if (!idMidia) {
        new Notice("⚠️ Nenhuma mídia selecionada no dashboard. Selecione uma mídia primeiro.");
        return;
    }

    // 2. Encontrar o HUB correspondente
    const hub = dv.pages().where(p => p.id_midia === idMidia)[0];

    if (!hub) {
        new Notice(`❌ ERRO: HUB para a mídia "${nomeMidia}" (ID: ${idMidia}) não encontrado.`);
        return;
    }

    // 3. Construir opções de ciclo
    const opcoesCiclo = ["Visão Agregada (Todos os Ciclos)"];
    
    if (hub.ciclos && Array.isArray(hub.ciclos) && hub.ciclos.length > 0) {
        const ciclosOrdenados = hub.ciclos.sort((a, b) => a.ciclo - b.ciclo);
        ciclosOrdenados.forEach(c => {
            opcoesCiclo.push(`Ciclo ${c.ciclo}`);
        });
    } else {
        opcoesCiclo.push("Ciclo 1");
    }

    // 4. Solicitar escolha do usuário
    const escolhaCiclo = await qa.suggester(opcoesCiclo, opcoesCiclo);
    if (!escolhaCiclo) return;

    // 5. Atualizar Dashboard
    try {
        await app.fileManager.processFrontMatter(dashboardFile, (fm) => {
            fm.ciclo_selecionado_view = escolhaCiclo;
        });
    } catch (e) {
        console.error("SOTA: Erro ao atualizar ciclo.", e);
        return;
    }

    // 6. Refresh na View
    setTimeout(() => {
        const activeLeaf = app.workspace.activeLeaf;
        if (activeLeaf && activeLeaf.view.file && activeLeaf.view.file.path === dashboardFile.path) {
            activeLeaf.rebuildView();
        }
    }, 200);

    new Notice(`🔄 Visualização alternada para: ${escolhaCiclo}`);
};