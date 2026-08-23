// lib/debugLogger.js
import { getDiscordSDK } from "./discord";

// Função utilitária interna para despachar o log para o Discord se o SDK estiver pronto
function sendToDiscordLog(level, message, object = null) {
  try {
    const sdk = getDiscordSDK();
    
    // Concatena o objeto em string se ele existir para não perder dados no log
    const fullMessage = object 
      ? `${message} | Dados: ${JSON.stringify(object)}` 
      : message;

    // Se o SDK já foi instanciado, envia para o console do Discord
    if (sdk && sdk.commands && typeof sdk.commands.captureLog === 'function') {
      sdk.commands.captureLog({
        level: level, // 'log' | 'warn' | 'error' | 'info'
        message: fullMessage,
      });
    }
  } catch (err) {
    // Fallback silencioso para evitar que um erro no logger quebre a aplicação
    console.error("Erro interno no debugLogger:", err);
  }
}

export function logInfo(message, object) {
  console.log(`ℹ️ [INFO] ${message}`, object || '');
  sendToDiscordLog('info', message, object);
}

export function logWarn(message, object) {
  console.warn(`⚠️ [WARN] ${message}`, object || '');
  sendToDiscordLog('warn', message, object);
}

export function logError(message, object) {
  console.error(`🚨 [ERROR] ${message}`, object || '');
  sendToDiscordLog('error', message, object);
}

export function logSuccess(message, object) {
  console.log(`✅ [SUCCESS] ${message}`, object || '');
  // 'success' não é um nível padrão do captureLog, usamos 'log' como fallback
  sendToDiscordLog('log', `✅ ${message}`, object);
}