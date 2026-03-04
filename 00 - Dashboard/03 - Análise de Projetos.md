---
tipo: dashboard_mestre_projetos
projeto_selecionado_nome: S.O.T.A SYSTEM
projeto_selecionado_uid: sota-q2eagkuzprb
view_mode_esforco_fase: pie
view_mode_velocity: column
view_mode_horarios_foco: column
tags:
  - dashboard
  - sota_system
view_mode_esforco_diario: column
---

# 🚀 Central de Comando de Projetos

> [!multi-column]
>
>> [!info] **Projeto Ativo**
>> 📌 **`= this.projeto_selecionado_nome`**
>> 
>> ```meta-bind-button
>> label: "🔍 Selecionar Projeto"
>> style: primary
>> actions:
>>   - type: inlineJS
>>     code: |
>>       const qa = this.app.plugins.plugins.quickadd?.api;
>>       if (qa) {
>>           qa.executeChoice("Filtrar Dashboard de Projetos");
>>       } else {
>>           new Notice("❌ ERRO: API do QuickAdd não está disponível.");
>>       }
>> ```
>
>> [!info] **Ações Rápidas**
>> ```dataviewjs
>> const uid = dv.current().projeto_selecionado_uid;
>> if (uid) {
>>     const hub = dv.pages().where(p => p.sota_uid === uid)[0];
>>     if (hub) {
>>         dv.span(`📂 **HUB:** ${hub.file.link}<br>`);
>>         
>>         const doc = dv.pages().where(p => p.hub_uid === uid && p.tipo === 'projeto_documentacao')[0];
>>         if (doc) dv.span(`📄 **Doc:** ${doc.file.link}<br>`);
>>         
>>         const notas = dv.pages().where(p => p.hub_uid === uid && p.tipo === 'projeto_anotacoes')[0];
>>         if (notas) dv.span(`🧠 **Notas:** ${notas.file.link}`);
>>     } else {
>>         dv.span("⚠️ Projeto não encontrado.");
>>     }
>> } else {
>>     dv.span("Selecione um projeto para ver ações.");
>> }
>> ```

---

## 1. Visão Macro

