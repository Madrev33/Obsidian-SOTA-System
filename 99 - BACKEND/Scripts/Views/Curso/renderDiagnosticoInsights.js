// Componente SOTA: renderDiagnosticoInsights.js (para Cursos) v1.2
// CORREÇÃO: Altera a busca de aulas para usar o sota_uid do HUB.

async function main() {
    const idMidia = dv.current().midia_selecionada_id;
    const tipoMidia = dv.current().midia_selecionada_tipo;
    const cicloSelecionado = dv.current().ciclo_selecionado_view;
    const sortBy = dv.current().sort_by_insights || 'path';
    const sortOrder = dv.current().sort_order_insights || 'asc';

    if (!idMidia) { dv.paragraph("❌ ERRO: 'midia_selecionada_id' não encontrado no frontmatter do Dashboard."); return; }
    
    const hub = dv.pages().where(p => p.id_midia === idMidia && p.tipo === "curso_hub")[0];
    if (!hub) { dv.paragraph(`❌ ERRO: HUB de Curso com id_midia "${idMidia}" não encontrado.`); return; }

    if (!cicloSelecionado) { dv.paragraph("⚠️ Selecione um ciclo para ver o diagnóstico."); return; }

    if (cicloSelecionado === "Visão Agregada (Todos os Ciclos)") { dv.span("**Resumo de Insights (Todos os Ciclos)**"); } 
    else { dv.span(`**Resumo de Insights (${cicloSelecionado})**`); }

    const cursoFolder = hub.file.folder.split('/').slice(0, -1).join('/');
    const modulosFolder = `${cursoFolder}/Módulos`;

    let aulas;
    // --- CORREÇÃO APLICADA AQUI ---
    if (cicloSelecionado === "Visão Agregada (Todos os Ciclos)") {
        aulas = dv.pages(`"${modulosFolder}"`).where(p => p.tipo === 'curso_aula' && p.hub_uid === hub.sota_uid);
    } else {
        const numeroCiclo = parseInt(cicloSelecionado.replace('Ciclo ', ''));
        if (isNaN(numeroCiclo)) { dv.paragraph("⚠️ Ciclo selecionado inválido."); return; }
        const cicloFolderPath = `${modulosFolder}/Ciclo_${String(numeroCiclo).padStart(2, '0')}`;
        // A busca dentro da pasta do ciclo já filtra a maioria, a condição `p.ciclo` é um reforço.
        aulas = dv.pages(`"${cicloFolderPath}"`).where(p => p.tipo === 'curso_aula' && p.hub_uid === hub.sota_uid && p.ciclo === numeroCiclo);
    }

    if (aulas.length > 0) {
        const totalIdeias = aulas.ideias_geradas.values.reduce((a, b) => (a || 0) + (b || 0), 0);
        const totalReflexoes = aulas.reflexoes_geradas.values.reduce((a, b) => (a || 0) + (b || 0), 0);
        dv.paragraph(`**Total:** 💡 ${totalIdeias} Ideias | 🤔 ${totalReflexoes} Reflexões`);

        const dadosOrdenados = aulas.sort(p => p[sortBy] || p.file[sortBy], sortOrder);

        const moduloHubs = dv.pages().where(p => p.tipo === 'curso_modulo_hub' && p.hub_uid === hub.sota_uid);

        const headers = cicloSelecionado === "Visão Agregada (Todos os Ciclos)" 
            ? ["Ciclo", "Módulo", "Aula", "💡 Ideias", "🤔 Reflexões"] 
            : ["Módulo", "Aula", "💡 Ideias", "🤔 Reflexões"];

        const tableData = dadosOrdenados.map(p => {
            const moduloHubCorrespondente = moduloHubs.find(m => p.file.folder.includes(m.file.folder));
            const numeroModulo = moduloHubCorrespondente ? moduloHubCorrespondente.numero_modulo : "N/A";
            
            const linkAula = dv.fileLink(p.file.path, false, `Aula ${p.numero_aula}`);

            const row = [
                `Módulo ${numeroModulo}`,
                linkAula,
                p.ideias_geradas || 0,
                p.reflexoes_geradas || 0
            ];

            if (cicloSelecionado === "Visão Agregada (Todos os Ciclos)") {
                const cicloMatch = p.file.path.match(/Ciclo_(\d+)/);
                const cicloNum = cicloMatch ? `Ciclo ${parseInt(cicloMatch[1])}` : "N/A";
                row.unshift(cicloNum);
            }

            return row;
        });

        dv.table(headers, tableData);
    } else {
        dv.paragraph("Nenhuma aula com insights encontrada para o período selecionado.");
    }
}
main();