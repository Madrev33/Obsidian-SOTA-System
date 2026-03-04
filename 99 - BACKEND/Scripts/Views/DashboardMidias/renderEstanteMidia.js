// 99 - BACKEND/Scripts/Views/DashboardMidias/renderEstanteMidia.js
// SOTA v4.0 - Estante Horizontal (Fichas Técnicas)
// Layout horizontal responsivo, ícones de fallback inteligentes e lógica de status robusta.

async function main(dv) {
    const container = dv.container;
    
    // --- 1. ESTADO DA APLICAÇÃO ---
    let allMedia = []; 
    let filtroStatusAtivo = "Em Progresso";
    let filtroTipoAtivo = "Todos";

    // --- 2. CSS AVANÇADO (Layout Horizontal) ---
    const style = document.createElement('style');
    style.textContent = `
        .sota-shelf-container { display: flex; flex-direction: column; gap: 20px; font-family: var(--font-ui); width: 100%; }
        
        /* Filtros */
        .sota-filter-wrapper { display: flex; flex-direction: column; gap: 10px; }
        .sota-filter-row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
        .sota-filter-btn { 
            padding: 6px 12px; background: var(--background-primary); border: 1px solid var(--background-modifier-border); 
            border-radius: 6px; font-size: 0.8em; font-weight: 600; color: var(--text-muted); cursor: pointer; transition: all 0.2s; 
        }
        .sota-filter-btn:hover { color: var(--text-normal); border-color: var(--text-normal); }
        .sota-filter-btn.active { background: var(--interactive-accent); color: var(--text-on-accent); border-color: var(--interactive-accent); }
        
        /* Grid Responsivo */
        .sota-media-grid { 
            display: grid; 
            /* Cards horizontais largos. Em mobile, empilha. */
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); 
            gap: 15px; 
        }
        
        /* Card Horizontal (Ficha) - Flexbox Adaptável */
        .sota-media-card { 
            background: var(--background-secondary); 
            border-radius: 8px; 
            border: 1px solid var(--background-modifier-border); 
            text-decoration: none !important; 
            color: var(--text-normal) !important; 
            display: flex; /* Mudança para Flexbox */
            flex-direction: row; /* Alinhamento horizontal */
            overflow: hidden; 
            height: 110px; /* Altura fixa um pouco maior */
            transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s; 
        }
        .sota-media-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-color: var(--interactive-accent); }
        
        /* Capa / Icone - Largura Automática */
        .sota-card-cover { 
            height: 100%; 
            width: auto; /* Deixa a largura se ajustar à imagem */
            flex-shrink: 0; /* Impede que a imagem encolha */
            background-color: #000;
            display: flex; align-items: center; justify-content: center;
            overflow: hidden; border-right: 1px solid var(--background-modifier-border);
            position: relative;
        }
        
        .sota-card-cover img { 
            height: 100%; 
            width: auto; /* Mantém proporção natural */
            object-fit: contain; /* Garante que a imagem inteira apareça */
            max-width: 200px; /* Limite máximo para não quebrar layout de banners muito largos */
            transition: transform 0.3s;
        }
        
        /* Fallback Icon Container */
        .sota-card-cover.no-image {
            width: 80px; /* Largura fixa apenas se não tiver imagem */
            background-color: var(--background-primary-alt);
        }
        .sota-media-card:hover .sota-card-cover img { transform: scale(1.1); }
        
        .sota-fallback-icon { font-size: 2.5em; opacity: 0.5; }
        
        /* Info Container */
        .sota-card-info { 
            padding: 10px 12px; 
            display: flex; flex-direction: column; justify-content: space-between; 
            flex-grow: 1; /* Ocupa o resto do espaço */
            min-width: 0; 
        }
        
        /* Título e Tipo */
        .sota-card-header { display: flex; flex-direction: column; gap: 2px; }
        .sota-type-badge { font-size: 0.6em; font-weight: 700; text-transform: uppercase; color: var(--text-faint); letter-spacing: 0.5px; }
        .sota-card-title { 
            font-weight: 700; font-size: 0.95em; line-height: 1.2; 
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis; 
            color: var(--text-normal);
        }
        
        /* Metadados */
        .sota-card-meta { display: flex; justify-content: space-between; align-items: flex-end; font-size: 0.8em; }
        .sota-cycle-text { color: var(--text-muted); font-size: 0.9em; }
        .sota-progress-text { font-family: var(--font-monospace); font-weight: 600; color: var(--interactive-accent); background: rgba(var(--interactive-accent-rgb), 0.1); padding: 2px 6px; border-radius: 4px; }
        
        /* Status Concluído */
        .sota-status-done { color: var(--color-green); font-weight: 600; display: flex; align-items: center; gap: 4px; }
        .sota-media-card.done { border-left: 3px solid var(--color-green); opacity: 0.8; }
        .sota-media-card.done:hover { opacity: 1; }
    `;
    container.appendChild(style);

    // --- 3. LÓGICA DE DADOS ---

    const isRootHub = (p) => {
        if (!p.tipo) return false;
        const t = p.tipo;
        if (t.includes('modulo') || t.includes('temporada') || t.includes('episodio') || t.includes('aula') || t.includes('secao')) return false;
        return t.includes('_hub');
    };

    const determinarStatus = (p) => {
        const folder = p.file.folder.toLowerCase();
        // 1. Localização Física (Prioridade Suprema)
        if (folder.includes("03. concluídas") || folder.includes("concluidas")) return "Concluído";
        if (folder.includes("02. em progresso") || folder.includes("ativos")) return "Em Progresso";
        if (folder.includes("01. para consumir") || folder.includes("pendentes")) return "Pendente";

        // 2. Fallback por Ciclo (Se a pasta estiver fora do padrão)
        // Se houver qualquer ciclo ativo, é progresso. Se concluído, é concluído. Senão, Pendente.
        const cicloAtual = p.ciclos?.find(c => c.ciclo === p.ciclo_de_consumo_atual);
        const statusCiclo = cicloAtual?.status || "";
        
        if (['lendo', 'assistindo', 'jogando', 'ativo'].includes(statusCiclo)) return "Em Progresso";
        if (statusCiclo === 'concluido') return "Concluído";
        
        return "Pendente"; // Default seguro
    };

    const getProgressText = (media) => {
        const tipo = media.tipo;
        
        // Livros/Docs/Artigos
        if (tipo.includes('paginado')) {
            const atual = media.leitura_pagina_atual || 0;
            const total = media.total_paginas || 0;
            return total > 0 ? `${atual}/${total} pág` : `${atual} pág`;
        }
        // Cursos
        if (tipo.includes('curso')) {
            const atual = media.aulas_assistidas || 0;
            const total = media.total_aulas || 0;
            return total > 0 ? `${atual}/${total} aulas` : `${atual} aulas`;
        }
        // Séries / Podcasts / Docs
        if (tipo.includes('serie') || tipo.includes('podcast') || tipo.includes('documentario') && tipo.includes('serializado')) {
            const epAtual = media.episodios_assistidos || 0;
            const temp = media.temporada_atual || 1;
            return `S${temp}E${epAtual}`;
        }
        // Jogos
        if (tipo.includes('jogo')) {
            const missao = media.missoes_jogadas || 0;
            return `Missão ${missao}`;
        }
        // Atômicos
        return "▶";
    };

    const getIconForType = (tipo) => {
        if (tipo.includes('livro')) return "📚";
        if (tipo.includes('artigo')) return "📄";
        if (tipo.includes('documentacao')) return "📑";
        if (tipo.includes('curso')) return "🎓";
        if (tipo.includes('serie')) return "📺";
        if (tipo.includes('filme')) return "🎬";
        if (tipo.includes('video')) return "📹";
        if (tipo.includes('jogo')) return "🎮";
        if (tipo.includes('podcast')) return "🎙️";
        if (tipo.includes('documentario')) return "📽️";
        return "📦";
    };

    const getCleanType = (tipo) => {
        return tipo.split('_')[0].toUpperCase();
    };

    // --- 4. RENDERIZAÇÃO ---

    const renderCards = () => {
        let midiasFiltradas = allMedia.where(p => determinarStatus(p) === filtroStatusAtivo);

        if (filtroTipoAtivo !== "Todos") {
            // Filtro flexível (ex: "documentario" pega serializado e unico)
            midiasFiltradas = midiasFiltradas.where(p => p.tipo && p.tipo.includes(filtroTipoAtivo));
        }
        
        midiasFiltradas = midiasFiltradas.sort(p => p.file.mtime, 'desc');

        mediaGrid.innerHTML = '';
        
        if (midiasFiltradas.length === 0) {
            mediaGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 30px; color: var(--text-muted); border: 1px dashed var(--background-modifier-border); border-radius: 8px;">
                    <div style="font-size: 1.5em; margin-bottom: 5px;">📭</div>
                    <div>Nada aqui.</div>
                </div>`;
            return;
        }

        for (const media of midiasFiltradas) {
            const isDone = filtroStatusAtivo === 'Concluído';
            
            // Mudamos de 'a' para 'div' para ter controle total do clique via JS
            const card = document.createElement('div');
            card.className = `sota-media-card ${isDone ? 'done' : ''}`;
            
            // Adiciona cursor pointer para indicar clique
            card.style.cursor = "pointer";

            // Evento de clique nativo do Obsidian
            card.onclick = (e) => {
                e.preventDefault(); // Previne comportamentos padrão
                // Abre o arquivo no painel ativo
                // (caminho, sourcePath, openInNewLeaf?)
                app.workspace.openLinkText(media.file.path, "", e.ctrlKey || e.metaKey); 
            };
            
            // --- COLUNA 1: CAPA/ÍCONE ---
            const coverDiv = document.createElement('div');
            coverDiv.className = 'sota-card-cover';
            
            // Lógica de Capa Inteligente
            let hasCover = false;
            if (media.capa && media.capa.path) {
                const coverFile = app.vault.getAbstractFileByPath(media.capa.path);
                if (coverFile) {
                    const img = document.createElement('img');
                    img.src = app.vault.getResourcePath(coverFile);
                    coverDiv.appendChild(img);
                    hasCover = true;
                }
            }
            
            // Fallback para Ícone
            if (!hasCover) {
                coverDiv.classList.add('no-image'); // Adiciona classe para largura fixa
                coverDiv.innerHTML = `<div class="sota-fallback-icon">${getIconForType(media.tipo)}</div>`;
            }
            
            // --- COLUNA 2: INFO ---
            const infoDiv = document.createElement('div');
            infoDiv.className = 'sota-card-info';

            // Header
            const header = document.createElement('div');
            header.className = 'sota-card-header';
            
            const badge = document.createElement('span');
            badge.className = 'sota-type-badge';
            badge.innerText = getCleanType(media.tipo);
            
            const title = document.createElement('div');
            title.className = 'sota-card-title';
            title.innerText = media.file.name.replace(/^(00\. HUB - |HUB - )/g, '');
            
            header.append(badge, title);

            // Footer (Meta)
            const metaDiv = document.createElement('div');
            metaDiv.className = 'sota-card-meta';
            
            if (isDone) {
                 metaDiv.innerHTML = `
                    <div class="sota-cycle-text">Ciclo ${media.ciclo_de_consumo_atual || 1}</div>
                    <div class="sota-status-done">✓ Feito</div>
                 `;
            } else {
                metaDiv.innerHTML = `
                    <div class="sota-cycle-text">Ciclo ${media.ciclo_de_consumo_atual || 1}</div>
                    <div class="sota-progress-text">${getProgressText(media)}</div>
                `;
            }

            infoDiv.append(header, metaDiv);
            card.append(coverDiv, infoDiv);
            mediaGrid.appendChild(card);
        }
    };

    const updateActiveButtons = () => {
        statusContainer.querySelectorAll('.sota-filter-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.value === filtroStatusAtivo));
        typeContainer.querySelectorAll('.sota-filter-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.value === filtroTipoAtivo));
    };

    // --- 5. SETUP INICIAL ---
    
    const mainContainer = document.createElement('div');
    mainContainer.className = 'sota-shelf-container';

    const filterWrapper = document.createElement('div');
    filterWrapper.className = 'sota-filter-wrapper';

    // Grupo Status
    const statusContainer = document.createElement('div');
    statusContainer.className = 'sota-filter-row';
    ['Em Progresso', 'Pendente', 'Concluído'].forEach(st => {
        const btn = document.createElement('button');
        btn.className = 'sota-filter-btn';
        btn.innerText = st;
        btn.dataset.value = st;
        btn.onclick = () => { filtroStatusAtivo = st; updateActiveButtons(); renderCards(); };
        statusContainer.appendChild(btn);
    });

    // Grupo Tipos (Agora com Docs)
    const typeContainer = document.createElement('div');
    typeContainer.className = 'sota-filter-row';
    // Chaves parciais para match flexível
    const tipos = {
        "Todos": "Todos",
        "livro": "📚 Livros",
        "curso": "🎓 Cursos",
        "serie": "📺 Séries",
        "filme": "🎬 Filmes",
        "documentario": "📽️ Docs",
        "podcast": "🎙️ Podcasts",
        "artigo": "📄 Artigos",
        "documentacao": "📑 Docs", // Adicionado
        "video": "📹 Vídeos",
        "jogo": "🎮 Jogos"
    };
    
    Object.entries(tipos).forEach(([key, label]) => {
        const btn = document.createElement('button');
        btn.className = 'sota-filter-btn';
        btn.innerText = label;
        btn.dataset.value = key;
        btn.onclick = () => { filtroTipoAtivo = key; updateActiveButtons(); renderCards(); };
        typeContainer.appendChild(btn);
    });

    filterWrapper.append(statusContainer, typeContainer);

    const mediaGrid = document.createElement('div');
    mediaGrid.className = 'sota-media-grid';
    mediaGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">Carregando biblioteca...</div>`;

    mainContainer.append(filterWrapper, mediaGrid);
    container.appendChild(mainContainer);

    // --- 6. CARGA DE DADOS ---
    allMedia = dv.pages('"03 - Conhecimento/01 - Mídias"').where(p => isRootHub(p));
    
    updateActiveButtons();
    renderCards();
}

await main(dv);