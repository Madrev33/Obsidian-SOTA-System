// SOTA - Timer.ts v6.0 (Heartbeat & Crash Recovery Robusta)

import PomodoroTimerPlugin from 'main';
import { writable, derived, type Readable, type Writable, get } from 'svelte/store';
import { Notice, TFile, Modal, Setting, App, moment } from 'obsidian';
import Logger, { type LogContext } from 'Logger';
import DEFAULT_NOTIFICATION from 'Notification';
import type { Unsubscriber } from 'svelte/motion';
import { DEFAULT_TASK, type TaskItem } from './Tasks';
import { sotaLog } from './Debug';
import Worker from './clock.worker.ts?worker';
import type { JournalEntry } from './SessionJournal';
import { sotaContextStore, sotaLeituraStore, type SotaContextState, type SotaLeituraState, isStopwatchMode, isTryhardMode } from './stores';
import { FeedbackExercicioModal } from './FeedbackExercicioModal';
import type { SotaSync } from './SotaSync';
import { SessionRecoveryModal, type RecoveryOption } from './SessionRecoveryModal';
import { SessionDebriefModal, type DebriefData } from './SessionDebriefModal';


class TaskConfirmationModal extends Modal {
    private decisionMade: boolean = false;
    onSubmit: (result: 'continue' | 'focus' | 'cancel') => void;
    constructor(app: App, onSubmit: (result: 'continue' | 'focus' | 'cancel') => void) {
        super(app);
        this.onSubmit = onSubmit;
    }
    onOpen() {
        const { contentEl } = this;
        contentEl.createEl("h2", { text: "Nenhuma Tarefa em Foco" });
        contentEl.createEl("p", { text: "Iniciar uma sessão sem tarefa em foco registrará o tempo, mas não produzirá métricas detalhadas." });
        new Setting(contentEl)
            .addButton((btn) => btn.setButtonText("Continuar Assim Mesmo").onClick(() => { this.decisionMade = true; this.close(); this.onSubmit('continue'); }))
            .addButton((btn) => btn.setButtonText("Colocar Tarefa em Foco").setCta().onClick(() => { this.decisionMade = true; this.close(); this.onSubmit('focus'); }));
    }
    onClose() { if (!this.decisionMade) { this.onSubmit('cancel'); } this.contentEl.empty(); }
}

class FocusRatingModal extends Modal {
    onSubmit: (result: number | null) => void;
    private decisionMade: boolean = false;
    private selectedValue: number | null = null;

    constructor(app: App, onSubmit: (result: number | null) => void) {
        super(app);
        this.onSubmit = onSubmit;
        this.modalEl.addClass('sota-focus-rating-modal'); // Adiciona classe para estilização específica se necessário
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl("h2", { text: "Avaliação da Sessão de Foco" });
        contentEl.createEl("p", { text: "De 0 (muito distraído) a 10 (flow total), como foi seu nível de foco?" });

        // Container para os botões
        const gridContainer = contentEl.createDiv();
        gridContainer.style.display = "grid";
        gridContainer.style.gridTemplateColumns = "repeat(auto-fit, minmax(40px, 1fr))"; // Layout responsivo
        gridContainer.style.gap = "8px";
        gridContainer.style.marginTop = "20px";

        const buttons: HTMLElement[] = [];

        // Cria os botões de 0 a 10
        for (let i = 0; i <= 10; i++) {
            const btn = gridContainer.createDiv();
            btn.setText(i.toString());
            // Estilização consistente com o sistema SOTA
            btn.style.width = "100%"; // Ocupa a célula do grid
            btn.style.padding = "12px 0"; // Espaçamento vertical
            btn.style.display = "flex";
            btn.style.alignItems = "center";
            btn.style.justifyContent = "center";
            btn.style.border = "1px solid var(--background-modifier-border)";
            btn.style.borderRadius = "var(--radius-m)";
            btn.style.cursor = "pointer";
            btn.style.fontSize = "1em";
            btn.style.fontWeight = "600";
            btn.style.backgroundColor = "var(--background-secondary)";
            btn.style.transition = "all 0.2s ease";
            
            // Lógica de clique
            btn.addEventListener("click", () => {
                this.selectedValue = i;
                // Atualiza o visual de todos os botões
                buttons.forEach(b => {
                    b.style.backgroundColor = "var(--background-secondary)";
                    b.style.color = "var(--text-normal)";
                    b.style.borderColor = "var(--background-modifier-border)";
                });
                // Destaca o botão clicado
                btn.style.backgroundColor = "var(--interactive-accent)";
                btn.style.color = "var(--text-on-accent)";
                btn.style.borderColor = "var(--interactive-accent)";

                // Submete e fecha automaticamente ao clicar
                this.decisionMade = true;
                this.close();
            });

            // Efeitos de Hover
            btn.addEventListener("mouseenter", () => { if (this.selectedValue !== i) btn.style.backgroundColor = "var(--background-modifier-hover)"; });
            btn.addEventListener("mouseleave", () => { if (this.selectedValue !== i) btn.style.backgroundColor = "var(--background-secondary)"; });
            
            buttons.push(btn);
        }
    }

