---
tipo: dashboard_mestre_midias
midia_selecionada_nome: O homem mais rico da Babilonia
midia_selecionada_id: o_homem_mais_rico_da_babilonia
midia_selecionada_tipo: Livros
ciclo_selecionado_view: Ciclo 1
view_mode_esforco: column
view_mode_velocidade: column
view_mode_horarios: column
view_mode_distribuicao: pie
tags:
  - dashboard
---

# 📊 Dashboard de Análise de Mídias


>[!multi-column]
>> [!info] Mídia Selecionada
>> - Nome da Mídia: `= this.midia_selecionada_nome`
>>```meta-bind-button
>> label: "🔍 Filtrar Análise"
>> style: primary
>> actions:
>>   - type: inlineJS
>>     code: |
>>       const qa = this.app.plugins.plugins.quickadd?.api;
>>       if (qa) {
>>           qa.executeChoice("Filtrar Dashboard de Mídias");
>>       } else {
>>           new Notice("❌ ERRO: API do QuickAdd não está disponível.");
>>       }
>>```
>
>> [!info] Mudar Ciclo
>> - Ciclo Selecionado: `= this.ciclo_selecionado_view`
>>```meta-bind-button
>>label: "🔄 Mudar Ciclo"
>>style: primary
>>actions:
>>  - type: inlineJS
>>    code: |
>>      const qa = this.app.plugins.plugins.quickadd?.api;
>>      if (qa) {
>>          // Certifique-se de criar uma Macro no QuickAdd chamada "Filtrar Ciclo Dashboard" que aponte para o script acima
>>          qa.executeChoice("Filtrar Ciclo Dashboard de Mídias"); 
>>      }
>>```




---


<!-- START_DYNAMIC_CONTENT -->

