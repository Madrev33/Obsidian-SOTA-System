// SOTA - renderHistoricoExercicio.js v1.0
// Script dv.view para criar uma tabela detalhada de todo o histórico de séries para um exercício específico.

async function main() {
    // O objeto 'dv' é injetado globalmente pelo dv.view()
    if (!dv) {
        console.error("Dataview (dv) object is not available in this context.");
        return;
    }

    // Acessa os dados passados a partir da chamada dv.view()
    const exercicioId = input.exercicio_id;
    if (!exercicioId) {
        dv.paragraph("⚠️ ID do exercício não foi fornecido para esta view.");
        return;
    }

    // --- CONFIGURAÇÃO ---
    const config = {
        logs_path: `99 - BACKEND/Logs_Metricas/Exercicios/${exercicioId}/raw_logs.md`
    };

    // --- CARREGAMENTO E FILTRAGEM DOS DADOS ---
    const logFile = app.vault.getAbstractFileByPath(config.logs_path);
    if (!logFile) {
        dv.paragraph("ℹ️ Nenhum arquivo de log de treino encontrado.");
        return;
    }

    const content = await app.vault.cachedRead(logFile);
    const logsDoExercicio = content.split('\n').filter(line => 
        line.trim() !== '' && (line.includes("sessao_fim::WORK") || line.includes("sessao_fim::BREAK"))
    );

    if (logsDoExercicio.length === 0) {
        dv.paragraph("Nenhum registro de treino encontrado para este exercício ainda.");
        return;
    }

    // --- AGREGAÇÃO SEQUENCIAL (Lógica Cronológica) ---
    const sessoesLista = [];
    let ultimaSessaoWork = null;

    logsDoExercicio.forEach(log => {
        // Se for uma sessão de TRABALHO (A Série em si)
        if (log.includes("(sessao_fim::WORK)")) {
            const novaSessao = {
                id: log.match(/\(id_sessao::\s*([^)]+)\)/)?.[1],
                data: log.match(/\(log_date::\s*(.*?)\)/)?.[1],
                horario: log.match(/\(log_time::\s*(.*?)\)/)?.[1],
                exercicio: exercicioId, // Já temos o ID, não precisa processar string aqui se não quiser
                serie: log.match(/\(serie::\s*(\d+)\)/)?.[1],
                carga: parseFloat(log.match(/\(carga_kg::\s*([\d.]+)\)/)?.[1] || '0'),
                reps: parseInt(log.match(/\(reps_feito::\s*(\d+)\)/)?.[1] || '0'),
                rpe: parseInt(log.match(/\(esforco_rpe::\s*(\d+)\)/)?.[1]),
                qualidade: parseInt(log.match(/\(qualidade_forma::\s*(\d+)\)/)?.[1]),
                duracaoSerie: parseInt(log.match(/\(duracao_segundos::\s*(\d+)\)/)?.[1]),
                notas: log.match(/\(notas::"(.*?)"\)/)?.[1] || "",
                duracaoDescanso: 0 // Inicializa com 0
            };
            
            sessoesLista.push(novaSessao);
            ultimaSessaoWork = novaSessao; // Guarda referência
        } 
        // Se for uma sessão de PAUSA (O Descanso pós-série)
        // Adiciona o tempo à última sessão de trabalho registrada
        else if (log.includes("(sessao_fim::BREAK)") && ultimaSessaoWork) {
            const descanso = parseInt(log.match(/\(duracao_total_sessao_segundos::\s*(\d+)\)/)?.[1] || '0');
            ultimaSessaoWork.duracaoDescanso += descanso;
        }
    });

    // --- TRANSFORMAÇÃO E ORDENAÇÃO DOS DADOS ---
    const dadosTabela = sessoesLista
        .sort((a, b) => {
            const dateA = `${a.data} ${a.horario}`;
            const dateB = `${b.data} ${b.horario}`;
            return dateB.localeCompare(dateA); // Ordena do mais recente para o mais antigo por padrão
        });

    // --- RENDERIZAÇÃO ---
    const formatarSegundos = (s) => {
        if (!s || s === 0) return "-";
        const h = Math.floor(s / 3600).toString().padStart(2, '0');
        const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
        const sec = Math.round(s % 60).toString().padStart(2, '0');
        
        // Opcional: Se for menos de 1h, mostra mm:ss. Se quiser sempre HH:mm:ss, use a linha de baixo.
        // return h > 0 ? `${h}:${m}:${sec}` : `${m}:${sec}`; 
        
        // Padrão SOTA Rigoroso (HH:mm:ss sempre):
        return `${h}:${m}:${sec}`;
    };

    const headers = ["Data", "Série", "Carga (kg)", "Reps", "RPE", "Qualidade", "Duração Série", "Descanso", "Notas"];
    const rows = dadosTabela.map(item => [
        moment(item.data).format("DD/MM/YYYY"),
        item.serie,
        item.carga,
        item.reps,
        item.rpe || "N/A",
        item.qualidade || "N/A",
        formatarSegundos(item.duracaoSerie),
        formatarSegundos(item.duracaoDescanso),
        item.notas
    ]);

    dv.table(headers, rows);
}

main();