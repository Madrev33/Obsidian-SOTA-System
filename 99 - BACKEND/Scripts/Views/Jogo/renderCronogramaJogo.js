// Componente SOTA: renderCronogramaJogo.js (v1.1 - Leitura de Histórico)
// Exibe o cronograma e status do Jogo (Ciclos, Início, Fim).

async function main() {
    const idMidia = dv.current().midia_selecionada_id;
    const cicloSelecionado = dv.current().ciclo_selecionado_view;

    if (!idMidia) { dv.paragraph("❌ ERRO: 'midia_selecionada_id' não encontrado."); return; }
    
    const hub = dv.pages().where(p => p.id_midia === idMidia && p.tipo === "jogo_hub")[0];
    if (!hub) { dv.paragraph(`❌ ERRO: HUB de Jogo não encontrado.`); return; }
    
    if (!cicloSelecionado) { dv.paragraph("⚠️ Selecione um ciclo."); return; }

    // --- FUNÇÕES UTILITÁRIAS ---
    const formatarDataHora = (dt) => dt && dt.isValid ? dt.toFormat("dd/MM/yyyy 'às' HH:mm") : "N/A";

    const formatarDuracao = (dtFim, dtInicio) => {
        if (!dtInicio || !dtFim || !dtInicio.isValid || !dtFim.isValid) return "N/A";
        const diff = dtFim.diff(dtInicio, ['days', 'hours', 'minutes']).toObject();
        return `${Math.floor(diff.days || 0)}d ${Math.floor(diff.hours || 0)}h ${Math.floor(diff.minutes || 0)}m`;
    };

    const parseDateWithTime = (data, horaStr) => {
        if (!data) return null;
        let dt = dv.date(data);
        if (!dt || !dt.isValid) return null;
        if (horaStr) {
            const [hour, minute] = horaStr.split(':').map(Number);
            if (!isNaN(hour) && !isNaN(minute)) return dt.set({ hour, minute });
        }
        return dt;
    };
    
    // --- CORREÇÃO: Leitura do Histórico de Eventos ---
    const determinarFimDoCiclo = (ciclo) => {
        // 1. Tenta ler campos planos (Legado/Padrão Simples)
        const conclusaoDT = parseDateWithTime(ciclo.data_conclusao, ciclo.hora_conclusao);
        if (conclusaoDT && conclusaoDT.isValid) return { data: conclusaoDT, tipo: 'Finalizado' };
        
        const arquivamentoDT = parseDateWithTime(ciclo.data_arquivamento, ciclo.hora_arquivamento);
        if (arquivamentoDT && arquivamentoDT.isValid) return { data: arquivamentoDT, tipo: 'Arquivado' };

        // 2. Tenta ler do Histórico (Novo Padrão SOTA)
        if (ciclo.historico && Array.isArray(ciclo.historico)) {
            // Busca evento de conclusão
            const eventoConclusao = ciclo.historico.find(h => h.evento === 'conclusao_consumo' || h.evento === 'conclusao');
            if (eventoConclusao) {
                const dt = parseDateWithTime(eventoConclusao.data, eventoConclusao.hora);
                if (dt && dt.isValid) return { data: dt, tipo: 'Finalizado' };
            }
            
            // Busca evento de arquivamento
            const eventoArquivamento = ciclo.historico.find(h => h.evento === 'arquivamento');
            if (eventoArquivamento) {
                const dt = parseDateWithTime(eventoArquivamento.data, eventoArquivamento.hora);
                if (dt && dt.isValid) return { data: dt, tipo: 'Arquivado' };
            }
        }

        return null;
    };

    if (cicloSelecionado === "Visão Agregada (Todos os Ciclos)") {
        dv.span("**Histórico de Ciclos**");
        
        const criacaoDT = parseDateWithTime(hub.creation_date, hub.creation_time);
        const itensAgregados = [`**Criado em:** ${formatarDataHora(criacaoDT)}`];
        
        if (hub.ciclos && Array.isArray(hub.ciclos)) {
            const linhasCiclos = hub.ciclos.map(ciclo => {
                const inicioDT = parseDateWithTime(ciclo.data_inicio, ciclo.hora_inicio);
                const fimInfo = determinarFimDoCiclo(ciclo);
                const fimDT = fimInfo ? fimInfo.data : null;
                
                let duracaoStr = "N/A";
                if (fimDT) duracaoStr = formatarDuracao(fimDT, inicioDT);
                else if (inicioDT && inicioDT.isValid) duracaoStr = formatarDuracao(dv.date("now"), inicioDT) + " (Em andamento)";

                return `**Ciclo ${ciclo.ciclo}** > Início: ${formatarDataHora(inicioDT)} | Fim: ${fimDT ? formatarDataHora(fimDT) : "N/A"} | Duração: ${duracaoStr}`;
            });
            itensAgregados.push(...linhasCiclos);
        }
        
        dv.list(itensAgregados);

    } else {
        const numeroCiclo = parseInt(cicloSelecionado.replace('Ciclo ', ''));
        const cicloData = hub.ciclos ? hub.ciclos.find(c => c.ciclo === numeroCiclo) : null;

        dv.span(`**Status do ${cicloSelecionado}**`);
        if (cicloData) {
            const cronogramaItens = [];

            const statusFormatado = cicloData.status ? (cicloData.status.charAt(0).toUpperCase() + cicloData.status.slice(1)) : "N/D";
            cronogramaItens.push(`**Status:** ${statusFormatado}`);

            const inicioDT = parseDateWithTime(cicloData.data_inicio, cicloData.hora_inicio);
            cronogramaItens.push(`**Iniciado em:** ${formatarDataHora(inicioDT)}`);

            const fimInfo = determinarFimDoCiclo(cicloData);
            if (fimInfo && fimInfo.data) {
                cronogramaItens.push(`**${fimInfo.tipo} em:** ${formatarDataHora(fimInfo.data)}`);
                cronogramaItens.push(`**Tempo Total:** ${formatarDuracao(fimInfo.data, inicioDT)}`);
            } else if (inicioDT && inicioDT.isValid) {
                cronogramaItens.push(`**Tempo Decorrido:** ${formatarDuracao(dv.date("now"), inicioDT)}`);
            }
            
            dv.list(cronogramaItens);

        } else {
            dv.paragraph(`⚠️ Dados para o ${cicloSelecionado} não encontrados.`);
        }
    }
}

main();