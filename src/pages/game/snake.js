import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';

export default function SnakeGame() {
  const router = useRouter();
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  
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
      const { dx, dy } = game;
      
      if ((key === 'arrowup' || key === 'w') && dy !== 1) {
        game.nextDirection = { x: 0, y: -1 };
        e.preventDefault();
      }
      if ((key === 'arrowdown' || key === 's') && dy !== -1) {
        game.nextDirection = { x: 0, y: 1 };
        e.preventDefault();
      }
      if ((key === 'arrowleft' || key === 'a') && dx !== 1) {
        game.nextDirection = { x: -1, y: 0 };
        e.preventDefault();
      }
      if ((key === 'arrowright' || key === 'd') && dx !== -1) {
        game.nextDirection = { x: 1, y: 0 };
        e.preventDefault();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [initGame]);

  // Controles de toque (mobile)
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
      const { dx, dy } = game;
      
      if (Math.abs(diffX) > Math.abs(diffY)) {
        if (Math.abs(diffX) > 30) {
          if (diffX > 0 && dx !== -1) game.nextDirection = { x: 1, y: 0 };
          if (diffX < 0 && dx !== 1) game.nextDirection = { x: -1, y: 0 };
        }
      } else {
        if (Math.abs(diffY) > 30) {
          if (diffY > 0 && dy !== -1) game.nextDirection = { x: 0, y: 1 };
          if (diffY < 0 && dy !== 1) game.nextDirection = { x: 0, y: -1 };
        }
      }
      touchStartX = 0;
      touchStartY = 0;
    };
    
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  const resetGame = () => {
    // Para o loop atual
    if (gameRef.current.animationFrame) {
      cancelAnimationFrame(gameRef.current.animationFrame);
      gameRef.current.animationFrame = null;
    }
    // Reinicia o jogo
    initGame();
  };

  return (
    <div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center z-50">
      {/* Botão Voltar */}
      <button
        onClick={handleExit}
        className="fixed top-6 left-6 z-50 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 px-6 py-3 rounded-2xl font-medium active:scale-95 transition-all"
      >
        ← Voltar ao Hub
      </button>

      <div className="w-full max-w-[400px] p-4">
        <div className="flex justify-between items-center mb-4 px-2">
          <h1 className="text-3xl font-black text-cyan-400">SNAKE</h1>
          <div className="bg-zinc-900 px-6 py-2 rounded-xl">
            <span className="text-zinc-400 text-sm">SCORE</span>
            <span className="text-white font-bold text-2xl ml-2">{score}</span>
          </div>
        </div>

        <div className="relative">
          <div className="bg-zinc-900 p-2 rounded-2xl border border-zinc-800">
            <canvas
              ref={canvasRef}
              className="w-full h-auto rounded-lg"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>

          {gameOver && (
            <div className="absolute inset-0 bg-black/90 rounded-2xl flex flex-col items-center justify-center gap-6">
              <h2 className="text-4xl font-black text-cyan-400">
                💀 GAME OVER 💀
              </h2>
              <p className="text-2xl text-zinc-300">
                Pontuação: <span className="text-cyan-400 font-bold">{score}</span>
              </p>
              <button
                onClick={resetGame}
                className="px-8 py-4 bg-cyan-600 hover:bg-cyan-700 rounded-xl font-bold text-lg transition-all active:scale-95"
              >
                🔄 Jogar Novamente
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 text-center text-sm text-zinc-500">
          <p>Use as <span className="text-cyan-400">setas</span> ou <span className="text-cyan-400">WASD</span> para controlar</p>
          <p className="text-xs mt-1">Deslize na tela para jogar no celular</p>
        </div>
      </div>
    </div>
  );
}