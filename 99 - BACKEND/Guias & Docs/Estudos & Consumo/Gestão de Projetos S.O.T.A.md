

> [!abstract] A Filosofia: Intenção sobre Movimento
> No S.O.T.A, um projeto não é apenas uma lista de tarefas. É um compromisso de transformação.
> Você não "estuda Python" vagamente; você cria um **Projeto** para *"Construir um Agente de AI em Python"*.
> Aprender com a intenção de construir algo torna a retenção de conhecimento infinitamente superior.

Este guia explica como utilizar o ecossistema de Projetos para gerenciar desde ideias de guardanapo até empreendimentos complexos.

---

## 1. O Ciclo de Vida: Da Ideia à Execução

O sistema reconhece dois estágios de maturidade para qualquer empreendimento. Escolha o formato de acordo com o momento da sua ideia.

### 🌱 Estágio 1: O Esboço (Incubadora)
Ideal para capturar ideias rápidas sem a pressão de executar agora. É a "semente".

*   **O que é:** Uma pasta simples contendo um arquivo central de ideias.
*   **Quando usar:**
    *   Teve uma ideia de App no banho.
    *   Quer rascunhar uma história ou música.
    *   Viu um assunto interessante, mas não vai focar nele agora.
*   **Como criar:**
    1.  Acione o Macro QuickAdd pela Paleta de Comandos (CTRL + P) e escolha **"Criar Projeto Esboço"**.
    2.  O sistema cria uma pasta em `02 - Projetos/01. Incubadora`.
    3.  Use o arquivo gerado para brain dump, listas e rascunhos livres.
*   **Evolução:** Quando você decidir que é hora de fazer acontecer, você move ou transforma esse esboço em um Projeto Executivo.

### 🏗️ Estágio 2: O Projeto Executivo (A Obra)
Ideal para quando você vai efetivamente planejar, cronometrar e executar.

*   **O que é:** Uma estrutura completa de pastas com arquivos especializados (HUB, Docs, Notas) e rastreamento de métricas.
*   **Quando usar:**
    *   Vai começar a construir o App.
    *   Vai lançar a música.
    *   Vai iniciar um estudo prático complexo.
*   **Como criar:**
    1.  Acione o Macro QuickAdd pela Paleta de Comandos (CTRL + P) e escolha **"Criar Projeto Executivo"**.
    2.  Defina o nome e a **Soberania** (Interna = Vontade Própria / Externa = Obrigação).
    3.  O sistema gera a arquitetura completa em `02 - Projetos`.

---

## 2. A Arquitetura do Projeto Executivo

Ao criar um Projeto Executivo, você recebe um "Quartel General" composto por 3 arquivos vitais. Entenda o papel de cada um para manter sua mente organizada:

### 🎮 00. HUB (A Central de Comando)
Este é o coração do seu projeto. É aqui que você define a estratégia e acompanha o progresso real. Diferente de sistemas rígidos, o S.O.T.A. permite que você construa este arquivo organicamente.

#### Painel de Controle (Topo)
Logo no início, você encontrará botões vitais para o ciclo de vida do projeto:
*   **Iniciar / Pausar / Concluir:** Define o status atual (o que afeta como o projeto aparece nos Dashboards).
*   **🛠️ Renomear:** Use este botão se o escopo ou nome do projeto mudar. Ele ajusta pastas, arquivos e histórico de logs automaticamente.

#### Como Organizar o Trabalho (Fases e Tarefas)
Você tem liberdade total para estruturar o HUB. O sistema lê **Sessões (Fases)** e **Tarefas (Tasks)**.

1.  **Crie suas Fases Manualmente:**
    Edite o arquivo e use cabeçalhos de nível 3 (`###`) para criar suas fases ou sprints.
    *   Exemplo: Escreva `### Planejamento`, `### Desenvolvimento`, `### Marketing`.
    *   *Dica:* O sistema usa esses títulos para agrupar o tempo gasto nos relatórios. Mantenha nomes claros.

2.  **Transforme Ideias em Tarefas (Processar Task):**
    Você não precisa criar tarefas "do zero". O fluxo ideal é o **Refino**:
    *   Escreva suas ideias ou lista de afazeres como tópicos simples (bullets `-`) no HUB ou no arquivo de *Anotações*.
    *   Selecione o texto da ideia que você quer ativar.
    *   Abra a Paleta de Comandos (`Ctrl/Cmd + P`) e execute **"Processar Task"**.
    *   Um menu aparecerá para você definir:
        *   **Nome:** (Já vem preenchido com o texto, ajuste se quiser).
        *   **Dificuldade (XP):** Quanto vale essa tarefa?
        *   **Sessões:** Quantos Pomodoros você estima?
    *   **Resultado:** O script transforma aquela linha simples em um **Bloco de Tarefa S.O.T.A.** completo, com checkbox, rastreadores de tempo e tags de gamificação, preservando qualquer subtópico como anotação dentro da tarefa.