    onClose() {
        this.onSubmit(this.selectedValue);
        this.contentEl.empty();
    }
}

class FrictionModal extends Modal {
    onSubmit: (result: boolean) => void;
    remained: string;
    constructor(app: App, remained: string, onSubmit: (result: boolean) => void) {
        super(app);
        this.onSubmit = onSubmit;
        this.remained = remained;
    }
    onOpen() {
        const { contentEl } = this;
        contentEl.createEl("h2", { text: "Desistir Agora?" });
        contentEl.createEl("p", { text: `Ainda faltam ${this.remained} para a meta. Deseja realmente parar?` });
        new Setting(contentEl)
            .addButton((btn) => btn.setButtonText("Continuar").setCta().onClick(() => { this.close(); this.onSubmit(false); }))
            .addButton((btn) => btn.setButtonText("Desistir").onClick(() => { this.close(); this.onSubmit(true); }));
    }
    onClose() { this.contentEl.empty(); }
}

// Fase 3.5: Modal de Reflexão Estruturada
class SessionReflectionModal extends Modal {
    private feito: string = "";
    private melhora: string = "";
    onSubmit: (result: { feito: string; melhora: string }) => void;

    constructor(app: App, onSubmit: (result: { feito: string; melhora: string }) => void) {
        super(app);
        this.onSubmit = onSubmit;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl("h2", { text: "Reflexão da Sessão" });

        let feitoInput: HTMLTextAreaElement;
        let melhoraInput: HTMLTextAreaElement;

        // **NOVO:** Função de sanitização que remove quebras de linha
        const sanitizeNewlines = (text: string): string => {
            return text.replace(/\n/g, '; ').trim();
        };

        const handleSave = () => {
            // **ALTERADO:** Usa a função de sanitização antes de salvar
            this.feito = sanitizeNewlines(feitoInput.value);
            this.melhora = sanitizeNewlines(melhoraInput.value);
            this.close();
        };

        // **ALTERADO:** Lógica de manipulação de teclas aprimorada
        const handleKeyDown = (evt: KeyboardEvent) => {
            if (evt.key === "Enter" && (evt.ctrlKey || evt.metaKey)) {
                evt.preventDefault();
                handleSave();
            } else if (evt.key === ' ' && evt.shiftKey) {
                evt.preventDefault(); // Impede que um espaço normal seja inserido
                const input = evt.target as HTMLTextAreaElement;
                const start = input.selectionStart;
                const end = input.selectionEnd;

                // Insere '; ' na posição do cursor
                input.value = input.value.substring(0, start) + '; ' + input.value.substring(end);

                // Move o cursor para depois do texto inserido
                input.selectionStart = input.selectionEnd = start + 2;
            }
        };

        // --- Campo "O que foi feito" ---
        contentEl.createEl("h3", { text: "O que foi feito nesta sessão?" });
        const feitoSetting = new Setting(contentEl).addTextArea((text) => {
            feitoInput = text.inputEl;
            text.setPlaceholder("Use Shift+Espaço para separar ideias...");
            feitoInput.style.width = "100%";
            feitoInput.style.height = "100px";
            feitoInput.style.resize = "vertical";
            feitoInput.addEventListener("keydown", handleKeyDown);
            setTimeout(() => feitoInput.focus(), 50);
        });
        feitoSetting.settingEl.style.display = 'block';
        feitoSetting.controlEl.style.width = '100%';

        // --- Campo "O que pode ser melhorado" ---
        contentEl.createEl("h3", { text: "O que pode ser melhorado na próxima?" });
        const melhoraSetting = new Setting(contentEl).addTextArea((text) => {
            melhoraInput = text.inputEl;
            text.setPlaceholder("Use Shift+Espaço para separar ideias...");
            melhoraInput.style.width = "100%";
            melhoraInput.style.height = "100px";
            melhoraInput.style.resize = "vertical";
            melhoraInput.addEventListener("keydown", handleKeyDown);
        });
        melhoraSetting.settingEl.style.display = 'block';
        melhoraSetting.controlEl.style.width = '100%';

        // --- Botão de Salvar ---
        new Setting(contentEl)
            .addButton((btn) => btn
                .setButtonText("Salvar Reflexão")
                .setCta()
                .onClick(handleSave)
            );
    }

