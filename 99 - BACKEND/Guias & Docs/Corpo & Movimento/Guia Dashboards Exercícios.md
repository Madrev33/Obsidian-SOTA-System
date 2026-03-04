
### 📏 Histórico de Medidas Corporais

**Para que serve:**
Este componente exibe uma tabela com todo o seu histórico de medições corporais. Ele permite que você visualize sua evolução ao longo do tempo, comparando medidas como peso, IMC, RCQ e circunferências de várias partes do corpo.

**Como funciona a lógica:**
O script lê o arquivo `99 - BACKEND/Logs_Metricas/Exercicios/body_measures_log.md`. Cada linha de log registrada com uma data `(data:: ...)` é processada para extrair os valores de cada medida (ex: `peso_kg`, `cintura_cm`). Os dados são então organizados em uma tabela e, ao final, uma linha de **Média** é calculada e adicionada para resumir seus resultados.

---

### 🏆 KPIs de Eficiência de Força

**Para que serve:**
Este painel centraliza seus recordes pessoais (RPs) de força para os exercícios mais importantes, como Agachamento, Supino e Levantamento Terra. Ele oferece uma visão clara da sua força máxima estimada (1RM) e da sua força relativa (quantas vezes você levanta seu próprio peso corporal), permitindo avaliar seu progresso de potência de forma objetiva.

**Como funciona a lógica:**
O script analisa os logs de treino na pasta `99 - BACKEND/Logs_Metricas/Exercicios` para encontrar sua melhor série (carga vs. repetições) em cada exercício-chave. Com base nisso, ele estima seu 1RM usando a fórmula Brzycki. Em paralelo, ele busca seu peso corporal mais próximo à data do recorde no arquivo `body_measures_log.md` e, por fim, calcula a Força Relativa, exibindo tudo em uma tabela.

---

### 🔬 Diagnóstico por Exercício

**Para que serve:**
Esta tabela oferece um resumo completo do seu desempenho em cada exercício. Ela permite analisar o volume total levantado, a frequência com que você treina, o esforço percebido (RPE) e a qualidade da execução. Use-a para identificar seus pontos fortes, exercícios negligenciados e monitorar sua evolução ao longo do tempo.

**Como funciona a lógica:**
O script varre todos os arquivos de log (`raw_logs.md`) na pasta `99 - BACKEND/Logs_Metricas/Exercicios`. Para cada exercício, ele soma o volume (carga x repetições) e calcula as médias de esforço e qualidade. As informações sobre o grupo muscular e o nome do exercício são buscadas nos manuais correspondentes (`04 - Corpo & Movimento/01 - Exercícios Físicos/01. Manual/Exercícios`). O resultado é a tabela final, consolidando todas as métricas para diagnóstico.

---

### 🎯 KPIs do Dia

**Para que serve:**
Este card oferece um resumo rápido dos seus principais indicadores de desempenho do treino do dia atual. Ele consolida métricas essenciais como o volume total (kg), a duração completa do treino, o tempo sob tensão e o tempo de descanso, permitindo uma avaliação imediata do seu esforço.

**Como funciona a lógica:**
O script lê o arquivo de log do dia corrente, localizado em `99 - BACKEND/Logs_Metricas/Daily/`. Ele busca por todas as séries de exercício e pausas registradas, soma os valores de volume (carga x repetições) e a duração de cada uma. Ao final, exibe os totais consolidados e a proporção entre descanso e atividade.

---

### 🏋️‍♂️ Resumo por Exercício (Hoje)

**Para que serve:**
Este componente agrupa todas as séries de exercícios que você registrou no dia, criando um resumo prático para cada um. Ele mostra o total de séries, o volume de carga (para musculação), a distância (para cardio) ou o tempo (para isometria), além da sua percepção de esforço (RPE) e da qualidade da execução. É uma forma rápida de ver o trabalho total feito em cada exercício no dia.

**Como funciona a lógica:**
O script lê o arquivo de log do dia atual, localizado em `99 - BACKEND/Logs_Metricas/Daily/`. Ele procura por todas as linhas que marcam o fim de uma sessão de exercício (`sessao_fim::WORK` com a tag `#exercicio/`). Em seguida, ele soma as séries e calcula os totais de volume, distância ou tempo para cada exercício único, exibindo tudo em uma tabela consolidada.

