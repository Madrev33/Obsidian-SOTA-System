// 99 - BACKEND/Scripts/Views/Daily/renderSleepInputs.js
// SOTA v5.0 - Sleep Dashboard (Atomic Save Engine)
// Implementa botão de registro para eliminar "flick" e adiciona títulos de seção.

async function main(dv) {
    const app = dv.app;
    const page = dv.current();
    if (!page) return;
    
    const file = app.vault.getAbstractFileByPath(page.file.path);
    if (!file) return dv.paragraph("❌ Arquivo não encontrado.");

    // --- 1. DEFINIÇÃO DAS CHAVES E ESTADO INICIAL ---
    const currentState = {
        horaDormir: page.hora_dormir_ontem || "00:00", 
        horaAcordar: page.hora_acordar_hoje || "08:00",
        totalHoras: page.total_horas_sono || "08:00",
        interrompido: page.sono_interrupcoes === true, // Garante booleano
        qualidade: page.sono_qualidade_percebida || 5,
        disposicao: page.sono_disposicao_acordar || 5,
        humor: page.humor_acordar || 3 
    };
    
    // Verifica se os dados já foram salvos (diferente do padrão)
    const isDataFilled = () => {
        return (
            currentState.horaDormir !== "00:00" ||
            currentState.horaAcordar !== "08:00" ||
            currentState.interrompido !== false ||
            currentState.qualidade !== 5 ||
            currentState.disposicao !== 5 ||
            currentState.humor !== 3
        );
    };

    // --- 2. FUNÇÃO DE SALVAMENTO ATÔMICO ---
    const saveAllToFrontmatter = async (buttonEl) => {
        buttonEl.textContent = "Salvando...";
        buttonEl.disabled = true;

        try {
            await app.fileManager.processFrontMatter(file, (fm) => {
                fm.hora_dormir_ontem = currentState.horaDormir;
                fm.hora_acordar_hoje = currentState.horaAcordar;
                fm.total_horas_sono = currentState.totalHoras;
                fm.sono_interrupcoes = currentState.interrompido;
                fm.sono_qualidade_percebida = currentState.qualidade;
                fm.sono_disposicao_acordar = currentState.disposicao;
                fm.humor_acordar = currentState.humor;
            });

            buttonEl.textContent = "✔ Registrado";
            buttonEl.classList.remove('pending');
            buttonEl.classList.add('saved');
            
            new obsidian.Notice(`✅ Registro de Sono salvo!`);

        } catch (e) {
            console.error("SOTA Sleep Input Save Error:", e);
            new obsidian.Notice("❌ Erro ao salvar. Tente novamente.");
            buttonEl.textContent = "Tentar Novamente";
            buttonEl.classList.add('pending');
            buttonEl.disabled = false;
        }
    };
    
    // --- 3. RENDERIZAÇÃO DA UI ---
    const container = dv.container;
    container.innerHTML = "";

    // CSS
    const style = document.createElement('style');
    style.textContent = `
        /* Layout & Títulos */
        .sota-sleep-wrapper { display: flex; flex-direction: column; gap: 20px; padding: 5px 0; }
        .sota-section { display: flex; flex-direction: column; gap: 8px; }
        .sota-section-title { font-size: 0.8em; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }
        
        /* Relógios */
        .sota-clock-row { display: flex; gap: 10px; justify-content: space-between; }
        .sota-clock-box { flex: 1; background: var(--background-secondary); border: 1px solid var(--background-modifier-border); border-radius: 12px; padding: 10px; display: flex; flex-direction: column; align-items: center; position: relative; min-height: 85px; }
        .sota-clock-label { font-size: 0.7em; color: var(--text-muted); font-weight: 600; margin-bottom: 5px; text-transform: uppercase; }
        .sota-clock-display { display: flex; align-items: center; gap: 5px; font-family: var(--font-monospace); font-size: 2.2em; font-weight: bold; color: var(--text-normal); cursor: pointer; padding: 5px 15px; border-radius: 8px; transition: background 0.2s; }
        .sota-clock-display:hover { background: var(--background-primary); }
        .sota-time-part { padding: 2px 5px; border-radius: 4px; transition: color 0.2s; }
        .sota-time-part:hover { color: var(--interactive-accent); background: rgba(var(--interactive-accent-rgb), 0.1); }
        .sota-time-grid-overlay { display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px; width: 100%; animation: fadeIn 0.2s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
        .sota-grid-btn { background: var(--background-primary); border: 1px solid var(--background-modifier-border); border-radius: 4px; padding: 6px 0; text-align: center; font-size: 0.9em; font-weight: 600; cursor: pointer; color: var(--text-muted); }
        .sota-grid-btn:hover, .sota-grid-btn.active { background: var(--interactive-accent); color: white; border-color: var(--interactive-accent); }
        .sota-total-badge { align-self: center; background: rgba(var(--interactive-accent-rgb), 0.15); color: var(--interactive-accent); border: 1px solid var(--interactive-accent); padding: 6px 16px; border-radius: 20px; font-size: 0.9em; font-weight: bold; margin-top: 1px; z-index: 2; }

        /* Hybrid Row */
        .sota-hybrid-row { display: grid; grid-template-columns: 1fr 2fr; gap: 15px; align-items: stretch; }
        
        /* Botões Sim/Não */
        .sota-toggle-card { background: var(--background-secondary); border: 1px solid var(--background-modifier-border); border-radius: 10px; padding: 15px; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 12px; }
        .sota-toggle-title { font-weight: 600; font-size: 0.85em; color: var(--text-normal); text-align: center; white-space: nowrap; }
        .sota-binary-group { display: flex; gap: 8px; width: 100%; }
        .sota-binary-btn { flex: 1; padding: 8px 0; border-radius: 6px; font-size: 0.9em; font-weight: 600; cursor: pointer; text-align: center; border: 1px solid var(--background-modifier-border); background: var(--background-primary); color: var(--text-muted); transition: all 0.2s; }
        .sota-binary-btn:hover { background: var(--background-modifier-hover); color: var(--text-normal); }
        .sota-binary-btn.active-no { background: rgba(var(--color-green-rgb), 0.15); border-color: var(--color-green); color: var(--color-green); }
        .sota-binary-btn.active-yes { background: rgba(var(--color-red-rgb), 0.15); border-color: var(--color-red); color: var(--color-red); }

        /* Sliders */
        .sota-sliders-column { display: flex; flex-direction: column; gap: 10px; }
        .sota-slider-compact { background: var(--background-secondary); border: 1px solid var(--background-modifier-border); border-radius: 10px; padding: 8px 15px; display: flex; flex-direction: column; }
        .sota-slider-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px; }
        .sota-slider-label { font-size: 0.7em; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }
        .sota-slider-val { font-size: 1em; font-weight: bold; color: var(--text-normal); }
        input[type=range].sota-slider { -webkit-appearance: none; width: 100%; height: 5px; border-radius: 3px; outline: none; margin: 5px 0; cursor: pointer; display: block; }
        input[type=range].sota-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #fff; border: 2px solid var(--background-primary); box-shadow: 0 2px 5px rgba(0,0,0,0.3); cursor: grab; }

        /* Humor Grid */
        .sota-humor-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
        .sota-humor-btn { background: var(--background-secondary); border: 1px solid var(--background-modifier-border); border-radius: 8px; height: 65px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; cursor: pointer; transition: all 0.2s; }
        .sota-humor-btn:hover { background: var(--background-modifier-hover); }
        .sota-humor-btn.active { border-color: var(--interactive-accent); background: rgba(var(--interactive-accent-rgb), 0.1); box-shadow: 0 0 0 1px var(--interactive-accent); }
        .sota-humor-icon { font-size: 1.3em; }
        .sota-humor-label { font-size: 0.7em; font-weight: 500; opacity: 0.9; }

        /* Botão Salvar */
        .sota-save-btn { width: 100%; padding: 10px; font-weight: 700; border: none; border-radius: 8px; cursor: pointer; transition: all 0.3s; margin-top: 15px; }
        .sota-save-btn.pending { background: var(--color-red); color: white; }
        .sota-save-btn.pending:hover { background: var(--color-red-hover); }
        .sota-save-btn.saved { background: var(--color-green); color: white; cursor: default; }
    `;
    container.appendChild(style);

    const wrapper = document.createElement('div');
    wrapper.className = 'sota-sleep-wrapper';

    // --- SEÇÃO 1: HORÁRIOS ---
    const timeSection = document.createElement('div');
    timeSection.className = 'sota-section';
    timeSection.innerHTML = `<div class="sota-section-title">Horário de Sono</div>`;
    const timeRow = document.createElement('div');
    timeRow.className = 'sota-clock-row';
    const totalBadge = document.createElement('div');
    totalBadge.className = 'sota-total-badge';

    const calcularHoras = (dormir, acordar) => {
        let [h1, m1] = dormir.split(':').map(Number); let [h2, m2] = acordar.split(':').map(Number);
        let minDormir = h1 * 60 + m1; let minAcordar = h2 * 60 + m2;
        if (minAcordar < minDormir) minAcordar += 1440; 
        const diff = minAcordar - minDormir;
        return `${Math.floor(diff/60).toString().padStart(2,'0')}:${(diff%60).toString().padStart(2,'0')}`;
    };

    const updateDisplay = () => {
        currentState.totalHoras = calcularHoras(currentState.horaDormir, currentState.horaAcordar);
        totalBadge.innerHTML = `⏱️ ${currentState.totalHoras} horas`;
    };
    
    const handleTimeChange = () => { updateDisplay(); updateSaveButtonState('pending'); };
    const createGridClock = (label, key, onChange) => { /* ... (código do relógio, sem alterações) ... */
        const box = document.createElement('div');
        box.className = 'sota-clock-box';
        let [hh, mm] = currentState[key].split(':');
        let viewMode = 'display';
        const render = () => {
            box.innerHTML = `<div class="sota-clock-label">${label}</div>`;
            if (viewMode === 'display') {
                const display = document.createElement('div'); display.className = 'sota-clock-display';
                const spanH = document.createElement('span'); spanH.className = 'sota-time-part'; spanH.innerText = hh;
                spanH.onclick = () => { viewMode = 'grid-h'; render(); };
                const spanM = document.createElement('span'); spanM.className = 'sota-time-part'; spanM.innerText = mm;
                spanM.onclick = () => { viewMode = 'grid-m'; render(); };
                display.append(spanH, ":", spanM);
                box.appendChild(display);
            } else if (viewMode === 'grid-h') {
                const grid = document.createElement('div'); grid.className = 'sota-time-grid-overlay';
                for(let i=0; i<24; i++) {
                    const val = i.toString().padStart(2,'0');
                    const btn = document.createElement('div'); btn.className = `sota-grid-btn ${val===hh?'active':''}`; btn.innerText = val;
                    btn.onclick = () => { hh = val; currentState[key] = `${hh}:${mm}`; viewMode = 'display'; onChange(); render(); };
                    grid.appendChild(btn);
                }
                box.appendChild(grid);
            } else if (viewMode === 'grid-m') {
                const grid = document.createElement('div'); grid.className = 'sota-time-grid-overlay';
                for(let i=0; i<60; i+=5) {
                    const val = i.toString().padStart(2,'0');
                    const btn = document.createElement('div'); btn.className = `sota-grid-btn ${Math.abs(parseInt(val)-parseInt(mm))<3?'active':''}`; btn.innerText = val;
                    btn.onclick = () => { mm = val; currentState[key] = `${hh}:${mm}`; viewMode = 'display'; onChange(); render(); };
                    grid.appendChild(btn);
                }
                box.appendChild(grid);
            }
        };
        render();
        return box;
    };
    
    timeRow.appendChild(createGridClock("Dormiu às", "horaDormir", handleTimeChange));
    timeRow.appendChild(createGridClock("Acordou às", "horaAcordar", handleTimeChange));
    timeSection.appendChild(timeRow);
    timeSection.appendChild(totalBadge);
    updateDisplay();

    // --- SEÇÃO 2: HUMOR AO ACORDAR ---
    const humorSection = document.createElement('div');
    humorSection.className = 'sota-section';
    humorSection.innerHTML = `<div class="sota-section-title">Humor ao Acordar</div>`;
    const humorGrid = document.createElement('div');
    humorGrid.className = 'sota-humor-grid';
    const humores = [ { val: 1, icon: "😖", label: "Péssimo" }, { val: 2, icon: "😔", label: "Baixo" }, { val: 3, icon: "🙂", label: "Normal" }, { val: 4, icon: "😃", label: "Bem" }, { val: 5, icon: "🤩", label: "Ótimo" } ];
    humores.forEach(h => {
        const btn = document.createElement('div');
        btn.className = `sota-humor-btn ${currentState.humor === h.val ? 'active' : ''}`;
        btn.innerHTML = `<span class="sota-humor-icon">${h.icon}</span><span class="sota-humor-label">${h.label}</span>`;
        btn.onclick = () => {
            currentState.humor = h.val;
            humorGrid.querySelectorAll('.sota-humor-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateSaveButtonState('pending');
        };
        humorGrid.appendChild(btn);
    });
    humorSection.appendChild(humorGrid);
    
    // --- SEÇÃO 3: QUALIDADE DO SONO ---
    const qualitySection = document.createElement('div');
    qualitySection.className = 'sota-section';
    qualitySection.innerHTML = `<div class="sota-section-title">Qualidade do Sono</div>`;
    const hybridRow = document.createElement('div');
    hybridRow.className = 'sota-hybrid-row';
    const toggleCard = document.createElement('div');
    toggleCard.className = 'sota-toggle-card';
    toggleCard.innerHTML = `<div class="sota-toggle-title">Acordou durante a noite?</div>`;
    const binaryGroup = document.createElement('div');
    binaryGroup.className = 'sota-binary-group';
    const btnYes = document.createElement('div'); btnYes.className = `sota-binary-btn ${currentState.interrompido ? 'active-yes' : ''}`; btnYes.innerText = "Sim";
    const btnNo = document.createElement('div'); btnNo.className = `sota-binary-btn ${!currentState.interrompido ? 'active-no' : ''}`; btnNo.innerText = "Não";
    btnYes.onclick = () => { currentState.interrompido = true; btnYes.classList.add('active-yes'); btnNo.classList.remove('active-no'); updateSaveButtonState('pending'); };
    btnNo.onclick = () => { currentState.interrompido = false; btnNo.classList.add('active-no'); btnYes.classList.remove('active-yes'); updateSaveButtonState('pending'); };
    binaryGroup.append(btnYes, btnNo);
    toggleCard.appendChild(binaryGroup);
    
    const slidersColumn = document.createElement('div');
    slidersColumn.className = 'sota-sliders-column';
    const createCompactSlider = (label, key, initialVal) => { /* ... (código do slider, sem alterações) ... */
        const box = document.createElement('div');
        box.className = 'sota-slider-compact';
        const header = document.createElement('div'); header.className = 'sota-slider-header';
        const labelEl = document.createElement('div'); labelEl.className = 'sota-slider-label'; labelEl.innerText = label;
        const valEl = document.createElement('div'); valEl.className = 'sota-slider-val'; valEl.innerText = initialVal;
        header.append(labelEl, valEl);
        const slider = document.createElement('input'); slider.type = 'range'; slider.className = 'sota-slider'; slider.min = 1; slider.max = 10; slider.value = initialVal;
        const updateVisual = (val) => {
            valEl.innerText = val;
            const pct = (val - 1) / 9; 
            const hue = pct * 120;
            const color = `hsl(${hue}, 85%, 45%)`;
            valEl.style.color = color;
            slider.style.background = `linear-gradient(to right, ${color} ${pct*100}%, var(--background-modifier-border) ${pct*100}%)`;
        };
        updateVisual(initialVal);
        slider.oninput = (e) => updateVisual(e.target.value);
        slider.onchange = (e) => { currentState[key] = parseInt(e.target.value); updateSaveButtonState('pending'); };
        box.append(header, slider);
        return box;
    };
    slidersColumn.appendChild(createCompactSlider("Qualidade Percebida Sono", "qualidade", currentState.qualidade));
    slidersColumn.appendChild(createCompactSlider("Disposição ao Acordar", "disposicao", currentState.disposicao));
    
    hybridRow.append(toggleCard, slidersColumn);
    qualitySection.appendChild(hybridRow);

    // --- BOTÃO DE REGISTRO ---
    const saveButton = document.createElement('button');
    saveButton.className = 'sota-save-btn';
    const updateSaveButtonState = (state) => {
        if (state === 'pending') {
            saveButton.textContent = "Registrar Sono";
            saveButton.classList.remove('saved');
            saveButton.classList.add('pending');
            saveButton.disabled = false;
        } else if (state === 'saved') {
            saveButton.textContent = "✔ Registrado";
            saveButton.classList.remove('pending');
            saveButton.classList.add('saved');
            saveButton.disabled = true;
        }
    };
    if (isDataFilled()) updateSaveButtonState('saved');
    else updateSaveButtonState('pending');
    saveButton.onclick = () => saveAllToFrontmatter(saveButton);
    
    // --- MONTAGEM FINAL ---
    wrapper.append(timeSection, humorSection, qualitySection, saveButton);
    container.appendChild(wrapper);
}

await main(dv);