import { ItemView, MarkdownRenderer, debounce } from 'obsidian'
import type { WorkspaceLeaf, TFile, CachedMetadata } from 'obsidian'
import TimerComponent from './TimerViewComponent.svelte'
import PomodoroTimerPlugin from 'main'
import { resolveTasks } from './Tasks'
import { sotaLog } from './Debug'

export const VIEW_TYPE_TIMER = 'timer-view'

export class TimerView extends ItemView {
    private component?: TimerComponent
    private plugin: PomodoroTimerPlugin

    constructor(plugin: PomodoroTimerPlugin, leaf: WorkspaceLeaf) {
        super(leaf)
        this.plugin = plugin
        this.icon = 'timer'
    }

    getViewType(): string {
        return VIEW_TYPE_TIMER
    }

    getDisplayText(): string {
        return 'Timer'
    }

    async onOpen() {
        sotaLog('TimerView', 'onOpen: View foi aberta.');

        this.component = new TimerComponent({
            target: this.contentEl,
            props: {
                app: this.plugin.app, // Adiciona a referência direta ao app
                timer: this.plugin.timer,
                tasks: this.plugin.tasks,
                tracker: this.plugin.tracker,
                sotaContext: this.plugin.sotaContext,
                sotaSync: this.plugin.sotaSync,
                taskInjector: this.plugin.taskInjector, // Fase 4
                render: (el: HTMLElement, content: string) => { 
                    MarkdownRenderer.render(
                        this.plugin.app,
                        content,
                        el,
                        '',
                        this,
                    )
                }
            },
        })
        // 1. Ouvinte para mudança de arquivo ativo
        this.registerEvent(
            this.app.workspace.on('active-leaf-change', () => {
                sotaLog('TimerView', 'EVENTO: active-leaf-change disparado.');
                const activeFile = this.app.workspace.getActiveFile();
                // --- CORREÇÃO: REMOVIDA A CONDIÇÃO 'IF' ---
                sotaLog('TimerView', 'active-leaf-change: Chamando loadFileTasks...', { newFilePath: activeFile?.path });
                this.plugin.tasks?.loadFileTasks(activeFile);
            })
        );
        
        // 2. Ouvinte OTIMIZADO (Debounce) para mudanças no conteúdo
        // Só processa as tarefas se o usuário parar de digitar por 600ms
        const processFileChange = debounce(
            (file: TFile, content: string, cache: CachedMetadata) => {
                // Verificação de segurança para não processar arquivos irrelevantes
                if (file.extension === 'md' && file === this.plugin.tracker?.file) {
                    const tasks = resolveTasks(
                        'TASKS',
                        file,
                        content,
                        cache
                    );
                    this.plugin.tasks?.updateTasks(tasks);
                }
            }, 
            600, // Tempo de espera (ms) - Ajuste se sentir lento ou rápido demais
            true // Resetar o timer a cada nova tecla (True = Trailing edge logic no Obsidian)
        );

        this.registerEvent(
            this.app.metadataCache.on('changed', processFileChange)
        );

        // 3. Carga inicial das tarefas para o arquivo já ativo
        const initialFile = this.app.workspace.getActiveFile();
        sotaLog('TimerView', 'onOpen: Tentando carga inicial de tarefas...', { initialFilePath: initialFile?.path });
        if (initialFile) {
            this.plugin.tasks?.loadFileTasks(initialFile);
        } else {
            this.plugin.tasks?.clearTasks();
        }
    }

    async onClose() {
        this.component?.$destroy()
    }
}