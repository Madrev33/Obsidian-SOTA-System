// 99 - BACKEND/Scripts/Views/Daily/renderXpBreakdown.js
// SOTA v2.4 - Painel de Análise (New Sources & Layout Fix)
// Adiciona Treino e Sono na origem e corrige quebra de linha do XP.

async function main(dv) {
    const page = dv.current();
    if (!page) return;

    const dataDoDia = page.file.name;
    const metricsPath = `99 - BACKEND/Logs_Metricas/Daily/Processed/${dataDoDia}_metrics.md`;
    const metricsFile = dv.page(metricsPath);
    
    const container = dv.container;
    container.innerHTML = "";

    if (!metricsFile) {
        container.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--text-muted);">⏳ Aguardando Processamento do Dia...</div>`;
        return;
    }
    
    const xp = metricsFile.xp_breakdown || {};
    const sono = metricsFile.sono_breakdown || {};

    // --- HELPERS VISUAIS ---
    const getPilarDominante = () => {
        if (!xp.pilares) return { cor: 'var(--text-normal)', nome: '' };
        const pilares = Object.entries(xp.pilares);
        if (pilares.length === 0) return { cor: 'var(--text-normal)', nome: '' };
        
        const [nome, _] = pilares.reduce((a, b) => a[1] > b[1] ? a : b);
        
        if (nome === 'genio') return { cor: '#3498db', nome: 'Intelecto' };
        if (nome === 'saude') return { cor: '#2ecc71', nome: 'Vitalidade' };
        if (nome === 'paz') return { cor: '#f1c40f', nome: 'Espírito' };
        return { cor: 'var(--text-normal)', nome: '' };
    };
    const pilarDominante = getPilarDominante();

    const getSonoAnalise = () => {
        const score = sono.score_final || 0;
        if (score >= 80) return { tipo: "tip", titulo: "Análise S.O.T.A.", texto: "Ótima recuperação. Boa higiene e duração ideal." };
        if (score >= 50) return { tipo: "caution", titulo: "Análise S.O.T.A.", texto: "Recuperação moderada. Analise as penalidades e hábitos." };
        return { tipo: "danger", titulo: "Análise S.O.T.A.", texto: "Alerta de recuperação baixa. Revise suas rotinas." };
    };
    const analiseSono = getSonoAnalise();

    // Limpa nome da tarefa
    const formatarNomeDestaque = (nomeBruto) => {
        if (!nomeBruto || nomeBruto === 'N/A') return 'N/A';
        return nomeBruto
            .replace(/✅\s*\d{4}-\d{2}-\d{2}.*/, '')
            .replace(/📅.*/, '')
            .replace(/\^.*/, '')
            .replace(/\[🍅.*?\]/g, '')
            .replace(/\*\*/g, '')
            .trim();
    };

    // --- CSS ---
    const style = document.createElement('style');
    style.textContent = `
        .sota-breakdown-wrapper { display: flex; flex-direction: column; gap: 20px; font-family: var(--font-ui); color: var(--text-normal); margin-top: 10px; }
        .sota-main-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: stretch; }
        .sota-section-card { background: var(--background-secondary); border: 1px solid var(--background-modifier-border); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 15px; }
        .sota-left-column { display: flex; flex-direction: column; gap: 20px; }
        .sota-section-header { font-size: 1.1em; font-weight: 700; color: var(--text-muted); border-bottom: 1px solid var(--background-modifier-border); padding-bottom: 10px; margin-bottom: 5px; display: flex; align-items: center; gap: 8px; }
        .sota-kpi-main { text-align: center; }
        .sota-kpi-main .value { font-size: 2.8em; font-weight: 800; line-height: 1; }
        .sota-kpi-main .label { font-size: 0.8em; color: var(--text-muted); }
        .sota-progress-group { display: flex; flex-direction: column; gap: 10px; }
        .sota-progress-row { display: flex; align-items: center; gap: 10px; font-size: 0.9em; }
        .sota-progress-row .label { width: 80px; font-weight: 600; }
        .sota-progress-row .bar-container { flex: 1; height: 8px; background: var(--background-modifier-border); border-radius: 4px; }
        .sota-progress-row .bar-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease-out; }
        .sota-progress-row .values { font-family: var(--font-monospace); font-size: 0.9em; text-align: right; min-width: 50px; color: var(--text-muted); }
        .sota-list-group { font-size: 0.9em; }
        .sota-list-group .list-title { font-weight: 600; margin-bottom: 8px; }
        .sota-list-group ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
        .sota-list-group li { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
        /* FIX DE QUEBRA DE LINHA */
        .sota-list-group .value { font-weight: 700; font-family: var(--font-monospace); white-space: nowrap; flex-shrink: 0; }
        .sota-list-group .label-icon { display: flex; align-items: center; gap: 8px; overflow: hidden; text-overflow: ellipsis; }
        .sota-list-group.grow { flex-grow: 1; display: flex; flex-direction: column; }
        .sota-list-group.grow ul { flex-grow: 1; justify-content: center; }

        .sota-callout { padding: 15px; border-radius: 8px; font-size: 0.85em; border-left: 4px solid; margin-top: auto; }
        .sota-callout.tip { border-color: var(--color-green); background: rgba(var(--color-green-rgb), 0.1); }
        .sota-callout.caution { border-color: var(--color-yellow); background: rgba(var(--color-yellow-rgb), 0.1); }
        .sota-callout.danger { border-color: var(--color-red); background: rgba(var(--color-red-rgb), 0.1); }
        .sota-callout-title { font-weight: bold; margin-bottom: 5px; }
        @media (max-width: 800px) { .sota-main-grid { grid-template-columns: 1fr; } }
    `;
    container.appendChild(style);
    
    // --- RENDERIZAÇÃO ---
    const mainWrapper = document.createElement('div');
    mainWrapper.className = 'sota-breakdown-wrapper';

    const performanceHeader = `
        <div class="sota-section-card">
            <div class="sota-section-header">🏆 Performance do Dia</div>
            <div class="sota-kpi-main">
                <div class="value" style="color: ${pilarDominante.cor};">${xp.total || 0} XP</div>
                <div class="label">${pilarDominante.nome ? `Pilar Dominante: ${pilarDominante.nome}` : ''}</div>
            </div>
            <div class="sota-progress-group">
                <div class="sota-progress-row">
                    <div class="label">Intelecto</div>
                    <div class="bar-container"><div class="bar-fill" style="width: ${xp.total > 0 ? (xp.pilares?.genio / xp.total * 100) : 0}%; background: #3498db;"></div></div>
                    <div class="values">${xp.pilares?.genio || 0} XP</div>
                </div>
                <div class="sota-progress-row">
                    <div class="label">Vitalidade</div>
                    <div class="bar-container"><div class="bar-fill" style="width: ${xp.total > 0 ? (xp.pilares?.saude / xp.total * 100) : 0}%; background: #2ecc71;"></div></div>
                    <div class="values">${xp.pilares?.saude || 0} XP</div>
                </div>
                <div class="sota-progress-row">
                    <div class="label">Espírito</div>
                    <div class="bar-container"><div class="bar-fill" style="width: ${xp.total > 0 ? (xp.pilares?.paz / xp.total * 100) : 0}%; background: #f1c40f;"></div></div>
                    <div class="values">${xp.pilares?.paz || 0} XP</div>
                </div>
            </div>
        </div>
    `;

    const mainGrid = document.createElement('div');
    mainGrid.className = 'sota-main-grid';
    
    // --- COLUNA ESQUERDA ---
    // Adicionado Treino e Sono na lista
    const leftColumn = document.createElement('div');
    leftColumn.className = 'sota-left-column';
    
    leftColumn.innerHTML = `
        <div class="sota-section-card">
            <div class="sota-list-group">
                <div class="list-title">Origem do Esforço</div>
                <ul>
                    <li><span class="label-icon">🍅 Foco (Mental)</span> <span class="value">${xp.fontes?.foco || 0} XP</span></li>
                    <li><span class="label-icon">🏋️‍♂️ Treino (Físico)</span> <span class="value">${xp.fontes?.treino || 0} XP</span></li>
                    <li><span class="label-icon">✅ Tarefas</span> <span class="value">${xp.fontes?.tarefas || 0} XP</span></li>
                    <li><span class="label-icon">💤 Sono</span> <span class="value">${xp.fontes?.sono || 0} XP</span></li>
                    <li><span class="label-icon">💪 Hábitos</span> <span class="value">${xp.fontes?.habitos || 0} XP</span></li>
                    <li><span class="label-icon">✨ Eventos</span> <span class="value">${xp.fontes?.eventos || 0} XP</span></li>
                </ul>
            </div>
        </div>
        <div class="sota-section-card" style="flex-grow: 1;">
            <div class="sota-list-group grow">
                <div class="list-title">Destaques do Dia</div>
                <ul>
                    <li><span class="label-icon">🏆 Tarefa de Ouro: "${formatarNomeDestaque(xp.destaques?.tarefa?.nome)}"</span> <span class="value">+${xp.destaques?.tarefa?.xp || 0} XP</span></li>
                    <li><span class="label-icon">⭐ Hábito de Ouro: "${xp.destaques?.habito?.nome || 'N/A'}"</span> <span class="value">+${xp.destaques?.habito?.xp || 0} XP</span></li>
                </ul>
            </div>
        </div>
    `;
    mainGrid.appendChild(leftColumn);

    // --- COLUNA DIREITA ---
    const recoveryCard = document.createElement('div');
    recoveryCard.className = 'sota-section-card';
    recoveryCard.innerHTML = `
        <div class="sota-section-header">💤 Análise do Sono</div>
        <div class="sota-kpi-main">
            <div class="value" style="color: hsl(${(sono.score_final || 0) * 1.2}, 85%, 55%);">${sono.score_final || 0}%</div>
            <div class="label">Qualidade de Recuperação</div>
        </div>
        <div class="sota-list-group">
             <div class="list-title">Cálculo do Score:</div>
            <ul>
                <li><span>Higiene (${(sono.componentes?.higiene?.score || 0) / 10}/5)</span> <span class="value">+${sono.componentes?.higiene?.score || 0} pts</span></li>
                <li><span>Duração (${sono.componentes?.duracao?.horas || 0}h)</span> <span class="value">+${sono.componentes?.duracao?.score || 0} pts</span></li>
                ${(sono.ajustes?.penalidade_interrupcoes < 0) ? `<li><span>Penalidade (Interrupções)</span> <span class="value" style="color: var(--color-red);">${sono.ajustes?.penalidade_interrupcoes || 0} pts</span></li>` : ''}
                ${(sono.ajustes?.penalidade_atividade_madrugada < 0) ? `<li><span>Penalidade (Atividade Madrugada)</span> <span class="value" style="color: var(--color-red);">${sono.ajustes?.penalidade_atividade_madrugada || 0} pts</span></li>` : ''}
            </ul>
        </div>
        <div class="sota-callout ${analiseSono.tipo}">
            <div class="sota-callout-title">${analiseSono.titulo}</div>
            <div>${analiseSono.texto}</div>
        </div>
    `;
    mainGrid.appendChild(recoveryCard);

    mainWrapper.innerHTML = performanceHeader;
    mainWrapper.appendChild(mainGrid);
    container.appendChild(mainWrapper);
}

await main(dv);