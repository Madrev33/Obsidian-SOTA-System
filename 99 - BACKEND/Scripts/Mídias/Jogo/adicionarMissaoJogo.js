// SOTA - Script para Adicionar Missões a um Jogo v1.2
// Cria pasta de Missão com Anotações e Excalidraw dentro do Ciclo atual
// E atualiza o contador total no HUB.
// ATUALIZAÇÃO: Bloqueia criação se o jogo estiver concluído no ciclo atual.

module.exports = async (params) => {
    const { app, quickAddApi: qa, obsidian } = params;
    const { Notice, TFile, TFolder } = obsidian;

    // --- 1. RECEBER O CONTEXTO ---
    const activeFilePath = params.variables?.active_file_path;

    if (!activeFilePath) {
        new Notice("❌ ERRO: Caminho do HUB não recebido.");
        return;
    }
    
    const hubFile = app.vault.getAbstractFileByPath(activeFilePath);
    if (!hubFile || !(hubFile instanceof TFile)) {
        new Notice("❌ ERRO: HUB do Jogo não encontrado.");
        return;
    }

    // Leitura do Frontmatter
    const cache = app.metadataCache.getFileCache(hubFile);
    const fm = cache?.frontmatter;
    if (!fm) { new Notice("❌ ERRO: Metadados do HUB ilegíveis."); return; }

    const cicloAtual = fm.ciclo_de_consumo_atual || 1;
    const hubUid = fm.sota_uid;
    const totalMissoesAtual = fm.total_missoes || 0; // Pega o total atual
    const pastaJogo = hubFile.parent;

    // --- VERIFICAÇÃO DE STATUS (NOVO) ---
    // Verifica o status do ciclo atual dentro do objeto 'ciclos'
    let statusCiclo = "indefinido";
    
    if (fm.ciclos && Array.isArray(fm.ciclos)) {
        const dadosCiclo = fm.ciclos.find(c => c.ciclo === cicloAtual);
        if (dadosCiclo && dadosCiclo.status) {
            statusCiclo = dadosCiclo.status.toLowerCase();
        }
    }

    // Fallback: Se não achar no array, olha o status raiz
    if (statusCiclo === "indefinido" && fm.status) {
        statusCiclo = fm.status.toLowerCase();
    }

    // Lista de status permitidos para edição
    const statusPermitidos = ['jogando', 'para-jogar', 'ativo', 'em andamento'];

    if (!statusPermitidos.includes(statusCiclo)) {
        new Notice(`⛔ Ação bloqueada! O jogo está com status "${statusCiclo}".\nClique em "Continuar Jogando" para adicionar missões.`);
        return;
    }
    // -------------------------------------
    
    // --- 2. LOCALIZAR A PASTA DO CICLO ---
    const pastaMissoesRaiz = app.vault.getAbstractFileByPath(`${pastaJogo.path}/Missões`);
    if (!pastaMissoesRaiz || !(pastaMissoesRaiz instanceof TFolder)) {
        new Notice("❌ ERRO: Pasta 'Missões' não encontrada."); 
        return;
    }

    const cicloFormatado = `Ciclo_${String(cicloAtual).padStart(2, '0')}`;
    const pastaCicloPath = `${pastaMissoesRaiz.path}/${cicloFormatado}`;
    
    if (!await app.vault.adapter.exists(pastaCicloPath)) {
        await app.vault.createFolder(pastaCicloPath);
    }
    const pastaCiclo = app.vault.getAbstractFileByPath(pastaCicloPath);

    // --- 3. INPUT DO USUÁRIO ---
    const quantidadeInput = await qa.inputPrompt("Quantas missões deseja adicionar?", "1");
    const quantidade = parseInt(quantidadeInput);
    if (isNaN(quantidade) || quantidade <= 0) return;

    new Notice(`🚀 Adicionando ${quantidade} missão(ões)...`);

    // --- 4. CONTAGEM DE MISSÕES EXISTENTES NO CICLO ---
    // Importante: Contamos o que já existe fisicamente para numerar corretamente a sequência
    let contadorMissoesFisicas = 0;
    if (pastaCiclo instanceof TFolder) {
        for (const child of pastaCiclo.children) {
            if (child instanceof TFolder && /^\d+/.test(child.name)) {
                contadorMissoesFisicas++;
            }
        }
    }

    // --- 5. LOOP DE CRIAÇÃO ---
    const templateAnotacaoPath = "99 - BACKEND/Templates/Midias/Jogo/Missao_Template.md";
    const templateExcalidrawPath = "99 - BACKEND/Templates/Midias/Jogo/Excalidraw_Template_Vazio_Jogo.md";

    const templateAnotacaoFile = app.vault.getAbstractFileByPath(templateAnotacaoPath);
    const templateExcalidrawFile = app.vault.getAbstractFileByPath(templateExcalidrawPath);

    if (!templateAnotacaoFile) { new Notice("❌ Template de Missão não encontrado."); return; }

    const conteudoBaseAnotacao = await app.vault.read(templateAnotacaoFile);
    const conteudoBaseExcalidraw = templateExcalidrawFile ? await app.vault.read(templateExcalidrawFile) : "";

    for (let i = 1; i <= quantidade; i++) {
        const novoNumero = contadorMissoesFisicas + i;
        const numeroFormatado = String(novoNumero).padStart(2, '0');
        
        const nomePastaMissao = `${numeroFormatado} - Missão ${novoNumero}`;
        const caminhoPastaMissao = `${pastaCicloPath}/${nomePastaMissao}`;

        if (await app.vault.adapter.exists(caminhoPastaMissao)) {
            // Se já existe, apenas pula a criação, mas não aborta o loop
            continue;
        }

        await app.vault.createFolder(caminhoPastaMissao);

        // Criar Anotação
        const nomeArquivoAnotacao = `${numeroFormatado}. Anotações.md`;
        let conteudoAnotacao = conteudoBaseAnotacao
            .replace(/%%HUB_UID%%/g, hubUid)
            .replace(/%%NUMERO_MISSAO%%/g, novoNumero)
            .replace(/%%NUMERO_CICLO%%/g, cicloAtual);
        
        await app.vault.create(`${caminhoPastaMissao}/${nomeArquivoAnotacao}`, conteudoAnotacao);

        // Criar Excalidraw
        if (templateExcalidrawFile) {
            const nomeArquivoExcalidraw = `Mapa Mental - Missão ${novoNumero}.excalidraw.md`;
            await app.vault.create(`${caminhoPastaMissao}/${nomeArquivoExcalidraw}`, conteudoBaseExcalidraw);
        }
    }

    // --- 6. ATUALIZAR TOTAL NO HUB ---
    const novoTotal = contadorMissoesFisicas + quantidade;
    
    // Só atualiza se o novo total for maior que o registrado (para evitar bugs em re-runs)
    if (novoTotal > totalMissoesAtual) {
        await app.fileManager.processFrontMatter(hubFile, (fm) => {
            fm.total_missoes = novoTotal;
        });
    }

    new Notice(`✅ ${quantidade} missões adicionadas! Total: ${Math.max(novoTotal, totalMissoesAtual)}`);
};