// 99 - BACKEND/Scripts/Views/DashboardRevisao/renderResumoQualitativo.js
// SOTA v3.0 - Resumo Qualitativo Otimizado (Leitura Contextual)

async function main() {
    const dashboard = dv.current();
    let startDate = dashboard.start_date;
    let endDate = dashboard.end_date;

    if (!startDate || !endDate) {
        dv.paragraph("⚠️ Selecione um período.");
        return;
    }

    if (typeof startDate === 'string') startDate = startDate.substring(0, 10);
    if (typeof endDate === 'string') endDate = endDate.substring(0, 10);
    if (startDate.toFormat) startDate = startDate.toFormat('yyyy-MM-dd');
    if (endDate.toFormat) endDate = endDate.toFormat('yyyy-MM-dd');

    const wins = [];
    const aprendizados = [];

    // --- 1. LER WINS (DO LOG CONTEXTUAL) ---
    const winsLogPath = "99 - BACKEND/Logs_Metricas/Reflexao/Wins/raw_logs.md";
    const winsFile = app.vault.getAbstractFileByPath(winsLogPath);

    if (winsFile) {
        const content = await app.vault.cachedRead(winsFile);
        const lines = content.split('\n');

        lines.forEach(line => {
            const dateMatch = line.match(/\(log_date::\s*(\d{4}-\d{2}-\d{2})\)/);
            if (!dateMatch) return;
            const dataStr = dateMatch[1];
            
            if (dataStr >= startDate && dataStr <= endDate) {
                // Link para o Diário
                const ano = dataStr.substring(0, 4);
                const mes = dataStr.substring(5, 7);
                const caminhoNotaDiaria = `01 - Registros/01. Daily/${ano}/${mes}/${dataStr}.md`;
                const linkDiario = dv.fileLink(caminhoNotaDiaria, false, dataStr);

                // Extração de Conteúdo
                let conteudo = line.match(/\(Motivo::\s*(.*?)\)/)?.[1];
                if (!conteudo) {
                    // Fallback para logs antigos
                    let temp = line.replace(/^\s*-\s*\[.\]\s*/, '').replace(/^\s*-\s*/, '');
                    // Remove metadados
                    temp = temp.replace(/\(log_.*?\)/g, '').replace(/#\S+/g, '').trim();
                    conteudo = temp.split('(')[0].trim().replace(/^✨ Conquista \(Win\):/, '').trim();
                }

                if (conteudo) {
                    wins.push({ data: linkDiario, conteudo: conteudo });
                }
            }
        });
    }

    // --- 2. LER APRENDIZADOS (DO LOG CONTEXTUAL) ---
    const errosLogPath = "99 - BACKEND/Logs_Metricas/Reflexao/Erros/raw_logs.md";
    const errosFile = app.vault.getAbstractFileByPath(errosLogPath);

    if (errosFile) {
        const content = await app.vault.cachedRead(errosFile);
        const lines = content.split('\n');

        lines.forEach(line => {
            const dateMatch = line.match(/\(log_date::\s*(\d{4}-\d{2}-\d{2})\)/);
            if (!dateMatch) return;
            const dataStr = dateMatch[1];
            
            if (dataStr >= startDate && dataStr <= endDate) {
                const ano = dataStr.substring(0, 4);
                const mes = dataStr.substring(5, 7);
                const caminhoNotaDiaria = `01 - Registros/01. Daily/${ano}/${mes}/${dataStr}.md`;
                const linkDiario = dv.fileLink(caminhoNotaDiaria, false, dataStr);

                // Extração
                const situacao = line.match(/\(Situação::\s*(.*?)\)/)?.[1] || "";
                const erro = line.match(/\(Erro::\s*(.*?)\)/)?.[1] || "";
                const aprendizado = line.match(/\(Aprendizado::\s*(.*?)\)/)?.[1] || "";
                
                let resumo = "";
                if (erro && aprendizado) {
                    resumo = `**Erro:** ${erro}<br>**Lição:** ${aprendizado}`;
                } else {
                    // Fallback
                    let temp = line.replace(/^\s*-\s*\[.\]\s*/, '').replace(/^\s*-\s*/, '');
                    resumo = temp.replace(/\(log_.*?\)/g, '').replace(/#\S+/g, '').trim();
                }

                if (resumo) {
                    aprendizados.push({ data: linkDiario, conteudo: resumo });
                }
            }
        });
    }

    // --- 3. RENDERIZAÇÃO ---

    if (wins.length > 0) {
        dv.header(3, `✨ Conquistas (${wins.length})`);
        dv.table(
            ["Data", "Vitória"],
            wins.map(w => [w.data, w.conteudo])
        );
    } else {
        dv.paragraph("⚪ Nenhuma conquista registrada neste período.");
    }

    dv.paragraph("---");

    if (aprendizados.length > 0) {
        dv.header(3, `🛑 Aprendizados (${aprendizados.length})`);
        dv.table(
            ["Data", "Análise"],
            aprendizados.map(a => [a.data, a.conteudo])
        );
    } else {
        dv.paragraph("⚪ Nenhum registro de erro/aprendizado.");
    }
}

await main();