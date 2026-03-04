---
tipo: manual_exercicio
exercicio_id: panturrilha_no_leg_press
grupo_muscular_primario: panturrilhas
equipamento: Máquina
tipo_metrica: reps
tipo_resistencia: carga_externa
tags:
  - manual_exercicio
---


## 🖼️ Mídia de Referência
> *Links, vídeos e imagens de referência para a execução correta.*


## ✍️ Técnica de Execução
> *Descrição passo a passo da forma correta do movimento, posicionamento e respiração.*


## ❌ Erros Comuns a Evitar
> *Lista de erros frequentes que podem levar a lesões ou diminuir a eficácia do exercício.*


## 🔬 Análise Biomecânica
> *Explicação técnica sobre os músculos envolvidos, a curva de força e a função do movimento.*


---
## 📊 Dashboard de Performance Individual

### [[Guia Dashboards Exercícios#🏆 Recordes Pessoais (RPs)|🏆 Recordes Pessoais (RPs)]]

>[!multi-column]
>
>> [!info] *Seus melhores levantamentos históricos para este exercício.*
>>```dataviewjs
>>    const tipoMetrica = dv.current().tipo_metrica;
>>    let scriptPath = "";
>>
>>    if (tipoMetrica === 'distancia') {
>>        scriptPath = "99 - BACKEND/Scripts/Views/Exercicios/renderRecordesCardio";
>>    } else if (tipoMetrica === 'tempo') {
>>        scriptPath = "99 - BACKEND/Scripts/Views/Exercicios/renderRecordesIsometrico";
>>    } else {
>>        scriptPath = "99 - BACKEND/Scripts/Views/Exercicios/renderRecordesExercicio";
>>    }
>>
>>    // Passa o ID do exercício para o script selecionado
>>    dv.view(scriptPath, { exercicio_id: dv.current().exercicio_id });
>>```


### [[Guia Dashboards Exercícios#📈 Gráfico de Progressão|📈 Gráfico de Progressão]]

>[!multi-column]
>
>> [!info] *Evolução histórica de performance.*
>>
>>```dataviewjs
>>try {
>>    const tipoMetrica = dv.current().tipo_metrica;
>>    let scriptPath = "";
>>
>>    // Lógica Polimórfica: Escolhe o gráfico certo baseado no tipo do exercício
>>    if (tipoMetrica === 'distancia') {
>>        scriptPath = "99 - BACKEND/Scripts/Views/Exercicios/renderChartProgressoCardio.js";
>>    } else if (tipoMetrica === 'tempo') {
>>        scriptPath = "99 - BACKEND/Scripts/Views/Exercicios/renderChartProgressoIsometrico.js";
>>    } else {
>>        // Padrão para 'reps' e qualquer outro caso
>>        scriptPath = "99 - BACKEND/Scripts/Views/Exercicios/renderChartProgressoCarga.js";
>>    }
>>
>>    // Executa o script escolhido
>>    const scriptContent = await dv.io.load(scriptPath);
>>    const renderChart = eval(scriptContent);
>>    
>>    // Passa os dados necessários para o script (ID do exercício)
>>    const chartStr = await renderChart(dv, { exercicio_id: dv.current().exercicio_id }); 
>>    
>>    dv.paragraph(chartStr);
>>} catch(e) { dv.paragraph("❌ Erro ao carregar gráfico de progressão: " + e.message); }
>>```

### [[Guia Dashboards Exercícios#💪 Gráfico de Esforço vs. Volume|💪 Gráfico de Esforço vs. Volume]]

>[!multi-column]
>
>> [!info] *Análise da relação entre o esforço percebido (RPE) e o volume total (Carga x Reps) por sessão.*
>>
>>```dataviewjs
>>try {
>>    const scriptPath = "99 - BACKEND/Scripts/Views/Exercicios/renderChartEsforcoVolume.js";
>>    const scriptContent = await dv.io.load(scriptPath);
>>    const renderChart = eval(scriptContent);
>>    
>>    const chartStr = await renderChart(dv, {}); 
>>    dv.paragraph(chartStr);
>>} catch(e) { dv.paragraph("❌ Erro ao carregar gráfico: " + e.message); }
>>```


