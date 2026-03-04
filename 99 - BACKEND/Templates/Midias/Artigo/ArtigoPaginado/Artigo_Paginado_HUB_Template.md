---
tipo: artigo_paginado_hub
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
leitura_secao_atual: 1
autor: ""
fonte: ""
url: ""
data_publicacao: ""
total_paginas: %%TOTAL_PAGINAS%%
total_secoes: %%TOTAL_SECOES%%
idioma: ""
capa: ""
opiniao_geral: ""
categoria: ""
plataforma: ""
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
  - midia/artigo_paginado_hub
---

> [!summary] Detalhes do Artigo
> - **Status:** `= choice(contains(this.file.folder, "01. Para Consumir"), "Para Ler", choice(contains(this.file.folder, "02. Em Progresso"), "Lendo", choice(contains(this.file.folder, "03. Concluídas"), "Leitura Concluída", "Arquivado")))`
> - **Soberania:** `= this.soberania`  
> - **Fonte/Plataforma:** `INPUT[suggester(optionQuery(#artigo_fonte), allowOther):fonte]`
> - **Categoria:** `INPUT[suggester(optionQuery(#artigo_categoria), allowOther):categoria]`
> - **Autor(a):** `INPUT[suggester(optionQuery(#artigo_autor), allowOther):autor]`
> - **Idioma:** `INPUT[suggester(optionQuery(#artigo_idioma), allowOther):idioma]`
> - **Data de Publicação:** `INPUT[date:data_publicacao]`
> - **Link do Artigo:** `INPUT[text:url]`
> - **Total de Páginas:** `= this.total_paginas`
> - **Total de Seções:** `= this.total_secoes`


---


### ⚙️ Painel de Controle da Leitura

```dataviewjs
await dv.view("99 - BACKEND/Scripts/Views/ControlPanel/renderControlPanel", { hub: dv.current() })
```

---

## 📝 Avaliação & Opinião Geral Sobre o Artigo
- **Minha Avaliação (0 a 10):** `INPUT[text(placeholder(Ex: 0 a 10)):rating]`
- **Opinião Geral:** `INPUT[textArea:opiniao_geral]`
