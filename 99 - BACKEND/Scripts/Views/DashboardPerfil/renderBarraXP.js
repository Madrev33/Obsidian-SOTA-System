// 99 - BACKEND/Scripts/Views/DashboardPerfil/renderBarraXP.js
// SOTA v2.1 - Lógica de Barra com XP Cíclico
// Utiliza xp_barra_atual para o cálculo, garantindo a exibição correta do progresso no nível atual.

(() => {
    return async function renderBar(dv, input) {
        // 1. Extração de Dados do Perfil
        const page = dv.current();
        
        // --- CORREÇÃO: Usar os campos corretos ---
        const xpBarraAtual = parseInt(page.xp_barra_atual || 0);
        const xpParaProximoNivel = parseInt(page.xp_para_proximo_nivel || 100);
        
        const nivelAtual = parseInt(page.nivel || 1);
        const titulo = page.titulo || "Iniciado";

        // --- LÓGICA DE CÁLCULO SIMPLIFICADA ---
        // A base do nível atual é sempre 0 (para a barra)
        // O teto é o valor necessário para o próximo nível.
        
        // 2. Cálculo da Porcentagem
        let porcentagem = 0;
        if (xpParaProximoNivel > 0) {
            porcentagem = (xpBarraAtual / xpParaProximoNivel) * 100;
        }

        // Clamp visual (trava entre 0% e 100%)
        porcentagem = Math.min(100, Math.max(0, porcentagem));
        const porcentagemVisual = porcentagem.toFixed(1);

        // 3. Renderização HTML
        const html = `
<div style="background-color: var(--background-secondary); border: 1px solid var(--background-modifier-border); border-radius: 8px; padding: 15px; margin: 10px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 8px;">
        <div>
            <span style="font-size: 1.5em; font-weight: bold; color: var(--interactive-accent);">Nível ${nivelAtual}</span>
            <span style="font-size: 0.9em; color: var(--text-muted); margin-left: 8px;">${titulo}</span>
        </div>
        <div style="text-align: right;">
            <span style="font-weight: 600; color: var(--text-normal);">${xpBarraAtual}</span>
            <span style="color: var(--text-muted); font-size: 0.8em;"> / ${xpParaProximoNivel} XP</span>
        </div>
    </div>
    
    <!-- Container da Barra -->
    <div style="width: 100%; height: 12px; background-color: var(--background-modifier-border); border-radius: 6px; overflow: hidden; position: relative;">
        <!-- Barra de Progresso -->
        <div style="width: ${porcentagem}%; height: 100%; background: linear-gradient(90deg, var(--interactive-accent) 0%, var(--interactive-accent-hover) 100%); border-radius: 6px; transition: width 0.5s ease-in-out; box-shadow: 0 0 10px rgba(var(--interactive-accent-rgb), 0.4);"></div>
    </div>
    
    <div style="display: flex; justify-content: space-between; margin-top: 6px; font-size: 0.75em; color: var(--text-muted);">
        <span>Base: 0 XP</span>
        <span>${porcentagemVisual}% para o Nível ${nivelAtual + 1}</span>
    </div>
</div>
`;
        return html.trim();
    }
})();