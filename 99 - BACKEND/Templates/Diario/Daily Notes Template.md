---
data: <% tp.date.now("YYYY-MM-DD") %>
tipo: diario
tags:
  - diario/pessoal
aliases:
dia_semana: <% tp.date.now("dddd") %>
semana_ano: <% tp.date.now("WW") %>
mes_ano: <% tp.date.now("MMMM") %>
hora_dormir_ontem: 00:00
hora_acordar_hoje: 00:00
total_horas_sono: 0
sono_interrupcoes: false
sono_qualidade_percebida: 0
sono_disposicao_acordar: 0
higiene_luz_solar_manha: false
higiene_cafeina_off_15h: false
higiene_luz_ambiente_noturna: false
higiene_sem_telas_antes_dormir: false
higiene_ambiente_sono_otimizado: false
humor_acordar: 3
acontecimento_madrugada: ""
acontecimento_manha: ""
acontecimento_tarde: ""
acontecimento_noite: ""
oque_fez_hoje: ""
oque_fazer_amanha: ""
feedback_positivo: ""
feedback_negativo: ""
view_mode_foco_diario: column
view_mode_comparativo: column
journal: Relatório - Daily
journal-date: <% tp.date.now("YYYY-MM-DD") %>
---



```dataviewjs
await dv.view("99 - BACKEND/Scripts/Views/Daily/renderRevisaoOntem");
```

---
## 🚀 Aprimoramentos Pendentes

```dataviewjs
await dv.view("99 - BACKEND/Scripts/Views/Daily/renderAprimoramentos");
```

---



## 📥 Inbox / Foco do Dia



---

## 💤 Registro ao Acordar


> [!multi-column]
>
>> [!info]- Registro Sono
>>```dataviewjs
>>await dv.view("99 - BACKEND/Scripts/Views/Daily/renderSleepInputs");
>>```

---
## ⏰ Registros Periódicos

### 🌃 Madrugada (00:00 - 05:59)
> [!multi-column]
>
>> [!info]- Como foi?
>> ```dataviewjs
>> await dv.view("99 - BACKEND/Scripts/Views/Daily/renderDailyInputs", { periodo: "madrugada" });
>> ```


### 🌤️ Manhã (06:00 - 11:59)
> [!multi-column]
>
>> [!info]- Como foi?
>> ```dataviewjs
>> await dv.view("99 - BACKEND/Scripts/Views/Daily/renderDailyInputs", { periodo: "manha" });
>> ```


### ☀️ Tarde (12:00 - 17:59)
> [!multi-column]
>
>> [!info]- Como foi?
>> ```dataviewjs
>> await dv.view("99 - BACKEND/Scripts/Views/Daily/renderDailyInputs", { periodo: "tarde" });
>> ```

### 🌙 Noite (18:00 - 23:59)
> [!multi-column]
>
>> [!info]- Como foi?
>> ```dataviewjs
>> await dv.view("99 - BACKEND/Scripts/Views/Daily/renderDailyInputs", { periodo: "noite" });
>> ```

---

>[!multi-column]
>
>>[!info] **✅ Hábitos do Dia**
>>```dataviewjs
>>await dv.view("99 - BACKEND/Scripts/Views/Daily/renderDailyHabits")
>>```

---

## 🧬 Higiene do Sono & Cronobiologia

>[!multi-column]
>
>>[!info]+ **✅ Hábitos do Sono**
>>```dataviewjs
>>await dv.view("99 - BACKEND/Scripts/Views/Daily/renderSleepHygiene");
>>```


---

## 📜 Resumo de Atividades do Dia

> [!multi-column]
>
>> [!info] Atividades Registradas
>> ```dataviewjs
>> await dv.view("99 - BACKEND/Scripts/Views/Daily/renderActivitySummary");
>> ```

---

## 📊 Resumo de Performance & Stats

```meta-bind-button
label: "🔄 Processar & Finalizar Dia"
style: primary
actions:
  - type: inlineJS
    code: |
      const qa = this.app.plugins.plugins.quickadd?.api;
      if (qa) {
          qa.executeChoice("Processar & Finalizar Dia");
      } else {
          new obsidian.Notice("❌ ERRO: QuickAdd API não está disponível.");
      }
```


### 🚀 Indicadores Chave de Performance

```dataviewjs
await dv.view("99 - BACKEND/Scripts/Views/Daily/renderResumoPerformance");
```


## 📊 Evolução Diária (Ontem vs Hoje)

> [!multi-column]
>
>> [!info] Comparativo de Performance
>> ```dataviewjs
>> await dv.view("99 - BACKEND/Scripts/Views/Daily/renderTabelaComparacao");
>> ```
>
>> [!info] Gráfico de Pilares (XP)
>> ```dataviewjs
>> try {
>>     const scriptPath = "99 - BACKEND/Scripts/Views/Daily/renderChartComparacao.js";
>>     const scriptContent = await dv.io.load(scriptPath);
>>     const renderChart = eval(scriptContent);
>>     const input = { view_mode: dv.current().view_mode_comparativo };
>>     const chartStr = await renderChart(dv, input);
>>     dv.paragraph(chartStr);
>> } catch(e) { dv.paragraph("Erro: " + e.message); }
>> ```
>> ```meta-bind-button
>> label: "📊 Alternar Visualização"
>> style: default
>> actions:
>>   - type: inlineJS
>>     code: |
>>       const f = this.app.workspace.getActiveFile();
>>       if(f) {
>>           await this.app.fileManager.processFrontMatter(f, (fm) => {
>>               fm.view_mode_comparativo = (fm.view_mode_comparativo === 'column' ? 'line' : 'column');
>>           });
>>           setTimeout(() => { this.app.workspace.trigger("dataview:refresh-views"); }, 200);
>>       }
>> ```



