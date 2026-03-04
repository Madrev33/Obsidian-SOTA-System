// SOTA - renderKPIsGeraisExercicios.js v3.0 (Deep Scan & Corrected Metrics)
// Script dv.view para calcular e exibir os KPIs históricos de treino.

async function main() {
    if (!dv) {
        console.error("Dataview (dv) object is not available.");
        return;
    }

    // --- CONFIGURAÇÃO ---
    const exerciciosRootPath = "99 - BACKEND/Logs_Metricas/Exercicios";

    // --- CARREGAMENTO DOS DADOS (Deep Scan) ---
    const rootFolder = app.vault.getAbstractFileByPath(exerciciosRootPath);
    if (!rootFolder) {
        dv.paragraph("ℹ️ Pasta raiz de logs não encontrada.");
        return;
    }

    // --- PROCESSAMENTO E AGREGAÇÃO ---
    let volumeTotal = 0;
    let tempoSobTensaoTotal = 0;
    let tempoDescansoTotal = 0;
    const diasDeTreino = new Set();  // Datas únicas para contagem de sessões
    let logsProcessados = 0;

    // Função Recursiva para encontrar todos os 'raw_logs.md'
    async function processarPasta(pasta) {
        if (!pasta.children) return;

        for (const child of pasta.children) {
            if (child.extension && child.name === "raw_logs.md") {
                await lerEProcessarLog(child);
            } else if (!child.extension) { // É pasta, desce mais um nível
                await processarPasta(child);
            }
        }
    }

    async function lerEProcessarLog(file) {
        const content = await app.vault.cachedRead(file);
        const lines = content.split('\n');

        lines.forEach(log => {
            if (!log.trim()) return;

            const dataMatch = log.match(/\(log_date::\s*([^)]+)\)/);

            if (log.includes("(sessao_fim::WORK)")) {
                logsProcessados++;
                
                const carga = parseFloat(log.match(/\(carga_kg::\s*([\d.]+)\)/)?.[1] || '0');
                const reps = parseInt(log.match(/\(reps_feito::\s*(\d+)\)/)?.[1] || '0');
                const duracaoTensao = parseInt(log.match(/\(duracao_segundos::\s*(\d+)\)/)?.[1] || '0');
                
                volumeTotal += carga * reps;
                tempoSobTensaoTotal += duracaoTensao;
                if (dataMatch) diasDeTreino.add(dataMatch[1]);
            }
            
            if (log.includes("(sessao_fim::BREAK)")) {
                const duracaoDescanso = parseInt(log.match(/\(duracao_total_sessao_segundos::\s*(\d+)\)/)?.[1] || '0');
                tempoDescansoTotal += duracaoDescanso;
                if (dataMatch) diasDeTreino.add(dataMatch[1]); // Conta dias de descanso também
            }
        });
    }

    await processarPasta(rootFolder);

    if (logsProcessados === 0) {
        dv.paragraph("ℹ️ Nenhum registro de série encontrado nos logs.");
        return;
    }

    // --- CÁLCULO DOS KPIs DERIVADOS (LÓGICA CORRIGIDA) ---
    const totalDiasDeTreino = diasDeTreino.size;
    const duracaoTotalTreinos = tempoSobTensaoTotal + tempoDescansoTotal;
    
    // CORREÇÃO LÓGICA: Duração média é o tempo total dividido pelos dias únicos de treino
    const duracaoMediaSessao = totalDiasDeTreino > 0 ? duracaoTotalTreinos / totalDiasDeTreino : 0;
    
    // Cálculo da Frequência Média Semanal
    let frequenciaMediaSemanal = 0;
    const moment = window.moment;
    
    if (totalDiasDeTreino > 1) {
        const datasOrdenadas = Array.from(diasDeTreino).sort();
        const primeiraData = moment(datasOrdenadas[0]);
        const ultimaData = moment(datasOrdenadas[datasOrdenadas.length - 1]);
        const totalSemanas = Math.max(1, ultimaData.diff(primeiraData, 'weeks', true));
        frequenciaMediaSemanal = totalDiasDeTreino / totalSemanas;
    } else if (totalDiasDeTreino === 1) {
        frequenciaMediaSemanal = 1;
    }

    // --- FUNÇÃO AUXILIAR ---
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

    // --- RENDERIZAÇÃO DOS KPIs ---
    const kpis = [
        `**Volume Total (Geral):** ${Math.round(volumeTotal).toLocaleString('pt-BR')} kg`,
        `**Frequência Média:** ${frequenciaMediaSemanal.toFixed(1)} treinos/semana`,
        `**Duração Média da Sessão:** ${formatarSegundos(duracaoMediaSessao)}`,
        `**Tempo Total Sob Tensão:** ${formatarSegundos(tempoSobTensaoTotal)}`,
        `**Tempo Total de Descanso:** ${formatarSegundos(tempoDescansoTotal)}`
    ];

    dv.list(kpis);
}

main();