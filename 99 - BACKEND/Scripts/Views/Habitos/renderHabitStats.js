// 99 - BACKEND/Scripts/Views/Habitos/renderHabitStats.js
// SOTA v3.0 - Estatísticas de Hábito Otimizadas (Log Contextual)

async function main() {
    const habitoPage = dv.current();
    const idHabito = habitoPage.id_habito;

    if (!idHabito) {
        dv.paragraph("⚠️ ID do Hábito não encontrado.");
        return;
    }

    // --- NOVA FONTE DE DADOS ---
    const logPath = `99 - BACKEND/Logs_Metricas/Habitos/${idHabito}/raw_logs.md`;
    const logFile = app.vault.getAbstractFileByPath(logPath);

    if (!logFile) {
        dv.paragraph("ℹ️ Nenhuma estatística disponível (Sem histórico).");
        return;
    }

    // Leitura e Parsing
    const content = await app.vault.cachedRead(logFile);
    const lines = content.split('\n');
    
    // Set para dias únicos (evita contar múltiplas vezes no mesmo dia se for contador)
    const diasRealizadosSet = new Set();

    lines.forEach(line => {
        if ((line.includes("#habito_concluido") || line.includes("#habito_registro")) && line.includes(`(id_habito:: ${idHabito})`)) {
            const dateMatch = line.match(/\(log_date::\s*(\d{4}-\d{2}-\d{2})\)/);
            if (dateMatch) {
                diasRealizadosSet.add(dateMatch[1]);
            }
        }
    });

    if (diasRealizadosSet.size === 0) {
        dv.paragraph("ℹ️ Nenhuma estatística disponível.");
        return;
    }

    // Ordenação cronológica
    const diasOrdenados = Array.from(diasRealizadosSet).sort();
    const moment = window.moment;

    // --- CÁLCULOS ---
    const totalDiasAtivos = diasOrdenados.length;
    
    const primeiroDia = moment(diasOrdenados[0]);
    const ultimoDia = moment(diasOrdenados[diasOrdenados.length - 1]);
    const hoje = moment().startOf('day');
    
    // Dias desde o início (Denominador da frequência)
    const diasDesdeInicio = Math.max(1, hoje.diff(primeiroDia, 'days') + 1);
    const frequencia = ((totalDiasAtivos / diasDesdeInicio) * 100).toFixed(1);

    // Cálculo de Streak
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;
    let lastDateMoment = null;

    // Itera sobre as datas ordenadas
    for (const diaStr of diasOrdenados) {
        const currentDate = moment(diaStr);
        
        if (!lastDateMoment) {
            tempStreak = 1;
        } else {
            const diff = currentDate.diff(lastDateMoment, 'days');
            if (diff === 1) {
                tempStreak++;
            } else {
                // Streak quebrou
                if (tempStreak > maxStreak) maxStreak = tempStreak;
                tempStreak = 1;
            }
        }
        lastDateMoment = currentDate;
    }
    // Verifica o último streak calculado
    if (tempStreak > maxStreak) maxStreak = tempStreak;

    // Verifica se o streak atual está vivo (hoje ou ontem)
    const diffDoUltimo = hoje.diff(lastDateMoment.startOf('day'), 'days');
    
    if (diffDoUltimo <= 1) {
        currentStreak = tempStreak;
    } else {
        currentStreak = 0; // Streak quebrado
    }

    const listaStats = [
        `**Dias Ativos:** ${totalDiasAtivos}`,
        `**Frequência Global:** ${frequencia}%`,
        `**Sequência Atual:** ${currentStreak} dias 🔥`,
        `**Melhor Sequência:** ${maxStreak} dias 🏆`,
        `**Última Vez:** ${ultimoDia.format('DD/MM/YYYY')}`
    ];

    dv.list(listaStats);
}

await main();