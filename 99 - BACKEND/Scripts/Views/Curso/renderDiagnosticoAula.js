// Componente SOTA: renderDiagnosticoAula.js (v2.0 - Adicionada Análise de Pausas)
async function main() {
    const idMidia = dv.current().midia_selecionada_id;
    const tipoMidia = dv.current().midia_selecionada_tipo;
    const cicloSelecionado = dv.current().ciclo_selecionado_view;
    // Lendo as variáveis de ordenação do frontmatter do dashboard
    const sortBy = dv.current().sort_by_foco_aula || 'aula';
    const sortOrder = dv.current().sort_order_foco_aula || 'asc';

    if (!idMidia) { dv.paragraph("❌ ERRO: 'midia_selecionada_id' não encontrado no frontmatter do Dashboard."); return; }
    
    const hub = dv.pages().where(p => p.id_midia === idMidia && p.tipo === "curso_hub")[0];
    if (!hub) { dv.paragraph(`❌ ERRO: HUB de Curso com ID ${idMidia} não encontrado.`); return; }

    if (!cicloSelecionado) { dv.paragraph("⚠️ Selecione um ciclo para ver o diagnóstico."); return; }

    if (cicloSelecionado === "Visão Agregada (Todos os Ciclos)") { dv.span("**Diagnóstico por Aula (Todos os Ciclos)**"); } 
    else { dv.span(`**Diagnóstico por Aula (${cicloSelecionado})**`); }

    const sanitizar = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[-\s]+/g, '_').replace(/[^\w_]+/g, '') : "";
    const nomeCursoSanitizado = hub.id_midia || sanitizar(hub.file.name.replace('00. HUB - ', ''));
    const logBrutoPath = `99 - BACKEND/Logs_Metricas/Cursos/${nomeCursoSanitizado}/raw_logs.md`;
    
    const logFile = app.vault.getAbstractFileByPath(logBrutoPath);
    if (!logFile) { dv.paragraph("Nenhum log de estudo encontrado."); return; }

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
    
    if (todosOsLogs.length === 0) { dv.paragraph("Nenhuma sessão de foco encontrada para o período selecionado."); return; }
    
    const dadosPorAula = todosOsLogs.reduce((acc, log) => {
        const duracaoMatch = log.match(/\(duracao_total_sessao_segundos::\s*(\d+)\)/);
        const duracao = duracaoMatch ? parseInt(duracaoMatch[1]) : 0;
        
        const dataMatch = log.match(/\(log_date::\s*(.*?)\)/);
        const data = dataMatch ? dataMatch[1] : null;

        const cicloMatch = log.match(/\(ciclo::(\d+)\)/);
        const moduloMatch = log.match(/\(modulo::(\d+)\)/);
        const aulaMatch = log.match(/\(aula::(\d+)\)/);

        if (!cicloMatch || !moduloMatch || !aulaMatch) return acc;

        const [_, ciclo, modulo, aula] = [null, ...[cicloMatch, moduloMatch, aulaMatch].map(m => parseInt(m[1]))];
        
        const key = `${ciclo}-${modulo}-${aula}`;
        if (!acc[key]) {
            acc[key] = { ciclo, modulo, aula, tempoFocoSegundos: 0, sessoesFoco: 0, tempoPausasSegundos: 0, sessoesPausas: 0, datas: new Set(), ultimaData: null };
        }

        if (log.includes("(sessao_fim::WORK)")) {
            acc[key].tempoFocoSegundos += duracao;
            acc[key].sessoesFoco += 1;
        } else if (log.includes("(sessao_fim::BREAK)")) {
            acc[key].tempoPausasSegundos += duracao;
            acc[key].sessoesPausas += 1;
        }
        
        if (data) acc[key].datas.add(data);

        return acc;
    }, {});

    for (const key in dadosPorAula) {
        const datasArray = Array.from(dadosPorAula[key].datas).sort();
        dadosPorAula[key].ultimaData = datasArray.length > 0 ? datasArray[datasArray.length - 1] : null;
    }

    if (Object.keys(dadosPorAula).length === 0) { dv.paragraph("Nenhum registro de aula com foco encontrado. Continue estudando!"); return; }

    const dadosProcessados = Object.values(dadosPorAula);
    dadosProcessados.sort((a, b) => {
        const valA = a[sortBy] === null || a[sortBy] === undefined ? 0 : a[sortBy];
        const valB = b[sortBy] === null || b[sortBy] === undefined ? 0 : b[sortBy];
        if (valA === valB) return 0;
        const comparison = valA < valB ? -1 : 1;
        return sortOrder === 'asc' ? comparison : -comparison;
    });

    const formatarSegundos = (s) => {
        if (isNaN(s) || s === 0) return "0s";
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const secs = Math.round(s % 60);
        let parts = [];
        if (h > 0) parts.push(`${h}h`);
        if (m > 0) parts.push(`${m}m`);
        if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
        return parts.join(' ');
    };

    const headers = cicloSelecionado === "Visão Agregada (Todos os Ciclos)"
        ? ["Ciclo", "Módulo", "Aula", "Tempo Total de Foco", "Tempo Total de Pausas", "Nº de Sessões Foco", "Nº de Sessões Pausa", "Data(s) de Estudo"]
        : ["Módulo", "Aula", "Tempo Total de Foco", "Tempo Total de Pausas", "Nº de Sessões Foco", "Nº de Sessões Pausa", "Data(s) de Estudo"];

    const tabelaArray = dadosProcessados.map(p => {
        const datasLinks = Array.from(p.datas).sort().map(dataStr => dv.fileLink(`01 - Registros/01. Daily/${dv.date(dataStr).toFormat("yyyy/MM")}/${dataStr}.md`, false, dataStr).toString()).join('<br>');
        
        const row = [
            `Módulo ${p.modulo}`, 
            `Aula ${p.aula}`, 
            formatarSegundos(p.tempoFocoSegundos),
            formatarSegundos(p.tempoPausasSegundos),
            p.sessoesFoco,
            p.sessoesPausas,
            datasLinks
        ];
        
        if (cicloSelecionado === "Visão Agregada (Todos os Ciclos)") {
            row.unshift(`**Ciclo ${p.ciclo}**`);
        }
        return row;
    });

    dv.table(headers, tabelaArray);
}
main();