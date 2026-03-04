// SOTA - renomearProjetoExecutivo.js v1.0 (A Cirurgia)
// Realiza o "Rebrand" completo de um projeto:
// 1. Renomeia Pastas (Projeto e Métricas).
// 2. Renomeia Arquivo HUB.
// 3. Atualiza Frontmatter (ID).
// 4. Refatora TODOS os logs históricos (Daily e Raw) para a nova tag.

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
        
        // Validação de Segurança: É um HUB de Projeto?
        const cache = app.metadataCache.getFileCache(activeFile);
        if (cache?.frontmatter?.tipo !== 'projeto_hub') {
            new Notice("⚠️ Este script só pode ser executado no HUB de um Projeto.");
            return;
        }

        const idAntigo = cache.frontmatter.id_projeto;
        const nomeAntigo = activeFile.basename.replace("00. HUB - ", "");
        const pastaProjeto = activeFile.parent.parent.path.includes("00. HUB") ? activeFile.parent.parent : activeFile.parent; 
        // Lógica: Se estiver em '00. HUB', sobe dois. Se a estrutura for plana, sobe um.
        // Padrão SOTA: 02 - Projetos/Categoria/NomeProjeto/00. HUB/Arquivo.md -> Pasta do Projeto é a avó.
        // Vamos usar uma busca mais segura.
        
        // Assumindo estrutura SOTA: .../NomeProjeto/00. HUB/HUB.md
        const pastaHub = activeFile.parent;
        const pastaRaizProjeto = pastaHub.parent;

        if (!idAntigo) { new Notice("❌ ID do projeto não encontrado no Frontmatter."); return; }

        // 2. INPUT: Novo Nome
        const novoNome = await qa.inputPrompt(`Renomear projeto "${nomeAntigo}" para:`, nomeAntigo);
        if (!novoNome || novoNome === nomeAntigo) { new Notice("Operação cancelada."); return; }

        const idNovo = sanitizar(novoNome);
        const nomePastaNovo = novoNome.replace(/[\\/:"*?<>|#^\[\]]+/g, '').trim(); // Sanitização para FS (Windows/Mac)

        // Validação de Colisão de ID
        const pastaMetricasNova = `99 - BACKEND/Logs_Metricas/Projetos/${idNovo}`;
        if (await app.vault.adapter.exists(pastaMetricasNova) && idNovo !== idAntigo) {
            new Notice(`❌ O ID "${idNovo}" já está em uso por outro projeto (Pasta de Métricas existe).`);
            return;
        }

        // Confirmação Final (Cirurgia é irreversível no histórico de log)
        const confirm = await qa.yesNoPrompt(`⚠️ ATENÇÃO: Isso irá alterar pastas e reescrever logs históricos de '${idAntigo}' para '${idNovo}'. Continuar?`);
        if (!confirm) return;

        new Notice("⚙️ Iniciando Cirurgia... Não feche o Obsidian.");

        // --- FASE 1: SISTEMA DE ARQUIVOS (Renomear e Mover) ---
        
        // A. Renomear Pasta de Métricas (Se existir)
        const pastaMetricasAntiga = `99 - BACKEND/Logs_Metricas/Projetos/${idAntigo}`;
        if (await app.vault.adapter.exists(pastaMetricasAntiga)) {
            // O Obsidian não tem 'rename' direto para pastas via adapter as vezes, melhor usar FileManager
            const folderMetricas = app.vault.getAbstractFileByPath(pastaMetricasAntiga);
            if (folderMetricas instanceof TFolder) {
                const novoCaminhoMetricas = `99 - BACKEND/Logs_Metricas/Projetos/${idNovo}`;
                await app.fileManager.renameFile(folderMetricas, novoCaminhoMetricas);
            }
        }

        // B. Renomear Arquivo HUB
        const novoNomeArquivoHub = `00. HUB - ${nomePastaNovo}.md`;
        const novoCaminhoHub = `${pastaHub.path}/${novoNomeArquivoHub}`;
        await app.fileManager.renameFile(activeFile, novoCaminhoHub);

        // C. Renomear Pasta Raiz do Projeto
        // Nota: Mudar o nome da pasta raiz muda o caminho de todos os filhos. 
        // O 'activeFile' (agora renomeado) já tem o path atualizado na memória do objeto TFile? Sim.
        // Mas a pastaHub e pastaRaizProjeto são objetos TFolder.
        const novoCaminhoRaizProjeto = `${pastaRaizProjeto.parent.path}/${nomePastaNovo}`;
        // Verificação extra para não sobrescrever
        if (!await app.vault.adapter.exists(novoCaminhoRaizProjeto)) {
             await app.fileManager.renameFile(pastaRaizProjeto, novoCaminhoRaizProjeto);
        } else {
             new Notice("⚠️ Aviso: A pasta de destino já existia. Os arquivos foram mesclados ou mantidos.");
        }

        // --- FASE 2: DADOS (Frontmatter) ---
        
        // Atualizar ID no HUB (usando o objeto activeFile que o Obsidian rastreia)
        await app.fileManager.processFrontMatter(activeFile, (fm) => {
            fm.id_projeto = idNovo;
            // Opcional: Atualizar nome se houver campo de título
            // fm.title = novoNome; 
        });

        // --- FASE 3: REFATORAÇÃO DE LOGS (O Grande Find & Replace) ---
        
        new Notice("🔄 Refatorando histórico de logs...");
        
        const logsPath = "99 - BACKEND/Logs_Metricas/Daily";
        const dailyLogs = app.vault.getMarkdownFiles().filter(f => f.path.startsWith(logsPath));
        
        // Adiciona o raw_logs do próprio projeto (agora no novo caminho)
        const novoRawLogPath = `99 - BACKEND/Logs_Metricas/Projetos/${idNovo}/raw_logs.md`;
        const rawLogFile = app.vault.getAbstractFileByPath(novoRawLogPath);
        if (rawLogFile instanceof TFile) dailyLogs.push(rawLogFile);

        let logsAlterados = 0;
        const regexTagAntiga = new RegExp(`#projeto/${idAntigo}(?![\\w-])`, 'g'); // Negative lookahead para evitar match parcial
        const novaTag = `#projeto/${idNovo}`;

        for (const file of dailyLogs) {
            const content = await app.vault.read(file);
            if (regexTagAntiga.test(content)) {
                const newContent = content.replace(regexTagAntiga, novaTag);
                await app.vault.modify(file, newContent);
                logsAlterados++;
            }
        }

        new Notice(`✅ Sucesso! Projeto renomeado para "${novoNome}".\n📊 ${logsAlterados} arquivos de log atualizados.`);

    } catch (e) {
        console.error("ERRO CRÍTICO na Cirurgia de Projeto:", e);
        new Notice(`❌ FALHA CRÍTICA: ${e.message}. Verifique o console.`);
    }
};