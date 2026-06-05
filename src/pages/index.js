// pages/index.js
import Link from 'next/link';
import { useDiscord } from '@/contexts/DiscordContext';
import { FaGamepad, FaChess, FaLock, FaSkull } from 'react-icons/fa';
import { FiZap, FiUser, FiCpu, FiSettings } from 'react-icons/fi';
import { useEffect, useState } from 'react';

const games = [
  {
    id: "ttt",
    badge: "ESTRATÉGIA",
    title: "Jogo da Velha",
    desc: "Desafie uma IA baseada no algoritmo Minimax em um duelo tático de inteligência.",
    color: "emerald",
    icon: <FaChess size={28} />,
    path: "/game/ttt"
  },
  {
    id: "hangman",
    badge: "LÓGICA",
    title: "Jogo da Forca",
    desc: "Decifre a palavra secreta gerada por IA antes que suas tentativas se esgotem.",
    color: "purple",
    icon: <FaLock size={28} />,
    path: "/game/hangman"
  },
  {
    id: "snake",
    badge: "ARCADE",
    title: "Snake",
    desc: "Controle a serpente faminta, colete pontos e evite colidir com o próprio corpo.",
    color: "cyan",
    icon: <FiZap size={28} />,
    path: "/game/snake"
  },
  {
    id: "guess",
    badge: "MATEMÁTICA",
    title: "Adivinhe o Número",
    desc: "Use a lógica para descobrir o número secreto com base nos feedbacks de temperatura.",
    color: "orange",
    icon: <FiUser size={28} />,
    path: "/game/guess"
  },
  {
    id: "2048",
    badge: "PUZZLE",
    title: "2048",
    desc: "Combine os números estrategicamente para alcançar o mítico bloco 2048.",
    color: "blue",
    icon: <FiCpu size={28} />,
    path: "/game/2048"
  },
  {
    id: "zombies",
    badge: "AÇÃO",
    title: "Zombie Apocalypse",
    desc: "Sobreviva ao ataque dos zumbis em uma arena de sobrevivência intensa.",
    color: "red",
    icon: <FaSkull size={28} />,
    path: "/game/zombies"
  }
];

