// 99 - BACKEND/Scripts/Views/Daily/renderTimelineDiaria.js
// SOTA v2.1 - Filtro de sessao_inicio

async function main() {
    const page = dv.current();
    if (!page || !/^\d{4}-\d{2}-\d{2}$/.test(page.file.name)) {
        dv.paragraph("⚠️ Nota atual não é uma Nota Diária válida.");
        return;
    }
    const dateStr = page.file.name;
    const logPath = `99 - BACKEND/Logs_Metricas/Daily/${dateStr}.md`;
    const logFile = app.vault.getAbstractFileByPath(logPath);

    if (!logFile) {
        dv.paragraph("ℹ️ Nenhum log de atividade encontrado para hoje no Backend.");
        return;
    }

    const content = await app.vault.cachedRead(logFile);
    const lines = content.split('\n');
    const eventos = [];

    // --- FUNÇÕES DE LIMPEZA E FORMATAÇÃO (Inalteradas) ---
    const getConteudoPrincipal = (text) => {
        let cleanText = text.replace(/^\s*-\s*\[.\]\s*/, '').replace(/^\s*-\s*/, '');
        cleanText = cleanText.replace(/\(.*?::.*?\)/g, '').replace(/#\S+/g, '').trim();
        return cleanText;
    };

    const getTipoEIcone = (text) => {
        if (text.includes("sessao_fim::WORK")) return { tipo: "Foco", icone: "🍅" };
        if (text.includes("sessao_fim::BREAK")) return { tipo: "Pausa", icone: "☕" };
        if (text.includes("#habito_concluido")) return { tipo: "Hábito", icone: "✅" };
        if (text.includes("#refeicao_boa")) return { tipo: "Nutrição", icone: "🥗" };
        if (text.includes("#refeicao_ruim")) return { tipo: "Nutrição", icone: "🍔" };
        if (text.includes("#habito_agua_golada")) return { tipo: "Hidratação", icone: "💧" };
        if (text.includes("#log_felicidade")) return { tipo: "Emoção", icone: "😄" };
        if (text.includes("#log_estresse")) return { tipo: "Emoção", icone: "🤯" };
        if (text.includes("#log_tristeza")) return { tipo: "Emoção", icone: "😢" };
        if (text.includes("#ideia")) return { tipo: "Insight", icone: "💡" };
        if (text.includes("#reflexao")) return { tipo: "Insight", icone: "🤔" };
        if (text.includes("#aprendizado_erro")) return { tipo: "Insight", icone: "🛑" };
        if (text.includes("#distracao")) return { tipo: "Atenção", icone: "⚠️" };
        if (text.includes("#win")) return { tipo: "Conquista", icone: "✨" };
        if (text.includes("#fazer_depois")) return { tipo: "Captura", icone: "📥" };
        return { tipo: "Registro", icone: "📝" };
    };

    // --- PROCESSAMENTO PRINCIPAL COM CORREÇÃO ---
    lines.forEach(line => {
        const cleanLine = line.trim();
        
        // --- CORREÇÃO APLICADA AQUI ---
        // Se a linha tem log_time MAS é um log de início, IGNORA.
        if (cleanLine.includes("(sessao_inicio::")) {
            return;
        }

        if (!cleanLine.includes("(log_time::")) return;

        const timeMatch = cleanLine.match(/\(log_time::\s*(\d{2}:\d{2}:\d{2})\)/);
        const timeStr = timeMatch ? timeMatch[1] : "00:00:00";

        const { tipo, icone } = getTipoEIcone(cleanLine);
        let descricao = getConteudoPrincipal(cleanLine);

        // Lógica de Formatação Específica por Tipo
        if (tipo === "Foco" || tipo === "Pausa") {
            const duracaoMatch = cleanLine.match(/\(duracao_total_sessao_segundos::\s*(\d+)\)/);
            const tarefaMatch = cleanLine.match(/\(tarefa_focada::\s*"(.*?)"\)/);
            let duracaoStr = "";
            if (duracaoMatch) {
                const mins = Math.round(parseInt(duracaoMatch[1]) / 60);
                duracaoStr = `(${mins} min)`;
            }
            descricao = `Sessão ${duracaoStr}`;
            if (tarefaMatch) {
                descricao += `: ${tarefaMatch[1].replace(/\[🍅.*?\]/, '').replace(/#\S+/g, '').trim()}`;
            }
        } else if (tipo === "Hábito") {
            // A descrição já está limpa
        } else {
            const campoMatch = cleanLine.match(/\((?:Motivo|Causa|Fonte|Distração|Gatilho|Alimentos|Situação)::\s*(.*?)\)/);
            if (campoMatch) {
                descricao = campoMatch[1].trim();
            }
        }
        
        eventos.push({ hora: timeStr, tipo: `${icone} ${tipo}`, descricao });
    });

    eventos.sort((a, b) => a.hora.localeCompare(b.hora));

    if (eventos.length === 0) {
        dv.paragraph("Nenhum evento registrado na timeline hoje.");
        return;
    }

    dv.table(
        ["Hora", "Tipo", "Evento"],
        eventos.map(e => [e.hora.substring(0, 5), e.tipo, e.descricao])
    );
}

await main();