// SOTA - renderRecordesCardio.js v1.0
// Script dv.view para encontrar e exibir os RPs de um exercício de Cardio.

async function main() {
    if (!dv) { return; }
    if (!input || !input.exercicio_id) {
        dv.paragraph("⚠️ ID do exercício não fornecido.");
        return;
    }
    const exercicioId = input.exercicio_id;

    // --- BUSCA HIERÁRQUICA ---
    const logsRootPath = "99 - BACKEND/Logs_Metricas/Exercicios";
    const encontrarArquivoLog = (id) => {
        const root = app.vault.getAbstractFileByPath(logsRootPath);
        if (!root || !root.children) return null;
        for (const grupoFolder of root.children) {
            if (!grupoFolder.extension) {
                const path = `${grupoFolder.path}/${id}/raw_logs.md`;
                const file = app.vault.getAbstractFileByPath(path);
                if (file) return file;
            }
        }
        return null;
    };
    const logFile = encontrarArquivoLog(exercicioId);
    if (!logFile) { dv.paragraph("ℹ️ Nenhum log encontrado."); return; }

    const content = await app.vault.cachedRead(logFile);
    const logs = content.split('\n').filter(line => line.includes("(sessao_fim::WORK)"));
    if (logs.length === 0) { dv.paragraph("Nenhum registro encontrado."); return; }

    // --- CÁLCULO DOS RECORDES ---
    let recordes = {
        maiorDistancia: { valor: 0, data: null },
        maiorDuracao: { valor: 0, data: null },
        melhorPace5k: { valor: Infinity, data: null },
        melhorPace10k: { valor: Infinity, data: null },
    };

    logs.forEach(log => {
        const distancia = parseFloat(log.match(/\(distancia_km::\s*([\d.]+)\)/)?.[1] || '0');
        const duracao = parseInt(log.match(/\(duracao_segundos::\s*(\d+)\)/)?.[1] || '0');
        const data = log.match(/\(log_date::\s*([^)]+)\)/)?.[1];

        if (distancia > recordes.maiorDistancia.valor) {
            recordes.maiorDistancia = { valor: distancia, data: data };
        }
        if (duracao > recordes.maiorDuracao.valor) {
            recordes.maiorDuracao = { valor: duracao, data: data };
        }
        
        // Cálculo de Pace
        if (distancia > 0 && duracao > 0) {
            const paceDecimal = (duracao / 60) / distancia;
            if (distancia >= 5 && paceDecimal < recordes.melhorPace5k.valor) {
                recordes.melhorPace5k = { valor: paceDecimal, data: data };
            }
            if (distancia >= 10 && paceDecimal < recordes.melhorPace10k.valor) {
                recordes.melhorPace10k = { valor: paceDecimal, data: data };
            }
        }
    });

    // --- RENDERIZAÇÃO ---
    const formatarPace = (paceDecimal) => {
        if (paceDecimal === Infinity) return "Nenhum registro";
        const min = Math.floor(paceDecimal);
        const sec = Math.round((paceDecimal - min) * 60);
        return `${min}:${sec < 10 ? '0' : ''}${sec} /km`;
    };
    
    const formatarDuracao = (s) => {
        if (!s || s <= 0) return "Nenhum registro";
        const dur = moment.duration(s, 'seconds');
        return `${String(Math.floor(dur.asHours())).padStart(2, '0')}:${String(dur.minutes()).padStart(2, '0')}:${String(dur.seconds()).padStart(2, '0')}`;
    };

    const formatarRecorde = (recorde, unidade = "") => {
        if (!recorde || recorde.valor <= 0 || !recorde.data) return "Nenhum registro";
        const dataFormatada = moment(recorde.data).format("DD/MM/YYYY");
        return `**${recorde.valor.toLocaleString('pt-BR', {maximumFractionDigits: 2})}${unidade}** (em ${dataFormatada})`;
    };

    const listaRecordes = [
        `**Maior Distância:** ${formatarRecorde(recordes.maiorDistancia, ' km')}`,
        `**Maior Duração:** **${formatarDuracao(recordes.maiorDuracao.valor)}** (em ${recordes.maiorDuracao.data ? moment(recordes.maiorDuracao.data).format("DD/MM/YYYY") : 'N/A'})`,
        `**Melhor Pace (5k+):** **${formatarPace(recordes.melhorPace5k.valor)}** (em ${recordes.melhorPace5k.data ? moment(recordes.melhorPace5k.data).format("DD/MM/YYYY") : 'N/A'})`,
        `**Melhor Pace (10k+):** **${formatarPace(recordes.melhorPace10k.valor)}** (em ${recordes.melhorPace10k.data ? moment(recordes.melhorPace10k.data).format("DD/MM/YYYY") : 'N/A'})`
    ];

    dv.list(listaRecordes);
}
main();