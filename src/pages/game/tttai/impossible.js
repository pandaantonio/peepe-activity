import React, { useState, useCallback, useEffect, memo, useMemo } from 'react';
import { useRouter } from 'next/router';
import { FaArrowLeft, FaRedo, FaTrophy, FaRobot, FaUser, FaTrashAlt } from 'react-icons/fa';
import styles from '@/styles/TicTacToe.module.css';

// Sub-componente otimizado para as células do tabuleiro
const GridCell = memo(({ cell, rowIndex, colIndex, isWinning, isLastMove, gameOver, currentPlayer, onClick }) => {
  return (
    <button
      onClick={() => onClick(rowIndex, colIndex)}
      disabled={gameOver || currentPlayer !== 'X' || cell !== ''}
      className={`
        ${styles.gridCell}
        ${cell === '' ? styles.gridCellEmpty : styles.gridCellFilled}
        ${isWinning ? styles.gridCellWinning : ''}
        ${isLastMove && !isWinning ? styles.gridCellLastMove : ''}
        ${(gameOver || currentPlayer !== 'X' || cell !== '') ? styles.gridCellDisabled : ''}
      `}
    >
      {cell === 'X' && (
        <span className={`${styles.cellX} ${styles.animateScaleUp}`}>
          X
        </span>
      )}
      {cell === 'O' && (
        <span className={`${styles.cellO} ${styles.animateScaleUp}`}>
          O
        </span>
      )}
    </button>
  );
});

GridCell.displayName = 'GridCell';

