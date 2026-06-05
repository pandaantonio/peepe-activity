// /games/2048.js
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function Game2048() {
  const router = useRouter();
  const size = 4;
  const [grid, setGrid] = useState(Array.from({ length: size }, () => Array(size).fill(0)));
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);

  const addRandomTile = (currentGrid) => {
    let empty = [];
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (currentGrid[r][c] === 0) empty.push({r, c});
    if (empty.length > 0) {
      const {r, c} = empty[Math.floor(Math.random() * empty.length)];
      currentGrid[r][c] = Math.random() < 0.9 ? 2 : 4;
    }
  };

  const initGame = useCallback(() => {
    let newGrid = Array.from({ length: size }, () => Array(size).fill(0));
    addRandomTile(newGrid);
    addRandomTile(newGrid);
    setGrid(newGrid);
    setScore(0);
    setGameOver(false);
  }, []);

  const slide = (row) => {
    let arr = row.filter(v => v);
    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] === arr[i+1]) {
        arr[i] *= 2;
        setScore(s => s + arr[i]);
        arr[i+1] = 0;
      }
    }
    arr = arr.filter(v => v);
    while (arr.length < size) arr.push(0);
    return arr;
  };

  const move = (dir) => {
    let newGrid = grid.map(row => [...row]);
    let moved = false;

    if (dir === 'left') {
      for (let r = 0; r < size; r++) {
        const newRow = slide(newGrid[r]);
        if (newRow.join() !== newGrid[r].join()) moved = true;
        newGrid[r] = newRow;
      }
    } else if (dir === 'right') {
      for (let r = 0; r < size; r++) {
        const rev = newGrid[r].slice().reverse();
        const newRow = slide(rev).reverse();
        if (newRow.join() !== newGrid[r].join()) moved = true;
        newGrid[r] = newRow;
      }
    } else if (dir === 'up') {
      for (let c = 0; c < size; c++) {
        let col = newGrid.map(r => r[c]);
        const newCol = slide(col);
        if (newCol.join() !== col.join()) moved = true;
        for (let r = 0; r < size; r++) newGrid[r][c] = newCol[r];
      }
    } else if (dir === 'down') {
      for (let c = 0; c < size; c++) {
        let col = newGrid.map(r => r[c]).reverse();
        const newCol = slide(col).reverse();
        if (newCol.join() !== newGrid.map(r => r[c]).join()) moved = true;
        for (let r = 0; r < size; r++) newGrid[r][c] = newCol[r];
      }
    }

    if (moved) {
      addRandomTile(newGrid);
      setGrid(newGrid);
      if (isGameOverFunc(newGrid)) setGameOver(true);
    }
  };

  const isGameOverFunc = (g) => {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (g[r][c] === 0) return false;
        if (r < size-1 && g[r][c] === g[r+1][c]) return false;
        if (c < size-1 && g[r][c] === g[r][c+1]) return false;
      }
    }
    return true;
  };

  useEffect(() => { initGame(); }, [initGame]);

  useEffect(() => {
    const handleKey = (e) => {
      if (gameOver) return;
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') move('left');
      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') move('right');
      if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') move('up');
      if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') move('down');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [grid, gameOver]);

  const handleExit = () => {
    router.push('/');
  };

  const getTileClass = (v) => {
    const map = {2:'bg-slate-200 text-slate-900',4:'bg-slate-300 text-slate-900',8:'bg-orange-400 text-white',16:'bg-orange-500 text-white',32:'bg-red-400 text-white',64:'bg-red-500 text-white',128:'bg-yellow-400 text-slate-900',256:'bg-yellow-500 text-white',512:'bg-lime-400 text-slate-900',1024:'bg-cyan-400 text-white',2048:'bg-purple-500 text-white'};
    return map[v] || 'bg-purple-600 text-white';
  };

  return (
    <div className="fixed inset-0 bg-zinc-950 flex items-center justify-center z-50">
      {/* Botão Voltar - POSICIONADO CORRETAMENTE FORA DO CONTAINER DO JOGO */}
      <button
        onClick={handleExit}
        className="fixed top-6 left-6 z-50 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 px-6 py-3 rounded-2xl font-medium active:scale-95 transition-all"
      >
        ← Voltar ao Hub
      </button>

      <div className="relative w-full max-w-[340px] p-4">
        <div className="flex justify-between mb-6">
          <h1 className="text-5xl font-black text-orange-500">2048</h1>
          <div className="text-right">
            <div className="text-xs text-zinc-400">SCORE</div>
            <div className="text-3xl font-bold">{score}</div>
          </div>
        </div>

        <div className="bg-zinc-900 p-3 rounded-3xl shadow-2xl relative">
          <div className="grid grid-cols-4 gap-2 bg-zinc-800 p-3 rounded-2xl">
            {grid.flat().map((v, i) => (
              <div key={i} className={`aspect-square flex items-center justify-center text-4xl font-bold rounded-2xl transition-all ${v ? getTileClass(v) : 'bg-zinc-800'}`}>
                {v || ''}
              </div>
            ))}
          </div>

          {gameOver && (
            <div className="absolute inset-0 bg-black/90 rounded-3xl flex flex-col items-center justify-center">
              <h2 className="text-5xl font-black text-orange-500 mb-4">Fim de Jogo!</h2>
              <p className="text-2xl mb-8">Score: {score}</p>
              <button onClick={initGame} className="px-10 py-4 bg-orange-500 hover:bg-orange-600 rounded-2xl font-bold mr-3">Jogar Novamente</button>
              <button onClick={handleExit} className="px-10 py-4 bg-zinc-700 hover:bg-zinc-600 rounded-2xl font-bold">Voltar ao Hub</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}