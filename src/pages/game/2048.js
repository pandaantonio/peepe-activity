// /games/2048.js
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function Game2048() {
  const router = useRouter();
  const size = 4;

  // Estados principais
  const [grid, setGrid] = useState([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [movesCount, setMovesCount] = useState(0);
  const [streak, setStreak] = useState(0);
  
  const touchStartRef = useRef({ x: 0, y: 0 });
  const idCounterRef = useRef(0);

  // Carrega Recorde Local
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('discord_2048_highscore');
      if (saved) setHighScore(parseInt(saved, 10));
    }
  }, []);

  const updateHighScore = useCallback((newScore) => {
    setScore(newScore);
    setHighScore((prev) => {
      if (newScore > prev) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('discord_2048_highscore', newScore.toString());
        }
        return newScore;
      }
      return prev;
    });
  }, []);

  const addRandomTile = useCallback((currentGrid) => {
    const emptyPositions = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (currentGrid[r][c] === null) emptyPositions.push({ r, c });
      }
    }

    if (emptyPositions.length > 0) {
      const { r, c } = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
      idCounterRef.current += 1;
      currentGrid[r][c] = {
        id: idCounterRef.current,
        value: Math.random() < 0.9 ? 2 : 4,
        isNew: true,
        isMerged: false,
      };
    }
  }, [size]);

  const initGame = useCallback(() => {
    const newGrid = Array.from({ length: size }, () => Array(size).fill(null));
    idCounterRef.current = 0;
    addRandomTile(newGrid);
    addRandomTile(newGrid);
    setGrid(newGrid);
    setScore(0);
    setMovesCount(0);
    setStreak(0);
    setGameOver(false);
  }, [size, addRandomTile]);

  const slide = useCallback((row, scoreTracker) => {
    let filtered = row.filter((tile) => tile !== null).map(tile => ({ ...tile, isNew: false, isMerged: false }));

    for (let i = 0; i < filtered.length - 1; i++) {
      if (filtered[i].value === filtered[i + 1].value) {
        filtered[i].value *= 2;
        filtered[i].isMerged = true;
        scoreTracker.addedScore += filtered[i].value;
        scoreTracker.mergesInRow += 1;
        filtered.splice(i + 1, 1);
      }
    }

    while (filtered.length < size) filtered.push(null);
    return filtered;
  }, [size]);

  const checkGameOver = useCallback((currentGrid) => {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (currentGrid[r][c] === null) return false;
        if (r < size - 1 && currentGrid[r][c].value === currentGrid[r + 1][c]?.value) return false;
        if (c < size - 1 && currentGrid[r][c].value === currentGrid[r][c + 1]?.value) return false;
      }
    }
    return true;
  }, [size]);

  const move = useCallback((dir) => {
    if (gameOver || grid.length === 0) return;

    let nextGrid = grid.map((row) => [...row]);
    let scoreTracker = { addedScore: 0, mergesInRow: 0 };
    const previousStateString = JSON.stringify(nextGrid.map(row => row.map(t => t ? t.value : 0)));

    if (dir === 'left') {
      for (let r = 0; r < size; r++) nextGrid[r] = slide(nextGrid[r], scoreTracker);
    } else if (dir === 'right') {
      for (let r = 0; r < size; r++) nextGrid[r] = slide([...nextGrid[r]].reverse(), scoreTracker).reverse();
    } else if (dir === 'up') {
      for (let c = 0; c < size; c++) {
        const column = nextGrid.map(r => r[c]);
        const processedCol = slide(column, scoreTracker);
        for (let r = 0; r < size; r++) nextGrid[r][c] = processedCol[r];
      }
    } else if (dir === 'down') {
      for (let c = 0; c < size; c++) {
        const column = nextGrid.map(r => r[c]);
        const processedCol = slide(column.reverse(), scoreTracker).reverse();
        for (let r = 0; r < size; r++) nextGrid[r][c] = processedCol[r];
      }
    }

    const nextStateString = JSON.stringify(nextGrid.map(row => row.map(t => t ? t.value : 0)));

    if (previousStateString !== nextStateString) {
      addRandomTile(nextGrid);
      setGrid(nextGrid);
      setMovesCount(m => m + 1);
      
      if (scoreTracker.mergesInRow > 0) {
        setStreak(s => s + scoreTracker.mergesInRow);
      } else {
        setStreak(0);
      }

      if (scoreTracker.addedScore > 0) {
        updateHighScore(score + scoreTracker.addedScore);
      }
      if (checkGameOver(nextGrid)) {
        setGameOver(true);
      }
    }
  }, [grid, gameOver, size, slide, addRandomTile, score, updateHighScore, checkGameOver]);

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e) => {
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const minSwipeDistance = 30;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > minSwipeDistance) move(deltaX > 0 ? 'right' : 'left');
    } else {
      if (Math.abs(deltaY) > minSwipeDistance) move(deltaY > 0 ? 'down' : 'up');
    }
  };

  useEffect(() => { initGame(); }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (e.key === 'ArrowLeft' || key === 'a') move('left');
      if (e.key === 'ArrowRight' || key === 'd') move('right');
      if (e.key === 'ArrowUp' || key === 'w') move('up');
      if (e.key === 'ArrowDown' || key === 's') move('down');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move]);

  const getTileStyles = (val) => {
    const designMap = {
      2: 'bg-zinc-800 text-zinc-100 border-b-4 border-zinc-900 shadow-md',
      4: 'bg-zinc-700 text-zinc-50 border-b-4 border-zinc-800 shadow-md',
      8: 'bg-amber-600 text-amber-50 border-b-4 border-amber-800 shadow-lg font-extrabold',
      16: 'bg-orange-600 text-orange-50 border-b-4 border-orange-800 shadow-lg font-extrabold',
      32: 'bg-red-600 text-red-50 border-b-4 border-red-800 shadow-lg font-extrabold',
      64: 'bg-rose-600 text-rose-50 border-b-4 border-rose-800 shadow-lg font-extrabold',
      128: 'bg-yellow-500 text-zinc-950 border-b-4 border-yellow-700 shadow-xl font-black animate-pulse',
      256: 'bg-yellow-400 text-zinc-950 border-b-4 border-yellow-600 shadow-xl font-black ring-2 ring-yellow-300',
      512: 'bg-emerald-500 text-emerald-950 border-b-4 border-emerald-700 shadow-xl font-black',
      1024: 'bg-cyan-500 text-cyan-950 border-b-4 border-cyan-700 shadow-xl font-black ring-2 ring-cyan-300',
      2048: 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-b-4 border-indigo-800 shadow-2xl font-black ring-4 ring-purple-400 animate-bounce'
    };
    return designMap[val] || 'bg-gradient-to-r from-pink-500 to-violet-600 text-white';
  };

  const getHighestTile = () => {
    let max = 0;
    grid.forEach(row => row.forEach(tile => {
      if (tile && tile.value > max) max = tile.value;
    }));
    return max;
  };

  return (
    <div className="fixed inset-0 bg-zinc-950 text-zinc-100 flex items-center justify-center z-50 p-3 sm:p-6 select-none overflow-y-auto lg:overflow-hidden font-sans">
      
      {/* Botão Superior Flutuante */}
      <button
        onClick={() => router.push('/')}
        className="absolute top-3 left-3 z-50 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 px-3 py-2 rounded-xl font-semibold text-xs active:scale-95 transition-all flex items-center gap-1.5 shadow-md backdrop-blur-sm"
      >
        <span>←</span> Hub
      </button>

      {/* Container Adaptativo (Muda direção em telas grandes) */}
      <div className="w-full max-w-sm lg:max-w-3xl flex flex-col lg:flex-row gap-4 lg:gap-6 items-stretch justify-center mt-8 lg:mt-0">
        
        {/* Coluna Esquerda: Interface Principal do Tabuleiro */}
        <div className="flex-1 flex flex-col gap-3 max-w-sm">
          
          {/* Cabeçalho Compacto */}
          <div className="flex items-end justify-between px-1">
            <div className="flex flex-col">
              <h1 className="text-3xl font-black tracking-tighter bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">
                2048
              </h1>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">Activity Premium</p>
            </div>
            
            <div className="flex gap-1.5">
              <div className="bg-zinc-900/90 border border-zinc-800 px-2.5 py-1 rounded-xl text-center min-w-[65px]">
                <div className="text-[9px] text-zinc-500 font-bold uppercase">Score</div>
                <div className="text-base font-black text-zinc-200">{score}</div>
              </div>
              <div className="bg-zinc-900/90 border border-zinc-800 px-2.5 py-1 rounded-xl text-center min-w-[65px]">
                <div className="text-[9px] text-amber-500 font-bold uppercase">Recorde</div>
                <div className="text-base font-black text-amber-400">{highScore}</div>
              </div>
            </div>
          </div>

          {/* Área de Jogo */}
          <div 
            className="bg-zinc-900 p-2.5 rounded-3xl border border-zinc-800/60 shadow-2xl relative aspect-square w-full"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={{ touchAction: 'none' }}
          >
            <div className="grid grid-cols-4 grid-rows-4 gap-2 h-full w-full bg-zinc-950 p-1.5 rounded-2xl border border-zinc-900">
              {grid.map((row, rIdx) =>
                row.map((tile, cIdx) => (
                  <div key={`cell-${rIdx}-${cIdx}`} className="bg-zinc-900/30 rounded-xl w-full h-full relative border border-zinc-900/10">
                    {tile && (
                      <div
                        key={tile.id}
                        className={`absolute inset-0 flex items-center justify-center text-xl sm:text-2xl font-black rounded-xl transition-all duration-100 ease-out 
                          ${getTileStyles(tile.value)} 
                          ${tile.isNew ? 'scale-75 animate-[ping_0.15s_ease-in-out_1_reverse]' : ''} 
                        `}
                      >
                        {tile.value}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Overlay Game Over */}
            {gameOver && (
              <div className="absolute inset-0 bg-zinc-950/95 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center p-6">
                <h2 className="text-2xl font-black text-zinc-100 mb-1">Fim de Jogo!</h2>
                <p className="text-xs text-zinc-500 mb-4">Sem movimentos disponíveis.</p>
                <button 
                  onClick={initGame} 
                  className="w-full max-w-[200px] py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-zinc-950 font-bold rounded-xl active:scale-[0.98] transition-all text-xs"
                >
                  Jogar Novamente
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Coluna Direita / Inferior: Painel de Engajamento e Estatísticas Extra */}
        <div className="w-full lg:w-[240px] bg-zinc-900/40 border border-zinc-900 rounded-3xl p-4 flex flex-col justify-between gap-4">
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-zinc-400 tracking-wider uppercase border-b border-zinc-800 pb-2">
              Status da Partida
            </h3>
            
            {/* Grid Interno de Informações Secundárias */}
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
              <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-900">
                <div className="text-[10px] text-zinc-500 font-medium">Movimentos Validados</div>
                <div className="text-lg font-black text-zinc-300">{movesCount}</div>
              </div>
              <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-900 flex flex-col justify-between">
                <div className="text-[10px] text-zinc-500 font-medium">Combo (Merges)</div>
                <div className="text-lg font-black text-orange-400 flex items-center gap-1">
                  {streak} <span className="text-xs animate-pulse">🔥</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dica de Controles Adaptada ao Rodapé do Painel */}
          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-900 text-center lg:text-left">
            <div className="text-[10px] text-zinc-400 font-bold mb-1">Controles Aceitos</div>
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              Arraste no display mobile/tablet, ou use as teclas <span className="text-zinc-400 font-bold">WASD</span> / <span className="text-zinc-400 font-bold">Setas</span> no seu teclado.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}