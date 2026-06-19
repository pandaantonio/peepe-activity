// pages/index.js
import { useState, useEffect, useCallback } from 'react';

const ROWS = 5;
const COLS = 5;
const MINES = 5;

function createBoard() {
  const board = Array(ROWS).fill(null).map(() =>
    Array(COLS).fill(null).map(() => ({
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      neighborMines: 0,
    }))
  );

  // Place mines
  let minesPlaced = 0;
  while (minesPlaced < MINES) {
    const row = Math.floor(Math.random() * ROWS);
    const col = Math.floor(Math.random() * COLS);
    if (!board[row][col].isMine) {
      board[row][col].isMine = true;
      minesPlaced++;
    }
  }

  // Calculate neighbor mines
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!board[r][c].isMine) {
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc].isMine) {
              count++;
            }
          }
        }
        board[r][c].neighborMines = count;
      }
    }
  }

  return board;
}

function revealCell(board, row, col) {
  const newBoard = board.map(r => r.map(c => ({ ...c })));
  const queue = [[row, col]];
  const visited = new Set([`${row},${col}`]);

  while (queue.length > 0) {
    const [r, c] = queue.shift();
    const cell = newBoard[r][c];
    
    if (cell.isFlagged || cell.isRevealed) continue;
    
    cell.isRevealed = true;

    if (cell.neighborMines === 0 && !cell.isMine) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          const key = `${nr},${nc}`;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !visited.has(key)) {
            visited.add(key);
            queue.push([nr, nc]);
          }
        }
      }
    }
  }

  return newBoard;
}

function checkWin(board) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = board[r][c];
      if (!cell.isMine && !cell.isRevealed) return false;
    }
  }
  return true;
}

export default function Mines() {
  const [board, setBoard] = useState(() => createBoard());
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [flagCount, setFlagCount] = useState(0);
  const [firstClick, setFirstClick] = useState(true);

  useEffect(() => {
    let interval;
    if (isRunning && !gameOver) {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, gameOver]);

  const handleCellClick = useCallback((row, col) => {
    if (gameOver || won) return;
    
    const cell = board[row][col];
    if (cell.isRevealed || cell.isFlagged) return;

    if (firstClick) {
      setIsRunning(true);
      setFirstClick(false);
    }

    if (cell.isMine) {
      // Reveal all mines
      const newBoard = board.map(r => r.map(c => ({ ...c, isRevealed: c.isMine ? true : c.isRevealed })));
      setBoard(newBoard);
      setGameOver(true);
      setIsRunning(false);
      return;
    }

    const newBoard = revealCell(board, row, col);
    setBoard(newBoard);

    if (checkWin(newBoard)) {
      setWon(true);
      setIsRunning(false);
    }
  }, [board, gameOver, won, firstClick]);

  const handleRightClick = useCallback((e, row, col) => {
    e.preventDefault();
    if (gameOver || won) return;
    
    const cell = board[row][col];
    if (cell.isRevealed) return;

    const newBoard = board.map(r => r.map(c => ({ ...c })));
    newBoard[row][col].isFlagged = !newBoard[row][col].isFlagged;
    setBoard(newBoard);
    setFlagCount(prev => newBoard[row][col].isFlagged ? prev + 1 : prev - 1);
  }, [board, gameOver, won]);

  const resetGame = () => {
    setBoard(createBoard());
    setGameOver(false);
    setWon(false);
    setTimer(0);
    setIsRunning(false);
    setFlagCount(0);
    setFirstClick(true);
  };

  const getCellContent = (cell) => {
    if (cell.isFlagged) return '🚩';
    if (!cell.isRevealed) return '';
    if (cell.isMine) return '💣';
    if (cell.neighborMines === 0) return '';
    return cell.neighborMines;
  };

  const getCellColor = (cell) => {
    if (!cell.isRevealed) return 'bg-slate-600 hover:bg-slate-500';
    if (cell.isMine) return 'bg-red-500';
    return 'bg-slate-300';
  };

  const getNumberColor = (num) => {
    const colors = {
      1: 'text-blue-600',
      2: 'text-green-600',
      3: 'text-red-600',
      4: 'text-purple-600',
      5: 'text-yellow-600',
    };
    return colors[num] || 'text-slate-800';
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-md w-full">
        <h1 className="text-3xl font-bold text-white text-center mb-6">💣 Mines</h1>
        
        <div className="flex justify-between items-center mb-4 bg-slate-700 rounded-lg p-3">
          <div className="flex items-center gap-2 text-white">
            <span className="text-xl">🚩</span>
            <span className="font-mono text-lg">{MINES - flagCount}</span>
          </div>
          
          <button
            onClick={resetGame}
            className="text-3xl hover:scale-110 transition-transform cursor-pointer"
          >
            {gameOver ? '😵' : won ? '😎' : '🙂'}
          </button>
          
          <div className="flex items-center gap-2 text-white">
            <span className="text-xl">⏱️</span>
            <span className="font-mono text-lg">{timer}</span>
          </div>
        </div>

        {(gameOver || won) && (
          <div className={`text-center mb-4 p-3 rounded-lg font-bold ${
            won ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}>
            {won ? '🎉 Você venceu!' : '💥 Game Over!'}
          </div>
        )}

        <div 
          className="grid gap-1 mx-auto"
          style={{ 
            gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
            maxWidth: '350px'
          }}
        >
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <button
                key={`${rowIndex}-${colIndex}`}
                onClick={() => handleCellClick(rowIndex, colIndex)}
                onContextMenu={(e) => handleRightClick(e, rowIndex, colIndex)}
                className={`
                  aspect-square flex items-center justify-center text-lg font-bold rounded
                  transition-all duration-100 cursor-pointer select-none
                  ${getCellColor(cell)}
                  ${cell.isRevealed && !cell.isMine ? getNumberColor(cell.neighborMines) : 'text-white'}
                  ${!cell.isRevealed ? 'shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),0_2px_4px_rgba(0,0,0,0.3)] active:shadow-inner active:translate-y-0.5' : ''}
                `}
                disabled={gameOver || won}
              >
                {getCellContent(cell)}
              </button>
            ))
          )}
        </div>

        <div className="mt-6 text-slate-400 text-sm text-center space-y-1">
          <p>🖱️ Clique esquerdo para revelar</p>
          <p>🖱️ Clique direito para marcar bandeira</p>
        </div>
      </div>
    </div>
  );
}