

### 🗓️ Cronograma

#### Para que serve?
Este componente oferece um resumo visual rápido do ciclo de vida de um estudo. Ele informa quando o estudo começou, se ainda está em andamento ou se foi concluído, e a duração total ou o tempo decorrido até o momento. Um ícone de status (🟢 Ativo, 🏁 Concluído, zzz Backlog) permite identificar rapidamente a situação atual do estudo.

#### Como funciona?
O script localiza a nota central (HUB) do estudo através de um identificador único (`hub_uid`). Em seguida, ele lê as datas de `criação` e `conclusão` diretamente dos metadados dessa nota. Com base nessas informações, ele calcula:
- A **Duração Total**, caso o estudo tenha uma data de conclusão.
- O **Tempo Decorrido** desde a criação até hoje, caso o estudo ainda esteja em andamento.

As informações são exibidas em uma lista simples para fácil consulta.

---

### 📊 KPIs Totais

#### Para que serve?
Este componente oferece um resumo rápido dos seus indicadores-chave de performance (KPIs) para todos os materiais e projetos que você vinculou a este Hub de Estudo. Ele serve para dar uma visão geral e imediata do seu esforço total, mostrando o tempo dedicado ao foco, as pausas realizadas, o número de sessões de estudo e a sua consistência de estudo ao longo dos dias.

#### Como funciona?
O script primeiro identifica todas as "fontes de estudo" (livros, cursos, projetos, etc.) associadas ao Hub. Em seguida, ele localiza os arquivos de log individuais para cada uma dessas fontes. O script lê esses arquivos e soma a duração de todas as sessões de trabalho (`WORK`) para calcular o **Tempo Total de Foco**, e das sessões de descanso (`BREAK`) para o **Tempo Total de Pausa**. Ele também conta o número total de sessões de foco e a quantidade de dias únicos em que houve alguma atividade de estudo. Por fim, exibe esses totais em uma lista.

---

### Métricas de Sequência

#### Para que serve

Esta seção oferece uma visão rápida da sua consistência e engajamento com o tema de estudo selecionado. Ela foi projetada para motivar e ajudar a construir um hábito de estudo regular, respondendo a perguntas como:

-   Há quantos dias seguidos eu venho estudando este assunto?
-   Qual foi a minha maior sequência de estudos?
-   Estou ativo ou em um período de pausa?

As métricas principais são a **Sequência Atual**, o **Recorde** de dias consecutivos, o total de **Dias Estudados** e o **Status** atual da sua atividade.

#### Como funciona

O script primeiro identifica todas as fontes de conhecimento (livros, cursos, artigos, projetos, etc.) que você associou ao HUB de estudo selecionado no dashboard.

Em seguida, ele busca os registros de atividade (`raw_logs.md`) para cada uma dessas fontes, procurando por sessões de trabalho (`WORK`). Todas as datas em que houve pelo menos uma sessão de estudo são compiladas em uma lista única.

Com base nessa lista de datas, o script calcula:
1.  A sequência atual de dias consecutivos de estudo até a data de hoje.
2.  A maior sequência de dias consecutivos já registrada.
3.  O número total de dias únicos em que você estudou o tema.
4.  O "hiato", que é o número de dias desde sua última sessão de estudo.

---

### Heatmap de Estudo (Mensal)

**Para que serve**

Este gráfico visualiza sua consistência e dedicação a um tema de estudo específico ao longo do tempo. Ele funciona como um "calendário de esforço", onde cada dia é colorido de acordo com o total de minutos que você dedicou às fontes de conhecimento daquele estudo.

Use-o para:
*   Ver rapidamente em quais dias você estudou.
*   Identificar padrões e manter a regularidade.
*   Motivar-se a não "quebrar a corrente" de estudos.

Quanto mais escuro o verde, maior foi seu tempo de estudo naquele dia.

**Como funciona**

O script primeiro identifica qual "Estudo HUB" foi selecionado no dashboard. Em seguida, ele localiza todas as fontes de conhecimento associadas a esse HUB (como livros, cursos, vídeos ou projetos).

