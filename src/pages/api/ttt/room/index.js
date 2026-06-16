// pages/api/ttt/room/index.js
import { adminDb } from "@/lib/firebaseAdmin";

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Firebase não suporta arrays com nulls.
// Board salvo como objeto: { "0": "", "1": "", ..., "8": "" }
// String vazia = célula vazia (null seria removido pelo Firebase)
function emptyBoard() {
  return { 0: "", 1: "", 2: "", 3: "", 4: "", 5: "", 6: "", 7: "", 8: "" };
}

export default async function handler(req, res) {
  try {
    // POST /api/ttt/room → Criar sala
    if (req.method === "POST") {
      const { playerName } = req.body;

      if (!playerName) {
        return res.status(400).json({ error: "playerName é obrigatório" });
      }

      const roomId = generateRoomId();

      const initialState = {
        board: emptyBoard(),
        currentTurn: "X",
        result: "",
        scores: { X: 0, O: 0 },
        players: {
          X: { name: playerName, createdAt: Date.now() },
        },
      };

      await adminDb.ref(`ttt-rooms/${roomId}`).set(initialState);

      return res.status(200).json({ roomId, symbol: "X" });
    }

    // DELETE /api/ttt/room → Deletar sala
    if (req.method === "DELETE") {
      const { roomId } = req.body;

      if (!roomId) {
        return res.status(400).json({ error: "roomId é obrigatório" });
      }

      await adminDb.ref(`ttt-rooms/${roomId}`).remove();

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Método não permitido" });
  } catch (err) {
    console.error("[TTT/room] Erro:", err);
    return res.status(500).json({ error: err.message });
  }
}