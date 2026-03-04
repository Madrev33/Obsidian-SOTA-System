// SOTA - renderKPIsDiariosExercicios.js v2.0 (Leitura Otimizada do Log Diário)
// Script dv.view para calcular e exibir os KPIs do treino do dia atual.

async function main() {
    if (!dv) {
        console.error("Dataview (dv) object is not available.");
        return;
    }

    // --- CONFIGURAÇÃO ---
    // Nenhuma configuração de caminho de log de exercício necessária, pois lemos do Daily Note.

    // --- FUNÇÕES AUXILIARES ---
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

    // --- CARREGAMENTO DO LOG DIÁRIO ---
    const hojeStr = moment().format("YYYY-MM-DD");
    const dailyLogPath = `99 - BACKEND/Logs_Metricas/Daily/${hojeStr}.md`;
    const logFile = app.vault.getAbstractFileByPath(dailyLogPath);

    if (!logFile) {
        dv.paragraph("ℹ️ Nenhum log diário encontrado para hoje.");
        return;
    }

    const content = await app.vault.cachedRead(logFile);
    // Filtra apenas linhas de sessão (WORK ou BREAK)
    const logsDeHoje = content.split('\n').filter(line => 
        line.includes("(sessao_fim::") && 
        line.includes("#exercicio/")
    );

    if (logsDeHoje.length === 0) {
        dv.paragraph("ℹ️ Nenhuma série registrada hoje ainda.");
        return;
    }

    // --- PROCESSAMENTO E AGREGAÇÃO FUNCIONAL (PADRÃO ROBUSTO) ---
    
    const logsDeEsforco = logsDeHoje.filter(log => log.includes("(sessao_fim::WORK)"));
    const logsDeDescanso = logsDeHoje.filter(log => log.includes("(sessao_fim::BREAK)"));

    const volumeTotalHoje = logsDeEsforco.reduce((sum, log) => {
        const carga = parseFloat(log.match(/\(carga_kg::\s*([\d.]+)\)/)?.[1] || '0');
        const reps = parseInt(log.match(/\(reps_feito::\s*(\d+)\)/)?.[1] || '0');
        return sum + (carga * reps);
    }, 0);

    const tempoSobTensaoHoje = logsDeEsforco.reduce((sum, log) => {
        const duracao = parseInt(log.match(/\(duracao_segundos::\s*(\d+)\)/)?.[1] || '0');
        return sum + duracao;
    }, 0);

    const tempoDescansoHoje = logsDeDescanso.reduce((sum, log) => {
        const duracao = parseInt(log.match(/\(duracao_total_sessao_segundos::\s*(\d+)\)/)?.[1] || '0');
        return sum + duracao;
    }, 0);

    const sessoesFoco = logsDeEsforco.length;
    const duracaoTotalTreino = tempoSobTensaoHoje + tempoDescansoHoje;
    // Lógica Tangível: Minutos de descanso para cada minuto de tensão
    let textoProporcao = "N/A";
    if (tempoSobTensaoHoje > 0) {
        const fatorDescanso = (tempoDescansoHoje / tempoSobTensaoHoje).toFixed(1);
        textoProporcao = `Para cada minuto sob tensão, você descansou **${fatorDescanso} minutos**.`;
    }

    // --- RENDERIZAÇÃO DOS KPIs ---
    const kpis = [
        `**Volume Total (Hoje):** ${Math.round(volumeTotalHoje).toLocaleString('pt-BR')} kg`,
        `**Duração Total do Treino:** ${formatarSegundos(duracaoTotalTreino)}`,
        `**Tempo Sob Tensão (Hoje):** ${formatarSegundos(tempoSobTensaoHoje)}`,
        `**Tempo de Descanso (Hoje):** ${formatarSegundos(tempoDescansoHoje)}`,
        `**Séries Realizadas:** ${sessoesFoco}`,
        `**Proporção de Recuperação:** ${textoProporcao}`
    ];

    dv.list(kpis);
}

main();