// SOTA - filtrarDashboardTreinosGrupo.js v1.0
// Seleciona um Grupo Muscular e injeta a view renderGroupDashboard.

module.exports = async (params) => {
    const { app, quickAddApi: qa, obsidian } = params;
    const { Notice } = obsidian;
    const dv = app.plugins.plugins["dataview"]?.api;

    if (!dv) return;

    const dashboardFile = app.workspace.getActiveFile();
    if (!dashboardFile || dashboardFile.basename !== "06 - Central de Treinos") {
        new Notice("⚠️ Execute a partir da Central de Treinos.");
        return;
    }

    const grupos = dv.pages('"04 - Corpo & Movimento/01 - Exercícios Físicos/01. Manual/Grupos Musculares"')
        .map(p => ({ label: p.file.name, id: p.grupo_muscular_id }))
        .values;
    
    if (grupos.length === 0) { new Notice("Nenhum grupo encontrado."); return; }
    
    const itemSelecionado = await qa.suggester(grupos.map(g => g.label), grupos);
    if (!itemSelecionado) return;

    const novoConteudo = `## 🧬 Análise de Grupo: ${itemSelecionado.label}

\`\`\`dataviewjs
await dv.view("99 - BACKEND/Scripts/Views/Exercicios/renderGroupDashboard", { 
    grupo_id: "${itemSelecionado.id}" 
});
\`\`\`
`;

    // Atualiza Frontmatter
    await app.fileManager.processFrontMatter(dashboardFile, (fm) => {
        fm.visao_atual = 'grupo';
        fm.filtro_id = itemSelecionado.id;
        fm.filtro_nome = itemSelecionado.label;
    });

    // Injeta View
    let content = await app.vault.read(dashboardFile);
    const START = "<!-- START_DYNAMIC_CONTENT -->";
    const END = "<!-- END_DYNAMIC_CONTENT -->";
    const regex = new RegExp(`${START}[\\s\\S]*?${END}`);
    
    await app.vault.modify(dashboardFile, content.replace(regex, `${START}\n\n${novoConteudo}\n\n${END}`));
    new Notice(`✅ Grupo Selecionado: ${itemSelecionado.label}`);
};