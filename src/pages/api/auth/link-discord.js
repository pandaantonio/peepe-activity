// pages/api/auth/link-discord.js
import { adminDb } from '@/lib/firebaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Método não permitido' });

  const { username, discordId } = req.body;

  if (!username || !discordId) {
    return res.status(400).json({ message: 'Parâmetros ausentes.' });
  }

  try {
    const cleanUsername = username.trim().toLowerCase();
    const userRef = adminDb.ref(`users/${cleanUsername}`);
    
    // Atualiza adicionando o discordId no registro do usuário
    await userRef.update({ discordId });

    return res.status(200).json({ message: 'Conta do Discord vinculada com sucesso!', discordId });
  } catch (error) {
    console.error("Erro ao vincular Discord:", error);
    return res.status(500).json({ message: 'Erro interno no servidor.' });
  }
}