// 99 - BACKEND/Scripts/Views/DashboardRevisao/renderTabelaHabitosPeriodo.js
// SOTA v3.0 - Suporte Híbrido (Binário + Contador)

async function main() {
    const dashboard = dv.current();
    let startDate = dashboard.start_date;
    let endDate = dashboard.end_date;
    const moment = window.moment;
 
    if (!startDate || !endDate) {
        dv.paragraph("⚠️ Selecione um período.");
        return;
    }
 
    if (typeof startDate === 'string') startDate = startDate.substring(0, 10);
    if (typeof endDate === 'string') endDate = endDate.substring(0, 10);
    if (startDate.toFormat) startDate = startDate.toFormat('yyyy-MM-dd');
    if (endDate.toFormat) endDate = endDate.toFormat('yyyy-MM-dd');
 
    // 1. Busca Definições de Hábitos
    const habitosPath = "07 - Engenharia de Hábitos/01 - Hábitos";
    const habitos = dv.pages(`"${habitosPath}"`).where(p => p.tipo_habito === 'habito');
 
    // 2. Dias no Período
    const startM = moment(startDate);
    const endM = moment(endDate);
    const numDias = endM.diff(startM, 'days') + 1;
    
    // Lista de datas para iteração diária
    const datasNoPeriodo = [];
    let curr = startM.clone();
    while (curr.isSameOrBefore(endM)) {
        datasNoPeriodo.push(curr.format("YYYY-MM-DD"));
        curr.add(1, 'days');
    }
 
    // 3. Busca Logs (Processamento Diário)
    const logsPath = "99 - BACKEND/Logs_Metricas/Daily";
    // Mapeamento: Dia -> Conteúdo do Log
    const logsPorDia = new Map();
    
    // Otimização: Lê apenas os arquivos do período
    for (const dia of datasNoPeriodo) {
        const path = `${logsPath}/${dia}.md`;
        const file = app.vault.getAbstractFileByPath(path);
        if (file) {
            const content = await app.vault.cachedRead(file);
            logsPorDia.set(dia, content);
        }
    }
 
    // 4. Processamento de Sucesso por Hábito
    const dados = habitos.map(h => {
        const id = h.id_habito;
        const tipoInput = h.tipo_input || "booleano"; // booleano | numerico
        const metaNumerica = h.meta_numerica || 1;
        
        let diasConcluidos = 0;
        
        // Verifica dia a dia
        for (const dia of datasNoPeriodo) {
            const logContent = logsPorDia.get(dia);
            if (!logContent) continue;
            
            if (tipoInput === "numerico") {
                // Lógica Contador: Soma todos os registros do dia
                // Regex busca: #habito_registro ... (id_habito:: X) ... (valor:: Y)
                // A regex precisa ser robusta para pegar múltiplas linhas
                const regex = new RegExp(`#habito_registro.*?\\(id_habito::\\s*${id}\\).*?\\(valor::\\s*(\\d+)`, "g");
                let somaDia = 0;
                let match;
                while ((match = regex.exec(logContent)) !== null) {
                    somaDia += parseInt(match[1]);
                }
                
                if (somaDia >= metaNumerica) {
                    diasConcluidos++;
                }
                
            } else {
                // Lógica Binária: Busca tag de conclusão
                const regex = new RegExp(`#habito_concluido.*?\\(id_habito::\\s*${id}\\)`);
                if (regex.test(logContent)) {
                    diasConcluidos++;
                }
            }
        }
        
        // Cálculo de Meta Ajustada (Frequência)
        let metaPeriodo = numDias; 
        const freq = (h.frequencia || "").toLowerCase();
        if (freq.includes("semanal")) {
            metaPeriodo = Math.max(1, Math.ceil(numDias / 7));
        } else if (freq.includes("mensal")) {
            metaPeriodo = Math.max(1, Math.ceil(numDias / 30));
        }
        if (metaPeriodo < 1) metaPeriodo = 1;
 
        const aderencia = Math.min(100, Math.round((diasConcluidos / metaPeriodo) * 100));
        
        let status = "🔴";
        if (aderencia >= 80) status = "🟢";
        else if (aderencia >= 50) status = "🟡";
        else if (diasConcluidos === 0) status = "💀";
 
        return {
            link: h.file.link,
            total: diasConcluidos,
            meta: metaPeriodo,
            perc: aderencia,
            status: status
        };
    });
 
    dados.sort((a, b) => b.perc - a.perc);
 
    dv.table(
        ["Status", "Hábito", "Feito / Meta (Dias)", "Aderência"],
        dados.map(d => [
            d.status,
            d.link,
            `${d.total} / ${d.meta}`,
            d.perc + "%"
        ])
    );
 }
 
 await main();