// /games/zombies.js
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ZombieGame() {
  const router = useRouter();
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(100);
  const [gameOver, setGameOver] = useState(false);

  const gameRef = useRef({
    score: 0,
    health: 100,
    gameOverActive: false,
    player: { x: 0, y: 0, radius: 16, speed: 3.5, angle: 0 },
    bullets: [],
    zombies: [],
    keys: {},
    mousePos: { x: 0, y: 0 },
    spawnRate: 1300,
    lastSpawn: 0,
    animationFrame: null,
  });

  const handleExit = () => {
    router.push('/');
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const game = gameRef.current;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      game.player.x = canvas.width / 2;
      game.player.y = canvas.height / 2;
    };

    resize();
    window.addEventListener('resize', resize);

    // Controles
    const handleKeyDown = (e) => { game.keys[e.key.toLowerCase()] = true; };
    const handleKeyUp = (e) => { game.keys[e.key.toLowerCase()] = false; };

    const handleMouseMove = (e) => {
      if (game.gameOverActive) return;
      const rect = canvas.getBoundingClientRect();
      game.mousePos.x = e.clientX - rect.left;
      game.mousePos.y = e.clientY - rect.top;
      game.player.angle = Math.atan2(game.mousePos.y - game.player.y, game.mousePos.x - game.player.x);
    };

    const shoot = (clientX, clientY) => {
      if (game.gameOverActive || game.health <= 0) return;
      const rect = canvas.getBoundingClientRect();
      const tx = clientX - rect.left;
      const ty = clientY - rect.top;
      const angle = Math.atan2(ty - game.player.y, tx - game.player.x);
      game.bullets.push({
        x: game.player.x + Math.cos(angle) * game.player.radius,
        y: game.player.y + Math.sin(angle) * game.player.radius,
        vx: Math.cos(angle) * 8,
        vy: Math.sin(angle) * 8,
        radius: 4,
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', (e) => shoot(e.clientX, e.clientY));
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      shoot(t.clientX, t.clientY);
    });

    function spawnZombie() {
      const w = canvas.width, h = canvas.height;
      let x = Math.random() < 0.5 ? -30 : w + 30;
      let y = Math.random() * h;
      if (Math.random() < 0.5) { x = Math.random() * w; y = Math.random() < 0.5 ? -30 : h + 30; }
      game.zombies.push({ x, y, radius: 14, speed: 1.1 + Math.random() * 0.6 + Math.min(game.score * 0.005, 1.2) });
    }

    function gameLoop(ts) {
      if (game.gameOverActive) return;

      ctx.fillStyle = "#0c0c0e";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let mvX = 0, mvY = 0;
      if (game.keys['w'] || game.keys['arrowup']) mvY -= 1;
      if (game.keys['s'] || game.keys['arrowdown']) mvY += 1;
      if (game.keys['a'] || game.keys['arrowleft']) mvX -= 1;
      if (game.keys['d'] || game.keys['arrowright']) mvX += 1;
      if (mvX !== 0 && mvY !== 0) { mvX *= 0.7071; mvY *= 0.7071; }

      game.player.x += mvX * game.player.speed;
      game.player.y += mvY * game.player.speed;
      game.player.x = Math.max(game.player.radius, Math.min(canvas.width - game.player.radius, game.player.x));
      game.player.y = Math.max(game.player.radius, Math.min(canvas.height - game.player.radius, game.player.y));

      // Player
      ctx.save();
      ctx.translate(game.player.x, game.player.y);
      ctx.rotate(game.player.angle);
      ctx.fillStyle = "#2563eb";
      ctx.beginPath(); ctx.arc(0, 0, game.player.radius, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#4b5563";
      ctx.fillRect(0, -4, game.player.radius + 6, 8);
      ctx.restore();

      // Bullets
      game.bullets = game.bullets.filter(b => {
        b.x += b.vx; b.y += b.vy;
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2); ctx.fill();
        return b.x > 0 && b.x < canvas.width && b.y > 0 && b.y < canvas.height;
      });

      if (ts - game.lastSpawn > game.spawnRate) {
        spawnZombie();
        game.lastSpawn = ts;
        if (game.spawnRate > 400) game.spawnRate -= 8;
      }

      for (let i = game.zombies.length - 1; i >= 0; i--) {
        const z = game.zombies[i];
        const dx = game.player.x - z.x;
        const dy = game.player.y - z.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0) {
          z.x += (dx / dist) * z.speed;
          z.y += (dy / dist) * z.speed;
        }

        ctx.fillStyle = "#16a34a";
        ctx.beginPath(); ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2); ctx.fill();

        if (dist < game.player.radius + z.radius) {
          game.health -= 0.5;
          setHealth(Math.max(0, Math.floor(game.health)));
          if (game.health <= 0) {
            game.gameOverActive = true;
            setGameOver(true);
            return;
          }
        }

        for (let j = game.bullets.length - 1; j >= 0; j--) {
          const b = game.bullets[j];
          if (Math.hypot(b.x - z.x, b.y - z.y) < z.radius + b.radius) {
            game.bullets.splice(j, 1);
            game.zombies.splice(i, 1);
            game.score += 10;
            setScore(game.score);
            break;
          }
        }
      }

      game.animationFrame = requestAnimationFrame(gameLoop);
    }

    game.lastSpawn = performance.now();
    game.animationFrame = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (game.animationFrame) cancelAnimationFrame(game.animationFrame);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-zinc-950 overflow-hidden z-50">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full touch-none" />

      <div className="absolute top-6 right-6 flex gap-4 z-10">
        <div className="bg-zinc-900/95 border border-zinc-700 px-6 py-3 rounded-2xl font-mono">Pts: <span className="text-emerald-400 font-bold">{score}</span></div>
        <div className="bg-zinc-900/95 border border-zinc-700 px-6 py-3 rounded-2xl font-mono">HP: <span className={`font-bold ${health > 30 ? 'text-red-400' : 'text-red-600'}`}>{health}%</span></div>
      </div>

      <button
        onClick={handleExit}
        className="absolute top-6 left-6 z-50 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 px-6 py-3 rounded-2xl font-medium flex items-center gap-2 active:scale-95"
      >
        ← Voltar ao Hub
      </button>

      {gameOver && (
        <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center z-20">
          <h2 className="text-7xl font-black text-red-500 mb-8">FIM DE JOGO</h2>
          <p className="text-3xl mb-12">Pontuação: <span className="text-white font-bold">{score}</span></p>
          <button onClick={() => window.location.reload()} className="px-12 py-5 bg-red-600 hover:bg-red-700 rounded-2xl font-bold text-xl mr-4">JOGAR NOVAMENTE</button>
          <button onClick={handleExit} className="px-12 py-5 bg-zinc-700 hover:bg-zinc-600 rounded-2xl font-bold text-xl">VOLTAR AO HUB</button>
        </div>
      )}
    </div>
  );
}