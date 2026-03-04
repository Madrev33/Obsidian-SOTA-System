---
tipo: artigo_atomico_hub
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
autor: ""
fonte: ""
url: ""
capa_url: ""
idioma: ""
data_publicacao: ""
categoria: ""
rating: 0
opiniao_geral: ""
creation_date: "%%DATA_CRIACAO%%"
creation_time: "%%HORA_CRIACAO%%"
soberania: %%SOBERANIA%%
tags:
  - midia
  - midia/artigo_atomico_hub
---

> [!summary] Detalhes do Artigo
> - **Status:** `= this.leitura_status`
> - **Soberania:** `= this.soberania`
> - **Fonte/Plataforma:** `INPUT[suggester(optionQuery(#artigo_fonte), allowOther):fonte]`
> - **Categoria:** `INPUT[suggester(optionQuery(#artigo_categoria), allowOther):categoria]`
> - **Autor(a):** `INPUT[suggester(optionQuery(#artigo_autor), allowOther):autor]`
> - **Idioma:** `INPUT[suggester(optionQuery(#artigo_idioma), allowOther):idioma]`
> - **Link do Artigo:** `INPUT[text:url]`
> - **Data de Publicação:** `INPUT[date:data_publicacao]`


---

## 🚀 Ações de Finalização

```dataviewjs
await dv.view("99 - BACKEND/Scripts/Views/ControlPanel/renderControlPanel", { hub: dv.current() })
```

---

## 📝 Avaliação & Opinião Geral Sobre o Artigo
- **Minha Avaliação (0 a 10):** `INPUT[number(placeholder(Ex: 0 a 10)):rating]`
- **Opinião Geral:** `INPUT[textArea:opiniao_geral]`



