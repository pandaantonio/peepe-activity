// pages/game/hangman.js
import { useRouter } from 'next/router';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { FaArrowLeft, FaRedo, FaLightbulb, FaTrophy, FaFire } from 'react-icons/fa';

export default function Hangman() {
  const router = useRouter();
  
  // Estados principais do Jogo
  const [secretWord, setSecretWord] = useState('');
  const [hint, setHint] = useState('');
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [mistakes, setMistakes] = useState(0);
  const [gameActive, setGameActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showOverlay, setShowOverlay] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [isVictory, setIsVictory] = useState(false);

  // Estados de Gamificação
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  
  // Dimensões dinâmicas do Canvas calculadas pelo ResizeObserver
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 280, height: 240 });
  
  const canvasRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const maxMistakes = 6;

  const letters = useMemo(() => 'abcdefghijklmnopqrstuvwxyz'.split(''), []);

  const normalizeString = (str) => {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  };

  const handleExit = () => {
    router.push('/');
  };

  // Desenho adaptado, responsivo e vetorizado baseado no tamanho atual do canvas
  const drawHangman = useCallback((mistakeCount, currentWidth = canvasDimensions.width, currentHeight = canvasDimensions.height) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, currentWidth, currentHeight);
    
    // Proporções baseadas na escala dinâmica (Design Base: 240x240)
    const scaleX = currentWidth / 240;
    const scaleY = currentHeight / 240;
    const scaleMin = Math.min(scaleX, scaleY);
    
    ctx.lineWidth = Math.max(3, 4 * scaleMin);
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'; 
    
    // Suporte e Poste da Forca estruturados proporcionalmente
    ctx.beginPath();
    ctx.moveTo(40 * scaleX, 220 * scaleY); ctx.lineTo(200 * scaleX, 220 * scaleY);
    ctx.moveTo(80 * scaleX, 220 * scaleY); ctx.lineTo(80 * scaleX, 25 * scaleY);
    ctx.moveTo(80 * scaleX, 25 * scaleY); ctx.lineTo(160 * scaleX, 25 * scaleY);
    ctx.moveTo(160 * scaleX, 25 * scaleY); ctx.lineTo(160 * scaleX, 55 * scaleY);
    ctx.stroke();
    
    // Configurações Estéticas do Neon Dinâmico
    ctx.strokeStyle = mistakeCount >= maxMistakes ? '#ef4444' : '#34d399';
    ctx.shadowBlur = 12 * scaleMin;
    ctx.shadowColor = mistakeCount >= maxMistakes ? 'rgba(239, 68, 68, 0.5)' : 'rgba(52, 211, 153, 0.4)';
    
    // Cabeça
    if (mistakeCount >= 1) {
      ctx.beginPath();
      ctx.arc(160 * scaleX, 75 * scaleY, 20 * scaleMin, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Corpo
    if (mistakeCount >= 2) {
      ctx.beginPath();
      ctx.moveTo(160 * scaleX, 95 * scaleY); ctx.lineTo(160 * scaleX, 155 * scaleY);
      ctx.stroke();
    }
    // Braço Esquerdo
    if (mistakeCount >= 3) {
      ctx.beginPath();
      ctx.moveTo(160 * scaleX, 105 * scaleY); ctx.lineTo(125 * scaleX, 125 * scaleY);
      ctx.stroke();
    }
    // Braço Direito
    if (mistakeCount >= 4) {
      ctx.beginPath();
      ctx.moveTo(160 * scaleX, 105 * scaleY); ctx.lineTo(195 * scaleX, 125 * scaleY);
      ctx.stroke();
    }
    // Perna Esquerda
    if (mistakeCount >= 5) {
      ctx.beginPath();
      ctx.moveTo(160 * scaleX, 155 * scaleY); ctx.lineTo(125 * scaleX, 195 * scaleY);
      ctx.stroke();
    }
    // Perna Direita
    if (mistakeCount >= 6) {
      ctx.beginPath();
      ctx.moveTo(160 * scaleX, 155 * scaleY); ctx.lineTo(195 * scaleX, 195 * scaleY);
      ctx.stroke();
    }
    
    ctx.shadowBlur = 0;
  }, [canvasDimensions]);

  const resetGame = useCallback((word) => {
    setGuessedLetters([]);
    setMistakes(0);
    setGameActive(true);
    setShowOverlay(false);
    setIsVictory(false);
    
    setTimeout(() => {
      drawHangman(0);
    }, 50);
  }, [drawHangman]);

  const fetchWord = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/hangman');
      const data = await response.json();
      const wordClean = data.word.toLowerCase();
      setSecretWord(wordClean);
      setHint(data.hint);
      resetGame(wordClean);
    } catch (error) {
      console.error('Erro ao buscar palavra:', error);
      const fallbackWord = 'codigo';
      setSecretWord(fallbackWord);
      setHint('Conjunto de instruções escritas por um programador');
      resetGame(fallbackWord);
    }
    setLoading(false);
  }, [resetGame]);

  const handleRestart = useCallback(() => {
    fetchWord();
  }, [fetchWord]);

  const handleGuess = useCallback((letter) => {
    if (!gameActive || loading || guessedLetters.includes(letter)) return;
    
    const normalizedLetter = letter.toLowerCase();
    const newGuessed = [...guessedLetters, normalizedLetter];
    setGuessedLetters(newGuessed);
    
    const normalizedSecret = normalizeString(secretWord);
    
    if (normalizedSecret.includes(normalizedLetter)) {
      const isWon = secretWord.split('').every(char => {
        const normChar = normalizeString(char);
        if (!letters.includes(normChar)) return true;
        return newGuessed.includes(normChar);
      });

      if (isWon) {
        setGameActive(false);
        setIsVictory(true);
        setScore(prev => prev + 100 + (streak * 20));
        setStreak(prev => {
          const next = prev + 1;
          if (next > bestStreak) setBestStreak(next);
          return next;
        });
        setResultMessage(`Você decifrou o sistema com sucesso! A palavra era "${secretWord.toUpperCase()}"`);
        setShowOverlay(true);
      }
    } else {
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      drawHangman(newMistakes);
      
      if (newMistakes >= maxMistakes) {
        setGameActive(false);
        setIsVictory(false);
        setStreak(0);
        setResultMessage(`Tentativas esgotadas! O sistema bloqueou o acesso. A palavra era "${secretWord.toUpperCase()}"`);
        setShowOverlay(true);
      }
    }
  }, [gameActive, guessedLetters, secretWord, mistakes, drawHangman, streak, bestStreak, letters, loading]);

  // Listener para redimensionamento em tempo real do Canvas (Evita quebra de aspecto)
  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        // Normaliza para manter proporções de caixa consistentes
        const computedWidth = width;
        const computedHeight = height > 0 ? height : width * 0.85; 
        
        setCanvasDimensions({ width: computedWidth, height: computedHeight });
        // Redesenha imediatamente com os novos bounding rects
        drawHangman(mistakes, computedWidth, computedHeight);
      }
    });

    resizeObserver.observe(canvasContainerRef.current);
    return () => resizeObserver.disconnect();
  }, [drawHangman, mistakes]);

  // Gerenciamento global de Input de Teclado Físico
  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();
      if (letters.includes(key) && gameActive && !showOverlay && !loading) {
        handleGuess(key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleGuess, gameActive, showOverlay, letters, loading]);

  useEffect(() => {
    if (!loading) drawHangman(mistakes);
  }, [mistakes, loading, drawHangman]);

  useEffect(() => {
    fetchWord();
  }, [fetchWord]);

  // Renderização otimizada dos caracteres ocultos com tipografia fluida
  const getDisplayWord = () => {
    return secretWord.split('').map((char, i) => {
      const normalizedChar = normalizeString(char);
      const isRevealed = guessedLetters.includes(normalizedChar) || !letters.includes(normalizedChar);
      
      return (
        <span 
          key={i} 
          className={`char-slot font-mono font-black transition-all duration-300 border-b-[max(3px,0.4vw)] pb-1 px-1 sm:px-2
            ${isRevealed ? 'text-emerald-400 border-transparent scale-100 drop-shadow-[0_0_12px_rgba(52,211,153,0.5)]' : 'text-transparent border-white/20 scale-95'}
          `}
        >
          {isRevealed ? char.toUpperCase() : '_'}
        </span>
      );
    });
  };

  return (
    <div className="game-container bg-[#0a0a0c] text-[#ededed] select-none font-sans antialiased flex flex-col relative overflow-hidden w-full min-h-screen h-screen">
      
      {/* Background ambient iluminado adaptado para cobrir superfícies Ultra-Wide */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[50vw] h-[50vw] max-w-[800px] bg-emerald-500/[0.03] rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 w-[45vw] h-[45vw] max-w-[700px] bg-purple-500/[0.03] rounded-full blur-[120px]" />
      </div>

      {/* Topbar Fluid Glassmorphism */}
      <header className="bg-white/[0.02] backdrop-blur-xl border-b border-white/5 shrink-0 z-10 relative h-[10vh] min-h-[64px] max-h-[90px] flex items-center">
        <div className="w-full h-full max-w-[95vw] mx-auto px-4 sm:px-6 flex justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <button 
              onClick={handleExit} 
              aria-label="Voltar para o menu principal"
              className="p-2 sm:p-3 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 focus:bg-white/10 rounded-xl transition-all active:scale-95 cursor-pointer border border-white/5 outline-none focus:ring-2 focus:ring-emerald-400/50"
            >
              <FaArrowLeft className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
            </button>
            <button 
              onClick={handleRestart} 
              aria-label="Reiniciar partida atual"
              className="p-2 sm:p-3 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 focus:bg-white/10 rounded-xl transition-all active:scale-95 cursor-pointer border border-white/5 outline-none focus:ring-2 focus:ring-emerald-400/50"
            >
              <FaRedo className="w-[14px] h-[14px] sm:w-4 sm:h-4" />
            </button>
          </div>
          
          <div className="flex gap-2 sm:gap-4 items-center bg-white/[0.02] px-3 sm:px-5 py-1.5 sm:py-2 rounded-xl border border-white/10 text-xs sm:text-sm backdrop-blur-md shadow-lg">
            <div className="flex items-center gap-1.5 sm:gap-2 border-r border-white/10 pr-2 sm:pr-4">
              <FaTrophy className="text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.4)] w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-gray-400 hidden xs:inline">Pontos:</span> 
              <strong className="text-white font-bold">{score}</strong>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <FaFire className={streak > 0 ? "text-orange-400 animate-pulse drop-shadow-[0_0_6px_rgba(251,146,60,0.4)] w-3.5 h-3.5 sm:w-4 sm:h-4" : "text-gray-500 w-3.5 h-3.5 sm:w-4 sm:h-4"} />
              <span className="text-gray-400 hidden xs:inline">Combo:</span> 
              <strong className="text-white font-bold">{streak}x</strong>
            </div>
          </div>

          <div className="text-right flex flex-col justify-center">
            <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider block leading-none mb-1">Erros</span>
            <span className="text-rose-500 font-mono text-xl sm:text-2xl font-black drop-shadow-[0_0_8px_rgba(244,63,94,0.3)] leading-none">{mistakes}/{maxMistakes}</span>
          </div>
        </div>
      </header>

      {/* Main Gameplay Area - Preenchimento Dinâmico 90vh */}
      <main className="flex-1 w-full max-w-[95vw] mx-auto px-2 sm:px-4 lg:px-6 py-3 sm:py-6 flex items-center justify-center z-10 relative h-[90vh] overflow-hidden">
        
        {loading ? (
          <div className="flex flex-col items-center gap-4 py-20 animate-fade-in" role="status" aria-live="polite">
            <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-gray-400 font-semibold tracking-wide text-sm sm:text-base">Descriptografando base de dados...</div>
          </div>
        ) : (
          <div className="w-full h-full grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-stretch container-layout">
            
            {/* PAINEL ESQUERDO: Gráficos, Dica e Palavra Secreta */}
            <section className="lg:col-span-5 flex flex-col justify-between glass-card rounded-2xl p-4 sm:p-5 lg:p-6 shadow-2xl gap-3 sm:gap-4 overflow-hidden h-full">
              
              {/* Card de Dica Fluida */}
              <div className="px-4 py-3 bg-emerald-500/[0.02] border-l-4 border-emerald-400/60 rounded-r-xl flex items-start gap-3 shadow-inner border border-white/5 shrink-0">
                <FaLightbulb size={16} className="text-emerald-400 mt-0.5 flex-shrink-0 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
                <div className="text-left overflow-y-auto max-h-[8vh]">
                  <span className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-wider block">Módulo de Dica</span>
                  <p className="text-gray-300 text-xs sm:text-sm lg:text-base font-medium mt-0.5 leading-relaxed">{hint}</p>
                </div>
              </div>

              {/* Box do Canvas com auto-escala */}
              <div ref={canvasContainerRef} className="flex-1 flex justify-center items-center w-full min-h-[140px] max-h-[35vh] lg:max-h-full bg-[#050507]/60 p-3 rounded-xl border border-white/5 shadow-inner backdrop-blur-md relative overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={canvasDimensions.width}
                  height={canvasDimensions.height}
                  className="block opacity-95 transition-all duration-150"
                />
              </div>

              {/* Area da Palavra Oculta */}
              <div className="flex justify-center flex-wrap gap-x-1 sm:gap-x-2 gap-y-2 min-h-[12%] max-h-[18%] items-center bg-[#050507]/40 p-3 sm:p-4 rounded-xl shadow-inner border border-white/5 shrink-0 overflow-x-auto w-full">
                {getDisplayWord()}
              </div>

            </section>

            {/* PAINEL DIREITO: Teclado Virtual de Alta Performance */}
            <section className="lg:col-span-7 flex flex-col justify-center glass-card rounded-2xl p-4 sm:p-6 shadow-2xl h-full overflow-hidden">
              <div className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-1 hidden sm:block shrink-0">
                Injete caracteres no sistema usando clique físico ou virtual:
              </div>
              
              <div className="keyboard-grid h-full w-full content-center gap-2">
                {letters.map((letter) => {
                  const isGuessed = guessedLetters.includes(letter);
                  const normalizedSecret = normalizeString(secretWord);
                  const isCorrect = isGuessed && normalizedSecret.includes(letter);
                  const isWrong = isGuessed && !normalizedSecret.includes(letter);
                  
                  return (
                    <button
                      key={letter}
                      onClick={() => handleGuess(letter)}
                      disabled={!gameActive || isGuessed}
                      aria-label={`Letra ${letter.toUpperCase()}`}
                      aria-disabled={!gameActive || isGuessed}
                      className={`
                        w-full font-black uppercase rounded-xl transition-all duration-150
                        touch-manipulation select-none active:scale-95 outline-none focus:ring-2 focus:ring-white/20
                        flex items-center justify-center keyboard-btn text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl
                        ${isGuessed ? 'cursor-not-allowed opacity-20' : 'bg-white/[0.03] text-gray-300 border border-white/5 shadow-md hover:bg-white/10 hover:text-white hover:border-white/20'}
                        ${isCorrect ? '!bg-emerald-500/10 !text-emerald-400 !border-emerald-500/40 !shadow-[0_0_15px_rgba(52,211,153,0.2)] !opacity-100' : ''}
                        ${isWrong ? '!bg-rose-500/10 !text-rose-400 !border-rose-500/40 !opacity-100' : ''}
                      `}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>
            </section>

          </div>
        )}
      </main>

      {/* Overlay Modular de Fim de Jogo Reativo */}
      {showOverlay && (
        <div className="fixed inset-0 bg-[#0a0a0c]/85 backdrop-blur-md flex items-center justify-center z-30 p-4 transition-all animate-fade-in" role="dialog" aria-modal="true">
          <div className="glass-card rounded-2xl border border-white/10 p-6 sm:p-8 text-center max-w-md w-full shadow-2xl scale-up-animation">
            <h2 className={`text-2xl sm:text-3xl font-black mb-3 tracking-wide ${isVictory ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]' : 'text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.3)]'}`}>
              {isVictory ? '🎉 CONCLUÍDO 🎉' : '💀 FALHA DE CONEXÃO 💀'}
            </h2>
            
            <p className="text-gray-400 text-xs sm:text-sm md:text-base mb-5 leading-relaxed">
              {resultMessage}
            </p>

            <div className="bg-[#050507]/60 rounded-xl p-3 sm:p-4 mb-5 grid grid-cols-2 gap-4 border border-white/5 backdrop-blur-md">
              <div className="text-center border-r border-white/5">
                <span className="text-gray-500 text-[10px] sm:text-xs block mb-1">Melhor Sequência</span>
                <strong className="text-white text-base sm:text-lg font-black">{bestStreak}x</strong>
              </div>
              <div className="text-center">
                <span className="text-gray-500 text-[10px] sm:text-xs block mb-1">Desvios Cometidos</span>
                <strong className="text-white text-base sm:text-lg font-black">{mistakes}</strong>
              </div>
            </div>

            <button
              onClick={handleRestart}
              className="w-full py-3.5 bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/10 hover:border-white/20 text-white font-bold text-sm sm:text-base rounded-xl transition-all transform shadow-xl cursor-pointer active:scale-98 outline-none focus:ring-2 focus:ring-emerald-400/50"
            >
              Iniciar Nova Rodada
            </button>
          </div>
        </div>
      )}

      {/* Engenharia CSS Injetada para Escalonamento Absoluto (AAA) */}
      <style jsx global>{`
        /* Bloqueio de scroll estrutural e preenchimento de viewport */
        html, body {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background-color: #0a0a0c;
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.025);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          box-shadow: 
            0 4px 30px rgba(0, 0, 0, 0.4),
            inset 0 1px 1px rgba(255, 255, 255, 0.03);
        }

        /* Tipografia de caracteres fluida baseada no tamanho da tela */
        .char-slot {
          font-size: clamp(1.5rem, 4.5vh + 0.5vw, 4.5rem);
          line-height: 1;
          min-width: clamp(1.2rem, 3.5vh, 3.5rem);
          text-align: center;
        }

        /* Grade Dinâmica Avançada para o Teclado Virtual */
        .keyboard-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          height: 100%;
          max-height: 100%;
        }

        .keyboard-btn {
          height: 100%;
          min-height: 44px; /* Recomendação Apple/Google UX para toque */
          padding: 0;
          aspect-ratio: auto;
        }

        /* Regras adaptativas extras para Mobile Vertical Extremo */
        @media (max-width: 640px) {
          .keyboard-grid {
            grid-template-columns: repeat(5, 1fr); /* Reduz colunas para botões maiores no toque lateral */
          }
          .container-layout {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .keyboard-btn {
            min-height: 48px;
          }
        }

        /* Regras adaptativas para Monitores Ultrawide ou telas 4K */
        @media (min-width: 1920px) {
          .keyboard-btn {
            font-size: clamp(1.2rem, 1.2vw, 2rem);
          }
          .keyboard-grid {
            gap: 0.8vw;
          }
        }

        /* Microanimações de Interface */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.96); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }
        .scale-up-animation {
          animation: scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        
        /* Otimizações extras de breakpoints */
        @media (max-width: 360px) {
          .keyboard-grid { grid-template-columns: repeat(4, 1fr); }
        }
        @media (max-height: 700px) and (orientation: portrait) {
          .keyboard-btn { min-height: 40px; padding: 4px 0; }
        }
      `}</style>
    </div>
  );
}