> [!multi-column]
>
>> [!info] [[Guia Dashboards Análise de Projetos#🗓️ Cronograma & Status|🗓️ Cronograma & Status]]
>> ```dataviewjs
>> const uid = dv.current().projeto_selecionado_uid;
>> if (uid) {
>>     // Injeta o UID no contexto do script para simular o comportamento local
>>     await dv.view("99 - BACKEND/Scripts/Views/Projeto/renderCronogramaProjeto", { dashboard: { hub_uid: uid } });
>> } else {
>>     dv.paragraph("Selecione um projeto para ver o cronograma.");
>> }
>> ```
>
>> [!info] [[Guia Dashboards Análise de Projetos#📊 KPIs de Performance|📊 KPIs de Performance]]
>> ```dataviewjs
>> const uid = dv.current().projeto_selecionado_uid;
>> if (uid) {
>>     await dv.view("99 - BACKEND/Scripts/Views/Projeto/renderKPIsProjeto", { dashboard: { hub_uid: uid } });
>> }
>> ```

---

## 2. Consistência & Hábito

> [!multi-column]
>
>> [!info] [[Guia Dashboards Análise de Projetos#Métricas de Sequências|Métricas de Sequências]]
>> ```dataviewjs
>> const uid = dv.current().projeto_selecionado_uid;
>> if (uid) {
>>     await dv.view("99 - BACKEND/Scripts/Views/DashboardProjetos/renderProjectStreaks", { hub_uid: uid });
>> }
>> ```
>
>> [!info] [[Guia Dashboards Análise de Projetos#Sequência Visual (Mensal)|Sequência Visual (Mensal)]]
>> ```dataviewjs
>> const uid = dv.current().projeto_selecionado_uid;
>> if (uid) {
>>     await dv.view("99 - BACKEND/Scripts/Views/DashboardProjetos/renderContributionGraphProject", { hub_uid: uid, timeframe: 'month' });
>> }
>> ```


---

## 3. Visão Tática (Execução)

### Consistência & Ritmo

> [!multi-column]
>
>> [!info] [[Guia Dashboards Análise de Projetos#⏱️ Esforço Diário (Foco vs. Pausa)|⏱️ Esforço Diário (Foco vs. Pausa)]]
>> ```dataviewjs
>> try {
>>     const scriptPath = "99 - BACKEND/Scripts/Views/DashboardProjetos/renderChartEsforcoDiarioProjeto.js";
>>     const scriptContent = await dv.io.load(scriptPath);
>>     if (!scriptContent) throw new Error(`Script Esforço não encontrado: ${scriptPath}`);
>>
>>     const renderChart = eval(scriptContent);
>>     
>>     const input = { 
>>         hub_uid: dv.current().projeto_selecionado_uid,
>>         view_mode: dv.current().view_mode_esforco_diario 
>>     };
>>     
>>     const chartStr = await renderChart(dv, input);
>>     dv.paragraph(chartStr);
>>
>> } catch(e) { 
>>     dv.paragraph("❌ Erro ao carregar Esforço: " + e.message); 
>> }
>> ```



### Padrões de Horários

> [!multi-column]
>
>> [!info] [[Guia Dashboards Análise de Projetos#⏱️ Padrão de Horário (Foco)|⏱️ Padrão de Horário (Foco)]]
>> ```dataviewjs
>> try {
>>     const scriptPath = "99 - BACKEND/Scripts/Views/DashboardProjetos/renderChartHorariosProjeto.js";
>>     const scriptContent = await dv.io.load(scriptPath);
>>     if (!scriptContent) throw new Error(`Script Horários não encontrado: ${scriptPath}`);
>>
>>     const renderChart = eval(scriptContent);
>>     
>>     const input = { 
>>         hub_uid: dv.current().projeto_selecionado_uid,
>>         view_mode: dv.current().view_mode_horarios_foco 
>>     };
>>     
>>     const chartStr = await renderChart(dv, input);
>>     dv.paragraph(chartStr);
>>
>> } catch(e) { 
>>     dv.paragraph("❌ Erro ao carregar Horários: " + e.message); 
>> }
>> ```


---

### Tarefas concluídas por dia

> [!multi-column]
>
>> [!info] [[Guia Dashboards Análise de Projetos#Tarefas Por Dia|Tarefas Por Dia]]
>> ```dataviewjs
>> try {
>>     const scriptPath = "99 - BACKEND/Scripts/Views/DashboardProjetos/renderChartVelocity.js";
>>     const scriptContent = await dv.io.load(scriptPath);
>>     if (!scriptContent) throw new Error(`Script Velocity não encontrado: ${scriptPath}`);
>>
>>     const renderChart = eval(scriptContent);
>>     
>>     // Passa o contexto dinâmico (UID e Modo de Visualização)
>>     const input = { 
>>         hub_uid: dv.current().projeto_selecionado_uid,
>>         view_mode: dv.current().view_mode_velocity 
>>     };
>>     
>>     const chartStr = await renderChart(dv, input);
>>     dv.paragraph(chartStr);
>>
>> } catch(e) { 
>>     dv.paragraph("❌ Erro ao carregar Velocity: " + e.message); 
>> }
>> ```


---


### 🔬 Análise de Tasks

> [!multi-column]
>
>> [!info] [[Guia Dashboards Análise de Projetos#📈 Distribuição de Foco|📈 Distribuição de Foco]]
>> ```dataviewjs
>> try {
>>     const scriptPath = "99 - BACKEND/Scripts/Views/DashboardProjetos/renderChartDistribuicaoFase.js";
>>     const scriptContent = await dv.io.load(scriptPath);
>>     if (!scriptContent) throw new Error(`Script Distribuição não encontrado: ${scriptPath}`);
>>
>>     const renderChart = eval(scriptContent);
>>     
>>     const input = { 
>>         hub_uid: dv.current().projeto_selecionado_uid,
>>         view_mode: dv.current().view_mode_esforco_fase 
>>     };
>>     
>>     const chartStr = await renderChart(dv, input);
>>     dv.paragraph(chartStr);
>>
>> } catch(e) { 
>>     dv.paragraph("❌ Erro ao carregar gráfico: " + e.message); 
>> }
>> ```

---

### 📊 Tabela de Eficiência por Fase

> [!multi-column]
>
>> [!info] [[Guia Dashboards Análise de Projetos#Tabela de Eficiência por Fase|Tabela de Eficiência por Fase]]
>> ```dataviewjs
>> const uid = dv.current().projeto_selecionado_uid;
>> if (uid) {
>>     // Reutiliza o script poderoso de análise de fases
>>     await dv.view("99 - BACKEND/Scripts/Views/Projeto/renderAnaliseFases", { dashboard: { hub_uid: uid } });
>> }
>> ```

---

### 📉 Diagnóstico de Tarefas (Custo Cognitivo)


> [!multi-column]
>
>> [!info] [[Guia Dashboards Análise de Projetos#Diagnóstico de Tarefas|Diagnóstico de Tarefas]]
>>```dataviewjs
>>const uid = dv.current().projeto_selecionado_uid;
>>if (uid) {
>>    await dv.view("99 - BACKEND/Scripts/Views/Projeto/renderDiagnosticoTarefas", { dashboard: { hub_uid: uid } });
>>} else {
>>    dv.paragraph("Selecione um projeto para ver o diagnóstico de tarefas.");
>>}
>>```

