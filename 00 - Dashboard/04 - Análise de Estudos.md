---
tipo: dashboard_mestre_estudos
estudo_selecionado_nome: Programação
estudo_selecionado_uid: sota-oqgmtbzeuoz
view_mode_distribuicao_fontes: pie
tags:
  - dashboard
  - sota_system
view_mode_esforco_diario: column
---

# 🧠 Central de Conhecimento (Estudos)

> [!multi-column]
>
>> [!info] **Estudo Ativo**
>> 📌 **`= this.estudo_selecionado_nome`**
>> 
>> ```meta-bind-button
>> label: "📚 Selecionar Estudo"
>> style: primary
>> actions:
>>   - type: inlineJS
>>     code: |
>>       const qa = this.app.plugins.plugins.quickadd?.api;
>>       if (qa) {
>>           qa.executeChoice("Filtrar Dashboard de Estudos");
>>       } else {
>>           new Notice("❌ ERRO: API do QuickAdd não está disponível.");
>>       }
>> ```
>
>> [!info] **Acesso Rápido**
>> ```dataviewjs
>> const uid = dv.current().estudo_selecionado_uid;
>> if (uid) {
>>     const hub = dv.pages().where(p => p.sota_uid === uid)[0];
>>     if (hub) {
>>         dv.span(`📂 **Ir para o HUB:** ${hub.file.link}<br>`);
>>     }
>> } else {
>>     dv.span("Selecione um estudo.");
>> }
>> ```

---

## 1. Visão Macro

> [!multi-column]
>
>> [!info] [[Guia Dashboards Análise de Estudos#🗓️ Cronograma|🗓️ Cronograma]]
>> ```dataviewjs
>> const uid = dv.current().estudo_selecionado_uid;
>> if (uid) {
>>     await dv.view("99 - BACKEND/Scripts/Views/DashboardEstudos/renderCronogramaEstudo", { hub_uid: uid });
>> } else {
>>     dv.paragraph("Selecione um estudo.");
>> }
>> ```
>
>> [!info] [[Guia Dashboards Análise de Estudos#📊 KPIs Totais|📊 KPIs Totais]]
>> ```dataviewjs
>> const uid = dv.current().estudo_selecionado_uid;
>> if (uid) {
>>     await dv.view("99 - BACKEND/Scripts/Views/DashboardEstudos/renderKPIsEstudo", { hub_uid: uid });
>> }
>> ```

---

## 2. Consistência & Hábito

> [!multi-column]
>
>> [!info] [[Guia Dashboards Análise de Estudos#Métricas de Sequência|Métricas de Sequência]]
>> ```dataviewjs
>> const uid = dv.current().estudo_selecionado_uid;
>> if (uid) {
>>     await dv.view("99 - BACKEND/Scripts/Views/DashboardEstudos/renderStudyStreaks", { hub_uid: uid });
>> }
>> ```
>
>> [!info] [[Guia Dashboards Análise de Estudos#Heatmap de Estudo (Mensal)|Heatmap de Estudo (Mensal)]]
>> ```dataviewjs
>> const uid = dv.current().estudo_selecionado_uid;
>> if (uid) {
>>     await dv.view("99 - BACKEND/Scripts/Views/DashboardEstudos/renderContributionGraphStudy", { hub_uid: uid, timeframe: 'month' });
>> }
>> ```



### Diagnóstico de Foco & Pausa

> [!multi-column]
>
>> [!info] [[Guia Dashboards Análise de Estudos#⏱️ Foco & Pausa de Estudo Diário|⏱️ Foco & Pausa de Estudo Diário]]
>> ```dataviewjs
>> try {
>>     const scriptPath = "99 - BACKEND/Scripts/Views/DashboardEstudos/renderChartEsforcoDiarioEstudo.js";
>>     const scriptContent = await dv.io.load(scriptPath);
>>     if (!scriptContent) throw new Error(`Script Esforço não encontrado: ${scriptPath}`);
>>
>>     const renderChart = eval(scriptContent);
>>     
>>     const input = { 
>>         hub_uid: dv.current().estudo_selecionado_uid,
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


---

## 3. Fontes de Conhecimento

### Distribuição de Foco

> [!multi-column]
>
>> [!info] [[Guia Dashboards Análise de Estudos#Distribuição de Foco|Distribuição de Foco]]
>> ```dataviewjs
>> try {
>>     const scriptPath = "99 - BACKEND/Scripts/Views/DashboardEstudos/renderChartDistribuicaoFontes.js";
>>     const scriptContent = await dv.io.load(scriptPath);
>>     if (!scriptContent) throw new Error(`Script Distribuição não encontrado: ${scriptPath}`);
>>
>>     const renderChart = eval(scriptContent);
>>     
>>     const input = { 
>>         hub_uid: dv.current().estudo_selecionado_uid,
>>         view_mode: dv.current().view_mode_distribuicao_fontes 
>>     };
>>     
>>     const chartStr = await renderChart(dv, input);
>>     dv.paragraph(chartStr);
>>
>> } catch(e) { 
>>     dv.paragraph("❌ Erro ao carregar gráfico: " + e.message); 
>> }
>> ```




### Diagnóstico de Fontes

> [!multi-column]
>
>> [!info] [[Guia Dashboards Análise de Estudos#📑 Ranking de Fontes|📑 Ranking de Fontes]]
>> ```dataviewjs
>> const uid = dv.current().estudo_selecionado_uid;
>> if (uid) {
>>     await dv.view("99 - BACKEND/Scripts/Views/DashboardEstudos/renderDiagnosticoFontesEstudo", { hub_uid: uid });
>> }
>> ```


