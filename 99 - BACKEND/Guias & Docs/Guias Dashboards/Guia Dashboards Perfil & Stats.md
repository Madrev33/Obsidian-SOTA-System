
### Radar SOTA

Este gráfico de radar, conhecido como "Radar Tríade Deep Analytics", oferece uma visão profunda e estratégica do seu desempenho e bem-estar geral, refletindo seu "Contexto de Vida" no painel de perfil RPG. Ele analisa os dados dos últimos 7 dias para apresentar um balanço das três áreas fundamentais da sua jornada: **Intelecto** (Eficiência e Foco), **Vitalidade** (Saúde Física e Energia) e **Espírito** (Equilíbrio Emocional e Consistência).

**Para que serve este gráfico/estatísticas?**

O principal objetivo é fornecer um panorama rápido e acionável sobre onde você está prosperando e onde pode haver áreas para otimização. Ele ajuda a identificar tendências, reconhecer picos de alta performance e detectar sinais de alerta em seu ritmo diário. Ao consolidar métricas complexas em três pilares, o radar simplifica a autoanálise e orienta suas decisões para uma vida mais equilibrada e produtiva, alinhada com os princípios de "Max-Efficiency" (Intelecto), "Fasting-Friendly" (Vitalidade) e "Emotional-Fairness" (Espírito).

**Como calcula XP, Atributos, etc.?**

O cálculo do radar é um processo multifacetado que avalia suas ações diárias e as converte em scores para cada atributo, além de gerar um diagnóstico narrativo detalhado.

1.  **Coleta de Dados:** O sistema busca os arquivos de métricas diárias (`YYYY-MM-DD_metrics.md`) dos últimos 7 dias na pasta `99 - BACKEND/Logs_Metricas/Daily/Processed`. Cada arquivo contém informações sobre foco, XP, qualidade de sono, refeições, humor, hábitos, e estados emocionais.

2.  **Cálculo dos Atributos (Score de 0 a 100%):**
    *   **Intelecto (Max-Efficiency):**
        *   Avalia seu tempo de foco (interno e externo) em relação a uma meta diária de 6 horas.
        *   Considera o XP de Gênio diário em comparação com uma meta de 150 XP.
        *   Um "Bônus Cognitivo" é aplicado com base na quantidade de insights gerados e erros registrados, incentivando a reflexão e o aprendizado contínuo.
    *   **Vitalidade (Fasting-Friendly):**
        *   Pondera a qualidade do sono (35%), seu nível médio de energia no dia (25%) e a qualidade da sua nutrição (25%).
        *   A nutrição é calculada com base na proporção de refeições boas e ruins, mas também reconhece e pontua cenários de jejum tático (onde a energia média do dia é um fator chave).
        *   O movimento (15%) é avaliado pelo seu XP de Saúde diário em relação a uma meta de 30 XP.
    *   **Espírito (Emotional-Fairness):**
        *   Analisa seu humor médio diário (40%), interpolando linearmente para refletir o espectro emocional.
        *   Mede sua consistência na aderência aos hábitos (30%).
        *   Calcula um "Saldo Emocional" (30%), onde "vitórias" (wins) e felicidade contribuem positivamente, enquanto estresse e tristeza podem reduzir o score, buscando um equilíbrio emocional justo.

3.  **Médias Finais:** Os scores diários de cada atributo são somados e divididos pelo número de dias em que houve registro de dados (`diasValidos`). Isso garante que a ausência de registro em alguns dias não penalize o score geral.

4.  **Diagnóstico Narrativo:** Após o cálculo dos scores finais, o sistema gera um diagnóstico em texto, classificando cada atributo como "Excelente", "Estável" ou "Crítico". Além disso, oferece insights específicos baseados em tendências dos últimos 7 dias, como "Semana Criativa" por muitos insights, "Alerta: noites mal dormidas" ou "Carga de Estresse presente", fornecendo contexto adicional e sugestões para melhoria.

O resultado é um gráfico visualmente intuitivo que mostra o equilíbrio entre seus atributos, complementado por um diagnóstico textual que detalha os pontos fortes e as áreas que merecem sua atenção.


---


### ⚠️ Carga do Sistema (Burnout)


