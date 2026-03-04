// 99 - BACKEND/Scripts/Views/Daily/renderDailyReview.js
// SOTA v1.3 - Painel de Resumo do Dia (UI Focada)
// Remove botão extra e expande o botão de registro para largura total.

async function main(dv) {
    const app = dv.app;
    const page = dv.current();
    if (!page) return;

    const file = app.vault.getAbstractFileByPath(page.file.path);
    if (!file) return dv.paragraph("❌ Arquivo não encontrado.");

    const container = dv.container;
    container.innerHTML = "";

    // --- ESTADO TEMPORÁRIO (UI) ---
    const tempState = {
        oque_fez_hoje: page.oque_fez_hoje || "",
        oque_fazer_amanha: page.oque_fazer_amanha || "",
        feedback_positivo: page.feedback_positivo || "",
        feedback_negativo: page.feedback_negativo || ""
    };
    
    const hasInitialData = () => {
        return Object.values(tempState).some(val => val && val.trim() !== "");
    };

    // --- FUNÇÃO DE SALVAMENTO ATÔMICO ---
    const saveAllToFrontmatter = async (buttonEl) => {
        buttonEl.textContent = "Salvando...";
        buttonEl.disabled = true;

        try {
            await app.fileManager.processFrontMatter(file, (fm) => {
                fm.oque_fez_hoje = tempState.oque_fez_hoje;
                fm.oque_fazer_amanha = tempState.oque_fazer_amanha;
                fm.feedback_positivo = tempState.feedback_positivo;
                fm.feedback_negativo = tempState.feedback_negativo;
            });

            buttonEl.textContent = "✔ Registrado";
            buttonEl.classList.remove('pending');
            buttonEl.classList.add('saved');
            
            new obsidian.Notice(`✅ Resumo do dia registrado!`);

        } catch (e) {
            console.error("SOTA Daily Review Save Error:", e);
            new obsidian.Notice("❌ Erro ao salvar resumo.");
            buttonEl.textContent = "Tentar Novamente";
            buttonEl.classList.add('pending');
            buttonEl.disabled = false;
        }
    };
    
    // --- RENDERIZAÇÃO DA UI ---
    // CSS
    const style = document.createElement('style');
    style.textContent = `
        .sota-review-wrapper { display: flex; flex-direction: column; gap: 15px; margin-top: 10px; }
        .sota-review-field { display: flex; flex-direction: column; gap: 5px; }
        .sota-review-label { font-size: 0.9em; font-weight: 600; color: var(--text-normal); }
        .sota-review-textarea { 
            width: 100%; min-height: 80px; padding: 10px; border-radius: 6px; resize: vertical; 
            border: 1px solid var(--background-modifier-border); background-color: var(--background-secondary);
        }
        .sota-review-actions { display: flex; flex-direction: column; align-items: center; gap: 8px; margin-top: 20px; }
        .sota-review-warning { font-size: 0.75em; color: var(--text-muted); font-style: italic; opacity: 0.8; }
        
        /* Botão de Salvar com Largura Total */
        .sota-save-btn {
            width: 100%; /* << A MUDANÇA PRINCIPAL */
            padding: 12px; /* Padding maior para um botão mais robusto */
            font-weight: 700;
            font-size: 1em;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s;
        }
        .sota-save-btn.pending { background: var(--color-red); color: white; }
        .sota-save-btn.pending:hover { background: var(--color-red-hover); }
        .sota-save-btn.saved { background: var(--color-green); color: white; cursor: default; }
    `;
    container.appendChild(style);

    const wrapper = document.createElement('div');
    wrapper.className = 'sota-review-wrapper';

    const saveButton = document.createElement('button');
    saveButton.className = 'sota-save-btn';

    const updateSaveButtonState = (state) => {
        if (state === 'pending') {
            saveButton.textContent = "Registrar Resumo";
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

    // Função para criar cada campo
    const createField = (label, key) => {
        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'sota-review-field';
        
        const labelEl = document.createElement('label');
        labelEl.className = 'sota-review-label';
        labelEl.innerText = label;
        
        const textarea = document.createElement('textarea');
        textarea.className = 'sota-review-textarea';
        textarea.value = tempState[key];
        textarea.oninput = (e) => {
            tempState[key] = e.target.value;
            updateSaveButtonState('pending');
        };
        
        fieldDiv.append(labelEl, textarea);
        wrapper.appendChild(fieldDiv);
    };

    createField("O que você fez hoje?", "oque_fez_hoje");
    createField("O que você vai fazer amanhã?", "oque_fazer_amanha");
    createField("Feedback Positivo (Melhorias, Conquistas)", "feedback_positivo");
    createField("Feedback Negativo (Pontos de Melhoria, Erros)", "feedback_negativo");

    // Ações (Botão Único e Aviso)
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'sota-review-actions';
    
    saveButton.onclick = () => saveAllToFrontmatter(saveButton);
    
    const warningSpan = document.createElement('span');
    warningSpan.className = 'sota-review-warning';
    warningSpan.innerText = "Atenção, não mude de arquivo antes de clicar em 'Registrar' para não perder o progresso.";
    
    // Ordem de inserção: Botão primeiro, aviso depois
    actionsDiv.append(saveButton, warningSpan);

    wrapper.appendChild(actionsDiv);
    container.appendChild(wrapper);
    
    if (hasInitialData()) {
        updateSaveButtonState('saved');
    } else {
        updateSaveButtonState('pending');
    }
}

await main(dv);