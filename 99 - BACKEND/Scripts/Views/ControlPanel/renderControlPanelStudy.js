// SOTA - renderControlPanelStudy.js v1.4
// Painel de Controle Dedicado para ESTUDOS
// Filosofia: Estudos são perenes. Apenas agregação.

async function main() {
    const hub = input.hub || dv.current();
    if (!hub) { dv.paragraph("❌ Erro: Contexto do HUB não encontrado."); return; }

    // --- 1. DEFINIÇÃO DAS AÇÕES ---
    // Simplificação Radical: Independente do status, as ações são sempre de expansão.
    let buttons = [
        { title: "Conhecimento", label: "🔗 Add Mídia", macro: "Associar Midia ao Estudo", style: "default" },
        { title: "Aplicação", label: "🔗 Add Projeto", macro: "Associar Projeto ao Estudo", style: "default" },
        { title: "Gestão", label: "🛠️ Renomear Estudo", macro: "Renomear Estudo", style: "default" }
    ];

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