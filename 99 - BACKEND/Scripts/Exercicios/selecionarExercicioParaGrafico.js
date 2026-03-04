// SOTA - selecionarExercicioParaGrafico.js v1.0
// Script para selecionar um exercício e atualizar o frontmatter do arquivo ativo.

module.exports = async (params) => {
    const { app, quickAddApi: qa, obsidian } = params;
    const { Notice, TFile } = obsidian;

    const activeFile = app.workspace.getActiveFile();
    if (!activeFile) {
        new Notice("❌ ERRO: Nenhum arquivo ativo para atualizar.");
        return;
    }

    try {
        const exercicios = app.vault.getMarkdownFiles().filter(f => 
            f.path.startsWith("04 - Corpo & Movimento/01 - Exercícios Físicos/01. Manual/Exercícios")
        );

        if (exercicios.length === 0) {
            new Notice("⚠️ Nenhum exercício encontrado no Manual.");
            return;
        }

        const escolha = await qa.suggester(f => f.basename, exercicios);
        if (!escolha) {
            new Notice("ℹ️ Seleção cancelada.");
            return;
        }

        await app.fileManager.processFrontMatter(activeFile, (fm) => {
            fm.exercicio_selecionado = escolha.basename;
        });

        new Notice(`✅ Gráfico agora exibindo: ${escolha.basename}`);

    } catch (error) {
        console.error("Erro ao selecionar exercício para gráfico:", error);
        new Notice("❌ Ocorreu um erro. Verifique o console.");
    }
};