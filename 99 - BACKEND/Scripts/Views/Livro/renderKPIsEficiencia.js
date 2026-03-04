// Componente SOTA: renderKPIsEficiencia.js (v3.0 - Padrão de Ouro: Leitura Direta de Logs)
// Responsável por calcular e exibir os KPIs de leitura com base no ciclo selecionado, lendo diretamente do raw_logs.md.

async function main() {
    const sotaLog = (msg, data) => console.log(`[SOTA_KPIsLivro] ${msg}`, data !== undefined ? data : "");
    sotaLog("Iniciando script.");

    const idMidia = dv.current().midia_selecionada_id;
    const cicloSelecionado = dv.current().ciclo_selecionado_view;
    sotaLog("Dados do dashboard:", { idMidia, cicloSelecionado });

    if (!idMidia) { dv.paragraph("❌ ERRO: 'midia_selecionada_id' não encontrado no frontmatter do Dashboard."); return; }
    
    const hub = dv.pages().where(p => p.id_midia === idMidia && p.tipo === "livro_paginado_hub")[0];
    if (!hub) { dv.paragraph(`❌ ERRO: HUB de Livro com id_midia "${idMidia}" não encontrado.`); return; }
    
    if (!cicloSelecionado) { dv.paragraph("⚠️ Selecione um ciclo para ver os KPIs."); return; }

    const nomeLivroSanitizado = hub.id_midia;
    const logBrutoPath = `99 - BACKEND/Logs_Metricas/Livros/${nomeLivroSanitizado}/raw_logs.md`;
    
    const logFile = app.vault.getAbstractFileByPath(logBrutoPath);
    if (!logFile) { dv.paragraph("Nenhuma métrica encontrada para o período selecionado (arquivo de log não existe)."); return; }

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

    if (todosOsLogs.length > 0) {
        const logsFoco = todosOsLogs.filter(l => l.includes("(sessao_fim::WORK)"));
        const logsPausa = todosOsLogs.filter(l => l.includes("(sessao_fim::BREAK)"));
        const logsPaginaFim = todosOsLogs.filter(l => l.includes("(pagina_fim::"));

        const extrairSegundos = (log) => parseInt(log.match(/\(duracao_total_sessao_segundos::\s*(\d+)\)/)?.[1] || '0');

        const focoTotalSegundos = logsFoco.reduce((sum, log) => sum + extrairSegundos(log), 0);
        const pausasTotalSegundos = logsPausa.reduce((sum, log) => sum + extrairSegundos(log), 0);
        const totalSessoesFoco = logsFoco.length;
        const totalSessoesPausa = logsPausa.length;
        const paginasUnicas = new Set(
            logsPaginaFim
                .map(l => l.match(/\(pagina_fim::\s*(\d+)\)/))
                .filter(match => match !== null)
                .map(match => parseInt(match[1]))
        );
        const totalPaginasLidas = paginasUnicas.size;
        
        const diasComLeitura = new Set(todosOsLogs.map(l => l.match(/\(log_date::\s*([^)]+)\)/)?.[1]).filter(Boolean)).size;
        
        const capitulosUnicos = new Set(logsFoco.map(l => l.match(/\(capitulo::\s*(\d+)\)/)?.[1]).filter(Boolean));
        const totalCapitulosUnicosLidos = capitulosUnicos.size;

        const formatarSegundosTotal = (s) => {
            if (isNaN(s) || s === 0) return "0s";
            const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), secs = Math.round(s % 60);
            return [h > 0 ? `${h}h` : '', m > 0 ? `${m}m` : '', (secs > 0 || (h === 0 && m === 0)) ? `${secs}s` : ''].filter(Boolean).join(' ');
        };
        
        const formatarSegundosRitmo = (s) => {
            if (isNaN(s) || s === 0) return "0s";
            const m = Math.floor(s / 60), secs = Math.round(s % 60);
            return [m > 0 ? `${m}m` : '', (secs > 0 || m === 0) ? `${secs}s` : ''].filter(Boolean).join(' ');
        };

        const mediaFocoPorDia = diasComLeitura > 0 ? focoTotalSegundos / diasComLeitura : 0;
        const mediaPausaPorDia = diasComLeitura > 0 ? pausasTotalSegundos / diasComLeitura : 0;
        const mediaCapitulosPorDia = diasComLeitura > 0 ? totalCapitulosUnicosLidos / diasComLeitura : 0;
        const mediaPaginasPorDia = diasComLeitura > 0 ? totalPaginasLidas / diasComLeitura : 0;
        const mediaTempoPorPagina = totalPaginasLidas > 0 ? focoTotalSegundos / totalPaginasLidas : 0;
        const mediaFocoSegundos = totalSessoesFoco > 0 ? focoTotalSegundos / totalSessoesFoco : 0;
        const mediaPausaSegundos = totalSessoesPausa > 0 ? pausasTotalSegundos / totalSessoesPausa : 0;
        const minutosRecuperacaoPorHoraFoco = focoTotalSegundos > 0 ? Math.round((pausasTotalSegundos / focoTotalSegundos) * 60) : 0;
        
        const kpis = [
            `**Tempo Total de Foco:** ${formatarSegundosTotal(focoTotalSegundos)}`,
            `**Tempo Total em Pausas:** ${formatarSegundosTotal(pausasTotalSegundos)}`,
            `**Média de Foco por Dia:** ${formatarSegundosTotal(Math.round(mediaFocoPorDia))}`,
            `**Média de Pausa por Dia:** ${formatarSegundosTotal(Math.round(mediaPausaPorDia))}`,
            `**Total de Páginas Lidas:** ${totalPaginasLidas}`,
            `**Total de Capítulos Lidos:** ${totalCapitulosUnicosLidos}`,
            `**Média de Capítulos por Dia:** ${mediaCapitulosPorDia.toFixed(1)}`,
            `**Média de Páginas por Dia:** ${mediaPaginasPorDia.toFixed(1)}`,
            `**Média de Tempo por Página:** ${formatarSegundosRitmo(Math.round(mediaTempoPorPagina))}`,
            `**Ritmo Médio de Sessão:** Foco: **${formatarSegundosRitmo(mediaFocoSegundos)}** / Pausa: **${formatarSegundosRitmo(mediaPausaSegundos)}**`,
            `**Proporção de Recuperação:** Para cada hora de foco, você se permitiu **${minutosRecuperacaoPorHoraFoco} minutos de descanso**.`
        ].filter(item => item !== "---");
 
        dv.list(kpis);
    } else {
        dv.paragraph("Nenhuma métrica encontrada para o período selecionado.");
    }
}
 
main();