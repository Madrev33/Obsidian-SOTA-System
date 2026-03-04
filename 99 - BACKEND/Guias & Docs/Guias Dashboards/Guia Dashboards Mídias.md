
### Detalhes das Sessões


#### Para que serve?

Esta seção oferece um panorama detalhado sobre seu desempenho e eficiência nas sessões de consumo de mídia (como a leitura de um livro). Ela permite que você entenda rapidamente seus hábitos, seu ritmo e sua consistência.

Use estes dados para avaliar:
- O tempo total que você dedicou ao foco e às pausas.
- Sua constância
- O equilíbrio entre o esforço (foco) e a recuperação (pausas).

#### Como funciona?

O script lê e processa os dados brutos de log gerados automaticamente para cada sessão de mídia que você realiza.

1.  **Filtro por Ciclo:** Ele primeiro identifica o ciclo de consumo selecionado no dashboard (ex: "Ciclo 1", "Ciclo 2" ou todos eles na "Visão Agregada").
2.  **Cálculo das Métricas:** Em seguida, ele analisa os logs correspondentes àquele período, somando o tempo total em sessões de trabalho (`WORK`), o tempo em pausas (`BREAK`), e a quantidade de páginas/capítulos únicos finalizados.
3.  **Exibição dos KPIs:** Por fim, ele calcula e exibe as médias e os totais (os "KPIs" ou Indicadores-Chave de Performance), como tempo médio por página e páginas por dia, formatando tudo em uma lista de fácil leitura.

---

### Inteligência Gerada

#### Para que serve?
Analisar quantas Reflexões ou Ideias vc teve durante o consumo dessa Mídia
#### Como funciona?
O Script varre todos os arquivos de anotações dessa mídia e faz o calculo.

---

### KPIs Chave


**Para que serve?**
A seção de KPIs Chave no seu Dashboard de Mídias foi desenvolvida para fornecer uma visão clara e quantificável do seu desempenho e hábitos para a mídia em específico e ciclo selecionado. Ela transforma seus registros brutos em métricas significativas, ajudando você a entender onde seu tempo está sendo investido, sua produtividade e a identificar padrões de estudo ou lazer. Com esses indicadores, você pode avaliar sua eficiência, ritmo e dedicação, auxiliando no planejamento e na otimização de futuras sessões.

**Como funciona?**
Este componente busca e analisa os registros detalhados das suas sessões, que são armazenados em arquivos `raw_logs.md` específicos de cada Mídia. Primeiramente, ele identifica a mídia e o ciclo que você selecionou no dashboard. Em seguida, lê todo o conteúdo do arquivo de log correspondente.

Se um ciclo específico for selecionado, ele filtra os logs para incluir apenas as entradas pertencentes a esse ciclo. Caso contrário, ele considera todos os registros disponíveis (Visão Agregada).

A partir dos logs filtrados, o script extrai informações cruciais como:
*   Tempo total de foco (WORK) e de pausas (BREAK).
*   Número de sessões de foco e de pausas.
*   As datas em que houve atividade da Mídia.

Com esses dados, são calculados diversos KPIs, incluindo:
*   Tempo total e médio de foco e pausas.
*   Média de foco e pausas por dia ativo.
*   A proporção de tempo dedicado à recuperação em relação ao tempo de foco.

Finalmente, todos esses KPIs são apresentados em uma lista concisa e de fácil compreensão no seu dashboard, permitindo uma análise rápida do seu progresso.

---

### Cronograma & Progresso


Esta seção do Dashboard de Mídias é projetada para fornecer uma visão clara e detalhada do **progresso e do cronograma** da sua interação com conteúdos de mídia, como filmes, vídeos, artigos, etc. Ela ajuda você a entender não apenas quando você começou e terminou de consumir um determinado item de mídia, mas também a duração de cada "ciclo" de interação e, em uma visão geral, até o tempo que a mídia ficou "incubando" antes do primeiro consumo.

**Para que serve:**
Esta seção permite acompanhar de perto o tempo dedicado a cada mídia. Você pode visualizar o andamento de um ciclo de consumo específico, como ele começou, se foi concluído ou arquivado, e quanto tempo durou. Além disso, a visão agregada oferece um histórico completo de todos os ciclos, revelando padrões de consumo e fornecendo insights sobre o tempo total investido em cada item de mídia. É essencial para quem deseja gerenciar e otimizar seu tempo de estudo ou entretenimento.

