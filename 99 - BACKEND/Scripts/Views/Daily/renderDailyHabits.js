// SOTA - renderDailyHabits.js v3.2 (Debug & Fail-Safe)

async function main() {
    // 1. Verificação de Contexto
    if (!dv.current()) {
        dv.paragraph("⚠️ Erro de contexto Dataview.");
        return;
    }

    const todayStr = dv.current().file.name; // Pega 'YYYY-MM-DD' do nome do arquivo
    
    // Debug: Verifica se encontra a pasta
    const habitsFolder = "07 - Engenharia de Hábitos/01 - Hábitos";
    const activeHabits = dv.pages(`"${habitsFolder}"`)
        .where(p => p.tipo_habito === 'habito' && p.ativo !== false) // Removi '&& p.frequencia === "diaria"' temporariamente para teste
        .sort(p => p.file.name, 'asc');

    if (activeHabits.length === 0) {
        dv.paragraph(`ℹ️ Nenhum hábito encontrado em "${habitsFolder}". Verifique se a pasta existe e se os hábitos têm "tipo_habito: habito".`);
        return;
    }

    // 2. Busca Logs (Leitura Segura)
    const logFilePath = `99 - BACKEND/Logs_Metricas/Daily/${todayStr}.md`;
    let logContent = "";
    
    try {
        const logFile = app.vault.getAbstractFileByPath(logFilePath);
        if (logFile) {
            logContent = await app.vault.read(logFile);
        }
    } catch (e) {
        console.error("Erro ao ler log diário:", e);
    }
    
    // Mapa de Progresso
    const progressMap = {}; 
    const lines = logContent.split('\n');
    lines.forEach(line => {
        if (line.includes("#habito_concluido")) {
            const match = line.match(/\(id_habito::\s*(\S+)\)/);
            if (match) progressMap[match[1]] = { concluido: true, valorAtual: 1 };
        }
        if (line.includes("#habito_registro")) {
            const matchId = line.match(/\(id_habito::\s*(\S+)\)/);
            const matchVal = line.match(/\(valor::\s*(\d+)\)/);
            if (matchId && matchVal) {
                const id = matchId[1];
                const val = parseInt(matchVal[1]);
                if(!progressMap[id]) progressMap[id] = { concluido: false, valorAtual: 0 };
                progressMap[id].valorAtual += val;
            }
        }
    });

    // 3. Renderização (String HTML -> dv.paragraph)
    // Voltamos para dv.paragraph pois é mais robusto em diferentes contextos do Obsidian
    let html = `<div style="display: flex; flex-direction: column; gap: 8px;">`;

    for (const h of activeHabits) {
        const id = h.id_habito;
        const tipo = h.tipo_comportamento || "binario";
        const meta = h.meta_numerica || 1;
        const progresso = progressMap[id] || { concluido: false, valorAtual: 0 };
        
        let isDone = false;
        if (tipo === "binario") isDone = progresso.concluido;
        if (tipo === "contador") isDone = progresso.valorAtual >= meta;

        const borderColor = isDone ? "var(--color-green)" : "var(--background-modifier-border)";
        const opacity = isDone ? "0.6" : "1";
        
        // Constrói o card como string
        html += `
        <div style="
            background-color: var(--background-secondary);
            border: 1px solid ${borderColor};
            border-radius: 8px;
            padding: 10px;
            opacity: ${opacity};
            transition: all 0.2s;">
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                <span style="font-weight: 600; font-size: 0.95em;">${h.nome_habito}</span>
                <span style="font-size: 0.75em; color: var(--text-muted); background: var(--background-primary); padding: 2px 6px; border-radius: 4px;">
                    ${h.categoria_impacto || "Geral"}
                </span>
            </div>
        `;

        if (tipo === "contador") {
            const percent = Math.min(100, (progresso.valorAtual / meta) * 100);
            const barColor = isDone ? "var(--color-green)" : "var(--interactive-accent)";
            html += `
            <div style="height: 6px; background-color: var(--background-modifier-border); border-radius: 3px; overflow: hidden; margin-bottom: 8px;">
                <div style="height: 100%; width: ${percent}%; background-color: ${barColor};"></div>
            </div>`;
        }

        html += `<div style="display: flex; justify-content: space-between; align-items: center;">`;
        
        if (tipo === "contador") {
            html += `<span style="font-size: 0.85em; color: var(--text-muted); font-family: monospace;">${progresso.valorAtual} / ${meta}</span>`;
        } else {
            html += `<span style="font-size: 0.85em; color: var(--text-muted);">${isDone ? "Concluído" : "Pendente"}</span>`;
        }

        if (!isDone || tipo === "contador") {
            // Aqui usamos um botão Meta Bind embutido no HTML para garantir que o clique funcione
            // Isso exige que o script gere o código do botão Meta Bind
            // MAS, como estamos dentro de um dv.view, vamos usar um truque:
            // Botão HTML com onclick que chama o comando do Obsidian.
            // Para isso funcionar, precisamos expor a função ao escopo global ou usar um link 'obsidian://'
            
            // SIMPLIFICAÇÃO: Vamos usar o componente Button do Obsidian via dv.el
            // O HTML puro acima fecha aqui, e renderizamos o botão separadamente? Não, quebra o layout.
            
            // SOLUÇÃO: Usar a classe 'sota-habit-btn' e adicionar um EventListener global no final? Complexo.
            
            // SOLUÇÃO ROBUSTA (Botão Meta Bind Renderizado):
            // Não conseguimos injetar Meta Bind dentro de string HTML facilmente.
            
            // Vamos usar um LINK DE COMANDO fake que o Obsidian entende? Não.
            
            // VOLTA PARA O DOM (dv.el) mas simplificado:
        }
        
        html += `</div></div>`; // Fecha controles e card
    }
    
    html += `</div>`;
    
    // Renderiza o HTML estático (Barras e Textos)
    const container = dv.container;
    container.innerHTML = html;

    // INJEÇÃO DOS BOTÕES (Pós-Renderização)
    // Agora varremos o DOM que acabamos de criar e injetamos os botões onde precisa.
    // Isso é complexo. 
    
    // Vamos tentar a abordagem Híbrida:
    // Renderiza cada Card individualmente usando dv.el e appendChild.
}

