// pages/game/hangman.js
import { useEffect, useState, useRef } from 'react';
import { FaArrowLeft, FaRedo, FaLightbulb } from 'react-icons/fa';

export default function Hangman() {
  const [secretWord, setSecretWord] = useState('');
  const [hint, setHint] = useState('');
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [mistakes, setMistakes] = useState(0);
  const [gameActive, setGameActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showOverlay, setShowOverlay] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [isVictory, setIsVictory] = useState(false);
  
  const canvasRef = useRef(null);
  const maxMistakes = 6;

  // Busca palavra da API
  const fetchWord = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/hangman');
      const data = await response.json();
      setSecretWord(data.word.toLowerCase());
      setHint(data.hint);
      resetGame(data.word.toLowerCase());
    } catch (error) {
      console.error('Erro ao buscar palavra:', error);
      const fallbackWord = 'codigo';
      setSecretWord(fallbackWord);
      setHint('Conjunto de instruções escritas por um programador');
      resetGame(fallbackWord);
    }
    setLoading(false);
  };

  const resetGame = (word = secretWord) => {
    setGuessedLetters([]);
    setMistakes(0);
    setGameActive(true);
    setShowOverlay(false);
    setIsVictory(false);
    drawHangman(0);
  };

  const drawHangman = (mistakeCount) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#3f3f46';
    
    // Base e poste
    ctx.beginPath();
    ctx.moveTo(30, 170); ctx.lineTo(170, 170);
    ctx.moveTo(60, 170); ctx.lineTo(60, 30);
    ctx.moveTo(60, 30); ctx.lineTo(130, 30);
    ctx.moveTo(130, 30); ctx.lineTo(130, 55);
    ctx.stroke();
    
    // Boneco
    if (mistakeCount >= 1) {
      ctx.beginPath();
      ctx.arc(130, 70, 15, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (mistakeCount >= 2) {
      ctx.beginPath();
      ctx.moveTo(130, 85); ctx.lineTo(130, 130);
      ctx.stroke();
    }
    if (mistakeCount >= 3) {
      ctx.beginPath();
      ctx.moveTo(130, 95); ctx.lineTo(110, 115);
      ctx.stroke();
    }
    if (mistakeCount >= 4) {
      ctx.beginPath();
      ctx.moveTo(130, 95); ctx.lineTo(150, 115);
      ctx.stroke();
    }
    if (mistakeCount >= 5) {
      ctx.beginPath();
      ctx.moveTo(130, 130); ctx.lineTo(110, 160);
      ctx.stroke();
    }
    if (mistakeCount >= 6) {
      ctx.beginPath();
      ctx.moveTo(130, 130); ctx.lineTo(150, 160);
      ctx.stroke();
    }
  };

  const handleGuess = (letter) => {
    if (!gameActive || guessedLetters.includes(letter)) return;
    
    const newGuessed = [...guessedLetters, letter];
    setGuessedLetters(newGuessed);
    
    if (secretWord.includes(letter)) {
      // Acertou
      const isWon = secretWord.split('').every(char => newGuessed.includes(char));
      if (isWon) {
        setGameActive(false);
        setIsVictory(true);
        setResultMessage(`Você decifrou o sistema! A palavra era "${secretWord.toUpperCase()}"`);
        setShowOverlay(true);
      }
    } else {
      // Errou
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      drawHangman(newMistakes);
      
      if (newMistakes >= maxMistakes) {
        setGameActive(false);
        setIsVictory(false);
        setResultMessage(`Tentativas esgotadas! A palavra era "${secretWord.toUpperCase()}"`);
        setShowOverlay(true);
      }
    }
  };

  const getDisplayWord = () => {
    return secretWord.split('').map((char, i) => (
      <span key={i} className="mx-1 text-3xl md:text-4xl font-mono font-bold">
        {guessedLetters.includes(char) ? char.toUpperCase() : '_'}
      </span>
    ));
  };

  const handleRestart = () => {
    fetchWord();
  };

  useEffect(() => {
    fetchWord();
  }, []);

  useEffect(() => {
    drawHangman(mistakes);
  }, [mistakes]);

  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');

  return (
    <div className="min-h-screen bg-[#0f0f12]">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-[#0f0f12]/80 backdrop-blur-sm border-b border-white/5 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex gap-2">
            <a href="/" className="p-2 text-gray-400 hover:text-white transition-colors">
              <FaArrowLeft size={20} />
            </a>
            <button onClick={handleRestart} className="p-2 text-gray-400 hover:text-white transition-colors">
              <FaRedo size={20} />
            </button>
          </div>
          
          <div className="flex gap-6 text-sm">
            <div className="text-center">
              <div className="text-gray-500">Erros</div>
              <div className="text-2xl font-bold text-red-500">{mistakes}/{maxMistakes}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-500">Acertos</div>
              <div className="text-2xl font-bold text-emerald-500">
                {guessedLetters.filter(l => secretWord.includes(l)).length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - ADICIONADO padding-top para não ficar atrás do header */}
      <div className="pt-24 pb-8 flex items-center justify-center min-h-screen px-4">
        <div className="text-center w-full max-w-lg">
          {loading ? (
            <div className="text-gray-400">Carregando palavra secreta...</div>
          ) : (
            <>
              {/* Dica */}
              <div className="mb-6 px-4 py-2 bg-white/5 rounded-lg inline-flex items-center gap-2">
                <FaLightbulb size={16} className="text-amber-500" />
                <span className="text-gray-300 text-sm">{hint}</span>
              </div>

              {/* Canvas da Forca */}
              <div className="flex justify-center mb-6">
                <canvas
                  ref={canvasRef}
                  width={200}
                  height={200}
                  className="bg-white/5 rounded-xl"
                />
              </div>

              {/* Palavra */}
              <div className="mb-8 flex justify-center flex-wrap">
                {getDisplayWord()}
              </div>

              {/* Teclado */}
              <div className="grid grid-cols-7 gap-2 mb-8">
                {letters.map((letter) => {
                  const isGuessed = guessedLetters.includes(letter);
                  const isCorrect = isGuessed && secretWord.includes(letter);
                  const isWrong = isGuessed && !secretWord.includes(letter);
                  
                  return (
                    <button
                      key={letter}
                      onClick={() => handleGuess(letter)}
                      disabled={!gameActive || isGuessed}
                      className={`
                        p-3 rounded-lg font-bold uppercase transition-all
                        ${isGuessed ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10 hover:scale-95'}
                        ${isCorrect ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500' : ''}
                        ${isWrong ? 'bg-red-500/20 text-red-500 border-red-500' : ''}
                        ${!isGuessed ? 'bg-white/5 text-white border border-white/10' : ''}
                      `}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>

              {/* Overlay */}
              {showOverlay && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-20">
                  <div className="bg-[#1a1b26] rounded-2xl p-8 text-center max-w-md mx-4">
                    <h2 className={`text-3xl font-bold mb-4 ${isVictory ? 'text-emerald-500' : 'text-red-500'}`}>
                      {isVictory ? '🎉 VITÓRIA! 🎉' : '💀 GAME OVER 💀'}
                    </h2>
                    <p className="text-gray-300 mb-6">{resultMessage}</p>
                    <button
                      onClick={handleRestart}
                      className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                    >
                      Jogar Novamente
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}