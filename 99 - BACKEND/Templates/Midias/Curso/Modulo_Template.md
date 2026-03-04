---
tipo: curso_modulo_hub
hub_uid: "%%HUB_UID%%"
numero_modulo: %%NUMERO_MODULO%%
total_aulas: 0
opiniao_geral: ""
rating: 0
tags:
  - curso_modulo_hub
---

# HUB - Módulo %%NUMERO_MODULO%%: %%NOME_CURSO%%

---

## ⚙️ Gerenciador de Aulas

```meta-bind-button
label: "➕ Adicionar Novas Aulas"
style: default
actions:
  - type: inlineJS
    code: |
      const qa = this.app.plugins.plugins.quickadd?.api;
      const dv = this.app.plugins.plugins.dataview?.api;
      
      if (!qa || !dv) {
          new obsidian.Notice("❌ ERRO: API do QuickAdd ou Dataview não está disponível.");
          return;
      }
      
      const activeFile = this.app.workspace.getActiveFile();
      if (!activeFile) return;

      const macroName = "Adicionar Aula ao Módulo (Curso)";
      
      const hubUid = dv.page(activeFile.path)?.hub_uid;
      if (!hubUid) {
          new obsidian.Notice("❌ ERRO: Não foi possível encontrar o 'hub_uid' nesta nota.");
          return;
      }

      qa.executeChoice(macroName, { 
          "hub_uid": hubUid,
          "active_file_path": activeFile.path
      });
```

---

## 📜 Lista de Aulas

```dataviewjs
const hubModulo = dv.current();
// A pasta do módulo é a pasta onde este arquivo HUB de Módulo está.
const pastaDoModulo = hubModulo.file.folder;

const pages = dv.pages(`"${pastaDoModulo}"`)
    // Filtra por arquivos que são do tipo 'curso_aula' E que pertencem ao mesmo HUB principal.
    .where(p => p.tipo === 'curso_aula' && p.hub_uid === hubModulo.hub_uid)
    .sort(p => p.numero_aula, 'asc');

if (pages.length > 0) {
    dv.table(
        ["Título"], // <-- Apenas uma coluna
        pages.map(p => [
            p.file.folder.split('/').pop() // <-- Extrai apenas o nome da pasta da aula
        ])
    );
} else {
    dv.paragraph("Nenhuma aula adicionada para este módulo ainda. Use o gerenciador acima.");
}
```

---

## 💬 Avaliação & Opinião Geral do Módulo
- **Minha Avaliação (0 a 10):** `INPUT[text(placeholder(Ex: 0 a 10)):rating]`
- **Opinião Geral:** `INPUT[textArea:opiniao_geral]`
