// Componente SOTA: renderKPIsEstudo.js (v3.3 - Suporte a Jogos & Pausa)
async function main() {
    const hubUID = input.hub_uid;
    if (!hubUID) { dv.paragraph("❌ ERRO: 'hub_uid' não fornecido."); return; }
    
    const hub = dv.pages().where(p => p.sota_uid === hubUID)[0];
    if (!hub) { dv.paragraph(`❌ ERRO: HUB não encontrado.`); return; }
    
    const fontes = [];
    const rawMidias = hub.midias_associadas;
    const rawProjetos = hub.projetos_relacionados;

    if (rawMidias) {
        if (dv.isArray(rawMidias)) fontes.push(...rawMidias);
        else fontes.push(rawMidias);
    }
    if (rawProjetos) {
        if (dv.isArray(rawProjetos)) fontes.push(...rawProjetos);
        else fontes.push(rawProjetos);
    }

    if (fontes.length === 0) {
        dv.paragraph("ℹ️ Nenhuma mídia ou projeto associado.");
        return;
    }

    let totalFoco = 0;
    let totalPausa = 0; // NOVO
    let totalSessoes = 0;
    const diasAtivos = new Set();

    for (const link of fontes) {
        const path = link.path;
        const fonteFile = app.vault.getAbstractFileByPath(path);
        
        if (fonteFile) {
            const cacheFonte = app.metadataCache.getFileCache(fonteFile);
            const idFonte = cacheFonte?.frontmatter?.id_midia || cacheFonte?.frontmatter?.id_projeto;
            const tipoFonte = cacheFonte?.frontmatter?.tipo;

            if (idFonte && tipoFonte) {
                let pastaTipo = "Outros";
                if (tipoFonte.includes("livro")) pastaTipo = "Livros";
                else if (tipoFonte.includes("curso")) pastaTipo = "Cursos";
                else if (tipoFonte.includes("serie")) pastaTipo = "Series";
                else if (tipoFonte.includes("filme")) pastaTipo = "Filmes";
                else if (tipoFonte.includes("documentario")) pastaTipo = "Documentarios";
                else if (tipoFonte.includes("podcast")) pastaTipo = "Podcasts";
                else if (tipoFonte.includes("artigo")) pastaTipo = "Artigos";
                else if (tipoFonte.includes("video")) pastaTipo = "Videos";
                else if (tipoFonte.includes("jogo")) pastaTipo = "Jogos"; // ADICIONADO
                else if (tipoFonte.includes("projeto")) pastaTipo = "Projetos";
                else if (tipoFonte.includes("documentacao")) pastaTipo = "Documentacoes";

                const logPath = `99 - BACKEND/Logs_Metricas/${pastaTipo}/${idFonte}/raw_logs.md`;
                const logFile = app.vault.getAbstractFileByPath(logPath);

                if (logFile) {
                    const content = await app.vault.cachedRead(logFile);
                    const lines = content.split('\n');
                    
                    for (const line of lines) {
                        if (line.includes("sessao_fim::WORK")) {
                            const duracao = parseInt(line.match(/\(duracao_total_sessao_segundos::\s*(\d+)\)/)?.[1] || '0');
                            const data = line.match(/\(log_date::\s*(\d{4}-\d{2}-\d{2})\)/)?.[1];
                            
                            totalFoco += duracao;
                            totalSessoes++;
                            if (data) diasAtivos.add(data);
                        }
                        // ADICIONADO: Contagem de Pausa
                        else if (line.includes("sessao_fim::BREAK")) {
                            const duracao = parseInt(line.match(/\(duracao_total_sessao_segundos::\s*(\d+)\)/)?.[1] || '0');
                            totalPausa += duracao;
                        }
                    }
                }
            }
        }
    }

    const formatarHHMMSS = (s) => {
        if (isNaN(s) || s === 0) return "00:00:00";
        const h = Math.floor(s / 3600).toString().padStart(2, '0');
        const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
        const sec = Math.round(s % 60).toString().padStart(2, '0');
        return `${h}:${m}:${sec}`;
    };

    const kpis = [
        `**Tempo Total de Foco:** ${formatarHHMMSS(totalFoco)}`,
        `**Tempo Total de Pausa:** ${formatarHHMMSS(totalPausa)}`, // ADICIONADO
        `**Sessões de Foco:** ${totalSessoes}`,
        `**Dias Ativos:** ${diasAtivos.size}`
    ];

    dv.list(kpis);
}
main();