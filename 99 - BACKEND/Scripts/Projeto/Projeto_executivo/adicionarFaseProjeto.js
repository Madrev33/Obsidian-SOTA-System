// SOTA - adicionarFaseProjeto.js v1.1
// Script para adicionar uma nova seção de Fase a um HUB de Projeto, com separador.

module.exports = async (params) => {
    const { app, quickAddApi: qa, obsidian } = params;
    const { Notice, TFile } = obsidian;

    try {
        // --- 1. OBTER CONTEXTO ---
        const activeFilePath = params.variables?.active_file_path;
        if (!activeFilePath) {
            new Notice("❌ ERRO: Caminho do arquivo HUB não recebido.");
            return;
        }

        const activeFile = app.vault.getAbstractFileByPath(activeFilePath);
        if (!(activeFile instanceof TFile)) {
            new Notice("❌ ERRO: Não foi possível encontrar o arquivo HUB do Projeto.");
            return;
        }

        // --- 2. COLETAR INPUT DO USUÁRIO ---
        const nomeFase = await qa.inputPrompt("Qual o nome da nova Fase?");
        if (!nomeFase) {
            new Notice("ℹ️ Criação de fase cancelada.");
            return;
        }

        // --- 3. PREPARAR DADOS E TEMPLATE DO BLOCO ---
        const sanitizar = (str) => {
            if (!str) return "";
            return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[-\s,]+/g, '_').replace(/[^\w_]+/g, '');
        };
        
        const fileContent = await app.vault.read(activeFile);
        
        // Contagem precisa de Fases existentes para a tag
        const lines = fileContent.split('\n');
        let contadorFases = 0;
        for (const line of lines) {
            if (line.trim().startsWith("### Fase:")) {
                contadorFases++;
            }
        }
        const numeroFase = contadorFases + 1;
        const nomeFaseSanitizado = sanitizar(nomeFase);
        const idFase = `${String(numeroFase).padStart(2, '0')}_${nomeFaseSanitizado}`;

        // Padrão de Ouro #12: Usar concatenação de strings para evitar erros de parsing YAML.
        // ADICIONADO: "---" antes do cabeçalho da fase.
        const blocoFaseTemplate = '\n\n' +
            '---\n\n' + // Separador adicionado aqui
            `### Fase: ${nomeFase}\n` +
            '```meta-bind-button\n' +
            'label: "➕ Adicionar Tarefa"\n' +
            'style: default\n' +
            'actions:\n' +
            '  - type: inlineJS\n' +
            '    code: |\n' +
            '      const qa = this.app.plugins.plugins.quickadd?.api;\n' +
            '      if (!qa) { new obsidian.Notice("❌ ERRO: QuickAdd não disponível."); return; }\n' +
            '      const activeFile = this.app.workspace.getActiveFile();\n' +
            '      if (activeFile) {\n' +
            '          qa.executeChoice("Adicionar Tarefa ao Projeto", { \n' +
            '              "active_file_path": activeFile.path,\n' +
            `              "fase_nome": "${nomeFase}",\n` +
            `              "fase_id": "${idFase}"\n` +
            '          });\n' +
            '      }\n' +
            '```\n';

        // --- 4. INSERIR O BLOCO NO ARQUIVO ---
        await app.vault.append(activeFile, blocoFaseTemplate);
        new Notice(`✅ Fase "${nomeFase}" adicionada com sucesso!`);

    } catch (e) {
        console.error("Erro ao adicionar Fase de Projeto:", e);
        new Notice("❌ Ocorreu um erro crítico. Verifique o console.");
    }
};