// SOTA - renderDiarioAtleta.js v3.0 (Smart Scan & Performance)
// Otimização: Lê apenas arquivos modificados recentemente (Janela de 90 dias).

dv.paragraph("🔄 *Sincronizando Diário...*");

async function main() {
    try {
        const logsRootPath = "99 - BACKEND/Logs_Metricas/Exercicios";
        const rootFolder = app.vault.getAbstractFileByPath(logsRootPath);
        if (!rootFolder) { dv.paragraph("❌ Erro: Pasta de logs não encontrada."); return; }

        let eventos = [];
        let arquivosLidos = 0;
        
        // 1. JANELA DE RELEVÂNCIA (Performance)
        // Só lê arquivos modificados nos últimos 90 dias.
        // Se um exercício não foi tocado há 3 meses, ele não tem logs recentes.
        const cutoffDate = window.moment().subtract(90, 'days').valueOf();

        // 2. COLETA INTELIGENTE DE ARQUIVOS
        const getRecentFiles = (folder) => {
            let files = [];
            if (!folder.children) return [];
            for (let child of folder.children) {
                if (child.extension === 'md' && child.name === "raw_logs.md") {
                    // O PULO DO GATO: Checa data de modificação antes de ler
                    if (child.stat.mtime >= cutoffDate) {
                        files.push(child);
                    }
                } else if (!child.extension) { 
                    files = files.concat(getRecentFiles(child));
                }
            }
            return files;
        };

        const arquivosLog = getRecentFiles(rootFolder);
        
        // Ordena arquivos pelos mais recentemente modificados primeiro
        // Isso aumenta a chance de acharmos os logs recentes logo no início
        arquivosLog.sort((a, b) => b.stat.mtime - a.stat.mtime);

        if (arquivosLog.length === 0) {
            dv.container.innerHTML = "";
            dv.paragraph("💤 Nenhum treino registrado nos últimos 90 dias.");
            return;
        }

        // 3. LEITURA
        for (let file of arquivosLog) {
            const exercicioId = file.parent.name; 
            const content = await app.vault.cachedRead(file);
            
            // Lendo do final para o começo seria ideal, mas JS lê o arquivo todo.
            // A otimização real aqui é que filtramos os ARQUIVOS velhos.
            const lines = content.split('\n');

            lines.forEach(line => {
                if (!line.includes("(sessao_fim::WORK)")) return;

                // Regex Otimizado
                const notasMatch = line.match(/\(notas::["']?([^)]*?)["']?\)/);
                const rpeMatch = line.match(/\(esforco_rpe::(\d+)\)/);
                const qualMatch = line.match(/\(qualidade_forma::(\d+)\)/);
                
                // Se não tiver nenhum desses marcadores, nem processa o resto da linha (Performance)
                if (!notasMatch && !rpeMatch && !qualMatch) return;

                const dateMatch = line.match(/\(log_date::\s*(\d{4}-\d{2}-\d{2})\)/);
                // Se a data do log for muito antiga, ignora (Dupla checagem)
                if (dateMatch && window.moment(dateMatch[1]).isBefore(window.moment().subtract(60, 'days'))) return;

                const timeMatch = line.match(/\(log_time::\s*(\d{2}:\d{2}:\d{2})\)/);
                const cargaMatch = line.match(/\(carga_kg::\s*([\d.]+)\)/);

                const notaLimpa = notasMatch ? notasMatch[1].trim() : "";
                const rpe = rpeMatch ? parseInt(rpeMatch[1]) : 0;
                const qualidade = qualMatch ? parseInt(qualMatch[1]) : 10;
                const carga = cargaMatch ? parseFloat(cargaMatch[1]) : 0;
                const data = dateMatch ? dateMatch[1] : "1900-01-01";
                const hora = timeMatch ? timeMatch[1] : "00:00:00";

                const temNota = notaLimpa.length > 0;
                const rpeAlto = rpe >= 9;
                const qualidadeBaixa = qualidade <= 5;

                if (temNota || rpeAlto || qualidadeBaixa) {
                    let tipo = "info";
                    let icone = "📝";
                    if (qualidadeBaixa) { tipo = "danger"; icone = "⚠️"; }
                    else if (rpeAlto) { tipo = "warning"; icone = "🔥"; }
                    else if (temNota) { tipo = "quote"; icone = "💬"; }

                    eventos.push({
                        data, hora,
                        timestamp: window.moment(`${data} ${hora}`).valueOf(),
                        exercicio: exercicioId.replace(/_/g, ' ').toUpperCase(),
                        nota: notaLimpa,
                        rpe, qualidade, carga, tipo, icone
                    });
                }
            });
            
            arquivosLidos++;
        }

        // --- RENDERIZAÇÃO ---
        dv.container.innerHTML = ""; 

        if (eventos.length === 0) {
            dv.paragraph(`✅ **Tudo tranquilo.** (Analisados ${arquivosLidos} arquivos recentes)`);
            return;
        }

        // 1. ORDENAÇÃO POR TIMESTAMP (Mais preciso)
        eventos.sort((a, b) => b.timestamp - a.timestamp);

        // 2. CORTE RÍGIDO (Hard Limit)
        eventos = eventos.slice(0, 50);

        let html = "";
        let ultimoMes = "";

        for (let ev of eventos) {
            let dataObj = window.moment(ev.timestamp);
            let mes = dataObj.format("MMMM YYYY");
            let dia = dataObj.format("DD/MM");

            if (mes !== ultimoMes) {
                html += `<h4 style='margin-top:20px; border-bottom:1px solid var(--background-modifier-border); color:var(--text-normal); opacity:0.8'>${mes.charAt(0).toUpperCase() + mes.slice(1)}</h4>`;
                ultimoMes = mes;
            }

            let cor = "var(--interactive-accent)";
            if (ev.tipo === "danger") cor = "var(--color-red)";
            if (ev.tipo === "warning") cor = "var(--color-orange)";

            let conteudoExtra = "";
            if (ev.nota) conteudoExtra = `<div style='margin-top:4px; font-style:italic; opacity:0.9'>“${ev.nota}”</div>`;
            else if (ev.tipo === 'danger') conteudoExtra = `<div style='margin-top:4px; color:var(--color-red)'>Qualidade Técnica Baixa</div>`;
            else if (ev.tipo === 'warning') conteudoExtra = `<div style='margin-top:4px; color:var(--color-orange)'>Esforço Máximo</div>`;

            html += `
            <div style="
                border-left: 3px solid ${cor}; 
                background: var(--background-primary-alt); 
                padding: 8px 12px; 
                margin-bottom: 6px; 
                border-radius: 4px;
                font-size: 0.9em;
                box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            ">
                <div style="display:flex; justify-content:space-between; font-weight:600; color:var(--text-normal); align-items:center;">
                    <span>${ev.icone} ${ev.exercicio}</span>
                    <span style="color:var(--text-muted); font-size:0.85em;">${dia} <small style='opacity:0.6'>${ev.hora.slice(0,5)}</small></span>
                </div>
                <div style="font-size:0.85em; color:var(--text-muted); margin-bottom:2px; display:flex; gap:10px;">
                    <span>RPE: <b>${ev.rpe}</b></span>
                    <span>Qualidade: <b>${ev.qualidade}</b></span>
                    <span>Carga: <b>${ev.carga}kg</b></span>
                </div>
                ${conteudoExtra}
            </div>`;
        }

        dv.paragraph(html);

    } catch (e) {
        dv.paragraph(`❌ **ERRO JS:** ${e.message}`);
    }
}

await main();