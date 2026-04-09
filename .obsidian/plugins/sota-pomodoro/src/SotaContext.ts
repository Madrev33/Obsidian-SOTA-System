// SOTA - SotaContext.ts v4.1 (Engine de Contexto com Soberania) - CORRIGIDO

import { TFile, App } from 'obsidian';
import type PomodoroTimerPlugin from 'main';
import { sotaContextStore, type SotaContextState, type Soberania } from './stores';
import { sotaLog } from './Debug';

export class SotaContext {
    private plugin: PomodoroTimerPlugin;
    private app: App;

    constructor(plugin: PomodoroTimerPlugin) {
        this.plugin = plugin;
        this.app = plugin.app;

        this.plugin.registerEvent(
            this.app.workspace.on('active-leaf-change', this.detectarContextoAtivo)
        );
        
        this.plugin.app.workspace.onLayoutReady(() => {
            this.detectarContextoAtivo();
        });
    }

    private getNaturezaMidia(tipoCompleto: string): SotaContextState['natureza'] {
        if (tipoCompleto === 'sessao_treino') return 'treino';  
        if (tipoCompleto.endsWith('_paginado_hub')) return 'paginada';
        
        // Fase 2: Novas naturezas
        if (tipoCompleto === 'live_hub') return 'atomica';
        if (tipoCompleto === 'jogo_hub') return 'ludica';

        // --- CORREÇÃO SOTA: Inclusão de tipos únicos explícitos ---
        if (tipoCompleto.endsWith('_atomico_hub') || 
            tipoCompleto.endsWith('_unico_hub') || // <--- ADICIONADO
            tipoCompleto === 'filme_hub' || 
            tipoCompleto === 'video_hub') {
            return 'atomica';
        }
        if (tipoCompleto.endsWith('_hub')) return 'episodica'; // Captura curso_hub, serie_hub, etc.
        
        return 'generica';
    }

    private detectarContextoAtivo = () => {
        const activeFile = this.app.workspace.getActiveFile();
        let newContext: SotaContextState;

        if (!activeFile) {
            newContext = { tipo: 'nenhum', natureza: 'generica', hubPath: null, soberania: 'interna' };
            sotaContextStore.set(newContext);
            this.plugin.timer?.onSotaContextChange(newContext);
            this.plugin.updateLeituraState(null);
            return;
        }
        
        const cache = this.app.metadataCache.getFileCache(activeFile);
        if (!cache?.frontmatter) {
            newContext = { tipo: 'generico', natureza: 'generica', hubPath: null, soberania: 'interna' };
            sotaContextStore.set(newContext);
            this.plugin.timer?.onSotaContextChange(newContext);
            this.plugin.updateLeituraState(null);
            return;
        }

        const fm = cache.frontmatter;

        // --- SOTA: DETECÇÃO DE CONTEXTO DE TREINO (PRIORITÁRIO) ---
        if (fm.tipo === 'sessao_treino') {
            sotaLog("SotaContext", "CONTEXTO DIRETO: Sessão de Treino ativa detectada.");
            newContext = { tipo: 'sessao_treino', natureza: 'treino', hubPath: activeFile.path, soberania: 'interna' };
            sotaContextStore.set(newContext);
            this.plugin.timer?.onSotaContextChange(newContext);
            this.plugin.updateLeituraState(null);
            return;
        }

        const uid = fm.sota_uid || fm.hub_uid;

        if (!uid) {
            newContext = { tipo: 'generico', natureza: 'generica', hubPath: null, soberania: 'interna' };
            sotaContextStore.set(newContext);
            this.plugin.timer?.onSotaContextChange(newContext);
            this.plugin.updateLeituraState(null);
            return;
        }
        
        // --- REFATORAÇÃO SOTA v12.2: Uso do HubIndex (O(1)) ---
        
        // 1. Busca instantânea no índice (Sem Dataview, Sem Timeout)
        const hub = this.plugin.sotaSync?.findHubFileById(uid, 'midia');

        if (!hub) {
            // Caso Órfão
            newContext = { tipo: 'orfao', natureza: 'generica', hubPath: null, soberania: 'interna' };
            sotaLog("SotaContext", `AVISO: UID '${uid}' não encontrado no índice SotaSync.`);
        } else {
            // Caso Encontrado: Ler Cache Nativo
            const hubCache = this.app.metadataCache.getFileCache(hub);
            const tipoCompleto = hubCache?.frontmatter?.tipo;
            const soberania = (hubCache?.frontmatter?.soberania || 'interna') as Soberania;

            if (!tipoCompleto) {
                newContext = { tipo: 'sem_tipo', natureza: 'generica', hubPath: hub.path, soberania: soberania };
                sotaLog("SotaContext", `AVISO: HUB '${hub.path}' não possui o campo 'tipo'.`);
            } else {
                const natureza = this.getNaturezaMidia(tipoCompleto);
                newContext = { tipo: tipoCompleto, natureza: natureza, hubPath: hub.path, soberania: soberania };
            }
        }
        
        // 2. Atualização de Estado (Síncrona)
        sotaContextStore.set(newContext);
        this.plugin.timer?.onSotaContextChange(newContext);
        
        const hubFile = newContext.hubPath ? this.app.vault.getAbstractFileByPath(newContext.hubPath) : null;
        if (hubFile instanceof TFile) {
            this.plugin.updateLeituraState(hubFile);
        } else {
            this.plugin.updateLeituraState(null);
        }
    };
    
    public destroy(): void {}
}
