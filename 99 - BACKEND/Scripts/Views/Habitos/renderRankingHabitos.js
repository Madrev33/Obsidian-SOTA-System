// 99 - BACKEND/Scripts/Views/Analiticos/renderRankingHabitos.js
// SOTA v3.0 - Ranking Otimizado (Leitura de Log Contextual)
// Performance O(1) por hábito (Lê apenas o raw_logs.md específico de cada um).

async function main() {
    if (!dv) { console.error("Dataview indisponível."); return; }
    
    // 1. Busca Definições de Hábitos
    const habitosPath = "07 - Engenharia de Hábitos/01 - Hábitos";
    const habitos = dv.pages(`"${habitosPath}"`).where(p => p.tipo_habito === 'habito');

    if (habitos.length === 0) {
        dv.paragraph("ℹ️ Nenhum hábito encontrado.");
        return;
    }

    // 2. Agregação Direta por Hábito
    const dadosTabela = await Promise.all(habitos.map(async (h) => {
        const id = h.id_habito;
        const tipo = h.tipo_input || "booleano";
        const metaNumerica = h.meta_numerica || 1;
        
        // Caminho Direto para o Log do Hábito
        const logPath = `99 - BACKEND/Logs_Metricas/Habitos/${id}/raw_logs.md`;
        const logFile = app.vault.getAbstractFileByPath(logPath);
        
        let diasConcluidos = 0;
        
        if (logFile) {
            const content = await app.vault.cachedRead(logFile);
            
            if (tipo === "numerico") {
                // Para contadores, precisamos agrupar por data, pois o raw_logs tem múltiplas entradas
                const somaPorDia = {};
                // Regex otimizada para capturar Data e Valor
                const regexContador = /\(valor::\s*(\d+)\).*?\(log_date::\s*(\d{4}-\d{2}-\d{2})\)/g;
                let match;
                while ((match = regexContador.exec(content)) !== null) {
                    const valor = parseInt(match[1]);
                    const data = match[2];
                    somaPorDia[data] = (somaPorDia[data] || 0) + valor;
                }
                
                // Conta quantos dias bateram a meta
                diasConcluidos = Object.values(somaPorDia).filter(total => total >= metaNumerica).length;
                
            } else {
                // Para binários, basta contar quantas linhas únicas de data existem
                // Regex simples: #habito_concluido ... (log_date:: YYYY-MM-DD)
                const datasUnicas = new Set();
                const regexBinario = /#habito_concluido.*?\(log_date::\s*(\d{4}-\d{2}-\d{2})\)/g;
                let match;
                while ((match = regexBinario.exec(content)) !== null) {
                    datasUnicas.add(match[1]);
                }
                diasConcluidos = datasUnicas.size;
            }
        }

        // --- Cálculos de Meta e Aderência (Inalterados) ---
        const dataCriacao = h.file.cday;
        const diasVida = Math.max(1, window.moment().diff(window.moment(dataCriacao.toJSDate()), 'days'));
        
        const frequenciaRaw = (h.frequencia || "diaria").toLowerCase();
        let metaExecucoes = diasVida; 
        let labelFreq = "Dia";

        if (frequenciaRaw.includes("semanal")) {
            metaExecucoes = Math.ceil(diasVida / 7);
            labelFreq = "Sem";
        } else if (frequenciaRaw.includes("mensal")) {
            metaExecucoes = Math.ceil(diasVida / 30);
            labelFreq = "Mês";
        }

        // Proteção matemática
        if (metaExecucoes < 1) metaExecucoes = 1;

        let aderenciaRaw = (diasConcluidos / metaExecucoes) * 100;
        const aderenciaDisplay = Math.min(100, Math.round(aderenciaRaw)) + "%";
        
        let status = "🔴";
        if (aderenciaRaw >= 80) status = "🟢";
        else if (aderenciaRaw >= 50) status = "🟡";

        const tier = h.tier_desafio ? h.tier_desafio.split(" ")[0] : "❔";

        return {
            link: h.file.link,
            tier: tier,
            freq: labelFreq,
            total: diasConcluidos,
            meta: metaExecucoes,
            aderenciaRaw: aderenciaRaw,
            aderenciaDisplay: aderenciaDisplay,
            status: status
        };
    }));

    // Ordenação
    dadosTabela.sort((a, b) => b.aderenciaRaw - a.aderenciaRaw);

    dv.table(
        ["Status", "Hábito", "Tier", "Frequência", "Dias Feitos / Meta", "Aderência Histórica"],
        dadosTabela.map(d => [
            d.status,
            d.link,
            d.tier,
            d.freq,
            `${d.total} / ${d.meta}`,
            d.aderenciaDisplay
        ])
    );
}

await main();