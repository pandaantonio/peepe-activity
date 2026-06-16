// pages/game/ttt/multiplayer.js
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import { FaArrowLeft, FaCopy, FaCheck, FaRedo, FaSpinner } from "react-icons/fa";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function checkWinner(board) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: [a, b, c] };
    }
  }
  if (board.every(Boolean)) return { winner: "draw", line: [] };
  return null;
}

// ─── API helpers ──────────────────────────────────────────────────────────────
async function apiCreateRoom(playerName) {
  const res = await fetch("/api/ttt/room", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerName }),
  });
  if (!res.ok) throw new Error((await res.json()).error || "Erro ao criar sala");
  return res.json(); // { roomId, symbol }
}

async function apiJoinRoom(roomId, playerName) {
  const res = await fetch(`/api/ttt/room/${roomId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerName }),
  });
  if (!res.ok) throw new Error((await res.json()).error || "Erro ao entrar na sala");
  return res.json(); // { roomId, symbol }
}

async function apiGetRoom(roomId) {
  const res = await fetch(`/api/ttt/room/${roomId}`);
  if (!res.ok) throw new Error((await res.json()).error || "Sala não encontrada");
  return res.json();
}

async function apiMove(roomId, index, symbol) {
  const res = await fetch(`/api/ttt/room/${roomId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ index, symbol }),
  });
  if (!res.ok) throw new Error((await res.json()).error || "Jogada inválida");
  return res.json();
}

