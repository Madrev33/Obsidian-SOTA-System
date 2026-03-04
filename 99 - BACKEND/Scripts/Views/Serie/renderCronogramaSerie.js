// Componente SOTA: renderCronogramaSerie.js 
async function main() {
    const idMidia = dv.current().midia_selecionada_id;
    const tipoMidia = dv.current().midia_selecionada_tipo;
    const cicloSelecionado = dv.current().ciclo_selecionado_view;

    if (!idMidia) {
        dv.paragraph("❌ ERRO: 'midia_selecionada_id' não encontrado no frontmatter do Dashboard.");
        return;
    }
 
    const hubArray = dv.pages().where(p => p.id_midia === idMidia && p.tipo === "serie_hub");
    if (hubArray.length === 0) {
        dv.paragraph(`❌ ERRO: HUB de Série com ID ${idMidia} não encontrado.`);
        return;
    }
    const hub = hubArray[0];
 
    if (!cicloSelecionado) {
        dv.paragraph("⚠️ Por favor, selecione um ciclo para visualizar os detalhes.");
        return;
    }
 
    // --- FUNÇÕES UTILITÁRIAS (Sem alterações) ---
    const formatarDataHora = (dt) => {
        if (!dt || !dt.isValid) return "N/A";
        return dt.toFormat("dd/MM/yyyy 'às' HH:mm");
    };
 
    const formatarDuracao = (dtFim, dtInicio) => {
        if (!dtInicio || !dtFim || !dtInicio.isValid || !dtFim.isValid) return "N/A";
        const diffSegundos = dtFim.diff(dtInicio, 'seconds').seconds;
        if (diffSegundos < 0) return "N/A";

        const d = Math.floor(diffSegundos / (3600 * 24));
        const h = Math.floor((diffSegundos % (3600 * 24)) / 3600);
        const m = Math.floor((diffSegundos % 3600) / 60);

        return `${d}d ${h}h ${m}m`;
    };
 
    const parseDateWithTime = (data, horaStr) => {
        if (!data) return null;
        let dt = (data && data.isLuxonDateTime) ? data : dv.date(data);
        if (!dt || !dt.isValid) return null;

        if (horaStr) {
            const [hour, minute] = horaStr.split(':').map(Number);
            if (!isNaN(hour) && !isNaN(minute)) {
                return dt.set({ hour, minute, second: 0, millisecond: 0 });
            }
        }
        return dt.startOf('day');
    };

    // --- FUNÇÃO DE LÓGICA CENTRALIZADA (LÓGICA INVERTIDA) ---
    const determinarFimDoCiclo = (ciclo) => {
        // Prioridade 1: Último evento de "conclusao_consumo" no histórico
        if (Array.isArray(ciclo.historico) && ciclo.historico.length > 0) {
            const ultimoEventoConclusao = ciclo.historico
                .filter(h => h.evento === 'conclusao_consumo')
                .pop(); // Pega o último
            
            if (ultimoEventoConclusao) {
                const conclusaoDT = parseDateWithTime(ultimoEventoConclusao.data, ultimoEventoConclusao.hora);
                if (conclusaoDT && conclusaoDT.isValid) {
                    return { data: conclusaoDT, tipo: 'Consumo Finalizado' };
                }
            }
        }

        // Prioridade 2 (Fallback): Data de Arquivamento (fim definitivo, se não houver 'conclusao_consumo')
        const arquivamentoDT = parseDateWithTime(ciclo.data_arquivamento, ciclo.hora_arquivamento);
        if (arquivamentoDT && arquivamentoDT.isValid) {
            return { data: arquivamentoDT, tipo: 'Arquivado' };
        }
        
        // Se nenhum dos acima, o ciclo está em andamento.
        return null;
    };
 
    if (cicloSelecionado === "Visão Agregada (Todos os Ciclos)") {
        dv.span("**Visão Geral de Todos os Ciclos**");
        
        const criacaoDT = parseDateWithTime(hub.creation_date, hub.creation_time);
        const ciclo1 = hub.ciclos.find(c => c.ciclo === 1);
        let tempoDeIncubacao = "N/A";
        if (criacaoDT && ciclo1) {
            const inicioCiclo1DT = parseDateWithTime(ciclo1.data_inicio, ciclo1.hora_inicio);
            tempoDeIncubacao = formatarDuracao(inicioCiclo1DT, criacaoDT);
        }
        
        const itensAgregados = [`**Tempo de Incubação (até Ciclo 1):** ${tempoDeIncubacao}`];
        const linhasCiclos = hub.ciclos.map(ciclo => {
            const inicioDT = parseDateWithTime(ciclo.data_inicio, ciclo.hora_inicio);
            const fimInfo = determinarFimDoCiclo(ciclo);
            const fimDT = fimInfo ? fimInfo.data : null;
            return `**Ciclo ${ciclo.ciclo}** > **Início:** ${formatarDataHora(inicioDT)} // **Fim:** ${formatarDataHora(fimDT)} // **Duração:** ${formatarDuracao(fimDT, inicioDT)}`;
        });

        itensAgregados.push(...linhasCiclos);
        dv.list(itensAgregados);
 
    } else {
        const numeroCiclo = parseInt(cicloSelecionado.replace('Ciclo ', ''));
        const cicloData = hub.ciclos.find(c => c.ciclo === numeroCiclo);
 
        dv.span(`**Visão Geral do ${cicloSelecionado}**`);
        if (cicloData) {
            const cronogramaItens = [];
 
            const statusFormatado = cicloData.status ? (cicloData.status.charAt(0).toUpperCase() + cicloData.status.slice(1)) : "N/D";
            cronogramaItens.push(`**Status:** ${statusFormatado}`);
 
            const inicioDT = parseDateWithTime(cicloData.data_inicio, cicloData.hora_inicio);
            cronogramaItens.push(`**Iniciado em:** ${formatarDataHora(inicioDT)}`);
 
            const fimInfo = determinarFimDoCiclo(cicloData);
            const fimDT = fimInfo ? fimInfo.data : null;

            if (fimDT && fimDT.isValid) {
                cronogramaItens.push(`**${fimInfo.tipo} em:** ${formatarDataHora(fimDT)}`);
                cronogramaItens.push(`**Duração do Ciclo:** ${formatarDuracao(fimDT, inicioDT)}`);
            } else {
                if(inicioDT && inicioDT.isValid) {
                    cronogramaItens.push(`**Tempo Decorrido:** ${formatarDuracao(dv.date("now"), inicioDT)}`);
                }
            }
            
            dv.list(cronogramaItens);
 
        } else {
            dv.paragraph(`⚠️ Dados para o ${cicloSelecionado} não encontrados.`);
        }
    }
}
 
main();