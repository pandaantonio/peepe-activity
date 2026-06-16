import React, { useState, useCallback, useEffect, memo, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import { FaArrowLeft, FaRedo, FaUser, FaUsers, FaTrashAlt } from 'react-icons/fa';
import { useDiscord } from '@/contexts/DiscordContext';
import styles from '@/styles/TicTacToe.module.css';

// Sub-componente otimizado para as células do tabuleiro
const GridCell = memo(({ cell, rowIndex, colIndex, isWinning, isLastMove, gameOver, isMyTurn, onClick }) => {
  return (
    <button
      onClick={() => onClick(rowIndex, colIndex)}
      disabled={gameOver || !isMyTurn || cell !== ''}
      className={`
        ${styles.gridCell}
        ${cell === '' ? styles.gridCellEmpty : styles.gridCellFilled}
        ${isWinning ? styles.gridCellWinning : ''}
        ${isLastMove && !isWinning ? styles.gridCellLastMove : ''}
        ${(gameOver || !isMyTurn || cell !== '') ? styles.gridCellDisabled : ''}
      `}
    >
      {cell === 'X' && <span className={`${styles.cellX} ${styles.animateScaleUp}`}>X</span>}
      {cell === 'O' && <span className={`${styles.cellO} ${styles.animateScaleUp}`}>O</span>}
    </button>
  );
});
GridCell.displayName = 'GridCell';

export default function TicTacToe() {
  const router = useRouter();
  
  // Puxando as ferramentas nativas e participantes do seu Contexto global do Discord
  const { participants, currentUserRaw, discordSdk } = useDiscord();

  const [board, setBoard] = useState([['', '', ''], ['', '', ''], ['', '', '']]);
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const [winner, setWinner] = useState(null);
  const [isDraw, setIsDraw] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [scores, setScores] = useState({ playerX: 0, playerO: 0, draws: 0 });
  const [winningLine, setWinningLine] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);
  
  const scoreLockRef = useRef(false);

  // === ATRIBUIÇÃO DINÂMICA DE PAPÉIS (MULTIPLAYER) ===
  const playerXUser = useMemo(() => participants[0] || null, [participants]);
  const playerOUser = useMemo(() => participants[1] || null, [participants]);

  // Identifica quem é você na partida
  const mySymbol = useMemo(() => {
    if (!currentUserRaw) return null;
    if (playerXUser && currentUserRaw.id === playerXUser.id) return 'X';
    if (playerOUser && currentUserRaw.id === playerOUser.id) return 'O';
    return 'SPECTATOR';
  }, [currentUserRaw, playerXUser, playerOUser]);

  // Valida se é o seu turno de jogar
  const isMyTurn = useMemo(() => mySymbol === currentPlayer, [mySymbol, currentPlayer]);

  const checkVictory = useCallback((player, currentBoard) => {
    const lines = [
      [[0,0],[0,1],[0,2]], [[1,0],[1,1],[1,2]], [[2,0],[2,1],[2,2]], 
      [[0,0],[1,0],[2,0]], [[0,1],[1,1],[2,1]], [[0,2],[1,2],[2,2]], 
      [[0,0],[1,1],[2,2]], [[0,2],[1,1],[2,0]]                       
    ];
    for (const line of lines) {
      if (line.every(([r, c]) => currentBoard[r][c] === player)) return line;
    }
    return null;
  }, []);

  // Processa a jogada no tabuleiro local
  const executeMoveOnBoard = useCallback((row, col, player) => {
    setBoard(prevBoard => {
      if (prevBoard[row][col] !== '') return prevBoard;
      
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
            playerX: player === 'X' ? prev.playerX + 1 : prev.playerX,
            playerO: player === 'O' ? prev.playerO + 1 : prev.playerO
          }));
        }
        return newBoard;
      }

      const hasEmpty = newBoard.some(r => r.some(c => c === ''));
      if (!hasEmpty) {
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
    setCurrentPlayer(player === 'X' ? 'O' : 'X');
  }, [checkVictory]);

  const localReset = () => {
    setBoard([['', '', ''], ['', '', ''], ['', '', '']]);
    setCurrentPlayer('X');
    setWinner(null);
    setIsDraw(false);
    setGameOver(false);
    setWinningLine(null);
    setMoveHistory([]);
    scoreLockRef.current = false;
  };

  // === ESCUTAR EVENTOS REAIS VINDO DO DISCORD (RECEPTOR) ===
  useEffect(() => {
    if (!discordSdk) return;

    // Função de callback para processar eventos de rede recebidos
    const handleNetworkMessage = (event) => {
      // Filtra mensagens que não pertençam ao jogo da velha
      if (!event.data || event.data.game !== 'tictactoe') return;

      const { type, payload } = event.data;

      if (type === 'MOVE') {
        executeMoveOnBoard(payload.row, payload.col, payload.player);
      } else if (type === 'RESET') {
        localReset();
      }
    };

    // Inscreve a aplicação Next.js para ouvir o evento nativo do Iframe do Discord
    window.addEventListener('message', handleNetworkMessage);

    return () => {
      window.removeEventListener('message', handleNetworkMessage);
    };
  }, [discordSdk, executeMoveOnBoard]);

  // === ENVIAR CRÉDITO DO CLIQUE PARA O ADVERSÁRIO (EMISSOR) ===
  const handleCellClick = useCallback((row, col) => {
    if (gameOver || !isMyTurn || board[row][col] !== '') return;

    // 1. Atualiza sua própria tela instantaneamente
    executeMoveOnBoard(row, col, mySymbol);

    // 2. Transmite nativamente para o Iframe pai do Discord repassar ao outro jogador
    if (typeof window !== 'undefined' && window.parent) {
      window.parent.postMessage(
        {
          game: 'tictactoe',
          type: 'MOVE',
          payload: { row, col, player: mySymbol }
        },
        '*'
      );
    }
  }, [gameOver, isMyTurn, board, executeMoveOnBoard, mySymbol]);

  const handleResetClick = () => {
    localReset();

    // Avisa os outros aparelhos na call para limparem o tabuleiro também
    if (typeof window !== 'undefined' && window.parent) {
      window.parent.postMessage(
        {
          game: 'tictactoe',
          type: 'RESET',
          payload: {}
        },
        '*'
      );
    }
  };

  const resetScores = () => {
    setScores({ playerX: 0, playerO: 0, draws: 0 });
    scoreLockRef.current = false;
  };

  const getStatusText = () => {
    if (winner === 'X') return `VITÓRIA DE ${playerXUser?.global_name || 'X'}`;
    if (winner === 'O') return `VITÓRIA DE ${playerOUser?.global_name || 'O'}`;
    if (isDraw) return "EMPATE DETECTADO";
    if (mySymbol === 'SPECTATOR') {
      return `ASSISTINDO: VEZ DE ${currentPlayer === 'X' ? (playerXUser?.global_name || 'X') : (playerOUser?.global_name || 'O')}`;
    }
    return isMyTurn ? "SUA VEZ DE AGIR" : "AGUARDANDO ADVERSÁRIO...";
  };

  const getStatusColorClass = () => {
    if (winner === 'X') return styles.statusTextWinX;
    if (winner === 'O') return styles.statusTextWinO;
    if (isDraw) return styles.statusTextDraw;
    return isMyTurn ? styles.statusTextTurn : styles.statusTextAITurn;
  };

  return (
    <div className={styles.container}>
      <div className={styles.bgGradient}><div className={styles.bgBlur1} /><div className={styles.bgBlur2} /></div>
      
      <div className={styles.topbar}>
        <div className={styles.topbarContent}>
          <div className={styles.buttonGroup}>
            <button onClick={() => router.push('/')} className={styles.iconButton}><FaArrowLeft size={18} /></button>
            {mySymbol !== 'SPECTATOR' && (
              <button onClick={handleResetClick} className={styles.iconButton} title="Reiniciar Tabuleiro"><FaRedo size={16} /></button>
            )}
          </div>
          <div className={styles.statusContainer}>
            <div className={styles.statusBox}>
              <div className={`${styles.statusDot} ${isMyTurn && !gameOver ? styles.statusDotActive : styles.statusDotInactive}`} />
              <span className={`${styles.statusText} ${getStatusColorClass()}`}>{getStatusText()}</span>
            </div>
          </div>
          <button onClick={resetScores} className={styles.resetButton}><FaTrashAlt size={14} /><span>Limpar</span></button>
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.gameLayout}>
          
          {/* Placar */}
          <div className={`${styles.scoreCard} ${styles.glassCard}`}>
            <div className={styles.scoreHeader}>
              <span className={styles.scoreLabel}>MÓDULO MULTIPLAYER</span>
              <h2 className={styles.scoreTitle}>Jogadores na Sala</h2>
            </div>
            <div className={styles.scorePanel}>
              <div className={styles.scoreGrid}>
                <div className={`${styles.scoreItem} ${mySymbol === 'X' ? styles.scoreItemActive : ''}`}>
                  <span className={styles.scoreLabelText}>{playerXUser ? (playerXUser.global_name || playerXUser.username) : 'Aguardando...'} (X)</span>
                  <span className={styles.scoreValue}>{scores.playerX}</span>
                </div>
                <div className={styles.drawItem}>
                  <span className={styles.scoreLabelText}>Empates</span>
                  <span className={styles.drawValue}>{scores.draws}</span>
                </div>
                <div className={`${styles.scoreItem} ${mySymbol === 'O' ? styles.scoreItemActive : ''}`}>
                  <span className={styles.scoreLabelText}>{playerOUser ? (playerOUser.global_name || playerOUser.username) : 'Aguardando...'} (O)</span>
                  <span className={styles.scoreValue}>{scores.playerO}</span>
                </div>
              </div>
            </div>
            <div className={styles.tipCard}>
              <FaUsers size={16} className={styles.tipIcon} />
              <div className={styles.tipContent}>
                <span className={styles.tipTitle}>SUA FUNÇÃO</span>
                <p className={styles.tipText}>
                  {mySymbol === 'SPECTATOR' ? "Você está assistindo à partida como espectador." : `Você está controlando as peças '${mySymbol}' nesta rodada.`}
                </p>
              </div>
            </div>
          </div>

          {/* Tabuleiro */}
          <div className={`${styles.boardCard} ${styles.glassCard}`}>
            <div className={styles.boardWrapper}>
              <div className={styles.board}>
                {board.map((row, rowIndex) => row.map((cell, colIndex) => (
                  <GridCell
                    key={`${rowIndex}-${colIndex}`}
                    cell={cell}
                    rowIndex={rowIndex}
                    colIndex={colIndex}
                    isWinning={winningLine?.some(([r, c]) => r === rowIndex && c === colIndex)}
                    isLastMove={moveHistory.length > 0 && moveHistory[moveHistory.length - 1].row === rowIndex && moveHistory[moveHistory.length - 1].col === colIndex}
                    gameOver={gameOver}
                    isMyTurn={isMyTurn}
                    onClick={handleCellClick}
                  />
                )))}
              </div>
            </div>

            {/* Fim de Jogo */}
            {(winner || isDraw) && (
              <div className={styles.overlay}>
                <h2 className={styles.overlayTitle}>{winner ? 'PARTIDA TERMINADA' : 'SISTEMA EM EMPATE'}</h2>
                <p className={styles.overlayText}>
                  {winner === mySymbol && 'Parabéns! Você venceu o duelo tático.'}
                  {winner && winner !== mySymbol && mySymbol !== 'SPECTATOR' && 'O adversário venceu esta rodada.'}
                  {isDraw && 'O jogo terminou empatado.'}
                </p>
                {mySymbol !== 'SPECTATOR' && <button onClick={handleResetClick} className={styles.overlayButton}>Próxima Rodada</button>}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}