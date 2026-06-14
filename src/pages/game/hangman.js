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
  
  const canvasRef = useRef(null);
  const maxMistakes = 6;

  const letters = useMemo(() => 'abcdefghijklmnopqrstuvwxyz'.split(''), []);

  const normalizeString = (str) => {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  };

  const handleExit = () => {
    router.push('/');
  };

  // Desenho adaptado com estilo neon sintonizado ao Hub
  const drawHangman = useCallback((mistakeCount) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'; 
    
    // Suporte e Poste da Forca
    ctx.beginPath();
    ctx.moveTo(40, 220); ctx.lineTo(200, 220);
    ctx.moveTo(80, 220); ctx.lineTo(80, 25);
    ctx.moveTo(80, 25); ctx.lineTo(160, 25);
    ctx.moveTo(160, 25); ctx.lineTo(160, 55);
    ctx.stroke();
    
    // Altera a cor do boneco dinamicamente baseado no estado
    ctx.strokeStyle = mistakeCount >= maxMistakes ? '#ef4444' : '#34d399';
    ctx.shadowBlur = 10;
    ctx.shadowColor = mistakeCount >= maxMistakes ? 'rgba(239, 68, 68, 0.4)' : 'rgba(52, 211, 153, 0.3)';
    
    // Cabeça
    if (mistakeCount >= 1) {
      ctx.beginPath();
      ctx.arc(160, 75, 20, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Corpo
    if (mistakeCount >= 2) {
      ctx.beginPath();
      ctx.moveTo(160, 95); ctx.lineTo(160, 155);
      ctx.stroke();
    }
    // Braço Esquerdo
    if (mistakeCount >= 3) {
      ctx.beginPath();
      ctx.moveTo(160, 105); ctx.lineTo(125, 125);
      ctx.stroke();
    }
    // Braço Direito
    if (mistakeCount >= 4) {
      ctx.beginPath();
      ctx.moveTo(160, 105); ctx.lineTo(195, 125);
      ctx.stroke();
    }
    // Perna Esquerda
    if (mistakeCount >= 5) {
      ctx.beginPath();
      ctx.moveTo(160, 155); ctx.lineTo(125, 195);
      ctx.stroke();
    }
    // Perna Direita
    if (mistakeCount >= 6) {
      ctx.beginPath();
      ctx.moveTo(160, 155); ctx.lineTo(195, 195);
      ctx.stroke();
    }
    
    ctx.shadowBlur = 0;
  }, []);

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

  const getDisplayWord = () => {
    return secretWord.split('').map((char, i) => {
      const normalizedChar = normalizeString(char);
      const isRevealed = guessedLetters.includes(normalizedChar) || !letters.includes(normalizedChar);
      
      return (
        <span 
          key={i} 
          className={`mx-1.5 [@media(max-height:500px)]:mx-0.5 text-3xl md:text-5xl [@media(max-height:500px)]:text-xl font-mono font-black transition-all duration-300 border-b-4 [@media(max-height:500px)]:border-b-2 pb-2 [@media(max-height:500px)]:pb-1 px-2 [@media(max-height:500px)]:px-0.5
            ${isRevealed ? 'text-emerald-400 border-transparent scale-100 drop-shadow-[0_0_12px_rgba(52,211,153,0.4)]' : 'text-transparent border-white/20 scale-95'}
          `}
        >
          {isRevealed ? char.toUpperCase() : '_'}
        </span>
      );
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-[#ededed] select-none font-sans antialiased flex flex-col relative overflow-hidden">
      
      {/* Background ambient iluminado herdado da Home */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/[0.02] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/[0.02] rounded-full blur-[100px]" />
      </div>

      {/* Topbar Glassmorphism de ponta a ponta */}
      <div className="bg-white/[0.02] backdrop-blur-xl border-b border-white/5 shrink-0 z-10 relative">
        <div className="w-full max-w-7xl mx-auto px-6 py-4 [@media(max-height:500px)]:px-3 [@media(max-height:500px)]:py-2 flex justify-between items-center">
          <div className="flex items-center gap-2 [@media(max-height:500px)]:gap-1.5">
            <button 
              onClick={handleExit} 
              className="p-3 [@media(max-height:500px)]:p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all active:scale-95 cursor-pointer border border-white/5"
            >
              <FaArrowLeft size={18} className="[@media(max-height:500px)]:text-sm" />
            </button>
            <button 
              onClick={handleRestart} 
              className="p-3 [@media(max-height:500px)]:p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all active:scale-95 cursor-pointer border border-white/5"
            >
              <FaRedo size={16} className="[@media(max-height:500px)]:text-sm" />
            </button>
          </div>
          
          <div className="flex gap-4 [@media(max-height:500px)]:gap-2.5 items-center bg-white/[0.02] px-5 py-2 [@media(max-height:500px)]:px-3 [@media(max-height:500px)]:py-1 rounded-xl border border-white/10 text-sm [@media(max-height:500px)]:text-xs backdrop-blur-md">
            <div className="flex items-center gap-2 border-r border-white/10 pr-4 [@media(max-height:500px)]:pr-2.5">
              <FaTrophy className="text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.4)]" size={15} />
              <span className="text-gray-400"><span className="[@media(max-height:500px)]:hidden">Pontos: </span><strong className="text-white font-bold">{score}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <FaFire className={streak > 0 ? "text-orange-400 animate-pulse drop-shadow-[0_0_6px_rgba(251,146,60,0.4)]" : "text-gray-500"} size={15} />
              <span className="text-gray-400"><span className="[@media(max-height:500px)]:hidden">Combo: </span><strong className="text-white font-bold">{streak}x</strong></span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider block [@media(max-height:500px)]:hidden">Erros</span>
            <span className="text-rose-500 font-mono text-2xl [@media(max-height:500px)]:text-lg font-black drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]">{mistakes}/{maxMistakes}</span>
          </div>
        </div>
      </div>

      {/* Main Content Area - Layout Bilateral Expandido */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-6 [@media(max-height:500px)]:px-2 [@media(max-height:500px)]:py-2 flex items-center justify-center z-10 relative [@media(max-height:500px)]:overflow-y-auto">
        
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-gray-500 font-semibold tracking-wide">Descriptografando base de dados...</div>
          </div>
        ) : (
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 [@media(max-height:500px)]:grid-cols-12 gap-8 [@media(max-height:500px)]:gap-3 items-stretch">
            
            {/* COLUNA ESQUERDA: Display Visual, Canvas e Dica */}
            <div className="lg:col-span-5 [@media(max-height:500px)]:col-span-5 flex flex-col justify-between glass-card rounded-2xl p-6 [@media(max-height:500px)]:p-3 shadow-2xl gap-6 [@media(max-height:500px)]:gap-2">
              
              {/* Box da Dica - Estilo Liquid Glass */}
              <div className="px-5 py-4 [@media(max-height:500px)]:px-3 [@media(max-height:500px)]:py-2 bg-emerald-500/[0.02] border-l-4 border-emerald-400/60 rounded-r-xl flex items-start gap-3 [@media(max-height:500px)]:gap-2 shadow-inner border border-white/5">
                <FaLightbulb size={18} className="text-emerald-400 mt-0.5 flex-shrink-0 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)] [@media(max-height:500px)]:text-sm" />
                <div className="text-left">
                  <span className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-wider [@media(max-height:500px)]:hidden">Módulo de Dica</span>
                  <p className="text-gray-300 text-base [@media(max-height:500px)]:text-xs font-medium mt-0.5 [@media(max-height:500px)]:mt-0 leading-relaxed [@media(max-height:500px)]:leading-snug">{hint}</p>
                </div>
              </div>

              {/* Canvas da Forca */}
              <div className="flex justify-center my-auto [@media(max-height:500px)]:my-0">
                <div className="bg-[#050507]/60 p-4 [@media(max-height:500px)]:p-2 rounded-xl border border-white/5 shadow-inner w-full max-w-[280px] [@media(max-height:500px)]:max-w-[130px] flex justify-center backdrop-blur-md">
                  <canvas
                    ref={canvasRef}
                    width={240}
                    height={240}
                    className="block opacity-95 [@media(max-height:500px)]:w-[110px] [@media(max-height:500px)]:h-[110px]"
                  />
                </div>
              </div>

              {/* Espaço da Palavra Oculta */}
              <div className="flex justify-center flex-wrap gap-y-3 [@media(max-height:500px)]:gap-y-1 min-h-[60px] [@media(max-height:500px)]:min-h-[36px] items-center bg-[#050507]/40 p-4 [@media(max-height:500px)]:p-2 rounded-xl shadow-inner border border-white/5">
                {getDisplayWord()}
              </div>

            </div>

            {/* COLUNA DIREITA: Teclado Virtual Panorâmico */}
            <div className="lg:col-span-7 [@media(max-height:500px)]:col-span-7 flex flex-col justify-center glass-card rounded-2xl p-6 [@media(max-height:500px)]:p-2 md:p-8 shadow-2xl">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-5 px-1 hidden lg:block">
                Injete caracteres no sistema usando clique físico ou virtual:
              </div>
              
              <div className="grid grid-cols-4 sm:grid-cols-7 [@media(max-height:500px)]:grid-cols-7 gap-2 sm:gap-3 [@media(max-height:500px)]:gap-1 h-full content-center">
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
                      className={`
                        w-full font-black uppercase text-base sm:text-lg [@media(max-height:500px)]:text-sm rounded-xl [@media(max-height:500px)]:rounded-lg
                        transition-all duration-200 touch-manipulation select-none active:scale-95
                        flex items-center justify-center p-4 lg:p-6 [@media(max-height:500px)]:p-1 min-h-[55px] sm:min-h-[65px] [@media(max-height:500px)]:min-h-[32px] cursor-pointer
                        ${isGuessed ? 'cursor-not-allowed opacity-20' : 'bg-white/[0.03] text-gray-300 border border-white/5 shadow-md hover:bg-white/10 hover:text-white hover:border-white/20'}
                        ${isCorrect ? '!bg-emerald-500/10 !text-emerald-400 !border-emerald-500/40 !shadow-[0_0_15px_rgba(52,211,153,0.15)]' : ''}
                        ${isWrong ? '!bg-rose-500/10 !text-rose-400 !border-rose-500/40' : ''}
                      `}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Overlay Modular de Fim de Jogo */}
      {showOverlay && (
        <div className="fixed inset-0 bg-[#0a0a0c]/80 backdrop-blur-md flex items-center justify-center z-30 p-4 [@media(max-height:500px)]:p-2 transition-all">
          <div className="glass-card rounded-2xl border border-white/10 p-8 [@media(max-height:500px)]:p-4 text-center max-w-md w-full shadow-2xl max-h-full overflow-y-auto">
            <h2 className={`text-3xl [@media(max-height:500px)]:text-xl font-black mb-3 [@media(max-height:500px)]:mb-1 tracking-wide ${isVictory ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]' : 'text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.3)]'}`}>
              {isVictory ? '🎉 CONCLUÍDO 🎉' : '💀 FALHA DE CONEXÃO 💀'}
            </h2>
            
            <p className="text-gray-400 text-sm md:text-base [@media(max-height:500px)]:text-xs mb-6 [@media(max-height:500px)]:mb-2 leading-relaxed [@media(max-height:500px)]:leading-snug">
              {resultMessage}
            </p>

            <div className="bg-[#050507]/60 rounded-xl p-4 [@media(max-height:500px)]:p-2 mb-6 [@media(max-height:500px)]:mb-2 grid grid-cols-2 gap-4 [@media(max-height:500px)]:gap-2 border border-white/5 backdrop-blur-md">
              <div className="text-center border-r border-white/5">
                <span className="text-gray-500 text-xs block mb-1 [@media(max-height:500px)]:mb-0">Melhor Sequência</span>
                <strong className="text-white text-lg [@media(max-height:500px)]:text-base font-black">{bestStreak}x</strong>
              </div>
              <div className="text-center">
                <span className="text-gray-500 text-xs block mb-1 [@media(max-height:500px)]:mb-0">Desvios Cometidos</span>
                <strong className="text-white text-lg [@media(max-height:500px)]:text-base font-black">{mistakes}</strong>
              </div>
            </div>

            <button
              onClick={handleRestart}
              className="w-full py-4 [@media(max-height:500px)]:py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-bold text-base [@media(max-height:500px)]:text-sm rounded-xl transition-all transform shadow-xl cursor-pointer active:scale-98"
            >
              Iniciar Nova Rodada
            </button>
          </div>
        </div>
      )}

      {/* CSS embutido herdadável do index */}
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
      `}</style>
    </div>
  );
}