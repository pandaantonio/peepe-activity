// pages/game/tttmultiplayer.js
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import { useDiscord } from "@/contexts/DiscordContext";
import { useSocket } from "@/hooks/useSocket";
import { motion, AnimatePresence } from "framer-motion";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
};

const cellVariants = {
  initial: { scale: 0, rotate: -180 },
  animate: { scale: 1, rotate: 0 },
  exit: { scale: 0, rotate: 180 },
};

export default function TicTacToeMultiplayer() {
  const router = useRouter();
  const { auth } = useDiscord();
  const { connected, connecting, emit, on } = useSocket();

  const [board, setBoard] = useState([["", "", ""], ["", "", ""], ["", "", ""]]);
  const [currentPlayer, setCurrentPlayer] = useState("X");
  const [winner, setWinner] = useState(null);
  const [isDraw, setIsDraw] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameId, setGameId] = useState("");
  const [playerSymbol, setPlayerSymbol] = useState(null);
  const [players, setPlayers] = useState({});
  const [status, setStatus] = useState("menu");
  const [error, setError] = useState("");
  const [gameList, setGameList] = useState([]);
  const [playerName, setPlayerName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastMove, setLastMove] = useState(null);
  const [winningLine, setWinningLine] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [moveCount, setMoveCount] = useState(0);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const [score, setScore] = useState({ X: 0, O: 0 });
  const [lastWinner, setLastWinner] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [hostId, setHostId] = useState(null);
  const [resetError, setResetError] = useState("");

  const localPlayerId = useRef(null);
  const timerRef = useRef(null);
  const [timeLeft, setTimeLeft] = useState(15);

  // Inicializa ID e nome
  useEffect(() => {
    if (typeof window === "undefined") return;
    let id = localStorage.getItem("ttt_player_id");
    if (!id) {
      id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem("ttt_player_id", id);
    }
    localPlayerId.current = id;
    const name = auth?.user?.username || auth?.user?.global_name || `Jogador ${id.slice(0, 4)}`;
    setPlayerName(name);
  }, [auth]);

  // Timer
  useEffect(() => {
    if (status !== "playing" || gameOver) {
      setTimeLeft(15);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    if (currentPlayer !== playerSymbol) {
      setTimeLeft(15);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    setTimeLeft(15);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentPlayer, playerSymbol, status, gameOver]);

  // Listener game-update
  useEffect(() => {
    if (!connected) return;

    const cleanup = on("game-update", (game) => {
      setBoard(game.board || [["", "", ""], ["", "", ""], ["", "", ""]]);
      setCurrentPlayer(game.currentPlayer || "X");
      setWinner(game.winner || null);
      setIsDraw(game.isDraw || false);
      setGameOver(game.gameOver || false);
      setPlayers(game.players || {});
      setStatus(game.status || "waiting");
      setMoveCount(game.moveHistory?.length || 0);
      setScore(game.score || { X: 0, O: 0 });
      setLastWinner(game.lastWinner || null);
      setHostId(game.hostId || null);

      const localId = localStorage.getItem("ttt_player_id");
      setIsHost(localId === game.hostId);

      let oppDisc = false;
      for (const [sym, p] of Object.entries(game.players || {})) {
        if (p.id !== localId && p.connected === false) oppDisc = true;
      }
      setOpponentDisconnected(oppDisc);

      if (game.players) {
        for (const [sym, p] of Object.entries(game.players)) {
          if (p.id === localId) {
            setPlayerSymbol(sym);
            break;
          }
        }
      }

      if (game.moveHistory?.length > 0) {
        const last = game.moveHistory[game.moveHistory.length - 1];
        setLastMove({ row: last.row, col: last.col });
      } else {
        setLastMove(null);
      }

      if (game.winner && game.board) {
        const line = findWinningLine(game.winner, game.board);
        setWinningLine(line);
        if (line && game.winner === playerSymbol) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
        }
      } else {
        setWinningLine(null);
      }
    });

    return cleanup;
  }, [connected, on, playerSymbol]);

  // Listener para atualizacoes de salas em tempo real
  useEffect(() => {
    if (!connected) return;
    const cleanup = on("rooms-updated", (games) => {
      if (status === "menu") {
        setGameList(games || []);
      }
    });
    return cleanup;
  }, [connected, on, status]);

  // Busca lista de salas
  const fetchGameList = useCallback(async () => {
    if (!connected) return;
    const res = await emit("list-games");
    if (res?.games) setGameList(res.games);
  }, [connected, emit]);

  useEffect(() => {
    if (status !== "menu" || !connected) return;
    fetchGameList();
    const interval = setInterval(fetchGameList, 5000);
    return () => clearInterval(interval);
  }, [status, connected, fetchGameList]);

  // Cleanup
  useEffect(() => {
    const handleBeforeUnload = () => {
      const localId = localStorage.getItem("ttt_player_id");
      if (gameId && localId) emit("leave-game", { gameId, playerId: localId });
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      const localId = localStorage.getItem("ttt_player_id");
      if (gameId && localId) emit("leave-game", { gameId, playerId: localId });
    };
  }, [gameId, emit]);

  const findWinningLine = (player, board) => {
    const lines = [
      [[0, 0], [0, 1], [0, 2]],
      [[1, 0], [1, 1], [1, 2]],
      [[2, 0], [2, 1], [2, 2]],
      [[0, 0], [1, 0], [2, 0]],
      [[0, 1], [1, 1], [2, 1]],
      [[0, 2], [1, 2], [2, 2]],
      [[0, 0], [1, 1], [2, 2]],
      [[0, 2], [1, 1], [2, 0]],
    ];
    for (const line of lines) {
      if (line.every(([r, c]) => board[r][c] === player)) return line;
    }
    return null;
  };

  const resetToMenu = () => {
    setGameId("");
    setPlayerSymbol(null);
    setStatus("menu");
    setBoard([["", "", ""], ["", "", ""], ["", "", ""]]);
    setWinner(null);
    setIsDraw(false);
    setGameOver(false);
    setPlayers({});
    setError("");
    setJoinCode("");
    setLastMove(null);
    setWinningLine(null);
    setShowConfetti(false);
    setMoveCount(0);
    setTimeLeft(15);
    setOpponentDisconnected(false);
    setScore({ X: 0, O: 0 });
    setLastWinner(null);
    setIsHost(false);
    setHostId(null);
    setResetError("");
  };

  const createGame = async (isPrivate = false) => {
    setLoading(true);
    setError("");
    const localId = localStorage.getItem("ttt_player_id");
    const res = await emit("create-game", { playerId: localId, playerName, isPrivate });
    if (!res.success) {
      setError(res.error || "Erro ao criar sala.");
      setLoading(false);
      return;
    }
    setGameId(res.gameId);
    setPlayerSymbol(res.symbol);
    setIsHost(res.isHost);
    setStatus("waiting");
    setLoading(false);
  };

  const joinGame = async (id) => {
    const code = id || joinCode.trim();
    if (!code) { setError("Digite um código de sala válido."); return; }
    setLoading(true);
    setError("");
    const localId = localStorage.getItem("ttt_player_id");
    const res = await emit("join-game", { gameId: code.toUpperCase(), playerId: localId, playerName });
    if (!res.success) {
      setError(res.error || "Erro ao entrar na sala.");
      setLoading(false);
      return;
    }
    setGameId(res.gameId);
    setPlayerSymbol(res.symbol);
    setIsHost(res.isHost);
    setStatus("playing");
    setJoinCode("");
    setLoading(false);
  };

  const handleCellClick = async (row, col) => {
    if (gameOver) return;
    if (currentPlayer !== playerSymbol) return;
    if (board[row][col] !== "") return;
    if (status !== "playing") return;
    const localId = localStorage.getItem("ttt_player_id");
    const res = await emit("make-move", { gameId, playerId: localId, row, col });
    if (!res.success) console.error(res.error);
  };

  const resetGame = async () => {
    if (!gameId) return;
    setResetError("");
    const localId = localStorage.getItem("ttt_player_id");
    const res = await emit("reset-game", { gameId, playerId: localId });
    if (!res.success) {
      setResetError(res.error || "Erro ao iniciar revanche.");
    }
  };

  const leaveGame = async () => {
    const localId = localStorage.getItem("ttt_player_id");
    if (gameId && localId) await emit("leave-game", { gameId, playerId: localId });
    resetToMenu();
  };

  // === COPIAR COM FALLBACK ===
  const copyGameId = async () => {
    if (!gameId) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(gameId);
      } else {
        // Fallback para HTTP ou navegadores antigos
        const textArea = document.createElement("textarea");
        textArea.value = gameId;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand("copy");
        } catch (err) {
          console.error("Fallback copy failed:", err);
        }
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const getStatusText = () => {
    if (opponentDisconnected) return "⚠️ Oponente desconectado";
    if (status === "waiting") return "Aguardando jogador...";
    if (status === "ended") {
      if (winner === playerSymbol) return "🎉 Você venceu!";
      if (winner && winner !== playerSymbol) return "😢 Você perdeu!";
      if (isDraw) return "📊 Empate!";
    }
    if (currentPlayer === playerSymbol) return `Sua vez! (${timeLeft}s)`;
    return `Vez do oponente`;
  };

  const getStatusColor = () => {
    if (opponentDisconnected) return "text-yellow-400";
    if (winner === playerSymbol) return "text-emerald-400";
    if (winner && winner !== playerSymbol) return "text-red-400";
    if (isDraw) return "text-yellow-400";
    if (currentPlayer === playerSymbol) return timeLeft <= 5 ? "text-red-400 animate-pulse" : "text-emerald-400";
    return "text-zinc-400";
  };

  // Confetti
  const Confetti = () => {
    if (!showConfetti) return null;
    const particles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
      color: ["#10b981", "#8b5cf6", "#ec4899", "#f59e0b", "#3b82f6"][Math.floor(Math.random() * 5)],
    }));
    return (
      <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute w-2 h-2 rounded-full"
            style={{ backgroundColor: p.color, left: `${p.x}%`, top: "-10px" }}
            animate={{
              y: [0, typeof window !== "undefined" ? window.innerHeight + 100 : 800],
              x: [0, (Math.random() - 0.5) * 200],
              rotate: [0, 720],
              opacity: [1, 1, 0],
            }}
            transition={{ duration: 2 + Math.random() * 2, delay: p.delay, ease: "easeOut" }}
          />
        ))}
      </div>
    );
  };

  // ============ TELA DE CARREGAMENTO ============
  if (connecting && status === "menu") {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center">
        <motion.div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
        <p className="text-zinc-500 text-sm mt-4">Conectando ao servidor...</p>
      </div>
    );
  }

  // ============ TELA DE MENU ============
  if (status === "menu") {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4 py-6 relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
        </div>
        <Confetti />
        <motion.button onClick={() => router.push("/")} className="absolute top-4 left-4 z-50 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/50 px-4 py-2 rounded-xl text-sm font-medium active:scale-95 transition-all" whileTap={{ scale: 0.95 }}>← Voltar</motion.button>
        <motion.div className="w-full max-w-sm relative z-10" variants={fadeIn} initial="initial" animate="animate" transition={{ duration: 0.5 }}>
          <div className="text-center mb-8">
            <motion.div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-4 shadow-lg shadow-purple-500/20" whileHover={{ scale: 1.05, rotate: 5 }} whileTap={{ scale: 0.95 }}>
              <span className="text-3xl">⭕</span>
            </motion.div>
            <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">JOGO DA VELHA</h1>
            <p className="text-zinc-500 text-sm mt-1">Multijogador Online</p>
            {!connected && <motion.p className="text-yellow-500/80 text-xs mt-2" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}>⚠️ Reconectando...</motion.p>}
          </div>
          <AnimatePresence>
            {error && <motion.div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center" variants={scaleIn} initial="initial" animate="animate" exit="exit">{error}</motion.div>}
          </AnimatePresence>
          <motion.div className="space-y-3 mb-6">
            <motion.button onClick={() => createGame(false)} disabled={loading || !connected} className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-bold text-base transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2" whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
              {loading ? <motion.span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} /> : <span className="text-lg">🎮</span>}
              <span>Criar Sala Pública</span>
            </motion.button>
            <motion.button onClick={() => createGame(true)} disabled={loading || !connected} className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-700 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2" whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
              {loading ? <motion.span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} /> : <span className="text-lg">🔒</span>}
              <span>Criar Sala Privada</span>
            </motion.button>
          </motion.div>
          <motion.div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 mb-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <p className="text-zinc-500 text-xs text-center mb-2 uppercase tracking-wider font-medium">Entrar com código</p>
            <div className="flex gap-2">
              <input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === "Enter" && joinGame()} placeholder="Código da sala" maxLength={6} className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 text-zinc-200 text-sm placeholder-zinc-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all uppercase tracking-wider font-mono" />
              <motion.button onClick={() => joinGame()} disabled={loading || !connected || !joinCode.trim()} className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium text-sm transition-all shadow-lg shadow-purple-500/20" whileTap={{ scale: 0.95 }}>
                {loading ? "..." : "Entrar"}
              </motion.button>
            </div>
          </motion.div>
          <motion.div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"><span>🌐</span> Salas Públicas</h3>
              <span className="text-zinc-600 text-[10px]">{gameList.length} disponíveis</span>
            </div>
            <AnimatePresence mode="popLayout">
              {gameList.length === 0 ? (
                <motion.p className="text-zinc-600 text-xs text-center py-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Nenhuma sala disponível</motion.p>
              ) : (
                <div className="space-y-1.5 max-h-44 overflow-y-auto scrollbar-thin">
                  {gameList.map((game, index) => (
                    <motion.button key={game.id} onClick={() => joinGame(game.id)} disabled={loading || !connected} className="w-full flex items-center justify-between p-2.5 bg-zinc-800/40 hover:bg-zinc-800 disabled:opacity-50 rounded-lg transition-all text-left group" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ delay: index * 0.05 }} whileTap={{ scale: 0.98 }}>
                      <div className="min-w-0">
                        <p className="text-zinc-200 font-medium text-xs truncate group-hover:text-purple-300 transition-colors">Sala {game.id}</p>
                        <p className="text-zinc-500 text-[10px] truncate">{game.hostName || "Desconhecido"}</p>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-500/10 group-hover:bg-emerald-500/20 text-emerald-400 text-[10px] rounded-full font-semibold shrink-0 ml-2 transition-colors">Entrar</span>
                    </motion.button>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // ============ TELA DO JOGO ============
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4 py-4 relative overflow-hidden">
      <Confetti />
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-purple-500/3 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-emerald-500/3 rounded-full blur-3xl" />
      </div>
      <motion.button onClick={leaveGame} className="absolute top-4 left-4 z-50 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/50 px-4 py-2 rounded-xl text-sm font-medium active:scale-95 transition-all" whileTap={{ scale: 0.95 }}>← Sair</motion.button>
      <div className="w-full max-w-sm flex flex-col items-center relative z-10">
        <motion.div className="text-center mb-4 w-full" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">JOGO DA VELHA</h1>
            {status === "waiting" && <motion.span className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[10px] rounded-full font-medium" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}>Esperando...</motion.span>}
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <motion.div className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl border text-xs min-w-[90px] ${currentPlayer === "X" ? "bg-emerald-500/10 border-emerald-500/30 shadow-sm shadow-emerald-500/10" : "bg-zinc-800/60 border-zinc-700"}`} animate={currentPlayer === "X" ? { scale: [1, 1.03, 1] } : {}} transition={{ duration: 1.5, repeat: Infinity }}>
              <div className="flex items-center gap-1">
                <span className="text-emerald-400 font-bold text-sm">X</span>
                <span className="text-zinc-300 truncate max-w-[60px] text-[11px]">{players.X?.name || "..."}</span>
                {players.X?.id === localStorage.getItem("ttt_player_id") && <span className="text-[9px] text-emerald-500/60 font-medium">(você)</span>}
              </div>
              <span className="text-emerald-400 font-black text-lg leading-none">{score.X}</span>
            </motion.div>
            <div className="flex flex-col items-center px-1">
              <span className="text-zinc-600 font-bold text-[10px]">VS</span>
              <span className="text-zinc-700 text-[9px]">{score.X + score.O > 0 ? `${score.X + score.O} jgs` : ""}</span>
            </div>
            <motion.div className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl border text-xs min-w-[90px] ${currentPlayer === "O" ? "bg-red-500/10 border-red-500/30 shadow-sm shadow-red-500/10" : "bg-zinc-800/60 border-zinc-700"}`} animate={currentPlayer === "O" ? { scale: [1, 1.03, 1] } : {}} transition={{ duration: 1.5, repeat: Infinity }}>
              <div className="flex items-center gap-1">
                <span className="text-red-400 font-bold text-sm">O</span>
                <span className="text-zinc-300 truncate max-w-[60px] text-[11px]">{players.O?.name || "..."}</span>
                {players.O?.id === localStorage.getItem("ttt_player_id") && <span className="text-[9px] text-red-500/60 font-medium">(você)</span>}
              </div>
              <span className="text-red-400 font-black text-lg leading-none">{score.O}</span>
            </motion.div>
          </div>
          <motion.p className={`text-sm font-semibold ${getStatusColor()}`} key={status + currentPlayer + winner} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>{getStatusText()}</motion.p>
          {status === "playing" && !gameOver && currentPlayer === playerSymbol && (
            <div className="w-full max-w-[200px] mx-auto mt-2">
              <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div className={`h-full rounded-full ${timeLeft <= 5 ? "bg-red-500" : "bg-emerald-500"}`} initial={{ width: "100%" }} animate={{ width: `${(timeLeft / 15) * 100}%` }} transition={{ duration: 0.5, ease: "linear" }} />
              </div>
            </div>
          )}
        </motion.div>

        {/* Código da sala - FIX: usar div em vez de button para evitar conflito */}
        <motion.div
          onClick={copyGameId}
          className="flex items-center gap-1.5 mb-4 px-4 py-2 bg-zinc-900/80 border border-zinc-700/50 rounded-xl active:scale-95 transition-all group cursor-pointer select-all"
          whileTap={{ scale: 0.95 }}
          title="Clique para copiar"
        >
          <span className="text-zinc-500 text-xs">Sala</span>
          <code className="text-zinc-200 text-sm font-mono font-bold tracking-wider group-hover:text-purple-300 transition-colors">
            {gameId}
          </code>
          <motion.span className="text-xs" animate={copied ? { scale: [1, 1.3, 1] } : {}}>
            {copied ? "✅" : "📋"}
          </motion.span>
        </motion.div>

        {/* Tabuleiro */}
        <div className="relative w-full max-w-[340px] aspect-square">
          <motion.div className={`grid grid-cols-3 gap-2 bg-zinc-900/50 p-3 rounded-2xl h-full ${status === "waiting" ? "opacity-40" : ""}`} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 20 }}>
            {board.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const isLastMove = lastMove?.row === rowIndex && lastMove?.col === colIndex;
                const isWinningCell = winningLine?.some(([r, c]) => r === rowIndex && c === colIndex);
                const isMyTurn = status === "playing" && currentPlayer === playerSymbol && !cell && !gameOver;
                return (
                  <motion.button key={`${rowIndex}-${colIndex}`} onClick={() => handleCellClick(rowIndex, colIndex)} disabled={gameOver || currentPlayer !== playerSymbol || cell !== "" || status !== "playing"} className={`relative bg-zinc-900 border rounded-xl flex items-center justify-center text-4xl sm:text-5xl font-black transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${isWinningCell ? "border-emerald-500/50 bg-emerald-500/10 shadow-lg shadow-emerald-500/10" : "border-zinc-700"} ${isLastMove && !isWinningCell ? "border-purple-500/30" : ""} ${isMyTurn ? "hover:bg-zinc-800 hover:border-zinc-500 cursor-pointer" : ""}`} whileHover={isMyTurn ? { scale: 1.05 } : {}} whileTap={isMyTurn ? { scale: 0.95 } : {}}>
                    <AnimatePresence mode="wait">
                      {cell && <motion.span key={`cell-${rowIndex}-${colIndex}-${cell}`} variants={cellVariants} initial="initial" animate="animate" exit="exit" transition={{ type: "spring", stiffness: 300, damping: 15 }} className={cell === "X" ? "text-emerald-400" : "text-red-400"}>{cell}</motion.span>}
                    </AnimatePresence>
                    {isLastMove && !gameOver && <motion.div className="absolute inset-0 border-2 border-purple-500/40 rounded-xl" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity }} />}
                  </motion.button>
                );
              })
            )}
          </motion.div>

          <AnimatePresence>
            {gameOver && (
              <motion.div className="absolute inset-0 bg-black/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-3 p-4" variants={scaleIn} initial="initial" animate="animate" exit="exit">
                <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}>
                  <h2 className={`text-4xl font-black ${winner === playerSymbol ? "text-emerald-400" : winner && winner !== playerSymbol ? "text-red-400" : "text-yellow-400"}`}>
                    {winner === playerSymbol && "🎉"}
                    {winner && winner !== playerSymbol && "😢"}
                    {isDraw && "📊"}
                  </h2>
                </motion.div>
                <motion.h3 className={`text-xl font-bold ${winner === playerSymbol ? "text-emerald-400" : winner && winner !== playerSymbol ? "text-red-400" : "text-yellow-400"}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  {winner === playerSymbol && "VITÓRIA!"}
                  {winner && winner !== playerSymbol && "DERROTA!"}
                  {isDraw && "EMPATE!"}
                </motion.h3>
                <motion.div className="flex items-center gap-3 bg-zinc-900/80 rounded-xl px-4 py-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
                  <span className="text-emerald-400 font-bold">X: {score.X}</span>
                  <span className="text-zinc-600">|</span>
                  <span className="text-red-400 font-bold">O: {score.O}</span>
                </motion.div>
                <motion.p className="text-zinc-400 text-sm text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                  {winner === playerSymbol && "Você é imparável!"}
                  {winner && winner !== playerSymbol && "Não desista, tente novamente!"}
                  {isDraw && "Um duelo equilibrado!"}
                </motion.p>
                {lastWinner && (
                  <motion.p className="text-zinc-500 text-[10px] text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
                    {lastWinner === playerSymbol ? "🎯 Você começa como X na revanche!" : "🎯 Oponente começa como X na revanche"}
                  </motion.p>
                )}
                <motion.div className="flex flex-col items-center gap-2 w-full max-w-[220px] mt-1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                  {isHost ? (
                    <motion.button onClick={resetGame} className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 rounded-xl font-bold text-sm transition-all shadow-lg shadow-purple-500/20" whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                      🔄 Iniciar Revanche
                    </motion.button>
                  ) : (
                    <div className="w-full py-3.5 bg-zinc-800/60 border border-zinc-700/50 rounded-xl text-center">
                      <p className="text-zinc-500 text-xs">⏳ Aguardando host...</p>
                    </div>
                  )}
                  {resetError && <p className="text-red-400 text-[10px]">{resetError}</p>}
                </motion.div>
                <motion.button onClick={leaveGame} className="text-zinc-500 text-xs hover:text-zinc-300 transition-colors mt-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>Sair da sala</motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <motion.div className="mt-4 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <p className="text-zinc-500 text-xs">
            Você é <span className={playerSymbol === "X" ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>{playerSymbol}</span>
            <span className="text-zinc-600 mx-2">•</span>
            <span className="text-zinc-600">{moveCount} jogadas</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
