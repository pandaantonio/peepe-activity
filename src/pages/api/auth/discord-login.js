// pages/api/auth/discord-login.js
import { adminDb } from '@/lib/firebaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Método não permitido' });

  const { discordId } = req.body;

  if (!discordId) return res.status(400).json({ message: 'Discord ID ausente.' });

  try {
    // Procura nas contas cadastradas quem tem esse discordId
    const usersRef = adminDb.ref('users');
    const snapshot = await usersRef.orderByChild('discordId').equalTo(discordId).once('value');

    if (!snapshot.exists()) {
      return res.status(404).json({ message: 'Nenhuma conta vinculada a este Discord.' });
    }

    // Pega o primeiro usuário encontrado
    const usersData = snapshot.val();
    const username = Object.keys(usersData)[0];
    const user = usersData[username];

    return res.status(200).json({ 
      message: 'Logado automaticamente via Discord!', 
      username: user.username,
      discordId: user.discordId
    });
  } catch (error) {
    console.error("Erro no login automático do Discord:", error);
    return res.status(500).json({ message: 'Erro interno no servidor.' });
  }
}