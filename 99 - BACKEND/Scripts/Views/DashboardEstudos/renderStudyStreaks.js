// 99 - BACKEND/Scripts/Views/DashboardEstudos/renderStudyStreaks.js
// SOTA v2.0 - Streaks Agregados (Sem Cache)

async function main() {
    const hubUID = input.hub_uid;
    if (!hubUID) { dv.paragraph("⚠️ Selecione um Estudo."); return; }

    const hub = dv.pages().where(p => p.sota_uid === hubUID)[0];
    if (!hub) { dv.paragraph("❌ HUB não encontrado."); return; }

    // Coleta Fontes
    const fontes = [];
    const rawMidias = hub.midias_associadas;
    const rawProjetos = hub.projetos_relacionados;
    if (rawMidias) { if (dv.isArray(rawMidias)) fontes.push(...rawMidias); else fontes.push(rawMidias); }
    if (rawProjetos) { if (dv.isArray(rawProjetos)) fontes.push(...rawProjetos); else fontes.push(rawProjetos); }

    if (fontes.length === 0) {
        dv.paragraph("ℹ️ Nenhuma mídia associada para calcular sequência.");
        return;
    }

    const datasSet = new Set();
    
    // Agregação de Datas
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
                else if (tipoFonte.includes("projeto")) pastaTipo = "Projetos";
                else if (tipoFonte.includes("jogo")) pastaTipo = "Jogos";
                else if (tipoFonte.includes("documentacao")) pastaTipo = "Documentacoes";


                const logPath = `99 - BACKEND/Logs_Metricas/${pastaTipo}/${idFonte}/raw_logs.md`;
                const logFile = app.vault.getAbstractFileByPath(logPath);

                if (logFile) {
                    const content = await app.vault.cachedRead(logFile);
                    const lines = content.split('\n');
                    for (const line of lines) {
                        // Considera qualquer sessão WORK como atividade
                        if (line.includes("sessao_fim::WORK")) {
                            const data = line.match(/\(log_date::\s*(\d{4}-\d{2}-\d{2})\)/)?.[1];
                            if (data) datasSet.add(data);
                        }
                    }
                }
            }
        }
    }

    if (datasSet.size === 0) {
        dv.paragraph("ℹ️ Nenhuma atividade registrada.");
        return;
    }

    // Cálculos de Streak (Igual ao original)
    const moment = window.moment;
    const datasOrdenadas = Array.from(datasSet)
        .map(d => moment(d, "YYYY-MM-DD"))
        .sort((a, b) => a.diff(b));

    let sequenciaAtual = 0;
    let recordeSequencia = 0;
    let diasTotais = datasSet.size;
    let ultimoDiaAtivo = datasOrdenadas[datasOrdenadas.length - 1];
    let hiato = moment().startOf('day').diff(ultimoDiaAtivo.startOf('day'), 'days');

    let streakTemp = 0;
    for (let i = 0; i < datasOrdenadas.length; i++) {
        if (i === 0) streakTemp = 1;
        else {
            const diff = datasOrdenadas[i].diff(datasOrdenadas[i-1], 'days');
            if (diff === 1) streakTemp++;
            else streakTemp = 1;
        }
        if (streakTemp > recordeSequencia) recordeSequencia = streakTemp;
    }

    if (hiato <= 1) {
        sequenciaAtual = 1;
        for (let i = datasOrdenadas.length - 1; i > 0; i--) {
            const diff = datasOrdenadas[i].diff(datasOrdenadas[i-1], 'days');
            if (diff === 1) sequenciaAtual++;
            else break;
        }
    } else {
        sequenciaAtual = 0;
    }

    let textoHiato = "";
    if (hiato === 0) textoHiato = "🔥 Ativo hoje";
    else if (hiato === 1) textoHiato = "1 dia (Ontem)";
    else textoHiato = `${hiato} dias sem estudar`;

    dv.list([
        `🔥 **Sequência Atual:** ${sequenciaAtual} dias`,
        `🏆 **Recorde:** ${recordeSequencia} dias`,
        `📅 **Dias Estudados:** ${diasTotais}`,
        `💤 **Status:** ${textoHiato}`
    ]);
}
main();