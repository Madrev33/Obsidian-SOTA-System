// SOTA - criarProjeto.js v2.1 - Arquitetura Completa de Projeto com Soberania
module.exports = async (params) => {
    const { app, quickAddApi: qa, obsidian } = params;
    const { Notice, TFile } = obsidian;
    const moment = params.obsidian.moment;

    // --- FUNÇÕES UTILITÁRIAS PADRÃO SOTA ---
    const gerarUID = () => `sota-${Math.random().toString(36).substring(2, 9)}${Date.now().toString(36).slice(-4)}`;
    
    const sanitizar = (str) => {
        if (!str) return "";
        return str
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove acentos
            .toLowerCase()
            .trim()
            .replace(/[-\s]+/g, '_') // Substitui espaços e hífens por underscore
            .replace(/[^\w_]+/g, ''); // Remove todos os outros caracteres especiais
    };

    const criarArquivo = async (caminhoDestino, caminhoTemplate, placeholders = {}) => {
        const templateFile = app.vault.getAbstractFileByPath(caminhoTemplate);
        if (!(templateFile instanceof TFile)) {
            const errorMsg = `❌ ERRO CRÍTICO: Template não encontrado em '${caminhoTemplate}'`;
            new Notice(errorMsg);
            throw new Error(errorMsg);
        }
        let conteudo = await app.vault.read(templateFile);
        for (const key in placeholders) {
            conteudo = conteudo.replaceAll(key, placeholders[key]);
        }
        return await app.vault.create(caminhoDestino, conteudo);
    };

    try {
        // --- CONFIGURAÇÃO DE CAMINHOS ---
        const config = {
            template_hub: "99 - BACKEND/Templates/Projetos/Projeto_Executivo/Projeto_Executivo_Template.md",
            template_anotacoes: "99 - BACKEND/Templates/Projetos/Projeto_Executivo/Anotacoes_Projeto_Template.md",
            template_documentacao: "99 - BACKEND/Templates/Projetos/Projeto_Executivo/Documentacao_Projeto_Template.md",
            pastaRaizProjetos: "02 - Projetos/01. Incubadora"
        };

        // --- ETAPA 1: COLETA DE DADOS ---
        const nomeProjeto = await qa.inputPrompt("Qual o nome inicial do projeto?");
        if (!nomeProjeto) return;

        // --- [NOVO] DEFINIÇÃO DE SOBERANIA ---
        const opcoesSoberania = ["👑 Interna (Vontade Própria)", "💼 Externa (Obrigação)"];
        const valoresSoberania = ["interna", "externa"];
        const soberaniaSelecionada = await qa.suggester(opcoesSoberania, valoresSoberania);
        if (!soberaniaSelecionada) return; // Cancela se o usuário não escolher
        // --------------------------------------

        // --- ETAPA 2: PREPARAÇÃO DE ESTRUTURA E NOMES ---
        new Notice("🚀 Criando ecossistema do projeto...");

        const nomePastaProjeto = nomeProjeto.replace(/[\\/:"*?<>|#^\[\]]+/g, '').trim();
        const pastaRaizProjeto = `${config.pastaRaizProjetos}/${nomePastaProjeto}`;
        
        if (await app.vault.adapter.exists(pastaRaizProjeto)) {
            new Notice(`❌ ERRO: Uma pasta para o projeto "${nomePastaProjeto}" já existe.`);
            return;
        }

        const sota_uid = gerarUID();
        const id_projeto = sanitizar(nomeProjeto);

        // --- ETAPA 3: CRIAÇÃO DA ESTRUTURA DE PASTAS ---
        await app.vault.createFolder(pastaRaizProjeto);
        const pastaHubPath = `${pastaRaizProjeto}/00. HUB`;
        await app.vault.createFolder(pastaHubPath);
        
        const pastaLogMetricas = `99 - BACKEND/Logs_Metricas/Projetos/${id_projeto}`;
        if (!await app.vault.adapter.exists(pastaLogMetricas)) {
            await app.vault.createFolder(pastaLogMetricas);
        }

        // --- ETAPA 4: CRIAÇÃO DOS ARQUIVOS ---
        // Adicionamos a soberania aqui para ser substituída no template
        const placeholders = {
            '%%NOME_PROJETO%%': nomeProjeto,
            '%%SOTA_UID%%': sota_uid,
            '%%ID_PROJETO%%': id_projeto,
            '%%DATA_CRIACAO%%': moment().format("YYYY-MM-DD"),
            '%%HORA_CRIACAO%%': moment().format("HH:mm"),
            '%%SOBERANIA%%': soberaniaSelecionada // <--- Injeção do valor escolhido
        };

        // Arquivos Principais na pasta HUB
        const nomeArquivoHub = `00. HUB - ${nomePastaProjeto}.md`;
        const caminhoHub = `${pastaHubPath}/${nomeArquivoHub}`;
        const arquivoHub = await criarArquivo(caminhoHub, config.template_hub, placeholders);

        const nomeArquivoDoc = `01. Documentação.md`;
        await criarArquivo(`${pastaHubPath}/${nomeArquivoDoc}`, config.template_documentacao, placeholders);
        
        const nomeArquivoAnotacoes = `02. Anotações e Ideias.md`;
        await criarArquivo(`${pastaHubPath}/${nomeArquivoAnotacoes}`, config.template_anotacoes, placeholders);

        // --- ETAPA 5: FINALIZAÇÃO ---
        new Notice(`✅ Projeto "${nomePastaProjeto}" criado com sucesso!`);
        app.workspace.getLeaf(true).openFile(arquivoHub);

    } catch (e) {
        console.error("Erro ao criar Projeto SOTA:", e);
        new Notice(`❌ Ocorreu um erro crítico. Verifique o console. Detalhes: ${e.message}`);
    }
};