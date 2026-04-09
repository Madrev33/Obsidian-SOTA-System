import { App, TFile, Notice, moment } from 'obsidian';
import { CreateTaskModal, type TaskInfo } from './CreateTaskModal';
import PomodoroTimerPlugin from 'main';
import { sanitize } from './utils';

export class TaskInjector {
    private app: App;
    private plugin: PomodoroTimerPlugin;

    constructor(plugin: PomodoroTimerPlugin) {
        this.app = plugin.app;
        this.plugin = plugin;
    }

    public async createTaskInCurrentContext() {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
            new Notice("❌ Nenhuma nota ativa.");
            return;
        }

        try {
            // Obtém as informações de injeção (incluindo a soberania do HUB agora)
            const injection = await this.getInjection(activeFile);
            
            // --- SOTA: Lógica de Bloqueio de Contexto ---
            // Se houver uma tag de contexto (Projeto/Mídia), passamos a soberania específica do HUB.
            // Se não houver tag (Inbox), passamos null (contexto livre).
            // O Modal deve tratar isso: se receber string ('interna'/'externa'), trava nela. Se null, libera.
            const lockedSoberania = injection.tag.length > 0 ? (injection.soberania || 'interna') : null;

            // Passamos a soberania travada para o método que chama o modal
            const tasksInfo = await this.getTasksFromModal(lockedSoberania);
            
            if (tasksInfo.length === 0) return;

            // Formata e insere
            const taskStrings = tasksInfo.map(info => this.formatTaskString(info, injection.tag));
            await this.appendTasksToFile(injection.file, taskStrings, injection.line);

            new Notice(`✅ ${tasksInfo.length} tarefa(s) criada(s)!`);

        } catch (e) {
            // Cancelado pelo usuário ou erro silencioso
            console.log("Criação de tarefa cancelada ou falha:", e);
        }
    }

    // Atualizado para aceitar string | null (Soberania específica ou null se livre)
    private async getTasksFromModal(lockedSoberania: string | null): Promise<TaskInfo[]> {
        return new Promise((resolve, reject) => {
            // AVISO: O construtor do CreateTaskModal deve esperar (app, lockedSoberania: string | null, onSubmit)
            // Se ele esperar boolean, o TypeScript pode reclamar, mas a lógica JS funcionará se o modal tratar strings como truthy.
            // O ideal é atualizar o CreateTaskModal para usar esse valor no dropdown.
            const modal = new CreateTaskModal(this.app, lockedSoberania as any, (results) => {
                resolve(results);
            });
            modal.open();
        });
    }

    private formatTaskString(taskInfo: TaskInfo, contextTag: string): string {
        const sessions = `[🍅:: 0/${taskInfo.expectedSessions}]`;
        const difficultyTag = ` #nivel/dificuldade/${taskInfo.difficulty}`;
        
        // Se NÃO tem tag de contexto (Inbox), adicionamos a soberania na linha da tarefa.
        // Se TEM tag de contexto, a soberania é inferida pelo HUB/Contexto, então não sujamos a linha.
        let sovereigntyTag = "";
        if (!contextTag) {
            sovereigntyTag = ` #soberania/${taskInfo.soberania}`;
        }
        
        const isDailyContext = contextTag === ''; 
        const dueDate = isDailyContext ? ` 📅 ${moment().format("YYYY-MM-DD")}` : '';

        let finalTag = "";
        if (contextTag) {
            const sanitizedName = sanitize(taskInfo.name);
            finalTag = ` ${contextTag}/${sanitizedName}`;
        }
        
        const blockId = ` ^${Math.random().toString(36).substring(2, 8)}`;
        return `- [ ] ${sessions} ${taskInfo.name.trim()}${finalTag}${difficultyTag}${sovereigntyTag}${dueDate}${blockId}`;
    }

    // O "Cérebro" da detecção de contexto - Agora lê a Soberania do HUB
    private async getInjection(activeFile: TFile): Promise<{ file: TFile, line: number, tag: string, soberania?: string }> {
        const fileCache = this.app.metadataCache.getFileCache(activeFile);
        const fm = fileCache?.frontmatter;
        
        let targetLine = 0;
        let tag = '';
        let soberaniaDetectada = 'interna'; // Default fallback

        // 1. Contexto: Nota Diária (Inbox)
        if (activeFile.path.includes('/01. Daily/')) {
            const content = await this.app.vault.read(activeFile);
            const lines = content.split('\n');
            const inboxHeaderLine = lines.findIndex(line => line.trim().match(/^##\s+📥\s*Inbox/));
            
            targetLine = inboxHeaderLine !== -1 ? inboxHeaderLine + 1 : lines.length;
            
            // Retorna contexto limpo e sem soberania forçada (usuário escolhe)
            return { file: activeFile, line: targetLine, tag: '', soberania: undefined };
        }

        if (fm) {
            // 2. Contexto: HUB de Projeto
            if (fm.tipo === 'projeto_hub' || fm.tipo === 'projeto') {
                const content = await this.app.vault.read(activeFile);
                const lines = content.split('\n');
                
                // Lê a soberania do próprio projeto
                soberaniaDetectada = fm.soberania || 'interna';

                const phaseRegex = /^###\s+Fase:\s+(.+)/;
                const phases = lines
                    .map((line, index) => ({ line: line.trim(), index }))
                    .filter(item => phaseRegex.test(item.line));

                tag = fm.id_projeto ? `#projeto/${sanitize(fm.id_projeto)}` : '';

                if (phases.length > 0) {
                    const lastPhase = phases[phases.length - 1];
                    const lastPhaseNameMatch = lastPhase.line.match(phaseRegex);
                    
                    if (lastPhaseNameMatch && lastPhaseNameMatch[1]) {
                        const phaseNumber = phases.length;
                        const phaseName = lastPhaseNameMatch[1].trim();
                        
                        tag += `/${String(phaseNumber).padStart(2, '0')}_${sanitize(phaseName)}`;
                        
                        let insertionIndex = lastPhase.index + 1;
                        let foundTask = false;
                        let lastCodeBlockEndIndex = -1;
                        let insideCodeBlock = false;
                        
                        for (let i = insertionIndex; i < lines.length; i++) {
                            const line = lines[i].trim();
                            if (line.startsWith('#')) break;

                            if (line.startsWith('```')) {
                                insideCodeBlock = !insideCodeBlock;
                                if (!insideCodeBlock) lastCodeBlockEndIndex = i;
                            }
                            
                            if (line.match(/^- \[[x ]\]/)) {
                                foundTask = true;
                                insertionIndex = i + 1;
                            }
                        }

                        if (!foundTask && lastCodeBlockEndIndex !== -1) {
                            insertionIndex = lastCodeBlockEndIndex + 1;
                        }
                        
                        targetLine = insertionIndex;

                    } else {
                         targetLine = lines.length;
                    }
                } else {
                     const taskHeaderLine = lines.findIndex(line => line.trim() === '## ✅ Tarefas');
                     targetLine = taskHeaderLine !== -1 ? taskHeaderLine + 1 : lines.length;
                }
                
                return { file: activeFile, line: targetLine, tag: tag, soberania: soberaniaDetectada };
            }

            // 3. Contexto: Mídia (Anotações/Filhos)
            if (fm.tipo && (fm.tipo.endsWith('_anotacoes') || fm.tipo.includes('_aula') || fm.tipo.includes('_episodio') || fm.tipo.includes('_capitulo') || fm.tipo.includes('_secao') || fm.tipo === 'jogo_missao')) {
                 const content = await this.app.vault.read(activeFile);
                 const lines = content.split('\n');
                 
                 const taskHeaderLine = lines.findIndex(line => line.trim().startsWith('## ✅ Tarefas'));
                 targetLine = taskHeaderLine !== -1 ? taskHeaderLine + 1 : lines.length;

                 const hubUid = fm.hub_uid || fm.sota_uid;
                 
                 if (hubUid) {
                    // Busca o HUB pai para ler ID e Soberania
                    // Otimização: Poderia usar o SotaSync index, mas aqui usamos busca direta para garantir independência
                    const allFiles = this.app.vault.getMarkdownFiles();
                    const hubFile = allFiles.find(f => {
                        const cache = this.app.metadataCache.getFileCache(f);
                        return cache?.frontmatter?.sota_uid === hubUid;
                    });

                    if (hubFile) {
                        const hubCache = this.app.metadataCache.getFileCache(hubFile);
                        const hubFm = hubCache?.frontmatter;
                        
                        if(hubFm) {
                            // --- LEITURA DO HUB ---
                            // Se o HUB tiver soberania definida, usamos ela. Se não, padrão externa para mídias.
                            soberaniaDetectada = hubFm.soberania || 'externa';

                            if (hubFm.id_midia && hubFm.tipo) {
                                const tipoSanitized = sanitize(hubFm.tipo.replace('_hub', '').replace('_paginado', '').replace('_serializado', ''));
                                const midiaIdSanitized = sanitize(hubFm.id_midia);
                                const ciclo = fm.ciclo || hubFm.ciclo_de_consumo_atual || 1;
                                
                                tag = `#midia/${tipoSanitized}/${midiaIdSanitized}/ciclo_${ciclo}`;

                                // Detecção de Unidade (Lógica Mantida)
                                const parentFolder = activeFile.parent;
                                if (parentFolder) {
                                    const folderName = parentFolder.name;
                                    const unidadeMatch = folderName.match(/^(\d+)/);
                                    
                                    if (unidadeMatch) {
                                        const num = unidadeMatch[1];
                                        let unidadeTipo = "unidade";
                                        
                                        if (hubFm.tipo.includes('livro')) unidadeTipo = "capitulo";
                                        else if (hubFm.tipo.includes('artigo') || hubFm.tipo.includes('documentacao')) unidadeTipo = "secao";
                                        else if (hubFm.tipo.includes('jogo')) unidadeTipo = "missao";
                                        else if (hubFm.tipo.includes('serie') || hubFm.tipo.includes('podcast') || hubFm.tipo.includes('documentario')) {
                                            unidadeTipo = "episodio";
                                            const grandParent = parentFolder.parent;
                                            if (grandParent) {
                                                const temporadaMatch = grandParent.name.match(/(\d+)/);
                                                if (temporadaMatch) tag += `/temporada_${temporadaMatch[1]}`;
                                            }
                                        }
                                        else if (hubFm.tipo.includes('curso')) {
                                            unidadeTipo = "aula";
                                            const grandParent = parentFolder.parent;
                                            if (grandParent) {
                                                const moduloMatch = grandParent.name.match(/^(\d+)/);
                                                if (moduloMatch) tag += `/modulo_${moduloMatch[1]}`;
                                            }
                                        }
                                        tag += `/${unidadeTipo}_${num}`;
                                    }
                                }
                            }
                        }
                    }
                 }
                 
                 return { file: activeFile, line: targetLine, tag: tag, soberania: soberaniaDetectada };
            }
        }

        // 4. Fallback Universal (Nota Genérica)
        if (fm && fm.hub_uid) {
             const hubUid = fm.hub_uid;
             const allFiles = this.app.vault.getMarkdownFiles();
             const hubFile = allFiles.find(f => {
                const c = this.app.metadataCache.getFileCache(f);
                return c?.frontmatter?.sota_uid === hubUid;
             });

             if (hubFile) {
                 const hFm = this.app.metadataCache.getFileCache(hubFile)?.frontmatter;
                 if (hFm) {
                     soberaniaDetectada = hFm.soberania || 'interna';
                     if (hFm.id_projeto) tag = `#projeto/${sanitize(hFm.id_projeto)}`;
                 }
             }
        }
        
        const content = await this.app.vault.read(activeFile);
        const lines = content.split('\n');
        const genericTaskHeader = lines.findIndex(l => l.match(/^##\s*(✅\s*)?(Tarefas|Tasks|To-Do)/i));
        
        if (genericTaskHeader !== -1) {
            targetLine = genericTaskHeader + 1;
        } else {
            targetLine = lines.length;
        }

        return { file: activeFile, line: targetLine, tag: tag, soberania: soberaniaDetectada };
    }

    private async appendTasksToFile(file: TFile, tasks: string[], targetLine: number) {
        const content = await this.app.vault.read(file);
        let lines = content.split('\n');
        
        if (targetLine >= lines.length && lines[lines.length-1] !== "") {
            lines.push("");
            targetLine++;
        }

        lines.splice(targetLine, 0, ...tasks);
        await this.app.vault.modify(file, lines.join('\n'));
    }
}