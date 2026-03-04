// 99 - BACKEND/Scripts/Views/Daily/renderResumoPerformance_v4.0.js
// SOTA v4.0 - Layout Restaurado & Grid Contido
// Foco: Legibilidade original (fontes grandes) com estrutura de grid corrigida.

async function main(dv) {
    const page = dv.current();
    if (!page) return;

    // --- 1. DADOS ---
    const dataDoDia = page.file.name;
    const metricsPath = `99 - BACKEND/Logs_Metricas/Daily/Processed/${dataDoDia}_metrics.md`;
    const metricsFile = dv.page(metricsPath);
    
    const container = dv.container;
    container.innerHTML = "";
    container.style.width = "100%";
    container.style.display = "flex";
    container.style.justifyContent = "center"; // Centraliza o bloco todo na tela

    if (!metricsFile) {
        container.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--text-muted);">⏳ Aguardando Processamento</div>`;
        return;
    }

    const m = metricsFile;
    // KPI Heroes
    const kpiGenio = m.xp_genio || 0;
    const kpiSaude = m.xp_saude || 0;
    const kpiSono = m.qualidade_sono_calculada || 0;
    const kpiEnergia = m.energia_media_dia || 0;
    const kpiHumor = (m.humor_media_dia || 0).toFixed(1);

    // Intelecto
    const countInsights = m.qtd_insights || 0;
    const countErros = m.qtd_erros || 0;
    const countWins = m.qtd_wins || 0;

    // Ação
    const horasFoco = m.total_foco_tempo || "00:00:00";
    const horasPausa = m.total_pausa_tempo || "00:00:00";
    const tasksTotal = m.tarefas_concluidas_total || 0;
    
    // Biologia
    const horasSono = (m.total_horas_sono || 0).toFixed(1);
    const countNutriBoa = m.qtd_refeicoes_boas || 0;
    const countNutriRuim = m.qtd_refeicoes_ruins || 0;

    // Emocional
    const countFelicidade = m.estados_emocionais?.felicidade || 0;
    const countTristeza = m.estados_emocionais?.tristeza || 0;
    const countEstresse = m.estados_emocionais?.estresse || 0;
    const countDistracoes = m.qtd_distracoes || 0;

    // --- 2. ESTILOS RESTAURADOS ---
    const style = document.createElement('style');
    style.textContent = `
        /* Wrapper principal que segura a largura */
        .sota-hud-wrapper {
            display: flex;
            flex-direction: column;
            gap: 12px; /* Gap original confortável */
            width: 100%;
            max-width: 950px; /* Largura suficiente para não quebrar linhas */
            font-family: var(--font-ui);
            color: var(--text-normal);
        }

        /* Hero Bar - Restaurada */
        .sota-hero-bar {
            display: flex;
            justify-content: space-around; /* Espaçamento original */
            background: var(--background-primary-alt);
            border: 1px solid var(--background-modifier-border);
            border-radius: 12px;
            padding: 15px 10px; /* Padding generoso original */
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .sota-hero-stat {
            display: flex; flex-direction: column; align-items: center; gap: 4px;
            flex: 1; border-right: 1px solid var(--background-modifier-border);
        }
        .sota-hero-stat:last-child { border-right: none; }
        .sota-hero-value { font-size: 1.4em; font-weight: 800; line-height: 1; }
        .sota-hero-label { font-size: 0.7em; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); font-weight: 600; }
        .sota-hero-icon { font-size: 1.2em; margin-bottom: 2px; }

        /* Grid - Cards */
        .sota-cards-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr); /* 4 colunas fixas */
            gap: 12px; 
        }
        
        @media (max-width: 800px) {
            .sota-cards-grid { grid-template-columns: repeat(2, 1fr); }
        }

        .sota-card {
            background: var(--background-primary-alt);
            border: 1px solid var(--background-modifier-border);
            border-radius: 10px;
            padding: 12px 15px; /* Padding lateral maior para evitar colisão */
            display: flex;
            flex-direction: column;
            gap: 10px; /* Gap vertical entre linhas dentro do card */
        }

        .sota-card-header {
            display: flex; align-items: center; justify-content: center; gap: 8px;
            border-bottom: 1px solid var(--background-modifier-border);
            padding-bottom: 8px; margin-bottom: 2px;
        }
        .sota-card-title { font-weight: 700; font-size: 0.85em; text-transform: uppercase; color: var(--text-muted); }

        /* Linhas de Estatística - FIX DE COLISÃO */
        .sota-stat-row {
            display: flex;
            justify-content: space-between; /* Garante extremos opostos */
            align-items: center;
            font-size: 0.85em; /* Tamanho de fonte original */
            width: 100%;
        }
        
        .sota-stat-label {
            display: flex; align-items: center; gap: 6px;
            color: var(--text-normal);
            font-weight: 500;
        }

        .sota-stat-val {
            font-weight: 700;
            font-family: var(--font-monospace); /* Monospace para alinhar números */
            text-align: right;
        }

        /* Badges */
        .badge-green { color: var(--color-green); background: rgba(var(--color-green-rgb), 0.1); padding: 2px 8px; border-radius: 4px; }
        .badge-red { color: var(--color-red); background: rgba(var(--color-red-rgb), 0.1); padding: 2px 8px; border-radius: 4px; }
        .badge-neutral { color: var(--text-muted); }
        
        /* Badge Dark Exclusiva */
        .badge-dark { 
            color: #999; 
            background: rgba(255, 255, 255, 0.05); 
            padding: 2px 8px; 
            border-radius: 4px; 
        }

        .color-genio { color: var(--color-purple); }
        .color-saude { color: var(--color-red); }
        .color-sono { color: var(--color-blue); }
        .color-energy { color: var(--color-yellow); }
        .color-humor { color: var(--color-green); }
    `;
    container.appendChild(style);

    const wrapper = document.createElement('div');
    wrapper.className = 'sota-hud-wrapper';

    wrapper.innerHTML = `
        <div class="sota-hero-bar">
            <div class="sota-hero-stat">
                <div class="sota-hero-icon">🧠</div>
                <div class="sota-hero-value color-genio">${kpiGenio}<span style="font-size:0.5em">XP</span></div>
                <div class="sota-hero-label">Gênio</div>
            </div>
            <div class="sota-hero-stat">
                <div class="sota-hero-icon">❤️</div>
                <div class="sota-hero-value color-saude">${kpiSaude}<span style="font-size:0.5em">XP</span></div>
                <div class="sota-hero-label">Saúde</div>
            </div>
            <div class="sota-hero-stat">
                <div class="sota-hero-icon">💤</div>
                <div class="sota-hero-value color-sono">${kpiSono}%</div>
                <div class="sota-hero-label">Sono</div>
            </div>
            <div class="sota-hero-stat">
                <div class="sota-hero-icon">⚡</div>
                <div class="sota-hero-value color-energy">${kpiEnergia}%</div>
                <div class="sota-hero-label">Energia</div>
            </div>
            <div class="sota-hero-stat">
                <div class="sota-hero-icon">🙂</div>
                <div class="sota-hero-value color-humor">${kpiHumor}</div>
                <div class="sota-hero-label">Humor</div>
            </div>
        </div>

        <div class="sota-cards-grid">
            <!-- INTELECTO -->
            <div class="sota-card">
                <div class="sota-card-header"><span>🧠</span><span class="sota-card-title">Intelecto</span></div>
                <div class="sota-stat-row">
                    <span class="sota-stat-label">💡 Insights</span>
                    <span class="sota-stat-val badge-green">${countInsights}</span>
                </div>
                <div class="sota-stat-row">
                    <span class="sota-stat-label">🏆 Wins</span>
                    <span class="sota-stat-val badge-green">${countWins}</span>
                </div>
                <div class="sota-stat-row">
                    <span class="sota-stat-label">🛑 Erros</span>
                    <span class="sota-stat-val badge-red">${countErros}</span>
                </div>
            </div>

            <!-- AÇÃO -->
            <div class="sota-card">
                <div class="sota-card-header"><span>🏋️‍♂️</span><span class="sota-card-title">Ação</span></div>
                <div class="sota-stat-row">
                    <span class="sota-stat-label">🍅 Foco</span>
                    <span class="sota-stat-val">${horasFoco}</span>
                </div>
                <div class="sota-stat-row">
                    <span class="sota-stat-label">☕ Pausa</span>
                    <span class="sota-stat-val">${horasPausa}</span>
                </div>
                <div class="sota-stat-row">
                    <span class="sota-stat-label">✅ Tasks</span>
                    <span class="sota-stat-val badge-green">${tasksTotal}</span>
                </div>
            </div>

            <!-- BIOLOGIA -->
            <div class="sota-card">
                <div class="sota-card-header"><span>🌿</span><span class="sota-card-title">Biologia</span></div>
                <div class="sota-stat-row">
                    <span class="sota-stat-label">😴 Sono</span>
                    <span class="sota-stat-val">${horasSono}h</span>
                </div>
                <div class="sota-stat-row">
                    <span class="sota-stat-label">🥗 Ref. Boa</span>
                    <span class="sota-stat-val badge-green">${countNutriBoa}</span>
                </div>
                <div class="sota-stat-row">
                    <span class="sota-stat-label">🍔 Ref. Ruim</span>
                    <span class="sota-stat-val badge-red">${countNutriRuim}</span>
                </div>
            </div>

            <!-- EMOCIONAL -->
            <div class="sota-card">
                <div class="sota-card-header"><span>❤️</span><span class="sota-card-title">Emocional</span></div>
                <div class="sota-stat-row">
                    <span class="sota-stat-label">😄 Felicidade</span>
                    <span class="sota-stat-val badge-green">${countFelicidade}</span>
                </div>
                <div class="sota-stat-row">
                    <span class="sota-stat-label">😢 Tristeza</span>
                    <span class="sota-stat-val badge-dark">${countTristeza}</span>
                </div>
                <div class="sota-stat-row">
                    <span class="sota-stat-label">🤯 Estresse</span>
                    <span class="sota-stat-val badge-red">${countEstresse}</span>
                </div>
            </div>
        </div>
    `;
    container.appendChild(wrapper);
}

await main(dv);
