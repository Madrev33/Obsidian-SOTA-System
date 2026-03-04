// 99 - BACKEND/Scripts/Views/Daily/renderLogsPorPeriodo.js
// SOTA v5.1 - Universal Log Renderer
// Renderiza TODOS os tipos de log, incluindo mudança de página, distração e formatação de texto.

async function main() {
    // 1. Validação de Contexto
    const page = dv.current();
    if (!page || !/^\d{4}-\d{2}-\d{2}$/.test(page.file.name)) {
        dv.paragraph("⚠️ Nota atual não é uma Nota Diária válida.");
        return;
    }

    const dateStr = page.file.name;
    const logPath = `99 - BACKEND/Logs_Metricas/Daily/${dateStr}.md`;
    const logFile = app.vault.getAbstractFileByPath(logPath);

    if (!logFile) {
        dv.paragraph("ℹ️ *Ainda não há registros para o dia de hoje.*");
        return;
    }

    // 2. Leitura e Parsing
    const content = await app.vault.cachedRead(logFile);
    const lines = content.split('\n');

    const periodos = {
        madrugada: [],
        manha: [],
        tarde: [],
        noite: []
    };

    // --- FUNÇÕES AUXILIARES ---

    const formatarDuracao = (segundosInput) => {
        const seg = parseInt(segundosInput);
        if (isNaN(seg) || seg < 0) return "00:00:00";
        const h = Math.floor(seg / 3600).toString().padStart(2, '0');
        const m = Math.floor((seg % 3600) / 60).toString().padStart(2, '0');
        const s = (seg % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    const parseMetadata = (line) => {
        const metadata = {};
        const regex = /\(([^:]+)::\s*(.*?)\)/g;
        let match;
        while ((match = regex.exec(line)) !== null) {
            metadata[match[1]] = match[2].replace(/^"|"$/g, '').replace(/\*\*([^*]+)\*\*/g, '$1');
        }
        return metadata;
    };

    const limparTexto = (texto) => {
        if (!texto) return "";
        return texto
            .replace(/\([\w_]+::.*?\)/g, '')
            .replace(/#[\w\/-]+/g, '')
            .replace(/\[🍅::.*?\]/g, '')
            .replace(/\[.*?\]/g, '')
            .replace(/^\s*-\s*\[.\]\s*/, '')
            .replace(/^\s*-\s*/, '')
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove ** **
            .replace(/\s\s+/g, ' ')
            .trim();
    };

    // --- FORMATAÇÃO INTELIGENTE POR TIPO (MOTOR v5.1) ---
    const formatarLog = (rawLine, metadata) => {
        let icone = "📝";
        let labelTipo = "Registro";
        let descricao = limparTexto(rawLine);

        // LÓGICA DE TREINO (Polimórfica)
        if (metadata.sessao_fim === 'WORK' && (metadata.exercicio_id || rawLine.includes('#exercicio/'))) {
            icone = "🏋️‍♂️";
            labelTipo = "Treino";
            let nomeExercicio = metadata.tarefa_focada || metadata.exercicio_id || "Exercício";
            nomeExercicio = nomeExercicio.replace(/^Série \d+ @\s*/, '').replace(/#\S+/g, '').trim();
            if (!nomeExercicio || nomeExercicio.includes('serie_') || nomeExercicio === 'treino') {
                 nomeExercicio = (metadata.exercicio_id || "Exercício").replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            }
            let detalhes = "";
            if (metadata.distancia_km) {
                detalhes = `${metadata.distancia_km} km${metadata.ritmo_medio ? ` • ${metadata.ritmo_medio}/km` : ''}${metadata.bpm_medio ? ` • ${metadata.bpm_medio} bpm` : ''}`;
            } else {
                const carga = metadata.carga_kg && metadata.carga_kg !== "0" ? `${metadata.carga_kg}kg` : 'Peso Corp.';
                let esforco = metadata.duracao_alvo && !metadata.reps_feito ? `${metadata.duracao_alvo}s` : `${metadata.reps_feito || 0} reps`;
                const rpe = metadata.esforco_rpe ? ` • RPE ${metadata.esforco_rpe}` : '';
                detalhes = `${carga} × ${esforco}${rpe}`;
            }
            const duracaoExecucao = metadata.duracao_segundos ? ` • ⏱️ ${formatarDuracao(metadata.duracao_segundos)}` : "";
            descricao = `**${nomeExercicio}** ‣ ${detalhes}${duracaoExecucao}`;
        }
        
        // LÓGICA DE POMODORO (WORK)
        else if (metadata.sessao_fim === 'WORK') {
            icone = "🍅"; labelTipo = "Foco";
            const duracao = formatarDuracao(metadata.duracao_total_sessao_segundos);
            let tarefa = limparTexto(metadata.tarefa_focada || "Sessão sem nome");
            let contexto = "";
            if (rawLine.includes("#projeto/")) contexto = " 🚀";
            if (rawLine.includes("#midia/")) contexto = " 📚";
            descricao = `**${tarefa}** ‣ ⏱️ ${duracao}${contexto}`;
        }
        
        // LÓGICA DE PAUSA (BREAK)
        else if (metadata.sessao_fim === 'BREAK') {
            icone = "☕"; labelTipo = "Descanso";
            const duracao = formatarDuracao(metadata.duracao_total_sessao_segundos);
            descricao = `Recuperação ‣ ⏱️ ${duracao}`;
        }
        
        // --- NOVOS LOGS DE MÍDIA ---
        else if (metadata.pagina_fim) {
            icone = "📖"; labelTipo = "Leitura";
            const duracao = formatarDuracao(metadata.duracao_segundos);
            descricao = `Página **${metadata.pagina_fim}** finalizada ‣ ⏱️ ${duracao}`;
        } else if (metadata.aula_fim) {
            icone = "🎓"; labelTipo = "Estudo";
            const duracao = formatarDuracao(metadata.duracao_segundos);
            descricao = `Aula **${metadata.aula_fim}** finalizada ‣ ⏱️ ${duracao}`;
        }

        // EVENTOS DE VIDA E ESTADOS
        else if (rawLine.includes("#refeicao_boa")) { icone = "🥗"; labelTipo = "Dieta"; descricao = `**Nutrição:** ${metadata.Alimentos || "N/A"}`; }
        else if (rawLine.includes("#refeicao_ruim")) { icone = "🍔"; labelTipo = "Lixo"; descricao = `**Nutrição:** ${metadata.Alimentos || "N/A"}`; }
        else if (rawLine.includes("#habito_concluido")) { icone = "✅"; labelTipo = "Hábito"; const nomeHabito = rawLine.match(/Hábito Concluído: (.*?) #/)?.[1] || "Hábito"; descricao = `**${nomeHabito}**`; }
        else if (rawLine.includes("#habito_registro")) { icone = "🔢"; labelTipo = "Hábito"; const nomeHabito = rawLine.match(/Registro Hábito: (.*?) \(/)?.[1] || "Contador"; descricao = `**${nomeHabito}** ‣ +${metadata.valor || 1}`; }
        else if (rawLine.includes("#log_felicidade")) { icone = "😄"; labelTipo = "Emoção"; descricao = `**Felicidade:** ${metadata.Contexto || "Sem contexto"}`; }
        else if (rawLine.includes("#log_estresse")) { icone = "🤯"; labelTipo = "Estresse"; descricao = `**Estresse:** ${metadata.Contexto || "Sem contexto"}`; }
        else if (rawLine.includes("#log_tristeza")) { icone = "😢"; labelTipo = "Tristeza"; descricao = `**Tristeza:** ${metadata.Contexto || "Sem contexto"}`; }
        else if (rawLine.includes("#ideia")) { icone = "💡"; labelTipo = "Ideia"; }
        else if (rawLine.includes("#reflexao")) { icone = "🤔"; labelTipo = "Reflexão"; }
        else if (rawLine.includes("#aprendizado_erro")) { icone = "🛑"; labelTipo = "Erro"; descricao = `**Falha:** ${metadata.Erro || "N/A"} ‣ **Aprendizado:** ${metadata.Aprendizado || "N/A"}`; }
        else if (rawLine.includes("#distracao")) { // <<< CORREÇÃO AQUI
            icone = "⚠️"; labelTipo = "Atenção";
            descricao = `**Distração:** ${metadata.Distração || "N/A"} ‣ **Gatilho:** ${metadata.Gatilho || "N/A"}`;
        }
        else if (rawLine.includes("#win")) { icone = "🏆"; labelTipo = "Win"; descricao = `**Conquista:** ${limparTexto(rawLine).replace("Conquista (Win):", "").trim()}`; }
        else if (rawLine.includes("#fazer_depois")) { icone = "📥"; labelTipo = "Captura"; }

        return { 
            tipoDisplay: `${icone} ${labelTipo}`,
            descricao 
        };
    };

    // 3. Iteração e Classificação
    lines.forEach(line => {
        const cleanLine = line.trim();
        if (!cleanLine || !cleanLine.includes("(log_time::")) return;
        if (cleanLine.includes("(sessao_inicio::") || cleanLine.includes("(pagina_inicio::")) return;

        const timeMatch = cleanLine.match(/\(log_time::\s*(\d{2}:\d{2}):\d{2}\)/);
        const horaStr = timeMatch ? timeMatch[1] : "--:--";
        const horaInt = parseInt(horaStr.split(':')[0]);

        const metadata = parseMetadata(cleanLine);
        const { tipoDisplay, descricao } = formatarLog(cleanLine, metadata);

        let bucket = null;
        if (cleanLine.includes("#periodo/madrugada")) bucket = 'madrugada';
        else if (cleanLine.includes("#periodo/manha")) bucket = 'manha';
        else if (cleanLine.includes("#periodo/tarde")) bucket = 'tarde';
        else if (cleanLine.includes("#periodo/noite")) bucket = 'noite';
        else {
            if (horaInt < 6) bucket = 'madrugada';
            else if (horaInt < 12) bucket = 'manha';
            else if (horaInt < 18) bucket = 'tarde';
            else bucket = 'noite';
        }

        periodos[bucket].push([
            `<code style="font-size:0.9em; color:var(--text-muted)">${horaStr}</code>`,
            `<span style="font-weight:600; white-space:nowrap">${tipoDisplay}</span>`,
            descricao
        ]);
    });

    // 4. Renderização
    const renderSection = (titulo, dados) => {
        if (dados.length > 0) {
            dados.sort((a, b) => a[0].localeCompare(b[0]));
            dv.header(4, titulo);
            dv.table(["Hora", "Tipo", "Atividade"], dados);
        }
    };

    renderSection("🌃 Madrugada", periodos.madrugada);
    renderSection("🌤️ Manhã", periodos.manha);
    renderSection("☀️ Tarde", periodos.tarde);
    renderSection("🌙 Noite", periodos.noite);

    if (Object.values(periodos).every(p => p.length === 0)) {
         dv.paragraph("<center><i>O dia ainda é uma folha em branco. Comece a agir.</i></center>");
    }
}

await main();