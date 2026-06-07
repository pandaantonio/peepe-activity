// lib/discord.js
import { DiscordSDK } from "@discord/embedded-app-sdk";

let discordSdk = null;
let auth = null;
let isInitialized = false;

export function getDiscordSDK() {
  if (!discordSdk && typeof window !== 'undefined') {
    try {
      discordSdk = new DiscordSDK(process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID);
      console.log('DiscordSDK instance created with client ID:', process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID);
    } catch (err) {
      console.error('Error creating DiscordSDK:', err);
    }
  }
  return discordSdk;
}

export function getAuth() {
  return auth;
}

export async function setupDiscordSdk() {
  // Evita reinicializações desnecessárias
  if (isInitialized) {
    console.log('Discord SDK already initialized, returning auth:', auth);
    return auth;
  }

  const sdk = getDiscordSDK();
  if (!sdk) {
    console.error('DiscordSDK is null');
    return null;
  }

  try {
    // Verifica se está rodando dentro do Discord
    const params = new URLSearchParams(window.location.search);
    const frameId = params.get('frame_id');
    
    console.log('Frame ID:', frameId);
    
    if (!frameId) {
      console.warn("Fora do Discord. Modo Standalone ativo.");
      isInitialized = true;
      return null;
    }

    console.log('Calling sdk.ready()...');
    await sdk.ready();
    console.log("Discord SDK is ready");

    console.log('Calling authorize...');
    const { code } = await sdk.commands.authorize({
      client_id: process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID,
      response_type: "code",
      state: "",
      prompt: "none",
      scope: ["identify", "guilds"],
    });
    
    console.log('Authorization code received:', code ? 'yes' : 'no');

    console.log('Calling /api/token...');
    const response = await fetch("/api/token", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Token API error:', errorData);
      throw new Error(errorData.error || "Failed to get access token");
    }

    const { access_token } = await response.json();
    console.log('Access token received:', access_token ? 'yes' : 'no');
    
    // Autentica no SDK
    console.log('Calling authenticate...');
    auth = await sdk.commands.authenticate({ access_token });

    if (!auth || !auth.user) {
      console.error('Authenticate failed - no user data:', auth);
      throw new Error("Authenticate failed - no user data returned");
    }

    console.log("Discord SDK authenticated successfully:", auth.user.username);
    isInitialized = true;
    return auth;
    
  } catch (e) {
    console.error("Erro detalhado na autenticação Discord:", e);
    console.error('Error stack:', e.stack);
    isInitialized = true;
    return null;
  }
}

// Função para limpar o estado (útil para logout)
export function clearDiscordAuth() {
  auth = null;
  isInitialized = false;
}