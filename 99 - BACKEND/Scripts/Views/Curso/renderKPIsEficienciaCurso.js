// Componente SOTA: renderKPIsEficienciaCurso.js (v3.0 - Padrão de Ouro: Leitura Direta de Logs)
// Adaptado para Cursos (Módulos/Aulas)

async function main() {
    const sotaLog = (msg, data) => console.log(`[SOTA_KPIsCurso] ${msg}`, data !== undefined ? data : "");
    const idMidia = dv.current().midia_selecionada_id;
    const cicloSelecionado = dv.current().ciclo_selecionado_view;

    if (!idMidia) { dv.paragraph("❌ ERRO: 'midia_selecionada_id' não encontrado."); return; }
    
    const hub = dv.pages().where(p => p.id_midia === idMidia && p.tipo === "curso_hub")[0];
    if (!hub) { dv.paragraph(`❌ ERRO: HUB de Curso não encontrado.`); return; }
    
    if (!cicloSelecionado) { dv.paragraph("⚠️ Selecione um ciclo."); return; }

    if (cicloSelecionado === "Visão Agregada (Todos os Ciclos)") { dv.span("**KPIs de Todos os Ciclos**"); } 
    else { dv.span(`**KPIs do ${cicloSelecionado}**`); }

    const nomeSanitizado = hub.id_midia;
    const logBrutoPath = `99 - BACKEND/Logs_Metricas/Cursos/${nomeSanitizado}/raw_logs.md`;
    
    const logFile = app.vault.getAbstractFileByPath(logBrutoPath);
    if (!logFile) { dv.paragraph("Nenhuma métrica encontrada (arquivo de log inexistente)."); return; }

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
        // Para cursos, usamos aula_fim ou aula_inicio para contar unidades
        const logsAulaFim = todosOsLogs.filter(l => l.includes("(aula_fim::") || l.includes("(aula_inicio::"));

        const extrairSegundos = (log) => parseInt(log.match(/\(duracao_total_sessao_segundos::\s*(\d+)\)/)?.[1] || '0');

        const focoTotalSegundos = logsFoco.reduce((sum, log) => sum + extrairSegundos(log), 0);
        const pausasTotalSegundos = logsPausa.reduce((sum, log) => sum + extrairSegundos(log), 0);
        const totalSessoesFoco = logsFoco.length;
        const totalSessoesPausa = logsPausa.length;
        
        // Contagem de Aulas Únicas (Set para evitar duplicatas de logs)
        const aulasUnicas = new Set(
            logsAulaFim.map(l => {
                const mod = l.match(/\(modulo::\s*(\d+)\)/)?.[1] || '0';
                const aul = l.match(/\(aula(?:_fim|_inicio)?::\s*(\d+)\)/)?.[1];
                return aul ? `${mod}-${aul}` : null;
            }).filter(Boolean)
        );
        const totalAulasAssistidas = aulasUnicas.size;
        
        const diasComEstudo = new Set(todosOsLogs.map(l => l.match(/\(log_date::\s*([^)]+)\)/)?.[1]).filter(Boolean)).size;
        
        const modulosUnicos = new Set(logsFoco.map(l => l.match(/\(modulo::\s*(\d+)\)/)?.[1]).filter(Boolean));
        const totalModulosUnicosEstudados = modulosUnicos.size;

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
        const mediaPausaPorDia = diasComEstudo > 0 ? pausasTotalSegundos / diasComEstudo : 0;
        const mediaAulasPorDia = diasComEstudo > 0 ? totalAulasAssistidas / diasComEstudo : 0;
        // Tempo por aula: Tempo total / Aulas únicas
        const mediaTempoPorAula = totalAulasAssistidas > 0 ? focoTotalSegundos / totalAulasAssistidas : 0;
        
        const mediaFocoSegundos = totalSessoesFoco > 0 ? focoTotalSegundos / totalSessoesFoco : 0;
        const mediaPausaSegundos = totalSessoesPausa > 0 ? pausasTotalSegundos / totalSessoesPausa : 0;
        const minutosRecuperacaoPorHoraFoco = focoTotalSegundos > 0 ? Math.round((pausasTotalSegundos / focoTotalSegundos) * 60) : 0;
        
        const kpis = [
            `**Tempo Total de Foco:** ${formatarSegundosTotal(focoTotalSegundos)}`,
            `**Tempo Total em Pausas:** ${formatarSegundosTotal(pausasTotalSegundos)}`,
            `**Média de Foco por Dia:** ${formatarSegundosTotal(Math.round(mediaFocoPorDia))}`,
            `**Média de Pausa por Dia:** ${formatarSegundosTotal(Math.round(mediaPausaPorDia))}`,
            `**Total de Aulas Assistidas:** ${totalAulasAssistidas}`,
            `**Total de Módulos Estudados:** ${totalModulosUnicosEstudados}`,
            `**Média de Aulas por Dia:** ${mediaAulasPorDia.toFixed(1)}`,
            `**Média de Tempo por Aula:** ${formatarSegundosRitmo(Math.round(mediaTempoPorAula))}`,
            `**Ritmo Médio de Sessão:** Foco: **${formatarSegundosRitmo(mediaFocoSegundos)}** / Pausa: **${formatarSegundosRitmo(mediaPausaSegundos)}**`,
            `**Proporção de Recuperação:** Para cada hora de foco, você se permitiu **${minutosRecuperacaoPorHoraFoco} minutos de descanso**.`
        ].filter(item => item !== "---");
 
        dv.list(kpis);
    } else {
        dv.paragraph("Nenhuma métrica encontrada para o período selecionado.");
    }
}
 
main();