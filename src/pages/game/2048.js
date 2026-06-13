// /games/2048.js
'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const GRID_SIZE = 4;
const MIN_SWIPE_DISTANCE = 40;
const MAX_SWIPE_TIME = 300;
const WIN_VALUE = 2048;

const TILE_STYLES = {
  2:    { bg: 'bg-[#3d3d3d]',       text: 'text-[#e8e8e8]', border: 'border-b-[#2a2a2a]', shadow: 'shadow-[0_2px_0_#2a2a2a]' },
  4:    { bg: 'bg-[#4a4a4a]',       text: 'text-[#f0f0f0]', border: 'border-b-[#333333]', shadow: 'shadow-[0_2px_0_#333333]' },
  8:    { bg: 'bg-[#c17817]',       text: 'text-white',       border: 'border-b-[#8a5310]', shadow: 'shadow-[0_2px_0_#8a5310]', glow: 'shadow-[0_0_12px_rgba(193,120,23,0.3)]' },
  16:   { bg: 'bg-[#d65a0f]',       text: 'text-white',       border: 'border-b-[#a0400b]', shadow: 'shadow-[0_2px_0_#a0400b]', glow: 'shadow-[0_0_14px_rgba(214,90,15,0.35)]' },
  32:   { bg: 'bg-[#e8453c]',       text: 'text-white',       border: 'border-b-[#b8322a]', shadow: 'shadow-[0_2px_0_#b8322a]', glow: 'shadow-[0_0_16px_rgba(232,69,60,0.4)]' },
  64:   { bg: 'bg-[#f02e2e]',       text: 'text-white',       border: 'border-b-[#c02020]', shadow: 'shadow-[0_2px_0_#c02020]', glow: 'shadow-[0_0_18px_rgba(240,46,46,0.45)]' },
  128:  { bg: 'bg-[#e8c547]',       text: 'text-[#1a1a1a]', border: 'border-b-[#b89a2e]', shadow: 'shadow-[0_2px_0_#b89a2e]', glow: 'shadow-[0_0_20px_rgba(232,197,71,0.5)]' },
  256:  { bg: 'bg-[#f0d84a]',       text: 'text-[#1a1a1a]', border: 'border-b-[#c4ad2e]', shadow: 'shadow-[0_2px_0_#c4ad2e]', glow: 'shadow-[0_0_24px_rgba(240,216,74,0.55)]' },
  512:  { bg: 'bg-[#10b981]',       text: 'text-white',       border: 'border-b-[#0d8f65]', shadow: 'shadow-[0_2px_0_#0d8f65]', glow: 'shadow-[0_0_28px_rgba(16,185,129,0.6)]' },
  1024: { bg: 'bg-[#06b6d4]',       text: 'text-white',       border: 'border-b-[#058a9e]', shadow: 'shadow-[0_2px_0_#058a9e]', glow: 'shadow-[0_0_32px_rgba(6,182,212,0.65)]' },
  2048: { bg: 'bg-[#8b5cf6]',       text: 'text-white',       border: 'border-b-[#6d3bc4]', shadow: 'shadow-[0_2px_0_#6d3bc4]', glow: 'shadow-[0_0_40px_rgba(139,92,246,0.8)]' },
  4096: { bg: 'bg-[#ec4899]',       text: 'text-white',       border: 'border-b-[#c0267e]', shadow: 'shadow-[0_2px_0_#c0267e]', glow: 'shadow-[0_0_44px_rgba(236,72,153,0.85)]' },
  8192: { bg: 'bg-[#f43f5e]',       text: 'text-white',       border: 'border-b-[#d91e3e]', shadow: 'shadow-[0_2px_0_#d91e3e]', glow: 'shadow-[0_0_48px_rgba(244,63,94,0.9)]' },
};

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

function createEmptyGrid() {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
}

function cloneGrid(grid) {
  return grid.map(row => row.map(tile => tile ? { ...tile } : null));
}

function gridsEqual(a, b) {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if ((a[r][c]?.value ?? 0) !== (b[r][c]?.value ?? 0)) return false;
    }
  }
  return true;
}

function hasValidMoves(grid) {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === null) return true;
      if (r < GRID_SIZE - 1 && grid[r][c]?.value === grid[r + 1][c]?.value) return true;
      if (c < GRID_SIZE - 1 && grid[r][c]?.value === grid[r][c + 1]?.value) return true;
    }
  }
  return false;
}

