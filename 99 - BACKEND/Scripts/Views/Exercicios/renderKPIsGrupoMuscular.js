// SOTA - renderKPIsGrupoMuscular.js v4.0 (Time Metrics)
// Script dv.view para calcular e exibir os KPIs agregados de um grupo muscular específico.

async function main() {
    if (!dv) {
        console.error("Dataview (dv) object is not available in this context.");
        return;
    }

    const grupoMuscularId = input.grupo_muscular_id;
    if (!grupoMuscularId) {
        dv.paragraph("⚠️ ID do Grupo Muscular não foi fornecido para esta view.");
        return;
    }

    // --- CONFIGURAÇÃO ---
    const config = {
        exercicios_manual_folder: "04 - Corpo & Movimento/01 - Exercícios Físicos/01. Manual/Exercícios",
        logs_root_folder: "99 - BACKEND/Logs_Metricas/Exercicios"
    };

    // --- ETAPA 1: IDENTIFICAR EXERCÍCIOS DO GRUPO MUSCULAR ---
    const exerciciosDoGrupo = dv.pages(`"${config.exercicios_manual_folder}"`)
        .where(p => p.tipo === 'manual_exercicio' && p.grupo_muscular_primario === grupoMuscularId)
        .map(p => p.exercicio_id)
        .values;

    if (exerciciosDoGrupo.length === 0) {
        dv.paragraph("ℹ️ Nenhum exercício associado a este grupo muscular encontrado no Manual.");
        return;
    }

    // --- ETAPA 2 & 3: CARREGAR E AGREGAR DADOS ---
    const agregados = {
        volumeTotal: 0,
        seriesTotais: 0,
        tempoSobTensaoTotal: 0, // NOVO
        tempoDescansoTotal: 0,    // NOVO
        datas: new Set(),
        exerciciosUnicos: new Set(),
        totalRpe: 0,
        countRpe: 0,
        totalQualidade: 0,
        countQualidade: 0
    };

    let encontrouLogs = false;

    for (const exercicioId of exerciciosDoGrupo) {
        const logPath = `${config.logs_root_folder}/${grupoMuscularId}/${exercicioId}/raw_logs.md`;
        const logFile = app.vault.getAbstractFileByPath(logPath);
        
        if (logFile) {
            const content = await app.vault.cachedRead(logFile);
            const lines = content.split('\n');

            lines.forEach(log => {
                if (log.includes("(sessao_fim::WORK)")) {
                    encontrouLogs = true;
                    
                    const carga = parseFloat(log.match(/\(carga_kg::\s*([\d.]+)\)/)?.[1] || '0');
                    const reps = parseInt(log.match(/\(reps_feito::\s*(\d+)\)/)?.[1] || '0');
                    const rpe = parseInt(log.match(/\(esforco_rpe::\s*(\d+)\)/)?.[1]);
                    const qualidade = parseInt(log.match(/\(qualidade_forma::\s*(\d+)\)/)?.[1]);
                    const data = log.match(/\(log_date::\s*([^)]+)\)/)?.[1];
                    const duracao = parseInt(log.match(/\(duracao_segundos::\s*(\d+)\)/)?.[1] || '0'); // NOVO
                    
                    agregados.volumeTotal += carga * reps;
                    agregados.seriesTotais++;
                    agregados.exerciciosUnicos.add(exercicioId);
                    agregados.tempoSobTensaoTotal += duracao; // NOVO
                    
                    if (data) agregados.datas.add(data);
                    if (!isNaN(rpe)) { agregados.totalRpe += rpe; agregados.countRpe++; }
                    if (!isNaN(qualidade)) { agregados.totalQualidade += qualidade; agregados.countQualidade++; }
                } 
                else if (log.includes("(sessao_fim::BREAK)")) { // NOVO BLOCO
                    const duracaoDescanso = parseInt(log.match(/\(duracao_total_sessao_segundos::\s*(\d+)\)/)?.[1] || '0');
                    agregados.tempoDescansoTotal += duracaoDescanso;
                }
            });
        }
    }

    if (!encontrouLogs) {
        dv.paragraph("Nenhum registro de treino encontrado para este grupo muscular ainda.");
        return;
    }

    // --- ETAPA 4: CÁLCULO DOS KPIs FINAIS ---
    const ultimoTreino = agregados.datas.size > 0 ? Array.from(agregados.datas).sort().pop() : null;
    const rpeMedio = agregados.countRpe > 0 ? (agregados.totalRpe / agregados.countRpe).toFixed(1) : "N/A";
    const qualidadeMedia = agregados.countQualidade > 0 ? (agregados.totalQualidade / agregados.countQualidade).toFixed(1) : "N/A";
    const tempoTotal = agregados.tempoSobTensaoTotal + agregados.tempoDescansoTotal; // NOVO

    // --- FUNÇÃO AUXILIAR DE FORMATAÇÃO (NOVO) ---
    const formatarSegundos = (s) => {
        if (isNaN(s) || s <= 0) return "0s";
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const secs = Math.round(s % 60);
        let parts = [];
        if (h > 0) parts.push(`${h}h`);
        if (m > 0) parts.push(`${m}m`);
        if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
        return parts.join(' ');
    };

    // --- ETAPA 5: RENDERIZAÇÃO ---
    const kpis = [
        `**Total de Exercícios Diferentes:** ${agregados.exerciciosUnicos.size}`,
        `**Total de Séries Realizadas:** ${agregados.seriesTotais}`,
        `**Volume Total Agregado:** ${Math.round(agregados.volumeTotal).toLocaleString('pt-BR')} kg`,
        `**RPE Médio (Histórico):** ${rpeMedio} / 10`,
        `**Qualidade de Forma Média:** ${qualidadeMedia} / 10`,
        `**Tempo Total de Treino:** ${formatarSegundos(tempoTotal)}`, // NOVO
        `**Tempo Sob Tensão:** ${formatarSegundos(agregados.tempoSobTensaoTotal)}`, // NOVO
        `**Tempo de Descanso:** ${formatarSegundos(agregados.tempoDescansoTotal)}`, // NOVO
        `**Último Treino:** ${ultimoTreino ? moment(ultimoTreino).format("DD/MM/YYYY") : "Nenhum registro"}`
    ];

    dv.list(kpis);
}

main();