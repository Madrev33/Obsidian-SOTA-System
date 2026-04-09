// ARQUIVO: src/stores.ts (v2.3 - com isTryhardMode)

import PomodoroSettings from 'Settings';
import { writable } from 'svelte/store';

// --- TIPOS COMPARTILHADOS CENTRALIZADOS ---
export type Soberania = 'interna' | 'externa';

export interface SotaContextState {
    tipo: string;
    natureza: 'paginada' | 'episodica' | 'atomica' | 'generica' | 'treino' | 'ludica';
    hubPath: string | null;
    soberania?: Soberania;
}

export interface SotaLeituraState {
    titulo: string;
    
    // Unidade Genérica: Pode ser "Capítulo", "Seção", "Módulo", ou "Temporada"
    labelUnidade?: "Capítulo" | "Seção" | "Módulo" | "Temporada"; 
    unidadeAtual?: number;
    
    // Sub-unidade Genérica: Pode ser "Aula" ou "Episódio"
    subUnidadeLabel?: "Aula" | "Episódio";
    subUnidadeAtual?: number;
    
    paginaAtual?: number;
    totalPaginas?: number;
}

// --- STORES ---
export const settings = PomodoroSettings.settings;
export const sotaLeituraStore = writable<SotaLeituraState | null>(null);
export const sotaContextStore = writable<SotaContextState>({ tipo: 'nenhum', natureza: 'generica', hubPath: null, soberania: 'interna' });
export const isStopwatchMode = writable<boolean>(false); // Fase 3
export const isTryhardMode = writable<boolean>(false); // Fase 3

// Sincroniza a configuração 'tryhardMode' com o store 'isTryhardMode'
settings.subscribe(newSettings => {
    if (newSettings.tryhardMode !== undefined) {
        isTryhardMode.set(newSettings.tryhardMode);
    }
});

export default {
    settings,
    sotaLeituraStore,
    sotaContextStore,
    isStopwatchMode,
    isTryhardMode,
};