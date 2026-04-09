// SOTA - TaskTracker.ts v2.0 (Padrão de ID Composto e Logging Aprimorado)

import type { TaskItem } from 'Tasks'
import type PomodoroTimerPlugin from 'main'
import { TFile, Keymap, MarkdownView, Notice } from 'obsidian'
import { DESERIALIZERS } from 'serializer'
import {
    writable,
    type Readable,
    type Writable,
    type Unsubscriber,
} from 'svelte/store'
import { extractTaskComponents } from 'utils'
import { sotaLog } from './Debug'


// --- INÍCIO DA MODIFICAÇÃO 2.1: ADICIONAR FUNÇÃO DE IDENTIFICAÇÃO ---
const getTaskId = (task: TaskItem): string => {
    return `${task.path}:${task.line}`;
};
// --- FIM DA MODIFICAÇÃO 2.1 ---

export type TaskTrackerState = {
    task?: TaskItem
    file?: TFile
    pinned: boolean
}

type TaskTrackerStore = Readable<TaskTrackerState>

const DEFAULT_TRACKER_STATE: TaskTrackerState = {
    pinned: false,
}

export default class TaskTracker implements Readable<TaskTrackerState> {
    private plugin
    private state: TaskTrackerState
    private store: Writable<TaskTrackerState>
    public subscribe
    private unsubscribers: Unsubscriber[] = []

    constructor(plugin: PomodoroTimerPlugin) {
        this.plugin = plugin
        this.state = DEFAULT_TRACKER_STATE
        this.store = writable(this.state)
        this.subscribe = this.store.subscribe
        this.unsubscribers.push(
            this.store.subscribe((state) => {
                this.state = state
            }),
        )

        plugin.registerEvent(
            plugin.app.workspace.on('active-leaf-change', () => {
                let file = this.plugin.app.workspace.getActiveFile()
                if (!this.state.pinned) {
                    this.store.update((state) => {
                        if (state.file?.path !== file?.path) {
                            state.task = undefined
                        }
                        state.file = file ?? state.file
                        return state
                    })
                }
            }),
        )

        plugin.app.workspace.onLayoutReady(() => {
            let file = this.plugin.app.workspace.getActiveFile()
            this.store.update((state) => {
                state.file = file ?? state.file
                return state
            })
        })
    }

    get task() {
        return this.state.task
    }

    get file() {
        return this.state.file
    }

    public async restaurarEstadoDoJournal() {
        sotaLog("TaskTracker", "Restaurando estado do journal...");
        const sessao = await this.plugin.sessionJournal?.lerJournal();
        if (sessao?.tarefaFocada && sessao.tarefaFocada.text) {
            this.store.update((state) => {
                state.task = sessao.tarefaFocada;
                state.pinned = sessao.pinned || false;
                sotaLog("TaskTracker", "Estado da tarefa e 'pinned' restaurados do journal.", state);
                return state;
            });
        } else {
            sotaLog("TaskTracker", "Nenhum estado de tarefa para restaurar no journal.");
        }
    }

    public togglePinned() {
        this.store.update((state) => {
            state.pinned = !state.pinned
            return state
        })
    }

    // --- INÍCIO DA MODIFICAÇÃO 2.2: ATUALIZAR LOGS DO MÉTODO active() ---
    public async active(task: TaskItem) {
        // SOTA BLINDAGEM (Fase 3): Proteção de UX contra troca "a quente"
        // Verifica se o timer está rodando antes de permitir a troca de foco.
        if (this.plugin.timer) {
            const timerState = this.plugin.timer.getState();
            if (timerState.status === 'RUNNING' || timerState.status === 'OVERTIME') {
                // Se a tarefa clicada for DIFERENTE da atual
                if (this.state.task && getTaskId(this.state.task) !== getTaskId(task)) {
                    new Notice("⚠️ Pare o timer atual antes de mudar o foco da sessão.");
                    sotaLog("TaskTracker", "active() BLOQUEADO: Tentativa de troca de tarefa com timer rodando.");
                    return;
                }
            }
        }

        const previousTaskId = this.state.task ? getTaskId(this.state.task) : 'none';
        const newTaskId = getTaskId(task);

        sotaLog("TaskTracker", `✅ active() INÍCIO - tarefa: "${task.text.substring(0, 40)}..."`);
        
        this.store.update((state) => {
            state.task = task;
            sotaLog("TaskTracker", `📝 active() UPDATE - anterior: ${previousTaskId}, novo: ${newTaskId}`);
            return state;
        });
        
        sotaLog("TaskTracker", `🎯 active() COMPLETO - tarefa ativa: "${task.text}"`);
    }
    // --- FIM DA MODIFICAÇÃO 2.2 ---

