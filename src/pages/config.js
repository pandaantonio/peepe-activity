// pages/config.js
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FaDiscord, FaArrowLeft, FaCheckCircle, FaUserCircle } from 'react-icons/fa';
import { useDiscord } from '@/contexts/DiscordContext';
import Navbar from '@/components/Navbar'; // Importando a nova Navbar

export default function ConfigPage() {
  const [user, setUser] = useState(null);
  const router = useRouter();
  const { discordUser, loginWithDiscord } = useDiscord();

  useEffect(() => {
    const localUser = localStorage.getItem('user');
    if (localUser) {
      try {
        setUser(JSON.parse(localUser));
      } catch (e) {
        console.error("Erro ao carregar usuário local", e);
      }
    } else {
      router.push('/login');
    }
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#06060b] flex items-center justify-center text-gray-400">
        Carregando informações da conta...
      </div>
    );
  }

  const discordId = discordUser?.id || user?.discordId;
  const discordUsername = discordUser?.username || user?.discordUsername || "Conta Vinculada";
  const isDiscordConnected = !!discordId;

  return (
    <div className="min-h-screen bg-[#020205] text-gray-100 font-sans relative flex flex-col items-center justify-center p-6 pt-28">
      
      {/* NAVBAR INCORPORADA */}
      <Navbar />

      <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="glass-card w-full max-w-md rounded-2xl border border-white/10 p-8 relative z-10 shadow-2xl">
        
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition-colors">
          <FaArrowLeft size={12} /> Voltar ao Hub
        </Link>

        <h1 className="text-2xl font-bold text-white mb-2">Configurações da Conta</h1>
        <p className="text-xs text-gray-400 mb-6">Gerencie suas conexões e informações de perfil.</p>

        {/* Informações da Conta Local */}
        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 mb-5 flex items-center gap-4">
          <FaUserCircle size={40} className="text-cyan-400" />
          <div>
            <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">Nome de Usuário</div>
            <div className="text-lg font-semibold text-white">{user.username}</div>
          </div>
        </div>

        {/* Integração com o Discord */}
        <div className="border-t border-white/10 pt-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-3">Vínculos de Terceiros</h2>

          {isDiscordConnected ? (
            <div className="bg-[#5865F2]/10 border border-[#5865F2]/30 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FaDiscord size={24} className="text-[#5865F2]" />
                  <div>
                    <div className="text-xs text-[#a5b4fc] font-medium">Discord Sincronizado</div>
                    <div className="text-sm font-bold text-white">{discordUsername}</div>
                    <div className="text-[10px] text-gray-500 font-mono">ID: {discordId}</div>
                  </div>
                </div>
                <FaCheckCircle className="text-emerald-400" size={18} />
              </div>
              <p className="text-xs text-gray-400">
                Sua conta local está corretamente pareada ao seu ID do Discord.
              </p>
            </div>
          ) : (
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <FaDiscord size={24} className="text-gray-400" />
                <div>
                  <div className="text-xs text-gray-400 font-medium">Discord</div>
                  <div className="text-sm font-medium text-gray-400">Não conectado</div>
                </div>
              </div>
              <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                Conecte seu Discord para sincronizar avatares, participar de salas exclusivas e liberar conquistas em tempo real.
              </p>
              <button
                onClick={loginWithDiscord}
                className="w-full bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold text-sm py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-[#5865F2]/20"
              >
                <FaDiscord size={18} /> Conectar ao Discord
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .glass-card {
          background: rgba(10, 10, 15, 0.85);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
        }
      `}</style>
    </div>
  );
}