Ele então varre os registros de todas as suas sessões de estudo para essas fontes, somando os minutos totais de foco para cada dia. Por fim, ele desenha o calendário, colorindo cada dia com base na quantidade de tempo estudado, criando um mapa visual do seu progresso e consistência.

---

### ⏱️ Foco & Pausa de Estudo Diário

#### Para que serve?
Este gráfico oferece uma visão clara do seu esforço diário dedicado a um "Hub de Estudo" específico. Ele separa o tempo total em duas categorias principais: **Foco** (períodos de trabalho concentrado) e **Pausa** (descansos registrados durante as sessões).

Use este gráfico para:
- Acompanhar sua consistência e volume de estudo ao longo dos dias.
- Identificar padrões no seu ritmo, como dias da semana mais ou menos produtivos.
- Balancear o tempo de foco e de descanso para garantir uma rotina sustentável.

É possível alternar entre a visualização em colunas (ideal para comparar dias) e em linha (ótima para observar tendências).

#### Como funciona?
O script opera de forma totalmente automatizada, seguindo esta lógica:
1.  **Identifica o Hub:** Primeiro, ele reconhece qual "Hub de Estudo" está sendo analisado.
2.  **Coleta de Fontes:** Em seguida, reúne todas as mídias (livros, cursos, vídeos, etc.) e projetos que foram associados a este hub.
3.  **Busca por Registros:** Para cada fonte encontrada, o script localiza seu arquivo de log correspondente, que contém os detalhes de cada sessão de estudo (`WORK`) e descanso (`BREAK`).
4.  **Agregação de Dados:** Ele lê esses arquivos, extrai a data e a duração de cada sessão, e soma os segundos totais para "Foco" и "Pausa" de cada dia.
5.  **Visualização:** Por fim, os dados diários são convertidos para minutos e plotados no gráfico. Ao passar o mouse sobre um elemento, uma dica de ferramenta exibe o tempo exato no formato `HH:mm:ss` para maior precisão.

---

### Distribuição de Foco

**Para que serve**

Este gráfico oferece uma visão clara e imediata de como seu tempo de estudo está distribuído entre as diferentes fontes de conhecimento (livros, cursos, projetos, vídeos, etc.) vinculadas a um tema de estudo central. Ele permite que você avalie rapidamente quais materiais estão recebendo mais atenção e se a sua dedicação está alinhada com suas prioridades e objetivos de aprendizado.

**Como funciona**

O script opera da seguinte forma:
1.  Identifica o "Hub de Estudo" selecionado.
2.  Coleta todas as mídias (livros, artigos, etc.) e projetos associados a esse hub.
3.  Para cada item encontrado, ele localiza o arquivo de log correspondente que registra as sessões de estudo (`raw_logs.md`).
4.  Lê esses logs e soma a duração de todas as sessões de trabalho (`WORK`) para calcular o tempo total de foco dedicado a cada fonte.
5.  Por fim, compila os dados, calcula o percentual de cada fonte em relação ao total e exibe um gráfico (pizza ou barras) que ilustra essa distribuição, mostrando também o tempo total investido no formato "HH:mm:ss".

---

### 📑 Ranking de Fontes

**Para que serve?**

Este componente classifica todas as fontes de conhecimento (livros, cursos, vídeos, projetos, etc.) que você associou a um determinado Hub de Estudo. Ele permite que você veja rapidamente:

*   **Quais fontes recebem mais seu tempo de foco.**
*   **O tempo total gasto em pausas para cada fonte.**
*   **A última vez que você interagiu com cada material.**

Com isso, você pode facilmente identificar os recursos mais utilizados, aqueles que foram deixados de lado e balancear melhor seus esforços de estudo.

**Como funciona?**

O script primeiro identifica o Hub de Estudo ativo e localiza todas as mídias e projetos vinculados a ele. Para cada fonte encontrada, ele acessa um arquivo de log correspondente que registra todas as suas sessões de trabalho e pausa.

Ele então soma a duração de todas as sessões de "Foco" e de "Pausa" separadamente e registra a data da última atividade. Por fim, organiza todas as fontes em uma tabela, classificando-as pelo maior tempo de foco, e formata os totais de tempo para fácil leitura.

---

