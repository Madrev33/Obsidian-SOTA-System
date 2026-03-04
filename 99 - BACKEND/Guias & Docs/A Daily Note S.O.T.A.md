

> [!abstract] A Filosofia: O Cockpit da Vida
> A sua Nota Diária não é um diário passivo onde você apenas escreve "Querido diário...".
> Ela é o seu **Painel de Controle (Cockpit)**. É aqui que você pilota o seu dia.
> Ela foi desenhada para fornecer feedback imediato (Bio-Ritmo, Sono, Performance) e reduzir a fricção entre a *intenção* e a *ação*.
> Tudo o que você faz no sistema (Projetos, Estudos, Treinos) converge para cá.

Este guia disseca cada seção da sua Nota Diária para que você extraia o máximo de performance.

---

## 1. O Cabeçalho de Inteligência

Assim que você abre o dia, o sistema te situa no tempo e no espaço.

### 📊 Revisão de Ontem
*   **O que é:** O seu desempenho de ontem.
*   **Para que serve:** Ajuste de rota imediato. Se você vê que dormiu mal ontem ou teve pouco foco, sabe que hoje precisa compensar ou pegar leve.
*   **Métricas:** Mostra deltas de XP, Tempo de Foco, Pausa e Qualidade do Sono.

### 🚀 Aprimoramentos Pendentes
*   **O que é:** Uma lista das melhorias que você identificou anteriormente e *ainda não implementou*.
*   **Fluxo:** Quando você usa o comando `Registrar Aprimoramento` (durante uma revisão semanal, por exemplo ou na sessão "📝 Resumo do Dia & Reflexões" na Nota Diária), a tarefa vem para cá e fica te "assombrando" até ser feita. É o motor da melhoria contínua.

---

## 2. Painel de Ação (O "Agora")


### 📥 Inbox / Foco do Dia
*   **Espaço Livre:** Use esta área para criar as tasks que vc tem que fazer hoje e não envolve nenhum projeto ou estudo "Ir ao mercado" "Comprar coisa tal" 
*   **Criando a Task:** Vc pode criar a task usando o Plugin Pomodoro clicando no botão de Criar Task 

---

## 3. Rastreamento Fisiológico (Biofeedback)

Você não é uma máquina; é um sistema biológico. O S.O.T.A. rastreia sua "bateria".

### 💤 Registro ao Acordar
Use os sliders e botões visuais (sem digitar nada!) para registrar:
*   **Horários:** Que horas foi deitar e acordar (calcula a duração automaticamente).
*   **Qualidade:** Subjetiva (1-10) e Interrupções (Sim/Não).
*   **Impacto:** O sistema cruzará esses dados com sua produtividade. Você descobrirá coisas como: *"Quando durmo menos de 7h, meu foco cai 40%"*.

### ⏰ Registros Periódicos (Check-ins)
Ao longo do dia (Madrugada, Manhã, Tarde, Noite), faça check-ins rápidos do seu estado:

*   **O que aconteceu:** Um campo de texto breve para contexto (ex: "Reunião estressante", "Almoço pesado").
*   *Por que fazer isso?* Para identificar seus **Picos de Performance**. Se você sempre tem energia baixa às 14h, pare de agendar trabalho difícil nesse horário.

---

## 4. Rotina e Hábitos

### ✅ Hábitos do Dia
Esqueça os habit trackers de papel.
*   **Interativo:** Clique nos botões para marcar como feito.
*   **Tipos:** Suporta hábitos **Binários** (Feito/Não Feito) e **Contadores** (ex: 3/5 copos de água).
*   **Feedback Visual:** Barras de progresso e cores (Verde = Meta Batida) mostram sua consistência em tempo real.
*   **Log Duplo:** Ao marcar um hábito aqui, ele salva no dia *E* no histórico do hábito (para gerar gráficos de longo prazo).

---

## 5. Resumo e Reflexão (O Fechamento)

### 📝 Resumo do Dia
Antes de encerrar, preencha:
*   **O que fez hoje:** Uma linha de resumo.
*   **Para amanhã:** A única coisa que *precisa* acontecer amanhã.
*   **Feedback Loop:** O que foi positivo (Wins) e o que foi negativo (Erros).

### 📜 Resumo de Atividades (Automático)
Você não precisa listar o que fez; o sistema sabe. Esta seção varre seus logs e gera tabelas automáticas:
*   **Projetos Focados:** Quanto tempo em cada projeto.
*   **Mídias Consumidas:** O que você leu/assistiu.
*   **Exercícios:** O que você treinou.

### 📊 Resumo de Performance & Stats
*   **O Botão Mágico:** Clique em **"🔄 Processar & Finalizar Dia"**.
*   **O que acontece:** O script `processarDia.js` roda. Ele pega todos os seus logs, calcula o XP (baseado na dificuldade das tarefas + tempo de foco + hábitos), verifica se você subiu de nível e gera o relatório final "congelado".
*   **O HUD:** Um painel estilo "Video Game" aparece mostrando seus atributos (Gênio, Saúde, Sono) e estatísticas finais.


