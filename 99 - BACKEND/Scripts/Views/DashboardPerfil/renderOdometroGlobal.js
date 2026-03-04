// 99 - BACKEND/Scripts/Views/DashboardPerfil/renderOdometroGlobal.js
// SOTA v4.1 - Odômetro com Leitura de Segundos (Precision Fix)
// Lê as chaves '_segundos' dos arquivos de métrica para garantir a captura correta dos dados.

async function main() {
    try {
        const metricsPath = "99 - BACKEND/Logs_Metricas/Daily/Processed";
        const hoje = window.moment();
        const limiteData = hoje.clone().subtract(30, 'days');
        
        const paginas = dv.pages(`"${metricsPath}"`)
            .where(p => {
                const dataArquivo = window.moment(p.file.name.substring(0, 10), "YYYY-MM-DD");
                return dataArquivo.isValid() && dataArquivo.isSameOrAfter(limiteData);
            });

        if (!paginas || paginas.length === 0) {
            dv.paragraph("ℹ️ Sem dados recentes (30 dias).");
            return;
        }

        let totalFocoMin = 0;
        let totalPausaMin = 0;
        let diasCount = 0;

        for (let p of paginas) {
            // --- CORREÇÃO APLICADA AQUI ---
            // Lemos o valor em segundos e convertemos para minutos, que é mais robusto.
            const focoSegundos = Number(p.total_foco_segundos) || 0;
            const pausaSegundos = Number(p.total_pausa_segundos) || 0;
            
            totalFocoMin += Math.round(focoSegundos / 60);
            totalPausaMin += Math.round(pausaSegundos / 60);
            // --- FIM DA CORREÇÃO ---

            diasCount++;
        }

        const mediaFoco = diasCount > 0 ? Math.round(totalFocoMin / diasCount) : 0;
        const mediaPausa = diasCount > 0 ? Math.round(totalPausaMin / diasCount) : 0;

        // Função de formatação (Minutos -> "2h 30m")
        const formatar = (m) => {
            const h = Math.floor(m / 60);
            const min = Math.round(m % 60);
            if (h > 0) return `${h}h<span style="font-size:0.7em; opacity:0.7">${min}m</span>`;
            return `${min}<span style="font-size:0.7em; opacity:0.7">m</span>`;
        };

        const formatarGrande = (m) => {
             const h = Math.floor(m / 60);
             const min = Math.round(m % 60);
             return `${h}h <span style="font-size:0.8em; opacity:0.7">${min}m</span>`;
        }

        const html = `
<div style="display:flex; gap:10px; width:100%; margin-top:10px;">
    <!-- Card Foco Total -->
    <div style="flex:1; background:var(--background-secondary); border:1px solid var(--background-modifier-border); padding:15px; border-radius:8px; text-align:center;">
        <div style="font-size:0.7em; color:var(--text-muted); letter-spacing:1px; margin-bottom:5px;">FOCO TOTAL</div>
        <div style="font-size:1.8em; font-weight:800; color:var(--interactive-accent);">${formatarGrande(totalFocoMin)}</div>
        <div style="font-size:0.7em; color:var(--text-faint); margin-top:5px;">${diasCount} dias</div>
    </div>
    
    <!-- Card Pausa Total -->
    <div style="flex:1; background:var(--background-secondary); border:1px solid var(--background-modifier-border); padding:15px; border-radius:8px; text-align:center;">
        <div style="font-size:0.7em; color:var(--text-muted); letter-spacing:1px; margin-bottom:5px;">PAUSA TOTAL</div>
        <div style="font-size:1.8em; font-weight:800; color:#f1c40f;">${formatarGrande(totalPausaMin)}</div>
        <div style="font-size:0.7em; color:var(--text-faint); margin-top:5px;">Recuperação</div>
    </div>
    
    <!-- Card Média Diária -->
    <div style="flex:1; background:var(--background-secondary); border:1px solid var(--background-modifier-border); padding:15px; border-radius:8px; text-align:center;">
        <div style="font-size:0.7em; color:var(--text-muted); letter-spacing:1px; margin-bottom:5px;">MÉDIA / DIA</div>
        <div style="font-size:1.5em; font-weight:800; display:flex; justify-content:center; align-items:center; gap:8px;">
            <span style="color:var(--interactive-accent);">${formatar(mediaFoco)}</span>
            <span style="font-size:0.6em; color:var(--text-muted);">|</span>
            <span style="color:#f1c40f;">${formatar(mediaPausa)}</span>
        </div>
        <div style="font-size:0.7em; color:var(--text-faint); margin-top:5px;">Foco | Pausa (30d)</div>
    </div>
</div>`;

        dv.paragraph(html);

    } catch (e) {
        dv.paragraph(`❌ Erro Visual: ${e.message}`);
    }
}

await main();