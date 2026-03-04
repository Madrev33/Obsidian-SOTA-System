// SOTA - renderRecordesIsometrico.js v1.0
// Script dv.view para encontrar e exibir os RPs de um exercício Isométrico.

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
        maiorTempo: { valor: 0, data: null },
        maiorTempoComCarga: { valor: 0, data: null, carga: 0 },
        maiorCarga: { valor: 0, data: null, tempo: 0 }
    };

    logs.forEach(log => {
        const duracao = parseInt(log.match(/\(duracao_segundos::\s*(\d+)\)/)?.[1] || '0');
        const carga = parseFloat(log.match(/\(carga_kg::\s*([\d.]+)\)/)?.[1] || '0');
        const data = log.match(/\(log_date::\s*([^)]+)\)/)?.[1];

        if (carga === 0 && duracao > recordes.maiorTempo.valor) {
            recordes.maiorTempo = { valor: duracao, data: data };
        }
        if (carga > 0 && duracao > recordes.maiorTempoComCarga.valor) {
            recordes.maiorTempoComCarga = { valor: duracao, data: data, carga: carga };
        }
        if (carga > recordes.maiorCarga.valor) {
            recordes.maiorCarga = { valor: carga, data: data, tempo: duracao };
        }
    });

    // --- RENDERIZAÇÃO ---
    const formatarTempo = (s) => (s && s > 0 ? `${s}s` : "Nenhum registro");
    
    const formatarRecorde = (recorde, unidade = "") => {
        if (!recorde || recorde.valor <= 0 || !recorde.data) return "Nenhum registro";
        const dataFormatada = moment(recorde.data).format("DD/MM/YYYY");
        return `**${recorde.valor.toLocaleString('pt-BR')}${unidade}** (em ${dataFormatada})`;
    };

    const listaRecordes = [
        `**Maior Tempo (BW):** **${formatarTempo(recordes.maiorTempo.valor)}** (em ${recordes.maiorTempo.data ? moment(recordes.maiorTempo.data).format("DD/MM/YYYY") : 'N/A'})`,
        `**Maior Tempo (c/ Carga):** **${formatarTempo(recordes.maiorTempoComCarga.valor)}** c/ **${recordes.maiorTempoComCarga.carga}kg** (em ${recordes.maiorTempoComCarga.data ? moment(recordes.maiorTempoComCarga.data).format("DD/MM/YYYY") : 'N/A'})`,
        `**Maior Carga Adicional:** ${formatarRecorde(recordes.maiorCarga, 'kg')} por **${recordes.maiorCarga.tempo}s**`
    ];

    dv.list(listaRecordes);
}
main();