    onClose() {
        this.onSubmit({ feito: this.feito, melhora: this.melhora });
        this.contentEl.empty();
    }
}

export type Mode = 'WORK' | 'BREAK';
export type TimerStatus = 'RUNNING' | 'OVERTIME' | 'IDLE';
export type TimerRemained = { millis: number; human: string; };

export type TimerState = {
    status: TimerStatus;
    mode: Mode;
    elapsed: number;
    startTime: number | null;
    workLen: number;
    breakLen: number;
    count: number;
    duration: number;
    ciclo?: number;
    paginaAtual?: number;
    moduloAtual?: number;
    aulaAtual?: number;
    temporada?: number;
    episodio?: number;
    capitulo?: number;
    missao?: number;
    sotaContext: SotaContextState;
    id_sessao: string | null;
    ruido?: string; // Fase 3.5
    flow?: string; // Fase 3.5
    humor?: number;
    energia?: number;
};

export type TimerStore = TimerState & { remained: TimerRemained; finished: boolean; };

export default class Timer implements Readable<TimerStore> {
    static DEFAULT_NOTIFICATION_AUDIO = new Audio(DEFAULT_NOTIFICATION);
    private plugin: PomodoroTimerPlugin;
    private app: App;
    private storeInternal: Writable<TimerState>;
    private store: Readable<TimerStore>;
    private clock: Worker | null;
    public subscribe;
    private unsubscribers: Unsubscriber[] = [];
    public logger: Logger;
    
    // SOTA: Controle de frequência de gravação do Heartbeat
    private lastHeartbeatSave: number = 0;

    constructor(plugin: PomodoroTimerPlugin) {
        this.plugin = plugin;
        this.app = plugin.app;
        this.logger = new Logger(plugin);
        this.clock = null;
        this.storeInternal = writable(this.getInitialState());
        this.store = derived(this.storeInternal, ($state) => ({
            ...$state,
            remained: this.remain($state.count, $state.elapsed, $state.status),
            finished: $state.elapsed >= $state.count && $state.status !== 'OVERTIME',
        }));
        this.subscribe = this.store.subscribe;

        try {
            this.clock = new Worker();
            this.clock.onmessage = ({ data }: MessageEvent) => this.tick(data as number);
        } catch (e) {
            sotaLog("Timer", "ERRO CRÍTICO ao instanciar Web Worker.", e);
            new Notice("❌ Erro fatal ao iniciar o Pomodoro Timer.");
        }
        
        const sotaContextUnsubscriber = sotaContextStore.subscribe((context) => {
            this.setSotaContext(context);
        });
        this.unsubscribers.push(sotaContextUnsubscriber);

        const stopwatchUnsubscriber = isStopwatchMode.subscribe((stopwatch) => {
            const s = this.getState();
            if (s.status === 'RUNNING' || s.status === 'OVERTIME') {
                return; 
            }
            this.storeInternal.update(st => {
                if (stopwatch) {
                    st.duration = 0;
                    st.count = 0;
                } else {
                    st.duration = st.mode === 'WORK' ? st.workLen : st.breakLen;
                    st.count = this.toMillis(st.duration);
                }
                st.elapsed = 0;
                return st;
            });
        });
        this.unsubscribers.push(stopwatchUnsubscriber);
    }
    
    public get sotaSync(): SotaSync | null {
        if (this.plugin && this.plugin.sotaSync) {
            return this.plugin.sotaSync;
        }
        return null;
    }

    public getState(): TimerState {
        return get(this.storeInternal);
    }

    private getInitialState(): TimerState {
        const settings = this.plugin.getSettings();
        const stopwatch = get(isStopwatchMode);
        const duration = stopwatch ? 0 : settings.workLen;

        return {
            workLen: settings.workLen,
            breakLen: settings.breakLen,
            status: 'IDLE', mode: 'WORK', elapsed: 0,
            startTime: null, duration: duration,
            count: this.toMillis(duration),
            sotaContext: get(sotaContextStore),
            id_sessao: null,
            temporada: undefined,
            episodio: undefined,
            missao: undefined,
        };
    }
    
