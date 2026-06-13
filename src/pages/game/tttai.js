import React, { useState, useCallback, useEffect, useRef, memo, useMemo } from 'react';
import { useRouter } from 'next/router';
import { FaArrowLeft, FaRedo, FaTrophy, FaRobot, FaUser, FaTrashAlt } from 'react-icons/fa';

// ============================================================
// CONSTANTES GLOBAIS
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

// ============================================================
// FUNÇÕES PURAS
// ============================================================

const checkVictory = (player, board) => {
  for (const line of WIN_LINES) {
    if (line.every(([r, c]) => board[r][c] === player)) return line;
  }
  return null;
};

const getEmptyCells = (board) => {
  const empty = [];
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      if (board[i][j] === '') empty.push({ row: i, col: j });
  return empty;
};

const minimaxScore = (board, isMaximizing, depth) => {
  if (checkVictory('O', board)) return 10 - depth;
  if (checkVictory('X', board)) return depth - 10;
  if (getEmptyCells(board).length === 0) return 0;

  if (isMaximizing) {
    let best = -Infinity;
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++)
        if (board[i][j] === '') {
          board[i][j] = 'O';
          best = Math.max(best, minimaxScore(board, false, depth + 1));
          board[i][j] = '';
        }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++)
        if (board[i][j] === '') {
          board[i][j] = 'X';
          best = Math.min(best, minimaxScore(board, true, depth + 1));
          board[i][j] = '';
        }
    return best;
  }
};

const findBestMove = (board) => {
  let bestScore = -Infinity;
  let bestMove = null;
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      if (board[i][j] === '') {
        board[i][j] = 'O';
        const score = minimaxScore(board, false, 0);
        board[i][j] = '';
        if (score > bestScore) { bestScore = score; bestMove = { row: i, col: j }; }
      }
  return bestMove;
};

const cellInWinLine = (row, col, winLine) =>
  winLine ? winLine.some(([r, c]) => r === row && c === col) : false;

// ============================================================
// CÉLULA DO TABULEIRO
// ============================================================

const GridCell = memo(({ cell, rowIndex, colIndex, isWinning, isLastMove, disabled, onClick }) => {
  const handleClick = useCallback(() => onClick(rowIndex, colIndex), [onClick, rowIndex, colIndex]);

  const cellClasses = [
    'aspect-square rounded-2xl flex items-center justify-center',
    'font-black select-none touch-manipulation cursor-pointer',
    'transition-all duration-200 ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0c]',
    cell === ''
      ? 'bg-white/[0.025] border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.12] hover:scale-[1.03] active:scale-95 shadow-[inset_0_1px_2px_rgba(255,255,255,0.03)]'
      : 'bg-white/[0.04] border border-white/[0.08] shadow-md',
    isWinning ? '!bg-emerald-500/[0.12] !border-emerald-400/40 shadow-[0_0_30px_rgba(52,211,153,0.3)] animate-pulse' : '',
    isLastMove && !isWinning ? 'ring-[1.5px] ring-white/15' : '',
    disabled && cell === '' ? 'cursor-not-allowed opacity-60' : ''
  ].join(' ');

  return React.createElement('button', {
    onClick: handleClick,
    disabled: disabled,
    'aria-label': cell === '' ? `Célula ${rowIndex + 1},${colIndex + 1} vazia` : `Célula ${rowIndex + 1},${colIndex + 1} com ${cell}`,
    className: cellClasses
  }, [
    cell === 'X' && React.createElement('span', {
      key: 'x',
      className: 'text-emerald-400 drop-shadow-[0_0_14px_rgba(52,211,153,0.5)] animate-[scaleUp_0.2s_ease-out_forwards]',
      style: { fontSize: 'clamp(1.4rem, 10cqw, 4rem)' }
    }, 'X'),
    cell === 'O' && React.createElement('span', {
      key: 'o',
      className: 'text-rose-400 drop-shadow-[0_0_14px_rgba(244,63,94,0.5)] animate-[scaleUp_0.2s_ease-out_forwards]',
      style: { fontSize: 'clamp(1.4rem, 10cqw, 4rem)' }
    }, 'O')
  ].filter(Boolean));
});

