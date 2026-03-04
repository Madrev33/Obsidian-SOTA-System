// SOTA - filtrarDashboardMidias.js v4.0 (Dynamic Layout Builder)
// Seleciona a mídia e RECONSTRÓI o layout do dashboard dinamicamente baseada no tipo.

module.exports = async (params) => {
    const { app, quickAddApi: qa, obsidian } = params;
    const { TFile, Notice } = obsidian;
    const dv = app.plugins.plugins["dataview"]?.api;

    if (!dv) { new Notice("❌ ERRO: Dataview não disponível."); return; }

    const dashboardFile = app.workspace.getActiveFile();
    if (!dashboardFile) { new Notice("❌ ERRO: Nenhum arquivo ativo."); return; }

    // --- 1. DEFINIÇÃO DOS BLOCOS (BUILDING BLOCKS) ---
    // Cada constante contém o Markdown de uma seção específica.

    const BLOCK_KPIS = `
> [!multi-column]
>> [!info] [[Guia Dashboards Mídias#KPIs Chave|KPIs Chave]]
>> \`\`\`dataviewjs
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
>>    else dv.paragraph(\`❌ Tipo "\${tipoMidia}" não mapeado.\`);
>> } else {
>>     dv.view("99 - BACKEND/Scripts/Views/DashboardMidias/renderGlobalMediaKPIs");
>> }
>> \`\`\`
>
>> [!info] [[Guia Dashboards Mídias#Cronograma & Progresso|Cronograma & Progresso]]
>> \`\`\`dataviewjs
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
>> \`\`\`
`;

    const BLOCK_STREAKS = `
---
### Análise de Sequência
> [!multi-column]
>
>> [!info] [[Guia Dashboards Mídias#Métricas de Sequências|Métricas de Sequências]]
>> \`\`\`dataviewjs
>> await dv.view("99 - BACKEND/Scripts/Views/DashboardMidias/renderMediaStreaks", { dashboard: dv.current() })
>> \`\`\`
>
>> [!info] [[Guia Dashboards Mídias#Sequência Visual (Mensal)|Sequência Visual (Mensal)]]
>> \`\`\`dataviewjs
>> await dv.view("99 - BACKEND/Scripts/Views/DashboardMidias/renderContributionGraphMedia", { timeframe: 'month' })
>> \`\`\`
`;

const BLOCK_TABELA_SESSOES = `
---
### [[Guia Dashboards Mídias#Detalhes das Sessões|Detalhes das Sessões]]
\`\`\`dataviewjs
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
\`\`\`
`;

    const BLOCK_TABELA_INSIGHTS = `
---
### [[Guia Dashboards Mídias#Inteligência Gerada|Inteligência Gerada]]
\`\`\`dataviewjs
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
\`\`\`
`;

    const BLOCK_ANALISE_FOCO = `
### Análise de Foco
> [!multi-column]
>
>> [!info] [[Guia Dashboards Mídias#Foco Diário|Foco Diário]]
>> \`\`\`dataviewjs
>> try {
>>     const scriptPath = "99 - BACKEND/Scripts/Views/DashboardMidias/renderChartEsforcoDiario.js";
>>     const scriptContent = await dv.io.load(scriptPath);
>>     const renderChart = eval(scriptContent);
>>     const chartStr = await renderChart(dv, {});
>>     dv.paragraph(chartStr);
>> } catch(e) { dv.paragraph("Erro: " + e.message); }
>> \`\`\`
`;

    const BLOCK_HORARIOS = `
---
### Análise de Padrões
> [!multi-column]
>
>> [!info] [[Guia Dashboards Mídias#Padrões de Horários|Padrões de Horários]]
>> \`\`\`dataviewjs
>> try {
>>     const scriptPath = "99 - BACKEND/Scripts/Views/DashboardMidias/renderChartHorarios.js";
>>     const scriptContent = await dv.io.load(scriptPath);
>>     const renderChart = eval(scriptContent);
>>     const chartStr = await renderChart(dv, {});
>>     dv.paragraph(chartStr);
>> } catch(e) { dv.paragraph("Erro: " + e.message); }
>> \`\`\`
`;

    const BLOCK_VELOCIDADE = `
---
### Análise de Quantidade
> [!multi-column]
>
>> [!info] [[Guia Dashboards Mídias#Quantidade Diária (Páginas/Aulas/Missões)|Quantidade Diária (Páginas/Aulas/Missões)]]
>> \`\`\`dataviewjs
>> try {
>>     const scriptPath = "99 - BACKEND/Scripts/Views/DashboardMidias/renderChartVelocidade.js";
>>     const scriptContent = await dv.io.load(scriptPath);
>>     const renderChart = eval(scriptContent);
>>     const chartStr = await renderChart(dv, {});
>>     dv.paragraph(chartStr);
>> } catch(e) { dv.paragraph("Erro: " + e.message); }
>> \`\`\`
`;

    const BLOCK_DISTRIBUICAO = `
### Análise de Distribuição
> [!multi-column]
>
>> [!info] [[Guia Dashboards Mídias#Distribuição (Capítulos/Fases)|Distribuição (Capítulos/Fases)]]
>> \`\`\`dataviewjs
>> try {
>>     const scriptPath = "99 - BACKEND/Scripts/Views/DashboardMidias/renderChartDistribuicao.js";
>>     const scriptContent = await dv.io.load(scriptPath);
>>     const renderChart = eval(scriptContent);
>>     const chartStr = await renderChart(dv, {});
>>     dv.paragraph(chartStr);
>> } catch(e) { dv.paragraph("Erro: " + e.message); }
>> \`\`\`
`;

    // --- 2. MAPA DE LAYOUTS (BLUEPRINTS) ---
    // Atômicos: Filmes, Vídeos, Artigos Curtos (Layout Limpo)
    // Seriais: Livros, Cursos, Séries, Jogos (Layout Completo)
    
    const layoutGlobal = BLOCK_KPIS;
    
    // Layout Completo: Gráficos primeiro, tabelas detalhadas no final
    const layoutCompleto = [
        BLOCK_KPIS,
        BLOCK_STREAKS,
        BLOCK_ANALISE_FOCO,
        BLOCK_HORARIOS,
        BLOCK_VELOCIDADE,
        BLOCK_DISTRIBUICAO,
        BLOCK_TABELA_SESSOES, // Tabela de Sessões (Capítulos/Episódios)
        BLOCK_TABELA_INSIGHTS // Tabela de Insights (Última coisa)
    ].join("\n");

    // Layout Atômico: Removemos explicitamente BLOCK_TABELA_SESSOES
    const layoutAtomico = [
        BLOCK_KPIS,
        BLOCK_ANALISE_FOCO,
        BLOCK_TABELA_INSIGHTS // Apenas Insights no final
    ].join("\n");

    // --- 3. SELEÇÃO DE TIPOS ---
    const tiposDeMidia = {
        "-- VISÃO GERAL DE TODAS AS MÍDIAS --": { type: "global", layout: layoutGlobal },
        "Livros": { type: "Livros", hub: "livro_paginado_hub", layout: layoutCompleto },
        "Cursos": { type: "Cursos", hub: "curso_hub", layout: layoutCompleto },
        "Séries": { type: "Series", hub: "serie_hub", layout: layoutCompleto },
        "Filmes": { type: "Filmes", hub: "filme_hub", layout: layoutAtomico },
        "Documentários (Séries)": { type: "Documentarios", hub: "documentario_serializado_hub", layout: layoutCompleto },
        "Documentários (Únicos)": { type: "Documentarios (Unicos)", hub: "documentario_unico_hub", layout: layoutAtomico },
        "Podcasts (Séries)": { type: "Podcasts (Seriados)", hub: "podcast_hub", layout: layoutCompleto },
        "Podcasts (Únicos)": { type: "Podcasts (Únicos)", hub: "podcast_unico_hub", layout: layoutAtomico },
        "Artigos (Paginados)": { type: "Artigos (Paginados)", hub: "artigo_paginado_hub", layout: layoutCompleto },
        "Artigos (Únicos)": { type: "Artigos (Atômicos)", hub: "artigo_atomico_hub", layout: layoutAtomico },
        "Documentações (Paginadas)": { type: "Documentações (Paginadas)", hub: "documentacao_paginado_hub", layout: layoutCompleto },
        "Vídeos": { type: "Videos", hub: "video_hub", layout: layoutAtomico },
        "Jogos": { type: "Jogos", hub: "jogo_hub", layout: layoutCompleto } // NOVO
    };

    // --- 4. FLUXO DE EXECUÇÃO ---
    const tipoSelecionadoLabel = await qa.suggester(Object.keys(tiposDeMidia), Object.keys(tiposDeMidia));
    if (!tipoSelecionadoLabel) return;

    const config = tiposDeMidia[tipoSelecionadoLabel];

    // Caso A: Visão Global
    if (config.type === "global") {
        await aplicarMudancas(dashboardFile, "", "", "", "Visão Agregada (Todos os Ciclos)", config.layout);
        new Notice("🧹 Visão Geral Ativada.");
        return;
    }

    // Caso B: Mídia Específica
    const midias = dv.pages()
        .where(p => p.tipo === config.hub && !p.file.path.includes("99 - BACKEND"))
        .map(p => ({
            nome: p.file.name.replace(/00\. HUB - /g, ''),
            id: p.id_midia,
            objetoCompleto: p
        })).values;

    if (midias.length === 0) { new Notice(`ℹ️ Nenhuma mídia do tipo "${tipoSelecionadoLabel}" encontrada.`); return; }

    const midiaSelecionada = await qa.suggester(midias.map(m => m.nome), midias);
    if (!midiaSelecionada) return;

    let cicloView = "Ciclo 1";
    if (!midiaSelecionada.objetoCompleto.ciclos || midiaSelecionada.objetoCompleto.ciclos.length === 0) {
        cicloView = "Ciclo 1";
    }

    await aplicarMudancas(
        dashboardFile, 
        midiaSelecionada.nome, 
        midiaSelecionada.id, 
        config.type, 
        cicloView, 
        config.layout
    );
    
    new Notice(`✅ Dashboard atualizado: ${midiaSelecionada.nome}`);

    // --- FUNÇÕES AUXILIARES ---
    async function aplicarMudancas(file, nome, id, tipo, ciclo, novoConteudo) {
        // 1. Atualizar Frontmatter
        await app.fileManager.processFrontMatter(file, (fm) => {
            fm.midia_selecionada_nome = nome;
            fm.midia_selecionada_id = id;
            fm.midia_selecionada_tipo = tipo;
            fm.ciclo_selecionado_view = ciclo;
        });

        // 2. Reescrita Dinâmica do Conteúdo
        let content = await app.vault.read(file);
        
        // Marcadores de Âncora (Você precisa adicionar isso manualmente no arquivo .md uma única vez)
        const START_MARKER = "<!-- START_DYNAMIC_CONTENT -->";
        const END_MARKER = "<!-- END_DYNAMIC_CONTENT -->";

        // Se os marcadores não existirem, adiciona no final do arquivo (segurança)
        if (!content.includes(START_MARKER)) {
            content += `\n\n${START_MARKER}\n${END_MARKER}\n`;
        }

        const regex = new RegExp(`${START_MARKER}[\\s\\S]*?${END_MARKER}`);
        const replacement = `${START_MARKER}\n${novoConteudo}\n${END_MARKER}`;
        
        const newContent = content.replace(regex, replacement);
        
        await app.vault.modify(file, newContent);
        
        // 3. Refresh Visual
        setTimeout(() => {
            const activeLeaf = app.workspace.activeLeaf;
            if (activeLeaf && activeLeaf.view.file && activeLeaf.view.file.path === file.path) {
                activeLeaf.rebuildView(); // Força re-render
            }
        }, 300);
    }
};