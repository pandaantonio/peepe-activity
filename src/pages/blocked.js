// pages/blocked.js
import Link from 'next/link';
import { FaDiscord, FaExclamationTriangle } from 'react-icons/fa';

export default function BlockedPage() {
  return (
    <div className="min-h-screen bg-[#0f0f12] flex items-center justify-center p-6">
      <div className="fixed inset-0 bg-gradient-to-br from-red-500/[0.02] via-transparent to-purple-500/[0.02] pointer-events-none" />
      
      <div className="relative max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
            <FaExclamationTriangle size={40} className="text-red-500" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-3">
          Acesso Restrito
        </h1>
        
        <p className="text-gray-400 mb-6">
          Este aplicativo só pode ser acessado através do Discord.
          Por favor, abra esta atividade dentro do aplicativo do Discord.
        </p>
        
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <FaDiscord size={20} className="text-[#5865F2]" />
            <span className="text-sm font-medium text-white">Como acessar:</span>
          </div>
          <p className="text-xs text-gray-500">
            1. Abra o Discord no desktop ou navegador<br />
            2. Vá para o servidor que contém esta atividade<br />
            3. Clique no botão "Iniciar Atividade"
          </p>
        </div>
        
        <Link 
          href="https://discord.com/app"
          target="_blank"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg transition-all duration-300 hover:scale-105"
        >
          <FaDiscord size={18} />
          Abrir Discord
        </Link>
      </div>
    </div>
  );
}