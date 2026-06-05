// lib/discord.js
import { DiscordSDK } from "@discord/embedded-app-sdk";

let discordSdk = null;
let auth = null;
let isInitialized = false;

export function getDiscordSDK() {
  if (!discordSdk && typeof window !== 'undefined') {
    discordSdk = new DiscordSDK(process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID);
  }
  return discordSdk;
}

export function getAuth() {
  return auth;
}

export async function setupDiscordSdk() {
  // Evita reinicializações desnecessárias
  if (isInitialized) {
    return auth;
  }

  const sdk = getDiscordSDK();
  if (!sdk) return null;

  try {
    // Verifica se está rodando dentro do Discord
    const params = new URLSearchParams(window.location.search);
    const frameId = params.get('frame_id');
    
    if (!frameId) {
      console.warn("Fora do Discord. Modo Standalone ativo.");
      isInitialized = true;
      return null;
    }

    await sdk.ready();
    console.log("Discord SDK is ready");

    const { code } = await sdk.commands.authorize({
      client_id: process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID,
      response_type: "code",
      state: "",
      prompt: "none",
      scope: ["identify", "guilds"],
    });

    const response = await fetch("/api/token", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to get access token");
    }

    const { access_token } = await response.json();
    
    // Autentica no SDK
    auth = await sdk.commands.authenticate({ access_token });

    if (!auth) throw new Error("Authenticate failed - no user data returned");

    console.log("Discord SDK authenticated:", auth.user?.username);
    isInitialized = true;
    return auth;
    
  } catch (e) {
    console.error("Erro na autenticação Discord:", e);
    isInitialized = true;
    return null;
  }
}

// Função para limpar o estado (útil para logout)
export function clearDiscordAuth() {
  auth = null;
  isInitialized = false;
}