// 99 - BACKEND/Scripts/Views/Habitos/renderMatrizMaturacao.js
// SOTA v3.0 - Matriz de Maturação Otimizada (Leitura Contextual)

async function main() {
    const habitosPath = "07 - Engenharia de Hábitos/01 - Hábitos";
    // Busca apenas hábitos ativos
    const habitos = dv.pages(`"${habitosPath}"`).where(p => p.tipo_habito === 'habito' && p.ativo !== false);

    if (habitos.length === 0) { dv.paragraph("ℹ️ Nenhum hábito ativo."); return; }

    const moment = window.moment;
    const hoje = moment().startOf('day');
    
    // Array para armazenar os resultados
    const dadosHabitos = [];

    // Processamento Paralelo (Promise.all) para velocidade máxima
    // Lê os logs de todos os hábitos simultaneamente
    await Promise.all(habitos.map(async (h) => {
        const id = h.id_habito;
        const logPath = `99 - BACKEND/Logs_Metricas/Habitos/${id}/raw_logs.md`;
        const logFile = app.vault.getAbstractFileByPath(logPath);
        
        let streak = 0;

        if (logFile) {
            // Lê o arquivo de log
            const content = await app.vault.cachedRead(logFile);
            const lines = content.split('\n');
            
            // Set de dias realizados (para busca rápida O(1))
            const diasRealizados = new Set();
            
            // Parsing reverso (do fim para o começo é mais eficiente para streak recente)
            for (let i = lines.length - 1; i >= 0; i--) {
                const line = lines[i];
                if (line.includes("#habito_concluido") || line.includes("#habito_registro")) {
                    const dateMatch = line.match(/\(log_date::\s*(\d{4}-\d{2}-\d{2})\)/);
                    if (dateMatch) {
                        diasRealizados.add(dateMatch[1]);
                    }
                }
                // Otimização: Se já temos muitos dias, podemos parar de ler? 
                // Não necessariamente, pois pode haver buracos no log. 
                // Mas ler um arquivo de texto de 100kb é trivial.
            }

            // Cálculo do Streak Atual
            let dateCheck = hoje.clone();
            
            // Permite falhar hoje se fez ontem (Streak vivo)
            if (!diasRealizados.has(hoje.format('YYYY-MM-DD'))) {
                 dateCheck.subtract(1, 'days');
            }
            
            // Conta dias consecutivos para trás
            while (diasRealizados.has(dateCheck.format('YYYY-MM-DD'))) {
                streak++;
                dateCheck.subtract(1, 'days');
            }
        }

        // Classificação baseada no streak
        let fase = "🌱 Iniciação";
        let icone = "🌱";
        if (streak >= 66) { fase = "💎 Internalizado"; icone = "💎"; }
        else if (streak >= 21) { fase = "🌳 Consolidação"; icone = "🌳"; }
        else if (streak >= 7) { fase = "🌿 Resistência"; icone = "🌿"; }

        dadosHabitos.push({
            link: h.file.link,
            streak: streak,
            fase: fase,
            icone: icone
        });
    }));

    // Ordenação: Maior Streak primeiro
    dadosHabitos.sort((a, b) => b.streak - a.streak);

    dv.table(
        ["Fase", "Hábito", "Sequência Atual", "Próximo Nível"],
        dadosHabitos.map(d => [
            d.icone + " " + d.fase.split(" ")[1], 
            d.link,
            d.streak + " dias",
            // Barra de progresso visual simples
            d.streak < 7 ? `${d.streak}/7` : (d.streak < 21 ? `${d.streak}/21` : (d.streak < 66 ? `${d.streak}/66` : "∞"))
        ])
    );
}

await main();