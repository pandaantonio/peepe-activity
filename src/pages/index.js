// pages/index.js
import Link from 'next/link';
import { FaChess, FaLock, FaSnowflake } from 'react-icons/fa';
import { FiZap, FiUser, FiCpu, FiTarget, FiActivity, FiSquare } from 'react-icons/fi';
import { GiCardAceSpades, GiCube } from 'react-icons/gi'; // ← ícones de cassino e de dimensão 3D
import { useEffect, useMemo, useRef, useState } from 'react';
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google';

const display = Space_Grotesk({ subsets: ['latin'], weight: ['500', '700'], variable: '--font-display' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-mono' });

// Todo jogo carrega uma "dimensão": 2d (hoje, toda a coleção) ou 3d (próxima leva).
const games = [
  {
    id: "blackjack",
    badge: "CASSINO",
    title: "Blackjack",
    desc: "Peça carta, pare ou dobre — mas não passe de 21. Enfrente o dealer numa batalha de nervos, probabilidade e timing perfeito.",
    color: "green",
    dimension: "2d",
    icon: <GiCardAceSpades size={22} />,
    path: "/game/blackjack",
    banner: "/imgs/blackjack.png",
  },
  {
    id: "mines",
    badge: "EM ALTA",
    title: "Mines",
    desc: "Cada clique é uma aposta com a sorte. Revele gemas, multiplique seu prêmio e saiba a hora certa de parar antes que uma mina acabe com tudo.",
    color: "violet",
    dimension: "2d",
    icon: <FiZap size={22} />,
    path: "/game/mines",
    banner: "/imgs/mines.png"
  },
  {
    id: "minesweeper",
    badge: "CLÁSSICO",
    title: "Campo Minado",
    desc: "O clássico que testa sua dedução lógica. Use os números como pistas, mapeie o campo com precisão e desarme cada mina sem cometer erros.",
    color: "rose",
    dimension: "2d",
    icon: <FiTarget size={22} />,
    path: "/game/minesweeper",
    banner: "/imgs/minesweeper.png"
  },
  {
    id: "tntrun",
    badge: "ADRENALINA",
    title: "TNT Run",
    desc: "O chão desaparece sob seus pés. Corra, antecipe os blocos que vão cair e sobreviva o máximo possível nesta corrida contra a gravidade.",
    color: "amber",
    dimension: "2d",
    icon: <FiActivity size={22} />,
    path: "/game/tntrun",
    banner: "/imgs/tntrun.png"
  },
  {
    id: "colorRush",
    badge: "REFLEXO",
    title: "Color Rush",
    desc: "Reflexos em chamas: um grid hexagonal muda de cor a cada instante. Pise na cor certa em frações de segundo ou mergulhe no abismo.",
    color: "fuchsia",
    dimension: "2d",
    icon: <FiZap size={22} />,
    path: "/game/color_rush",
    banner: "/imgs/colorRush.png"
  },
  {
    id: "ttt",
    badge: "ESTRATÉGIA",
    title: "Jogo da Velha",
    desc: "Simples de aprender, difícil de vencer. Enfrente uma IA Minimax imbatível ou chame um amigo para uma partida no modo multiplayer.",
    color: "emerald",
    dimension: "2d",
    icon: <FaChess size={22} />,
    path: "/game/ttt",
    banner: "/imgs/ttt.png"
  },
  {
    id: "hangman",
    badge: "PALAVRAS",
    title: "Jogo da Forca",
    desc: "Uma palavra secreta, gerada por IA, e tentativas limitadas. Una vocabulário e dedução para decifrá-la antes que o tempo se esgote.",
    color: "orange",
    dimension: "2d",
    icon: <FaLock size={22} />,
    path: "/game/hangman",
    banner: "/imgs/hangman.png"
  },
  {
    id: "snake",
    badge: "ARCADE",
    title: "Snake",
    desc: "O eterno clássico arcade. Guie a serpente, devore cada ponto pelo caminho e cresça sem nunca colidir com o próprio rabo.",
    color: "cyan",
    dimension: "2d",
    icon: <FaSnowflake size={22} />,
    path: "/game/snake",
    banner: "/imgs/snake.png"
  },
  {
    id: "guess",
    badge: "RACIOCÍNIO",
    title: "Adivinhe o Número",
    desc: "Existe um número secreto à espreita. Use pistas de 'quente' e 'frio' para fechar o cerco e acertar com o menor número de tentativas.",
    color: "orange",
    dimension: "2d",
    icon: <FiUser size={22} />,
    path: "/game/guess",
    banner: "/imgs/guess.png"
  },
  {
    id: "2048",
    badge: "PUZZLE",
    title: "2048",
    desc: "Deslize, combine e multiplique. Una os blocos certos na ordem certa para escalar até o lendário bloco 2048 sem travar o tabuleiro.",
    color: "blue",
    dimension: "2d",
    icon: <FiCpu size={22} />,
    path: "/game/2048",
    banner: "/imgs/2048.jpg"
  },
];

const CATEGORIES = [
  { id: "2d", label: "2D", icon: <FiSquare size={15} />, tag: "accent-amber" },
  { id: "3d", label: "3D", icon: <GiCube size={16} />, tag: "accent-teal" },
];

export default function GameHub() {
  const [mounted, setMounted] = useState(false);
  const [activeDimension, setActiveDimension] = useState("2d");
  const canvasRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animFrameId;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    resize();
    window.addEventListener("resize", resize);

    const layers = [
      { count: 90, rMin: 0.4, rMax: 0.9, speed: 0.03, twinkleSpeed: 0.006, baseOpacity: 0.32 },
      { count: 55, rMin: 0.8, rMax: 1.5, speed: 0.07, twinkleSpeed: 0.01, baseOpacity: 0.5 },
      { count: 28, rMin: 1.3, rMax: 2.2, speed: 0.12, twinkleSpeed: 0.014, baseOpacity: 0.75 },
    ];

    let stars = [];
    layers.forEach((layer, layerIndex) => {
      for (let i = 0; i < layer.count; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * (layer.rMax - layer.rMin) + layer.rMin,
          vx: (Math.random() - 0.5) * layer.speed,
          vy: (Math.random() - 0.5) * layer.speed,
          baseOpacity: layer.baseOpacity,
          twinklePhase: Math.random() * Math.PI * 2,
          twinkleSpeed: layer.twinkleSpeed + Math.random() * 0.004,
          layer: layerIndex,
        });
      }
    });

    // constelação em tom âmbar-quente, alinhada à nova identidade "ficha de arcade"
    const tint = "255, 214, 158";
    const linkDistance = 110;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      stars.forEach((s) => {
        s.x += s.vx;
        s.y += s.vy;
        if (s.x < 0) s.x = width;
        if (s.x > width) s.x = 0;
        if (s.y < 0) s.y = height;
        if (s.y > height) s.y = 0;

        s.twinklePhase += s.twinkleSpeed;
        const twinkle = (Math.sin(s.twinklePhase) + 1) / 2;
        const opacity = s.baseOpacity * (0.5 + 0.5 * twinkle);

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${tint}, ${opacity})`;
        ctx.fill();

        if (s.layer === 2) {
          const glowR = s.r * 3.5;
          const gradient = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, glowR);
          gradient.addColorStop(0, `rgba(${tint}, ${opacity * 0.5})`);
          gradient.addColorStop(1, `rgba(${tint}, 0)`);
          ctx.beginPath();
          ctx.arc(s.x, s.y, glowR, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
        }
      });

      const frontStars = stars.filter((s) => s.layer === 2);
      frontStars.forEach((a, i) => {
        frontStars.slice(i + 1).forEach((b) => {
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < linkDistance) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(${tint}, ${0.12 * (1 - dist / linkDistance)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        });
      });

      animFrameId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener("resize", resize);
    };
  }, [mounted]);

  const colorClasses = {
    violet: {
      accent: "text-violet-300",
      glow: "shadow-violet-500/30",
      border: "border-violet-500/20",
      badge: "bg-violet-500/15 text-violet-300 border-violet-400/30",
      gradient: "from-violet-500 via-fuchsia-500 to-purple-500",
    },
    rose: {
      accent: "text-rose-300",
      glow: "shadow-rose-500/30",
      border: "border-rose-500/20",
      badge: "bg-rose-500/15 text-rose-300 border-rose-400/30",
      gradient: "from-rose-500 via-red-500 to-orange-500",
    },
    amber: {
      accent: "text-amber-300",
      glow: "shadow-amber-500/30",
      border: "border-amber-500/20",
      badge: "bg-amber-500/15 text-amber-300 border-amber-400/30",
      gradient: "from-amber-400 via-orange-500 to-rose-500",
    },
    fuchsia: {
      accent: "text-fuchsia-300",
      glow: "shadow-fuchsia-500/30",
      border: "border-fuchsia-500/20",
      badge: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-400/30",
      gradient: "from-fuchsia-500 via-pink-500 to-violet-500",
    },
    emerald: {
      accent: "text-emerald-300",
      glow: "shadow-emerald-500/30",
      border: "border-emerald-500/20",
      badge: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
      gradient: "from-emerald-400 via-teal-500 to-cyan-500",
    },
    cyan: {
      accent: "text-cyan-300",
      glow: "shadow-cyan-500/30",
      border: "border-cyan-500/20",
      badge: "bg-cyan-500/15 text-cyan-300 border-cyan-400/30",
      gradient: "from-cyan-400 via-sky-500 to-blue-500",
    },
    orange: {
      accent: "text-orange-300",
      glow: "shadow-orange-500/30",
      border: "border-orange-500/20",
      badge: "bg-orange-500/15 text-orange-300 border-orange-400/30",
      gradient: "from-orange-400 via-amber-500 to-yellow-500",
    },
    blue: {
      accent: "text-blue-300",
      glow: "shadow-blue-500/30",
      border: "border-blue-500/20",
      badge: "bg-blue-500/15 text-blue-300 border-blue-400/30",
      gradient: "from-blue-500 via-indigo-500 to-violet-500",
    },
    green: {
      accent: "text-green-300",
      glow: "shadow-green-500/30",
      border: "border-green-500/20",
      badge: "bg-green-500/15 text-green-300 border-green-400/30",
      gradient: "from-green-500 via-emerald-500 to-teal-500",
    },
  };

  const counts = useMemo(
    () => ({
      "2d": games.filter((g) => g.dimension === "2d").length,
      "3d": games.filter((g) => g.dimension === "3d").length,
    }),
    []
  );

  const visibleGames = useMemo(
    () => games.filter((g) => g.dimension === activeDimension),
    [activeDimension]
  );

  if (!mounted) {
    return null;
  }

  return (
    <div
      className={`${display.variable} ${mono.variable} min-h-screen bg-[#07060c] relative overflow-hidden`}
      style={{ fontFamily: "var(--font-display)" }}
    >
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 10% 15%, rgba(255,190,90,0.12), transparent 45%), radial-gradient(circle at 90% 6%, rgba(45,212,191,0.10), transparent 42%), radial-gradient(circle at 50% 105%, rgba(139,92,246,0.09), transparent 55%)",
          }}
        />
      </div>

      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none"
        style={{ opacity: 0.85 }}
      />

      <div className="relative pt-28 pb-16 px-6 max-w-6xl mx-auto z-10">
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 mb-5 text-[11px] font-semibold tracking-[0.2em] text-amber-200 uppercase bg-amber-500/10 border border-amber-400/25 rounded-full"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" />
            {visibleGames.length} jogos · dimensão {activeDimension.toUpperCase()} · grátis
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tighter">
            <span className="text-white/90">Escolha sua </span>
            <span className="bg-gradient-to-r from-amber-300 via-orange-300 to-teal-300 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(253,186,116,0.35)]">
              dimensão de jogo
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-md mx-auto">
            Insira sua ficha, escolha entre 2D e 3D e mergulhe no cosmos dos jogos ✨
          </p>
        </div>

        {/* Seletor de dimensão — duas fichas de arcade que se inserem no slot */}
        <div className="flex justify-center mb-14">
          <div className="relative inline-flex items-center p-1.5 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-xl">
            <div
              className="absolute inset-y-1.5 w-[calc(50%-6px)] rounded-full transition-all duration-300 ease-out"
              style={{
                left: activeDimension === "2d" ? "6px" : "calc(50% + 0px)",
                background:
                  activeDimension === "2d"
                    ? "linear-gradient(135deg, rgba(251,191,36,0.9), rgba(249,115,22,0.85))"
                    : "linear-gradient(135deg, rgba(45,212,191,0.85), rgba(56,189,248,0.8))",
                boxShadow:
                  activeDimension === "2d"
                    ? "0 0 24px rgba(251,191,36,0.35)"
                    : "0 0 24px rgba(45,212,191,0.35)",
              }}
            />
            {CATEGORIES.map((cat) => {
              const isActive = activeDimension === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveDimension(cat.id)}
                  className="relative z-10 flex items-center gap-2 px-7 py-2.5 rounded-full transition-colors duration-300"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  <span className={isActive ? "text-[#0b0710]" : "text-gray-400"}>
                    {cat.icon}
                  </span>
                  <span
                    className={`text-sm font-bold tracking-wider ${
                      isActive ? "text-[#0b0710]" : "text-gray-400"
                    }`}
                  >
                    {cat.label}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      isActive ? "bg-black/15 text-[#0b0710]" : "bg-white/5 text-gray-500"
                    }`}
                  >
                    {counts[cat.id]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {visibleGames.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleGames.map((item) => {
              const colors = colorClasses[item.color] || colorClasses.violet;
              return (
                <Link key={item.id} href={item.path} className="group">
                  <div
                    className={`glass-card relative rounded-3xl overflow-hidden border ${colors.border} ${colors.glow} transition-all duration-500 hover:-translate-y-3 hover:scale-[1.02]`}
                  >
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${colors.gradient} opacity-80`} />

                    {item.banner && (
                      <div className="relative overflow-hidden">
                        <img
                          src={item.banner}
                          alt={item.title}
                          className="w-full h-52 object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-125"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#07060c]/70 to-[#07060c]" />
                      </div>
                    )}

                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`px-3 py-1 text-xs font-bold tracking-widest rounded-full border ${colors.badge}`} style={{ fontFamily: "var(--font-mono)" }}>
                          {item.badge}
                        </div>
                        <div className={`${colors.accent} text-2xl transition-transform group-hover:rotate-12 duration-300`}>
                          {item.icon}
                        </div>
                      </div>
                      <h2 className="text-2xl font-semibold text-white mb-2 group-hover:text-white transition-colors">
                        {item.title}
                      </h2>
                      <p className="text-gray-400 text-sm leading-relaxed line-clamp-3 mb-6">
                        {item.desc}
                      </p>
                      <div className={`inline-flex items-center gap-1.5 text-sm font-medium ${colors.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                        Jogar agora
                        <span className="transition-transform group-hover:translate-x-1">→</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          // Estado vazio da dimensão 3D — trata a ausência de jogos como um convite, não um erro.
          <div className="text-center py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 opacity-90">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-3xl border-2 border-dashed border-teal-400/20 bg-teal-500/[0.02] h-52 flex items-center justify-center"
                >
                  <GiCube size={40} className="text-teal-400/25" />
                </div>
              ))}
            </div>
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 text-[11px] font-semibold tracking-[0.2em] text-teal-200 uppercase bg-teal-500/10 border border-teal-400/25 rounded-full"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              <GiCube size={14} />
              em construção
            </div>
            <h3 className="text-2xl font-semibold text-white mb-2">A dimensão 3D ainda está sendo montada</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              Novos mundos tridimensionais estão a caminho. Enquanto isso, volte para a dimensão 2D e continue jogando.
            </p>
            <button
              onClick={() => setActiveDimension("2d")}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold tracking-wide text-[#0b0710] transition-transform hover:scale-105"
              style={{
                fontFamily: "var(--font-mono)",
                background: "linear-gradient(135deg, rgba(251,191,36,0.9), rgba(249,115,22,0.85))",
              }}
            >
              <FiSquare size={14} />
              Voltar para o 2D
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .glass-card {
          background: rgba(13, 11, 20, 0.85);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 10px 30px -10px rgb(0 0 0 / 0.7);
        }
      `}</style>
    </div>
  );
}