    private remain(count: number, elapsed: number, status: TimerStatus): TimerRemained {
        const stopwatch = get(isStopwatchMode);
        const remained = stopwatch ? elapsed : Math.abs(count - elapsed);
        const min = Math.floor(remained / 60000);
        const sec = Math.floor((remained % 60000) / 1000);
        const minStr = min < 10 ? `0${min}` : min.toString();
        const secStr = sec < 10 ? `0${sec}` : sec.toString();
        
        const prefix = status === 'OVERTIME' ? '+' : '';
        
        return { millis: remained, human: `${prefix}${minStr}:${secStr}` };
    }

    private toMillis(minutes: number): number {
        return minutes * 60 * 1000;
    }

    private tick(t: number): void {
        const currentState = this.getState();
        if (currentState.status !== 'RUNNING' && currentState.status !== 'OVERTIME') { return; }
    
        this.storeInternal.update((s) => {
            const newElapsed = s.elapsed + t;
            let newStatus = s.status;
            const stopwatch = get(isStopwatchMode);
            // const tryhard = get(isTryhardMode); // (Não utilizado diretamente aqui, mas mantido a referência)

            if (s.status === 'RUNNING' && s.count > 0 && newElapsed >= s.count) {
                if (!stopwatch) {
                    newStatus = 'OVERTIME';
                }
            }
            
            // SOTA: Heartbeat Logic
            // Atualiza o arquivo de journal aproximadamente a cada 60 segundos
            const now = Date.now();
            if (now - this.lastHeartbeatSave > 60000) {
                this.lastHeartbeatSave = now;
                // Executa sem await para não bloquear o loop de renderização (Fire and Forget)
                this.plugin.sessionJournal?.atualizarHeartbeat(now);
            }

            return { ...s, elapsed: newElapsed, status: newStatus };
        });
        
        const newState = this.getState();
        if (newState.elapsed >= newState.count && currentState.elapsed < currentState.count) {
            this.timeup();
        }
    }

    public async endCurrentSession(): Promise<void> {
        const currentState = this.getState();
        if (currentState.status !== 'RUNNING' && currentState.status !== 'OVERTIME') {
            return;
        }

        // --- PASSO 1: CONGELAR O TEMPO ---
        // Para o Worker imediatamente para congelar o 'elapsed'
        this.clock?.postMessage({ start: false });
        
        // Tira um "snapshot" do estado no momento exato da parada.
        // Este estado será a única fonte da verdade para os logs.
        const frozenState = this.getState();
        sotaLog("Timer", "Tempo congelado. Estado do snapshot:", frozenState);
        
        const tryhard = get(isTryhardMode);
        const finished = frozenState.elapsed >= frozenState.count;
        
        // --- PASSO 2: LIDAR COM A FRICÇÃO (MODO TRYHARD) ---
        if (tryhard && !finished && frozenState.mode === 'WORK' && frozenState.count > 0) {
            const shouldStop = await new Promise<boolean>((resolve) => {
                const remained = this.remain(frozenState.count, frozenState.elapsed, frozenState.status).human;
                new FrictionModal(this.app, remained, resolve).open();
            });
            
            // Se o usuário decidiu continuar, reinicia o timer e aborta a finalização
            if (!shouldStop) {
                sotaLog("Timer", "Usuário decidiu continuar. Reiniciando o clock.");
                this.clock?.postMessage({ start: true, lowFps: this.plugin.getSettings().lowFps });
                return;
            }
        }
    
        // --- PASSO 3: FINALIZAR A SESSÃO USANDO O ESTADO CONGELADO ---
        // A lógica daqui para frente usa 'frozenState', não mais 'currentState'
        
        const eraUmBreakDeExercicio = frozenState.mode === 'BREAK' && frozenState.sotaContext.natureza === 'treino';

        if (frozenState.mode === 'WORK') {
            // Passa o estado congelado para o método de finalização
            await this.finalizarSessaoWork(frozenState); 
        } else { // Era um BREAK
            const logContext = this.createLogContext(frozenState, true);
            await this.processLog(logContext, 'sessao_break');
            
            // Usa a lógica de finalização, mas não depende do estado "vivo"
            this.storeInternal.update(s => this.endSessionLogic(s, true)); 
            
            await this.plugin.sessionJournal?.finalizarSessao();
        }
    
        // Se a sessão que acabou de terminar era um descanso de treino, procuramos a próxima tarefa.
        if (eraUmBreakDeExercicio) {
            await this.avancarParaProximaTarefaExercicio();
        }
    }
    
