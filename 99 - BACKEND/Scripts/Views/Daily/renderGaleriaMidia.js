// 99 - BACKEND/Scripts/Views/Daily/renderGaleriaMidia.js
// SOTA v1.2 - Galeria de Mídias (HTML Lightbox - Zero Dependencies)

async function main(dv) {
    const app = dv.app;
    const page = dv.current();
    if (!page) return;

    const midias = page.galeria_midia || [];
    const container = dv.container;
    
    // ID único para o container do lightbox deste render específico (evita conflitos)
    const lightboxId = `sota-lightbox-${Math.random().toString(36).substr(2, 9)}`;

    // --- CSS ---
    const style = document.createElement('style');
    style.textContent = `
        /* Grid Layout */
        .sota-gallery-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-top: 10px;
        }
        .sota-media-card {
            position: relative;
            background: var(--background-primary-alt);
            border: 1px solid var(--background-modifier-border);
            border-radius: 8px;
            overflow: hidden;
            aspect-ratio: 16/9;
            display: flex; align-items: center; justify-content: center;
            transition: transform 0.2s, border-color 0.2s;
            cursor: pointer;
        }
        .sota-media-card:hover {
            border-color: var(--interactive-accent);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .sota-media-obj {
            width: 100%; height: 100%;
            object-fit: cover;
            transition: opacity 0.2s;
        }
        .sota-play-icon {
            position: absolute;
            font-size: 2em; color: white;
            text-shadow: 0 2px 5px black;
            opacity: 0.8;
            pointer-events: none;
        }
        .sota-gallery-empty {
            padding: 20px; text-align: center; color: var(--text-muted);
            background: var(--background-primary-alt);
            border: 1px dashed var(--background-modifier-border);
            border-radius: 8px; font-size: 0.9em; font-style: italic;
        }
        @media (max-width: 800px) { .sota-gallery-grid { grid-template-columns: repeat(2, 1fr); } }

        /* --- LIGHTBOX (Modal HTML) --- */
        .sota-lightbox {
            display: none; /* Oculto por padrão */
            position: fixed;
            z-index: 9999;
            left: 0; top: 0;
            width: 100%; height: 100%;
            background-color: rgba(0,0,0,0.85);
            backdrop-filter: blur(5px);
            justify-content: center;
            align-items: center;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        .sota-lightbox.active {
            display: flex;
            opacity: 1;
        }
        .sota-lightbox-content {
            max-width: 90%;
            max-height: 90%;
            border-radius: 8px;
            box-shadow: 0 0 20px rgba(0,0,0,0.5);
        }
        .sota-lightbox-close {
            position: absolute;
            top: 20px;
            right: 30px;
            color: #f1f1f1;
            font-size: 40px;
            font-weight: bold;
            cursor: pointer;
            transition: 0.3s;
            z-index: 10000;
        }
        .sota-lightbox-close:hover { color: var(--interactive-accent); }
    `;
    container.appendChild(style);

    // --- ELEMENTO LIGHTBOX (Fica escondido no DOM) ---
    const lightbox = document.createElement('div');
    lightbox.id = lightboxId;
    lightbox.className = 'sota-lightbox';
    
    // Botão Fechar
    const closeBtn = document.createElement('span');
    closeBtn.className = 'sota-lightbox-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = () => { lightbox.classList.remove('active'); lightbox.innerHTML = ''; lightbox.appendChild(closeBtn); };
    
    // Fechar ao clicar fora
    lightbox.onclick = (e) => {
        if (e.target === lightbox) {
            lightbox.classList.remove('active');
            lightbox.innerHTML = ''; // Limpa conteúdo para parar vídeo
            lightbox.appendChild(closeBtn); // Recoloca o botão
        }
    };
    
    lightbox.appendChild(closeBtn);
    document.body.appendChild(lightbox); // Anexa ao Body para cobrir tudo

    // --- RENDERIZAÇÃO GRID ---
    if (midias.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'sota-gallery-empty';
        empty.innerHTML = "📷 <em>Nenhuma foto ou vídeo registrado hoje.</em>";
        container.appendChild(empty);
        return;
    }

    const grid = document.createElement('div');
    grid.className = 'sota-gallery-grid';

    for (const path of midias) {
        const file = app.vault.getAbstractFileByPath(path);
        if (!file) continue;

        const src = app.vault.getResourcePath(file);
        const ext = file.extension.toLowerCase();
        const isVideo = ['mp4', 'webm', 'mov', 'mkv', 'avi'].includes(ext);
        
        const card = document.createElement('div');
        card.className = 'sota-media-card';
        
        // --- AÇÃO DE ABRIR ---
        card.onclick = () => {
            // Limpa conteúdo anterior (mantendo o botão fechar)
            while (lightbox.childNodes.length > 1) { lightbox.removeChild(lightbox.lastChild); }
            
            let contentEl;
            if (isVideo) {
                contentEl = document.createElement('video');
                contentEl.controls = true;
                contentEl.autoplay = true;
            } else {
                contentEl = document.createElement('img');
            }
            contentEl.src = src;
            contentEl.className = 'sota-lightbox-content';
            
            lightbox.appendChild(contentEl);
            lightbox.classList.add('active');
        };

        let thumbEl;
        if (isVideo) {
            thumbEl = document.createElement('video');
            thumbEl.src = src;
            thumbEl.preload = "metadata"; // Carrega só o frame inicial
            
            const playIcon = document.createElement('div');
            playIcon.className = 'sota-play-icon';
            playIcon.innerHTML = "▶";
            card.appendChild(playIcon);
        } else {
            thumbEl = document.createElement('img');
            thumbEl.src = src;
        }
        
        thumbEl.className = 'sota-media-obj';
        card.appendChild(thumbEl);
        grid.appendChild(card);
    }

    container.appendChild(grid);
}

await main(dv);