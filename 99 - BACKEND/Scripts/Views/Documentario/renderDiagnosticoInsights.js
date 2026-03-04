// Componente SOTA: renderDiagnosticoInsights.js (para Documentários Seriados) v1.3
// CORREÇÃO: Ajusta a query para encontrar o HUB de Temporada correto.

async function main() {
    const idMidia = dv.current().midia_selecionada_id;
    const tipoMidia = dv.current().midia_selecionada_tipo;
    const cicloSelecionado = dv.current().ciclo_selecionado_view;
    const sortBy = dv.current().sort_by_insights || 'path';
    const sortOrder = dv.current().sort_order_insights || 'asc';

    if (!idMidia) { dv.paragraph("❌ ERRO: 'midia_selecionada_id' não encontrado no frontmatter do Dashboard."); return; }
    
    const hub = dv.pages().where(p => p.id_midia === idMidia && p.tipo === "documentario_serializado_hub")[0];
    if (!hub) { dv.paragraph(`❌ ERRO: HUB de Documentário Serializado com ID ${idMidia} não encontrado.`); return; }

    if (!cicloSelecionado) { dv.paragraph("⚠️ Selecione um ciclo para ver o diagnóstico."); return; }

    if (cicloSelecionado === "Visão Agregada (Todos os Ciclos)") { dv.span("**Resumo de Insights (Todos os Ciclos)**"); } 
    else { dv.span(`**Resumo de Insights (${cicloSelecionado})**`); }

    const docFolder = hub.file.folder.split('/').slice(0, -1).join('/');
    const temporadasFolder = `${docFolder}/Temporadas`;

    let episodios;
    if (cicloSelecionado === "Visão Agregada (Todos os Ciclos)") {
        episodios = dv.pages(`"${temporadasFolder}"`).where(p => p.tipo === 'documentario_episodio' && p.hub_uid === hub.sota_uid);
    } else {
        const numeroCiclo = parseInt(cicloSelecionado.replace('Ciclo ', ''));
        if (isNaN(numeroCiclo)) { dv.paragraph("⚠️ Ciclo selecionado inválido."); return; }
        const cicloFolderPath = `${temporadasFolder}/Ciclo_${String(numeroCiclo).padStart(2, '0')}`;
        episodios = dv.pages(`"${cicloFolderPath}"`).where(p => p.tipo === 'documentario_episodio' && p.hub_uid === hub.sota_uid && p.ciclo === numeroCiclo);
    }

    if (episodios.length > 0) {
        const totalIdeias = episodios.ideias_geradas.values.reduce((a, b) => (a || 0) + (b || 0), 0);
        const totalReflexoes = episodios.reflexoes_geradas.values.reduce((a, b) => (a || 0) + (b || 0), 0);
        dv.paragraph(`**Total:** 💡 ${totalIdeias} Ideias | 🤔 ${totalReflexoes} Reflexões`);

        const dadosOrdenados = episodios.sort(p => p[sortBy] || p.file[sortBy], sortOrder);

        // --- CORREÇÃO APLICADA AQUI: Tipo correto do HUB de Temporada ---
        const temporadaHubs = dv.pages().where(p => p.tipo === 'documentario_temporada_hub' && p.hub_uid === hub.sota_uid);

        const headers = cicloSelecionado === "Visão Agregada (Todos os Ciclos)" 
            ? ["Ciclo", "Temporada", "Episódio", "💡 Ideias", "🤔 Reflexões"] 
            : ["Temporada", "Episódio", "💡 Ideias", "🤔 Reflexões"];

        const tableData = dadosOrdenados.map(p => {
            // Encontra o HUB da temporada verificando se o arquivo do episódio está DENTRO da pasta do HUB da temporada
            const temporadaHubCorrespondente = temporadaHubs.find(m => p.file.path.includes(m.file.folder));
            const numeroTemporada = temporadaHubCorrespondente ? temporadaHubCorrespondente.numero_temporada : "N/A";
            
            const linkEpisodio = dv.fileLink(p.file.path, false, `Episódio ${p.numero_episodio}`);

            const row = [
                `Temporada ${numeroTemporada}`,
                linkEpisodio,
                p.ideias_geradas || 0,
                p.reflexoes_geradas || 0
            ];

            if (cicloSelecionado === "Visão Agregada (Todos os Ciclos)") {
                const cicloMatch = p.file.path.match(/Ciclo_(\d+)/);
                const cicloNum = cicloMatch ? `Ciclo ${parseInt(cicloMatch[1])}` : "N/A";
                row.unshift(cicloNum);
            }

            return row;
        });

        dv.table(headers, tableData);
    } else {
        dv.paragraph("Nenhum episódio com insights encontrado para o período selecionado.");
    }
}
main();