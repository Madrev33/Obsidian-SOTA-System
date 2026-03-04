// Componente SOTA: renderGuiaTemporada.js (v2.1 - Contexto Híbrido)
// Responsável por exibir a lista completa de temporadas.
// Funciona para Séries, Podcasts e Documentários Seriados.

async function main() {
    const current = dv.current();
    let hubMedia = null;
    
    // Tipos de HUB que possuem temporadas
    const tiposAceitos = ["serie_hub", "podcast_hub", "documentario_serializado_hub"];
    // Tipos de filhos (temporadas) correspondentes
    const tiposFilhos = ["serie_temporada_hub", "podcast_temporada_hub", "documentario_temporada_hub"];

    // --- 1. DETECÇÃO DE CONTEXTO ---

    // Cenário A: Estamos no Dashboard Central
    if (current.midia_selecionada_id) {
        const idMidia = current.midia_selecionada_id;
        // Busca qualquer página que tenha esse ID e seja de um dos tipos aceitos
        hubMedia = dv.pages().where(p => p.id_midia === idMidia && tiposAceitos.includes(p.tipo))[0];
        
        if (!hubMedia) {
            dv.paragraph(`❌ ERRO: HUB Serializado com ID "${idMidia}" não encontrado.`);
            return;
        }
    }
    // Cenário B: Estamos dentro do próprio HUB da Mídia
    else if (tiposAceitos.includes(current.tipo)) {
        hubMedia = current;
    }
    // Cenário C: Contexto inválido
    else {
        dv.paragraph("❌ ERRO: Contexto inválido. Execute em um Dashboard ou HUB de Série/Podcast/Doc.");
        return;
    }

    // --- 2. LÓGICA DE BUSCA ---
    
    const pages = dv.pages()
        .where(p => tiposFilhos.includes(p.tipo) && p.hub_uid === hubMedia.sota_uid);

    // Ordenação
    pages.sort(p => {
        const cicloMatch = p.file.path.match(/Ciclo_(\d+)/);
        const cicloNum = cicloMatch ? parseInt(cicloMatch[1]) : 0;
        return (cicloNum * 1000) + (p.numero_temporada || 0);
    }, 'asc');

    if (pages.length > 0) {
        const tableData = pages.map(p => {
            const cicloMatch = p.file.path.match(/Ciclo_(\d+)/);
            const cicloNum = cicloMatch ? `Ciclo ${parseInt(cicloMatch[1])}` : "N/A";
            
            const row = [
                cicloNum,
                dv.fileLink(p.file.path, false, `Temporada ${p.numero_temporada}`),
                p.total_episodios || 0
            ];
            return row;
        });
        
        dv.table(
            ["Ciclo", "Temporada", "Total de Episódios"],
            tableData
        );

    } else {
        dv.paragraph("Nenhuma temporada encontrada. Use o botão 'Adicionar Nova Temporada' para começar.");
    }
}

main();