**Como funciona:**
O script `renderStatusCicloGenerico.js` busca o ID da mídia atual e o modo de visualização do ciclo selecionado (Visão Agregada ou Ciclo Único).

*   **Visão Agregada (Todos os Ciclos):**
    *   Calcula o "Tempo de Incubação", que é o período desde a criação do registro da mídia até o início do primeiro ciclo de consumo.
    *   Lista todos os ciclos associados à mídia, mostrando a data e hora de início, a data e hora de fim (se concluído ou arquivado), e a duração total de cada ciclo. Se um ciclo estiver em andamento, ele exibe o tempo decorrido até o momento.
*   **Visão de Ciclo Único:**
    *   Exibe informações detalhadas para um ciclo específico (ex: "Ciclo 1", "Ciclo 2").
    *   Mostra o status do ciclo, a data e hora de início, e se ele foi concluído ou arquivado, indicando a data e hora e o tipo de conclusão.
    *   Calcula a duração total do ciclo ou o tempo decorrido se o ciclo ainda estiver ativo.

Utiliza funções auxiliares para formatar datas, horas e calcular durações de forma legível.

---

### Métricas de Sequências

Este painel ajuda você a acompanhar sua consistência e frequência ao interagir com suas mídias (livros, cursos, séries, jogos, etc.). Ele mostra há quantos dias você está ativo(a) continuamente (sua "sequência atual"), qual foi seu melhor período de atividade ininterrupta (seu "recorde de sequência"), quantos dias no total você dedicou a essa mídia e há quanto tempo foi sua última interação. É uma ótima maneira de se manter motivado(a) e visualizar seu engajamento ao longo do tempo.

**Como funciona:**

1.  **Encontra seus registros:** O script primeiro localiza o arquivo de registro de atividades (`raw_logs.md`) da mídia que você selecionou no dashboard. Este arquivo contém todos os seus "WORK" (sessões de trabalho/interação) para aquela mídia.
2.  **Coleta as datas de atividade:** Ele então extrai todas as datas em que você registrou uma sessão de "WORK" para a mídia selecionada. Se você tiver filtrado por um ciclo específico, ele considerará apenas as atividades dentro desse ciclo.
3.  **Calcula as sequências:** Com base nessas datas, o script calcula:
    *   **Sequência Atual:** Quantos dias consecutivos, até hoje, você interagiu com a mídia.
    *   **Recorde de Sequência:** O maior número de dias consecutivos em que você interagiu com a mídia, desde que começou a registrar.
    *   **Total de Dias Ativos:** O número total de dias diferentes em que você teve alguma atividade registrada.
    *   **Dias de Hiato:** Há quantos dias você não registra uma nova atividade para a mídia.
4.  **Exibe os resultados:** Por fim, o painel apresenta essas informações de forma clara, para que você possa entender rapidamente seu padrão de engajamento.

---


### Sequência Visual (Mensal)

**Para que serve?**

A seção "Sequência Visual (Mensal)" oferece uma representação gráfica da sua consistência e engajamento com uma mídia específica (como um livro, curso, série, etc.) ao longo do tempo. Ela exibe um "gráfico de contribuição" onde cada dia é colorido de acordo com o número de "sessões de foco" que você dedicou àquela mídia. Isso permite que você visualize rapidamente seus padrões de estudo ou consumo, identifique períodos de alta atividade ou lacunas, e acompanhe sua dedicação de forma intuitiva. Você pode filtrar a visualização por ciclos específicos e ajustar o período (semanal, mensal ou anual) para uma análise mais detalhada da sua "sequência".

**Como funciona?**

