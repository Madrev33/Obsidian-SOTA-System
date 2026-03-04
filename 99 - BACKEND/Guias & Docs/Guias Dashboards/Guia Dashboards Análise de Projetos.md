

### 🗓️ Cronograma & Status

**Para que serve:**

Este componente oferece um resumo claro e direto sobre a linha do tempo do projeto. Ele permite que você visualize rapidamente o status atual (ex: "Em andamento", "Concluído") e entenda os principais marcos temporais, como a data de início, a data de conclusão e a duração total. É ideal para saber há quanto tempo um projeto está ativo ou quanto tempo ele levou para ser concluído.

**Como funciona:**

O script lê as datas de `criação`, `início` e `conclusão` definidas no arquivo principal (hub) do projeto. A partir delas, ele calcula e exibe:

*   **Tempo de Incubação:** Duração entre a criação da ideia e o início do projeto.
*   **Tempo Decorrido:** Há quanto tempo o projeto está em andamento (se ainda não foi concluído).
*   **Duração do Projeto:** Tempo total do início à conclusão (para projetos finalizados).

As informações são apresentadas em uma lista simples para fácil consulta.

---

### 📊 KPIs de Performance

**Para que serve?**

Este painel oferece um resumo de alto nível sobre sua dedicação e eficiência em um projeto. Ele serve para você entender rapidamente:
- O **volume de esforço** investido (total de horas focadas).
- Seu **ritmo de trabalho** e a sustentabilidade dele (quanto você descansa para cada hora de foco).
- Sua **velocidade de entrega** (quantas tarefas você finaliza, em média, por dia de trabalho).
- O **progresso geral** para a conclusão do projeto.

É uma ferramenta ideal para uma avaliação rápida do andamento e da sua performance geral.

**Como funciona?**

O script agrega e calcula as seguintes métricas:
1.  **Busca de Dados:** Ele lê os registros de tempo (sessões de foco e pausa) diretamente do arquivo de log (`raw_logs.md`) do projeto. As informações sobre tarefas (total e concluídas) são extraídas da página principal (HUB) do projeto.
2.  **Cálculo de Tempo:** Soma a duração de todas as sessões de "WORK" para obter o "Tempo Total de Foco" e de "BREAK" para o "Tempo Total em Pausas".
3.  **Cálculo de Progresso:** Divide o número de tarefas completas pelo total de tarefas para encontrar o "Progresso Geral".
4.  **Cálculo de Médias:**
    - **Velocity:** Divide o total de tarefas concluídas pelo número de dias ativos (dias em que houve sessões de foco ou conclusão de tarefas).
    - **Ritmo de Sessão:** Calcula a duração média de uma sessão de foco e de uma sessão de pausa.
    - **Proporção de Recuperação:** Calcula quantos minutos de pausa você realiza para cada 60 minutos de foco, indicando seu equilíbrio entre trabalho e descanso.

---

### Métricas de Sequências

#### Para que serve

Esta seção oferece uma visão rápida sobre sua consistência e disciplina em um projeto específico. Ela foi desenhada para motivar e ajudar a construir momentum, mostrando:

*   **Sequência Atual:** Quantos dias consecutivos você trabalhou no projeto.
*   **Recorde:** Sua maior sequência de dias de trabalho consecutivos na história do projeto.
*   **Dias Trabalhados:** O número total de dias em que houve pelo menos uma sessão de trabalho.
*   **Status Recente:** Indica há quanto tempo foi sua última atividade, ajudando a evitar longos períodos de inatividade.

É uma ferramenta poderosa para visualizar seu engajamento e manter o ritmo de desenvolvimento.

#### Como funciona

O script analisa o arquivo de log bruto (`raw_logs.md`) associado ao projeto selecionado.

1.  Ele primeiro coleta todas as datas únicas em que uma sessão do tipo "WORK" foi registrada.
2.  Com as datas ordenadas, ele calcula o **Recorde** iterando por todo o histórico e encontrando a maior sequência de dias consecutivos.
3.  Em seguida, ele calcula a **Sequência Atual**, verificando se você trabalhou hoje ou ontem. Se sim, ele conta para trás quantos dias seguidos você esteve ativo. Se a última atividade foi antes de ontem, a sequência é considerada quebrada e zerada.
4.  O **Status Recente** é uma representação amigável da diferença entre a data de hoje e a última data de trabalho registrada.

---

### Sequência Visual (Mensal)

**Para que serve**

