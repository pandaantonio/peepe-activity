import React, { useState, useCallback, useEffect, useRef, memo, useMemo } from 'react';
import { useRouter } from 'next/router';
import { FaArrowLeft, FaRedo, FaTrophy, FaRobot, FaUser, FaTrashAlt } from 'react-icons/fa';

// ============================================================
// CONSTANTES GLOBAIS (evitam recriação a cada render)
// ============================================================
const WIN_LINES = [
  [[0,0],[0,1],[0,2]], [[1,0],[1,1],[1,2]], [[2,0],[2,1],[2,2]],
  [[0,0],[1,0],[2,0]], [[0,1],[1,1],[2,1]], [[0,2],[1,2],[2,2]],
  [[0,0],[1,1],[2,2]], [[0,2],[1,1],[2,0]]
];

const INITIAL_BOARD = [
  ['', '', ''],
  ['', '', ''],
  ['', '', '']
];

const EMPTY_BOARD_HASH = '_________';

// ============================================================
// FUNÇÕES PURAS (fora do componente — zero recriação)
// ============================================================

/** Verifica vitória e retorna a linha vencedora ou null */
const checkVictory = (player, board) => {
  for (const line of WIN_LINES) {
    if (line.every(([r, c]) => board[r][c] === player)) {
      return line;
    }
  }
  return null;
};

/** Retorna células vazias como array de {row, col} */
const getEmptyCells = (board) => {
  const empty = [];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[i][j] === '') empty.push({ row: i, col: j });
    }
  }
  return empty;
};

/** Algoritmo Minimax puro — retorna score para um board dado */
const minimaxScore = (board, isMaximizing, depth) => {
  if (checkVictory('O', board)) return 10 - depth;
  if (checkVictory('X', board)) return depth - 10;
  if (getEmptyCells(board).length === 0) return 0;

  if (isMaximizing) {
    let best = -Infinity;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[i][j] === '') {
          board[i][j] = 'O';
          best = Math.max(best, minimaxScore(board, false, depth + 1));
          board[i][j] = '';
        }
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[i][j] === '') {
          board[i][j] = 'X';
          best = Math.min(best, minimaxScore(board, true, depth + 1));
          board[i][j] = '';
        }
      }
    }
    return best;
  }
};

/** Encontra a melhor jogada para O (IA) */
const findBestMove = (board) => {
  let bestScore = -Infinity;
  let bestMove = null;

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[i][j] === '') {
        board[i][j] = 'O';
        const score = minimaxScore(board, false, 0);
        board[i][j] = '';
        if (score > bestScore) {
          bestScore = score;
          bestMove = { row: i, col: j };
        }
      }
    }
  }
  return bestMove;
};

/** Gera hash do board para comparação rápida */
const boardHash = (board) =>
  board[0].join('') + board[1].join('') + board[2].join('');

/** Verifica se uma célula faz parte da linha vencedora */
const cellInWinLine = (row, col, winLine) =>
  winLine ? winLine.some(([r, c]) => r === row && c === col) : false;

// ============================================================
// SUB-COMPONENTE: CÉLULA DO TABULEIRO
// ============================================================

const GridCell = memo(({ cell, rowIndex, colIndex, isWinning, isLastMove, disabled, onClick }) => {
  const handleClick = useCallback(() => {
    onClick(rowIndex, colIndex);
  }, [onClick, rowIndex, colIndex]);

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      aria-label={cell === '' ? `Célula ${rowIndex + 1},${colIndex + 1} vazia` : `Célula ${rowIndex + 1},${colIndex + 1} marcada com ${cell}`}
      className={`
        aspect-square rounded-2xl flex items-center justify-center
        font-black select-none touch-manipulation cursor-pointer
        transition-all duration-200 ease-out
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0c]
        ${cell === ''
          ? 'bg-white/[0.025] border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.12] hover:scale-[1.03] active:scale-95 shadow-[inset_0_1px_2px_rgba(255,255,255,0.03)]'
          : 'bg-white/[0.04] border border-white/[0.08] shadow-md'
        }
        ${isWinning
          ? '!bg-emerald-500/[0.12] !border-emerald-400/40 shadow-[0_0_30px_rgba(52,211,153,0.3)] animate-pulse'
          : ''
        }
        ${isLastMove && !isWinning ? 'ring-[1.5px] ring-white/15' : ''}
        ${disabled && cell === '' ? 'cursor-not-allowed opacity-60' : ''}
      `}
    >
      {cell === 'X' && (
        <span
          className="text-emerald-400 drop-shadow-[0_0_14px_rgba(52,211,153,0.5)] animate-[scaleUp_0.2s_ease-out_forwards]"
          style={{ fontSize: 'clamp(1.75rem, 12cqw, 4.5rem)' }}
        >
          X
        </span>
      )}
      {cell === 'O' && (
        <span
          className="text-rose-400 drop-shadow-[0_0_14px_rgba(244,63,94,0.5)] animate-[scaleUp_0.2s_ease-out_forwards]"
          style={{ fontSize: 'clamp(1.75rem, 12cqw, 4.5rem)' }}
        >
          O
        </span>
      )}
    </button>
  );
});

