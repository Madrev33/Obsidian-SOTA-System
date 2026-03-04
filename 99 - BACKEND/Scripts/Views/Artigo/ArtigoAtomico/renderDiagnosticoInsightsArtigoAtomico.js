// Componente SOTA: renderDiagnosticoInsightsArtigoAtomico.js v1.1
// Exibe os insights (ideias e reflexões) gerados durante o consumo de um artigo.
// CORREÇÃO: Altera a busca de notas para usar o sota_uid do HUB.
// CORREÇÃO: Remove erro de sintaxe na declaração de `headers`.

async function main() {
    const idMidia = dv.current().midia_selecionada_id;
    const tipoMidia = dv.current().midia_selecionada_tipo;
    const cicloSelecionado = dv.current().ciclo_selecionado_view;
    const sortBy = dv.current().sort_by_insights || 'ideias_geradas';
    const sortOrder = dv.current().sort_order_insights || 'desc';

    if (!idMidia) { dv.paragraph("❌ ERRO: 'midia_selecionada_id' não encontrado no frontmatter do Dashboard."); return; }
    
    const hub = dv.pages().where(p => p.id_midia === idMidia && p.tipo === "artigo_atomico_hub")[0];
    if (!hub) { dv.paragraph(`❌ ERRO: HUB de Artigo Atômico com ID ${idMidia} não encontrado.`); return; }

    if (!cicloSelecionado) { dv.paragraph("⚠️ Selecione um ciclo para ver o diagnóstico."); return; }

    if (cicloSelecionado === "Visão Agregada (Todos os Ciclos)") { dv.span("**Resumo de Insights (Todos os Ciclos)**"); } 
    else { dv.span(`**Resumo de Insights (${cicloSelecionado})**`); }

    const artigoFolder = hub.file.folder.split('/').slice(0, -1).join('/');
    const ciclosFolder = `${artigoFolder}/Anotações`;

    let notasDeCiclo;
    // --- CORREÇÃO DE LÓGICA APLICADA AQUI ---
    if (cicloSelecionado === "Visão Agregada (Todos os Ciclos)") {
        notasDeCiclo = dv.pages(`"${ciclosFolder}"`).where(p => p.tipo === 'artigo_atomico_anotacoes' && p.hub_uid === hub.sota_uid);
    } else {
        const numeroCiclo = parseInt(cicloSelecionado.replace('Ciclo ', ''));
        if (isNaN(numeroCiclo)) { dv.paragraph("⚠️ Ciclo selecionado inválido."); return; }
        notasDeCiclo = dv.pages(`"${ciclosFolder}"`).where(p => p.tipo === 'artigo_atomico_anotacoes' && p.hub_uid === hub.sota_uid && p.ciclo === numeroCiclo);
    }

    if (notasDeCiclo.length > 0) {
        const totalIdeias = notasDeCiclo.ideias_geradas.values.reduce((a, b) => (a || 0) + (b || 0), 0);
        const totalReflexoes = notasDeCiclo.reflexoes_geradas.values.reduce((a, b) => (a || 0) + (b || 0), 0);
        dv.paragraph(`**Total:** 💡 ${totalIdeias} Ideias | 🤔 ${totalReflexoes} Reflexões`);

        const dadosOrdenados = notasDeCiclo.sort(p => p[sortBy] || 0, sortOrder);

        // --- CORREÇÃO DE SINTAXE APLICADA AQUI ---
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