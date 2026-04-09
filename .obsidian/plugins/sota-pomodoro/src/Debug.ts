// SOTA - Módulo de Logging para Depuração Ativa (v1.0)
// Fornece um logger contextualizado para rastrear o fluxo de execução.

// Alterne para `true` para ver todas as mensagens de depuração no console.
const DEBUG_ENABLED = false;

const LOG_PREFIX = "SOTA DEBUG:";

/**
 * Registra uma mensagem de depuração no console do desenvolvedor se DEBUG_ENABLED for verdadeiro.
 * @param module O nome do módulo/arquivo onde o log está sendo chamado (ex: "SotaSync", "Timer").
 * @param message A mensagem principal a ser registrada.
 * @param data (Opcional) Quaisquer dados (objetos, variáveis) a serem incluídos na saída.
 */
export function sotaLog(module: string, message: string, data?: any): void {
    if (!DEBUG_ENABLED) {
        return;
    }

    const timestamp = new Date().toLocaleTimeString('pt-BR', { hour12: false });
    const formattedMessage = `%c${LOG_PREFIX}%c [${timestamp}] %c[${module}]%c ${message}`;
    
    // Estilos para colorir a saída do console
    const styles = [
        'color: #FFD700; font-weight: bold;', // Amarelo para o prefixo
        'color: #777;',                        // Cinza para o timestamp
        'color: #33A1FF; font-weight: bold;', // Azul para o nome do módulo
        'color: #FFFFFF;',                     // Branco para a mensagem
    ];

    if (data !== undefined) {
        console.log(formattedMessage, ...styles, data);
    } else {
        console.log(formattedMessage, ...styles);
    }
}