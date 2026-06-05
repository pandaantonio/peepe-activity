// pages/index.js
import Link from 'next/link';
import { useDiscord } from '@/hooks/useDiscord';
import { FaGamepad } from 'react-icons/fa';
import { FiUser, FiCpu, FiZap } from 'react-icons/fi';
import { FaSkull, FaChess, FaLock } from 'react-icons/fa';

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
  const { auth } = useDiscord();
  const isDiscordFrame = typeof window !== 'undefined' && 
    new URLSearchParams(window.location.search).get('frame_id');

  return (
    <div className="min-h-screen bg-[#0f0f12]">
      {/* Background subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.02] via-transparent to-purple-500/[0.02] pointer-events-none" />

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-[#0f0f12]/80 backdrop-blur-sm border-b border-white/5 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <FaGamepad size={18} className="text-white" />
              </div>
              <span className="text-xl font-bold text-white">Peepe</span>
            </div>
            
            {/* Status do Discord */}
            {isDiscordFrame && auth ? (
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-xs text-emerald-400">
                  {auth.user?.username}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                <span className="text-xs text-yellow-400">Modo Demo</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-24 pb-16 px-6 max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs text-gray-400 uppercase tracking-wider">Game Hub</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="text-white">Biblioteca de </span>
            <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">Jogos</span>
          </h1>
          
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Escolha seu jogo favorito e desafie suas habilidades
          </p>
        </div>

        {/* Games Grid - USANDO Link do Next.js */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {games.map((game) => {
            const colorClasses = {
              emerald: "hover:border-emerald-500/50 group-hover:bg-emerald-500/5",
              purple: "hover:border-purple-500/50 group-hover:bg-purple-500/5",
              cyan: "hover:border-cyan-500/50 group-hover:bg-cyan-500/5",
              orange: "hover:border-orange-500/50 group-hover:bg-orange-500/5",
              blue: "hover:border-blue-500/50 group-hover:bg-blue-500/5",
              red: "hover:border-red-500/50 group-hover:bg-red-500/5"
            };
            
            const buttonColors = {
              emerald: "bg-emerald-500 hover:bg-emerald-600",
              purple: "bg-purple-500 hover:bg-purple-600",
              cyan: "bg-cyan-500 hover:bg-cyan-600",
              orange: "bg-orange-500 hover:bg-orange-600",
              blue: "bg-blue-500 hover:bg-blue-600",
              red: "bg-red-500 hover:bg-red-600"
            };

            const iconColors = {
              emerald: "text-emerald-400",
              purple: "text-purple-400",
              cyan: "text-cyan-400",
              orange: "text-orange-400",
              blue: "text-blue-400",
              red: "text-red-400"
            };

            return (
              <Link key={game.id} href={game.path} legacyBehavior>
                <a className="group relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${colorClasses[game.color]}`} />
                  
                  <div className="relative p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <span className="text-xs font-mono text-gray-500 tracking-wider">
                        {game.badge}
                      </span>
                      <div className={`${iconColors[game.color]} group-hover:scale-110 transition-transform duration-300`}>
                        {game.icon}
                      </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-bold text-white mb-2">
                      {game.title}
                    </h2>
                    
                    {/* Description */}
                    <p className="text-gray-400 text-sm leading-relaxed mb-5">
                      {game.desc}
                    </p>

                    {/* Play Button */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <span className="text-xs text-gray-500">Clique para jogar</span>
                      <div className={`w-8 h-8 rounded-full ${buttonColors[game.color]} flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1`}>
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </a>
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-gray-500 text-xs">
            Desenvolvido com ❤️ para a comunidade Peepe
          </p>
        </div>
      </div>
    </div>
  );
}