    private timeup(): void {
        this.notify(this.getState());
    }
    

private async finalizarSessaoWork(currentState: TimerState): Promise<void> {
        if (currentState.status === 'OVERTIME') {
            const bonusTime = this.remain(currentState.count, currentState.elapsed, currentState.status).human;
            new Notice(`Sessão finalizada com ${bonusTime} de bônus!`);
        }

        const tarefaFocada = this.plugin.tracker?.task;
        if (!tarefaFocada) {
            new Notice("❌ Erro: Tarefa focada não encontrada ao finalizar a sessão.");
            this.storeInternal.update(s => this.endSessionLogic(s, true));
            await this.plugin.sessionJournal?.finalizarSessao();
            return;
        }
        
        // --- LÓGICA UNIFICADA PARA TODOS OS TIPOS DE TREINO (INTACTA) ---
        if (currentState.sotaContext.natureza === 'treino') {
            const tempoSobTensao = Math.round(currentState.elapsed / 1000);
            
            const modal = new FeedbackExercicioModal(this.app, this, tarefaFocada, tempoSobTensao);
            modal.open();
            
            const foiSubmetido = await modal.submission; 

            await this.marcarTarefaComoConcluida(tarefaFocada);
            await this.plugin.sessionJournal?.finalizarSessao();

            if (!foiSubmetido) {
                new Notice(`ℹ️ Série não registrada (log mínimo salvo).`);
                const serieMatch = tarefaFocada.text.match(/Série (\d+)/i);
                const numSerie = serieMatch ? parseInt(serieMatch[1]) : null;
                
                const logContext = this.createLogContext(currentState, true, {
                    task: tarefaFocada,
                    duracaoSegundos: tempoSobTensao,
                    serie: numSerie,
                });

                const exercicioIdMatch = tarefaFocada.text.match(/(#exercicio\/[^\/]+\/[^\/\s]+)/);
                if (exercicioIdMatch) {
                    (logContext as any).tags = [exercicioIdMatch[1]];
                }

                await this.processLog(logContext, 'sessao_fim');
            }

            const descansoMatch = tarefaFocada.text.match(/\((\d+)s\)/);
            if (descansoMatch) {
                const duracaoDescansoSeg = parseInt(descansoMatch[1]);
                new Notice(`Iniciando descanso de ${duracaoDescansoSeg}s...`);

                this.storeInternal.update(s => {
                    s.mode = 'BREAK';
                    s.duration = duracaoDescansoSeg / 60;
                    s.count = duracaoDescansoSeg * 1000;
                    s.status = 'IDLE'; s.elapsed = 0; s.startTime = null;
                    return s;
                });
                
                await this.start();
            } else {
                 this.storeInternal.update(s => this.endSessionLogic(s, true)); 
            }
            return; 
        }

        const tryhard = get(isTryhardMode);
        const sessionLogData: Partial<LogContext> = {};

        // 1. Coleta de dados quantitativos (sempre ocorre)
        const debrief: DebriefData | null = await new Promise((resolve) => {
            new SessionDebriefModal(this.app, resolve).open();
        });

        if (debrief) {
            sessionLogData.focoAutoavaliado = debrief.foco;
            sessionLogData.humor = debrief.humor;
            sessionLogData.energia = debrief.energia;
        } else {
            sessionLogData.focoAutoavaliado = null; // Caso o usuário feche o modal (ESC)
        }
        
        // 2. Coleta de dados qualitativos (apenas no modo Tryhard)
        if (tryhard) {
            const reflexaoData = await new Promise<{ feito: string; melhora: string }>((resolve) => {
                new SessionReflectionModal(this.app, resolve).open();
            });

            if (reflexaoData) {
                sessionLogData.feito = reflexaoData.feito;
                sessionLogData.melhora = reflexaoData.melhora;
            }
        }

        // 3. Sincronização e Logging
        if (this.plugin.sotaSync) {
            await this.plugin.sotaSync.sincronizarFimSessao({ ...currentState, ...sessionLogData });
        }
        
        this.storeInternal.update(this.endSessionLogic);
        await this.plugin.sessionJournal?.finalizarSessao();
    }

    public createLogContext(s: TimerState, finished: boolean, overrides: Partial<LogContext> = {}): LogContext {
        const task = this.plugin.tracker?.task || overrides.task || DEFAULT_TASK;
        return { ...s, task, finished, ...overrides };
    }
    
    public async processLog(ctx: LogContext, tipoEvento: string) {
        if (ctx.mode === 'WORK' && tipoEvento === 'sessao_fim') {
            await this.plugin.tracker?.updateActual();
        }
        await this.logger.log(ctx, tipoEvento);
    }

    public async start(): Promise<void> {
        const currentState = this.getState();
        if (currentState.status === 'RUNNING' || currentState.status === 'OVERTIME') { return; }
    
        const tarefaFocada = this.plugin.tracker?.task;
        if (currentState.mode === 'WORK' && (!tarefaFocada || tarefaFocada.name === DEFAULT_TASK.name)) {
            const userDecision = await new Promise<'continue' | 'focus' | 'cancel'>((resolve) => {
                new TaskConfirmationModal(this.plugin.app, resolve).open();
            });
    
            if (userDecision !== 'continue') {
                if(userDecision === 'focus') new Notice("Selecione uma tarefa e inicie o timer novamente.");
                return;
            }
        }
    
        let nextState = { ...currentState };
    
        // Lógica de reset se estava parado
        if (nextState.status === 'IDLE') {
            const stopwatch = get(isStopwatchMode);
            if (stopwatch && nextState.mode === 'WORK') {
                nextState.duration = 0;
                nextState.count = 0;
            } else {
                nextState.duration = nextState.mode === 'WORK' ? nextState.workLen : nextState.breakLen;
                nextState.count = this.toMillis(nextState.duration);
            }
            nextState.elapsed = 0;
        }
        
        // Definições de Identidade e Tempo
        nextState.id_sessao = `pom_sess_${new Date().getTime()}`;
        
        // --- CORREÇÃO CRÍTICA AQUI ---
        // Definimos o startTime AGORA, antes de salvar no disco.
        nextState.startTime = new Date().getTime() - nextState.elapsed;
        nextState.status = 'RUNNING';
        // -----------------------------

        // Atualizamos o store interno imediatamente para a UI reagir rápido
        this.storeInternal.set(nextState);
    
        // Sincronização com SotaSync (Frontmatter dos arquivos)
        if (this.plugin.sotaSync) {
            await this.plugin.sotaSync.sincronizarInicioSessao(nextState);
        }
    
        // Gravação no Journal (Agora com startTime válido!)
        await this.plugin.sessionJournal?.iniciarSessao(nextState, this.plugin.tracker?.task || DEFAULT_TASK);
    
        this.lastHeartbeatSave = 0; // Reset do Heartbeat
        
        this.clock?.postMessage({ start: true, lowFps: this.plugin.getSettings().lowFps });
    }

    public onSotaContextChange(context: SotaContextState): void {
        sotaLog("Timer", "onSotaContextChange: Contexto recebido.", context);
        this.storeInternal.update(s => {
            if (s.status === 'RUNNING' || s.status === 'OVERTIME') {
                return s;
            }

            if (context.natureza === 'treino' && s.mode === 'WORK') {
                s.duration = 0;
                s.count = 0;
            } 
            else if (context.natureza !== 'treino' && s.mode === 'WORK') {
                s.duration = s.workLen;
                s.count = this.toMillis(s.workLen);
            }

            s.elapsed = 0;
            return s;
        });
    }

    private endSessionLogic = (state: TimerState, forceWorkMode: boolean = false): TimerState => {
        if (forceWorkMode) {
            state.mode = 'WORK';
        } else {
            state.mode = state.breakLen === 0 ? 'WORK' : (state.mode === 'WORK' ? 'BREAK' : 'WORK');
        }

        if (state.mode === 'BREAK' && state.sotaContext.natureza !== 'treino') {
            state.duration = state.breakLen;
            state.count = this.toMillis(state.duration);
        } else if (state.mode === 'WORK') {
            const stopwatch = get(isStopwatchMode);
            if (stopwatch) {
                state.duration = 0;
                state.count = 0;
            } else {
                state.duration = state.workLen;
                state.count = this.toMillis(state.workLen);
            }
        }
        
        state.status = 'IDLE';
        state.startTime = null;
        state.elapsed = 0;
        
        state.sotaContext = get(sotaContextStore);

        this.clock?.postMessage({ start: false });
        return state;
    }

private async avancarParaProximaTarefaExercicio(): Promise<void> {
    sotaLog("Timer", "Avanço automático: Procurando próxima tarefa de exercício.");

    const tracker = this.plugin.tracker;
    const tasks = this.plugin.tasks;

    if (!tracker || !tasks) {
        sotaLog("Timer", "Avanço automático: Tracker ou Tasks não disponível.");
        return;
    }

    const tarefaAtual = tracker.task;
    const listaDeTarefas = get(tasks).list; // Pega o valor atual do store de tarefas

    if (!tarefaAtual || listaDeTarefas.length === 0) {
        sotaLog("Timer", "Avanço automático: Sem tarefa atual ou lista de tarefas vazia.");
        return;
    }

    // Encontra o índice da tarefa que acabou de ser concluída (a que estava em foco)
    const indiceAtual = listaDeTarefas.findIndex(t => t.path === tarefaAtual.path && t.line === tarefaAtual.line);

    if (indiceAtual === -1) {
        sotaLog("Timer", "Avanço automático: Tarefa atual não encontrada na lista.");
        return;
    }

    // Procura a próxima tarefa válida a partir da posição atual
    for (let i = indiceAtual + 1; i < listaDeTarefas.length; i++) {
        const proximaTarefa = listaDeTarefas[i];
        
        // Condições: ser de exercício E não estar completa
        const ehExercicio = proximaTarefa.tags.some(tag => tag.includes("#exercicio"));
        const naoCompleta = !proximaTarefa.checked;

        if (ehExercicio && naoCompleta) {
            sotaLog("Timer", "Avanço automático: Próxima tarefa encontrada.", proximaTarefa);
            await tracker.active(proximaTarefa);
            new Notice("Próxima série em foco!");
            return; // Encontrou e ativou, encerra a função
        }
    }

    // Se o loop terminar, significa que não há mais tarefas de exercício pendentes
    sotaLog("Timer", "Avanço automático: Nenhuma tarefa de exercício pendente encontrada. Limpando foco.");
    tracker.clear();
    new Notice("Treino finalizado! Todas as séries concluídas.");
}


private async marcarTarefaComoConcluida(task: TaskItem): Promise<void> {
    sotaLog("Timer", "Marcando tarefa como concluída e verificando recompensas...", task);
    try {
        const file = this.app.vault.getAbstractFileByPath(task.path);
        if (file instanceof TFile) {
            const content = await this.app.vault.read(file);
            const lines = content.split('\n');
            
            if (lines.length > task.line && lines[task.line] && lines[task.line].includes('[ ]')) {
                let taskLine = lines[task.line];
                taskLine = taskLine.replace('[ ]', '[x]');
                const hojeStr = moment().format("YYYY-MM-DD");
                taskLine += ` ✅ ${hojeStr}`;
                
                lines[task.line] = taskLine;
                await this.app.vault.modify(file, lines.join('\n'));

                // Aciona o Quest Engine APÓS a tarefa ser marcada com sucesso
                await this.sotaSync?.verificarRecompensas(task);
            }
        }
    } catch (error) {
        console.error("SOTA Erro ao marcar tarefa como concluída:", error);
        new Notice("⚠️ Falha ao atualizar o status da tarefa no arquivo.");
    }
}

    public async recuperarSessaoInterrompida(sessao: JournalEntry): Promise<void> {
        const agora = new Date().getTime();
        // Fallback para startTime se lastHeartbeat não existir (compatibilidade)
        const lastHeartbeat = sessao.lastHeartbeat || sessao.startTime!;
        
        // Calcula o tempo que o Obsidian ficou fechado
        const gap = agora - lastHeartbeat;
        
        // Threshold: 2 minutos (120000 ms)
        // Se o gap for menor que isso, assumimos um reload rápido e recuperamos automaticamente como contínuo.
        if (gap < 120000) {
            sotaLog("Timer", "Gap pequeno (<2min) detectado. Recuperação automática contínua.");
            await this.recoverSessionAsContinuous(sessao);
        } else {
            sotaLog("Timer", "Gap grande detectado. Solicitando decisão do usuário via Modal.");
            new SessionRecoveryModal(this.app, sessao, async (option: RecoveryOption) => {
                if (option === 'continuous') {
                    await this.recoverSessionAsContinuous(sessao);
                } else if (option === 'stopped') {
                    await this.recoverSessionAsStopped(sessao);
                } else {
                    // Descartar
                    new Notice("Sessão interrompida descartada.");
                    await this.plugin.sessionJournal?.finalizarSessao();
                }
            }).open();
        }
    }

    private async recoverSessionAsContinuous(sessao: JournalEntry): Promise<void> {
        const agora = new Date().getTime();
        const duracaoTotal = agora - sessao.startTime!;
        
        new Notice(`SOTA: Sessão recuperada (${Math.round(duracaoTotal / 60000)} min). Logando...`, 5000);

        // Estado simulado para logar como se tivesse rodado até agora
        const estadoRecuperado: Partial<TimerState> = {
            ...sessao,
            startTime: sessao.startTime,
            elapsed: duracaoTotal,
            status: 'OVERTIME' // Assume overtime pois excedeu o tempo original
        };
        
        await this.finalizeRecovery(estadoRecuperado as TimerState, sessao.tarefaFocada);
    }

    private async recoverSessionAsStopped(sessao: JournalEntry): Promise<void> {
        const lastHeartbeat = sessao.lastHeartbeat || sessao.startTime!;
        const duracaoValida = lastHeartbeat - sessao.startTime!;
        
        new Notice(`SOTA: Sessão recuperada parcialmente (${Math.round(duracaoValida / 60000)} min).`, 5000);

        const estadoRecuperado: Partial<TimerState> = {
            ...sessao,
            startTime: sessao.startTime,
            elapsed: duracaoValida,
            status: 'IDLE' 
        };

        // ALTERAÇÃO: Passamos o lastHeartbeat como o tempo final forçado
        await this.finalizeRecovery(estadoRecuperado as TimerState, sessao.tarefaFocada, lastHeartbeat);
    }

    // ALTERAÇÃO: Assinatura atualizada para aceitar forcedEndTime opcional
    private async finalizeRecovery(state: TimerState, task: TaskItem, forcedEndTime?: number) {
        // Cria o contexto de log injetando o forcedEndTime
        const logContext = this.createLogContext(state, true, { 
            task: task,
            forcedEndTime: forcedEndTime 
        });
        
        if (state.mode === 'WORK') {
            await this.plugin.sotaSync?.sincronizarFimSessao({ 
                ...logContext, 
                focoAutoavaliado: null,
                forcedEndTime: forcedEndTime // Repassa para o SotaSync
            });
        } else {
            await this.processLog(logContext, 'sessao_break');
        }
        
        await this.plugin.sessionJournal?.finalizarSessao();
    }
    
    public setSotaContext(context: SotaContextState): void {
        this.storeInternal.update(s => {
            if (s.status === 'RUNNING' || s.status === 'OVERTIME') {
                sotaLog("Timer", "setSotaContext: Blindagem Ativa. Contexto externo ignorado.", { contextoRecebido: context });
                return s;
            }
            s.sotaContext = context;
            return s;
        });
    }

    public notify(state: TimerState): void {
        const stopwatch = get(isStopwatchMode);
        const tryhard = get(isTryhardMode);
        
        // Não notifica se estiver em modo stopwatch ou tryhard (pois o timer continua)
        if (stopwatch || tryhard) return;

        const emoji = state.mode == 'WORK' ? '🍅' : '☕';
        const baseText = `Sessão de ${state.mode === 'WORK' ? 'Foco' : 'Pausa'} de ${state.duration} min concluída.`;
        const overtimeText = state.status === 'OVERTIME' ? ` Tempo extra: ${this.remain(state.count, state.elapsed, state.status).human}` : '';
        const text = `${emoji} ${baseText}${overtimeText}`;
        new Notice(text);
        if (this.plugin.getSettings().notificationSound) {
            this.playAudio();
        }
    }

    public async toggleTimer(): Promise<void> {
        const currentState = this.getState();
        if (currentState.status === 'RUNNING' || currentState.status === 'OVERTIME') {
            await this.endCurrentSession();
        } else {
            await this.start();
        }
    }

    public toggleMode(callback?: (state: TimerState) => void): void {
        this.storeInternal.update((s) => {
            let updated = this.endSessionLogic(s);
            if (callback) {
                callback(updated);
            }
            return updated;
        });
    }

    public playAudio(): void {
        let audio = Timer.DEFAULT_NOTIFICATION_AUDIO;
        let customSound = this.plugin.getSettings().customSound;
        if (customSound) {
            const soundFile = this.app.vault.getAbstractFileByPath(customSound);
            if (soundFile instanceof TFile) {
                const soundSrc = this.app.vault.getResourcePath(soundFile);
                audio = new Audio(soundSrc);
            }
        }
        audio.play().catch(error => console.error("Erro ao tocar áudio:", error));
    }

    public setupTimer(): void {
        this.storeInternal.update((state) => {
            const { workLen, breakLen } = this.plugin.getSettings();
            state.workLen = workLen;
            state.breakLen = breakLen;
            if (state.status === 'IDLE') {
                state.duration = state.mode === 'WORK' ? state.workLen : state.breakLen;
                state.count = this.toMillis(state.duration);
            }
            return state;
        });
    }

    public destroy(): void {
        this.clock?.terminate();
        this.unsubscribers.forEach(unsub => unsub());
    }
}