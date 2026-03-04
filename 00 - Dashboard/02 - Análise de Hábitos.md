---
tipo: dashboard_analitico
tags:
  - dashboard
  - habitos
---

# 🧬 Matriz de Consistência de Hábitos


## [[Guia Dashboards Análise de Hábitos#⚙️ Gestão de Hábitos|⚙️ Gestão de Hábitos]]

```meta-bind-button
label: "➕ Criar Novo Hábito"
style: default
actions:
  - type: inlineJS
    code: |
      const qa = this.app.plugins.plugins.quickadd?.api;
      if (qa) {
          qa.executeChoice("Criar Novo Hábito");
      } else {
          new Notice("❌ ERRO: QuickAdd API não está disponível.");
      }
```


## [[Guia Dashboards Análise de Hábitos#🏆 Ranking de Aderência Global|🏆 Ranking de Aderência Global]]

```dataviewjs
await dv.view("99 - BACKEND/Scripts/Views/Habitos/renderRankingHabitos", { dashboard: dv.current() })
```

---
## [[Guia Dashboards Análise de Hábitos#🧠 Matriz de Internalização|🧠 Matriz de Internalização]]
*Quais hábitos já fazem parte da sua identidade?*

```dataviewjs
await dv.view("99 - BACKEND/Scripts/Views/Habitos/renderMatrizMaturacao");
```

---

> [!multi-column]
>
>> [!info] [[Guia Dashboards Análise de Hábitos#⚠️ Gestão de Risco|⚠️ Gestão de Risco]]
>> ```dataviewjs
>> await dv.view("99 - BACKEND/Scripts/Views/Habitos/renderUTIHabitos");
>> ```
>
>> [!info] [[Guia Dashboards Análise de Hábitos#⚖️ Equilíbrio de Dificuldade|⚖️ Equilíbrio de Dificuldade]]
>> ```dataviewjs
>> try {
>>     const scriptPath = "99 - BACKEND/Scripts/Views/Habitos/renderChartDificuldadeHabitos.js";
>>     const scriptContent = await dv.io.load(scriptPath);
>>     const renderChart = eval(scriptContent);
>>     const chartStr = await renderChart(dv, {});
>>     dv.paragraph(chartStr);
>> } catch(e) { dv.paragraph("Erro no gráfico: " + e.message); }
>> ```