// 99 - BACKEND/Scripts/Views/Analiticos/filtrarPeriodoRevisao.js
// SOTA v1.0 - Seletor de Range Temporal
// Atualiza o frontmatter do Dashboard com start_date e end_date.

module.exports = async (params) => {
    const { app, quickAddApi: qa, obsidian } = params;
    const { Notice, TFile } = obsidian;
    const moment = window.moment;

    const dashboardFile = app.workspace.getActiveFile();
    if (!dashboardFile) return;

    // Opções de Período
    const opcoes = {
        "📅 Esta Semana": "week_current",
        "⏮️ Semana Passada": "week_last",
        "🗓️ Este Mês": "month_current",
        "⏪ Mês Passado": "month_last",
        "📆 Este Ano": "year_current",
        "⚙️ Customizado...": "custom"
    };

    const escolha = await qa.suggester(Object.keys(opcoes), Object.values(opcoes));
    if (!escolha) return;

    let startDate, endDate;
    let labelPeriodo = "";

    // Lógica de Datas
    if (escolha === "custom") {
        const inputStart = await qa.inputPrompt("Data Início (YYYY-MM-DD):");
        if (!inputStart) return;
        const inputEnd = await qa.inputPrompt("Data Fim (YYYY-MM-DD):", moment().format("YYYY-MM-DD"), moment().format("YYYY-MM-DD"));
        if (!inputEnd) return;

        startDate = moment(inputStart);
        endDate = moment(inputEnd);
        labelPeriodo = "Customizado";
    } else {
        const hoje = moment();
        
        switch (escolha) {
            case "week_current":
                startDate = hoje.clone().startOf('isoWeek');
                endDate = hoje.clone().endOf('isoWeek');
                labelPeriodo = "Esta Semana";
                break;
            case "week_last":
                startDate = hoje.clone().subtract(1, 'weeks').startOf('isoWeek');
                endDate = hoje.clone().subtract(1, 'weeks').endOf('isoWeek');
                labelPeriodo = "Semana Passada";
                break;
            case "month_current":
                startDate = hoje.clone().startOf('month');
                endDate = hoje.clone().endOf('month');
                labelPeriodo = "Este Mês";
                break;
            case "month_last":
                startDate = hoje.clone().subtract(1, 'months').startOf('month');
                endDate = hoje.clone().subtract(1, 'months').endOf('month');
                labelPeriodo = "Mês Passado";
                break;
            case "year_current":
                startDate = hoje.clone().startOf('year');
                endDate = hoje.clone().endOf('year');
                labelPeriodo = "Este Ano";
                break;
        }
    }

    if (!startDate.isValid() || !endDate.isValid()) {
        new Notice("❌ Datas inválidas.");
        return;
    }

    // Atualização do Frontmatter
    await app.fileManager.processFrontMatter(dashboardFile, (fm) => {
        fm.start_date = startDate.format("YYYY-MM-DD");
        fm.end_date = endDate.format("YYYY-MM-DD");
        fm.periodo_label = labelPeriodo;
    });

    // Refresh
    // 4. REFRESH DA VIEW (PADRÃO SOTA DE REBUILD)
    setTimeout(() => {
        const activeLeaf = app.workspace.activeLeaf;
        
        // Se o dashboard já estiver aberto e ativo, força o rebuild da view
        if (activeLeaf && activeLeaf.view.file && activeLeaf.view.file.path === dashboardFile.path) {
            // Hack seguro para forçar o Obsidian a recarregar a visualização do arquivo
            // Isso garante que o Dataview leia o novo frontmatter imediatamente
            activeLeaf.rebuildView();
        }
        
        new Notice(`🗓️ Período definido: ${startDate.format("DD/MM")} a ${endDate.format("DD/MM")}`);
    }, 200);
};