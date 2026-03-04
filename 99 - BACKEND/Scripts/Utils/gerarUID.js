// SOTA - Gerador de Identificador Único (UID)
// Gera um ID curto, alfanumérico e aleatório para ser usado como chave primária.

module.exports = () => {
    const prefix = "sota"; // Prefixo para garantir que nossos IDs sejam reconhecíveis
    const randomPart = Math.random().toString(36).substring(2, 9); // 7 caracteres aleatórios
    const timestampPart = Date.now().toString(36).slice(-4); // 4 caracteres do timestamp para evitar colisões

    return `${prefix}-${randomPart}${timestampPart}`;
};