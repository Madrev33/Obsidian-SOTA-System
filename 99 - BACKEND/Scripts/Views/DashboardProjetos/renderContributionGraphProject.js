// 99 - BACKEND/Scripts/Views/DashboardProjetos/renderContributionGraphProject.js
// SOTA v1.0 - Gráfico Inteligente de Contribuição para Projetos

async function main() {
    if (!dv) { console.error("Dataview não disponível."); return; }
    
    // Recebe parâmetros do input
    const hubUID = input.hub_uid;
    const timeframe = input.timeframe || 'month'; // 'month', 'year', ou 'week'
    
    if (!hubUID) {
        dv.paragraph("⚠️ Selecione um Projeto.");
        return;
    }

    const hub = dv.pages().where(p => p.sota_uid === hubUID)[0];
    if (!hub) { dv.paragraph(`❌ HUB não encontrado.`); return; }

    const idProjeto = hub.id_projeto;
    const logPath = `99 - BACKEND/Logs_Metricas/Projetos/${idProjeto}/raw_logs.md`;
    const logFile = app.vault.getAbstractFileByPath(logPath);

    if (!logFile) {
        dv.paragraph(`<small>Sem dados visuais.</small>`);
        return;
    }

    // Processamento dos Logs
    const content = await app.vault.cachedRead(logFile);
    const lines = content.split('\n');
    
    const sessoesPorDia = {};
    let totalSessoesGeral = 0;
    let minDateFound = null;
    let maxDateFound = null;

    lines.forEach(line => {
        if (!/sessao_fim::\s*WORK/i.test(line)) return;

        const dateMatch = line.match(/\(log_date::\s*(\d{4}-\d{2}-\d{2})\)/);

        if (dateMatch) {
            const date = dateMatch[1];
            sessoesPorDia[date] = (sessoesPorDia[date] || 0) + 1;
            totalSessoesGeral++;

            if (!minDateFound || date < minDateFound) minDateFound = date;
            if (!maxDateFound || date > maxDateFound) maxDateFound = date;
        }
    });

    if (totalSessoesGeral === 0) {
        dv.paragraph(`ℹ️ Nenhuma sessão registrada.`);
        return;
    }

    const graphData = Object.entries(sessoesPorDia).map(([date, value]) => ({
        date: date,
        value: value,
        summary: `${value} Sessões de Foco`
    }));

    // Configuração de Data Dinâmica
    const moment = window.moment;
    const referenciaData = maxDateFound ? moment(maxDateFound) : moment();
    let fromDate, toDate, graphType;

    if (timeframe === 'week') {
        fromDate = referenciaData.clone().startOf('isoWeek');
        // CORREÇÃO: Adiciona 1 dia para incluir o último dia da semana
        toDate = referenciaData.clone().endOf('isoWeek').add(1, 'day');
        graphType = 'month-track';
    } else if (timeframe === 'month') {
        fromDate = referenciaData.clone().startOf('month');
        // CORREÇÃO: Adiciona 1 dia para incluir o último dia do mês
        toDate = referenciaData.clone().endOf('month').add(1, 'day');
        graphType = 'month-track';
    } else { // year (default ou fallback)
        fromDate = referenciaData.clone().startOf('year');
        // CORREÇÃO: Adiciona 1 dia para incluir o último dia do ano
        toDate = referenciaData.clone().endOf('year').add(1, 'day');
        graphType = 'calendar';
    }

    const config = {
        title: "Atividade Recente",
        graphType: graphType,
        fromDate: fromDate.format('YYYY-MM-DD'),
        toDate: toDate.format('YYYY-MM-DD'),
        data: graphData,
        startOfWeek: 1, // Segunda-feira
        cellStyleRules: [
            { min: 1, max: 2, color: "#9be9a8", text: "🌱" },
            { min: 3, max: 5, color: "#40c463", text: "🌿" },
            { min: 6, max: 9, color: "#30a14e", text: "🌲" },
            { min: 10, max: 999, color: "#216e39", text: "🔥" }
        ],
        onCellHover: (cellData) => {
            return `${cellData.value} Sessões em ${cellData.date}`;
        }
    };

    const graphContainer = dv.el("div", "", { cls: "sota-contribution-graph-container" });

    if (window.renderContributionGraph) {
        try {
            window.renderContributionGraph(graphContainer, config);
        } catch (e) {
            dv.paragraph(`❌ Erro ao renderizar gráfico: ${e.message}`);
        }
    } else {
        dv.paragraph("⚠️ Plugin 'Contribution Graph' não encontrado.");
    }
}

await main();