// CHAMA A VERSÃO DOM SEGURA ABAIXO
await mainDOM();

async function mainDOM() {
    const dailyNote = dv.current();
    const todayStr = dailyNote.file.name;
    
    const habitsFolder = "07 - Engenharia de Hábitos/01 - Hábitos";
    const activeHabits = dv.pages(`"${habitsFolder}"`)
        .where(p => p.tipo_habito === 'habito' && p.ativo !== false)
        .sort(p => p.file.name, 'asc');

    if (activeHabits.length === 0) {
        dv.paragraph(`ℹ️ Nenhum hábito encontrado em ${habitsFolder}`);
        return;
    }

    const logFilePath = `99 - BACKEND/Logs_Metricas/Daily/${todayStr}.md`;
    let logContent = "";
    try {
        const logFile = app.vault.getAbstractFileByPath(logFilePath);
        if (logFile) logContent = await app.vault.read(logFile);
    } catch(e) {}

    const progressMap = {};
    logContent.split('\n').forEach(line => {
        if (line.includes("#habito_concluido")) {
            const match = line.match(/\(id_habito::\s*(\S+)\)/);
            if (match) progressMap[match[1]] = { concluido: true, valorAtual: 1 };
        }
        if (line.includes("#habito_registro")) {
            const matchId = line.match(/\(id_habito::\s*(\S+)\)/);
            const matchVal = line.match(/\(valor::\s*(\d+)\)/);
            if (matchId && matchVal) {
                const id = matchId[1];
                const val = parseInt(matchVal[1]);
                if(!progressMap[id]) progressMap[id] = { concluido: false, valorAtual: 0 };
                progressMap[id].valorAtual += val;
            }
        }
    });

    // --- INÍCIO DA LÓGICA DE AGRUPAMENTO ---
    const habitsByCategory = {
        '❤️ Saúde': [],
        '🧠 Gênio': [],
        '🕊️ Paz de Espírito': [],
        'Geral': [] // Fallback
    };
    
    const categoryMapping = {
        'Saúde': '❤️ Saúde',
        'Gênio': '🧠 Gênio',
        'Paz de Espírito': '🕊️ Paz de Espírito'
    };

    for (const h of activeHabits) {
        const categoryKey = categoryMapping[h.categoria_impacto] || 'Geral';
        habitsByCategory[categoryKey].push(h);
    }
    // --- FIM DA LÓGICA DE AGRUPAMENTO ---

    const container = dv.container;
    container.innerHTML = "";

    // --- INÍCIO DA RENDERIZAÇÃO EM GRID ---
    const gridWrapper = document.createElement("div");
    gridWrapper.style.display = "grid";
    gridWrapper.style.gridTemplateColumns = "repeat(auto-fit, minmax(250px, 1fr))";
    gridWrapper.style.gap = "15px";
    gridWrapper.style.marginTop = "10px";

    for (const category in habitsByCategory) {
        if (habitsByCategory[category].length === 0) continue;

        const column = document.createElement("div");
        column.style.display = "flex";
        column.style.flexDirection = "column";
        column.style.gap = "6px";
        
        // Título da Coluna
        const title = document.createElement("h4");
        title.innerText = category;
        title.style.margin = "0 0 5px 0";
        title.style.fontSize = "0.9em";
        title.style.color = "var(--text-muted)";
        column.appendChild(title);

        // Renderiza os hábitos da categoria
        for (const h of habitsByCategory[category]) {
            const id = h.id_habito;
            const tipo = h.tipo_comportamento || "binario";
            const meta = h.meta_numerica || 1;
            const progresso = progressMap[id] || { concluido: false, valorAtual: 0 };
            
            let isDone = false;
            if (tipo === "binario") isDone = progresso.concluido;
            if (tipo === "contador") isDone = progresso.valorAtual >= meta;

            const row = document.createElement("div");
            row.style.cssText = `
                display: flex; align-items: center; justify-content: space-between; 
                padding: 6px 10px; background-color: var(--background-primary-alt); 
                border-radius: 6px; border: 1px solid var(--background-modifier-border);
                position: relative; overflow: hidden; transition: all 0.2s;
            `;
            
            if (isDone) {
                row.style.opacity = "0.6";
                row.style.borderColor = "var(--color-green)";
            }

            const leftSide = document.createElement("div");
            leftSide.style.cssText = "display: flex; align-items: center; gap: 8px; z-index: 2;";
            
            const name = document.createElement("a");
            name.innerText = h.nome_habito;
            name.href = h.file.path;
            name.style.cssText = `font-weight: 500; font-size: 0.9em; color: var(--text-normal); text-decoration: ${isDone ? 'line-through' : 'none'};`;
            name.classList.add("internal-link");
            
            leftSide.appendChild(name);

            const rightSide = document.createElement("div");
            rightSide.style.cssText = "display: flex; align-items: center; gap: 10px; z-index: 2;";

            if (tipo === "contador") {
                const countText = document.createElement("span");
                countText.innerText = `${progresso.valorAtual}/${meta}`;
                countText.style.cssText = "font-size: 0.8em; font-family: monospace; color: var(--text-muted);";
                rightSide.appendChild(countText);
            }

            if (!isDone || tipo === "contador") {
                const btn = document.createElement("button");
                btn.innerText = tipo === "contador" ? "+" : "✓";
                btn.style.cssText = `
                    padding: 2px 8px; font-size: 0.8em; cursor: pointer; border-radius: 4px; 
                    border: 1px solid var(--background-modifier-border); background-color: var(--interactive-accent); 
                    color: var(--text-on-accent); min-width: 24px; height: 24px;
                    display: flex; align-items: center; justify-content: center;
                `;
                
                btn.onclick = async (e) => {
                    e.preventDefault();
                    const qa = app.plugins.plugins.quickadd?.api;
                    if (qa) {
                        await qa.executeChoice("Registrar Progresso Hábito", {
                            id_habito: id,
                            nome_habito: h.nome_habito,
                            tipo: tipo,
                            valor: 1
                        });
                    }
                };
                rightSide.appendChild(btn);
            } else {
                 const check = document.createElement("span");
                 check.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-green);"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
                 rightSide.appendChild(check);
            }

            if (tipo === "contador") {
                const percent = Math.min(100, (progresso.valorAtual / meta) * 100);
                const barBg = document.createElement("div");
                barBg.style.cssText = `
                    position: absolute; top: 0; left: 0; bottom: 0;
                    width: ${percent}%;
                    background-color: ${isDone ? 'rgba(var(--color-green-rgb), 0.1)' : 'rgba(var(--interactive-accent-rgb), 0.15)'};
                    z-index: 1; transition: width 0.3s; pointer-events: none;
                `;
                row.appendChild(barBg);
            }

            row.appendChild(leftSide);
            row.appendChild(rightSide);
            column.appendChild(row);
        }
        
        gridWrapper.appendChild(column);
    }
    
    container.appendChild(gridWrapper);
    // --- FIM DA RENDERIZAÇÃO EM GRID ---
}

await mainDOM();