<script lang="ts">
    import { moment, Notice, TFile, App } from 'obsidian';
    import { settings, sotaContextStore, sotaLeituraStore, isStopwatchMode, isTryhardMode } from './stores';
    import type Timer from './Timer';
    import type Tasks from './Tasks';
    import { type TaskItem } from './Tasks';
    import type TaskTracker from './TaskTracker';
    import type { SotaSync } from './SotaSync';
    import type { TaskInjector } from './TaskInjector'; // Fase 4
    import type PomodoroTimerPlugin from 'main';
    import { onMount, onDestroy } from 'svelte';
    import { fade } from 'svelte/transition';

    // Iconografia SOTA
    import ArrowLeft from 'lucide-svelte/icons/arrow-left';
    import ArrowRight from 'lucide-svelte/icons/arrow-right';
    import Zap from 'lucide-svelte/icons/zap';
    import CircleCheckBig from 'lucide-svelte/icons/circle-check-big';
    import StopCircle from 'lucide-svelte/icons/stop-circle';
    import Play from 'lucide-svelte/icons/play';
    import ListPlus from 'lucide-svelte/icons/list-plus'; // Fase 4
    import ListChecks from 'lucide-svelte/icons/list-checks';
    import SlidersHorizontal from 'lucide-svelte/icons/sliders-horizontal';
    import Circle from 'lucide-svelte/icons/circle';
    import CheckCircle from 'lucide-svelte/icons/check-circle';
    import Crosshair from 'lucide-svelte/icons/crosshair';
    import Target from 'lucide-svelte/icons/target';
    import Gift from 'lucide-svelte/icons/gift';
    import Watch from 'lucide-svelte/icons/watch';
    import Brain from 'lucide-svelte/icons/brain';

    import TimerSettingsComponent from './TimerSettingsComponent.svelte';
    import { sotaLog } from './Debug';

    export let timer: Timer;
    export let tasks: Tasks;
    export let tracker: TaskTracker;
    export let sotaSync: SotaSync;
    export let taskInjector: TaskInjector; // Fase 4
    export let app: App;

    interface ITasksApiV1 {
        executeToggleTaskDoneCommand(line: string, path: string): string;
    }

    // Lógica da UI, recompensas, etc. permanecem inalteradas...
    const getTaskId = (task: TaskItem): string => `${task.path}:${task.line}`;
    let painelVisivel: 'tarefas' | 'recompensas' | 'config' = 'tarefas';
    let filtroStatus: 'pendentes' | 'concluidas' | 'todas' = 'pendentes';
    
    let recompensasAtivas: any[] = [];
    let localTasksList: TaskItem[] = [];
    let pinnedTask: TaskItem | null | undefined = null;

    // --- NOVA LÓGICA DE AGRUPAMENTO (v3.0) ---
    let groupedTasks: { exercicioNome: string; series: TaskItem[] }[] = [];
    let isContextoExercicio: boolean = false;

    $: {
        isContextoExercicio = $sotaContextStore.natureza === 'treino';
        let allTasks = $tasks.list || [];

        // Filtra por status (pendente, concluída, todas)
        const filteredByStatus = allTasks.filter(item => {
            if (filtroStatus === 'pendentes') return !item.checked;
            if (filtroStatus === 'concluidas') return item.checked;
            return true;
        });

        pinnedTask = $tracker.pinned ? $tracker.task : null;
        const pinnedTaskId = pinnedTask ? getTaskId(pinnedTask) : null;
        const tasksParaProcessar = pinnedTaskId 
            ? filteredByStatus.filter(t => getTaskId(t) !== pinnedTaskId) 
            : filteredByStatus;

        if (isContextoExercicio) {
            const tasksByExercicio = new Map<string, TaskItem[]>();
            const exercicioNomes = new Map<string, string>();
            
            for (const task of tasksParaProcessar) {
                const exercicioTag = task.tags.find(tag => tag.startsWith('#exercicio/'));
                if (exercicioTag) {
                    // --- ALTERAÇÃO AQUI ---
                    // Regex Híbrido: Tenta pegar o ID na estrutura nova (Grupo/ID) ou na antiga (ID)
                    // Estrutura Nova: #exercicio/qualquer_coisa/(ID_CAPTURED)/...
                    const matchNovo = exercicioTag.match(/#exercicio\/[^\/]+\/([^\/\s]+)/);
                    // Estrutura Antiga: #exercicio/(ID_CAPTURED)/...
                    const matchAntigo = exercicioTag.match(/#exercicio\/([^\/\s]+)/);

                    // Prioriza o ID da estrutura nova (Grupo 1), se não, tenta a antiga
                    const exercicioId = (matchNovo && matchNovo[1]) 
                        ? matchNovo[1] 
                        : (matchAntigo ? matchAntigo[1] : 'desconhecido');
                    
                    // Lógica de Formatação Visual (Remove _ e Capitaliza)
                    if (!tasksByExercicio.has(exercicioId)) {
                        tasksByExercicio.set(exercicioId, []);
                        const nomeAmigavel = exercicioId
                            .replace(/_/g, ' ') // Troca underline por espaço
                            .replace(/\b\w/g, l => l.toUpperCase()); // Primeira letra maiúscula
                        exercicioNomes.set(exercicioId, nomeAmigavel);
                    }
                    tasksByExercicio.get(exercicioId)?.push(task);
                }
            }
            
            groupedTasks = Array.from(tasksByExercicio.entries()).map(([id, series]) => ({
                exercicioNome: exercicioNomes.get(id) || "Exercício",
                series: series
            }));

        } else {
            // Se não for contexto de exercício, usa a lista plana
            localTasksList = tasksParaProcessar;
            groupedTasks = [];
        }
    }

    // --- LÓGICA DE RECOMPENSAS (QUEST ENGINE) ---
    let dvApi: any = null;
    let recompensasPendentes: any[] = [];
    let recompensasDesbloqueadas: any[] = [];

    // --- OTIMIZAÇÃO SOTA: Event-Driven (Sem Polling) ---
    
    // Variável para guardar a referência do evento (para limpar depois)
    let metadataEventRef: any = null;

    onMount(() => {
        dvApi = app.plugins.plugins["dataview"]?.api;
        
        // 1. Carga inicial (apenas uma vez ao abrir)
        carregarRecompensas();

        // 2. Ouvinte Inteligente: Dispara apenas quando um arquivo muda
        metadataEventRef = app.metadataCache.on('changed', (file) => {
            
            // Cenário A: O arquivo modificado é uma definição de recompensa?
            if (file.path.includes('99 - BACKEND/Recompensas')) {
                carregarRecompensas();
                return;
            }

            // Cenário B: O arquivo modificado é a nota que estou usando agora?
            // (Isso acontece quando dou check numa tarefa: o arquivo muda)
            if (tracker.file && file.path === tracker.file.path) {
                carregarRecompensas();
            }
        });
    });

    // 3. Limpeza de Memória (Obrigatório)
    onDestroy(() => {
        if (metadataEventRef) {
            app.metadataCache.offref(metadataEventRef);
        }
    });

    async function carregarRecompensas() {
        if (!dvApi) return;
        const ativasEDesbloqueadas = dvApi.pages('"99 - BACKEND/Recompensas"')
            .where((r: any) => r.status === 'pendente' || r.status === 'desbloqueado').values;
        for (const recompensa of ativasEDesbloqueadas) {
            let concluidas = 0;
            const total = recompensa.tarefas_necessarias?.length || 0;
            if (total > 0) {
                for (const definicaoTarefa of recompensa.tarefas_necessarias) {
                    const blockId = definicaoTarefa.block_id;
                    if (!blockId) continue;
                    const idParaBusca = `^${blockId}`;
                    const tarefaEncontrada = dvApi.pages('""').file.lists
                        .where((t: any) => t.task && t.text.includes(idParaBusca))
                        .first();
                    if (tarefaEncontrada?.completed) {
                        concluidas++;
                    }
                }
            }
            recompensa.progresso = { concluidas, total };
        }
        recompensasAtivas = ativasEDesbloqueadas;
    }

    async function handleResgatarRecompensa(recompensa: any) {
        const file = app.vault.getAbstractFileByPath(recompensa.file.path);
        if (!(file instanceof TFile)) {
            new Notice(`❌ Erro: Arquivo da recompensa "${recompensa.nome_recompensa}" não encontrado.`);
            return;
        }
        await app.fileManager.processFrontMatter(file, (fm) => {
            fm.status = "resgatado";
            fm.data_resgate = moment().format("YYYY-MM-DD");
        });
        const logText = `\n- 🎁 Recompensa Resgatada: "[[${recompensa.file.path}|${recompensa.nome_recompensa}]]" #recompensa (log_date::${moment().format("YYYY-MM-DD")}) (log_time::${moment().format("HH:mm:ss")})`;
        const dailyLogPath = `99 - BACKEND/Logs_Metricas/Daily/${moment().format("YYYY-MM-DD")}.md`;
        const dailyLogFile = app.vault.getAbstractFileByPath(dailyLogPath) as TFile | null;
        const utils = (await import('utils'));
        await utils.appendOrCreate(app, dailyLogFile, dailyLogPath, logText);
        new Notice(`✅ Recompensa "${recompensa.nome_recompensa}" resgatada!`);
        await carregarRecompensas();
    }

    function calculateProgress(task: TaskItem | null | undefined): number {
        if (!task || !task.expected || task.expected <= 0) return 0;
        return Math.min((task.actual / task.expected) * 100, 100);
    }

    const handleToggleComplete = async (task: TaskItem | null | undefined, event: MouseEvent) => {
        event.stopPropagation();
        event.preventDefault();
        if (!task) return;
        const tasksPlugin = app.plugins.plugins['obsidian-tasks-plugin'];
        if (!tasksPlugin) {
            new Notice("❌ Erro: O plugin 'Tasks' não está instalado ou ativado.");
            return;
        }
        const tasksPluginApi = (tasksPlugin as any).apiV1 as ITasksApiV1 | undefined;
        if (tasksPluginApi?.executeToggleTaskDoneCommand) {
            try {
                const updatedLineText = tasksPluginApi.executeToggleTaskDoneCommand(task.text, task.path);
                if (!updatedLineText) {
                    new Notice("❌ A API do Tasks não conseguiu processar a tarefa.");
                    return;
                }
                const file = app.vault.getAbstractFileByPath(task.path);
                if (file instanceof TFile) {
                    const content = await app.vault.read(file);
                    let lines = content.split('\n');
                    lines.splice(task.line, 1, updatedLineText.trim().split('\n'));
                    await app.vault.modify(file, lines.join('\n'));
                    
                    // 1. Capturamos se a ação é de CONCLUIR (estava false, vai virar true)
                    const isCompleting = !task.checked;

                    // 2. Atualizamos o estado visual/memória
                    tasks.updateTaskState(task, !task.checked);
                    
                    // 3. Se a ação foi de concluir, soltamos os fogos de artifício
                    if (isCompleting) {
                        const xpTable: Record<string, number> = { 
                            'trivial': 10, 
                            'facil': 20, 
                            'moderado': 40, 
                            'desafiador': 80, 
                            'hardcore': 150 
                        };

                        // Extrai a dificuldade
                        const match = task.text.match(/#nivel\/dificuldade\/([a-zA-Z]+)/);
                        const dificuldade = match ? match[1].toLowerCase() : 'trivial';
                        const xpGanho = xpTable[dificuldade] || 10;

                        new Notice(`🌟 Tarefa Concluída! +${xpGanho} XP`);

                        // Verifica recompensas
                        await sotaSync.verificarRecompensas(task);
                    }
                } else {
                    new Notice(`❌ Erro: Não foi possível encontrar o arquivo da tarefa: "${task.path}".`);
                }
            } catch (error) {
                new Notice("❌ Ocorreu um erro ao salvar a alteração da tarefa.");
                console.error("SOTA Pomodoro: Erro ao modificar o arquivo da tarefa:", error);
            }
        } else {
            new Notice("⚠️ A API do plugin 'Tasks' não está pronta. Tente novamente.");
        }
    };
    
    function formatTask(task: TaskItem): { counter: string, text: string } {
        if (!task) return { counter: '', text: '' };
        let counter = '';
        const pomodoroMatch = task.text.match(/\[🍅::\s*(\d+)\s*\/\s*(\d+)\s*\]/);
        if (pomodoroMatch) {
            counter = `🍅 ${pomodoroMatch[1]}/${pomodoroMatch[2]}`;
        } else if (task.expected > 0) {
            counter = `🍅 ${task.actual ?? 0}/${task.expected}`;
        }
        const textoLimpo = task.description
            .replace(/\[🍅::\s*\d+\/\d+\]/g, '')
            .replace(/#\S+/g, '')
            .replace(/\s*\^[a-zA-Z0-9-]+/g, '')
            .replace(/(\*\*|__)(.*?)\1/g, '$2')
            .replace(/(\*|_)(.*?)\1/g, '$2')
            .trim();
        return { counter, text: textoLimpo };
    }

        function getOvertimeColor(elapsed: number, count: number, status: string): string {
        // Se não estiver em Overtime, retorna a cor padrão (herdada do CSS)
        if (status !== 'OVERTIME') return '';

        // Calcula o excesso em minutos
        const overtimeMillis = elapsed - count;
        const overtimeMinutes = overtimeMillis / 60000;

        // Limites para a transição (em minutos)
        const limitYellow = 5;
        const limitOrange = 10;
        const limitRed = 15;

        // Função auxiliar para interpolar entre duas cores
        const interpolate = (startColor: number[], endColor: number[], factor: number) => {
            const result = startColor.slice();
            for (let i = 0; i < 3; i++) {
                result[i] = Math.round(result[i] + factor * (endColor[i] - startColor[i]));
            }
            return `rgb(${result[0]}, ${result[1]}, ${result[2]})`;
        };

        // Cores base (RGB)
        const white = [255, 255, 255];   // Branco (T+0)
        const yellow = [255, 215, 0];    // Ouro (T+5)
        const orange = [255, 140, 0];    // Laranja Escuro (T+10)
        const red = [255, 69, 58];       // Vermelho Vivo (T+15+)

        if (overtimeMinutes <= limitYellow) {
            // Fase 1: Branco -> Amarelo
            const factor = overtimeMinutes / limitYellow;
            return interpolate(white, yellow, factor);
        } else if (overtimeMinutes <= limitOrange) {
            // Fase 2: Amarelo -> Laranja
            const factor = (overtimeMinutes - limitYellow) / (limitOrange - limitYellow);
            return interpolate(yellow, orange, factor);
        } else if (overtimeMinutes <= limitRed) {
            // Fase 3: Laranja -> Vermelho
            const factor = (overtimeMinutes - limitOrange) / (limitRed - limitOrange);
            return interpolate(orange, red, factor);
        } else {
            // Fase Final: Vermelho (e talvez pulsante no futuro, mas por enquanto, vermelho fixo)
            return `rgb(${red[0]}, ${red[1]}, ${red[2]})`;
        }
    }

</script>

<div class="pomodoro-timer-view">
    <!-- SEÇÃO SUPERIOR FIXA -->
    <div class="pomodoro-timer-clock">
        <button class="pomodoro-timer-mode sota-button" on:click={() => timer.toggleMode()} aria-label="Alternar modo">
            <span>{$timer.mode}</span>
        </button>
        {#if $isTryhardMode}
            <div class="sota-tryhard-indicator">
                <Brain size={18}/>
            </div>
        {/if}

        <div class="pomodoro-timer-time" style="color: {getOvertimeColor($timer.elapsed, $timer.count, $timer.status)}">
    {$timer.remained.human}
        </div>
        <div class="pomodoro-timer-controls">
            <!-- 1. Botão Lista de Tarefas (Esquerda) -->
            <button class="pomodoro-timer-button" class:active={painelVisivel === 'tarefas'} on:click={() => painelVisivel = 'tarefas'} aria-label="Mostrar Tarefas">
                <ListChecks />
            </button>
            
            <!-- 2. NOVA POSIÇÃO: Botão Adicionar Tarefa (Centro-Esquerda) -->
            <!-- Ícone alterado de Plus para ListPlus -->
            <button class="pomodoro-timer-button" on:click={() => taskInjector.createTaskInCurrentContext()} aria-label="Criar Nova Tarefa">
                <ListPlus />
            </button>

            <!-- 3. Botão Play/Pause (Centro) -->
            <button class="pomodoro-timer-button play-pause-button" on:click={() => timer.toggleTimer()} aria-label={$timer.status === 'RUNNING' || $timer.status === 'OVERTIME' ? 'Stop Timer' : 'Start Timer'}>
                {#if $timer.status === 'RUNNING' || $timer.status === 'OVERTIME'} <StopCircle /> {:else} <Play /> {/if}
            </button>

            <!-- 4. NOVA POSIÇÃO: Botão Recompensas (Centro-Direita) -->
            <button class="pomodoro-timer-button" class:active={painelVisivel === 'recompensas'} on:click={() => painelVisivel = 'recompensas'} aria-label="Mostrar Recompensas">
                <Gift />
            </button>

            <!-- 5. Botão Configurações (Direita) -->
            <button class="pomodoro-timer-button" class:active={painelVisivel === 'config'} on:click={() => painelVisivel = painelVisivel === 'config' ? 'tarefas' : 'config'} aria-label="Mostrar/Ocultar Configurações">
                <SlidersHorizontal />
            </button>
        </div>
    </div>

    <!-- PAINEL DE LEITURA CONTEXTUAL -->
    {#if $sotaContextStore.natureza === 'paginada' && $sotaLeituraStore && $sotaLeituraStore.unidadeAtual && painelVisivel !== 'config'}
        <div class="pomodoro-sota-panel-wrapper">
            <div class="sota-divider"></div>
            <div class="pomodoro-sota-panel-content">
                <h3>Painel de Leitura</h3>
                <div class="pomodoro-timer-controls">
                    {#if $sotaLeituraStore.paginaAtual}
                        <button class="pomodoro-timer-button sota-button" on:click={() => sotaSync.sincronizarVoltarPagina($sotaContextStore)} aria-label="Voltar Página"><ArrowLeft /></button>
                        <button class="pomodoro-timer-button sota-button" on:click={() => sotaSync.sincronizarAvancarPagina($sotaContextStore)} aria-label="Avançar Página"><ArrowRight /></button>
                        <button class="pomodoro-timer-button sota-button" on:click={() => sotaSync.sincronizarMudarFoco($sotaContextStore)} aria-label="Mudar Foco de Leitura"><Zap /></button>
                    {/if}
                    <button class="pomodoro-timer-button pomodoro-sota-button-text sota-button" on:click={() => sotaSync.sincronizarFinalizarUnidade($sotaContextStore)} aria-label="Finalizar {$sotaLeituraStore.labelUnidade} Atual">
                        <CircleCheckBig size={"18"}/>
                        <span>Finalizar {$sotaLeituraStore.labelUnidade}. {$sotaLeituraStore.unidadeAtual}</span>
                    </button>
                </div>
            </div>
            <div class="sota-divider"></div>
        </div>
    {/if}

    <!-- PAINÉIS INFERIORES DINÂMICOS -->
    <div class="pomodoro-painel-dinamico">
        {#if painelVisivel === 'tarefas'}
            <div class="tasks-wrapper">
                {#if $sotaContextStore.natureza !== 'paginada'} <div class="sota-divider top-divider"></div> {/if}
                <div class="focus-section">
                    <div class="focus-section-header">FOCO ATUAL</div>
                    {#if pinnedTask}
                        <div class="task-item is-pinned" class:is-completed={pinnedTask.checked} style="--progress-width: {calculateProgress(pinnedTask)}%;">
                            <div class="task-content">
                                <button class="task-icon" on:click|stopPropagation|preventDefault={(e) => handleToggleComplete(pinnedTask, e)}>
                                    {#if pinnedTask.checked} <CheckCircle size={20} /> {:else} <Circle size={20} /> {/if}
                                </button>
                                {#if formatTask(pinnedTask).counter}<span class="pomodoro-counter">{formatTask(pinnedTask).counter}</span>{/if}
                                <div class="task-description">{formatTask(pinnedTask).text}</div>
                            </div>
                            <button class="focus-btn" on:click|stopPropagation={() => tracker.togglePinned()} title="Desafixar Foco"><Target size={18} /></button>
                        </div>
                    {:else}
                        <div class="focus-placeholder">Nenhuma tarefa em foco</div>
                    {/if}
                </div>
                <div class="local-tasks-section">
                    <div class="sota-divider"></div>
                    <div class="tasks-unified-header">
                        <div class="tasks-file-name">
                            {#if $tracker.file}<span>{$tracker.file.basename}</span>{:else}<span>Nenhum arquivo ativo</span>{/if}
                        </div>
                        <div class="filters">
                            <button class="sota-button" class:active={filtroStatus === 'pendentes'} on:click={() => filtroStatus = 'pendentes'}>Pendentes</button>
                            <button class="sota-button" class:active={filtroStatus === 'concluidas'} on:click={() => filtroStatus = 'concluidas'}>Concluídas</button>
                            <button class="sota-button" class:active={filtroStatus === 'todas'} on:click={() => filtroStatus = 'todas'}>Todas</button>
                        </div>
                    </div>
                    {#if isContextoExercicio}
                        {#if groupedTasks.length > 0}
                            <div class="tasks-list">
                                {#each groupedTasks as grupo}
                                    <div class="exercicio-header">{grupo.exercicioNome}</div>
                                    {#each grupo.series as task (task.line)}
                                        <!-- CÓDIGO DO ITEM DA TAREFA (COPIADO E COLADO) -->
                                        <div class="task-item" class:is-active={$tracker.task && getTaskId($tracker.task) === getTaskId(task) && !$tracker.pinned} class:is-completed={task.checked} on:click={() => tracker.active(task)} on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') tracker.active(task); }} role="button" tabindex="0">
                                            <div class="task-content">
                                                <button class="task-icon" on:click|stopPropagation|preventDefault={(e) => handleToggleComplete(task, e)}>
                                                    {#if task.checked} <CheckCircle size={20} /> {:else} <Circle size={20} /> {/if}
                                                </button>
                                                {#if formatTask(task).counter}<span class="pomodoro-counter">{formatTask(task).counter}</span>{/if}
                                                <div class="task-description">{formatTask(task).text}</div>
                                            </div>
                                            {#if $tracker.task && getTaskId($tracker.task) === getTaskId(task) && !$tracker.pinned}
                                                <button class="focus-btn" on:click|stopPropagation={() => tracker.togglePinned()} title="Fixar Foco" transition:fade><Crosshair size={18} /></button>
                                            {/if}
                                        </div>
                                    {/each}
                                {/each}
                            </div>
                        {:else}
                            <div class="tasks-list-empty">Nenhuma série encontrada neste filtro.</div>
                        {/if}
                    {:else}
                        {#if localTasksList.length > 0}
                            <div class="tasks-list">
                                {#each localTasksList as task (task.line)}
                                    <!-- CÓDIGO DO ITEM DA TAREFA (COPIADO E COLADO) -->
                                     <div class="task-item" class:is-active={$tracker.task && getTaskId($tracker.task) === getTaskId(task) && !$tracker.pinned} class:is-completed={task.checked} on:click={() => tracker.active(task)} on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') tracker.active(task); }} role="button" tabindex="0">
                                        <div class="task-content">
                                            <button class="task-icon" on:click|stopPropagation|preventDefault={(e) => handleToggleComplete(task, e)}>
                                                {#if task.checked} <CheckCircle size={20} /> {:else} <Circle size={20} /> {/if}
                                            </button>
                                            {#if formatTask(task).counter}<span class="pomodoro-counter">{formatTask(task).counter}</span>{/if}
                                            <div class="task-description">{formatTask(task).text}</div>
                                        </div>
                                        {#if $tracker.task && getTaskId($tracker.task) === getTaskId(task) && !$tracker.pinned}
                                            <button class="focus-btn" on:click|stopPropagation={() => tracker.togglePinned()} title="Fixar Foco" transition:fade><Crosshair size={18} /></button>
                                        {/if}
                                    </div>
                                {/each}
                            </div>
                        {:else}
                            <div class="tasks-list-empty">Nenhuma tarefa encontrada neste filtro.</div>
                        {/if}
                    {/if}
                </div>
            </div>
        {/if}

        {#if painelVisivel === 'recompensas'}
            <div class="recompensas-wrapper">
                <div class="sota-divider top-divider"></div>
                <div class="recompensas-section">
                    <div class="recompensas-section-header">RECOMPENSAS</div>
                     {#if recompensasAtivas.length > 0}
                        <div class="recompensas-list">
                            {#each recompensasAtivas as recompensa (recompensa.file.path)}
                                <div class="recompensa-item">
                                    <span class="recompensa-nome">{recompensa.nome_recompensa}</span>
                                    
                                    {#if recompensa.progresso && recompensa.progresso.total > 0}
                                        <div class="recompensa-progresso-container">
                                            <span class="recompensa-progresso-texto">{recompensa.progresso.concluidas}/{recompensa.progresso.total}</span>
                                            <progress class="recompensa-progresso-barra" value={recompensa.progresso.concluidas} max={recompensa.progresso.total}></progress>
                                            
                                            {#if recompensa.progresso.concluidas >= recompensa.progresso.total}
                                                <button class="sota-button cta" on:click={() => handleResgatarRecompensa(recompensa)}>Resgatar</button>
                                            {/if}
                                        </div>
                                    {/if}
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <div class="recompensas-list-empty">Nenhuma recompensa ativa. Crie uma para começar!</div>
                    {/if}
                </div>
            </div>
        {/if}

        {#if painelVisivel === 'config'}
            <div class="settings-panel-wrapper">
                <div class="sota-divider top-divider"></div>
                <TimerSettingsComponent />
            </div>
        {/if}
    </div>
</div>

<style>
    :root {
        --sota-green-progress: rgba(115, 201, 145, 0.4);
    }
    button { background: none; border: none; padding: 0; margin: 0; color: inherit; font: inherit; text-align: left; display: flex; align-items: center; cursor: pointer; }
    .pomodoro-timer-view { display: flex; flex-direction: column; align-items: center; padding-top: 1rem; height: 100%; color: var(--text-normal); overflow-y: auto; }
    .pomodoro-painel-dinamico { width: 100%; flex-grow: 1; display: flex; flex-direction: column; }
    .pomodoro-timer-clock { position: relative; width: 100%; flex-shrink: 0; }
    .pomodoro-timer-clock > div, .pomodoro-timer-clock > button { max-width: 200px; margin-left: auto; margin-right: auto; }
    .pomodoro-timer-mode { position: absolute; top: 2rem; left: 50%; transform: translateX(-50%); padding: 6px 20px; }
    .sota-tryhard-indicator {
        position: absolute;
        /* Subimos para ocupar o lugar onde ficava o cronômetro */
        top: 2.3rem; 
        right: 25px;
        padding: 6px;
        color: var(--interactive-accent);
        /* Garante a pulsação */
        animation: pulse 1.5s infinite;
        z-index: 10;
    }
    .pomodoro-timer-time { font-size: 3rem; text-align: center; margin-top: 4rem; }
    .pomodoro-timer-controls { display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: 1rem; }
    .pomodoro-timer-button { background: none; border: none; box-shadow: none; padding: 5px; border-radius: 4px; color: var(--text-muted); transition: color 0.4s ease-out, transform 0.4s ease-out; }
    .pomodoro-timer-button:hover { color: var(--interactive-accent); opacity: 1; }
    .pomodoro-timer-button.active { color: var(--interactive-accent); }
    @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
    .pomodoro-sota-panel-wrapper { margin: 10px 0; width: 100%; }
    .pomodoro-sota-panel-content { padding: 0 15px; } 
    .pomodoro-sota-panel-content h3 { margin: 10px 0; text-align: center; font-size: var(--font-ui-small); color: var(--text-muted); }
    .pomodoro-sota-button-text { gap: 6px; font-size: var(--font-ui-smaller); }
    .sota-divider { height: 1px; background: linear-gradient(to right, transparent 5%, var(--background-modifier-border) 30%, var(--background-modifier-border) 70%, transparent 95%); margin: 15px 0; border: none; }
    .sota-divider.top-divider { margin-top: 25px; }
    .tasks-wrapper, .recompensas-wrapper { display: flex; flex-direction: column; }
    .focus-section { padding: 0 15px; flex-shrink: 0; }
    .focus-section-header { font-size: 0.8em; font-weight: 600; color: var(--text-muted); text-align: center; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
    .focus-placeholder { font-size: 0.9em; color: var(--text-muted); text-align: center; padding: 10px; margin: 5px 0; height: 50.5px; display: flex; align-items: center; justify-content: center; border: 1px dashed var(--background-modifier-border); border-radius: 6px; box-sizing: border-box; }
    .local-tasks-section { width: 100%; display: flex; flex-direction: column; }
    .local-tasks-section > .sota-divider { flex-shrink: 0; }
    .tasks-unified-header { padding: 10px 15px; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; gap: 10px; }
    .tasks-file-name { font-size: 0.8em; font-weight: 500; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
    .filters { display: flex; gap: 10px; }
    .sota-button { background-color: var(--background-secondary); border: 1px solid var(--background-modifier-border); border-top-color: var(--background-modifier-border-hover); border-radius: 4px; padding: 4px 8px; color: var(--text-muted); font-size: 0.8em; font-weight: 600; transition: all 0.4s ease-out; box-shadow: 0 1px 1px rgba(0,0,0,0.1); }
    .sota-button:hover { color: var(--interactive-accent); border-color: var(--interactive-accent); box-shadow: 0 2px 3px rgba(0,0,0,0.2); }
    .sota-button.active { color: var(--interactive-accent); border-color: var(--interactive-accent); box-shadow: inset 0 1px 2px rgba(0,0,0,0.2); }
    .sota-button.cta { background-color: var(--interactive-accent); color: var(--text-on-accent); border-color: var(--interactive-accent-hover); }
    .sota-button.cta:hover { background-color: var(--interactive-accent-hover); }
    .tasks-list, .recompensas-list { padding: 0 15px; }
    .tasks-list-empty, .recompensas-list-empty { padding: 1rem; text-align: center; color: var(--text-muted); }
    .task-item { display: flex; align-items: center; justify-content: space-between; padding: 10px; margin: 7px 0; border: 1px solid var(--background-modifier-border); border-radius: 6px; cursor: pointer; transition: background-color 0.7s ease-out, box-shadow 0.7s ease-out; position: relative; background-color: transparent; box-shadow: inset 3px 0 0 transparent; }
    .task-item:hover { background-color: var(--background-modifier-hover); }
    .task-item.is-active { background-color: var(--background-secondary); box-shadow: inset 3px 0 0 var(--interactive-accent); }
    .task-item.is-pinned { background-color: var(--background-secondary); background-image: linear-gradient(to right, var(--sota-green-progress) var(--progress-width, 0%), transparent var(--progress-width, 0%)), linear-gradient(to right, rgba(var(--interactive-accent-rgb), 0.15), transparent 80%); box-shadow: inset 3px 0 0 var(--interactive-accent); border-color: var(--interactive-accent); transition-duration: 0.4s; }
    .task-item.is-pinned:hover { background-color: var(--background-modifier-hover); background-image: linear-gradient(to right, var(--sota-green-progress) var(--progress-width, 0%), transparent var(--progress-width, 0%)), linear-gradient(to right, rgba(var(--interactive-accent-rgb), 0.20), transparent 80%); }
    .task-content { display: flex; align-items: center; gap: 7px; flex-grow: 1; overflow: hidden; }
    .task-icon { flex-shrink: 0; color: var(--text-muted); transition: color 0.4s; }
    .task-item .task-icon { background: none !important; box-shadow: none !important; outline: none !important; }
    .task-item .task-icon:hover { color: var(--interactive-accent); background: none !important; box-shadow: none !important; outline: none !important; }
    .task-description { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.9em; flex-shrink: 1; min-width: 0; }
    .task-item.is-completed .task-description { text-decoration: line-through; color: var(--text-muted); }
    .task-item.is-completed .task-icon { color: var(--interactive-accent); }
    .task-item.is-completed .task-icon:hover { color: var(--interactive-accent); }
    .focus-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 5px; margin-left: auto; border-radius: 50%; line-height: 0; transition: all 0.4s ease-out; }
    .focus-btn:hover { background-color: rgba(255, 255, 255, 0.1); color: var(--interactive-accent); }
    .task-item.is-pinned .focus-btn { color: var(--interactive-accent); display: block; }
    .pomodoro-counter { font-size: 0.8em; color: var(--text-muted); background-color: var(--background-modifier-hover); padding: 2px 6px; border-radius: 4px; white-space: nowrap; flex-shrink: 0; }
    .settings-panel-wrapper { width: 100%; }
    .play-pause-button { transform: scale(1.3); transition: transform 0.4s ease-out; }
    .play-pause-button:hover { transform: scale(1.5); color: var(--interactive-accent); }
    :global(.pomodoro-painel-dinamico > .pomodoro-settings-wrapper) { border: none; }
    .recompensas-section { padding: 0 15px; }
    .recompensas-section-header { font-size: 0.8em; font-weight: 600; color: var(--text-muted); text-align: center; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.05em; }
    .recompensa-item { display: flex; flex-direction: column; gap: 8px; padding: 12px; margin: 8px 0; border: 1px solid var(--background-modifier-border); border-radius: 6px; }
    .recompensa-nome { font-size: 0.9em; font-weight: 600; color: var(--text-normal); }
    .recompensa-progresso-container { display: flex; align-items: center; gap: 10px; }
    .recompensa-progresso-texto { font-size: 0.8em; color: var(--text-muted); white-space: nowrap; flex-shrink: 0; }
    .recompensa-progresso-barra { flex-grow: 1; -webkit-appearance: none; appearance: none; height: 8px; border: none; border-radius: 4px; background-color: var(--background-modifier-border); overflow: hidden; }
    .recompensa-progresso-barra::-webkit-progress-value { background-color: var(--interactive-accent); border-radius: 4px; }
    .recompensa-progresso-barra::-moz-progress-bar { background-color: var(--interactive-accent); border-radius: 4px; }
    .recompensa-item .sota-button.cta { flex-shrink: 0; padding: 4px 10px; font-size: 0.8em; }
    .exercicio-header {
    font-size: 0.8em;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 10px 10px 5px 10px;
    margin-top: 15px;
    border-bottom: 1px solid var(--background-modifier-border);
}
.tasks-list .exercicio-header:first-child {
    margin-top: 0;
}
</style>