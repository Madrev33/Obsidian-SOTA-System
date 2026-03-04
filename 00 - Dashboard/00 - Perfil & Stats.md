---
tipo: dashboard_perfil
altura_cm: 189
xp_total_acumulado: 0
nivel: 0
xp_para_proximo_nivel: 0
total_historico_genio: 0
total_historico_saude: 0
total_historico_paz: 0
xp_barra_atual: 0
---




> [!multi-column]
>
>> [!info] 📊 Barra de XP
>>```dataviewjs
>>// Renderiza a Barra de Progresso HTML
>>try {
>>    const scriptPath = "99 - BACKEND/Scripts/Views/DashboardPerfil/renderBarraXP.js";
>>    const scriptContent = await dv.io.load(scriptPath);
>>    const renderBar = eval(scriptContent);
>>    const html = await renderBar(dv, {});
>>    dv.paragraph(html);
>>} catch(e) { dv.paragraph("Erro na Barra de XP: " + e.message); }
>>```

---

> [!multi-column]
>
>> [!info] [[Guia Dashboards Perfil & Stats#🧠 Quad-Core (7 Dias)|🧠 Quad-Core (7 Dias)]] 
>> ```dataviewjs
>> await dv.view("99 - BACKEND/Scripts/Views/DashboardPerfil/renderQuadCoreStatus");
>> ```

---



### [[Guia Dashboards Perfil & Stats#⏱️ Odômetro (30 Dias)|⏱️ Odômetro (30 Dias)]]

> [!multi-column]
>
>> [!info] Foco & Pausa (30 Dias)
>> ```dataviewjs
>> await dv.view("99 - BACKEND/Scripts/Views/DashboardPerfil/renderOdometroGlobal");
>> ```

### [[Guia Dashboards Perfil & Stats#⚖️ Balança de Soberania (30 Dias)|⚖️ Balança de Soberania (30 Dias)]]

> [!multi-column]
>
>> [!info] Distribuição de Tempo
>> ```dataviewjs
>> await dv.view("99 - BACKEND/Scripts/Views/DashboardPerfil/renderSoberaniaBalance");
>> ```

### [[Guia Dashboards Perfil & Stats#🏆 Hall of Fame S.O.T.A.|🏆 Hall of Fame S.O.T.A.]]

> [!multi-column]
>
>> [!info] Recordes Históricos
>> ```dataviewjs
>> await dv.view("99 - BACKEND/Scripts/Views/DashboardPerfil/renderHallOfFame");
>> ```


### [[Guia Dashboards Perfil & Stats#📚 Inventário Universal (Acervo)|📚 Inventário Universal (Acervo)]]

> [!multi-column]
>
>> [!info] 📚 Inventário
>>```dataviewjs
>>await dv.view("99 - BACKEND/Scripts/Views/DashboardPerfil/renderInventarioUniversal");
>>```

### [[Guia Dashboards Perfil & Stats#🌍 Distribuição de XP|🌍 Distribuição de XP]]


> [!multi-column]
>
>> [!info] Grafico de Pizza
>> ```dataviewjs
>> try {
>>     const scriptPath = "99 - BACKEND/Scripts/Views/DashboardPerfil/renderChartDistribuicaoVida.js";
>>     const scriptContent = await dv.io.load(scriptPath);
>>     const renderChart = eval(scriptContent);
>>     const chartStr = await renderChart(dv, {});
>>     dv.paragraph(chartStr);
>> } catch(e) { dv.paragraph("Erro na Pizza Global: " + e.message); }
>> ```

