// Componente SOTA: renderDiagnosticoLeitura.js (v2.6 - Tempo Micro / Sessão Macro)
// Tempo calculado por páginas (precisão). Sessões calculadas por logs de sessão (frequência).

async function main() {
    const idMidia = dv.current().midia_selecionada_id;
    const tipoMidia = dv.current().midia_selecionada_tipo;
    const cicloSelecionado = dv.current().ciclo_selecionado_view;
    const sortBy = dv.current().sort_by_foco_capitulo || 'numCap';
    const sortOrder = dv.current().sort_order_foco_capitulo || 'asc';

    if (!idMidia) { dv.paragraph("❌ ERRO: 'midia_selecionada_id' não encontrado."); return; }
    
    const hub = dv.pages().where(p => p.id_midia === idMidia && p.tipo === "livro_paginado_hub")[0];
    if (!hub) { dv.paragraph(`❌ ERRO: HUB não encontrado.`); return; }

    if (!cicloSelecionado) { dv.paragraph("⚠️ Selecione um ciclo."); return; }

    if (cicloSelecionado === "Visão Agregada (Todos os Ciclos)") { dv.span("**Diagnóstico Geral**"); } 
    else { dv.span(`**Diagnóstico do ${cicloSelecionado}**`); }

    const sanitizarParaTag = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[-\s]+/g, '_').replace(/[^\w_]+/g, '') : "";
    const nomeLivroSanitizado = sanitizarParaTag(hub.file.name.replace('00. HUB - ', ''));
    const logBrutoPath = `99 - BACKEND/Logs_Metricas/Livros/${nomeLivroSanitizado}/raw_logs.md`;
    
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
    
    if (todosOsLogs.length === 0) { dv.paragraph("Nenhum log encontrado."); return; }

    // --- LÓGICA DE AGREGAÇÃO HÍBRIDA ---
    const dadosCapitulos = {};

    todosOsLogs.forEach(log => {
        // Inicializa o objeto do capítulo
        const capituloMatch = log.match(/\(capitulo::\s*(\d+)\)/);
        if (!capituloMatch) return;
        
        const numCap = parseInt(capituloMatch[1]);
        if (!dadosCapitulos[numCap]) {
            dadosCapitulos[numCap] = { numCap, foco: 0, pausas: 0, sessoesFoco: new Set(), sessoesPausas: new Set() };
        }

        // 1. Tempo de Foco (MICRO - Baseado em Página)
        if (log.includes("(pagina_fim::")) {
            const duracaoMatch = log.match(/\(duracao_segundos::\s*(\d+)\)/);
            if (duracaoMatch) {
                dadosCapitulos[numCap].foco += parseInt(duracaoMatch[1]);
            }
        }
        
        // 2. Sessões de Foco (MACRO - Baseado em Sessão)
        // Conta quantas vezes você "sentou para ler" este capítulo
        if (log.includes("(sessao_inicio::WORK)")) {
            const sessaoMatch = log.match(/\(id_sessao::\s*([^)]+)\)/);
            if (sessaoMatch) {
                dadosCapitulos[numCap].sessoesFoco.add(sessaoMatch[1]);
            }
        }

        // 3. Pausas (MACRO - Baseado em Sessão)
        if (log.includes("(sessao_fim::BREAK)")) {
            const duracaoMatch = log.match(/\(duracao_total_sessao_segundos::\s*(\d+)\)/);
            const sessaoMatch = log.match(/\(id_sessao::\s*([^)]+)\)/);
            
            if (duracaoMatch) {
                dadosCapitulos[numCap].pausas += parseInt(duracaoMatch[1]);
            }
            if (sessaoMatch) {
                dadosCapitulos[numCap].sessoesPausas.add(sessaoMatch[1]);
            }
        }
    });

    if (Object.keys(dadosCapitulos).length === 0) { dv.paragraph("Nenhum dado de capítulo encontrado."); return; }

    const dadosProcessados = Object.values(dadosCapitulos);
    
    // Ordenação
    dadosProcessados.sort((a, b) => {
        let valA, valB;
        if (sortBy === 'sessoesFoco') { valA = a.sessoesFoco.size; valB = b.sessoesFoco.size; } 
        else if (sortBy === 'sessoesPausas') { valA = a.sessoesPausas.size; valB = b.sessoesPausas.size; } 
        else { valA = a[sortBy]; valB = b[sortBy]; } // Default: numCap
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

    const livroFolder = hub.file.folder.split('/').slice(0, -1).join('/');
    const pastaCiclos = `${livroFolder}/Capitulos`;
    const todosOsCapitulos = dv.pages(`"${pastaCiclos}"`).where(p => p.tipo === 'livro_capitulo');

    const tabela = dadosProcessados.map(dados => {
        const numeroCapituloFormatado = dados.numCap.toString().padStart(2, '0');
        const cicloParaBusca = cicloSelecionado === "Visão Agregada (Todos os Ciclos)" ? `Ciclo_` : `Ciclo_${String(hub.ciclo_de_consumo_atual).padStart(2, '0')}`;
        const arquivoCapitulo = todosOsCapitulos.find(c => c.file.parent && c.file.parent.name.startsWith(numeroCapituloFormatado) && c.file.path.includes(cicloParaBusca));
        const linkCapitulo = arquivoCapitulo ? dv.fileLink(arquivoCapitulo.file.path, false, `Cap. ${numeroCapituloFormatado}`) : `Cap. ${numeroCapituloFormatado}`;

        return [
            linkCapitulo,
            formatarSegundosHHMMSS(dados.foco),
            formatarSegundosHHMMSS(dados.pausas),
            dados.sessoesFoco.size,
            dados.sessoesPausas.size
        ];
    });

    dv.table(
        ["Capítulo", "Tempo Total Focado", "Tempo Total Em Pausas", "Sessões De Foco", "Sessões De Pausa"],
        tabela
    );
}

main();