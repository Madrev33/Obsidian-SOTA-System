// SOTA - SotaSync.ts v12.0 (Task-Driven Context, Quest Engine & Break Logic Fix)

import { Notice, TFile } from 'obsidian';
import type PomodoroTimerPlugin from 'main';
import type { TimerState } from './Timer';
import { get } from 'svelte/store';
import { sotaLeituraStore, sotaContextStore, type SotaContextState } from './stores';
import type { LogContext } from './Logger';
import { DEFAULT_TASK, type TaskItem } from './Tasks';
import type Timer from './Timer';
import { sotaLog } from './Debug';

interface IQuickAddApi {
    suggester(displayItems: string[] | ((value: any) => any), actualItems: any[]): Promise<any>;
    inputPrompt(header: string, placeholder?: string, value?: string): Promise<string>;
    executeChoice(choiceName: string, variables?: {[key: string]: any}): Promise<any>;
}

interface IDataviewApi {
    pages(source: string): any;
    page(path: string): any;
}

export class SotaSync {
    private plugin: PomodoroTimerPlugin;
    private app: PomodoroTimerPlugin['app'];
    private timer: Timer;

    // --- Indexação Otimizada (v12.1) ---
    // Mapa de ID -> Array de Arquivos (Suporta colisão de IDs)
    private hubIndex: Map<string, TFile[]> = new Map();
    private isIndexBuilt: boolean = false;

    constructor(plugin: PomodoroTimerPlugin, timer: Timer) {
        this.plugin = plugin;
        this.app = plugin.app;
        this.timer = timer;
        // --- INICIALIZAÇÃO DO ÍNDICE SOTA (v12.1) ---
        
        // 1. Constrói o índice assim que o Obsidian estiver pronto
        this.plugin.app.workspace.onLayoutReady(() => {
            this.buildHubIndex();
        });

        // 2. OUVINTE: Quando um arquivo é modificado (conteúdo ou frontmatter)
        // Isso cobre criação, edição e colagem de novos arquivos.
        this.plugin.registerEvent(
            this.plugin.app.metadataCache.on('changed', (file) => {
                // Remove referências antigas (caso o ID tenha mudado)
                this.removeFromIndex(file);
                // Re-indexa com os dados novos
                this.indexFile(file);
            })
        );

        // 3. OUVINTE: Quando um arquivo é deletado
        this.plugin.registerEvent(
            this.plugin.app.vault.on('delete', (file) => {
                if (file instanceof TFile) {
                    this.removeFromIndex(file);
                    sotaLog("SotaSync", `Arquivo removido do índice: ${file.path}`);
                }
            })
        );

        // 4. OUVINTE: Quando um arquivo é renomeado
        this.plugin.registerEvent(
            this.plugin.app.vault.on('rename', (file) => {
                if (file instanceof TFile) {
                    // Garante consistência removendo e readicionando
                    this.removeFromIndex(file);
                    this.indexFile(file);
                }
            })
        );
    }

    /**
     * Remove todas as referências de um arquivo específico do índice.
     * Necessário quando um arquivo é deletado ou seus IDs mudam.
     */
    private removeFromIndex(file: TFile): void {
        for (const [id, bucket] of this.hubIndex.entries()) {
            // Filtra o array removendo o arquivo alvo
            const newBucket = bucket.filter(f => f !== file);
            
            // Se houve mudança (o arquivo estava neste bucket)
            if (newBucket.length !== bucket.length) {
                if (newBucket.length === 0) {
                    this.hubIndex.delete(id); // Se o balde ficou vazio, deleta a chave
                } else {
                    this.hubIndex.set(id, newBucket); // Atualiza com o novo array limpo
                }
            }
        }
    }

    // --- MÉTODOS DE INDEXAÇÃO ---

    /**
     * Constrói o índice completo do zero.
     * Deve ser chamado apenas na inicialização ou reconstrução forçada.
     */
    private buildHubIndex(): void {
        const start = Date.now();
        const files = this.app.vault.getMarkdownFiles();
        
        // Limpa índice anterior para evitar lixo
        this.hubIndex.clear();
        
        // Single Pass: Lê todos os arquivos uma única vez
        for (const file of files) {
            this.indexFile(file);
        }
        
        this.isIndexBuilt = true;
        sotaLog("SotaSync", `⚡ Índice de HUBs construído em ${Date.now() - start}ms. Total de IDs indexados: ${this.hubIndex.size}`);
    }

    /**
     * Adiciona um arquivo ao índice baseado nos seus metadados.
     * Suporta múltiplos arquivos com o mesmo ID (Bucket Strategy).
     */
    private indexFile(file: TFile): void {
        const cache = this.app.metadataCache.getFileCache(file);
        if (!cache?.frontmatter) return;

        // Coleta todos os IDs possíveis deste arquivo
        const idsFound: string[] = [];
        if (cache.frontmatter.id_midia) idsFound.push(cache.frontmatter.id_midia);
        if (cache.frontmatter.id_projeto) idsFound.push(cache.frontmatter.id_projeto);
        if (cache.frontmatter.sota_uid) idsFound.push(cache.frontmatter.sota_uid);

        // Remove duplicatas internas (caso id_midia seja igual ao sota_uid no mesmo arquivo)
        const uniqueIds = [...new Set(idsFound)];

        for (const id of uniqueIds) {
            // Se o ID ainda não existe no mapa, cria o bucket (array)
            if (!this.hubIndex.has(id)) {
                this.hubIndex.set(id, []);
            }

            // Recupera o bucket e adiciona o arquivo se ele ainda não estiver lá
            const bucket = this.hubIndex.get(id);
            if (bucket && !bucket.includes(file)) {
                bucket.push(file);
                // sotaLog("SotaSync", `Indexado: [${id}] -> ${file.path}`); // (Verbose: Descomente para debug pesado)
            }
        }
    }

