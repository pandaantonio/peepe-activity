import React from 'react';
import { useRouter } from 'next/router';
import { FaArrowLeft, FaRobot, FaBrain, FaSkull, FaUsers } from 'react-icons/fa';

export default function TicTacToeSelection() {
  const router = useRouter();

  const difficulties = [
    {
      id: 'easy',
      title: 'Modo Fácil',
      description: 'A IA toma decisões majoritariamente aleatórias. Ideal para aquecimento.',
      icon: <FaRobot size={36} />,
      path: '/game/ttt/easy',
      color: 'emerald',
      accent: 'from-emerald-500/20 to-emerald-600/10',
      border: 'border-emerald-500/30'
    },
    {
      id: 'medium',
      title: 'Modo Médio',
      description: 'Equilíbrio tático. A IA calcula algumas jogadas, mas ainda comete deslizes humanos.',
      icon: <FaBrain size={36} />,
      path: '/game/ttt/medium',
      color: 'amber',
      accent: 'from-amber-500/20 to-orange-600/10',
      border: 'border-amber-500/30'
    },
    {
      id: 'impossible',
      title: 'Modo Impossível',
      description: 'Minimax puro e implacável. O algoritmo prevê todos os cenários. O melhor resultado é o empate.',
      icon: <FaSkull size={36} />,
      path: '/game/ttt/impossible',
      color: 'rose',
      accent: 'from-rose-500/20 to-red-600/10',
      border: 'border-rose-500/30'
    },
    {
      id: 'multiplayer',
      title: 'Multiplayer com Amigos',
      description: 'Desafie um amigo em tempo real. Um joga como X, o outro como O. Sincronização via BroadcastChannel.',
      icon: <FaUsers size={36} />,
      path: '/game/ttt/multiplayer',
      color: 'violet',
      accent: 'from-violet-500/20 to-purple-600/10',
      border: 'border-violet-500/30'
    },
  ];

  return (
    <div className="min-h-screen bg-[#05050a] relative overflow-hidden text-white">
      {/* Fundo Espacial */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(at_50%_30%,rgba(129,140,248,0.08)_0%,transparent_60%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(at_20%_70%,rgba(167,139,250,0.07)_0%,transparent_60%)]"></div>
        
        {/* Estrelas */}
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(white 0.7px, transparent 1px)`,
          backgroundSize: '70px 70px',
          opacity: 0.55
        }}></div>

        <div className="absolute top-10 left-20 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 right-20 w-[700px] h-[700px] bg-cyan-500/10 rounded-full blur-[130px]" />
      </div>

      {/* Topbar */}
      <div className="relative z-20 pt-6 px-6">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <button 
            onClick={() => router.push('/')} 
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <FaArrowLeft size={20} />
            <span className="font-medium">Voltar ao Hub</span>
          </button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">
              Jogo da Velha
            </h1>
            <p className="text-gray-400 text-sm">Escolha seu modo de batalha cósmica</p>
          </div>

          <div className="w-10" />
        </div>
      </div>

      {/* Cards com cor */}
      <div className="relative z-20 flex items-center justify-center min-h-[calc(100vh-140px)] px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl w-full">
          {difficulties.map((diff, index) => (
            <div
              key={diff.id}
              onClick={() => router.push(diff.path)}
              className={`group relative overflow-hidden rounded-3xl border ${diff.border} bg-gradient-to-br ${diff.accent} p-10 cursor-pointer transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl hover:shadow-cyan-500/10`}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              {/* Glow sutil no topo */}
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent" />

              <div className="flex flex-col items-center text-center h-full">
                <div className="mb-8 p-6 rounded-2xl bg-black/30 backdrop-blur-md border border-white/10 group-hover:scale-110 transition-transform">
                  {diff.icon}
                </div>

                <h2 className="text-2xl font-semibold mb-4 text-white group-hover:text-cyan-200 transition-colors">
                  {diff.title}
                </h2>

                <p className="text-gray-300 leading-relaxed mb-10 flex-1">
                  {diff.description}
                </p>

                <button className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/20 hover:border-cyan-400 text-white font-medium transition-all group-hover:scale-105">
                  {diff.id === 'multiplayer' ? 'Iniciar Sessão Multiplayer' : 'Iniciar Missão'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}