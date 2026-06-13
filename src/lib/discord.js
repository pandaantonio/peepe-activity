// Exemplo de estrutura segura para sua lib/discord.js
import { DiscordSDK } from "@discord/embedded-app-sdk";

let discordSdk;

export function getDiscordSDK() {
  if (!discordSdk && typeof window !== "undefined") {
    // Verifique se o seu CLIENT_ID está sendo injetado corretamente aqui
    discordSdk = new DiscordSDK(process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID);
  }
  return discordSdk;
}

export async function setupDiscordSdk() {
  const sdk = getDiscordSDK();
  if (!sdk) return null;

  // PASSO OBRIGATÓRIO: Sem isso, o Discord deixa a tela congelada
  await sdk.ready();
  
  // Exemplo de fluxo de autorização simplificado
  // Se o seu fluxo atual usa ganchos de comando RPC complexos, mude temporariamente 
  // para este bloco simples para ver se a biblioteca de jogos carrega com sucesso:
  try {
    const { code } = await sdk.commands.authorize({
      client_id: process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID,
      response_type: 'code',
      state: '',
      prompt: 'none',
      scope: ['identify', 'guilds'],
    });
    
    // Seu fetch para trocar o 'code' por um Token de Acesso aqui...
    // const response = await fetch('/api/token', ...);
    // return await response.json();
    
    return { user: true }; // Retorno temporário fictício para testes
  } catch (authError) {
    console.warn("Falha na autorização automática RPC:", authError);
    // Retorna um objeto vazio ou lança o erro dependendo da sua regra
    return null; 
  }
}