---
tipo: curso_hub
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
modulo_atual: 1
instrutor: ""
plataforma: ""
total_modulos: %%TOTAL_MODULOS%%
capa: ""
idioma: ""
categoria: ""
rating: 0
opiniao_geral: ""
creation_date: "%%DATA_CRIACAO%%"
creation_time: "%%HORA_CRIACAO%%"
ultima_aula_assistida: 1
aulas_assistidas: 1
consumo_status: "parado"
status: ""
aula_atual: 1
soberania: %%SOBERANIA%%
tags:
  - midia
  - midia/curso_hub
---

> [!summary] Detalhes do Curso
> - **Status:** `= choice(contains(this.file.folder, "Para Consumir"), "Para Assistir", choice(contains(this.file.folder, "Em Progresso"), "Assistindo", choice(contains(this.file.folder, "Concluídas"), "Concluído", "Arquivado")))`
> - **Soberania:** `= this.soberania`
> - **Plataforma:** `INPUT[suggester(optionQuery(#curso_plataforma), allowOther):plataforma]`
> - **Categoria:** `INPUT[suggester(optionQuery(#curso_categoria), allowOther):categoria]`
> - **Idioma:** `INPUT[suggester(optionQuery(#curso_idioma), allowOther):idioma]`
> - **Professor(a):** `INPUT[suggester(optionQuery(#curso_instrutor), allowOther):instrutor]`
> - **Total de Módulos:** `= this.total_modulos`
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

## 🗺️ Guia de Módulos

```meta-bind-button
label: "➕ Adicionar Novo Módulo"
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

      const macroName = "Adicionar Módulo ao Curso";
      
      qa.executeChoice(macroName, { 
          "active_file_path": activeFile.path
      });
```

```dataviewjs
await dv.view("99 - BACKEND/Scripts/Views/Curso/renderGuiaModulos")
```

---

## 💬 Avaliação & Opinião Geral do Curso
- **Minha Avaliação (0 a 10):** `INPUT[text(placeholder(Ex: 0 a 10)):rating]`
- **Opinião Geral:** `INPUT[textArea:opiniao_geral]`
