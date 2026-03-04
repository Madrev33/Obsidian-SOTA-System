// SOTA - Script para Adicionar Episódios a uma Documentário
// v2.0 - Pasta de Aula com Anotações e Excalidraw

module.exports = async (params) => {
    const { app, quickAddApi: qa, obsidian } = params;
    const { Notice, TFile } = obsidian;

    // --- 1. RECEBER O CONTEXTO DO BOTÃO ---
    const hubUidDoCurso = params.variables?.hub_uid;
    const activeFilePath = params.variables?.active_file_path;

    if (!hubUidDoCurso || !activeFilePath) {
        new Notice("❌ ERRO: Contexto (UID do HUB ou caminho do arquivo ativo) não recebido pelo script.");
        return;
    }
    
    const activeFile = app.vault.getAbstractFileByPath(activeFilePath);
    if (!activeFile) {
        new Notice("❌ ERRO: Não foi possível encontrar o arquivo do HUB do Módulo.");
        return;
    }

    const cicloMatch = activeFile.path.match(/Ciclo_(\d+)/);
    const cicloAtual = cicloMatch ? cicloMatch[1] : "1"; // Fallback seguro para 1

    const dv = app.plugins.plugins.dataview?.api;
    if (!dv) { new Notice("❌ ERRO: Dataview não está ativo."); return; }

    const quantidadeInput = await qa.inputPrompt("Quantos episódios deseja adicionar?", "1");
    const quantidade = parseInt(quantidadeInput);
    if (isNaN(quantidade) || quantidade <= 0) {
        new Notice("Número inválido.");
        return;
    }

    new Notice(`🚀 Adicionando ${quantidade} novo(s) episódio(s)...`);

    const pastaModulo = activeFile.parent;
    if (!pastaModulo || !pastaModulo.path) {
        new Notice("❌ ERRO: Não foi possível determinar a pasta do módulo."); return;
    }

    const templateAulaFile = app.vault.getAbstractFileByPath("99 - BACKEND/Templates/Midias/Documentario/DocumentarioSerializado/Episodio_Template.md");
    if (!(templateAulaFile instanceof TFile)) {
        new Notice("❌ ERRO: Template do Episódio não encontrado."); return;
    }
    const conteudoAulaBase = await app.vault.read(templateAulaFile);

    // Caminho para o template Excalidraw
    const templateExcalidrawPath = "99 - BACKEND/Templates/Midias/Documentario/DocumentarioSerializado/Excalidraw_Template_Vazio_DocumentarioSerializado.md"; // Ajuste o nome se necessário
    const templateExcalidrawFile = app.vault.getAbstractFileByPath(templateExcalidrawPath);
    if (!(templateExcalidrawFile instanceof TFile)) {
         new Notice("⚠️ Template Excalidraw para o Episódio não encontrado. A pasta do episódio será criada sem o arquivo Excalidraw.");
         // Opcional: prosseguir sem Excalidraw ou retornar erro
         // return;
    }

    // Conta aulas existentes *nas subpastas* do módulo
    let contadorAulas = 0;
    for (const child of pastaModulo.children) {
        if (child instanceof obsidian.TFolder && child.name.match(/^\d{2,} - /)) { // Verifica se é uma pasta de aula (nome começa com número)
            for (const subChild of child.children) {
                if (subChild instanceof TFile && dv.page(subChild.path)?.tipo === 'documentario_episodio') {
                    contadorAulas++;
                    break; // Conta a pasta (aula) apenas uma vez
                }
            }
        }
    }

    for (let i = 1; i <= quantidade; i++) {
        const novoNumeroAula = contadorAulas + i;
        const numeroAulaFormatado = novoNumeroAula.toString().padStart(2, '0');
        
        // Nome da pasta da aula
        const nomePastaAula = `${numeroAulaFormatado} - Inserir Título do Episódio`;
        const caminhoPastaAula = `${pastaModulo.path}/${nomePastaAula}`;
        
        // Verifica se a pasta da aula já existe
        if (await app.vault.adapter.exists(caminhoPastaAula)) {
            new Notice(`⚠️ Pasta do Episódio ${numeroAulaFormatado} já existe, pulando.`);
            continue;
        }

        // Cria a pasta da aula
        await app.vault.createFolder(caminhoPastaAula);

        // Nome e caminho do arquivo de anotações da aula
        const nomeArquivoAula = `${numeroAulaFormatado}. Anotações do Episódio ${numeroAulaFormatado}.md`; // Nome do arquivo dentro da pasta
        const caminhoArquivoAula = `${caminhoPastaAula}/${nomeArquivoAula}`;
        
        // Substitui placeholders no template da aula
        let conteudoFinalAula = conteudoAulaBase
            .replace(/%%HUB_UID%%/g, hubUidDoCurso) // Usa o UID recebido
            .replace(/%%NUMERO_EPISODIO%%/g, novoNumeroAula)
            .replace(/%%NUMERO_CICLO%%/g, cicloAtual);

        // Cria o arquivo de anotações dentro da pasta da aula
        await app.vault.create(caminhoArquivoAula, conteudoFinalAula);

        // Cria o arquivo Excalidraw dentro da pasta da aula, se o template existir
        if (templateExcalidrawFile instanceof TFile) {
            const nomeArquivoExcalidraw = `Mapa Mental do Episódio ${numeroAulaFormatado}.excalidraw.md`; // Nome do arquivo Excalidraw
            const caminhoArquivoExcalidraw = `${caminhoPastaAula}/${nomeArquivoExcalidraw}`;
            await app.vault.create(caminhoArquivoExcalidraw, await app.vault.read(templateExcalidrawFile));
        }
    }
    
    const novoTotalDeAulas = contadorAulas + quantidade;
    await app.fileManager.processFrontMatter(activeFile, (fm) => {
        fm.total_episodios = novoTotalDeAulas;
    });

    new Notice(`✅ ${quantidade} episódio(s) adicionado(s) com sucesso! Total: ${novoTotalDeAulas}.`);
};