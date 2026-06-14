// lib/debugLogger.js
// Sistema de logs visível na UI para debug em Discord Activities (sem console)

let logs = [];
let listeners = [];

export function addLog(level, message, data = null) {
  const entry = {
    id: Date.now() + Math.random(),
    timestamp: new Date().toLocaleTimeString('pt-BR'),
    level, // 'info', 'warn', 'error', 'success'
    message,
    data: data ? JSON.stringify(data, null, 2) : null,
  };
  logs.push(entry);
  // Manter apenas últimos 100 logs
  if (logs.length > 100) logs = logs.slice(-100);
  listeners.forEach(fn => fn([...logs]));
}

export function getLogs() {
  return [...logs];
}

export function clearLogs() {
  logs = [];
  listeners.forEach(fn => fn([]));
}

export function subscribe(callback) {
  listeners.push(callback);
  callback([...logs]);
  return () => {
    listeners = listeners.filter(fn => fn !== callback);
  };
}

export const logInfo = (msg, data) => addLog('info', msg, data);
export const logWarn = (msg, data) => addLog('warn', msg, data);
export const logError = (msg, data) => addLog('error', msg, data);
export const logSuccess = (msg, data) => addLog('success', msg, data);
