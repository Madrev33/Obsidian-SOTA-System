// 99 - BACKEND/Scripts/Views/DashboardRevisao/renderTabelaAprimoramentos.js
// SOTA v1.0 - Tabela de Aprimoramentos Pendentes no Período

async function main() {
    try {
        // 1. CONTEXTO E VALIDAÇÃO
        const dashboard = dv.current();
        let startDate = dashboard.start_date;
        let endDate = dashboard.end_date;
        const moment = window.moment;

        if (!startDate || !endDate) {
            dv.paragraph("⚠️ Selecione um período para visualizar os aprimoramentos.");
            return;
        }

        // Normalização de Datas para objetos Luxon do Dataview
        const startDateLuxon = dv.date(startDate);
        const endDateLuxon = dv.date(endDate);

        if (!startDateLuxon || !startDateLuxon.isValid || !endDateLuxon || !endDateLuxon.isValid) {
            dv.paragraph("❌ Datas de início ou fim inválidas.");
            return;
        }
        
        // 2. QUERY DATAVIEW PARA TAREFAS
        const dailyNotesPath = "01 - Registros/01. Daily";
        
        const aprimoramentosPendentes = dv.pages(`"${dailyNotesPath}"`)
            .flatMap(p => p.file.tasks)
            .where(t => 
                !t.completed &&                                           // Apenas tarefas não concluídas
                t.text.includes("#aprimoramento") &&                      // Que contenham a tag de aprimoramento
                t.page.file.day >= startDateLuxon &&                      // E que estejam dentro do período
                t.page.file.day <= endDateLuxon
            )
            .sort(t => t.page.file.day, 'asc'); // Ordena do mais antigo para o mais novo

        // 3. RENDERIZAÇÃO
        if (aprimoramentosPendentes.length > 0) {
            dv.header(4, `🎯 Aprimoramentos Pendentes (${aprimoramentosPendentes.length})`);
            dv.taskList(aprimoramentosPendentes, false); // false para não agrupar por arquivo
        } else {
            dv.paragraph("🎉 **Parabéns!** Nenhum aprimoramento pendente neste período.");
        }

    } catch (e) {
        dv.paragraph(`❌ **Erro ao renderizar aprimoramentos:** ${e.message}`);
        console.error("Erro em renderTabelaAprimoramentos.js:", e);
    }
}

main();