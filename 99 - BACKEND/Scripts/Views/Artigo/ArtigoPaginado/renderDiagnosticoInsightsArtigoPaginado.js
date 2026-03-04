// Componente SOTA: renderDiagnosticoInsightsArtigoPaginado.js v1.1
// Exibe a contagem de insights por seção para Artigos Paginados.
// CORREÇÃO: Altera a busca de seções para usar o sota_uid do HUB.

async function main() {
    const idMidia = dv.current().midia_selecionada_id;
    const tipoMidia = dv.current().midia_selecionada_tipo;
    const cicloSelecionado = dv.current().ciclo_selecionado_view;
    const sortBy = dv.current().sort_by_insights || 'path';
    const sortOrder = dv.current().sort_order_insights || 'asc';

    if (!idMidia) { dv.paragraph("❌ ERRO: 'midia_selecionada_id' não encontrado no frontmatter do Dashboard."); return; }
    
    const hub = dv.pages().where(p => p.id_midia === idMidia && p.tipo === "artigo_paginado_hub")[0];
    if (!hub) { dv.paragraph(`❌ ERRO: HUB de Artigo Paginado com ID ${idMidia} não encontrado.`); return; }

    if (!cicloSelecionado) { dv.paragraph("⚠️ Selecione um ciclo para ver o diagnóstico."); return; }

    if (cicloSelecionado === "Visão Agregada (Todos os Ciclos)") { dv.span("**Resumo de Insights (Todos os Ciclos)**"); } 
    else { dv.span(`**Resumo de Insights (${cicloSelecionado})**`); }

    const artigoFolder = hub.file.folder.split('/').slice(0, -1).join('/');
    const secoesFolder = `${artigoFolder}/Seções`;

    let secoes;
    // --- CORREÇÃO APLICADA AQUI ---
    if (cicloSelecionado === "Visão Agregada (Todos os Ciclos)") {
        secoes = dv.pages(`"${secoesFolder}"`).where(p => p.tipo === 'artigo_paginado_secao' && p.hub_uid === hub.sota_uid);
    } else {
        const numeroCiclo = parseInt(cicloSelecionado.replace('Ciclo ', ''));
        if (isNaN(numeroCiclo)) { dv.paragraph("⚠️ Ciclo selecionado inválido."); return; }
        const cicloFolderPath = `${secoesFolder}/Ciclo_${String(numeroCiclo).padStart(2, '0')}`;
        secoes = dv.pages(`"${cicloFolderPath}"`).where(p => p.tipo === 'artigo_paginado_secao' && p.hub_uid === hub.sota_uid);
    }

    if (secoes.length > 0) {
        const totalIdeias = secoes.ideias_geradas.values.reduce((a, b) => (a || 0) + (b || 0), 0);
        const totalReflexoes = secoes.reflexoes_geradas.values.reduce((a, b) => (a || 0) + (b || 0), 0);
        dv.paragraph(`**Total:** 💡 ${totalIdeias} Ideias | 🤔 ${totalReflexoes} Reflexões`);
        
        const dadosOrdenados = secoes.sort(p => {
            const value = p[sortBy] !== undefined ? p[sortBy] : p.file[sortBy];
            return value;
        }, sortOrder);

        const headers = cicloSelecionado === "Visão Agregada (Todos os Ciclos)" 
            ? ["Ciclo", "Seção", "💡 Ideias", "🤔 Reflexões"] 
            : ["Seção", "💡 Ideias", "🤔 Reflexões"];

        const tableData = dadosOrdenados.map(p => {
            const pathParts = p.file.path.split('/');
            const nomePastaSecao = pathParts[pathParts.length - 2];
            let displayText = `Seção ${p.numero_secao || 'N/A'}`;

            if (nomePastaSecao) {
               const numeroMatch = nomePastaSecao.match(/^(\d+)/);
               if (numeroMatch) {
                   const numeroSecaoFormatado = numeroMatch[1];
                   displayText = dv.fileLink(p.file.path, false, `Seção ${numeroSecaoFormatado}`);
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
        dv.paragraph("Nenhuma seção com insights encontrada para o período selecionado.");
    }
}
main();