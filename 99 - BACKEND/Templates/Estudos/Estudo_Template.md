---
tipo: estudo_hub
sota_uid: "%%SOTA_UID%%"
id_estudo: "%%ID_ESTUDO%%"
topico_central: "%%TOPICO%%"
data_criacao_estudo: <% tp.date.now("YYYY-MM-DD") %>
hora_criacao_estudo: <% tp.date.now("HH:mm") %>
projetos_relacionados: []
midias_associadas: []
soberania: %%SOBERANIA%%
tags:
  - estudo
  - estudo_hub
---


## ⚙️ Controle do Estudo

```dataviewjs
await dv.view("99 - BACKEND/Scripts/Views/ControlPanel/renderControlPanelStudy", { hub: dv.current() })
```

---

## 🚀 Recursos de Aprendizado & Aplicação Prática
*Associe os Projetos e Mídias que alimentam este estudo.*

> [!multi-column]
>
>> [!info] **Mídias Associadas:**
>> ```dataviewjs
>> const links = dv.current().midias_associadas;
>> if (links && links.length > 0) { dv.list(links); }
>> else { dv.paragraph("Nenhuma mídia associada."); }
>> ```
>
>> [!info] **Projetos Associados:**
>> ```dataviewjs
>> const links = dv.current().projetos_relacionados;
>> if (links && links.length > 0) { dv.list(links); } 
>> else { dv.paragraph("Nenhum projeto associado."); }
>> ```