// SOTA - gravarAudioDiario.js v1.0
// Gravador de Áudio Instantâneo com Waveform e salvamento centralizado.

module.exports = async (params) => {
    const { app, obsidian } = params;
    const { Modal, Notice, moment } = obsidian;

    // --- CONFIGURAÇÕES ---
    const AUDIO_PATH = "99 - BACKEND/Imagens & Videos/Áudios";

    class AudioRecorderModal extends Modal {
        constructor(app) {
            super(app);
            this.recorder = null;
            this.audioChunks = [];
            this.audioBlob = null;
            this.audioUrl = null;
            this.stream = null;
            this.audioContext = null;
            this.analyser = null;
            this.animationFrameId = null;
            this.timerInterval = null;
            this.seconds = 0;
            this.state = 'idle'; // idle, recording, recorded
        }

        onOpen() {
            const { contentEl } = this;
            contentEl.empty();
            contentEl.addClass("sota-audio-modal");
            this.modalEl.style.width = "500px";

            // Estilos
            const style = document.createElement('style');
            style.innerHTML = `
                .sota-audio-modal .modal-content { padding: 0; }
                .sota-audio-header { padding: 20px; text-align: center; font-size: 1.3em; font-weight: 700; border-bottom: 1px solid var(--background-modifier-border); }
                .sota-audio-body { padding: 25px; display: flex; flex-direction: column; align-items: center; gap: 20px; }
                .sota-timer { font-family: var(--font-monospace); font-size: 2em; color: var(--text-normal); }
                
                /* Waveform Canvas */
                .sota-waveform { width: 100%; height: 80px; background: var(--background-primary); border-radius: 8px; }
                
                /* Player (quando gravado) */
                .sota-audio-player { width: 100%; }
                
                /* Botões de Controle */
                .sota-controls { display: flex; justify-content: center; gap: 15px; width: 100%; margin-top: 10px; }
                .sota-control-btn { 
                    padding: 12px 20px; border-radius: 8px; border: 1px solid var(--background-modifier-border);
                    font-weight: 600; cursor: pointer; transition: all 0.2s;
                    background: var(--background-secondary);
                }
                .sota-control-btn.record { color: var(--color-red); border-color: var(--color-red); }
                .sota-control-btn.stop { color: white; background: var(--color-red); }
                .sota-control-btn.save { color: white; background: var(--interactive-accent); border-color: var(--interactive-accent); }
            `;
            contentEl.appendChild(style);

            contentEl.createDiv({ cls: "sota-audio-header", text: "🎙️ Gravador de Áudio" });
            this.bodyEl = contentEl.createDiv({ cls: "sota-audio-body" });

            this.renderUI();
        }

        renderUI() {
            this.bodyEl.empty();
            
            this.timerEl = this.bodyEl.createDiv({ cls: "sota-timer", text: "00:00" });
            this.canvas = this.bodyEl.createEl('canvas', { cls: "sota-waveform" });
            this.canvasCtx = this.canvas.getContext('2d');

            const controls = this.bodyEl.createDiv({ cls: "sota-controls" });

            if (this.state === 'idle') {
                const recordBtn = controls.createEl('button', { cls: 'sota-control-btn record', text: 'Gravar' });
                recordBtn.onclick = () => this.startRecording();
            } else if (this.state === 'recording') {
                const stopBtn = controls.createEl('button', { cls: 'sota-control-btn stop', text: 'Parar' });
                stopBtn.onclick = () => this.stopRecording();
            } else if (this.state === 'recorded') {
                this.timerEl.style.display = 'none';
                this.canvas.style.display = 'none';

                const player = this.bodyEl.createEl('audio', { cls: 'sota-audio-player', attr: { controls: true, src: this.audioUrl } });
                
                const discardBtn = controls.createEl('button', { cls: 'sota-control-btn', text: 'Descartar' });
                discardBtn.onclick = () => this.reset();

                const saveBtn = controls.createEl('button', { cls: 'sota-control-btn save', text: 'Salvar' });
                saveBtn.onclick = () => this.saveAudio();
            }
        }

        async startRecording() {
            try {
                this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                this.recorder = new MediaRecorder(this.stream);

                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.analyser = this.audioContext.createAnalyser();
                const source = this.audioContext.createMediaStreamSource(this.stream);
                source.connect(this.analyser);
                this.analyser.fftSize = 256;
                this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

                this.recorder.ondataavailable = e => this.audioChunks.push(e.data);
                this.recorder.onstop = () => {
                    this.audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                    this.audioUrl = URL.createObjectURL(this.audioBlob);
                    this.state = 'recorded';
                    this.renderUI();
                };

                this.recorder.start();
                this.state = 'recording';
                this.startTimer();
                this.drawWaveform();
                this.renderUI();

            } catch (err) {
                console.error("Erro ao iniciar gravação:", err);
                new Notice("❌ Falha ao acessar o microfone. Verifique as permissões.");
                this.close();
            }
        }

        stopRecording() {
            if (this.recorder && this.recorder.state === 'recording') {
                this.recorder.stop();
                this.stream.getTracks().forEach(track => track.stop()); // Libera o microfone
                cancelAnimationFrame(this.animationFrameId);
                clearInterval(this.timerInterval);
            }
        }
        
        async saveAudio() {
            if (!this.audioBlob) return;
            
            new Notice("💾 Salvando áudio...");
            
            const timestamp = moment().format("YYYYMMDD-HHmmss");
            const newFileName = `${timestamp}-audio.webm`;
            const filePath = `${AUDIO_PATH}/${newFileName}`;

            // Garante que a pasta existe
            if (!await this.app.vault.adapter.exists(AUDIO_PATH)) {
                await this.app.vault.createFolder(AUDIO_PATH);
            }

            const buffer = await this.audioBlob.arrayBuffer();
            const newFile = await this.app.vault.createBinary(filePath, buffer);

            const activeFile = this.app.workspace.getActiveFile();
            if (activeFile) {
                const embedLink = `![[${newFile.path}]]`;
                
                // --- INÍCIO DA LÓGICA DE INSERÇÃO PRECISA ---
                const content = await this.app.vault.read(activeFile);
                const lines = content.split('\n');
                
                // 1. Identificador único do botão que chama este script
                const buttonIdentifier = 'qa.executeChoice("Gravar Audio Diario")';
                
                let buttonBlockEndIndex = -1;
                let inButtonBlock = false;
                
                // 2. Encontra o bloco do botão
                for (let i = 0; i < lines.length; i++) {
                    if (lines[i].includes(buttonIdentifier)) {
                        inButtonBlock = true;
                    }
                    // O final do bloco é o ``` que vem DEPOIS de encontrar o identificador
                    if (inButtonBlock && lines[i].trim() === "```") {
                        buttonBlockEndIndex = i;
                        break;
                    }
                }

                // 3. Insere o link na linha seguinte
                if (buttonBlockEndIndex !== -1) {
                    // Adiciona uma linha em branco antes do link se a linha seguinte não for vazia
                    const lineAfterButton = lines[buttonBlockEndIndex + 1];
                    const prefix = (lineAfterButton && lineAfterButton.trim() !== "") ? "\n" : "";
                    
                    lines.splice(buttonBlockEndIndex + 1, 0, prefix + embedLink);
                    await this.app.vault.modify(activeFile, lines.join('\n'));
                } else {
                    // Fallback: se não encontrar o bloco (improvável), insere onde o cursor está
                    const editor = this.app.workspace.getActiveViewOfType(obsidian.MarkdownView)?.editor;
                    if(editor) {
                        editor.replaceSelection(`\n${embedLink}\n`);
                    } else {
                        await this.app.vault.append(activeFile, `\n${embedLink}`);
                    }
                }
                // --- FIM DA LÓGICA DE INSERÇÃO ---
            }
            
            new Notice(`✅ Áudio salvo: ${newFile.basename}`);
            this.close();
        }

        reset() {
            this.audioChunks = [];
            this.audioBlob = null;
            if (this.audioUrl) URL.revokeObjectURL(this.audioUrl);
            this.seconds = 0;
            this.state = 'idle';
            this.renderUI();
        }

        startTimer() {
            this.timerInterval = setInterval(() => {
                this.seconds++;
                const min = Math.floor(this.seconds / 60).toString().padStart(2, '0');
                const sec = (this.seconds % 60).toString().padStart(2, '0');
                if (this.timerEl) this.timerEl.textContent = `${min}:${sec}`;
            }, 1000);
        }

        drawWaveform() {
            this.animationFrameId = requestAnimationFrame(() => this.drawWaveform());
            if (!this.analyser || !this.canvasCtx) return;

            this.analyser.getByteTimeDomainData(this.dataArray);
            
            const ctx = this.canvasCtx;
            const canvas = this.canvas;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'rgb(var(--interactive-accent-rgb))';
            ctx.beginPath();

            const sliceWidth = canvas.width * 1.0 / this.analyser.frequencyBinCount;
            let x = 0;

            for (let i = 0; i < this.analyser.frequencyBinCount; i++) {
                const v = this.dataArray[i] / 128.0;
                const y = v * canvas.height / 2;

                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);

                x += sliceWidth;
            }
            ctx.lineTo(canvas.width, canvas.height / 2);
            ctx.stroke();
        }

        onClose() {
            this.stopRecording(); // Garante que tudo pare ao fechar
            this.contentEl.empty();
        }
    }

    // Execução
    new AudioRecorderModal(app).open();
};