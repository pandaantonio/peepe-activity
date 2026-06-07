// pages/api/discord/guild-roles.js
// Cache simples em memória
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { access_token, guildId } = req.query;
  
  if (!access_token) {
    return res.status(400).json({ error: 'Access token required' });
  }

  if (!guildId) {
    return res.status(400).json({ error: 'guildId required' });
  }

  // Verificar cache (baseado no token + guildId)
  const cacheKey = `${access_token}:${guildId}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('Retornando cargos do cache');
    return res.status(200).json(cached.data);
  }

  try {
    // Primeiro verificar se o usuário tem permissão no servidor
    const userGuildsResponse = await fetch('https://discord.com/api/v10/users/@me/guilds', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    if (!userGuildsResponse.ok) {
      return res.status(userGuildsResponse.status).json({
        error: `Discord API error: ${userGuildsResponse.status}`
      });
    }

    const userGuilds = await userGuildsResponse.json();
    const guild = userGuilds.find(g => g.id === guildId);
    
    if (!guild) {
      return res.status(403).json({ 
        error: 'Você não tem permissão para acessar este servidor' 
      });
    }

    // Verificar permissões do usuário (admin ou manage_guild)
    const REQUIRED_PERMISSIONS = 0x8 | 0x20;
    const permissions = BigInt(guild.permissions);
    const requiredPerms = BigInt(REQUIRED_PERMISSIONS);
    const hasPermission = (permissions & requiredPerms) > 0;

    if (!guild.owner && !hasPermission) {
      return res.status(403).json({ 
        error: 'Você precisa ser administrador ou ter permissão de gerenciar servidor para acessar os cargos' 
      });
    }

    // Buscar cargos do servidor usando token do bot
    const botToken = process.env.DISCORD_BOT_TOKEN;
    if (!botToken) {
      console.error('DISCORD_BOT_TOKEN não configurado');
      return res.status(500).json({ error: 'Bot token not configured' });
    }

    const rolesResponse = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
      headers: {
        'Authorization': `Bot ${botToken}`,
      },
    });

    if (rolesResponse.status === 429) {
      const rateLimit = rolesResponse.headers.get('x-ratelimit-reset-after');
      const retryAfter = rateLimit ? parseFloat(rateLimit) : 5;
      
      return res.status(429).json({
        error: 'Rate limit exceeded',
        retry_after: retryAfter,
        message: 'Muitas requisições. Aguarde um momento.'
      });
    }

    if (!rolesResponse.ok) {
      let errorMessage = `Discord API error: ${rolesResponse.status}`;
      
      if (rolesResponse.status === 401) {
        errorMessage = 'Token do bot inválido ou expirado.';
      } else if (rolesResponse.status === 403) {
        errorMessage = 'Bot não tem permissão para acessar os cargos deste servidor.';
      }

      return res.status(rolesResponse.status).json({
        error: errorMessage
      });
    }

    const roles = await rolesResponse.json();
    
    // Filtrar cargos:
    // - Remover @everyone
    // - Remover cargos gerenciados (integrações/bots)
    // - Ordenar por posição (do maior para o menor)
    const filteredRoles = roles
      .filter(role => role.name !== '@everyone' && !role.managed)
      .sort((a, b) => b.position - a.position)
      .map(role => ({
        id: role.id,
        name: role.name,
        color: role.color ? `#${role.color.toString(16).padStart(6, '0')}` : null,
        position: role.position,
        hoist: role.hoist, // Se o cargo é exibido separadamente
        mentionable: role.mentionable
      }));

    const result = {
      success: true,
      roles: filteredRoles,
      total: filteredRoles.length,
      guildId: guildId,
      guildName: guild.name
    };
    
    // Armazenar em cache
    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching guild roles:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}