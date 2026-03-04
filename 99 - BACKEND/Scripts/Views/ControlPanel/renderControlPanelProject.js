// SOTA - renderControlPanelProject.js v1.2
// Painel de Controle Dinâmico focado em Ciclo de Vida e Gestão (Renomear integrado)

async function main() {
    const hub = input.hub || dv.current();
    if (!hub) { dv.paragraph("❌ Erro: Contexto do HUB não encontrado."); return; }

    const statusRaw = (hub.status || "indefinido").toLowerCase();

    // --- 1. DEFINIÇÃO DAS AÇÕES (Removido Estrutura, Adicionado Renomear) ---
    let buttons = [];

    const btnRenomear = { title: "Gestão", label: "🛠️ Renomear", macro: "Renomear Projeto Executivo", style: "default" };

    if (statusRaw === 'planejamento') {
        buttons = [
            { title: "Start", label: "▶️ Iniciar", macro: "Iniciar Projeto", style: "default" },
            btnRenomear
        ];
    } else if (statusRaw === 'ativo') {
        buttons = [
            { title: "Controle", label: "⏸️ Pausar", macro: "Pausar Projeto", style: "default" },
            { title: "Finalização", label: "✅ Concluir", macro: "Concluir Projeto", style: "default" },
            btnRenomear
        ];
    } else if (statusRaw === 'pausado') {
        buttons = [
            { title: "Controle", label: "▶️ Retomar", macro: "Iniciar Projeto", style: "default" },
            btnRenomear
        ];
    } else if (statusRaw === 'concluido') {
        buttons = [
            { title: "Legado", label: "🔄 Reativar", macro: "Iniciar Projeto", style: "default" },
            btnRenomear
        ];
    } else {
        buttons = [
            { title: "Erro", label: "Forçar Início", macro: "Iniciar Projeto", style: "default" },
            btnRenomear
        ];
    }

    // --- 2. GERADOR DE BOTÃO ---
    const generateButtonBlock = (btn) => {
        return `\`\`\`meta-bind-button
label: "${btn.label}"
style: ${btn.style}
actions:
  - type: inlineJS
    code: |
      const qa = this.app.plugins.plugins.quickadd?.api;
      if (qa) {
         const f = this.app.workspace.getActiveFile();
         if(f) qa.executeChoice("${btn.macro}", { "active_file_path": f.path });
      }
\`\`\``;
    };

    // --- 3. RENDERIZAÇÃO ---
    let markdown = "> [!multi-column]\n>\n";

    buttons.forEach((btn, index) => {
        markdown += `>> [!info] ${btn.title}\n`;
        const rawBlock = generateButtonBlock(btn);
        const indentedBlock = rawBlock.split('\n').map(line => `>> ${line}`).join('\n');
        markdown += `${indentedBlock}\n`;
        
        if (index < buttons.length - 1) {
            markdown += ">\n";
        }
    });

    dv.paragraph(markdown);
}

await main();