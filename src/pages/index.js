// pages/index.js
import Link from 'next/link';
import { FaChess, FaLock } from 'react-icons/fa';
import { FiZap, FiUser, FiCpu } from 'react-icons/fi';
import { useEffect, useRef, useState } from 'react';

const games = [
  {
    id: "tntrun",
    badge: "NOVIDADE",
    title: "Tnt Run",
    desc: "Controle um robô em um grid de hexágonos coloridos. 5 segundos para pisar na cor certa ou caia no abismo!",
    color: "purple",
    icon: <FiZap size={24} />,
    path: "/game/tntrun",
    banner: "/imgs/tntrun.png"
  },
  {
    id: "colorRush",
    badge: "NOVIDADE",
    title: "Color Rush",
    desc: "Controle um robô em um grid de hexágonos coloridos. 5 segundos para pisar na cor certa ou caia no abismo!",
    color: "purple",
    icon: <FiZap size={24} />,
    path: "/game/color_rush",
    banner: "/imgs/colorRush.png"
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
  const [mounted, setMounted] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Canvas com campo de estrelas: pontos com profundidade (parallax),
  // brilho/cintilação individual e linhas de constelação entre estrelas próximas.
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

    // Três camadas de profundidade: longe (pequenas/lentas) -> perto (maiores/rápidas)
    const layers = [
      { count: 90, rMin: 0.4, rMax: 0.9, speed: 0.03, twinkleSpeed: 0.006, baseOpacity: 0.35 },
      { count: 55, rMin: 0.8, rMax: 1.5, speed: 0.07, twinkleSpeed: 0.01, baseOpacity: 0.55 },
      { count: 28, rMin: 1.3, rMax: 2.2, speed: 0.12, twinkleSpeed: 0.014, baseOpacity: 0.8 },
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

    // Tint levemente azulado/violeta pra combinar com o tema do site
    const tint = "200, 215, 255";
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
        const twinkle = (Math.sin(s.twinklePhase) + 1) / 2; // 0..1
        const opacity = s.baseOpacity * (0.5 + 0.5 * twinkle);

        // núcleo
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${tint}, ${opacity})`;
        ctx.fill();

        // glow leve só nas estrelas maiores (camada de cima)
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

      // linhas de constelação só entre estrelas da camada da frente (mais próximas)
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
    emerald: { accent: "text-emerald-400", glow: "shadow-emerald-500/30", border: "border-emerald-500/20" },
    cyan: { accent: "text-cyan-400", glow: "shadow-cyan-500/30", border: "border-cyan-500/20" },
    purple: { accent: "text-purple-400", glow: "shadow-purple-500/30", border: "border-purple-500/20" },
    orange: { accent: "text-orange-400", glow: "shadow-orange-500/30", border: "border-orange-500/20" },
    blue: { accent: "text-blue-400", glow: "shadow-blue-500/30", border: "border-blue-500/20" },
    indigo: { accent: "text-indigo-400", glow: "shadow-indigo-500/30", border: "border-indigo-500/20" }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#020205] relative overflow-hidden">
      {/* Nebulosa de fundo, bem sutil */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 15% 15%, rgba(99,60,200,0.10), transparent 45%), radial-gradient(circle at 85% 10%, rgba(34,150,211,0.08), transparent 40%), radial-gradient(circle at 50% 95%, rgba(60,70,160,0.08), transparent 50%)",
          }}
        />
      </div>

      {/* Campo de estrelas animado via canvas (com profundidade + constelações) */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none"
        style={{ opacity: 0.9 }}
      />

      <div className="relative pt-28 pb-16 px-6 max-w-6xl mx-auto z-10">
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
          {games.map((item) => {
            const colors = colorClasses[item.color] || colorClasses.purple;
            return (
              <Link
                key={item.id}
                href={item.path}
                className="group"
              >
                <div className={`glass-card rounded-3xl overflow-hidden border ${colors.border} ${colors.glow} transition-all duration-500 hover:-translate-y-3 hover:scale-[1.02]`}>
                  {item.banner && (
                    <div className="relative overflow-hidden">
                      <img src={item.banner} alt={item.title} className="w-full h-52 object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-125" />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#020205]/70 to-[#020205]" />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`px-3 py-1 text-xs font-bold tracking-widest rounded-full border bg-white/5 text-white/70 border-white/10`}>
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
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 10px 30px -10px rgb(0 0 0 / 0.7);
        }
      `}</style>
    </div>
  );
}