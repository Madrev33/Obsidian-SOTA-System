// SOTA - renderRecordesExercicio.js v2.0 (Hierarchical Sharding Support)
// Script dv.view para encontrar e exibir os Recordes Pessoais (RPs) de um exercício.

async function main() {
    if (!dv) {
        console.error("Dataview (dv) object is not available in this context.");
        return;
    }
    if (!input || !input.exercicio_id) {
        dv.paragraph("⚠️ ID do exercício não foi fornecido para esta view.");
        return;
    }
    const exercicioId = input.exercicio_id;

    // --- CONFIGURAÇÃO & BUSCA DE ARQUIVO ---
    const logsRootPath = "99 - BACKEND/Logs_Metricas/Exercicios";
    
    const encontrarArquivoLog = (id) => {
        const root = app.vault.getAbstractFileByPath(logsRootPath);
        if (!root || !root.children) return null;
    
        for (const grupoFolder of root.children) {
            if (!grupoFolder.extension) { // É pasta
                const path = `${grupoFolder.path}/${id}/raw_logs.md`;
                const file = app.vault.getAbstractFileByPath(path);
                if (file) return file;
            }
        }
        return null; // Retorna null se não encontrar
    };

    const logFile = encontrarArquivoLog(exercicioId);

    if (!logFile) {
        dv.paragraph("ℹ️ Nenhum log de treino encontrado para este exercício.");
        return;
    }

    const content = await app.vault.cachedRead(logFile);
    const logsDoExercicio = content.split('\n').filter(line => line.includes("(sessao_fim::WORK)"));

    if (logsDoExercicio.length === 0) {
        dv.paragraph("Nenhum registro encontrado para este exercício ainda. Vá treinar!");
        return;
    }

    // --- CÁLCULO DOS RECORDES ---
    let recordes = {
        maiorCarga: { valor: 0, data: null },
        maiorReps: { valor: 0, data: null },
        maiorVolumeSerie: { valor: 0, data: null },
        maiorVolumeSessao: { valor: 0, data: null }
    };
    
    const volumePorDia = {};

    logsDoExercicio.forEach(log => {
        const carga = parseFloat(log.match(/\(carga_kg::\s*([\d.]+)\)/)?.[1] || '0');
        const reps = parseInt(log.match(/\(reps_feito::\s*(\d+)\)/)?.[1] || '0');
        const data = log.match(/\(log_date::\s*([^)]+)\)/)?.[1];
        const volumeSerie = carga * reps;

        if (carga > recordes.maiorCarga.valor) {
            recordes.maiorCarga = { valor: carga, data: data };
        }
        if (reps > recordes.maiorReps.valor) {
            recordes.maiorReps = { valor: reps, data: data };
        }
        if (volumeSerie > recordes.maiorVolumeSerie.valor) {
            recordes.maiorVolumeSerie = { valor: volumeSerie, data: data };
        }
        if (data) {
            volumePorDia[data] = (volumePorDia[data] || 0) + volumeSerie;
        }
    });
    
    for (const [data, volume] of Object.entries(volumePorDia)) {
        if (volume > recordes.maiorVolumeSessao.valor) {
            recordes.maiorVolumeSessao = { valor: parseFloat(volume), data: data };
        }
    }

    // --- RENDERIZAÇÃO ---
    const formatarRecorde = (recorde) => {
        if (!recorde || recorde.valor <= 0 || !recorde.data) return "Nenhum registro";
        const dataFormatada = moment(recorde.data).format("DD/MM/YYYY");
        return `**${recorde.valor.toLocaleString('pt-BR')}** (em ${dataFormatada})`;
    };

    const listaRecordes = [
        `**Maior Carga (1 Série):** ${formatarRecorde(recordes.maiorCarga)} kg`,
        `**Maior Volume (1 Série):** ${formatarRecorde(recordes.maiorVolumeSerie)} kg`,
        `**Maior Volume (1 Sessão):** ${formatarRecorde(recordes.maiorVolumeSessao)} kg`,
        `**Maiores Repetições (1 Série):** ${formatarRecorde(recordes.maiorReps)} reps`
    ];

    dv.list(listaRecordes);
}

main();