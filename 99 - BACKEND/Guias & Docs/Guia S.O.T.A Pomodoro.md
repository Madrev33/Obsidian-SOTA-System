

O **Pomodoro S.O.T.A.** não é apenas um relógio para contar 25 minutos. Ele é o **Motor de Execução** do sistema. É através dele que você insere dados na *matrix*, ganha XP, sobe de nível e, mais importante, descobre a verdade sobre como você gasta sua vida.

---

## 🧭 Fase 1: O Rastreamento (Autoconhecimento)
*"Você não pode otimizar o que não pode medir."*

Muitas pessoas erram ao tentar impor limites de tempo rígidos (ex: "Vou terminar isso em 20 min") sem saber sua velocidade real. Isso gera frustração.

### A Estratégia do Cronômetro (Stopwatch Mode)
No início, ou ao começar um projeto novo e desconhecido, **não use limites de tempo**.
1.  Ative o **Modo Cronômetro** nas configurações do plugin (ou clique no ícone do relógio).
2.  Inicie a tarefa e trabalhe até terminar (ou cansar).
3.  **Objetivo:** Descobrir sua **Baseline (Linha de Base)**.
    *   *Quanto tempo eu realmente levo para escrever um roteiro?*
    *   *Quanto tempo levo para estudar 10 páginas de um livro técnico?*

Ao fazer isso por uma semana, você terá dados reais nos seus Dashboards. Você descobrirá que leva 45 minutos, não 20, para fazer aquela tarefa. Agora você tem a verdade.

---

## ⚡ Fase 2: A Compressão (Alta Performance)
*"O trabalho se expande para preencher o tempo disponível." (Lei de Parkinson)*

Uma vez que você sabe sua média (ex: leva 45 min para escrever), agora você aplica a **Técnica Pomodoro** clássica para gerar intensidade.

### A Estratégia do Timer
1.  Defina o tempo ligeiramente **abaixo** da sua média (ex: 40 min).
2.  O "tique-taque" cria uma urgência artificial saudável.
3.  Isso força seu cérebro a entrar em **Deep Work (Foco Profundo)**, ignorando distrações para bater a meta.

### A Sintaxe de Previsão
Ao criar tarefas no S.O.T.A., você verá algo como: `[🍅:: 0/3]`.
*   Isso significa: "Estimo que levarei 3 sessões para acabar".
*   Se você acabar em 2, você foi eficiente. Se acabar em 5, você subestimou a tarefa.
*   O sistema aprende com você, e você aprende com o sistema.

---

## 🎁 A Lógica das Recompensas (Quest Engine)
*"Dopamina barata é dada. Dopamina real é conquistada."*

O S.O.T.A. possui um sistema de RPG integrado chamado **Quest Engine**. Você não deve apenas "trabalhar por trabalhar". Você trabalha para desbloquear sua vida.

### Como Funciona:
1.  **Crie a Recompensa:** Use o botão de criar recompensa para definir algo que você quer muito (ex: *"Jogar 2h de Videogame"*, *"Comprar aquele livro caro"*, *"Jantar fora"*).
2.  **Defina o Preço:** O sistema perguntará: *"Quais tarefas são necessárias para desbloquear isso?"*.
3.  **Vincule as Tarefas:** Selecione as tarefas difíceis ou chatas que você está procrastinando.
4.  **O Bloqueio:** A recompensa fica com status `Pendente` (Bloqueada).
5.  **O Desbloqueio:** Assim que você completar a última tarefa vinculada usando o Pomodoro, o sistema enviará uma notificação:
    > 🎉 **Recompensa Desbloqueada: Jogar Videogame!**

> [!WARNING] **Regra de Ouro: Escopo Local**
> O Quest Engine funciona no contexto da **Nota Ativa**.
>
> Para vincular tarefas a uma recompensa, **as tarefas devem existir dentro da mesma nota onde você está clicando no botão "Criar Recompensa"**.
>
> *Exemplo:* Se você quer criar uma recompensa para finalizar o "Projeto X", abra o HUB do Projeto X, crie as tarefas lá e, em seguida, crie a recompensa dentro desse mesmo HUB. O sistema não consegue "pescar" tarefas soltas em outros arquivos distantes.

Isso inverte a lógica do cérebro. O trabalho difícil deixa de ser "dor" e vira "a chave" para o prazer.

---

## 🔄 O Ciclo de Execução (Workflow)

Para que os dados alimentem corretamente os Dashboards de Projetos, Mídias e Perfil, siga este ritual:

1.  **Selecione o Contexto:** Nunca inicie um timer "no vácuo".
    *   Abra a nota do Projeto ou Mídia que vai trabalhar.
    *   Ou use uma tarefa com a tag correta (ex: `#projeto/SotaSystem`).
2.  **Inicie o Foco (Play):** O sistema detectará automaticamente onde você está e associará o tempo àquele projeto.
3.  **Trabalhe:** Esqueça o sistema. Foque na tarefa.
4.  **Finalize:** Ao fim do tempo (ou da tarefa), pare o timer.
5.  **O Debriefing (Essencial):** Uma janela abrirá pedindo:
    *   **Foco (0-10):** Quão concentrado você estava?
    *   **Humor:** Como você se sente?
    *   **Energia:** Qual sua bateria atual?
6.  **Pausa:** Respeite o descanso. O sistema também loga o tempo de pausa para calcular sua "Taxa de Recuperação".

---

## 🛡️ Soberania: Interna vs. Externa

Uma métrica exclusiva do S.O.T.A ao criar tarefas é a **Soberania**.

*   **👑 Interna (Eu):** Coisas que VOCÊ quer fazer. Seus projetos pessoais, seus estudos, seus sonhos.
*   **💼 Externa (Eles):** Coisas que você é OBRIGADO a fazer. Trabalho CLT, burocracias, favores para outros.

O Dashboard de Perfil mostrará um gráfico de **Balança de Soberania**.
*   *Objetivo:* Aumentar gradualmente a barra "Interna" ao longo da vida. Se 90% do seu tempo é "Externa", você está vivendo a vida dos outros, não a sua.

---

## 🚨 Cuidados Técnicos com o Timer

1.  **Crash Recovery:** Se o Obsidian fechar no meio de um Pomodoro, não se preocupe. Ao abrir novamente, o sistema detectará a "Sessão Fantasma" e perguntará se você continuou trabalhando ou se parou.
2.  **Não Mude o Relógio do PC:** O sistema usa timestamps reais. Mudar a hora do computador pode corromper o cálculo de duração.
3.  **Logs Manuais:** Evite editar manualmente as linhas de log `(sessao_fim::WORK)` no arquivo diário, pois elas contêm chaves precisas para os gráficos.