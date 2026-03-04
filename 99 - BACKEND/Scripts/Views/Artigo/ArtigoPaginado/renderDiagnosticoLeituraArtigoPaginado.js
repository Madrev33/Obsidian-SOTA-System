// Componente SOTA: renderDiagnosticoLeituraArtigoPaginado.js (v2.1 - Tempo Baseado em Página)
// Retorna à lógica de precisão micro (soma de páginas lidas).

async function main() {
    const idMidia = dv.current().midia_selecionada_id;
    const tipoMidia = dv.current().midia_selecionada_tipo;
    const cicloSelecionado = dv.current().ciclo_selecionado_view;
    const sortBy = dv.current().sort_by_foco_secao || 'numSecao';
    const sortOrder = dv.current().sort_order_foco_secao || 'asc';

    if (!idMidia) { dv.paragraph("❌ ERRO: 'midia_selecionada_id' não encontrado."); return; }
    
    const hub = dv.pages().where(p => p.id_midia === idMidia && p.tipo === "artigo_paginado_hub")[0];
    if (!hub) { dv.paragraph(`❌ ERRO: HUB não encontrado.`); return; }

    if (!cicloSelecionado) { dv.paragraph("⚠️ Selecione um ciclo."); return; }

    if (cicloSelecionado === "Visão Agregada (Todos os Ciclos)") { dv.span("**Diagnóstico Geral**"); } 
    else { dv.span(`**Diagnóstico do ${cicloSelecionado}**`); }

    const idArtigo = hub.id_midia;
    const logBrutoPath = `99 - BACKEND/Logs_Metricas/Artigos/${idArtigo}/raw_logs.md`;
    
    const logFile = app.vault.getAbstractFileByPath(logBrutoPath);
    if (!logFile) { dv.paragraph("Nenhum log encontrado."); return; }

    const content = await app.vault.cachedRead(logFile);
    let todosOsLogs = content.split('\n').filter(line => line.trim() !== '');

    if (cicloSelecionado !== "Visão Agregada (Todos os Ciclos)") {
        const numeroCiclo = parseInt(cicloSelecionado.replace('Ciclo ', ''));
        if (!isNaN(numeroCiclo)) {
            todosOsLogs = todosOsLogs.filter(log => {
                const cicloMatch = log.match(/\(ciclo::\s*(\d+)\)/);
                return cicloMatch && parseInt(cicloMatch[1]) === numeroCiclo;
            });
        }
    }
    
    if (todosOsLogs.length === 0) { dv.paragraph("Nenhuma sessão encontrada."); return; }

    // --- LÓGICA DE AGREGAÇÃO MICRO (Baseada em Página) ---
    const dadosSecoes = {};

    todosOsLogs.forEach(log => {
        // Inicializa se encontrar menção à seção
        const secaoMatch = log.match(/\(secao::\s*(\d+)\)/);
        if (!secaoMatch) return;
        
        const numSecao = parseInt(secaoMatch[1]);
        if (!dadosSecoes[numSecao]) {
            dadosSecoes[numSecao] = { numSecao, foco: 0, pausas: 0, sessoesFoco: new Set(), sessoesPausas: new Set() };
        }

        // Foco (Baseado em PÁGINA)
        if (log.includes("(pagina_fim::")) {
            const duracaoMatch = log.match(/\(duracao_segundos::\s*(\d+)\)/);
            
            if (duracaoMatch) {
                dadosSecoes[numSecao].foco += parseInt(duracaoMatch[1]);
            }
        }
        
        // Contagem de Sessões de Foco (Apenas conta, não soma tempo aqui)
        if (log.includes("(sessao_inicio::WORK)")) {
            const sessaoMatch = log.match(/\(id_sessao::\s*([^)]+)\)/);
            if (sessaoMatch) {
                dadosSecoes[numSecao].sessoesFoco.add(sessaoMatch[1]);
            }
        }

        // Pausa (Sessão BREAK - Mantém lógica de sessão)
        if (log.includes("(sessao_fim::BREAK)")) {
            const duracaoMatch = log.match(/\(duracao_total_sessao_segundos::\s*(\d+)\)/);
            const sessaoMatch = log.match(/\(id_sessao::\s*([^)]+)\)/);
            
            if (duracaoMatch) {
                dadosSecoes[numSecao].pausas += parseInt(duracaoMatch[1]);
            }
            if (sessaoMatch) {
                dadosSecoes[numSecao].sessoesPausas.add(sessaoMatch[1]);
            }
        }
    });

    if (Object.keys(dadosSecoes).length === 0) { dv.paragraph("Nenhum dado de seção encontrado."); return; }

    const dadosProcessados = Object.values(dadosSecoes);
    
    dadosProcessados.sort((a, b) => {
        let valA, valB;
        if (sortBy === 'sessoesFoco') { valA = a.sessoesFoco.size; valB = b.sessoesFoco.size; } 
        else if (sortBy === 'sessoesPausas') { valA = a.sessoesPausas.size; valB = b.sessoesPausas.size; } 
        else { valA = a[sortBy]; valB = b[sortBy]; }
        if (valA === valB) return 0;
        const comparison = valA < valB ? -1 : 1;
        return sortOrder === 'asc' ? comparison : -comparison;
    });

    const formatarSegundosHHMMSS = (s) => {
        if (isNaN(s) || s === 0) return "00h 00m 00s";
        const h = Math.floor(s / 3600).toString().padStart(2, '0');
        const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
        const secs = Math.round(s % 60).toString().padStart(2, '0');
        return `${h}h ${m}m ${secs}s`;
    };

    const artigoFolder = hub.file.folder.split('/').slice(0, -1).join('/');
    const pastaCiclos = `${artigoFolder}/Seções`;
    const todasAsSecoes = dv.pages(`"${pastaCiclos}"`).where(p => p.tipo === 'artigo_paginado_secao');

    const tabela = dadosProcessados.map(dados => {
        const numeroSecaoFormatado = dados.numSecao.toString().padStart(2, '0');
        const cicloParaBusca = cicloSelecionado === "Visão Agregada (Todos os Ciclos)" ? `Ciclo_` : `Ciclo_${String(hub.ciclo_de_consumo_atual).padStart(2, '0')}`;
        const arquivoSecao = todasAsSecoes.find(s => s.file.parent && s.file.parent.name.startsWith(numeroSecaoFormatado) && s.file.path.includes(cicloParaBusca));
        const linkSecao = arquivoSecao ? dv.fileLink(arquivoSecao.file.path, false, `Seção ${numeroSecaoFormatado}`) : `Seção ${numeroSecaoFormatado}`;

        return [
            linkSecao,
            formatarSegundosHHMMSS(dados.foco),
            formatarSegundosHHMMSS(dados.pausas),
            dados.sessoesFoco.size,
            dados.sessoesPausas.size
        ];
    });

    dv.table(
        ["Seção", "Tempo Total Focado", "Tempo Total Em Pausas", "Sessões De Foco", "Sessões De Pausa"],
        tabela
    );
}

main();