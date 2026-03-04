// SCRIPT MESTRE PARA CRIAÇÃO DE MÍDIA - v4.0 (Lógica de Artigo Híbrida)

module.exports = async (params) => {
    const { quickAddApi: qa, obsidian } = params;
    const { Notice } = obsidian;

    try {
        const tiposDeMidia = {
            "📚 Livro": "Criar Nota de Livro",
            "🎓 Curso": "Criar Novo Curso", 
            "🎬 Filme": "Criar Nota de Filme",
            "📺 Série": "Criar Nota de Série",
            "📄 Artigo": "ARTIGO_HIBRIDO",
            "📖 Documentação": "Criar Nova Documentação",
            "📽️ Documentário": "DOCUMENTARIO_HIBRIDO",
            "📹 Vídeo": "Criar Nota de Vídeo",
            "🎙️ Podcast": "PODCAST_HIBRIDO",
            "🎮 Jogo": "Criar Jogo"
        };

        const escolha = await qa.suggester(
            Object.keys(tiposDeMidia),
            Object.values(tiposDeMidia),
            false,
            "Selecione o tipo de mídia que deseja adicionar..."
        );

        if (!escolha) {
            return; // Usuário cancelou
        }

        // --- INÍCIO DA NOVA LÓGICA HÍBRIDA PARA ARTIGOS ---
        if (escolha === "ARTIGO_HIBRIDO") {
            const tiposDeArtigo = {
                "📄 Artigo Curto (Consumo Rápido)": "Criar Artigo Atômico",
                "📚 Artigo Longo / Paper (Projeto de Leitura)": "Criar Artigo Paginado"
            };

            const escolhaTipoArtigo = await qa.suggester(
                Object.keys(tiposDeArtigo),
                Object.values(tiposDeArtigo),
                false,
                "Qual o tipo de artigo?"
            );

            if (!escolhaTipoArtigo) {
                return; // Usuário cancelou a segunda escolha
            }
            
            // Executa a macro final específica para o tipo de artigo
            await qa.executeChoice(escolhaTipoArtigo);

        } else if (escolha === "DOCUMENTARIO_HIBRIDO") {
            const tiposDeDocumentario = {
                "🎬 Documentário Único (Um episódio)": "Criar Documentario Unico",
                "📺 Documentário Serializado (Com Varios Episódios/Temporadas)": "Criar Documentario Serializado"
            };

            const escolhaTipoDocumentario = await qa.suggester(
                Object.keys(tiposDeDocumentario),
                Object.values(tiposDeDocumentario),
                false,
                "Qual o tipo de documentário?"
            );

            if (!escolhaTipoDocumentario) {
                return; // Usuário cancelou a segunda escolha
            }
            
            await qa.executeChoice(escolhaTipoDocumentario);

        } else if (escolha === "PODCAST_HIBRIDO") {
            const tiposDePodcast = {
                "🎙️ Podcast Único (Um episódio)": "Criar Podcast Unico",
                "📻 Podcast Serializado (Com Varios Episódios/Temporadas)": "Criar Podcast Serializado"
            };

            const escolhaTipoPodcast = await qa.suggester(
                Object.keys(tiposDePodcast),
                Object.values(tiposDePodcast),
                false,
                "Qual o tipo de podcast?"
            );

            if (!escolhaTipoPodcast) {
                return; // Usuário cancelou a segunda escolha
            }
            
            await qa.executeChoice(escolhaTipoPodcast);
            
        } else {
            // Lógica original para todos os outros tipos de mídia
            await qa.executeChoice(escolha);
        }
        // --- FIM DA NOVA LÓGICA ---
        
    } catch (error) {
        console.error("Erro no script mestre criarMidia:", error);
        new Notice("❌ Ocorreu um erro. Verifique o console.");
    }
};