1.  **Identificação da Mídia:** O script começa identificando a mídia que você selecionou no dashboard e o ciclo de estudo/consumo em que você está.
2.  **Localização dos Registros:** Em seguida, ele localiza o arquivo de `raw_logs.md` associado àquela mídia específica, onde todas as suas sessões de foco são registradas.
3.  **Processamento dos Dados:** Ele lê cada linha do arquivo de log. Para cada sessão de foco encontrada, o script extrai a data e, se um ciclo estiver selecionado, filtra as sessões para incluir apenas aquelas pertencentes ao ciclo escolhido. Ele então contabiliza o número de sessões por dia.
4.  **Ajuste do Período:** De forma inteligente, o script determina o período de visualização do gráfico (semana, mês ou ano) com base na data da sua última sessão registrada, garantindo que o gráfico sempre mostre os dados mais relevantes.
5.  **Renderização do Gráfico:** Com os dados processados, o script configura e renderiza um gráfico de contribuição. A intensidade da cor de cada "célula" (dia) no gráfico reflete a quantidade de sessões de foco que você teve naquele dia, variando de tons mais claros para poucas sessões a tons mais escuros (ou ícones específicos) para um grande número de sessões. Ao passar o mouse sobre cada dia, você pode ver o número exato de sessões.


---

### Foco Diário

Este gráfico é uma ferramenta essencial para visualizar como o seu tempo de "Foco" e "Pausa" foi distribuído diariamente em uma mídia específica (livro, curso, série, etc.). Ele oferece uma visão clara do seu desempenho, ajudando você a identificar padrões, picos de produtividade ou períodos de menor dedicação. Você pode alternar entre uma exibição em linhas ou colunas e também filtrar os dados por um "Ciclo" específico, se desejar analisar apenas um período determinado. É perfeito para quem busca otimizar a gestão do tempo e entender o próprio ritmo de aprendizado ou consumo de conteúdo.

#### Como funciona

1.  **Identificação da Mídia:** Primeiramente, o script verifica qual mídia está atualmente selecionada no seu dashboard e qual o "Ciclo" (se houver) você escolheu para análise.
2.  **Localização dos Dados:** Com base na mídia selecionada, ele determina o tipo (por exemplo, "Livros", "Cursos") e encontra o arquivo de log correspondente (`raw_logs.md`) onde todas as suas sessões de foco e pausa são registradas.
3.  **Processamento e Filtragem:** O conteúdo desse arquivo de log é lido linha a linha. O script identifica e extrai informações sobre a data, a duração (em segundos) e o tipo de sessão (Foco/WORK ou Pausa/BREAK). Se você selecionou um ciclo específico, apenas as sessões desse ciclo são consideradas.
4.  **Agregação Diária:** Para cada dia, o tempo total de "Foco" e "Pausa" é somado separadamente.
5.  **Formatação para o Gráfico:** Os tempos totais (em segundos) são convertidos para minutos, para uma visualização mais clara no eixo Y do gráfico.
6.  **Geração do Gráfico:** Com os dados processados, o script gera um código YAML que o plugin `chartsview` do Obsidian utiliza para renderizar o gráfico. Ele configura todos os detalhes visuais, como o tipo de gráfico (linha ou coluna), cores para "Foco" e "Pausa", títulos e um tooltip interativo que mostra a duração exata das sessões no formato HH:mm:ss ao passar o mouse. Se não houver dados para a mídia ou ciclo selecionado, uma mensagem informando a ausência de dados é exibida.

---


### Padrões de Horários

#### Para que serve?

Esta seção oferece uma análise visual dos seus hábitos de foco ao longo do dia para uma mídia específica (como um livro, curso, série, etc.). Ela mostra em quais horários você tende a ter mais ou menos foco, ajudando a identificar seus padrões cronobiológicos de produtividade.

Use este gráfico para:
-   Descobrir seus horários de pico de concentração.
-   Planejar suas sessões de estudo ou consumo de conteúdo nos momentos em que você é mais eficiente.
-   Entender se o horário do dia influencia sua duração média de foco.

#### Como funciona?

O script `renderChartHorarios.js` analisa seus registros de sessões de foco (WORK) para uma mídia específica, agregando o tempo dedicado a cada hora do dia.

