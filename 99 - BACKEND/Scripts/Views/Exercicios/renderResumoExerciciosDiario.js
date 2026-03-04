// SOTA - renderResumoExerciciosDiario.js v6.0 (Polymorphic Aggregation)
// Cria um resumo agregado para o dia, adaptando-se para Cardio, Força e Isométrico.

async function main() {
    if (!dv) { return; }

    // --- LÓGICA DE DATA POLIMÓRFICA ---
    let dataDaNotaStr;
    const currentPage = dv.current();
    if (currentPage.tipo === 'dashboard_exercicios_diaria') {
        dataDaNotaStr = moment().format("YYYY-MM-DD");
    } else {
        dataDaNotaStr = currentPage.file.name.replace('.md', '');
    }
    if (!moment(dataDaNotaStr, "YYYY-MM-DD", true).isValid()) {
        dv.paragraph("⚠️ Contexto de data inválido.");
        return;
    }

    // --- LER LOG DIÁRIO ---
    const dailyLogPath = `99 - BACKEND/Logs_Metricas/Daily/${dataDaNotaStr}.md`;
    const logFile = app.vault.getAbstractFileByPath(dailyLogPath);

    if (!logFile) {
        dv.paragraph(`ℹ️ Nenhum log diário encontrado para a data ${dataDaNotaStr}.`);
        return;
    }

    const content = await app.vault.cachedRead(logFile);
    const logsDeEsforcoDoDia = content.split('\n').filter(line => 
        line.includes("(sessao_fim::WORK)") && line.includes("#exercicio/")
    );

    if (logsDeEsforcoDoDia.length === 0) {
        dv.paragraph(`Nenhuma série de esforço registrada em ${dataDaNotaStr}.`);
        return;
    }

    // --- AGREGAÇÃO POLIMÓRFICA DOS DADOS POR EXERCÍCIO ---
    const agregados = logsDeEsforcoDoDia.reduce((acc, log) => {
        const exercicioIdMatch = log.match(/#exercicio\/[^\/]+\/([^\/\s]+)/);
        if (!exercicioIdMatch || !exercicioIdMatch[1]) return acc;
        
        const exercicioId = exercicioIdMatch[1];

        if (!acc[exercicioId]) {
            const nomeExercicio = exercicioId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            acc[exercicioId] = {
                nome: nomeExercicio,
                series: 0,
                volumeTotal: 0,
                distanciaTotal: 0,
                tempoTotal: 0,
                isCardio: false, // Flag para diferenciar o tipo
                isIsometrico: false,
                totalRpe: 0, countRpe: 0,
                totalQualidade: 0, countQualidade: 0
            };
        }
        
        // Extrai todos os dados possíveis
        const carga = parseFloat(log.match(/\(carga_kg::\s*([\d.]+)\)/)?.[1] || '0');
        const reps = parseInt(log.match(/\(reps_feito::\s*(\d+)\)/)?.[1] || '0');
        const rpe = parseInt(log.match(/\(esforco_rpe::\s*(\d+)\)/)?.[1]);
        const qualidade = parseInt(log.match(/\(qualidade_forma::\s*(\d+)\)/)?.[1]);
        const distancia = parseFloat(log.match(/\(distancia_km::\s*([\d.]+)\)/)?.[1]);
        const duracao = parseInt(log.match(/\(duracao_segundos::\s*(\d+)\)/)?.[1] || '0');
        
        // Agregação condicional
        if (!isNaN(distancia)) { // É Cardio
            acc[exercicioId].isCardio = true;
            acc[exercicioId].distanciaTotal += distancia;
            acc[exercicioId].tempoTotal += duracao;
        } else { // É Força ou Isométrico
            if (reps === 1 && duracao > 0) acc[exercicioId].isIsometrico = true;
            acc[exercicioId].volumeTotal += carga * reps;
            acc[exercicioId].tempoTotal += duracao;
        }
        
        acc[exercicioId].series++;
        if (!isNaN(rpe)) { acc[exercicioId].totalRpe += rpe; acc[exercicioId].countRpe++; }
        if (!isNaN(qualidade)) { acc[exercicioId].totalQualidade += qualidade; acc[exercicioId].countQualidade++; }
        
        return acc;
    }, {});

    let dadosTabela = Object.values(agregados).map(dados => ({
        nome: dados.nome,
        series: dados.series,
        volume: dados.isCardio ? `${dados.distanciaTotal.toFixed(2)} km` : (dados.isIsometrico ? `${dados.tempoTotal} s` : `${Math.round(dados.volumeTotal)} kg`),
        rpeMedio: dados.countRpe > 0 ? parseFloat((dados.totalRpe / dados.countRpe).toFixed(1)) : null,
        qualidadeMedia: dados.countQualidade > 0 ? parseFloat((dados.totalQualidade / dados.countQualidade).toFixed(1)) : null
    }));

    // --- ORDENAÇÃO ---
    dadosTabela.sort((a, b) => a.nome.localeCompare(b.nome));

    // --- RENDERIZAÇÃO ---
    const headers = ["Exercício", "Nº de Séries", "Volume / Distância", "RPE Médio", "Qualidade Média"];
    const rows = dadosTabela.map(item => [
        item.nome,
        item.series,
        item.volume, // A unidade já está na string
        item.rpeMedio ?? "N/A",
        item.qualidadeMedia ?? "N/A"
    ]);

    dv.table(headers, rows);
}

main();