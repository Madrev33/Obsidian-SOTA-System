# 🍅 S.O.T.A. Pomodoro (State of the Art Engine)

**O motor de execução temporal e coleta de métricas do S.O.T.A. System.**

Este plugin não é apenas um cronômetro. É um **middleware de inteligência** projetado para transformar o Obsidian de um simples bloco de notas em um Sistema Operacional Pessoal (OS) completo e reativo.

---

## 🚀 O Ecossistema S.O.T.A.

Este plugin foi construído especificamente para operar dentro da arquitetura **S.O.T.A. (State of the Art)**. Ele alimenta os dashboards, o sistema de RPG e os relatórios de performance.

Para entender como implementar a arquitetura completa (Pastas, Dataviews, QuickAdd e Gamificação), acesse:

👉 **[CONHEÇA O SISTEMA S.O.T.A. COMPLETO](https://sotasystem.netlify.app/)** 👈

---

## 🧠 O Que Este Plugin Faz?

Diferente de timers comuns, o **S.O.T.A. Pomodoro** possui consciência de contexto. Ele sabe *onde* você está trabalhando e *o que* você está fazendo.

### Funcionalidades Exclusivas (S.O.T.A. Edition):

1.  **Awareness Contextual:**
    *   Detecta automaticamente se você está em um **Projeto**, estudando uma **Mídia** (Livro, Curso, Série) ou fazendo um **Exercício Físico**.
    *   Injeta metadados precisos (IDs, Ciclos, Temporadas) no log.

2.  **Dual Write (Escrita Dupla):**
    *   Grava o log na sua **Nota Diária** (Timeline).
    *   Grava simultaneamente no **Log Histórico** do projeto/mídia específico (Sharding).

3.  **Sistema de RPG & XP:**
    *   Calcula XP baseado na dificuldade da tarefa e tempo de foco.
    *   Alimenta a barra de progresso do seu Perfil.

4.  **Quest Engine Integrada:**
    *   Ao concluir tarefas, verifica automaticamente se alguma **Recompensa** foi desbloqueada.

5.  **Recuperação de Crash (Heartbeat):**
    *   Se o Obsidian fechar inesperadamente, o plugin recupera sua sessão de onde parou, garantindo que nenhum minuto de foco seja perdido.

---

## ⚠️ Requisitos Críticos

Este plugin depende da **Arquitetura de Pastas S.O.T.A.** para funcionar.

*   Ele busca logs em `99 - BACKEND/Logs_Metricas/...`
*   Ele lê configurações de `00 - Dashboard/...`

**Não instale este plugin em um cofre vazio** sem antes configurar a estrutura de arquivos do S.O.T.A., ou os scripts de log falharão.

---

## 🤝 Créditos e Fork

Este projeto é um **Hard-Fork** (versão altamente modificada) do excelente plugin [Obsidian Pomodoro Timer](https://github.com/eatgrass/obsidian-pomodoro-timer) desenvolvido por **eatgrass**.

Agradecimentos ao criador original pela base sólida que permitiu a construção deste motor de inteligência personalizado.

*   **Plugin Original:** [obsidian-pomodoro-timer](https://github.com/eatgrass/obsidian-pomodoro-timer)
*   **Autor Original:** [eatgrass](https://github.com/eatgrass)

---

## 📄 Licença

MIT License. Sinta-se livre para estudar o código, mas lembre-se: **A arquitetura de pastas é a chave.**

---

<p align="center">
  <a href="https://sotasystem.netlify.app/">
    <img src="https://img.shields.io/badge/S.O.T.A.-SYSTEM_READY-blue?style=for-the-badge" alt="SOTA Ready" />
  </a>
</p>