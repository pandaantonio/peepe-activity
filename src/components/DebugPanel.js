// components/DebugPanel.js
import { useState, useEffect } from 'react';
import { subscribe, clearLogs } from '@/lib/debugLogger';

export default function DebugPanel() {
  const [logs, setLogs] = useState([]);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    return subscribe(setLogs);
  }, []);

  const levelColors = {
    info: 'text-blue-400',
    warn: 'text-yellow-400',
    error: 'text-red-400',
    success: 'text-emerald-400',
  };

  const levelBg = {
    info: 'bg-blue-500/10 border-blue-500/20',
    warn: 'bg-yellow-500/10 border-yellow-500/20',
    error: 'bg-red-500/10 border-red-500/20',
    success: 'bg-emerald-500/10 border-emerald-500/20',
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] max-w-md w-full">
      {/* Botão toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="mb-2 px-3 py-1.5 rounded-lg bg-black/80 border border-white/10 text-xs text-gray-400 hover:text-white transition-colors"
      >
        {isOpen ? 'Ocultar Logs' : `Mostrar Logs (${logs.length})`}
      </button>

      {isOpen && (
        <div className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden max-h-[400px] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
            <span className="text-xs font-mono text-gray-400">Debug Logs</span>
            <button
              onClick={clearLogs}
              className="text-[10px] text-gray-500 hover:text-red-400 transition-colors"
            >
              Limpar
            </button>
          </div>

          {/* Logs */}
          <div className="overflow-y-auto p-3 space-y-2 max-h-[350px]">
            {logs.length === 0 ? (
              <p className="text-xs text-gray-600 text-center py-4">Nenhum log ainda...</p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={`rounded-lg border p-2.5 ${levelBg[log.level]}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] text-gray-500 font-mono">{log.timestamp}</span>
                    <span className={`text-[10px] font-bold uppercase ${levelColors[log.level]}`}>
                      {log.level}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 break-words">{log.message}</p>
                  {log.data && (
                    <pre className="mt-1.5 text-[10px] text-gray-500 bg-black/40 rounded p-1.5 overflow-x-auto">
                      {log.data}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
