// SOTA - FeedbackExercicioModal.ts v3.0 (Polymorphic Logic)
// Modal inteligente que adapta a interface de feedback baseada no tipo de exercício (Cardio, Força, Isométrico).

import { App, Modal, Setting, Notice, TFile, moment } from 'obsidian';
import type { TaskItem } from './Tasks';
import type Timer from './Timer';
import { sotaLog } from './Debug';

export class FeedbackExercicioModal extends Modal {
    private timer: Timer;
    private task: TaskItem;
    private tempoSobTensao: number;

    // Metadados do Exercício
    private tipoMetrica: 'reps' | 'tempo' | 'distancia' = 'reps';
    private tipoResistencia: 'carga_externa' | 'peso_corporal' = 'carga_externa';

    // Campos da UI (Dinâmicos)
    private inputCarga!: HTMLInputElement;
    private inputReps!: HTMLInputElement;
    private inputDistancia!: HTMLInputElement;
    private inputTempo!: HTMLInputElement;
    private displayPace!: HTMLElement;
    private notasInput!: HTMLTextAreaElement;

    // Valores do estado
    private carga: number | null = null;
    private reps: number | null = null;
    private distancia: number | null = null;
    private tempo: number | null = null; // Segundos ou Minutos (depende do contexto visual, mas salvo em segundos/minutos padrão)
    
    private rpe: number | null = null;
    private qualidade: number | null = null;
    private notas: string = "";

    private resolvePromise!: (value: boolean) => void;
    public submission: Promise<boolean>;
    private decisionMade = false;

    constructor(app: App, timer: Timer, task: TaskItem, tempoSobTensao: number) {
        super(app);
        this.timer = timer;
        this.task = task;
        this.tempoSobTensao = tempoSobTensao;
        this.submission = new Promise((resolve) => {
            this.resolvePromise = resolve;
        });
        this.modalEl.addClass('sota-feedback-modal');
    }

    async onOpen() {
        this.contentEl.empty();
        this.contentEl.addClass('sota-feedback-modal');
        
        // Limpa o nome da tarefa para o título
        const nomeTarefa = this.task.description.split('@')[0].trim();
        this.titleEl.setText(`Feedback: ${nomeTarefa}`);

        // 1. Descobrir o Tipo do Exercício (Lendo o Arquivo)
        await this.detectarTipoExercicio();

        // 2. Pré-preencher dados (Histórico + Meta da Tarefa + Timer Atual)
        await this.preencherDadosIniciais();

        // 3. Renderizar UI Polimórfica
        if (this.tipoMetrica === 'distancia') {
            this.renderInterfaceCardio();
        } else if (this.tipoMetrica === 'tempo') {
            this.renderInterfaceIsometrico();
        } else {
            this.renderInterfaceForca();
        }

        // 4. Campos Comuns (Qualidade, RPE, Notas)
        this.criarEscalaNumerica("Esforço Percebido (RPE)", 'rpe');
        this.criarEscalaNumerica("Qualidade Técnica", 'qualidade');
        this.criarCampoDeNotas();
        this.criarBotoesDeAcao();
    }

