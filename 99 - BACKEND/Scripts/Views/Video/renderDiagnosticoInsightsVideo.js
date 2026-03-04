// Componente SOTA: renderDiagnosticoInsightsVideo.js v1.1
// CORREÇÃO: Corrige erro de sintaxe na declaração de `headers`.
// CORREÇÃO: Altera a busca do HUB de sota_uid para id_midia.
// CORREÇÃO: Altera a busca das notas de ciclo para usar o sota_uid do HUB encontrado.

async function main() {
    const idMidia = dv.current().midia_selecionada_id;
    const tipoMidia = dv.current().midia_selecionada_tipo;
    const cicloSelecionado = dv.current().ciclo_selecionado_view;
    const sortBy = dv.current().sort_by_insights || 'ideias_geradas';
    const sortOrder = dv.current().sort_order_insights || 'desc';

    if (!idMidia) { dv.paragraph("❌ ERRO: 'midia_selecionada_id' não encontrado no frontmatter do Dashboard."); return; }
    
    const hub = dv.pages().where(p => p.id_midia === idMidia && p.tipo === "video_hub")[0];
    if (!hub) { dv.paragraph(`❌ ERRO: HUB de Vídeo com id_midia "${idMidia}" não encontrado.`); return; }

    if (!cicloSelecionado) { dv.paragraph("⚠️ Selecione um ciclo para ver o diagnóstico."); return; }

    if (cicloSelecionado === "Visão Agregada (Todos os Ciclos)") { dv.span("**Resumo de Insights (Todos os Ciclos)**"); } 
    else { dv.span(`**Resumo de Insights (${cicloSelecionado})**`); }

    const videoFolder = hub.file.folder.split('/').slice(0, -1).join('/');
    const ciclosFolder = `${videoFolder}/Anotações`;

    let notasDeCiclo;
    if (cicloSelecionado === "Visão Agregada (Todos os Ciclos)") {
        notasDeCiclo = dv.pages(`"${ciclosFolder}"`).where(p => p.tipo === 'video_anotacoes' && p.hub_uid === hub.sota_uid);
    } else {
        const numeroCiclo = parseInt(cicloSelecionado.replace('Ciclo ', ''));
        if (isNaN(numeroCiclo)) { dv.paragraph("⚠️ Ciclo selecionado inválido."); return; }
        notasDeCiclo = dv.pages(`"${ciclosFolder}"`).where(p => p.tipo === 'video_anotacoes' && p.hub_uid === hub.sota_uid && p.ciclo === numeroCiclo);
    }

    if (notasDeCiclo.length > 0) {
        const totalIdeias = notasDeCiclo.ideias_geradas.values.reduce((a, b) => (a || 0) + (b || 0), 0);
        const totalReflexoes = notasDeCiclo.reflexoes_geradas.values.reduce((a, b) => (a || 0) + (b || 0), 0);
        dv.paragraph(`**Total:** 💡 ${totalIdeias} Ideias | 🤔 ${totalReflexoes} Reflexões`);

        const dadosOrdenados = notasDeCiclo.sort(p => p[sortBy] || 0, sortOrder);

        const headers = cicloSelecionado === "Visão Agregada (Todos os Ciclos)"
            ? ["Ciclo", "💡 Ideias", "🤔 Reflexões"] 
            : ["Ciclo", "💡 Ideias", "🤔 Reflexões"];

        const tableData = dadosOrdenados.map(p => {
            const row = [
                dv.fileLink(p.file.path, false, `Ciclo ${p.ciclo}`),
                p.ideias_geradas || 0,
                p.reflexoes_geradas || 0
            ];
            return row;
        });
        
        dv.table(headers, tableData);
    } else {
        dv.paragraph("Nenhuma nota de ciclo com insights encontrada para o período selecionado.");
    }
}
main();