async function apiRematch(roomId) {
  const res = await fetch(`/api/ttt/room/${roomId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error((await res.json()).error || "Erro na revanche");
  return res.json();
}

async function apiDeleteRoom(roomId) {
  await fetch("/api/ttt/room", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomId }),
  });
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const S = {
  root: {
    minHeight: "100vh",
    background: "#0d0d1a",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    color: "#e2e8f0",
    padding: "20px",
    position: "relative",
    overflow: "hidden",
  },
  blob1: {
    position: "fixed", top: "-15%", left: "-10%",
    width: "500px", height: "500px", borderRadius: "50%",
    background: "radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)",
    pointerEvents: "none", zIndex: 0,
  },
  blob2: {
    position: "fixed", bottom: "-15%", right: "-10%",
    width: "500px", height: "500px", borderRadius: "50%",
    background: "radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)",
    pointerEvents: "none", zIndex: 0,
  },
  topbar: {
    position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
    padding: "12px 20px",
    display: "flex", alignItems: "center", gap: "12px",
    background: "rgba(13,13,26,0.85)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
  },
  iconBtn: {
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    color: "#94a3b8",
    padding: "8px 10px",
    cursor: "pointer",
    display: "flex", alignItems: "center",
  },
  badge: {
    background: "rgba(124,58,237,0.2)",
    border: "1px solid rgba(124,58,237,0.4)",
    borderRadius: "6px",
    padding: "4px 12px",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.1em",
    color: "#a78bfa",
    textTransform: "uppercase",
  },
  card: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "20px",
    backdropFilter: "blur(16px)",
    padding: "36px",
    width: "100%",
    maxWidth: "420px",
    position: "relative",
    zIndex: 1,
  },
  title: { fontSize: "22px", fontWeight: 700, marginBottom: "8px", color: "#f1f5f9" },
  sub: { fontSize: "13px", color: "#64748b", marginBottom: "28px" },
  input: {
    width: "100%",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "10px",
    color: "#e2e8f0",
    fontSize: "15px",
    padding: "12px 16px",
    outline: "none",
    boxSizing: "border-box",
    marginBottom: "12px",
  },
  inputCode: {
    letterSpacing: "0.2em",
    fontWeight: 700,
    fontFamily: "monospace",
    fontSize: "18px",
    textTransform: "uppercase",
  },
  btn: {
    width: "100%",
    padding: "13px",
    borderRadius: "10px",
    border: "none",
    fontWeight: 700,
    fontSize: "15px",
    cursor: "pointer",
    transition: "opacity 0.2s",
    letterSpacing: "0.04em",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  btnPrimary: {
    background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
    color: "#fff",
    boxShadow: "0 0 20px rgba(124,58,237,0.3)",
    marginBottom: "12px",
  },
  btnSecondary: {
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#94a3b8",
    marginBottom: "12px",
  },
  btnGhost: {
    background: "transparent",
    border: "none",
    color: "#475569",
    fontSize: "13px",
  },
  divider: {
    display: "flex", alignItems: "center", gap: "12px",
    margin: "4px 0 16px",
    color: "#334155", fontSize: "12px", fontWeight: 600,
  },
  divLine: { flex: 1, height: "1px", background: "rgba(255,255,255,0.07)" },
  roomCodeBox: {
    background: "rgba(124,58,237,0.1)",
    border: "1px solid rgba(124,58,237,0.3)",
    borderRadius: "14px",
    padding: "20px",
    textAlign: "center",
    marginBottom: "20px",
  },
  roomCodeLabel: {
    fontSize: "10px", color: "#7c3aed", fontWeight: 700,
    letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "8px",
  },
  roomCode: {
    fontSize: "38px", fontWeight: 900, letterSpacing: "0.3em",
    color: "#a78bfa", fontFamily: "monospace",
  },
  // Game
  gameWrap: {
    display: "flex", flexDirection: "column", alignItems: "center",
    gap: "16px", position: "relative", zIndex: 1, width: "100%", maxWidth: "440px",
  },
  scoreboard: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    width: "100%", gap: "10px",
  },
  playerCard: (active, rgb) => ({
    flex: 1, padding: "14px 12px", borderRadius: "14px", textAlign: "center",
    background: active ? `rgba(${rgb},0.12)` : "rgba(255,255,255,0.03)",
    border: `1px solid ${active ? `rgba(${rgb},0.4)` : "rgba(255,255,255,0.07)"}`,
    boxShadow: active ? `0 0 20px rgba(${rgb},0.15)` : "none",
    transition: "all 0.3s",
  }),
  playerSymbol: (rgb) => ({
    fontSize: "26px", fontWeight: 900, color: `rgb(${rgb})`, fontFamily: "monospace",
  }),
  playerName: {
    fontSize: "10px", color: "#64748b", fontWeight: 600,
    marginTop: "2px", letterSpacing: "0.05em",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  playerScore: (rgb) => ({
    fontSize: "20px", fontWeight: 800, color: `rgb(${rgb})`, marginTop: "4px",
  }),
  vsChip: {
    padding: "8px 10px", borderRadius: "10px", fontSize: "12px", fontWeight: 800,
    color: "#475569", background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.06)", flexShrink: 0,
  },
  statusBar: (rgb) => ({
    width: "100%", padding: "10px 20px", borderRadius: "10px", textAlign: "center",
    background: `rgba(${rgb},0.1)`, border: `1px solid rgba(${rgb},0.25)`,
    color: `rgb(${rgb})`, fontWeight: 700, fontSize: "14px",
  }),
  grid: {
    display: "grid", gridTemplateColumns: "repeat(3,1fr)",
    gap: "10px", width: "100%",
  },
  cell: (value, winning, clickable) => {
    const xRgb = "124,58,237";
    const oRgb = "6,182,212";
    const rgb = value === "X" ? xRgb : value === "O" ? oRgb : null;
    return {
      aspectRatio: "1", borderRadius: "14px",
      cursor: clickable ? "pointer" : "default",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "44px", fontWeight: 900, fontFamily: "monospace",
      background: winning
        ? `rgba(${rgb},0.25)`
        : value ? `rgba(${rgb},0.1)` : "rgba(255,255,255,0.04)",
      border: winning
        ? `2px solid rgba(${rgb},0.8)`
        : value ? `1px solid rgba(${rgb},0.3)` : "1px solid rgba(255,255,255,0.08)",
      color: value === "X" ? "rgb(124,58,237)" : value === "O" ? "rgb(6,182,212)" : "transparent",
      boxShadow: winning ? `0 0 28px rgba(${rgb},0.45)` : "none",
      transition: "all 0.25s ease",
      userSelect: "none",
    };
  },
  resultOverlay: {
    position: "absolute", inset: 0, borderRadius: "14px",
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    background: "rgba(13,13,26,0.9)", backdropFilter: "blur(8px)",
    zIndex: 10, gap: "14px",
  },
  resultEmoji: { fontSize: "52px", lineHeight: 1 },
  resultTitle: { fontSize: "26px", fontWeight: 900, color: "#f1f5f9" },
  resultSub: { fontSize: "13px", color: "#64748b", textAlign: "center", padding: "0 20px" },
};

// ─── Sub-componentes ──────────────────────────────────────────────────────────
function Lobby({ onCreateRoom, onJoinRoom, loading }) {
  const [playerName, setPlayerName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [step, setStep] = useState("name"); // name | actions

  if (step === "name") {
    return (
      <div style={S.card}>
        <div style={S.title}>Multiplayer ao Vivo</div>
        <div style={S.sub}>Firebase · Tempo Real · 2 Jogadores</div>
        <input
          style={S.input}
          placeholder="Seu apelido..."
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && playerName.trim() && setStep("actions")}
          maxLength={18}
          autoFocus
        />
        <button
          style={{ ...S.btn, ...S.btnPrimary, opacity: playerName.trim() ? 1 : 0.5 }}
          onClick={() => playerName.trim() && setStep("actions")}
        >
          Continuar →
        </button>
      </div>
    );
  }

  return (
    <div style={S.card}>
      <div style={S.title}>Olá, {playerName}!</div>
      <div style={S.sub}>Crie uma sala ou entre em uma existente.</div>

      <button
        style={{ ...S.btn, ...S.btnPrimary, opacity: loading ? 0.7 : 1 }}
        onClick={() => onCreateRoom(playerName)}
        disabled={loading}
      >
        {loading ? <><FaSpinner style={{ animation: "spin 1s linear infinite" }} /> Criando…</> : "+ Criar Nova Sala"}
      </button>

      <div style={S.divider}>
        <div style={S.divLine} /> ou <div style={S.divLine} />
      </div>

      <input
        style={{ ...S.input, ...S.inputCode }}
        placeholder="CÓDIGO DA SALA"
        value={joinCode}
        onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
        maxLength={6}
      />
      <button
        style={{ ...S.btn, ...S.btnSecondary, opacity: joinCode.length === 6 && !loading ? 1 : 0.5 }}
        onClick={() => onJoinRoom(joinCode, playerName)}
        disabled={joinCode.length < 6 || loading}
      >
        {loading ? <><FaSpinner style={{ animation: "spin 1s linear infinite" }} /> Entrando…</> : "Entrar na Sala"}
      </button>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

function WaitingRoom({ roomId, onCancel }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    try {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(roomId).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }).catch(() => fallbackCopy());
      } else {
        fallbackCopy();
      }
    } catch {
      fallbackCopy();
    }
  };

  const fallbackCopy = () => {
    // Fallback: cria um input temporário e usa execCommand
    const el = document.createElement("input");
    el.value = roomId;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.focus();
    el.select();
    try {
      document.execCommand("copy");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
    document.body.removeChild(el);
  };

  return (
    <div style={S.card}>
      <div style={S.title}>Sala Criada!</div>
      <div style={S.sub}>Compartilhe o código abaixo com seu oponente.</div>

      <div style={S.roomCodeBox}>
        <div style={S.roomCodeLabel}>Código da Sala</div>
        <div style={S.roomCode}>{roomId}</div>
      </div>

      <button style={{ ...S.btn, ...S.btnSecondary }} onClick={copy}>
        {copied ? <><FaCheck size={12} /> Copiado!</> : <><FaCopy size={12} /> Copiar Código</>}
      </button>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", color: "#64748b", fontSize: "13px", margin: "20px 0 16px" }}>
        <FaSpinner style={{ animation: "spin 1s linear infinite" }} />
        Aguardando oponente entrar…
      </div>

      <button style={{ ...S.btn, ...S.btnGhost }} onClick={onCancel}>
        Cancelar
      </button>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

function GameBoard({ gameState, mySymbol, onMove, onRematch, onLeave }) {
  const board = Array.isArray(gameState.board) ? gameState.board : Array.from({ length: 9 }, (_, i) => gameState.board?.[i] || "");
  const { currentTurn, result, scores, players } = gameState;
  const winResult = result ? checkWinner(board) : null;
  const winLine = winResult?.line || [];

  const xRgb = "124,58,237";
  const oRgb = "6,182,212";

  const isMyTurn = currentTurn === mySymbol;
  const opponentSymbol = mySymbol === "X" ? "O" : "X";
  const myData = players?.[mySymbol] || {};
  const opponentData = players?.[opponentSymbol] || {};

  let statusText = "";
  let statusRgb = "100,116,139";

  if (result === "draw") {
    statusText = "Empate!";
    statusRgb = "251,191,36";
  } else if (result === mySymbol) {
    statusText = "Você venceu! 🎉";
    statusRgb = mySymbol === "X" ? xRgb : oRgb;
  } else if (result) {
    statusText = `${opponentData.name || "Oponente"} venceu.`;
    statusRgb = "248,113,113";
  } else if (isMyTurn) {
    statusText = "Sua vez";
    statusRgb = mySymbol === "X" ? xRgb : oRgb;
  } else {
    statusText = `Vez de ${opponentData.name || "Oponente"}…`;
    statusRgb = opponentSymbol === "X" ? xRgb : oRgb;
  }

  return (
    <div style={S.gameWrap}>
      {/* Placar */}
      <div style={S.scoreboard}>
        <div style={S.playerCard(isMyTurn && !result, mySymbol === "X" ? xRgb : oRgb)}>
          <div style={S.playerSymbol(mySymbol === "X" ? xRgb : oRgb)}>{mySymbol}</div>
          <div style={S.playerName}>{myData.name || "Você"} (você)</div>
          <div style={S.playerScore(mySymbol === "X" ? xRgb : oRgb)}>{scores?.[mySymbol] || 0}</div>
        </div>
        <div style={S.vsChip}>VS</div>
        <div style={S.playerCard(!isMyTurn && !result, opponentSymbol === "X" ? xRgb : oRgb)}>
          <div style={S.playerSymbol(opponentSymbol === "X" ? xRgb : oRgb)}>{opponentSymbol}</div>
          <div style={S.playerName}>{opponentData.name || "Aguardando…"}</div>
          <div style={S.playerScore(opponentSymbol === "X" ? xRgb : oRgb)}>{scores?.[opponentSymbol] || 0}</div>
        </div>
      </div>

      {/* Status */}
      <div style={S.statusBar(statusRgb)}>{statusText}</div>

      {/* Tabuleiro */}
      <div style={{ width: "100%", position: "relative" }}>
        <div style={S.grid}>
          {board.map((cell, i) => (
            <div
              key={i}
              style={S.cell(cell, winLine.includes(i), !cell && isMyTurn && !result)}
              onClick={() => !cell && isMyTurn && !result && onMove(i)}
            >
              {cell}
            </div>
          ))}
        </div>

        {/* Overlay de resultado */}
        {result && (
          <div style={S.resultOverlay}>
            <div style={S.resultEmoji}>
              {result === "draw" ? "🤝" : result === mySymbol ? "🏆" : "💀"}
            </div>
            <div style={S.resultTitle}>
              {result === "draw" ? "Empate!" : result === mySymbol ? "Vitória!" : "Derrota!"}
            </div>
            <div style={S.resultSub}>
              {result === "draw"
                ? "Nenhum dos dois cede terreno."
                : result === mySymbol
                ? "Brilhante. O algoritmo curva-se a você."
                : `${opponentData.name || "Oponente"} levou essa.`}
            </div>
            <button
              style={{ ...S.btn, ...S.btnPrimary, width: "auto", padding: "11px 24px" }}
              onClick={onRematch}
            >
              <FaRedo size={12} /> Revanche
            </button>
          </div>
        )}
      </div>

      <button style={{ ...S.btn, ...S.btnGhost, marginTop: "4px" }} onClick={onLeave}>
        Abandonar Sala
      </button>
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function MultiplayerTTT() {
  const router = useRouter();

  const [phase, setPhase] = useState("lobby"); // lobby | waiting | game
  const [roomId, setRoomId] = useState(null);
  const [mySymbol, setMySymbol] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const pollRef = useRef(null);

  // Polling: busca o estado da sala a cada 1.5s
  useEffect(() => {
    if (!roomId) return;

    const poll = async () => {
      try {
        const data = await apiGetRoom(roomId);
        setGameState(data);

        // Oponente entrou → vai pro jogo
        if (data.players?.X && data.players?.O && phase === "waiting") {
          setPhase("game");
        }
      } catch (err) {
        // Sala sumiu (oponente saiu)
        if (err.message === "Sala não encontrada") {
          clearInterval(pollRef.current);
          setError("A sala foi encerrada.");
          setPhase("lobby");
          setRoomId(null);
        }
      }
    };

    poll(); // executa imediatamente
    pollRef.current = setInterval(poll, 1500);

    return () => clearInterval(pollRef.current);
  }, [roomId, phase]);

  const handleCreateRoom = useCallback(async (playerName) => {
    setLoading(true);
    setError("");
    try {
      const { roomId: id, symbol } = await apiCreateRoom(playerName);
      setRoomId(id);
      setMySymbol(symbol);
      setPhase("waiting");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleJoinRoom = useCallback(async (code, playerName) => {
    setLoading(true);
    setError("");
    try {
      const { roomId: id, symbol } = await apiJoinRoom(code, playerName);
      setRoomId(id);
      setMySymbol(symbol);
      setPhase("game");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleMove = useCallback(async (index) => {
    if (!roomId || !mySymbol) return;
    try {
      await apiMove(roomId, index, mySymbol);
    } catch (err) {
      setError(err.message);
    }
  }, [roomId, mySymbol]);

  const handleRematch = useCallback(async () => {
    if (!roomId) return;
    try {
      await apiRematch(roomId);
    } catch (err) {
      setError(err.message);
    }
  }, [roomId]);

  const handleCancel = useCallback(async () => {
    clearInterval(pollRef.current);
    if (roomId) await apiDeleteRoom(roomId);
    setRoomId(null);
    setMySymbol(null);
    setPhase("lobby");
  }, [roomId]);

  const handleLeave = useCallback(async () => {
    clearInterval(pollRef.current);
    if (roomId) await apiDeleteRoom(roomId);
    setRoomId(null);
    setMySymbol(null);
    setGameState(null);
    setPhase("lobby");
  }, [roomId]);

  return (
    <div style={S.root}>
      <div style={S.blob1} />
      <div style={S.blob2} />

      {/* Topbar */}
      <div style={S.topbar}>
        <button style={S.iconBtn} onClick={() => router.push("/game/ttt")}>
          <FaArrowLeft size={15} />
        </button>
        <div style={S.badge}>Jogo da Velha · Multiplayer</div>
        {roomId && (
          <div style={{ marginLeft: "auto", fontSize: "12px", color: "#475569", fontFamily: "monospace", fontWeight: 700 }}>
            SALA: {roomId}
          </div>
        )}
      </div>

      {/* Toast de erro */}
      {error && (
        <div style={{
          position: "fixed", top: "68px", left: "50%", transform: "translateX(-50%)",
          background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.35)",
          color: "#fca5a5", borderRadius: "10px", padding: "10px 20px",
          fontSize: "13px", zIndex: 200, whiteSpace: "nowrap",
          cursor: "pointer",
        }} onClick={() => setError("")}>
          ⚠️ {error} &nbsp;✕
        </div>
      )}

      {/* Conteúdo */}
      <div style={{ marginTop: "64px", display: "flex", justifyContent: "center", width: "100%" }}>
        {phase === "lobby" && (
          <Lobby onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} loading={loading} />
        )}
        {phase === "waiting" && (
          <WaitingRoom roomId={roomId} onCancel={handleCancel} />
        )}
        {phase === "game" && gameState && (
          <GameBoard
            gameState={gameState}
            mySymbol={mySymbol}
            onMove={handleMove}
            onRematch={handleRematch}
            onLeave={handleLeave}
          />
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}