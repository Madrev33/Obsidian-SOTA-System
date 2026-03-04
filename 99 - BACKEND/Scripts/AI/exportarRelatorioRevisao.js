// SOTA - exportarRelatorioRevisao.js v4.3 (Timestamp Precision)
// Caminho: 99 - BACKEND/Scripts/DashboardRevisao/exportarRelatorioRevisao.js

module.exports = async (params) => {
    const { app, obsidian } = params;
    const { Notice, Modal, ButtonComponent, TFile } = obsidian;
    const moment = params.obsidian.moment;

    console.log("🚀 [SOTA DEBUG v4.3] Timestamp Edition INICIADO.");

    // --- ESTILOS CSS ---
    const styleId = 'sota-export-styles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
            .sota-modal-container { padding: 10px 20px; }
            .sota-header { text-align: center; margin-bottom: 20px; font-size: 1.4em; font-weight: 700; color: var(--text-normal); }
            .sota-date-section { display: flex; gap: 15px; justify-content: center; background: var(--background-secondary); padding: 15px; border-radius: 8px; border: 1px solid var(--background-modifier-border); margin-bottom: 20px; }
            .sota-date-group { display: flex; flex-direction: column; gap: 5px; width: 45%; }
            .sota-date-label { font-size: 0.8em; font-weight: 600; color: var(--text-muted); text-transform: uppercase; }
            .sota-date-input { background: var(--background-primary); border: 1px solid var(--background-modifier-border); padding: 8px; border-radius: 4px; color: var(--text-normal); width: 100%; }
            .sota-toggles-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; }
            .sota-toggle-card { background: var(--background-primary); border: 1px solid var(--background-modifier-border); border-radius: 8px; padding: 12px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: all 0.2s; }
            .sota-toggle-card:hover { border-color: var(--interactive-accent); }
            .sota-toggle-card.active { background: rgba(var(--interactive-accent-rgb), 0.1); border-color: var(--interactive-accent); }
            .sota-card-info { display: flex; flex-direction: column; }
            .sota-card-title { font-weight: 600; font-size: 0.95em; }
            .sota-card-desc { font-size: 0.8em; color: var(--text-muted); }
            .sota-check { width: 20px; height: 20px; border-radius: 4px; border: 2px solid var(--text-muted); display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
            .sota-toggle-card.active .sota-check { background: var(--interactive-accent); border-color: var(--interactive-accent); }
            .sota-check::after { content: '✔'; color: white; font-size: 14px; opacity: 0; transform: scale(0); transition: all 0.2s; }
            .sota-toggle-card.active .sota-check::after { opacity: 1; transform: scale(1); }
            .sota-footer { border-top: 1px solid var(--background-modifier-border); padding-top: 20px; display: flex; justify-content: flex-end; gap: 10px; }
        `;
        document.head.appendChild(style);
    }

    class ExportModal extends Modal {
        constructor(app) {
            super(app);
            this.dates = {
                start: moment().subtract(6, 'days').format('YYYY-MM-DD'),
                end: moment().format('YYYY-MM-DD')
            };
            this.toggles = {
                metricas: { title: "📊 Métricas do Sistema", desc: "XP, Foco, Pausa, Projetos", active: true },
                trabalho: { title: "🧠 Trabalho & Ação", desc: "Wins, Erros, Distrações", active: true },
                criatividade: { title: "💡 Ideias & Reflexões", desc: "Varredura de pasta + Logs", active: true },
                diario: { title: "📝 Diário & Resumo", desc: "Resumo do dia, Planejamento", active: true },
                saude: { title: "🧬 Saúde & Treino", desc: "Nutrição, Emoções, Treino", active: true }
            };
        }

        onOpen() {
            const { contentEl } = this;
            contentEl.empty();
            contentEl.addClass("sota-modal-container");
            contentEl.createDiv({ cls: "sota-header", text: "📤 Gerar Contexto para Coach AI" });

            const dateSection = contentEl.createDiv({ cls: "sota-date-section" });
            const groupStart = dateSection.createDiv({ cls: "sota-date-group" });
            groupStart.createDiv({ cls: "sota-date-label", text: "Data Início" });
            const inputStart = groupStart.createEl("input", { type: "date", cls: "sota-date-input", value: this.dates.start });
            inputStart.onchange = (e) => this.dates.start = e.target.value;

            const groupEnd = dateSection.createDiv({ cls: "sota-date-group" });
            groupEnd.createDiv({ cls: "sota-date-label", text: "Data Fim" });
            const inputEnd = groupEnd.createEl("input", { type: "date", cls: "sota-date-input", value: this.dates.end });
            inputEnd.onchange = (e) => this.dates.end = e.target.value;

            contentEl.createDiv({ text: "O que incluir no dossiê?", style: "margin-bottom: 10px; font-weight: 600; color: var(--text-muted);" });
            const grid = contentEl.createDiv({ cls: "sota-toggles-grid" });

            Object.keys(this.toggles).forEach(key => {
                const item = this.toggles[key];
                const card = grid.createDiv({ cls: `sota-toggle-card ${item.active ? 'active' : ''}` });
                const info = card.createDiv({ cls: "sota-card-info" });
                info.createDiv({ cls: "sota-card-title", text: item.title });
                info.createDiv({ cls: "sota-card-desc", text: item.desc });
                const check = card.createDiv({ cls: "sota-check" });
                card.onclick = () => {
                    item.active = !item.active;
                    card.classList.toggle("active", item.active);
                };
            });

            const footer = contentEl.createDiv({ cls: "sota-footer" });
            new ButtonComponent(footer).setButtonText("Cancelar").onClick(() => this.close());
            new ButtonComponent(footer).setButtonText("📄 Gerar Dossiê").setCta().onClick(() => this.generateDossier());
        }

        async generateDossier() {
            // Definição do Modal de Aviso Rico
            class WarningModal extends Modal {
                constructor(app, onConfirm) {
                    super(app);
                    this.onConfirm = onConfirm;
                }

                onOpen() {
                    const { contentEl } = this;
                    contentEl.empty();
                    
                    const style = document.createElement('style');
                    style.textContent = `
                        .sota-warning-box {
                            background-color: rgba(var(--color-yellow-rgb), 0.1);
                            border: 1px solid var(--color-yellow);
                            border-left: 5px solid var(--color-yellow);
                            border-radius: 5px;
                            padding: 15px;
                            margin-bottom: 20px;
                            color: var(--text-normal);
                        }
                        .sota-warning-title {
                            display: flex; align-items: center; gap: 8px;
                            font-weight: bold; color: var(--color-yellow);
                            margin-bottom: 10px; font-size: 1.1em;
                        }
                        .sota-warning-body { font-size: 0.9em; line-height: 1.5; }
                        .sota-modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px; }
                    `;
                    contentEl.appendChild(style);

                    contentEl.createEl("h2", { text: "🛡️ Protocolo de Segurança S.O.T.A." });

                    const warningBox = contentEl.createDiv({ cls: "sota-warning-box" });
                    warningBox.innerHTML = `
                        <div class="sota-warning-title">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                            A Maldição da Validação
                        </div>
                        <div class="sota-warning-body">
                            <p><strong>Com grandes poderes vêm grandes responsabilidades.</strong></p>
                            <ul>
                                <li><strong>Você é o Filtro Final:</strong> A IA pode alucinar. Você precisa ter conhecimentos Psicológicos e Neurocientíficos para julgar a resposta (Ou uma pessoa ao lado com conhecimento como um Psicólogo).</li>
                                <li><strong>Viés de Confirmação:</strong> A IA tende a concordar com você. Questione-a: <em>"E se o contrário for verdade?"</em></li>
                                <li><strong>Contexto é Rei:</strong> Em conflitos no Relacionamento, a IA só sabe o seu lado, coloque o lado da outra pessoa tmb. Não estrague o seu relacionamento por conta de Tokens gerados por uma IA. </li>
                            </ul>
                            <p><em>Use com honestidade e Crítica brutal para evoluir de verdade.</em></p>
                        </div>
                    `;

                    const footer = contentEl.createDiv({ cls: "sota-modal-footer" });
                    new ButtonComponent(footer)
                        .setButtonText("Cancelar")
                        .onClick(() => this.close());
                        
                    new ButtonComponent(footer)
                        .setButtonText("Li e Concordo: Gerar Dossiê")
                        .setCta()
                        .onClick(() => {
                            this.onConfirm();
                            this.close();
                        });
                }
            }

            // A única ação do generateDossier agora é abrir o WarningModal
            new WarningModal(this.app, async () => {
                // O código de geração de relatório foi MOVIDO para dentro do callback
                new Notice("⚙️ Processando Dossiê S.O.T.A....");
                
                // Fecha o modal principal ANTES de começar o processo pesado
                this.close(); 
                
                const report = await buildContextReport(app, this.dates, this.toggles);
                if (report) await saveReport(app, report);
            }).open();
        }
    }

    // --- FUNÇÕES DE FORMATAÇÃO ---

    const formatTime = (seconds) => {
        if (!seconds) return "0s";
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    };

    // Extrai o horário (HH:mm) de qualquer linha de log SOTA
    const getCleanLogTime = (line) => {
        // Regex para (log_time::13:23:45) ou (log_time::13:23)
        const match = line.match(/\(log_time::\s*(\d{2}:\d{2})/);
        return match ? `[${match[1]}]` : "";
    };

    // Limpa os metadados técnicos do final da linha
    const cleanLogMetadata = (line) => {
        return line
            .replace(/\(log_date::.*?\)/g, '')
            .replace(/\(log_time::.*?\)/g, '')
            .replace(/\(id_.*?\)/g, '')
            .replace(/#[\w/-]+/g, '') // Remove hashtags
            .trim();
    };

    // --- CRAWLER DE NOTAS ---
    async function extractContentFromFile(app, file) {
        if (!file) return "";
        const content = await app.vault.read(file);
        
        const headerRegex = /^##\s*(?:📝)?\s*Conteúdo/im;
        const match = content.match(headerRegex);
        
        let extracted = "";
        
        if (match) {
            const startIndex = match.index + match[0].length;
            const textAfter = content.substring(startIndex);
            const endRegex = /\n(##\s|---)/;
            const endMatch = textAfter.match(endRegex);
            extracted = endMatch ? textAfter.substring(0, endMatch.index) : textAfter;
        } else {
            extracted = content.replace(/^---[\s\S]+?---\n/, "");
        }
        
        const clean = extracted.trim();
        if (clean.length === 0) return "> *[Sem conteúdo textual]*";
        
        return clean.split('\n').map(l => `    > ${l}`).join('\n');
    }

    async function scanFolderForNotes(app, dateStr) {
        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(5, 7);
        const folderPath = `01 - Registros/02. Anotações/${year}/${month}`;
        
        if (!await app.vault.adapter.exists(folderPath)) return [];

        const folder = app.vault.getAbstractFileByPath(folderPath);
        const files = folder.children.filter(f => 
            f instanceof TFile && 
            f.extension === 'md' &&
            f.basename.startsWith(dateStr) && 
            !f.name.toLowerCase().includes(".excalidraw")
        );
        return files;
    }

    // --- FORMATADORES ESPECÍFICOS COM TIMESTAMP ---

    const formatExerciseLog = (line) => {
        const time = getCleanLogTime(line);
        let nome = "Treino";
        const taskLinkMatch = line.match(/\(tarefa_focada::"(.*?)"\)/);
        const exIdMatch = line.match(/\(exercicio_id::(.*?)\)/);
        if (taskLinkMatch) nome = taskLinkMatch[1].replace(/#\S+/g, '').trim();
        else if (exIdMatch) nome = exIdMatch[1].replace(/_/g, ' ');

        const duracaoMatch = line.match(/\(duracao_segundos::(\d+)\)/) || line.match(/\(duracao_total_sessao_segundos::(\d+)\)/);
        const duracao = duracaoMatch ? formatTime(parseInt(duracaoMatch[1])) : "N/D";
        const notasMatch = line.match(/\(notas::"(.*?)"\)/);
        const notas = notasMatch ? `\n    - 💬 Notas: "${notasMatch[1]}"` : "";

        return `- ${time} 🏋️‍♂️ **${nome}** (Duração: ${duracao})${notas}`;
    };

    const formatDistractionLog = (line) => {
        const time = getCleanLogTime(line);
        const dist = line.match(/\(Distração::(.*?)\)/)?.[1] || "";
        const gat = line.match(/\(Gatilho::(.*?)\)/)?.[1] || "";
        return `- ${time} ⚠️ **Distração:** ${dist} | Gatilho: ${gat}`;
    };

    const formatHabitLog = (line) => {
        const time = getCleanLogTime(line);
        
        if (line.includes("#habito_concluido")) {
            let nome = "Hábito";
            const nomeMatch = line.match(/Hábito Concluído:\s*(.*?)\s*#/);
            if (nomeMatch) nome = nomeMatch[1].trim();
            else {
                const idMatch = line.match(/\(id_habito::\s*(.*?)\)/);
                if(idMatch) nome = idMatch[1];
            }
            return `- ${time} ✅ **${nome}**`;
        }
        
        if (line.includes("#habito_registro")) {
            let nome = "Contador";
            const nomeMatch = line.match(/Registro Hábito:\s*(.*?)\s*\(/);
            if(nomeMatch) nome = nomeMatch[1].trim();
            
            const valorMatch = line.match(/\(valor::\s*(\d+)\)/);
            const valor = valorMatch ? valorMatch[1] : "1";
            return `- ${time} 🔢 **${nome}**: +${valor}`;
        }
        return "";
    };

    // --- MOTOR PRINCIPAL ---

    async function buildContextReport(app, dates, toggles) {
        const start = moment(dates.start);
        const end = moment(dates.end);
        let md = `# 🧠 Contexto SOTA: ${start.format("DD/MM")} a ${end.format("DD/MM")}\n\n`;

        for (let m = start.clone(); m.isSameOrBefore(end); m.add(1, 'days')) {
            const dateStr = m.format("YYYY-MM-DD");
            
            const metricsPath = `99 - BACKEND/Logs_Metricas/Daily/Processed/${dateStr}_metrics.md`;
            const logPath = `99 - BACKEND/Logs_Metricas/Daily/${dateStr}.md`;
            const dailyPath = `01 - Registros/01. Daily/${m.format("YYYY")}/${m.format("MM")}/${dateStr}.md`;

            const hasMetrics = await app.vault.adapter.exists(metricsPath);
            const hasLogs = await app.vault.adapter.exists(logPath);
            const hasDaily = await app.vault.adapter.exists(dailyPath);
            
            let dailyNotesFiles = [];
            if (toggles.criatividade.active) {
                dailyNotesFiles = await scanFolderForNotes(app, dateStr);
            }
            const hasNotes = dailyNotesFiles.length > 0;

            if (!hasMetrics && !hasLogs && !hasDaily && !hasNotes) continue;

            md += `\n## 📅 DIA: ${dateStr} (${m.format("dddd")})\n`;

            // 1. MÉTRICAS
            if (toggles.metricas.active && hasMetrics) {
                const metricsFile = app.vault.getAbstractFileByPath(metricsPath);
                const cache = app.metadataCache.getFileCache(metricsFile);
                if (cache?.frontmatter) {
                    const fm = cache.frontmatter;
                    const stats = {
                        XP: fm.xp_dia_total,
                        Foco: fm.total_foco_tempo,
                        Pausa: fm.total_pausa_tempo,
                        Projetos: fm.projetos_focados_ids || [],
                        Midias: fm.midias_consumidas_ids || [],
                        Sono: { Horas: fm.total_horas_sono, Qualidade: fm.qualidade_sono_calculada },
                        BioRitmo: { Energia: fm.energia_media_dia, Humor: fm.humor_media_dia }
                    };
                    md += `### 📊 Stats\n\`\`\`json\n${JSON.stringify(stats)}\n\`\`\`\n`;
                }
            }

            // 2. DIÁRIO (Frontmatter Expandido)
            if (toggles.diario.active && hasDaily) {
                const dailyFile = app.vault.getAbstractFileByPath(dailyPath);
                const cache = app.metadataCache.getFileCache(dailyFile);
                const fm = cache?.frontmatter || {};
                let diarioText = "";
                let acontecimentos = []; // Mudança para Array para facilitar join

                if (fm.acontecimento_madrugada) acontecimentos.push(`> **Madrugada:** ${fm.acontecimento_madrugada}`);
                if (fm.acontecimento_manha) acontecimentos.push(`> **Manhã:** ${fm.acontecimento_manha}`);
                if (fm.acontecimento_tarde) acontecimentos.push(`> **Tarde:** ${fm.acontecimento_tarde}`);
                if (fm.acontecimento_noite) acontecimentos.push(`> **Noite:** ${fm.acontecimento_noite}`);
                
                // MUDANÇA: Join com \n\n cria um espaço em branco real entre os blocos
                if (acontecimentos.length > 0) {
                    diarioText += `**Acontecimentos:**\n${acontecimentos.join('\n\n')}\n\n`;
                }

                if (fm.oque_fez_hoje) diarioText += `**Resumo do Dia:**\n> ${fm.oque_fez_hoje}\n\n`;
                if (fm.oque_fazer_amanha) diarioText += `**Para Amanhã:**\n> ${fm.oque_fazer_amanha}\n\n`;
                if (fm.feedback_positivo) diarioText += `**Feedback Positivo:** ${fm.feedback_positivo}\n`;
                if (fm.feedback_negativo) diarioText += `**Feedback Negativo:** ${fm.feedback_negativo}\n`;

                if(diarioText) md += `### 📝 Diário\n${diarioText}\n`;
            }

            // 3. LOGS & CRAWLER
            if (hasLogs) {
                const logFile = app.vault.getAbstractFileByPath(logPath);
                const content = await app.vault.read(logFile);
                const lines = content.split('\n');
                
                let logsTrabalho = [];
                let logsCriativos = [];
                let logsSaude = [];
                let logsHabitos = [];

                for (const line of lines) {
                    const l = line.trim();
                    if (!l.startsWith("- ")) continue;
                    
                    const time = getCleanLogTime(l);

                    // HÁBITOS
                    if (toggles.diario.active && (l.includes("#habito_concluido") || l.includes("#habito_registro"))) {
                        logsHabitos.push(formatHabitLog(l));
                    }

                    // SAÚDE (Refeições e Emoções - Limpeza Genérica)
                    if (toggles.saude.active) {
                        if (l.includes("sessao_fim::WORK") && (l.includes("#exercicio/") || l.includes("exercicio_id"))) {
                            logsSaude.push(formatExerciseLog(l));
                        } else if (l.includes("#refeicao_") || l.includes("#log_")) {
                            const clean = cleanLogMetadata(l).replace(/^-/, '').trim();
                            logsSaude.push(`- ${time} ${clean}`);
                        }
                    }

                    // TRABALHO
                    if (toggles.trabalho.active) {
                        if (l.includes("#distracao")) {
                            logsTrabalho.push(formatDistractionLog(l));
                        } else if (l.includes("#win") || l.includes("#aprendizado_erro")) {
                            const clean = cleanLogMetadata(l).replace("- [ ]", "-").replace(/^-/, '').trim();
                            logsTrabalho.push(`- ${time} ${clean}`);
                        }
                    }
                }

                if (logsHabitos.length > 0) md += `#### 🔄 Rotina & Hábitos\n${logsHabitos.join('\n')}\n`;
                if (logsTrabalho.length > 0) md += `### 🧠 Trabalho & Aprendizado\n${logsTrabalho.join('\n')}\n`;
                if (logsSaude.length > 0) md += `### 🧬 Saúde & Bio\n${logsSaude.join('\n')}\n`;
            }

            // 4. CRIATIVIDADE (FULL SCAN)
            if (toggles.criatividade.active && hasNotes) {
                let sectionContent = "";
                for (const noteFile of dailyNotesFiles) {
                    const timeStr = noteFile.basename.split(' ').pop(); 
                    console.log(`📄 Extraindo: ${noteFile.basename}`);
                    const extracted = await extractContentFromFile(app, noteFile);
                    sectionContent += `- [${timeStr}] **NOTA:** [[${noteFile.path}|${noteFile.basename}]]\n${extracted}\n\n`;
                }
                if (sectionContent) md += `### 💡 Criatividade (Notas do Dia)\n${sectionContent}`;
            }
            
            md += `\n---\n`;
        }
        return md;
    }

    async function saveReport(app, content) {
        const now = moment();
        const year = now.format("YYYY");
        const month = now.format("MM");
        const timestamp = now.format("YYYYMMDD_HHmm");
        const folderPath = `01 - Registros/Análises (AI)/${year}/${month}`;
        const fullPath = `${folderPath}/Contexto_Coach_${timestamp}.md`;

        if (!await app.vault.adapter.exists(folderPath)) await app.vault.createFolder(folderPath);
        const newFile = await app.vault.create(fullPath, content);
        new Notice(`✅ Contexto Gerado: ${newFile.basename}`);
        app.workspace.getLeaf(true).openFile(newFile);
    }

    new ExportModal(app).open();
};