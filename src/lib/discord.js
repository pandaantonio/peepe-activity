// lib/discord.js
import { DiscordSDK } from "@discord/embedded-app-sdk";

let discordSdk;

export function getDiscordSDK() {
  if (!discordSdk && typeof window !== "undefined") {
    discordSdk = new DiscordSDK(process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID);
  }
  return discordSdk;
}

export async function setupDiscordSdk() {
  const sdk = getDiscordSDK();
  if (!sdk) return null;

  // PASSO OBRIGATÓRIO: Inicializa o handshake com o Discord
  await sdk.ready();
  
  try {
    // 1. Solicita o código de autorização RPC dentro do Discord
    const { code } = await sdk.commands.authorize({
      client_id: process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID,
      response_type: 'code',
      state: '',
      prompt: 'none',
      scope: ['identify', 'guilds'],
    });
    
    // 2. Troca o código pelo access_token real usando a sua API Back-end
    // Substitua o caminho '/api/token' pela rota real que você criou no Next.js
    const response = await fetch('/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      throw new Error('Falha ao trocar o código de autenticação pelo token.');
    }

    const tokenData = await response.json();
    
    // 3. Autentica o SDK com o token recebido
    const newAuth = await sdk.commands.authenticate({
      access_token: tokenData.access_token,
    });

    if (!newAuth) {
      throw new Error("Falha na autenticação do SDK.");
    }

    // Retorna o objeto completo contendo o 'access_token' e os dados do 'user'
    return newAuth; 

  } catch (authError) {
    console.error("Falha na autorização automática RPC:", authError);
    return null; 
  }
}