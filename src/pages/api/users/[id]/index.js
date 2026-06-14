// pages/api/users/[id].js
import { adminDb } from '@/lib/firebaseAdmin';

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  const userRef = adminDb.ref(`users/${id}`);

  try {
    if (req.method === 'GET') {
      // Buscar dados do usuário
      const snapshot = await userRef.once('value');
      const data = snapshot.val() || { coins: 0, dailyCollected: false };

      return res.status(200).json({
        id,
        coins: data.coins || 0,
        dailyCollected: data.dailyCollected || false,
        lastDaily: data.lastDaily || null,
        ...data
      });
    }

    if (req.method === 'POST') {
      const { action, amount } = req.body;

      if (action === 'add') {
        // Adicionar moedas
        const snapshot = await userRef.once('value');
        const current = snapshot.val() || { coins: 0 };
        const newCoins = (current.coins || 0) + (amount || 0);

        await userRef.update({ coins: newCoins });
        return res.status(200).json({ coins: newCoins, added: amount });
      }

      if (action === 'subtract') {
        // Subtrair moedas
        const snapshot = await userRef.once('value');
        const current = snapshot.val() || { coins: 0 };
        const newCoins = Math.max(0, (current.coins || 0) - (amount || 0));

        await userRef.update({ coins: newCoins });
        return res.status(200).json({ coins: newCoins, subtracted: amount });
      }

      if (action === 'daily') {
        // Coletar recompensa diária
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;

        const snapshot = await userRef.once('value');
        const current = snapshot.val() || { coins: 0, lastDaily: 0 };
        const lastDaily = current.lastDaily || 0;

        if (now - lastDaily < oneDay) {
          const remaining = oneDay - (now - lastDaily);
          return res.status(429).json({ 
            error: 'Daily reward already collected',
            remaining,
            nextDaily: lastDaily + oneDay
          });
        }

        const dailyAmount = 100; // Recompensa diária fixa
        const newCoins = (current.coins || 0) + dailyAmount;

        await userRef.update({ 
          coins: newCoins, 
          lastDaily: now,
          dailyCollected: true 
        });

        return res.status(200).json({ 
          coins: newCoins, 
          added: dailyAmount,
          lastDaily: now 
        });
      }

      return res.status(400).json({ error: 'Invalid action' });
    }

    if (req.method === 'PUT') {
      // Atualizar dados do usuário
      const updates = req.body;
      await userRef.update(updates);

      const snapshot = await userRef.once('value');
      return res.status(200).json(snapshot.val());
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