---

### 🧬 Snapshot Corporal

**Para que serve:**
Este card oferece um resumo visual rápido das suas últimas medidas corporais. Ele exibe seu peso, IMC e cintura, além de emitir um alerta colorido se seus dados estiverem desatualizados, incentivando um acompanhamento regular para manter sua saúde em dia.

**Como funciona a lógica:**
O script lê o arquivo de log `99 - BACKEND/Logs_Metricas/Exercicios/body_measures_log.md`, encontra a última medição registrada e exibe os valores. Ele compara a data do registro com a data atual para colorir o aviso, que se torna amarelo após 7 dias e vermelho após 14 dias.

---

### 📜 Log Detalhado de Séries (Hoje)

**Para que serve:**
Este componente exibe um registro cronológico detalhado de cada série de exercício e período de descanso realizados no dia. Ele adapta as colunas para mostrar as métricas mais importantes, seja para treino de força (carga e reps), cardio (distância e ritmo) ou isometria (duração do esforço).

**Como funciona a lógica:**
O script lê o arquivo de log do dia correspondente na pasta `99 - BACKEND/Logs_Metricas/Daily/`. Ele busca por todas as linhas que marcam o fim de uma sessão de esforço (`WORK`) ou descanso. Em seguida, extrai os detalhes de cada registro, como horário, duração, e métricas específicas (kg, reps, distância, etc.). Por fim, organiza tudo em uma tabela que se ajusta dinamicamente ao tipo de exercício, garantindo que você veja sempre a informação mais relevante.

---

### 🎯 KPIs Agregados

**Para que serve:**
Este painel oferece uma visão geral do seu histórico completo de treinos. Ele resume o volume total levantado, sua frequência média de treinos por semana, a duração média de suas sessões e o tempo acumulado sob tensão e em descanso. É a forma mais rápida de avaliar sua performance e consistência ao longo do tempo.

**Como funciona a lógica:**
O script varre todos os arquivos de log (`raw_logs.md`) localizados na pasta `99 - BACKEND/Logs_Metricas/Exercicios`. Ele soma os valores de volume (`carga * repetições`), tempo sob tensão e descanso de cada registro. Com base nas datas únicas de treino, calcula a frequência semanal e a duração média por sessão para exibir os KPIs consolidados.

---

### 🧬 Snapshot de Variação Corporal

**Para que serve:**
Este painel mostra um resumo rápido das mudanças em seu peso, cintura e peitoral nos últimos 90 dias. Ele serve para dar uma visão clara e direta do seu progresso físico, destacando as variações totais no período.

**Como funciona a lógica:**
O script analisa o arquivo `body_measures_log.md` na pasta de logs. Ele compara a primeira e a última medição registradas nos últimos 90 dias para calcular a variação de peso (kg), cintura (cm) e peitoral (cm), exibindo cada uma em um cartão. Ele também informa há quantos dias foi feita a última medição.

---

### 🧬 Tendências Corporais de Longo Prazo

**Para que serve:**
Este gráfico mostra a evolução do seu peso (kg), cintura (cm) e peitoral (cm) ao longo do tempo. Ele permite visualizar as tendências da sua composição corporal, ajudando a entender se suas medidas estão aumentando, diminuindo ou se mantendo estáveis com base nos logs registrados.

**Como funciona a lógica:**
O script lê o arquivo `body_measures_log.md` para encontrar todos os registros de medidas. Ele extrai os valores de cada data e os organiza em um gráfico de linhas, onde cada métrica é representada por uma cor diferente para facilitar a comparação visual da sua progressão.

---

### 📊 Volume por Grupo Muscular

**Para que serve?**
Este gráfico exibe a evolução do seu volume total de treino (tonelagem) para um grupo muscular específico. Ele permite visualizar sua progressão de força ao longo do tempo, mostrando o total de carga levantada (peso x repetições) a cada dia de treino para aquela área do corpo.

