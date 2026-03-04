// 99 - BACKEND/Scripts/Views/Daily/renderActivitySummary.js
// SOTA v3.0 - Resumo de Atividades Diárias (Dataview Puro & Tempo de Foco)

async function main() {
    try {
        const page = dv.current();
        if (!page || !/^\d{4}-\d{2}-\d{2}$/.test(page.file.name)) {
            dv.paragraph("⚠️ Nota atual não é uma Nota Diária válida.");
            return;
        }

        const dateStr = page.file.name;
        const logPath = `99 - BACKEND/Logs_Metricas/Daily/${dateStr}.md`;
        const logFile = app.vault.getAbstractFileByPath(logPath);

        if (!logFile) {
            dv.el("div", "ℹ️ *Ainda não há registros de atividade para hoje.*", { attr: { style: "text-align: center; padding: 20px; color: var(--text-muted);" } });
            return;
        }

        const content = await app.vault.cachedRead(logFile);
        const lines = content.split('\n');

        // 1. AGREGAÇÃO DE DADOS (UIDs e Segundos)
        const projetos = new Map();
        const midias = new Map();
        const exercicios = new Map();
        const insights = [];

        const limparTexto = (texto) => texto.replace(/^\s*-\s*\[.\]\s*/, '').replace(/^\s*-\s*/, '').replace(/\(.*?::.*?\)/g, '').replace(/#\S+/g, '').replace(/\s\s+/g, ' ').trim();

        for (const line of lines) {
            if (!line.trim() || !line.includes("sessao_fim::WORK")) continue;

            const duracaoMatch = line.match(/\(duracao_total_sessao_segundos::\s*(\d+)\)/);
            const duracao = duracaoMatch ? parseInt(duracaoMatch[1]) : 0;
            if (duracao === 0) continue;

            // Extrai UID da Fonte/Task
            const linkMatch = line.match(/\(task_link::\s*(\[\[.*?\]\])\)/) || line.match(/\(Fonte::\s*(\[\[.*?\]\])\)/);
            if (linkMatch && linkMatch[1]) {
                const path = linkMatch[1].replace(/\[|\]/g, '').split('#')[0];
                const p = dv.page(path);
                if (p && (p.hub_uid || p.sota_uid)) {
                    const uid = p.hub_uid || p.sota_uid;
                    if (line.includes("#projeto/")) projetos.set(uid, (projetos.get(uid) || 0) + duracao);
                    else if (line.includes("#midia/")) midias.set(uid, (midias.get(uid) || 0) + duracao);
                }
            }
            
            const exercicioMatch = line.match(/\(exercicio_id::\s*([\w-]+)\)/);
            if (exercicioMatch && exercicioMatch[1]) {
                const id = exercicioMatch[1];
                exercicios.set(id, (exercicios.get(id) || 0) + duracao);
            }

            if (line.includes("#ideia") || line.includes("#reflexao")) insights.push(limparTexto(line));
        }
        
        // 2. RESOLUÇÃO DE NOMES E FORMATAÇÃO
        const formatarSegundos = (s) => {
            const h = Math.floor(s / 3600).toString().padStart(2, '0');
            const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
            const s_ = (s % 60).toString().padStart(2, '0');
            return `${h}:${m}:${s_}`;
        };
        
        const getDadosTabela = (map, prefixToRemove, tipoQuery) => {
            if (map.size === 0) return [];
            return Array.from(map.entries()).map(([uid, segundos]) => {
                let link;
                if (tipoQuery === 'exercicio') {
                    const page = dv.pages().where(p => p.tipo === 'exercicio' && p.file.name.toLowerCase().replace('.md','').replace(/\s+/g,'_') === uid.toLowerCase()).first();
                    link = page ? dv.fileLink(page.file.path, false, page.file.name.replace('.md','')) : uid;
                } else {
                    const page = dv.pages(`"${prefixToRemove}"`).where(p => p.sota_uid === uid).first();
                    link = page ? dv.fileLink(page.file.path, false, page.file.name.replace(/00\. HUB - /, '')) : uid;
                }
                return [link, `\`${formatarSegundos(segundos)}\``];
            });
        };

        const dadosProjetos = getDadosTabela(projetos, "02 - Projetos");
        const dadosMidias = getDadosTabela(midias, "03 - Conhecimento/01 - Mídias");
        const dadosExercicios = getDadosTabela(exercicios, "", "exercicio");

        // 3. RENDERIZAÇÃO COM DATAVIEW PURO
        let hasContent = false;

        const criarTabela = (titulo, icone, dados) => {
            if (dados.length === 0) return;
            hasContent = true;
            dv.header(4, `${icone} ${titulo}`);
            dv.table([titulo, "Tempo de Foco"], dados);
        };
        
        const criarLista = (titulo, icone, items) => {
             if (items.length === 0) return;
             hasContent = true;
             dv.header(4, `${icone} ${titulo}`);
             dv.list(items);
        }

        criarTabela("Projetos Focados", "🚀", dadosProjetos);
        criarTabela("Mídias Consumidas", "📚", dadosMidias);
        criarTabela("Exercícios Praticados", "🏋️‍♂️", dadosExercicios);
        criarLista("Insights & Reflexões", "💡", insights);
        
        if (!hasContent) {
            dv.el("div", "ℹ️ *Nenhuma atividade registrada nos logs ainda.*", { attr: { style: "text-align: center; color: var(--text-muted);" } });
        }

    } catch(e) {
        dv.paragraph(`❌ Erro ao gerar resumo de atividades: ${e.message}`);
        console.error("Erro em renderActivitySummary.js:", e);
    }
}

await main();