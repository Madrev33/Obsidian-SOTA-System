---
tipo: dashboard_revisao
start_date: 2026-01-01
end_date: 2026-01-31
periodo_label: Este Mês
tags:
  - dashboard
  - revisao
view_mode_tendencia_foco: column
view_mode_foco_categoria: pie
view_mode_xp: area
view_mode_insights: column
view_mode_health: line
view_mode_biorhythm: combo
view_mode_acao: combo
view_mode_soberania: column
---


> [!multi-column]
>
>> [!info] **Período de Análise**
>> 📅 **`= this.periodo_label`**
>> **(`= this.start_date` até `= this.end_date`)**
>> 
>> ```meta-bind-button
>> label: "🗓️ Selecionar Período"
>> style: default
>> actions:
>>   - type: inlineJS
>>     code: |
>>       const qa = this.app.plugins.plugins.quickadd?.api;
>>       if (qa) {
>>           qa.executeChoice("Filtrar Periodo Revisao");
>>       } else {
>>           new Notice("❌ ERRO: API do QuickAdd não está disponível.");
>>       }
>> ```
>>
>>📝 **Relatório de Análise**
>> ```meta-bind-button
>> label: "📝 Gerar Relatório AI"
>> style: default
>> actions:
>>   - type: inlineJS
>>     code: |
>>       const qa = this.app.plugins.plugins.quickadd?.api;
>>       if (qa) {
>>           qa.executeChoice("Exportar Relatorio Revisao");
>>       } else {
>>           new Notice("❌ ERRO: API do QuickAdd não está disponível.");
>>       }
>> ```

---

## [[Guia Dashboards Central de Revisões#🏆 Destaques do Período|🏆 Destaques do Período]]

> [!multi-column]
>
>> [!info] Picos & Vales
>> ```dataviewjs
>> await dv.view("99 - BACKEND/Scripts/Views/DashboardRevisao/renderPeriodHighlights");
>> ```

---

## [[Guia Dashboards Central de Revisões#Aprimoramentos Pendentes|Aprimoramentos Pendentes]]

```dataviewjs
await dv.view("99 - BACKEND/Scripts/Views/DashboardRevisao/renderTabelaAprimoramentos")
```


---

## [[Guia Dashboards Central de Revisões#Tempo Gasto com Eles e Eu|Tempo Gasto com Eles e Eu]]

> [!multi-column]
>
>> [!info] Densidade de Vida
>> ```dataviewjs
>> try {
>>     const scriptPath = "99 - BACKEND/Scripts/Views/DashboardRevisao/renderChartSoberania.js";
>>     const scriptContent = await dv.io.load(scriptPath);
>>     const renderChart = eval(scriptContent);
>>     
>>     // Passa o modo de visualização atual
>>     const input = { view_mode: dv.current().view_mode_soberania };
>>     
>>     const chartStr = await renderChart(dv, input);
>>     dv.paragraph(chartStr);
>> } catch(e) { dv.paragraph("Erro: " + e.message); }
>> ```




## [[Guia Dashboards Central de Revisões#Análise de Foco & Pausa|Análise de Foco & Pausa]]

> [!multi-column]
>
>>[!info] Foco & Pausa
>>```dataviewjs
>>try {
>>    const scriptPath = "99 - BACKEND/Scripts/Views/DashboardRevisao/renderChartTendenciaFoco.js";
>>    const scriptContent = await dv.io.load(scriptPath);
>>    const renderChart = eval(scriptContent);
>>    
>>    const input = { 
>>        view_mode: dv.current().view_mode_tendencia_foco 
>>    };
>>    
>>    const chartStr = await renderChart(dv, input);
>>    dv.paragraph(chartStr);
>>} catch(e) { dv.paragraph("Erro no gráfico: " + e.message); }
>>```


## [[Guia Dashboards Central de Revisões#Alocação de Foco|Alocação de Foco]]

> [!multi-column]
>
>> [!info] Alocação de Foco
>> ```dataviewjs
>> try {
>>     const scriptPath = "99 - BACKEND/Scripts/Views/DashboardRevisao/renderChartFocoPorCategoriaPeriodo.js";
>>     const scriptContent = await dv.io.load(scriptPath);
>>     const renderChart = eval(scriptContent);
>>     const input = { view_mode: dv.current().view_mode_foco_categoria };
>>     const chartStr = await renderChart(dv, input);
>>     dv.paragraph(chartStr);
>> } catch(e) { dv.paragraph("Erro no gráfico: " + e.message); }
>> ```



## [[Guia Dashboards Central de Revisões#Performance & XP (Gamificação)|Performance & XP (Gamificação)]]