**Como funciona a lógica?**
O script identifica o grupo muscular definido na página atual. Em seguida, busca todos os exercícios associados a este grupo no seu manual. Ele analisa os logs de treino de cada um desses exercícios, calcula o volume de cada série (carga x repetições) e soma o total por dia. Por fim, exibe um gráfico de linha com a tonelagem diária acumulada para o grupo muscular em questão.

---

### 📈 Progressão de Carga por Exercício

**Para que serve:**
Este gráfico interativo permite visualizar a evolução da sua força em um exercício específico ao longo do tempo. Ele exibe duas linhas importantes: a **Carga Máxima** (o maior peso levantado no dia) e o **1RM Estimado** (a carga teórica máxima para 1 repetição, calculada via fórmula de Brzycki). Isso ajuda a distinguir quando você aumentou a carga bruta de quando você ficou mais forte (mais reps com a mesma carga).

**Como funciona a lógica:**
1.  **Seleção:** O botão "🔎 Selecionar Exercício" usa o QuickAdd para abrir uma lista dos seus exercícios cadastrados no Manual e atualizar o frontmatter da dashboard com sua escolha (`exercicio_selecionado`).
2.  **Busca Inteligente (Sharding):** O script localiza o arquivo de log histórico do exercício escolhido. Como os logs são organizados em pastas por grupo muscular (ex: `Logs/Peitoral/Supino`), o script faz uma varredura hierárquica para encontrar o caminho correto automaticamente.
3.  **Processamento:** Ele lê todo o histórico, filtra a melhor série de cada dia (maior carga) e calcula o 1RM estimado se as repetições forem menores que 12 (para precisão estatística).
4.  **Renderização:** Os dados são passados para o plugin `ChartsView`, que desenha um gráfico de linhas comparativo, permitindo ver a correlação entre o peso que você levanta e sua capacidade máxima teórica de força.

---

### 🗓️ Calendários de Consistência

**Para que serve:**
Este gráfico mostra sua consistência de treinos na semana atual. Ele serve como um "check-in" visual rápido, permitindo que você veja de relance em quais dias da semana você realizou um exercício.

**Como funciona a lógica:**
O código analisa os arquivos de log na pasta `Logs_Metricas/Daily`. Para cada dia da semana corrente, ele verifica se existe um registro de treino finalizado (uma sessão de trabalho com a tag `#exercicio`). Se um treino for encontrado, o dia correspondente no calendário é marcado com um "✓" verde.

---

### 📔 Diário do Atleta (Qualitativo)

**Para que serve:**
Este diário é uma timeline inteligente que destaca automaticamente os momentos mais importantes dos seus treinos. Ele exibe suas anotações, alertas de esforço percebido (RPE) muito alto e avisos sobre baixa qualidade técnica na execução, ajudando a monitorar a performance e a prevenir lesões de forma rápida e visual.

**Como funciona a lógica:**
O script busca por arquivos de log (`raw_logs.md`) na pasta `99 - BACKEND/Logs_Metricas/Exercicios` que foram atualizados nos últimos 90 dias. Ele analisa cada sessão de treino finalizada e cria um evento no diário se encontrar: (1) uma anotação de texto, (2) um RPE maior ou igual a 9, ou (3) uma qualidade de forma menor ou igual a 5. Os eventos são organizados por data e recebem cores e ícones para facilitar a identificação.

---

### 🏆 Recordes Pessoais (RPs)

**Para que serve:**
Esta seção exibe seus recordes pessoais (RPs) para um exercício específico. Ele mostra sua melhor marca, seja em distância (para cardio), tempo (para isometria) ou carga/repetições (para musculação), ajudando a visualizar seu progresso.

**Como funciona a lógica:**
O sistema verifica o campo `tipo_metrica` na nota do exercício. Dependendo se o valor é 'distancia', 'tempo' ou outro, ele carrega um script diferente. Esse script então busca e exibe os recordes correspondentes apenas para o exercício em questão, garantindo que os dados sejam sempre relevantes.

---

### 📈 Gráfico de Progressão

**Para que serve:**
Este gráfico visualiza sua evolução em um exercício específico ao longo do tempo. Ele se adapta automaticamente para mostrar seu progresso em distância (para cárdio), tempo (para isometria) ou carga (para musculação), permitindo uma análise clara do seu desenvolvimento.

