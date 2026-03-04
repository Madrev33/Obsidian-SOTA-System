// 99 - BACKEND/Scripts/Views/Daily/renderQuestLog.js
// SOTA v3.2 - Quest Log Hunter (Filtro por #desafio)
// Filtra apenas desafios explicitamente criados como Quests.

async function main() {
    const container = dv.container;
    const dailyFolder = "01 - Registros/01. Daily";
    
    const dailyFiles = app.vault.getMarkdownFiles().filter(f => f.path.startsWith(dailyFolder));

    if (dailyFiles.length === 0) {
        dv.paragraph("ℹ️ Nenhuma nota diária encontrada.");
        return;
    }

    let todasAsTarefas = [];

    for (const file of dailyFiles) {
        const page = dv.page(file.path);
        if (page && page.file && page.file.tasks) {
            // MUDANÇA CRÍTICA: Filtra por "#desafio" em vez de apenas "#nivel"
            const desafiosDoArquivo = page.file.tasks
                .where(t => t.text.includes("#desafio") && !t.completed);
            
            if (desafiosDoArquivo.length > 0) {
                for (let task of desafiosDoArquivo) {
                    todasAsTarefas.push(task);
                }
            }
        }
    }

    todasAsTarefas.sort((a, b) => {
        const nomeA = a.file ? a.file.name : "";
        const nomeB = b.file ? b.file.name : "";
        return nomeA.localeCompare(nomeB);
    });

    if (todasAsTarefas.length === 0) {
        const card = document.createElement("div");
        card.style.backgroundColor = "rgba(var(--color-green-rgb), 0.1)";
        card.style.border = "1px solid var(--color-green)";
        card.style.borderRadius = "6px";
        card.style.padding = "10px";
        card.style.textAlign = "center";
        card.style.fontSize = "0.9em";
        card.style.color = "var(--text-muted)";
        card.innerHTML = "<strong>Quest Log Zerado</strong><br>Você está em dia com seus desafios.";
        container.appendChild(card);
    } else {
        dv.taskList(dv.array(todasAsTarefas), false);
    }
}

await main();