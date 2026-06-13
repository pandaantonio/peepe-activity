import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function TicTacToe() {
  const router = useRouter();
  const [board, setBoard] = useState([
    ['', '', ''],
    ['', '', ''],
    ['', '', '']
  ]);
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const [winner, setWinner] = useState(null);
  const [isDraw, setIsDraw] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [scores, setScores] = useState({ player: 0, ai: 0, draws: 0 });
  const [winningLine, setWinningLine] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);
  const scoreLockRef = React.useRef(false);

  const handleExit = () => {
    router.push('/');
  };

  const checkVictory = useCallback((player, currentBoard) => {
    const lines = [
      // Linhas
      [[0,0],[0,1],[0,2]], [[1,0],[1,1],[1,2]], [[2,0],[2,1],[2,2]],
      // Colunas
      [[0,0],[1,0],[2,0]], [[0,1],[1,1],[2,1]], [[0,2],[1,2],[2,2]],
      // Diagonais
      [[0,0],[1,1],[2,2]], [[0,2],[1,1],[2,0]]
    ];

    for (const line of lines) {
      if (line.every(([r, c]) => currentBoard[r][c] === player)) {
        return line;
      }
    }
    return null;
  }, []);

  const getEmptyCells = useCallback((currentBoard) => {
    const empty = [];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (currentBoard[i][j] === '') {
          empty.push({ row: i, col: j });
        }
      }
    }
    return empty;
  }, []);

  const minimax = useCallback((currentBoard, isMaximizing, depth) => {
    const winLine = checkVictory('O', currentBoard);
    if (winLine) return 10 - depth;
    if (checkVictory('X', currentBoard)) return depth - 10;
    if (getEmptyCells(currentBoard).length === 0) return 0;

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          if (currentBoard[i][j] === '') {
            currentBoard[i][j] = 'O';
            let score = minimax(currentBoard, false, depth + 1);
            currentBoard[i][j] = '';
            bestScore = Math.max(score, bestScore);
          }
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          if (currentBoard[i][j] === '') {
            currentBoard[i][j] = 'X';
            let score = minimax(currentBoard, true, depth + 1);
            currentBoard[i][j] = '';
            bestScore = Math.min(score, bestScore);
          }
        }
      }
      return bestScore;
    }
  }, [checkVictory, getEmptyCells]);

  const findBestMove = useCallback((currentBoard) => {
    let bestScore = -Infinity;
    let bestMove = null;

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (currentBoard[i][j] === '') {
          currentBoard[i][j] = 'O';
          let score = minimax(currentBoard, false, 0);
          currentBoard[i][j] = '';

          if (score > bestScore) {
            bestScore = score;
            bestMove = { row: i, col: j };
          }
        }
      }
    }
    return bestMove;
  }, [minimax]);

  const playMove = useCallback((row, col, player) => {
    setBoard(prevBoard => {
      const newBoard = prevBoard.map(r => [...r]);
      newBoard[row][col] = player;

      const winLine = checkVictory(player, newBoard);
      if (winLine) {
        setWinner(player);
        setWinningLine(winLine);
        setGameOver(true);
        if (!scoreLockRef.current) {
          scoreLockRef.current = true;
          setScores(prev => ({
            ...prev,
            player: player === 'X' ? prev.player + 1 : prev.player,
            ai: player === 'O' ? prev.ai + 1 : prev.ai
          }));
        }
        return newBoard;
      }

      const emptyCells = getEmptyCells(newBoard);
      if (emptyCells.length === 0) {
        setIsDraw(true);
        setGameOver(true);
        if (!scoreLockRef.current) {
          scoreLockRef.current = true;
          setScores(prev => ({ ...prev, draws: prev.draws + 1 }));
        }
        return newBoard;
      }

      return newBoard;
    });

    setMoveHistory(prev => [...prev, { player, row, col }]);
  }, [checkVictory, getEmptyCells]);

  const handleCellClick = useCallback((row, col) => {
    if (gameOver) return;
    if (currentPlayer !== 'X') return;
    if (board[row][col] !== '') return;

    playMove(row, col, 'X');
    setCurrentPlayer('O');
  }, [gameOver, currentPlayer, board, playMove]);

  useEffect(() => {
    if (gameOver) return;
    if (currentPlayer !== 'O') return;

    const timer = setTimeout(() => {
      const emptyCells = getEmptyCells(board);
      if (emptyCells.length === 0) return;

      let move;
      if (Math.random() < 0.25) {
        const randomIndex = Math.floor(Math.random() * emptyCells.length);
        move = emptyCells[randomIndex];
      } else {
        move = findBestMove(board);
      }

      if (move) {
        playMove(move.row, move.col, 'O');
        setCurrentPlayer('X');
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [currentPlayer, gameOver, board, getEmptyCells, findBestMove, playMove]);

  const resetGame = () => {
    setBoard([
      ['', '', ''],
      ['', '', ''],
      ['', '', '']
    ]);
    setCurrentPlayer('X');
    setWinner(null);
    setIsDraw(false);
    setGameOver(false);
    setWinningLine(null);
    setMoveHistory([]);
    scoreLockRef.current = false;
  };

  const resetScores = () => {
    setScores({ player: 0, ai: 0, draws: 0 });
  };

  const getStatusText = () => {
    if (winner === 'X') return "Você venceu";
    if (winner === 'O') return "IA venceu";
    if (isDraw) return "Empate";
    if (currentPlayer === 'X') return "Sua vez";
    return "IA pensando...";
  };

  const getStatusColor = () => {
    if (winner === 'X') return 'text-emerald-400';
    if (winner === 'O') return 'text-red-400';
    if (isDraw) return 'text-amber-400';
    if (currentPlayer === 'X') return 'text-white/70';
    return 'text-white/40';
  };

  const isWinningCell = (row, col) => {
    if (!winningLine) return false;
    return winningLine.some(([r, c]) => r === row && c === col);
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0c] flex flex-col items-center justify-center z-50 overflow-hidden">
      {/* Background ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] bg-purple-500/[0.03] rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/3 w-[300px] h-[300px] bg-emerald-500/[0.03] rounded-full blur-[80px]" />
      </div>

      {/* Back button */}
      <button
        onClick={handleExit}
        className="fixed top-6 left-6 z-50 glass-btn px-5 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white/90 transition-all active:scale-95 flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Voltar
      </button>

      <div className="relative w-full max-w-[420px] px-5">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-pill mb-4">
            <div className={`w-1.5 h-1.5 rounded-full ${currentPlayer === 'X' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400 animate-pulse'}`} />
            <span className="text-[10px] text-gray-500 uppercase tracking-[0.15em] font-medium">vs IA</span>
          </div>

          <h1 className="text-3xl font-semibold text-white/90 tracking-tight mb-2">
            Jogo da Velha
          </h1>
          <p className={`text-sm font-medium transition-colors duration-300 ${getStatusColor()}`}>
            {getStatusText()}
          </p>
        </div>

        {/* Scoreboard */}
        <div className="glass-card rounded-2xl p-4 mb-5">
          <div className="flex items-center justify-between">
            {/* Player score */}
            <div className="flex flex-col items-center gap-1 flex-1">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <span className="text-lg font-bold text-emerald-400">X</span>
              </div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Você</span>
              <span className="text-2xl font-semibold text-white/90">{scores.player}</span>
            </div>

            {/* Draws */}
            <div className="flex flex-col items-center gap-1 px-4">
              <span className="text-[10px] text-gray-600 uppercase tracking-wider">Empates</span>
              <span className="text-xl font-semibold text-amber-400/80">{scores.draws}</span>
            </div>

            {/* AI score */}
            <div className="flex flex-col items-center gap-1 flex-1">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <span className="text-lg font-bold text-red-400">O</span>
              </div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">IA</span>
              <span className="text-2xl font-semibold text-white/90">{scores.ai}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 flex h-1 rounded-full overflow-hidden bg-white/5">
            <div 
              className="bg-emerald-500/60 transition-all duration-500"
              style={{ width: `${scores.player + scores.ai + scores.draws > 0 ? (scores.player / (scores.player + scores.ai + scores.draws)) * 100 : 50}%` }}
            />
            <div 
              className="bg-red-500/60 transition-all duration-500"
              style={{ width: `${scores.player + scores.ai + scores.draws > 0 ? (scores.ai / (scores.player + scores.ai + scores.draws)) * 100 : 50}%` }}
            />
          </div>
        </div>

        {/* Game Board */}
        <div className="relative">
          <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl glass-card">
            {board.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const isWinning = isWinningCell(rowIndex, colIndex);
                const isLastMove = moveHistory.length > 0 && 
                  moveHistory[moveHistory.length - 1].row === rowIndex && 
                  moveHistory[moveHistory.length - 1].col === colIndex;

                return (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    disabled={gameOver || currentPlayer !== 'X' || cell !== ''}
                    className={`
                      aspect-square rounded-xl flex items-center justify-center text-4xl font-bold
                      transition-all duration-300
                      ${cell === '' 
                        ? 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1] hover:scale-[1.02] active:scale-95' 
                        : 'bg-white/[0.05] border border-white/[0.08]'
                      }
                      ${isWinning ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_20px_rgba(52,211,153,0.15)] animate-pulse' : ''}
                      ${isLastMove && !isWinning ? 'ring-1 ring-white/10' : ''}
                      disabled:cursor-not-allowed
                    `}
                  >
                    {cell === 'X' && (
                      <span className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">
                        X
                      </span>
                    )}
                    {cell === 'O' && (
                      <span className="text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.3)]">
                        O
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Game Over Overlay */}
          {(winner || isDraw) && (
            <div className="absolute inset-0 bg-[#0a0a0c]/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-5 animate-fade-in">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                winner === 'X' ? 'bg-emerald-500/10 border border-emerald-500/20' :
                winner === 'O' ? 'bg-red-500/10 border border-red-500/20' :
                'bg-amber-500/10 border border-amber-500/20'
              }`}>
                <span className={`text-3xl font-bold ${
                  winner === 'X' ? 'text-emerald-400' :
                  winner === 'O' ? 'text-red-400' :
                  'text-amber-400'
                }`}>
                  {winner === 'X' ? 'X' : winner === 'O' ? 'O' : '='}
                </span>
              </div>

              <div className="text-center">
                <h2 className={`text-2xl font-semibold mb-1 ${
                  winner === 'X' ? 'text-emerald-400' :
                  winner === 'O' ? 'text-red-400' :
                  'text-amber-400'
                }`}>
                  {winner === 'X' && 'Vitória!'}
                  {winner === 'O' && 'Derrota'}
                  {isDraw && 'Empate'}
                </h2>
                <p className="text-gray-500 text-sm">
                  {winner === 'X' && 'Você derrotou a IA'}
                  {winner === 'O' && 'A IA foi mais rápida'}
                  {isDraw && 'Ninguém venceu dessa vez'}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={resetGame}
                  className="px-6 py-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl font-medium text-sm text-white/90 transition-all active:scale-95 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Jogar Novamente
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            onClick={resetGame}
            className="glass-btn px-4 py-2 rounded-lg text-xs text-gray-500 hover:text-gray-300 transition-all active:scale-95 flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reiniciar
          </button>
          <button
            onClick={resetScores}
            className="glass-btn px-4 py-2 rounded-lg text-xs text-gray-500 hover:text-gray-300 transition-all active:scale-95 flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Zerar Placar
          </button>
        </div>
      </div>

      <style jsx>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          box-shadow: 
            0 1px 2px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.04);
        }

        .glass-btn {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
        }

        .glass-btn:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .glass-pill {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
