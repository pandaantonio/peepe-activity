// /games/2048.js
'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS & CONFIG
// ═══════════════════════════════════════════════════════════════════════════════

const GRID_SIZE = 4;
const MIN_SWIPE_DISTANCE = 40;
const MAX_SWIPE_TIME = 300;
const WIN_VALUE = 2048;

const TILE_STYLES = {
  2:    { bg: 'bg-[#3d3d3d]',       text: 'text-[#e8e8e8]', border: 'border-b-[#2a2a2a]', shadow: 'shadow-[0_2px_0_#2a2a2a]', glow: '' },
  4:    { bg: 'bg-[#4a4a4a]',       text: 'text-[#f0f0f0]', border: 'border-b-[#333333]', shadow: 'shadow-[0_2px_0_#333333]', glow: '' },
  8:    { bg: 'bg-[#c17817]',       text: 'text-white',       border: 'border-b-[#8a5310]', shadow: 'shadow-[0_2px_0_#8a5310]', glow: 'shadow-[0_0_12px_rgba(193,120,23,0.3)]' },
  16:   { bg: 'bg-[#d65a0f]',       text: 'text-white',       border: 'border-b-[#a0400b]', shadow: 'shadow-[0_2px_0_#a0400b]', glow: 'shadow-[0_0_14px_rgba(214,90,15,0.35)]' },
  32:   { bg: 'bg-[#e8453c]',       text: 'text-white',       border: 'border-b-[#b8322a]', shadow: 'shadow-[0_2px_0_#b8322a]', glow: 'shadow-[0_0_16px_rgba(232,69,60,0.4)]' },
  64:   { bg: 'bg-[#f02e2e]',       text: 'text-white',       border: 'border-b-[#c02020]', shadow: 'shadow-[0_2px_0_#c02020]', glow: 'shadow-[0_0_18px_rgba(240,46,46,0.45)]' },
  128:  { bg: 'bg-[#e8c547]',       text: 'text-[#1a1a1a]', border: 'border-b-[#b89a2e]', shadow: 'shadow-[0_2px_0_#b89a2e]', glow: 'shadow-[0_0_20px_rgba(232,197,71,0.5)]', special: 'animate-tile-spawn' },
  256:  { bg: 'bg-[#f0d84a]',       text: 'text-[#1a1a1a]', border: 'border-b-[#c4ad2e]', shadow: 'shadow-[0_2px_0_#c4ad2e]', glow: 'shadow-[0_0_24px_rgba(240,216,74,0.55)]', special: 'animate-tile-spawn' },
  512:  { bg: 'bg-[#10b981]',       text: 'text-white',       border: 'border-b-[#0d8f65]', shadow: 'shadow-[0_2px_0_#0d8f65]', glow: 'shadow-[0_0_28px_rgba(16,185,129,0.6)]', special: 'animate-tile-spawn' },
  1024: { bg: 'bg-[#06b6d4]',       text: 'text-white',       border: 'border-b-[#058a9e]', shadow: 'shadow-[0_2px_0_#058a9e]', glow: 'shadow-[0_0_32px_rgba(6,182,212,0.65)]', special: 'animate-tile-spawn' },
  2048: { bg: 'bg-[#8b5cf6]',       text: 'text-white',       border: 'border-b-[#6d3bc4]', shadow: 'shadow-[0_2px_0_#6d3bc4]', glow: 'shadow-[0_0_40px_rgba(139,92,246,0.8)]', special: 'animate-tile-spawn animate-tile-victory' },
  4096: { bg: 'bg-[#ec4899]',       text: 'text-white',       border: 'border-b-[#c0267e]', shadow: 'shadow-[0_2px_0_#c0267e]', glow: 'shadow-[0_0_44px_rgba(236,72,153,0.85)]', special: 'animate-tile-spawn' },
  8192: { bg: 'bg-[#f43f5e]',       text: 'text-white',       border: 'border-b-[#d91e3e]', shadow: 'shadow-[0_2px_0_#d91e3e]', glow: 'shadow-[0_0_48px_rgba(244,63,94,0.9)]', special: 'animate-tile-spawn' },
};

