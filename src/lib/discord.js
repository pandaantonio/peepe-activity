// lib/discord.js
import { DiscordSDK } from "@discord/embedded-app-sdk";

let discordSdk = null;
let auth = null;

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
  const sdk = getDiscordSDK();
  if (!sdk) return null;

  try {
    // Verifica se está rodando dentro do Discord
    const params = new URLSearchParams(window.location.search);
    const frameId = params.get('frame_id');
    
    if (!frameId) {
      console.warn("Fora do Discord. Modo Standalone ativo.");
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) throw new Error("Failed to get access token");

    const { access_token } = await response.json();
    auth = await sdk.commands.authenticate({ access_token });

    if (auth == null) throw new Error("Authenticate failed");

    console.log("Discord SDK authenticated");
    return auth;
  } catch (e) {
    console.warn("Erro na autenticação Discord:", e);
    return null;
  }
}