export default function GameHub() {
  const { auth, isAuthenticated } = useDiscord();
  const [isDiscordFrame, setIsDiscordFrame] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Verifica se está rodando dentro do Discord apenas no cliente
    const params = new URLSearchParams(window.location.search);
    setIsDiscordFrame(!!params.get('frame_id'));
  }, []);

  const colorClasses = {
    emerald: {
      border: "hover:border-emerald-500/50",
      bg: "group-hover:bg-emerald-500/5",
      text: "text-emerald-400",
      button: "bg-emerald-500 hover:bg-emerald-600",
      badge: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
    },
    purple: {
      border: "hover:border-purple-500/50",
      bg: "group-hover:bg-purple-500/5",
      text: "text-purple-400",
      button: "bg-purple-500 hover:bg-purple-600",
      badge: "bg-purple-500/10 border-purple-500/20 text-purple-400"
    },
    cyan: {
      border: "hover:border-cyan-500/50",
      bg: "group-hover:bg-cyan-500/5",
      text: "text-cyan-400",
      button: "bg-cyan-500 hover:bg-cyan-600",
      badge: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
    },
    orange: {
      border: "hover:border-orange-500/50",
      bg: "group-hover:bg-orange-500/5",
      text: "text-orange-400",
      button: "bg-orange-500 hover:bg-orange-600",
      badge: "bg-orange-500/10 border-orange-500/20 text-orange-400"
    },
    blue: {
      border: "hover:border-blue-500/50",
      bg: "group-hover:bg-blue-500/5",
      text: "text-blue-400",
      button: "bg-blue-500 hover:bg-blue-600",
      badge: "bg-blue-500/10 border-blue-500/20 text-blue-400"
    },
    red: {
      border: "hover:border-red-500/50",
      bg: "group-hover:bg-red-500/5",
      text: "text-red-400",
      button: "bg-red-500 hover:bg-red-600",
      badge: "bg-red-500/10 border-red-500/20 text-red-400"
    }
  };

  // Durante a hidratação, renderiza um estado neutro
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0f0f12]">
        {/* Header Skeleton */}
        <div className="fixed top-0 left-0 right-0 bg-[#0f0f12]/80 backdrop-blur-md border-b border-white/10 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <FaGamepad size={18} className="text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  Peepe
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-20 h-8 bg-white/5 rounded-lg animate-pulse" />
                <div className="w-24 h-8 bg-white/5 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="pt-28 pb-16 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="w-32 h-8 bg-white/5 rounded-full mx-auto mb-6 animate-pulse" />
            <div className="w-96 h-16 bg-white/5 rounded-xl mx-auto mb-4 animate-pulse" />
            <div className="w-64 h-6 bg-white/5 rounded-lg mx-auto animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Renderização normal após montagem
  return (
    <div className="min-h-screen bg-[#0f0f12]">
      {/* Background subtle gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-emerald-500/[0.02] via-transparent to-purple-500/[0.02] pointer-events-none" />

      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse animation-delay-1000" />
      </div>

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-[#0f0f12]/80 backdrop-blur-md border-b border-white/10 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group cursor-pointer">
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                <FaGamepad size={18} className="text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Peepe
              </span>
            </Link>
            
            {/* Right Section */}
            <div className="flex items-center gap-3">
              {/* Dashboard Button */}
              <Link 
                href="/dashboard"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 group"
              >
                <FiSettings size={16} className="text-gray-400 group-hover:text-emerald-400 transition-colors" />
                <span className="text-sm font-medium text-gray-300 group-hover:text-white">Dashboard</span>
              </Link>

              {/* Discord Status */}
              {isDiscordFrame ? (
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 ${
                  isAuthenticated 
                    ? 'bg-emerald-500/10 border-emerald-500/20' 
                    : 'bg-yellow-500/10 border-yellow-500/20'
                }`}>
                  <div className={`w-2 h-2 rounded-full animate-pulse ${
                    isAuthenticated ? 'bg-emerald-500' : 'bg-yellow-500'
                  }`} />
                  <span className={`text-xs font-medium ${
                    isAuthenticated ? 'text-emerald-400' : 'text-yellow-400'
                  }`}>
                    {isAuthenticated ? auth?.user?.username || 'Conectado' : 'Conectando...'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-500/10 border border-gray-500/20 rounded-full">
                  <div className="w-2 h-2 bg-gray-500 rounded-full" />
                  <span className="text-xs text-gray-400 font-medium">Modo Demo</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative pt-28 pb-16 px-6 max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6 animate-fade-in">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs text-gray-400 uppercase tracking-wider font-mono">Game Hub</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-4 animate-fade-in-up">
            <span className="text-white">Biblioteca de </span>
            <span className="bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 bg-clip-text text-transparent animate-gradient">
              Jogos
            </span>
          </h1>
          
          <p className="text-gray-400 text-lg max-w-2xl mx-auto animate-fade-in-up animation-delay-100">
            Escolha seu jogo favorito e desafie suas habilidades em experiências únicas
          </p>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game, index) => {
            const colors = colorClasses[game.color];
            
            return (
              <Link 
                key={game.id} 
                href={game.path}
                className="group animate-fade-in-up"
                style={{ animationDelay: `${150 + index * 50}ms` }}
              >
                <div className={`relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${colors.border}`}>
                  {/* Hover Gradient Overlay */}
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${colors.bg}`} />
                  
                  {/* Content */}
                  <div className="relative p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className={`px-2 py-1 rounded-md ${colors.badge}`}>
                        <span className="text-[10px] font-bold tracking-wider">
                          {game.badge}
                        </span>
                      </div>
                      <div className={`${colors.text} transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                        {game.icon}
                      </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-bold text-white mb-2 group-hover:translate-x-1 transition-transform duration-300">
                      {game.title}
                    </h2>
                    
                    {/* Description */}
                    <p className="text-gray-400 text-sm leading-relaxed mb-5 line-clamp-2">
                      {game.desc}
                    </p>

                    {/* Play Button */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/10">
                      <span className="text-xs text-gray-500 font-mono">Clique para jogar</span>
                      <div className={`w-9 h-9 rounded-full ${colors.button} flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:translate-x-1 shadow-lg`}>
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-20 pt-8 border-t border-white/5 text-center">
          <p className="text-gray-600 text-xs">
            Desenvolvido com <span className="text-red-400">❤️</span> para a comunidade Peepe
          </p>
        </div>
      </div>
    </div>
  );
}