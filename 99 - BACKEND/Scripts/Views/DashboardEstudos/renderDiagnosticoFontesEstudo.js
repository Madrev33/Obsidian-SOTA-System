// Componente SOTA: renderDiagnosticoFontesEstudo.js v2.4 (Com Tempo de Pausa)
async function main() {
    const hubUID = input.hub_uid;
    const sortBy = input.sort_by || 'focoTotalSegundos';
    const sortOrder = input.sort_order || 'desc';

    if (!hubUID) return;
    
    const hub = dv.pages().where(p => p.sota_uid === hubUID)[0];
    if (!hub) return;

    const fontes = [];
    const rawMidias = hub.midias_associadas;
    const rawProjetos = hub.projetos_relacionados;
    if (rawMidias) { if (dv.isArray(rawMidias)) fontes.push(...rawMidias); else fontes.push(rawMidias); }
    if (rawProjetos) { if (dv.isArray(rawProjetos)) fontes.push(...rawProjetos); else fontes.push(rawProjetos); }

    if (fontes.length === 0) {
        dv.paragraph("ℹ️ Nenhuma mídia associada.");
        return;
    }

    const dadosFontes = [];

    // Helper de Formatação HH:mm:ss
    const formatarHHMMSS = (totalSegundos) => {
        const h = Math.floor(totalSegundos / 3600).toString().padStart(2, '0');
        const m = Math.floor((totalSegundos % 3600) / 60).toString().padStart(2, '0');
        const s = Math.round(totalSegundos % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    for (const link of fontes) {
        const path = link.path;
        const fonteFile = app.vault.getAbstractFileByPath(path);
        
        if (fonteFile) {
            const cacheFonte = app.metadataCache.getFileCache(fonteFile);
            const idFonte = cacheFonte?.frontmatter?.id_midia || cacheFonte?.frontmatter?.id_projeto;
            const tipoFonte = cacheFonte?.frontmatter?.tipo;
            const nomeLimpo = fonteFile.basename.replace(/^(00\. HUB - |HUB - )/g, '');
            
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
                else if (tipoFonte.includes("projeto")) pastaTipo = "Projetos";
                else if (tipoFonte.includes("jogo")) pastaTipo = "Jogos"; // ADICIONADO
                else if (tipoFonte.includes("documentacao")) pastaTipo = "Documentacoes";


                const logPath = `99 - BACKEND/Logs_Metricas/${pastaTipo}/${idFonte}/raw_logs.md`;
                const logFile = app.vault.getAbstractFileByPath(logPath);
                let segundosFoco = 0;
                let segundosPausa = 0; // Novo acumulador
                let ultimaData = null;

                if (logFile) {
                    const content = await app.vault.cachedRead(logFile);
                    const lines = content.split('\n');
                    for (const line of lines) {
                        if (line.includes("sessao_fim::")) {
                            const duracao = parseInt(line.match(/\(duracao_total_sessao_segundos::\s*(\d+)\)/)?.[1] || '0');
                            const dataLog = line.match(/\(log_date::\s*(\d{4}-\d{2}-\d{2})\)/)?.[1];
                            
                            if (line.includes("WORK")) {
                                segundosFoco += duracao;
                                if (dataLog && (!ultimaData || dataLog > ultimaData)) ultimaData = dataLog;
                            } else if (line.includes("BREAK")) {
                                segundosPausa += duracao; // Soma pausas
                            }
                        }
                    }
                }

                if (segundosFoco > 0 || segundosPausa > 0) {
                    dadosFontes.push({
                        linkFonte: dv.fileLink(path, false, nomeLimpo),
                        focoTotalSegundos: segundosFoco,
                        pausaTotalSegundos: segundosPausa,
                        tempoFocoFormatado: formatarHHMMSS(segundosFoco),
                        tempoPausaFormatado: formatarHHMMSS(segundosPausa),
                        ultimaData: ultimaData ? moment(ultimaData).format("DD/MM/YYYY") : "-"
                    });
                }
            }
        }
    }

    const dadosOrdenados = dadosFontes.sort((a, b) => b.focoTotalSegundos - a.focoTotalSegundos);

    dv.table(
        ["Fonte de Conhecimento", "Tempo de Foco", "Tempo de Pausa", "Última Atividade"],
        dadosOrdenados.map(p => [
            p.linkFonte,
            p.tempoFocoFormatado,
            p.tempoPausaFormatado, // Nova coluna
            p.ultimaData
        ])
    );
}
main();