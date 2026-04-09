// SOTA - Logger.ts v9.0 (Polymorphic Exercise Support)

import { type TimerState, type Mode, type TimerStatus } from './Timer';
import type { SotaContextState } from './stores';
import * as utils from 'utils';
import PomodoroTimerPlugin from 'main';
import { TFile, Notice, moment } from 'obsidian';
import type { TaskItem } from 'Tasks';
import { sotaLog } from './Debug';

// --- INTERFACES ATUALIZADAS ---
export type LogContext = TimerState & {
    task: TaskItem;
    finished: boolean;
    focoAutoavaliado?: number | null;
    paginaAtual?: number | null;
    duracaoSegundos?: number;
    forcedEndTime?: number; 
    ciclo?: number;
    capitulo?: number;
    moduloAtual?: number;
    aulaAtual?: number;
    temporada?: number;
    episodio?: number;
    secao?: number;
    releitura_count?: number;
    missao?: number;
    
    // Campos de Exercício (SOTA v2.0)
    serie?: number | null;
    reps_alvo?: string | number;
    reps_feito?: number | null;
    carga_kg?: number | null;
    esforco_rpe?: number | null;
    qualidade_forma?: number | null;
    notas?: string;
    distancia_km?: number | null;
    ritmo_medio?: string | null;
    bpm_medio?: number | null;
    tipo_resistencia?: string | null;
    duracao_alvo?: number;

    // Campos Tryhard (Fase 3.5)
    feito?: string;
    melhora?: string;
    humor?: number;
    energia?: number;
};

export type TaskLog = Pick<
    TaskItem,
    | 'fileName' | 'path' | 'name' | 'text' | 'description' | 'blockLink'
    | 'actual' | 'expected' | 'status' | 'checked' | 'created' | 'start'
    | 'scheduled' | 'due' | 'done' | 'cancelled' | 'priority' | 'tags'
>;

export type TimerLog = {
    duration: number;
    session: number;
    elapsed: number;
    count: number;
    begin: number;
    end: number;
    mode: Mode;
    status: TimerStatus;
    task: TaskLog;
    finished: boolean;
    focoAutoavaliado?: number | null;
    paginaAtual?: number | null;
    id_sessao?: string | null;
    sotaContext: SotaContextState;
    tipoEvento: string;
    duracaoSegundos?: number;
    ciclo?: number;
    capitulo?: number;
    moduloAtual?: number;
    aulaAtual?: number;
    temporada?: number;
    episodio?: number;
    secao?: number;
    releitura_count?: number;
    missao?: number;
    
    // Campos de Exercício
    serie?: number | null;
    reps_alvo?: string | number;
    reps_feito?: number | null;
    carga_kg?: number | null;
    esforco_rpe?: number | null;
    qualidade_forma?: number | null;
    notas?: string;
    distancia_km?: number | null;
    ritmo_medio?: string | null;
    bpm_medio?: number | null;
    tipo_resistencia?: string | null;

    // Campos Tryhard
    feito?: string;
    melhora?: string;
    humor?: number;
    energia?: number;
};

export default class Logger {
    private plugin: PomodoroTimerPlugin;

    constructor(plugin: PomodoroTimerPlugin) {
        this.plugin = plugin;
    }

