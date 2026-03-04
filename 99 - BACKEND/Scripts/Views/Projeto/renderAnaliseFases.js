// Componente SOTA: renderAnaliseFases.js v2.1 - Match por Nome de Task (Correção de Tempo)
// Agrega métricas baseando-se no mapeamento Task->Fase do HUB atual.

async function main() {
    // --- FUNÇÃO ROBUSTA PARA BUSCAR O HUB ---
    const findHubByUid_Robust = (uid) => {
        if (!uid) return null;
        const allFiles = app.vault.getMarkdownFiles();
        for (const file of allFiles) {
            const cache = app.metadataCache.getFileCache(file);
            if (cache?.frontmatter?.sota_uid === uid) {
                return file;
            }
        }
        return null;
    };

    const dashboard = input.dashboard;
    const sortBy = dashboard.sort_by_esforco_fase || 'numFase';
    const sortOrder = dashboard.sort_order_esforco_fase || 'asc';

    if (!dashboard) { dv.paragraph("❌ ERRO: Contexto do dashboard não fornecido."); return; }
    const hubUID = dashboard.hub_uid;
    if (!hubUID) { dv.paragraph("❌ ERRO: 'hub_uid' não encontrado."); return; }
    
    const hubFile = findHubByUid_Robust(hubUID); 
    if (!hubFile) { dv.paragraph(`❌ ERRO: HUB do projeto com UID ${hubUID} não encontrado.`); return; }

    // --- FUNÇÃO DE LIMPEZA DE NOME DE TAREFA (Crucial para o match exato) ---
    const limparNomeTask = (texto) => {
        if (!texto) return "";
        return texto
            .replace(/\[🍅::\s*\d+\/\d+\]/g, '') // Remove contador
            .replace(/#[\w\/-]+/g, '')          // Remove tags hashtags
            .replace(/\s*\^[a-zA-Z0-9-]+/g, '') // Remove blockID
            .replace(/- \[.\]\s*/, '')          // Remove checkbox
            .replace(/>\s*/g, '')               // Remove markers de callout
            .replace(/\*\*/g, '')               // Remove negrito
            .trim();
    };

    // --- 1. MAPEAMENTO DO HUB (Task -> Fase) ---
    const dadosPorFase = {};
    const mapaTarefaParaFase = {}; // Chave: NomeTaskLimpo, Valor: IdFase
    
    const hubContent = await app.vault.read(hubFile);
    const linhasHub = hubContent.split('\n');
    
    let faseAtual = null;
    let numFaseCounter = 0;

    linhasHub.forEach(linha => {
        // Detecta Sessão/Fase (### Nome)
        const faseMatch = linha.trim().match(/^###\s+(?:Fase:\s*)?(.*)/i);
        
        if (faseMatch) {
            numFaseCounter++;
            const nomeFaseOriginal = faseMatch[1].trim();
            const idFase = `${String(numFaseCounter).padStart(2, '0')}_${nomeFaseOriginal}`;
            
            faseAtual = idFase;

            if (!dadosPorFase[faseAtual]) {
                dadosPorFase[faseAtual] = { 
                    faseNome: nomeFaseOriginal, 
                    numFase: numFaseCounter,
                    foco: 0, 
                    pausas: 0, 
                    sessoesFoco: 0, 
                    sessoesPausas: 0,
                    tarefasTotais: 0,
                    tarefasConcluidas: 0
                };
            }
        }

        const linhaLimpaHeaders = linha.trim().replace(/^>+\s*/, '');
        
        if (faseAtual && linhaLimpaHeaders.startsWith("- [")) {
            const nomeTaskLimpo = limparNomeTask(linhaLimpaHeaders);
            
            if (nomeTaskLimpo) {
                // Normaliza para lowercase para facilitar o match
                mapaTarefaParaFase[nomeTaskLimpo.toLowerCase()] = faseAtual;
            }

            if (dadosPorFase[faseAtual]) {
                dadosPorFase[faseAtual].tarefasTotais += 1;
                if (linhaLimpaHeaders.startsWith("- [x]")) {
                    dadosPorFase[faseAtual].tarefasConcluidas += 1;
                }
            }
        }
    });

    // --- 2. PROCESSAMENTO DOS LOGS ---
    const idProjeto = app.metadataCache.getFileCache(hubFile).frontmatter.id_projeto;
    const logBrutoPath = `99 - BACKEND/Logs_Metricas/Projetos/${idProjeto}/raw_logs.md`;
    const logFile = app.vault.getAbstractFileByPath(logBrutoPath);

    if (logFile) {
        const content = await app.vault.cachedRead(logFile);
        const logs = content.split('\n').filter(line => line.includes("(sessao_fim::"));

        logs.forEach(log => {
            // Extrai o nome da tarefa do log (tarefa_focada:: "Nome")
            const tarefaMatch = log.match(/\(tarefa_focada::\s*"(.*?)"\)/);
            if (!tarefaMatch) return;

            const nomeTaskLog = limparNomeTask(tarefaMatch[1]).toLowerCase();
            
            // Tenta encontrar a fase pelo mapa
            let idFaseAlvo = mapaTarefaParaFase[nomeTaskLog];

            // Se não achou exato, tenta parcial (caso o nome tenha mudado levemente)
            if (!idFaseAlvo) {
                const keyEncontrada = Object.keys(mapaTarefaParaFase).find(k => 
                    nomeTaskLog.includes(k) || k.includes(nomeTaskLog)
                );
                if (keyEncontrada) idFaseAlvo = mapaTarefaParaFase[keyEncontrada];
            }

            // Fallback: Se ainda não achou, tenta extrair a fase da tag antiga (legado)
            if (!idFaseAlvo) {
                const tagMatch = log.match(/#projeto\/[^\/]+\/([^\/\s]+)/);
                if (tagMatch) {
                    const possivelFase = tagMatch[1].replace(/^\d+_/, '').replace(/_/g, ' ').toLowerCase();
                    // Busca fase que contenha esse nome
                    const faseKey = Object.keys(dadosPorFase).find(k => k.toLowerCase().includes(possivelFase));
                    if (faseKey) idFaseAlvo = faseKey;
                }
            }

            if (idFaseAlvo && dadosPorFase[idFaseAlvo]) {
                const duracaoMatch = log.match(/\(duracao_total_sessao_segundos::\s*(\d+)\)/);
                const duracao = duracaoMatch ? parseInt(duracaoMatch[1]) : 0;

                if (log.includes("(sessao_fim::WORK)")) {
                    dadosPorFase[idFaseAlvo].foco += duracao;
                    dadosPorFase[idFaseAlvo].sessoesFoco += 1;
                } else if (log.includes("(sessao_fim::BREAK)")) {
                    dadosPorFase[idFaseAlvo].pausas += duracao;
                    dadosPorFase[idFaseAlvo].sessoesPausas += 1;
                }
            }
        });
    }

    if (Object.keys(dadosPorFase).length === 0) { 
        dv.paragraph("Nenhuma fase encontrada no HUB."); 
        return; 
    }

    const dadosProcessados = Object.values(dadosPorFase);
    
    dadosProcessados.sort((a, b) => {
        const valA = a[sortBy] ?? 0;
        const valB = b[sortBy] ?? 0;
        if (valA === valB) return 0;
        const comparison = valA < valB ? -1 : 1;
        return sortOrder === 'asc' ? comparison : -comparison;
    });

    const formatarSegundos = (s) => {
        if (isNaN(s) || s === 0) return "0s";
        const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), secs = Math.round(s % 60);
        return [h > 0 ? `${h}h` : '', m > 0 ? `${m}m` : '', (secs > 0 || (h === 0 && m === 0)) ? `${secs}s` : ''].filter(Boolean).join(' ');
    };

    const headers = ["Fase", "Tarefas Concluídas", "Progresso", "Tempo Foco", "Tempo Pausa", "Sessões Foco", "Sessões Pausa", "Foco/Tarefa"];
    const tabelaArray = dadosProcessados.map(p => {
        const progresso = p.tarefasTotais > 0 ? `${Math.round((p.tarefasConcluidas / p.tarefasTotais) * 100)}%` : "N/A";
        const tempoMedioPorTarefa = p.tarefasConcluidas > 0 ? formatarSegundos(p.foco / p.tarefasConcluidas) : "N/A";
        
        return [
            `${p.faseNome}`,
            `${p.tarefasConcluidas} / ${p.tarefasTotais}`,
            progresso,
            formatarSegundos(p.foco),
            formatarSegundos(p.pausas),
            p.sessoesFoco,
            p.sessoesPausas,
            tempoMedioPorTarefa
        ];
    });

    dv.table(headers, tabelaArray);
}

main();