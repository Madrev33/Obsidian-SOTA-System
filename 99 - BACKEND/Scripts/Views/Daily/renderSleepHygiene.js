// 99 - BACKEND/Scripts/Views/Daily/renderSleepHygiene.js
// SOTA v2.0 - Painel de Higiene do Sono (Atomic Save Engine)
// Implementa botão de registro para evitar "flick" e salvar todas as mudanças de uma vez.

async function main(dv) {
    const app = dv.app;
    const page = dv.current();
    if (!page) return;

    const file = app.vault.getAbstractFileByPath(page.file.path);
    if (!file) return dv.paragraph("❌ Arquivo não encontrado.");

    const container = dv.container;
    container.innerHTML = "";

    // --- 1. CONFIGURAÇÃO DOS PILARES (Inalterado) ---
    const hygieneHabits = [
        { key: "higiene_luz_solar_manha", label: "Luz Solar Matinal", desc: "Cortisol (10-30min)", icon: "🌅" },
        { key: "higiene_cafeina_off_15h", label: "Zero Cafeína > 15h", desc: "Proteção Adenosina", icon: "🛑" },
        { key: "higiene_luz_ambiente_noturna", label: "Luz Baixa/Amarela > 18h", desc: "Início Melatonina", icon: "🌆" },
        { key: "higiene_sem_telas_antes_dormir", label: "Sem Telas (1h Antes de Dormir)", desc: "Zero Blue Light", icon: "📵" },
        { key: "higiene_ambiente_sono_otimizado", label: "Quarto Escuro", desc: "Caverna Total", icon: "🛌" }
    ];

    // --- 2. ESTADO INICIAL E TEMPORÁRIO ---
    const initialState = {};
    const tempState = {};
    hygieneHabits.forEach(h => {
        initialState[h.key] = page[h.key] === true;
        tempState[h.key] = initialState[h.key];
    });

    // --- 3. FUNÇÃO DE SALVAMENTO ATÔMICO ---
    const saveAllToFrontmatter = async (buttonEl) => {
        buttonEl.textContent = "Salvando...";
        buttonEl.disabled = true;

        try {
            await app.fileManager.processFrontMatter(file, (fm) => {
                hygieneHabits.forEach(h => {
                    fm[h.key] = tempState[h.key];
                });
            });

            // Atualiza o estado inicial após salvar
            hygieneHabits.forEach(h => { initialState[h.key] = tempState[h.key]; });

            buttonEl.textContent = "✔ Registrado";
            buttonEl.classList.remove('pending');
            buttonEl.classList.add('saved');
            
            new obsidian.Notice(`✅ Higiene do Sono registrada!`);

        } catch (e) {
            console.error("Erro ao salvar Higiene do Sono:", e);
            new obsidian.Notice("❌ Erro ao salvar.");
            buttonEl.textContent = "Tentar Novamente";
            buttonEl.classList.add('pending');
            buttonEl.disabled = false;
        }
    };

    // --- 4. CSS (Adicionado estilo para o botão de salvar) ---
    const style = document.createElement('style');
    style.textContent = `
        .sota-hygiene-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-top: 10px; }
        .sota-hygiene-card {
            background-color: var(--background-secondary); border: 1px solid var(--background-modifier-border); border-radius: 8px;
            display: flex; flex-direction: column; justify-content: space-between; text-align: center; cursor: pointer;
            transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94); position: relative; overflow: hidden; min-height: 110px;
        }
        .sota-hygiene-card:hover { transform: translateY(-2px); box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
        .sota-h-content { padding: 15px 10px; flex-grow: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .sota-h-icon { font-size: 1.8em; margin-bottom: 5px; transition: transform 0.2s; }
        .sota-h-label { font-weight: 700; font-size: 0.85em; color: var(--text-normal); line-height: 1.2; margin-bottom: 3px; }
        .sota-h-desc { font-size: 0.7em; color: var(--text-muted); opacity: 0.8; }
        .sota-h-status-bar { width: 100%; padding: 6px 0; font-size: 0.75em; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: white; transition: background-color 0.3s; display: flex; align-items: center; justify-content: center; gap: 5px; }
        .sota-hygiene-card .sota-h-status-bar { background-color: var(--background-modifier-error); }
        .sota-hygiene-card .sota-h-status-bar::after { content: "Pendente"; }
        .sota-hygiene-card.active .sota-h-status-bar { background-color: var(--color-green); }
        .sota-hygiene-card.active .sota-h-status-bar::after { content: "Concluído"; }
        .sota-hygiene-card.active { border-color: var(--color-green); box-shadow: 0 0 10px rgba(var(--color-green-rgb), 0.15); }
        .sota-hygiene-card.active .sota-h-icon { transform: scale(1.1); }
        .sota-hygiene-card.active .sota-h-label { color: var(--color-green); }
        .sota-save-btn { width: 100%; padding: 10px; font-weight: 700; border: none; border-radius: 8px; cursor: pointer; transition: all 0.3s; margin-top: 15px; }
        .sota-save-btn.pending { background: var(--color-red); color: white; }
        .sota-save-btn.pending:hover { background: var(--color-red-hover); }
        .sota-save-btn.saved { background: var(--color-green); color: white; cursor: default; }
    `;
    container.appendChild(style);

    // --- 5. RENDERIZAÇÃO ---
    const wrapper = document.createElement('div');
    const grid = document.createElement('div');
    grid.className = 'sota-hygiene-grid';
    
    // Botão de Salvar (criado antes para referência)
    const saveButton = document.createElement('button');
    saveButton.className = 'sota-save-btn';

    const updateSaveButtonState = (state) => {
        if (state === 'pending') {
            saveButton.textContent = "Registrar Higiene do Sono";
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
    
    // Lógica de clique que apenas atualiza o estado temporário
    const handleCardClick = (key, cardElement) => {
        tempState[key] = !tempState[key];
        cardElement.classList.toggle('active', tempState[key]);
        updateSaveButtonState('pending');
    };
    
    // Renderiza os cards
    hygieneHabits.forEach(h => {
        const card = document.createElement('div');
        card.className = `sota-hygiene-card ${tempState[h.key] ? 'active' : ''}`;
        
        card.innerHTML = `
            <div class="sota-h-content">
                <div class="sota-h-icon">${h.icon}</div>
                <div class="sota-h-label">${h.label}</div>
                <div class="sota-h-desc">${h.desc}</div>
            </div>
            <div class="sota-h-status-bar"></div>
        `;

        card.onclick = () => handleCardClick(h.key, card);
        grid.appendChild(card);
    });

    // Define estado inicial do botão
    const hasChanges = JSON.stringify(initialState) !== JSON.stringify(tempState);
    if (hasChanges) {
        updateSaveButtonState('pending');
    } else {
        updateSaveButtonState('saved');
    }
    
    saveButton.onclick = () => saveAllToFrontmatter(saveButton);

    wrapper.appendChild(grid);
    wrapper.appendChild(saveButton);
    container.appendChild(wrapper);
}

await main(dv);