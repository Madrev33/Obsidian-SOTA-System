// SOTA - renderDashboardAnotacoes.js v4.3 (Balanced Grid)
// Correção de espaçamento: Mais ar vertical, menos buraco lateral.

async function main() {
    const paginaAtual = dv.current();
    // Agora busca em "01. Histórico" ou mantém a raiz se quiser ver tudo
    // Se você mover as pastas antigas para "01. Histórico", a busca recursiva da raiz ainda deve funcionar.
    // Mas se quiser ser específico:
    const pastaRaiz = "01 - Registros/02. Anotações/01. Histórico";
    const container = dv.container;

    // --- 1. QUERY ---
    const notasPendentes = dv.pages(`"${pastaRaiz}"`)
        .where(p => 
            p.file.name !== paginaAtual.file.name && 
            (!p.processado || p.processado === false) &&
            !p.file.name.includes(".excalidraw") &&
            p.file.ext !== "excalidraw"
        )
        .sort(p => p.file.ctime, 'desc');

    if (notasPendentes.length === 0) {
        dv.paragraph("🎉 **Zero Pendências!**");
        return;
    }

    dv.header(3, `📬 Caixa de Entrada (${notasPendentes.length})`);

    // --- 2. FUNÇÕES ---
    const arquivarNota = async (path, cardElement) => {
        const f = app.vault.getAbstractFileByPath(path);
        if(f) {
            const m = window.moment;
            cardElement.style.opacity = "0";
            cardElement.style.transform = "translateY(10px)"; // Animação de "cair"
            await app.fileManager.processFrontMatter(f, (fm) => {
                fm.processado = true;
                fm.data_processamento = m().format("YYYY-MM-DD");
                fm.status = "arquivado";
            });
            setTimeout(() => cardElement.remove(), 300);
            new Notice("Arquivado!");
        }
    };

    const extractContentPreview = async (filePath) => {
        try {
            const content = await app.vault.adapter.read(filePath);
            const headerRegex = /^##\s*📝\s*Conteúdo/im;
            const match = content.match(headerRegex);
            if (match) {
                const startIndex = match.index + match[0].length;
                let textAfter = content.substring(startIndex).trim();
                const endMatch = textAfter.match(/\n##\s/);
                if (endMatch) textAfter = textAfter.substring(0, endMatch.index).trim();
                const previewText = textAfter.substring(0, 150); 
                return previewText.length > 0 ? (previewText + "...") : null;
            }
            return null;
        } catch (e) { return null; }
    };

    // --- 3. CSS (ESPAÇAMENTO BALANCEADO) ---
    const style = document.createElement('style');
    style.textContent = `
        .sota-list-container {
            display: grid;
            /* Grid mais inteligente: tenta encaixar cards de aprox. 240px */
            /* Isso cria colunas mais consistentes */
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); 
            
            /* [SOLUÇÃO] Controle separado de gaps */
            column-gap: 10px; /* Lateral mais justa */
            row-gap: 16px;    /* Vertical (entre linhas) MAIOR para respiro */
            
            width: 100%;
            margin-top: 15px;
        }

        .sota-card { 
            display: flex;
            flex-direction: column; 
            justify-content: space-between;
            gap: 10px; 
            background: var(--background-primary-alt); 
            border: 1px solid var(--background-modifier-border); 
            border-radius: 8px; 
            padding: 12px;
            
            /* [SOLUÇÃO] Altura mínima e máxima controladas */
            min-height: 200px; 
            max-height: 280px;
            transition: all 0.2s ease-in-out;
        }
        
        .sota-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 10px rgba(0,0,0,0.15);
            border-color: var(--interactive-accent);
        }

        .sota-card-header {
            display: flex; flex-direction: column; gap: 4px;
            border-bottom: 1px solid var(--background-modifier-border);
            padding-bottom: 8px;
        }

        .sota-card-title { 
            font-weight: 700; font-size: 0.9em; 
            color: var(--text-normal); line-height: 1.3;
            overflow: hidden; text-overflow: ellipsis;
            display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
        }

        .sota-card-meta { 
            font-size: 0.7em; color: var(--text-muted); opacity: 0.9;
            display: flex; align-items: center; gap: 4px;
        }

        .sota-card-preview { 
            font-size: 0.8em; color: var(--text-muted); line-height: 1.4; 
            flex-grow: 1; overflow: hidden;
            border-left: 2px solid var(--interactive-accent); /* Mudado para cor de acento sutil */
            padding-left: 8px; margin: 4px 0;
            display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical;
        }

        .sota-card-actions { margin-top: auto; } 

        .sota-btn-action { 
            background: rgba(var(--interactive-accent-rgb), 0.05); 
            color: var(--text-muted); 
            border: 1px solid var(--background-modifier-border); 
            padding: 6px; 
            border-radius: 6px; cursor: pointer; 
            font-size: 0.75em; font-weight: 600; width: 100%;
            transition: all 0.2s;
        }
        .sota-btn-action:hover { 
            background: var(--interactive-accent); 
            color: var(--text-on-accent); 
            border-color: var(--interactive-accent);
        }
    `;
    container.appendChild(style);

    const listContainer = document.createElement('div');
    listContainer.className = 'sota-list-container';

    for (let nota of notasPendentes) {
        const tipo = nota.tipo || "anotacao_geral";
        let icone = '📝';
        if (tipo === 'ideia') icone = '💡';
        if (tipo === 'reflexao') icone = '🤔';

        const card = document.createElement('div');
        card.className = 'sota-card';

        // Header
        const headerDiv = document.createElement('div');
        headerDiv.className = 'sota-card-header';
        
        const link = document.createElement('a');
        link.href = nota.file.path;
        link.setAttribute('data-href', nota.file.path);
        link.className = 'internal-link sota-card-title';
        link.innerText = `${icone} ${nota.file.name.replace('.md', '')}`;
        
        const meta = document.createElement('div');
        meta.className = 'sota-card-meta';
        meta.innerText = nota.file.ctime.toFormat('dd/MM/yyyy • HH:mm');

        headerDiv.appendChild(link);
        headerDiv.appendChild(meta);
        card.appendChild(headerDiv);
        
        // Preview
        const previewText = await extractContentPreview(nota.file.path);
        const previewDiv = document.createElement('div');
        previewDiv.className = 'sota-card-preview';
        previewDiv.innerText = previewText ? previewText : "Sem visualização...";
        card.appendChild(previewDiv);

        // Action
        const actionDiv = document.createElement('div');
        actionDiv.className = 'sota-card-actions';
        const btn = document.createElement('button');
        btn.className = 'sota-btn-action';
        btn.innerText = `Arquivar`;
        btn.onclick = () => arquivarNota(nota.file.path, card);
        actionDiv.appendChild(btn);
        card.appendChild(actionDiv);

        listContainer.appendChild(card);
    }

    container.appendChild(listContainer);
}

await main();
