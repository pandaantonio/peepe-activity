import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';

export default function GuessNumber() {
  const router = useRouter();
  const [secretNumber, setSecretNumber] = useState(null);
  const [score, setScore] = useState(20);
  const [highscore, setHighscore] = useState(0);
  const [message, setMessage] = useState("Qual é o número correto?");
  const [gameOver, setGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [options, setOptions] = useState([]);

  const handleExit = () => {
    router.push('/');
  };

  // Gerar número secreto
  const generateSecretNumber = useCallback(() => {
    return Math.floor(Math.random() * 100) + 1;
  }, []);

  // Gerar opções (1 correta + 2 erradas)
  const generateOptions = useCallback((secret) => {
    let optionsSet = new Set([secret]);
    while (optionsSet.size < 3) {
      let wrongOption = Math.floor(Math.random() * 100) + 1;
      optionsSet.add(wrongOption);
    }
    // Embaralhar
    return Array.from(optionsSet).sort(() => Math.random() - 0.5);
  }, []);

  // Iniciar novo jogo
  const startNewGame = useCallback(() => {
    const newSecret = generateSecretNumber();
    setSecretNumber(newSecret);
    setScore(20);
    setMessage("Qual é o número correto?");
    setGameOver(false);
    setIsVictory(false);
    const newOptions = generateOptions(newSecret);
    setOptions(newOptions);
  }, [generateSecretNumber, generateOptions]);

  // Carregar highscore do localStorage
  useEffect(() => {
    const savedHighscore = localStorage.getItem('guessHighscore');
    if (savedHighscore) {
      setHighscore(parseInt(savedHighscore));
    }
    startNewGame();
  }, [startNewGame]);

  // Salvar highscore
  useEffect(() => {
    if (score > highscore) {
      setHighscore(score);
      localStorage.setItem('guessHighscore', score);
    }
  }, [score, highscore]);

  const handleGuess = useCallback((guess) => {
    if (gameOver) return;

    if (guess === secretNumber) {
      // Acertou
      setMessage("🎉 Perfeito! Acertou!");
      setGameOver(true);
      setIsVictory(true);
    } else {
      // Errou - morte súbita
      setScore(0);
      setMessage(`💥 Errado! O número era o ${secretNumber}.`);
      setGameOver(true);
      setIsVictory(false);
    }
  }, [secretNumber, gameOver]);

  const resetGame = () => {
    startNewGame();
  };

  // Tecla Enter para reiniciar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() === 'enter' && gameOver) {
        e.preventDefault();
        resetGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver]);

  const getContainerClass = () => {
    if (!gameOver) return 'bg-zinc-950';
    if (isVictory) return 'bg-emerald-950';
    return 'bg-red-950';
  };

  const getSecretBoxClass = () => {
    if (!gameOver) return 'bg-zinc-900 border-zinc-700 text-emerald-400';
    if (isVictory) return 'bg-emerald-400 text-emerald-950 border-emerald-400';
    return 'bg-red-400 text-red-950 border-red-400';
  };

  return (
    <div className={`fixed inset-0 ${getContainerClass()} flex flex-col landscape:flex-row items-center justify-center landscape:justify-center gap-6 landscape:gap-10 px-4 py-6 landscape:px-6 landscape:py-3 overflow-y-auto z-50 transition-colors duration-300`}>
      {/* Botão Voltar */}
      <button
        onClick={handleExit}
        className="fixed top-4 left-4 landscape:top-2 landscape:left-2 z-50 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 px-5 py-2.5 landscape:px-3 landscape:py-1.5 rounded-2xl landscape:rounded-xl text-sm landscape:text-xs font-medium active:scale-95 transition-all"
      >
        <span className="landscape:hidden">← Voltar ao Hub</span>
        <span className="hidden landscape:inline">← Voltar</span>
      </button>

      {/* Bloco do título + número secreto (lado esquerdo no landscape) */}
      <div className="text-center landscape:flex-shrink-0">
        <h1 className="text-2xl landscape:text-lg font-black text-white mb-4 landscape:mb-2">
          Adivinha o Número!
        </h1>
        <div className={`${getSecretBoxClass()} w-24 h-24 landscape:w-16 landscape:h-16 mx-auto flex items-center justify-center rounded-2xl landscape:rounded-xl border-2 text-4xl landscape:text-2xl font-black transition-all duration-300`}>
          {gameOver ? secretNumber : '?'}
        </div>
      </div>

      {/* Bloco interativo (lado direito no landscape) */}
      <div className="w-full max-w-[340px] landscape:max-w-[300px] landscape:flex-shrink-0">
        {/* Header com botão reiniciar e range */}
        <div className="flex justify-between items-center mb-4 landscape:mb-2 px-2">
          <button
            onClick={resetGame}
            className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-4 py-2 landscape:px-3 landscape:py-1.5 rounded-xl text-sm landscape:text-xs font-medium transition-all active:scale-95"
          >
            🔄 Reiniciar
          </button>
          <span className="text-zinc-500 text-sm landscape:text-xs">(Escolha 1 de 3)</span>
        </div>

        {/* Área interativa */}
        <div className="space-y-4 landscape:space-y-2">
          {/* Botões de opções */}
          <div className="flex gap-3 landscape:gap-2">
            {options.map((num, index) => (
              <button
                key={index}
                onClick={() => handleGuess(num)}
                disabled={gameOver}
                className={`
                  flex-1 bg-zinc-900 border-2 border-zinc-700 rounded-xl
                  text-white text-xl landscape:text-lg font-bold py-4 landscape:py-3
                  transition-all duration-200
                  hover:bg-zinc-800 hover:border-emerald-400
                  active:scale-95
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-zinc-700
                `}
              >
                {num}
              </button>
            ))}
          </div>

          {/* Mensagem e pontuação */}
          <div className="text-center">
            <p className={`text-base landscape:text-sm font-semibold mb-3 landscape:mb-2 ${
              gameOver ? (isVictory ? 'text-emerald-400' : 'text-red-400') : 'text-zinc-300'
            }`}>
              {message}
            </p>
            <div className="flex justify-center gap-8 landscape:gap-6 text-sm landscape:text-xs text-zinc-400">
              <p>💯 Pontos: <span className="text-white font-bold">{score}</span></p>
              <p>🥇 Recorde: <span className="text-emerald-400 font-bold">{highscore}</span></p>
            </div>
          </div>
        </div>

        {/* Instruções - ocultas no landscape para economizar espaço */}
        <div className="mt-8 landscape:mt-3 text-center text-xs text-zinc-600">
          <p className="landscape:hidden">Clique no número que você acha que é o correto!</p>
          <p className="mt-1">Pressione <kbd className="px-1 py-0.5 bg-zinc-800 rounded text-xs">Enter</kbd> para reiniciar após o fim do jogo</p>
        </div>
      </div>

      {/* Overlay de fim de jogo (estilizado) */}
      {gameOver && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40 p-4">
          <div className="bg-zinc-900 rounded-2xl p-8 landscape:p-5 max-w-[320px] landscape:max-w-[280px] max-h-[90vh] overflow-y-auto mx-4 text-center animate-fade-in">
            {isVictory ? (
              <>
                <div className="text-6xl landscape:text-4xl mb-4 landscape:mb-2">🎉</div>
                <h2 className="text-2xl landscape:text-xl font-bold text-emerald-400 mb-2 landscape:mb-1">VITÓRIA!</h2>
                <p className="text-zinc-300 mb-4 landscape:mb-2 text-base landscape:text-sm">
                  Você acertou o número {secretNumber}!
                </p>
                <p className="text-lg landscape:text-base mb-6 landscape:mb-3">
                  Pontuação: <span className="text-emerald-400 font-bold">{score}</span>
                </p>
              </>
            ) : (
              <>
                <div className="text-6xl landscape:text-4xl mb-4 landscape:mb-2">💀</div>
                <h2 className="text-2xl landscape:text-xl font-bold text-red-400 mb-2 landscape:mb-1">GAME OVER!</h2>
                <p className="text-zinc-300 mb-4 landscape:mb-2 text-base landscape:text-sm">
                  O número era {secretNumber}
                </p>
                <p className="text-lg landscape:text-base mb-6 landscape:mb-3">
                  Pontuação: <span className="text-red-400 font-bold">0</span>
                </p>
              </>
            )}
            <button
              onClick={resetGame}
              className="w-full bg-purple-600 hover:bg-purple-700 py-3 landscape:py-2 rounded-xl font-bold transition-all active:scale-95"
            >
              🔄 Jogar Novamente
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}