GridCell.displayName = 'GridCell';

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function TicTacToe() {
  const router = useRouter();

  // ----------------------------------------------------------
  // ESTADO
  // ----------------------------------------------------------
  const [board, setBoard] = useState(INITIAL_BOARD);
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const [winner, setWinner] = useState(null);
  const [isDraw, setIsDraw] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [scores, setScores] = useState({ player: 0, ai: 0, draws: 0 });
  const [winningLine, setWinningLine] = useState(null);
  const [lastMove, setLastMove] = useState(null);

  // Refs para controle de timers e estado estável
  const aiTimerRef = useRef(null);
  const boardRef = useRef(INITIAL_BOARD);
  const gameOverRef = useRef(false);
  const currentPlayerRef = useRef('X');
  const scoreUpdatedRef = useRef(false);

  // Sincroniza refs com estado
  useEffect(() => { boardRef.current = board; }, [board]);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);
  useEffect(() => { currentPlayerRef.current = currentPlayer; }, [currentPlayer]);

  // ----------------------------------------------------------
  // LIMPEZA DE TIMERS (evita memory leaks e race conditions)
  // ----------------------------------------------------------
  useEffect(() => {
    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    };
  }, []);

  // ----------------------------------------------------------
  // SCORE: garante incremento único por partida usando effect
  // ----------------------------------------------------------
  useEffect(() => {
    if (gameOver && !scoreUpdatedRef.current) {
      scoreUpdatedRef.current = true;
      if (winner === 'X') {
        setScores(prev => ({ ...prev, player: prev.player + 1 }));
      } else if (winner === 'O') {
        setScores(prev => ({ ...prev, ai: prev.ai + 1 }));
      } else if (isDraw) {
        setScores(prev => ({ ...prev, draws: prev.draws + 1 }));
      }
    }
  }, [gameOver, winner, isDraw]);

  // ----------------------------------------------------------
  // IA: useEffect isolado com refs para evitar stale closures
  // ----------------------------------------------------------
  useEffect(() => {
    if (gameOverRef.current || currentPlayerRef.current !== 'O') return;

    aiTimerRef.current = setTimeout(() => {
      // Double-check com refs mais recentes
      if (gameOverRef.current || currentPlayerRef.current !== 'O') return;

      const currentBoard = boardRef.current;
      const emptyCells = getEmptyCells(currentBoard);
      if (emptyCells.length === 0) return;

      let move;
      if (emptyCells.length === 9) {
        // Primeira jogada: centro é ótimo
        move = { row: 1, col: 1 };
      } else if (Math.random() < 0.15) {
        // 15% chance de erro tático
        const idx = Math.floor(Math.random() * emptyCells.length);
        move = emptyCells[idx];
      } else {
        // Minimax perfeito — clona board para não mutar estado
        const clone = currentBoard.map(r => [...r]);
        move = findBestMove(clone);
      }

      if (move) {
        executeMove(move.row, move.col, 'O');
      }
    }, 500);

    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    };
  }, [currentPlayer]); // Dispara apenas quando currentPlayer muda para 'O'

  // ----------------------------------------------------------
  // EXECUTAR JOGADA (função centralizada e determinística)
  // ----------------------------------------------------------
  const executeMove = useCallback((row, col, player) => {
    setBoard(prevBoard => {
      // Proteção contra jogadas duplicadas ou em células ocupadas
      if (prevBoard[row][col] !== '') return prevBoard;

      const newBoard = [prevBoard[0].slice(), prevBoard[1].slice(), prevBoard[2].slice()];
      newBoard[row][col] = player;

      const winLine = checkVictory(player, newBoard);
      const empty = getEmptyCells(newBoard);

      if (winLine) {
        setWinningLine(winLine);
        setWinner(player);
        setGameOver(true);
        setCurrentPlayer(''); // Bloqueia qualquer jogada
      } else if (empty.length === 0) {
        setIsDraw(true);
        setGameOver(true);
        setCurrentPlayer('');
      } else {
        setCurrentPlayer(player === 'X' ? 'O' : 'X');
      }

      setLastMove({ row, col, player });
      return newBoard;
    });
  }, []);

  // ----------------------------------------------------------
  // HANDLER DE CLIQUE DO JOGADOR
  // ----------------------------------------------------------
  const handleCellClick = useCallback((row, col) => {
    if (gameOverRef.current || currentPlayerRef.current !== 'X') return;
    if (boardRef.current[row][col] !== '') return;

    executeMove(row, col, 'X');
  }, [executeMove]);

  // ----------------------------------------------------------
  // RESET DO JOGO
  // ----------------------------------------------------------
  const resetGame = useCallback(() => {
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);

    setBoard(INITIAL_BOARD);
    setCurrentPlayer('X');
    setWinner(null);
    setIsDraw(false);
    setGameOver(false);
    setWinningLine(null);
    setLastMove(null);
    scoreUpdatedRef.current = false;
  }, []);

  // ----------------------------------------------------------
  // RESET DO PLACAR
  // ----------------------------------------------------------
  const resetScores = useCallback(() => {
    setScores({ player: 0, ai: 0, draws: 0 });
  }, []);

  // ----------------------------------------------------------
  // NAVEGAÇÃO
  // ----------------------------------------------------------
  const handleExit = useCallback(() => {
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    router.push('/');
  }, [router]);

  // ----------------------------------------------------------
  // MEMOIZAÇÃO DE STATUS (evita recálculo a cada render)
  // ----------------------------------------------------------
  const status = useMemo(() => {
    if (winner === 'X') return { text: 'SISTEMA DESCRIPTOGRAFADO', color: 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]', dot: 'bg-emerald-400' };
    if (winner === 'O') return { text: 'PERDA DE CONTROLO INTEGRAL', color: 'text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]', dot: 'bg-rose-500' };
    if (isDraw) return { text: 'REDE EM EQUILÍBRIO', color: 'text-amber-400', dot: 'bg-amber-400' };
    if (currentPlayer === 'X') return { text: 'A SUA VEZ DE AGIR', color: 'text-white/80', dot: 'bg-emerald-400 animate-pulse' };
    return { text: 'IA CALCULANDO VETORES...', color: 'text-white/30 animate-pulse', dot: 'bg-white/30 animate-pulse' };
  }, [winner, isDraw, currentPlayer]);

  const totalGames = useMemo(() => scores.player + scores.ai + scores.draws, [scores]);

  // ----------------------------------------------------------
  // MEMOIZAÇÃO DO TABULEIRO (evita recriação de elementos)
  // ----------------------------------------------------------
  const boardCells = useMemo(() => {
    return board.map((row, rowIndex) =>
      row.map((cell, colIndex) => {
        const isWinning = cellInWinLine(rowIndex, colIndex, winningLine);
        const isLast = lastMove && lastMove.row === rowIndex && lastMove.col === colIndex;
        const disabled = gameOver || currentPlayer !== 'X' || cell !== '';

        return (
          <GridCell
            key={`${rowIndex}-${colIndex}`}
            cell={cell}
            rowIndex={rowIndex}
            colIndex={colIndex}
            isWinning={isWinning}
            isLastMove={isLast}
            disabled={disabled}
            onClick={handleCellClick}
          />
        );
      })
    );
  }, [board, winningLine, lastMove, gameOver, currentPlayer, handleCellClick]);

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------
  return (
    <div className="min-h-[100dvh] bg-[#0a0a0c] text-[#ededed] select-none font-sans antialiased flex flex-col relative overflow-hidden">

      {/* Background ambient luminoso */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/[0.02] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/[0.02] rounded-full blur-[100px]" />
      </div>

      {/* ==================================================== */}
      {/* TOPBAR */}
      {/* ==================================================== */}
      <header className="bg-white/[0.02] backdrop-blur-xl border-b border-white/5 shrink-0 z-20 relative">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2">

          {/* Grupo esquerdo: Voltar + Reiniciar */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleExit}
              aria-label="Voltar ao menu"
              className="p-2.5 sm:p-3 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all active:scale-95 cursor-pointer border border-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50"
            >
              <FaArrowLeft size={16} />
            </button>
            <button
              onClick={resetGame}
              aria-label="Reiniciar partida"
              className="p-2.5 sm:p-3 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all active:scale-95 cursor-pointer border border-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50"
            >
              <FaRedo size={14} />
            </button>
          </div>

          {/* Status central */}
          <div className="flex-1 flex justify-center min-w-0 px-1">
            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-white/[0.02] border border-white/10 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-center max-w-full">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${status.dot}`} aria-hidden="true" />
              <span className={`${status.color} truncate`}>{status.text}</span>
            </div>
          </div>

          {/* Limpar placar */}
          <button
            onClick={resetScores}
            aria-label="Zerar placar"
            className="p-2.5 sm:p-3 text-gray-500 hover:text-rose-400 bg-white/[0.01] hover:bg-rose-500/5 rounded-xl transition-all active:scale-95 cursor-pointer border border-white/5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50"
            title="Zerar Placar"
          >
            <FaTrashAlt size={13} />
            <span className="hidden sm:inline">Limpar</span>
          </button>
        </div>
      </header>

      {/* ==================================================== */}
      {/* CONTEÚDO PRINCIPAL */}
      {/* ==================================================== */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-5 flex items-center justify-center z-10 relative min-h-0">
        <div className="w-full h-full flex flex-col lg:grid lg:grid-cols-12 gap-3 sm:gap-4 lg:gap-6 items-stretch">

          {/* ------------------------------------------------ */}
          {/* COLUNA ESQUERDA: Placar */}
          {/* Mobile: depois do tabuleiro | Desktop: antes */}
          {/* ------------------------------------------------ */}
          <aside className="lg:col-span-4 xl:col-span-3 flex flex-col justify-center glass-card rounded-2xl p-4 sm:p-5 shadow-2xl gap-4 lg:gap-5 order-2 lg:order-1 min-h-0">

            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Módulo do Placar</span>
              <h2 className="text-base sm:text-lg font-black text-white">Consola de Desempenho</h2>
            </div>

            {/* Placar Principal */}
            <div className="bg-[#050507]/60 rounded-2xl p-3 sm:p-4 border border-white/5 shadow-inner backdrop-blur-md">
              <div className="grid grid-cols-3 gap-2 items-center text-center">

                {/* Jogador */}
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-md">
                    <FaUser className="text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.3)]" size={14} />
                  </div>
                  <span className="text-[9px] sm:text-[10px] text-gray-500 font-bold uppercase tracking-wider leading-tight">Você (X)</span>
                  <span className="text-xl sm:text-2xl font-black text-white">{scores.player}</span>
                </div>

                {/* Empates */}
                <div className="flex flex-col items-center gap-0.5 border-x border-white/5 px-1">
                  <span className="text-[9px] sm:text-[10px] text-gray-600 font-bold uppercase tracking-wider">Empates</span>
                  <span className="text-lg sm:text-xl font-black text-amber-400/90">{scores.draws}</span>
                  <span className="text-[9px] sm:text-[10px] text-gray-600 font-medium">Partidas: {totalGames}</span>
                </div>

                {/* IA */}
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shadow-md">
                    <FaRobot className="text-rose-400 drop-shadow-[0_0_6px_rgba(244,63,94,0.3)]" size={14} />
                  </div>
                  <span className="text-[9px] sm:text-[10px] text-gray-500 font-bold uppercase tracking-wider leading-tight">IA (O)</span>
                  <span className="text-xl sm:text-2xl font-black text-white">{scores.ai}</span>
                </div>

              </div>

              {/* Barra de Distribuição */}
              <div className="mt-4 flex h-1.5 rounded-full overflow-hidden bg-white/5 shadow-inner">
                <div
                  className="bg-emerald-400/80 transition-all duration-500 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                  style={{ width: `${totalGames > 0 ? (scores.player / totalGames) * 100 : 33.3}%` }}
                />
                <div
                  className="bg-amber-400/60 transition-all duration-500"
                  style={{ width: `${totalGames > 0 ? (scores.draws / totalGames) * 100 : 33.4}%` }}
                />
                <div
                  className="bg-rose-500/80 transition-all duration-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
                  style={{ width: `${totalGames > 0 ? (scores.ai / totalGames) * 100 : 33.3}%` }}
                />
              </div>
            </div>

            {/* Dica */}
            <div className="p-3 sm:p-4 bg-purple-500/[0.02] border-l-4 border-purple-500/40 rounded-r-xl flex items-start gap-3 border border-white/5 border-l-4">
              <FaTrophy size={14} className="text-purple-400 mt-0.5 flex-shrink-0 drop-shadow-[0_0_6px_rgba(192,132,252,0.4)]" />
              <div className="text-left">
                <span className="font-bold text-purple-400/80 uppercase tracking-wider text-[10px]">Algoritmo</span>
                <p className="text-gray-400 mt-0.5 leading-relaxed text-xs sm:text-[13px]">
                  Minimax ativo. Bloqueie ameaças imediatamente.
                </p>
              </div>
            </div>

          </aside>

          {/* ------------------------------------------------ */}
          {/* COLUNA DIREITA: Tabuleiro */}
          {/* Mobile: primeiro | Desktop: maior */}
          {/* ------------------------------------------------ */}
          <section
            className="lg:col-span-8 xl:col-span-9 flex flex-col justify-center glass-card rounded-2xl p-3 sm:p-5 md:p-6 lg:p-8 shadow-2xl relative order-1 lg:order-2 min-h-0"
            aria-label="Tabuleiro do Jogo da Velha"
          >
            {/* Container do Tabuleiro — usa container query para fonte */}
            <div className="w-full h-full flex items-center justify-center">
              <div
                className="grid grid-cols-3 gap-1.5 sm:gap-2.5 md:gap-3 p-2 sm:p-3 md:p-4 rounded-2xl bg-[#050507]/60 border border-white/5 shadow-inner backdrop-blur-md w-full max-w-[min(92vw,520px)] aspect-square mx-auto"
                style={{ containerType: 'inline-size' }}
              >
                {boardCells}
              </div>
            </div>

            {/* Overlay de Fim de Jogo */}
            {(winner || isDraw) && (
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Fim de jogo"
                className="absolute inset-0 bg-[#0a0a0c]/95 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center gap-4 sm:gap-6 p-5 sm:p-8 z-20 animate-[fadeIn_0.3s_ease-out] border border-white/10"
              >
                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-2xl ${
                  winner === 'X' ? 'bg-emerald-500/10 border border-emerald-500/30' :
                  winner === 'O' ? 'bg-rose-500/10 border border-rose-500/30' :
                  'bg-amber-500/10 border border-amber-500/30'
                }`}>
                  <span className={`text-4xl sm:text-5xl font-black drop-shadow-md ${
                    winner === 'X' ? 'text-emerald-400' :
                    winner === 'O' ? 'text-rose-400' :
                    'text-amber-400'
                  }`}>
                    {winner === 'X' ? 'X' : winner === 'O' ? 'O' : '='}
                  </span>
                </div>

                <div className="text-center max-w-[260px] sm:max-w-sm">
                  <h2 className={`text-xl sm:text-2xl lg:text-3xl font-black mb-1.5 tracking-wide ${
                    winner === 'X' ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]' :
                    winner === 'O' ? 'text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]' :
                    'text-amber-400'
                  }`}>
                    {winner === 'X' && 'CONEXÃO BEM-SUCEDIDA'}
                    {winner === 'O' && 'ALVO BLOQUEADO'}
                    {isDraw && 'EMPATE DETETADO'}
                  </h2>
                  <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
                    {winner === 'X' && 'Conseguiu ultrapassar as barreiras lógicas do adversário.'}
                    {winner === 'O' && 'O algoritmo da IA previu as suas jogadas finais.'}
                    {isDraw && 'Nenhum dos sistemas conseguiu obter vantagem espacial.'}
                  </p>
                </div>

                <button
                  onClick={resetGame}
                  className="px-8 sm:px-10 py-3 sm:py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-bold text-sm sm:text-base rounded-2xl transition-all shadow-xl cursor-pointer active:scale-95 w-full sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50"
                >
                  Reiniciar Vetores
                </button>
              </div>
            )}

          </section>

        </div>
      </main>

      {/* ==================================================== */}
      {/* ESTILOS EMBUTIDOS */}
      {/* ==================================================== */}
      <style jsx>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.025);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          box-shadow:
            0 1px 2px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.04);
        }

        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.6) rotate(-8deg); }
          60% { transform: scale(1.08) rotate(2deg); }
          to { opacity: 1; transform: scale(1) rotate(0deg); }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
