// 99 - BACKEND/Scripts/Views/DashboardEstudos/renderContributionGraphStudy.js
// SOTA v2.0 - Heatmap Agregado Vivo

async function main() {
    if (!dv) return;
    const hubUID = input.hub_uid;
    const timeframe = input.timeframe || 'month';

    if (!hubUID) { dv.paragraph("⚠️ Selecione um Estudo."); return; }

    const hub = dv.pages().where(p => p.sota_uid === hubUID)[0];
    if (!hub) { dv.paragraph(`❌ HUB não encontrado.`); return; }

    // Coleta Fontes
    const fontes = [];
    const rawMidias = hub.midias_associadas;
    const rawProjetos = hub.projetos_relacionados;
    if (rawMidias) { if (dv.isArray(rawMidias)) fontes.push(...rawMidias); else fontes.push(rawMidias); }
    if (rawProjetos) { if (dv.isArray(rawProjetos)) fontes.push(...rawProjetos); else fontes.push(rawProjetos); }

    if (fontes.length === 0) {
        dv.paragraph("<small>Sem fontes associadas.</small>");
        return;
    }

    const sessoesPorDia = {}; // { "YYYY-MM-DD": minutos_totais }
    let maxDateFound = null;

    // Agregação
    for (const link of fontes) {
        const path = link.path;
        const fonteFile = app.vault.getAbstractFileByPath(path);
        
        if (fonteFile) {
            const cacheFonte = app.metadataCache.getFileCache(fonteFile);
            const idFonte = cacheFonte?.frontmatter?.id_midia || cacheFonte?.frontmatter?.id_projeto;
            const tipoFonte = cacheFonte?.frontmatter?.tipo;

            if (idFonte && tipoFonte) {
                let pastaTipo = "Outros";
                if (tipoFonte.includes("livro")) pastaTipo = "Livros";
                else if (tipoFonte.includes("curso")) pastaTipo = "Cursos";
                else if (tipoFonte.includes("serie")) pastaTipo = "Series";
                else if (tipoFonte.includes("filme")) pastaTipo = "Filmes";
                else if (tipoFonte.includes("documentario")) pastaTipo = "Documentarios";
                else if (tipoFonte.includes("podcast")) pastaTipo = "Podcasts";
                else if (tipoFonte.includes("artigo")) pastaTipo = "Artigos";
                else if (tipoFonte.includes("video")) pastaTipo = "Videos";
                else if (tipoFonte.includes("projeto")) pastaTipo = "Projetos";
                else if (tipoFonte.includes("jogo")) pastaTipo = "Jogos";
                else if (tipoFonte.includes("documentacao")) pastaTipo = "Documentacoes";

                const logPath = `99 - BACKEND/Logs_Metricas/${pastaTipo}/${idFonte}/raw_logs.md`;
                const logFile = app.vault.getAbstractFileByPath(logPath);

                if (logFile) {
                    const content = await app.vault.cachedRead(logFile);
                    const lines = content.split('\n');
                    for (const line of lines) {
                        if (line.includes("sessao_fim::WORK")) {
                            const duracao = parseInt(line.match(/\(duracao_total_sessao_segundos::\s*(\d+)\)/)?.[1] || '0');
                            const data = line.match(/\(log_date::\s*(\d{4}-\d{2}-\d{2})\)/)?.[1];
                            
                            if (data && duracao > 0) {
                                const minutos = Math.round(duracao / 60);
                                sessoesPorDia[data] = (sessoesPorDia[data] || 0) + minutos;
                                
                                if (!maxDateFound || data > maxDateFound) maxDateFound = data;
                            }
                        }
                    }
                }
            }
        }
    }

    if (Object.keys(sessoesPorDia).length === 0) {
        dv.paragraph(`<small>Nenhum log de estudo encontrado.</small>`);
        return;
    }

    const graphData = Object.entries(sessoesPorDia).map(([date, value]) => ({
        date: date,
        value: value,
        summary: `${value} min estudados`
    }));

    const moment = window.moment;
    const referenciaData = maxDateFound ? moment(maxDateFound) : moment();
    let fromDate, toDate, graphType;

    if (timeframe === 'month') {
        fromDate = referenciaData.clone().startOf('month');
        // CORREÇÃO: Adiciona 1 dia para incluir o dia 31 no range
        toDate = referenciaData.clone().endOf('month').add(1, 'day');
        graphType = 'month-track';
    } else { // year
        fromDate = referenciaData.clone().startOf('year');
        // CORREÇÃO: Adiciona 1 dia para incluir o último dia do ano
        toDate = referenciaData.clone().endOf('year').add(1, 'day');
        graphType = 'calendar';
    }

    const config = {
        title: "Consistência de Estudo",
        graphType: graphType,
        fromDate: fromDate.format('YYYY-MM-DD'),
        toDate: toDate.format('YYYY-MM-DD'),
        data: graphData,
        startOfWeek: 1,
        cellStyleRules: [
            { min: 1, max: 29, color: "#9be9a8", text: "🌱" },
            { min: 30, max: 59, color: "#40c463", text: "🌿" },
            { min: 60, max: 119, color: "#30a14e", text: "🌲" },
            { min: 120, max: 9999, color: "#216e39", text: "🔥" }
        ],
        onCellHover: (cellData) => {
            return `${cellData.value} minutos em ${cellData.date}`;
        }
    };

    const graphContainer = dv.el("div", "", { cls: "sota-contribution-graph-container" });

    if (window.renderContributionGraph) {
        try {
            window.renderContributionGraph(graphContainer, config);
        } catch (e) {
            dv.paragraph(`❌ Erro: ${e.message}`);
        }
    }
}
main();