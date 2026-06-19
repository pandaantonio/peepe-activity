import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { FaArrowLeft, FaRobot, FaBrain, FaSkull, FaUsers } from 'react-icons/fa';

export default function TicTacToeSelection() {
  const router = useRouter();
  const canvasRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Campo de estrelas animado via canvas (profundidade + constelações)
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

        {/* Campo de estrelas animado via canvas (profundidade + constelações) */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
          style={{ opacity: 0.9 }}
        />

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