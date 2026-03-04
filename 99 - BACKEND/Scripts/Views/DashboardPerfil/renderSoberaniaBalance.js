// 99 - BACKEND/Scripts/Views/DashboardPerfil/renderSoberaniaBalance.js
// SOTA v1.1 - Balança de Soberania (Fix Renderização)
// Compara tempo Interno (Eu) vs Externo (Eles) com precisão de segundos.

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
            dv.paragraph("ℹ️ Sem dados recentes para balanço de soberania.");
            return;
        }

        // 1. ACUMULAÇÃO PRECISA (SEGUNDOS)
        let totalInterno = 0;
        let totalExterno = 0;

        for (let p of paginas) {
            // Tenta ler os segundos brutos se existirem (novo padrão)
            // Se não, reconverte das horas decimais (legado/fallback seguro)
            let diaInterno = p.foco_interno_segundos;
            if (diaInterno === undefined) diaInterno = Math.round((p.foco_interno_horas || 0) * 3600);
            
            let diaExterno = p.foco_externo_segundos;
            if (diaExterno === undefined) diaExterno = Math.round((p.foco_externo_horas || 0) * 3600);

            totalInterno += diaInterno;
            totalExterno += diaExterno;
        }

        const totalGeral = totalInterno + totalExterno;
        
        if (totalGeral === 0) {
            dv.paragraph("ℹ️ Nenhum tempo de foco registrado nos últimos 30 dias.");
            return;
        }

        // 2. CÁLCULO DE PORCENTAGEM
        const percInterno = ((totalInterno / totalGeral) * 100).toFixed(1);
        const percExterno = ((totalExterno / totalGeral) * 100).toFixed(1);

        // 3. FORMATAÇÃO HH:MM:SS
        const formatarPreciso = (segundos) => {
            const h = Math.floor(segundos / 3600).toString().padStart(2, '0');
            const m = Math.floor((segundos % 3600) / 60).toString().padStart(2, '0');
            const s = (segundos % 60).toString().padStart(2, '0');
            return `${h}:${m}:${s}`;
        };

        const textoInterno = formatarPreciso(totalInterno);
        const textoExterno = formatarPreciso(totalExterno);

        // 4. RENDERIZAÇÃO (HTML MINIFICADO PARA EVITAR QUEBRA)
        // Removemos quebras de linha desnecessárias dentro da string HTML para evitar que o Markdown interprete como código.
        const html = `
<div style="background-color: var(--background-secondary); border: 1px solid var(--background-modifier-border); border-radius: 8px; padding: 15px; margin-top: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 10px;">
        <div style="text-align: left;">
            <div style="font-size: 0.75em; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Soberania Interna (Eu)</div>
            <div style="font-size: 1.4em; font-weight: 800; color: var(--interactive-accent);">${textoInterno}</div>
        </div>
        <div style="text-align: right;">
            <div style="font-size: 0.75em; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Soberania Externa (Outros)</div>
            <div style="font-size: 1.4em; font-weight: 800; color: var(--text-faint);">${textoExterno}</div>
        </div>
    </div>
    <div style="width: 100%; height: 16px; background-color: var(--background-modifier-border); border-radius: 8px; overflow: hidden; display: flex;">
        <div style="width: ${percInterno}%; height: 100%; background: var(--interactive-accent); display: flex; align-items: center; justify-content: center;"></div>
        <div style="width: ${percExterno}%; height: 100%; background: var(--text-faint); opacity: 0.3;"></div>
    </div>
    <div style="display: flex; justify-content: space-between; margin-top: 6px; font-size: 0.8em; color: var(--text-muted);">
        <span>${percInterno}%</span>
        <span>${percExterno}%</span>
    </div>
</div>`;

        dv.paragraph(html);

    } catch (e) {
        dv.paragraph(`❌ Erro no Balanço de Soberania: ${e.message}`);
    }
}

await main();