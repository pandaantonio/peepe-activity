// pages/index.js
import Link from 'next/link';
import { FaChess, FaUsers, FaLock, FaSlidersH } from 'react-icons/fa';
import { FiZap, FiUser, FiCpu } from 'react-icons/fi';
import { useEffect, useState } from 'react';
import { useDiscord } from '@/contexts/DiscordContext';

const games = [
  {
    id: "tntrun",
    badge: "NOVIDADE",
    title: "Tnt run",
    desc: "Controle um robô em um grid de hexágonos coloridos. 5 segundos para pisar na cor certa ou caia no abismo!",
    color: "purple",
    icon: <FiZap size={24} />,
    path: "/game/tntrun",
    banner: "/imgs/tntrun.png"
  },
  {
    id: "hexagon",
    badge: "NOVIDADE",
    title: "Hexagon Color Rush",
    desc: "Controle um robô em um grid de hexágonos coloridos. 5 segundos para pisar na cor certa ou caia no abismo!",
    color: "purple",
    icon: <FiZap size={24} />,
    path: "/game/hexagon",
    banner: "/imgs/hexagon.png"
  },
  {
    id: "ttt",
    badge: "ESTRATÉGIA",
    title: "Jogo da Velha",
    desc: "Jogue contra a IA Minimax ou desafie seus amigos no modo multiplayer.",
    color: "emerald",
    icon: <FaChess size={24} />,
    path: "/game/ttt",
    banner: "/imgs/ttt.png"
  },
  {
    id: "hangman",
    badge: "LÓGICA",
    title: "Jogo da Forca",
    desc: "Decifre a palavra secreta gerada por IA antes que suas tentativas se esgotem.",
    color: "orange",
    icon: <FaLock size={24} />,
    path: "/game/hangman",
    banner: "/imgs/hangman.png"
  },
  {
    id: "snake",
    badge: "ARCADE",
    title: "Snake",
    desc: "Controle a serpente faminta, colete pontos e evite colidir com o próprio corpo.",
    color: "cyan",
    icon: <FiZap size={24} />,
    path: "/game/snake",
    banner: "/imgs/snake.png"
  },
  {
    id: "guess",
    badge: "MATEMÁTICA",
    title: "Adivinhe o Número",
    desc: "Use a lógica para descobrir o número secreto com base nos feedbacks de temperatura.",
    color: "orange",
    icon: <FiUser size={24} />,
    path: "/game/guess",
    banner: "/imgs/guess.png"
  },
  {
    id: "2048",
    badge: "PUZZLE",
    title: "2048",
    desc: "Combine os números estrategicamente para alcançar o mítico bloco 2048.",
    color: "blue",
    icon: <FiCpu size={24} />,
    path: "/game/2048",
    banner: "/imgs/2048.jpg"
  },
];

export default function GameHub() {
  const { isContextReady, isDiscordFrame, username, userAvatar } = useDiscord();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const colorClasses = {
    emerald: { accent: "text-emerald-400", glow: "shadow-emerald-500/30", border: "border-emerald-500/20" },
    cyan: { accent: "text-cyan-400", glow: "shadow-cyan-500/30", border: "border-cyan-500/20" },
    purple: { accent: "text-purple-400", glow: "shadow-purple-500/30", border: "border-purple-500/20" },
    orange: { accent: "text-orange-400", glow: "shadow-orange-500/30", border: "border-orange-500/20" },
    blue: { accent: "text-blue-400", glow: "shadow-blue-500/30", border: "border-blue-500/20" },
    indigo: { accent: "text-indigo-400", glow: "shadow-indigo-500/30", border: "border-indigo-500/20" }
  };

  const displayItems = [...games];

  if (!mounted || (isDiscordFrame && !isContextReady)) {
    return (
      <div className="min-h-screen bg-[#0a0a0c]">
        <div className="pt-24 pb-16 px-6 max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <div className="w-28 h-7 bg-white/5 rounded-full mx-auto mb-8 animate-pulse" />
            <div className="w-80 h-14 bg-white/5 rounded-2xl mx-auto mb-4 animate-pulse" />
            <div className="w-56 h-5 bg-white/5 rounded-lg mx-auto animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-72 bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05050a] relative overflow-hidden">
      {/* Fundo Espacial */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(at_50%_30%,rgba(129,140,248,0.08)_0%,transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(at_20%_70%,rgba(167,139,250,0.07)_0%,transparent_50%)]"></div>

        {/* Estrelas */}
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(white 0.8px, transparent 1px)`,
          backgroundSize: '80px 80px',
          opacity: 0.6
        }}></div>

        <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-1/3 w-[700px] h-[700px] bg-cyan-500/10 rounded-full blur-[130px]" />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative pt-16 pb-16 px-6 max-w-6xl mx-auto z-10">
        {isDiscordFrame && username && (
          <div className="flex items-center justify-end gap-3 mb-6 text-white/80 text-sm bg-white/5 w-fit ml-auto px-4 py-2 rounded-xl border border-white/10">
            <img src={userAvatar} alt={username} className="w-6 h-6 rounded-full" />
            <span>Olá, <b>{username}</b></span>
          </div>
        )}

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tighter">
            <span className="text-white/90">Explorando o </span>
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(165,243,252,0.5)]">
              Universo dos Jogos
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-md mx-auto">
            Entre no cosmos e desafie suas habilidades intergalácticas ✨
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayItems.map((item, index) => {
            const colors = colorClasses[item.color];
            return (
              <Link
                key={item.id}
                href={item.path}
                className="group"
                style={{ animationDelay: `${80 + index * 70}ms` }}
              >
                <div className={`glass-card rounded-3xl overflow-hidden border ${colors.border} ${colors.glow} transition-all duration-500 hover:-translate-y-3 hover:scale-[1.02]`}>

                  {item.banner && (
                    <div className="relative overflow-hidden">
                      <img
                        src={item.banner}
                        alt={item.title}
                        className="w-full h-52 object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-125"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#05050a]/70 to-[#05050a]" />
                    </div>
                  )}

                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`px-3 py-1 text-xs font-bold tracking-widest rounded-full border ${colors.badge || 'bg-white/5 text-white/70 border-white/10'}`}>
                        {item.badge}
                      </div>
                      <div className={`${colors.accent} text-2xl transition-transform group-hover:rotate-12 duration-300`}>
                        {item.icon}
                      </div>
                    </div>

                    <h2 className="text-2xl font-semibold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                      {item.title}
                    </h2>

                    <p className="text-gray-400 text-sm leading-relaxed line-clamp-3 mb-6">
                      {item.desc}
                    </p>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-cyan-400 font-medium flex items-center gap-1">
                        Iniciar missão <span className="text-lg">→</span>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .glass-card {
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(148, 163, 184, 0.15);
          box-shadow: 0 10px 30px -10px rgb(0 0 0 / 0.5);
        }
        .glass-card:hover {
          background: rgba(30, 41, 59, 0.9);
          box-shadow: 0 30px 60px -15px rgb(165 243 252 / 0.15), 
                      inset 0 1px 0 rgba(255,255,255,0.08);
        }
        .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  );
}