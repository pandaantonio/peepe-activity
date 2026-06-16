// lib/debugToken.js - Helper para diagnosticar problemas de token
// Use isso no console do navegador ou em uma página de debug

export async function debugTokenFlow() {
  const results = {
    env: {},
    sdk: null,
    authorize: null,
    token: null,
    authenticate: null,
    errors: [],
  };

  // 1. Verificar variáveis de ambiente
  results.env.clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
  results.env.hasClientId = !!process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;

  if (!results.env.hasClientId) {
    results.errors.push('NEXT_PUBLIC_DISCORD_CLIENT_ID não está definido');
  }

  // 2. Verificar se está em iframe do Discord
  const params = new URLSearchParams(window.location.search);
  const frameId = params.get('frame_id');
  results.env.isDiscordFrame = !!frameId;
  results.env.frameId = frameId;

  if (!results.env.isDiscordFrame) {
    results.errors.push('Não está rodando dentro do iframe do Discord (frame_id ausente)');
  }

  // 3. Tentar instanciar SDK
  try {
    const { DiscordSDK } = await import('@discord/embedded-app-sdk');
    const sdk = new DiscordSDK(process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID);
    results.sdk = { instantiated: true };

    // 4. ready()
    await sdk.ready();
    results.sdk.ready = true;

    // 5. authorize
    const { code } = await sdk.commands.authorize({
      client_id: process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID,
      response_type: 'code',
      state: '',
      prompt: 'none',
      scope: ['identify'],
    });
    results.authorize = { success: true, codeLength: code?.length };

    // 6. token exchange
    const tokenRes = await fetch('/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    const tokenData = await tokenRes.json();
    results.token = {
      status: tokenRes.status,
      ok: tokenRes.ok,
      hasAccessToken: !!tokenData.access_token,
      error: tokenData.error,
      details: tokenData.details,
      debug: tokenData.debug,
    };

    if (!tokenRes.ok) {
      results.errors.push(`Token exchange falhou: ${tokenData.error || tokenData.details || tokenRes.status}`);
    }

    // 7. authenticate
    if (tokenData.access_token) {
      const auth = await sdk.commands.authenticate({
        access_token: tokenData.access_token,
      });
      results.authenticate = {
        success: !!auth,
        hasUser: !!auth?.user,
        username: auth?.user?.username,
      };
    }

  } catch (err) {
    results.errors.push(err.message);
  }

  console.log('=== DEBUG TOKEN FLOW ===');
  console.log(JSON.stringify(results, null, 2));
  return results;
}
