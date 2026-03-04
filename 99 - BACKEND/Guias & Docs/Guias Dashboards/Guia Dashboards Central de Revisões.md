
### 🏆 Destaques do Período

#### Para que serve

Esta seção exibe os recordes e os momentos mais marcantes do intervalo de tempo que você selecionou na Central de Revisões. De forma rápida e visual, ela aponta os dias de pico de performance, bem-estar e também os de maior estresse, oferecendo um resumo dos seus "altos e baixos".

Os destaques incluem:
*   **Dia de Ouro:** O dia em que você mais acumulou XP.
*   **Pico de Foco:** O dia com o maior tempo de foco produtivo registrado.
*   **Pico de Paz:** O dia com a maior pontuação de "paz de espírito", representando seu dia mais tranquilo.
*   **Vale de Estresse:** O dia com a menor pontuação de "paz de espírito", indicando um possível pico de estresse.
*   **Recuperação Máxima:** O dia em que você mais registrou tempo em pausas e descansos.

#### Como funciona

O script analisa todos os arquivos de log diário processados que estão dentro do período definido no dashboard. Para cada dia, ele lê as métricas principais: XP total, tempo de foco (em segundos), tempo de pausa (em segundos) e a pontuação de "paz de espírito".

Em seguida, ele compara os valores de todos os dias para encontrar as datas em que os recordes de cada categoria foram batidos (o maior valor para a maioria das métricas e o menor para o "Vale de Estresse"). A data é extraída diretamente do nome do arquivo para garantir precisão e evitar problemas com fusos horários. Por fim, os resultados são exibidos em cartões, cada um representando um recorde do período.

---

### Aprimoramentos Pendentes

**Para que serve:**

Esta seção funciona como um "lembrete inteligente" para todas as pequenas melhorias e ajustes que você se propôs a fazer, mas que ainda estão pendentes. Ela centraliza suas tarefas de aprimoramento, garantindo que nenhuma boa ideia de otimização se perca com o tempo.

**Como funciona:**

O script busca automaticamente em suas notas diárias (`01 - Registros/01. Daily`) dentro do período de tempo selecionado na dashboard. Ele identifica todas as tarefas que não foram marcadas como concluídas e que contêm a tag `#aprimoramento`. Em seguida, exibe uma lista organizada com esses itens, do mais antigo para o mais recente, para que você possa priorizar suas ações. Se nenhuma tarefa for encontrada, ele te parabeniza por manter tudo em dia

---

### Tempo Gasto com Eles e Eu

#### Para que serve
Este gráfico oferece uma visão clara sobre a alocação do seu tempo produtivo, diferenciando as atividades dedicadas aos seus próprios projetos e objetivos (Eu) daquelas dedicadas a demandas de outros (Eles). O objetivo é ajudar a visualizar e equilibrar onde sua energia está sendo investida.

- **Visão de Volume (gráfico de colunas):** Mostra a distribuição diária total do seu tempo entre "Soberania Interna (Eu)", "Soberania Externa (Eles)" e o tempo "Neutro / Manutenção" (o restante das 24 horas). Ideal para entender a magnitude do foco em dias específicos.
- **Visão de Tendência (gráfico de linhas):** Exibe a evolução do tempo gasto em cada tipo de soberania ao longo do período, permitindo identificar padrões e mudanças de comportamento.

#### Como funciona
O gráfico analisa os arquivos de log diário (`99 - BACKEND/Logs_Metricas/Daily/`) no intervalo de datas selecionado na dashboard. Ele busca por todas as sessões de trabalho finalizadas (`sessao_fim::WORK`) e soma suas durações (`duracao_total_sessao_segundos::`).

A classificação é feita com base na anotação `soberania::` presente na mesma linha do log da sessão:
- **Soberania Interna (Eu):** Soma do tempo de sessões marcadas com `(soberania:: interna)`.
- **Soberania Externa (Eles):** Soma do tempo de sessões marcadas com `(soberania:: externa)`.

---

### Análise de Foco & Pausa

**Para que serve?**

Este gráfico oferece uma visão clara da sua dedicação diária ao trabalho focado e às pausas. Ele permite que você visualize e compare quantos minutos foram investidos em sessões de "Foco" versus sessões de "Pausa" ao longo do período selecionado na Central de Revisões. O objetivo é ajudá-lo a entender seu ritmo de trabalho, sua consistência e o equilíbrio entre esforço e recuperação.