    public setTask(task: TaskItem) {
        this.store.update((state) => {
            state.task = task;
            return state;
        });
    }

    public setTaskName(name: string) {
        this.store.update((state) => {
            if (state.task) {
                state.task.name = name
            }
            return state
        })
    }

    private async ensureBlockId(task: TaskItem) {
        let file = this.plugin.app.vault.getAbstractFileByPath(task.path)
        if (file && file instanceof TFile) {
            const f = file as TFile
            if (f.extension === 'md') {
                let content = await this.plugin.app.vault.read(f)
                let lines = content.split('\n')
                if (lines.length > task.line) {
                    let line = lines[task.line]
                    if (task.blockLink) {
                        if (!line.endsWith(task.blockLink)) {
                            lines[task.line] += `${task.blockLink}`
                            this.plugin.app.vault.modify(f, lines.join('\n'))
                            return
                        }
                    } else {
                        let blockId = this.createBlockId()
                        task.blockLink = blockId
                        lines[task.line] += `${blockId}`
                        this.plugin.app.vault.modify(f, lines.join('\n'))
                    }
                }
            }
        }
    }

    private createBlockId() {
        return ` ^${Math.random().toString(36).substring(2, 6)}`
    }

    public clear() {
        this.store.update((state) => {
            state.task = undefined
            return state
        })
    }

    public openFile(event: MouseEvent) {
        if (this.state.file) {
            const leaf = this.plugin.app.workspace.getLeaf(
                Keymap.isModEvent(event),
            )
            leaf.openFile(this.state.file)
        }
    }

    public openTask = (event: MouseEvent, task: TaskItem) => {
        let file = this.plugin.app.vault.getAbstractFileByPath(task.path)
        if (file && file instanceof TFile && task.line >= 0) {
            const leaf = this.plugin.app.workspace.getLeaf(
                Keymap.isModEvent(event),
            )
            leaf.openFile(file, { eState: { line: task.line } })
        }
    }

    get pinned() {
        return this.state.pinned
    }

    public finish() {}

    public destory() {
        for (let unsub of this.unsubscribers) {
            unsub()
        }
    }

    public sync(task: TaskItem) {
        // --- CORREÇÃO DE CONSISTÊNCIA: Usar getTaskId para sincronização ---
        if (this.state.task && getTaskId(this.state.task) === getTaskId(task)) {
            this.store.update((state) => {
                if (state.task) {
                    let name = state.task.name
                    state.task = { ...task, name }
                }
                return state
            })
        }
    }

    public async updateActual() {
        sotaLog("TaskTracker", "updateActual: Função chamada.");

        // --- INÍCIO DA CORREÇÃO ---
        // A verificação 'enableTaskTracking' foi removida, pois agora é sempre 'true'.
        // A lógica agora só verifica se existe uma tarefa ativa.
        if (this.task) {
        // --- FIM DA CORREÇÃO ---
            sotaLog("TaskTracker", "updateActual: Task ativa encontrada.", this.task);
            
            let file = this.plugin.app.vault.getAbstractFileByPath(this.task.path);
            if (file && file instanceof TFile) {
                let f = file as TFile;
                
                this.store.update((state) => {
                    if (state.task) {
                        state.task.actual = (state.task.actual || 0) + 1;
                    }
                    return state;
                });
                
                sotaLog("TaskTracker", "updateActual: Chamando incrTaskActual...");
                await this.incrTaskActual(this.task, f);
            } else {
                sotaLog("TaskTracker", "updateActual: ERRO - Arquivo da tarefa não encontrado ou não é um TFile.", { path: this.task.path });
            }
        } else {
            // --- INÍCIO DA CORREÇÃO ---
            // Atualizado o log para refletir a nova lógica.
            sotaLog("TaskTracker", "updateActual: Nenhuma tarefa ativa encontrada, nenhuma ação realizada.", { taskExists: !!this.task });
            // --- FIM DA CORREÇÃO ---
        }
    }