    private async detectingFile(): Promise<TFile | null> {
        // Tenta extrair Grupo e ID da tag hierárquica
        // Tag esperada: #exercicio/grupo_normalizado/id_normalizado/...
        const matchHierarquico = this.task.text.match(/#exercicio\/([^\/]+)\/([^\/\s]+)/); 
        
        if (!matchHierarquico || !matchHierarquico[1] || !matchHierarquico[2]) {
            return null;
        }

        const grupoTag = matchHierarquico[1]; // ex: corpo_inteiro
        const idTag = matchHierarquico[2];    // ex: corrida_5km

        // Caminho raiz dos exercícios (Hardcoded conforme estrutura do SOTA)
        const pathRaiz = "04 - Corpo & Movimento/01 - Exercícios Físicos/01. Manual/Exercícios";
        const rootFolder = this.app.vault.getAbstractFileByPath(pathRaiz);

        if (!rootFolder || !('children' in rootFolder)) {
            console.error("SOTA: Pasta raiz de exercícios não encontrada:", pathRaiz);
            return null;
        }

        // Função auxiliar de normalização para comparação
        const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[-\s&]+/g, '_').replace(/[^\w_]+/g, '');

        // 1. Encontrar a pasta do Grupo Muscular
        // Itera sobre as pastas reais (ex: "Corpo Inteiro") e compara com a tag ("corpo_inteiro")
        let pastaGrupoEncontrada: any = null;
        
        for (const child of (rootFolder as any).children) {
            // Ignora arquivos na raiz, procura apenas pastas
            if (!child.extension && normalize(child.name) === grupoTag) {
                pastaGrupoEncontrada = child;
                break;
            }
        }

        if (!pastaGrupoEncontrada) {
            console.warn(`SOTA: Pasta para o grupo '${grupoTag}' não encontrada em ${pathRaiz}`);
            return null;
        }

        // 2. Encontrar o arquivo do Exercício dentro da pasta do Grupo
        // Itera sobre os arquivos (ex: "Corrida 5km.md") e compara com o ID da tag ("corrida_5km")
        for (const child of pastaGrupoEncontrada.children) {
            if (child.extension === 'md') {
                // Remove extensão para normalizar o nome
                if (normalize(child.basename) === idTag) {
                    return child as TFile;
                }
            }
        }

        console.warn(`SOTA: Arquivo para o exercício '${idTag}' não encontrado na pasta '${pastaGrupoEncontrada.name}'`);
        return null;
    }