**Propósito:**
Este painel, inspirado nos princípios de antifragilidade e gestão de carga, serve como um termômetro para a sua "Carga Sistêmica". Ele avalia o equilíbrio entre o esforço que você tem dedicado (carga aguda e crônica) e a sua capacidade de recuperação (integridade física e mental). O objetivo principal é prevenir o burnout, indicando quando você está entrando em uma zona de risco ou quando precisa de mais recuperação, e também sinalizando períodos ótimos de performance e aceleração.

**Como Funciona (Lógica por Trás):**

1.  **Coleta de Dados:** O sistema analisa os dados dos seus `_metrics.md` diários, olhando para um período agudo (últimos 3 dias) e um período crônico (últimos 21 dias). Mesmo dias sem registro são considerados, mas com carga zero, o que é crucial para uma avaliação realista.

2.  **Cálculo da Carga (Volume):**
    *   **Foco Principal:** O tempo de foco (`focoMin`) é a base da sua carga.
    *   **Estresse Amplificado:** Pontos negativos de "Paz de Espírito" (`xp_paz_espirito`) aumentam significativamente a carga. Cada ponto negativo é um indicador de estresse e adiciona um valor equivalente a 12 minutos de trabalho à sua carga.

3.  **Cálculo da Capacidade (Integridade Biológica):**
    A integridade mede a sua capacidade de lidar com a carga, calculada a partir de múltiplos fatores dos seus registros diários:
    *   **Resiliência Física (40%):** Avalia a qualidade do seu sono, a proporção de refeições boas vs. ruins, e o volume de exercícios (séries realizadas).
    *   **Resiliência Mental (40%):** Considera seus níveis de energia média e a aderência aos seus hábitos diários.
    *   **Resiliência Emocional (20%):** Baseia-se no seu humor médio e no saldo da sua "Paz de Espírito" (considerando que valores mais altos indicam maior equilíbrio).

4.  **Índice de Carga Sistêmica (`systemLoad`):**
    *   O sistema calcula uma proporção entre a sua carga aguda (média dos últimos 3 dias) e a sua carga crônica (média dos últimos 21 dias, ajustada para ter uma capacidade basal mínima de 180 minutos).
    *   Essa proporção é então *dividida* pelo "fator de integridade" (sua capacidade de recuperação, normalizada de 0 a 1). Ou seja, quanto menor sua integridade (recuperação), maior o `systemLoad` percebido para a mesma carga.

5.  **Estados e Cores:**
    *   **Recuperação (Azul - `systemLoad` < 0.8):** Indicação de que você está em um período de menor carga, ideal para recarregar as energias.
    *   **Zona Ótima (Verde - 0.8 <= `systemLoad` <= 1.3):** Você está em um equilíbrio saudável entre esforço e recuperação, ideal para o progresso sustentável.
    *   **Fase de Aceleração (Amarelo - 1.3 < `systemLoad` <= 1.8):** Um período de maior demanda, onde o cuidado com a recuperação é crucial para evitar o esgotamento.
    *   **CARGA MÁXIMA (Vermelho - `systemLoad` > 1.8):** Sinal de alerta máximo. Sua carga está muito alta em relação à sua capacidade de recuperação, aumentando significativamente o risco de burnout ou lesões.

6.  **Diagnóstico Preditivo (Vetores):**
    O painel também oferece um diagnóstico com "Pontos de Atenção" e "Fatores de Sustentação", comparando a sua carga e integridade atuais com os dias anteriores para identificar tendências:
    *   **Bateria Biológica Baixa/Alta Resiliência:** Baseado no nível absoluto da sua integridade.
    *   **Carga em Aceleração/Fase de "Deload":** Compara a carga aguda com a carga dos dias imediatamente anteriores.
    *   **Recuperação em Declínio/Melhora:** Compara a integridade aguda com a integridade dos dias imediatamente anteriores.

Esses vetores ajudam a entender não apenas onde você está, mas também para onde está indo, permitindo ajustes proativos no seu planejamento.


---

### 🌍 Distribuição de XP

Esta seção apresenta o "🌍 Distribuição de XP", um gráfico de pizza que visualiza como sua energia e esforço (medidos em XP acumulado) foram distribuídos entre as diferentes áreas da sua vida: **Vitalidade (Saúde)**, **Intelecto (Gênio)** e **Espírito (Paz)**. Ele serve como um reflexo visual de onde você tem investido seu tempo e dedicação ao longo do tempo.

**Como funciona:**

O gráfico calcula a distribuição a partir dos seus registros diários de métricas (`Logs_Metricas/Daily/Processed`). Para cada registro, ele soma o XP ganho em três categorias principais:

