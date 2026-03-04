// Componente SOTA: renderCronogramaLeitura.js (v2.1 - Correção de Busca de HUB)
// Responsável por exibir o cronograma de leitura com base no ciclo selecionado no dashboard.

async function main() {
    const sotaLog = (step, data) => console.log(`[SOTA Cronograma] - ${step}`, data !== undefined ? data : "");

    const idMidia = dv.current().midia_selecionada_id;
    const tipoMidia = dv.current().midia_selecionada_tipo;
    const cicloSelecionadoView = dv.current().ciclo_selecionado_view;

    if (!idMidia) {
        dv.paragraph("❌ ERRO: 'midia_selecionada_id' não encontrado no frontmatter do Dashboard.");
        return;
    }
 
    // --- CORREÇÃO APLICADA AQUI ---
    const hubArray = dv.pages().where(p => p.id_midia === idMidia && p.tipo === "livro_paginado_hub");
    if (hubArray.length === 0) {
        dv.paragraph(`❌ ERRO: HUB de Livro com id_midia "${idMidia}" não encontrado.`);
        return;
    }
    const hub = hubArray[0];
 
    if (!cicloSelecionadoView) {
        dv.paragraph("⚠️ Por favor, selecione um ciclo para visualizar os detalhes.");
        return;
    }
 
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
 
    if (cicloSelecionadoView === "Visão Agregada (Todos os Ciclos)") {
        dv.span("**Visão Geral de Todos os Ciclos**");
        
        const criacaoDT = parseDateWithTime(hub.creation_date, hub.creation_time);
        const ciclo1 = hub.ciclos.find(c => c.ciclo === 1);
        let tempoDeIncubacao = "N/A";
        if (criacaoDT && ciclo1) {
            const inicioCiclo1DT = parseDateWithTime(ciclo1.data_inicio, ciclo1.hora_inicio);
            tempoDeIncubacao = formatarDuracao(inicioCiclo1DT, criacaoDT);
        }
        
        const itensAgregados = [];
        itensAgregados.push(`**Tempo de Incubação (até Ciclo 1):** ${tempoDeIncubacao}`);
        
        const linhasCiclos = hub.ciclos.map(ciclo => {
            const inicioDT = parseDateWithTime(ciclo.data_inicio, ciclo.hora_inicio);
            const conclusaoDT = parseDateWithTime(ciclo.data_conclusao, ciclo.hora_conclusao);
            return `**Ciclo ${ciclo.ciclo}** > **Início:** ${formatarDataHora(inicioDT)} // **Fim:** ${formatarDataHora(conclusaoDT)} // **Duração:** ${formatarDuracao(conclusaoDT, inicioDT)}`;
        });

        itensAgregados.push(...linhasCiclos);
        dv.list(itensAgregados);
 
    } else {
        const numeroCiclo = parseInt(cicloSelecionadoView.replace('Ciclo ', ''));
        const cicloData = hub.ciclos.find(c => c.ciclo === numeroCiclo);
 
        dv.span(`**Visão Geral do ${cicloSelecionadoView}**`);
        if (cicloData) {
            const isCicloAtual = hub.ciclo_de_consumo_atual === numeroCiclo;
            const cronogramaItens = [];
 
            const statusFormatado = cicloData.status ? (cicloData.status.charAt(0).toUpperCase() + cicloData.status.slice(1)) : "N/D";
            cronogramaItens.push(`**Status:** ${statusFormatado}`);
 
            const inicioDT = parseDateWithTime(cicloData.data_inicio, cicloData.hora_inicio);
            cronogramaItens.push(`**Iniciado em:** ${formatarDataHora(inicioDT)}`);
 
            if (cicloData.data_conclusao) {
                const conclusaoDT = parseDateWithTime(cicloData.data_conclusao, cicloData.hora_conclusao);
                cronogramaItens.push(`**Concluído em:** ${formatarDataHora(conclusaoDT)}`);
                cronogramaItens.push(`**Tempo de Leitura:** ${formatarDuracao(conclusaoDT, inicioDT)}`);
            } else {
                if(inicioDT && inicioDT.isValid) {
                    cronogramaItens.push(`**Tempo Decorrido:** ${formatarDuracao(dv.date("now"), inicioDT)}`);
                }
            }
            
            const paginasLidas = hub.leitura_pagina_atual || 0;
            const totalPaginas = hub.total_paginas || 1;
            const progresso = totalPaginas > 0 ? Math.round((paginasLidas / totalPaginas) * 100) : 0;
            cronogramaItens.push(`**Progresso de Leitura:** ${progresso}% <progress value='${paginasLidas}' max='${totalPaginas}'></progress>`);

            dv.list(cronogramaItens);
 
        } else {
            dv.paragraph(`⚠️ Dados para o ${cicloSelecionadoView} não encontrados.`);
        }
    }
}
 
main();