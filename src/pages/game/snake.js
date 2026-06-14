import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';

export default function SnakeGame() {
  const router = useRouter();
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  const gameRef = useRef({
    snake: [],
    food: { x: 0, y: 0 },
    dx: 0,
    dy: -1,
    nextDirection: { x: 0, y: -1 },
    lastUpdateTime: 0,
    gameSpeed: 130,
    gameOverActive: false,
    animationFrame: null
  });

  const gridSize = 16;
  const tileCount = 15;

  const handleExit = () => {
    router.push('/');
  };

  // Detecta dispositivos com tela de toque para mostrar o D-pad
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    }
  }, []);

  // Evita scroll/bounce da página enquanto o jogo está em tela
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  const spawnFood = useCallback((snake) => {
    const newFood = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount)
    };
    
    if (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
      return spawnFood(snake);
    }
    return newFood;
  }, []);

  const initGame = useCallback(() => {
    const newSnake = [
      { x: 7, y: 7 },
      { x: 7, y: 8 },
      { x: 7, y: 9 }
    ];
    const newFood = { x: 4, y: 4 };
    
    // Para o loop anterior se existir
    if (gameRef.current.animationFrame) {
      cancelAnimationFrame(gameRef.current.animationFrame);
      gameRef.current.animationFrame = null;
    }
    
    gameRef.current = {
      ...gameRef.current,
      snake: [...newSnake],
      food: newFood,
      dx: 0,
      dy: -1,
      nextDirection: { x: 0, y: -1 },
      lastUpdateTime: 0,
      gameOverActive: false,
      animationFrame: null
    };
    
    setScore(0);
    setGameOver(false);
  }, []);

  const update = useCallback(() => {
    const game = gameRef.current;
    if (game.gameOverActive) return false;

    game.dx = game.nextDirection.x;
    game.dy = game.nextDirection.y;
    
    const head = {
      x: game.snake[0].x + game.dx,
      y: game.snake[0].y + game.dy
    };

    // Verifica colisão com as paredes
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
      game.gameOverActive = true;
      setGameOver(true);
      return false;
    }

    // Verifica colisão com o próprio corpo
    if (game.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
      game.gameOverActive = true;
      setGameOver(true);
      return false;
    }

    game.snake.unshift(head);
    
    if (head.x === game.food.x && head.y === game.food.y) {
      setScore(prev => prev + 10);
      const newFood = spawnFood(game.snake);
      game.food = newFood;
    } else {
      game.snake.pop();
    }
    
    return true;
  }, [spawnFood, tileCount]);

  const draw = useCallback((ctx, canvas) => {
    const game = gameRef.current;
    if (!game || !game.snake) return;
    
    // Fundo
    ctx.fillStyle = "#111116";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Comida
    if (game.food) {
      ctx.fillStyle = "#f87171";
      ctx.shadowBlur = 6;
      ctx.shadowColor = "#f87171";
      ctx.beginPath();
      ctx.arc(
        game.food.x * gridSize + gridSize/2,
        game.food.y * gridSize + gridSize/2,
        gridSize/2 - 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // Cobra
    ctx.shadowBlur = 4;
    ctx.shadowColor = "#22d3ee";
    game.snake.forEach((part, idx) => {
      ctx.fillStyle = idx === 0 ? "#67e8f9" : "#22d3ee";
      ctx.fillRect(
        part.x * gridSize + 1,
        part.y * gridSize + 1,
        gridSize - 2,
        gridSize - 2
      );
    });
    ctx.shadowBlur = 0;
  }, [gridSize]);

  // Função principal do loop do jogo
  const startGameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    const gameLoop = (currentTime) => {
      const game = gameRef.current;
      
      if (game.gameOverActive) {
        return;
      }
      
      const elapsed = currentTime - game.lastUpdateTime;
      if (elapsed > game.gameSpeed) {
        game.lastUpdateTime = currentTime - (elapsed % game.gameSpeed);
        if (update()) {
          draw(ctx, canvas);
        }
      } else {
        draw(ctx, canvas);
      }
      
      // Continua o loop apenas se o jogo não acabou
      if (!game.gameOverActive) {
        game.animationFrame = requestAnimationFrame(gameLoop);
      }
    };
    
    gameRef.current.lastUpdateTime = performance.now();
    gameRef.current.animationFrame = requestAnimationFrame(gameLoop);
  }, [update, draw]);

  // Inicializa o jogo
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = gridSize * tileCount;
    canvas.height = gridSize * tileCount;
    
    initGame();
    
    return () => {
      if (gameRef.current.animationFrame) {
        cancelAnimationFrame(gameRef.current.animationFrame);
        gameRef.current.animationFrame = null;
      }
    };
  }, [initGame, gridSize, tileCount]);

  // Inicia o loop quando o jogo estiver ativo
  useEffect(() => {
    if (!gameOver && gameRef.current.snake.length > 0) {
      startGameLoop();
    }
    
    return () => {
      if (gameRef.current.animationFrame) {
        cancelAnimationFrame(gameRef.current.animationFrame);
        gameRef.current.animationFrame = null;
      }
    };
  }, [gameOver, startGameLoop]);

  // Centraliza a troca de direção (teclado, swipe e D-pad usam a mesma função)
  const changeDirection = useCallback((nx, ny) => {
    const game = gameRef.current;
    if (game.gameOverActive) return;

    const { dx, dy } = game;
    // Impede inverter o sentido (ex: ir para a direita virando para a esquerda)
    if (nx === -dx && ny === -dy) return;

    game.nextDirection = { x: nx, y: ny };
  }, []);

  // Controles de teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      const game = gameRef.current;
      if (game.gameOverActive) {
        if (e.key === 'Enter') {
          initGame();
        }
        return;
      }
      
      const key = e.key.toLowerCase();
      
      if (key === 'arrowup' || key === 'w') {
        changeDirection(0, -1);
        e.preventDefault();
      }
      if (key === 'arrowdown' || key === 's') {
        changeDirection(0, 1);
        e.preventDefault();
      }
      if (key === 'arrowleft' || key === 'a') {
        changeDirection(-1, 0);
        e.preventDefault();
      }
      if (key === 'arrowright' || key === 'd') {
        changeDirection(1, 0);
        e.preventDefault();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [initGame, changeDirection]);

  // Controles de toque (mobile) - swipe na tela
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;
    
    const handleTouchStart = (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };
    
    const handleTouchEnd = (e) => {
      const game = gameRef.current;
      if (!touchStartX || !touchStartY || game.gameOverActive) return;
      
      const diffX = e.changedTouches[0].clientX - touchStartX;
      const diffY = e.changedTouches[0].clientY - touchStartY;
      
      if (Math.abs(diffX) > Math.abs(diffY)) {
        if (Math.abs(diffX) > 30) {
          changeDirection(diffX > 0 ? 1 : -1, 0);
        }
      } else {
        if (Math.abs(diffY) > 30) {
          changeDirection(0, diffY > 0 ? 1 : -1);
        }
      }
      touchStartX = 0;
      touchStartY = 0;
    };
    
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [changeDirection]);

  const resetGame = () => {
    // Para o loop atual
    if (gameRef.current.animationFrame) {
      cancelAnimationFrame(gameRef.current.animationFrame);
      gameRef.current.animationFrame = null;
    }
    // Reinicia o jogo
    initGame();
  };

  // Botão do D-pad on-screen
  const DPadButton = ({ onPress, label, className = '' }) => (
    <button
      onPointerDown={(e) => {
        e.preventDefault();
        onPress();
      }}
      className={`flex items-center justify-center bg-zinc-900 border border-zinc-700 active:bg-cyan-900 active:border-cyan-500 rounded-xl text-cyan-400 text-2xl font-bold select-none transition-colors ${className}`}
      style={{ touchAction: 'none', WebkitTapHighlightColor: 'transparent' }}
      aria-label={label}
    >
      {label}
    </button>
  );

  return (
    <div
      className="fixed inset-0 bg-zinc-950 flex flex-col landscape:flex-row items-center justify-center gap-4 landscape:gap-10 p-4 overflow-hidden"
      style={{
        touchAction: 'none',
        paddingTop: 'max(1rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(1rem, env(safe-area-inset-left))',
        paddingRight: 'max(1rem, env(safe-area-inset-right))'
      }}
    >
      {/* Botão Voltar */}
      <button
        onClick={handleExit}
        className="fixed z-50 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 px-4 py-2 landscape:px-3 landscape:py-1.5 rounded-2xl text-sm landscape:text-xs font-medium active:scale-95 transition-all"
        style={{
          top: 'max(1rem, env(safe-area-inset-top))',
          left: 'max(1rem, env(safe-area-inset-left))'
        }}
      >
        ← Voltar
      </button>

      {/* Tabuleiro do jogo */}
      <div className="flex flex-col items-center gap-3 landscape:h-full landscape:justify-center">
        <div className="relative w-[min(90vw,400px)] aspect-square landscape:w-[min(78vh,78vw)] landscape:h-[min(78vh,78vw)]">
          <div className="bg-zinc-900 p-2 rounded-2xl border border-zinc-800 w-full h-full">
            <canvas
              ref={canvasRef}
              className="w-full h-full rounded-lg"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>

          {gameOver && (
            <div className="absolute inset-0 bg-black/90 rounded-2xl flex flex-col items-center justify-center gap-4 p-4 text-center">
              <h2 className="text-3xl landscape:text-2xl font-black text-cyan-400">
                💀 GAME OVER 💀
              </h2>
              <p className="text-xl landscape:text-lg text-zinc-300">
                Pontuação: <span className="text-cyan-400 font-bold">{score}</span>
              </p>
              <button
                onClick={resetGame}
                className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 rounded-xl font-bold text-base landscape:text-sm transition-all active:scale-95"
              >
                🔄 Jogar Novamente
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Painel: título, pontuação, D-pad e instruções */}
      <div className="flex flex-col items-center landscape:items-start gap-4 landscape:h-full landscape:justify-center landscape:py-4 w-[min(90vw,400px)] landscape:w-auto">
        <div className="flex justify-between items-center gap-3 w-full landscape:flex-col landscape:items-start landscape:gap-2 landscape:w-auto">
          <h1 className="text-3xl landscape:text-2xl font-black text-cyan-400">SNAKE</h1>
          <div className="bg-zinc-900 px-6 py-2 landscape:px-4 landscape:py-1.5 rounded-xl">
            <span className="text-zinc-400 text-sm">SCORE</span>
            <span className="text-white font-bold text-2xl landscape:text-xl ml-2">{score}</span>
          </div>
        </div>

        {isTouch && (
          <div className="grid grid-cols-3 grid-rows-3 gap-2 w-[180px] h-[180px] landscape:w-[170px] landscape:h-[170px] mx-auto landscape:mx-0">
            <div />
            <DPadButton label="▲" onPress={() => changeDirection(0, -1)} className="aspect-square" />
            <div />
            <DPadButton label="◀" onPress={() => changeDirection(-1, 0)} className="aspect-square" />
            <div />
            <DPadButton label="▶" onPress={() => changeDirection(1, 0)} className="aspect-square" />
            <div />
            <DPadButton label="▼" onPress={() => changeDirection(0, 1)} className="aspect-square" />
            <div />
          </div>
        )}

        <div className="text-center landscape:text-left text-xs text-zinc-500 max-w-[260px]">
          <p>
            Use as <span className="text-cyan-400">setas</span> ou{' '}
            <span className="text-cyan-400">WASD</span> para controlar
          </p>
          <p className="mt-1">
            Deslize na tela ou use os botões para jogar no celular
          </p>
        </div>
      </div>
    </div>
  );
}