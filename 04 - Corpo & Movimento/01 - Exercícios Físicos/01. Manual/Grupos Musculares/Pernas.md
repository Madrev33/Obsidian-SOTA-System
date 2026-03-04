---
tipo: manual_grupo_muscular
grupo_muscular_id: pernas
tags:
  - manual_grupo_muscular
---
# Pernas

## 🧠 Anatomia e Função
> *Descrição anatômica, função principal e secundária do grupo muscular.*


## 🏋️‍♂️ Exercícios Associados
>[!multi-column]
>
>>[!info] *Lista de todos os exercícios registrados no Manual para este grupo muscular.*
>>```dataview
>>LIST
>>FROM "04 - Corpo & Movimento/01 - Exercícios Físicos/01. Manual/Exercícios"
>>WHERE tipo = "manual_exercicio" AND grupo_muscular_primario = this.grupo_muscular_id
>>SORT file.name ASC
>>```

---
## 📊 Dashboard de Performance do Grupo

### [[Guia Dashboards Exercícios#🎯 KPIs Agregados Grupo Muscular|🎯 KPIs Agregados Grupo Muscular]]
>[!multi-column]
>
>>[!info] *Principais indicadores de performance para este grupo muscular ao longo do tempo.*
>>```dataviewjs
>>dv.view("99 - BACKEND/Scripts/Views/Exercicios/renderKPIsGrupoMuscular", { 
>>    grupo_muscular_id: dv.current().grupo_muscular_id 
>>})
>>```

### [[Guia Dashboards Exercícios#📈 Gráfico de Volume ao Longo do Tempo|📈 Gráfico de Volume ao Longo do Tempo]]

>[!multi-column]
>
>>[!info] *Evolução do volume total de treino (Carga x Reps) para este grupo muscular, agregado por dia.*
>>
>>```dataviewjs
>>try {
>>    const scriptPath = "99 - BACKEND/Scripts/Views/Exercicios/renderChartVolumeGrupoMuscular.js";
>>    const scriptContent = await dv.io.load(scriptPath);
>>    const renderChart = eval(scriptContent);
>>    
>>    const chartStr = await renderChart(dv, {}); 
>>    dv.paragraph(chartStr);
>>} catch(e) { dv.paragraph("❌ Erro ao carregar gráfico: " + e.message); }
>>```

### [[Guia Dashboards Exercícios#📊 Gráfico de Distribuição de Exercícios|📊 Gráfico de Distribuição de Exercícios]]

>[!multi-column]
>
>>[!info] *Qual a proporção de volume de cada exercício dentro deste grupo muscular.*
>>
>>```dataviewjs
>>try {
>>    const scriptPath = "99 - BACKEND/Scripts/Views/Exercicios/renderChartDistribuicaoExercicios.js";
>>    const scriptContent = await dv.io.load(scriptPath);
>>    const renderChart = eval(scriptContent);
>>    
>>    const chartStr = await renderChart(dv, {}); 
>>    dv.paragraph(chartStr);
>>} catch(e) { dv.paragraph("❌ Erro ao carregar gráfico: " + e.message); }
>>```