*   **Vitalidade (Saúde):** XP relacionado à sua saúde física e bem-estar (`xp_saude`).
*   **Intelecto (Gênio):** XP associado ao desenvolvimento do seu intelecto e conhecimento (`xp_genio`).
*   **Espírito (Paz):** XP referente à sua paz interior e equilíbrio espiritual (`xp_paz_espirito`).

O total de XP acumulado em cada uma dessas áreas é então utilizado para determinar a proporção de cada "fatia" do gráfico, mostrando visualmente qual área tem recebido mais ou menos do seu "XP de vida". Isso oferece um panorama rápido e intuitivo sobre o balanço dos seus investimentos pessoais.

**Cores:**
*   **Vitalidade (Saúde):** Vermelho (`#e74c3c`)
*   **Intelecto (Gênio):** Azul (`#3498db`)
*   **Espírito (Paz):** Roxo (`#9b59b6`)

---

### 🧠 Quad-Core (7 Dias)

#### Para que serve?
O Quad-Core é um HUD (Heads-Up Display) de performance que substitui o Radar e o indicador de Burnout. Ele mede o equilíbrio do seu sistema pessoal nos últimos 7 dias através de quatro "baterias" fundamentais: Ação (execução), Intelecto (aprendizado), Vitalidade (capacidade física) e Espírito (estado emocional). O objetivo é fornecer um diagnóstico rápido e acionável, mostrando não apenas o seu estado atual, mas também a tendência (↗ ou ↘) em comparação com a semana anterior.

#### Como funciona?
O script faz um "Deep Scan" nos logs brutos e arquivos de métricas processadas dos últimos 14 dias para calcular duas médias móveis de 7 dias (a atual e a anterior).

1. **Ação:** Calcula o tempo médio diário de foco em `#projeto` e tarefas genéricas (Inbox). Compara com a meta de 6h/dia para gerar um score.
2. **Intelecto:** Calcula o tempo médio diário de foco em `#midia` (estudo puro) e **50% do tempo de `#projeto`** (aprendizado prático). Combina isso com a densidade de `#ideia`, `#reflexao` e `#aprendizado_erro` para gerar um score de volume e síntese.
3. **Vitalidade:** Gera um score ponderado combinando a média de **Qualidade de Sono** (50%), **Energia Média** (25%) e **Resistência** (25%), que é a sua capacidade de sustentar longas horas de foco total.
4. **Espírito:** Gera um score ponderado combinando **Humor Médio** (30%), **Energia Média** (20%), **Aderência aos Hábitos** (25%) e **Saldo Emocional** (25%), que é o balanço entre eventos de `#win`/`#log_felicidade` vs. `#log_estresse`/`#log_tristeza`.

O resultado são quatro scores (0-100%) com feedbacks contextuais automáticos (ex: "🔥 Alta Intensidade", "✨ Vigor Espiritual") que explicam o porquê de cada nota, permitindo uma análise rápida e precisa do seu estado atual.


---

### ⏱️ Odômetro (30 dias)

**Para que serve:**
O Odômetro Global funciona como o "contador de quilometragem" do seu cérebro. Ele apresenta, em uma visão consolidada, o volume total de horas dedicadas ao **Foco** (trabalho/estudo) e à **Pausa** (lazer/recuperação) nos últimos 30 dias. Além disso, calcula a sua média diária, permitindo que você entenda rapidamente o ritmo sustentável do seu sistema e se o balanço entre esforço e descanso está saudável.

**Como funciona:**
O script varre a pasta de métricas processadas (`99 - BACKEND/Logs_Metricas/Daily/Processed`) e filtra apenas os arquivos dos últimos 30 dias. Para cada dia encontrado, ele converte as horas decimais (`total_foco_horas` e `total_pausa_horas`) em minutos para garantir precisão máxima na soma. Em seguida, calcula a média diária dividindo o total pelo número de dias com registro. Finalmente, os dados são renderizados em três cartões visuais (Foco Total, Pausa Total e Média/Dia), formatando os números de forma elegante (ex: "45h 30m").


---

### ⚖️ Balança de Soberania (30 Dias)

**Para que serve:**
A Balança de Soberania é uma métrica filosófica quantificada. Ela mede o balanço de poder sobre o seu tempo: quanto dele foi investido em seus próprios projetos e desenvolvimento (**Interno/Eu**) versus quanto foi "alugado" ou dedicado a demandas externas, como emprego ou obrigações de terceiros (**Externo/Eles**). O objetivo é te dar consciência visual sobre quem está no comando da sua agenda.

