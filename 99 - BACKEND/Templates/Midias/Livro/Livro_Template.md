---
tipo: livro_paginado_hub
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
leitura_capitulo_atual: 1
autor: ""
editora: ""
data_publicacao: ""
total_paginas: %%TOTAL_PAGINAS%%
total_capitulos: %%TOTAL_CAPITULOS%%
idioma: ""
capa: ""
opiniao_geral: ""
categoria: ""
rating: 0
creation_date: "%%DATA_CRIACAO%%"
creation_time: "%%HORA_CRIACAO%%"
ultima_pagina_lida: 0
paginas_lidas: 0
leitura_status: "parado"
leitura_pagina_atual: 1
soberania: %%SOBERANIA%%
tags:
  - midia
  - midia/livro_hub
---

> [!summary] Detalhes do Livro
> - **Status:** `= choice(contains(this.file.folder, "01. Para Consumir"), "Para Ler", choice(contains(this.file.folder, "02. Em Progresso"), "Lendo", choice(contains(this.file.folder, "03. Concluídas"), "Leitura Concluída", "Arquivado")))`  
> - **Soberania:** `= this.soberania`
> - **Autor(a):** `INPUT[suggester(optionQuery(#livro_autor), allowOther):autor]`
> - **Categoria:** `INPUT[suggester(optionQuery(#livro_categoria), allowOther):categoria]`
> - **Editora:** `INPUT[suggester(optionQuery(#livro_editora), allowOther):editora]`
> - **Idioma:** `INPUT[suggester(optionQuery(#livro_idioma), allowOther):idioma]`
> - **Data de Publicação:** `INPUT[date:data_publicacao]`
> - **Total de Páginas:** `= this.total_paginas`
> - **Total de Capítulos:** `= this.total_capitulos`
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


### ⚙️ Painel de Controle da Leitura

```dataviewjs
await dv.view("99 - BACKEND/Scripts/Views/ControlPanel/renderControlPanel", { hub: dv.current() })
```

---

### 📝 Avaliação & Opinião Geral Sobre o Livro
- **Minha Avaliação (0 a 10):** `INPUT[text(placeholder(Ex: 0 a 10)):rating]`
- **Opinião Geral:** `INPUT[textArea:opiniao_geral]`
