// SOTA - adicionarTarefaMidia.js v1.2 (Extração de Contexto por Estrutura de Pasta)

module.exports = async (params) => {
    const { app, quickAddApi: qa, obsidian } = params;
    const { Notice, TFile } = obsidian;

    const sotaLog = (msg, data) => console.log(`[SOTA adicionarTarefaMidia] - ${msg}`, data !== undefined ? data : "");
    sotaLog("Iniciando script universal de criação de tarefa...");

    const sanitizar = (str) => {
        if (!str) return "";
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[-\s,]+/g, '_').replace(/[^\w_]+/g, '');
    };

    try {
        // --- ETAPA 1: INPUTS DO USUÁRIO (Inalterada) ---
        const activeFilePath = params.variables?.active_file_path;
        if (!activeFilePath) { new Notice("❌ ERRO: Caminho do arquivo de anotações não recebido."); return; }
        const activeFile = app.vault.getAbstractFileByPath(activeFilePath);
        if (!(activeFile instanceof TFile)) { new Notice("❌ ERRO: Não foi possível encontrar o arquivo de anotações ativo."); return; }
        const dv = app.plugins.plugins.dataview?.api;
        if (!dv) { new Notice("❌ ERRO: Dataview não está ativo."); return; }
        const nomeTarefa = await qa.inputPrompt("Qual o nome da nova tarefa?");
        if (!nomeTarefa) return;
        const sessoes = await qa.inputPrompt("Estimativa de Pomodoros?", "1");
        const numSessoes = parseInt(sessoes) || 1;
        const matrizXpDesafios = { 'trivial': 10, 'facil': 20, 'moderado': 40, 'desafiador': 80, 'hardcore': 150 };
        const dificuldades = {
            [`👌 Trivial (${matrizXpDesafios['trivial']} XP)`]: "trivial",
            [`👍 Fácil (${matrizXpDesafios['facil']} XP)`]: "facil",
            [`💪 Moderado (${matrizXpDesafios['moderado']} XP)`]: "moderado",
            [`🔥 Desafiador (${matrizXpDesafios['desafiador']} XP)`]: "desafiador",
            [`🏆 Hardcore (${matrizXpDesafios['hardcore']} XP)`]: "hardcore"
        };
        const dificuldade = await qa.suggester(Object.keys(dificuldades), Object.values(dificuldades));
        if (!dificuldade) return;

        // --- ETAPA 2: ENGENHARIA REVERSA DE CONTEXTO (Inalterada) ---
        new Notice("⚙️ Analisando contexto da mídia...");
        const cacheAnotacoes = app.metadataCache.getFileCache(activeFile);
        const fm_paginaAnotacoes = cacheAnotacoes?.frontmatter;
        if (!fm_paginaAnotacoes || !fm_paginaAnotacoes.hub_uid) { new Notice("❌ ERRO: 'hub_uid' não encontrado na nota de anotações."); return; }
        const hub = dv.pages().where(p => p.sota_uid === fm_paginaAnotacoes.hub_uid)[0];
        if (!hub) { new Notice(`❌ ERRO: Não foi possível encontrar o HUB com UID ${fm_paginaAnotacoes.hub_uid}.`); return; }
        
        const idMidia = hub.id_midia;
        const cicloNum = hub.ciclo_de_consumo_atual || 1;
        const tipoMidia = hub.tipo;
        if (!idMidia || !tipoMidia) { new Notice("❌ ERRO: 'id_midia' ou 'tipo' ausentes no HUB da mídia."); return; }
        
        let tagHierarquica = "";
        let tipoMidiaBase = tipoMidia.replace('_hub', '').replace('_paginado', '').replace('_atomico', '');

        // --- ETAPA 3: CONSTRUÇÃO DINÂMICA DA TAG (LÓGICA REFINADA) ---
        sotaLog(`Construindo tag para o tipo de mídia: ${tipoMidia}`);
        switch (tipoMidia) {
            case 'livro_paginado_hub':
            case 'artigo_paginado_hub':
            case 'documentacao_paginado_hub':
                const unidadeNome = tipoMidia.includes('livro') ? 'capitulo' : 'secao';
                
                // --- INÍCIO DA CORREÇÃO ---
                // Padrão de Ouro: Extrair o número da pasta pai da nota de anotações.
                const pastaDaUnidade = activeFile.parent;
                if (!pastaDaUnidade) { new Notice("❌ ERRO: Estrutura de pastas inválida, não foi possível encontrar a pasta pai."); return; }
                const numUnidadeMatch = pastaDaUnidade.name.match(/^(\d+)/);
                const numUnidade = numUnidadeMatch ? numUnidadeMatch[1] : null;
                // --- FIM DA CORREÇÃO ---

                if (!numUnidade) { new Notice(`❌ ERRO: Não foi possível extrair o número do ${unidadeNome} do nome da pasta '${pastaDaUnidade.name}'.`); return; }
                tagHierarquica = `#midia/${tipoMidiaBase}/${idMidia}/ciclo_${cicloNum}/${unidadeNome}_${String(numUnidade).padStart(2, '0')}`;
                break;

            case 'serie_hub':
            case 'curso_hub':
            case 'documentario_serializado_hub':
            case 'podcast_hub':
                const pastaSubUnidade = activeFile.parent;
                const pastaUnidadeSerie = pastaSubUnidade.parent;
                if (!pastaUnidadeSerie) { new Notice("❌ ERRO: Estrutura de pastas da série/curso inválida."); return; }

                const nomeUnidadeSerie = tipoMidia.includes('serie') ? 'temporada' : (tipoMidia.includes('curso') ? 'modulo' : 'temporada');
                let numUnidadeSerieMatch = pastaUnidadeSerie.name.match(/(\d+)$/); // Tenta extrair do FINAL primeiro (ex: "Temporada 01")
                if (!numUnidadeSerieMatch) {
                    numUnidadeSerieMatch = pastaUnidadeSerie.name.match(/^(\d+)/); // Se falhar, tenta extrair do INÍCIO (ex: "01 - Módulo")
                }

                const numUnidadeSerie = numUnidadeSerieMatch ? numUnidadeSerieMatch[1] : null; // Usa o grupo de captura [1]
                if (!numUnidadeSerie) { new Notice(`❌ ERRO: Não foi possível extrair o número da ${nomeUnidadeSerie} da pasta '${pastaUnidadeSerie.name}'.`); return; }
                
                const subUnidadeNome = tipoMidia.includes('serie') || tipoMidia.includes('podcast') ? 'episodio' : 'aula';
                const numSubUnidadeMatch = pastaSubUnidade.name.match(/^(\d+)/);
                const numSubUnidade = numSubUnidadeMatch ? numSubUnidadeMatch[1] : null;
                if (!numSubUnidade) { new Notice(`❌ ERRO: Não foi possível extrair o número do ${subUnidadeNome} da pasta.`); return; }
                
                tagHierarquica = `#midia/${tipoMidiaBase}/${idMidia}/ciclo_${cicloNum}/${nomeUnidadeSerie}_${String(numUnidadeSerie).padStart(2, '0')}/${subUnidadeNome}_${String(numSubUnidade).padStart(2, '0')}`;
                break;

            case 'filme_hub':
            case 'video_hub':
            case 'artigo_atomico_hub':
            case 'documentario_unico_hub':
            case 'podcast_unico_hub':
                tagHierarquica = `#midia/${tipoMidiaBase}/${idMidia}/ciclo_${cicloNum}`;
                break;

            default:
                new Notice(`⚠️ AVISO: Tipo de mídia '${tipoMidia}' não reconhecido. Usando tag genérica.`);
                tagHierarquica = `#midia/${idMidia}`;
                break;
        }

        // --- ETAPA 4: MONTAGEM FINAL E INSERÇÃO (Inalterada) ---
        const nomeTarefaSanitizado = sanitizar(nomeTarefa);
        const dificuldadeSanitizada = sanitizar(dificuldade);
        
        const tagCompleta = `${tagHierarquica}/${nomeTarefaSanitizado} #nivel/dificuldade/${dificuldadeSanitizada}`;
        const textoTarefa = `- [ ] [🍅:: 0/${numSessoes}] ${nomeTarefa} ${tagCompleta}`;
        sotaLog("Tag final gerada:", tagCompleta);

        const fileContent = await app.vault.read(activeFile);
        const lines = fileContent.split('\n');
        const marcador = lines.find(line => line.trim().match(/^##\s*✅\s*Tarefas/));

        if (marcador) {
            const insertIndex = lines.findIndex(line => line.trim() === marcador.trim());
            let lastTaskIndex = insertIndex;
            for (let i = insertIndex + 1; i < lines.length; i++) {
                if (lines[i].trim().startsWith("- [ ]") || lines[i].trim().startsWith("- [x]")) {
                    lastTaskIndex = i;
                } else if (lines[i].trim() !== "" && !lines[i].trim().startsWith("```meta-bind-button")) {
                    break;
                }
            }
            lines.splice(lastTaskIndex + 1, 0, textoTarefa);
            await app.vault.modify(activeFile, lines.join('\n'));
            new Notice(`✅ Tarefa "${nomeTarefa}" adicionada!`);
            sotaLog("Tarefa inserida com sucesso.");
        } else {
            new Notice(`❌ ERRO: Seção de tarefas (## ✅ Tarefas...) não encontrada na nota.`);
        }

    } catch (e) {
        new Notice("❌ ERRO crítico ao adicionar tarefa. Verifique o console.");
        sotaLog("ERRO CRÍTICO:", e);
    }
};