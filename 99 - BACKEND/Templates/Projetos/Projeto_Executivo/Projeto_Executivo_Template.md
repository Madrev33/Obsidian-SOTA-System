---
tipo: projeto_hub
sota_uid: "%%SOTA_UID%%"
id_projeto: "%%ID_PROJETO%%"
status: planejamento 
meta_data_inicio: 
meta_prazo_final: 
data_criacao_ideia: "%%DATA_CRIACAO%%"
hora_criacao_ideia: "%%HORA_CRIACAO%%"
data_inicio: 
hora_inicio: 
data_conclusao: 
hora_conclusao:
sessao_ativa_timestamp_inicio: ""
codex_associados: []
soberania: %%SOBERANIA%%
tags:
  - projeto
---

> [!summary] Briefing do Projeto
> - **Status:** `= this.status`
> - **Soberania:** `= this.soberania`
> - **Meta de Início:** `INPUT[date:meta_data_inicio]`
> - **Meta de Prazo Final:** `INPUT[date:meta_prazo_final]`
> - **Tempo Restante:** `$= const fim = dv.date(dv.current().meta_prazo_final); if (fim && fim.isValid) { const hoje = dv.date("now"); if (hoje > fim) { dv.span("Prazo Encerrado"); } else { const restante = fim.diff(hoje, 'days').days; dv.span(Math.ceil(restante) + " dias restantes"); } } else { dv.span("N/A"); }`
> 
> - **Documentação:** `$= const uid = dv.current().sota_uid; const f = dv.pages().where(p => p.hub_uid === uid && p.tipo === 'projeto_documentacao')[0]; if (f) dv.span(f.file.link); else dv.span("N/A");`
> - **Anotações & Ideias:** `$= const uid = dv.current().sota_uid; const f = dv.pages().where(p => p.hub_uid === uid && p.tipo === 'projeto_anotacoes')[0]; if (f) dv.span(f.file.link); else dv.span("N/A");`

---

## ⚙️ Controle do Projeto

```dataviewjs
await dv.view("99 - BACKEND/Scripts/Views/ControlPanel/renderControlPanelProject", { hub: dv.current() })
```

