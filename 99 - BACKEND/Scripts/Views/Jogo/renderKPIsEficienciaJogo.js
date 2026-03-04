// Componente SOTA: renderKPIsEficienciaJogo.js (v1.0 - Padrão de Ouro)
// Calcula e exibe os KPIs de Jogo (Missões, Tempo, Foco).

async function main() {
    const sotaLog = (msg, data) => console.log(`[SOTA_KPIsJogo] ${msg}`, data !== undefined ? data : "");
    const idMidia = dv.current().midia_selecionada_id;
    const cicloSelecionado = dv.current().ciclo_selecionado_view;

    if (!idMidia) { dv.paragraph("❌ ERRO: 'midia_selecionada_id' não encontrado."); return; }
    
    const hub = dv.pages().where(p => p.id_midia === idMidia && p.tipo === "jogo_hub")[0];
    if (!hub) { dv.paragraph(`❌ ERRO: HUB de Jogo não encontrado.`); return; }
    
    if (!cicloSelecionado) { dv.paragraph("⚠️ Selecione um ciclo."); return; }

    const nomeSanitizado = hub.id_midia;
    const logBrutoPath = `99 - BACKEND/Logs_Metricas/Jogos/${nomeSanitizado}/raw_logs.md`;
    
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
        
        const diasComJogo = new Set(todosOsLogs.map(l => l.match(/\(log_date::\s*([^)]+)\)/)?.[1]).filter(Boolean)).size;
        
        // Contagem de Missões Únicas (Chave: Ciclo-Missao)
        const missoesUnicas = new Set(logsFoco.map(l => {
            const cicloMatch = l.match(/\(ciclo::\s*(\d+)\)/);
            const missaoMatch = l.match(/\(missao::\s*(\d+)\)/);
            const ciclo = cicloMatch ? cicloMatch[1] : '1';
            return missaoMatch ? `c${ciclo}-m${missaoMatch[1]}` : null;
        }).filter(Boolean));
        const totalMissoesJogadas = missoesUnicas.size;

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

        const mediaFocoPorDia = diasComJogo > 0 ? focoTotalSegundos / diasComJogo : 0;
        const mediaPausaPorDia = diasComJogo > 0 ? pausasTotalSegundos / diasComJogo : 0;
        const mediaMissoesPorDia = diasComJogo > 0 ? totalMissoesJogadas / diasComJogo : 0;
        // Tempo por missão
        const mediaTempoPorMissao = totalMissoesJogadas > 0 ? focoTotalSegundos / totalMissoesJogadas : 0;
        
        const mediaFocoSegundos = totalSessoesFoco > 0 ? focoTotalSegundos / totalSessoesFoco : 0;
        const mediaPausaSegundos = totalSessoesPausa > 0 ? pausasTotalSegundos / totalSessoesPausa : 0;
        const minutosRecuperacaoPorHoraFoco = focoTotalSegundos > 0 ? Math.round((pausasTotalSegundos / focoTotalSegundos) * 60) : 0;
        
        const kpis = [
            `**Tempo Total de Jogo:** ${formatarSegundosTotal(focoTotalSegundos)}`,
            `**Tempo Total em Pausas:** ${formatarSegundosTotal(pausasTotalSegundos)}`,
            `**Média de Jogo por Dia:** ${formatarSegundosTotal(Math.round(mediaFocoPorDia))}`,
            `**Média de Pausa por Dia:** ${formatarSegundosTotal(Math.round(mediaPausaPorDia))}`,
            `**Total de Missões Jogadas:** ${totalMissoesJogadas}`,
            `**Média de Missões por Dia:** ${mediaMissoesPorDia.toFixed(1)}`,
            `**Média de Tempo por Missão:** ${formatarSegundosRitmo(Math.round(mediaTempoPorMissao))}`,
            `**Ritmo Médio de Sessão:** Foco: **${formatarSegundosRitmo(mediaFocoSegundos)}** / Pausa: **${formatarSegundosRitmo(mediaPausaSegundos)}**`,
            `**Proporção de Recuperação:** Para cada hora de jogo, você se permitiu **${minutosRecuperacaoPorHoraFoco} minutos de descanso**.`
        ];
 
        dv.list(kpis);
    } else {
        dv.paragraph("Nenhuma métrica encontrada para o período selecionado.");
    }
}
 
main();