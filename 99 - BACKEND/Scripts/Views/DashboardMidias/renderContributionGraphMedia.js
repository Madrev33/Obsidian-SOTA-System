// 99 - BACKEND/Scripts/Views/DashboardMidias/renderContributionGraphMedia.js
// SOTA v2.4 - Gráfico Inteligente (Data Dinâmica baseada nos Logs)

async function main() {
    if (!dv) { console.error("Dataview não disponível."); return; }
    const timeframe = input.timeframe || 'year'; 
    
    const dashboard = dv.current();
    const idMidia = dashboard.midia_selecionada_id;
    const cicloSelecionado = dashboard.ciclo_selecionado_view;

    if (!idMidia) {
        dv.paragraph("⚠️ Selecione uma mídia.");
        return;
    }

    const hub = dv.pages().where(p => p.id_midia === idMidia && p.file.path.includes("00. HUB"))[0];
    if (!hub) { dv.paragraph(`❌ HUB não encontrado.`); return; }

    const sanitizar = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[-\s]+/g, '_').replace(/[^\w_]+/g, '') : "";
    let tipoPasta = "Outros";
    const tipo = hub.tipo || "";
    if (tipo.includes("livro")) tipoPasta = "Livros";
    else if (tipo.includes("curso")) tipoPasta = "Cursos";
    else if (tipo.includes("serie")) tipoPasta = "Series";
    else if (tipo.includes("filme")) tipoPasta = "Filmes";
    else if (tipo.includes("documentario")) tipoPasta = "Documentarios";
    else if (tipo.includes("podcast")) tipoPasta = "Podcasts";
    else if (tipo.includes("artigo")) tipoPasta = "Artigos";
    else if (tipo.includes("documentacao")) tipoPasta = "Documentacoes";
    else if (tipo.includes("video")) tipoPasta = "Videos";
    else if (tipo.includes("jogo")) tipoPasta = "Jogos"; 

    const idSanitizado = sanitizar(hub.file.name.replace(/00\. HUB - |HUB - /g, '')) || idMidia;
    const logPath = `99 - BACKEND/Logs_Metricas/${tipoPasta}/${idSanitizado}/raw_logs.md`;
    const logFile = app.vault.getAbstractFileByPath(logPath);

    if (!logFile) {
        dv.paragraph(`<small>Sem dados.</small>`);
        return;
    }

    const content = await app.vault.cachedRead(logFile);
    const lines = content.split('\n');
    
    const filtrarPorCiclo = cicloSelecionado && !cicloSelecionado.toLowerCase().includes("todos");
    const numeroCicloAlvo = filtrarPorCiclo ? parseInt(cicloSelecionado.replace(/\D/g, '')) : null;

    const sessoesPorDia = {};
    let totalSessoesGeral = 0;
    // Variável para rastrear as datas encontradas
    let minDateFound = null;
    let maxDateFound = null;

    lines.forEach(line => {
        if (!/sessao_fim::\s*WORK/i.test(line)) return;

        if (filtrarPorCiclo) {
            const cicloMatch = line.match(/\(ciclo::\s*(\d+)\)/);
            const cicloLog = cicloMatch ? parseInt(cicloMatch[1]) : 1; 
            if (cicloLog !== numeroCicloAlvo) return;
        }

        const dateMatch = line.match(/\(log_date::\s*(\d{4}-\d{2}-\d{2})\)/);

        if (dateMatch) {
            const date = dateMatch[1];
            sessoesPorDia[date] = (sessoesPorDia[date] || 0) + 1;
            totalSessoesGeral++;

            // Atualiza min/max dates
            if (!minDateFound || date < minDateFound) minDateFound = date;
            if (!maxDateFound || date > maxDateFound) maxDateFound = date;
        }
    });

    if (totalSessoesGeral === 0) {
        dv.paragraph(`ℹ️ Nenhuma sessão em **${cicloSelecionado}**.`);
        return;
    }

    const graphData = Object.entries(sessoesPorDia).map(([date, value]) => ({
        date: date,
        value: value,
        summary: `${value} Sessões de Foco`
    }));

    const moment = window.moment;
    let fromDate, toDate, graphType;

    // Lógica de Data Inteligente
    const referenciaData = maxDateFound ? moment(maxDateFound) : moment();

    if (timeframe === 'week') {
        fromDate = referenciaData.clone().startOf('isoWeek');
        // CORREÇÃO: Adiciona 1 dia ao final para incluir o último dia
        toDate = referenciaData.clone().endOf('isoWeek').add(1, 'day');
        graphType = 'month-track';
    } else if (timeframe === 'month') {
        fromDate = referenciaData.clone().startOf('month');
        // CORREÇÃO: Adiciona 1 dia ao final para incluir o último dia
        toDate = referenciaData.clone().endOf('month').add(1, 'day');
        graphType = 'month-track';
    } else { // year
        fromDate = referenciaData.clone().startOf('year');
        // CORREÇÃO: Adiciona 1 dia ao final para incluir o último dia
        toDate = referenciaData.clone().endOf('year').add(1, 'day');
        graphType = 'calendar';
    }

    const config = {
        title: "Consistência",
        graphType: graphType,
        fromDate: fromDate.format('YYYY-MM-DD'),
        toDate: toDate.format('YYYY-MM-DD'),
        data: graphData,
        startOfWeek: 1,
        cellStyleRules: [
            { min: 1, max: 2, color: "#9be9a8", text: "🌱" },
            { min: 3, max: 5, color: "#40c463", text: "🌿" },
            { min: 6, max: 9, color: "#30a14e", text: "🌲" },
            { min: 10, max: 999, color: "#216e39", text: "🔥" }
        ],
        onCellHover: (cellData) => {
            // Texto customizado solicitado
            return `${cellData.value} Sessões de Foco em ${cellData.date}`;
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

await main();