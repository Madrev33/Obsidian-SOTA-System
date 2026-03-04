// Componente SOTA: renderGuiaMissao.js v1.0
// Responsável por exibir a lista de missões de um jogo.

async function main() {
    const current = dv.current();
    let hubMedia = null;
    
    // Tipo de HUB aceito
    const tipoHub = "jogo_hub";
    // Tipo de arquivo filho (missão)
    const tipoFilho = "jogo_missao";

    // --- 1. DETECÇÃO DE CONTEXTO ---

    // Cenário A: Estamos no Dashboard Central
    if (current.midia_selecionada_id) {
        const idMidia = current.midia_selecionada_id;
        hubMedia = dv.pages().where(p => p.id_midia === idMidia && p.tipo === tipoHub)[0];
        
        if (!hubMedia) {
            dv.paragraph(`❌ ERRO: HUB de Jogo com ID "${idMidia}" não encontrado.`);
            return;
        }
    }
    // Cenário B: Estamos dentro do próprio HUB da Mídia
    else if (current.tipo === tipoHub) {
        hubMedia = current;
    }
    // Cenário C: Contexto inválido
    else {
        dv.paragraph("❌ ERRO: Contexto inválido. Execute em um Dashboard ou HUB de Jogo.");
        return;
    }

    // --- 2. LÓGICA DE BUSCA ---
    
    // Busca arquivos de missão que pertencem a este HUB
    const pages = dv.pages()
        .where(p => p.tipo === tipoFilho && p.hub_uid === hubMedia.sota_uid);

    // Ordenação por Ciclo e Número da Missão
    pages.sort(p => {
        const cicloMatch = p.file.path.match(/Ciclo_(\d+)/);
        const cicloNum = cicloMatch ? parseInt(cicloMatch[1]) : 0;
        return (cicloNum * 10000) + (p.numero_missao || 0);
    }, 'asc');

    if (pages.length > 0) {
        const tableData = pages.map(p => {
            const cicloMatch = p.file.path.match(/Ciclo_(\d+)/);
            const cicloNum = cicloMatch ? `Ciclo ${parseInt(cicloMatch[1])}` : "N/A";
            
            // Extrai o nome da pasta da missão para exibição mais limpa
            // Ex: "01 - Missão Tutorial/01. Anotações.md" -> "01 - Missão Tutorial"
            const pastaMissao = p.file.folder.split('/').pop();
            const nomeMissaoDisplay = pastaMissao.replace(/^\d+\s*-\s*/, ''); // Remove o número prefixo se quiser

            const row = [
                cicloNum,
                dv.fileLink(p.file.path, false, nomeMissaoDisplay || `Missão ${p.numero_missao}`)
            ];
            return row;
        });
        
        dv.table(
            ["Ciclo", "Missão"],
            tableData
        );

    } else {
        dv.paragraph("Nenhuma missão encontrada. Use o botão 'Adicionar Nova Missão' para começar.");
    }
}

await main();