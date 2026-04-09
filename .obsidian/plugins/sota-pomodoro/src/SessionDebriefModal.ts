import { App, Modal, Setting, Notice } from 'obsidian';

export interface DebriefData {
    foco: number;
    humor: number;
    energia: number;
}

export class SessionDebriefModal extends Modal {
    private onSubmit: (result: DebriefData | null) => void;
    private decisionMade: boolean = false;
    
    // Estado interno
    private foco: number | null = null;
    private humor: number | null = null; // 3 = Neutro como padrão inicial visual, mas forçamos escolha? Vamos deixar null para exigir input ou 3 padrão.
    private energia: number = 50;

    constructor(app: App, onSubmit: (result: DebriefData | null) => void) {
        super(app);
        this.onSubmit = onSubmit;
        // Definimos padrões iniciais para agilizar (UX: frictionless)
        this.humor = 3; 
        this.energia = 50;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('sota-debrief-modal');

        // --- CSS INLINE (Para garantir isolamento e funcionamento sem arquivos externos) ---
        const style = contentEl.createEl('style');
        style.textContent = `
            .sota-debrief-modal .modal-content {
                display: flex;
                flex-direction: column;
                gap: 15px;
                padding: 10px;
            }
            
            /* --- CORREÇÃO DE ESPAÇAMENTO (RESOLVIDO) --- */
            .sota-section-title {
                display: block; /* Garante que a margem funcione */
                width: 100%;
                font-size: 0.8em;
                font-weight: 700;
                color: var(--text-muted);
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 10px;
                margin-top: 25px; /* Espaço agressivo para desgrudar */
                line-height: 1.5;
            }
            
            /* O primeiro título não precisa de margem topo */
            .sota-section-title:first-of-type {
                margin-top: 0;
            }
            
            /* GRID DE FOCO */
            .sota-focus-grid {
                display: grid;
                grid-template-columns: repeat(11, 1fr);
                gap: 4px;
            }
            .sota-focus-btn {
                aspect-ratio: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 1px solid var(--background-modifier-border);
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.8em;
                font-weight: 600;
                background-color: var(--background-primary);
                transition: all 0.2s;
            }
            .sota-focus-btn:hover { background-color: var(--background-modifier-hover); }
            .sota-focus-btn.active {
                background-color: var(--interactive-accent);
                color: var(--text-on-accent);
                border-color: var(--interactive-accent);
            }

            /* GRID DE HUMOR */
            .sota-humor-grid {
                display: grid;
                grid-template-columns: repeat(5, 1fr);
                gap: 10px;
            }
            .sota-humor-btn {
                background: var(--background-primary);
                border: 1px solid var(--background-modifier-border);
                border-radius: 8px;
                padding: 10px 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s;
            }
            .sota-humor-btn:hover { background: var(--background-modifier-hover); transform: translateY(-2px); }
            .sota-humor-btn.active {
                border-color: var(--interactive-accent);
                background: rgba(var(--interactive-accent-rgb), 0.1);
                box-shadow: 0 0 0 1px var(--interactive-accent);
            }
            .sota-humor-icon { font-size: 1.5em; margin-bottom: 4px; }
            .sota-humor-label { font-size: 0.65em; font-weight: 500; opacity: 0.8; }

            /* --- CORREÇÃO DE ALINHAMENTO DO SLIDER (RESOLVIDO) --- */
            .sota-energy-wrapper {
                display: flex;
                flex-direction: column;
                gap: 5px;
                padding: 5px 15px; /* Pequeno padding lateral para a bolinha não cortar na ponta */
            }
            .sota-energy-header {
                display: flex;
                justify-content: space-between;
                align-items: baseline;
            }
            .sota-energy-val {
                font-size: 1.1em;
                font-weight: 800;
                color: var(--text-normal);
            }

            /* Input Base */
            input[type=range].sota-slider {
                width: 100%;
                -webkit-appearance: none;
                appearance: none;
                background: transparent;
                height: 15px; /* Altura suficiente para conter a bolinha inteira */
                border-radius: 15px;
                outline: none;
                cursor: pointer;
                margin: 0;
                display: block; /* Remove comportamentos inline estranhos */
            }

            /* O Trilho (Barra Colorida) */
            input[type=range].sota-slider::-webkit-slider-runnable-track {
                width: 100%;
                height: 6px;
                cursor: pointer;
                background: transparent; /* Transparente para ver o gradiente do input */
                border-radius: 9px;
                border: none;
                /* Centraliza o trilho verticalmente dentro dos 20px do input */
                transform: translateY(7px); 
            }

            /* A Bolinha (Thumb) */
            input[type=range].sota-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                height: 18px;
                width: 18px;
                border-radius: 50%;
                background: #fff;
                border: 2px solid var(--background-modifier-border);
                cursor: pointer;
                /* Cálculo de alinhamento preciso: */
                /* Remove o transform do track visualmente para posicionar a bolinha */
                margin-top: -7px; 
                box-shadow: 0 1px 3px rgba(0,0,0,0.4);
                transition: transform 0.1s, border-color 0.2s;
                position: relative;
                z-index: 2;
            }

            input[type=range].sota-slider::-webkit-slider-thumb:hover {
                transform: scale(1.1);
                border-color: var(--text-muted);
            }

            .sota-submit-btn {
                width: 100%;
                margin-top: 20px;
                padding: 12px;
                font-weight: bold;
            }
        `;

        contentEl.createEl("h2", { text: "Sessão Finalizada", attr: { style: "text-align: center; margin: 0;" } });

        // --- 1. SEÇÃO DE FOCO (0-10) ---
        const focusSection = contentEl.createDiv();
        focusSection.createDiv({ cls: "sota-section-title", text: "Nível de Foco" });
        const focusGrid = focusSection.createDiv({ cls: "sota-focus-grid" });
        
        const focusButtons: HTMLElement[] = [];
        for (let i = 0; i <= 10; i++) {
            const btn = focusGrid.createDiv({ cls: "sota-focus-btn", text: i.toString() });
            btn.onclick = () => {
                this.foco = i;
                focusButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            };
            focusButtons.push(btn);
        }

        // --- 2. SEÇÃO DE HUMOR (Emojis) ---
        const humorSection = contentEl.createDiv();
        humorSection.createDiv({ cls: "sota-section-title", text: "Humor / Sentimento" });
        const humorGrid = humorSection.createDiv({ cls: "sota-humor-grid" });

        const humores = [
            { val: 1, icon: "😖", label: "Péssimo" },
            { val: 2, icon: "😔", label: "Baixo" },
            { val: 3, icon: "🙂", label: "Normal" },
            { val: 4, icon: "😃", label: "Bem" },
            { val: 5, icon: "🤩", label: "Ótimo" }
        ];

        const humorButtons: HTMLElement[] = [];
        humores.forEach(h => {
            const btn = humorGrid.createDiv({ cls: `sota-humor-btn ${this.humor === h.val ? 'active' : ''}` });
            btn.innerHTML = `<span class="sota-humor-icon">${h.icon}</span><span class="sota-humor-label">${h.label}</span>`;
            btn.onclick = () => {
                this.humor = h.val;
                humorButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            };
            humorButtons.push(btn);
        });

        // --- 3. SEÇÃO DE ENERGIA (Slider) ---
        const energySection = contentEl.createDiv();
        const energyHeader = energySection.createDiv({ cls: "sota-energy-header" });
        energyHeader.createSpan({ cls: "sota-section-title", text: "Nível de Energia Percebida" });
        const energyValDisplay = energyHeader.createSpan({ cls: "sota-energy-val", text: "50%" });
        
        const sliderContainer = energySection.createDiv({ cls: "sota-energy-wrapper" });
        const slider = sliderContainer.createEl("input", { 
            type: "range", 
            cls: "sota-slider",
            attr: { min: "0", max: "100", value: "50", step: "5" }
        });

        // Lógica visual do slider (Cores dinâmicas igual ao seu script)
        const updateSliderVisuals = (val: number) => {
            energyValDisplay.setText(`${val}%`);
            const hue = val * 1.2; // 0 = Vermelho, 100 = Verde (120 hue)
            const color = `hsl(${hue}, 85%, 45%)`;
            energyValDisplay.style.color = color;
            // Hack para pintar o track do slider via JS
            slider.style.background = `linear-gradient(to right, ${color} ${val}%, var(--background-modifier-border) ${val}%)`;
        };
        
        // Inicializa visual
        updateSliderVisuals(50);

        slider.oninput = (e: any) => {
            const val = parseInt(e.target.value);
            this.energia = val;
            updateSliderVisuals(val);
        };

        // --- RODAPÉ ---
        const footer = contentEl.createDiv();
        new Setting(footer)
            .addButton(btn => 
                btn
                    .setButtonText("Registrar Sessão")
                    .setCta()
                    .setClass("sota-submit-btn")
                    .onClick(() => this.submit())
            );
    }

    private submit() {
        if (this.foco === null) {
            new Notice("⚠️ Por favor, avalie seu nível de Foco.");
            return;
        }
        if (this.humor === null) {
            new Notice("⚠️ Por favor, selecione seu Humor.");
            return;
        }

        this.decisionMade = true;
        this.close();
        this.onSubmit({
            foco: this.foco,
            humor: this.humor,
            energia: this.energia
        });
    }

    onClose() {
        this.contentEl.empty();
        if (!this.decisionMade) {
            this.onSubmit(null);
        }
    }
}