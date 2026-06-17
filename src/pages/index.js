// pages/index.js
import Link from 'next/link';
import { FaChess, FaUsers, FaLock, FaSlidersH } from 'react-icons/fa';
import { FiZap, FiUser, FiCpu } from 'react-icons/fi';
import { useEffect, useState } from 'react';
import { useDiscord } from '@/contexts/DiscordContext';

const games = [
  // ... (mantenha a sua lista de jogos idêntica)
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
    desc: "Desafie uma IA baseada no algoritmo Minimax em um duelo tático de inteligência.",
    color: "emerald",
    icon: <FaChess size={24} />,
    path: "/game/ttt",
    banner: "/imgs/tttai.png"
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
  // Alterado para buscar as propriedades corretas do seu context
  const { isContextReady, isDiscordFrame, username, userAvatar } = useDiscord();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const colorClasses = {
    emerald: { accent: "text-emerald-400", glow: "shadow-emerald-500/20", border: "border-emerald-500/15", badge: "bg-emerald-500/8 text-emerald-400 border-emerald-500/20" },
    cyan: { accent: "text-cyan-400", glow: "shadow-cyan-500/20", border: "border-cyan-500/15", badge: "bg-cyan-500/8 text-cyan-400 border-cyan-500/20" },
    purple: { accent: "text-purple-400", glow: "shadow-purple-500/20", border: "border-purple-500/15", badge: "bg-purple-500/8 text-purple-400 border-purple-500/20" },
    orange: { accent: "text-orange-400", glow: "shadow-orange-500/20", border: "border-orange-500/15", badge: "bg-orange-500/8 text-orange-400 border-orange-500/20" },
    blue: { accent: "text-blue-400", glow: "shadow-blue-500/20", border: "border-blue-500/15", badge: "bg-blue-500/8 text-blue-400 border-blue-500/20" },
    indigo: { accent: "text-indigo-400", glow: "shadow-indigo-500/20", border: "border-indigo-500/15", badge: "bg-indigo-500/8 text-indigo-400 border-indigo-500/20" }
  };

  const displayItems = [...games];

  // CORREÇÃO DA TRAVA: 
  // Se não estiver montado no cliente, ou se for o frame do Discord e o contexto ainda estiver carregando, mostra o esqueleto.
  // Se NÃO for um frame do Discord, ignora o carregamento do SDK e renderiza direto.
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
    <div className="min-h-screen bg-[#0a0a0c] relative overflow-hidden">
      {/* Background decorativo */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-emerald-500/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/[0.03] rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/[0.01] rounded-full blur-[150px]" />
      </div>

      <div className="relative pt-16 pb-16 px-6 max-w-6xl mx-auto">
        
        {/* Opcional: Mostrar perfil do usuário do Discord caso ele exista */}
        {isDiscordFrame && username && (
          <div className="flex items-center justify-end gap-3 mb-6 text-white/80 text-sm bg-white/5 w-fit ml-auto px-4 py-2 rounded-xl border border-white/5">
            <img src={userAvatar} alt={username} className="w-6 h-6 rounded-full" />
            <span>Olá, <b>{username}</b></span>
          </div>
        )}

        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold mb-3 tracking-tight animate-fade-in-up">
            <span className="text-white/90">Biblioteca de </span>
            <span className="liquid-glass-title px-5 py-1.5 rounded-2xl inline-block">
              Jogos
            </span>
          </h1>

          <p className="text-gray-500 text-base max-w-lg mx-auto mb-6 animate-fade-in-up animation-delay-100">
            Escolha seu jogo favorito e desafie suas habilidades
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayItems.map((item, index) => {
            const colors = colorClasses[item.color];

            return (
              <Link
                key={item.id}
                href={item.path}
                className="group animate-fade-in-up"
                style={{ animationDelay: `${100 + index * 60}ms` }}
              >
                <div className="glass-card rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-white/5 group-hover:border-white/15">

                  {item.banner && (
                    <div className="w-full relative overflow-hidden">
                      <img
                        src={item.banner}
                        alt={item.title}
                        className="w-full h-44 object-cover block transition-all duration-700 group-hover:scale-105 group-hover:brightness-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/40 to-transparent" />
                    </div>
                  )}

                  <div className="relative p-5 -mt-8">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`px-2.5 py-1 rounded-md border text-[10px] font-semibold tracking-wider uppercase ${colors.badge}`}>
                        {item.badge}
                      </div>
                      <div className={`${colors.accent} opacity-60 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110`}>
                        {item.icon}
                      </div>
                    </div>

                    <h2 className="text-lg font-semibold text-white/90 mb-2 group-hover:text-white transition-colors duration-300">
                      {item.title}
                    </h2>

                    <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-2">
                      {item.desc}
                    </p>

                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <span className="text-[11px] text-gray-600 font-medium">
                        Jogar agora
                      </span>
                      <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center transition-all duration-300 group-hover:bg-white/10 group-hover:border-white/20 group-hover:translate-x-0.5">
                        <svg className="w-3.5 h-3.5 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ... (mantenha suas tags <style jsx> idênticas) */}
      <style jsx>{`
        .glass-card { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.06); box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.04); }
        .glass-card:hover { background: rgba(255, 255, 255, 0.05); box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.06); }
        .glass-button { background: rgba(255, 255, 255, 0.02); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
        .glass-button:hover { background: rgba(255, 255, 255, 0.06); border-color: rgba(52, 211, 153, 0.3); box-shadow: 0 8px 32px rgba(16, 185, 129, 0.08); }
        .liquid-glass-title { background: linear-gradient(135deg, rgba(52, 211, 153, 0.08), rgba(16, 185, 129, 0.02)); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(52, 211, 153, 0.15); box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.08), 0 4px 24px rgba(16, 185, 129, 0.08); color: rgba(52, 211, 153, 0.9); text-shadow: 0 0 20px rgba(52, 211, 153, 0.2); }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.5s ease-out; }
        .animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; opacity: 0; }
        .animation-delay-100 { animation-delay: 100ms; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  );
}