Este gráfico oferece uma visão rápida da sua consistência e frequência de trabalho no projeto selecionado. Ele permite identificar facilmente os dias de maior e menor atividade, ajudando a visualizar padrões de produtividade e a manter a motivação ao construir uma "corrente" de dias de foco.

**Como funciona**

O script lê o arquivo de log (`raw_logs.md`) do projeto para contar quantas "sessões de foco" foram concluídas a cada dia. Com base nesses dados, ele gera um gráfico no estilo calendário, onde cada dia é colorido de acordo com o volume de sessões: quanto mais sessões em um dia, mais escura a cor, criando um mapa de calor do seu esforço recente.

---

### ⏱️ Esforço Diário (Foco vs. Pausa)

**Para que serve:**

Este gráfico oferece uma visão clara do tempo que você dedica a um projeto a cada dia, separando o tempo de trabalho focado do tempo de pausa.

Use-o para:
- Acompanhar sua consistência e volume de esforço ao longo do tempo.
- Analisar o equilíbrio entre foco e descanso.
- Identificar seus dias mais produtivos e entender seu ritmo de trabalho no projeto.

**Como funciona:**

O gráfico é gerado a partir dos registros brutos de sessões de trabalho (`raw_logs.md`), que são salvos automaticamente.

1.  O script lê o arquivo de log específico do projeto selecionado.
2.  Ele identifica todas as sessões finalizadas, marcadas como `WORK` (Foco) ou `BREAK` (Pausa).
3.  Agrupa essas sessões por data e soma a duração total (em minutos) para cada tipo.
4.  O resultado é um gráfico de colunas (ou linhas) que compara o esforço de Foco e Pausa para cada dia registrado, permitindo uma análise visual da sua dedicação diária. O tooltip do gráfico mostra o tempo exato no formato `HH:MM:SS`.

---

### ⏱️ Padrão de Horário (Foco)

**Para que serve:**

Este gráfico revela em quais horas do dia suas sessões de foco em um projeto são, em média, mais longas. Ele é uma ferramenta poderosa para entender seu ritmo biológico (cronobiologia) e identificar seus horários de pico de produtividade. Com essa informação, você pode agendar sessões de trabalho profundo de maneira mais estratégica, aproveitando os momentos em que sua concentração está naturalmente mais alta.

**Como funciona:**

O script analisa o arquivo de log bruto (`raw_logs.md`) associado ao projeto selecionado. Ele busca por todas as sessões de trabalho (`WORK`) que foram concluídas, extraindo a hora em que a sessão terminou e sua duração total.

Em seguida, ele agrupa todas as sessões pela hora do dia e calcula a **duração média** para cada uma das 24 horas. O gráfico exibe essa média em minutos, permitindo uma visualização clara dos seus padrões de foco. Ao passar o mouse sobre uma barra ou ponto no gráfico, uma dica de ferramenta (tooltip) mostra a duração média precisa no formato `Horas:Minutos:Segundos`.

---

### Tarefas Por Dia

**Para que serve**

Este gráfico, também chamado de "Velocity", mostra o número de tarefas que você conclui a cada dia em um projeto específico. Ele é ideal para visualizar seu ritmo de trabalho, identificar picos de produtividade e avaliar a consistência das suas entregas ao longo do tempo. Com ele, você responde rapidamente à pergunta: "Quantas tarefas estou finalizando por dia?".

**Como funciona**

O script analisa o arquivo "HUB" do projeto selecionado. Ele busca por todas as tarefas que foram marcadas como concluídas e que possuem uma data de finalização registrada. Em seguida, ele agrupa essas tarefas por dia e conta quantas foram finalizadas em cada data. O resultado é um gráfico (de colunas ou linha) que exibe a quantidade de tarefas concluídas ao longo dos dias, oferecendo um panorama claro do seu ritmo de entrega.

---

### 📈 Distribuição de Foco

#### Para que serve?
Este gráfico permite visualizar como o seu tempo de trabalho foi distribuído entre as diferentes fases de um projeto selecionado. Ele oferece duas visualizações:

*   **Pizza (Padrão):** Ideal para entender a proporção de esforço dedicada a cada fase em relação ao tempo total. O centro do gráfico mostra o tempo total investido.
*   **Barras:** Ótima para comparar os valores absolutos de tempo gasto em cada fase, facilitando a identificação de onde você mais investiu horas.

O objetivo é fornecer um feedback visual rápido para analisar se a alocação do seu foco está alinhada aos objetivos e ao cronograma atual do projeto.

