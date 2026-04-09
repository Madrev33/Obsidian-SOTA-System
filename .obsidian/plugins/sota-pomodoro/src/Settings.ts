// SOTA - Settings.ts v2.0 (Refatorado para Robustez)
import type PomodoroTimerPlugin from 'main';
import { PluginSettingTab, Setting, moment, App } from 'obsidian';
import { writable, type Writable, type Unsubscriber } from 'svelte/store';
import { getTemplater } from 'utils';

// --- INTERFACE DE CONFIGURAÇÃO SIMPLIFICADA ---
export interface Settings {
    workLen: number;
    breakLen: number;
    useStatusBarTimer: boolean;
    notificationSound: boolean;
    customSound: string;
    useSystemNotification: boolean;
    lowFps: boolean;
    tryhardMode: boolean;
    migration_v1_done?: boolean;
}

export default class PomodoroSettings extends PluginSettingTab {
    // --- VALORES PADRÃO E FIXOS (HARDCODED) ---
    // Apenas as configurações expostas na UI são listadas aqui.
    static readonly DEFAULT_SETTINGS: Settings = {
        workLen: 60,
        breakLen: 10,
        useStatusBarTimer: false,
        notificationSound: true,
        customSound: '',
        useSystemNotification: false,
        lowFps: true,
        tryhardMode: false,
    };

    // As configurações de logging agora são constantes internas, não mais configuráveis.
    public readonly logFile: 'DAILY' = 'DAILY';
    public readonly logLevel: 'ALL' = 'ALL';
    public readonly logFormat: 'VERBOSE' = 'VERBOSE';
    public readonly enableTaskTracking: true = true;
    public readonly showTaskProgress: true = true;
    public readonly taskFormat: 'TASKS' = 'TASKS';
    public readonly logPath: string = "99 - BACKEND/Logs/Pomodoros_Log.md"; // Mantido para referência, mas não usado ativamente se logFile é DAILY.

    static settings: Writable<Settings> = writable(PomodoroSettings.DEFAULT_SETTINGS);
    private _settings: Settings;
    private plugin: PomodoroTimerPlugin;
    private unsubscribe: Unsubscriber;

    constructor(plugin: PomodoroTimerPlugin, settings: Settings) {
        super(plugin.app, plugin);
        this.plugin = plugin;
        this._settings = { ...PomodoroSettings.DEFAULT_SETTINGS, ...settings };
        PomodoroSettings.settings.set(this._settings);
        this.unsubscribe = PomodoroSettings.settings.subscribe((newSettings) => {
            this.plugin.saveData(newSettings);
            this._settings = newSettings;
            this.plugin.timer?.setupTimer();
        });
    }

    public getSettings(): Settings {
        return this._settings;
    }

    public updateSettings = (newSettings: Partial<Settings>, refreshUI: boolean = false) => {
        PomodoroSettings.settings.update((settings) => {
            this._settings = { ...settings, ...newSettings };
            if (refreshUI) {
                this.display();
            }
            return this._settings;
        });
    };

    public unload() {
        this.unsubscribe();
    }

    public display(): void {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.createEl('h2', { text: 'Pomodoro Timer Settings' });

        new Setting(containerEl)
            .setName('Enable Status Bar Timer')
            .addToggle((toggle) => {
                toggle.setValue(this._settings.useStatusBarTimer)
                toggle.onChange((value) => {
                    this.updateSettings({ useStatusBarTimer: value });
                });
            });

        new Setting(containerEl)
            .setName('Low Animation FPS')
            .setDesc("If you encounter high CPU usage, you can enable this option to lower the animation FPS to save CPU resources")
            .addToggle((toggle) => {
                toggle.setValue(this._settings.lowFps)
                toggle.onChange((value: boolean) => {
                    this.updateSettings({ lowFps: value });
                });
            });

        new Setting(containerEl).setHeading().setName('Timer');

        new Setting(containerEl)
            .setName('Enable Tryhard Mode')
            .setDesc('In Tryhard mode, the timer runs over and asks for confirmation to stop early.')
            .addToggle((toggle) => {
                toggle.setValue(this._settings.tryhardMode)
                toggle.onChange((value: boolean) => {
                    this.updateSettings({ tryhardMode: value });
                });
            });

        new Setting(containerEl).setHeading().setName('Notification');

        new Setting(containerEl)
            .setName('Use System Notification')
            .addToggle((toggle) => {
                toggle.setValue(this._settings.useSystemNotification)
                toggle.onChange((value) => {
                    this.updateSettings({ useSystemNotification: value });
                });
            });
            
        new Setting(containerEl)
            .setName('Sound Notification')
            .addToggle((toggle) => {
                toggle.setValue(this._settings.notificationSound)
                toggle.onChange((value) => {
                    this.updateSettings({ notificationSound: value }, true); // Refresh UI
                });
            });

        if (this._settings.notificationSound) {
            new Setting(containerEl)
                .setName('Custom Notification Audio')
                .addText((text) => {
                    text.inputEl.style.width = '100%';
                    text.setPlaceholder('path/to/sound.mp3');
                    text.setValue(this._settings.customSound);
                    text.onChange((value) => {
                        this.updateSettings({ customSound: value });
                    });
                })
                .addExtraButton((button) => {
                    button.setIcon('play')
                    button.setTooltip('play')
                    .onClick(() => {
                        this.plugin.timer?.playAudio();
                    });
                });
        }
        
        // As outras seções (Task, Log) foram removidas da UI.

        new Setting(containerEl).addButton((button) => {
            button.setButtonText('Restore Defaults')
            .onClick(() => {
                this.updateSettings(PomodoroSettings.DEFAULT_SETTINGS, true);
            });
        });
    }
}