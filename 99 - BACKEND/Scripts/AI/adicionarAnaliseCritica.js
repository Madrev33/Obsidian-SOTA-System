// SOTA - Script para Adicionar Módulo de Análise Crítica a uma Nota de Capítulo
// v1.0 - Injeção Inteligente de Conteúdo e Metadados

module.exports = async (params) => {
    const { app, obsidian } = params;
    const { Notice, TFile } = obsidian;

    try {
        const activeFile = app.workspace.getActiveFile();
        if (!activeFile) {
            new Notice("❌ ERRO: Nenhuma nota de capítulo ativa.");
            return;
        }

        new Notice("🚀 Adicionando módulo de Análise Crítica...");

        const fileContent = await app.vault.read(activeFile);
        const lines = fileContent.split('\n');

        // --- VALIDAÇÃO: VERIFICAR SE O MÓDULO JÁ EXISTE ---
        const marcadorModulo = "## 🧠 Análise de Sentimento & Influência (Anti Manipulação)";
        if (fileContent.includes(marcadorModulo)) {
            new Notice("ℹ️ O módulo de Análise Crítica já existe nesta nota.");
            return;
        }

        // --- LÓGICA DE INSERÇÃO INTELIGENTE ---
        const marcadorSecaoAnterior = "## 📝 Anotações & Insights";
        const indiceInicioSecaoAnterior = lines.findIndex(l => l.trim().startsWith(marcadorSecaoAnterior));

        if (indiceInicioSecaoAnterior === -1) {
            new Notice(`❌ ERRO: Seção "${marcadorSecaoAnterior}" não encontrada. O módulo não pode ser inserido.`);
            return;
        }
        
        // Encontra o final da seção "Anotações & Insights"
        let indiceInsercao = lines.length; // Padrão: insere no final do arquivo
        for (let i = indiceInicioSecaoAnterior + 1; i < lines.length; i++) {
            // A próxima heading de nível 2 ou um separador '---' marca o fim da seção
            if (lines[i].trim().startsWith('## ') || lines[i].trim() === '---') {
                indiceInsercao = i;
                break;
            }
        }

        // Se a seção de anotações for a última do arquivo, ajusta o índice para antes da última linha vazia, se houver
        if (indiceInsercao === lines.length && lines[lines.length - 1].trim() === '') {
            indiceInsercao = lines.length - 1;
        }

        // --- CONTEÚDO A SER INJETADO ---
        const blocoDeAnalise = `
---

## 🧠 Análise de Sentimento & Influência (Anti Manipulação)
**Step 1: Análise Pessoal**
>*Use estas perguntas como um guia para vigiar seus pensamentos e emoções enquanto consome esta mídia.*

**Como eu me sinto agora?** Que emoções esta obra está despertando em mim (ex: raiva, alegria, esperança, medo, ansiedade)?
\`INPUT[textArea:analise_q01_sentimento]\`

**Qual é a intenção do criador?** Qual mensagem ou sentimento o autor/diretor quer que eu sinta ou acredite neste exato momento?
\`INPUT[textArea:analise_q02_intencao]\`

**Isso faz sentido?** A informação apresentada é logicamente sólida, ou ela apela mais para a emoção do que para a razão? Existem falácias ou simplificações exageradas?
\`INPUT[textArea:analise_q03_logica]\`

**Esta narrativa me fortalece ou me enfraquece?** A visão de mundo apresentada aqui me dá mais poder e agência sobre minha vida, ou me coloca em uma posição de vítima, medo ou impotência?
\`INPUT[textArea:analise_q04_fortalecimento]\`


> *Avalie como o conteúdo consumido se alinha com quem você é e quem você quer se tornar.*

**Como minha percepção sobre [TEMA CENTRAL] mudou após esta exposição?** Estou vendo o mundo ou a mim mesmo de forma diferente? Essa mudança é positiva e construtiva?
\`INPUT[textArea:analise_q06_percepcao]\`

**Que comportamentos ou ideias esta mídia está sutilmente normalizando ou incentivando?** Estou sendo levado a aceitar algo como "normal" que antes eu questionaria?
\`INPUT[textArea:analise_q07_normalizacao]\`

**Se eu adotasse 100% a visão desta obra, em quem eu me tornaria?** Eu gostaria de ser essa pessoa?
\`INPUT[textArea:analise_q08_identidade]\`

> *Desconstrua a mensagem para entender os mecanismos de influência em ação.*

**Qual é a "Grande Mentira" ou a "Grande Verdade" que esta obra quer que eu aceite?** Qual é a premissa central que sustenta toda a narrativa?
\`INPUT[textArea:analise_q09_tese]\`

**Que ferramentas de persuasão estão sendo usadas?** (ex: Apelo à autoridade, prova social, escassez, urgência, repetição, storytelling emocional, criação de um "inimigo comum").
\`INPUT[textArea:analise_q10_persuasao]\`

**Quais informações estão sendo convenientemente omitidas?** Que perspectiva ou lado da história não está sendo contado para que o argumento principal pareça mais forte?
\`INPUT[textArea:analise_q11_omissao]\`

**Que ação ou mudança de comportamento esta obra quer que eu tome no mundo real?** (ex: comprar algo, votar em alguém, adotar uma ideologia, sentir medo de um grupo, etc.).
\`INPUT[textArea:analise_q12_acao]\`



## 🌌 Assistência AI

**Step 2: Análise da Sua Reflexão**
> *Após fazer sua análise pessoal (Step 1), use este botão para criar seu documento de reflexão e gerar o prompt final.*

\`\`\`meta-bind-button
label: "✍️ Gerar Documento de Reflexão"
style: default
actions:
  - type: inlineJS
    code: |
      const qa = this.app.plugins.plugins.quickadd?.api;
      if (qa) {
          // O nome da Choice DEVE corresponder exatamente ao que foi configurado no QuickAdd
          qa.executeChoice("Exportar Análise Pessoal");
      } else {
          new Notice("❌ ERRO: A API do QuickAdd não está disponível.");
      }
\`\`\`

> [!caution] Aviso: AI é um Espelho, Não necessariamente a Verdade
> O que a AI gera é um reflexo dos dados fornecidos, processado por um algoritmo. **Não necessariamente é a verdade suprema.**
O verdadeiro poder desta ferramenta não está somente nas respostas que ela dá, mas nas **perguntas que ela te força a fazer.** 
Questione cada afirmação. Desafie cada conclusão. **O pensamento é o seu trabalho**, a AI é a sua **assistente** de pesquisa. 
Nesse caso use as respostas da AI como um **ponto de partida para a reflexão**, não como a conclusão.
`;

        // Insere o bloco de análise na posição calculada
        lines.splice(indiceInsercao, 0, blocoDeAnalise.trim());
        await app.vault.modify(activeFile, lines.join('\n'));

        // --- ATUALIZAÇÃO DO FRONTMATTER ---
        await app.fileManager.processFrontMatter(activeFile, (fm) => {
            fm.analise_q01_sentimento = "";
            fm.analise_q02_intencao = "";
            fm.analise_q03_logica = "";
            fm.analise_q04_fortalecimento = "";
            fm.analise_q06_percepcao = "";
            fm.analise_q07_normalizacao = "";
            fm.analise_q08_identidade = "";
            fm.analise_q09_tese = "";
            fm.analise_q10_persuasao = "";
            fm.analise_q11_omissao = "";
            fm.analise_q12_acao = "";
        });

        new Notice("✅ Módulo de Análise Crítica adicionado com sucesso!");

    } catch (error) {
        console.error("Erro ao adicionar módulo de análise crítica:", error);
        new Notice("❌ Ocorreu um erro. Verifique o console.");
    }
};