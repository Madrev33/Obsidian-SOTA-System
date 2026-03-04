// 99 - BACKEND/Scripts/Views/Daily/renderAprimoramentos.js
// SOTA v2.0 - Aprimoramentos Interativos (Functional Checkbox)

async function main(dv) {
    const app = dv.app;
    const page = dv.current();
    if (!page) return;

    const dateStr = page.file.name;
    const logPath = `99 - BACKEND/Logs_Metricas/Daily/${dateStr}.md`;
    const logFile = dv.page(logPath);
    const container = dv.container;
    
    // Função para mensagem vazia
    const renderEmpty = () => {
        dv.el("div", "✨ *Nenhum aprimoramento pendente.*", {
            // É AQUI NESSA LINHA ABAIXO QUE VOCÊ ADICIONA O BACKGROUND:
            attr: { style: "background-color: var(--background-primary-alt); text-align: center; color: var(--text-muted); padding: 15px; font-size: 0.9em; font-style: italic; border: 1px dashed var(--background-modifier-border); border-radius: 6px;" }
        });
    };

    if (!logFile) { renderEmpty(); return; }

    // Busca tarefas pendentes
    const tasks = logFile.file.tasks.where(t => 
        t.text.includes("#aprimoramento") && !t.completed
    );

    if (tasks.length === 0) { renderEmpty(); return; }

    // --- FUNÇÃO DE COMPLETAR TAREFA (O Cérebro) ---
    const toggleTask = async (taskPath, lineIndex, elementToRemove) => {
        const file = app.vault.getAbstractFileByPath(taskPath);
        if (!file) return;

        // Efeito visual imediato (UX)
        elementToRemove.style.opacity = "0.5";
        elementToRemove.style.textDecoration = "line-through";
        
        // Processamento no arquivo
        const content = await app.vault.read(file);
        const lines = content.split('\n');
        
        if (lines[lineIndex].includes('- [ ]')) {
            lines[lineIndex] = lines[lineIndex].replace('- [ ]', '- [x]');
            await app.vault.modify(file, lines.join('\n'));
            
            // Remove do DOM após breve delay para dar sensação de conclusão
            setTimeout(() => {
                elementToRemove.style.display = "none";
                // Checa se sobrou algo, se não, recarrega para mostrar msg vazia
                if (container.querySelectorAll('div[data-task="active"]').length <= 1) {
                   // Opcional: forçar refresh ou deixar vazio
                }
            }, 500);
        }
    };

    // --- RENDERIZAÇÃO ---
    const listaHtml = document.createElement('div');
    listaHtml.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';

    for (const task of tasks) {
        // Parse Metadados
        let texto = task.text;
        
        const timeMatch = texto.match(/\(log_time::\s*(\d{2}:\d{2})\)/); // Pega HH:mm direto se possível ou ajusta regex
        const timeFullMatch = texto.match(/\(log_time::\s*(\d{2}:\d{2}:\d{2})\)/);
        const hora = timeFullMatch ? timeFullMatch[1].substring(0, 5) : (timeMatch ? timeMatch[1] : "--:--");

        const dateMatch = texto.match(/\(log_date::\s*(\d{4}-\d{2}-\d{2})\)/);
        // Formata data para DD/MM
        let dataFormatada = "";
        if (dateMatch) {
            const [y, m, d] = dateMatch[1].split('-');
            dataFormatada = `${d}/${m}`;
        }

        // Limpa texto para exibição
        texto = texto
            .replace(/#aprimoramento/g, '')
            .replace(/#periodo\/\w+/g, '')
            .replace(/\(log_date::.*?\)/g, '')
            .replace(/\(log_time::.*?\)/g, '')
            .trim();

        // Container do Item
        const item = document.createElement('div');
        item.setAttribute('data-task', 'active');
        item.style.cssText = `
            display: flex; 
            align-items: center; 
            gap: 12px; /* Espaço entre elementos */
            background: var(--background-primary-alt); /* Cinza escuro */
            padding: 10px 15px; 
            border-radius: 8px;
            border: 1px solid var(--background-modifier-border);
            transition: all 0.3s ease;
        `;

        // 1. Checkbox Funcional
        const checkbox = document.createElement('input');
        checkbox.type = "checkbox";
        checkbox.style.cssText = "cursor: pointer; width: 16px; height: 16px; margin: 0;";
        checkbox.onclick = () => toggleTask(task.path, task.line, item);

        // 2. Metadados (Data e Hora)
        const metaContainer = document.createElement('div');
        metaContainer.style.cssText = "display: flex; gap: 5px; font-family: var(--font-monospace); font-size: 0.75em; color: var(--text-muted); opacity: 0.8;";
        
        const dateSpan = document.createElement('span');
        dateSpan.innerText = dataFormatada;
        
        const timeSpan = document.createElement('span');
        timeSpan.innerText = hora;
        
        metaContainer.appendChild(dateSpan);
        metaContainer.appendChild(document.createTextNode("•")); // Separador
        metaContainer.appendChild(timeSpan);

        // 3. Texto Principal
        const textSpan = document.createElement('span');
        textSpan.innerText = texto;
        textSpan.style.cssText = "font-size: 0.95em; color: var(--text-normal); line-height: 1.4;";

        // Montagem (Ordem Lógica: Checkbox -> Meta -> Texto)
        item.appendChild(checkbox);
        item.appendChild(metaContainer);
        item.appendChild(textSpan);
        
        listaHtml.appendChild(item);
    }

    container.appendChild(listaHtml);
}

await main(dv);