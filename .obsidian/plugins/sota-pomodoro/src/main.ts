import { Notice, Plugin, TFile } from 'obsidian';
import PomodoroSettings, { type Settings } from 'Settings';
import StatusBar from 'StatusBarComponent.svelte';
import Timer from 'Timer';
import Tasks from 'Tasks';
import TaskTracker from 'TaskTracker';
import { SotaContext } from './SotaContext';
import { SotaSync } from './SotaSync';
import { sotaLeituraStore, sotaContextStore, type SotaLeituraState } from './stores';
import { TimerView, VIEW_TYPE_TIMER } from 'TimerView';
import type { Writable } from 'svelte/store';
import { SessionJournal } from './SessionJournal';
import { TaskInjector } from './TaskInjector'; // Fase 4
import './styles.css';
import { sotaLog } from './Debug'; // Import para logging

export default class PomodoroTimerPlugin extends Plugin {
    settingTab?: PomodoroSettings;
    timer?: Timer;
    tasks?: Tasks;
    tracker?: TaskTracker;
    sotaContext?: SotaContext;
    sotaSync?: SotaSync;
    sessionJournal?: SessionJournal;
    taskInjector?: TaskInjector; // Fase 4
    public sotaLeituraStore: Writable<SotaLeituraState | null> = sotaLeituraStore;

    async onload() {
        const settings = await this.loadData() || {};

        // --- INÍCIO DA LÓGICA DE MIGRAÇÃO ---
        if (!settings.migration_v1_done) {
            await this.runMigration_v1();
            settings.migration_v1_done = true;
            await this.saveData(settings);
        }
        // --- FIM DA LÓGICA DE MIGRAÇÃO ---

        this.settingTab = new PomodoroSettings(this, settings);
        this.addSettingTab(this.settingTab);

        // A ORDEM DE INSTANCIAÇÃO AGORA É IMPORTANTE
        this.tracker = new TaskTracker(this);
        this.sessionJournal = new SessionJournal(this);
        this.timer = new Timer(this);
        this.sotaContext = new SotaContext(this);
        this.sotaSync = new SotaSync(this, this.timer);
        this.tasks = new Tasks(this);
        this.taskInjector = new TaskInjector(this); // Fase 4
        
        // Lógica de recuperação de sessão movida para onLayoutReady
        this.app.workspace.onLayoutReady(async () => {
            // 1. Restaurar UI (tarefa focada)
            if (this.tracker) {
                try {
                    await this.tracker.restaurarEstadoDoJournal();
                } catch (e) {
                    console.error("SOTA: Erro ao restaurar tracker.", e);
                }
            }

            // 2. Verificar Sessão Interrompida (Crash Recovery)
            if (this.sessionJournal) {
                try {
                    await this.sessionJournal.verificarSessaoInterrompida();
                } catch (error) {
                    console.error("SOTA: Falha crítica na recuperação de sessão.", error);
                    new Notice("Erro ao recuperar sessão anterior. Iniciando limpo.");
                    // Em caso de erro fatal na recuperação, forçamos a limpeza para não travar o plugin
                    await this.sessionJournal.finalizarSessao().catch(e => console.error("Erro ao limpar journal corrompido", e));
                }
            }
        });
        
        this.registerView(VIEW_TYPE_TIMER, (leaf) => new TimerView(this, leaf));

        this.addRibbonIcon('timer', 'Toggle timer panel', () => {
            this.activateView();
        });

        const status = this.addStatusBarItem();
        status.className = `${status.className} mod-clickable`;
        new StatusBar({ target: status, props: { store: this.timer } });

        this.addCommand({
            id: 'toggle-timer',
            name: 'Toggle timer',
            callback: () => {
                this.timer?.toggleTimer();
            },
        });
        
        this.addCommand({
            id: 'end-session',
            name: 'End current session',
            callback: () => {
                this.timer?.endCurrentSession();
            }
        });

        this.addCommand({
            id: 'toggle-timer-panel',
            name: 'Toggle timer panel',
            callback: () => {
                this.activateView();
            },
        });

        this.addCommand({
            id: 'reset-timer',
            name: 'Reset timer',
            callback: () => {
                this.timer?.endCurrentSession(); 
                new Notice('Timer session ended and reset.');
            },
        });

        this.addCommand({
            id: 'toggle-mode',
            name: 'Toggle timer mode',
            callback: () => {
                this.timer?.toggleMode((t) => {
                    new Notice(`Timer mode: ${t.mode}`);
                });
            },
        });
    }

