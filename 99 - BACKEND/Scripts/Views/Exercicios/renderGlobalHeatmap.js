// SOTA - renderGlobalHeatmap.js v1.0
// Renderiza o gráfico de consistência (Heatmap) de TODOS os treinos do sistema.

(() => {
    return async function renderView(dv, input) {
        try {
            // --- 1. CARREGAMENTO DE DADOS (Deep Scan Global) ---
            const logsRootPath = "99 - BACKEND/Logs_Metricas/Exercicios";
            const rootFolder = app.vault.getAbstractFileByPath(logsRootPath);
            
            if (!rootFolder) {
                dv.paragraph("ℹ️ Pasta de logs não encontrada.");
                return;
            }

            const diasComTreino = {}; // { "YYYY-MM-DD": count }
            let totalSessoes = 0;

            // Função Recursiva Otimizada
            const processarPasta = async (pasta) => {
                if (!pasta.children) return;
                for (const child of pasta.children) {
                    if (child.extension === 'md' && child.name === "raw_logs.md") {
                        await lerLog(child);
                    } else if (!child.extension) {
                        await processarPasta(child);
                    }
                }
            };

            const lerLog = async (file) => {
                const content = await app.vault.cachedRead(file);
                // Regex simples e rápido para capturar datas de sessões concluídas
                const dates = content.matchAll(/\(log_date::\s*(\d{4}-\d{2}-\d{2})\)/g);
                for (const match of dates) {
                    const data = match[1];
                    diasComTreino[data] = (diasComTreino[data] || 0) + 1;
                    totalSessoes++;
                }
            };

            await processarPasta(rootFolder);

            if (totalSessoes === 0) {
                dv.paragraph("💤 Nenhuma sessão de treino registrada no sistema.");
                return;
            }

            // --- 2. CONFIGURAÇÃO VISUAL (Contribution Graph) ---
            const graphData = Object.entries(diasComTreino).map(([date, count]) => ({
                date: date,
                value: count,
                summary: `${count} exercícios`
            }));

            // Configuração de datas (Último ano)
            const moment = window.moment;
            const toDate = moment();
            const fromDate = moment().subtract(1, 'year').startOf('month');

            const config = {
                title: "Consistência Global",
                graphType: 'calendar',
                fromDate: fromDate.format('YYYY-MM-DD'),
                toDate: toDate.format('YYYY-MM-DD'),
                data: graphData,
                startOfWeek: 1, // Segunda-feira
                cellStyleRules: [
                    { min: 1, max: 2, color: "#9be9a8", text: "🌱" }, // Leve
                    { min: 3, max: 5, color: "#40c463", text: "🌿" }, // Moderado
                    { min: 6, max: 9, color: "#30a14e", text: "🌲" }, // Intenso
                    { min: 10, max: 999, color: "#216e39", text: "🔥" } // Hardcore
                ],
                onCellHover: (cellData) => {
                    return `${cellData.value} séries em ${cellData.date}`;
                }
            };

            // Renderiza usando o plugin Contribution Graph (se disponível)
            const container = dv.el("div", "", { cls: "sota-global-heatmap" });
            
            if (window.renderContributionGraph) {
                window.renderContributionGraph(container, config);
            } else {
                dv.paragraph("⚠️ Plugin 'Contribution Graph' não instalado.");
            }

        } catch (e) {
            dv.paragraph(`❌ Erro Heatmap: ${e.message}`);
        }
    }
})();