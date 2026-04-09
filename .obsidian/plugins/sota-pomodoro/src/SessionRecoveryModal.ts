import { App, Modal, Setting, moment } from 'obsidian';
import type { JournalEntry } from './SessionJournal';

// As opções que o Timer vai receber
export type RecoveryOption = 'continuous' | 'stopped' | 'discard';

export class SessionRecoveryModal extends Modal {
    private session: JournalEntry;
    private onSubmit: (result: RecoveryOption) => void;
    private decisionMade: boolean = false;

    constructor(app: App, session: JournalEntry, onSubmit: (result: RecoveryOption) => void) {
        super(app);
        this.session = session;
        this.onSubmit = onSubmit;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('sota-recovery-modal');

        contentEl.createEl("h2", { text: "⚠️ Recuperação de Sessão" });

        const start = moment(this.session.startTime);
        // Se não houver heartbeat (versão antiga ou erro), usa o start como fallback
        const heartbeat = moment(this.session.lastHeartbeat || this.session.startTime);
        const now = moment();

        // Cálculos de tempo
        const durationValid = moment.duration(heartbeat.diff(start)); // Tempo que o timer rodou
        const durationGap = moment.duration(now.diff(heartbeat));     // Tempo com o Obsidian fechado
        const durationTotal = moment.duration(now.diff(start));       // Tempo total (Start -> Agora)

        const container = contentEl.createDiv();
        container.style.border = "1px solid var(--background-modifier-border)";
        container.style.padding = "10px";
        container.style.borderRadius = "6px";
        container.style.marginBottom = "20px";
        container.style.backgroundColor = "var(--background-secondary)";
        
        // Relatório do incidente
        container.createEl("p", { 
            text: `O Obsidian foi fechado inesperadamente durante uma sessão de ${this.session.mode === 'WORK' ? 'Foco 🍅' : 'Pausa ☕'}.`,
            attr: { style: "font-weight: bold; margin-bottom: 10px;" }
        });
        
        const list = container.createEl("ul");
        list.createEl("li", { text: `Início: ${start.format("HH:mm")}` });
        list.createEl("li", { text: `Último registro (Heartbeat): ${heartbeat.format("HH:mm")} (${this.formatDuration(durationValid)} salvos)` });
        list.createEl("li", { text: `Tempo desconectado: ${this.formatDuration(durationGap)}` });

        contentEl.createEl("h3", { text: "O que aconteceu nesse intervalo?" });

        // OPÇÃO A: Continuou trabalhando (Total)
        new Setting(contentEl)
            .setName("Eu continuei trabalhando")
            .setDesc(`Registra o tempo total, incluindo o período desconectado.\nTotal da sessão: ${this.formatDuration(durationTotal)}`)
            .addButton((btn) => 
                btn
                    .setButtonText("Registrar TUDO (Opção A)")
                    .setCta() // Azul/Accent
                    .onClick(() => this.submit('continuous'))
            );

        // OPÇÃO B: Parou no crash (Parcial)
        new Setting(contentEl)
            .setName("Parei quando o app fechou")
            .setDesc(`Registra apenas o tempo até o último sinal de vida.\nTotal da sessão: ${this.formatDuration(durationValid)}`)
            .addButton((btn) => 
                btn
                    .setButtonText("Registrar Parcial (Opção B)")
                    .onClick(() => this.submit('stopped'))
            );

        // OPÇÃO D: Lixo
        new Setting(contentEl)
            .setName("Ignorar sessão")
            .setDesc("Não salvar nenhum log e limpar o estado.")
            .addButton((btn) => 
                btn
                    .setButtonText("Descartar")
                    .setWarning() // Vermelho geralmente
                    .onClick(() => this.submit('discard'))
            );
    }

    private formatDuration(duration: moment.Duration): string {
        const hours = Math.floor(duration.asHours());
        const mins = duration.minutes();
        if (hours > 0) return `${hours}h ${mins}m`;
        return `${mins}m`;
    }

    private submit(option: RecoveryOption) {
        this.decisionMade = true;
        this.close();
        this.onSubmit(option);
    }

    onClose() {
        this.contentEl.empty();
        // Fallback de segurança: Se o usuário fechar o modal (ESC ou clique fora),
        // assumimos a opção mais segura (Stopped) para não perder os dados já gravados,
        // mas também não inventar tempo extra.
        if (!this.decisionMade) {
            this.onSubmit('stopped'); 
        }
    }
}