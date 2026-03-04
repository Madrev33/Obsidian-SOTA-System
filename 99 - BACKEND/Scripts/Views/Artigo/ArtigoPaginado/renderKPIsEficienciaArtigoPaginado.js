// Componente SOTA: renderKPIsEficienciaArtigoPaginado.js v2.0
// Lê diretamente do raw_logs.md para máxima robustez e dados em tempo real.

async function main() {
    const idMidia = dv.current().midia_selecionada_id;
    const tipoMidia = dv.current().midia_selecionada_tipo;
    const cicloSelecionado = dv.current().ciclo_selecionado_view;

    if (!idMidia) { dv.paragraph("❌ ERRO: 'midia_selecionada_id' não encontrado no frontmatter do Dashboard."); return; }
    
    const hub = dv.pages().where(p => p.id_midia === idMidia && p.tipo === "artigo_paginado_hub")[0];
    if (!hub) { dv.paragraph(`❌ ERRO: HUB de Artigo Paginado com ID ${idMidia} não encontrado.`); return; }
    
    if (!cicloSelecionado) { dv.paragraph("⚠️ Selecione um ciclo para ver os KPIs."); return; }

    const idArtigo = hub.id_midia;
    const logBrutoPath = `99 - BACKEND/Logs_Metricas/Artigos/${idArtigo}/raw_logs.md`;
    const logFile = app.vault.getAbstractFileByPath(logBrutoPath);
    if (!logFile) { dv.paragraph("Nenhuma métrica encontrada para o período selecionado."); return; }

    const content = await app.vault.cachedRead(logFile);
    let todosOsLogs = content.split('\n').filter(line => line.trim() !== '');

    if (cicloSelecionado === "Visão Agregada (Todos os Ciclos)") {
        dv.span("**KPIs de Todos os Ciclos**");
    } else {
        const numeroCiclo = parseInt(cicloSelecionado.replace('Ciclo ', ''));
        dv.span(`**KPIs do ${cicloSelecionado}**`);
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
        
        const paginasUnicas = new Set(logsPaginaFim.map(l => l.match(/\(pagina_fim::\s*(\d+)\)/)?.[1]).filter(Boolean));
        const totalPaginasLidas = paginasUnicas.size;
        
        const secoesUnicas = new Set(todosOsLogs.map(l => l.match(/\(secao::\s*(\d+)\)/)?.[1]).filter(Boolean));
        const totalSecoesUnicasLidas = secoesUnicas.size;
        
        const diasComLeitura = new Set(todosOsLogs.map(l => l.match(/\(log_date::\s*([^)]+)\)/)?.[1]).filter(Boolean)).size;

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
        const mediaSecoesPorDia = diasComLeitura > 0 ? totalSecoesUnicasLidas / diasComLeitura : 0;
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
            `**Total de Seções Lidas:** ${totalSecoesUnicasLidas}`,
            `**Média de Seções por Dia:** ${mediaSecoesPorDia.toFixed(1)}`,
            `**Média de Páginas por Dia:** ${mediaPaginasPorDia.toFixed(1)}`,
            `**Média de Tempo por Página:** ${formatarSegundosRitmo(Math.round(mediaTempoPorPagina))}`,
            `**Ritmo Médio de Sessão:** Foco: **${formatarSegundosRitmo(mediaFocoSegundos)}** / Pausa: **${formatarSegundosRitmo(mediaPausaSegundos)}**`,
            `**Proporção de Recuperação:** Para cada hora de foco, você se permitiu **${minutosRecuperacaoPorHoraFoco} minutos de descanso**.`
        ];
 
        dv.list(kpis);
    } else {
        dv.paragraph("Nenhuma métrica encontrada para o período selecionado.");
    }
}
main();