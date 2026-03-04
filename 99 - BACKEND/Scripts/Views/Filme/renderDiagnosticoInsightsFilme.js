// Componente SOTA: renderDiagnosticoInsightsFilme.js v1.3 (Live Read)
// Usa a API nativa do Obsidian para ler os arquivos e evitar problemas de cache do Dataview.

async function main() {
    const idMidia = dv.current().midia_selecionada_id;
    const cicloSelecionado = dv.current().ciclo_selecionado_view;
    const sortBy = dv.current().sort_by_insights || 'ideias_geradas';
    const sortOrder = dv.current().sort_order_insights || 'desc';

    if (!idMidia) { dv.paragraph("❌ ERRO: 'midia_selecionada_id' não encontrado."); return; }
    
    // 1. Encontrar o HUB (Ainda podemos usar Dataview para isso, pois é um arquivo estável)
    const hub = dv.pages().where(p => p.id_midia === idMidia && p.tipo === "filme_hub")[0];
    if (!hub) { dv.paragraph(`❌ ERRO: HUB de Filme não encontrado.`); return; }
    
    const hubUidParaBusca = hub.sota_uid;
    if (!hubUidParaBusca) { dv.paragraph("❌ ERRO: HUB não tem 'sota_uid'."); return; }
    
    if (!cicloSelecionado) { dv.paragraph("⚠️ Selecione um ciclo."); return; }

    if (cicloSelecionado === "Visão Agregada (Todos os Ciclos)") { dv.span("**Resumo de Insights (Todos os Ciclos)**"); } 
    else { dv.span(`**Resumo de Insights (${cicloSelecionado})**`); }

    // --- LÓGICA DE LEITURA AO VIVO (Sem Cache Dataview) ---
    const allFiles = app.vault.getMarkdownFiles();
    const notasDeCicloBrutas = [];

    // Loop manual para ler o frontmatter de cada arquivo
    for (const file of allFiles) {
        // Usa a API de cache nativa do Obsidian, que é mais confiável e instantânea que a do Dataview
        const cache = app.metadataCache.getFileCache(file);
        const fm = cache?.frontmatter;
        
        // Filtra por metadados necessários
        if (fm && fm.hub_uid === hubUidParaBusca && fm.tipo === 'filme_anotacoes') {
            // Recriamos o objeto que o Dataview nos daria
            notasDeCicloBrutas.push({
                file: { path: file.path, link: dv.fileLink(file.path) },
                ciclo: fm.ciclo,
                ideias_geradas: fm.ideias_geradas,
                reflexoes_geradas: fm.reflexoes_geradas
            });
        }
    }
    
    // Aplica o filtro de ciclo no array já construído
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
            const valA = a[sortBy] || 0;
            const valB = b[sortBy] || 0;
            if (sortOrder === 'asc') return valA - valB;
            return valB - valA;
        });

        const headers = ["Ciclo", "💡 Ideias", "🤔 Reflexões"];
        const tableData = dadosOrdenados.map(p => [
            dv.fileLink(p.file.path, false, `Ciclo ${p.ciclo}`),
            p.ideias_geradas || 0,
            p.reflexoes_geradas || 0
        ]);
        
        dv.table(headers, tableData);
    } else {
        dv.paragraph("Nenhuma nota de ciclo com insights encontrada para o período selecionado.");
    }
}
main();