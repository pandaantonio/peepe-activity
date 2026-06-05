// pages/api/discord/guilds.js (ou app/api/discord/guilds/route.js)

export default async function handler(req, res) {
  // Apenas permitir método GET
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use GET.' 
    });
  }

  // Validar token do bot
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) {
    console.error('DISCORD_BOT_TOKEN não configurado no ambiente');
    return res.status(500).json({ 
      success: false, 
      error: 'Configuração do servidor incompleta.' 
    });
  }

  try {
    // Timeout para evitar espera infinita
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos

    const response = await fetch("https://discord.com/api/v10/users/@me/guilds", {
      headers: {
        Authorization: `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Tratar diferentes status HTTP do Discord
    if (!response.ok) {
      let errorMessage = `Discord API error: ${response.status}`;
      
      if (response.status === 401) {
        errorMessage = 'Token do bot inválido ou expirado.';
      } else if (response.status === 403) {
        errorMessage = 'Bot não tem permissão para acessar esta informação.';
      } else if (response.status === 429) {
        errorMessage = 'Muitas requisições. Tente novamente mais tarde.';
      }

      // Tentar extrair erro detalhado da resposta
      let errorData = null;
      try {
        errorData = await response.json();
      } catch (e) {
        // Ignorar erro de parsing
      }
      
      console.error(`Erro Discord API: ${response.status}`, errorData);
      
      return res.status(response.status).json({
        success: false,
        error: errorMessage,
        details: errorData
      });
    }

    const data = await response.json();

    // Opcional: Filtrar dados sensíveis ou limitar resposta
    const sanitizedData = data.map(guild => ({
      id: guild.id,
      name: guild.name,
      icon: guild.icon,
      owner: guild.owner,
      permissions: guild.permissions,
      features: guild.features,
      approximate_member_count: guild.approximate_member_count,
      approximate_presence_count: guild.approximate_presence_count
    }));

    // Resposta de sucesso
    res.status(200).json({
      success: true,
      data: sanitizedData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao buscar guilds do Discord:', error);
    
    // Tratar erro de timeout
    if (error.name === 'AbortError') {
      return res.status(504).json({
        success: false,
        error: 'Timeout ao conectar com Discord API.'
      });
    }
    
    // Tratar erros de rede
    if (error.cause?.code === 'ECONNREFUSED' || error.cause?.code === 'ENOTFOUND') {
      return res.status(503).json({
        success: false,
        error: 'Não foi possível conectar ao Discord.'
      });
    }
    
    // Erro genérico
    res.status(500).json({
      success: false,
      error: 'Erro interno ao processar requisição.'
    });
  }
}