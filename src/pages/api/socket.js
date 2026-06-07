// pages/api/socket.js
import { Server } from "socket.io";
import { adminDb } from "@/lib/firebaseAdmin";

const games = new Map();
const playerSockets = new Map();
const playerGames = new Map();

function checkVictory(player, board) {
  for (let i = 0; i < 3; i++) {
    if (board[i][0] === player && board[i][1] === player && board[i][2] === player) return true;
    if (board[0][i] === player && board[1][i] === player && board[2][i] === player) return true;
  }
  if (board[0][0] === player && board[1][1] === player && board[2][2] === player) return true;
  if (board[0][2] === player && board[1][1] === player && board[2][0] === player) return true;
  return false;
}

function getEmptyCells(board) {
  const empty = [];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[i][j] === "") empty.push({ row: i, col: j });
    }
  }
  return empty;
}

function generateGameId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "";
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

function getPublicGames() {
  const publicGames = [];
  for (const [id, game] of games) {
    if (game.status === "waiting" && !game.isPrivate) {
      publicGames.push({
        id,
        hostName: game.players?.X?.name || "Desconhecido",
        createdAt: game.createdAt,
      });
    }
  }
  return publicGames.sort((a, b) => b.createdAt - a.createdAt).slice(0, 20);
}

export default function handler(req, res) {
  if (res.socket.server.io) {
    res.end();
    return;
  }

  const io = new Server(res.socket.server, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: { origin: "*" },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  res.socket.server.io = io;

  io.on("connection", (socket) => {
    console.log("[Socket] Conectado:", socket.id);

    // === CRIAR SALA ===
    socket.on("create-game", async ({ playerId, playerName, isPrivate }, callback) => {
      try {
        const oldGameId = playerGames.get(playerId);
        if (oldGameId) {
          await leaveGameInternal(oldGameId, playerId, io);
        }

        let gameId;
        do {
          gameId = generateGameId();
        } while (games.has(gameId));

        const game = {
          id: gameId,
          board: [["", "", ""], ["", "", ""], ["", "", ""]],
          currentPlayer: "X",
          winner: null,
          isDraw: false,
          gameOver: false,
          status: "waiting",
          createdAt: Date.now(),
          isPrivate: isPrivate || false,
          hostId: playerId,
          players: {
            X: {
              id: playerId,
              name: playerName || "Jogador",
              symbol: "X",
              socketId: socket.id,
              connected: true,
            },
          },
          moveHistory: [],
          lastMoveAt: null,
          score: { X: 0, O: 0 },
          lastWinner: null,
        };

        games.set(gameId, game);
        playerSockets.set(playerId, socket.id);
        playerGames.set(playerId, gameId);
        socket.join(gameId);

        try {
          await adminDb.ref(`ttt_games/${gameId}`).set(game);
        } catch (e) {
          console.error("[Firebase] Erro ao salvar:", e);
        }

        // === EMITE PARA TODOS NO MENU QUE UMA NOVA SALA FOI CRIADA ===
        if (!isPrivate) {
          io.emit("rooms-updated", getPublicGames());
        }

        callback({ success: true, gameId, symbol: "X", isHost: true });
        console.log("[Game] Sala criada:", gameId, "por", playerName, isPrivate ? "(privada)" : "(publica)");
      } catch (err) {
        console.error("[Error] create-game:", err);
        callback({ success: false, error: "Erro ao criar sala." });
      }
    });

    // === ENTRAR NA SALA ===
    socket.on("join-game", async ({ gameId, playerId, playerName }, callback) => {
      try {
        gameId = gameId?.toUpperCase()?.trim();
        if (!gameId) {
          callback({ success: false, error: "Código inválido." });
          return;
        }

        let game = games.get(gameId);

        if (!game) {
          try {
            const snap = await adminDb.ref(`ttt_games/${gameId}`).once("value");
            const data = snap.val();
            if (data) {
              game = data;
              games.set(gameId, game);
            }
          } catch (e) {
            console.error("[Firebase] Erro ao buscar:", e);
          }
        }

        if (!game) {
          callback({ success: false, error: "Sala não encontrada." });
          return;
        }

        if (game.status !== "waiting") {
          callback({ success: false, error: "Jogo já começou ou terminou." });
          return;
        }

        const playerCount = Object.keys(game.players).length;
        if (playerCount >= 2) {
          callback({ success: false, error: "Sala cheia." });
          return;
        }

        for (const [sym, p] of Object.entries(game.players)) {
          if (p.id === playerId) {
            p.socketId = socket.id;
            p.connected = true;
            playerSockets.set(playerId, socket.id);
            playerGames.set(playerId, gameId);
            socket.join(gameId);

            if (Object.keys(game.players).length === 2) {
              game.status = "playing";
            }

            games.set(gameId, game);
            io.to(gameId).emit("game-update", game);
            callback({ success: true, gameId, symbol: sym, isHost: playerId === game.hostId });
            return;
          }
        }

        const symbol = game.players.X ? "O" : "X";
        game.players[symbol] = {
          id: playerId,
          name: playerName || "Jogador",
          symbol,
          socketId: socket.id,
          connected: true,
        };

        playerSockets.set(playerId, socket.id);
        playerGames.set(playerId, gameId);
        socket.join(gameId);

        if (Object.keys(game.players).length === 2) {
          game.status = "playing";
          game.lastMoveAt = Date.now();
          console.log("[Game] Jogo iniciado:", gameId);
        }

        games.set(gameId, game);

        try {
          await adminDb.ref(`ttt_games/${gameId}`).set(game);
        } catch (e) {
          console.error("[Firebase] Erro ao salvar:", e);
        }

        io.to(gameId).emit("game-update", game);
        callback({ success: true, gameId, symbol, isHost: playerId === game.hostId });
        console.log("[Game]", playerName, "entrou na sala", gameId, "como", symbol);
      } catch (err) {
        console.error("[Error] join-game:", err);
        callback({ success: false, error: "Erro ao entrar na sala." });
      }
    });

    // === FAZER JOGADA ===
    socket.on("make-move", async ({ gameId, playerId, row, col }, callback) => {
      try {
        const game = games.get(gameId);
        if (!game) {
          callback({ success: false, error: "Sala não encontrada." });
          return;
        }

        if (game.status !== "playing") {
          callback({ success: false, error: "Jogo não está em andamento." });
          return;
        }

        if (game.gameOver) {
          callback({ success: false, error: "Jogo já terminou." });
          return;
        }

        let playerSymbol = null;
        for (const [sym, p] of Object.entries(game.players)) {
          if (p.id === playerId) {
            playerSymbol = sym;
            break;
          }
        }

        if (!playerSymbol) {
          callback({ success: false, error: "Jogador não encontrado." });
          return;
        }

        if (game.currentPlayer !== playerSymbol) {
          callback({ success: false, error: "Não é sua vez." });
          return;
        }

        if (row < 0 || row > 2 || col < 0 || col > 2 || game.board[row][col] !== "") {
          callback({ success: false, error: "Jogada inválida." });
          return;
        }

        game.board[row][col] = playerSymbol;
        game.moveHistory.push({ player: playerSymbol, row, col, at: Date.now() });
        game.lastMoveAt = Date.now();

        const hasWinner = checkVictory(playerSymbol, game.board);
        const emptyCells = getEmptyCells(game.board);
        const isGameDraw = emptyCells.length === 0 && !hasWinner;
        const isGameOver = hasWinner || isGameDraw;

        game.currentPlayer = playerSymbol === "X" ? "O" : "X";

        if (hasWinner) {
          game.winner = playerSymbol;
          game.score[playerSymbol] = (game.score[playerSymbol] || 0) + 1;
          game.lastWinner = playerSymbol;
        }
        game.isDraw = isGameDraw;
        game.gameOver = isGameOver;
        game.status = isGameOver ? "ended" : "playing";

        games.set(gameId, game);

        try {
          await adminDb.ref(`ttt_games/${gameId}`).set(game);
        } catch (e) {
          console.error("[Firebase] Erro ao salvar:", e);
        }

        io.to(gameId).emit("game-update", game);
        callback({ success: true });
      } catch (err) {
        console.error("[Error] make-move:", err);
        callback({ success: false, error: "Erro ao processar jogada." });
      }
    });

    // === REVANCHE - SÓ O HOST ===
    socket.on("reset-game", async ({ gameId, playerId }, callback) => {
      try {
        const game = games.get(gameId);
        if (!game) {
          callback({ success: false, error: "Sala não encontrada." });
          return;
        }

        if (playerId !== game.hostId) {
          callback({ success: false, error: "Apenas o dono da sala pode iniciar a revanche." });
          return;
        }

        // Quem ganhou vira X e começa
        const winnerSwapped = game.lastWinner === "O";

        if (winnerSwapped && game.players.O) {
          const oldX = game.players.X;
          const oldO = game.players.O;
          game.players = {
            X: { ...oldO, symbol: "X" },
            O: oldX ? { ...oldX, symbol: "O" } : undefined,
          };
          // Atualiza host se necessário
          if (game.hostId === oldX?.id) {
            game.hostId = oldO.id;
          }
        }

        game.board = [["", "", ""], ["", "", ""], ["", "", ""]];
        game.currentPlayer = "X";
        game.winner = null;
        game.isDraw = false;
        game.gameOver = false;
        game.status = "playing";
        game.moveHistory = [];
        game.lastMoveAt = Date.now();

        games.set(gameId, game);

        try {
          await adminDb.ref(`ttt_games/${gameId}`).set(game);
        } catch (e) {
          console.error("[Firebase] Erro ao salvar:", e);
        }

        io.to(gameId).emit("game-update", game);
        callback({ success: true });
      } catch (err) {
        console.error("[Error] reset-game:", err);
        callback({ success: false, error: "Erro ao resetar jogo." });
      }
    });

    // === SAIR DA SALA ===
    socket.on("leave-game", async ({ gameId, playerId }) => {
      await leaveGameInternal(gameId, playerId, io);
    });

    // === LISTAR SALAS ===
    socket.on("list-games", (callback) => {
      callback({ games: getPublicGames() });
    });

    // === DISCONNECT ===
    socket.on("disconnect", async () => {
      console.log("[Socket] Desconectado:", socket.id);

      for (const [playerId, socketId] of playerSockets) {
        if (socketId === socket.id) {
          const gameId = playerGames.get(playerId);
          if (gameId) {
            const game = games.get(gameId);
            if (game) {
              for (const [sym, p] of Object.entries(game.players)) {
                if (p.id === playerId) {
                  p.connected = false;
                  break;
                }
              }
              io.to(gameId).emit("game-update", game);
              games.set(gameId, game);
            }
          }
          break;
        }
      }
    });
  });

  res.end();
}

async function leaveGameInternal(gameId, playerId, io) {
  const game = games.get(gameId);
  if (!game) return;

  let symbolRemoved = null;
  for (const [sym, p] of Object.entries(game.players)) {
    if (p.id === playerId) {
      symbolRemoved = sym;
      delete game.players[sym];
      break;
    }
  }

  if (!symbolRemoved) return;

  playerSockets.delete(playerId);
  playerGames.delete(playerId);

  const remaining = Object.keys(game.players).length;
  if (remaining === 0) {
    games.delete(gameId);
    try {
      await adminDb.ref(`ttt_games/${gameId}`).remove();
    } catch (e) {
      console.error("[Firebase] Erro ao remover:", e);
    }
    // Atualiza lista de salas publicas
    io.emit("rooms-updated", getPublicGames());
  } else {
    game.status = "waiting";
    game.board = [["", "", ""], ["", "", ""], ["", "", ""]];
    game.currentPlayer = "X";
    game.winner = null;
    game.isDraw = false;
    game.gameOver = false;
    game.moveHistory = [];
    game.score = { X: 0, O: 0 };
    game.lastWinner = null;
    if (game.hostId === playerId) {
      const remainingSymbol = Object.keys(game.players)[0];
      game.hostId = game.players[remainingSymbol].id;
    }
    games.set(gameId, game);

    try {
      await adminDb.ref(`ttt_games/${gameId}`).set(game);
    } catch (e) {
      console.error("[Firebase] Erro ao salvar:", e);
    }

    io.to(gameId).emit("game-update", game);
  }
}