function getEmptyPositions(grid) {
  const positions = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === null) positions.push({ r, c });
    }
  }
  return positions;
}

function getTileFontSize(value) {
  const digits = String(value).length;
  if (digits <= 2) return 'text-[clamp(1rem,5.5vmin,2.2rem)]';
  if (digits <= 3) return 'text-[clamp(0.85rem,4.5vmin,1.8rem)]';
  return 'text-[clamp(0.7rem,3.5vmin,1.4rem)]';
}

// ═══════════════════════════════════════════════════════════════════════════════
// TILE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const Tile = memo(function Tile({ tile }) {
  if (!tile) return null;

  const style = TILE_STYLES[tile.value] || TILE_STYLES[8192];
  const fontSize = getTileFontSize(tile.value);

  return (
    <div
      className={`
        absolute inset-[3%] flex items-center justify-center rounded-[12%]
        font-black ${fontSize} ${style.bg} ${style.text}
        border-b-4 ${style.border} ${style.shadow}
        transition-all duration-150 ease-out
        ${tile.isNew ? 'animate-tile-appear' : ''}
        ${tile.isMerged ? 'animate-tile-merge' : ''}
        ${tile.value >= 128 ? style.glow : ''}
        will-change-transform
      `}
      aria-label={`Peça ${tile.value}`}
    >
      {tile.value}
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// STAT BADGE
// ═══════════════════════════════════════════════════════════════════════════════

const StatBadge = memo(function StatBadge({ label, value, color = 'zinc' }) {
  const colors = {
    zinc:   'bg-zinc-900/50 border-zinc-800/40 text-zinc-500',
    amber:  'bg-amber-950/30 border-amber-900/30 text-amber-600',
    orange: 'bg-orange-950/30 border-orange-900/30 text-orange-600',
    emerald:'bg-emerald-950/30 border-emerald-900/30 text-emerald-600',
    cyan:   'bg-cyan-950/30 border-cyan-900/30 text-cyan-600',
    purple: 'bg-purple-950/30 border-purple-900/30 text-purple-600',
  };
  const valueColors = {
    zinc:   'text-zinc-300',
    amber:  'text-amber-400',
    orange: 'text-orange-400',
    emerald:'text-emerald-400',
    cyan:   'text-cyan-400',
    purple: 'text-purple-400',
  };

  return (
    <div className={`${colors[color]} border rounded-xl px-2 py-1 sm:px-3 sm:py-1.5 flex flex-col items-center justify-center min-w-0 flex-1 backdrop-blur-sm`}>
      <div className="text-[clamp(7px,1.8vmin,10px)] font-bold uppercase tracking-wider whitespace-nowrap">{label}</div>
      <div className={`text-[clamp(11px,3vmin,16px)] font-black ${valueColors[color]} tabular-nums whitespace-nowrap`}>{value}</div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN GAME
// ═══════════════════════════════════════════════════════════════════════════════

export default function Game2048() {
  const router = useRouter();

  // ─── State ─────────────────────────────────────────────────────────────────
  const [grid, setGrid] = useState(() => createEmptyGrid());
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [movesCount, setMovesCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [maxTile, setMaxTile] = useState(0);
  const [totalMerges, setTotalMerges] = useState(0);
  const [shakeDir, setShakeDir] = useState(null);
  const [newRecord, setNewRecord] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [scorePopup, setScorePopup] = useState(null);

  // ─── Refs ──────────────────────────────────────────────────────────────────
  const idCounterRef = useRef(0);
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
  const gridRef = useRef(grid);
  const gameOverRef = useRef(gameOver);
  const wonRef = useRef(won);
  const scoreRef = useRef(score);
  const moveLockRef = useRef(false);
  const timerRef = useRef(null);
  const scorePopupTimeoutRef = useRef(null);

  useEffect(() => { gridRef.current = grid; }, [grid]);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);
  useEffect(() => { wonRef.current = won; }, [won]);
  useEffect(() => { scoreRef.current = score; }, [score]);

  // ─── Load High Score ───────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('discord_2048_highscore_v2');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed)) setHighScore(parsed);
      }
    }
  }, []);

  // ─── Timer ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (startTime && !gameOver) {
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startTime, gameOver]);

  // ─── High Score Sync ───────────────────────────────────────────────────────
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      if (typeof window !== 'undefined') {
        localStorage.setItem('discord_2048_highscore_v2', score.toString());
      }
      if (!newRecord && highScore > 0) {
        setNewRecord(true);
        setTimeout(() => setNewRecord(false), 3000);
      }
    }
  }, [score, highScore, newRecord]);

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const addRandomTile = useCallback((currentGrid) => {
    const emptyPositions = getEmptyPositions(currentGrid);
    if (emptyPositions.length === 0) return currentGrid;
    const { r, c } = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
    idCounterRef.current += 1;
    const newGrid = cloneGrid(currentGrid);
    newGrid[r][c] = {
      id: idCounterRef.current,
      value: Math.random() < 0.9 ? 2 : 4,
      isNew: true,
      isMerged: false,
    };
    return newGrid;
  }, []);

  const initGame = useCallback(() => {
    idCounterRef.current = 0;
    let newGrid = createEmptyGrid();
    newGrid = addRandomTile(newGrid);
    newGrid = addRandomTile(newGrid);
    setGrid(newGrid);
    setScore(0);
    setMovesCount(0);
    setStreak(0);
    setBestStreak(0);
    setGameOver(false);
    setWon(false);
    setStartTime(Date.now());
    setElapsedTime(0);
    setMaxTile(0);
    setTotalMerges(0);
    setShakeDir(null);
    setNewRecord(false);
    setScorePopup(null);
    moveLockRef.current = false;
  }, [addRandomTile]);

  // ─── Slide Logic ───────────────────────────────────────────────────────────
  const slide = useCallback((row) => {
    let filtered = row
      .filter(tile => tile !== null)
      .map(tile => ({ ...tile, isNew: false, isMerged: false }));

    const mergesInRow = { count: 0, score: 0 };
    let i = 0;
    while (i < filtered.length - 1) {
      if (filtered[i].value === filtered[i + 1].value) {
        filtered[i] = { ...filtered[i], value: filtered[i].value * 2, isMerged: true };
        mergesInRow.count += 1;
        mergesInRow.score += filtered[i].value;
        filtered.splice(i + 1, 1);
        i += 2;
      } else {
        i += 1;
      }
    }
    while (filtered.length < GRID_SIZE) filtered.push(null);
    return { row: filtered, mergesInRow };
  }, []);

  // ─── Move Logic ────────────────────────────────────────────────────────────
  const performMove = useCallback((dir) => {
    if (moveLockRef.current || gameOverRef.current) return false;
    if (gridRef.current.length === 0) return false;

    moveLockRef.current = true;
    const currentGrid = gridRef.current;
    let nextGrid = cloneGrid(currentGrid);
    let totalAddedScore = 0;
    let totalMergesInMove = 0;

    if (dir === 'left') {
      for (let r = 0; r < GRID_SIZE; r++) {
        const result = slide(nextGrid[r]);
        nextGrid[r] = result.row;
        totalAddedScore += result.mergesInRow.score;
        totalMergesInMove += result.mergesInRow.count;
      }
    } else if (dir === 'right') {
      for (let r = 0; r < GRID_SIZE; r++) {
        const reversed = [...nextGrid[r]].reverse();
        const result = slide(reversed);
        nextGrid[r] = result.row.reverse();
        totalAddedScore += result.mergesInRow.score;
        totalMergesInMove += result.mergesInRow.count;
      }
    } else if (dir === 'up') {
      for (let c = 0; c < GRID_SIZE; c++) {
        const column = nextGrid.map(r => r[c]);
        const result = slide(column);
        for (let r = 0; r < GRID_SIZE; r++) {
          nextGrid[r] = [...nextGrid[r]];
          nextGrid[r][c] = result.row[r];
        }
        totalAddedScore += result.mergesInRow.score;
        totalMergesInMove += result.mergesInRow.count;
      }
    } else if (dir === 'down') {
      for (let c = 0; c < GRID_SIZE; c++) {
        const column = nextGrid.map(r => r[c]).reverse();
        const result = slide(column);
        const processed = result.row.reverse();
        for (let r = 0; r < GRID_SIZE; r++) {
          nextGrid[r] = [...nextGrid[r]];
          nextGrid[r][c] = processed[r];
        }
        totalAddedScore += result.mergesInRow.score;
        totalMergesInMove += result.mergesInRow.count;
      }
    }

    if (gridsEqual(currentGrid, nextGrid)) {
      moveLockRef.current = false;
      setShakeDir(dir);
      setTimeout(() => setShakeDir(null), 300);
      return false;
    }

    nextGrid = addRandomTile(nextGrid);

    let newMaxTile = 0;
    let hasWon = false;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const val = nextGrid[r][c]?.value ?? 0;
        if (val > newMaxTile) newMaxTile = val;
        if (val === WIN_VALUE && !wonRef.current) hasWon = true;
      }
    }

    setGrid(nextGrid);
    setScore(prev => prev + totalAddedScore);
    setMovesCount(prev => prev + 1);
    setMaxTile(newMaxTile);
    setTotalMerges(prev => prev + totalMergesInMove);

    if (totalMergesInMove > 0) {
      setStreak(prev => {
        const newStreak = prev + totalMergesInMove;
        setBestStreak(best => Math.max(best, newStreak));
        return newStreak;
      });
      if (totalAddedScore > 0) {
        setScorePopup({ value: totalAddedScore, id: Date.now() });
        if (scorePopupTimeoutRef.current) clearTimeout(scorePopupTimeoutRef.current);
        scorePopupTimeoutRef.current = setTimeout(() => setScorePopup(null), 800);
      }
      if (typeof navigator !== 'undefined' && navigator.vibrate && totalMergesInMove >= 2) {
        navigator.vibrate(30 * totalMergesInMove);
      }
    } else {
      setStreak(0);
    }

    if (hasWon) setWon(true);
    if (!hasValidMoves(nextGrid)) setGameOver(true);

    setTimeout(() => { moveLockRef.current = false; }, 120);
    return true;
  }, [slide, addRandomTile]);

  // ─── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      let dir = null;
      if (e.key === 'ArrowLeft' || key === 'a') dir = 'left';
      else if (e.key === 'ArrowRight' || key === 'd') dir = 'right';
      else if (e.key === 'ArrowUp' || key === 'w') dir = 'up';
      else if (e.key === 'ArrowDown' || key === 's') dir = 'down';
      else if (key === 'r' || key === 'escape') {
        if (gameOverRef.current || wonRef.current) initGame();
        return;
      }
      if (dir) { e.preventDefault(); performMove(dir); }
    };
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [performMove, initGame]);

  // ─── Touch ─────────────────────────────────────────────────────────────────
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (gameOverRef.current) return;
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const dx = Math.abs(touch.clientX - touchStartRef.current.x);
      const dy = Math.abs(touch.clientY - touchStartRef.current.y);
      if (Math.max(dx, dy) > 10) e.preventDefault();
    }
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (e.changedTouches.length !== 1) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;
    if (deltaTime > MAX_SWIPE_TIME) return;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    if (Math.max(absX, absY) < MIN_SWIPE_DISTANCE) return;
    const dir = absX > absY ? (deltaX > 0 ? 'right' : 'left') : (deltaY > 0 ? 'down' : 'up');
    e.preventDefault();
    performMove(dir);
  }, [performMove]);

  // ─── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    initGame();
    if (typeof window !== 'undefined') {
      const hasPlayed = localStorage.getItem('discord_2048_played');
      if (!hasPlayed) {
        setShowHowToPlay(true);
        localStorage.setItem('discord_2048_played', 'true');
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (scorePopupTimeoutRef.current) clearTimeout(scorePopupTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Formatters ────────────────────────────────────────────────────────────
  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const stats = useMemo(() => ({
    avgSpeed: movesCount > 0 && elapsedTime > 0 ? (movesCount / (elapsedTime / 60)).toFixed(1) : '0.0',
    efficiency: movesCount > 0 ? Math.round(score / movesCount) : 0,
  }), [movesCount, elapsedTime, score]);

  const shakeClass = useMemo(() => {
    if (!shakeDir) return '';
    return shakeDir === 'left' || shakeDir === 'right' ? 'animate-shake-x' : 'animate-shake-y';
  }, [shakeDir]);

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════════

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] text-zinc-100 flex flex-col items-center justify-center z-50 select-none overflow-hidden font-sans">

      {/* Ambient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[15%] left-[10%] w-[50vmin] h-[50vmin] bg-purple-900/[0.06] rounded-full blur-[80px]" />
        <div className="absolute bottom-[15%] right-[10%] w-[50vmin] h-[50vmin] bg-amber-900/[0.05] rounded-full blur-[80px]" />
      </div>

      {/* Global Animations */}
      <style jsx global>{`
        @keyframes tile-appear {
          0% { transform: scale(0); opacity: 0; }
          70% { transform: scale(1.12); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes tile-merge {
          0% { transform: scale(1); }
          40% { transform: scale(1.18); }
          100% { transform: scale(1); }
        }
        @keyframes score-pop {
          0% { transform: translate(-50%, 0) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -25px) scale(1.3); opacity: 0; }
        }
        @keyframes record-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(251,191,36,0.3); }
          50% { box-shadow: 0 0 16px 4px rgba(251,191,36,0.15); }
        }
        @keyframes shake-x {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-5px); }
          40% { transform: translateX(5px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(3px); }
        }
        @keyframes shake-y {
          0%, 100% { transform: translateY(0); }
          20% { transform: translateY(-5px); }
          40% { transform: translateY(5px); }
          60% { transform: translateY(-3px); }
          80% { transform: translateY(3px); }
        }
        .animate-tile-appear { animation: tile-appear 0.2s ease-out forwards; }
        .animate-tile-merge { animation: tile-merge 0.18s ease-out; }
        .animate-score-pop { animation: score-pop 0.8s ease-out forwards; }
        .animate-record-pulse { animation: record-pulse 2s ease-in-out infinite; }
        .animate-shake-x { animation: shake-x 0.3s ease-in-out; }
        .animate-shake-y { animation: shake-y 0.3s ease-in-out; }
      `}</style>

      {/* ─── TOP BAR ─────────────────────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-2 z-50 pointer-events-none">
        <button
          onClick={() => router.push('/')}
          className="pointer-events-auto bg-zinc-900/70 hover:bg-zinc-800/90 border border-zinc-800/50 text-zinc-400 hover:text-zinc-200 px-3 py-1.5 rounded-xl text-[clamp(10px,2.5vmin,13px)] font-semibold backdrop-blur-md transition-all duration-150 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
          aria-label="Voltar para o Hub"
        >
          ← Hub
        </button>
        <button
          onClick={() => setShowHowToPlay(true)}
          className="pointer-events-auto bg-zinc-900/70 hover:bg-zinc-800/90 border border-zinc-800/50 text-zinc-400 hover:text-zinc-200 w-8 h-8 rounded-xl text-sm font-bold backdrop-blur-md transition-all duration-150 active:scale-95 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
          aria-label="Como jogar"
        >
          ?
        </button>
      </div>

      {/* ─── MAIN CONTENT: flex-col, tudo empilhado verticalmente ────────────── */}
      <div className="w-full h-full flex flex-col items-center justify-center px-3 pt-10 pb-2 gap-[clamp(4px,1.2vmin,10px)]">

        {/* Header: Title + Scores */}
        <div className="w-full max-w-[min(92vw,500px)] flex items-end justify-between gap-3 flex-shrink-0">
          <div className="flex flex-col">
            <h1 className="text-[clamp(28px,8vmin,48px)] font-black tracking-tighter bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent leading-none">
              2048
            </h1>
            <span className="text-[clamp(8px,2vmin,11px)] text-zinc-600 font-bold uppercase tracking-[0.15em]">
              Discord Activity
            </span>
          </div>

          <div className="flex gap-[clamp(6px,1.5vmin,10px)]">
            {/* Score */}
            <div className={`relative bg-zinc-900/70 border rounded-2xl px-[clamp(10px,2.5vmin,16px)] py-[clamp(4px,1.2vmin,8px)] text-center min-w-[clamp(60px,16vmin,90px)] backdrop-blur-sm transition-all ${newRecord ? 'border-amber-600/40 animate-record-pulse' : 'border-zinc-800/40'}`}>
              <div className="text-[clamp(8px,2vmin,11px)] text-zinc-500 font-bold uppercase tracking-wider">Score</div>
              <div className="text-[clamp(16px,4.5vmin,24px)] font-black text-zinc-100 tabular-nums">{score.toLocaleString()}</div>
              {scorePopup && (
                <div key={scorePopup.id} className="absolute -top-1 left-1/2 text-[clamp(11px,3vmin,14px)] font-black text-amber-400 animate-score-pop pointer-events-none whitespace-nowrap">
                  +{scorePopup.value.toLocaleString()}
                </div>
              )}
            </div>

            {/* High Score */}
            <div className="bg-zinc-900/70 border border-zinc-800/40 rounded-2xl px-[clamp(10px,2.5vmin,16px)] py-[clamp(4px,1.2vmin,8px)] text-center min-w-[clamp(60px,16vmin,90px)] backdrop-blur-sm">
              <div className="text-[clamp(8px,2vmin,11px)] text-amber-600 font-bold uppercase tracking-wider">Recorde</div>
              <div className="text-[clamp(16px,4.5vmin,24px)] font-black text-amber-400 tabular-nums">{highScore.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* New Record Banner */}
        {newRecord && (
          <div className="w-full max-w-[min(92vw,500px)] bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/25 rounded-xl px-3 py-1.5 text-center animate-record-pulse flex-shrink-0">
            <span className="text-[clamp(10px,2.5vmin,13px)] text-amber-400 font-black uppercase tracking-wider">🏆 Novo Recorde!</span>
          </div>
        )}

        {/* Win Banner */}
        {won && !gameOver && (
          <div className="w-full max-w-[min(92vw,500px)] bg-gradient-to-r from-purple-500/15 to-indigo-500/15 border border-purple-500/25 rounded-xl px-3 py-1.5 text-center flex-shrink-0">
            <span className="text-[clamp(10px,2.5vmin,13px)] text-purple-400 font-black uppercase tracking-wider">✨ Você venceu! Continue jogando...</span>
          </div>
        )}

        {/* ─── GAME BOARD ────────────────────────────────────────────────────── */}
        <div
          className={`w-full max-w-[min(92vw,500px)] aspect-square bg-zinc-900/80 border border-zinc-800/50 rounded-[clamp(14px,3.5vmin,24px)] p-[clamp(6px,1.5vmin,12px)] shadow-2xl shadow-black/50 backdrop-blur-sm relative flex-shrink-0 ${shakeClass}`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: 'none' }}
          role="grid"
          aria-label="Tabuleiro do jogo 2048"
          tabIndex={0}
        >
          <div className="grid grid-cols-4 grid-rows-4 gap-[clamp(4px,1.2vmin,10px)] w-full h-full bg-zinc-950/80 p-[clamp(4px,1.2vmin,10px)] rounded-[clamp(10px,2.5vmin,18px)] border border-zinc-900/50">
            {grid.map((row, rIdx) =>
              row.map((tile, cIdx) => (
                <div
                  key={`cell-${rIdx}-${cIdx}`}
                  className="bg-zinc-900/30 rounded-[clamp(6px,1.8vmin,12px)] relative border border-zinc-900/20"
                  role="gridcell"
                  aria-label={tile ? `Célula com valor ${tile.value}` : 'Célula vazia'}
                >
                  <Tile tile={tile} />
                </div>
              ))
            )}
          </div>

          {/* Game Over Overlay */}
          {gameOver && (
            <div className="absolute inset-0 bg-zinc-950/95 backdrop-blur-lg rounded-[inherit] flex flex-col items-center justify-center p-[clamp(16px,4vmin,32px)] z-10 gap-[clamp(8px,2vmin,16px)]" role="dialog" aria-modal="true" aria-label="Fim de jogo">
              <div className="text-[clamp(32px,8vmin,48px)]">💀</div>
              <h2 className="text-[clamp(20px,5vmin,28px)] font-black text-zinc-100">Fim de Jogo!</h2>
              <p className="text-[clamp(11px,2.8vmin,14px)] text-zinc-500">Sem movimentos disponíveis.</p>
              <div className="bg-zinc-900/80 border border-zinc-800/50 rounded-2xl px-[clamp(16px,4vmin,28px)] py-[clamp(8px,2vmin,14px)] text-center">
                <div className="text-[clamp(9px,2.2vmin,11px)] text-zinc-500 font-bold uppercase tracking-wider">Pontuação Final</div>
                <div className="text-[clamp(24px,6vmin,36px)] font-black text-amber-400 tabular-nums">{score.toLocaleString()}</div>
              </div>
              <button
                onClick={initGame}
                className="w-full max-w-[220px] py-[clamp(10px,2.5vmin,14px)] bg-gradient-to-r from-orange-500 to-amber-500 text-zinc-950 font-black rounded-2xl text-[clamp(11px,2.8vmin,14px)] uppercase tracking-wider shadow-lg shadow-orange-500/20 active:scale-[0.97] transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                aria-label="Jogar novamente"
              >
                🔄 Jogar Novamente
              </button>
              <p className="text-[clamp(9px,2.2vmin,11px)] text-zinc-600">Pressione R ou ESC</p>
            </div>
          )}
        </div>

        {/* ─── STATS ROW 1 ───────────────────────────────────────────────────── */}
        <div className="w-full max-w-[min(92vw,500px)] flex gap-[clamp(4px,1.2vmin,8px)] flex-shrink-0">
          <StatBadge label="Maior" value={maxTile || '-'} color="purple" />
          <StatBadge label="Tempo" value={formatTime(elapsedTime)} color="cyan" />
          <StatBadge label="Movim." value={movesCount} color="zinc" />
          <StatBadge label="Combo" value={streak > 0 ? `${streak}🔥` : '0'} color={streak > 2 ? 'orange' : 'zinc'} />
        </div>

        {/* ─── STATS ROW 2 ───────────────────────────────────────────────────── */}
        <div className="w-full max-w-[min(92vw,500px)] flex gap-[clamp(4px,1.2vmin,8px)] flex-shrink-0">
          <StatBadge label="Melhor Combo" value={bestStreak} color="amber" />
          <StatBadge label="Merges" value={totalMerges} color="emerald" />
          <StatBadge label="Velocidade" value={stats.avgSpeed} color="cyan" />
          <StatBadge label="Eficiência" value={String(stats.efficiency)} color="purple" />
        </div>

        {/* ─── CONTROLS HINT ─────────────────────────────────────────────────── */}
        <div className="w-full max-w-[min(92vw,500px)] bg-zinc-900/40 border border-zinc-900/40 rounded-xl px-[clamp(10px,2.5vmin,16px)] py-[clamp(6px,1.5vmin,10px)] text-center flex-shrink-0">
          <p className="text-[clamp(9px,2.2vmin,12px)] text-zinc-600 leading-relaxed">
            <span className="text-zinc-400 font-bold">Arraste</span> para mover · 
            <span className="text-zinc-400 font-bold"> WASD</span> / 
            <span className="text-zinc-400 font-bold"> Setas</span> no teclado · 
            <span className="text-zinc-400 font-bold"> R</span> reinicia
          </p>
        </div>
      </div>

      {/* ─── HOW TO PLAY MODAL ─────────────────────────────────────────────── */}
      {showHowToPlay && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Como jogar"
          onClick={() => setShowHowToPlay(false)}
        >
          <div
            className="bg-zinc-900 border border-zinc-800/60 rounded-3xl p-[clamp(20px,5vmin,32px)] max-w-[360px] w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-[clamp(18px,4.5vmin,24px)] font-black text-zinc-100 mb-4 text-center">Como Jogar</h2>
            <div className="flex flex-col gap-2.5">
              {[
                { icon: '🎯', title: 'Objetivo', text: 'Combine números iguais para criar o tile ', highlight: '2048', color: 'text-purple-400' },
                { icon: '👆', title: 'Mover', text: 'Use as setas do teclado, WASD, ou arraste na tela' },
                { icon: '🔗', title: 'Combinar', text: 'Tiles iguais se fundem: ', highlight: '2+2=4, 4+4=8...', color: 'text-amber-400' },
                { icon: '⚡', title: 'Combo', text: 'Múltiplos merges em um movimento aumentam seu combo!' },
                { icon: '💀', title: 'Game Over', text: 'Termina quando não há mais movimentos válidos' },
              ].map((item, i) => (
                <div key={i} className="flex gap-2.5 items-start">
                  <span className="text-[clamp(16px,4vmin,20px)] flex-shrink-0">{item.icon}</span>
                  <div className="text-[clamp(12px,3vmin,14px)]">
                    <span className="font-bold text-zinc-200">{item.title}: </span>
                    <span className="text-zinc-400">
                      {item.text}
                      {item.highlight && <span className={`font-bold ${item.color}`}>{item.highlight}</span>}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowHowToPlay(false)}
              className="w-full mt-5 py-[clamp(10px,2.5vmin,14px)] bg-gradient-to-r from-orange-500 to-amber-500 text-zinc-950 font-black rounded-2xl text-[clamp(12px,3vmin,14px)] uppercase tracking-wider active:scale-[0.97] transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              Bora Jogar! 🚀
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
