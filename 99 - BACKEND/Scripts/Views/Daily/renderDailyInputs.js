// 99 - BACKEND/Scripts/Views/Daily/renderDailyInputs.js
// SOTA v5.0 - Atomic Save Engine (UI Simplificada)
// Remove Humor e Energia, focando apenas no registro de acontecimentos.

async function main(dv, input) {
    const page = dv.current();
    if (!page) return;
    
    const file = app.vault.getAbstractFileByPath(page.file.path);
    if (!file) return dv.paragraph("❌ Arquivo não encontrado.");

    if (!input || !input.periodo) return dv.paragraph("❌ Período não informado.");

    const periodo = input.periodo.toLowerCase();
    
    // --- 1. DEFINIÇÃO DAS CHAVES E ESTADO INICIAL (SIMPLIFICADO) ---
    const fmKeyAcontecimento = `acontecimento_${periodo}`;

    const currentState = {
        texto: page[fmKeyAcontecimento] || ""
    };

    // A função agora verifica apenas o campo de texto
    const isDataFilled = () => {
        return (currentState.texto && currentState.texto.trim() !== "");
    };

    // --- 2. FUNÇÃO DE SALVAMENTO ATÔMICO (SIMPLIFICADA) ---
    const saveAllToFrontmatter = async (buttonEl) => {
        buttonEl.textContent = "Salvando...";
        buttonEl.disabled = true;

        try {
            await app.fileManager.processFrontMatter(file, (fm) => {
                fm[fmKeyAcontecimento] = currentState.texto;
            });

            buttonEl.textContent = "✔ Registrado";
            buttonEl.classList.remove('pending');
            buttonEl.classList.add('saved');
            
            new obsidian.Notice(`✅ Registro da ${periodo} salvo!`);

        } catch (e) {
            console.error("SOTA Daily Input Save Error:", e);
            new obsidian.Notice("❌ Erro ao salvar. Tente novamente.");
            buttonEl.textContent = "Tentar Novamente";
            buttonEl.classList.add('pending');
            buttonEl.disabled = false;
        }
    };
    
    // --- 3. RENDERIZAÇÃO DA UI ---
    const container = dv.container;
    container.innerHTML = "";
    
    // CSS (Simplificado)
    const style = document.createElement('style');
    style.textContent = `
        .sota-input-wrapper { display: flex; flex-direction: column; gap: 10px; padding: 5px 0; }
        .sota-section-title { font-size: 0.9em; font-weight: 700; color: var(--text-normal); }
        
        textarea.sota-textarea { 
            width: 100%; min-height: 120px; padding: 10px; border-radius: 6px; resize: vertical; 
            border: 1px solid var(--background-modifier-border);
            background-color: var(--background-secondary);
        }
        
        .sota-actions-container { display: flex; flex-direction: column; align-items: center; gap: 8px; margin-top: 10px; }
        .sota-save-btn { width: 100%; padding: 10px; font-weight: 700; border: none; border-radius: 8px; cursor: pointer; transition: all 0.3s; }
        .sota-save-btn.pending { background: var(--color-red); color: white; }
        .sota-save-btn.pending:hover { background: var(--color-red-hover); }
        .sota-save-btn.saved { background: var(--color-green); color: white; cursor: default; }
        .sota-review-warning { font-size: 0.75em; color: var(--text-muted); font-style: italic; opacity: 0.8; }
    `;
    container.appendChild(style);

    const wrapper = document.createElement('div');
    wrapper.className = 'sota-input-wrapper';

    // --- CAMPO DE TEXTO ÚNICO ---
    const textSection = document.createElement('div');
    textSection.innerHTML = `<div class="sota-section-title">O que aconteceu?</div>`;
    const textArea = document.createElement('textarea');
    textArea.className = 'sota-textarea';
    textArea.value = currentState.texto;
    textArea.placeholder = "Descreva os destaques deste período...";
    
    textSection.appendChild(textArea);
    
    // --- BOTÃO DE REGISTRO E AVISO ---
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'sota-actions-container';

    const saveButton = document.createElement('button');
    saveButton.className = 'sota-save-btn';
    
    const updateSaveButtonState = (state) => {
        if (state === 'pending') {
            saveButton.textContent = "Registrar Período";
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
    
    textArea.oninput = (e) => {
        currentState.texto = e.target.value;
        updateSaveButtonState('pending');
    };
    
    saveButton.onclick = () => saveAllToFrontmatter(saveButton);
    
    const warningSpan = document.createElement('span');
    warningSpan.className = 'sota-review-warning';
    warningSpan.innerText = "Atenção, não mude de arquivo antes de clicar em 'Registrar' para não perder o progresso.";
    
    actionsContainer.append(saveButton, warningSpan);

    // --- MONTAGEM FINAL ---
    wrapper.append(textSection, actionsContainer);
    container.appendChild(wrapper);

    // Lógica do estado inicial do botão
    if (isDataFilled()) {
        updateSaveButtonState('saved');
    } else {
        updateSaveButtonState('pending');
    }
}

await main(dv, input);