**Como funciona a lógica:**
O sistema identifica o `tipo_metrica` (distancia, tempo ou reps) definido na página do exercício. Com base nesse tipo, ele carrega dinamicamente o script de gráfico apropriado para renderizar a visualização correta da sua progressão histórica para aquele exercício.

---

### 💪 Gráfico de Esforço vs. Volume

**Para que serve:**
Este gráfico te ajuda a entender a relação entre o **volume total** (quanto peso você levantou no total) e o **esforço percebido** (o quão difícil foi a sessão). Ele permite visualizar se você está ficando mais eficiente, ou seja, levantando mais peso com menos esforço ao longo do tempo.

**Como funciona a lógica:**
O script busca os logs do exercício específico na pasta `99 - BACKEND/Logs_Metricas/Exercicios`. Para cada dia de treino, ele soma o volume total (carga x repetições) e calcula a média do esforço (RPE). Cada ponto no gráfico representa um dia de treino, mostrando a correlação entre essas duas métricas.

---

### 🎯 KPIs Agregados Grupo Muscular

**Para que serve:**
Este painel resume todo o seu histórico de treino para um grupo muscular específico (ex: Peitoral). Ele mostra uma visão geral do volume total levantado, o tempo dedicado, o esforço médio e a qualidade da execução, ajudando a avaliar o estímulo geral aplicado ao músculo ao longo do tempo.

**Como funciona a lógica:**
O script primeiro identifica os exercícios do grupo muscular na pasta `Manual/Exercícios`. Depois, ele busca os registros de treino correspondentes na pasta `Logs_Metricas/Exercicios`. Por fim, ele calcula e agrega os dados de todas as sessões, como volume total (kg), séries, tempo sob tensão e descanso, para exibir um resumo completo.

---

### 📈 Gráfico de Volume ao Longo do Tempo

**Para que serve:**
Este gráfico exibe a evolução do seu volume total de treino de força (conhecido como "tonelagem", que é carga x repetições) para um grupo muscular específico. Ele permite visualizar rapidamente se sua capacidade de trabalho para aquele grupo está aumentando, diminuindo ou se mantendo estável ao longo das semanas e meses. É um indicador chave de progressão de força.

**Como funciona a lógica:**
O script busca os registros de treino de força na pasta de logs (`99 - BACKEND/Logs_Metricas/Exercicios`), ignorando atividades de cardio. Para cada dia, ele soma o volume de todas as séries (carga em kg multiplicada pelas repetições) dos exercícios pertencentes ao grupo muscular em análise e plota o total em um gráfico de linha ao longo do tempo.

---

### 📊 Gráfico de Distribuição de Exercícios

**Para que serve:**
Este gráfico exibe o volume total de treino para cada exercício dentro de um grupo muscular específico. Ele permite visualizar rapidamente quais exercícios têm recebido mais foco, mostrando o volume acumulado (seja em peso total levantado ou em distância percorrida), ajudando a analisar a distribuição do seu esforço.

**Como funciona a lógica:**
O script primeiro identifica todos os exercícios associados ao grupo muscular da página atual. Em seguida, ele lê os registros de treino de cada um desses exercícios, somando o volume de cada sessão (calculado como `carga x repetições` para força ou `distância` para cardio). Por fim, ele gera um gráfico de colunas que organiza os exercícios do maior para o menor volume total.

---

### 📊 Resumo da Sessão (Em Tempo Real)

**Para que serve:**
Este componente oferece um resumo consolidado de todos os exercícios (força, cardio, isometria) registrados na sessão do dia. Ele permite visualizar rapidamente o volume total, a quantidade de séries, a distância percorrida e as médias de esforço (RPE) e qualidade da forma para cada exercício, centralizando os resultados do seu treino.

**Como funciona a lógica:**
O script lê o arquivo de log do dia correspondente na pasta `99 - BACKEND/Logs_Metricas/Daily/`. Ele busca por todas as linhas que marcam o fim de uma série de exercício (`sessao_fim::WORK`), agregando os dados por tipo de exercício. Para exercícios de força, calcula o volume (carga x repetições); para cardio, a distância; e para isometria, a duração. As médias de RPE e qualidade são calculadas e exibidas em uma tabela resumida.

---