3.  **Organize:**
    Se você processou a tarefa no arquivo de *Anotações*, recorte e cole o bloco gerado para dentro da fase correta no **HUB**. Se já estava no HUB, basta arrastar para a sessão desejada.

> **Resumo do Fluxo:**
> Escreva livremente (`- ideia`) -> Selecione e Processe (`Ctrl+P`) -> Mova para a Fase no HUB (`### Fase`) -> Execute com o Timer.

### 📄 01. Documentação
O local para o "Formal".
*   Use para guardar decisões finais, especificações técnicas, roteiros aprovados, brandbooks ou manuais.
*   É o arquivo que você leria para entender *o que* foi decidido, sem o ruído do processo criativo.

### 🧠 02. Anotações e Ideias
O local para o "Caos Criativo".
*   Use para rascunhos, links de referência, brainstorms, reuniões e pensamentos soltos.
*   Aqui você pode ser desorganizado. Quando uma ideia amadurecer, transforme-a em Tarefa no HUB.

> **Nota:** Você tem liberdade total para criar novas pastas e arquivos dentro da pasta do projeto (ex: pasta `Assets`, `Referências`, `Scripts`). O sistema continuará rastreando tudo através do HUB.

---

## 3. Workflow de Execução (O Dia a Dia)

Como trabalhar em um projeto usando o S.O.T.A.:

1.  **Planeje:** Abra o **HUB**, crie uma Fase (ex: "### Sprint 1") e crie Tarefas.
2.  **Foque:** Abra o **Pomodoro Timer** (Barra lateral direita).
    *   Suas tarefas do projeto aparecerão lá automaticamente se o arquivo estiver aberto.
    *   Dê **Play** na tarefa. O sistema agora está gravando cada segundo gasto nesse projeto específico.
3.  **Analise:**
    *   Ao terminar um bloco de trabalho, o sistema registra logs em `99 - BACKEND`.
    *   Vá para o dashboard `03 - Análise de Projetos.md`.
    *   Selecione seu projeto.
    *   Veja gráficos de **Velocity** (tarefas por dia), **Distribuição de Foco** (quanto tempo gastou em cada fase) e **Cronograma**.

---

## 4. Casos de Uso (Exemplos Reais)

### Caso A: O Estudante Prático ("Aprender Python")
Em vez de apenas ler livros, você cria um projeto.
1.  **Criação:** Projeto Executivo "Agente de AI em Python".
2.  **HUB:**
    *   *Fase 1: Fundamentos* (Tarefas: Configurar ambiente, Hello World).
    *   *Fase 2: Protótipo* (Tarefas: Criar script básico, conectar API).
3.  **Estudo:** Você associa este Projeto ao **Estudo** "Linguagem Python" (ver guia de Estudos).
4.  **Resultado:** Você aprende fazendo. O Dashboard mostra quanto tempo levou para sair da teoria para a prática.

### Caso B: O Criativo ("Lançar Música")
1.  **Incubação:** Cria um *Projeto Esboço* "Ideias Música 2026". Joga letras soltas e áudios lá.
2.  **Ativação:** A ideia fica boa. Cria um *Projeto Executivo* "Single: Noite Clara".
3.  **Migração:** Move as notas do esboço para a pasta `02. Anotações` do novo projeto.
4.  **HUB:**
    *   *Fase 1: Composição* (Tarefas: Finalizar letra, Definir acordes).
    *   *Fase 2: Gravação* (Tarefas: Gravar voz guia, Gravar violão).
    *   *Fase 3: Mix/Master*.

---

## 5. Dicas de Ouro S.O.T.A. 🌟

*   **Não quebre a corrente:** Use o Dashboard de Projetos para ver seu "Heatmap" de contribuição. Tente trabalhar no seu projeto principal nem que seja 15 minutos por dia.
*   **Renomeie sem medo:** Se o escopo mudar, use o botão **"🛠️ Renomear"** no Painel de Controle do HUB. O sistema é inteligente: ele renomeia pastas, arquivos e *reescreve todos os logs antigos* para não perder seu histórico.
*   **Evite Tarefas Órfãs:** Sempre crie tarefas dentro de uma **Fase** no HUB. Isso permite que o sistema gere gráficos de "Tempo por Fase" (ex: "Gastei 10h planejando e só 2h executando? Preciso ajustar.").