    // --- FUNÇÃO AUXILIAR: Determinar Natureza (Replicada para independência) ---
    private getNaturezaMidia(tipoCompleto: string): SotaContextState['natureza'] {
        if (tipoCompleto === 'sessao_treino') return 'treino';
        if (tipoCompleto.endsWith('_paginado_hub')) return 'paginada';
        
        // Fase 2: Novas naturezas
        if (tipoCompleto === 'live_hub') return 'atomica';
        if (tipoCompleto === 'jogo_hub') return 'ludica';

        // --- CORREÇÃO SOTA: Inclusão de tipos únicos explícitos ---
        if (tipoCompleto.endsWith('_atomico_hub') || 
            tipoCompleto.endsWith('_unico_hub') || // <--- O Fix Crítico
            tipoCompleto === 'filme_hub' || 
            tipoCompleto === 'video_hub') {
            return 'atomica';
        }
        if (tipoCompleto.endsWith('_hub')) return 'episodica'; // Captura curso_hub, serie_hub, etc.
        
        return 'generica';
    }

    // --- LOOKUP OTIMIZADO v12.2 (Com Desempate Cirúrgico) ---
    public findHubFileById(idAlvo: string, tipoBusca: 'midia' | 'projeto', tagContexto: string = ''): TFile | null {
        // 1. Garantia de Inicialização
        if (!this.isIndexBuilt) {
            this.buildHubIndex();
        }

        // 2. Busca Instantânea
        const bucket = this.hubIndex.get(idAlvo);

        // Cenário A: Não encontrado
        if (!bucket || bucket.length === 0) {
            sotaLog("SotaSync", `Lookup: HUB não encontrado no índice para ID: ${idAlvo}`);
            return null;
        }

        // Cenário B: Caminho Feliz (Sem colisão)
        if (bucket.length === 1) {
            return bucket[0];
        }

        // Cenário C: Colisão de IDs - Desempate Cirúrgico
        sotaLog("SotaSync", `⚠️ Conflito de ID para '${idAlvo}'. Arquivos: ${bucket.length}. Iniciando desempate...`);

        // Heurística 1: Match Específico por Subtipo (Livro, Filme, Curso, etc.)
        // Se a tag é #midia/livro/matrix, procuramos "livro" no tipo do arquivo.
        const matchEspecifico = bucket.find(file => {
            const cache = this.app.metadataCache.getFileCache(file);
            const tipoArquivo = (cache?.frontmatter?.tipo || '').toLowerCase();
            
            // Extrai partes da tag para comparar (ex: ['midia', 'livro', 'matrix'])
            const partesTag = tagContexto.toLowerCase().split('/');
            
            // Verifica se alguma parte da tag (ex: 'livro') está contida no tipo do arquivo (ex: 'livro_hub')
            // Ignoramos partes genéricas como 'midia', 'projeto', 'ciclo'
            const partesRelevantes = partesTag.filter(p => 
                !['#midia', '#projeto', 'midia', 'projeto'].includes(p) && !p.startsWith('ciclo_')
            );

            return partesRelevantes.some(parte => tipoArquivo.includes(parte));
        });

        if (matchEspecifico) {
            sotaLog("SotaSync", `✅ Conflito resolvido por subtipo. Usando: ${matchEspecifico.basename}`);
            return matchEspecifico;
        }

        // Heurística 2: Match Genérico (Projeto vs Resto) - Fallback
        const matchGenerico = bucket.find(file => {
            const tipo = (this.app.metadataCache.getFileCache(file)?.frontmatter?.tipo || '').toLowerCase();
            if (tipoBusca === 'projeto') return tipo.includes('projeto');
            return !tipo.includes('projeto');
        });

        if (matchGenerico) {
            sotaLog("SotaSync", `✅ Conflito resolvido por categoria geral. Usando: ${matchGenerico.basename}`);
            return matchGenerico;
        }

        // Fallback Final
        sotaLog("SotaSync", `⚠️ Desempate falhou. Retornando o primeiro: ${bucket[0].basename}`);
        return bucket[0];
    }

