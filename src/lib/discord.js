// lib/discord.js
import { DiscordSDK } from "@discord/embedded-app-sdk";

let discordSdk = null;

export function getDiscordSDK() {
  if (!discordSdk && typeof window !== "undefined") {
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;

    if (!clientId) {
      console.error("[DISCORD] NEXT_PUBLIC_DISCORD_CLIENT_ID ausente!");
      return null;
    }

    try {
      discordSdk = new DiscordSDK(clientId);
      console.log("[DISCORD] SDK instanciado com sucesso");
    } catch (err) {
      console.error("[DISCORD] Falha ao instanciar SDK", err);
      return null;
    }
  }
  return discordSdk;
}

export async function setupDiscordSdk() {
  const sdk = getDiscordSDK();
  if (!sdk) {
    console.error("[DISCORD] SDK é null, abortando setup");
    return null;
  }

  try {
    console.log("[DISCORD] === INICIANDO SETUP ===");

    // PASSO 1: ready()
    console.log("[DISCORD] Passo 1/4: sdk.ready()...");
    await sdk.ready();
    console.log("[DISCORD] Passo 1/4: sdk.ready() OK");

    // PASSO 2: authorize
    console.log("[DISCORD] Passo 2/4: authorize...");
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;

    const authParams = {
      client_id: clientId,
      response_type: 'code',
      state: '',
      prompt: 'none',
      scope: ['identify', 'guilds'],
    };
    console.log("[DISCORD] Parâmetros de authorize:", JSON.stringify(authParams, null, 2));

    const { code } = await sdk.commands.authorize(authParams);
    console.log("[DISCORD] Passo 2/4: Autorização OK, código recebido (length:", code?.length, ")");

    // PASSO 3: trocar código por token
    console.log("[DISCORD] Passo 3/4: POST /api/token...");
    const response = await fetch('/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    console.log("[DISCORD] Resposta /api/token:", response.status, response.statusText);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { raw: await response.text() };
      }
      console.error("[DISCORD] /api/token erro:", errorData);
      throw new Error(`Token exchange falhou: ${errorData.error || errorData.details || response.status}`);
    }

    const tokenData = await response.json();
    console.log("[DISCORD] Passo 3/4: Token recebido!", {
      hasAccessToken: !!tokenData.access_token,
      tokenType: tokenData.token_type,
      expiresIn: tokenData.expires_in,
    });

    // PASSO 4: authenticate
    console.log("[DISCORD] Passo 4/4: authenticate...");
    const newAuth = await sdk.commands.authenticate({
      access_token: tokenData.access_token,
    });

    if (!newAuth) {
      console.error("[DISCORD] authenticate retornou null");
      throw new Error("Falha na autenticação do SDK.");
    }

    console.log("[DISCORD] Passo 4/4: Autenticação completa!", {
      hasUser: !!newAuth.user,
      username: newAuth.user?.username,
      scopes: newAuth.scopes,
    });

    return newAuth;

  } catch (authError) {
    console.error("[DISCORD] Erro no setupDiscordSdk:", {
      message: authError.message,
      name: authError.name,
    });
    return null;
  }
}
