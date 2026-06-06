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

  const handleExit = () => {
    router.push('/');
  };

  const checkVictory = useCallback((player, currentBoard) => {
    // Linhas
    for (let i = 0; i < 3; i++) {
      if (currentBoard[i][0] === player && currentBoard[i][1] === player && currentBoard[i][2] === player) {
        return true;
      }
    }
    // Colunas
    for (let i = 0; i < 3; i++) {
      if (currentBoard[0][i] === player && currentBoard[1][i] === player && currentBoard[2][i] === player) {
        return true;
      }
    }
    // Diagonais
    if (currentBoard[0][0] === player && currentBoard[1][1] === player && currentBoard[2][2] === player) {
      return true;
    }
    if (currentBoard[0][2] === player && currentBoard[1][1] === player && currentBoard[2][0] === player) {
      return true;
    }
    return false;
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
    if (checkVictory('O', currentBoard)) return 10 - depth;
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
      
      if (checkVictory(player, newBoard)) {
        setWinner(player);
        setGameOver(true);
        return newBoard;
      }
      
      const emptyCells = getEmptyCells(newBoard);
      if (emptyCells.length === 0) {
        setIsDraw(true);
        setGameOver(true);
        return newBoard;
      }
      
      return newBoard;
    });
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
    }, 300);
    
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
  };

  const getStatusText = () => {
    if (winner === 'X') return "🎉 Você venceu! 🎉";
    if (winner === 'O') return "🤖 IA venceu! 🤖";
    if (isDraw) return "📊 Empate! 📊";
    if (currentPlayer === 'X') return "Sua vez (X)";
    return "IA pensando... (O)";
  };

  return (
    <div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center z-50">
      <button
        onClick={handleExit}
        className="fixed top-6 left-6 z-50 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 px-6 py-3 rounded-2xl font-medium active:scale-95 transition-all"
      >
        ← Voltar ao Hub
      </button>

      <div className="w-full max-w-[400px] p-4">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
            JOGO DA VELHA
          </h1>
          <p className={`text-lg mt-3 font-semibold ${
            winner === 'X' ? 'text-emerald-400' : 
            winner === 'O' ? 'text-red-400' : 
            isDraw ? 'text-yellow-400' : 'text-zinc-400'
          }`}>
            {getStatusText()}
          </p>
        </div>

        <div className="relative">
          <div className="grid grid-cols-3 gap-3 bg-zinc-900/50 p-4 rounded-2xl">
            {board.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                  disabled={gameOver || currentPlayer !== 'X' || cell !== ''}
                  className={`
                    aspect-square bg-zinc-900 border border-zinc-700 rounded-xl
                    flex items-center justify-center text-5xl font-bold
                    transition-all duration-200
                    hover:bg-zinc-800 hover:scale-105 active:scale-95
                    disabled:opacity-80 disabled:cursor-not-allowed disabled:hover:scale-100
                    ${cell === 'X' ? 'text-emerald-400' : ''}
                    ${cell === 'O' ? 'text-red-400' : ''}
                  `}
                >
                  {cell}
                </button>
              ))
            )}
          </div>

          {(winner || isDraw) && (
            <div className="absolute inset-0 bg-black/95 rounded-2xl flex flex-col items-center justify-center gap-6">
              <h2 className={`text-4xl font-black ${
                winner === 'X' ? 'text-emerald-400' : 
                winner === 'O' ? 'text-red-400' : 
                'text-yellow-400'
              }`}>
                {winner === 'X' && '🎉 VITÓRIA! 🎉'}
                {winner === 'O' && '🤖 DERROTA! 🤖'}
                {isDraw && '📊 EMPATE! 📊'}
              </h2>
              <p className="text-zinc-300 text-center px-4">
                {winner === 'X' && 'Parabéns! Você derrotou a IA!'}
                {winner === 'O' && 'A IA venceu dessa vez. Tente novamente!'}
                {isDraw && 'Foi por pouco! Quase conseguiu!'}
              </p>
              <button
                onClick={resetGame}
                className="px-8 py-4 bg-purple-600 hover:bg-purple-700 rounded-xl font-bold text-lg transition-all active:scale-95"
              >
                🔄 Jogar Novamente
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 text-center text-sm text-zinc-500">
          <p>Você é <span className="text-emerald-400 font-bold">X</span> | IA é <span className="text-red-400 font-bold">O</span></p>
          <p className="text-xs mt-1">Clique em qualquer célula para começar</p>
        </div>
      </div>
    </div>
  );
}