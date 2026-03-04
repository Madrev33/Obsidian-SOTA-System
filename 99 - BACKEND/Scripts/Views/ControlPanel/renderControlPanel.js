// SOTA - renderControlPanel.js v1.3 (Cycle-First Status Logic)
// Painel de Controle Universal para Mídias (RAC Pattern)
// Fonte da Verdade: Array de Ciclos gerado pelo Pomodoro Plugin/QuickAdd Scripts

async function main() {
    const sotaLog = (msg, data) => console.log(`[SOTA ControlPanel] ${msg}`, data !== undefined ? data : "");
    
    // 1. VALIDAÇÃO E CONTEXTO
    const hub = input.hub || dv.current();
    
    if (!hub) {
        dv.paragraph("❌ ERRO SOTA: Contexto do HUB não fornecido para o Painel de Controle.");
        return;
    }

    const tipoMidia = hub.tipo;
    const cicloAtualNum = hub.ciclo_de_consumo_atual || 1;
    let statusRaw = "indefinido";
    let origemStatus = "Raiz (Fallback)";

    // --- LÓGICA DE STATUS: PRIORIDADE AO ARRAY DE CICLOS ---
    
    // 1. Tenta buscar o status dentro do objeto do ciclo atual
    if (hub.ciclos && Array.isArray(hub.ciclos)) {
        // Nota: O Pomodoro/SotaSync garante que 'ciclo' seja um número.
        const cicloObj = hub.ciclos.find(c => c.ciclo === cicloAtualNum);
        
        if (cicloObj && cicloObj.status) {
            statusRaw = cicloObj.status.toLowerCase();
            origemStatus = `Array de Ciclos (Ciclo ${cicloAtualNum})`;
        }
    }

    // 2. Fallback: Se não achou no ciclo (ex: mídia legada ou erro de sync), busca na raiz
    // O Pomodoro atualiza fm.leitura_status ou fm.consumo_status na raiz como 'parado' ao fim da sessão,
    // mas o ciclo permanece 'lendo'/'assistindo'. Se cairmos aqui, usamos o da raiz.
    if (statusRaw === "indefinido") {
        statusRaw = (hub.status || hub.leitura_status || hub.consumo_status || "indefinido").toLowerCase();
    }

    sotaLog(`Diagnóstico: Tipo=${tipoMidia} | Ciclo=${cicloAtualNum} | Status=${statusRaw} | Origem=${origemStatus}`);

    // --- DEFINIÇÃO DE ESTADOS LÓGICOS ---

    // IS ATIVO: O ciclo está aberto.
    // 'lendo', 'assistindo', 'ouvindo': Definidos pelo Pomodoro (SotaSync.ts -> garantirCicloIniciado)
    // 'ativo', 'em progresso': Genéricos
    // 'parado', 'pausado': Definidos pelo Pomodoro na raiz ao fim da sessão (fallback)
    // 'para-ler', 'backlog': Estados iniciais definidos na criação
    const isAtivo = [
        'lendo', 'assistindo', 'ouvindo', // Termos do Pomodoro
        'ativo', 'em progresso', 
        'parado', 'pausado', 
        'para-ler', 'para-assistir', 'backlog', 'pendente'
    ].includes(statusRaw);

    // IS CONCLUÍDO: O ciclo foi finalizado.
    // Definido pelos scripts de Finalização do QuickAdd
    const isConcluido = ['concluido', 'concluído', 'arquivado', 'completo', 'resgatado'].includes(statusRaw);

    // 2. CONFIGURAÇÃO CENTRAL (MAPA DE MACROS)
    const configMap = {
        // --- MÍDIAS PAGINADAS E DE LEITURA ---
        'livro_paginado_hub': {
            finish: { label: "✅ Finalizar Ciclo de Leitura", macro: "Finalizar Ciclo de Leitura (Livro)" },
            newCycle: { label: "🔄 Iniciar Novo Ciclo", macro: "Iniciar Novo Ciclo de Leitura" },
            reactivate: null 
        },
        'artigo_paginado_hub': {
            finish: { label: "✅ Finalizar Leitura", macro: "Finalizar Ciclo de Leitura (Artigo Paginado)" },
            newCycle: { label: "🔄 Iniciar Novo Ciclo", macro: "Iniciar Novo Ciclo de Leitura (Artigo Paginado)" },
            reactivate: null
        },
        'documentacao_paginado_hub': {
            finish: { label: "✅ Finalizar Leitura", macro: "Finalizar Ciclo de Leitura (Documentacao Paginado)" },
            newCycle: { label: "🔄 Iniciar Novo Ciclo", macro: "Iniciar Novo Ciclo de Leitura (Documentacao Paginado)" },
            reactivate: null
        },

        // --- MÍDIAS SERIAIS ---
        'curso_hub': {
            finish: { label: "✅ Finalizar Consumo (Pausa Longa)", macro: "Finalizar Consumo de Curso" },
            newCycle: { label: "🔄 Assistir Novamente (Novo Ciclo)", macro: "Iniciar Novo Ciclo (Curso)" },
            reactivate: { label: "▶️ Reativar Aprendizado", macro: "Reativar Aprendizado de Curso" }
        },
        'serie_hub': {
            finish: { label: "✅ Finalizar Consumo", macro: "Finalizar Consumo de Série" },
            newCycle: { label: "🔄 Assistir Novamente (Novo Ciclo)", macro: "Iniciar Novo Ciclo (Série)" },
            reactivate: { label: "▶️ Reativar Série", macro: "Reativar Série" }
        },
        'documentario_serializado_hub': {
            finish: { label: "✅ Finalizar Consumo", macro: "Finalizar Consumo de Documentário Serializado" },
            newCycle: { label: "🔄 Assistir Novamente (Novo Ciclo)", macro: "Iniciar Novo Ciclo (Documentário Serializado)" },
            reactivate: { label: "▶️ Reativar Documentário", macro: "Reativar Documentário Serializado" }
        },
        'podcast_hub': { 
            finish: { label: "✅ Finalizar Consumo", macro: "Finalizar Consumo de Podcast Serializado" },
            newCycle: { label: "🔄 Ouvir Novamente (Novo Ciclo)", macro: "Iniciar Novo Ciclo (Podcast Serializado)" },
            reactivate: { label: "▶️ Reativar Podcast", macro: "Reativar Podcast Serializado" }
        },

        // --- MÍDIAS LÚDICAS ---
        'jogo_hub': {
            finish: { label: "✅ Finalizar Jogo (Zerado)", macro: "Finalizar Consumo de Jogo" }, // Script que você precisará criar similar ao de Série
            newCycle: { label: "🔄 Jogar Novamente (Novo Ciclo)", macro: "Iniciar Novo Ciclo de Jogo" }, // Script similar ao de Série
            reactivate: { label: "▶️ Continuar Jogando", macro: "Reativar Jogo" } // Script similar ao de Série
        },

        // --- MÍDIAS ATÔMICAS ---
        'filme_hub': {
            finish: { label: "✅ Finalizar Consumo", macro: "Finalizar Consumo Filme (Unico)" },
            newCycle: { label: "🔄 Assistir Novamente", macro: "Iniciar Novo Ciclo Filme (Unico)" },
            reactivate: null 
        },
        'video_hub': {
            finish: { label: "✅ Finalizar Consumo", macro: "Finalizar Consumo Vídeo (Unico)" },
            newCycle: { label: "🔄 Assistir Novamente", macro: "Iniciar Novo Ciclo Vídeo (Unico)" },
            reactivate: null
        },
        'artigo_atomico_hub': {
            finish: { label: "✅ Finalizar Leitura", macro: "Finalizar Consumo Artigo (Atômico)" },
            newCycle: { label: "🔄 Ler Novamente", macro: "Iniciar Novo Ciclo Artigo (Atômico)" },
            reactivate: null
        },
        'documentario_unico_hub': {
            finish: { label: "✅ Finalizar Consumo", macro: "Finalizar Consumo Documentário (Unico)" },
            newCycle: { label: "🔄 Assistir Novamente", macro: "Iniciar Novo Ciclo Documentário (Unico)" },
            reactivate: null
        },
        'podcast_unico_hub': {
            finish: { label: "✅ Finalizar Consumo", macro: "Finalizar Consumo Podcast (Unico)" },
            newCycle: { label: "🔄 Ouvir Novamente", macro: "Iniciar Novo Ciclo Podcast (Unico)" },
            reactivate: null
        }
    };

    const midiaConfig = configMap[tipoMidia];

    if (!midiaConfig) {
        // Fail-safe silencioso
        dv.paragraph(`*Painel de controle: Tipo ${tipoMidia} não mapeado.*`);
        return;
    }

    // 3. GERADOR DE CÓDIGO DE BOTÃO
    const generateMetaBindButton = (label, macroName, style = "default") => {
        return `\`\`\`meta-bind-button
label: "${label}"
style: ${style}
actions:
  - type: inlineJS
    code: |
      const qa = this.app.plugins.plugins.quickadd?.api;
      if (!qa) { new obsidian.Notice("❌ ERRO: QuickAdd não disponível."); return; }
      const activeFile = this.app.workspace.getActiveFile();
      if (!activeFile) return;
      
      qa.executeChoice("${macroName}", { 
          "active_file_path": activeFile.path,
          "activeFilePath": activeFile.path 
      });
\`\`\``;
    };

    // 4. LÓGICA DE RENDERIZAÇÃO
    const buttonsToRender = [];

    // Cenário 1: Mídia em Andamento ou Parada (Mas não concluída)
    if (isAtivo) {
        if (midiaConfig.finish) {
            buttonsToRender.push({
                title: "Finalizar Ciclo",
                buttonBlock: generateMetaBindButton(midiaConfig.finish.label, midiaConfig.finish.macro, "default")
            });
        }
        
        // Para mídias que suportam reativação explícita (como Cursos pausados por muito tempo)
        // Mostramos o botão se o status for especificamente 'pausado' ou 'parado' E houver config
        if ((statusRaw === 'pausado' || statusRaw === 'parado') && midiaConfig.reactivate) {
             buttonsToRender.push({
                title: "Retomar",
                buttonBlock: generateMetaBindButton(midiaConfig.reactivate.label, midiaConfig.reactivate.macro, "default")
            });
        }
    }
    
    // Cenário 2: Mídia Concluída
    else if (isConcluido) {
        // Opção de Reativar (continuar o mesmo ciclo se novos episódios saíram)
        if (midiaConfig.reactivate) {
            buttonsToRender.push({
                title: "Reativar / Continuar",
                buttonBlock: generateMetaBindButton(midiaConfig.reactivate.label, midiaConfig.reactivate.macro, "default")
            });
        }
        
        // Opção de Novo Ciclo (Reler/Reassistir do zero)
        if (midiaConfig.newCycle) {
            buttonsToRender.push({
                title: "Iniciar Novo Ciclo",
                buttonBlock: generateMetaBindButton(midiaConfig.newCycle.label, midiaConfig.newCycle.macro, "default")
            });
        }
    } 
    
    // Fallback (Status desconhecido)
    else {
         if (midiaConfig.finish) {
            buttonsToRender.push({
                title: "Ação Disponível",
                buttonBlock: generateMetaBindButton(midiaConfig.finish.label, midiaConfig.finish.macro, "default")
            });
        }
    }

    // 5. CONSTRUÇÃO DO LAYOUT
    if (buttonsToRender.length > 0) {
        let markdownOutput = "> [!multi-column]\n>\n";

        buttonsToRender.forEach((btn, index) => {
            markdownOutput += `>> [!info] ${btn.title}\n`;
            
            const buttonLines = btn.buttonBlock.split('\n');
            const indentedButtonBlock = buttonLines.map(line => `>> ${line}`).join('\n');
            
            markdownOutput += `${indentedButtonBlock}\n`;
            
            if (index < buttonsToRender.length - 1) {
                markdownOutput += ">\n"; 
            }
        });

        dv.paragraph(markdownOutput);
    } else {
        // Mensagem de debug amigável
        dv.paragraph(`<small>_Status: ${statusRaw} (Ciclo ${cicloAtualNum}). Nenhuma ação necessária._</small>`);
    }
}

await main();