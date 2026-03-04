// Componente SOTA: renderDiagnosticoInsightsJogo.js (v1.1 - Table Layout Fix)
// Baseado na lógica robusta "Live Read" para evitar problemas de cache.

async function main() {
    const idMidia = dv.current().midia_selecionada_id;
    const cicloSelecionado = dv.current().ciclo_selecionado_view;
    const sortBy = dv.current().sort_by_insights || 'ideias_geradas';
    const sortOrder = dv.current().sort_order_insights || 'desc';

    if (!idMidia) { dv.paragraph("❌ ERRO: 'midia_selecionada_id' não encontrado."); return; }
    
    const hub = dv.pages().where(p => p.id_midia === idMidia && p.tipo === "jogo_hub")[0];
    if (!hub) { dv.paragraph(`❌ ERRO: HUB de Jogo não encontrado.`); return; }
    
    const hubUidParaBusca = hub.sota_uid;
    if (!hubUidParaBusca) { dv.paragraph("❌ ERRO: HUB não tem 'sota_uid'."); return; }
    
    if (!cicloSelecionado) { dv.paragraph("⚠️ Selecione um ciclo."); return; }

    if (cicloSelecionado === "Visão Agregada (Todos os Ciclos)") { dv.span("**Resumo de Insights (Todos os Ciclos)**"); } 
    else { dv.span(`**Resumo de Insights (${cicloSelecionado})**`); }

    // --- LÓGICA DE LEITURA AO VIVO ---
    const allFiles = app.vault.getMarkdownFiles();
    const notasDeCicloBrutas = [];

    for (const file of allFiles) {
        const cache = app.metadataCache.getFileCache(file);
        const fm = cache?.frontmatter;
        
        if (fm && fm.hub_uid === hubUidParaBusca && (fm.tipo === 'jogo_anotacoes' || fm.tipo === 'jogo_missao')) {
            notasDeCicloBrutas.push({
                file: { path: file.path, link: dv.fileLink(file.path) },
                ciclo: fm.ciclo,
                // Captura 'numero_missao' do frontmatter (Fallback para 'missao' se houver legado)
                missao: fm.numero_missao || fm.missao || "N/A", 
                ideias_geradas: fm.ideias_geradas,
                reflexoes_geradas: fm.reflexoes_geradas
            });
        }
    }
    
    let notasDeCiclo = [];
    if (cicloSelecionado === "Visão Agregada (Todos os Ciclos)") {
        notasDeCiclo = notasDeCicloBrutas;
    } else {
        const numeroCiclo = parseInt(cicloSelecionado.replace('Ciclo ', ''));
        if (!isNaN(numeroCiclo)) {
            notasDeCiclo = notasDeCicloBrutas.filter(p => p.ciclo === numeroCiclo);
        }
    }

    if (notasDeCiclo.length > 0) {
        const totalIdeias = notasDeCiclo.reduce((a, b) => (a || 0) + (b.ideias_geradas || 0), 0);
        const totalReflexoes = notasDeCiclo.reduce((a, b) => (a || 0) + (b.reflexoes_geradas || 0), 0);
        dv.paragraph(`**Total:** 💡 ${totalIdeias} Ideias | 🤔 ${totalReflexoes} Reflexões`);

        const dadosOrdenados = notasDeCiclo.sort((a, b) => {
            // Se o usuário clicou em ordenar por insights, mantém a lógica dinâmica
            if (sortBy !== 'ideias_geradas') { 
                 const valA = a[sortBy] || 0;
                 const valB = b[sortBy] || 0;
                 return sortOrder === 'asc' ? valA - valB : valB - valA;
            }
            // Default: Ordena por Ciclo e depois por Missão
            if (a.ciclo !== b.ciclo) return a.ciclo - b.ciclo;
            return (parseInt(a.missao) || 0) - (parseInt(b.missao) || 0);
        });

        // Headers Separados
        const headers = ["Ciclo", "Missão", "💡 Ideias", "🤔 Reflexões"];
        
        const tableData = dadosOrdenados.map(p => {
            const row = [
                `Ciclo ${p.ciclo}`,       // Coluna 1: Ciclo
                `Missão ${p.missao}`,     // Coluna 2: Missão (Número do Frontmatter)
                p.ideias_geradas || 0,    // Coluna 3: Ideias
                p.reflexoes_geradas || 0  // Coluna 4: Reflexões
            ];
            return row;
        });
        
        dv.table(headers, tableData);
    } else {
        dv.paragraph("Nenhuma nota com insights encontrada para o período selecionado.");
    }
}
main();