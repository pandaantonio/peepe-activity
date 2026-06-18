// pages/index.js
import Link from 'next/link';
import { FaChess, FaLock, FaDiscord } from 'react-icons/fa';
import { FiZap, FiUser, FiCpu, FiLogOut } from 'react-icons/fi';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useDiscord } from '@/contexts/DiscordContext'; // Importando para saber se está no Discord

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
  const { isContextReady, isDiscordFrame, currentUserRaw } = useDiscord(); // Pegando dados do Discord
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [linking, setLinking] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);

    async function handleAuthCheck() {
      const localUser = localStorage.getItem('user');
      
      if (localUser) {
        setUser(JSON.parse(localUser));
        return;
      }

      // Se não está logado localmente, mas ESTÁ dentro do Discord, tenta o Login Automático pelo ID do Discord
      if (isDiscordFrame && isContextReady && currentUserRaw?.id) {
        try {
          const res = await fetch('/api/auth/discord-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ discordId: currentUserRaw.id })
          });

          if (res.ok) {
            const data = await res.json();
            const loggedUser = { username: data.username, discordId: data.discordId };
            localStorage.setItem('user', JSON.stringify(loggedUser));
            setUser(loggedUser);
            return;
          }
        } catch (err) {
          console.error("Falha ao tentar login automático:", err);
        }
      }

      // Se falhou tudo e não achou conta vinculada, joga para a tela de Login tradicional
      if (isContextReady || !isDiscordFrame) {
        router.push('/login');
      }
    }

    handleAuthCheck();
  }, [router, isDiscordFrame, isContextReady, currentUserRaw]);

  // Função para vincular a conta atual com o ID do Discord ativo
  const handleLinkDiscord = async () => {
    if (!user || !currentUserRaw?.id || linking) return;
    setLinking(true);

    try {
      const res = await fetch('/api/auth/link-discord', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, discordId: currentUserRaw.id })
      });

      if (res.ok) {
        const updatedUser = { ...user, discordId: currentUserRaw.id };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      } else {
        alert("Erro ao vincular conta.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLinking(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  const colorClasses = {
    emerald: { accent: "text-emerald-400", glow: "shadow-emerald-500/30", border: "border-emerald-500/20" },
    cyan: { accent: "text-cyan-400", glow: "shadow-cyan-500/30", border: "border-cyan-500/20" },
    purple: { accent: "text-purple-400", glow: "shadow-purple-500/30", border: "border-purple-500/20" },
    orange: { accent: "text-orange-400", glow: "shadow-orange-500/30", border: "border-orange-500/20" },
    blue: { accent: "text-blue-400", glow: "shadow-blue-500/30", border: "border-blue-500/20" },
    indigo: { accent: "text-indigo-400", glow: "shadow-indigo-500/30", border: "border-indigo-500/20" }
  };

  if (!mounted || !user) {
    return (
      <div className="min-h-screen bg-[#020205]">
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

  // Define se a conta atual do usuário já possui o mesmo ID do Discord ativo salvo
  const isLinked = user.discordId && currentUserRaw?.id && user.discordId === currentUserRaw.id;

  return (
    <div className="min-h-screen bg-[#020205] relative overflow-hidden">
      
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#020205] border-b border-white/5 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-end gap-3">
          
          {/* Botão Logotipo do Discord (Aparece apenas dentro do Discord Frame) */}
          {isDiscordFrame && currentUserRaw?.id && (
            <button
              onClick={handleLinkDiscord}
              disabled={isLinked || linking}
              className={`p-2 rounded-xl border flex items-center justify-center transition-all duration-300 ${
                isLinked 
                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-lg shadow-emerald-500/10" 
                  : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
              }`}
              title={isLinked ? "Conta do Discord vinculada!" : "Vincular esta conta ao seu Discord"}
            >
              <FaDiscord size={18} />
            </button>
          )}

          <div className="flex items-center gap-3 text-white/80 text-sm bg-white/5 px-4 py-1.5 rounded-xl border border-white/5">
            <div className="w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <FiUser size={13} />
            </div>
            <span className="text-cyan-400 font-bold">{user.username}</span>
            
            <button 
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-400 transition-colors flex items-center border-l border-white/10 pl-3 ml-1"
              title="Sair da Conta"
            >
              <FiLogOut size={16} />
            </button>
          </div>

        </div>
      </nav>

      {/* FUNDO DO CÉU NOTURNO */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.7) 0.8px, transparent 1px)`,
          backgroundSize: '70px 70px',
          opacity: 0.45
        }}></div>
      </div>

      <div className="relative pt-24 pb-16 px-6 max-w-6xl mx-auto z-10">
        
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
          {games.map((item, index) => {
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
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#020205]/70 to-[#020205]" />
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
          background: rgba(10, 10, 15, 0.85);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 10px 30px -10px rgb(0 0 0 / 0.7);
        }
        .glass-card:hover {
          background: rgba(20, 20, 28, 0.95);
          border-color: rgba(255, 255, 255, 0.15);
          box-shadow: 0 30px 60px -15px rgb(165 243 252 / 0.05), 
                      inset 0 1px 0 rgba(255,255,255,0.05);
        }
        .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  );
}