    private async detectingLogPath(): Promise<string | null> {
        const matchHierarquico = this.task.text.match(/#exercicio\/([^\/]+)\/([^\/\s]+)/);
        if (matchHierarquico && matchHierarquico[1] && matchHierarquico[2]) {
            return `99 - BACKEND/Logs_Metricas/Exercicios/${matchHierarquico[1]}/${matchHierarquico[2]}/${"raw_logs.md"}`;
        }
        return null;
    }

    private async detectarTipoExercicio() {
        const file = await this.detectingFile();
        if (file) {
            const cache = this.app.metadataCache.getFileCache(file);
            if (cache?.frontmatter) {
                this.tipoMetrica = cache.frontmatter.tipo_metrica || 'reps';
                this.tipoResistencia = cache.frontmatter.tipo_resistencia || 'carga_externa';
            }
        }
    }

    private async preencherDadosIniciais() {
        // --- ETAPA A: Extrair Meta da String da Tarefa ---
        // Padrão: [10kg], [10], [5km], [BW]
        const metaMatch = this.task.text.match(/\[([\d.,]+)/);
        if (metaMatch && metaMatch[1]) {
            // rawValue agora é apenas o número, ex: "10" de "[10kg]"
            const rawValue = metaMatch[1].replace(',', '.');
            const valorNumerico = parseFloat(rawValue);

            if (!isNaN(valorNumerico)) {
                if (this.tipoMetrica === 'distancia') {
                    this.distancia = valorNumerico;
                } else {
                    this.carga = valorNumerico;
                }
            }
        }
        
        // --- ETAPA B: Extrair Repetições da String da Tarefa (para Força/Isométrico) ---
        // Padrão: @ 3x12 ou @ 12 reps ou @ 45s
        if (this.tipoMetrica === 'reps' || this.tipoMetrica === 'tempo') {
            // Regex que captura o número após 'x' ou '@', ignorando a contagem de séries.
            // Suporta "3x12", "@ 12 reps", "@ 45s", "x 12"
            const repsMatch = this.task.text.match(/@\s*(\d+)\s*(reps|s)/i);
            if (repsMatch && repsMatch[1]) {
                const valorReps = parseInt(repsMatch[1]);
                if (this.tipoMetrica === 'tempo') {
                    this.tempo = valorReps; // Para isométricos, reps é tempo
                } else {
                    this.reps = valorReps; // Para força, reps é repetições
                }
            }
        }

        // --- ETAPA C: Dados do Timer (Fallback para Cardio/Isométrico) ---
        // Só preenche se não encontrou valor na tarefa
        if ((this.tipoMetrica === 'distancia' || this.tipoMetrica === 'tempo') && this.tempo === null) {
            if (this.tempoSobTensao > 0) {
                this.tempo = (this.tipoMetrica === 'distancia') 
                    ? parseFloat((this.tempoSobTensao / 60).toFixed(1)) 
                    : this.tempoSobTensao;
            }
        }
        
        // --- ETAPA D: Dados Históricos (Fallback apenas para Carga) ---
        // Só busca no histórico se não encontrou [meta] na tarefa
        if (this.carga === null && (this.tipoMetrica === 'reps' || this.tipoMetrica === 'tempo')) {
            const logPath = await this.detectingLogPath();
            if (logPath && await this.app.vault.adapter.exists(logPath)) {
                const content = await this.app.vault.adapter.read(logPath);
                const logs = content.split('\n').reverse();
                const ultimoLog = logs.find(log => log.includes("(sessao_fim::WORK)"));
                if (ultimoLog) {
                    this.carga = parseFloat(ultimoLog.match(/\(carga_kg::\s*([\d.]+)\)/)?.[1] || '0');
                }
            }
        }
    }

    // --- RENDERIZADORES DE INTERFACE ---

    private renderInterfaceForca() {
        // Carga
        const settingCarga = new Setting(this.contentEl).setName("Carga (kg)");
        
        if (this.tipoResistencia === 'peso_corporal') {
            settingCarga.setDesc("Adicione carga extra se houver (ex: colete)");
            settingCarga.addText(t => {
                this.inputCarga = t.inputEl;
                t.setPlaceholder("0"); // Placeholder se estiver vazio
                t.inputEl.type = 'number';
                // AQUI: Se tiver carga detectada (mesmo que 0 do histórico), preenche
                if (this.carga !== null) t.setValue(String(this.carga));
            });
        } else {
            settingCarga.addText(t => {
                this.inputCarga = t.inputEl;
                t.setPlaceholder("Ex: 20");
                t.inputEl.type = 'number';
                // AQUI: Preenche o valor real para edição
                if (this.carga !== null) t.setValue(String(this.carga));
            });
        }

        // Reps
        new Setting(this.contentEl).setName("Repetições").addText(t => {
            this.inputReps = t.inputEl;
            t.setPlaceholder("Ex: 10");
            t.inputEl.type = 'number';
            // AQUI: Preenche as reps detectadas
            if (this.reps !== null) t.setValue(String(this.reps));
        });
    }

    private renderInterfaceCardio() {
        // Distância
        new Setting(this.contentEl).setName("Distância (km)").addText(t => {
            this.inputDistancia = t.inputEl;
            t.setPlaceholder("Ex: 5");
            t.inputEl.type = 'number';
            // AQUI: Preenche a distância detectada (ex: 5 de [5km])
            if (this.distancia !== null) t.setValue(String(this.distancia));
            t.onChange(() => this.atualizarPace());
        });

        // Tempo
        new Setting(this.contentEl).setName("Tempo (minutos)").addText(t => {
            this.inputTempo = t.inputEl;
            t.setPlaceholder("Ex: 30");
            t.inputEl.type = 'number';
            // AQUI: Preenche o tempo (do timer ou histórico)
            if (this.tempo !== null) t.setValue(String(this.tempo));
            t.onChange(() => this.atualizarPace());
        });

        const paceDiv = this.contentEl.createDiv();
        paceDiv.setAttr("style", "margin-bottom: 15px; text-align: center; color: var(--text-muted); font-size: 0.9em;");
        this.displayPace = paceDiv.createSpan({ text: "Ritmo: -- min/km" });
        this.atualizarPace(); 
    }

    private renderInterfaceIsometrico() {

        // Carga Adicional (Opcional)
        new Setting(this.contentEl).setName("Carga Adicional (kg)").setDesc("Opcional").addText(t => {
            this.inputCarga = t.inputEl;
            t.setPlaceholder("0");
            t.inputEl.type = 'number';
        });
    }

    private atualizarPace() {
        if (!this.inputDistancia || !this.inputTempo) return;
        const dist = parseFloat(this.inputDistancia.value);
        const tempoMin = parseFloat(this.inputTempo.value);

        if (dist > 0 && tempoMin > 0) {
            const paceDec = tempoMin / dist; // Ex: 4.99
            let paceMin = Math.floor(paceDec); // 4
            let paceSec = Math.round((paceDec - paceMin) * 60); // 59.9 -> 60

            // Correção de borda: Se arredondar para 60s, vira +1 minuto
            if (paceSec === 60) {
                paceSec = 0;
                paceMin += 1;
            }

            const paceSecStr = paceSec < 10 ? `0${paceSec}` : `${paceSec}`;
            this.displayPace.setText(`Ritmo Estimado: ${paceMin}:${paceSecStr} /km`);
        } else {
            this.displayPace.setText("Ritmo: -- min/km");
        }
    }

    // --- MÉTODOS COMUNS (Mantidos do Original) ---

    private criarEscalaNumerica(label: string, property: 'rpe' | 'qualidade') {
        const setting = new Setting(this.contentEl).setName(label);
        setting.settingEl.style.display = "block";
        setting.settingEl.style.borderTop = "none";
        setting.controlEl.style.display = "flex";
        setting.controlEl.style.flexWrap = "wrap";
        setting.controlEl.style.gap = "4px";
        setting.controlEl.style.marginTop = "10px";
        setting.controlEl.style.justifyContent = "flex-start";

        const botoes: HTMLElement[] = [];
        for (let i = 0; i <= 10; i++) {
            const btn = setting.controlEl.createDiv();
            btn.setText(i.toString());
            btn.style.width = "32px"; btn.style.height = "32px"; btn.style.display = "flex"; btn.style.alignItems = "center";
            btn.style.justifyContent = "center"; btn.style.border = "1px solid var(--background-modifier-border)"; btn.style.borderRadius = "var(--radius-s)";
            btn.style.cursor = "pointer"; btn.style.fontSize = "0.85em"; btn.style.fontWeight = "600"; btn.style.backgroundColor = "var(--background-secondary)"; btn.style.transition = "all 0.2s ease";

            btn.addEventListener("click", () => {
                this[property] = i;
                botoes.forEach(b => { b.style.backgroundColor = "var(--background-secondary)"; b.style.color = "var(--text-normal)"; b.style.borderColor = "var(--background-modifier-border)"; });
                btn.style.backgroundColor = "var(--interactive-accent)"; btn.style.color = "var(--text-on-accent)"; btn.style.borderColor = "var(--interactive-accent)";
            });
            btn.addEventListener("mouseenter", () => { if (this[property] !== i) btn.style.backgroundColor = "var(--background-modifier-hover)"; });
            btn.addEventListener("mouseleave", () => { if (this[property] !== i) btn.style.backgroundColor = "var(--background-secondary)"; });
            botoes.push(btn);
        }
    }

    private criarCampoDeNotas() {
        const setting = new Setting(this.contentEl).setName("Notas da Série");
        setting.settingEl.style.display = "block"; setting.settingEl.style.borderTop = "none";
        setting.addTextArea(text => {
            this.notasInput = text.inputEl;
            text.setPlaceholder("Observações...");
            text.setValue(this.notas);
            setting.controlEl.style.width = "100%"; setting.controlEl.style.marginTop = "10px";
            this.notasInput.style.width = "100%"; this.notasInput.style.height = "80px"; this.notasInput.style.resize = "vertical";
        });
    }
    
    private criarBotoesDeAcao() {
        const setting = new Setting(this.contentEl);
        setting.addButton(btn => btn.setButtonText("Salvar").setCta().onClick(() => this.submeter()));
        setting.addButton(btn => btn.setButtonText("Pular").onClick(() => { this.decisionMade = true; this.resolvePromise(false); this.close(); }));
    }

    private async submeter() {
        this.decisionMade = true;
        this.notas = this.notasInput.value;

        const dadosLog: any = {
            task: this.task,
            serie: this.extractSerieNumber(),
            esforco_rpe: this.rpe,
            qualidade_forma: this.qualidade,
            notas: this.notas,
            duracaoSegundos: this.tempoSobTensao
        };

        // Extração Condicional baseada no Tipo
        if (this.tipoMetrica === 'distancia') {
            const dist = parseFloat(this.inputDistancia.value);
            const tempoMin = parseFloat(this.inputTempo.value);
            
            if (isNaN(dist)) { new Notice("⚠️ Distância inválida."); return; }
            if (isNaN(tempoMin)) { new Notice("⚠️ Tempo inválido."); return; }

            dadosLog.distancia_km = dist;
            dadosLog.duracao_segundos = Math.round(tempoMin * 60); // Salva em segundos para consistência
            
            // Calcula Pace Formatado (MM:SS)
            const paceDec = tempoMin / dist;
            const paceMin = Math.floor(paceDec);
            const paceSec = Math.round((paceDec - paceMin) * 60);
            dadosLog.ritmo_medio = `${paceMin}:${paceSec < 10 ? '0' : ''}${paceSec}`;

        } else if (this.tipoMetrica === 'tempo') {
            // Isométrico
            const cargaExtra = this.inputCarga ? parseFloat(this.inputCarga.value) : 0;

            // O `duracao_segundos` já está sendo injetado pela correção de Duração Zerada (Timer Snapshot)
            // que fizemos anteriormente, usando this.tempoSobTensao. Não precisamos fazer mais nada.
            
            dadosLog.carga_kg = isNaN(cargaExtra) ? 0 : cargaExtra;
            dadosLog.reps_feito = 1; // Isometria conta como 1 repetição longa

        } else {
            // Força (Padrão)
            const carga = parseFloat(this.inputCarga.value);
            const reps = parseInt(this.inputReps.value);

            if (isNaN(carga) && this.tipoResistencia !== 'peso_corporal') { new Notice("⚠️ Carga inválida."); return; }
            if (isNaN(reps)) { new Notice("⚠️ Reps inválidas."); return; }

            dadosLog.carga_kg = isNaN(carga) ? 0 : carga; // 0 se for BW puro
            dadosLog.reps_feito = reps;
            
            // Se for BW, adicionamos uma flag ou garantimos que carga 0 seja entendida como BW nos dashboards
            // Opcional: dadosLog.is_bw = true;
        }

        const matchAlvo = this.task.text.match(/(?:x|@)\s*(\d+)(s| reps)?/i);
        
        if (matchAlvo) {
            const valor = parseInt(matchAlvo[1]);
            const unidade = matchAlvo[2]; // 's' ou ' reps' ou undefined

            if (this.tipoMetrica === 'tempo' || unidade === 's') {
                // Se for isométrico ou tiver 's', é tempo alvo, não reps
                // Podemos criar um campo novo ou apenas não preencher reps_alvo se não quiser confusão
                // Mas para consistência, talvez reps_alvo deva ser null e duracao_alvo ser preenchido?
                // Por enquanto, vamos evitar jogar "45" em reps_alvo se for tempo.
                (dadosLog as any).duracao_alvo = valor; 
            } else {
                dadosLog.reps_alvo = valor;
            }
        }

        // Tags do Contexto
        const exercicioIdMatch = this.task.text.match(/(#exercicio\/[^\/]+\/[^\/\s]+)/); // Grupo/ID
        if (exercicioIdMatch) {
            (dadosLog as any).tags = [exercicioIdMatch[1]];
        }
        

        // Criação do Log Context via Timer (para manter consistência com o sistema)
        // Mas injetamos nossos dadosLog customizados
        const logContext = this.timer.createLogContext(this.timer.getState(), true, dadosLog);
        
        await this.timer.processLog(logContext, 'sessao_fim');
        
        new Notice("✅ Série registrada!");
        this.resolvePromise(true);
        this.close();
    }

    private extractSerieNumber(): number | null {
        const match = this.task.text.match(/Série (\d+)/i);
        return match ? parseInt(match[1]) : null;
    }

    onClose() {
        if (!this.decisionMade) this.resolvePromise(false);
        this.contentEl.empty();
    }
}