**Como funciona:**
O script analisa os arquivos de métricas processadas (`Daily/Processed`) dos últimos 30 dias. Ele soma o tempo total de foco classificado como "Interno" e "Externo", utilizando precisão de segundos para evitar arredondamentos enganosos. Em seguida, calcula a porcentagem de cada categoria em relação ao total de horas trabalhadas e renderiza uma barra de progresso visual: a parte colorida (accent) representa sua soberania interna, enquanto a parte apagada representa o tempo externo.


---

### 🏆 Hall of Fame S.O.T.A.

**Para que serve:**
O Hall of Fame é o museu dos seus maiores feitos. Ele escaneia todo o seu histórico de registros para identificar e celebrar os seus "Recordes Pessoais" (PRs) em produtividade e bem-estar. Diferente das outras métricas que olham para médias, este painel olha para os picos absolutos, servindo como prova concreta do seu potencial máximo e identificando padrões temporais de alta performance (como o seu "Prime Time", o dia da semana onde você estatisticamente performa melhor).

**Como funciona:**
O script varre todos os arquivos `_metrics.md` disponíveis no sistema, sem limite de data. Ele itera sobre cada registro comparando valores de Foco, XP Total, Paz de Espírito e Insights gerados, mantendo sempre o maior valor encontrado e a data correspondente. Paralelamente, ele acumula o XP ganho em cada dia da semana (Segunda, Terça, etc.) para calcular a média histórica de cada dia e determinar qual deles é o seu dia mais produtivo. Os resultados são então exibidos em cards de destaque ("Maratona Mental", "Dia Lendário", etc.).

---

### 📚 Inventário Universal (Acervo)

**Para que serve:**
O Inventário Universal é o painel de controle do seu "Acervo de Vida". Ele consolida, em uma única visão, todos os itens que você está gerenciando no sistema, desde Projetos ativos até todas as categorias de mídia (Livros, Cursos, Filmes, Jogos, etc.). O objetivo é fornecer um snapshot quantitativo do seu volume de consumo e produção, permitindo ver rapidamente o tamanho da sua "Fila" (Backlog), o que está "Em Progresso" e o quanto você já "Concluiu" em cada categoria.

**Como funciona:**
O script percorre as pastas raiz de Projetos (`02 - Projetos`) e Conhecimento (`03 - Conhecimento/01 - Mídias`). Ele utiliza um mapeamento pré-definido para identificar cada tipo de item com base no seu frontmatter (`tipo: projeto_hub`, `tipo: livro_hub`, etc.). A inovação aqui é a lógica de **Prioridade de Pasta**: para classificar o status de cada item (Ativo, Concluído, Backlog), o script verifica primeiro em qual *subpasta física* o arquivo está localizado (ex: se está dentro de `03. Concluídas`, conta como feito), o que é mais confiável do que depender apenas de tags de status manuais. Se a pasta não for conclusiva, ele usa o status do frontmatter como fallback. Por fim, gera cartões estatísticos para cada categoria encontrada.

---

### 🧬 Contexto de Vida

**Para que serve:**
Este painel, acionado pelo botão "⚙️ Configurar Vida" no seu perfil, permite definir o seu **Contexto de Vida** atual. Ele ajusta como o sistema interpreta sua produtividade. Você pode ativar camadas de realidade como:
*   **🏢 Natureza Blocada:** Para quem tem horários fixos (CLT, Aulas). Foca em proteger esses blocos.
*   **🌊 Natureza Fluida:** Para autônomos/creators. Foca na consistência e fluxo.
*   **🧩 Natureza Fragmentada:** Para pais ou cuidadores. Valoriza micro-vitórias em janelas curtas de tempo.

**Como funciona a lógica:**
O script `toggleLifeMode.js` abre uma interface gráfica nativa (Modal) onde você pode alternar esses modos (switches) e, se estiver no modo "Blocado", adicionar os intervalos de horário fixo (ex: "09:00-18:00"). Ao salvar, o script escreve diretamente no frontmatter do arquivo `00 - Perfil & Stats.md`. Essas variáveis (`layer_natureza_...`) são lidas posteriormente pelos scripts de análise diária para contextualizar se você teve um dia "bom" ou "ruim" baseada na sua realidade (ex: 2h de foco num dia Fragmentado valem mais que num dia Fluido).

