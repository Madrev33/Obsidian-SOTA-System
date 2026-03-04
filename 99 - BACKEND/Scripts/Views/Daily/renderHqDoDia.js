// 99 - BACKEND/Scripts/Views/Daily/renderHqDoDia.js
// SOTA v1.4 - Leitor de HQ (Thumbnail Vertical & Lightbox Fix)

async function main(dv) {
    const app = dv.app;
    const page = dv.current();
    const container = dv.container;

    if (!page || !page.hq_do_dia) return;
    
    const { capa, paginas, titulo } = page.hq_do_dia;
    if (!capa || !paginas || paginas.length === 0) return;

    // --- CSS ---
    const style = document.createElement('style');
    style.textContent = `
        /* Card Principal */
        .sota-hq-card {
            display: flex; align-items: center; gap: 15px;
            background: var(--background-secondary);
            border: 1px solid var(--background-modifier-border);
            border-radius: 12px; padding: 12px; margin-top: 10px;
        }

        /* CORREÇÃO: Miniatura Vertical */
        .sota-hq-thumbnail {
            height: 80px; /* Altura fixa */
            width: auto;  /* Largura se ajusta para manter proporção */
            max-width: 60px; /* Limite para não ficar muito largo */
            object-fit: cover;
            border-radius: 6px;
            border: 1px solid var(--background-modifier-border);
            cursor: pointer;
            transition: transform 0.2s;
        }
        .sota-hq-thumbnail:hover { transform: scale(1.05); }

        /* Conteúdo à Direita */
        .sota-hq-content {
            flex-grow: 1; display: flex; flex-direction: column; gap: 10px;
        }
        .sota-hq-header { display: flex; justify-content: space-between; align-items: baseline; }
        .sota-hq-title { font-weight: 700; font-size: 1.1em; color: var(--text-normal); }
        .sota-hq-page-count { font-size: 0.8em; color: var(--text-muted); font-family: var(--font-monospace); }
        
        /* --- LIGHTBOX (UI CORRIGIDA) --- */
        .sota-lightbox {
            display: none; position: fixed; z-index: 999;
            left: 0; top: 0; width: 100%; height: 100%;
            background-color: rgba(0,0,0,0.9);
            backdrop-filter: blur(8px);
            justify-content: center; align-items: center;
            opacity: 0; transition: opacity 0.3s ease;
        }
        .sota-lightbox.active { display: flex; opacity: 1; }
        
        .sota-lightbox-content {
            max-width: 90vw; max-height: 90vh; object-fit: contain;
            border-radius: 8px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            /* Importante para não cobrir os botões */
            position: relative; 
            z-index: 1000; 
        }
        
        .sota-lightbox-nav {
            position: absolute; top: 50%; transform: translateY(-50%);
            font-size: 2.5em; font-weight: bold; color: white;
            opacity: 0.4; cursor: pointer; user-select: none;
            padding: 20px;
            transition: opacity 0.2s, background 0.2s;
            z-index: 1001; /* Fica ACIMA da imagem */
            border-radius: 10px;
        }
        .sota-lightbox-nav:hover { opacity: 1; background: rgba(255,255,255,0.1); }
        #sota-hq-prev { left: 15px; }
        #sota-hq-next { right: 15px; }
        
        #sota-hq-counter {
            position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
            color: white; background: rgba(0,0,0,0.6);
            padding: 5px 12px; border-radius: 20px;
            font-family: var(--font-monospace);
            font-size: 0.9em;
            z-index: 1001; /* Fica ACIMA da imagem */
        }
    `;
    container.appendChild(style);

    // --- RENDERIZAÇÃO ---
    const wrapper = document.createElement('div');
    wrapper.className = 'sota-hq-card';

    const capaFile = app.vault.getAbstractFileByPath(capa);
    if (!capaFile) return;
    
    const capaSrc = app.vault.getResourcePath(capaFile);
    
    wrapper.innerHTML = `
        <img src="${capaSrc}" class="sota-hq-thumbnail" alt="Capa da HQ">
        <div class="sota-hq-content">
            <div class="sota-hq-header">
                <span class="sota-hq-title">${titulo || "HQ do Dia"}</span>
                <span class="sota-hq-page-count">${paginas.length} página(s)</span>
            </div>
        </div>
    `;

    // --- LÓGICA DO LIGHTBOX ---
    wrapper.querySelector('.sota-hq-thumbnail').onclick = () => {
        let currentIndex = 0;
        
        const lightbox = document.body.createDiv({ cls: 'sota-lightbox active' });
        const img = lightbox.createEl('img', { cls: 'sota-lightbox-content' });
        const prev = lightbox.createDiv({ cls: 'sota-lightbox-nav', attr: { id: 'sota-hq-prev' }, text: '‹' });
        const next = lightbox.createDiv({ cls: 'sota-lightbox-nav', attr: { id: 'sota-hq-next' }, text: '›' });
        const counter = lightbox.createDiv({ attr: { id: 'sota-hq-counter' } });
        
        const updatePage = () => {
            const pagePath = paginas[currentIndex];
            const pageFile = app.vault.getAbstractFileByPath(pagePath);
            if (pageFile) img.src = app.vault.getResourcePath(pageFile);
            counter.innerText = `${currentIndex + 1} / ${paginas.length}`;
        };

        const nextPage = () => { currentIndex = (currentIndex + 1) % paginas.length; updatePage(); };
        const prevPage = () => { currentIndex = (currentIndex - 1 + paginas.length) % paginas.length; updatePage(); };
        const close = () => { document.removeEventListener('keydown', handleKeydown); lightbox.remove(); };
        const handleKeydown = (e) => {
            if (e.key === 'ArrowRight') { e.preventDefault(); nextPage(); } 
            else if (e.key === 'ArrowLeft') { e.preventDefault(); prevPage(); } 
            else if (e.key === 'Escape') { e.preventDefault(); close(); }
        };
        
        document.addEventListener('keydown', handleKeydown);
        prev.onclick = (e) => { e.stopPropagation(); prevPage(); };
        next.onclick = (e) => { e.stopPropagation(); nextPage(); };
        lightbox.onclick = close;
        img.onclick = (e) => e.stopPropagation();

        updatePage();
    };

    container.appendChild(wrapper);
}

await main(dv);