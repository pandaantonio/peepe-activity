// pages/api/discord/guilds.js
// Cache simples em memória
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Permissões necessárias: ADMINISTRATOR ou MANAGE_GUILD
const REQUIRED_PERMISSIONS = 0x8 | 0x20; // 0x8 = ADMINISTRATOR, 0x20 = MANAGE_GUILD

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { access_token } = req.query;
  
  if (!access_token) {
    return res.status(400).json({ error: 'Access token required' });
  }

  // Verificar cache
  const cached = cache.get(access_token);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('Retornando guilds do cache');
    return res.status(200).json(cached.data);
  }

  try {
    const response = await fetch('https://discord.com/api/v10/users/@me/guilds', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    if (response.status === 429) {
      const rateLimit = response.headers.get('x-ratelimit-reset-after');
      const retryAfter = rateLimit ? parseFloat(rateLimit) : 5;
      
      return res.status(429).json({
        error: 'Rate limit exceeded',
        retry_after: retryAfter,
        message: 'Muitas requisições. Aguarde um momento.'
      });
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Discord API error: ${response.status}`
      });
    }

    const data = await response.json();
    
    // Filtrar servidores onde o usuário é dono OU tem permissão de admin OU manage_guild
    const filteredGuilds = data.filter(guild => {
      // Verificar se o usuário é dono
      if (guild.owner) return true;
      
      // Verificar permissões
      const permissions = BigInt(guild.permissions);
      const requiredPerms = BigInt(REQUIRED_PERMISSIONS);
      
      // Usuário tem permissão de ADMINISTRATOR ou MANAGE_GUILD
      return (permissions & requiredPerms) > 0;
    });
    
    // Armazenar em cache
    cache.set(access_token, {
      data: filteredGuilds,
      timestamp: Date.now()
    });

    return res.status(200).json(filteredGuilds);
  } catch (error) {
    console.error('Error fetching guilds:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}