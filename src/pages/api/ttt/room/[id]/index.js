// pages/api/ttt/room/[id].js
import { adminDb } from "@/lib/firebaseAdmin";

function normalizeBoard(board) {
  if (Array.isArray(board)) return board.map(v => v || "");
  if (board && typeof board === "object") {
    return Array.from({ length: 9 }, (_, i) => board[i] || "");
  }
  return Array(9).fill("");
}

function emptyBoard() {
  return { 0: "", 1: "", 2: "", 3: "", 4: "", 5: "", 6: "", 7: "", 8: "" };
}

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

export default async function handler(req, res) {
  try {
    const { id: roomId } = req.query;
    if (!roomId) return res.status(400).json({ error: "roomId é obrigatório" });

    const roomRef = adminDb.ref(`ttt-rooms/${roomId}`);

    // GET
    if (req.method === "GET") {
      const snapshot = await roomRef.once("value");
      if (!snapshot.exists()) return res.status(404).json({ error: "Sala não encontrada" });

      const data = snapshot.val();
      data.board = normalizeBoard(data.board);
      data.result = data.result || "";
      return res.status(200).json(data);
    }

    // PATCH - Join as O
    if (req.method === "PATCH") {
      const { playerName } = req.body;
      if (!playerName) return res.status(400).json({ error: "playerName é obrigatório" });

      const snapshot = await roomRef.once("value");
      if (!snapshot.exists()) return res.status(404).json({ error: "Sala não encontrada" });

      const data = snapshot.val();
      if (data.players?.O) return res.status(409).json({ error: "Sala já está cheia" });

      await roomRef.child("players/O").set({
        name: playerName,
        joinedAt: Date.now(),
        lastSeen: Date.now(),
      });

      // Update activity
      await roomRef.child("lastActivity").set(Date.now());

      return res.status(200).json({ roomId, symbol: "O" });
    }

    // PUT - Move
    if (req.method === "PUT") {
      const { index, symbol } = req.body;
      if (index === undefined || !symbol) return res.status(400).json({ error: "index e symbol obrigatórios" });

      const snapshot = await roomRef.once("value");
      if (!snapshot.exists()) return res.status(404).json({ error: "Sala não encontrada" });

      const data = snapshot.val();
      const board = normalizeBoard(data.board);

      if (data.result) return res.status(400).json({ error: "Jogo já encerrado" });
      if (data.currentTurn !== symbol) return res.status(400).json({ error: "Não é sua vez" });
      if (board[index]) return res.status(400).json({ error: "Célula já ocupada" });

      board[index] = symbol;
      const winResult = checkWinner(board);

      const boardObj = {};
      board.forEach((v, i) => boardObj[i] = v || "");

      const updates = {
        board: boardObj,
        currentTurn: symbol === "X" ? "O" : "X",
        lastActivity: Date.now(),
      };

      if (winResult) {
        updates.result = winResult.winner;
        if (winResult.winner !== "draw") {
          updates[`scores/${winResult.winner}`] = (data.scores?.[winResult.winner] || 0) + 1;
        }
      }

      await roomRef.update(updates);
      return res.status(200).json({ success: true, winResult });
    }

    // POST - Rematch request
    if (req.method === "POST") {
      const { action = "rematch" } = req.body || {}; // support for future actions

      const snapshot = await roomRef.once("value");
      if (!snapshot.exists()) return res.status(404).json({ error: "Sala não encontrada" });

      const data = snapshot.val();

      if (action === "rematch") {
        const nextFirst = (data.currentTurn || "X") === "X" ? "O" : "X"; // alternate starter
        await roomRef.update({
          board: emptyBoard(),
          currentTurn: nextFirst,
          result: "",
          rematchRequestedBy: null, // reset
          lastActivity: Date.now(),
        });
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Método não permitido" });
  } catch (err) {
    console.error("[TTT/room/id] Erro:", err);
    return res.status(500).json({ error: err.message });
  }
}