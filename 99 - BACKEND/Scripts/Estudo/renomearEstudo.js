// SOTA - renomearEstudo.js v1.0
// Realiza o "Rebrand" de um Estudo:
// 1. Renomeia Pasta Raiz e Arquivo HUB.
// 2. Atualiza Frontmatter (ID e Tópico Central).
// OBS: Estudos não possuem logs de métricas diretos para refatorar.

module.exports = async (params) => {
    const { app, quickAddApi: qa, obsidian } = params;
    const { Notice, TFile, TFolder } = obsidian;

    // --- FUNÇÕES UTILITÁRIAS ---
    const sanitizar = (str) => {
        if (!str) return "";
        return str
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim()
            .replace(/[-\s]+/g, '_')
            .replace(/[^\w_]+/g, '');
    };

    try {
        // 1. CONTEXTO: Obter o HUB Atual
        const activeFile = app.workspace.getActiveFile();
        if (!activeFile) { new Notice("❌ Nenhuma nota ativa."); return; }
        
        // Validação de Segurança: É um HUB de Estudo?
        const cache = app.metadataCache.getFileCache(activeFile);
        if (cache?.frontmatter?.tipo !== 'estudo_hub') {
            new Notice("⚠️ Este script só pode ser executado no HUB de um Estudo.");
            return;
        }

        const nomeAntigo = activeFile.basename.replace("00. HUB - ", "");
        const idAntigo = cache.frontmatter.id_estudo;

        // Estrutura esperada: .../NomeDoEstudo/00. HUB/00. HUB - NomeDoEstudo.md
        // Portanto, a pasta raiz do estudo é a avó do arquivo ativo.
        const pastaHub = activeFile.parent;
        const pastaRaizEstudo = pastaHub.parent;

        // 2. INPUT: Novo Nome
        const novoNome = await qa.inputPrompt(`Renomear estudo "${nomeAntigo}" para:`, nomeAntigo);
        if (!novoNome || novoNome === nomeAntigo) { new Notice("Operação cancelada."); return; }

        const idNovo = sanitizar(novoNome);
        const nomePastaNovo = novoNome.replace(/[\\/:"*?<>|#^\[\]]+/g, '').trim(); // Sanitização para nome de pasta/arquivo

        // Confirmação
        const confirm = await qa.yesNoPrompt(`⚠️ Renomear estudo de '${nomeAntigo}' para '${novoNome}'?`);
        if (!confirm) return;

        new Notice("⚙️ Renomeando Estudo...");

        // --- FASE 1: SISTEMA DE ARQUIVOS ---

        // A. Renomear Arquivo HUB
        // O arquivo ativo precisa ser renomeado primeiro, ou o Obsidian pode perder o rastreio se movermos a pasta pai antes?
        // O Obsidian geralmente rastreia o objeto TFile, então a ordem é flexível, mas vamos renomear o arquivo primeiro.
        const novoNomeArquivoHub = `00. HUB - ${nomePastaNovo}.md`;
        // Nota: O renameFile espera o caminho completo ou apenas o novo nome? A API espera o novo caminho completo.
        const novoCaminhoHub = `${pastaHub.path}/${novoNomeArquivoHub}`;
        await app.fileManager.renameFile(activeFile, novoCaminhoHub);

        // B. Renomear Pasta Raiz do Estudo
        // Verifica se a pasta de destino já existe para evitar colisão/merge acidental
        const novoCaminhoRaizEstudo = `${pastaRaizEstudo.parent.path}/${nomePastaNovo}`;
        
        if (pastaRaizEstudo.name !== nomePastaNovo) { // Só renomeia se o nome da pasta for mudar
            if (!await app.vault.adapter.exists(novoCaminhoRaizEstudo)) {
                await app.fileManager.renameFile(pastaRaizEstudo, novoCaminhoRaizEstudo);
            } else {
                new Notice("⚠️ A pasta de destino já existe. O nome da pasta não foi alterado, apenas o arquivo e metadados.");
            }
        }

        // --- FASE 2: DADOS (Frontmatter) ---
        
        // Atualiza Frontmatter no arquivo (que agora tem novo nome/caminho, mas o objeto 'activeFile' segue ele)
        await app.fileManager.processFrontMatter(activeFile, (fm) => {
            fm.id_estudo = idNovo;
            fm.topico_central = novoNome;
        });

        new Notice(`✅ Estudo renomeado com sucesso para: ${novoNome}`);

    } catch (e) {
        console.error("ERRO ao renomear estudo:", e);
        new Notice(`❌ Falha: ${e.message}`);
    }
};