GridCell.displayName = 'GridCell';

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function TicTacToe() {
  const router = useRouter();

  const [board, setBoard] = useState(INITIAL_BOARD);
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const [winner, setWinner] = useState(null);
  const [isDraw, setIsDraw] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [scores, setScores] = useState({ player: 0, ai: 0, draws: 0 });
  const [winningLine, setWinningLine] = useState(null);
  const [lastMove, setLastMove] = useState(null);

  const aiTimerRef = useRef(null);
  const boardRef = useRef(INITIAL_BOARD);
  const gameOverRef = useRef(false);
  const currentPlayerRef = useRef('X');
  const scoreUpdatedRef = useRef(false);

  useEffect(() => { boardRef.current = board; }, [board]);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);
  useEffect(() => { currentPlayerRef.current = currentPlayer; }, [currentPlayer]);

  useEffect(() => () => { if (aiTimerRef.current) clearTimeout(aiTimerRef.current); }, []);

  useEffect(() => {
    if (gameOver && !scoreUpdatedRef.current) {
      scoreUpdatedRef.current = true;
      if (winner === 'X')       setScores(p => ({ ...p, player: p.player + 1 }));
      else if (winner === 'O')  setScores(p => ({ ...p, ai: p.ai + 1 }));
      else if (isDraw)          setScores(p => ({ ...p, draws: p.draws + 1 }));
    }
  }, [gameOver, winner, isDraw]);

  useEffect(() => {
    if (gameOverRef.current || currentPlayerRef.current !== 'O') return;
    aiTimerRef.current = setTimeout(() => {
      if (gameOverRef.current || currentPlayerRef.current !== 'O') return;
      const currentBoard = boardRef.current;
      const emptyCells = getEmptyCells(currentBoard);
      if (emptyCells.length === 0) return;

      let move;
      if (emptyCells.length === 9) {
        move = { row: 1, col: 1 };
      } else if (Math.random() < 0.15) {
        move = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      } else {
        move = findBestMove(currentBoard.map(r => [...r]));
      }
      if (move) executeMove(move.row, move.col, 'O');
    }, 500);
    return () => { if (aiTimerRef.current) clearTimeout(aiTimerRef.current); };
  }, [currentPlayer]);

  const executeMove = useCallback((row, col, player) => {
    setBoard(prevBoard => {
      if (prevBoard[row][col] !== '') return prevBoard;
      const newBoard = [prevBoard[0].slice(), prevBoard[1].slice(), prevBoard[2].slice()];
      newBoard[row][col] = player;
      const winLine = checkVictory(player, newBoard);
      const empty = getEmptyCells(newBoard);
      if (winLine) {
        setWinningLine(winLine); setWinner(player);
        setGameOver(true); setCurrentPlayer('');
      } else if (empty.length === 0) {
        setIsDraw(true); setGameOver(true); setCurrentPlayer('');
      } else {
        setCurrentPlayer(player === 'X' ? 'O' : 'X');
      }
      setLastMove({ row, col, player });
      return newBoard;
    });
  }, []);

  const handleCellClick = useCallback((row, col) => {
    if (gameOverRef.current || currentPlayerRef.current !== 'X') return;
    if (boardRef.current[row][col] !== '') return;
    executeMove(row, col, 'X');
  }, [executeMove]);

  const resetGame = useCallback(() => {
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    setBoard(INITIAL_BOARD); setCurrentPlayer('X');
    setWinner(null); setIsDraw(false); setGameOver(false);
    setWinningLine(null); setLastMove(null);
    scoreUpdatedRef.current = false;
  }, []);

  const resetScores = useCallback(() => setScores({ player: 0, ai: 0, draws: 0 }), []);

  const handleExit = useCallback(() => {
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    router.push('/');
  }, [router]);

  const status = useMemo(() => {
    if (winner === 'X') return { text: 'SISTEMA DESCRIPTOGRAFADO', color: 'text-emerald-400', dot: 'bg-emerald-400' };
    if (winner === 'O') return { text: 'PERDA DE CONTROLO', color: 'text-rose-500', dot: 'bg-rose-500' };
    if (isDraw)         return { text: 'REDE EM EQUILÍBRIO', color: 'text-amber-400', dot: 'bg-amber-400' };
    if (currentPlayer === 'X') return { text: 'SUA VEZ', color: 'text-white/80', dot: 'bg-emerald-400 animate-pulse' };
    return { text: 'IA CALCULANDO…', color: 'text-white/30 animate-pulse', dot: 'bg-white/30 animate-pulse' };
  }, [winner, isDraw, currentPlayer]);

  const totalGames = useMemo(() => scores.player + scores.ai + scores.draws, [scores]);

  const boardCells = useMemo(() => board.map((row, rIdx) =>
    row.map((cell, cIdx) =>
      React.createElement(GridCell, {
        key: `${rIdx}-${cIdx}`,
        cell: cell,
        rowIndex: rIdx,
        colIndex: cIdx,
        isWinning: cellInWinLine(rIdx, cIdx, winningLine),
        isLastMove: lastMove?.row === rIdx && lastMove?.col === cIdx,
        disabled: gameOver || currentPlayer !== 'X' || cell !== '',
        onClick: handleCellClick
      })
    )
  ), [board, winningLine, lastMove, gameOver, currentPlayer, handleCellClick]);

  // ============================================================
  // RENDER
  // ============================================================

  const statusBadge = React.createElement('div', {
    className: 'flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.02] border border-white/10 text-[10px] sm:text-xs font-bold uppercase tracking-wider max-w-full'
  }, [
    React.createElement('span', {
      key: 'dot',
      className: `w-2 h-2 rounded-full flex-shrink-0 ${status.dot}`,
      'aria-hidden': 'true'
    }),
    React.createElement('span', {
      key: 'text',
      className: `${status.color} truncate`
    }, status.text)
  ]);

  const topBar = React.createElement('header', {
    className: 'bg-white/[0.02] backdrop-blur-xl border-b border-white/5 shrink-0 z-20 relative'
  }, React.createElement('div', {
    className: 'w-full max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between gap-2'
  }, [
    React.createElement('div', { key: 'left', className: 'flex items-center gap-2 flex-shrink-0' }, [
      React.createElement('button', {
        key: 'exit',
        onClick: handleExit,
        'aria-label': 'Voltar ao menu',
        className: 'p-2 sm:p-2.5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all active:scale-95 border border-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50'
      }, React.createElement(FaArrowLeft, { size: 14 })),
      React.createElement('button', {
        key: 'reset',
        onClick: resetGame,
        'aria-label': 'Reiniciar partida',
        className: 'p-2 sm:p-2.5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all active:scale-95 border border-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50'
      }, React.createElement(FaRedo, { size: 13 }))
    ]),
    React.createElement('div', { key: 'center', className: 'flex-1 flex justify-center min-w-0 px-1' }, statusBadge),
    React.createElement('button', {
      key: 'clear',
      onClick: resetScores,
      'aria-label': 'Zerar placar',
      className: 'p-2 sm:p-2.5 text-gray-500 hover:text-rose-400 bg-white/[0.01] hover:bg-rose-500/5 rounded-xl transition-all active:scale-95 border border-white/5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50'
    }, [
      React.createElement(FaTrashAlt, { key: 'icon', size: 12 }),
      React.createElement('span', { key: 'label', className: 'hidden sm:inline' }, 'Limpar')
    ])
  ]));

  const boardGrid = React.createElement('div', {
    className: 'grid grid-cols-3 gap-2 p-3 rounded-2xl bg-[#050507]/60 border border-white/5 shadow-inner backdrop-blur-md w-full',
    style: { containerType: 'inline-size', aspectRatio: '1/1', maxWidth: 'min(90%, 400px)', margin: '0 auto' }
  }, boardCells.flat());

  const gameOverOverlay = (winner || isDraw) && React.createElement('div', {
    role: 'dialog',
    'aria-modal': 'true',
    'aria-label': 'Fim de jogo',
    className: 'absolute inset-0 bg-[#0a0a0c]/95 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center gap-3 sm:gap-5 p-4 sm:p-8 z-20 animate-[fadeIn_0.3s_ease-out] border border-white/10'
  }, [
    React.createElement('div', {
      key: 'icon',
      className: `w-14 h-14 sm:w-18 sm:h-18 rounded-2xl flex items-center justify-center shadow-2xl ${
        winner === 'X' ? 'bg-emerald-500/10 border border-emerald-500/30' :
        winner === 'O' ? 'bg-rose-500/10 border border-rose-500/30' :
        'bg-amber-500/10 border border-amber-500/30'
      }`
    }, React.createElement('span', {
      className: `text-3xl sm:text-5xl font-black drop-shadow-md ${
        winner === 'X' ? 'text-emerald-400' :
        winner === 'O' ? 'text-rose-400' : 'text-amber-400'
      }`
    }, winner === 'X' ? 'X' : winner === 'O' ? 'O' : '=')),
    React.createElement('div', { key: 'text', className: 'text-center max-w-[220px] sm:max-w-sm' }, [
      React.createElement('h2', {
        key: 'title',
        className: `text-lg sm:text-2xl font-black mb-1 tracking-wide ${
          winner === 'X' ? 'text-emerald-400' :
          winner === 'O' ? 'text-rose-500' : 'text-amber-400'
        }`
      }, winner === 'X' ? 'CONEXÃO BEM-SUCEDIDA' : winner === 'O' ? 'ALVO BLOQUEADO' : 'EMPATE DETETADO'),
      React.createElement('p', {
        key: 'desc',
        className: 'text-gray-400 text-[11px] sm:text-sm leading-relaxed'
      }, winner === 'X' ? 'Ultrapassou as barreiras lógicas do adversário.' :
         winner === 'O' ? 'O algoritmo da IA previu as suas jogadas.' :
         'Nenhum sistema obteve vantagem espacial.')
    ]),
    React.createElement('button', {
      key: 'btn',
      onClick: resetGame,
      className: 'px-6 sm:px-10 py-2.5 sm:py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-bold text-sm rounded-2xl transition-all shadow-xl cursor-pointer active:scale-95 w-full sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50'
    }, 'Reiniciar Vetores')
  ]);

  const boardSection = React.createElement('section', {
    className: 'ttt-board glass-card rounded-2xl p-3 sm:p-5 shadow-2xl relative flex items-center justify-center',
    'aria-label': 'Tabuleiro do Jogo da Velha'
  }, [boardGrid, gameOverOverlay].filter(Boolean));

  const scorePanel = React.createElement('aside', {
    className: 'ttt-panel glass-card rounded-2xl p-3 sm:p-5 shadow-2xl flex flex-col justify-between gap-3'
  }, [
    React.createElement('div', { key: 'title', className: 'flex flex-col gap-0.5 flex-shrink-0' }, [
      React.createElement('span', { key: 'label', className: 'text-[9px] sm:text-[10px] font-bold text-emerald-400 uppercase tracking-widest' }, 'Módulo do Placar'),
      React.createElement('h2', { key: 'heading', className: 'text-sm sm:text-base font-black text-white leading-tight' }, 'Consola de Desempenho')
    ]),
    React.createElement('div', { key: 'scores', className: 'bg-[#050507]/60 rounded-xl p-2.5 sm:p-4 border border-white/5 shadow-inner backdrop-blur-md flex-shrink-0' }, [
      React.createElement('div', { key: 'grid', className: 'grid grid-cols-3 gap-1 items-center text-center' }, [
        React.createElement('div', { key: 'player', className: 'flex flex-col items-center gap-1' }, [
          React.createElement('div', { key: 'icon', className: 'w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center' },
            React.createElement(FaUser, { className: 'text-emerald-400', size: 12 })),
          React.createElement('span', { key: 'label', className: 'text-[8px] sm:text-[9px] text-gray-500 font-bold uppercase tracking-wider leading-tight' }, 'Você (X)'),
          React.createElement('span', { key: 'score', className: 'text-lg sm:text-2xl font-black text-white' }, scores.player)
        ]),
        React.createElement('div', { key: 'draws', className: 'flex flex-col items-center gap-0.5 border-x border-white/5 px-1' }, [
          React.createElement('span', { key: 'label', className: 'text-[8px] sm:text-[9px] text-gray-600 font-bold uppercase tracking-wider' }, 'Empates'),
          React.createElement('span', { key: 'score', className: 'text-base sm:text-xl font-black text-amber-400/90' }, scores.draws),
          React.createElement('span', { key: 'total', className: 'text-[8px] sm:text-[9px] text-gray-600' }, `${totalGames} partidas`)
        ]),
        React.createElement('div', { key: 'ai', className: 'flex flex-col items-center gap-1' }, [
          React.createElement('div', { key: 'icon', className: 'w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center' },
            React.createElement(FaRobot, { className: 'text-rose-400', size: 12 })),
          React.createElement('span', { key: 'label', className: 'text-[8px] sm:text-[9px] text-gray-500 font-bold uppercase tracking-wider leading-tight' }, 'IA (O)'),
          React.createElement('span', { key: 'score', className: 'text-lg sm:text-2xl font-black text-white' }, scores.ai)
        ])
      ]),
      React.createElement('div', { key: 'bar', className: 'mt-3 flex h-1.5 rounded-full overflow-hidden bg-white/5 shadow-inner' }, [
        React.createElement('div', {
          key: 'p',
          className: 'bg-emerald-400/80 transition-all duration-500 shadow-[0_0_8px_rgba(52,211,153,0.5)]',
          style: { width: `${totalGames > 0 ? (scores.player / totalGames) * 100 : 33.3}%` }
        }),
        React.createElement('div', {
          key: 'd',
          className: 'bg-amber-400/60 transition-all duration-500',
          style: { width: `${totalGames > 0 ? (scores.draws / totalGames) * 100 : 33.4}%` }
        }),
        React.createElement('div', {
          key: 'a',
          className: 'bg-rose-500/80 transition-all duration-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]',
          style: { width: `${totalGames > 0 ? (scores.ai / totalGames) * 100 : 33.3}%` }
        })
      ])
    ]),
    React.createElement('div', { key: 'tip', className: 'p-2.5 sm:p-3 bg-purple-500/[0.02] border border-white/5 border-l-4 border-l-purple-500/40 rounded-r-xl flex items-start gap-2 flex-shrink-0' }, [
      React.createElement(FaTrophy, { key: 'icon', size: 12, className: 'text-purple-400 mt-0.5 flex-shrink-0' }),
      React.createElement('div', { key: 'text', className: 'text-left min-w-0' }, [
        React.createElement('span', { key: 'label', className: 'font-bold text-purple-400/80 uppercase tracking-wider text-[9px] sm:text-[10px]' }, 'Algoritmo'),
        React.createElement('p', { key: 'desc', className: 'text-gray-400 mt-0.5 leading-relaxed text-[10px] sm:text-xs' }, 'Minimax ativo. Bloqueie ameaças imediatamente.')
      ])
    ]),
    React.createElement('div', { key: 'actions', className: 'flex gap-2 flex-shrink-0' }, [
      React.createElement('button', {
        key: 'new',
        onClick: resetGame,
        className: 'flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-[10px] sm:text-xs rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50'
      }, [
        React.createElement(FaRedo, { key: 'icon', size: 10 }),
        'Nova Partida'
      ]),
      React.createElement('button', {
        key: 'clear',
        onClick: resetScores,
        className: 'flex-1 py-2 bg-white/[0.01] hover:bg-rose-500/5 border border-white/5 text-gray-400 hover:text-rose-400 font-bold text-[10px] sm:text-xs rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50'
      }, [
        React.createElement(FaTrashAlt, { key: 'icon', size: 10 }),
        'Zerar Placar'
      ])
    ])
  ]);

  const mainContent = React.createElement('main', {
    className: 'flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-center z-10 relative min-h-0'
  }, React.createElement('div', { className: 'ttt-layout w-full h-full' }, [
    boardSection,
    scorePanel
  ]));

  const ambientBg = React.createElement('div', { className: 'fixed inset-0 pointer-events-none z-0' }, [
    React.createElement('div', { key: 'g1', className: 'absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/[0.02] rounded-full blur-[120px]' }),
    React.createElement('div', { key: 'g2', className: 'absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/[0.02] rounded-full blur-[100px]' })
  ]);

  const styles = React.createElement('style', { key: 'styles', jsx: true }, `
    .glass-card {
      background: rgba(255, 255, 255, 0.025);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(255, 255, 255, 0.06);
      box-shadow:
        0 1px 2px rgba(0,0,0,0.1),
        inset 0 1px 0 rgba(255,255,255,0.04);
    }

    /* Portrait: coluna */
    .ttt-layout {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }
    .ttt-board {
      width: min(92vw, 440px);
    }
    .ttt-panel {
      width: min(92vw, 440px);
    }

    /* Landscape mobile: linha lado a lado */
    @media (orientation: landscape) and (max-height: 540px) {
      .ttt-layout {
        flex-direction: row;
        align-items: stretch;
        justify-content: center;
        height: 100%;
        gap: 10px;
      }
      .ttt-board {
        flex: 0 0 auto;
        width: auto;
        height: 100%;
        aspect-ratio: 1 / 1;
      }
      .ttt-panel {
        flex: 1 1 0;
        width: auto;
        min-width: 180px;
        max-width: 280px;
        height: 100%;
      }
    }

    @keyframes scaleUp {
      from { opacity: 0; transform: scale(0.6) rotate(-8deg); }
      60%  { transform: scale(1.08) rotate(2deg); }
      to   { opacity: 1; transform: scale(1) rotate(0deg); }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.97); }
      to   { opacity: 1; transform: scale(1); }
    }
  `);

  return React.createElement('div', {
    className: 'min-h-[100dvh] bg-[#0a0a0c] text-[#ededed] select-none font-sans antialiased flex flex-col relative overflow-hidden'
  }, [ambientBg, topBar, mainContent, styles]);
}
