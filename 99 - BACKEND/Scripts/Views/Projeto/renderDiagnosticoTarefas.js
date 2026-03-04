// Componente SOTA: renderDiagnosticoTarefas.js v2.0 - Correção da Coluna Fase
// Mapeia tarefas para suas fases reais lendo a estrutura do HUB.

async function main() {
    const dashboard = input.dashboard;
    const sortBy = dashboard.sort_by_diagnostico_tarefa || 'tempoFocoSegundos';
    const sortOrder = dashboard.sort_order_diagnostico_tarefa || 'desc';

    if (!dashboard) { dv.paragraph("❌ ERRO: Contexto do dashboard não fornecido."); return; }
    const hubUID = dashboard.hub_uid;
    if (!hubUID) { dv.paragraph("❌ ERRO: 'hub_uid' não encontrado."); return; }
    
    // --- FUNÇÃO ROBUSTA PARA BUSCAR O HUB ---
    const findHubByUid_Robust = (uid) => {
        if (!uid) return null;
        const allFiles = app.vault.getMarkdownFiles();
        for (const file of allFiles) {
            const cache = app.metadataCache.getFileCache(file);
            if (cache?.frontmatter?.sota_uid === uid) return file; // Retorna TFile
        }
        return null;
    };
    const hubFile = findHubByUid_Robust(hubUID);
    if (!hubFile) { dv.paragraph(`❌ ERRO: HUB com UID ${hubUID} não encontrado.`); return; }

    // --- FUNÇÃO DE LIMPEZA DE NOME (Crucial para o match) ---
    const limparNomeTask = (texto) => {
        if (!texto) return "";
        return texto
            .replace(/\[🍅::\s*\d+\/\d+\]/g, '') 
            .replace(/#[\w\/-]+/g, '')          
            .replace(/\s*\^[a-zA-Z0-9-]+/g, '') 
            .replace(/- \[.\]\s*/, '')          
            .replace(/>\s*/g, '')               
            .replace(/\*\*/g, '')               
            .trim();
    };

    // --- 1. MAPEAMENTO DO HUB (Task -> Fase) ---
    const mapaTarefaParaFase = {}; // Chave: NomeTaskLimpo (lowercase), Valor: NomeFase
    
    const hubContent = await app.vault.read(hubFile);
    const linhasHub = hubContent.split('\n');
    
    let faseAtualNome = "Geral"; // Default caso a task esteja fora de seção

    linhasHub.forEach(linha => {
        // Detecta Sessão/Fase
        const faseMatch = linha.trim().match(/^###\s+(?:Fase:\s*)?(.*)/i);
        if (faseMatch) {
            faseAtualNome = faseMatch[1].trim();
        }

        // Detecta Tarefa (Suporta Callouts)
        const linhaLimpaHeaders = linha.trim().replace(/^>+\s*/, '');
        if (linhaLimpaHeaders.startsWith("- [")) {
            const nomeTaskLimpo = limparNomeTask(linhaLimpaHeaders);
            if (nomeTaskLimpo) {
                mapaTarefaParaFase[nomeTaskLimpo.toLowerCase()] = faseAtualNome;
            }
        }
    });

    // --- 2. PROCESSAMENTO DOS LOGS ---
    const idProjeto = app.metadataCache.getFileCache(hubFile).frontmatter.id_projeto;
    const logBrutoPath = `99 - BACKEND/Logs_Metricas/Projetos/${idProjeto}/raw_logs.md`;
    const logFile = app.vault.getAbstractFileByPath(logBrutoPath);
    
    if (!logFile) { dv.paragraph("Nenhum log de atividade encontrado para este projeto."); return; }

    const content = await app.vault.cachedRead(logFile);
    const todosOsLogs = content.split('\n').filter(line => line.includes("(sessao_fim::"));
    
    if (todosOsLogs.length === 0) { dv.paragraph("Nenhuma sessão encontrada para este projeto."); return; }
    
    const dadosPorTarefa = todosOsLogs.reduce((acc, log) => {
        const tarefaMatch = log.match(/\(tarefa_focada::\s*"(.*?)"\)/);
        if (!tarefaMatch) return acc;

        const nomeTaskLogRaw = tarefaMatch[1];
        const nomeTaskLimpo = limparNomeTask(nomeTaskLogRaw);
        
        // Chave única para o objeto (Nome Limpo)
        const chaveTarefa = nomeTaskLimpo;
        
        if (!acc[chaveTarefa]) {
            // Tenta achar a fase no mapa
            let faseIdentificada = mapaTarefaParaFase[chaveTarefa.toLowerCase()];
            
            // Fallback: Tenta busca parcial se não achar exato
            if (!faseIdentificada) {
                const keyEncontrada = Object.keys(mapaTarefaParaFase).find(k => k.includes(chaveTarefa.toLowerCase()) || chaveTarefa.toLowerCase().includes(k));
                if (keyEncontrada) faseIdentificada = mapaTarefaParaFase[keyEncontrada];
            }

            // Fallback 2: Tenta extrair da tag antiga (Legado)
            if (!faseIdentificada) {
                const tagMatch = nomeTaskLogRaw.match(/#projeto\/[^\/]+\/([^\/]+)/);
                faseIdentificada = tagMatch ? tagMatch[1].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : "N/A";
            }

            acc[chaveTarefa] = { 
                tarefa: chaveTarefa, 
                fase: faseIdentificada, 
                tempoFocoSegundos: 0, 
                sessoesFoco: 0, 
                tempoPausasSegundos: 0, 
                sessoesPausas: 0, 
                datas: new Set(), 
                ultimaData: null 
            };
        }

        const duracaoMatch = log.match(/\(duracao_total_sessao_segundos::\s*(\d+)\)/);
        const duracao = duracaoMatch ? parseInt(duracaoMatch[1]) : 0;
        
        if (log.includes("(sessao_fim::WORK)")) {
            acc[chaveTarefa].tempoFocoSegundos += duracao;
            acc[chaveTarefa].sessoesFoco += 1;
        } else if (log.includes("(sessao_fim::BREAK)")) {
            acc[chaveTarefa].tempoPausasSegundos += duracao;
            acc[chaveTarefa].sessoesPausas += 1;
        }

        const dateMatch = log.match(/\(log_date::\s*([^)]+)\)/);
        if (dateMatch) acc[chaveTarefa].datas.add(dateMatch[1]);
        
        return acc;
    }, {});
    
    // Calcula a última data para cada tarefa
    for (const key in dadosPorTarefa) {
        const datasArray = Array.from(dadosPorTarefa[key].datas).sort();
        dadosPorTarefa[key].ultimaData = datasArray.length > 0 ? datasArray[datasArray.length - 1] : null;
    }

    if (Object.keys(dadosPorTarefa).length === 0) { dv.paragraph("Nenhuma tarefa trabalhada encontrada nos logs."); return; }

    const dadosProcessados = Object.values(dadosPorTarefa);
    
    // Ordenação dinâmica
    dadosProcessados.sort((a, b) => {
        const valA = a[sortBy] ?? (sortBy.includes('Data') ? null : 0);
        const valB = b[sortBy] ?? (sortBy.includes('Data') ? null : 0);

        if (valA === valB) return 0;
        if (valA === null) return 1; 
        if (valB === null) return -1;
        
        const comparison = valA < valB ? -1 : 1;
        return sortOrder === 'asc' ? comparison : -comparison;
    });

    const formatarSegundos = (s) => {
        if (isNaN(s) || s === 0) return "0s";
        const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), secs = Math.round(s % 60);
        return [h > 0 ? `${h}h` : '', m > 0 ? `${m}m` : '', (secs > 0 || (h === 0 && m === 0)) ? `${secs}s` : ''].filter(Boolean).join(' ');
    };

    const headers = ["Tarefa", "Fase", "Tempo Foco", "Tempo Pausa", "Sessões Foco", "Sessões Pausa", "Última Data"];

    const tabelaArray = dadosProcessados.map(p => {
        const dataLink = p.ultimaData ? dv.fileLink(`01 - Registros/01. Daily/${dv.date(p.ultimaData).toFormat("yyyy/MM")}/${p.ultimaData}.md`, false, p.ultimaData) : "N/A";
        return [
            p.tarefa, 
            `${p.fase}`, 
            formatarSegundos(p.tempoFocoSegundos),
            formatarSegundos(p.tempoPausasSegundos),
            p.sessoesFoco,
            p.sessoesPausas,
            dataLink
        ];
    });

    dv.table(headers, tabelaArray);
}
main();