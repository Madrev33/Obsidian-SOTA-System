// Componente SOTA: renderStatusCicloGenerico.js v3.0
// Exibe o status de ciclo para mídias atômicas (Filmes, Vídeos, etc.).
// ATUALIZAÇÃO: Implementa visão de lista histórica para "Todos os Ciclos".

async function main() {
    const idMidia = dv.current().midia_selecionada_id;
    if (!idMidia) { dv.paragraph("❌ ERRO: 'midia_selecionada_id' não encontrado."); return; }

    // Busca pelo id_midia
    const hub = dv.pages().where(p => p.id_midia === idMidia)[0];
    if (!hub) { dv.paragraph(`❌ ERRO: HUB com id_midia "${idMidia}" não encontrado.`); return; }

    const cicloSelecionadoView = dv.current().ciclo_selecionado_view;
    if (!cicloSelecionadoView) { dv.paragraph("⚠️ Selecione um ciclo para visualizar."); return; }

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

    const determinarFimDoCiclo = (ciclo) => {
        const conclusaoDT = parseDateWithTime(ciclo.data_conclusao, ciclo.hora_conclusao);
        if (conclusaoDT && conclusaoDT.isValid) {
            return { data: conclusaoDT, tipo: 'Consumo Finalizado' };
        }
        const arquivamentoDT = parseDateWithTime(ciclo.data_arquivamento, ciclo.hora_arquivamento);
        if (arquivamentoDT && arquivamentoDT.isValid) {
            return { data: arquivamentoDT, tipo: 'Arquivado' };
        }
        return null;
    };

    // --- LÓGICA DE VISUALIZAÇÃO ---

    if (cicloSelecionadoView === "Visão Agregada (Todos os Ciclos)") {
        dv.span("**Visão Geral de Todos os Ciclos**");
        
        const criacaoDT = parseDateWithTime(hub.creation_date, hub.creation_time);
        let tempoDeIncubacao = "N/A";
        
        // Tenta calcular incubação se houver ciclos
        if (hub.ciclos && hub.ciclos.length > 0) {
            const ciclo1 = hub.ciclos.find(c => c.ciclo === 1);
            if (criacaoDT && ciclo1) {
                const inicioCiclo1DT = parseDateWithTime(ciclo1.data_inicio, ciclo1.hora_inicio);
                tempoDeIncubacao = formatarDuracao(inicioCiclo1DT, criacaoDT);
            }
        }
        
        const itensAgregados = [`**Tempo de Incubação (até Ciclo 1):** ${tempoDeIncubacao}`];
        
        if (hub.ciclos && Array.isArray(hub.ciclos)) {
            const linhasCiclos = hub.ciclos.map(ciclo => {
                const inicioDT = parseDateWithTime(ciclo.data_inicio, ciclo.hora_inicio);
                const fimInfo = determinarFimDoCiclo(ciclo);
                const fimDT = fimInfo ? fimInfo.data : null;
                
                // Se não tem fim, usa "Agora" para duração (se iniciado) ou "N/A"
                let duracaoStr = "N/A";
                if (fimDT) {
                    duracaoStr = formatarDuracao(fimDT, inicioDT);
                } else if (inicioDT && inicioDT.isValid) {
                    duracaoStr = formatarDuracao(dv.date("now"), inicioDT) + " (Em andamento)";
                }

                return `**Ciclo ${ciclo.ciclo}** > **Início:** ${formatarDataHora(inicioDT)} // **Fim:** ${fimDT ? formatarDataHora(fimDT) : "N/A"} // **Duração:** ${duracaoStr}`;
            });
            itensAgregados.push(...linhasCiclos);
        }
        
        dv.list(itensAgregados);

    } else {
        // Visualização de Ciclo Único (Mantida a lógica anterior)
        const numeroCiclo = parseInt(cicloSelecionadoView.replace('Ciclo ', ''));
        let cicloParaExibir = null;
        if (hub.ciclos) {
            cicloParaExibir = hub.ciclos.find(c => c.ciclo === numeroCiclo);
        }

        dv.span(`**Status do ${cicloSelecionadoView}**`);
        
        if (cicloParaExibir) {
            const itensDaLista = [];
            const statusFormatado = cicloParaExibir.status ? (cicloParaExibir.status.charAt(0).toUpperCase() + cicloParaExibir.status.slice(1)) : "N/D";
            itensDaLista.push(`**Status:** ${statusFormatado}`);
            
            const inicioDT = parseDateWithTime(cicloParaExibir.data_inicio, cicloParaExibir.hora_inicio);
            itensDaLista.push(`**Iniciado em:** ${formatarDataHora(inicioDT)}`);

            const fimInfo = determinarFimDoCiclo(cicloParaExibir);
            if (fimInfo && fimInfo.data) {
                itensDaLista.push(`**${fimInfo.tipo} em:** ${formatarDataHora(fimInfo.data)}`);
                itensDaLista.push(`**Duração do Ciclo:** ${formatarDuracao(fimInfo.data, inicioDT)}`);
            } else if (inicioDT && inicioDT.isValid) {
                itensDaLista.push(`**Tempo Decorrido:** ${formatarDuracao(dv.date("now"), inicioDT)}`);
            }
            dv.list(itensDaLista);
        } else {
            dv.paragraph(`⚠️ Dados para o ${cicloSelecionadoView} não encontrados.`);
        }
    }
}
main();