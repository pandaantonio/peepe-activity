// pages/tttmultiplayer.js
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { useSocket } from "@/hooks/useSocket";

export default function TicTacToeMultiplayer() {
  const router = useRouter();
  const { connected, connecting, emit, on } = useSocket();
  
  const [gameId, setGameId] = useState("");
  const [playerSymbol, setPlayerSymbol] = useState(null);
  const [status, setStatus] = useState("menu");
  const [error, setError] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [board, setBoard] = useState([["", "", ""], ["", "", ""], ["", "", ""]]);
  const [currentPlayer, setCurrentPlayer] = useState("X");
  const [winner, setWinner] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState({ X: 0, O: 0 });
  const [players, setPlayers] = useState({});
  const [waiting, setWaiting] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const localPlayerId = React.useRef(null);
  
  useEffect(() => {
    let id = localStorage.getItem("ttt_player_id");
    if (!id) {
      id = Math.random().toString(36).substring(2);
      localStorage.setItem("ttt_player_id", id);
    }
    localPlayerId.current = id;
  }, []);
  
  useEffect(() => {
    if (!connected) return;
    
    const unsubscribe = on("game-update", (game) => {
      console.log("Game update:", game);
      setBoard(game.board);
      setCurrentPlayer(game.currentPlayer);
      setWinner(game.winner);
      setGameOver(game.gameOver);
      setScore(game.score);
      setPlayers(game.players);
      setWaiting(false);
      
      // Se o jogador atual ficou sozinho após a saída do oponente, atualiza seu símbolo para X
      if (game.status === "waiting" && game.players.X?.id === localPlayerId.current) {
        setPlayerSymbol("X");
      }
      
      if (game.gameOver) {
        setWaiting(true);
        setTimeout(() => setWaiting(false), 3500);
      }
    });
    
    return unsubscribe;
  }, [connected, on]);
  
  const createGame = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await emit("create-game", {
        playerId: localPlayerId.current,
        playerName: "Jogador",
      });
      if (res.success) {
        setGameId(res.gameId);
        setPlayerSymbol(res.symbol);
        setStatus("playing");
      } else {
        setError("Erro ao criar sala");
      }
    } catch (err) {
      setError("Erro ao criar sala");
    }
    setLoading(false);
  };
  
  const joinGame = async () => {
    if (!joinCode) return;
    setLoading(true);
    setError("");
    try {
      const res = await emit("join-game", {
        gameId: joinCode.toUpperCase(),
        playerId: localPlayerId.current,
        playerName: "Jogador",
      });
      if (res.success) {
        setGameId(res.gameId);
        setPlayerSymbol(res.symbol);
        setStatus("playing");
        setJoinCode("");
      } else {
        setError(res.error || "Erro ao entrar na sala");
      }
    } catch (err) {
      setError("Erro ao entrar na sala");
    }
    setLoading(false);
  };
  
  const makeMove = async (row, col) => {
    if (gameOver || currentPlayer !== playerSymbol || board[row][col] !== "" || waiting) return;
    
    const res = await emit("make-move", {
      gameId,
      playerId: localPlayerId.current,
      row,
      col,
    });
    
    if (!res.success) {
      console.error("Move failed:", res.error);
    }
  };
  
  const leaveGame = useCallback(async () => {
    console.log("Leave game button clicked");
    setLoading(true);
    
    try {
      await emit("leave-game", { 
        gameId, 
        playerId: localPlayerId.current 
      });
    } catch (err) {
      console.error("Error leaving game:", err);
    }
    
    // Reseta todo o estado local para evitar lixo em nova partida
    setStatus("menu");
    setGameId("");
    setPlayerSymbol(null);
    setBoard([["", "", ""], ["", "", ""], ["", "", ""]]);
    setCurrentPlayer("X");
    setWinner(null);
    setGameOver(false);
    setScore({ X: 0, O: 0 });
    setPlayers({});
    setWaiting(false);
    setError("");
    setLoading(false);
  }, [gameId, emit]);
  
  const copyGameId = async () => {
    try {
      await navigator.clipboard.writeText(gameId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      const textArea = document.createElement("textarea");
      textArea.value = gameId;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  if (status === "menu") {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="max-w-sm w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-4 text-4xl">
              🎮
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Jogo da Velha
            </h1>
            <p className="text-zinc-500 text-sm mt-1">Multijogador Online</p>
          </div>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500 rounded-xl p-3 text-red-400 text-sm text-center mb-4">
              {error}
            </div>
          )}
          
          <button
            onClick={createGame}
            disabled={loading || !connected}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 py-4 rounded-xl font-bold text-lg transition-all mb-3"
          >
            {loading ? "⏳ Criando..." : "✨ Criar Sala"}
          </button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-zinc-950 text-zinc-500">ou</span>
            </div>
          </div>
          
          <div className="mt-6 bg-zinc-900/50 rounded-xl p-4">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Código da sala"
              maxLength={6}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 mb-3 text-center text-lg uppercase font-mono focus:outline-none focus:border-purple-500"
            />
            <button
              onClick={joinGame}
              disabled={loading || !connected || !joinCode}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 py-3 rounded-lg font-medium transition-all"
            >
              Entrar na Sala
            </button>
          </div>
          
          {connecting && (
            <p className="text-center text-zinc-500 text-sm mt-4">
              Conectando ao servidor...
            </p>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 relative">
      <button
        onClick={leaveGame}
        className="fixed top-4 left-4 z-50 bg-red-600 hover:bg-red-700 px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 shadow-lg active:scale-95"
      >
        <span className="text-lg">←</span>
        <span>Sair</span>
      </button>
      
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={copyGameId}
          className="bg-zinc-900/80 backdrop-blur-sm hover:bg-zinc-800 px-4 py-2 rounded-xl text-sm font-mono transition-all flex items-center gap-2"
        >
          <span className="text-zinc-500 text-xs">📋</span>
          <code className="text-zinc-200 font-bold">{gameId}</code>
          {copied && <span className="text-emerald-400 text-xs">Copiado!</span>}
        </button>
      </div>
      
      <div className="text-center mb-6 mt-16">
        <div className="flex gap-4 justify-center mb-4">
          <div className={`bg-zinc-900 rounded-2xl p-4 min-w-[120px] ${currentPlayer === "X" && !gameOver ? "ring-2 ring-emerald-500/50" : ""}`}>
            <div className="text-emerald-400 font-bold text-sm mb-1">❌ X</div>
            <div className="text-3xl font-bold text-white">{score.X}</div>
            <div className="text-xs text-zinc-500 truncate mt-1 max-w-[100px]">
              {players.X?.name || "Aguardando..."}
              {players.X?.id === localPlayerId.current && " (você)"}
            </div>
          </div>
          
          <div className={`bg-zinc-900 rounded-2xl p-4 min-w-[120px] ${currentPlayer === "O" && !gameOver ? "ring-2 ring-red-500/50" : ""}`}>
            <div className="text-red-400 font-bold text-sm mb-1">⭕ O</div>
            <div className="text-3xl font-bold text-white">{score.O}</div>
            <div className="text-xs text-zinc-500 truncate mt-1 max-w-[100px]">
              {players.O?.name || "Aguardando..."}
              {players.O?.id === localPlayerId.current && " (você)"}
            </div>
          </div>
        </div>
        
        <div className="bg-zinc-900/50 rounded-xl px-4 py-2 inline-block">
          <p className="text-sm font-medium">
            {Object.keys(players).length < 2 ? (
              <span className="text-yellow-500">⏳ Aguardando oponente entrar...</span>
            ) : waiting ? (
              <span className="text-purple-400">🔄 Preparando próxima partida...</span>
            ) : gameOver ? (
              winner === playerSymbol ? (
                <span className="text-emerald-400">🎉 Você venceu!</span>
              ) : winner ? (
                <span className="text-red-400">😢 Você perdeu!</span>
              ) : (
                <span className="text-yellow-400">📊 Empate!</span>
              )
            ) : currentPlayer === playerSymbol ? (
              <span className="text-emerald-400">Sua vez! ✅</span>
            ) : (
              <span className="text-zinc-400">Vez do oponente ⏳</span>
            )}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2 bg-zinc-900/50 p-4 rounded-2xl max-w-[400px] w-full">
        {board.map((row, i) => (
          row.map((cell, j) => (
            <button
              key={`${i}-${j}`}
              onClick={() => makeMove(i, j)}
              disabled={gameOver || currentPlayer !== playerSymbol || cell !== "" || waiting || Object.keys(players).length < 2}
              className="aspect-square bg-zinc-800 rounded-xl flex items-center justify-center text-5xl font-bold hover:bg-zinc-700 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              <span className={cell === "X" ? "text-emerald-400" : "text-red-400"}>
                {cell}
              </span>
            </button>
          ))
        ))}
      </div>
      
      <div className="mt-6 text-center">
        <p className="text-xs text-zinc-600">
          Você está jogando como <span className={playerSymbol === "X" ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>{playerSymbol === "X" ? "❌ X" : "⭕ O"}</span>
        </p>
      </div>
    </div>
  );
}