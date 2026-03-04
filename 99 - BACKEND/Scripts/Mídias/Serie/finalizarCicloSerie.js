// SOTA - Script para Finalizar um Ciclo de Série
// v1.0 - Modular e Contextual

module.exports = async (params) => {
    const { app, obsidian } = params;
    const { Notice } = obsidian;
    const moment = params.obsidian.moment;

    const sotaLog = (step, data) => console.log(`[SOTA Finalizar Ciclo Série] - ${step}`, data !== undefined ? data : "");

    // --- 1. RECEBER O CONTEXTO DO BOTÃO ---
    const activeFilePath = params.variables?.active_file_path;
    if (!activeFilePath) {
        new Notice("❌ ERRO: Caminho do arquivo HUB não recebido pelo script.");
        return;
    }
    
    const activeFile = app.vault.getAbstractFileByPath(activeFilePath);
    if (!activeFile) {
        new Notice("❌ ERRO: Não foi possível encontrar o arquivo HUB da Série.");
        return;
    }

    sotaLog("Arquivo ativo:", activeFile.path);
    new Notice("🚀 Finalizando ciclo da Série...");

    let cicloFinalizado = 0;
    let erro = null;

    try {
      await app.fileManager.processFrontMatter(activeFile, (fm) => {
          sotaLog("Iniciando processamento do frontmatter.");
          const cicloAtualNum = fm.ciclo_de_consumo_atual;
          if (!cicloAtualNum) {
              erro = "Campo 'ciclo_de_consumo_atual' não encontrado.";
              sotaLog("ERRO no FM:", erro);
              return;
          }
          sotaLog("Ciclo de consumo atual encontrado:", cicloAtualNum);
          
          if (!Array.isArray(fm.ciclos)) {
              erro = "A estrutura 'ciclos' não é uma lista válida no frontmatter.";
              sotaLog("ERRO no FM:", erro);
              return;
          }

          const cicloObj = fm.ciclos.find(c => c.ciclo === cicloAtualNum);
          if (!cicloObj) {
              erro = `Não foi possível encontrar os dados para o Ciclo ${cicloAtualNum}.`;
              sotaLog("ERRO no FM:", erro);
              return;
          }
          
          if (cicloObj.status === 'concluido') {
              erro = `O Ciclo ${cicloAtualNum} já está finalizado.`;
              sotaLog("AVISO no FM:", erro);
              return;
          }

          sotaLog("Objeto do ciclo encontrado:", cicloObj);
          
          cicloObj.status = "concluido";
          cicloObj.data_conclusao = moment().format("YYYY-MM-DD");
          cicloObj.hora_conclusao = moment().format("HH:mm");
          
          fm.status = "concluido";

          sotaLog("Frontmatter modificado:", { cicloObj, status: fm.status });
          cicloFinalizado = cicloAtualNum;
      });

    } catch (e) {
      erro = `Falha ao processar o frontmatter: ${e.message}`;
    }

    if (erro) {
      new Notice(`⚠️ ${erro}`);
      console.error("SOTA ERRO:", erro);
    } else if (cicloFinalizado > 0) {
      new Notice(`✅ Ciclo ${cicloFinalizado} finalizado com sucesso!`);
      sotaLog("SUCESSO: Ciclo finalizado.", cicloFinalizado);
    } else {
      new Notice("⚠️ Nenhuma ação foi executada. Verifique os dados do arquivo.");
      sotaLog("AVISO: Nenhuma ação executada.");
    }
};