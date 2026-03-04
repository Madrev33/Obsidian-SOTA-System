// Componente SOTA: renderDiagnosticoInsights.js (para Livros) v1.2
// CORREÇÃO: Remove erro de sintaxe na declaração de `headers`.
// CORREÇÃO: Altera a busca de capítulos para usar o sota_uid do HUB.

async function main() {
    const idMidia = dv.current().midia_selecionada_id;
    const tipoMidia = dv.current().midia_selecionada_tipo;
    const cicloSelecionado = dv.current().ciclo_selecionado_view;
    const sortBy = dv.current().sort_by_insights || 'path';
    const sortOrder = dv.current().sort_order_insights || 'asc';

    if (!idMidia) { dv.paragraph("❌ ERRO: 'midia_selecionada_id' não encontrado no frontmatter do Dashboard."); return; }
    
    const hub = dv.pages().where(p => p.id_midia === idMidia && p.tipo === "livro_paginado_hub")[0];
    if (!hub) { dv.paragraph(`❌ ERRO: HUB de Livro com id_midia "${idMidia}" não encontrado.`); return; }

    if (!cicloSelecionado) { dv.paragraph("⚠️ Selecione um ciclo para ver o diagnóstico."); return; }

    if (cicloSelecionado === "Visão Agregada (Todos os Ciclos)") { dv.span("**Resumo de Insights (Todos os Ciclos)**"); } 
    else { dv.span(`**Resumo de Insights (${cicloSelecionado})**`); }

    const livroFolder = hub.file.folder.split('/').slice(0, -1).join('/');
    const capitulosFolder = `${livroFolder}/Capitulos`;

    let capitulos;
    if (cicloSelecionado === "Visão Agregada (Todos os Ciclos)") {
        capitulos = dv.pages(`"${capitulosFolder}"`).where(p => p.tipo === 'livro_capitulo' && p.hub_uid === hub.sota_uid);
    } else {
        const numeroCiclo = parseInt(cicloSelecionado.replace('Ciclo ', ''));
        if (isNaN(numeroCiclo)) { dv.paragraph("⚠️ Ciclo selecionado inválido."); return; }
        capitulos = dv.pages(`"${capitulosFolder}"`).where(p => p.tipo === 'livro_capitulo' && p.hub_uid === hub.sota_uid && p.ciclo === numeroCiclo);
    }

    if (capitulos.length > 0) {
        const totalIdeias = capitulos.ideias_geradas.values.reduce((a, b) => (a || 0) + (b || 0), 0);
        const totalReflexoes = capitulos.reflexoes_geradas.values.reduce((a, b) => (a || 0) + (b || 0), 0);
        dv.paragraph(`**Total:** 💡 ${totalIdeias} Ideias | 🤔 ${totalReflexoes} Reflexões`);
        
        const dadosOrdenados = capitulos.sort(p => {
            const value = p[sortBy] !== undefined ? p[sortBy] : p.file[sortBy];
            return value;
        }, sortOrder);

        // --- CORREÇÃO DE SINTAXE APLICADA AQUI ---
        const headers = cicloSelecionado === "Visão Agregada (Todos os Ciclos)"
            ? ["Ciclo", "Capítulo", "💡 Ideias", "🤔 Reflexões"] 
            : ["Capítulo", "💡 Ideias", "🤔 Reflexões"];

        const tableData = dadosOrdenados.map(p => {
            const pathParts = p.file.path.split('/');
            const nomePastaCapitulo = pathParts[pathParts.length - 2];
            let displayText = `Cap. ${p.numero_capitulo || 'N/A'}`;

            if (nomePastaCapitulo) {
               const numeroMatch = nomePastaCapitulo.match(/^(\d+)/);
               if (numeroMatch) {
                   const numeroCapituloFormatado = numeroMatch[1];
                   displayText = dv.fileLink(p.file.path, false, `Cap. ${numeroCapituloFormatado}`);
               }
            }

            const row = [
                displayText,
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
        dv.paragraph("Nenhuma nota de capítulo com insights encontrado para o período selecionado.");
    }
}
main();