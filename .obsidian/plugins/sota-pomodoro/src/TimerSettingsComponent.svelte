<script lang="ts">
    import { settings, isStopwatchMode } from 'stores'
    
    const updateWorkLen = (e: Event) => {
        const target = e.target as HTMLInputElement;
        const value = parseInt(target.value);
        settings.update((s) => {
            if (value >= 1) s.workLen = value;
            target.value = s.workLen.toString();
            return s;
        });
    }

    const updateBreakLen = (e: Event) => {
        const target = e.target as HTMLInputElement;
        const value = parseInt(target.value);
        settings.update((s) => {
            if (value >= 0) s.breakLen = value;
            target.value = s.breakLen.toString(); 
            return s;
        });
    }
</script>

<div class="pomodoro-settings-wrapper">
    <div class="pomodoro-settings-list">
        
        <!-- 1. CRONÔMETRO (Topo) -->
        <div class="pomodoro-settings-item">
            <div class="pomodoro-settings-label">Stopwatch Mode</div>
            <div class="pomodoro-settings-control">
                <!-- Usamos o store isStopwatchMode diretamente -->
                <input
                    type="checkbox"
                    checked={$isStopwatchMode}
                    on:change={() => isStopwatchMode.update(n => !n)}
                />
            </div>
        </div>

        <!-- 2. TRYHARD MODE -->
        <div class="pomodoro-settings-item">
            <div class="pomodoro-settings-label">Tryhard Mode</div>
            <div class="pomodoro-settings-control">
                <input
                    type="checkbox"
                    bind:checked={$settings.tryhardMode}
                />
            </div>
        </div>

        <!-- 3. WORK DURATION -->
        <div class="pomodoro-settings-item">
            <div class="pomodoro-settings-label">Work (min)</div>
            <div class="pomodoro-settings-control">
                <input
                    value={$settings.workLen}
                    on:change={updateWorkLen}
                    min="1"
                    type="number"
                    disabled={$isStopwatchMode} 
                /> <!-- Desabilita se for cronômetro -->
            </div>
        </div>

        <!-- 4. BREAK DURATION -->
        <div class="pomodoro-settings-item">
            <div class="pomodoro-settings-label">Break (min)</div>
            <div class="pomodoro-settings-control">
                <input
                    value={$settings.breakLen}
                    on:change={updateBreakLen}
                    min="0"
                    type="number"
                    disabled={$isStopwatchMode}
                />
            </div>
        </div>

        <!-- 5. NOTIFICATION SOUND (Último) -->
        <div class="pomodoro-settings-item">
            <div class="pomodoro-settings-label">Notification Sound</div>
            <div class="pomodoro-settings-control">
                <input
                    type="checkbox"
                    bind:checked={$settings.notificationSound}
                />
            </div>
        </div>

    </div>
</div>

<style>
    /* O CSS pode permanecer o mesmo, pois ele apenas estiliza os elementos que sobraram. */
    .pomodoro-settings-wrapper,
    .pomodoro-settings-list,
    .pomodoro-settings-item {
        width: 100%;
    }

    .pomodoro-settings-wrapper {
        padding: 0 15px;
    }
    
    .pomodoro-settings-item {
        display: flex;
        font-size: 0.9em;
        align-items: center;
        justify-content: space-between;
        padding: 10px;
        margin: 5px 0;
        border: 1px solid var(--background-modifier-border);
        border-radius: 6px;
        transition: background-color 0.2s ease-out, color 0.2s ease-out;
        color: var(--text-muted);
    }

    .pomodoro-settings-item:hover {
        background-color: var(--background-modifier-hover);
        color: var(--interactive-accent);
    }

    .pomodoro-settings-item input[type='number'] {
        font-size: 0.9em;
        border: none;
        border-radius: 0;
        height: 0.9em;
        text-align: end;
        background: transparent;
        width: 50px;
    }
    
    /* Estilo visual para input desabilitado (quando em modo cronômetro) */
    .pomodoro-settings-item input[type='number']:disabled {
        opacity: 0.3;
        cursor: not-allowed;
    }

    .pomodoro-settings-item input[type='number']:active,
    .pomodoro-settings-item input[type='number']:focus {
        border: none;
        box-shadow: none;
    }
</style>