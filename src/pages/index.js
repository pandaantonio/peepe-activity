// pages/index.js
import Link from 'next/link';
import { FaChess, FaUsers, FaLock, FaSlidersH, FaCoins, FaGem, FaBolt, FaPlus } from 'react-icons/fa';
import { FiZap, FiUser, FiCpu } from 'react-icons/fi';
import { useEffect, useState, useRef } from 'react';
import { useDiscord } from '@/contexts/DiscordContext';

const games = [
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
    id: "tttai",
    badge: "ESTRATÉGIA",
    title: "Jogo da Velha (IA)",
    desc: "Desafie uma IA baseada no algoritmo Minimax em um duelo tático de inteligência.",
    color: "emerald",
    icon: <FaChess size={24} />,
    path: "/game/tttai",
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
  const { isContextReady, user } = useDiscord();
  const [mounted, setMounted] = useState(false);
  const [coins, setCoins] = useState(0);
  const [displayCoins, setDisplayCoins] = useState(0);
  const [gems, setGems] = useState(0);
  const [dailyAvailable, setDailyAvailable] = useState(false);
  const [collectingDaily, setCollectingDaily] = useState(false);
  const [coinAnim, setCoinAnim] = useState(false);
  const prevCoinsRef = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Animate coin count
  useEffect(() => {
    if (coins !== displayCoins) {
      const diff = coins - displayCoins;
      const step = Math.sign(diff) * Math.max(1, Math.abs(Math.floor(diff / 10)));
      const timer = setTimeout(() => {
        setDisplayCoins(prev => {
          const next = prev + step;
          if (Math.abs(next - coins) < Math.abs(step)) return coins;
          return next;
        });
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [coins, displayCoins]);

  // Trigger animation when coins increase
  useEffect(() => {
    if (coins > prevCoinsRef.current && prevCoinsRef.current > 0) {
      setCoinAnim(true);
      setTimeout(() => setCoinAnim(false), 800);
    }
    prevCoinsRef.current = coins;
  }, [coins]);

  // Fetch coins
  useEffect(() => {
    if (!user?.id) return;

    const fetchCoins = async () => {
      try {
        const res = await fetch(`/api/users/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setCoins(data.coins || 0);
          setGems(data.gems || 0);

          const now = Date.now();
          const oneDay = 24 * 60 * 60 * 1000;
          const lastDaily = data.lastDaily || 0;
          setDailyAvailable(now - lastDaily >= oneDay);
        }
      } catch (err) {
        console.error('Error fetching coins:', err);
      }
    };

    fetchCoins();
    const interval = setInterval(fetchCoins, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const collectDaily = async () => {
    if (!user?.id || collectingDaily) return;

    setCollectingDaily(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'daily' })
      });

      if (res.ok) {
        const data = await res.json();
        setCoins(data.coins);
        setDailyAvailable(false);
      }
    } catch (err) {
      console.error('Error collecting daily:', err);
    } finally {
      setCollectingDaily(false);
    }
  };

  const colorClasses = {
    emerald: {
      accent: "text-emerald-400",
      glow: "shadow-emerald-500/20",
      border: "border-emerald-500/15",
      badge: "bg-emerald-500/8 text-emerald-400 border-emerald-500/20"
    },
    cyan: {
      accent: "text-cyan-400",
      glow: "shadow-cyan-500/20",
      border: "border-cyan-500/15",
      badge: "bg-cyan-500/8 text-cyan-400 border-cyan-500/20"
    },
    purple: {
      accent: "text-purple-400",
      glow: "shadow-purple-500/20",
      border: "border-purple-500/15",
      badge: "bg-purple-500/8 text-purple-400 border-purple-500/20"
    },
    orange: {
      accent: "text-orange-400",
      glow: "shadow-orange-500/20",
      border: "border-orange-500/15",
      badge: "bg-orange-500/8 text-orange-400 border-orange-500/20"
    },
    blue: {
      accent: "text-blue-400",
      glow: "shadow-blue-500/20",
      border: "border-blue-500/15",
      badge: "bg-blue-500/8 text-blue-400 border-blue-500/20"
    },
    indigo: {
      accent: "text-indigo-400",
      glow: "shadow-indigo-500/20",
      border: "border-indigo-500/15",
      badge: "bg-indigo-500/8 text-indigo-400 border-indigo-500/20"
    }
  };

  const displayItems = [...games];

  if (!mounted || !isContextReady) {
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
      {/* Background ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-emerald-500/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/[0.03] rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/[0.01] rounded-full blur-[150px]" />
      </div>

      {/* === GAME HUD TOP BAR === */}
      <div className="fixed top-0 left-0 right-0 z-50 px-3 py-2">
        <div className="max-w-6xl mx-auto flex items-center justify-between">

          {/* LEFT: Avatar/Level Badge */}
          <div className="flex items-center gap-2">
            <div className="level-badge">
              <div className="level-outer">
                <div className="level-inner">
                  <span className="level-text">16</span>
                </div>
              </div>
              <div className="level-crown">👑</div>
            </div>

            {/* XP Bar */}
            <div className="xp-bar-container">
              <div className="xp-bar-bg">
                <div className="xp-bar-fill" style={{ width: '65%' }} />
              </div>
              <div className="xp-bar-text">XP</div>
            </div>
          </div>

          {/* RIGHT: Currency Bars */}
          <div className="flex items-center gap-2">

            {/* Coins Bar */}
            <div className={`currency-bar coin-bar ${coinAnim ? 'currency-bump' : ''}`}>
              <div className="currency-icon coin-icon">
                <FaCoins className="text-yellow-900 text-xs" />
              </div>
              <span className="currency-value coin-value">
                {displayCoins.toLocaleString()}
              </span>
              <button className="currency-plus coin-plus">
                <FaPlus className="text-xs" />
              </button>
            </div>

            {/* Gems Bar */}
            <div className="currency-bar gem-bar">
              <div className="currency-icon gem-icon">
                <FaGem className="text-purple-900 text-xs" />
              </div>
              <span className="currency-value gem-value">
                {gems.toLocaleString()}
              </span>
              <button className="currency-plus gem-plus">
                <FaPlus className="text-xs" />
              </button>
            </div>

            {/* Energy Bar */}
            <div className="currency-bar energy-bar">
              <div className="currency-icon energy-icon">
                <FaBolt className="text-orange-900 text-xs" />
              </div>
              <span className="currency-value energy-value">
                310/50
              </span>
              <button className="currency-plus energy-plus">
                <FaPlus className="text-xs" />
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Daily Reward Floating Button */}
      {dailyAvailable && (
        <div className="fixed top-14 right-3 z-50">
          <button
            onClick={collectDaily}
            disabled={collectingDaily}
            className="daily-float-btn"
          >
            <div className="daily-float-glow" />
            <div className="daily-float-inner">
              <FaCoins className="text-yellow-400 text-lg" />
              <span className="text-xs font-bold text-white">+100</span>
            </div>
            <div className="daily-float-ping" />
          </button>
        </div>
      )}

      <div className="relative pt-20 pb-16 px-6 max-w-6xl mx-auto">
        {/* Header */}
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

          <div className="animate-fade-in-up animation-delay-100">
            <Link 
              href="/dashboard" 
              className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-xl glass-button text-sm font-medium text-white/80 border border-white/10 hover:text-white transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-black/10"
            >
              <FaSlidersH className="text-emerald-400 text-base" />
              <span>Acessar Painel de Controle</span>
            </Link>
          </div>
        </div>

        {/* Grid de Jogos */}
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

      <style jsx>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          box-shadow: 
            0 1px 2px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.04);
        }

        .glass-card:hover {
          background: rgba(255, 255, 255, 0.05);
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.3),
            0 0 0 1px rgba(255, 255, 255, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.06);
        }

        .glass-button {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        .glass-button:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(52, 211, 153, 0.3);
          box-shadow: 0 8px 32px rgba(16, 185, 129, 0.08);
        }

        .liquid-glass-title {
          background: linear-gradient(135deg, rgba(52, 211, 153, 0.08), rgba(16, 185, 129, 0.02));
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(52, 211, 153, 0.15);
          box-shadow: 
            inset 0 1px 1px rgba(255, 255, 255, 0.08),
            0 4px 24px rgba(16, 185, 129, 0.08);
          color: rgba(52, 211, 153, 0.9);
          text-shadow: 0 0 20px rgba(52, 211, 153, 0.2);
        }

        /* === LEVEL BADGE === */
        .level-badge {
          position: relative;
          width: 42px;
          height: 42px;
        }

        .level-outer {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: linear-gradient(135deg, #8b5cf6, #6d28d9);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 
            0 2px 8px rgba(139, 92, 246, 0.4),
            inset 0 1px 0 rgba(255,255,255,0.2);
          border: 2px solid #a78bfa;
        }

        .level-inner {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7c3aed, #5b21b6);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .level-text {
          color: white;
          font-size: 14px;
          font-weight: 900;
          text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        }

        .level-crown {
          position: absolute;
          top: -8px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 12px;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
        }

        /* === XP BAR === */
        .xp-bar-container {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 2px;
        }

        .xp-bar-bg {
          width: 60px;
          height: 8px;
          background: rgba(0,0,0,0.5);
          border-radius: 4px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.1);
        }

        .xp-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #10b981, #34d399);
          border-radius: 4px;
          transition: width 0.5s ease;
        }

        .xp-bar-text {
          font-size: 8px;
          color: rgba(255,255,255,0.5);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* === CURRENCY BARS === */
        .currency-bar {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 3px 3px 3px 2px;
          border-radius: 20px;
          position: relative;
          min-width: 90px;
          transition: transform 0.15s ease;
        }

        .currency-bar:active {
          transform: scale(0.95);
        }

        .coin-bar {
          background: linear-gradient(180deg, rgba(234, 179, 8, 0.15), rgba(234, 179, 8, 0.05));
          border: 1.5px solid rgba(234, 179, 8, 0.3);
          box-shadow: 
            0 2px 8px rgba(234, 179, 8, 0.15),
            inset 0 1px 0 rgba(255,255,255,0.1);
        }

        .gem-bar {
          background: linear-gradient(180deg, rgba(168, 85, 247, 0.15), rgba(168, 85, 247, 0.05));
          border: 1.5px solid rgba(168, 85, 247, 0.3);
          box-shadow: 
            0 2px 8px rgba(168, 85, 247, 0.15),
            inset 0 1px 0 rgba(255,255,255,0.1);
        }

        .energy-bar {
          background: linear-gradient(180deg, rgba(249, 115, 22, 0.15), rgba(249, 115, 22, 0.05));
          border: 1.5px solid rgba(249, 115, 22, 0.3);
          box-shadow: 
            0 2px 8px rgba(249, 115, 22, 0.15),
            inset 0 1px 0 rgba(255,255,255,0.1);
        }

        .currency-icon {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 
            0 1px 3px rgba(0,0,0,0.2),
            inset 0 1px 0 rgba(255,255,255,0.3);
        }

        .coin-icon {
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
        }

        .gem-icon {
          background: linear-gradient(135deg, #c084fc, #a855f7);
        }

        .energy-icon {
          background: linear-gradient(135deg, #fb923c, #f97316);
        }

        .currency-value {
          font-size: 13px;
          font-weight: 800;
          flex: 1;
          text-align: center;
          letter-spacing: -0.3px;
          text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        }

        .coin-value {
          color: #fbbf24;
        }

        .gem-value {
          color: #c084fc;
        }

        .energy-value {
          color: #fb923c;
        }

        .currency-plus {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }

        .coin-plus {
          background: linear-gradient(135deg, #16a34a, #15803d);
          color: white;
          border: 1px solid rgba(255,255,255,0.2);
        }

        .coin-plus:hover {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          transform: scale(1.1);
        }

        .gem-plus {
          background: linear-gradient(135deg, #16a34a, #15803d);
          color: white;
          border: 1px solid rgba(255,255,255,0.2);
        }

        .gem-plus:hover {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          transform: scale(1.1);
        }

        .energy-plus {
          background: linear-gradient(135deg, #16a34a, #15803d);
          color: white;
          border: 1px solid rgba(255,255,255,0.2);
        }

        .energy-plus:hover {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          transform: scale(1.1);
        }

        .currency-bump {
          animation: currency-bump 0.6s ease-out;
        }

        /* === DAILY FLOAT BUTTON === */
        .daily-float-btn {
          position: relative;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(234, 179, 8, 0.2), rgba(234, 179, 8, 0.05));
          border: 2px solid rgba(234, 179, 8, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          backdrop-filter: blur(10px);
        }

        .daily-float-btn:hover {
          transform: scale(1.1);
          border-color: rgba(234, 179, 8, 0.6);
        }

        .daily-float-btn:active {
          transform: scale(0.95);
        }

        .daily-float-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1px;
        }

        .daily-float-glow {
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(234, 179, 8, 0.3) 0%, transparent 70%);
          animation: daily-glow 2s ease-in-out infinite;
        }

        .daily-float-ping {
          position: absolute;
          inset: -2px;
          border-radius: 50%;
          border: 2px solid rgba(234, 179, 8, 0.5);
          animation: daily-ping 2s ease-out infinite;
        }

        /* === ANIMATIONS === */
        @keyframes currency-bump {
          0% { transform: scale(1); }
          25% { transform: scale(1.08); }
          50% { transform: scale(0.96); }
          75% { transform: scale(1.03); }
          100% { transform: scale(1); }
        }

        @keyframes daily-glow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }

        @keyframes daily-ping {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.5); opacity: 0; }
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
          opacity: 0;
        }
        .animation-delay-100 {
          animation-delay: 100ms;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