    public async sincronizarInicioSessao(timerState: TimerState): Promise<void> {
        sotaLog("SotaSync", "INÍCIO: sincronizarInicioSessao", timerState);
        const tarefaFocada = this.plugin.tracker?.task;
        const isBreak = timerState.mode === 'BREAK'; // Flag para controlar a lógica de BREAK
        
        this.resetarContextoDeMidia(timerState);

        // Caso 0: Nenhuma tarefa ou tarefa sem tags -> Contexto Genérico (Diário)
        if (!tarefaFocada || !tarefaFocada.tags || tarefaFocada.tags.length === 0) {
            sotaLog("SotaSync", "CONTEXTO: Tarefa Genérica (Sem tags). Apenas logando no Diário.");
            timerState.sotaContext = { tipo: 'generico', natureza: 'generica', hubPath: null, soberania: 'interna' };
            
            // BREAK não gera log de início
            if (!isBreak) {
                const logContext = this.buildLogContext(timerState, {});
                await this.timer.logger.log(logContext, 'sessao_inicio');
            }
            return;
        }

        const tagContexto = tarefaFocada.tags.join(' ');
        
        // Regex atualizado para capturar o ID corretamente na estrutura #midia/tipo/ID
        const midiaMatch = tagContexto.match(/#midia\/[\w-]+\/([\w-]+)/); 
        
        // Projeto: #projeto/ID (ID é o grupo 1)
        const projetoMatch = tagContexto.match(/#projeto\/([\w-]+)/);
        
        // --- ALTERAÇÃO AQUI ---
        // Exercicio: #exercicio/grupo/ID (ID é o grupo 1 da segunda parte da regex)
        // A regex procura: #exercicio/ (qualquer coisa exceto barra)/ (ID capturado)
        const exercicioMatch = tagContexto.match(/#exercicio\/[^\/]+\/([^\/\s]+)/);

        // --- FASE 2: LÓGICA TASK-DRIVEN (PRIORIDADE DE TAG) ---
        if (midiaMatch || projetoMatch || exercicioMatch) {
            
            // 1. Determinar ID e Tipo de Busca
            let idAlvo = '';
            let modoBusca: 'midia' | 'projeto' | 'treino' = 'midia';

            if (midiaMatch) {
                idAlvo = midiaMatch[1];
                modoBusca = 'midia';
            } else if (projetoMatch) {
                idAlvo = projetoMatch[1];
                modoBusca = 'projeto';
            } else if (exercicioMatch) {
                idAlvo = exercicioMatch[1];
                modoBusca = 'treino';
            }

            sotaLog("SotaSync", `CONTEXTO: Tag SOTA detectada. Modo: ${modoBusca}, ID: ${idAlvo}`);

            // 2. Construir o Contexto (Task-Driven)
            let novoContexto: SotaContextState;

            if (modoBusca === 'treino') {
                // Lógica de Treino (Cronômetro) - Mantida, mas verificando isBreak
                sotaLog("SotaSync", "Sincronizando Sessão de Treino (Modo Cronômetro)...");
                novoContexto = { tipo: 'sessao_treino', natureza: 'treino', hubPath: null, soberania: 'interna' };
                
                timerState.sotaContext = novoContexto;

                // Se for WORK, reseta cronômetro. Se for BREAK, mantém duração padrão (já configurada no timer)
                if (!isBreak) {
                    timerState.duration = 0;
                    timerState.count = 0;
                    
                    const descansoMatch = tarefaFocada.text.match(/\((\d+)s\)/);
                    const duracaoDescansoSeg = descansoMatch ? parseInt(descansoMatch[1]) : 90;
                    timerState.breakLen = duracaoDescansoSeg / 60;

                    const logContext = this.buildLogContext(timerState, {});
                    await this.timer.logger.log(logContext, 'sessao_inicio');
                    new Notice(`▶️ Foco Iniciado: ${tarefaFocada.description.split('@')[0].trim()}`);
                }
                return;
            }

            // Lógica para Mídia e Projeto (Busca de HUB)
            // Passamos 'tagContexto' para ajudar no desempate específico (Livro vs Filme)
                const hubFile = this.findHubFileById(idAlvo, modoBusca as 'midia' | 'projeto', tagContexto);

            if (hubFile) {
                const cache = this.app.metadataCache.getFileCache(hubFile);
                const tipoHub = cache?.frontmatter?.tipo || 'generico';
                const soberania = cache?.frontmatter?.soberania || 'interna';
                
                novoContexto = {
                    tipo: tipoHub,
                    natureza: this.getNaturezaMidia(tipoHub),
                    hubPath: hubFile.path,
                    soberania: soberania
                };

                sotaLog("SotaSync", "HUB Localizado. Contexto injetado:", novoContexto);
            } else {
                sotaLog("SotaSync", "AVISO: HUB não encontrado para o ID da tag. Usando contexto genérico.");
                if (!isBreak) new Notice(`⚠️ HUB para '${idAlvo}' não encontrado. Logando apenas no Diário.`);
                novoContexto = { tipo: 'generico', natureza: 'generica', hubPath: null, soberania: 'interna' };
            }

            // 3. Injetar Contexto no Timer
            timerState.sotaContext = novoContexto;

            // 4. Executar Lógica Específica por Natureza (Apenas se for WORK)
            const { natureza } = novoContexto;

            if (modoBusca === 'projeto') {
                if (!isBreak) {
                    const logContext = this.buildLogContext(timerState, {});
                    await this.timer.logger.log(logContext, 'sessao_inicio');
                    if (hubFile) new Notice(`▶️ Foco Iniciado: ${hubFile.basename.replace('00. HUB - ', '')}`);
                }
            } 
            else if (hubFile) { // É Mídia e temos o HUB
                if (natureza === 'paginada') {
                    await this._sincronizarMidiaPaginada(timerState, hubFile, tagContexto, isBreak);
                } else if (natureza === 'episodica') {
                    await this._sincronizarMidiaEpisodica(timerState, hubFile, tagContexto, isBreak);
                } else if (natureza === 'atomica') {
                    await this._sincronizarMidiaAtomica(timerState, hubFile, tagContexto, isBreak);
                }
                else if (natureza === 'ludica') {
                    await this._sincronizarMidiaLudica(timerState, hubFile, tagContexto, isBreak);
                }
            } else {
                // Fallback
                if (!isBreak) {
                    const logContext = this.buildLogContext(timerState, {});
                    await this.timer.logger.log(logContext, 'sessao_inicio');
                }
            }

            return;
        }
        
        // Caso de borda: Tarefa tem tags não-estruturais (Inbox/Genérica)
        // LÓGICA SOTA: Ler a soberania da própria task, pois não há HUB para ditar isso.
        const matchSoberania = tarefaFocada.text.match(/#soberania\/(interna|externa)/);
        const soberaniaDetectada = matchSoberania ? matchSoberania[1] : 'interna';

        timerState.sotaContext = { 
            tipo: 'generico', 
            natureza: 'generica', 
            hubPath: null, 
            soberania: soberaniaDetectada as 'interna' | 'externa'
        };
        
        sotaLog("SotaSync", `CONTEXTO: Tarefa Genérica. Soberania detectada: ${soberaniaDetectada}`);
        
        if (!isBreak) {
            const logContext = this.buildLogContext(timerState, {});
            await this.timer.logger.log(logContext, 'sessao_inicio');
        }
    }

    private async _sincronizarMidiaEpisodica(timerState: TimerState, hubFile: TFile, tagContexto: string, isBreak: boolean): Promise<void> {
        const cicloMatch = tagContexto.match(/\/ciclo_(\d+)/);
        const cicloNum = cicloMatch ? parseInt(cicloMatch[1]) : 1;
        const newTimestamp = new Date().toISOString();
        const tipoHub = timerState.sotaContext.tipo;

        if (tipoHub === 'curso_hub') {
            const moduloMatch = tagContexto.match(/\/modulo_(\d+)/);
            const aulaMatch = tagContexto.match(/\/aula_(\d+)/);
            const moduloNum = moduloMatch ? parseInt(moduloMatch[1]) : null;
            const aulaNum = aulaMatch ? parseInt(aulaMatch[1]) : null;

            // Sincroniza Frontmatter apenas se for WORK
            if (!isBreak) {
                await this.app.fileManager.processFrontMatter(hubFile, (fm) => {
                    sotaLog("SotaSync", "Sincronizando HUB (Curso)...", { cicloNum, moduloNum, aulaNum });
                    if (fm.ciclo_de_consumo_atual !== cicloNum) fm.ciclo_de_consumo_atual = cicloNum;
                    if (moduloNum !== null && fm.modulo_atual !== moduloNum) fm.modulo_atual = moduloNum;
                    if (aulaNum !== null && fm.aula_atual !== aulaNum) fm.aula_atual = aulaNum;
                    fm.status = "assistindo"; 
                    fm.sessao_ativa_timestamp_inicio = newTimestamp;
                    this.garantirCicloIniciado(fm, cicloNum, "assistindo");
                });
            }

            // Injeta dados no TimerState (necessário para o log de FIM do Break)
            timerState.ciclo = cicloNum;
            timerState.moduloAtual = moduloNum ?? undefined;
            timerState.aulaAtual = aulaNum ?? undefined;

            if (!isBreak) {
                const logContext = this.buildLogContext(timerState, {});
                await this.timer.logger.log(logContext, 'sessao_inicio');
                if (aulaNum !== null) {
                    await this.timer.logger.log(logContext, 'aula_inicio');
                }
                new Notice(`▶️ Foco: Módulo ${moduloNum || 'N/A'}, Aula ${aulaNum || 'N/A'}`);
            }
        } else if (tipoHub === 'serie_hub' || tipoHub === 'podcast_hub' || tipoHub === 'documentario_serializado_hub') {
            const temporadaMatch = tagContexto.match(/\/temporada_(\d+)/);
            const episodioMatch = tagContexto.match(/\/episodio_(\d+)/);
            const temporadaNum = temporadaMatch ? parseInt(temporadaMatch[1]) : null;
            const episodioNum = episodioMatch ? parseInt(episodioMatch[1]) : null;

            if (!isBreak) {
                await this.app.fileManager.processFrontMatter(hubFile, (fm) => {
                    sotaLog("SotaSync", "Sincronizando HUB (Série/Podcast)...", { cicloNum, temporadaNum, episodioNum });
                    if (fm.ciclo_de_consumo_atual !== cicloNum) fm.ciclo_de_consumo_atual = cicloNum;
                    if (temporadaNum !== null && fm.temporada_atual !== temporadaNum) fm.temporada_atual = temporadaNum;
                    if (episodioNum !== null && fm.episodio_atual !== episodioNum) fm.episodio_atual = episodioNum;
                    fm.status = "assistindo";
                    fm.sessao_ativa_timestamp_inicio = newTimestamp;
                    this.garantirCicloIniciado(fm, cicloNum, "assistindo");
                });
            }

            timerState.ciclo = cicloNum;
            timerState.temporada = temporadaNum ?? undefined;
            timerState.episodio = episodioNum ?? undefined;

            if (!isBreak) {
                const logContext = this.buildLogContext(timerState, {});
                await this.timer.logger.log(logContext, 'sessao_inicio');
                if (episodioNum !== null) {
                    await this.timer.logger.log(logContext, 'episodio_inicio');
                }
                new Notice(`▶️ Foco: Temporada ${temporadaNum || 'N/A'}, Episódio ${episodioNum || 'N/A'}`);
            }
        }
    }

    private async _sincronizarMidiaAtomica(timerState: TimerState, hubFile: TFile, tagContexto: string, isBreak: boolean): Promise<void> {
        let cicloNum = 1;

        // 1. Tentativa via Regex na string de contexto (Prioridade)
        // Aceita /ciclo_1, /Ciclo_1, /ciclo_01
        const regexCiclo = /\/ciclo_(\d+)/i;
        const match = tagContexto.match(regexCiclo);
        
        if (match) {
            cicloNum = parseInt(match[1]);
            sotaLog("SotaSync", `Ciclo detectado via tagContexto: ${cicloNum}`);
        } else {
            // 2. Tentativa via Tags da Tarefa (Fallback)
            const tarefa = this.plugin.tracker?.task;
            if (tarefa && tarefa.tags) {
                const tagCiclo = tarefa.tags.find(t => t.match(regexCiclo));
                if (tagCiclo) {
                    const m = tagCiclo.match(regexCiclo);
                    if (m) cicloNum = parseInt(m[1]);
                    sotaLog("SotaSync", `Ciclo detectado via tarefa.tags: ${cicloNum}`);
                }
            }
        }
        
        const newTimestamp = new Date().toISOString();
        const tipoHub = timerState.sotaContext.tipo;

        if (!isBreak) {
            await this.app.fileManager.processFrontMatter(hubFile, (fm) => {
                if (fm.ciclo_de_consumo_atual !== cicloNum) {
                    fm.ciclo_de_consumo_atual = cicloNum;
                }

                if (tipoHub.includes('artigo') || tipoHub.includes('documentacao')) {
                    fm.leitura_status = "lendo";
                    fm.leitura_sessao_ativa_timestamp_inicio = newTimestamp;
                    this.garantirCicloIniciado(fm, cicloNum, "lendo");
                } else { 
                    fm.consumo_status = "assistindo"; 
                    fm.sessao_ativa_timestamp_inicio = newTimestamp;
                    this.garantirCicloIniciado(fm, cicloNum, "assistindo");
                }
            });
        }

        // --- INJEÇÃO NO TIMER STATE ---
        timerState.ciclo = cicloNum;
        
        if (!isBreak) {
            // Log de início deve refletir o ciclo
            const logContext = this.buildLogContext(timerState, {});
            
            // Força a presença do ciclo no objeto de log caso o buildLogContext não pegue
            // (Embora deva pegar se estiver no timerState)
            if (!logContext.ciclo) logContext.ciclo = cicloNum;

            await this.timer.logger.log(logContext, 'sessao_inicio');
            const nomeLimpo = hubFile.basename.replace(/00\. HUB - |01\. HUB - /g, '');
            new Notice(`▶️ Foco: "${nomeLimpo}" (Ciclo ${cicloNum})`);
        }
    }


    private async _sincronizarMidiaLudica(timerState: TimerState, hubFile: TFile, tagContexto: string, isBreak: boolean): Promise<void> {
        const cicloMatch = tagContexto.match(/\/ciclo_(\d+)/);
        const missaoMatch = tagContexto.match(/\/missao_(\d+)/);
        
        let cicloNum = cicloMatch ? parseInt(cicloMatch[1]) : 1;
        const missaoNum = missaoMatch ? parseInt(missaoMatch[1]) : 1;
        const newTimestamp = new Date().toISOString();

        if (!isBreak) {
            await this.app.fileManager.processFrontMatter(hubFile, (fm) => {
                sotaLog("SotaSync", "Sincronizando HUB (Ludica/Jogo)...", { cicloNum, missaoNum });
                
                // Atualiza contadores
                if (fm.ciclo_de_consumo_atual !== cicloNum) fm.ciclo_de_consumo_atual = cicloNum;
                if (fm.missao_atual !== missaoNum) fm.missao_atual = missaoNum;

                // Atualiza Status de Consumo
                fm.consumo_status = "jogando";
                fm.sessao_ativa_timestamp_inicio = newTimestamp;

                // Lógica de Status Global (para-jogar -> jogando)
                if (fm.status === 'para-jogar') {
                    fm.status = 'jogando';
                    new Notice(`🎮 Status do jogo alterado para 'Jogando'!`);
                }

                // Atualiza status do Ciclo específico
                this.garantirCicloIniciado(fm, cicloNum, "jogando"); // Nota: precisamos garantir que garantirCicloIniciado aceite 'jogando'
            });
        }

        // Injeta no TimerState
        timerState.ciclo = cicloNum;
        timerState.missao = missaoNum;

        if (!isBreak) {
            const logContext = this.buildLogContext(timerState, {});
            await this.timer.logger.log(logContext, 'sessao_inicio');
            new Notice(`🎮 Missão ${missaoNum} iniciada!`);
        }
    }

    private async _sincronizarMidiaPaginada(timerState: TimerState, hubFile: TFile, tagContexto: string, isBreak: boolean): Promise<void> {
        const cicloMatch = tagContexto.match(/\/ciclo_(\d+)/);
        // Agora procura por 'capitulo' OU 'secao'
        const unidadeMatch = tagContexto.match(/\/capitulo_(\d+)|secao_(\d+)/); 
        
        let cicloNum = cicloMatch ? parseInt(cicloMatch[1]) : 1;
        // Usa a chave correta baseada no tipo de mídia do HUB
        const chaveUnidade = timerState.sotaContext.tipo === 'livro_paginado_hub' ? 'leitura_capitulo_atual' : 'leitura_secao_atual';
        let unidadeNum = unidadeMatch ? parseInt(unidadeMatch[1] || unidadeMatch[2]) : 1;
        let paginaAtual = 1;
        
        const newTimestamp = new Date().toISOString();

        if (!isBreak) {
            await this.app.fileManager.processFrontMatter(hubFile, (fm) => {
                sotaLog("SotaSync", "Sincronizando HUB (Paginada)...", { tipo: timerState.sotaContext.tipo });
                cicloNum = fm.ciclo_de_consumo_atual || cicloNum;
                unidadeNum = fm[chaveUnidade] || unidadeNum;
                paginaAtual = fm.leitura_pagina_atual || paginaAtual;

                fm.leitura_status = "lendo";
                fm.leitura_sessao_ativa_timestamp_inicio = newTimestamp;
                this.garantirCicloIniciado(fm, cicloNum, "lendo");
            });
        } else {
            // No BREAK, precisamos ler o estado atual sem modificar o frontmatter para popular o TimerState
            const cache = this.app.metadataCache.getFileCache(hubFile);
            const fm = cache?.frontmatter;
            if (fm) {
                cicloNum = fm.ciclo_de_consumo_atual || cicloNum;
                unidadeNum = fm[chaveUnidade] || unidadeNum;
                paginaAtual = fm.leitura_pagina_atual || paginaAtual;
            }
        }

        timerState.ciclo = cicloNum;
        timerState.paginaAtual = paginaAtual;
        
        if (timerState.sotaContext.tipo === 'livro_paginado_hub') {
            timerState.capitulo = unidadeNum;
        } else {
            (timerState as any).secao = unidadeNum;
        }
        
        if (!isBreak) {
            const logContext = this.buildLogContext(timerState, {});
            await this.timer.logger.log(logContext, 'sessao_inicio');
            await this._iniciarCronometroPagina(hubFile, timerState);
            new Notice(`▶️ Foco iniciado na pág. ${paginaAtual} de "${hubFile.basename.replace('00. HUB - ', '')}"`);
        }
    }

    public async sincronizarAvancarPagina(contexto: SotaContextState): Promise<void> {
        if (!this.timer.getState().startTime) {
            new Notice("⚠️ Inicie uma sessão de foco para registrar o progresso.");
            return;
        }
        if (contexto.natureza !== 'paginada' || !contexto.hubPath) return;
        const hubFile = this.getHubFile(contexto.hubPath);
        if (!hubFile) return;
        const hubCache = this.app.metadataCache.getFileCache(hubFile);
        const paginaAtual = hubCache?.frontmatter?.leitura_pagina_atual || 1;
        await this._sincronizarMudancaDePagina(hubFile, paginaAtual + 1);
        new Notice(`▶️ Página avançada para ${paginaAtual + 1}!`);
    }
    
    public async sincronizarVoltarPagina(contexto: SotaContextState): Promise<void> {
        if (!this.timer.getState().startTime) {
            new Notice("⚠️ Inicie uma sessão de foco para registrar o progresso.");
            return;
        }
        if (contexto.natureza !== 'paginada' || !contexto.hubPath) return;
        const hubFile = this.getHubFile(contexto.hubPath);
        if (!hubFile) return;
        const hubCache = this.app.metadataCache.getFileCache(hubFile);
        const paginaAtual = hubCache?.frontmatter?.leitura_pagina_atual || 1;
        await this._sincronizarMudancaDePagina(hubFile, Math.max(1, paginaAtual - 1));
        new Notice(`▶️ Página retornada para ${Math.max(1, paginaAtual - 1)}!`);
    }

    public async sincronizarMudarFoco(contexto: SotaContextState): Promise<void> {
        if (!this.timer.getState().startTime) {
            new Notice("⚠️ Inicie uma sessão de foco para registrar o progresso.");
            return;
        }
        if (contexto.natureza !== 'paginada' || !contexto.hubPath) return;
        const hubFile = this.getHubFile(contexto.hubPath);
        if (!hubFile) return;

        const qa = this.plugin.app.plugins.plugins.quickadd?.api as IQuickAddApi;
        if (!qa) return;

        const paginaDestinoInput = await qa.inputPrompt("Pular para qual página?");
        const paginaDestino = parseInt(paginaDestinoInput || "");
        if (isNaN(paginaDestino) || paginaDestino <= 0) { new Notice("❌ Número de página inválido."); return; }
        
        const ehLivro = contexto.tipo === 'livro_paginado_hub';
        const nomeUnidade = ehLivro ? 'capítulo' : 'seção';
        const chaveUnidade = ehLivro ? 'capitulo' : 'secao';

        const unidadeDestinoInput = await qa.inputPrompt(`A qual ${nomeUnidade} a página ${paginaDestino} pertence?`);
        const unidadeDestino = parseInt(unidadeDestinoInput || "");
        if (isNaN(unidadeDestino) || unidadeDestino <= 0) { new Notice(`❌ Número de ${nomeUnidade} inválido.`); return; }

        if (ehLivro) {
            await this._sincronizarMudancaDePagina(hubFile, paginaDestino, unidadeDestino);
            new Notice(`↩️ Foco movido para a pág. ${paginaDestino} (Cap. ${unidadeDestino}).`);
        } else {
            // Para artigos, passamos o novo valor da seção como o quarto argumento
            await this._sincronizarMudancaDePagina(hubFile, paginaDestino, undefined, unidadeDestino);
            new Notice(`↩️ Foco movido para a pág. ${paginaDestino} (Seção ${unidadeDestino}).`);
        }
    }

    public async sincronizarFinalizarUnidade(contexto: SotaContextState): Promise<void> {
        if (!this.timer.getState().startTime) {
            new Notice("⚠️ Inicie uma sessão de foco para registrar o progresso.");
            return;
        }
        if (contexto.natureza !== 'paginada' || !contexto.hubPath) return;
        const hubFile = this.getHubFile(contexto.hubPath);
        if (!hubFile) return;
        
        await this._finalizarCronometroPagina(hubFile);
        
        const tipoHub = contexto.tipo;
        const ehLivro = tipoHub === 'livro_paginado_hub';
        const chaveUnidade = ehLivro ? 'leitura_capitulo_atual' : 'leitura_secao_atual';
        const nomeUnidade = ehLivro ? 'Capítulo' : 'Seção';
        const eventoLog = ehLivro ? 'evento::capitulo_fim' : 'evento::secao_fim';
        const chaveLog = ehLivro ? 'capitulo' : 'secao';

        let unidadeFinalizada = 0;
        await this.app.fileManager.processFrontMatter(hubFile, (fm) => {
            unidadeFinalizada = fm[chaveUnidade] || 1;
            fm[chaveUnidade] = unidadeFinalizada + 1;
        });

        const logContext = this.buildLogContext(this.timer.getState(), { [chaveLog]: unidadeFinalizada });
        await this.timer.logger.log(logContext, eventoLog);
        new Notice(`✅ ${nomeUnidade} ${unidadeFinalizada} finalizado!`);
        await this.plugin.updateLeituraState(hubFile);
        this.forceViewRefresh();
    }
    
    public async sincronizarFimSessao(timerState: TimerState & { focoAutoavaliado?: number | null; forcedEndTime?: number }): Promise<void> {
        sotaLog("SotaSync", "sincronizarFimSessao: Iniciada.");
        const sessaoPersistida = await this.plugin.sessionJournal?.lerJournal();
        if (!sessaoPersistida) { new Notice("❌ ERRO: Journal da sessão não encontrado."); return; }
        
        const estadoParaLog: TimerState = { ...timerState, sotaContext: sessaoPersistida.sotaContext };
        
        // --- CORREÇÃO AQUI ---
        // Se não tem HubPath (Tarefa do Inbox/Genérica)
        if (!estadoParaLog.sotaContext.hubPath) {
            const logContext = this.buildLogContext(estadoParaLog, { forcedEndTime: timerState.forcedEndTime });
            
            // 1. Gera o Log
            await this.timer.logger.log(logContext, 'sessao_fim');
            
            // 2. [CORREÇÃO] Incrementa o contador [🍅:: X/Y] antes de sair
            // Antes, o código dava return sem passar por aqui.
            if (estadoParaLog.mode === 'WORK') {
                await this.plugin.tracker?.updateActual();
            }
            
            return;
        }
        // ---------------------
        
        try {
            const hubFile = this.getHubFile(estadoParaLog.sotaContext.hubPath);
            if (!hubFile) return;
            
            if (estadoParaLog.sotaContext.natureza === 'paginada') {
                await this._finalizarCronometroPagina(hubFile);
            }

            let logOverrides: Partial<LogContext> = { 
                focoAutoavaliado: timerState.focoAutoavaliado,
                forcedEndTime: timerState.forcedEndTime 
            };
            
            await this.app.fileManager.processFrontMatter(hubFile, (fm) => {
                const { natureza, tipo } = estadoParaLog.sotaContext;

                if (natureza === 'paginada') {
                    fm.leitura_status = "parado";
                    fm.leitura_sessao_ativa_timestamp_inicio = "";
                    logOverrides.paginaAtual = fm.leitura_pagina_atual;
                    if (tipo === 'livro_paginado_hub') {
                        logOverrides.capitulo = fm.leitura_capitulo_atual;
                    } else if (tipo.includes('artigo') || tipo.includes('documentacao')) {
                        (logOverrides as any).secao = fm.leitura_secao_atual;
                    }
                } else if (natureza === 'atomica') {
                    if (tipo.includes('artigo') || tipo.includes('documentacao')) {
                        fm.leitura_status = "parado";
                        fm.leitura_sessao_ativa_timestamp_inicio = "";
                    } else {
                        fm.consumo_status = "parado";
                        fm.sessao_ativa_timestamp_inicio = "";
                    }
                } else if (natureza === 'episodica') {
                    if (tipo !== 'projeto_hub') {
                        fm.status = "pausado";
                    }
                    fm.sessao_ativa_timestamp_inicio = "";
        
                    if (tipo === 'curso_hub') {
                        logOverrides.moduloAtual = fm.modulo_atual;
                        logOverrides.aulaAtual = fm.aula_atual;
                    } else {
                        logOverrides.temporada = fm.temporada_atual;
                        logOverrides.episodio = fm.episodio_atual;
                    }

                } else if (natureza === 'ludica') {
                    fm.consumo_status = "parado";
                    fm.sessao_ativa_timestamp_inicio = "";
                    logOverrides.missao = fm.missao_atual;
                }
            });

            const logContext = this.buildLogContext(estadoParaLog, logOverrides);
            await this.timer.logger.log(logContext, 'sessao_fim');

            // Atualiza contador para tarefas com Contexto (Isso já existia e funcionava)
            if (estadoParaLog.mode === 'WORK') {
                await this.plugin.tracker?.updateActual();
            }
            
            new Notice("⏹️ Sessão de foco finalizada!");
            await this.plugin.updateLeituraState(hubFile);
            this.forceViewRefresh();
        } catch (error) {
            this.handleError("finalizar a sessão", error);
        }
    }

    public async verificarRecompensas(tarefaConcluida: TaskItem): Promise<void> {
        sotaLog("SotaSync", "Verificando recompensas para a tarefa concluída:", tarefaConcluida);
        
        // --- ETAPA 1: SETUP E BUSCA INICIAL ---
        const dv = this.plugin.app.plugins.plugins["dataview"]?.api as IDataviewApi;
        if (!dv) {
            sotaLog("SotaSync", "API do Dataview não encontrada. Abortando verificação de recompensas.");
            return;
        }

        if (!tarefaConcluida.blockLink) {
            sotaLog("SotaSync", "Tarefa concluída não possui blockLink. Abortando.");
            return;
        }

        // Busca por recompensas PENDENTES que contenham a tarefa recém-concluída como pré-requisito.
        // Usamos a busca robusta com aspas internas que aprendemos.
        const recompensasCandidatas = dv.pages('"99 - BACKEND/Recompensas"')
            .where((r: any) => 
                r.status === 'pendente' && 
                r.tarefas_necessarias?.some((t: any) => t.block_id === tarefaConcluida.blockLink?.replace('^', ''))
            ).values;

        if (recompensasCandidatas.length === 0) {
            sotaLog("SotaSync", "Nenhuma recompensa pendente encontrada para esta tarefa.");
            return;
        }

        sotaLog("SotaSync", `Encontradas ${recompensasCandidatas.length} recompensas candidatas.`, recompensasCandidatas);

        // --- ETAPA 2: VERIFICAÇÃO DE CONCLUSÃO E ATUALIZAÇÃO ---
        for (const recompensa of recompensasCandidatas) {
            let todasConcluidas = true;
            if (!recompensa.tarefas_necessarias || recompensa.tarefas_necessarias.length === 0) {
                todasConcluidas = false;
                continue;
            }

            for (const definicaoTarefa of recompensa.tarefas_necessarias) {
                const blockId = definicaoTarefa.block_id;
                if (!blockId) {
                    todasConcluidas = false;
                    break;
                }
                
                const idParaBusca = `^${blockId}`;
                const tarefa = dv.pages('""').file.lists
                    .where((t: any) => t.task && t.text.includes(idParaBusca))
                    .first();

                // Se a tarefa não for encontrada ou não estiver concluída, o pré-requisito não foi atendido.
                if (!tarefa || !tarefa.completed) {
                    todasConcluidas = false;
                    break;
                }
            }

            // --- ETAPA 3: AÇÃO DE DESBLOQUEIO AUTOMÁTICO ---
            if (todasConcluidas) {
                sotaLog("SotaSync", `Todas as tarefas para a recompensa '${recompensa.file.name}' estão concluídas. Desbloqueando...`);
                const recompensaFile = this.app.vault.getAbstractFileByPath(recompensa.file.path);
                
                if (recompensaFile instanceof TFile) {
                    await this.app.fileManager.processFrontMatter(recompensaFile, (fm) => {
                        fm.status = "desbloqueado";
                        fm.data_desbloqueio = window.moment().format("YYYY-MM-DD");
                    });
                    new Notice(`🎁 Recompensa Desbloqueada: ${recompensa.nome_recompensa}!`, 10000);
                    
                    // Força a atualização de todas as views do Dataview (incluindo a do nosso plugin)
                    this.forceViewRefresh(); 
                }
            }
        }
    }

    private garantirCicloIniciado(fm: any, cicloNum: number, statusAtivo: 'lendo' | 'assistindo' | 'jogando'): void {
        if (fm.ciclos && Array.isArray(fm.ciclos)) {
            const cicloObj = fm.ciclos.find((c: any) => c.ciclo === cicloNum);
            if (cicloObj) {
                if (cicloObj.status !== statusAtivo && cicloObj.status !== 'concluido') {
                    cicloObj.status = statusAtivo;
                }
                if (!cicloObj.data_inicio) {
                    cicloObj.data_inicio = window.moment().format("YYYY-MM-DD");
                    cicloObj.hora_inicio = window.moment().format("HH:mm");
                }
            }
        }
    }
    
    private resetarContextoDeMidia(timerState: TimerState): void {
        delete timerState.ciclo;
        delete timerState.capitulo;
        delete timerState.paginaAtual;
        delete timerState.moduloAtual;
        delete timerState.aulaAtual;
        delete timerState.temporada;
        delete timerState.episodio;
    }

    private async _iniciarCronometroPagina(hubFile: TFile, timerState: TimerState, ehInicioDeSessao: boolean = false): Promise<void> {
        sotaLog("SotaSync", "Iniciando cronômetro de página via Journal...");
        const newTimestamp = new Date().toISOString();
        
        // --- CORREÇÃO SOTA: Gravar contexto da unidade ---
        await this.plugin.sessionJournal?.updateSessao({
            timestampInicioPagina: newTimestamp,
            paginaInicialSessao: timerState.paginaAtual,
            // Salva o capítulo/seção atual para recuperar corretamente no fim
            capituloInicialSessao: timerState.capitulo,
            secaoInicialSessao: (timerState as any).secao
        });
    
        const logContext = this.buildLogContext(timerState, {});
        await this.timer.logger.log(logContext, 'pagina_inicio');
    }

    private async _finalizarCronometroPagina(hubFile: TFile): Promise<void> {
        sotaLog("SotaSync", "Finalizando cronômetro de página via Journal...");
        const journal = await this.plugin.sessionJournal?.lerJournal();
    
        if (!journal || !journal.timestampInicioPagina) {
            return;
        }
        
        const timestampInicio = journal.timestampInicioPagina;
        const duracaoSegundos = Math.round((new Date().getTime() - new Date(timestampInicio).getTime()) / 1000);
        
        // Limpa o journal (incluindo os novos campos)
        await this.plugin.sessionJournal?.updateSessao({
            timestampInicioPagina: undefined,
            paginaInicialSessao: undefined,
            capituloInicialSessao: undefined, // Limpa
            secaoInicialSessao: undefined     // Limpa
        });
    
        if (duracaoSegundos <= 0) return;
    
        const timerState = this.timer.getState();
        
        // --- CORREÇÃO SOTA: Usar contexto preservado no Journal ---
        const logContextOverrides: Partial<LogContext> = {
            paginaAtual: journal.paginaInicialSessao, 
            ciclo: journal.ciclo,
            duracaoSegundos: duracaoSegundos,
            // Recupera o capítulo/seção que foi salvo no INÍCIO da leitura desta página
            capitulo: journal.capituloInicialSessao,
            secao: journal.secaoInicialSessao
        };
        
        // Removemos a lógica antiga condicional que tentava adivinhar do timerState
        // O override acima já garante a consistência.
    
        const logContext = this.buildLogContext(timerState, logContextOverrides);
    
        await this.timer.logger.log(logContext, 'pagina_fim');
    }

    private async _sincronizarMudancaDePagina(hubFile: TFile, novaPagina: number, novoCapitulo?: number, novaSecao?: number): Promise<void> {
        // GUARDA DE SESSÃO REMOVIDA DAQUI
        await this._finalizarCronometroPagina(hubFile);

        await this.app.fileManager.processFrontMatter(hubFile, (fm) => {
            const paginaAntiga = fm.leitura_pagina_atual || 1;
            fm.ultima_pagina_lida = paginaAntiga;

            if (novaPagina > (fm.leitura_maior_pagina_alcancada || 0)) {
                const paginasAvancadas = novaPagina - (fm.leitura_maior_pagina_alcancada || 0);
                fm.paginas_lidas = (fm.paginas_lidas || 0) + paginasAvancadas;
                fm.leitura_maior_pagina_alcancada = novaPagina;
            }

            fm.leitura_pagina_atual = novaPagina;
            if (novoCapitulo) {
                fm.leitura_capitulo_atual = novoCapitulo;
            }
            if (novaSecao) { // <-- ADICIONADO
                fm.leitura_secao_atual = novaSecao;
            }
        });
        
        const newState = this.timer.getState();
        newState.paginaAtual = novaPagina;
        if (novoCapitulo) newState.capitulo = novoCapitulo;
        if (novaSecao) (newState as any).secao = novaSecao;

        await this._iniciarCronometroPagina(hubFile, newState);
        
        await this.plugin.updateLeituraState(hubFile);
        this.forceViewRefresh();
        // A notificação de sucesso foi movida para o método público que chama este.
    }

    private getHubFile(hubPath: string | null): TFile | null {
        if (!hubPath) return null;
        const hubFile = this.app.vault.getAbstractFileByPath(hubPath);
        if (!(hubFile instanceof TFile)) {
            new Notice(`❌ ERRO SOTA Sync: Arquivo HUB em "${hubPath}" não foi encontrado.`);
            return null;
        }
        return hubFile;
    }
    
    private buildLogContext(baseState: TimerState, overrides: Partial<LogContext>): LogContext {
        return { ...baseState, task: this.plugin.tracker?.task || DEFAULT_TASK, finished: true, ...overrides };
    }

    private forceViewRefresh(): void {
        setTimeout(() => { this.app.workspace.trigger("dataview:refresh-views"); }, 200);
    }

    private handleError(action: string, error: any) {
        sotaLog("SotaSync", `ERRO ao ${action}`, error);
        new Notice(`❌ Erro ao ${action}. Verifique o console.`);
    }
}