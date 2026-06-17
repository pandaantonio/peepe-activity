// lib/discord.js
import { DiscordSDK } from "@discord/embedded-app-sdk";

let discordSdk = null;

// Helper para descobrir se REALMENTE estamos dentro do Discord
export function checkIsDiscordFrame() {
  if (typeof window === "undefined") return false;
  
  const params = new URLSearchParams(window.location.search);
  const hasFrameId = !!params.get('frame_id');
  const hasInstanceId = !!params.get('instance_id');
  const isDiscordUserAgent = typeof navigator !== 'undefined' && /Discord/i.test(navigator.userAgent);
  const isDiscordOrigin = window.location.ancestorOrigins?.contains('https://discord.com');

  return hasFrameId || hasInstanceId || isDiscordUserAgent || isDiscordOrigin;
}

export function getDiscordSDK() {
  if (!checkIsDiscordFrame()) {
    console.log("[DISCORD] Fora do Discord. SDK real não será instanciado.");
    return null;
  }

  if (!discordSdk && typeof window !== "undefined") {
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;

    if (!clientId) {
      console.error("[DISCORD] NEXT_PUBLIC_DISCORD_CLIENT_ID ausente!");
      return null;
    }

    try {
      discordSdk = new DiscordSDK(clientId);
      console.log("[DISCORD] SDK instanciado com sucesso no ambiente correto");
    } catch (err) {
      console.error("[DISCORD] Falha ao instanciar SDK real", err);
      return null;
    }
  }
  return discordSdk;
}

export async function setupDiscordSdk() {
  const sdk = getDiscordSDK();
  if (!sdk) {
    // Retorno amigável para ambiente web comum sem estourar erros no console
    return null;
  }

  try {
    console.log("[DISCORD] === INICIANDO SETUP REAL ===");

    console.log("[DISCORD] Passo 1/4: sdk.ready()...");
    await sdk.ready();

    console.log("[DISCORD] Passo 2/4: authorize...");
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;

    const authParams = {
      client_id: clientId,
      response_type: 'code',
      state: '',
      prompt: 'none',
      scope: ['identify', 'guilds'],
    };

    const { code } = await sdk.commands.authorize(authParams);

    console.log("[DISCORD] Passo 3/4: POST /api/token...");
    const response = await fetch('/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      throw new Error(`Token exchange falhou status: ${response.status}`);
    }

    const tokenData = await response.json();

    console.log("[DISCORD] Passo 4/4: authenticate...");
    const newAuth = await sdk.commands.authenticate({
      access_token: tokenData.access_token,
    });

    return newAuth;

  } catch (authError) {
    console.error("[DISCORD] Erro crítico no setupDiscordSdk:", authError);
    return null;
  }
}