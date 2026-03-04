// Componente SOTA: renderGlobalMediaKPIs.js v1.1
// Calcula e exibe os KPIs globais de todas as mídias.
// CORREÇÃO: Corrige erro de sintaxe (crase no lugar de aspas).

async function main() {
    const mediaTypes = [
        "Livros", 
        "Cursos", 
        "Series", 
        "Filmes", 
        "Documentarios", 
        "Podcasts", 
        "Artigos", 
        "Documentacoes", 
        "Videos"
    ];

    let totalFocoSegundos = 0;
    let totalPausasSegundos = 0;
    let totalSessoesFoco = 0;
    let totalSessoesPausa = 0;
    let diasComAtividade = new Set();

    for (const type of mediaTypes) {
        const folderPath = `99 - BACKEND/Logs_Metricas/${type}`;
        // Busca todas as páginas dentro da pasta de métricas de cada tipo de mídia
        const logFolders = dv.pages(`"${folderPath}"`);

        // Para cada página encontrada (que representa um arquivo dentro de uma subpasta de mídia),
        // tentamos localizar o raw_logs.md correspondente na mesma pasta.
        // Como o dv.pages retorna arquivos individuais, precisamos extrair a pasta única de cada mídia.
        const uniqueFolders = new Set(logFolders.map(p => p.file.folder));
        
        for (const folder of uniqueFolders) {
            const logBrutoPath = `${folder}/raw_logs.md`;
            const logFile = app.vault.getAbstractFileByPath(logBrutoPath);

            if (logFile) {
                const content = await app.vault.cachedRead(logFile);
                // --- CORREÇÃO APLICADA AQUI ---
                const logs = content.split('\n').filter(line => line.trim() !== '' && line.includes("(sessao_fim::"));

                for (const log of logs) {
                    const duracaoMatch = log.match(/\(duracao_total_sessao_segundos::\s*(\d+)\)/);
                    const duracao = duracaoMatch ? parseInt(duracaoMatch[1]) : 0;
                    
                    const dataMatch = log.match(/\(log_date::\s*(.*?)\)/);
                    if (dataMatch) diasComAtividade.add(dataMatch[1]);

                    if (log.includes("(sessao_fim::WORK)")) {
                        totalFocoSegundos += duracao;
                        totalSessoesFoco += 1;
                    } else if (log.includes("(sessao_fim::BREAK)")) {
                        totalPausasSegundos += duracao;
                        totalSessoesPausa += 1;
                    }
                }
            }
        }
    }

    const formatarSegundosTotal = (s) => {
        if (isNaN(s) || s === 0) return "0s";
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const secs = Math.round(s % 60);
        let parts = [];
        if (h > 0) parts.push(`${h}h`);
        if (m > 0) parts.push(`${m}m`);
        if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
        return parts.join(' ');
    };

    const mediaFocoPorDia = diasComAtividade.size > 0 ? totalFocoSegundos / diasComAtividade.size : 0;

    const kpis = [
        `**Tempo Total de Foco (Global):** ${formatarSegundosTotal(totalFocoSegundos)}`,
        `**Tempo Total em Pausas (Global):** ${formatarSegundosTotal(totalPausasSegundos)}`,
        `**Total de Sessões de Foco (Global):** ${totalSessoesFoco}`,
        `**Total de Sessões de Pausa (Global):** ${totalSessoesPausa}`,
        `**Média de Foco por Dia (Global):** ${formatarSegundosTotal(Math.round(mediaFocoPorDia))}`
    ];

    dv.list(kpis);
}

main();