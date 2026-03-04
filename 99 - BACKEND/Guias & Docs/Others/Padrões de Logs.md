# 📘 Padrões de Log S.O.T.A. SYSTEM

**Versão da Documentação:** 2.0
**Contexto:** Definição dos padrões de dados para interoperabilidade entre o Plugin Pomodoro, Scripts QuickAdd, Dataview e Dashboards.

---

## 1. Conceitos Fundamentais

O sistema utiliza um padrão de **Log Híbrido** composto por:
1.  **Texto Legível:** Para leitura humana na timeline.
2.  **Tags de Classificação:** Para indexação rápida (ex: `#win`, `#ideia`).
3.  **Campos Inline (Dataview):** No formato `(chave:: valor)` para extração precisa de dados.

### 1.1 Metadados Universais
Quase todos os logs gerados pelo sistema possuem os seguintes sufixos para garantir localização temporal:

| Campo | Formato | Descrição |
| :--- | :--- | :--- |
| `(log_date:: ...)` | `YYYY-MM-DD` | Data do registro. |
| `(log_time:: ...)` | `HH:mm:ss` | Hora exata do registro. |
| `#periodo/...` | `#periodo/manha` | (Opcional) Classificação do turno do dia (madrugada, manha, tarde, noite). |

---

## 2. Logs do Plugin Pomodoro

Gerados automaticamente pelo `Timer.ts` e `Logger.ts`.

### 2.1 Sessão de Foco (WORK)
Representa um bloco de trabalho ou estudo concluído.

**Sintaxe:**
```markdown
- 🍅 (sessao_fim::WORK) (duracao_total_sessao_segundos::X) (duracao_base_segundos::Y) (duracao_extra_segundos::Z) (foco::0-10) (humor::1-5) (energia::0-100) (feito::"...") (melhora::"...") (id_sessao::...) ... [Tags de Contexto]
```

**Detalhamento dos Campos:**
*   `duracao_total_sessao_segundos`: Tempo real executado (Snapshot).
*   `foco`: Nota de 0 a 10.
*   `humor`: Nota de 1 a 5.
*   `energia`: Nível de 0 a 100.
*   `feito`: (Texto) O que foi realizado na sessão.
*   `melhora`: (Texto) O que pode ser melhorado na próxima.
*   **Contexto (Variável):**
    *   Se Projeto: `(projeto_hub:: "[[Link]]") #projeto/id/fase`
    *   Se Mídia: `(livro_paginado_hub:: "[[Link]]") #midia/tipo/id/ciclo_X`
    *   Se Exercício: `(exercicio_id:: id) #exercicio/grupo/id`

### 2.2 Sessão de Pausa (BREAK)
Representa o intervalo de recuperação.

**Sintaxe:**
```markdown
- ☕ (sessao_fim::BREAK) (duracao_total_sessao_segundos::X) ...
```

### 2.3 Logs de Mídia Específicos
Gerados para mídias que possuem unidades menores (páginas, aulas).

*   **Início de Unidade:** `(pagina_inicio::X)` ou `(aula_inicio::X)`
*   **Fim de Unidade:** `(pagina_fim::X) (duracao_segundos::Y)`

---

## 3. Logs de Eventos (Scripts QuickAdd)

Gerados manualmente através dos botões nos dashboards. Estes logs geralmente são escritos em dois locais (**Dual Log**): no Diário e no Log Contextual.

### 3.1 Hábitos e Rotina
Gerados por `registrarProgressoHabito.js` e `registrarConclusaoHabito.js`.

*   **Tipo Binário (Sim/Não):**
    ```markdown
    - [x] Hábito Concluído: Nome #habito_concluido (id_habito:: id_sanitizado) ...
    ```
*   **Tipo Contador (Quantitativo):**
    ```markdown
    - 🔢 Registro Hábito: Nome (+Qtd) #habito_registro (id_habito:: id_sanitizado) (valor:: X) ...
    ```

### 3.2 Saúde e Bio-Ritmo
Gerados por `logAlimentacao.js` e `logEmocao.js`.

