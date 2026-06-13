import React, { useState, useCallback, useEffect, memo, useMemo } from 'react';
import { useRouter } from 'next/router';
import { FaArrowLeft, FaRedo, FaTrophy, FaRobot, FaUser, FaTrashAlt } from 'react-icons/fa';

// Sub-componente otimizado para as células do tabuleiro
const GridCell = memo(({ cell, rowIndex, colIndex, isWinning, isLastMove, gameOver, currentPlayer, onClick }) => {
  return (
    <button
      onClick={() => onClick(rowIndex, colIndex)}
      disabled={gameOver || currentPlayer !== 'X' || cell !== ''}
      className={`
        aspect-square rounded-2xl flex items-center justify-center text-5xl md:text-6xl font-black
        transition-all duration-300 select-none touch-manipulation cursor-pointer
        ${cell === '' 
          ? 'bg-white/[0.02] border border-white/5 hover:bg-white/[0.07] hover:border-white/10 hover:scale-[1.02] active:scale-95 shadow-inner' 
          : 'bg-white/[0.04] border border-white/10 shadow-md'
        }
        ${isWinning ? '!bg-emerald-500/10 !border-emerald-500/40 shadow-[0_0_25px_rgba(52,211,153,0.25)] animate-pulse' : ''}
        ${isLastMove && !isWinning ? 'ring-2 ring-white/10' : ''}
        disabled:cursor-not-allowed
      `}
    >
      {cell === 'X' && (
        <span className="text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.4)] animate-[scaleUp_0.18s_ease-out]">
          X
        </span>
      )}
      {cell === 'O' && (
        <span className="text-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.4)] animate-[scaleUp_0.18s_ease-out]">
          O
        </span>
      )}
    </button>
  );
});

