// SOTA - criarProjetoEsboco.js v1.0
// Cria um projeto leve (Esboço) na Incubadora para captura rápida de ideias.

module.exports = async (params) => {
    const { app, quickAddApi: qa, obsidian } = params;
    const { Notice, TFile } = obsidian;
    
    // --- CONFIGURAÇÃO ---
    const config = {
        templatePath: "99 - BACKEND/Templates/Projetos/Projeto_Esboco/Projeto_Esboco_Template.md",
        pastaDestino: "02 - Projetos/01. Incubadora"
    };

    // --- FUNÇÕES UTILITÁRIAS ---
    const gerarUID = () => `sota-${Math.random().toString(36).substring(2, 9)}${Date.now().toString(36).slice(-4)}`;
    
    const sanitizarNomePasta = (str) => {
        return str.replace(/[\\/:"*?<>|#^\[\]]+/g, '').trim();
    };

    try {
        // 1. Coleta de Dados
        const nomeIdeia = await qa.inputPrompt("Qual o nome da Ideia/Esboço?");
        if (!nomeIdeia) return;

        // 2. Preparação de Caminhos
        const nomePasta = sanitizarNomePasta(nomeIdeia);
        const pastaProjeto = `${config.pastaDestino}/${nomePasta}`;
        
        // Verifica colisão
        if (await app.vault.adapter.exists(pastaProjeto)) {
            new Notice(`❌ ERRO: Já existe algo chamado "${nomePasta}" na Incubadora.`);
            return;
        }

        new Notice("🌱 Plantando semente...");

        // 3. Criação da Estrutura
        await app.vault.createFolder(pastaProjeto);
        
        const templateFile = app.vault.getAbstractFileByPath(config.templatePath);
        if (!(templateFile instanceof TFile)) {
            new Notice("❌ ERRO: Template de Esboço não encontrado.");
            return;
        }

        let conteudo = await app.vault.read(templateFile);
        
        // 4. Substituição de Placeholders
        conteudo = conteudo
            .replace(/%%NOME_IDEIA%%/g, nomeIdeia)
            .replace(/%%SOTA_UID%%/g, gerarUID());
            // A data é tratada pelo Templater se o QuickAdd estiver configurado para isso,
            // ou podemos injetar aqui se preferir. O template usa <% tp... %>, 
            // então assumimos que o QuickAdd vai processar ou vamos forçar.
            // Para garantir: vamos substituir se o QuickAdd não for usar o engine do Templater.
            // Mas como o template tem sintaxe TP, vamos deixar o TP resolver.
        
        const caminhoArquivo = `${pastaProjeto}/00. Ideia - ${nomePasta}.md`;
        
        // 5. Criação do Arquivo
        const novoArquivo = await app.vault.create(caminhoArquivo, conteudo);

        new Notice(`✅ Esboço "${nomeIdeia}" criado!`);
        
        // Abre o arquivo
        app.workspace.getLeaf(true).openFile(novoArquivo);

    } catch (e) {
        console.error("Erro ao criar Esboço:", e);
        new Notice(`❌ Erro: ${e.message}`);
    }
};