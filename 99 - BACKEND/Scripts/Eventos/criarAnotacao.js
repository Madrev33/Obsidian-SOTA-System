// SOTA - criarAnotacao.js v1.0
// Cria uma nota de captura rápida (Ideia/Reflexão/Anotação) com base em timestamp.
// Estrutura de pastas: 01 - Registros/02. Anotações/YYYY/MM/

module.exports = async (params) => {
    const { app, obsidian } = params;
    const { Notice, TFile } = obsidian;
    const moment = params.obsidian.moment;

    // --- CONFIGURAÇÃO ---
    const CONFIG = {
        templatePath: "99 - BACKEND/Templates/Anotacoes/Anotacao_Template.md",
        rootFolder: "01 - Registros/02. Anotações/01. Histórico" // Nova pasta base
    };

    // --- FUNÇÕES UTILITÁRIAS ---
    const gerarUID = () => `sota-note-${Math.random().toString(36).substring(2, 9)}`;
    
    // Função recursiva para garantir que o caminho da pasta exista
    const garantirPasta = async (path) => {
        if (!await app.vault.adapter.exists(path)) {
            await app.vault.createFolder(path);
        }
    };

    try {
        // 1. Preparar Datas e Caminhos
        const agora = moment();
        const ano = agora.format("YYYY");
        const mes = agora.format("MM");
        const nomeArquivo = agora.format("YYYY-MM-DD HH[h]mm"); // Ex: 2025-12-20 18h30
        
        const pastaAno = `${CONFIG.rootFolder}/${ano}`;
        const pastaMes = `${pastaAno}/${mes}`;
        const caminhoArquivo = `${pastaMes}/${nomeArquivo}.md`;

        // 2. Verificar/Criar Estrutura de Pastas
        if (!await app.vault.adapter.exists(CONFIG.rootFolder)) {
            new Notice("❌ Erro: Pasta raiz de anotações não encontrada.");
            return;
        }
        await garantirPasta(pastaAno);
        await garantirPasta(pastaMes);

        // 3. Verificar se arquivo já existe (prevenção de duplo clique no mesmo minuto)
        if (await app.vault.adapter.exists(caminhoArquivo)) {
            new Notice("⚠️ Uma nota já foi criada neste minuto. Aguarde ou edite a existente.");
            const fileExisting = app.vault.getAbstractFileByPath(caminhoArquivo);
            app.workspace.getLeaf(true).openFile(fileExisting);
            return;
        }

        // 4. Carregar Template
        const templateFile = app.vault.getAbstractFileByPath(CONFIG.templatePath);
        if (!(templateFile instanceof TFile)) {
            new Notice(`❌ Template não encontrado: ${CONFIG.templatePath}`);
            return;
        }
        const conteudoTemplate = await app.vault.read(templateFile);

        // 5. Criar Arquivo
        const novoArquivo = await app.vault.create(caminhoArquivo, conteudoTemplate);

        // 6. Injetar Frontmatter Inicial
        await app.fileManager.processFrontMatter(novoArquivo, (fm) => {
            fm.tipo = "anotacao_geral"; // Estado padrão inicial
            fm.status = "pendente";
            fm.processado = false; // Controle para o Dashboard
            fm.sota_uid = gerarUID();
            fm.data_criacao = agora.format("YYYY-MM-DD");
            fm.hora_criacao = agora.format("HH:mm");
            // Tags padrão para facilitar busca global se necessário
            fm.tags = ["captura"]; 
        });

        // 7. Finalização
        new Notice("📝 Nova nota de captura criada!");
        
        // Abre o arquivo e coloca o cursor no final (após o frontmatter/dashboard)
        const leaf = app.workspace.getLeaf(true);
        await leaf.openFile(novoArquivo);
        
        // Pequeno hack para focar no editor
        const editor = app.workspace.getActiveViewOfType(obsidian.MarkdownView)?.editor;
        if (editor) {
            editor.focus();
            const lastLine = editor.lineCount();
            editor.setCursor(lastLine, 0);
        }

    } catch (e) {
        console.error("Erro ao criar anotação SOTA:", e);
        new Notice(`❌ Erro: ${e.message}`);
    }
};