    private async incrTaskActual(task: TaskItem, file: TFile) {
        sotaLog("TaskTracker", "incrTaskActual: Iniciada.", { task: task.text, file: file.path });
    
        if (file.extension !== 'md') {
            sotaLog("TaskTracker", "incrTaskActual: Abortado - arquivo não é MD.");
            return;
        }
    
        let content = await this.plugin.app.vault.read(file);
        const lines = content.split('\n');
        
        // --- SOTA: BUSCA INTELIGENTE POR BLOCK ID (Lógica Anti-Deslocamento v2) ---
        let targetLineIndex = task.line;
        let idToFind = task.blockLink ? task.blockLink.trim() : "";

        // FALHA DE SEGURANÇA: Se o Serializer falhou em pegar o ID (ex: por causa de espaços extras ou datas),
        // tentamos extrair o ID manualmente do texto cru da tarefa.
        if (!idToFind) {
            // Procura por um padrão ^letrasNumeros no texto da tarefa
            const extractionMatch = task.text.match(/\^([a-zA-Z0-9-]+)\s*$/); // Tenta no final
            if (extractionMatch) {
                idToFind = "^" + extractionMatch[1];
                sotaLog("TaskTracker", "incrTaskActual: ID recuperado manualmente do texto.", { idToFind });
            } else {
                // Tenta encontrar em qualquer lugar da string (caso tenha algo depois)
                const looseMatch = task.text.match(/\^([a-zA-Z0-9-]+)/);
                if (looseMatch) {
                    idToFind = "^" + looseMatch[1];
                    sotaLog("TaskTracker", "incrTaskActual: ID recuperado (busca solta).", { idToFind });
                }
            }
        }
        
        // 1. Se temos um ID (oficial ou recuperado), procuramos onde ele está agora.
        if (idToFind) {
            // Busca a linha que contém este ID
            const foundIndex = lines.findIndex(line => line.includes(idToFind));
            
            if (foundIndex !== -1) {
                if (foundIndex !== task.line) {
                    sotaLog("TaskTracker", `incrTaskActual: Linha mudou de ${task.line} para ${foundIndex}. Ajustando alvo.`);
                }
                targetLineIndex = foundIndex;
            } else {
                sotaLog("TaskTracker", "incrTaskActual: AVISO - ID existe na memória mas não foi achado no arquivo. Tentando linha original.");
            }
        }

        // 2. Validação de segurança de limites
        if (targetLineIndex < 0 || targetLineIndex >= lines.length) {
            sotaLog("TaskTracker", "incrTaskActual: ERRO - Linha alvo inválida/inexistente.", { targetLineIndex, totalLines: lines.length });
            return;
        }
    
        let taskLine = lines[targetLineIndex];
        
        // 3. Verifica se a linha encontrada realmente tem o contador
        const pomodoroRegex = /\[🍅::\s*(\d+)\s*\/\s*(\d+)\s*\]/;
        const match = taskLine.match(pomodoroRegex);
    
        if (match) {
            const currentActual = parseInt(match[1], 10);
            const expected = parseInt(match[2], 10);
            
            // Incrementa
            const newActual = currentActual + 1;
            const newCounter = `[🍅:: ${newActual}/${expected}]`;
            
            // Substitui apenas o trecho do contador, preservando datas, tags e IDs
            taskLine = taskLine.replace(pomodoroRegex, newCounter);
            
            lines[targetLineIndex] = taskLine;
            
            await this.plugin.app.vault.modify(file, lines.join('\n'));
            sotaLog("TaskTracker", "incrTaskActual: Sucesso! Contador atualizado.", { novoValor: newActual });
            
            // Atualiza a referência de memória
            task.line = targetLineIndex; 
        } else {
            sotaLog("TaskTracker", "incrTaskActual: Padrão [🍅::X/Y] NÃO encontrado na linha alvo.", { linhaLida: taskLine });
        }
    }
}