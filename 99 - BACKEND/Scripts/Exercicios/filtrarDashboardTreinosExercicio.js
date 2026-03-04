// SOTA - filtrarDashboardTreinosExercicio.js v1.0
// Seleciona um Exercício Específico e injeta a view renderExerciseDashboard.

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

    const exercicios = dv.pages('"04 - Corpo & Movimento/01 - Exercícios Físicos/01. Manual/Exercícios"')
        .map(p => ({ 
            label: p.file.name, 
            id: p.exercicio_id, 
            metrica: p.tipo_metrica || 'reps' 
        }))
        .values;

    if (exercicios.length === 0) { new Notice("Nenhum exercício encontrado."); return; }

    const itemSelecionado = await qa.suggester(exercicios.map(e => e.label), exercicios);
    if (!itemSelecionado) return;

    const novoConteudo = `## 🏋️‍♂️ Deep Dive: ${itemSelecionado.label}

\`\`\`dataviewjs
await dv.view("99 - BACKEND/Scripts/Views/Exercicios/renderExerciseDashboard", { 
    exercicio_id: "${itemSelecionado.id}",
    tipo_metrica: "${itemSelecionado.metrica}"
});
\`\`\`
`;

    // Atualiza Frontmatter
    await app.fileManager.processFrontMatter(dashboardFile, (fm) => {
        fm.visao_atual = 'exercicio';
        fm.filtro_id = itemSelecionado.id;
        fm.filtro_nome = itemSelecionado.label;
    });

    // Injeta View
    let content = await app.vault.read(dashboardFile);
    const START = "<!-- START_DYNAMIC_CONTENT -->";
    const END = "<!-- END_DYNAMIC_CONTENT -->";
    const regex = new RegExp(`${START}[\\s\\S]*?${END}`);
    
    await app.vault.modify(dashboardFile, content.replace(regex, `${START}\n\n${novoConteudo}\n\n${END}`));
    new Notice(`✅ Exercício Selecionado: ${itemSelecionado.label}`);
};