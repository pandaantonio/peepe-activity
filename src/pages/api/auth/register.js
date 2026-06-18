// pages/api/auth/register.js
import { adminDb } from '@/lib/firebaseAdmin';

// Função para tornar o username seguro para chaves do Firebase
function encodeUsername(username) {
  return username.replace(/\./g, ','); // Substitui todos os pontos por vírgulas na rota do banco
}

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
    const dbKey = encodeUsername(cleanUsername);
    const userRef = adminDb.ref(`users/${dbKey}`);
    const snapshot = await userRef.once('value');

    if (snapshot.exists()) {
      return res.status(400).json({ message: 'Este username já está em uso.' });
    }

    // Se um discordId foi fornecido, precisamos garantir que nenhuma OUTRA conta já use esse mesmo Discord
    if (discordId) {
      const usersRef = adminDb.ref('users');
      const discordSnapshot = await usersRef.orderByChild('discordId').equalTo(discordId).once('value');
      if (discordSnapshot.exists()) {
        return res.status(400).json({ message: 'Este Discord já está vinculado a outra conta.' });
      }
    }

    // Grava a estrutura salvando o username original (com ponto) lá dentro
    const userData = {
      username: cleanUsername, // Guarda com o ponto original para exibição futura
      password: password,
      createdAt: new Date().toISOString()
    };

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