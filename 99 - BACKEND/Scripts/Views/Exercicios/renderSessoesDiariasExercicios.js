// SOTA - renderSessoesDiariasExercicios.js v4.0 (Polymorphic View)
// Exibe um log detalhado e cronológico, adaptando as colunas para Cardio, Força e Isométrico.

async function main() {
    if (!dv) { return; }
    
    // --- LÓGICA DE DATA POLIMÓRFICA ---
    let dataDaNotaStr;
    const currentPage = dv.current();
    if (currentPage.tipo === 'dashboard_exercicios_diaria') {
        dataDaNotaStr = moment().format("YYYY-MM-DD");
    } else {
        dataDaNotaStr = currentPage.file.name.replace('.md', '');
    }
    if (!moment(dataDaNotaStr, "YYYY-MM-DD", true).isValid()) {
        dv.paragraph("⚠️ Contexto de data inválido.");
        return;
    }

    // --- LER LOG DIÁRIO ---
    const dailyLogPath = `99 - BACKEND/Logs_Metricas/Daily/${dataDaNotaStr}.md`;
    const logFile = app.vault.getAbstractFileByPath(dailyLogPath);

    if (!logFile) {
        dv.paragraph(`ℹ️ Nenhum log diário encontrado para ${dataDaNotaStr}.`);
        return;
    }

    const content = await app.vault.cachedRead(logFile);
    const logsDeHoje = content.split('\n').filter(line => 
        line.includes("(sessao_fim::") && 
        line.includes("#exercicio/")
    );

    if (logsDeHoje.length === 0) {
        dv.paragraph(`Nenhuma série ou descanso registrado em ${dataDaNotaStr}.`);
        return;
    }

    // --- PROCESSAMENTO POLIMÓRFICO DOS LOGS ---
    const sessoesProcessadas = logsDeHoje.map(log => {
        const isWork = log.includes("(sessao_fim::WORK)");
        const tipo = isWork ? 'Esforço' : 'Descanso';
        const horario = log.match(/\(log_time::\s*(.*?)\)/)?.[1] || "N/A";
        
        // Nome do Exercício
        let nomeExercicio = "Exercício Desconhecido";
        const nomeTarefaMatch = log.match(/\(tarefa_focada::".*?:\s*(.*?)\s*@/);
        if (nomeTarefaMatch && nomeTarefaMatch[1]) {
            nomeExercicio = nomeTarefaMatch[1].trim();
        } else {
            const idMatch = log.match(/#exercicio\/[^\/]+\/([^\/\s]+)/);
            if (idMatch && idMatch[1]) {
                nomeExercicio = idMatch[1].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            }
        }
        
        let duracao;
        if (isWork) duracao = parseInt(log.match(/\(duracao_segundos::\s*(\d+)\)/)?.[1] || '0');
        else duracao = parseInt(log.match(/\(duracao_total_sessao_segundos::\s*(\d+)\)/)?.[1] || '0');

        // Extrai todos os campos possíveis
        const serie = log.match(/\(serie::\s*(\d+)\)/)?.[1] || "-";
        const carga = log.match(/\(carga_kg::\s*([\d.]+)\)/)?.[1] || null;
        const reps = log.match(/\(reps_feito::\s*(\d+)\)/)?.[1] || null;
        const rpe = log.match(/\(esforco_rpe::\s*(\d+)\)/)?.[1] || "-";
        const qualidade = log.match(/\(qualidade_forma::\s*(\d+)\)/)?.[1] || "-";
        const notas = log.match(/\(notas::"(.*?)"\)/)?.[1] || "";
        const distancia = log.match(/\(distancia_km::\s*([\d.]+)\)/)?.[1] || null;
        const ritmo = log.match(/\(ritmo::"(.*?)"\)/)?.[1] || null;

        return {
            horario, tipo, exercicio: isWork ? nomeExercicio : `Descanso`, serie, duracao, notas,
            carga, reps, rpe, qualidade, distancia, ritmo
        };
    });

    // --- ORDENAÇÃO ---
    sessoesProcessadas.sort((a, b) => a.horario.localeCompare(b.horario));

    // --- RENDERIZAÇÃO ---
    const formatarSegundos = (s) => {
        if (!s || s <= 0) return "-";
        const dur = moment.duration(s, 'seconds');
        return `${String(Math.floor(dur.asHours())).padStart(2, '0')}:${String(dur.minutes()).padStart(2, '0')}:${String(dur.seconds()).padStart(2, '0')}`;
    };

    const headers = ["Horário", "Tipo", "Exercício", "Série", "Performance", "Detalhe", "RPE", "Qualidade", "Duração", "Notas"];
    const rows = sessoesProcessadas.map(s => {
        const isDescanso = s.tipo === 'Descanso';
        
        let performance = '•';
        let detalhe = '•';
        
        if (!isDescanso) {
            if (s.distancia) { // É Cardio
                performance = `${s.distancia} km`;
                detalhe = `${s.ritmo} /km`;
            } else if (s.reps == 1 && s.duracao > 0) { // É Isométrico
                performance = s.carga > 0 ? `+${s.carga} kg` : 'BW';
                detalhe = `${s.duracao}s`;
            } else { // É Força
                performance = s.carga > 0 ? `${s.carga} kg` : 'BW';
                detalhe = `${s.reps} reps`;
            }
        }
        
        return [
            s.horario,
            isDescanso ? '☕' : '💪',
            s.exercicio,
            isDescanso ? '•' : s.serie,
            performance,
            detalhe,
            isDescanso ? '•' : s.rpe,
            isDescanso ? '•' : s.qualidade,
            formatarSegundos(s.duracao),
            isDescanso ? '•' : s.notas
        ];
    });

    dv.table(headers, rows);
}

main();