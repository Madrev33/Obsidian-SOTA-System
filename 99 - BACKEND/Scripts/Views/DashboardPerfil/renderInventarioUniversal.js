// 99 - BACKEND/Scripts/Views/DashboardPerfil/renderInventarioUniversal.js
// SOTA v3.1 - Inventário Universal com Lógica de Prioridade de Pasta
// Prioriza a localização física do arquivo (Para Consumir, Em Progresso, Concluídas) antes de olhar o status do frontmatter.

async function main() {
    // Mapa de Configuração (Onde buscar o quê)
    const mapaInventario = [
        { tipo: "🚀 Projetos", tipoFrontmatter: "projeto_hub", pastaRaiz: "02 - Projetos" },
        { tipo: "📚 Livros", tipoFrontmatter: "livro_paginado_hub", pastaRaiz: "03 - Conhecimento/01 - Mídias" },
        { tipo: "🎓 Cursos", tipoFrontmatter: "curso_hub", pastaRaiz: "03 - Conhecimento/01 - Mídias" },
        { tipo: "🎬 Filmes", tipoFrontmatter: "filme_hub", pastaRaiz: "03 - Conhecimento/01 - Mídias" },
        { tipo: "📺 Séries", tipoFrontmatter: "serie_hub", pastaRaiz: "03 - Conhecimento/01 - Mídias" },
        { tipo: "📽️ Docs", tipoFrontmatter: ["documentario_serializado_hub", "documentario_unico_hub"], pastaRaiz: "03 - Conhecimento/01 - Mídias" },
        { tipo: "🎙️ Podcasts", tipoFrontmatter: ["podcast_hub", "podcast_unico_hub"], pastaRaiz: "03 - Conhecimento/01 - Mídias" },
        { tipo: "📄 Artigos", tipoFrontmatter: ["artigo_paginado_hub", "artigo_atomico_hub"], pastaRaiz: "03 - Conhecimento/01 - Mídias" },
        { tipo: "📹 Vídeos", tipoFrontmatter: "video_hub", pastaRaiz: "03 - Conhecimento/01 - Mídias" },
        { tipo: "🎮 Jogos", tipoFrontmatter: "jogo_hub", pastaRaiz: "03 - Conhecimento/01 - Mídias" }
    ];

    let html = `<div style="display: flex; flex-wrap: wrap; gap: 15px; justify-content: center;">`;
    let globalItemsFound = 0;

    for (const item of mapaInventario) {
        const tiposAceitos = Array.isArray(item.tipoFrontmatter) ? item.tipoFrontmatter : [item.tipoFrontmatter];
        
        // Query Principal (Busca em todas as subpastas)
        const paginas = dv.pages(`"${item.pastaRaiz}"`).where(p => tiposAceitos.includes(p.tipo));
        const total = paginas.length;
        
        if (total === 0) continue;
        globalItemsFound++;

        // Contadores
        let countConcluidos = 0;
        let countAtivos = 0;
        let countBacklog = 0;

        // --- NOVA LÓGICA DE CLASSIFICAÇÃO (CASCATA DE PRIORIDADE) ---
        for (const p of paginas) {
            const status = (p.status || "").toLowerCase();
            const folderPath = p.file.folder.toLowerCase();

            // 1. CHECAGEM POR PASTA (PRIORIDADE MÁXIMA)
            if (folderPath.includes("03. concluídas") || folderPath.includes("concluido")) {
                countConcluidos++;
                continue;
            }
            if (folderPath.includes("02. em progresso")) {
                countAtivos++;
                continue;
            }
            if (folderPath.includes("01. para consumir")) {
                countBacklog++;
                continue;
            }

            // 2. FALLBACK PARA STATUS (SE NÃO ESTIVER NAS PASTAS PADRÃO)
            const isConcluidoStatus = ['concluido', 'concluído', 'arquivado', 'completo', 'resgatado', 'finalizado'].includes(status);
            if (isConcluidoStatus) {
                countConcluidos++;
                continue;
            }
            
            const isAtivoStatus = ['ativo', 'lendo', 'assistindo', 'ouvindo', 'jogando', 'em andamento', 'em progresso', 'iniciado'].includes(status);
            if (isAtivoStatus) {
                countAtivos++;
                continue;
            }

            // 3. SE NENHUM CRITÉRIO BATEU, É BACKLOG
            countBacklog++;
        }

        html += `
        <div style="flex: 1; min-width: 180px; max-width: 220px; background-color: var(--background-secondary); border: 1px solid var(--background-modifier-border); border-radius: 8px; padding: 15px; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="font-size: 1.1em; font-weight: bold; color: var(--text-normal); text-align: center;">${item.tipo}</div>
            <div style="font-size: 2.5em; font-weight: 800; color: var(--text-accent); text-align: center; line-height: 1;">${total}</div>
            <div style="font-size: 0.8em; color: var(--text-muted); text-align: center; border-top: 1px solid var(--background-modifier-border); padding-top: 10px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 5px;">
                <div style="display:flex; flex-direction:column;">
                    <strong style="color: #2ecc71; font-size:1.1em;">${countAtivos}</strong>
                    <span style="font-size:0.85em;">Ativos</span>
                </div>
                <div style="display:flex; flex-direction:column; border-left:1px solid var(--background-modifier-border); border-right:1px solid var(--background-modifier-border);">
                    <strong style="color: #3498db; font-size:1.1em;">${countConcluidos}</strong>
                    <span style="font-size:0.85em;">Feitos</span>
                </div>
                <div style="display:flex; flex-direction:column;">
                    <strong style="color: #95a5a6; font-size:1.1em;">${countBacklog}</strong>
                    <span style="font-size:0.85em;">Fila</span>
                </div>
            </div>
        </div>
        `;
    }

    if (globalItemsFound === 0) {
        dv.paragraph("ℹ️ O Inventário Universal está vazio. Comece criando Projetos ou Mídias.");
        return;
    }

    html += `</div>`;
    dv.paragraph(html);
}

await main();