export default function TicTacToeImpossible() {
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

  // Retorna para a tela de seleção de dificuldades
  const handleExit = () => {
    router.push('/game/tttai');
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

  // LÓGICA DO MODO IMPOSSÍVEL: Minimax puro sem qualquer aleatoriedade externa
  useEffect(() => {
    if (gameOver || currentPlayer !== 'O') return;

    const timer = setTimeout(() => {
      if (gameOver || currentPlayer !== 'O') return;

      const emptyCells = getEmptyCells(board);
      if (emptyCells.length === 0) return;

      // Executa estritamente a jogada perfeita calculada
      const move = findBestMove(board);

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
    scoreLockRef.current = false;
  };

  const getStatusText = () => {
    if (winner === 'X') return "SISTEMA DESCRIPTOGRAFADO";
    if (winner === 'O') return "PERDA DE CONTROLO INTEGRAL";
    if (isDraw) return "REDE EM EQUILÍBRIO";
    if (currentPlayer === 'X') return "A SUA VEZ DE AGIR";
    return "IA CALCULANDO TODOS OS VETORES INVARIANTES...";
  };

  const getStatusColorClass = () => {
    if (winner === 'X') return styles.statusTextWinX;
    if (winner === 'O') return styles.statusTextWinO;
    if (isDraw) return styles.statusTextDraw;
    if (currentPlayer === 'X') return styles.statusTextTurn;
    return styles.statusTextAITurn;
  };

  const isWinningCell = (row, col) => {
    if (!winningLine) return false;
    return winningLine.some(([r, c]) => r === row && c === col);
  };

  const totalGames = useMemo(() => {
    return scores.player + scores.ai + scores.draws;
  }, [scores]);

  return (
    <div className={styles.container}>
      <div className={styles.bgGradient}>
        <div className={styles.bgBlur1} />
        <div className={styles.bgBlur2} />
      </div>

      <div className={styles.topbar}>
        <div className={styles.topbarContent}>
          <div className={styles.buttonGroup}>
            <button onClick={handleExit} className={styles.iconButton} title="Voltar ao Menu">
              <FaArrowLeft size={18} />
            </button>
            <button onClick={resetGame} className={styles.iconButton} title="Reiniciar Partida">
              <FaRedo size={16} />
            </button>
          </div>

          <div className={styles.statusContainer}>
            <div className={styles.statusBox}>
              <div className={`${styles.statusDot} ${currentPlayer === 'X' && !gameOver ? styles.statusDotActive : styles.statusDotInactive}`} />
              <span className={`${styles.statusText} ${getStatusColorClass()}`}>{getStatusText()}</span>
            </div>
          </div>

          <button onClick={resetScores} className={styles.resetButton} title="Zerar Placar">
            <FaTrashAlt size={14} />
            <span>Limpar</span>
          </button>
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.gameLayout}>
          
          {/* COLUNA ESQUERDA: Placar */}
          <div className={`${styles.scoreCard} ${styles.glassCard}`}>
            <div className={styles.scoreHeader}>
              <span className={styles.scoreLabel}>MODO IMPOSSÍVEL ATIVO</span>
              <h2 className={styles.scoreTitle}>Consola de Desempenho</h2>
            </div>

            <div className={styles.scorePanel}>
              <div className={styles.scoreGrid}>
                <div className={styles.scoreItem}>
                  <div className={`${styles.scoreIcon} ${styles.scoreIconPlayer}`}>
                    <FaUser size={16} />
                  </div>
                  <span className={styles.scoreLabelText}>Você (X)</span>
                  <span className={styles.scoreValue}>{scores.player}</span>
                </div>

                <div className={styles.drawItem}>
                  <span className={styles.scoreLabelText}>Empates</span>
                  <span className={styles.drawValue}>{scores.draws}</span>
                  <span className={styles.drawTotal}>Partidas: {totalGames}</span>
                </div>

                <div className={styles.scoreItem}>
                  <div className={`${styles.scoreIcon} ${styles.scoreIconAI}`} style={{ background: 'rgba(248, 113, 113, 0.2)', color: '#f87171' }}>
                    <FaRobot size={16} />
                  </div>
                  <span className={styles.scoreLabelText}>IA Perfeita (O)</span>
                  <span className={styles.scoreValue}>{scores.ai}</span>
                </div>
              </div>

              <div className={styles.progressBar}>
                <div className={styles.progressPlayer} style={{ width: `${totalGames > 0 ? (scores.player / totalGames) * 100 : 33.3}%` }} />
                <div className={styles.progressDraw} style={{ width: `${totalGames > 0 ? (scores.draws / totalGames) * 100 : 33.4}%` }} />
                <div className={styles.progressAI} style={{ width: `${totalGames > 0 ? (scores.ai / totalGames) * 100 : 33.3}%`, backgroundColor: '#f87171' }} />
              </div>
            </div>

            <div className={styles.tipCard}>
              <FaTrophy size={16} className={styles.tipIcon} />
              <div className={styles.tipContent}>
                <span className={styles.tipTitle}>ALGORITMO ATIVO</span>
                <p className={styles.tipText}>
                  Minimax em profundidade total. Bloqueios imediatos ativados. O melhor cenário teórico é o empate.
                </p>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA: Tabuleiro */}
          <div className={`${styles.boardCard} ${styles.glassCard}`}>
            <div className={styles.boardWrapper}>
              <div className={styles.board}>
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
            </div>

            {/* Overlay de Fim de Jogo */}
            {(winner || isDraw) && (
              <div className={styles.overlay}>
                <div className={`${styles.overlayIcon} ${
                  winner === 'X' ? styles.overlayIconWinX :
                  winner === 'O' ? styles.overlayIconWinO :
                  styles.overlayIconDraw
                }`}>
                  <span className={`${styles.overlaySymbol} ${
                    winner === 'X' ? styles.overlaySymbolX :
                    winner === 'O' ? styles.overlaySymbolO :
                    styles.overlaySymbolDraw
                  }`}>
                    {winner === 'X' ? 'X' : winner === 'O' ? 'O' : '='}
                  </span>
                </div>

                <div className={styles.overlayContent}>
                  <h2 className={`${styles.overlayTitle} ${
                    winner === 'X' ? styles.overlayTitleWinX :
                    winner === 'O' ? styles.overlayTitleWinO :
                    styles.overlayTitleDraw
                  }`}>
                    {winner === 'X' && 'CONEXÃO BEM-SUCEDIDA'}
                    {winner === 'O' && 'ALVO BLOQUEADO'}
                    {isDraw && 'EMPATE DETETADO'}
                  </h2>
                  <p className={styles.overlayText}>
                    {winner === 'X' && 'Inacreditável. Você quebrou as barreiras lógico-matemáticas perfeitas.'}
                    {winner === 'O' && 'O algoritmo da IA previu todas as jogadas finais sem margem para erro.'}
                    {isDraw && 'Nenhum dos sistemas conseguiu obter vantagem espacial. Resolução perfeita.'}
                  </p>
                </div>

                <button onClick={resetGame} className={styles.overlayButton}>
                  Reiniciar Vetores
                </button>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}