*   **Nutrição:**
    ```markdown
    - Refeição BOA registrada. (Alimentos:: Descrição) #refeicao_boa ...
    - Refeição RUIM registrada. (Alimentos:: Descrição) #refeicao_ruim ...
    ```
*   **Emoções:**
    ```markdown
    - Momento de [Emoção]. (Contexto:: Descrição) #log_felicidade ...
    - Momento de [Emoção]. (Contexto:: Descrição) #log_estresse ...
    - Momento de [Emoção]. (Contexto:: Descrição) #log_tristeza ...
    ```
    *(Nota: `Ansiedade` e `Estresse` podem compartilhar a tag ou ter tags separadas conforme configuração do script)*

### 3.3 Performance e Intelecto
Gerados por `logConquista.js`, `logErro.js`, `logDistracaoScript.js` e `registrarInsightUniversal.js`.

*   **Vitória (Win):**
    ```markdown
    - [ ] ✨ Conquista (Win): Texto (Fator:: Causa do Sucesso) #win ...
    ```
*   **Erro/Aprendizado:**
    ```markdown
    - [ ] 🛑 Aprendizado de Erro. (Situação:: X) (Erro:: Y) (Aprendizado:: Z) #aprendizado_erro ...
    ```
*   **Distração:**
    ```markdown
    - Ponto de Distração registrado. (Distração:: O que distraiu) (Gatilho:: Causa) #distracao ...
    ```
*   **Insights:**
    ```markdown
    - [ ] #ideia (Fonte:: [[Link]]) ...
    - [ ] #reflexao (Fonte:: [[Link]]) ...
    ```

### 3.4 Gestão de Tarefas Rápidas
Gerado por `logFazerDepois.js` e `logAprimoramento.js`.

*   **Inbox Rápida:**
    ```markdown
    - [ ] Texto da tarefa #fazer_depois ...
    ```
*   **Aprimoramento:**
    ```markdown
    - [ ] Texto da melhoria #aprimoramento ...
    ```

---

## 4. Estrutura de Arquivos de Métricas (Processed)

O script `processarDia.js` consolida todos os logs acima em um arquivo YAML processado (`YYYY-MM-DD_metrics.md`).

### Estrutura do Frontmatter Consolidado

```yaml
data: YYYY-MM-DD
xp_dia_total: Inteiro
xp_breakdown:
  total: Inteiro
  pilares:
    genio: Inteiro
    saude: Inteiro
    paz: Inteiro
  fontes:
    foco: Inteiro
    tarefas: Inteiro
    habitos: Inteiro
    eventos: Inteiro
  destaques:
    tarefa: { nome: "String", xp: Int }
    habito: { nome: "String", xp: Int }
    evento: { tipo: "String", xp: Int }
sono_breakdown:
  score_final: 0-100
  componentes:
    higiene: { score: Int, max: 50 }
    duracao: { score: Int, max: 50, horas: Float }
  ajustes:
    penalidade_interrupcoes: Int
    penalidade_atividade_madrugada: Int
total_foco_segundos: Inteiro (Precisão)
total_pausa_segundos: Inteiro (Precisão)
foco_interno_segundos: Inteiro
foco_externo_segundos: Inteiro
# ... outros contadores simples (qtd_wins, qtd_erros, etc)
```

---

## 5. Fluxo de Dados (Data Flow)

1.  **Input:** Usuário interage via Plugin Pomodoro ou Botões QuickAdd.
2.  **Log:** Dados são escritos imediatamente no arquivo do dia (`01 - Registros/01. Daily/...`) e, quando aplicável, no log temático (`99 - BACKEND/Logs_Metricas/...`).
3.  **ETL (Fim do Dia):** O script `processarDia.js` lê os logs brutos e o frontmatter do dia.
4.  **Armazenamento:** O ETL gera o arquivo `_metrics.md` na pasta `Processed`.
5.  **Visualização:** Os scripts `render...js` (Dashboards) leem prioritariamente os arquivos `Processed` para performance, recorrendo aos logs brutos apenas quando é necessário detalhamento granular (como no gráfico de dispersão de foco).