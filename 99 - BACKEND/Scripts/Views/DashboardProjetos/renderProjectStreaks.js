// 99 - BACKEND/Scripts/Views/DashboardProjetos/renderProjectStreaks.js
// SOTA v1.0 - Calculadora de Sequências (Streaks) para Projetos

async function main() {
    // --- 1. CONTEXTO ---
    const hubUID = input.hub_uid;
    
    if (!hubUID) {
        dv.paragraph("⚠️ Selecione um Projeto.");
        return;
    }

    const hub = dv.pages().where(p => p.sota_uid === hubUID)[0];
    if (!hub) { dv.paragraph("❌ HUB não encontrado."); return; }

    const idProjeto = hub.id_projeto;
    const logPath = `99 - BACKEND/Logs_Metricas/Projetos/${idProjeto}/raw_logs.md`;
    const logFile = app.vault.getAbstractFileByPath(logPath);

    if (!logFile) {
        dv.paragraph("ℹ️ Sem dados para calcular estatísticas.");
        return;
    }

    // --- 2. EXTRAÇÃO DE DATAS ÚNICAS ---
    const content = await app.vault.cachedRead(logFile);
    const lines = content.split('\n');
    const datasSet = new Set();
    const moment = window.moment;

    lines.forEach(line => {
        // Filtra apenas sessões de trabalho (WORK)
        if (!/sessao_fim::\s*WORK/i.test(line)) return;

        const dateMatch = line.match(/\(log_date::\s*(\d{4}-\d{2}-\d{2})\)/);
        if (dateMatch) {
            datasSet.add(dateMatch[1]);
        }
    });

    if (datasSet.size === 0) {
        dv.paragraph(`ℹ️ Nenhuma atividade registrada neste projeto.`);
        return;
    }

    // --- 3. CÁLCULOS DE STREAK ---
    const datasOrdenadas = Array.from(datasSet)
        .map(d => moment(d, "YYYY-MM-DD"))
        .sort((a, b) => a.diff(b));

    let sequenciaAtual = 0;
    let recordeSequencia = 0;
    let diasTotais = datasSet.size;
    let ultimoDiaAtivo = datasOrdenadas[datasOrdenadas.length - 1];
    
    // Calcula o Hiato (dias desde a última atividade)
    let hiato = moment().startOf('day').diff(ultimoDiaAtivo.startOf('day'), 'days');

    // Cálculo do Recorde Histórico
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

    // Cálculo da Sequência Atual
    // Se o hiato for > 1 (ontem), a sequência quebrou, então é 0.
    // Se trabalhou hoje (0) ou ontem (1), a sequência está viva.
    if (hiato <= 1) {
        sequenciaAtual = 1;
        for (let i = datasOrdenadas.length - 1; i > 0; i--) {
            const diff = datasOrdenadas[i].diff(datasOrdenadas[i-1], 'days');
            if (diff === 1) sequenciaAtual++;
            else break;
        }
    } else {
        sequenciaAtual = 0;
    }

    // Texto do Hiato amigável
    let textoHiato = "";
    if (hiato === 0) textoHiato = "🔥 Ativo hoje";
    else if (hiato === 1) textoHiato = "1 dia (Ontem)";
    else textoHiato = `${hiato} dias parado`;

    // --- 4. RENDERIZAÇÃO ---
    dv.list([
        `🔥 **Sequência Atual:** ${sequenciaAtual} dia(s)`,
        `🏆 **Recorde:** ${recordeSequencia} dia(s)`,
        `📅 **Dias Trabalhados:** ${diasTotais}`,
        `💤 **Status Recente:** ${textoHiato}`
    ]);
}

await main();