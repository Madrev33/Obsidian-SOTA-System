// SOTA - gerarDossieHQ.js v5.2 (Final Crawler Implementation)
// Lógica de extração profunda validada e loop assíncrono para garantir a captura de conteúdo.

module.exports = async (params) => {
    const { app, obsidian } = params;
    const { Notice, TFile } = obsidian;
    const moment = params.obsidian.moment;

    console.log("🚀 [SOTA HQ v5.2] Deep Crawler & Async Loop INICIADO.");

    // --- 1. CONTEXTO ---
    const activeFile = app.workspace.getActiveFile();
    if (!activeFile) { new Notice("❌ Abra uma nota diária."); return; }
    
    const dateStr = activeFile.basename;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) { new Notice("⚠️ Arquivo inválido."); return; }

    new Notice(`🎨 Roteirizando ${dateStr} com extração profunda...`);

    // --- 2. DADOS DE ESTADO (Métricas e Frontmatter) ---
    const metricsPath = `99 - BACKEND/Logs_Metricas/Daily/Processed/${dateStr}_metrics.md`;
    const metricsFile = app.vault.getAbstractFileByPath(metricsPath);
    
    let stats = {
        xp: 0, wins: 0, erros: 0, sono: 0,
        energia: { madrugada: 50, manha: 50, tarde: 50, noite: 50 },
        humor: { madrugada: 3, manha: 3, tarde: 3, noite: 3 }
    };

    if (metricsFile) {
        const mFm = app.metadataCache.getFileCache(metricsFile)?.frontmatter || {};
        stats.xp = mFm.xp_dia_total || 0;
        stats.wins = mFm.qtd_wins || 0;
        stats.erros = mFm.qtd_erros || 0;
        stats.sono = mFm.qualidade_sono_calculada || 0;
        stats.energia.madrugada = mFm.energia_madrugada || 50;
        stats.energia.manha = mFm.energia_manha || 50;
        stats.energia.tarde = mFm.energia_tarde || 50;
        stats.energia.noite = mFm.energia_noite || 50;
        stats.humor.madrugada = mFm.humor_madrugada || 3;
        stats.humor.manha = mFm.humor_manha || 3;
        stats.humor.tarde = mFm.humor_tarde || 3;
        stats.humor.noite = mFm.humor_noite || 3;
    }

    const dFm = app.metadataCache.getFileCache(activeFile)?.frontmatter || {};
    const acontecimentos = {
        madrugada: dFm.acontecimento_madrugada || "",
        manha: dFm.acontecimento_manha || "",
        tarde: dFm.acontecimento_tarde || "",
        noite: dFm.acontecimento_noite || ""
    };

    // --- 3. CRAWLER DE CONTEÚDO (LÓGICA VALIDADA) ---
    async function extractNoteContent(app, rawLinkText) {
        let cleanPath = rawLinkText.replace(/\[\[|\]\]/g, "").split("|")[0].trim();
        let file = app.vault.getAbstractFileByPath(cleanPath);
        if (!file) file = app.metadataCache.getFirstLinkpathDest(cleanPath, "");
        if (!file || !(file instanceof TFile)) return "Conteúdo não acessível.";

        const content = await app.vault.read(file);
        const headerRegex = /^##\s*(?:📝)?\s*Conteúdo/im;
        const match = content.match(headerRegex);
        
        let extracted = "";
        if (match) {
            const startIndex = match.index + match[0].length;
            const textAfter = content.substring(startIndex);
            const endRegex = /\n(##\s|---)/;
            const endMatch = textAfter.match(endRegex);
            extracted = endMatch ? textAfter.substring(0, endMatch.index) : textAfter;
        } else {
            extracted = content.replace(/^---[\s\S]+?---\n/, "");
        }

        extracted = extracted.replace(/!\[\[.*?\]\]/g, ""); // Filtra Excalidraw e imagens
        const cleanContent = extracted.trim();
        if (cleanContent.length === 0) return "*[Sem conteúdo textual]*";
        
        return cleanContent.length > 500 ? cleanContent.substring(0, 500) + "..." : cleanContent;
    }

    // --- 4. FORMATADORES AUXILIARES ---
    const getLogTime = (line) => {
        const match = line.match(/\(log_time::\s*(\d{2}):(\d{2})/);
        if (!match) return null;
        return { h: parseInt(match[1]), m: parseInt(match[2]), str: `${match[1]}:${match[2]}` };
    };

    const determinePeriod = (h) => {
        if (h < 6) return 'madrugada';
        if (h < 12) return 'manha';
        if (h < 18) return 'tarde';
        return 'noite';
    };

    const formatLogNarrative = async (line) => {
        const timeData = getLogTime(line);
        if (!timeData) return null;

        const timeStr = timeData.str;
        let action = "";
        let type = "Cena";
        const clean = (txt) => txt.replace(/\(log_.*?\)/g, '').replace(/\(id_.*?\)/g, '').replace(/#[\w/-]+/g, '').replace(/\(Fonte::.*?\)/g, '').trim();

        // **PRIORIDADE 1: EXTRAÇÃO PROFUNDA DE NOTAS**
        if (line.includes("#ideia") || line.includes("#reflexao") || line.includes("#anotacao")) {
            let label = line.includes("#ideia") ? "💡 Ideia" : (line.includes("#reflexao") ? "🤔 Reflexão" : "📝 Anotação");
            const linkMatch = line.match(/\[\[(.*?)\]\]/);
            
            if (linkMatch) {
                const content = await extractNoteContent(app, linkMatch[0]);
                action = `Registrou ${label.split(' ')[1]}: "${content}"`;
            } else {
                action = `Registrou ${label.split(' ')[1]}: "${clean(line).replace(/- \[ \] /, '').replace(label.split(' ')[1] + ':', '').trim()}"`;
            }
            type = label;
        } 
        
        // **PRIORIDADE 2: OUTROS EVENTOS**
        else if (line.includes("#log_felicidade")) { type = "😄 Emoção"; action = `Sentiu Felicidade: ${clean(line).replace("Momento de Felicidade.", "").trim()}`; }
        else if (line.includes("#log_estresse")) { type = "😖 Emoção"; action = `Sentiu Estresse: ${clean(line).replace("Momento de Estresse/Ansiedade.", "").trim()}`; }
        else if (line.includes("#log_tristeza")) { type = "😢 Emoção"; action = `Sentiu Tristeza: ${clean(line).replace("Momento de Tristeza.", "").trim()}`; }
        else if (line.includes("#win")) { type = "🏆 Clímax"; action = `Vitória: ${clean(line).replace("Conquista (Win):", "").trim()}`; }
        else if (line.includes("#aprendizado_erro")) { type = "💥 Conflito"; action = `Erro: ${clean(line).replace("Aprendizado de Erro.", "").trim()}`; }
        else if (line.includes("#distracao")) { type = "⚠️ Obstáculo"; action = `Distração: ${clean(line).replace("Ponto de Distração registrado.", "").trim()}`; }
        else if (line.includes("sessao_fim::WORK")) {
            type = "🍅 Foco";
            const tarefa = line.match(/\(tarefa_focada::"(.*?)"\)/)?.[1] || "Trabalho";
            const tarefaLimpa = tarefa.replace(/\[🍅.*?\]/, '').replace(/#\S+/g, '').trim();
            const duracao = Math.round((line.match(/\(duracao_total_sessao_segundos::(\d+)\)/)?.[1] || 0) / 60);
            action = `Trabalho: "${tarefaLimpa}" (${duracao} min)`;
        }
        else if (line.includes("#habito_concluido")) {
            type = "✅ Rotina";
            const habito = line.match(/Hábito Concluído:\s*(.*?)\s*#/)?.[1] || "Hábito";
            action = `Hábito: ${habito}`;
        }
        else if (line.includes("#habito_registro")) {
            type = "✅ Rotina";
            const habito = line.match(/Registro Hábito:\s*(.*?)\s*\(/)?.[1] || "Hábito";
            const valor = line.match(/\(valor::\s*(\d+)\)/)?.[1] || "1";
            action = `Registro: ${habito} (+${valor})`;
        }
        else if (line.includes("#exercicio/") || line.includes("exercicio_id")) { 
            type = "🏋️‍♂️ Treino"; 
            const nome = line.match(/\(exercicio_id::(.*?)\)/)?.[1] || "Exercicio";
            action = `Exercício: ${nome.replace(/_/g, ' ')}`;
        }
        else if (line.includes("#refeicao_boa")) { 
            type = "🍎 Nutrição"; 
            const comida = line.match(/\(Alimentos::(.*?)\)/)?.[1] || "Refeição";
            action = `Comeu (Saudável): ${comida}`; 
        }
        else if (line.includes("#refeicao_ruim")) { 
            type = "🍔 Nutrição"; 
            const comida = line.match(/\(Alimentos::(.*?)\)/)?.[1] || "Besteira";
            action = `Comeu (Lixo): ${comida}`; 
        }

        if (!action) return null;
        return { periodKey: determinePeriod(timeData.h), text: `- [${timeData.str}] **${type}:** ${action}` };
    };

    // --- 5. BINNING DOS LOGS (ASSÍNCRONO) ---
    
    const periodos = {
        madrugada: { logs: [], titulo: "🌃 Madrugada (00h-06h)" },
        manha: { logs: [], titulo: "🌤️ Manhã (06h-12h)" },
        tarde: { logs: [], titulo: "☀️ Tarde (12h-18h)" },
        noite: { logs: [], titulo: "🌙 Noite (18h-24h)" }
    };

    const dailyLogPath = `99 - BACKEND/Logs_Metricas/Daily/${dateStr}.md`;
    const logFile = app.vault.getAbstractFileByPath(dailyLogPath);

    if (logFile) {
        const content = await app.vault.read(logFile);
        const lines = content.split('\n');

        // Loop assíncrono para esperar o Crawler
        for (const line of lines) {
            const l = line.trim();
            if (l.startsWith("- ") && !l.includes("sessao_inicio") && !l.includes("pagina_fim")) {
                const formatted = await formatLogNarrative(l);
                if (formatted) {
                    periodos[formatted.periodKey].logs.push(formatted.text);
                }
            }
        }
    } else {
        new Notice("Arquivo de logs não encontrado.");
    }

    // --- 6. MONTAGEM DO ROTEIRO ---
    let roteiro = `# 🎬 Roteiro HQ: ${dateStr}\n\n`;
    roteiro += `## 👤 Status do Dia\n`;
    roteiro += `> *XP:* **${stats.xp}** | *Sono:* **${stats.sono}%** | *Energia Média:* **${Math.round((stats.energia.manha + stats.energia.tarde)/2)}**\n\n`;
    if (dFm.oque_fez_hoje) roteiro += `**Resumo do Dia:** "${dFm.oque_fez_hoje}"\n\n`;

    const keys = ['madrugada', 'manha', 'tarde', 'noite'];
    
    keys.forEach(key => {
        const p = periodos[key];
        const acontecimento = acontecimentos[key];
        const energia = stats.energia[key];
        const humor = stats.humor[key];
        const temLogs = p.logs.length > 0;
        const temTexto = acontecimento && acontecimento.length > 0;

        if (temLogs || temTexto) {
            roteiro += `### ${p.titulo}\n`;
            roteiro += `**[Atmosfera]** Energia: ${energia}/100 | Humor: ${humor}/5\n`;
            
            if (temTexto) roteiro += `**[Narrativa Principal]**\n> "${acontecimento}"\n`;
            if (temLogs) {
                p.logs.sort(); 
                roteiro += `\n**[Ações & Pensamentos]**\n`;
                roteiro += p.logs.join('\n');
            }
            roteiro += `\n\n---\n`;
        }
    });

    roteiro += `## 🔚 Desfecho\n`;
    if (dFm.oque_fazer_amanha) roteiro += `**Próximo Episódio:** "${dFm.oque_fazer_amanha}"\n`;
    if (dFm.feedback_positivo) roteiro += `**Vitória (+):** ${dFm.feedback_positivo}\n`;
    if (dFm.feedback_negativo) roteiro += `**Conflito (-):** ${dFm.feedback_negativo}\n`;

    // --- 7. SALVAR ---
    const now = moment();
    const folderPath = `01 - Registros/Análises (AI)/${now.format("YYYY")}/${now.format("MM")}`;
    const fileName = `HQ_Do_Dia_${dateStr}.md`;
    const fullPath = `${folderPath}/${fileName}`;

    if (!await app.vault.adapter.exists(folderPath)) {
        await app.vault.createFolder(folderPath);
    }

    const existingFile = app.vault.getAbstractFileByPath(fullPath);
    if (existingFile instanceof TFile) {
        await app.vault.modify(existingFile, roteiro);
        new Notice(`🔄 Roteiro HQ Atualizado: ${fileName}`);
        app.workspace.getLeaf(true).openFile(existingFile);
    } else {
        const newFile = await app.vault.create(fullPath, roteiro);
        new Notice(`✅ Roteiro HQ Criado: ${fileName}`);
        app.workspace.getLeaf(true).openFile(newFile);
    }
};