    public async log(ctx: LogContext, tipoEvento: string): Promise<void> {
        const logData = this.createLog(ctx, tipoEvento);
        const logText = this.toText(logData);

        if (!logText) {
            sotaLog("Logger", "AVISO: toText retornou uma string vazia. Abortando log.");
            return;
        }

        const { natureza, hubPath } = logData.sotaContext;
        
        // --- SOTA: LÓGICA DE LOG CONTEXTUAL (CORRIGIDA) ---
        if (natureza !== 'generica') {
            try {
                let logBrutoPath: string | null = null;
                
                if (natureza === 'treino') {
                    // --- SOTA: Log Distribuído Hierárquico (Sharding por Grupo/Exercício) ---
                    let exercicioId = 'geral';
                    let grupoId = 'geral'; // Fallback
                    
                    const tags = logData.task?.tags || [];
                    const tagExercicio = tags.find(t => t.startsWith('#exercicio/'));
                    
                    if (tagExercicio) {
                        // Regex Hierárquica: #exercicio / {grupo} / {id}
                        const match = tagExercicio.match(/#exercicio\/([^\/]+)\/([^\/\s]+)/);
                        
                        if (match && match[1] && match[2]) {
                            grupoId = match[1];
                            exercicioId = match[2];
                        } else {
                            // Fallback legado
                            const matchLegacy = tagExercicio.match(/#exercicio\/([^\/\s]+)/);
                            if (matchLegacy) exercicioId = matchLegacy[1];
                        }
                    }

                    // Caminho dinâmico Hierárquico
                    logBrutoPath = `99 - BACKEND/Logs_Metricas/Exercicios/${grupoId}/${exercicioId}/raw_logs.md`;
                } else if (hubPath) {
                    // Rota para Mídias e Projetos (Mantida intacta)
                    const hubFile = this.plugin.app.vault.getAbstractFileByPath(hubPath) as TFile;
                    if (hubFile) {
                        const cache = this.plugin.app.metadataCache.getFileCache(hubFile);
                        const idKey = cache?.frontmatter?.id_midia ? 'id_midia' : 'id_projeto';
                        const idEntidade = cache?.frontmatter?.[idKey];
                        const tipo = cache?.frontmatter?.tipo;
                        let logBrutoFolderName = '';
                        
                        if (tipo) {
                            if (tipo.startsWith('livro')) logBrutoFolderName = 'Livros';
                            else if (tipo.startsWith('curso')) logBrutoFolderName = 'Cursos';
                            else if (tipo.startsWith('artigo')) logBrutoFolderName = 'Artigos';
                            else if (tipo.startsWith('documentacao')) logBrutoFolderName = 'Documentacoes';
                            else if (tipo.startsWith('serie')) logBrutoFolderName = 'Series';
                            else if (tipo === 'documentario_serializado_hub' || tipo === 'documentario_unico_hub') logBrutoFolderName = 'Documentarios';
                            else if (tipo.startsWith('podcast')) logBrutoFolderName = 'Podcasts';
                            else if (tipo.startsWith('video')) logBrutoFolderName = 'Videos';
                            else if (tipo.startsWith('filme')) logBrutoFolderName = 'Filmes';
                            else if (tipo.startsWith('projeto')) logBrutoFolderName = 'Projetos';
                            else if (tipo.startsWith('jogo')) logBrutoFolderName = 'Jogos';
                        }
                        
                        if (logBrutoFolderName && idEntidade) {
                            logBrutoPath = `99 - BACKEND/Logs_Metricas/${logBrutoFolderName}/${idEntidade}/raw_logs.md`;
                        } else {
                             sotaLog("Logger", `AVISO: Não foi possível determinar o caminho do log bruto para o tipo '${tipo}' ou ID não encontrado.`);
                        }
                    }
                }
        
                if (logBrutoPath) {
                    const logBrutoFile = this.plugin.app.vault.getAbstractFileByPath(logBrutoPath) as TFile | null;
                    await utils.appendOrCreate(this.plugin.app, logBrutoFile, logBrutoPath, logText);
                    sotaLog("Logger", `Log Duplo (Contextual): Log de '${tipoEvento}' escrito em ${logBrutoPath}`);
                }

            } catch (error) {
                new Notice("❌ Erro ao salvar log bruto contextual. Verifique o console.");
                console.error("SOTA Pomodoro - Falha ao apendar log (Bruto Contextual):", error);
            }
        }
        
        // --- SOTA: LOG CENTRALIZADO DIÁRIO ---
        try {
            const dataLog = moment(logData.end).format("YYYY-MM-DD");
            const dailyLogPath = `99 - BACKEND/Logs_Metricas/Daily/${dataLog}.md`;
            const dailyLogFile = this.plugin.app.vault.getAbstractFileByPath(dailyLogPath) as TFile | null;
            
            await utils.appendOrCreate(this.plugin.app, dailyLogFile, dailyLogPath, logText);
            sotaLog("Logger", `Log Duplo (Diário): Log de '${tipoEvento}' escrito em ${dailyLogPath}`);
    
        }
        catch (error) {
            new Notice("❌ Erro ao salvar no log diário.");
            console.error("SOTA Pomodoro - Falha no log diário:", error);
        }
    }

    private createLog(ctx: LogContext, tipoEvento: string): TimerLog {
        // LÓGICA SOTA: Se houver um tempo forçado (recuperação retroativa), usamos ele.
        // Caso contrário, usamos o momento atual (comportamento padrão).
        const timestampEnd = ctx.forcedEndTime || new Date().getTime();

        return {
            mode: ctx.mode, status: ctx.status, duration: ctx.duration,
            session: ctx.duration, elapsed: ctx.elapsed, count: ctx.count,
            begin: ctx.startTime!, 
            end: timestampEnd, // ALTERADO: Usa a variável calculada acima
            task: ctx.task,
            finished: ctx.finished, focoAutoavaliado: ctx.focoAutoavaliado,
            paginaAtual: ctx.paginaAtual, id_sessao: ctx.id_sessao, sotaContext: ctx.sotaContext,
            tipoEvento: tipoEvento, duracaoSegundos: ctx.duracaoSegundos, ciclo: ctx.ciclo,
            capitulo: ctx.capitulo, moduloAtual: ctx.moduloAtual, aulaAtual: ctx.aulaAtual,
            temporada: ctx.temporada, episodio: ctx.episodio,
            secao: (ctx as any).secao,
            releitura_count: ctx.releitura_count,
            missao: ctx.missao,
            serie: ctx.serie,
            reps_alvo: ctx.reps_alvo,
            reps_feito: ctx.reps_feito,
            carga_kg: ctx.carga_kg,
            esforco_rpe: ctx.esforco_rpe,
            qualidade_forma: ctx.qualidade_forma,
            notas: ctx.notas,
            distancia_km: ctx.distancia_km,
            ritmo_medio: ctx.ritmo_medio,
            bpm_medio: ctx.bpm_medio,
            tipo_resistencia: ctx.tipo_resistencia,
            feito: (ctx as any).feito,
            melhora: (ctx as any).melhora,
            humor: ctx.humor,
            energia: ctx.energia,
        };
    }

    private toText(log: TimerLog): string {
        if (!log.finished) { return ''; }

        const end = moment(log.end);

        let emoji = '🍅';
        if (log.tipoEvento.includes('pagina') || log.tipoEvento.includes('aula')) emoji = '📖';
        else if (log.sotaContext.natureza === 'treino') emoji = '🏋️‍♂️';
        else if (log.sotaContext.natureza === 'ludica') emoji = '🎮';
        else if (log.mode === 'BREAK') emoji = '☕';

        let metadadosEvento = this.buildMetadadosEvento(log);
        let metadadosContexto = this.buildMetadadosContexto(log);
        let metadadosComuns = this.buildMetadadosComuns(log, end);

        const logFinal = `- ${emoji} ${metadadosEvento}${metadadosContexto} ${metadadosComuns}`;
        
        return logFinal.replace(/\s\s+/g, ' ');
    }

    private buildMetadadosEvento(log: TimerLog): string {
        // --- INÍCIO DA CORREÇÃO DE PRECISÃO DE TEMPO ---
        // Agora, confiamos no 'elapsed' (tempo real de execução) e 'count' (meta de tempo) que vêm do Timer.
        // Não recalculamos a duração a partir de log.end e log.begin.
        
        // Tempo total que o timer rodou, vindo do snapshot do Timer.ts
        const totalDurationSeconds = Math.round(log.elapsed / 1000); 
        
        // Meta de tempo original da sessão (ex: 60 min)
        const baseDurationSeconds = Math.round(log.count / 1000);
        
        // Tempo extra (Overtime)
        const extraDurationSeconds = totalDurationSeconds > baseDurationSeconds ? totalDurationSeconds - baseDurationSeconds : 0;
        
        // Monta a string de log com os valores precisos
        const duracaoSessao = `(duracao_total_sessao_segundos::${totalDurationSeconds}) (duracao_base_segundos::${baseDurationSeconds}) (duracao_extra_segundos::${extraDurationSeconds})`;
        // --- FIM DA CORREÇÃO DE PRECISÃO DE TEMPO ---

        // O resto do código permanece o mesmo, pois não está relacionado ao cálculo de tempo
        const avaliacaoFoco = (log.focoAutoavaliado !== null && log.focoAutoavaliado !== undefined) ? ` (foco::${log.focoAutoavaliado})` : '';

        switch(log.tipoEvento) {
            case 'sessao_inicio':
                return `(sessao_inicio::${log.mode})`;
            case 'pagina_fim':
                return `(pagina_fim::${log.paginaAtual || 'N/A'}) (duracao_segundos::${log.duracaoSegundos || 0})`;
            case 'pagina_inicio':
                let paginaInicio = `(pagina_inicio::${log.paginaAtual || 'N/A'})`;
                if (log.releitura_count && log.releitura_count > 0) {
                    paginaInicio += ` (releitura_count::${log.releitura_count})`;
                }
                return paginaInicio;
            case 'aula_fim':
                return `(aula_fim::${log.aulaAtual || 'N/A'}) (duracao_segundos::${log.duracaoSegundos || 0})`;
            case 'aula_inicio':
                return `(aula_inicio::${log.aulaAtual || 'N/A'})`;
            case 'episodio_fim':
                return `(episodio_fim::${log.episodio || 'N/A'}) (duracao_segundos::${log.duracaoSegundos || 0})`;
            case 'episodio_inicio':
                return `(episodio_inicio::${log.episodio || 'N/A'})`;
            case 'evento::capitulo_fim':
                return `(evento::capitulo_fim)`;
            case 'evento::secao_fim':
                return `(evento::secao_fim)`;
            case 'evento::modulo_fim':
                return `(evento::modulo_fim)`;
            case 'evento::temporada_fim':
                return `(evento::temporada_fim)`;
            case 'sessao_fim':
                if (log.sotaContext.natureza === 'treino') {
                    const match = log.task.tags[0]?.match(/#exercicio\/[^\/]+\/([^\/\s]+)/); // Grupo/ID
                    const exercicioId = match && match[1] ? match[1] : 'desconhecido';
                    
                    let logExercicio = `(sessao_fim::WORK) (duracao_segundos::${log.duracaoSegundos || 0})`;
                    logExercicio += ` (exercicio_id::${exercicioId})`;
                    
                    // Lógica Polimórfica de Campos
                    if (log.distancia_km !== undefined && log.distancia_km !== null) {
                        logExercicio += ` (distancia_km::${log.distancia_km}) (ritmo::"${log.ritmo_medio}")`;
                        if (log.bpm_medio) logExercicio += ` (bpm::${log.bpm_medio})`;
                    } else {
                        // Lógica Padrão Força
                        logExercicio += ` (serie::${log.serie || 'N/A'})`;
                        if (log.reps_alvo) logExercicio += ` (reps_alvo::${log.reps_alvo})`;
                    // Se tiver duracao_alvo (para isométricos), grava
                        if ((log as any).duracao_alvo) logExercicio += ` (duracao_alvo::${(log as any).duracao_alvo})`;
                        logExercicio += ` (reps_feito::${log.reps_feito ?? 0})`;
                        logExercicio += ` (carga_kg::${log.carga_kg ?? 0})`;
                    }

                    if (log.tipo_resistencia) logExercicio += ` (tipo_resistencia::${log.tipo_resistencia})`;
                    
                    logExercicio += (log.esforco_rpe !== null && log.esforco_rpe !== undefined) ? ` (esforco_rpe::${log.esforco_rpe})` : '';
                    logExercicio += (log.qualidade_forma !== null && log.qualidade_forma !== undefined) ? ` (qualidade_forma::${log.qualidade_forma})` : '';
                    logExercicio += log.notas ? ` (notas::"${log.notas.replace(/"/g, "'")}")` : '';
                    
                    return logExercicio;
                }
                // --- ATUALIZAÇÃO SOTA v4.1: Logs Psicofísicos ---
                const avaliacaoFoco = (log.focoAutoavaliado !== null && log.focoAutoavaliado !== undefined) ? ` (foco::${log.focoAutoavaliado})` : '';
                
                // Adiciona Humor e Energia se existirem
                const avaliacaoHumor = log.humor ? ` (humor::${log.humor})` : '';
                const avaliacaoEnergia = log.energia ? ` (energia::${log.energia})` : '';
                
                // Adiciona os novos campos de reflexão se existirem
                const reflexaoFeito = log.feito ? ` (feito::"${log.feito.replace(/"/g, "'")}")` : '';
                const reflexaoMelhora = log.melhora ? ` (melhora::"${log.melhora.replace(/"/g, "'")}")` : '';

                return `(sessao_fim::WORK) ${duracaoSessao}${avaliacaoFoco}${avaliacaoHumor}${avaliacaoEnergia}${reflexaoFeito}${reflexaoMelhora}`;
            case 'sessao_break':
                return `(sessao_fim::BREAK) ${duracaoSessao}`;
            default:
                return `(pomodoro::${log.mode}) ${duracaoSessao}`;
        }
    }

    private buildMetadadosContexto(log: TimerLog): string {
        let contexto = "";
        const { tipo, hubPath, natureza, soberania } = log.sotaContext;

        // DEBUG SOTA
        if (natureza === 'atomica' || tipo?.includes('podcast')) {
            console.log("SOTA Logger Debug - Atomica:", { 
                ciclo: log.ciclo, 
                logObj: log 
            });
        }

        if (soberania) {
            contexto += ` (soberania::${soberania})`;
        }

        if (tipo && hubPath && natureza !== 'treino') {
            contexto += ` (${tipo}:: "[[${hubPath}]]")`;
        }

        const camposContextuais: { [key: string]: string } = {
            ciclo: 'ciclo',
            capitulo: 'capitulo',
            secao: 'secao',
            paginaAtual: 'pagina',
            moduloAtual: 'modulo',
            aulaAtual: 'aula',
            temporada: 'temporada',
            episodio: 'episodio',
            missao: 'missao',
        };

        for (const key in camposContextuais) {
            const valor = (log as any)[key];
            if (valor !== undefined && valor !== null && valor !== "") {
                contexto += ` (${camposContextuais[key]}::${valor})`;
            }
        }
        
        return contexto;
    }

    private buildMetadadosComuns(log: TimerLog, end: moment.Moment): string {
        const nomeTarefa = log.task.description || log.task.name || "Nenhuma tarefa focada";
        const taskLink = log.task.blockLink ? `[[${log.task.path}#^${log.task.blockLink}]]` : (log.task.path ? `[[${log.task.path}]]` : "");
        const taskTags = log.task.tags?.length > 0 ? ` ${log.task.tags.join(" ")}` : "";
        
        return `(id_sessao::${log.id_sessao || 'N/A'}) (log_date::${end.format("YYYY-MM-DD")}) (log_time::${end.format("HH:mm:ss")}) (tarefa_focada::"${nomeTarefa}")${taskLink ? ` (task_link::${taskLink})` : ''}${taskTags}`;
    }
}