// SOTA - Script para Adicionar Módulos a um Curso
// v3.1 - Corrige erro de referência de variável.

module.exports = async (params) => {
    const { app, quickAddApi: qa, obsidian } = params;
    const { Notice, TFile } = obsidian;

    // --- 1. RECEBER E VALIDAR O CONTEXTO ---
    const activeFilePath = params.variables?.active_file_path;
    if (!activeFilePath) {
        new Notice("❌ ERRO: Caminho do arquivo HUB do Curso não recebido pelo script.");
        return;
    }
    
    const activeFile = app.vault.getAbstractFileByPath(activeFilePath);
    if (!(activeFile instanceof TFile)) {
        new Notice("❌ ERRO: Não foi possível encontrar o arquivo HUB do Curso.");
        return;
    }

    const dv = app.plugins.plugins.dataview?.api;
    if (!dv) { new Notice("❌ ERRO: Dataview não está ativo."); return; }

    const hubCurso = dv.page(activeFile.path);
    if (!hubCurso) { new Notice("❌ ERRO: Dataview não conseguiu ler os metadados do HUB."); return; }

    // --- LÓGICA DE BLOQUEIO ---
    if (hubCurso.status === 'concluido') {
        new Notice("⚠️ Para adicionar um novo módulo, primeiro reative o estudo do curso.");
        return; 
    }

    new Notice("🚀 Adicionando novo módulo...");

    // --- 2. LÓGICA DE CRIAÇÃO ---
    const pastaCurso = activeFile.parent.parent;
    const cicloAtual = hubCurso.ciclo_de_consumo_atual || 1;
    const cicloFormatado = `Ciclo_${String(cicloAtual).padStart(2, '0')}`;
    const pastaCiclo = `${pastaCurso.path}/Módulos/${cicloFormatado}`;

    if (!await app.vault.adapter.exists(pastaCiclo)) {
        await app.vault.createFolder(pastaCiclo);
    }

    const subpastas = app.vault.getAbstractFileByPath(pastaCiclo)?.children || [];
    const novoNumeroModulo = subpastas.filter(child => child.children).length + 1;

    const templateModuloFile = app.vault.getAbstractFileByPath("99 - BACKEND/Templates/Midias/Curso/Modulo_Template.md");
    if (!(templateModuloFile instanceof TFile)) {
        new Notice("❌ ERRO: Template de Módulo não encontrado."); return;
    }
    const conteudoModuloBase = await app.vault.read(templateModuloFile);

    const numeroPasta = novoNumeroModulo.toString().padStart(2, '0');
    const nomePastaModulo = `${numeroPasta} - Inserir Título do Módulo`;
    const caminhoPastaModulo = `${pastaCiclo}/${nomePastaModulo}`;
    await app.vault.createFolder(caminhoPastaModulo);

    const nomeHubModulo = `00 - HUB Módulo ${numeroPasta}.md`;
    
    // --- INÍCIO DA CORREÇÃO ---
    const caminhoHubModulo = `${caminhoPastaModulo}/${nomeHubModulo}`;
    // --- FIM DA CORREÇÃO ---
    
    let conteudoFinalModulo = conteudoModuloBase
        .replace(/%%HUB_UID%%/g, hubCurso.sota_uid)
        .replace(/%%NUMERO_MODULO%%/g, novoNumeroModulo.toString())
        .replace(/%%NOME_CURSO%%/g, hubCurso.file.name.replace('00. HUB - ', ''));
    await app.vault.create(caminhoHubModulo, conteudoFinalModulo);
    
    // --- 3. ATUALIZAÇÃO FINAL ---
    await app.fileManager.processFrontMatter(activeFile, (fm) => {
        fm.total_modulos = novoNumeroModulo;
    });

    new Notice(`✅ Módulo ${novoNumeroModulo} adicionado com sucesso!`);
};