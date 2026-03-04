// SOTA - renderControlPanelAnotacao.js v3.0 (UX Refined & Logic Fix)
// Painel de Controle com novo layout de status, log com hashtag e injeção inteligente de Excalidraw.

const note = input.note || dv.current();
const container = dv.container;

if (!note) return;

// --- CONFIG & ESTADO LOCAL ---
const file = app.vault.getAbstractFileByPath(note.file.path);
let localTipo = note.tipo || "anotacao_geral"; 
let localLogado = note.logado_em_daily || false;

const templateExcalidrawPath = "99 - BACKEND/Templates/Anotacoes/Excalidraw_Template_Vazio_Anotacao.md";
const dailyLogFolder = "99 - BACKEND/Logs_Metricas/Daily";

// --- FUNÇÕES DE AÇÃO ---

const handleTypeChange = (newType, btnElement, allBtns) => {
    localTipo = newType;
    allBtns.forEach(b => b.classList.remove('active'));
    btnElement.classList.add('active');
    app.fileManager.processFrontMatter(file, (fm) => { fm.tipo = newType; });
};

const createExcalidraw = async () => {
    const folder = file.parent.path;
    const baseName = file.basename;
    const excalidrawPath = `${folder}/${baseName}.excalidraw.md`;
    
    if (await app.vault.adapter.exists(excalidrawPath)) {
        new Notice("⚠️ Excalidraw já existe.");
        return;
    }

    const tFile = app.vault.getAbstractFileByPath(templateExcalidrawPath);
    let content = tFile ? await app.vault.read(tFile) : "";
    
    // 1. Cria o arquivo Excalidraw
    await app.vault.create(excalidrawPath, content);
    
    // 2. Lógica de Injeção Inteligente
    const targetHeader = "## 📝 Conteúdo";
    const mapHeader = "## 🗺️ Mapa Mental";
    const embedLink = `![[${baseName}.excalidraw.md]]`;
    const fileContent = await app.vault.read(file);
    const lines = fileContent.split('\n');
    
    const contentHeaderIndex = lines.findIndex(l => l.trim().startsWith(targetHeader));
    
    if (contentHeaderIndex !== -1) {
        // Encontrou a seção de Conteúdo, insere duas linhas antes
        const insertIndex = Math.max(0, contentHeaderIndex - 2);
        lines.splice(insertIndex, 0, mapHeader, "", embedLink, "", "---");
    } else {
        // Fallback: Se não achar, insere no final
        lines.push("", "---", "", mapHeader, "", embedLink);
    }
    
    await app.vault.modify(file, lines.join('\n'));

    new Notice("🎨 Excalidraw criado e inserido!");
};

const logToDaily = async (btnElement) => {
    const originalText = btnElement.innerText;
    btnElement.innerText = "⏳ ...";
    
    const m = window.moment;
    const hoje = m().format("YYYY-MM-DD");
    const agora = m().format("HH:mm:ss");
    const logPath = `${dailyLogFolder}/${hoje}.md`;
    
    let logFile = app.vault.getAbstractFileByPath(logPath);
    if (!logFile) {
        if (!await app.vault.adapter.exists(dailyLogFolder)) await app.vault.createFolder(dailyLogFolder);
        logFile = await app.vault.create(logPath, "");
    }

    const mapLog = { "ideia": "#ideia", "reflexao": "#reflexao", "anotacao_geral": "#anotacao" };
    const tag = mapLog[localTipo] || "#anotacao";
    
    const nomeFonte = file.basename.replace(/^(Anotações - |\d{4}-\d{2}-\d{2} \d{2}h\d{2})/g, '').trim();
    const fonteLink = `(Fonte:: [[${file.path}|${nomeFonte}]])`;
    
    // CORREÇÃO: Adicionada a tag # antes do tipo
    const logLine = `\n- [ ] ${tag} ${fonteLink} (log_date::${hoje}) (log_time::${agora})`;

    await app.vault.append(logFile, logLine);
    
    await app.fileManager.processFrontMatter(file, (fm) => { fm.logado_em_daily = true; });
    localLogado = true;
    
    btnElement.className = 'sota-btn success';
    btnElement.innerText = "✅ Já Logado";
    btnElement.onclick = null;
    
    new Notice("✅ Logado no Daily!");
};