const TILE_FONT_SIZES = {
  2: 'text-[clamp(1.2rem,5.5vmin,2.5rem)]',
  3: 'text-[clamp(1rem,5vmin,2.2rem)]',
  4: 'text-[clamp(0.85rem,4.5vmin,2rem)]',
};

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
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
      const av = a[r][c]?.value ?? 0;
      const bv = b[r][c]?.value ?? 0;
      if (av !== bv) return false;
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

// ═══════════════════════════════════════════════════════════════════════════════
// TILE COMPONENT (Memoized)
// ═══════════════════════════════════════════════════════════════════════════════

const Tile = memo(function Tile({ tile }) {
  if (!tile) return null;

  const style = TILE_STYLES[tile.value] || TILE_STYLES[8192];
  const digits = String(tile.value).length;
  const fontSize = digits <= 2 ? TILE_FONT_SIZES[2] : digits <= 3 ? TILE_FONT_SIZES[3] : TILE_FONT_SIZES[4];

  return (
    <div
      className={`
        absolute inset-[3%] flex items-center justify-center rounded-[12%]
        font-black ${fontSize} ${style.bg} ${style.text}
        border-b-4 ${style.border} ${style.shadow}
        transition-all duration-150 ease-out
        ${tile.isNew ? 'animate-tile-appear' : ''}
        ${tile.isMerged ? 'animate-tile-merge' : ''}
        ${style.special || ''}
        ${tile.value >= 128 ? style.glow : ''}
        will-change-transform
      `}
      aria-label={`Tile ${tile.value}`}
    >
      {tile.value}
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// STAT CARD COMPONENT (Memoized)
// ═══════════════════════════════════════════════════════════════════════════════

const StatCard = memo(function StatCard({ label, value, color = 'zinc', highlight = false, icon = null }) {
  const colorClasses = {
    zinc:   { bg: 'bg-zinc-900/60',  border: 'border-zinc-800/60',  text: 'text-zinc-400',  value: 'text-zinc-200' },
    amber:  { bg: 'bg-amber-950/40', border: 'border-amber-900/40', text: 'text-amber-600', value: 'text-amber-400' },
    orange: { bg: 'bg-orange-950/40',border: 'border-orange-900/40',text: 'text-orange-600',value: 'text-orange-400' },
    emerald:{ bg: 'bg-emerald-950/40',border:'border-emerald-900/40',text: 'text-emerald-600',value:'text-emerald-400' },
    cyan:   { bg: 'bg-cyan-950/40',  border: 'border-cyan-900/40',  text: 'text-cyan-600',  value: 'text-cyan-400' },
    purple: { bg: 'bg-purple-950/40',border: 'border-purple-900/40',text: 'text-purple-600',value: 'text-purple-400' },
  }[color];

  return (
    <div className={`${colorClasses.bg} border ${colorClasses.border} rounded-2xl p-3 backdrop-blur-sm transition-all duration-200 hover:border-opacity-80 ${highlight ? 'ring-1 ring-amber-500/30' : ''}`}>
      <div className={`text-[10px] sm:text-xs font-bold ${colorClasses.text} uppercase tracking-wider mb-1 flex items-center gap-1`}>
        {icon && <span>{icon}</span>}
        {label}
      </div>
      <div className={`text-lg sm:text-xl font-black ${colorClasses.value} tabular-nums`}>{value}</div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN GAME COMPONENT
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
  const [isAnimating, setIsAnimating] = useState(false);
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
  const isAnimatingRef = useRef(false);
  const moveLockRef = useRef(false);
  const timerRef = useRef(null);
  const scorePopupTimeoutRef = useRef(null);
  const containerRef = useRef(null);

  // Sync refs with state
  useEffect(() => { gridRef.current = grid; }, [grid]);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);
  useEffect(() => { wonRef.current = won; }, [won]);
  useEffect(() => { scoreRef.current = score; }, [score]);

  // ─── Load High Score ─────────────────────────────────────────────────────────
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
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
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
    setIsAnimating(false);
    setShakeDir(null);
    setNewRecord(false);
    setScorePopup(null);
    isAnimatingRef.current = false;
    moveLockRef.current = false;
  }, [addRandomTile]);

  // ─── Slide Logic (Immutable) ─────────────────────────────────────────────────
  const slide = useCallback((row) => {
    // Filter out nulls and reset flags
    let filtered = row
      .filter((tile) => tile !== null)
      .map((tile) => ({ ...tile, isNew: false, isMerged: false }));

    const mergesInRow = { count: 0, score: 0 };

    // Merge adjacent equal tiles
    let i = 0;
    while (i < filtered.length - 1) {
      if (filtered[i].value === filtered[i + 1].value) {
        // Merge!
        filtered[i] = {
          ...filtered[i],
          value: filtered[i].value * 2,
          isMerged: true,
        };
        mergesInRow.count += 1;
        mergesInRow.score += filtered[i].value;
        filtered.splice(i + 1, 1);
        i += 2; // Skip the merged tile and the next one
      } else {
        i += 1;
      }
    }

    // Pad with nulls
    while (filtered.length < GRID_SIZE) {
      filtered.push(null);
    }

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
        const column = nextGrid.map((r) => r[c]);
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
        const column = nextGrid.map((r) => r[c]).reverse();
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

    // Check if grid actually changed
    if (gridsEqual(currentGrid, nextGrid)) {
      moveLockRef.current = false;
      // Shake feedback for invalid move
      setShakeDir(dir);
      setTimeout(() => setShakeDir(null), 300);
      return false;
    }

    // Add random tile
    nextGrid = addRandomTile(nextGrid);

    // Calculate new max tile
    let newMaxTile = 0;
    let hasWon = false;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const val = nextGrid[r][c]?.value ?? 0;
        if (val > newMaxTile) newMaxTile = val;
        if (val === WIN_VALUE && !wonRef.current) hasWon = true;
      }
    }

    // Update state
    setGrid(nextGrid);
    setScore((prev) => prev + totalAddedScore);
    setMovesCount((prev) => prev + 1);
    setMaxTile(newMaxTile);
    setTotalMerges((prev) => prev + totalMergesInMove);

    // Streak logic
    if (totalMergesInMove > 0) {
      setStreak((prev) => {
        const newStreak = prev + totalMergesInMove;
        setBestStreak((best) => Math.max(best, newStreak));
        return newStreak;
      });
      // Score popup
      if (totalAddedScore > 0) {
        setScorePopup({ value: totalAddedScore, id: Date.now() });
        if (scorePopupTimeoutRef.current) clearTimeout(scorePopupTimeoutRef.current);
        scorePopupTimeoutRef.current = setTimeout(() => setScorePopup(null), 800);
      }
      // Haptic feedback
      if (typeof navigator !== 'undefined' && navigator.vibrate && totalMergesInMove >= 2) {
        navigator.vibrate(30 * totalMergesInMove);
      }
    } else {
      setStreak(0);
    }

    // Win detection
    if (hasWon) {
      setWon(true);
    }

    // Game over check
    if (!hasValidMoves(nextGrid)) {
      setGameOver(true);
    }

    // Unlock after animation
    setTimeout(() => {
      moveLockRef.current = false;
    }, 120);

    return true;
  }, [slide, addRandomTile]);

  // ─── Keyboard Handler ──────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      let dir = null;

      if (e.key === 'ArrowLeft' || key === 'a') dir = 'left';
      else if (e.key === 'ArrowRight' || key === 'd') dir = 'right';
      else if (e.key === 'ArrowUp' || key === 'w') dir = 'up';
      else if (e.key === 'ArrowDown' || key === 's') dir = 'down';
      else if (key === 'r' || key === 'escape') {
        if (gameOverRef.current || wonRef.current) {
          initGame();
        }
        return;
      }

      if (dir) {
        e.preventDefault();
        performMove(dir);
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [performMove, initGame]);

  // ─── Touch Handler ───────────────────────────────────────────────────────────
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  }, []);

  const handleTouchMove = useCallback((e) => {
    // Prevent scroll during game
    if (gameOverRef.current) return;
    // Only prevent if we're swiping horizontally or vertically significantly
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const dx = Math.abs(touch.clientX - touchStartRef.current.x);
      const dy = Math.abs(touch.clientY - touchStartRef.current.y);
      if (Math.max(dx, dy) > 10) {
        e.preventDefault();
      }
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

    let dir = null;
    if (absX > absY) {
      dir = deltaX > 0 ? 'right' : 'left';
    } else {
      dir = deltaY > 0 ? 'down' : 'up';
    }

    if (dir) {
      e.preventDefault();
      performMove(dir);
    }
  }, [performMove]);

  // ─── Initialize on mount ─────────────────────────────────────────────────────
  useEffect(() => {
    initGame();
    // Show how to play on first visit
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

  // ─── Format time ─────────────────────────────────────────────────────────────
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ─── Stats calculations ──────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const avgSpeed = movesCount > 0 && elapsedTime > 0
      ? (movesCount / (elapsedTime / 60)).toFixed(1)
      : '0.0';
    const efficiency = movesCount > 0
      ? Math.round(score / movesCount)
      : 0;
    return { avgSpeed, efficiency };
  }, [movesCount, elapsedTime, score]);

  // ─── Shake animation class ───────────────────────────────────────────────────
  const shakeClass = useMemo(() => {
    if (!shakeDir) return '';
    const map = { left: 'animate-shake-x', right: 'animate-shake-x', up: 'animate-shake-y', down: 'animate-shake-y' };
    return map[shakeDir] || '';
  }, [shakeDir]);

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════════

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] text-zinc-100 flex items-center justify-center z-50 select-none overflow-hidden font-sans">

      {/* Background ambient effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-900/10 rounded-full blur-[128px]" />
      </div>

      {/* Global Styles for Animations */}
      <style jsx global>{`
        @keyframes tile-appear {
          0% { transform: scale(0); opacity: 0; }
          70% { transform: scale(1.12); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes tile-merge {
          0% { transform: scale(1); }
          40% { transform: scale(1.18); }
          100% { transform: scale(1); }
        }
        @keyframes tile-spawn {
          0% { transform: scale(0.6); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes tile-victory {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.3); }
        }
        @keyframes shake-x {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        @keyframes shake-y {
          0%, 100% { transform: translateY(0); }
          20% { transform: translateY(-6px); }
          40% { transform: translateY(6px); }
          60% { transform: translateY(-4px); }
          80% { transform: translateY(4px); }
        }
        @keyframes score-pop {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-30px) scale(1.3); opacity: 0; }
        }
        @keyframes record-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.4); }
          50% { transform: scale(1.02); box-shadow: 0 0 20px 4px rgba(251, 191, 36, 0.2); }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .animate-tile-appear { animation: tile-appear 0.2s ease-out forwards; }
        .animate-tile-merge { animation: tile-merge 0.18s ease-out; }
        .animate-tile-spawn { animation: tile-spawn 0.25s ease-out; }
        .animate-tile-victory { animation: tile-victory 2s ease-in-out infinite; }
        .animate-shake-x { animation: shake-x 0.3s ease-in-out; }
        .animate-shake-y { animation: shake-y 0.3s ease-in-out; }
        .animate-score-pop { animation: score-pop 0.8s ease-out forwards; }
        .animate-record-pulse { animation: record-pulse 2s ease-in-out infinite; }
      `}</style>

      {/* Top Bar */}
      <button
        onClick={() => router.push('/')}
        className="absolute top-3 left-3 z-50 bg-zinc-900/70 hover:bg-zinc-800/90 border border-zinc-800/60 text-zinc-400 hover:text-zinc-200 px-3 py-2 rounded-xl font-semibold text-xs active:scale-95 transition-all duration-200 flex items-center gap-1.5 shadow-lg backdrop-blur-md focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
        aria-label="Voltar para o Hub"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        Hub
      </button>

      {/* How to Play Button */}
      <button
        onClick={() => setShowHowToPlay(true)}
        className="absolute top-3 right-3 z-50 bg-zinc-900/70 hover:bg-zinc-800/90 border border-zinc-800/60 text-zinc-400 hover:text-zinc-200 w-9 h-9 rounded-xl font-bold text-xs active:scale-95 transition-all duration-200 flex items-center justify-center shadow-lg backdrop-blur-md focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
        aria-label="Como jogar"
      >
        ?
      </button>

      {/* Main Layout */}
      <div className="w-full h-full max-w-[420px] lg:max-w-[900px] xl:max-w-[1200px] flex flex-col lg:flex-row gap-3 lg:gap-5 items-stretch justify-center px-3 sm:px-4 py-14 sm:py-4 lg:py-6 overflow-y-auto lg:overflow-hidden">

        {/* Left Column: Game Board */}
        <div className="flex-1 flex flex-col gap-3 min-w-0 max-w-[420px] mx-auto lg:mx-0">

          {/* Header */}
          <div className="flex items-end justify-between px-1">
            <div className="flex flex-col">
              <h1 className="text-4xl sm:text-5xl font-black tracking-tighter bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 bg-clip-text text-transparent drop-shadow-sm">
                2048
              </h1>
              <p className="text-[10px] sm:text-xs text-zinc-600 font-bold uppercase tracking-[0.2em] mt-0.5">Discord Activity</p>
            </div>

            <div className="flex gap-2">
              <div className={`bg-zinc-900/70 border border-zinc-800/60 px-3 py-1.5 rounded-2xl text-center min-w-[72px] backdrop-blur-sm transition-all duration-300 ${newRecord ? 'animate-record-pulse border-amber-700/50' : ''}`}>
                <div className="text-[9px] sm:text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Score</div>
                <div className="text-lg sm:text-xl font-black text-zinc-100 tabular-nums">{score.toLocaleString()}</div>
                {scorePopup && (
                  <div key={scorePopup.id} className="absolute -top-2 left-1/2 -translate-x-1/2 text-amber-400 font-black text-sm animate-score-pop pointer-events-none whitespace-nowrap">
                    +{scorePopup.value.toLocaleString()}
                  </div>
                )}
              </div>
              <div className="bg-zinc-900/70 border border-zinc-800/60 px-3 py-1.5 rounded-2xl text-center min-w-[72px] backdrop-blur-sm">
                <div className="text-[9px] sm:text-[10px] text-amber-600 font-bold uppercase tracking-wider">Recorde</div>
                <div className="text-lg sm:text-xl font-black text-amber-400 tabular-nums">{highScore.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* New Record Banner */}
          {newRecord && (
            <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl px-4 py-2 text-center animate-record-pulse">
              <span className="text-amber-400 font-black text-sm uppercase tracking-wider">🏆 Novo Recorde!</span>
            </div>
          )}

          {/* Win Banner */}
          {won && !gameOver && (
            <div className="bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/30 rounded-xl px-4 py-2 text-center">
              <span className="text-purple-400 font-black text-sm uppercase tracking-wider">✨ Você venceu! Continue jogando...</span>
            </div>
          )}

          {/* Game Board */}
          <div 
            ref={containerRef}
            className={`bg-zinc-900/80 p-[clamp(6px,1.5vw,12px)] rounded-3xl border border-zinc-800/50 shadow-2xl shadow-black/40 relative w-full aspect-square backdrop-blur-sm ${shakeClass}`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ touchAction: 'none' }}
            role="grid"
            aria-label="Tabuleiro do jogo 2048"
            tabIndex={0}
          >
            <div className="grid grid-cols-4 grid-rows-4 gap-[clamp(4px,1vw,10px)] h-full w-full bg-zinc-950/80 p-[clamp(4px,1vw,8px)] rounded-2xl border border-zinc-900/50">
              {grid.map((row, rIdx) =>
                row.map((tile, cIdx) => (
                  <div 
                    key={`cell-${rIdx}-${cIdx}`} 
                    className="bg-zinc-900/40 rounded-[10%] w-full h-full relative border border-zinc-900/20"
                    role="gridcell"
                    aria-label={tile ? `Célula ${rIdx + 1},${cIdx + 1} com valor ${tile.value}` : `Célula vazia ${rIdx + 1},${cIdx + 1}`}
                  >
                    <Tile tile={tile} />
                  </div>
                ))
              )}
            </div>

            {/* Game Over Overlay */}
            {gameOver && (
              <div 
                className="absolute inset-0 bg-zinc-950/95 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center p-6 z-10"
                role="dialog"
                aria-modal="true"
                aria-label="Fim de jogo"
              >
                <div className="text-5xl mb-2">💀</div>
                <h2 className="text-2xl sm:text-3xl font-black text-zinc-100 mb-1">Fim de Jogo!</h2>
                <p className="text-sm text-zinc-500 mb-2">Sem movimentos disponíveis.</p>
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl px-6 py-3 mb-4 text-center">
                  <div className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Pontuação Final</div>
                  <div className="text-3xl font-black text-amber-400 tabular-nums">{score.toLocaleString()}</div>
                </div>
                <button 
                  onClick={initGame} 
                  className="w-full max-w-[220px] py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-zinc-950 font-black rounded-xl active:scale-[0.97] transition-all duration-150 text-sm uppercase tracking-wider shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  aria-label="Jogar novamente"
                >
                  🔄 Jogar Novamente
                </button>
                <p className="text-[10px] text-zinc-600 mt-3">Pressione R ou ESC para reiniciar</p>
              </div>
            )}
          </div>

          {/* Mobile Stats Row */}
          <div className="lg:hidden grid grid-cols-4 gap-2">
            <StatCard label="Maior" value={maxTile || '-'} color="purple" icon="🔝" />
            <StatCard label="Tempo" value={formatTime(elapsedTime)} color="cyan" icon="⏱️" />
            <StatCard label="Movim." value={movesCount} color="zinc" icon="🎯" />
            <StatCard label="Combo" value={streak > 0 ? `${streak}🔥` : '0'} color="orange" highlight={streak > 2} />
          </div>

          {/* Controls hint */}
          <div className="lg:hidden bg-zinc-900/40 border border-zinc-900/50 rounded-2xl p-3 text-center backdrop-blur-sm">
            <p className="text-[10px] sm:text-xs text-zinc-500 leading-relaxed">
              <span className="text-zinc-400 font-bold">Arraste</span> para mover • 
              <span className="text-zinc-400 font-bold"> WASD</span> / 
              <span className="text-zinc-400 font-bold"> Setas</span> no teclado
            </p>
          </div>
        </div>

        {/* Right Column: Stats Panel (Desktop) */}
        <div className="hidden lg:flex w-[260px] xl:w-[300px] flex-col gap-3">

          {/* Stats Card */}
          <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-3xl p-4 xl:p-5 backdrop-blur-sm flex flex-col gap-3">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] border-b border-zinc-800/60 pb-2">
              Estatísticas
            </h3>

            <div className="grid grid-cols-1 gap-2.5">
              <StatCard label="Maior Peça" value={maxTile || '-'} color="purple" icon="🔝" />
              <StatCard label="Tempo de Jogo" value={formatTime(elapsedTime)} color="cyan" icon="⏱️" />
              <StatCard label="Movimentos" value={movesCount} color="zinc" icon="🎯" />
              <StatCard 
                label="Combo Atual" 
                value={streak > 0 ? `${streak} 🔥` : '0'} 
                color="orange" 
                highlight={streak > 2}
                icon="⚡"
              />
              <StatCard label="Melhor Combo" value={bestStreak} color="amber" icon="🏆" />
              <StatCard label="Total Merges" value={totalMerges} color="emerald" icon="🔗" />
              <StatCard label="Velocidade" value={`${stats.avgSpeed} mov/min`} color="cyan" icon="🚀" />
              <StatCard label="Eficiência" value={`${stats.efficiency} pts/mov`} color="purple" icon="📊" />
            </div>
          </div>

          {/* Controls Card */}
          <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-3xl p-4 xl:p-5 backdrop-blur-sm">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] border-b border-zinc-800/60 pb-2 mb-3">
              Controles
            </h3>
            <div className="space-y-2 text-xs text-zinc-500">
              <div className="flex items-center gap-2">
                <kbd className="bg-zinc-800 border border-zinc-700 rounded-md px-2 py-0.5 text-zinc-400 font-mono text-[10px]">WASD</kbd>
                <span>ou</span>
                <kbd className="bg-zinc-800 border border-zinc-700 rounded-md px-2 py-0.5 text-zinc-400 font-mono text-[10px]">↑↓←→</kbd>
                <span className="ml-auto">Mover</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="bg-zinc-800 border border-zinc-700 rounded-md px-2 py-0.5 text-zinc-400 font-mono text-[10px]">R</kbd>
                <span className="ml-auto">Reiniciar</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="bg-zinc-800 border border-zinc-700 rounded-md px-2 py-0.5 text-zinc-400 font-mono text-[10px]">ESC</kbd>
                <span className="ml-auto">Reiniciar</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-zinc-800 border border-zinc-700 rounded-md px-2 py-0.5 text-zinc-400 text-[10px]">Swipe</span>
                <span className="ml-auto">Mobile/Tablet</span>
              </div>
            </div>
          </div>

          {/* Restart Button */}
          <button
            onClick={initGame}
            className="w-full py-3 bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700/50 text-zinc-400 hover:text-zinc-200 font-bold rounded-2xl active:scale-[0.97] transition-all duration-200 text-xs uppercase tracking-wider backdrop-blur-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
            aria-label="Reiniciar jogo"
          >
            🔄 Novo Jogo
          </button>
        </div>
      </div>

      {/* How to Play Modal */}
      {showHowToPlay && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Como jogar"
          onClick={() => setShowHowToPlay(false)}
        >
          <div 
            className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-black text-zinc-100 mb-4 text-center">Como Jogar</h2>
            <div className="space-y-3 text-sm text-zinc-400">
              <p>🎯 <span className="text-zinc-200 font-bold">Objetivo:</span> Combine números iguais para criar o tile <span className="text-purple-400 font-bold">2048</span>!</p>
              <p>👆 <span className="text-zinc-200 font-bold">Mover:</span> Use as setas do teclado, WASD, ou arraste na tela.</p>
              <p>🔗 <span className="text-zinc-200 font-bold">Combinar:</span> Tiles iguais se fundem quando colidem. <span className="text-amber-400">2+2=4, 4+4=8...</span></p>
              <p>⚡ <span className="text-zinc-200 font-bold">Combo:</span> Múltiplos merges em um movimento aumentam seu combo!</p>
              <p>💀 <span className="text-zinc-200 font-bold">Game Over:</span> O jogo termina quando não há mais movimentos válidos.</p>
            </div>
            <button
              onClick={() => setShowHowToPlay(false)}
              className="w-full mt-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-zinc-950 font-black rounded-xl active:scale-[0.97] transition-all text-sm uppercase tracking-wider"
            >
              Bora Jogar! 🚀
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
