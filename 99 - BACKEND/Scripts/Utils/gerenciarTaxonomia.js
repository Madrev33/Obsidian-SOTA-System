// SOTA - Gerenciador de Taxonomia v1.2
// Adiciona a taxonomia "Instrutores" e corrige o erro de referência 'obsidian'.

module.exports = async (params) => {
    // **CORREÇÃO 1: Desestruturar 'obsidian' a partir de 'params'**
    const { app, quickAddApi: qa, obsidian } = params;
    const { Notice } = obsidian;

    try {
        // --- MAPA DE CONFIGURAÇÃO CENTRAL ---
        const taxonomies = {
            "🎨 Categoria": {
                folder: "99 - BACKEND/Fontes_Tags/01 - Categorias",
                promptName: "CATEGORIA",
                mediaMap: {
                    "📚 Livro": "livro_categoria", "🎬 Filme": "filme_categoria",
                    "📺 Série": "serie_categoria", "📄 Artigo": "artigo_categoria",
                    "📽️ Documentário": "documentario_categoria", "🎙️ Podcast": "podcast_categoria",
                    "📹 Vídeo": "video_categoria", "🎓 Curso": "curso_categoria",
                }
            },
            "🏢 Plataforma/Fonte": {
                folder: "99 - BACKEND/Fontes_Tags/02 - Fontes e Plataformas",
                promptName: "PLATAFORMA/FONTE",
                mediaMap: {
                    "📚 Livro": "livro_plataforma", "🎬 Filme": "filme_plataforma",
                    "📺 Série": "serie_plataforma", "📄 Artigo": "artigo_fonte",
                    "📽️ Documentário": "documentario_plataforma", "🎙️ Podcast": "podcast_plataforma",
                    "📹 Vídeo": "video_plataforma", "🎓 Curso": "curso_plataforma",
                }
            },
            "🎬 Diretor(a)/Criador(a)": {
                folder: "99 - BACKEND/Fontes_Tags/03 - Diretores",
                promptName: "DIRETOR(A)/CRIADOR(A)",
                mediaMap: {
                    "🎬 Filme": "filme_diretor", "📺 Série": "serie_diretor",
                    "📽️ Documentário": "documentario_diretor",
                }
            },
            "✍️ Autor(a)": {
                folder: "99 - BACKEND/Fontes_Tags/04 - Autores",
                promptName: "AUTOR(A)",
                mediaMap: { "📚 Livro": "livro_autor", "📄 Artigo": "artigo_autor", }
            },
            "📚 Editora": {
                folder: "99 - BACKEND/Fontes_Tags/05 - Editoras",
                promptName: "EDITORA",
                mediaMap: { "📚 Livro": "livro_editora", }
            },
            "📺 Canal": {
                folder: "99 - BACKEND/Fontes_Tags/06 - Canais",
                promptName: "CANAL",
                mediaMap: { "📹 Vídeo": "video_canal", }
            },
            "🌐 Idioma": {
                folder: "99 - BACKEND/Fontes_Tags/07 - Idiomas",
                promptName: "IDIOMA",
                mediaMap: {
                    "📚 Livro": "livro_idioma", "🎬 Filme": "filme_idioma",
                    "📺 Série": "serie_idioma", "📄 Artigo": "artigo_idioma",
                    "📽️ Documentário": "documentario_idioma", "🎙️ Podcast": "podcast_idioma",
                    "📹 Vídeo": "video_idioma", "🎓 Curso": "curso_idioma",
                }
            },
            // **CORREÇÃO 2: Adicionar nova taxonomia "Instrutores"**
            "👨‍🏫 Instrutor(a)": {
                folder: "99 - BACKEND/Fontes_Tags/08 - Instrutores",
                promptName: "INSTRUTOR(A)",
                mediaMap: {
                    "🎓 Curso": "curso_instrutor",
                }
            },
        };

        // --- PASSO 1: SELECIONAR A TAXONOMIA ---
        const escolhaTaxonomia = await qa.suggester(Object.keys(taxonomies), Object.keys(taxonomies), false, "Qual tipo de tag você deseja criar/gerenciar?");
        if (!escolhaTaxonomia) return;

        const config = taxonomies[escolhaTaxonomia];

        // --- PASSO 2: OBTER O NOME DA TAG ---
        const nomeTag = await qa.inputPrompt(`Qual o nome d${['a','e'].includes(config.promptName.charAt(0).toLowerCase()) ? 'a' : 'o'} nov${['a','e'].includes(config.promptName.charAt(0).toLowerCase()) ? 'a' : 'o'} ${config.promptName}?`);
        if (!nomeTag) return;

        // --- PASSO 3: SELECIONAR AS MÍDIAS APLICÁVEIS ---
        const opcoesMidia = Object.keys(config.mediaMap);
        const escolhasMidia = await qa.checkboxPrompt(opcoesMidia, opcoesMidia);
        if (escolhasMidia.length === 0) {
            new Notice("Nenhuma mídia selecionada. Operação cancelada.");
            return;
        }

        // --- PASSO 4: LÓGICA DE CRIAÇÃO/ATUALIZAÇÃO DE ARQUIVO ---
        if (!await app.vault.adapter.exists(config.folder)) {
            await app.vault.createFolder(config.folder);
        }

        const nomeArquivo = `${nomeTag.replace(/[\\/:"*?<>|#^\[\]]+/g, '')}.md`;
        const caminhoArquivo = `${config.folder}/${nomeArquivo}`;

        let conteudoFinal = "";
        let arquivoExiste = await app.vault.adapter.exists(caminhoArquivo);
        
        if (arquivoExiste) {
            conteudoFinal = await app.vault.adapter.read(caminhoArquivo);
        }

        let tagsAdicionadas = 0;
        for (const midia of escolhasMidia) {
            const prefixo = config.mediaMap[midia];
            const novaTag = `#${prefixo} ${nomeTag}`;
            
            if (!conteudoFinal.includes(novaTag)) {
                conteudoFinal += (conteudoFinal.trim() ? "\n" : "") + novaTag;
                tagsAdicionadas++;
            }
        }

        if (tagsAdicionadas > 0) {
            if (arquivoExiste) {
                await app.vault.adapter.write(caminhoArquivo, conteudoFinal.trim());
            } else {
                await app.vault.create(caminhoArquivo, conteudoFinal.trim());
            }
            new Notice(`✅ Tag "${nomeTag}" criada/atualizada para ${escolhasMidia.length} tipo(s) de mídia!`);
        } else {
            new Notice(`ℹ️ Tag "${nomeTag}" já existia para as mídias selecionadas. Nenhuma alteração feita.`);
        }

    } catch (error) {
        console.error("Erro no script Gerenciar Taxonomia:", error);
        new Notice("❌ Ocorreu um erro. Verifique o console.");
    }
};