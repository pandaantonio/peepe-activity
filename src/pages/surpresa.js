// pages/surpresa.js
import Link from 'next/link';

export default function Surpresa() {
  return (
    <div className="min-h-screen bg-[#0f0f12] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Efeito de Fundo */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.03] via-transparent to-emerald-500/[0.03] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-3xl bg-white/5 border border-white/10 rounded-2xl p-4 md:p-8 backdrop-blur-md shadow-2xl relative z-10">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent">
            Vídeo Local
          </h1>
          <Link href="/">
            <button className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all">
              ← Voltar ao Hub
            </button>
          </Link>
        </div>

        {/* Player de Vídeo Nativo e Responsivo */}
        <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-inner border border-white/10 bg-black">
          <video 
            className="w-full h-full object-contain"
            controls
            autoPlay
            playsInline
            src="/videos/surpresa.mp4" /* Caminho apontando para a pasta public */
          >
            Seu navegador não suporta a reprodução de vídeos.
          </video>
        </div>
        
      </div>
    </div>
  );
}