**Como funciona?**

O script opera de forma automatizada com base no intervalo de datas que você define no dashboard:
1.  Ele identifica as datas de início e fim selecionadas.
2.  Para cada dia nesse período, ele lê o arquivo de log correspondente na pasta `99 - BACKEND/Logs_Metricas/Daily`.
3.  Dentro de cada log, ele procura por registros de fim de sessão (`sessao_fim::WORK` para foco e `sessao_fim::BREAK` para pausa).
4.  Ele extrai a duração de cada uma dessas sessões, soma os minutos totais para "Foco" e "Pausa" em cada dia, e plota os resultados no gráfico.

---

### Alocação de Foco


#### Para que serve?
Este gráfico oferece uma visão clara de como seu tempo de foco produtivo foi distribuído entre as principais áreas da sua vida (Projetos, Mídias, Estudos e Saúde). Ele serve para que você possa avaliar rapidamente se a sua dedicação de tempo está alinhada com suas prioridades e metas para o período, permitindo identificar desequilíbrios e ajustar seu planejamento.

#### Como funciona?
O script analisa todos os logs diários registrados dentro do intervalo de datas selecionado na Central de Revisões. Ele identifica todas as sessões de trabalho (`sessao_fim::WORK`) concluídas, extrai a duração de cada uma e as agrupa em categorias com base na tag associada à atividade (`#projeto/`, `#midia/`, `#exercicio/`). Por fim, ele soma o tempo total de cada categoria e exibe os dados em um gráfico de pizza ou de barras, mostrando a proporção do seu foco que cada área consumiu.

---

### Performance & XP (Gamificação)

#### Para que serve?
Este gráfico oferece uma visão clara sobre o seu ganho de "Pontos de Experiência" (XP) ao longo de um período selecionado. Ele serve para gamificar e quantificar seu progresso em três pilares centrais da sua vida:
- **Vitalidade (Saúde):** Esforços relacionados ao bem-estar físico.
- **Intelecto (Gênio):** Atividades de aprendizado e desenvolvimento mental.
- **Espírito (Paz):** Ações que promovem equilíbrio emocional e paz interior.

Com ele, você pode rapidamente identificar tendências, analisar a distribuição do seu foco e ver o impacto acumulado de suas atividades diárias. O gráfico possui dois modos de visualização para diferentes tipos de análise: um para volume total (Área) e outro para comparação direta (Colunas).

#### Como funciona?
O script opera de forma dinâmica com base no intervalo de datas (`start_date` e `end_date`) definido na dashboard "Central de Revisões".

1.  **Leitura de Dados:** Ele percorre cada dia do período selecionado e procura por um arquivo de métrica correspondente (ex: `2024-01-15_metrics.md`) na pasta `99 - BACKEND/Logs_Metricas/Daily/Processed`.
2.  **Extração de XP:** De cada arquivo encontrado, o script extrai os valores numéricos das chaves `xp_saude`, `xp_genio` e `xp_paz_espirito`.
3.  **Visualização:** Os dados de XP de cada dia são plotados no gráfico. O seletor `view_mode` no painel da dashboard permite alternar a exibição:
    *   **`area` (Acumulado):** Modo padrão, mostra um gráfico de área empilhado. É ideal para entender o volume total de XP ganho por dia e a contribuição de cada pilar para esse total.
    *   **`column` (Comparativo):** Exibe um gráfico de colunas agrupadas, onde as barras de cada pilar são colocadas lado a lado. É perfeito para comparar diretamente o foco dado a cada área em dias específicos.

Se nenhum dado de XP for encontrado no período, o gráfico exibirá uma mensagem informativa.

---

### Bio-Ritmo Emocional


#### Para que serve?

Este gráfico oferece uma visão integrada do seu estado emocional e energético ao longo do tempo. Ele permite que você visualize a relação entre seu "estado geral" (níveis de energia e humor registrados diariamente) e "eventos emocionais" específicos (momentos de felicidade, estresse ou tristeza que você logou).

O objetivo é identificar padrões. Por exemplo, você pode perceber que dias com múltiplos registros de "estresse" consistentemente resultam em uma queda no seu nível de energia no dia seguinte, ou que um pico de energia está associado a um humor mais elevado.

#### Como funciona?

O gráfico combina duas fontes de dados em uma única visualização de eixo duplo:

1.  **Linhas (Eixo Esquerdo):** Representam os seus níveis de **Energia** e **Humor** em uma escala de 0 a 100. Esses dados são extraídos automaticamente dos campos `energia_geral_dia_calculada` e `humor_geral_dia_calculado` das suas notas diárias no período selecionado. O humor, originalmente em uma escala de 1 a 5, é normalizado para a escala de 0 a 100 para comparação.

2.  **Barras Empilhadas (Eixo Direito):** Representam a contagem de **eventos emocionais** específicos que você registrou. O script lê um arquivo de log central (`99 - BACKEND/Logs_Metricas/Saude/Emocoes/raw_logs.md`) e conta, para cada dia, quantas vezes as tags `#log_felicidade`, `#log_estresse` e `#log_tristeza` aparecem. Isso permite visualizar a frequência e a intensidade dos seus picos emocionais.

---

### Insights & Criatividade

**Para que serve**

Este gráfico oferece uma visão clara do seu volume de produção intelectual e criativa ao longo do tempo. Ele permite que você identifique padrões e entenda em que dias ou sob quais circunstâncias você tende a gerar mais ideias, reflexões, aprendizados a partir de erros e conquistas pessoais. O objetivo é visualizar sua cadência de insights.

**Como funciona**

O script analisa automaticamente as suas notas diárias localizadas em `99 - BACKEND/Logs_Metricas/Daily` dentro do período de tempo selecionado na Central de Revisões. Ele busca e conta a quantidade de vezes que as seguintes tags foram utilizadas em cada arquivo diário:
- `#ideia`
- `#reflexao`
- `#aprendizado_erro`
- `#win`

O resultado é um gráfico (de colunas ou linhas) que exibe o total de ocorrências para cada categoria por dia, permitindo uma análise visual da sua atividade criativa e de aprendizado. Se nenhum registro for encontrado, o gráfico informará que não há dados.

---

### Saúde & Bem-Estar

#### Para que serve?

Este gráfico oferece uma visão integrada da sua saúde física, cruzando a qualidade do seu sono com seus hábitos alimentares. Ele permite que você identifique rapidamente correlações entre como você dorme e o que você come.

- A **linha roxa** representa a qualidade do seu sono em uma escala de 0 a 100%.
- As **barras empilhadas** mostram o número de refeições "boas" (verdes) e "ruins" (vermelhas) que você registrou a cada dia.

Use este gráfico para entender como uma noite mal dormida pode afetar suas escolhas alimentares no dia seguinte, ou como uma alimentação melhor pode estar contribuindo para um sono mais reparador.

#### Como funciona?

O gráfico combina dados de duas fontes distintas para gerar a visualização:

1.  **Qualidade do Sono (Linha):**
    - **Fonte Principal:** O gráfico busca a métrica `qualidade_sono_calculada` nos arquivos de métricas processadas (`/99 - BACKEND/Logs_Metricas/Daily/Processed/`). Este é um valor objetivo gerado por um processo automático.
    - **Alternativa (Fallback):** Se o dado processado não for encontrado, ele utiliza a nota de `sono_qualidade_percebida` que você preenche na sua nota diária, multiplicando por 10 para converter para uma escala percentual.

2.  **Nutrição (Barras):**
    - O sistema lê um único arquivo de log (`/99 - BACKEND/Logs_Metricas/Saude/Nutricao/raw_logs.md`).
    - Ele conta, para cada dia do período selecionado, quantas linhas contêm a tag `#refeicao_boa` e quantas contêm `#refeicao_ruim`.

O gráfico é dinâmico e exibe os dados correspondentes ao intervalo de datas (`start_date` e `end_date`) definido no painel da Central de Revisões.

---

### Consistência de Hábitos (Visão do Período)

**Para que serve**

Esta seção oferece uma visão clara da sua consistência em manter hábitos durante o intervalo de tempo selecionado na Central de Revisões. Ela permite avaliar rapidamente quais hábitos estão bem estabelecidos (alta aderência) e quais precisam de mais atenção (baixa aderência), ajudando você a focar seus esforços de melhoria.

**Como funciona**

O script opera em três etapas principais para gerar a tabela de consistência:

1.  **Leitura do Período e Hábitos:** Primeiro, ele identifica as datas de início e fim que você definiu no dashboard. Em seguida, ele localiza todas as suas páginas de definição de hábitos para saber o que monitorar.

