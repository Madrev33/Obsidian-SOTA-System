// 99 - BACKEND/Scripts/Views/Daily/renderRevisaoOntem.js
// SOTA v1.2 - Painel de Inteligência Retrospectiva (Com Pausa)
// Adiciona métricas de Pausa ao card de Foco.

async function main(dv) {
    const app = dv.app;
    const moment = window.moment;
    
    // 1. Determinar a data de Ontem
    const page = dv.current();
    const hojeData = page.file.day; 
    if (!hojeData) return; 

    const ontemData = hojeData.minus({ days: 1 });
    const ontemStr = ontemData.toFormat("yyyy-MM-dd");
    
    // 2. Buscar Métricas
    const metricsPath = `99 - BACKEND/Logs_Metricas/Daily/Processed/${ontemStr}_metrics.md`;
    const metricsFile = dv.page(metricsPath);

    const container = dv.container;
    container.innerHTML = "";

    // 3. CSS (Alinhado com renderResumoPerformance)
    const style = document.createElement('style');
    style.textContent = `
        .sota-retro-container {
            display: flex; flex-direction: column; gap: 10px;
            /* CORRIGIDO: Fundo escuro igual aos cards de baixo */
            background: var(--background-primary-alt); 
            border: 1px solid var(--background-modifier-border);
            border-radius: 10px; padding: 15px;
            margin-bottom: 20px;
        }
        .sota-retro-header {
            display: flex; justify-content: space-between; align-items: center;
            border-bottom: 1px solid var(--background-modifier-border);
            padding-bottom: 10px; margin-bottom: 5px;
        }
        .sota-retro-title { font-weight: 700; font-size: 1.1em; color: var(--text-normal); display: flex; align-items: center; gap: 8px; }
        .sota-retro-link a { color: var(--text-muted); font-size: 0.9em; text-decoration: none; }
        .sota-retro-link a:hover { color: var(--interactive-accent); }

        .sota-retro-grid {
            display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 15px;
        }
        .sota-metric-box {
            display: flex; 
            flex-direction: column; 
            gap: 4px;
            /* ADICIONADO: Centralização */
            align-items: center; 
            text-align: center;
        }
        .sota-metric-label { font-size: 0.75em; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; display: flex; align-items: center; gap: 5px; }
        .sota-metric-val { font-size: 1.3em; font-weight: 700; color: var(--text-normal); font-family: var(--font-monospace); line-height: 1.1; }
        .sota-metric-sub { font-size: 0.8em; color: var(--text-faint); }

        .val-good { color: var(--color-green); }
        .val-warn { color: var(--color-orange); }
        .val-bad { color: var(--color-red); }
        .val-accent { color: var(--interactive-accent); }
    `;
    container.appendChild(style);

    const wrapper = document.createElement('div');
    wrapper.className = 'sota-retro-container';

    if (!metricsFile) {
        wrapper.innerHTML = `
            <div class="sota-retro-header">
                <div class="sota-retro-title">⚠️ Revisão de Ontem (${ontemStr})</div>
            </div>
            <div style="text-align: center; color: var(--text-muted); padding: 10px;">
                O dia anterior ainda não foi processado. <br>
                <small>Abra a nota de ontem e clique em "Processar & Finalizar Dia".</small>
            </div>
        `;
        container.appendChild(wrapper);
        return;
    }

    // 4. Dados
    const m = metricsFile;
    
    // CORREÇÃO: Formato HH:MM:SS
    const focoTotal = m.total_foco_tempo || "00:00:00"; 
    const pausaTotal = m.total_pausa_tempo || "00:00:00"; // Novo
    
    const sessoesFoco = m.total_foco_sessoes || 0;
    const sessoesPausa = m.total_pausa_sessoes || 0; // Novo
    const ratio = m.ratio_foco_pausa_percentual || 0;
    
    const xpGenio = m.xp_genio || 0;
    const xpSaude = m.xp_saude || 0;
    
    const sonoRaw = m.total_horas_sono || 0;
    const sonoHoras = typeof sonoRaw === 'number' ? sonoRaw.toFixed(1) : sonoRaw;
    const sonoQualidade = m.qualidade_sono_calculada || 0;

    const colorRatio = ratio >= 75 ? "val-good" : (ratio >= 50 ? "val-accent" : "val-warn");
    const colorSono = sonoQualidade >= 80 ? "val-good" : (sonoQualidade >= 50 ? "val-accent" : "val-bad");

    // CORREÇÃO: Link funcional
    const linkHtml = `<a class="internal-link" href="${ontemStr}" data-href="${ontemStr}">Ver Nota Completa</a>`;

    // 5. HTML
    wrapper.innerHTML = `
        <div class="sota-retro-header">
            <div class="sota-retro-title">📊 Performance de Ontem</div>
            <div class="sota-retro-link">${linkHtml}</div>
        </div>

        <div class="sota-retro-grid">
            <!-- COLUNA 1: FOCO & PAUSA -->
            <div class="sota-metric-box">
                <span class="sota-metric-label">🍅 Foco / Pausa</span>
                <span class="sota-metric-val">
                    <span class="val-accent">${focoTotal}</span>
                    <span style="font-size: 0.6em; color: var(--text-muted); margin: 0 4px;">|</span>
                    <span style="font-size: 0.8em; color: #f1c40f;">${pausaTotal}</span>
                </span>
                <span class="sota-metric-sub">${sessoesFoco} Sessões / ${sessoesPausa} Pausas</span>
            </div>

            <!-- COLUNA 3: XP -->
            <div class="sota-metric-box">
                <span class="sota-metric-label">⭐ Gênio / Saúde</span>
                <span class="sota-metric-val">${xpGenio} / ${xpSaude}</span>
                <span class="sota-metric-sub">XP Acumulado</span>
            </div>

            <!-- COLUNA 4: SONO -->
            <div class="sota-metric-box">
                <span class="sota-metric-label">💤 Sono (Impacto)</span>
                <span class="sota-metric-val ${colorSono}">${sonoQualidade}%</span>
                <span class="sota-metric-sub">${sonoHoras} Horas</span>
            </div>
        </div>
    `;

    container.appendChild(wrapper);
}

await main(dv);