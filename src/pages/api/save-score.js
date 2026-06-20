// pages/api/save-score.js
import { adminDb } from '@/lib/firebaseAdmin';

/**
 * POST /api/save-score
 *
 * Body (JSON):
 *   userId, username, avatarUrl, score, highScore,
 *   maxTile, movesCount, elapsedTime, won, playedAt
 *
 * Estrutura no Firebase Realtime Database:
 *   scores/2048/{userId}/lastScore
 *   scores/2048/{userId}/highScore   ← nunca decresce
 *   scores/2048/{userId}/gamesPlayed ← incrementado
 *   scores/2048/{userId}/username
 *   scores/2048/{userId}/avatarUrl
 *   scores/2048/{userId}/lastPlayedAt
 *   scores/2048/{userId}/lastMaxTile
 *   scores/2048/{userId}/lastMovesCount
 *   scores/2048/{userId}/lastElapsedTime
 *   scores/2048/{userId}/lastWon
 *
 * O campo highScore NUNCA é sobrescrito com um valor menor —
 * isso garante que bots de economia sempre leiam o recorde correto.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    userId,
    username,
    avatarUrl,
    score,
    highScore,
    maxTile,
    movesCount,
    elapsedTime,
    won,
    playedAt,
  } = req.body;

  // Validação básica
  if (!userId || typeof score !== 'number') {
    return res.status(400).json({ error: 'userId e score são obrigatórios' });
  }

  try {
    const userRef = adminDb.ref(`scores/2048/${userId}`);

    // Lê o highScore atual no banco para nunca decrementá-lo
    const snapshot = await userRef.child('highScore').get();
    const currentHigh = snapshot.exists() ? (snapshot.val() ?? 0) : 0;

    // Lê gamesPlayed atual
    const gamesSnap = await userRef.child('gamesPlayed').get();
    const currentGames = gamesSnap.exists() ? (gamesSnap.val() ?? 0) : 0;

    await userRef.set({
      // Dados de identidade (sempre atualizados)
      username:         username  || 'Unknown',
      avatarUrl:        avatarUrl || '',

      // Última partida
      lastScore:        score,
      lastMaxTile:      maxTile      ?? 0,
      lastMovesCount:   movesCount   ?? 0,
      lastElapsedTime:  elapsedTime  ?? 0,
      lastWon:          won          ?? false,
      lastPlayedAt:     playedAt     || new Date().toISOString(),

      // Recorde histórico — nunca decresce
      highScore:        Math.max(currentHigh, highScore ?? score),

      // Contador de partidas
      gamesPlayed:      currentGames + 1,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[API/save-score] Erro ao salvar no Firebase:', err);
    return res.status(500).json({ error: 'Erro interno ao salvar score' });
  }
}