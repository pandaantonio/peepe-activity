import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import styles from '@/styles/Hangman.module.css';

export default function GuessNumberGame() {
  const router = useRouter();
  
  // Estados do Jogo
  const [secretNumber, setSecretNumber] = useState(null);
  const [score, setScore] = useState(20);
  const [highscore, setHighscore] = useState(0);
  const [message, setMessage] = useState("Adivinhe o número secreto de 1 a 100!");
  const [gameOver, setGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [guessedNumbers, setGuadedNumbers] = useState([]); // Histórico de palpites

  // Máximo de erros permitidos para o desenho da forca (Baseado nos pontos iniciais)
  const maxErrors = 6;
  
  // Referência para o container principal (Acessibilidade e Foco)
  const containerRef = useRef(null);

  const handleExit = useCallback(() => {
    router.push('/');
  }, [router]);

  // Gerar número secreto estável
  const generateSecretNumber = useCallback(() => {
    return Math.floor(Math.random() * 100) + 1;
  }, []);

  // Inicializar/Resetar Jogo
  const startNewGame = useCallback(() => {
    const newSecret = generateSecretNumber();
    setSecretNumber(newSecret);
    setScore(20);
    setMessage("O jogo começou! Escolha um número de 1 a 100.");
    setGameOver(false);
    setIsVictory(false);
    setGuadedNumbers([]);
    
    if (containerRef.current) {
      containerRef.current.focus();
    }
  }, [generateSecretNumber]);

  // Carregar Highscore
  useEffect(() => {
    const savedHighscore = localStorage.getItem('guessHighscore');
    if (savedHighscore) {
      setHighscore(parseInt(savedHighscore, 10));
    }
    startNewGame();
  }, [startNewGame]);

  // Computar erros atuais baseado no histórico
  const currentErrors = useMemo(() => {
    if (!secretNumber) return 0;
    return guessedNumbers.filter(num => num !== secretNumber).length;
  }, [guessedNumbers, secretNumber]);

  // Processamento do Palpite (Ação Principal)
  const handleGuess = useCallback((guess) => {
    if (gameOver || guessedNumbers.includes(guess)) return;

    const updatedGuesses = [...guessedNumbers, guess];
    setGuadedNumbers(updatedGuesses);

    if (guess === secretNumber) {
      setMessage(`🎉 Perfeito! Você acertou o número ${secretNumber}!`);
      setGameOver(true);
      setIsVictory(true);
      
      // Atualizar Highscore se a pontuação atual for maior
      if (score > highscore) {
        setHighscore(score);
        localStorage.setItem('guessHighscore', score.toString());
      }
    } else {
      const remainingErrors = maxErrors - (currentErrors + 1);
      const newScore = Math.max(0, score - 3); // Penalidade por erro
      setScore(newScore);

      if (remainingErrors <= 0 || newScore <= 0) {
        setMessage(`💥 Fim de jogo! O número secreto era ${secretNumber}.`);
        setScore(0);
        setGameOver(true);
        setIsVictory(false);
      } else {
        const checkDirection = guess < secretNumber ? "MAIOR" : "MENOR";
        setMessage(`❌ Errado! O número secreto é ${checkDirection} do que ${guess}.`);
      }
    }
  }, [secretNumber, gameOver, guessedNumbers, score, highscore, currentErrors]);

  // Atalhos de Teclado Físico (Acessibilidade e UX)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameOver && e.key === 'Enter') {
        e.preventDefault();
        startNewGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver, startNewGame]);

  // Geração dinâmica do teclado numérico (1 a 100) para evitar re-renders
  const numericKeyboard = useMemo(() => {
    return Array.from({ length: 100 }, (_, i) => i + 1);
  }, []);

  // Renderização Dinâmica do Canvas da Forca Baseado no Estado de Erros
  const renderSvgHangman = useMemo(() => {
    return (
      <svg viewBox="0 0 200 250" className={styles.hangmanSvg} aria-hidden="true">
        {/* Base e Poste da Forca */}
        <line x1="20" y1="230" x2="180" y2="230" stroke="currentColor" strokeWidth="4" />
        <line x1="60" y1="230" x2="60" y2="20" stroke="currentColor" strokeWidth="4" />
        <line x1="60" y1="20" x2="140" y2="20" stroke="currentColor" strokeWidth="4" />
        <line x1="140" y1="20" x2="140" y2="50" stroke="currentColor" strokeWidth="4" />

        {/* Cabeça */}
        {currentErrors > 0 && <circle cx="140" cy="70" r="20" stroke="currentColor" strokeWidth="4" fill="none" />}
        {/* Tronco */}
        {currentErrors > 1 && <line x1="140" y1="90" x2="140" y2="150" stroke="currentColor" strokeWidth="4" />}
        {/* Braço Esquerdo */}
        {currentErrors > 2 && <line x1="140" y1="110" x2="110" y2="130" stroke="currentColor" strokeWidth="4" />}
        {/* Braço Direito */}
        {currentErrors > 3 && <line x1="140" y1="110" x2="170" y2="130" stroke="currentColor" strokeWidth="4" />}
        {/* Perna Esquerda */}
        {currentErrors > 4 && <line x1="140" y1="150" x2="110" y2="190" stroke="currentColor" strokeWidth="4" />}
        {/* Perna Direita */}
        {currentErrors > 5 && <line x1="140" y1="150" x2="170" y2="190" stroke="currentColor" strokeWidth="4" />}
      </svg>
    );
  }, [currentErrors]);

  // Gerenciador de Classes Dinâmicas de Fundo
  const containerThemeClass = useMemo(() => {
    if (!gameOver) return styles.bgNormal;
    return isVictory ? styles.bgVictory : styles.bgDefeat;
  }, [gameOver, isVictory]);

  return (
    <div 
      ref={containerRef}
      className={`${styles.viewportContainer} ${containerThemeClass}`}
      tabIndex="-1"
      aria-label="Jogo da Forca com Números"
    >
      {/* Topbar Adaptativa */}
      <header className={styles.topBar}>
        <button
          onClick={handleExit}
          className={styles.navButton}
          aria-label="Voltar para o menu principal"
        >
          ← Hub
        </button>
        <div className={styles.scoreContainer}>
          <div className={styles.scoreBadge}>💯 Score: <span>{score}</span></div>
          <div className={styles.scoreBadge}>🥇 Recorde: <span>{highscore}</span></div>
        </div>
        <button
          onClick={startNewGame}
          className={styles.resetButton}
          aria-label="Reiniciar partida atual"
        >
          🔄 Reiniciar
        </button>
      </header>

      {/* Grid de Layout Fluido e Responsivo Intermediado por Breakpoints */}
      <main className={styles.gameDashboard}>
        
        {/* Coluna Esquerda: Feedback Visual e Canvas */}
        <section className={styles.visualSection}>
          <div className={styles.canvasWrapper} aria-label={`Forca mostrando ${currentErrors} de ${maxErrors} erros`}>
            {renderSvgHangman}
          </div>
          
          <div className={styles.secretWordDisplay}>
            <p className={styles.displayLabel}>NÚMERO SECRETO</p>
            <div className={`${styles.secretBox} ${gameOver ? (isVictory ? styles.boxVictory : styles.boxDefeat) : ''}`}>
              {gameOver ? secretNumber : '?'}
            </div>
          </div>
        </section>

        {/* Coluna Direita: Teclado Virtual de Alta Densidade e Painel de Controle */}
        <section className={styles.controlSection}>
          <div className={styles.messageBanner} role="status" aria-live="polite">
            <p>{message}</p>
          </div>

          <div className={styles.keyboardContainer}>
            <p className={styles.keyboardInstruction}>Selecione um palpite de 1 a 100:</p>
            <div className={styles.interactiveGrid} role="group" aria-label="Teclado numérico de palpites">
              {numericKeyboard.map((num) => {
                const isGuessed = guessedNumbers.includes(num);
                const isCorrect = isGuessed && num === secretNumber;
                
                return (
                  <button
                    key={num}
                    onClick={() => handleGuess(num)}
                    disabled={gameOver || isGuessed}
                    className={`${styles.keyButton} ${isGuessed ? (isCorrect ? styles.keyCorrect : styles.keyWrong) : ''}`}
                    aria-label={`Número ${num}`}
                    aria-disabled={gameOver || isGuessed}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* Rodapé Informativo */}
      <footer className={styles.gameFooter}>
        <p>Desenvolvido com interface responsiva e acessível para todos os dispositivos.</p>
        {gameOver && <p className={styles.footerTip}>Dica: Pressione <kbd>Enter</kbd> para recomeçar rapidamente.</p>}
      </footer>

      {/* Overlay Modal de Fim de Jogo */}
      {gameOver && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="modalTitle">
          <div className={`${styles.modalCard} ${isVictory ? styles.modalVictory : styles.modalDefeat}`}>
            <div className={styles.modalEmoji}>{isVictory ? "🎉" : "💀"}</div>
            <h2 id="modalTitle" className={styles.modalTitle}>
              {isVictory ? "VITÓRIA EXCEPCIONAL!" : "FIM DE JOGO!"}
            </h2>
            <p className={styles.modalText}>
              {isVictory 
                ? `Parabéns! O número correto realmente era o ${secretNumber}.` 
                : `Não foi dessa vez. O número misterioso oculto era o ${secretNumber}.`
              }
            </p>
            <div className={styles.modalStats}>
              <p>Pontuação Final: <strong>{score}</strong> pts</p>
              <p>Erros Cometidos: <strong>{currentErrors}</strong></p>
            </div>
            <button
              onClick={startNewGame}
              className={styles.modalActionBtn}
              autoFocus
            >
              🔄 Jogar Novamente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}