#### Como funciona?
O script opera da seguinte forma:
1.  **Identifica o Projeto:** Usa o `hub_uid` da página para encontrar o `id_projeto` correspondente.
2.  **Lê os Logs:** Acessa o arquivo `raw_logs.md` específico do projeto, que contém os registros de todas as sessões de trabalho.
3.  **Calcula o Tempo por Fase:** Ele filtra as linhas que marcam o fim de uma sessão de trabalho (`sessao_fim::WORK`). Para cada uma, extrai duas informações:
    *   A **fase**, identificada a partir da tag (ex: `#projeto/nome/1_Planejamento`).
    *   A **duração** da sessão em segundos.
4.  **Agrupa os Dados:** O tempo de todas as sessões é somado e agrupado por fase. O nome da fase é tratado para aparecer de forma limpa no gráfico (ex: "1_Planejamento" vira "Planejamento").
5.  **Gera o Gráfico:** Por fim, os dados consolidados são usados para renderizar o gráfico de pizza ou de barras, exibindo o tempo total, as porcentagens e os valores formatados em `HH:mm:ss`.

---

### Tabela de Eficiência por Fase

#### Para que serve?
Esta tabela oferece uma visão detalhada de como seu esforço está distribuído entre as diferentes fases de um projeto. Ela permite que você responda a perguntas como:

*   Qual fase do projeto consome mais tempo de foco?
*   Onde estou fazendo mais pausas?
*   Qual é o progresso de tarefas concluídas em cada fase (ex: "Planejamento" vs. "Execução")?
*   Em média, quanto tempo leva para concluir uma tarefa em uma fase específica?

É uma ferramenta poderosa para identificar gargalos, entender a dinâmica do seu fluxo de trabalho e otimizar a alocação de tempo e energia ao longo do ciclo de vida do projeto.

#### Como funciona?
A lógica por trás da tabela é um processo de 3 etapas:

1.  **Mapeamento do HUB:** O script primeiro lê o arquivo principal do seu projeto (o "HUB") para identificar as fases que você definiu (linhas que começam com `###`) e todas as tarefas listadas abaixo de cada uma.
2.  **Análise dos Logs de Trabalho:** Em seguida, ele processa os arquivos de log que registram suas sessões de foco e pausa para aquele projeto específico.
3.  **Associação e Cálculo:** O script associa inteligentemente cada sessão de trabalho à sua respectiva tarefa e, consequentemente, à sua fase. Ele então soma os tempos de foco/pausa, conta as tarefas concluídas vs. totais e calcula métricas úteis, como o tempo médio por tarefa, para exibir tudo de forma consolidada na tabela.

---

### Diagnóstico de Tarefas

#### Para que serve?

Esta seção oferece uma análise detalhada de todo o esforço investido em cada tarefa específica de um projeto. Ela é projetada para responder a perguntas como:

- Em qual tarefa estou gastando mais tempo de foco?
- Qual a proporção de tempo de trabalho versus tempo de pausa para uma tarefa específica?
- A qual fase do projeto (ex: Planejamento, Execução, Revisão) cada tarefa pertence?
- Qual foi a última vez que trabalhei em uma determinada tarefa?

Essencialmente, ela transforma seus registros de tempo brutos em um relatório claro, permitindo identificar gargalos, avaliar a distribuição de esforço e ver o progresso real em nível de tarefa.

#### Como funciona?

O script opera em um processo de duas etapas principais para construir a tabela:

1.  **Mapeamento da Estrutura do Projeto:** Primeiramente, o script lê o arquivo "HUB" do projeto. Ele analisa a estrutura do documento, identificando as "Fases" (geralmente títulos de nível 3, como `### Fase: Pesquisa`) e as tarefas listadas abaixo delas. Com isso, ele cria um mapa que associa cada nome de tarefa à sua fase correta.

2.  **Análise dos Registros de Tempo:** Em seguida, o script acessa o arquivo de logs brutos do projeto (`raw_logs.md`), onde todas as suas sessões de foco e pausa são registradas. Ele processa cada linha de log para extrair:
    - O nome da tarefa focada.
    - A duração da sessão.
    - Se foi uma sessão de trabalho (`WORK`) ou pausa (`BREAK`).
    - A data do registro.

    Agregando essas informações, ele calcula o tempo total de foco/pausa e o número de sessões para cada tarefa. Usando o mapa criado na primeira etapa, ele atribui a fase correta a cada tarefa, garantindo que a tabela reflita com precisão a estrutura do seu projeto. Por fim, exibe os dados consolidados em uma tabela interativa que pode ser ordenada.

---

