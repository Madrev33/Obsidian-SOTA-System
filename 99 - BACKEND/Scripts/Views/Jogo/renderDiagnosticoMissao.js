// Componente SOTA: renderDiagnosticoMissao.js (v1.0)
// Exibe a análise detalhada por Missão para Jogos.

async function main() {
    const idMidia = dv.current().midia_selecionada_id;
    const cicloSelecionado = dv.current().ciclo_selecionado_view;
    const sortBy = dv.current().sort_by_foco_missao || 'missao';
    const sortOrder = dv.current().sort_order_foco_missao || 'asc';

    if (!idMidia) { dv.paragraph("❌ ERRO: 'midia_selecionada_id' não encontrado."); return; }
    
    const hub = dv.pages().where(p => p.id_midia === idMidia && p.tipo === "jogo_hub")[0];
    if (!hub) { dv.paragraph(`❌ ERRO: HUB de Jogo não encontrado.`); return; }

    if (!cicloSelecionado) { dv.paragraph("⚠️ Selecione um ciclo."); return; }

    if (cicloSelecionado === "Visão Agregada (Todos os Ciclos)") { dv.span("**Diagnóstico por Missão (Todos os Ciclos)**"); } 
    else { dv.span(`**Diagnóstico por Missão (${cicloSelecionado})**`); }

    const nomeSanitizado = hub.id_midia;
    const logBrutoPath = `99 - BACKEND/Logs_Metricas/Jogos/${nomeSanitizado}/raw_logs.md`;
    
    const logFile = app.vault.getAbstractFileByPath(logBrutoPath);
    if (!logFile) { dv.paragraph("Nenhum log encontrado."); return; }

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
    
    if (todosOsLogs.length === 0) { dv.paragraph("Nenhuma sessão encontrada."); return; }
    
    // --- AGREGAÇÃO POR MISSÃO ---
    const dadosPorMissao = todosOsLogs.reduce((acc, log) => {
        const duracaoMatch = log.match(/\(duracao_total_sessao_segundos::\s*(\d+)\)/);
        const duracao = duracaoMatch ? parseInt(duracaoMatch[1]) : 0;
        
        const dataMatch = log.match(/\(log_date::\s*(.*?)\)/);
        const data = dataMatch ? dataMatch[1] : null;

        const cicloMatch = log.match(/\(ciclo::(\d+)\)/);
        const missaoMatch = log.match(/\(missao::(\d+)\)/);

        if (!cicloMatch || !missaoMatch) return acc;

        const ciclo = parseInt(cicloMatch[1]);
        const missao = parseInt(missaoMatch[1]);
        
        // Chave única: Ciclo-Missao
        const key = `${ciclo}-${missao}`;
        if (!acc[key]) {
            acc[key] = { 
                ciclo, 
                missao, 
                tempoFocoSegundos: 0, 
                sessoesFoco: 0, 
                tempoPausasSegundos: 0, 
                sessoesPausas: 0, 
                datas: new Set() 
            };
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

    if (Object.keys(dadosPorMissao).length === 0) { dv.paragraph("Nenhum registro de missão encontrado."); return; }

    const dadosProcessados = Object.values(dadosPorMissao);
    
    // Ordenação
    dadosProcessados.sort((a, b) => {
        let valA, valB;
        if (sortBy === 'tempoFoco') { valA = a.tempoFocoSegundos; valB = b.tempoFocoSegundos; }
        else { valA = a.missao; valB = b.missao; }
        
        if (valA === valB) return 0;
        const comparison = valA < valB ? -1 : 1;
        return sortOrder === 'asc' ? comparison : -comparison;
    });

    const formatarSegundos = (s) => {
        if (isNaN(s) || s === 0) return "00h 00m 00s";
        const h = Math.floor(s / 3600).toString().padStart(2, '0');
        const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
        const secs = Math.round(s % 60).toString().padStart(2, '0');
        return `${h}h ${m}m ${secs}s`;
    };

    const headers = cicloSelecionado === "Visão Agregada (Todos os Ciclos)"
        ? ["Ciclo", "Missão", "Tempo Foco", "Tempo Pausa", "Sessões Foco", "Sessões Pausa", "Data(s)"]
        : ["Missão", "Tempo Foco", "Tempo Pausa", "Sessões Foco", "Sessões Pausa", "Data(s)"];

    const tabelaArray = dadosProcessados.map(p => {
        const datasLinks = Array.from(p.datas).sort().map(dataStr => {
            const dt = dv.date(dataStr);
            return dt ? dv.fileLink(`01 - Registros/01. Daily/${dt.toFormat("yyyy/MM")}/${dataStr}.md`, false, dataStr).toString() : dataStr;
        }).join('<br>');
        
        const row = [
            `Missão ${p.missao}`, 
            formatarSegundos(p.tempoFocoSegundos),
            formatarSegundos(p.tempoPausasSegundos),
            p.sessoesFoco,
            p.sessoesPausas,
            datasLinks
        ];
        
        if (cicloSelecionado === "Visão Agregada (Todos os Ciclos)") {
            row.unshift(`C${p.ciclo}`);
        }
        return row;
    });

    dv.table(headers, tabelaArray);
}

main();