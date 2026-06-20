// hooks/useDiscordScore.js
import { useCallback, useRef } from 'react';
import { useDiscord } from '@/contexts/DiscordContext';

/**
 * Hook que salva o score do jogador no Firebase quando o jogo termina,
 * mas apenas se ele estiver rodando dentro do Discord SDK.
 *
 * Estrutura salva no Firebase Realtime Database:
 *   scores/2048/{userId}/
 *     ├── lastScore      — pontuação da última partida
 *     ├── highScore      — melhor pontuação histórica
 *     ├── username       — nome de exibição do Discord
 *     ├── avatarUrl      — URL do avatar do Discord
 *     ├── lastPlayedAt   — timestamp ISO da última partida
 *     └── gamesPlayed    — total de partidas finalizadas
 */
export function useDiscordScore() {
  const { isDiscordFrame, isAuthenticated, currentUserRaw, username, userAvatar } = useDiscord();

  // Evita salvar duas vezes para o mesmo game over
  const savedRef = useRef(false);

  /**
   * Chame esta função quando o jogo terminar (gameOver ou vitória).
   *
   * @param {object} params
   * @param {number} params.score        — pontuação final da partida
   * @param {number} params.highScore    — melhor pontuação do jogador (localStorage)
   * @param {number} params.maxTile      — maior tile alcançado
   * @param {number} params.movesCount   — total de movimentos feitos
   * @param {number} params.elapsedTime  — tempo em segundos
   * @param {boolean} params.won         — se o jogador chegou ao 2048
   */
  const saveScore = useCallback(async ({
    score,
    highScore,
    maxTile,
    movesCount,
    elapsedTime,
    won,
  }) => {
    // Só salva dentro do Discord e com auth válida
    if (!isDiscordFrame || !isAuthenticated || !currentUserRaw?.id) return;

    // Evita duplo envio por re-render
    if (savedRef.current) return;
    savedRef.current = true;

    try {
      const payload = {
        userId:      currentUserRaw.id,
        username,
        avatarUrl:   userAvatar,
        score,
        highScore,
        maxTile,
        movesCount,
        elapsedTime,
        won:         !!won,
        playedAt:    new Date().toISOString(),
      };

      const res = await fetch('/api/save-score', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      if (!res.ok) {
        const { error } = await res.json().catch(() => ({}));
        console.warn('[SCORE] Falha ao salvar score:', error || res.statusText);
      } else {
        console.log('[SCORE] Score salvo com sucesso para', username, '→', score);
      }
    } catch (err) {
      console.error('[SCORE] Erro ao salvar score:', err);
    }
  }, [isDiscordFrame, isAuthenticated, currentUserRaw, username, userAvatar]);

  /** Reseta o guard para a próxima partida */
  const resetSaveGuard = useCallback(() => {
    savedRef.current = false;
  }, []);

  return { saveScore, resetSaveGuard };
}