// pages/dashboard.js
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useDiscord } from '@/contexts/DiscordContext';
import Link from 'next/link';
import { FaArrowLeft, FaDiscord, FaCog } from 'react-icons/fa';

export default function Dashboard() {
  const router = useRouter();
  const { auth, isDiscordFrame, loading: discordLoading } = useDiscord();
  const [guilds, setGuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    // Evita múltiplas chamadas concorrentes
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
        console.log('Buscando guilds via API...');
        
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

        setGuilds(data);
        setError(null);
        hasFetched.current = true; // Só marca como feito se popular o estado com sucesso
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

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    hasFetched.current = false;
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleConfigureGuild = (guildId) => {
    router.push(`/dashboard/${guildId}`);
  };

  // Transforma a URL do ícone para respeitar o Proxy de Midia das Activities do Discord
  const getDiscordIconUrl = (guild) => {
    if (!guild.icon) return null;
    return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128`;
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
        {/* Botão Voltar */}
        <button
          onClick={handleBackToHub}
          className="group flex items-center gap-2 px-4 py-2 mb-8 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 text-gray-400 hover:text-white"
        >
          <FaArrowLeft size={14} />
          <span className="text-sm font-medium">Voltar ao HUB</span>
        </button>

        {/* Header */}
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
            <div className="inline-flex items-center gap-3 px-6 py-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl mx-auto max-w-xl text-left">
              <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-yellow-400 font-medium">Nenhum servidor encontrado</p>
                <p className="text-yellow-400/70 text-sm mt-1">
                  Verifique se você possui a permissão de **Administrador** ou **Gerenciar Servidor** em suas comunidades.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {guilds.map((guild) => {
                const iconUrl = getDiscordIconUrl(guild);

                return (
                  <div
                    key={guild.id}
                    className="group relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-emerald-500/30"
                  >
                    <div className="relative p-6">
                      {/* Header com ícone e status */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-shrink-0">
                          {iconUrl ? (
                            <img
                              src={iconUrl}
                              alt={guild.name}
                              className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/10"
                              onError={(e) => {
                                // Fallback caso o proxy do Discord bloqueie a imagem direta externa
                                e.target.onerror = null; 
                                e.target.parentElement.innerHTML = `<div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center text-white font-bold">${guild.name.substring(0,2).toUpperCase()}</div>`;
                              }}
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                              <FaDiscord size={24} className="text-white" />
                            </div>
                          )}
                        </div>
                        <div className="px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                          <span className="text-[10px] font-bold text-emerald-400 tracking-wider">DISPONÍVEL</span>
                        </div>
                      </div>

                      {/* Informações do servidor */}
                      <h3 className="text-xl font-bold text-white mb-1 truncate">{guild.name}</h3>
                      <p className="text-gray-500 text-xs font-mono mb-4">ID: {guild.id}</p>

                      {/* Features do servidor */}
                      <div className="flex flex-wrap gap-2 mb-5">
                        {guild.features?.includes('COMMUNITY') && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">Comunidade</span>
                        )}
                        {guild.features?.includes('VERIFIED') && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">Verificado</span>
                        )}
                        {guild.approximate_member_count && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-400">
                            {guild.approximate_member_count} membros
                          </span>
                        )}
                      </div>

                      {/* Botão de configuração */}
                      <button
                        onClick={() => handleConfigureGuild(guild.id)}
                        className="w-full py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 group/btn"
                      >
                        <FaCog size={14} />
                        <span>GERENCIAR SERVIDOR</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Footer */}
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