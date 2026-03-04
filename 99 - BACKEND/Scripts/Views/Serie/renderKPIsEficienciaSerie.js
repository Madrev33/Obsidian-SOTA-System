// Componente SOTA: renderKPIsEficienciaSerie.js (v3.3 - Fix de Regex Temporada/Episódio)
// Lê diretamente do raw_logs.md para máxima robustez e dados em tempo real.

async function main() {
    const sotaLog = (msg, data) => console.log(`[SOTA_KPIsSerie] ${msg}`, data !== undefined ? data : "");
    sotaLog("Iniciando script.");

    const idMidia = dv.current().midia_selecionada_id;
    const cicloSelecionado = dv.current().ciclo_selecionado_view;

    if (!idMidia) { dv.paragraph("❌ ERRO: 'midia_selecionada_id' não encontrado."); return; }
    
    // Suporte para Serie, Podcast e Documentario (Mesma estrutura Temporada/Episodio)
    const hub = dv.pages().where(p => p.id_midia === idMidia && (p.tipo === "serie_hub" || p.tipo === "podcast_hub" || p.tipo === "documentario_serializado_hub"))[0];
    
    if (!hub) { dv.paragraph(`❌ ERRO: HUB não encontrado.`); return; }
    
    if (!cicloSelecionado) { dv.paragraph("⚠️ Selecione um ciclo."); return; }

    let tipoPasta = "Series";
    if (hub.tipo === "podcast_hub") tipoPasta = "Podcasts";
    if (hub.tipo === "documentario_serializado_hub") tipoPasta = "Documentarios";

    const nomeSanitizado = hub.id_midia;
    const logBrutoPath = `99 - BACKEND/Logs_Metricas/${tipoPasta}/${nomeSanitizado}/raw_logs.md`;
    
    const logFile = app.vault.getAbstractFileByPath(logBrutoPath);
    if (!logFile) { dv.paragraph("Nenhuma métrica encontrada (log inexistente)."); return; }

    const content = await app.vault.cachedRead(logFile);
    let todosOsLogs = content.split('\n').filter(line => line.trim() !== '' && line.includes("(sessao_fim::"));

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

        const extrairSegundos = (log) => parseInt(log.match(/\(duracao_total_sessao_segundos::\s*(\d+)\)/)?.[1] || '0');

        const focoTotalSegundos = logsFoco.reduce((sum, log) => sum + extrairSegundos(log), 0);
        const pausasTotalSegundos = logsPausa.reduce((sum, log) => sum + extrairSegundos(log), 0);
        const totalSessoesFoco = logsFoco.length;
        const totalSessoesPausa = logsPausa.length;
        
        const diasComEstudo = new Set(todosOsLogs.map(l => l.match(/\(log_date::\s*([^)]+)\)/)?.[1]).filter(Boolean)).size;
        
        // --- CORREÇÃO DE REGEX (Temporada/Episódio) ---
        const episodiosUnicos = new Set(logsFoco.map(l => {
            const tempMatch = l.match(/\(temporada::\s*(\d+)\)/);
            const epMatch = l.match(/\(episodio::\s*(\d+)\)/);
            return (tempMatch && epMatch) ? `t${tempMatch[1]}-e${epMatch[1]}` : null;
        }).filter(Boolean));
        const totalEpisodiosAssistidos = episodiosUnicos.size;

        const temporadasUnicas = new Set(logsFoco.map(l => l.match(/\(temporada::\s*(\d+)\)/)?.[1]).filter(Boolean));
        const totalTemporadasUnicasEstudadas = temporadasUnicas.size;
        // ---------------------------------------------

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

        const mediaFocoPorDia = diasComEstudo > 0 ? focoTotalSegundos / diasComEstudo : 0;
        const mediaEpisodiosPorDia = diasComEstudo > 0 ? totalEpisodiosAssistidos / diasComEstudo : 0;
        const mediaTempoPorEpisodio = totalEpisodiosAssistidos > 0 ? focoTotalSegundos / totalEpisodiosAssistidos : 0;
        const mediaFocoSegundos = totalSessoesFoco > 0 ? focoTotalSegundos / totalSessoesFoco : 0;
        const minutosRecuperacaoPorHoraFoco = focoTotalSegundos > 0 ? Math.round((pausasTotalSegundos / focoTotalSegundos) * 60) : 0;
        
        const mediaPausaPorDia = diasComEstudo > 0 ? pausasTotalSegundos / diasComEstudo : 0;
        const mediaPausaSegundos = totalSessoesPausa > 0 ? pausasTotalSegundos / totalSessoesPausa : 0;

        const kpis = [
            `**Tempo Total de Foco:** ${formatarSegundosTotal(focoTotalSegundos)}`,
            `**Tempo Total em Pausas:** ${formatarSegundosTotal(pausasTotalSegundos)}`,
            `**Média de Foco por Dia:** ${formatarSegundosTotal(Math.round(mediaFocoPorDia))}`,
            `**Média de Pausa por Dia:** ${formatarSegundosTotal(Math.round(mediaPausaPorDia))}`,
            `**Total de Episódios Assistidos:** ${totalEpisodiosAssistidos}`,
            `**Total de Temporadas Assistidas:** ${totalTemporadasUnicasEstudadas}`,
            `**Média de Episódios por Dia:** ${mediaEpisodiosPorDia.toFixed(1)}`,
            `**Média de Tempo por Episódio:** ${formatarSegundosRitmo(Math.round(mediaTempoPorEpisodio))}`,
            `**Ritmo Médio de Sessão:** Foco: **${formatarSegundosRitmo(mediaFocoSegundos)}** / Pausa: **${formatarSegundosRitmo(mediaPausaSegundos)}**`,
            `**Proporção de Recuperação:** Para cada hora de foco, você se permitiu **${minutosRecuperacaoPorHoraFoco} minutos de descanso**.`
        ];
 
        dv.list(kpis);
    } else {
        dv.paragraph("Nenhuma métrica encontrada para o período selecionado.");
    }
}
 
main();