    private async runMigration_v1(): Promise<void> {
        const files = this.app.vault.getMarkdownFiles();
        let modifiedFilesCount = 0;
        const keysToRemove = [
            'leitura_pagina_ativa_timestamp_inicio',
            'leitura_sessao_ativa_timestamp_inicio',
            'sessao_ativa_timestamp_inicio'
        ];
        const prefixToRemove = 'leitura_tempo_acumulado_';

        for (const file of files) {
            let modified = false;
            try {
                await this.app.fileManager.processFrontMatter(file, (fm) => {
                    // Remove chaves diretas
                    for (const key of keysToRemove) {
                        if (fm[key]) {
                            delete fm[key];
                            modified = true;
                        }
                    }
                    // Remove chaves com prefixo
                    for (const key in fm) {
                        if (key.startsWith(prefixToRemove)) {
                            delete fm[key];
                            modified = true;
                        }
                    }
                });
                if (modified) {
                    modifiedFilesCount++;
                }
            } catch (e) {
                console.error(`SOTA Pomodoro: Falha ao processar o arquivo ${file.path} durante a migração v1.`, e);
            }
        }

        if (modifiedFilesCount > 0) {
            new Notice(`SOTA Pomodoro: Migração concluída. ${modifiedFilesCount} arquivos foram limpos.`);
        } else {
            new Notice(`SOTA Pomodoro: Migração v1 executada. Nenhum arquivo precisou de limpeza.`);
        }
    }

    getSettings(): Settings {
        return this.settingTab?.getSettings() || PomodoroSettings.DEFAULT_SETTINGS;
    }

    public async updateLeituraState(hubFile: TFile | null) {
        if (!hubFile) {
            sotaLeituraStore.set(null);
            return;
        }
    
        try {
            await this.app.fileManager.processFrontMatter(hubFile, (fm) => {
                const tipo = fm.tipo;
                let newState: Partial<SotaLeituraState> = {
                    titulo: hubFile.basename.replace(/00\. HUB - |01\. HUB - /i, ''),
                };

                if (tipo === 'curso_hub') {
                    newState.labelUnidade = "Módulo";
                    newState.unidadeAtual = fm.modulo_atual || 1;
                    newState.subUnidadeLabel = "Aula";
                    newState.subUnidadeAtual = fm.aula_atual || 1;
                } else if (tipo === 'livro_paginado_hub') {
                    newState.labelUnidade = "Capítulo";
                    newState.unidadeAtual = fm.leitura_capitulo_atual || 1;
                    newState.paginaAtual = fm.leitura_pagina_atual || 1;
                    newState.totalPaginas = fm.total_paginas || 0;
                } else if (tipo === 'artigo_paginado_hub' || tipo === 'documentacao_paginado_hub') {
                    newState.labelUnidade = "Seção";
                    newState.unidadeAtual = fm.leitura_secao_atual || 1;
                    newState.paginaAtual = fm.leitura_pagina_atual || 1;
                    newState.totalPaginas = fm.total_paginas || 0;
                } else if (tipo === 'serie_hub' || tipo === 'documentario_serializado_hub' || tipo === 'podcast_hub') {
                    newState.labelUnidade = "Temporada";
                    newState.unidadeAtual = fm.temporada_atual || 1;
                    newState.subUnidadeLabel = "Episódio";
                    newState.subUnidadeAtual = fm.episodio_atual || 1;
                }
                
                sotaLeituraStore.set(newState as SotaLeituraState);
            });
        } catch (error) {
            console.error("SOTA Pomodoro: Erro ao ler frontmatter do HUB para atualizar o estado da leitura:", error);
            sotaLeituraStore.set(null);
        }
    }

    onunload() {
        this.settingTab?.unload();
        this.timer?.destroy();
        this.tasks?.destroy();
        this.tracker?.destory();
        this.sotaContext?.destroy();
        
        // --- INÍCIO DA MODIFICAÇÃO: LÓGICA DE UNLOAD INTELIGENTE ---
        const timerState = this.timer?.getState();
        if (timerState && (timerState.status === 'RUNNING' || timerState.status === 'OVERTIME')) {
            // Se o timer estiver ativo, NÃO limpamos o journal.
            // Isso preserva o estado para recuperação na próxima inicialização.
            sotaLog("Main", "Unload disparado com timer ativo. Preservando journal para recuperação.");
        } else {
            // Se o timer estiver parado (IDLE), é um fechamento seguro. Limpamos o journal.
            sotaLog("Main", "Unload disparado com timer parado. Limpando journal.");
            this.sessionJournal?.finalizarSessao();
        }
        // --- FIM DA MODIFICAÇÃO ---
    }

    async activateView() {
        let { workspace } = this.app;
        let leaves = workspace.getLeavesOfType(VIEW_TYPE_TIMER);
        if (leaves.length > 0) {
            workspace.detachLeavesOfType(VIEW_TYPE_TIMER);
        } else {
            const leaf = workspace.getRightLeaf(false);
            await leaf.setViewState({ type: VIEW_TYPE_TIMER, active: true });
            workspace.revealLeaf(leaf);
        }
    }
}