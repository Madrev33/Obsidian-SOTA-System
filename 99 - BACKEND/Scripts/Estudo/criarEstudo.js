// SOTA - criarEstudo.js v5.1 - Dashboard Dentro da Pasta HUB
module.exports = async (params) => {
    const { app, quickAddApi: qa, obsidian } = params;
    const { Notice, TFile } = obsidian;
    const moment = params.obsidian.moment;

    // --- FUNÇÕES UTILITÁRIAS ---
    const gerarUID = () => `sota-${Math.random().toString(36).substring(2, 9)}${Date.now().toString(36).slice(-4)}`;
    
    const sanitizar = (str) => {
        if (!str) return "";
        return str
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim()
            .replace(/[-\s]+/g, '_')
            .replace(/[^\w_]+/g, '');
    };
    
    const criarArquivo = async (caminhoDestino, caminhoTemplate, placeholders = {}) => {
        const templateFile = app.vault.getAbstractFileByPath(caminhoTemplate);
        if (!(templateFile instanceof TFile)) throw new Error(`Template não encontrado: ${caminhoTemplate}`);
        let conteudo = await app.vault.read(templateFile);
        for (const key in placeholders) {
            conteudo = conteudo.replaceAll(key, placeholders[key]);
        }
        return await app.vault.create(caminhoDestino, conteudo);
    };

    try {
        // --- CONFIGURAÇÃO DE CAMINHOS ---
        const config = {
            template_hub: "99 - BACKEND/Templates/Estudos/Estudo_Template.md",
            pastaBacklog: "03 - Conhecimento/02 - Estudos/01. Pendentes",
            pastaAtivos: "03 - Conhecimento/02 - Estudos/02. Ativos"
        };

        // --- ETAPA 1: COLETA DE DADOS ---
        const nomeTopico = await qa.inputPrompt("Qual é o tópico do seu novo Estudo?");
        if (!nomeTopico) return;


        const opcoesSoberania = ["👑 Interna (Vontade Própria)", "💼 Externa (Obrigação)"];
        const valoresSoberania = ["interna", "externa"];
        const soberaniaSelecionada = await qa.suggester(opcoesSoberania, valoresSoberania);
        if (!soberaniaSelecionada) return;

        // --- ETAPA 2: DECISÃO DE FLUXO ---
        const acoes = { "Salvar para Depois": "backlog", "Começar a Estudar Agora": "agora"};
        const escolhaAcao = await qa.suggester(Object.keys(acoes), Object.values(acoes));
        if (!escolhaAcao) return;

        // --- ETAPA 3: PREPARAÇÃO DE ESTRUTURA E NOMES ---
        new Notice("🚀 Criando ecossistema do estudo...");

        const pastaDestinoRaiz = escolhaAcao === 'agora' ? config.pastaAtivos : config.pastaBacklog;
        const nomePastaEstudo = nomeTopico.replace(/[\\/:"*?<>|#^\[\]]+/g, '').trim();
        const pastaEstudoCompleta = `${pastaDestinoRaiz}/${nomePastaEstudo}`;
        
        if (await app.vault.adapter.exists(pastaEstudoCompleta)) {
            new Notice(`❌ ERRO: Uma pasta para o estudo "${nomePastaEstudo}" já existe.`);
            return;
        }

        const sota_uid = gerarUID();
        const id_estudo = sanitizar(nomePastaEstudo);

        // Criação de Pastas
        await app.vault.createFolder(pastaEstudoCompleta);
        const pastaHubPath = `${pastaEstudoCompleta}/00. HUB`;
        await app.vault.createFolder(pastaHubPath);
        
        // Criação Proativa da Pasta de Métricas
        const pastaLogMetricas = `99 - BACKEND/Logs_Metricas/Estudos/${id_estudo}`;
        if (!await app.vault.adapter.exists(pastaLogMetricas)) {
            await app.vault.createFolder(pastaLogMetricas);
        }

        // --- ETAPA 4: CRIAÇÃO DOS ARQUIVOS ---
        const nomeArquivoHub = `00. HUB - ${nomePastaEstudo}.md`;
        const caminhoHub = `${pastaHubPath}/${nomeArquivoHub}`;
        const arquivoHub = await criarArquivo(caminhoHub, config.template_hub, {
            '%%TOPICO%%': nomeTopico,
            '%%SOTA_UID%%': sota_uid,
            '%%ID_ESTUDO%%': id_estudo,
            '%%SOBERANIA%%': soberaniaSelecionada
        });

        new Notice(`✅ Projeto de Estudo "${nomeTopico}" criado com sucesso!`);
        app.workspace.getLeaf(true).openFile(arquivoHub);

    } catch (e) {
        console.error("Erro ao criar Projeto de Estudo:", e);
        new Notice(`❌ Ocorreu um erro. Verifique o console. Detalhes: ${e.message}`);
    }
};