> [!multi-column]
>
>> [!info]  [[A Daily Note S.O.T.A#Breakdown XP|Breakdown XPs]]
>> ```dataviewjs
>> await dv.view("99 - BACKEND/Scripts/Views/Daily/renderXpBreakdown");
>> ```


---

> [!multi-column]
>
>> [!info] ⏱️ Ritmo de Trabalho
>> ```dataviewjs
>> try {
>>     const scriptPath = "99 - BACKEND/Scripts/Views/Daily/renderChartFocoDiario.js";
>>     const scriptContent = await dv.io.load(scriptPath);
>>     const renderChart = eval(scriptContent);
>>     const input = { view_mode: dv.current().view_mode_foco_diario };
>>     const chartStr = await renderChart(dv, input);
>>     dv.paragraph(chartStr);
>> } catch(e) { dv.paragraph("Erro no gráfico: " + e.message); }
>> ```
>> ```meta-bind-button
>> label: "📊 Alternar Visualização"
>> style: default
>> actions:
>>   - type: inlineJS
>>     code: |
>>       const f = this.app.workspace.getActiveFile();
>>       if(f) {
>>           await this.app.fileManager.processFrontMatter(f, (fm) => {
>>               fm.view_mode_foco_diario = (fm.view_mode_foco_diario === 'column' ? 'line' : 'column');
>>           });
>>       setTimeout(() => { this.app.workspace.trigger("dataview:refresh-views"); }, 200);
>>       }
>> ```

---

> [!multi-column]
>
>> [!info] ⚡ Bio-Ritmo
>> ```dataviewjs
>> try {
>>     const scriptPath = "99 - BACKEND/Scripts/Views/Daily/renderChartEnergiaHumor.js";
>>     const scriptContent = await dv.io.load(scriptPath);
>>     const renderChart = eval(scriptContent);
>>     const chartStr = await renderChart(dv, {});
>>     dv.paragraph(chartStr);
>> } catch(e) { dv.paragraph("Erro no gráfico: " + e.message); }
>> ```

---

## 📜 Timeline do Dia

```dataviewjs
await dv.view("99 - BACKEND/Scripts/Views/Daily/renderLogsPorPeriodo");
```

---

## 📝 Resumo do Dia & Reflexões


> [!multi-column]
>
>> [!info]+ Resumo do Dia
>>```dataviewjs
>>await dv.view("99 - BACKEND/Scripts/Views/Daily/renderDailyReview");
>>```


---

## 📷 Galeria do Dia

```dataviewjs
await dv.view("99 - BACKEND/Scripts/Views/Daily/renderGaleriaMidia");
```

```meta-bind-button
label: "➕ Anexar Mídia"
style: default
actions:
  - type: inlineJS
    code: |
      const qa = this.app.plugins.plugins.quickadd?.api;
      if (qa) {
          // Nome exato da Choice criada no QuickAdd
          qa.executeChoice("Anexar Midia Galeria");
      } else {
          new Notice("❌ Erro: QuickAdd não encontrado.");
      }
```



---

## 🖼️ HQ do Dia


> [!multi-column]
>
>> [!info]
>> ```meta-bind-button
>> label: "🎨 Gerar HQ para AI"
>> style: primary
>> actions:
>>   - type: inlineJS
>>     code: |
>>      const qa = this.app.plugins.plugins.quickadd?.api;
>>      if (qa) {
>>          qa.executeChoice("GerarDossieHQ");
>>      } else {
>>          new Notice("❌ ERRO: QuickAdd API não está disponível.");
>>      }
>>```
>
>> [!info]
>> ```meta-bind-button
>> label: "✏️ Adicionar HQ"
>> style: primary
>> actions:
>>   - type: inlineJS
>>     code: |
>>      const qa = this.app.plugins.plugins.quickadd?.api;
>>      if (qa) {
>>          qa.executeChoice("Criar/Editar HQ");
>>      } else {
>>          new Notice("❌ Erro: QuickAdd não encontrado.");
>>      }
>>```

```dataviewjs
await dv.view("99 - BACKEND/Scripts/Views/Daily/renderHqDoDia");
```



---

## 🎙️ Áudio para o Futuro

```meta-bind-button
label: "🎤 Gravar Áudio"
style: default
actions:
  - type: inlineJS
    code: |
      const qa = this.app.plugins.plugins.quickadd?.api;
      if (qa) {
          qa.executeChoice("Gravar Audio Diario");
      } else {
          new Notice("❌ Erro: QuickAdd não está disponível.");
      }
```

