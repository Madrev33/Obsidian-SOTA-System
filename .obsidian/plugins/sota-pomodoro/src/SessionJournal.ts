// SOTA - SessionJournal.ts v3.0 (Com Heartbeat para Recuperação Robusta)

import { Notice } from 'obsidian';
import type PomodoroTimerPlugin from 'main';
import type { TimerState } from './Timer';
import type { TaskItem } from './Tasks';
import { sotaLog } from './Debug';
import type { SotaContextState } from './stores';

export interface JournalEntry {
    id_sessao: string | null;
    startTime: number | null;
    lastHeartbeat?: number; // NOVO: Carimbo de data/hora do último sinal de vida
    mode: 'WORK' | 'BREAK';
    duration: number;
    count: number;
    ciclo?: number;
    moduloAtual?: number;
    aulaAtual?: number;
    temporada?: number;
    episodio?: number;
    capitulo?: number;
    paginaAtual?: number;
    sotaContext: SotaContextState;
    tarefaFocada: TaskItem;
    pinned: boolean;

    // Campos migrados do frontmatter para o journal (Fase 1)
    paginaInicialSessao?: number;
    capituloInicialSessao?: number;
    secaoInicialSessao?: number;
    timestampInicioPagina?: string;
    tempoAcumuladoPagina?: number;
    soberania?: string;
    natureza?: string;
}

export class SessionJournal {
    private plugin: PomodoroTimerPlugin;
    private journalPath: string;

    constructor(plugin: PomodoroTimerPlugin) {
        this.plugin = plugin;
        this.journalPath = `${this.plugin.manifest.dir}/.sota_journal.json`;
    }

    public async lerJournal(): Promise<JournalEntry | null> {
        const journal = await this.readJournalFile();
        return journal.sessaoAtiva;
    }

    private async readJournalFile(): Promise<{ sessaoAtiva: JournalEntry | null }> {
        try {
            if (await this.plugin.app.vault.adapter.exists(this.journalPath)) {
                const content = await this.plugin.app.vault.adapter.read(this.journalPath);
                if (content) {
                    return JSON.parse(content);
                }
            }
        } catch (error) {
            sotaLog("SessionJournal", "Erro ao ler ou parsear o arquivo de journal. Assumindo como vazio.", error);
        }
        return { sessaoAtiva: null };
    }

    private async writeJournal(data: { sessaoAtiva: JournalEntry | null }): Promise<void> {
        try {
            await this.plugin.app.vault.adapter.write(this.journalPath, JSON.stringify(data, null, 2));
        } catch (error) {
            sotaLog("SessionJournal", "ERRO CRÍTICO ao escrever no arquivo de journal.", error);
            new Notice("❌ Erro grave ao salvar estado da sessão. A recuperação pode falhar.");
        }
    }

    public async iniciarSessao(timerState: TimerState, tarefaFocada: TaskItem): Promise<void> {
        sotaLog("SessionJournal", "Registrando início de sessão no journal...", { id: timerState.id_sessao });
        
        const dadosExistentes = await this.lerJournal();
        const now = new Date().getTime();

        const entry: JournalEntry = {
            id_sessao: timerState.id_sessao,
            startTime: timerState.startTime,
            lastHeartbeat: now, // NOVO: Inicializa com o tempo atual
            mode: timerState.mode,
            duration: timerState.duration,
            count: timerState.count,
            ciclo: timerState.ciclo,
            moduloAtual: timerState.moduloAtual,
            aulaAtual: timerState.aulaAtual,
            temporada: timerState.temporada,
            episodio: timerState.episodio,
            capitulo: timerState.capitulo,
            paginaAtual: timerState.paginaAtual,
            sotaContext: timerState.sotaContext,
            tarefaFocada: tarefaFocada,
            pinned: this.plugin.tracker?.pinned || false,

            natureza: timerState.sotaContext.natureza,

            timestampInicioPagina: dadosExistentes?.timestampInicioPagina,
            paginaInicialSessao: dadosExistentes?.paginaInicialSessao,
            capituloInicialSessao: dadosExistentes?.capituloInicialSessao,
            secaoInicialSessao: dadosExistentes?.secaoInicialSessao, 
        };

        await this.writeJournal({ sessaoAtiva: entry });
    }

    // NOVO: Método dedicado para atualizar apenas o batimento cardíaco (performático)
    public async atualizarHeartbeat(timestamp: number): Promise<void> {
        // Lemos o estado atual para não perder dados parciais de outras operações
        const journal = await this.lerJournal();
        
        if (journal) {
            journal.lastHeartbeat = timestamp;
            // Escrevemos diretamente para evitar overhead de logs desnecessários
            await this.writeJournal({ sessaoAtiva: journal });
        }
    }

    public async updateSessao(updatedFields: Partial<JournalEntry>): Promise<void> {
        sotaLog("SessionJournal", "Atualizando sessão no journal...", updatedFields);
        const journal = await this.lerJournal();
        
        if (journal) {
            const updatedJournal = { ...journal, ...updatedFields };
            await this.writeJournal({ sessaoAtiva: updatedJournal });
        } else {
            sotaLog("SessionJournal", "Criando rascunho de sessão (Staging) para dados de inicialização.");
            const partialJournal = { ...updatedFields } as JournalEntry;
            await this.writeJournal({ sessaoAtiva: partialJournal });
        }
    }

    public async finalizarSessao(): Promise<void> {
        sotaLog("SessionJournal", "Limpando journal de sessão finalizada.");
        await this.writeJournal({ sessaoAtiva: null });
    }

    public async verificarSessaoInterrompida(): Promise<void> {
        sotaLog("SessionJournal", "Verificando se há sessões interrompidas...");
        const sessao = await this.lerJournal();

        // Verificação básica: se existe sessão e ela tem um início
        if (sessao && sessao.startTime) {
            sotaLog("SessionJournal", "Sessão interrompida encontrada! Delegando análise para o Timer.", sessao);
            
            // O Timer agora decidirá se recupera automaticamente ou pede intervenção
            await this.plugin.timer!.recuperarSessaoInterrompida(sessao);
            
            // Nota: O Timer chamará o finalizarSessao() internamente após resolver a pendência
        } else {
            sotaLog("SessionJournal", "Nenhuma sessão interrompida encontrada. Sistema limpo.");
        }
    }
}