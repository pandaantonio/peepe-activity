// pages/api/socket.js
import { Server } from "socket.io";

export const config = {
  api: {
    bodyParser: false,
  },
};

const games = new Map();

function generateGameId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function handler(req, res) {
  if (res.socket.server.io) {
    console.log("Socket already running");
    res.end();
    return;
  }

  const io = new Server(res.socket.server, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: {
      origin: "*",
      credentials: true,
    },
  });

  res.socket.server.io = io;

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // CREATE GAME
    socket.on("create-game", ({ playerId, playerName }, callback) => {
      const gameId = generateGameId();
      
      const game = {
        id: gameId,
        board: [["", "", ""], ["", "", ""], ["", "", ""]],
        currentPlayer: "X",
        winner: null,
        isDraw: false,
        gameOver: false,
        status: "waiting",
        players: {
          X: {
            id: playerId,
            name: playerName,
            socketId: socket.id,
          },
        },
        score: { X: 0, O: 0 },
        lastWinner: null,
      };
      
      games.set(gameId, game);
      socket.join(gameId);
      
      socket.gameId = gameId;
      socket.playerId = playerId;
      socket.playerSymbol = "X";
      
      console.log(`Game created: ${gameId} by ${playerName}`);
      callback({ success: true, gameId, symbol: "X" });
    });

    // JOIN GAME
    socket.on("join-game", ({ gameId, playerId, playerName }, callback) => {
      const game = games.get(gameId);
      
      if (!game) {
        callback({ success: false, error: "Sala não encontrada" });
        return;
      }
      
      if (game.status !== "waiting") {
        callback({ success: false, error: "Jogo já começou" });
        return;
      }
      
      const symbol = "O";
      game.players[symbol] = {
        id: playerId,
        name: playerName,
        socketId: socket.id,
      };
      game.status = "playing";
      
      socket.join(gameId);
      
      socket.gameId = gameId;
      socket.playerId = playerId;
      socket.playerSymbol = symbol;
      
      games.set(gameId, game);
      
      console.log(`Player ${playerName} joined game ${gameId} as ${symbol}`);
      io.to(gameId).emit("game-update", game);
      callback({ success: true, gameId, symbol });
    });

    // MAKE MOVE
    socket.on("make-move", ({ gameId, playerId, row, col }, callback) => {
      const game = games.get(gameId);
      
      if (!game || game.gameOver) {
        callback({ success: false, error: "Game not found or over" });
        return;
      }
      
      let playerSymbol = null;
      if (game.players.X?.id === playerId) playerSymbol = "X";
      if (game.players.O?.id === playerId) playerSymbol = "O";
      
      if (!playerSymbol || game.currentPlayer !== playerSymbol) {
        callback({ success: false, error: "Not your turn" });
        return;
      }
      
      if (game.board[row][col] !== "") {
        callback({ success: false, error: "Invalid move" });
        return;
      }
      
      game.board[row][col] = playerSymbol;
      
      const win = checkWin(game.board, playerSymbol);
      const draw = !win && checkDraw(game.board);
      
      if (win) {
        game.winner = playerSymbol;
        game.gameOver = true;
        game.status = "ended";
        game.score[playerSymbol]++;
        game.lastWinner = playerSymbol;
        
        io.to(gameId).emit("game-update", game);
        callback({ success: true });
        
        setTimeout(() => {
          resetGame(gameId, io);
        }, 3000);
        return;
      }
      
      if (draw) {
        game.isDraw = true;
        game.gameOver = true;
        game.status = "ended";
        
        io.to(gameId).emit("game-update", game);
        callback({ success: true });
        
        setTimeout(() => {
          resetGame(gameId, io);
        }, 3000);
        return;
      }
      
      game.currentPlayer = playerSymbol === "X" ? "O" : "X";
      io.to(gameId).emit("game-update", game);
      callback({ success: true });
    });
    
    // RESET GAME FUNCTION
    function resetGame(gameId, io) {
      const game = games.get(gameId);
      if (!game) return;
      
      const oldScore = { ...game.score };
      const oldPlayers = { ...game.players };
      
      game.board = [["", "", ""], ["", "", ""], ["", "", ""]];
      game.currentPlayer = "X";
      game.winner = null;
      game.isDraw = false;
      game.gameOver = false;
      game.status = "playing";
      
      if (game.lastWinner === "X") {
        game.players = oldPlayers;
      } else if (game.lastWinner === "O") {
        game.players = {
          X: oldPlayers.O,
          O: oldPlayers.X,
        };
      } else if (game.isDraw) {
        game.players = {
          X: oldPlayers.O,
          O: oldPlayers.X,
        };
      }
      
      game.score = oldScore;
      games.set(gameId, game);
      io.to(gameId).emit("game-update", game);
      console.log(`Game ${gameId} reset automatically`);
    }
    
    // LEAVE GAME - TOTALMENTE REFEITO E SEGURO
    socket.on("leave-game", (data, callback) => {
      const gameId = data?.gameId;
      const playerId = data?.playerId;
      
      console.log(`Leave game request: gameId=${gameId}, playerId=${playerId}`);
      
      const game = games.get(gameId);
      if (!game) {
        if (typeof callback === "function") callback({ success: true });
        return;
      }
      
      let playerSymbol = null;
      for (const [sym, p] of Object.entries(game.players)) {
        if (p.id === playerId) {
          playerSymbol = sym;
          break;
        }
      }
      
      if (playerSymbol) {
        delete game.players[playerSymbol];
        
        const remainingSymbols = Object.keys(game.players);
        
        if (remainingSymbols.length === 0) {
          games.delete(gameId);
          console.log(`Game ${gameId} deleted`);
        } else {
          // Se sobrou alguém, garantimos que vira 'X' para esperar novos players
          const remainingSymbol = remainingSymbols[0];
          const remainingPlayerObj = game.players[remainingSymbol];
          
          game.status = "waiting";
          game.board = [["", "", ""], ["", "", ""], ["", "", ""]];
          game.currentPlayer = "X";
          game.winner = null;
          game.isDraw = false;
          game.gameOver = false;
          game.score = { X: 0, O: 0 };
          game.lastWinner = null;
          
          game.players = {
            X: {
              id: remainingPlayerObj.id,
              name: remainingPlayerObj.name,
              socketId: remainingPlayerObj.socketId
            }
          };
          
          games.set(gameId, game);
          io.to(gameId).emit("game-update", game);
        }
      }
      
      socket.leave(gameId);
      delete socket.gameId;
      delete socket.playerId;
      delete socket.playerSymbol;
      
      if (typeof callback === "function") callback({ success: true });
    });
    
    // DISCONNECT HANDLER - ATUALIZADO IGUAL AO LEAVE
    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
      
      if (socket.gameId && socket.playerId) {
        const game = games.get(socket.gameId);
        if (game) {
          let playerSymbol = null;
          for (const [sym, p] of Object.entries(game.players)) {
            if (p.id === socket.playerId) {
              playerSymbol = sym;
              break;
            }
          }
          
          if (playerSymbol) {
            delete game.players[playerSymbol];
            const remainingSymbols = Object.keys(game.players);
            
            if (remainingSymbols.length === 0) {
              games.delete(socket.gameId);
              console.log(`Game ${socket.gameId} deleted due to disconnect`);
            } else {
              const remainingSymbol = remainingSymbols[0];
              const remainingPlayerObj = game.players[remainingSymbol];
              
              game.status = "waiting";
              game.board = [["", "", ""], ["", "", ""], ["", "", ""]];
              game.currentPlayer = "X";
              game.winner = null;
              game.isDraw = false;
              game.gameOver = false;
              game.score = { X: 0, O: 0 };
              game.lastWinner = null;
              
              game.players = {
                X: {
                  id: remainingPlayerObj.id,
                  name: remainingPlayerObj.name,
                  socketId: remainingPlayerObj.socketId
                }
              };
              
              games.set(socket.gameId, game);
              io.to(socket.gameId).emit("game-update", game);
              console.log(`Game ${socket.gameId} reset due to disconnect`);
            }
          }
        }
      }
    });
  });

  res.end();
}

function checkWin(board, player) {
  for (let i = 0; i < 3; i++) {
    if (board[i][0] === player && board[i][1] === player && board[i][2] === player) return true;
    if (board[0][i] === player && board[1][i] === player && board[2][i] === player) return true;
  }
  if (board[0][0] === player && board[1][1] === player && board[2][2] === player) return true;
  if (board[0][2] === player && board[1][1] === player && board[2][0] === player) return true;
  return false;
}

function checkDraw(board) {
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[i][j] === "") return false;
    }
  }
  return true;
}