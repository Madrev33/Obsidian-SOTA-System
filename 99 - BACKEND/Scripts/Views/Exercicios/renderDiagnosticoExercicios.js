// SOTA - renderDiagnosticoExercicios.js v3.0 (Deep Scan & Hierarchical Support)
// Script dv.view para criar uma tabela de diagnóstico agregado por exercício.
// Atualização: Varredura recursiva para encontrar logs em qualquer nível de pasta (Grupos ou Raiz).

async function main() {
    // 'dv' e 'input' são injetados globalmente pelo dv.view()
    if (!dv) {
        console.error("Dataview (dv) object is not available.");
        return;
    }
    if (!input || !input.dashboard) {
        dv.paragraph("❌ ERRO: O objeto 'dashboard' não foi passado corretamente para a view.");
        return;
    }

    // --- CONFIGURAÇÃO ---
    const config = {
        exercicios_root_path: "99 - BACKEND/Logs_Metricas/Exercicios",
        manual_folder: "04 - Corpo & Movimento/01 - Exercícios Físicos/01. Manual/Exercícios"
    };
    
    // --- MAPA DE METADADOS (Front-end) ---
    const mapaExercicios = dv.pages(`"${config.manual_folder}"`)
        .where(p => p.tipo === 'manual_exercicio')
        .values.reduce((map, p) => {
            map[p.exercicio_id] = {
                grupoMuscular: p.grupo_muscular_primario,
                link: p.file.link
            };
            return map;
        }, {});

    // --- AGREGAÇÃO DE DADOS (Deep Scan Back-end) ---
    const rootFolder = app.vault.getAbstractFileByPath(config.exercicios_root_path);
    if (!rootFolder) {
        dv.paragraph("ℹ️ Pasta raiz de logs não encontrada.");
        return;
    }

    const agregados = {};
    let logsProcessados = 0;

    // Função Recursiva para encontrar todos os 'raw_logs.md'
    // Isso garante suporte híbrido (arquivos soltos ou organizados por grupo)
    async function processarPasta(pasta) {
        if (!pasta.children) return;

        for (const child of pasta.children) {
            if (child.extension) {
                // É um arquivo
                if (child.name === "raw_logs.md") {
                    // O pai do raw_logs.md é SEMPRE a pasta do ID do exercício
                    const exercicioId = child.parent.name; 
                    await lerEProcessarLog(child, exercicioId);
                }
            } else {
                // É uma pasta, desce mais um nível (Recursão)
                await processarPasta(child);
            }
        }
    }

    // Processador do Arquivo de Log
    async function lerEProcessarLog(file, exercicioId) {
        const content = await app.vault.cachedRead(file);
        const lines = content.split('\n');

        lines.forEach(log => {
            if (!log.includes("(sessao_fim::WORK)")) return;

            logsProcessados++;

            if (!agregados[exercicioId]) {
                agregados[exercicioId] = {
                    volumeTotal: 0,
                    datas: new Set(),
                    totalRpe: 0,
                    countRpe: 0,
                    totalQualidade: 0,
                    countQualidade: 0
                };
            }
            
            const carga = parseFloat(log.match(/\(carga_kg::\s*([\d.]+)\)/)?.[1] || '0');
            const reps = parseInt(log.match(/\(reps_feito::\s*(\d+)\)/)?.[1] || '0');
            const rpe = parseInt(log.match(/\(esforco_rpe::\s*(\d+)\)/)?.[1]);
            const qualidade = parseInt(log.match(/\(qualidade_forma::\s*(\d+)\)/)?.[1]);
            const data = log.match(/\(log_date::\s*([^)]+)\)/)?.[1];

            agregados[exercicioId].volumeTotal += carga * reps;
            if (data) agregados[exercicioId].datas.add(data);
            if (!isNaN(rpe)) { agregados[exercicioId].totalRpe += rpe; agregados[exercicioId].countRpe++; }
            if (!isNaN(qualidade)) { agregados[exercicioId].totalQualidade += qualidade; agregados[exercicioId].countQualidade++; }
        });
    }

    // Inicia a varredura
    await processarPasta(rootFolder);
    
    if (logsProcessados === 0) {
        dv.paragraph("Nenhum exercício com dados válidos encontrado nos logs.");
        return;
    }

    // --- TRANSFORMAÇÃO E CÁLCULO FINAL ---
    let dadosTabela = Object.entries(agregados).map(([id, dados]) => {
        // Fallback se não estiver no manual: formata o ID
        const infoManual = mapaExercicios[id] || { 
            grupoMuscular: "N/A", 
            link: id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) 
        };
        const datasOrdenadas = Array.from(dados.datas).sort();
        
        return {
            exercicio: infoManual.link,
            grupoMuscular: infoManual.grupoMuscular,
            volumeTotal: dados.volumeTotal,
            frequencia: dados.datas.size,
            rpeMedio: dados.countRpe > 0 ? parseFloat((dados.totalRpe / dados.countRpe).toFixed(1)) : null,
            qualidadeMedia: dados.countQualidade > 0 ? parseFloat((dados.totalQualidade / dados.countQualidade).toFixed(1)) : null,
            ultimoTreino: datasOrdenadas.length > 0 ? datasOrdenadas[datasOrdenadas.length - 1] : null
        };
    });

    // --- ORDENAÇÃO ---
    const sortBy = input.dashboard.sort_by_diagnostico || "volumeTotal";
    const sortOrder = input.dashboard.sort_order_diagnostico || "desc";
    
    dadosTabela.sort((a, b) => {
        const valA = a[sortBy];
        const valB = b[sortBy];
        let comparison = 0;
        
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        
        if (typeof valA === 'number' && typeof valB === 'number') {
            comparison = valA - valB;
        } else {
            comparison = String(valA).localeCompare(String(valB));
        }
        return sortOrder === 'asc' ? comparison : -comparison;
    });

    // --- RENDERIZAÇÃO ---
    const headers = ["Exercício", "Grupo Muscular", "Volume Total (kg)", "Frequência (dias)", "RPE Médio", "Qualidade Média", "Último Treino"];
    const rows = dadosTabela.map(item => [
        item.exercicio,
        item.grupoMuscular,
        item.volumeTotal.toLocaleString('pt-BR'),
        item.frequencia,
        item.rpeMedio ?? "N/A",
        item.qualidadeMedia ?? "N/A",
        item.ultimoTreino ? moment(item.ultimoTreino).format("DD/MM/YYYY") : "N/A"
    ]);

    dv.table(headers, rows);
}

main();