> [!multi-column]
>
>> [!info] Tendência de XP Diário
>> ```dataviewjs
>> try {
>>     const scriptPath = "99 - BACKEND/Scripts/Views/DashboardRevisao/renderChartXPPerformance.js";
>>     const scriptContent = await dv.io.load(scriptPath);
>>     const renderChart = eval(scriptContent);
>>     const input = { view_mode: dv.current().view_mode_xp || 'area' };
>>     const chartStr = await renderChart(dv, input);
>>     dv.paragraph(chartStr);
>> } catch(e) { dv.paragraph("❌ Erro no gráfico de XP: " + e.message); }
>> ```




## [[Guia Dashboards Central de Revisões#Bio-Ritmo Emocional|Bio-Ritmo Emocional]]

> [!multi-column]
>
>> [!info] Média Energia & Humor
>> ```dataviewjs
>> try {
>>     const scriptPath = "99 - BACKEND/Scripts/Views/DashboardRevisao/renderChartEnergiaHumor.js";
>>     const scriptContent = await dv.io.load(scriptPath);
>>     const renderChart = eval(scriptContent);
>>     const input = { view_mode: dv.current().view_mode_biorhythm || 'combo' };
>>     const chartStr = await renderChart(dv, input);
>>     dv.paragraph(chartStr);
>> } catch(e) { dv.paragraph("❌ Erro no gráfico de Bio-Ritmo: " + e.message); }
>> ```


> [!multi-column]
>
>> [!info] Eventos Emocionais (Frequência)
>> ```dataviewjs
>> try {
>>     const scriptPath = "99 - BACKEND/Scripts/Views/DashboardRevisao/renderChartEventosEmocionais.js";
>>     const scriptContent = await dv.io.load(scriptPath);
>>     const renderChart = eval(scriptContent);
>>     const chartStr = await renderChart(dv, {});
>>     dv.paragraph(chartStr);
>> } catch(e) { dv.paragraph("Erro: " + e.message); }
>> ```




## [[Guia Dashboards Central de Revisões#Insights & Criatividade|Insights & Criatividade]]

> [!multi-column]
>
>> [!info] Volume de Insights Diários
>> ```dataviewjs
>> try {
>>     const scriptPath = "99 - BACKEND/Scripts/Views/DashboardRevisao/renderChartCriatividade.js";
>>     const scriptContent = await dv.io.load(scriptPath);
>>     const renderChart = eval(scriptContent);
>>     const input = { view_mode: dv.current().view_mode_insights || 'column' };
>>     const chartStr = await renderChart(dv, input);
>>     dv.paragraph(chartStr);
>> } catch(e) { dv.paragraph("❌ Erro no gráfico de Criatividade: " + e.message); }
>> ```



## [[Guia Dashboards Central de Revisões#Saúde & Bem-Estar|Saúde & Bem-Estar]]
*Como estão os pilares da sua saúde física?*

> [!multi-column]
>
>> [!info] Análise de Saúde Física
>> ```dataviewjs
>> try {
>>     const scriptPath = "99 - BACKEND/Scripts/Views/DashboardRevisao/renderChartSaudeFisica.js";
>>     const scriptContent = await dv.io.load(scriptPath);
>>     const renderChart = eval(scriptContent);
>>     const input = { view_mode: dv.current().view_mode_health || 'line' };
>>     const chartStr = await renderChart(dv, input);
>>     dv.paragraph(chartStr);
>> } catch(e) { dv.paragraph("❌ Erro no gráfico de Saúde: " + e.message); }
>> ```


## [[Guia Dashboards Central de Revisões#Consistência de Hábitos (Visão do Período)|Consistência de Hábitos (Visão do Período)]]

```dataviewjs
await dv.view("99 - BACKEND/Scripts/Views/DashboardRevisao/renderTabelaHabitosPeriodo", { dashboard: dv.current() })
```

## [[Guia Dashboards Central de Revisões#💎 Análise Qualitativa|💎 Análise Qualitativa]]

```dataviewjs
await dv.view("99 - BACKEND/Scripts/Views/DashboardRevisao/renderResumoQualitativo", { dashboard: dv.current() })
```


## [[Guia Dashboards Central de Revisões#🔬 Análise de Performance de Foco|🔬 Análise de Performance de Foco]]

> [!multi-column]
>
>> [!info] Qualidade & Padrões
>> ```dataviewjs
>> try {
>>     const scriptPath = "99 - BACKEND/Scripts/Views/DashboardRevisao/renderAnaliseProfundaFoco.js";
>>     const scriptContent = await dv.io.load(scriptPath);
>>     const renderAnalysis = eval(scriptContent);
>>     const html = await renderAnalysis(dv, {});
>>     dv.paragraph(html);
>> } catch(e) { dv.paragraph("Erro na Análise Profunda: " + e.message); }
>> ```
