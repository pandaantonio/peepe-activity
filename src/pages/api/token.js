// pages/api/token.js
import { logInfo, logError } from '@/lib/debugLogger';

export default async function handler(req, res) {
  // Como não podemos usar o logger do lado do servidor diretamente no cliente,
  // vamos retornar informações detalhadas no response para debug

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Método não permitido',
      debug: { method: req.method, expected: 'POST' }
    });
  }

  const { code } = req.body;

  if (!code) {
    return res.status(400).json({
      error: 'Código OAuth2 não informado',
      debug: { hasCode: false, bodyKeys: Object.keys(req.body) }
    });
  }

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({
      error: 'Configuração do servidor incompleta',
      debug: {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
        clientIdLength: clientId?.length,
        clientSecretLength: clientSecret?.length
      }
    });
  }

  try {
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code,
    });

    const response = await fetch(
      'https://discord.com/api/v10/oauth2/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'OAuth2 falhou',
        details: data.error_description || data.error,
        debug: {
          discordStatus: response.status,
          discordError: data.error,
          discordErrorDescription: data.error_description,
          hasClientId: !!clientId,
          clientIdPrefix: clientId?.substring(0, 6),
          codeLength: code?.length
        }
      });
    }

    return res.status(200).json({
      access_token: data.access_token,
      token_type: data.token_type,
      expires_in: data.expires_in,
      debug: {
        success: true,
        hasAccessToken: !!data.access_token,
        tokenType: data.token_type,
        expiresIn: data.expires_in
      }
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Erro interno do servidor',
      debug: {
        catchError: error.message,
        stack: error.stack?.split('\n').slice(0, 3)
      }
    });
  }
}