1.  **Seleção da Mídia e Ciclo:** Ele primeiramente verifica qual mídia e ciclo (se houver) foram selecionados no dashboard.
2.  **Localização dos Logs:** Em seguida, ele encontra o arquivo `raw_logs.md` correspondente à mídia selecionada.
3.  **Processamento dos Dados:** O script lê linha por linha os logs e:
    *   Filtra as sessões de foco pelo ciclo, se um ciclo específico for escolhido.
    *   Extrai a hora do dia (`log_time`) e a duração total da sessão em segundos (`duracao_total_sessao_segundos`).
    *   Acumula o total de segundos de foco e a contagem de sessões para cada hora do dia (0 a 23).
4.  **Cálculo da Média:** Para cada hora, ele calcula a média de tempo de foco por sessão, convertendo-a para minutos.
5.  **Renderização do Gráfico:** Com base nesses dados, o script gera um gráfico de colunas ou linhas (dependendo do `view_mode_horarios` configurado), onde o eixo X representa a hora do dia e o eixo Y mostra a duração média do foco em minutos. Um tooltip detalhado permite visualizar a duração exata no formato HH:mm:ss. Se não houver dados ou logs processados, uma mensagem indicando a ausência de padrões é exibida.


---


### Quantidade Diária (Páginas/Aulas/Missões)

**Para que serve:**
Este gráfico exibe o seu progresso diário no consumo de uma mídia específica, como livros, cursos, séries ou jogos. Ele permite que você visualize a "velocidade" com que você avança, mostrando quantas páginas leu, aulas assistiu, episódios viu ou missões completou em cada dia. É uma ferramenta excelente para acompanhar seu ritmo, identificar picos de produtividade e manter-se motivado.

**Como funciona:**
O gráfico identifica a mídia selecionada no seu dashboard e verifica o seu tipo (livro, curso, série, etc.). Com base nisso, ele busca os registros detalhados de seu consumo nos arquivos de log (`raw_logs.md`) associados àquela mídia. Ele processa cada registro, extraindo a data do consumo e a unidade específica (página, aula, episódio, missão). Para garantir a precisão, o sistema conta apenas unidades *únicas* consumidas por dia, mesmo que você revisite o mesmo conteúdo várias vezes no mesmo dia ou ciclo. Se um "ciclo" específico (por exemplo, uma releitura de um livro ou um rewatch de uma série) for selecionado, o gráfico filtrará os dados para mostrar apenas o progresso daquele ciclo. No final, ele organiza esses dados por dia e os apresenta em um gráfico de linhas ou colunas, mostrando sua quantidade diária de consumo.


---

### Distribuição (Capítulos/Fases)

#### Para que serve?

Esta seção do dashboard oferece uma visão clara e objetiva de como o seu tempo está sendo distribuído entre as diferentes unidades de uma mídia que você está consumindo, seja ela um livro, curso, série, jogo, etc.

-   **Livros, Artigos, Documentações:** Mostra o tempo investido em cada capítulo ou seção.
-   **Cursos, Séries, Documentários, Podcasts:** Detalha o tempo dedicado a cada módulo ou temporada.
-   **Jogos:** Apresenta a distribuição do tempo por missão.

Com este gráfico, você pode rapidamente identificar onde concentrou mais seu esforço, acompanhar seu progresso e entender melhor seus padrões de consumo e estudo. Ele pode ser visualizado tanto como um gráfico de pizza (para proporções) quanto como um gráfico de barras (para comparação direta de tempo).

#### Como funciona?

O sistema identifica o tipo de mídia selecionada (por exemplo, livro, curso, série). A partir daí, ele acessa os registros de atividade (`raw_logs.md`) específicos para aquela mídia. Ele lê cada linha desses registros, filtrando as entradas que marcam o "fim de uma página" ou o "fim de uma sessão", dependendo do tipo de mídia.

Para cada registro relevante, o script extrai:
1.  A unidade correspondente (ex: número do capítulo, módulo, temporada ou missão).
2.  A duração do tempo gasto naquela unidade.

Após coletar esses dados, ele soma o tempo total para cada unidade e calcula a porcentagem que cada uma representa do tempo total da mídia. Esses dados são então utilizados para gerar o gráfico (pizza ou barras) que você visualiza no dashboard, com um tooltip personalizado para mostrar o tempo em horas, minutos e segundos. Se um ciclo de estudo for selecionado, os dados serão filtrados apenas para aquele ciclo específico.

---

