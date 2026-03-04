
### 🏆 Ranking de Aderência Global

**Para que serve**

Esta tabela classifica todos os seus hábitos com base na sua aderência histórica, mostrando quais estão mais consolidados na sua rotina e quais precisam de mais atenção. Ela serve como um termômetro rápido para avaliar sua consistência e direcionar seu foco. O status (🟢, 🟡, 🔴) oferece um diagnóstico visual imediato:

-   🟢 **Verde:** Ótima aderência (acima de 80%).
-   🟡 **Amarelo:** Aderência moderada (entre 50% e 80%).
-   🔴 **Vermelho:** Baixa aderência (abaixo de 50%), requer atenção.

**Como funciona**

O script localiza todos os hábitos definidos no seu vault e, para cada um, lê seu arquivo de log específico para contar o número de dias em que a meta foi atingida. Ele então calcula a meta teórica de execuções com base na frequência do hábito (diária, semanal, etc.) e na sua data de criação.

A porcentagem de "Aderência Histórica" é a relação entre os dias em que o hábito foi cumprido e a meta teórica de execuções. A tabela é ordenada por essa porcentagem, colocando os hábitos de maior sucesso no topo.

---

### 🧠 Matriz de Internalização

#### Para que serve?

Esta matriz oferece uma visão clara e motivacional sobre a consistência dos seus hábitos. Ela ajuda a entender em que estágio de "automatização" cada hábito se encontra, desde o esforço inicial até o ponto em que ele se torna uma parte natural da sua rotina. O objetivo é acompanhar a evolução e celebrar o progresso à medida que os hábitos se tornam mais fortes e internalizados.

#### Como funciona?

O script analisa todos os seus hábitos marcados como "ativos" e lê seus respectivos históricos de conclusão. Para cada um, ele calcula a **sequência atual** (ou *streak*), que é o número de dias consecutivos em que o hábito foi realizado. Uma pequena flexibilidade é aplicada: a sequência não é quebrada se você falhar no dia de hoje, mas tiver realizado o hábito ontem.

Com base na duração dessa sequência, o hábito é classificado em uma das quatro fases de maturação:

*   **🌱 Iniciação (1-6 dias):** O começo da jornada, onde o esforço consciente é maior.
*   **🌿 Resistência (7-20 dias):** A fase crítica, onde a disciplina é testada para formar um padrão.
*   **🌳 Consolidação (21-65 dias):** O hábito começa a se solidificar e a se tornar mais fácil.
*   **💎 Internalizado (66+ dias):** O hábito se tornou automático, exigindo pouco ou nenhum esforço para ser mantido.

A tabela final organiza os hábitos da maior para a menor sequência, mostrando seu progresso visualmente e indicando quantos dias faltam para atingir o próximo nível.

---

### ⚠️ Gestão de Risco

**Para que serve**

Este gráfico de pizza oferece uma visão rápida sobre a "carga cognitiva" dos seus hábitos atuais. Ele ajuda a avaliar se o conjunto de hábitos que você está tentando manter é equilibrado ou se está excessivamente concentrado em desafios de alta dificuldade. O objetivo é permitir uma gestão de risco proativa, evitando o esgotamento (burnout) e o abandono de hábitos por excesso de esforço.

**Como funciona**

O script analisa todos os arquivos de hábitos que estão marcados como "ativos". Ele lê o campo `tier_desafio` de cada hábito para identificar seu nível de dificuldade (ex: "Trivial", "Fácil", "Hardcore"). Em seguida, agrupa e conta quantos hábitos pertencem a cada nível, exibindo a distribuição em um gráfico de pizza. Cada fatia mostra o nome do "tier" e o seu percentual em relação ao total de hábitos. Ao passar o mouse, você pode ver a quantidade exata de hábitos para aquele nível de dificuldade.

---

### ⚙️ Gestão de Hábitos

**Para que serve:**
O componente "Criar Novo Hábito" é um assistente interativo (Wizard) para adicionar novos comportamentos ao sistema. Ele vai além de criar uma nota simples; ele configura toda a infraestrutura necessária para o rastreamento, incluindo metadados de gamificação (XP, Impacto) e a escolha entre hábitos "Binários" (Sim/Não) ou "Contadores" (Quantos copos d'água?).

**Como funciona a lógica:**
O script `criarHabito.js` abre um modal personalizado. Ao preencher os dados, ele executa duas ações críticas:
1.  **Criação da Nota Mestra:** Gera um arquivo `.md` na pasta `07 - Engenharia de Hábitos` usando um template padrão, preenchendo o frontmatter com as configurações escolhidas (ID, Tier de Dificuldade, Meta Numérica).
2.  **Dual Log Setup:** Automaticamente cria a estrutura de pastas oculta em `99 - BACKEND/Logs_Metricas/Habitos/{ID}/raw_logs.md`. Isso garante que, desde o primeiro dia, o sistema tenha um local dedicado para armazenar o histórico de execução desse hábito, permitindo que os gráficos de consistência funcionem imediatamente sem erros de "arquivo não encontrado".

---

### ⚖️ Equilíbrio de Dificuldade

**Para que serve:**
Este gráfico de pizza analisa a "Carga Cognitiva" do seu sistema de hábitos. Ele mostra a distribuição dos seus hábitos ativos categorizados por nível de dificuldade (Trivial, Fácil, Moderado, Desafiador, Hardcore). O objetivo é ajudar você a calibrar sua rotina: muitos hábitos "Hardcore" podem levar à exaustão, enquanto apenas hábitos "Triviais" podem significar estagnação.

**Como funciona:**
O script varre a pasta `07 - Engenharia de Hábitos` em busca de todos os hábitos ativos. Ele extrai o campo `tier_desafio` do frontmatter de cada arquivo (ex: "🏆 Hardcore (100 XP)"), limpa o texto para obter apenas o nome do nível ("Hardcore") e conta quantos hábitos existem em cada categoria. Por fim, calcula as porcentagens e renderiza um gráfico ordenado logicamente do mais fácil para o mais difícil, permitindo uma análise visual rápida do peso da sua rotina.