### Breakdown XP

#### Para que serve?
Este é o painel central de **gamificação e diagnóstico** do seu dia. Ele não apenas mostra quanto você evoluiu (XP Total), mas *como* e *onde* você investiu sua energia. Ele serve para responder rapidamente: "Meu dia foi produtivo ou ocupado?", "Qual área da minha vida (Pilar) recebeu mais atenção?" e "O que impulsionou meus resultados hoje?".

#### Como funciona?
Ao clicar em "Processar & Finalizar Dia", o sistema varre todos os logs gerados (sessões de foco, tarefas concluídas, hábitos marcados) e calcula a pontuação baseada na sua matriz de XP. O script então lê esses dados processados e gera uma visualização hierárquica:

- **XP Total & Pilar Dominante:** O número grande no topo representa a soma de todo o seu esforço. O "Pilar Dominante" indica qual área (Intelecto, Vitalidade ou Espírito) teve a maior pontuação.
- **Distribuição por Pilares:** Barras de progresso que mostram o equilíbrio do seu dia.
    - **Intelecto (Azul):** Foco em trabalho, estudos e aprendizado.
    - **Vitalidade (Verde):** Treinos, nutrição e sono.
    - **Espírito (Amarelo):** Vitórias (wins), felicidade, **Média de Humor** e **Média de Energia** (estados positivos geram XP passivo).
- **Origem do Esforço:** Uma lista que detalha de onde vieram os pontos:
    - 🍅 **Foco:** XP gerado pelo tempo que você passou com o timer rodando (inclui bônus de *flow*).
    - 🏋️‍♂️ **Treino:** XP gerado pela duração das suas sessões físicas.
    - ✅ **Tarefas:** XP gerado pela conclusão de itens da sua lista (tarefas difíceis valem mais).
    - 💤 **Sono:** XP gerado pela qualidade da sua recuperação noturna.
    - 💪 **Hábitos:** XP gerado pela consistência em rituais diários.
    - ✨ **Eventos:** XP gerado por registros qualitativos (Wins, Insights, Refeições) e pelos **Bônus de Estado** (Humor/Energia).
- **Destaques do Dia:** O sistema identifica automaticamente a tarefa única e o hábito único que geraram a maior quantidade de XP individualmente, celebrando sua "Jogada de Mestre" do dia.

---
### 💤 Análise de Recuperação (Sono)

#### Para que serve?
Este componente traduz dados subjetivos e objetivos em uma nota clara de 0 a 100% sobre a qualidade do seu descanso. Ele serve para correlacionar sua performance cognitiva com sua recuperação biológica, expondo gargalos invisíveis na sua rotina noturna.

#### Como funciona?
O sistema utiliza um algoritmo de **Higiene Retroativa**. Ele cruza dados da noite anterior (hora de dormir, rituais de higiene) com dados da manhã atual (hora de acordar, disposição).
- **Cálculo do Score:** Soma pontos por boas práticas (ex: quarto escuro, sem telas) e duração adequada do sono.
- **Penalidades:** Subtrai pontos automaticamente se houver registros de "Sono Interrompido" ou se o sistema detectar logs de trabalho (foco) durante a madrugada.
- **Diagnóstico S.O.T.A.:** Baseado na nota final, um *callout* colorido (Verde/Amarelo/Vermelho) oferece um veredito direto sobre o impacto do sono na sua performance prevista para o dia.


---

## 6. Mídia e Memória

### 📷 Galeria do Dia
*   Tirou uma foto do quadro branco? Um print de uma reunião? Uma foto do shape?
*   Use o botão **"➕ Anexar Mídia"**. O sistema renomeia o arquivo (com data e hora), salva na pasta organizada e exibe aqui numa galeria visual.

### 🖼️ HQ do Dia & Áudio
*   **HQ:** Se você gerou a história em quadrinhos do seu dia com a AI, ela aparece aqui.
*   **Áudio:** Use **"🎤 Gravar Áudio"** para fazer um "Voice Memo" para o seu "Eu do Futuro". O sistema grava, salva e linka o player na nota.

### 📜 Timeline do Dia
A "Caixa Preta". Uma lista cronológica exata de tudo o que aconteceu, minuto a minuto.
*   08:00 - Acordou (Humor: 4)
*   09:30 - Foco: Projeto X (45min)
*   12:00 - Nutrição: Almoço Saudável
*   15:00 - Distração: Instagram (Gatilho: Tédio)
*   Use isso para auditoria de vida. Onde o tempo vazou?

---

## 💡 Dica de Ouro: O Fluxo Ideal

1.  **Manhã:** Abra a nota. Veja "Aprimoramentos Pendentes". Registre o Sono. Defina o Foco no "Painel de Ação".
2.  **Durante o dia:** Trabalhe usando o Timer (Lateral). Registre "Refeições" e "Emoções" pelos comandos rápidos (`Ctrl+P -> Log...`).
3.  **Noite:** Faça o Resumo. Clique em "Processar Dia". Veja seu XP subir. Durma com a mente tranquila.