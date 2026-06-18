// pages/api/auth/register.js
import { adminDb } from '@/lib/firebaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const { username, password, discordId } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Preencha todos os campos.' });
  }

  const cleanUsername = username.trim().toLowerCase();

  // Permite letras, números, sublinhados (_) e pontos (.)
  const validUsernameRegex = /^[a-zA-Z0-9_.]+$/;
  if (!validUsernameRegex.test(cleanUsername)) {
    return res.status(400).json({ message: 'O username só pode conter letras, números, sublinhados (_) e pontos (.).' });
  }

  try {
    const userRef = adminDb.ref(`users/${cleanUsername}`);
    const snapshot = await userRef.once('value');

    if (snapshot.exists()) {
      return res.status(400).json({ message: 'Este username já está em uso.' });
    }

    // Estrutura do novo usuário
    const userData = {
      username: cleanUsername,
      password: password,
      createdAt: new Date().toISOString()
    };

    // Adiciona o ID do Discord se foi enviado
    if (discordId) {
      userData.discordId = discordId;
    }

    await userRef.set(userData);

    return res.status(201).json({ message: 'Usuário criado com sucesso!' });
  } catch (error) {
    console.error("❌ Erro detalhado no cadastro:", error);
    return res.status(500).json({ message: 'Erro interno no servidor.', details: error.message });
  }
}