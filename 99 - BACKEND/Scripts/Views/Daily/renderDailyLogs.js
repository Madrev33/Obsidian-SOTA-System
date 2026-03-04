// SOTA - renderDailyLogs.js v2.4 (Renderização Condicional Definitiva)

const { tipo, periodo } = input;
const tipos = Array.isArray(tipo) ? tipo : [tipo];

if (!tipos || tipos.length === 0 || !periodo) {
    dv.paragraph("❌ ERRO: Parâmetros 'tipo' (array) e 'periodo' não foram recebidos corretamente.");
    return;
}

const dataDaNota = dv.current().file.day;
if (!dataDaNota) {
    dv.paragraph("⚠️ A nota atual não parece ser uma nota diária.");
    return;
}

const dataFormatada = dataDaNota.toFormat("yyyy-MM-dd");
const dailyLogPath = `99 - BACKEND/Logs_Metricas/Daily/${dataFormatada}.md`;
const paginaDeLogs = dv.page(dailyLogPath);

if (!paginaDeLogs || !paginaDeLogs.file.lists || paginaDeLogs.file.lists.length === 0) {
    dv.paragraph("Nenhum registro para este período.");
    return;
}

const logsDoPeriodo = paginaDeLogs.file.lists.where(item =>
    item.text.includes(periodo) && tipos.some(t => item.text.includes(t))
);

if (logsDoPeriodo.length === 0) {
    dv.paragraph("Nenhum registro para este período.");
    return;
}

// --- LÓGICA DE RENDERIZAÇÃO CONDICIONAL CORRETA ---
const isTaskView = tipos.some(t => t.includes("#nivel") || t.includes("#fazer_depois"));

if (isTaskView) {
    // Para Desafios e Tarefas, a interatividade é prioridade. Usamos dv.taskList.
    // Ele renderizará o texto completo da tarefa, incluindo metadados, mas o checkbox será funcional.
    dv.taskList(logsDoPeriodo, false);
} else {
    // Para todos os outros logs (Ideias, Reflexões, etc.), a formatação customizada é prioridade.
    const listaFormatada = logsDoPeriodo.map(logItem => {
        const log = logItem.text;
        const timeMatch = log.match(/\(log_time::(.*?)\)/);
        const timestamp = timeMatch ? `\`${timeMatch[1]}\`` : "";

        const fonteMatch = log.match(/\(Fonte::\s*(\[\[.*?\]\])\)/);
        const fonteLink = fonteMatch ? ` em ${fonteMatch[1]}` : "";
        
        let textoLimpo = log
            .replace(/#\S+/g, '')
            .replace(/\(log_date::.*?\)/g, '')
            .replace(/\(log_time::.*?\)/g, '')
            .replace(/^- \[.\]\s*/, '')
            .replace(/\(Fonte::.*?\)/g, '')
            .trim();
        
        if (log.includes('#aprendizado_erro')) {
            const situacao = log.match(/\(Situação::(.*?)\)/)?.[1]?.trim() || 'N/D';
            const erro = log.match(/\(Erro::(.*?)\)/)?.[1]?.trim() || 'N/D';
            const aprendizado = log.match(/\(Aprendizado::(.*?)\)/)?.[1]?.trim() || 'N/D';
            textoLimpo = `**Situação:** ${situacao} | **Erro:** ${erro} | **Aprendizado:** ${aprendizado}`;
        } else if (log.includes('#distracao')) {
            const distracao = log.match(/\(Distração::(.*?)\)/)?.[1]?.trim() || 'N/D';
            const gatilho = log.match(/\(Gatilho::(.*?)\)/)?.[1]?.trim() || 'N/D';
            textoLimpo = `**Distração:** ${distracao} | **Gatilho:** ${gatilho}`;
        } else if (log.includes('#refeicao_boa') || log.includes('#refeicao_ruim')) {
            const alimentos = log.match(/\(Alimentos::(.*?)\)/)?.[1]?.trim() || 'N/D';
            textoLimpo = `Refeição: ${alimentos}`;
        } else if (log.includes('#log_felicidade')) {
            const motivo = log.match(/\(Motivo::(.*?)\)/)?.[1]?.trim() || 'N/D';
            textoLimpo = `😃 **Felicidade:** ${motivo}`;
        } else if (log.includes('#log_tristeza')) {
            const causa = log.match(/\(Causa::(.*?)\)/)?.[1]?.trim() || 'N/D';
            textoLimpo = `😔 **Tristeza:** ${causa}`;
        } else if (log.includes('#log_estresse')) {
            const fonte = log.match(/\(Fonte::(.*?)\)/)?.[1]?.trim() || 'N/D';
            textoLimpo = `😣 **Estresse:** ${fonte}`;
        }

        return `${timestamp} ${textoLimpo}${fonteLink}`;
    });

    dv.list(listaFormatada);
}