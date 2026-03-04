---
tipo: jogo_hub
sota_uid: "%%SOTA_UID%%"
id_midia: "%%ID_MIDIA%%"
ciclo_de_consumo_atual: 1
ciclos:
  - ciclo: 1
    status: "%%STATUS_MANUAL%%"
    data_inicio: "%%DATA_INICIO%%"
    hora_inicio: "%%HORA_INICIO%%"
    data_conclusao: ""
    hora_conclusao: ""
missao_atual: 1
plataforma: ""
total_missoes: 1
capa: ""
categoria: ""
idioma: ""
canal: ""
rating: 0
opiniao_geral: ""
creation_date: "%%DATA_CRIACAO%%"
creation_time: "%%HORA_CRIACAO%%"
ultima_missao_jogada: 1
missoes_jogadas: 1
consumo_status: "parado"
status: ""
soberania: %%SOBERANIA%%
tags:
  - midia
  - midia/jogo_hub
---

> [!summary] Detalhes do jogo
> - **Status:** `= choice(contains(this.file.folder, "Para Consumir"), "Para Assistir", choice(contains(this.file.folder, "Em Progresso"), "Assistindo", choice(contains(this.file.folder, "Concluídas"), "Concluído", "Arquivado")))`
> - **Soberania:** `= this.soberania`
> - **Plataforma:** `INPUT[suggester(optionQuery(#jogo_plataforma), allowOther):plataforma]`
> - **Categoria:** `INPUT[suggester(optionQuery(#jogo_categoria), allowOther):categoria]`
> - **Idioma:** `INPUT[suggester(optionQuery(#jogo_idioma), allowOther):idioma]`
> - **Total de Missões:** `= this.total_missoes`
>
>```meta-bind-button
>    label: "🖼️ Adicionar/Alterar Capa"
>    style: default
>    actions:
>      - type: inlineJS
>        code: |
>          const qa = this.app.plugins.plugins.quickadd?.api;
>          if (qa) {
>              qa.executeChoice("Adicionar Capa");
>          } else {
>              new Notice("❌ ERRO: QuickAdd API não está disponível.");
>          }
> ```


---


### ⚙️ Painel de Controle

```dataviewjs
await dv.view("99 - BACKEND/Scripts/Views/ControlPanel/renderControlPanel", { hub: dv.current() })
```

---

## 🗺️ Guia de Missões

```meta-bind-button
label: "➕ Adicionar Nova Missão"
style: default
actions:
  - type: inlineJS
    code: |
      const qa = this.app.plugins.plugins.quickadd?.api;
      const { Notice } = obsidian;
      if (!qa) {
          new Notice("❌ ERRO: API do QuickAdd não está disponível.");
          return;
      }
      const activeFile = this.app.workspace.getActiveFile();
      if (!activeFile) return;

      const macroName = "Adicionar Missão ao jogo";
      
      qa.executeChoice(macroName, { 
          "active_file_path": activeFile.path
      });
```

```dataviewjs
await dv.view("99 - BACKEND/Scripts/Views/Jogo/renderGuiaMissao")
```

---

## 💬 Avaliação & Opinião Geral do Jogo
- **Minha Avaliação (0 a 10):** `INPUT[text(placeholder(Ex: 0 a 10)):rating]`
- **Opinião Geral:** `INPUT[textArea:opiniao_geral]`
