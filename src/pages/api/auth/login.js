// pages/api/auth/login.js
import { adminDb } from '@/lib/firebaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Preencha todos os campos.' });
  }

  const cleanUsername = username.trim().toLowerCase();

  try {
    const userRef = adminDb.ref(`users/${cleanUsername}`);
    const snapshot = await userRef.once('value');

    if (!snapshot.exists()) {
      return res.status(400).json({ message: 'Username ou senha incorretos.' });
    }

    const userData = snapshot.val();

    if (userData.password !== password) {
      return res.status(400).json({ message: 'Username ou senha incorretos.' });
    }

    return res.status(200).json({ 
      message: 'Logado com sucesso!', 
      username: userData.username,
      discordId: userData.discordId || null
    });
  } catch (error) {
    console.error("❌ Erro detalhado no login:", error);
    return res.status(500).json({ message: 'Erro interno no servidor.', details: error.message });
  }
}