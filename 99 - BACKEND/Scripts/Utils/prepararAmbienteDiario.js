// SOTA - prepararAmbienteDiario.js v5.0 (Padrão de Ouro Final - "Vanilla Obsidian API")
// Esta versão usa exclusivamente a API nativa do Obsidian para máxima robustez,
// eliminando todas as dependências de leitura de outros plugins.

module.exports = async (params) => {
    const { app, obsidian } = params;
    const { Notice, TFile } = obsidian;

    // --- PONTO ÚNICO DE CONFIGURAÇÃO (FONTE DA VERDADE) ---
    const TEMPLATE_PATH = "99 - BACKEND/Templates/Diario/Daily Notes Template.md";
    const DAILY_NOTES_BASE_FOLDER = "01 - Registros/01. Daily";
    // --- FIM DA CONFIGURAÇÃO ---

    const sotaLog = (msg, data) => console.log(`[SOTA Prep Dia] - ${msg}`, data || "");

    async function garantirNotaDiaria(targetDate) {
        sotaLog("Verificando nota para:", targetDate.format("YYYY-MM-DD"));

        try {
            // 1. Construir os caminhos de forma explícita e direta
            const folderPath = `${DAILY_NOTES_BASE_FOLDER}/${targetDate.format("YYYY")}/${targetDate.format("MM")}`;
            const fileName = targetDate.format("YYYY-MM-DD");
            const filePath = `${folderPath}/${fileName}.md`;

            // 2. Verificar se o arquivo já existe no local exato
            const existingFile = app.vault.getAbstractFileByPath(filePath);
            if (existingFile instanceof TFile) {
                sotaLog("Nota já existe no caminho correto:", existingFile.path);
                return existingFile;
            }
            
            sotaLog("Nota não encontrada. Criando em:", filePath);
            
            // 3. Garantir que a pasta de destino exista
            if (!(await app.vault.adapter.exists(folderPath))) {
                sotaLog("Pasta de destino não existe. Criando:", folderPath);
                await app.vault.createFolder(folderPath);
            }

            const templateFile = app.vault.getAbstractFileByPath(TEMPLATE_PATH);
            if (!(templateFile instanceof TFile)) {
                new Notice(`❌ ERRO SOTA: Arquivo de template '${TEMPLATE_PATH}' não foi encontrado.`);
                return null;
            }

            // 4. Ler o conteúdo do template e criar o novo arquivo com a API nativa
            const templateContent = await app.vault.read(templateFile);
            const newFile = await app.vault.create(filePath, templateContent);
            sotaLog("Arquivo criado com API nativa:", newFile.path);
            
            // 5. Deixar o Obsidian e o Templater processarem o novo arquivo naturalmente.
            // Pequena espera para garantir que o arquivo seja salvo antes de tentar abri-lo.
            await new Promise(resolve => setTimeout(resolve, 300)); 
            return newFile;

        } catch (error) {
            new Notice("❌ Falha crítica ao criar nota diária. Verifique o console.");
            console.error("[SOTA Prep Dia] Erro:", error);
            return null;
        }
    }

    // --- FLUXO PRINCIPAL ---
    new Notice("🚀 Preparando ambiente do dia...", 3000);
    const hoje = moment();
    const amanha = moment().add(1, 'day');

    const notaHoje = await garantirNotaDiaria(hoje);
    await garantirNotaDiaria(amanha);

    if (notaHoje) {
        new Notice("✅ Ambiente diário preparado!", 5000);
        // Abre a nota de hoje, que já pode ter sido processada pelo Templater
        const leaf = app.workspace.getLeaf(false);
        await leaf.openFile(notaHoje);
    } else {
        new Notice("❌ Falha ao preparar o ambiente de hoje.", 5000);
    }
};