GridCell.displayName = 'GridCell';

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
      [[0,0],[0,1],[0,2]], [[1,0],[1,1],[1,2]], [[2,0],[2,1],[2,2]], 
      [[0,0],[1,0],[2,0]], [[0,1],[1,1],[2,1]], [[0,2],[1,2],[2,2]], 
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
    const boardClone = currentBoard.map(row => [...row]);

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (boardClone[i][j] === '') {
          boardClone[i][j] = 'O';
          let score = minimax(boardClone, false, 0);
          boardClone[i][j] = '';

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
    if (gameOver || currentPlayer !== 'X' || board[row][col] !== '') return;

    playMove(row, col, 'X');
    setCurrentPlayer('O');
  }, [gameOver, currentPlayer, board, playMove]);

  useEffect(() => {
    if (gameOver || currentPlayer !== 'O') return;

    const timer = setTimeout(() => {
      if (gameOver || currentPlayer !== 'O') return;

      const emptyCells = getEmptyCells(board);
      if (emptyCells.length === 0) return;

      let move;
      if (Math.random() < 0.15) { // 15% de chance de erro tático da IA para manter divertido
        const randomIndex = Math.floor(Math.random() * emptyCells.length);
        move = emptyCells[randomIndex];
      } else {
        move = findBestMove(board);
      }

      if (move) {
        playMove(move.row, move.col, 'O');
        setCurrentPlayer('X');
      }
    }, 500);

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
    if (winner === 'X') return "SISTEMA DESCRIPTOGRAFADO";
    if (winner === 'O') return "PERDA DE CONTROLO INTEGRAL";
    if (isDraw) return "REDE EM EQUILÍBRIO";
    if (currentPlayer === 'X') return "A SUA VEZ DE AGIR";
    return "IA CALCULANDO VETORES...";
  };

  const getStatusColor = () => {
    if (winner === 'X') return 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]';
    if (winner === 'O') return 'text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]';
    if (isDraw) return 'text-amber-400';
    if (currentPlayer === 'X') return 'text-white/80';
    return 'text-white/30 animate-pulse';
  };

  const isWinningCell = (row, col) => {
    if (!winningLine) return false;
    return winningLine.some(([r, c]) => r === row && c === col);
  };

  const totalGames = useMemo(() => {
    return scores.player + scores.ai + scores.draws;
  }, [scores]);

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-[#ededed] select-none font-sans antialiased flex flex-col relative overflow-hidden">
      
      {/* Background ambient luminoso idêntico ao Hub */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/[0.02] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/[0.02] rounded-full blur-[100px]" />
      </div>

      {/* Topbar Glassmorphism */}
      <div className="bg-white/[0.02] backdrop-blur-xl border-b border-white/5 shrink-0 z-10 relative">
        <div className="w-full max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button 
              onClick={handleExit} 
              className="p-3 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all active:scale-95 cursor-pointer border border-white/5"
            >
              <FaArrowLeft size={18} />
            </button>
            <button 
              onClick={resetGame} 
              className="p-3 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all active:scale-95 cursor-pointer border border-white/5"
            >
              <FaRedo size={16} />
            </button>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.02] border border-white/10 text-xs font-bold uppercase tracking-wider">
            <div className={`w-2 h-2 rounded-full ${currentPlayer === 'X' && !gameOver ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
            <span className={getStatusColor()}>{getStatusText()}</span>
          </div>

          <button 
            onClick={resetScores}
            className="p-3 text-gray-500 hover:text-rose-400 bg-white/[0.01] hover:bg-rose-500/5 rounded-xl transition-all active:scale-95 cursor-pointer border border-white/5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
            title="Zerar Placar"
          >
            <FaTrashAlt size={14} />
            <span className="hidden sm:inline">Limpar</span>
          </button>
        </div>
      </div>

      {/* Main Content Area - Grelha Unificada Panorâmica */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-6 flex items-center justify-center z-10 relative">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* COLUNA ESQUERDA: Placar de Desempenho e Estatísticas */}
          <div className="lg:col-span-5 flex flex-col justify-between glass-card rounded-2xl p-6 shadow-2xl gap-6">
            
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">Módulo do Placar</span>
              <h2 className="text-xl font-black text-white">Consola de Desempenho</h2>
            </div>

            {/* Placar Principal Premium */}
            <div className="bg-[#050507]/50 rounded-2xl p-6 border border-white/5 shadow-inner backdrop-blur-md">
              <div className="grid grid-cols-3 gap-2 items-center text-center">
                
                {/* Score Jogador */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-md">
                    <FaUser className="text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.3)]" size={18} />
                  </div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Você (X)</span>
                  <span className="text-3xl font-black text-white">{scores.player}</span>
                </div>

                {/* Empates */}
                <div className="flex flex-col items-center gap-1 border-x border-white/5 px-2">
                  <span className="text-[10px] text-gray-600 font-bold uppercase tracking-wider">Empates</span>
                  <span className="text-2xl font-black text-amber-400/90">{scores.draws}</span>
                  <span className="text-[10px] text-gray-600 font-medium">Partidas: {totalGames}</span>
                </div>

                {/* Score IA */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shadow-md">
                    <FaRobot className="text-rose-400 drop-shadow-[0_0_6px_rgba(244,63,94,0.3)]" size={18} />
                  </div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">IA (O)</span>
                  <span className="text-3xl font-black text-white">{scores.ai}</span>
                </div>

              </div>

              {/* Barra de Distribuição Fluida */}
              <div className="mt-6 flex h-1.5 rounded-full overflow-hidden bg-white/5 shadow-inner">
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

            {/* Módulo de Histórico Recente / Dica Visual */}
            <div className="p-4 bg-purple-500/[0.02] border-l-4 border-purple-500/40 rounded-r-xl flex items-start gap-3 border border-white/5">
              <FaTrophy size={16} className="text-purple-400 mt-0.5 flex-shrink-0 drop-shadow-[0_0_6px_rgba(192,132,252,0.4)]" />
              <div className="text-left">
                <span className="text-[10px] font-bold text-purple-400/80 uppercase tracking-wider">Algoritmo de Análise</span>
                <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
                  A inteligência artificial opera através de previsões em árvore com base no método Minimax. Bloqueie as linhas adjacentes imediatamente.
                </p>
              </div>
            </div>

          </div>

          {/* COLUNA DIREITA: Tabuleiro de Alta Escala (Grid de Jogo) */}
          <div className="lg:col-span-7 flex flex-col justify-center glass-card rounded-2xl p-6 md:p-8 shadow-2xl relative">
            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-[#050507]/50 border border-white/5 shadow-inner max-w-[550px] w-full mx-auto backdrop-blur-md">
              {board.map((row, rowIndex) =>
                row.map((cell, colIndex) => {
                  const isWinning = isWinningCell(rowIndex, colIndex);
                  const isLastMove = moveHistory.length > 0 && 
                    moveHistory[moveHistory.length - 1].row === rowIndex && 
                    moveHistory[moveHistory.length - 1].col === colIndex;

                  return (
                    <GridCell
                      key={`${rowIndex}-${colIndex}`}
                      cell={cell}
                      rowIndex={rowIndex}
                      colIndex={colIndex}
                      isWinning={isWinning}
                      isLastMove={isLastMove}
                      gameOver={gameOver}
                      currentPlayer={currentPlayer}
                      onClick={handleCellClick}
                    />
                  );
                })
              )}
            </div>

            {/* Overlay Modular Acoplado de Fim de Jogo */}
            {(winner || isDraw) && (
              <div className="absolute inset-0 bg-[#0a0a0c]/90 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center gap-5 p-6 z-20 animate-[fadeIn_0.25s_ease-out] border border-white/10 mx-px my-px">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
                  winner === 'X' ? 'bg-emerald-500/10 border border-emerald-500/30' :
                  winner === 'O' ? 'bg-rose-500/10 border border-rose-500/30' :
                  'bg-amber-500/10 border border-amber-500/30'
                }`}>
                  <span className={`text-3xl font-black ${
                    winner === 'X' ? 'text-emerald-400' :
                    winner === 'O' ? 'text-rose-400' :
                    'text-amber-400'
                  }`}>
                    {winner === 'X' ? 'X' : winner === 'O' ? 'O' : '='}
                  </span>
                </div>

                <div className="text-center">
                  <h2 className={`text-2xl font-black mb-1 tracking-wide ${
                    winner === 'X' ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]' :
                    winner === 'O' ? 'text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]' :
                    'text-amber-400'
                  }`}>
                    {winner === 'X' && 'CONEXÃO BEM-SUCEDIDA'}
                    {winner === 'O' && 'ALVO BLOQUEADO'}
                    {isDraw && 'EMPATE DETETADO'}
                  </h2>
                  <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">
                    {winner === 'X' && 'Conseguiu ultrapassar as barreiras lógicas do adversário.'}
                    {winner === 'O' && 'O algoritmo da IA previu as suas jogadas finais.'}
                    {isDraw && 'Nenhum dos sistemas conseguiu obter vantagem espacial.'}
                  </p>
                </div>

                <button
                  onClick={resetGame}
                  className="px-8 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-bold text-sm rounded-xl transition-all shadow-xl cursor-pointer active:scale-95 flex items-center gap-2"
                >
                  Reiniciar Vetores
                </button>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Estilos CSS Embutidos para manter a coerência visual */}
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
        
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.7); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}