2.  **Contagem de Sucessos:** O script analisa seus logs diários, dia a dia, dentro do período selecionado. Para cada hábito, ele verifica se foi concluído:
    *   **Hábitos Binários (Sim/Não):** Procura por uma tag específica de conclusão (`#habito_concluido`).
    *   **Hábitos Numéricos (Contadores):** Soma todos os valores registrados para o hábito no dia (ex: litros de água, páginas lidas) e verifica se a soma atingiu a meta diária definida para aquele hábito.

3.  **Cálculo da Aderência:** Com base na frequência de cada hábito (diária, semanal, mensal), o script calcula a meta de dias de sucesso esperada para o período. Por fim, ele compara o número de dias que você realmente completou o hábito com essa meta, gerando um percentual de aderência e um ícone de status (🟢, 🟡, 🔴, 💀) para uma avaliação visual instantânea.

---

### 💎 Análise Qualitativa

**Para que serve:**

Esta seção oferece um resumo das suas reflexões qualitativas, coletadas ao longo do tempo. Ela consolida suas **conquistas** (momentos de sucesso e gratidão) e **aprendizados** (lições tiradas de erros) registrados nos seus logs diários. É a ferramenta ideal para revisar o que deu certo, o que deu errado e, mais importante, o que você aprendeu com cada situação, tudo isso dentro do período de tempo que você selecionar na dashboard.

**Como funciona:**

O script funciona lendo dois arquivos de log centralizados no seu vault:

1.  `raw_logs.md` de "Wins" para as conquistas.
2.  `raw_logs.md` de "Erros" para os aprendizados.

Ele filtra as linhas de cada arquivo para encontrar apenas os registros que estão dentro do intervalo de `start_date` e `end_date` definidos na página. Para cada registro encontrado, o script extrai o conteúdo da reflexão e cria um link direto para a nota diária correspondente, permitindo que você acesse o contexto original com um único clique. Por fim, exibe os resultados em duas tabelas separadas: "Conquistas" e "Aprendizados".

---

### 🔬 Análise de Performance de Foco

**Para que serve?**

Esta seção oferece uma visão detalhada sobre a qualidade do seu foco ao longo do tempo. Ela foi projetada para ajudar você a identificar:
- **Seus horários de pico:** Descubra em quais momentos do dia sua concentração é mais alta ou mais baixa.
- **Padrões de distração:** Veja quais são os "ruídos" (interrupções, pensamentos, etc.) que mais quebram seu foco.
- **Gatilhos de "Flow":** Entenda o que te ajuda a entrar em estado de alta concentração e produtividade.
- **Tarefas problemáticas:** Identifique rapidamente as atividades onde seu foco foi baixo, permitindo uma análise mais aprofundada.

Com essas informações, você pode tomar decisões mais inteligentes para organizar seu dia, proteger seu tempo e criar um ambiente de trabalho mais eficaz.

**Como funciona?**

O gráfico e as tabelas são gerados automaticamente a partir dos seus logs diários, especificamente das sessões de trabalho (`sessao_fim::WORK`) que você avaliou no período selecionado.

1.  **Coleta de Dados:** O script lê todos os arquivos de log diário (`99 - BACKEND/Logs_Metricas/Daily/AAAA-MM-DD.md`) dentro do intervalo de datas que você definiu na página.
2.  **Extração de Métricas:** Para cada sessão de trabalho finalizada, ele extrai a nota de foco, a duração, o horário, a tarefa, e os motivos de "ruído" ou "flow" registrados.
3.  **Visualização:**
    *   **Matriz de Foco (Gráfico de Dispersão):** Cada bolha no gráfico representa uma sessão de trabalho. A posição no eixo horizontal indica a *hora do dia*, a posição vertical indica a *nota de foco*, o *tamanho* da bolha representa a *duração* da sessão, e a *cor* mostra se a tarefa foi iniciada por você (`Interna`) ou por outros (`Externa`).
    *   **Listas de Sucesso e Falha:** As listas "Principais Ruídos" e "Gatilhos de Flow" contam e classificam os motivos que você mais registrou para distrações e para momentos de alta concentração.
    *   **Tabela de Análise:** A tabela "Análise de Falhas" exibe as sessões mais recentes com nota de foco baixa (menor ou igual a 6) para que você possa revisar o que deu errado.

---

