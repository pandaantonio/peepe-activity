// lib/discord.js
import { DiscordSDK } from "@discord/embedded-app-sdk";
import { logInfo, logWarn, logError, logSuccess } from "./debugLogger";

let discordSdk;

export function getDiscordSDK() {
  if (!discordSdk && typeof window !== "undefined") {
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    logInfo("[DISCORD] Tentando instanciar SDK", { clientId: clientId ? "DEFINIDO" : "AUSENTE", length: clientId?.length });

    if (!clientId) {
      logError("[DISCORD] NEXT_PUBLIC_DISCORD_CLIENT_ID não está definido!");
      return null;
    }

    try {
      discordSdk = new DiscordSDK(clientId);
      logSuccess("[DISCORD] SDK instanciado com sucesso");
    } catch (err) {
      logError("[DISCORD] Falha ao instanciar SDK", { error: err.message });
      return null;
    }
  }
  return discordSdk;
}

export async function setupDiscordSdk() {
  const sdk = getDiscordSDK();
  if (!sdk) {
    logError("[DISCORD] SDK é null, abortando setup");
    return null;
  }

  try {
    logInfo("[DISCORD] === INICIANDO SETUP ===");

    // PASSO 1: ready()
    logInfo("[DISCORD] Passo 1/4: Chamando sdk.ready()...");
    await sdk.ready();
    logSuccess("[DISCORD] Passo 1/4: sdk.ready() OK");

    // PASSO 2: authorize
    logInfo("[DISCORD] Passo 2/4: Chamando sdk.commands.authorize()...");
    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    logInfo("[DISCORD] Usando client_id", { clientId: clientId ? "DEFINIDO" : "AUSENTE" });

    const authParams = {
      client_id: clientId,
      response_type: 'code',
      state: '',
      prompt: 'none',
      scope: ['identify', 'guilds'],
    };
    logInfo("[DISCORD] Parâmetros de authorize", authParams);

    const { code } = await sdk.commands.authorize(authParams);
    logSuccess("[DISCORD] Passo 2/4: Autorização OK, código recebido", { codeLength: code?.length, codePrefix: code?.substring(0, 10) + "..." });

    // PASSO 3: trocar código por token
    logInfo("[DISCORD] Passo 3/4: POST /api/token com o código...");
    const response = await fetch('/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    logInfo("[DISCORD] Resposta de /api/token", { status: response.status, statusText: response.statusText, ok: response.ok });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { raw: await response.text() };
      }
      logError("[DISCORD] /api/token retornou erro", errorData);
      throw new Error(`Falha ao trocar código: ${errorData.error || response.status}`);
    }

    const tokenData = await response.json();
    logSuccess("[DISCORD] Passo 3/4: Token recebido", {
      hasAccessToken: !!tokenData.access_token,
      accessTokenLength: tokenData.access_token?.length,
      tokenType: tokenData.token_type,
      expiresIn: tokenData.expires_in,
      keys: Object.keys(tokenData)
    });

    // PASSO 4: authenticate
    logInfo("[DISCORD] Passo 4/4: Chamando sdk.commands.authenticate()...");
    const newAuth = await sdk.commands.authenticate({
      access_token: tokenData.access_token,
    });

    if (!newAuth) {
      logError("[DISCORD] authenticate retornou null/undefined");
      throw new Error("Falha na autenticação do SDK.");
    }

    logSuccess("[DISCORD] Passo 4/4: Autenticação completa!", {
      hasUser: !!newAuth.user,
      username: newAuth.user?.username,
      hasAccessToken: !!newAuth.access_token,
      authKeys: Object.keys(newAuth)
    });

    return newAuth;

  } catch (authError) {
    logError("[DISCORD] Erro no setupDiscordSdk", {
      message: authError.message,
      name: authError.name,
      stack: authError.stack?.split('').slice(0, 3),
    });
    return null;
  }
}
