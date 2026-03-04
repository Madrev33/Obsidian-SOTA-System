// SOTA - adicionarTarefaProjeto.js v2.0 (Com Gamificação XP)
// Script para adicionar uma nova tarefa a uma Fase específica de um HUB de Projeto.

module.exports = async (params) => {
    const { app, quickAddApi: qa, obsidian } = params;
    const { Notice, TFile } = obsidian;

    try {
        // --- 1. OBTER CONTEXTO (DO BOTÃO DA FASE) ---
        const activeFilePath = params.variables?.active_file_path;
        const nomeFase = params.variables?.fase_nome;
        const idFase = params.variables?.fase_id;

        if (!activeFilePath || !nomeFase || !idFase) {
            new Notice("❌ ERRO: Contexto da fase (arquivo, nome ou id) não recebido.");
            return;
        }

        const activeFile = app.vault.getAbstractFileByPath(activeFilePath);
        if (!(activeFile instanceof TFile)) {
            new Notice("❌ ERRO: Não foi possível encontrar o arquivo HUB do Projeto.");
            return;
        }
        
        const dv = app.plugins.plugins.dataview?.api;
        if (!dv) { new Notice("❌ ERRO: Dataview não está ativo."); return; }

        // --- 2. COLETAR INPUTS DO USUÁRIO (NOME, POMODOROS, DIFICULDADE) ---
        const nomeTarefa = await qa.inputPrompt(`Nova tarefa para a fase '${nomeFase}':`);
        if (!nomeTarefa) {
            new Notice("ℹ️ Criação de tarefa cancelada.");
            return;
        }
        
        const sessoes = await qa.inputPrompt("Estimativa de Pomodoros?", "1");
        const numSessoes = parseInt(sessoes) || 1;

        // Lógica de XP / Dificuldade SOTA
        const matrizXpDesafios = { 'trivial': 10, 'facil': 20, 'moderado': 40, 'desafiador': 80, 'hardcore': 150 };
        const dificuldades = {
            [`👌 Trivial (${matrizXpDesafios['trivial']} XP)`]: "trivial",
            [`👍 Fácil (${matrizXpDesafios['facil']} XP)`]: "facil",
            [`💪 Moderado (${matrizXpDesafios['moderado']} XP)`]: "moderado",
            [`🔥 Desafiador (${matrizXpDesafios['desafiador']} XP)`]: "desafiador",
            [`🏆 Hardcore (${matrizXpDesafios['hardcore']} XP)`]: "hardcore"
        };
        
        const dificuldade = await qa.suggester(Object.keys(dificuldades), Object.values(dificuldades));
        if (!dificuldade) return; // Cancela se não escolher dificuldade

        // --- 3. CONSTRUÇÃO DA TAG HIERÁRQUICA SOTA ---
        const paginaHub = dv.page(activeFile.path);
        if (!paginaHub || !paginaHub.id_projeto) {
            new Notice("❌ ERRO: 'id_projeto' não encontrado no frontmatter do HUB.");
            return;
        }

        const sanitizar = (str) => {
            if (!str) return "";
            return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[-\s,]+/g, '_').replace(/[^\w_]+/g, '');
        };

        const idProjeto = paginaHub.id_projeto;
        const nomeTarefaSanitizado = sanitizar(nomeTarefa);
        const dificuldadeSanitizada = sanitizar(dificuldade); // Garante que a tag de dificuldade fique limpa

        // Tags:
        // 1. Rastreamento de Projeto: #projeto/{id}/{fase}/{tarefa}
        // 2. Rastreamento de Gamificação: #nivel/dificuldade/{nivel}
        const tagProjeto = `#projeto/${idProjeto}/${idFase}/${nomeTarefaSanitizado}`;
        const tagXP = `#nivel/dificuldade/${dificuldadeSanitizada}`;
        
        const textoTarefa = `- [ ] [🍅:: 0/${numSessoes}] ${nomeTarefa} ${tagProjeto} ${tagXP}`;

        // --- 4. LÓGICA DE INSERÇÃO INTELIGENTE NA SEÇÃO CORRETA ---
        const fileContent = await app.vault.read(activeFile);
        const lines = fileContent.split('\n');
        const marcadorFase = `### Fase: ${nomeFase}`;
        
        // Encontra o índice da linha do cabeçalho da fase
        const insertIndex = lines.findIndex(line => line.trim() === marcadorFase);

        if (insertIndex !== -1) {
            let lastTaskIndex = insertIndex;
            // Procura pela última linha de conteúdo (tarefa ou botão) dentro da seção da fase
            for (let i = insertIndex + 1; i < lines.length; i++) {
                const linhaTrim = lines[i].trim();
                // A próxima heading de nível 3 ou um separador '---' marca o fim da seção
                if (linhaTrim.startsWith("### ") || linhaTrim === '---') {
                    break;
                }
                // Atualiza o índice para a última linha que não está vazia
                if (linhaTrim !== "") {
                    lastTaskIndex = i;
                }
            }
            
            // Insere a nova tarefa após o último conteúdo encontrado na seção
            lines.splice(lastTaskIndex + 1, 0, textoTarefa);
            await app.vault.modify(activeFile, lines.join('\n'));
            new Notice(`✅ Tarefa "${nomeTarefa}" adicionada à fase '${nomeFase}'!`);
        } else {
            new Notice(`❌ ERRO: Seção '${marcadorFase}' não encontrada. A tarefa não pôde ser inserida.`);
        }

    } catch (e) {
        console.error("Erro ao adicionar Tarefa de Projeto:", e);
        new Notice("❌ Ocorreu um erro crítico. Verifique o console.");
    }
};