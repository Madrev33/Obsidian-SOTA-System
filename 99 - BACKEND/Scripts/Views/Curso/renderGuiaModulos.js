// Componente SOTA: renderGuiaModulos.js (v2.1 - Contexto Híbrido)
// Responsável por exibir a lista completa de módulos.
// Funciona tanto no Dashboard Central quanto dentro do HUB do Curso.

async function main() {
    const current = dv.current();
    let hubCurso = null;

    // --- 1. DETECÇÃO DE CONTEXTO ---
    
    // Cenário A: Estamos no Dashboard Central
    if (current.midia_selecionada_id) {
        const idMidia = current.midia_selecionada_id;
        hubCurso = dv.pages().where(p => p.id_midia === idMidia && p.tipo === "curso_hub")[0];
        
        if (!hubCurso) {
            dv.paragraph(`❌ ERRO: HUB de Curso com ID "${idMidia}" não encontrado.`);
            return;
        }
    }
    // Cenário B: Estamos dentro do próprio HUB do Curso
    else if (current.tipo === "curso_hub") {
        hubCurso = current;
    }
    // Cenário C: Contexto inválido
    else {
        dv.paragraph("❌ ERRO: Contexto inválido. Este script deve rodar em um Dashboard ou em um HUB de Curso.");
        return;
    }

    // --- 2. LÓGICA DE BUSCA (Mantida e Robusta) ---
    // Agora que temos o objeto 'hubCurso' garantido, buscamos os módulos filhos
    
    const pages = dv.pages()
        .where(p => p.tipo === 'curso_modulo_hub' && p.hub_uid === hubCurso.sota_uid);

    // Ordenação aprimorada para garantir a ordem correta de ciclo e módulo.
    pages.sort(p => {
        const cicloMatch = p.file.path.match(/Ciclo_(\d+)/);
        const cicloNum = cicloMatch ? parseInt(cicloMatch[1]) : 0;
        // Cria um valor numérico único para ordenação (ex: Ciclo 1 Mod 3 -> 1003)
        return (cicloNum * 1000) + (p.numero_modulo || 0);
    }, 'asc');

    if (pages.length > 0) {
        const tableData = pages.map(p => {
            const cicloMatch = p.file.path.match(/Ciclo_(\d+)/);
            const cicloNum = cicloMatch ? `Ciclo ${parseInt(cicloMatch[1])}` : "N/A";
            
            const row = [
                cicloNum,
                dv.fileLink(p.file.path, false, `Módulo ${p.numero_modulo}`),
                p.total_aulas || 0
            ];
            return row;
        });
        
        dv.table(
            ["Ciclo", "Módulo", "Total de Aulas"],
            tableData
        );

    } else {
        dv.paragraph("Nenhum HUB de módulo encontrado para este curso. Use o botão 'Adicionar Novo Módulo' para começar.");
    }
}

main();