> [!multi-column]
>> [!info] [[Guia Dashboards Mídias#KPIs Chave|KPIs Chave]]
>> ```dataviewjs
>> const idMidia = dv.current().midia_selecionada_id;
>> if (idMidia) {
>>    const tipoMidia = dv.current().midia_selecionada_tipo;
>>    let viewPath = "";
>>    switch (tipoMidia) {
>>        case "Livros": viewPath = "99 - BACKEND/Scripts/Views/Livro/renderKPIsEficiencia"; break;
>>        case "Cursos": viewPath = "99 - BACKEND/Scripts/Views/Curso/renderKPIsEficienciaCurso"; break;
>>        case "Series": case "Séries": viewPath = "99 - BACKEND/Scripts/Views/Serie/renderKPIsEficienciaSerie"; break;
>>        case "Filmes": viewPath = "99 - BACKEND/Scripts/Views/Filme/renderKPIsEficienciaFilme"; break;
>>        case "Documentarios": case "Documentários": case "Documentários (Seriados)": case "Documentarios (Seriados)": viewPath = "99 - BACKEND/Scripts/Views/Documentario/DocumentarioSerializado/renderKPIsEficienciaDocumentarioSerializado"; break;
>>        case "Documentários (Únicos)": case "Documentarios (Unicos)": viewPath = "99 - BACKEND/Scripts/Views/Documentario/DocumentarioAtomico/renderKPIsEficienciaDocumentarioUnico"; break;
>>        case "Podcasts (Seriados)": viewPath = "99 - BACKEND/Scripts/Views/Podcast/PodcastSerializado/renderKPIsEficienciaPodcastSerializado"; break;
>>        case "Podcasts (Únicos)": viewPath = "99 - BACKEND/Scripts/Views/Podcast/PodcastAtomico/renderKPIsEficienciaPodcastUnico"; break;
>>        case "Artigos (Paginados)": viewPath = "99 - BACKEND/Scripts/Views/Artigo/ArtigoPaginado/renderKPIsEficienciaArtigoPaginado"; break;
>>        case "Artigos (Atômicos)": viewPath = "99 - BACKEND/Scripts/Views/Artigo/ArtigoAtomico/renderKPIsEficienciaArtigoAtomico"; break;
>>        case "Documentações (Paginadas)": viewPath = "99 - BACKEND/Scripts/Views/Documentacao/renderKPIsEficienciaDocumentacaoPaginado"; break;
>>        case "Videos": case "Vídeos": viewPath = "99 - BACKEND/Scripts/Views/Video/renderKPIsEficienciaVideo"; break;
>>        case "Jogos": viewPath = "99 - BACKEND/Scripts/Views/Jogo/renderKPIsEficienciaJogo"; break;
>>    }
>>    if (viewPath) dv.view(viewPath, { dashboard: dv.current() });
>>    else dv.paragraph(`❌ Tipo "${tipoMidia}" não mapeado.`);
>> } else {
>>     dv.view("99 - BACKEND/Scripts/Views/DashboardMidias/renderGlobalMediaKPIs");
>> }
>> ```
>
>> [!info] [[Guia Dashboards Mídias#Cronograma & Progresso|Cronograma & Progresso]]
>> ```dataviewjs
>> const idMidia = dv.current().midia_selecionada_id;
>> if (idMidia) {
>>    const tipoMidia = dv.current().midia_selecionada_tipo;
>>    let viewPath = "";
>>    switch (tipoMidia) {
>>        case "Livros": viewPath = "99 - BACKEND/Scripts/Views/Livro/renderCronogramaLeitura"; break;
>>        case "Cursos": viewPath = "99 - BACKEND/Scripts/Views/Curso/renderCronogramaCurso"; break;
>>        case "Series": case "Séries": viewPath = "99 - BACKEND/Scripts/Views/Serie/renderCronogramaSerie"; break;
>>        case "Documentarios": case "Documentários": case "Documentários (Seriados)": case "Documentarios (Seriados)": viewPath = "99 - BACKEND/Scripts/Views/Documentario/DocumentarioSerializado/renderCronogramaDocumentarioSerializado"; break;
>>        case "Podcasts (Seriados)": viewPath = "99 - BACKEND/Scripts/Views/Podcast/PodcastSerializado/renderCronogramaPodcastSerializado"; break;
>>        case "Artigos (Paginados)": viewPath = "99 - BACKEND/Scripts/Views/Artigo/ArtigoPaginado/renderCronogramaLeituraArtigoPaginado"; break;
>>        case "Documentações (Paginadas)": viewPath = "99 - BACKEND/Scripts/Views/Documentacao/renderCronogramaLeituraDocumentacaoPaginado"; break;
>>        case "Jogos": viewPath = "99 - BACKEND/Scripts/Views/Jogo/renderCronogramaJogo"; break;
>>        // Atômicos
>>        case "Filmes": case "Documentários (Únicos)": case "Documentarios (Unicos)": case "Podcasts (Únicos)": case "Artigos (Atômicos)": case "Videos": case "Vídeos":
>>            dv.view("99 - BACKEND/Scripts/Views/DashboardMidias/renderStatusCicloGenerico", { dashboard: dv.current() }); 
>>            break;
>>    }
>>    if (viewPath) dv.view(viewPath, { dashboard: dv.current() });
>> } else { dv.paragraph("Selecione uma mídia."); }
>> ```


---
### Análise de Sequência
> [!multi-column]
>
>> [!info] [[Guia Dashboards Mídias#Métricas de Sequências|Métricas de Sequências]]
>> ```dataviewjs
>> await dv.view("99 - BACKEND/Scripts/Views/DashboardMidias/renderMediaStreaks", { dashboard: dv.current() })
>> ```
>
>> [!info] [[Guia Dashboards Mídias#Sequência Visual (Mensal)|Sequência Visual (Mensal)]]
>> ```dataviewjs
>> await dv.view("99 - BACKEND/Scripts/Views/DashboardMidias/renderContributionGraphMedia", { timeframe: 'month' })
>> ```


### Análise de Foco
> [!multi-column]
>
>> [!info] [[Guia Dashboards Mídias#Foco Diário|Foco Diário]]
>> ```dataviewjs
>> try {
>>     const scriptPath = "99 - BACKEND/Scripts/Views/DashboardMidias/renderChartEsforcoDiario.js";
>>     const scriptContent = await dv.io.load(scriptPath);
>>     const renderChart = eval(scriptContent);
>>     const chartStr = await renderChart(dv, {});
>>     dv.paragraph(chartStr);
>> } catch(e) { dv.paragraph("Erro: " + e.message); }
>> ```


---
### Análise de Padrões
> [!multi-column]
>
>> [!info] [[Guia Dashboards Mídias#Padrões de Horários|Padrões de Horários]]
>> ```dataviewjs
>> try {
>>     const scriptPath = "99 - BACKEND/Scripts/Views/DashboardMidias/renderChartHorarios.js";
>>     const scriptContent = await dv.io.load(scriptPath);
>>     const renderChart = eval(scriptContent);
>>     const chartStr = await renderChart(dv, {});
>>     dv.paragraph(chartStr);
>> } catch(e) { dv.paragraph("Erro: " + e.message); }
>> ```


---
### Análise de Quantidade
> [!multi-column]
>
>> [!info] [[Guia Dashboards Mídias#Quantidade Diária (Páginas/Aulas/Missões)|Quantidade Diária (Páginas/Aulas/Missões)]]
>> ```dataviewjs
>> try {
>>     const scriptPath = "99 - BACKEND/Scripts/Views/DashboardMidias/renderChartVelocidade.js";
>>     const scriptContent = await dv.io.load(scriptPath);
>>     const renderChart = eval(scriptContent);
>>     const chartStr = await renderChart(dv, {});
>>     dv.paragraph(chartStr);
>> } catch(e) { dv.paragraph("Erro: " + e.message); }
>> ```


### Análise de Distribuição
> [!multi-column]
>
>> [!info] [[Guia Dashboards Mídias#Distribuição (Capítulos/Fases)|Distribuição (Capítulos/Fases)]]
>> ```dataviewjs
>> try {
>>     const scriptPath = "99 - BACKEND/Scripts/Views/DashboardMidias/renderChartDistribuicao.js";
>>     const scriptContent = await dv.io.load(scriptPath);
>>     const renderChart = eval(scriptContent);
>>     const chartStr = await renderChart(dv, {});
>>     dv.paragraph(chartStr);
>> } catch(e) { dv.paragraph("Erro: " + e.message); }
>> ```


---
### [[Guia Dashboards Mídias#Detalhes das Sessões|Detalhes das Sessões]]
```dataviewjs
const idMidia = dv.current().midia_selecionada_id;
if (idMidia) {
    const tipoMidia = dv.current().midia_selecionada_tipo;
    let viewPath = "";
    switch (tipoMidia) {
        case "Livros": viewPath = "99 - BACKEND/Scripts/Views/Livro/renderDiagnosticoLeitura"; break;
        case "Cursos": viewPath = "99 - BACKEND/Scripts/Views/Curso/renderDiagnosticoAula"; break;
        case "Series": case "Séries": viewPath = "99 - BACKEND/Scripts/Views/Serie/renderDiagnosticoEpisodio"; break;
        case "Documentarios": case "Documentários": case "Documentários (Seriados)": case "Documentarios (Seriados)": viewPath = "99 - BACKEND/Scripts/Views/Documentario/renderDiagnosticoEpisodio"; break;
        case "Podcasts (Seriados)": viewPath = "99 - BACKEND/Scripts/Views/Podcast/renderDiagnosticoEpisodio"; break;
        case "Artigos (Paginados)": viewPath = "99 - BACKEND/Scripts/Views/Artigo/ArtigoPaginado/renderDiagnosticoLeituraArtigoPaginado"; break;
        case "Documentações (Paginadas)": viewPath = "99 - BACKEND/Scripts/Views/Documentacao/renderDiagnosticoLeituraDocumentacaoPaginado"; break;
        case "Jogos": viewPath = "99 - BACKEND/Scripts/Views/Jogo/renderDiagnosticoMissao"; break;
    }
    if (viewPath) dv.view(viewPath, { dashboard: dv.current() });
}
```


---
### [[Guia Dashboards Mídias#Inteligência Gerada|Inteligência Gerada]]
```dataviewjs
const idMidia = dv.current().midia_selecionada_id;
if (idMidia) {
    const tipoMidia = dv.current().midia_selecionada_tipo;
    let viewPath = "";
    switch (tipoMidia) {
        case "Livros": viewPath = "99 - BACKEND/Scripts/Views/Livro/renderDiagnosticoInsights"; break;
        case "Cursos": viewPath = "99 - BACKEND/Scripts/Views/Curso/renderDiagnosticoInsights"; break;
        case "Series": case "Séries": viewPath = "99 - BACKEND/Scripts/Views/Serie/renderDiagnosticoInsights"; break;
        case "Filmes": viewPath = "99 - BACKEND/Scripts/Views/Filme/renderDiagnosticoInsightsFilme"; break;
        case "Documentarios": case "Documentários": case "Documentários (Seriados)": case "Documentarios (Seriados)": viewPath = "99 - BACKEND/Scripts/Views/Documentario/renderDiagnosticoInsights"; break;
        case "Documentários (Únicos)": case "Documentarios (Unicos)": viewPath = "99 - BACKEND/Scripts/Views/Documentario/DocumentarioAtomico/renderDiagnosticoInsightsDocumentarioUnico"; break;
        case "Podcasts (Seriados)": viewPath = "99 - BACKEND/Scripts/Views/Podcast/renderDiagnosticoInsights"; break;
        case "Podcasts (Únicos)": viewPath = "99 - BACKEND/Scripts/Views/Podcast/PodcastAtomico/renderDiagnosticoInsightsPodcastUnico"; break;
        case "Artigos (Paginados)": viewPath = "99 - BACKEND/Scripts/Views/Artigo/ArtigoPaginado/renderDiagnosticoInsightsArtigoPaginado"; break;
        case "Artigos (Atômicos)": viewPath = "99 - BACKEND/Scripts/Views/Artigo/ArtigoAtomico/renderDiagnosticoInsightsArtigoAtomico"; break;
        case "Documentações (Paginadas)": viewPath = "99 - BACKEND/Scripts/Views/Documentacao/renderDiagnosticoInsightsDocumentacaoPaginado"; break;
        case "Videos": case "Vídeos": viewPath = "99 - BACKEND/Scripts/Views/Video/renderDiagnosticoInsightsVideo"; break;
        case "Jogos": viewPath = "99 - BACKEND/Scripts/Views/Jogo/renderDiagnosticoInsightsJogo"; break;
    }
    if (viewPath) dv.view(viewPath, { dashboard: dv.current() });
}
```

<!-- END_DYNAMIC_CONTENT -->