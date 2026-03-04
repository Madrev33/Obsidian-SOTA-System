// SOTA - exportarAnalisePessoal.js v6.1 (Universal & Robusto)
// Refatorado para usar busca direta via API nativa, eliminando dependência do cache Dataview.
module.exports = async (params) => {
    const { app, obsidian } = params;
    const { Notice, TFile } = obsidian;

    /**
     * Padrão de Ouro SOTA: Busca o arquivo HUB pelo sota_uid sem depender do cache do Dataview.
     * Itera diretamente sobre os arquivos do vault para máxima robustez.
     * @param {object} app - A instância do app Obsidian.
     * @param {string} uid - O sota_uid a ser encontrado.
     * @returns {TFile|null} - O TFile do HUB ou null se não for encontrado.
     */
    const findHubByUid_Robust = (app, uid) => {
        if (!uid) return null;
        const allFiles = app.vault.getMarkdownFiles();
        for (const file of allFiles) {
            const cache = app.metadataCache.getFileCache(file);
            if (cache?.frontmatter?.sota_uid === uid) {
                return file; // Retorna o objeto TFile
            }
        }
        return null; // Não encontrado
    };

    try {
        // --- 1. CONTEXTO E VALIDAÇÃO UNIVERSAL ---
        const midiaFile = app.workspace.getActiveFile();
        if (!midiaFile || !midiaFile.path.includes("03 - Conhecimento/01 - Mídias")) {
            new Notice("❌ ERRO: Execute este comando a partir de uma nota de anotações de mídia válida.");
            return;
        }
        
        const fm = app.metadataCache.getFileCache(midiaFile)?.frontmatter;
        if (!fm) { new Notice("❌ ERRO: Não foi possível ler o frontmatter da nota atual."); return; }

        // --- LÓGICA DE BUSCA ROBUSTA ---
        let hubFile = null;
        if (fm.hub_uid) {
            hubFile = findHubByUid_Robust(app, fm.hub_uid);
        } else if (fm.livro_hub) { // Fallback para o sistema antigo de livros
            const hubLinkText = fm.livro_hub.replace(/\[|\]/g, "");
            hubFile = app.metadataCache.getFirstLinkpathDest(hubLinkText, midiaFile.path);
        }

        if (!hubFile || !(hubFile instanceof TFile)) {
            new Notice("❌ ERRO: Vínculo com o HUB ('hub_uid') não encontrado ou inválido no frontmatter.");
            return;
        }

        new Notice("🚀 Gerando documento de análise pessoal...");

        // --- 2. EXTRAÇÃO DE DADOS (JÁ ROBUSTA) ---
        const conteudoMidia = await app.vault.read(midiaFile);
        const linhasMidia = conteudoMidia.split('\n');

        let anotações = [];
        const marcadorInicioAnotacoes = "## 📝 Anotações & Insights";
        const indiceInicioAnotacoes = linhasMidia.findIndex(l => l.trim().startsWith(marcadorInicioAnotacoes));

        if (indiceInicioAnotacoes !== -1) {
            const linhasAnotacoes = [];
            for (let i = indiceInicioAnotacoes + 1; i < linhasMidia.length; i++) {
                const linhaAtual = linhasMidia[i];
                if (linhaAtual.trim().startsWith('## ') || linhaAtual.trim() === '---') {
                    break;
                }
                linhasAnotacoes.push(linhaAtual);
            }
            anotações = linhasAnotacoes.filter(l => l.trim() !== '');
        }

        const respostas = {
            "Como eu me sinto agora?": fm.analise_q01_sentimento,
            "Qual é a intenção do criador?": fm.analise_q02_intencao,
            "Isso faz sentido?": fm.analise_q03_logica,
            "Esta narrativa me fortalece ou me enfraquece?": fm.analise_q04_fortalecimento,
            "Como minha percepção mudou?": fm.analise_q06_percepcao,
            "Que comportamentos estão sendo normalizados?": fm.analise_q07_normalizacao,
            "Em quem eu me tornaria se adotasse 100% esta visão?": fm.analise_q08_identidade,
            'Qual é a "Grande Tese" (Verdade ou Mentira)?': fm.analise_q09_tese,
            "Que ferramentas de persuasão foram usadas?": fm.analise_q10_persuasao,
            "Quais informações foram omitidas?": fm.analise_q11_omissao,
            "Que ação a obra quer que eu tome?": fm.analise_q12_acao,
        };

        // --- 3. FORMATAÇÃO UNIVERSAL DO DOCUMENTO ---
        const nomeMidia = hubFile.basename.replace(/^(00\. HUB - |HUB - )/g, '').trim();
        
        let subtitulo = "";
        if (fm.numero_capitulo) { subtitulo = `Capítulo ${fm.numero_capitulo}`; }
        else if (fm.numero_episodio) { subtitulo = `Episódio ${fm.numero_episodio}`; }
        else if (fm.ciclo) { subtitulo = `Ciclo ${fm.ciclo}`; }
        else { subtitulo = midiaFile.basename.replace(/^(Notes - |Anotações - |\d{2,}\. Anotações( do Episódio \d{2,})?)/, '').replace('.md','').trim(); }

        const tituloCompleto = `${nomeMidia} - ${subtitulo}`;
        
        let conteudoFinal = `# Análise Pessoal Sobre: ${tituloCompleto}\n\n`;
        conteudoFinal += "## 🧠 Minhas Anotações & Insights Brutos\n";
        conteudoFinal += anotações.length > 0 ? anotações.join('\n') : "*Nenhuma anotação registrada.*\n";
        conteudoFinal += "\n---\n\n";
        conteudoFinal += "## ❓ Minhas Respostas à Análise de Influência\n";
        for (const [pergunta, resposta] of Object.entries(respostas)) {
            conteudoFinal += `**${pergunta}**\n${resposta || "*Não respondido.*"}\n\n`;
        }

        // --- 4. SALVAR O ARQUIVO (LÓGICA JÁ UNIVERSAL) ---
        const hubCache = app.metadataCache.getFileCache(hubFile);
        const cicloAtual = hubCache?.frontmatter?.ciclo_de_consumo_atual;

        if (cicloAtual === undefined || cicloAtual === null) {
            new Notice("❌ ERRO: Não foi possível determinar o ciclo atual a partir do HUB.");
            return;
        }

        const cicloFormatado = String(cicloAtual).padStart(2, '0');
        const pastaDestino = `${hubFile.parent.parent.path}/Docs - Análises Pessoais/Ciclo_${cicloFormatado}`;

        if (!await app.vault.adapter.exists(pastaDestino)) {
            await app.vault.createFolder(pastaDestino);
        }
                
        const nomeArquivoAnalise = `${tituloCompleto.replace(/[\\/:"*?<>|#^\[\]]+/g, '-')} - Análise Pessoal.md`;
        const caminhoCompletoAnalise = `${pastaDestino}/${nomeArquivoAnalise}`;
                
        await app.vault.create(caminhoCompletoAnalise, conteudoFinal);

        // --- 5. GERAR PROMPT FINAL ---
        const promptStep3 = `Agora, com base na sua análise inicial da transcrição, analise o meu documento de reflexões pessoais em anexo ("${nomeArquivoAnalise}"). Siga suas diretrizes de "Análise Comparativa" e "Protocolo de Interação" para me ajudar a aprofundar meu autoconhecimento, identificar meus pontos cegos e expandir meu pensamento crítico sobre este conteúdo. Lembre-se de me ensinar os princípios, apresentar visões alternativas e terminar com a pergunta obrigatória.`;

        await navigator.clipboard.writeText(promptStep3);

        new Notice(`✅ Documento de análise criado e prompt do Step 3 copiado!`);
        app.workspace.openLinkText(caminhoCompletoAnalise, '', true);

    } catch (error) {
        console.error("Erro ao exportar análise pessoal:", error);
        new Notice("❌ Ocorreu um erro. Verifique o console.");
    }
};