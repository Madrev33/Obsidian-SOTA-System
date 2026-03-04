// 99 - BACKEND/Scripts/Views/DashboardMidias/renderMediaStreaks.js
// SOTA v1.2 - Calculadora de Sequências (Streaks) - Suporte a Jogos

async function main() {
    if (!dv) return;
    
    const dashboard = dv.current();
    const idMidia = dashboard.midia_selecionada_id;
    const cicloSelecionado = dashboard.ciclo_selecionado_view;

    if (!idMidia) {
        dv.paragraph("⚠️ Selecione uma mídia.");
        return;
    }

    // 1. LOCALIZAÇÃO DO ARQUIVO
    const hub = dv.pages().where(p => p.id_midia === idMidia && p.file.path.includes("00. HUB"))[0];
    if (!hub) { dv.paragraph("❌ HUB não encontrado."); return; }

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
    else if (tipo.includes("jogo")) tipoPasta = "Jogos"; // ADICIONADO

    const idSanitizado = sanitizar(hub.file.name.replace(/00\. HUB - |HUB - /g, '')) || idMidia;
    const logPath = `99 - BACKEND/Logs_Metricas/${tipoPasta}/${idSanitizado}/raw_logs.md`;
    const logFile = app.vault.getAbstractFileByPath(logPath);

    if (!logFile) {
        dv.paragraph("ℹ️ Sem dados para calcular estatísticas.");
        return;
    }

    // 2. EXTRAÇÃO DE DATAS ÚNICAS
    const content = await app.vault.cachedRead(logFile);
    const lines = content.split('\n');
    
    const filtrarPorCiclo = cicloSelecionado && !cicloSelecionado.toLowerCase().includes("todos");
    const numeroCicloAlvo = filtrarPorCiclo ? parseInt(cicloSelecionado.replace(/\D/g, '')) : null;

    const datasSet = new Set();
    const moment = window.moment;

    lines.forEach(line => {
        if (!/sessao_fim::\s*WORK/i.test(line)) return;

        if (filtrarPorCiclo) {
            const cicloMatch = line.match(/\(ciclo::\s*(\d+)\)/);
            const cicloLog = cicloMatch ? parseInt(cicloMatch[1]) : 1; 
            if (cicloLog !== numeroCicloAlvo) return;
        }

        const dateMatch = line.match(/\(log_date::\s*(\d{4}-\d{2}-\d{2})\)/);
        if (dateMatch) {
            datasSet.add(dateMatch[1]);
        }
    });

    if (datasSet.size === 0) {
        dv.paragraph(`ℹ️ Sem atividades no **${cicloSelecionado}**.`);
        return;
    }

    // 3. CÁLCULOS DE STREAK
    const datasOrdenadas = Array.from(datasSet)
        .map(d => moment(d, "YYYY-MM-DD"))
        .sort((a, b) => a.diff(b));

    let sequenciaAtual = 0;
    let recordeSequencia = 0;
    let diasTotais = datasSet.size;
    let ultimoDiaAtivo = datasOrdenadas[datasOrdenadas.length - 1];
    let hiato = moment().startOf('day').diff(ultimoDiaAtivo.startOf('day'), 'days');

    // Recorde
    let streakTemp = 0;
    for (let i = 0; i < datasOrdenadas.length; i++) {
        if (i === 0) {
            streakTemp = 1;
        } else {
            const diff = datasOrdenadas[i].diff(datasOrdenadas[i-1], 'days');
            if (diff === 1) streakTemp++;
            else streakTemp = 1;
        }
        if (streakTemp > recordeSequencia) recordeSequencia = streakTemp;
    }

    // Atual
    if (hiato <= 1) {
        sequenciaAtual = 1;
        for (let i = datasOrdenadas.length - 1; i > 0; i--) {
            const diff = datasOrdenadas[i].diff(datasOrdenadas[i-1], 'days');
            if (diff === 1) sequenciaAtual++;
            else break;
        }
    }

    // Texto do Hiato
    let textoHiato = "";
    if (hiato === 0) textoHiato = "0 (Ativo hoje)";
    else if (hiato === 1) textoHiato = "1 (Ontem)";
    else textoHiato = `${hiato} dias`;

    // 4. RENDERIZAÇÃO (LISTA SIMPLES)
    dv.list([
        `🔥 **Sequência Atual:** ${sequenciaAtual} dia(s)`,
        `🏆 **Recorde de Sequência:** ${recordeSequencia} dia(s)`,
        `📅 **Total de Dias Ativos:** ${diasTotais}`,
        `💤 **Dias de Hiato:** ${textoHiato}`
    ]);
}

await main();