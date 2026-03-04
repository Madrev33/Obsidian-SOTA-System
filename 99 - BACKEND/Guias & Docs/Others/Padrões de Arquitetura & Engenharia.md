# 🏛️ S.O.T.A. SYSTEM: Padrões de Arquitetura & Engenharia

**Versão:** 3.0 (Quantum Edition)
**Status:** Produção
**Filosofia:** *State Of The Art Personal Operating System* — Foco em fricção zero, dados granulares e feedback visual imediato.

---

## 1. Princípios Fundamentais

### 1.1 Dual Logging (Escrita Dupla)
A regra de ouro para persistência de dados. Todo evento significativo deve ser registrado em dois locais simultaneamente:
1.  **Cronológico (Timeline):** No arquivo da Nota Diária (`01 - Registros/01. Daily/YYYY/MM/YYYY-MM-DD.md`). Isso permite a reconstrução da narrativa do dia.
2.  **Temático (Histórico):** No arquivo de log específico da entidade (`99 - BACKEND/Logs_Metricas/Categoria/ID/raw_logs.md`). Isso permite análises de longo prazo (ex: progresso de um projeto, consistência de um hábito) sem precisar varrer milhares de notas diárias.

### 1.2 ETL Diário (Extract, Transform, Load)
Os dashboards não devem calcular métricas pesadas em tempo real.
*   **Ação:** O script `processarDia.js` deve ser executado ao final de cada dia.
*   **Função:** Ele lê os logs brutos, aplica as regras de negócio (cálculo de XP, score de sono, bio-ritmo) e salva um arquivo JSON/YAML estático (`_metrics.md`).
*   **Consumo:** Os dashboards leem preferencialmente este arquivo processado para renderização instantânea.

### 1.3 Atomicidade de UI
Interfaces de entrada de dados (como o Registro de Sono ou Resumo do Dia) não devem salvar dados a cada tecla pressionada ("flick").
*   **Padrão:** Usar estado temporário na memória e um botão de "Commit" (Registrar) para gravar no disco de uma só vez.

---

## 2. Estrutura de Diretórios (Backend)

A pasta `99 - BACKEND` é o motor do sistema e não deve ser alterada manualmente pelo usuário.

```text
99 - BACKEND/
├── Docs/                  # Documentação técnica (como este arquivo)
├── Imagens & Videos/      # Armazenamento de assets (Capas, HQs, Áudios)
├── Logs_Metricas/         # O Banco de Dados do sistema
│   ├── Daily/             # Logs diários brutos (backup lógico)
│   │   └── Processed/     # Arquivos _metrics.md (Dados consolidados)
│   ├── Habitos/           # Logs por Hábito
│   ├── Projetos/          # Logs por Projeto
│   ├── Saude/             # Logs de Nutrição e Emoções
│   └── [Tipos de Mídia]/  # (Livros, Cursos, etc.)
├── Scripts/               # A lógica do sistema
│   ├── AI/                # Integrações com LLMs
│   ├── Daily/             # Automações da rotina diária
│   ├── Dashboard.../      # Controladores de contexto dos dashboards
│   ├── Eventos/           # Scripts de log (Wins, Erros, Insights)
│   ├── Utils/             # Ferramentas de sistema (ETL, Taxonomia)
│   └── Views/             # Renderizadores visuais (DataviewJS)
└── Templates/             # Modelos de arquivos (.md)
```

---

## 3. Padrões de Identidade e Contexto

### 3.1 Identificadores Únicos (UID)
Todo "HUB" (Projeto, Estudo, Mídia) deve ter um `sota_uid` no frontmatter.
*   **Formato:** `sota-[7chars_random][4chars_timestamp]`
*   **Uso:** É a chave primária para vincular logs, tarefas e dashboards, permitindo que o nome do arquivo mude sem quebrar as conexões.

### 3.2 Taxonomia de Contexto
As tarefas e logs carregam o contexto através de tags hierárquicas ou campos inline.

*   **Projetos:** `#projeto/[id_projeto]/[fase_opcional]`
*   **Mídias:** `#midia/[tipo]/[id_midia]/ciclo_[N]`
*   **Exercícios:** `#exercicio/[grupo_muscular]/[id_exercicio]`

---

## 4. Padrões de Tempo e Precisão

### 4.1 Timestamp Snapshot
O tempo de foco é sagrado.
*   Ao parar o timer, o valor de duração é "congelado" imediatamente.
*   O tempo gasto preenchendo modais de reflexão **não** conta como foco.
*   Os logs registram a duração em segundos (`duracao_total_sessao_segundos`) para máxima precisão nos gráficos.

### 4.2 Data Lógica
*   **Nome do Arquivo:** `YYYY-MM-DD.md` é a fonte da verdade para a data de um log diário.
*   **Fuso Horário:** Scripts de renderização devem evitar conversões de timezone automáticas que possam deslocar o dia. A string da data deve ser tratada literalmente.

---

## 5. Protocolos de Gamificação (RPG)

O sistema utiliza uma economia de XP balanceada para incentivar comportamentos.

### 5.1 Pilares de Experiência
*   **🧠 Gênio (Intelecto):** Foco em estudos, leitura, tarefas de alta complexidade e insights.
*   **❤️ Saúde (Vitalidade):** Exercícios, nutrição, sono e pausas regenerativas.
*   **🕊️ Paz (Espírito):** Conquistas (Wins), felicidade, meditação e manutenção de hábitos.

### 5.2 Matriz de Recompensa (Base)
*   **Foco (Pomodoro):** Base de 10 XP por 25min (ajustável por overtime).
*   **Tarefas:** Escala de 5 XP (Trivial) a 150 XP (Hardcore).
*   **Hábitos:** Escala similar às tarefas.
*   **Eventos:** Wins (20 XP), Aprendizados (20 XP), Insights (10 XP).
*   **Penalidades:** Refeição Ruim (-10 XP), Estresse (-2 XP).

---

## 6. Componentes de Interface (UI)

### 6.1 Dashboards
Seguem o padrão **Host-View**. O arquivo `.md` contém apenas o esqueleto e chama scripts `render...js` via DataviewJS. Isso permite atualizar a lógica visual de todo o sistema alterando apenas um arquivo de script.

### 6.2 Modais (QuickAdd & Timer)
Devem ser navegáveis via teclado sempre que possível.
*   `Enter`: Confirma/Salva.
*   `Esc`: Cancela.
*   `Ctrl+Enter`: Salva em TextAreas.
*   **Foco Automático:** O primeiro campo de input deve receber foco assim que o modal abre.

---

Este documento consolida a lógica que governa o seu "Segundo Cérebro". Qualquer nova funcionalidade ou script deve consultar estas diretrizes para garantir que o sistema permaneça coeso, performático e confiável.