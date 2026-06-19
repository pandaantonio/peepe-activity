// pages/game/ttt/index.js
import { useRouter } from 'next/router';
import { FaArrowLeft, FaBug, FaShieldAlt, FaSkullCrossbones, FaUsers } from 'react-icons/fa';
import { useEffect, useRef, useState } from 'react';

const difficulties = [
  {
    id: "easy",
    badge: "FÁCIL",
    title: "Modo Fácil",
    desc: "A IA joga de forma aleatória, com pouco planejamento. Perfeito para destravar reflexos.",
    color: "emerald",
    icon: <FaBug size={24} />,
    path: "/game/ttt/easy",
    stat: "15%",
    statLabel: "Precisão da IA"
  },
  {
    id: "medium",
    badge: "MÉDIO",
    title: "Modo Médio",
    desc: "Minimax ativo. O equilíbrio ideal entre desafio tático e chance real de vitória.",
    color: "orange",
    icon: <FaShieldAlt size={24} />,
    path: "/game/ttt/medium",
    stat: "80%",
    statLabel: "Precisão da IA"
  },
  {
    id: "impossible",
    badge: "IMPOSSÍVEL",
    title: "Modo Impossível",
    desc: "Minimax puro. Vencer é matematicamente quase impossível — o empate é uma vitória.",
    color: "red",
    icon: <FaSkullCrossbones size={24} />,
    path: "/game/ttt/impossible",
    stat: "100%",
    statLabel: "Precisão da IA"
  },
  {
    id: "multiplayer",
    badge: "MULTIPLAYER",
    title: "Amigos",
    desc: "Desafie alguém de carne e osso. Sincronização em tempo real no mesmo dispositivo.",
    color: "indigo",
    icon: <FaUsers size={24} />,
    path: "/game/ttt/multiplayer",
    stat: "100%",
    statLabel: "Humano vs Humano"
  }
];

export default function TicTacToeSelection() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => { setMounted(true); }, []);

  // Efeito de estrelas (mesmo do ai.js)
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
      { count: 90, rMin: 0.4, rMax: 0.9, speed: 0.03, twinkleSpeed: 0.006, baseOpacity: 0.35 },
      { count: 55, rMin: 0.8, rMax: 1.5, speed: 0.07, twinkleSpeed: 0.01, baseOpacity: 0.55 },
      { count: 28, rMin: 1.3, rMax: 2.2, speed: 0.12, twinkleSpeed: 0.014, baseOpacity: 0.8 },
    ];

    let stars = [];
    layers.forEach((layer, layerIndex) => {
      for (let i = 0; i < layer.count; i++) {
        stars.push({
          x: Math.random() * width, y: Math.random() * height,
          r: Math.random() * (layer.rMax - layer.rMin) + layer.rMin,
          vx: (Math.random() - 0.5) * layer.speed, vy: (Math.random() - 0.5) * layer.speed,
          baseOpacity: layer.baseOpacity, twinklePhase: Math.random() * Math.PI * 2,
          twinkleSpeed: layer.twinkleSpeed + Math.random() * 0.004, layer: layerIndex,
        });
      }
    });

    const tint = "200, 215, 255";
    const linkDistance = 110;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      stars.forEach((s) => {
        s.x += s.vx; s.y += s.vy;
        if (s.x < 0) s.x = width; if (s.x > width) s.x = 0;
        if (s.y < 0) s.y = height; if (s.y > height) s.y = 0;
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
      animFrameId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animFrameId); window.removeEventListener("resize", resize); };
  }, [mounted]);

  const colorClasses = {
    emerald: { accent: "text-emerald-400", glow: "shadow-emerald-500/30", border: "border-emerald-500/20", bar: "bg-emerald-400" },
    orange: { accent: "text-orange-400", glow: "shadow-orange-500/30", border: "border-orange-500/20", bar: "bg-orange-400" },
    red: { accent: "text-red-400", glow: "shadow-red-500/30", border: "border-red-500/20", bar: "bg-red-400" },
    indigo: { accent: "text-indigo-400", glow: "shadow-indigo-500/30", border: "border-indigo-500/20", bar: "bg-indigo-400" },
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#020205] relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 15% 15%, rgba(99,60,200,0.10), transparent 45%), radial-gradient(circle at 85% 10%, rgba(34,150,211,0.08), transparent 40%), radial-gradient(circle at 50% 95%, rgba(60,70,160,0.08), transparent 50%)" }} />
      </div>
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ opacity: 0.9 }} />

      <div className="relative pt-28 pb-16 px-6 max-w-6xl mx-auto z-10">
        <button onClick={() => router.push('/')} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-10">
          <FaArrowLeft size={14} /> Voltar ao Hub
        </button>

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tighter">
            <span className="text-white/90">Jogo da </span>
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">Velha</span>
          </h1>
          <p className="text-gray-400 text-lg">Escolha o desafio e inicie a simulação.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {difficulties.map((item) => {
            const colors = colorClasses[item.color];
            return (
              <div key={item.id} onClick={() => router.push(item.path)} className="group cursor-pointer">
                <div className={`glass-card rounded-3xl overflow-hidden border ${colors.border} ${colors.glow} transition-all duration-500 hover:-translate-y-3 hover:scale-[1.02]`}>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="px-3 py-1 text-xs font-bold tracking-widest rounded-full border bg-white/5 text-white/70 border-white/10">{item.badge}</div>
                      <div className={`${colors.accent} text-2xl group-hover:rotate-12 duration-300`}>{item.icon}</div>
                    </div>
                    <h2 className="text-xl font-semibold text-white mb-2 group-hover:text-cyan-300">{item.title}</h2>
                    <p className="text-gray-400 text-sm leading-relaxed mb-6 h-20">{item.desc}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                      <span>{item.statLabel}</span>
                      <span className={colors.accent}>{item.stat}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/10 mb-6 overflow-hidden">
                      <div className={`h-full rounded-full ${colors.bar}`} style={{ width: item.stat }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .glass-card {
          background: rgba(10, 10, 15, 0.85);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
      `}</style>
    </div>
  );
}