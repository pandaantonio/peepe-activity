// pages/dashboard.js
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useDiscord } from '@/contexts/DiscordContext';

export default function Dashboard() {
  const router = useRouter();
  const { auth, isDiscordFrame, loading: discordLoading } = useDiscord();
  const [guilds, setGuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    // Evita múltiplas chamadas
    if (hasFetched.current) return;
    
    if (discordLoading) return;

    if (!isDiscordFrame) {
      setError('Dashboard disponível apenas dentro do Discord.');
      setLoading(false);
      return;
    }

    if (!auth?.access_token) {
      setError('Não autenticado no Discord. Tente novamente.');
      setLoading(false);
      return;
    }

    async function fetchGuilds() {
      try {
        console.log('Buscando guilds via API com token...');
        
        // Usando o endpoint correto /api/discord/guilds com access_token
        const response = await fetch(`/api/discord/guilds?access_token=${auth.access_token}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.status === 429) {
          const errorData = await response.json();
          const retryAfter = errorData.retry_after || 5;
          throw new Error(`Muitas requisições. Aguarde ${retryAfter} segundos e tente novamente.`);
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Erro ${response.status}`);
        }

        const data = await response.json();
        console.log(`Encontrados ${data.length} servidores`);

        // Filtrar servidores onde o usuário é Administrador (0x8) ou tem permissão de Gerenciar (0x20)
        const adminGuilds = data.filter(guild => {
          const perms = BigInt(guild.permissions);
          const isAdmin = (perms & 0x8n) === 0x8n;
          const canManage = (perms & 0x20n) === 0x20n;
          return isAdmin || canManage;
        });

        console.log(`${adminGuilds.length} servidores com permissão de admin/gerenciamento`);
        setGuilds(adminGuilds);
        setError(null);
        hasFetched.current = true;
      } catch (err) {
        console.error('Erro ao buscar guilds:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchGuilds();
  }, [auth, isDiscordFrame, discordLoading]);

  const handleBackToHub = () => router.push('/');
  
  const getInitials = (name) => {
    if (!name) return '???';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .slice(0, 3)
      .toUpperCase();
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    hasFetched.current = false;
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  if (discordLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0f0f12] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">
            {discordLoading ? "Conectando ao Discord..." : "Carregando servidores..."}
          </p>
          {loading && (
            <p className="text-gray-500 text-sm mt-2">
              Isso pode levar alguns segundos...
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f0f12] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Erro ao Carregar Dashboard</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
            >
              Tentar Novamente
            </button>
            <button
              onClick={handleBackToHub}
              className="w-full px-6 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg transition-colors"
            >
              Voltar ao Hub
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f12] relative">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.03] via-transparent to-purple-500/[0.03] pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto px-6 py-8">
        <button
          onClick={handleBackToHub}
          className="group flex items-center gap-2 px-4 py-2 mb-8 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 text-gray-400 hover:text-white"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span className="text-sm font-medium">Voltar ao HUB</span>
        </button>

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            <span className="text-white">Peepe </span>
            <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">Dashboard</span>
          </h1>
          <p className="text-gray-400 text-lg">Gerencie seus servidores e configure os módulos do bot</p>
          {auth?.user && (
            <p className="text-emerald-400 text-sm mt-2">
              Conectado como {auth.user.username}
            </p>
          )}
        </div>

        {guilds.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-3 px-6 py-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-yellow-400 font-medium">Nenhum servidor encontrado</p>
                <p className="text-yellow-400/70 text-sm">
                  Você precisa ser administrador ou ter permissão de gerenciamento em pelo menos um servidor.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {guilds.map((guild) => {
                const iconUrl = guild.icon 
                  ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128`
                  : null;
                const initials = getInitials(guild.name);

                return (
                  <div
                    key={guild.id}
                    className="group relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-emerald-500/30"
                  >
                    <div className="relative p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-shrink-0">
                          {iconUrl ? (
                            <img
                              src={iconUrl}
                              alt={guild.name}
                              className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/10"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                              <span className="text-white font-bold text-lg">{initials}</span>
                            </div>
                          )}
                        </div>
                        <div className="px-2 py-1 rounded-md bg-white/5 border border-white/10">
                          <span className="text-[10px] font-bold text-gray-500 tracking-wider">DISPONÍVEL</span>
                        </div>
                      </div>

                      <h3 className="text-xl font-bold text-white mb-1">{guild.name}</h3>
                      <p className="text-gray-500 text-xs font-mono mb-5">ID: {guild.id}</p>

                      <button
                        onClick={() => {
                          router.push({
                            pathname: `/guild/${guild.id}`,
                            query: { name: guild.name, icon: guild.icon || '' }
                          });
                        }}
                        className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 group/btn"
                      >
                        <span>CONFIGURAR MÓDULOS</span>
                        <svg 
                          className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-gray-500 text-xs">
                {guilds.length} servidor(es) disponível(eis) para gerenciamento
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}