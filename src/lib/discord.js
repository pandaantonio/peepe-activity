// lib/discord.js - Versão com logs de debug
export async function setupDiscordSdk() {
  const sdk = getDiscordSDK();
  if (!sdk) {
    console.error("[DISCORD] SDK não pôde ser instanciado");
    return null;
  }

  try {
    console.log("[DISCORD] Chamando sdk.ready()...");
    await sdk.ready();
    console.log("[DISCORD] sdk.ready() OK");

    console.log("[DISCORD] Chamando authorize com client_id:", process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID);
    const { code } = await sdk.commands.authorize({
      client_id: process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID,
      response_type: 'code',
      state: '',
      prompt: 'none',
      scope: ['identify', 'guilds'],
    });
    console.log("[DISCORD] Autorização OK, código recebido:", code ? "SIM" : "NÃO");

    console.log("[DISCORD] Trocando código por token em /api/token...");
    const response = await fetch('/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[DISCORD] /api/token falhou:", errorData);
      throw new Error(`Falha ao trocar código: ${errorData.error || response.status}`);
    }

    const tokenData = await response.json();
    console.log("[DISCORD] Token recebido:", tokenData.access_token ? "SIM" : "NÃO");

    console.log("[DISCORD] Chamando authenticate...");
    const newAuth = await sdk.commands.authenticate({
      access_token: tokenData.access_token,
    });

    if (!newAuth) {
      console.error("[DISCORD] authenticate retornou null");
      throw new Error("Falha na autenticação do SDK.");
    }

    console.log("[DISCORD] Autenticação completa! User:", newAuth.user?.username);
    return newAuth;

  } catch (authError) {
    console.error("[DISCORD] Erro no setup:", authError.message || authError);
    return null;
  }
}