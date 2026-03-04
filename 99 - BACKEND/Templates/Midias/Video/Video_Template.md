---
tipo: video_hub
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
canal: ""
fonte: ""
url: ""
idioma: ""
capa: ""
data_publicacao: ""
categoria: ""
rating: 0
opiniao_geral: ""
creation_date: "%%DATA_CRIACAO%%"
creation_time: "%%HORA_CRIACAO%%"
soberania: %%SOBERANIA%%
tags:
  - midia
  - midia/video_hub
---

> [!summary] Detalhes do Vídeo
> - **Status:** `= choice(contains(this.file.folder, "Para Consumir"), "Para Assistir", choice(contains(this.file.folder, "Em Progresso"), "Assistindo", choice(contains(this.file.folder, "Concluídas"), "Concluído", "Arquivado")))`
> - **Soberania:** `= this.soberania`
> - **Idioma:** `INPUT[suggester(optionQuery(#video_idioma), allowOther):idioma]`
> - **Categoria:** `INPUT[suggester(optionQuery(#video_categoria), allowOther):categoria]`
> - **Fonte/Plataforma:** `INPUT[suggester(optionQuery(#video_plataforma), allowOther):plataforma]`
> - **Canal:** `INPUT[suggester(optionQuery(#video_canal), allowOther):canal]`
> - **Link do Vídeo:** `INPUT[text:url]`
> - **Data de Publicação:** `INPUT[date:data_publicacao]`
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

## 🚀 Ações de Finalização

```dataviewjs
await dv.view("99 - BACKEND/Scripts/Views/ControlPanel/renderControlPanel", { hub: dv.current() })
```

---

## 📝 Avaliação & Opinião Geral Sobre o Vídeo
- **Minha Avaliação (0 a 10):** `INPUT[number(placeholder(Ex: 0 a 10)):rating]`
- **Opinião Geral:** `INPUT[textArea:opiniao_geral]`