// --- RENDERIZAÇÃO ---
function render() {
    container.innerHTML = '';
    const style = document.createElement('style');
    style.textContent = `
        .sota-panel-wrapper { display: flex; flex-direction: column; gap: 10px; margin: 10px 0; background: var(--background-secondary); border: 1px solid var(--background-modifier-border); border-radius: 8px; padding: 10px; }
        .sota-panel-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; }
        .sota-col { flex: 1; display: flex; flex-direction: column; gap: 8px; }
        .sota-col-header { font-weight: 600; color: var(--text-muted); font-size: 0.75em; text-transform: uppercase; margin-bottom: 4px; text-align: center; }
        .sota-btn { display: flex; align-items: center; justify-content: center; padding: 6px 12px; border-radius: 5px; border: 1px solid var(--background-modifier-border); background: var(--interactive-normal); color: var(--text-normal); cursor: pointer; font-size: 0.9em; width: 100%; text-align: center; user-select: none; }
        .sota-btn:hover { background: var(--interactive-hover); }
        .sota-btn.active { background: var(--interactive-accent); color: var(--text-on-accent); border-color: var(--interactive-accent); font-weight: 600; }
        .sota-btn.success { background: var(--color-green); color: white; border-color: transparent; cursor: default; }
        .sota-status-bar { padding: 10px; margin-top: 10px; border-top: 1px solid var(--background-modifier-border); text-align: center; font-weight: bold; font-size: 0.9em; }
        .sota-status-green { color: var(--color-green); }
        .sota-status-yellow { color: var(--color-yellow); }
    `;
    container.appendChild(style);

    const panel = document.createElement('div');
    panel.className = 'sota-panel-wrapper';
    
    const grid = panel.createDiv({ cls: "sota-panel-grid" });

    // -- COLUNA 1: CLASSIFICAR --
    const col1 = grid.createDiv({ cls: "sota-col" });
    col1.innerHTML = `<div class="sota-col-header">Classificar</div>`;
    
    const typeButtons = [];
    const createTypeBtn = (text, typeKey) => {
        const btn = document.createElement('button');
        btn.className = `sota-btn ${localTipo === typeKey ? 'active' : ''}`;
        btn.innerText = text;
        btn.onclick = () => handleTypeChange(typeKey, btn, typeButtons);
        typeButtons.push(btn);
        return btn;
    };

    col1.appendChild(createTypeBtn("💡 Ideia", "ideia"));
    col1.appendChild(createTypeBtn("🤔 Reflexão", "reflexao"));
    col1.appendChild(createTypeBtn("📝 Nota", "anotacao_geral"));

    // -- COLUNA 2: AÇÕES --
    const col2 = grid.createDiv({ cls: "sota-col" });
    col2.innerHTML = `<div class="sota-col-header">Ações</div>`;

    const btnExcalidraw = document.createElement('button');
    btnExcalidraw.className = 'sota-btn';
    btnExcalidraw.innerText = "🎨 Criar Excalidraw";
    btnExcalidraw.onclick = createExcalidraw;
    col2.appendChild(btnExcalidraw);

    if (localLogado) {
        const btnLogado = document.createElement('div');
        btnLogado.className = 'sota-btn success';
        btnLogado.innerText = "✅ Já Logado";
        col2.appendChild(btnLogado);
    } else {
        const btnLog = document.createElement('button');
        btnLog.className = 'sota-btn';
        btnLog.innerText = "📅 Logar no Daily";
        btnLog.onclick = function() { logToDaily(this); };
        col2.appendChild(btnLog);
    }

    // -- BARRA DE STATUS (INFERIOR) --
    const statusBar = panel.createDiv({ cls: "sota-status-bar" });
    
    if (note.processado) {
        let dataVisual = "";
        if (note.data_processamento) {
            const mData = window.moment(note.data_processamento.toString());
            dataVisual = mData.isValid() ? mData.format("DD/MM/YY") : note.data_processamento;
            if (note.hora_processamento) dataVisual += ` às ${note.hora_processamento}`;
        }
        statusBar.innerHTML = `<span class="sota-status-green">🟢 PROCESSADO</span><br><small style="color:var(--text-faint)">Em ${dataVisual}</small>`;
    } else {
        statusBar.innerHTML = `<span class="sota-status-yellow">🟡 PENDENTE</span><br><small style="color:var(--text-faint)">Aguardando revisão</small>`;
    }

    container.appendChild(panel);
}

render();