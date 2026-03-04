// Componente SOTA: renderDiagnosticoLeituraDocumentacaoPaginado.js v1.0
// Exibe a análise de esforço por seção para Documentações Paginadas.

async function main() {
    const idMidia = dv.current().midia_selecionada_id;
    const tipoMidia = dv.current().midia_selecionada_tipo;
    const cicloSelecionado = dv.current().ciclo_selecionado_view;
    const sortBy = dv.current().sort_by_foco_secao || 'numSecao';
    const sortOrder = dv.current().sort_order_foco_secao || 'asc';

    if (!idMidia) { dv.paragraph("❌ ERRO: 'midia_selecionada_id' não encontrado no frontmatter do Dashboard."); return; }
    
    const hub = dv.pages().where(p => p.id_midia === idMidia && p.tipo === "documentacao_paginado_hub")[0];
    if (!hub) { dv.paragraph(`❌ ERRO: HUB de Documentação Paginada com ID ${idMidia} não encontrado.`); return; }

    if (!cicloSelecionado) { dv.paragraph("⚠️ Selecione um ciclo para ver o diagnóstico."); return; }

    if (cicloSelecionado === "Visão Agregada (Todos os Ciclos)") { dv.span("**Diagnóstico Geral de Todos os Ciclos**"); } 
    else { dv.span(`**Diagnóstico do ${cicloSelecionado}**`); }

    const idDocumentacao = hub.id_midia;
    const logBrutoPath = `99 - BACKEND/Logs_Metricas/Documentacoes/${idDocumentacao}/raw_logs.md`;
    
    const logFile = app.vault.getAbstractFileByPath(logBrutoPath);
    if (!logFile) { dv.paragraph("Nenhum log de leitura encontrado."); return; }

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
    
    if (todosOsLogs.length === 0) { dv.paragraph("Nenhuma sessão encontrada para o período selecionado."); return; }

    const sessoesParaSecoes = todosOsLogs.reduce((acc, log) => {
        if (log.includes("(pagina_fim::")) {
            const sessaoMatch = log.match(/\(id_sessao::\s*([^)]+)\)/);
            const secaoMatch = log.match(/\(secao::\s*(\d+)\)/);
            if (sessaoMatch && secaoMatch) {
                const idSessao = sessaoMatch[1];
                const numSecao = parseInt(secaoMatch[1]);
                if (!acc[idSessao]) acc[idSessao] = new Set();
                acc[idSessao].add(numSecao);
            }
        }
        return acc;
    }, {});

    const dadosSecoes = todosOsLogs.reduce((acc, log) => {
        const secaoMatch = log.match(/\(secao::\s*(\d+)\)/);
        if (secaoMatch) {
            const numSecao = parseInt(secaoMatch[1]);
            if (!acc[numSecao]) {
                acc[numSecao] = { numSecao, foco: 0, pausas: 0, sessoesFoco: new Set(), sessoesPausas: new Set() };
            }
        }
        
        if (log.includes("(pagina_fim::") && secaoMatch) {
            const duracaoMatch = log.match(/\(duracao_segundos::\s*(\d+)\)/);
            if (duracaoMatch) {
                acc[parseInt(secaoMatch[1])].foco += parseInt(duracaoMatch[1]);
            }
        }
        
        if (log.includes("(sessao_inicio::WORK)")) {
            const sessaoMatch = log.match(/\(id_sessao::\s*([^)]+)\)/);
            if (sessaoMatch) {
                const idSessao = sessaoMatch[1];
                const secoesDaSessao = sessoesParaSecoes[idSessao] || new Set();
                secoesDaSessao.forEach(numSecao => {
                    if (acc[numSecao]) acc[numSecao].sessoesFoco.add(idSessao);
                });
            }
        }

        if (log.includes("(sessao_fim::BREAK)") && secaoMatch) {
            const duracaoMatch = log.match(/\(duracao_total_sessao_segundos::\s*(\d+)\)/);
            const sessaoMatch = log.match(/\(id_sessao::\s*([^)]+)\)/);
            if (duracaoMatch && sessaoMatch) {
                acc[parseInt(secaoMatch[1])].pausas += parseInt(duracaoMatch[1]);
                acc[parseInt(secaoMatch[1])].sessoesPausas.add(sessaoMatch[1]);
            }
        }
        return acc;
    }, {});

    if (Object.keys(dadosSecoes).length === 0) { dv.paragraph("Nenhuma sessão com seção definida encontrada para este período."); return; }

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

    const documentacaoFolder = hub.file.folder.split('/').slice(0, -1).join('/');
    const pastaCiclos = `${documentacaoFolder}/Seções`;
    const todasAsSecoes = dv.pages(`"${pastaCiclos}"`).where(p => p.tipo === 'documentacao_paginado_secao');

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