// pages/dashboard/[id].js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useDiscord } from '@/contexts/DiscordContext';
import Link from 'next/link';
import { 
  FaArrowLeft, 
  FaDiscord, 
  FaUserPlus, 
  FaShieldAlt, 
  FaRobot, 
  FaCog,
  FaChevronRight,
  FaUsers,
  FaLink,      // Adicionado para o Anti-Link
  FaUserShield // Adicionado para o Anti-Invite
} from 'react-icons/fa';

export default function GuildDashboard() {
  const router = useRouter();
  const { id } = router.query;
  const { auth, isDiscordFrame, loading: discordLoading } = useDiscord();
  const [guild, setGuild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id || discordLoading) return;

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

    async function fetchGuildInfo() {
      try {
        console.log(`Buscando informações do servidor ${id}...`);
        
        const response = await fetch(`/api/discord/guilds?access_token=${auth.access_token}`);
        
        if (!response.ok) {
          throw new Error(`Erro ${response.status} ao buscar servidores`);
        }
        
        const guilds = await response.json();
        const foundGuild = guilds.find(g => g.id === id);
        
        if (!foundGuild) {
          setError('Servidor não encontrado ou você não tem permissão para gerenciá-lo.');
          setLoading(false);
          return;
        }
        
        setGuild(foundGuild);
      } catch (err) {
        console.error('Erro ao buscar informações do servidor:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchGuildInfo();
  }, [id, auth, isDiscordFrame, discordLoading]);

  const handleBackToDashboard = () => router.push('/dashboard');

  const getIconUrl = () => {
    if (!guild?.icon) return null;
    return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128`;
  };

  if (discordLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0f0f12] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">
            Carregando informações do servidor...
          </p>
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
          <h2 className="text-xl font-bold text-white mb-2">Erro</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={handleBackToDashboard}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!guild) {
    return (
      <div className="min-h-screen bg-[#0f0f12] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/10 mb-4">
            <FaDiscord size={32} className="text-yellow-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Servidor não encontrado</h2>
          <p className="text-gray-400 mb-6">
            O servidor que você está procurando não existe ou você não tem acesso a ele.
          </p>
          <button
            onClick={handleBackToDashboard}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  const iconUrl = getIconUrl();

  // Cards de configuração
  const configCards = [
    {
      id: 'autorole',
      title: 'Auto Role',
      description: 'Configure cargos automáticos para novos membros entrarem no servidor.',
      icon: <FaUserPlus size={28} />,
      color: 'emerald',
      path: `/dashboard/${guild.id}/autorole`,
      enabled: true
    },
    {
      id: 'antilink',
      title: 'Anti-Link',
      description: 'Bloqueie links maliciosos ou não autorizados enviados nos canais de texto.',
      icon: <FaLink size={26} />,
      color: 'purple',
      path: `/dashboard/${guild.id}/antilink`,
      enabled: true
    },
    {
      id: 'antiinvite',
      title: 'Anti-Invite',
      description: 'Evite a divulgação de outros servidores do Discord bloqueando convites externos.',
      icon: <FaUserShield size={26} />,
      color: 'red',
      path: `/dashboard/${guild.id}/antiinvite`,
      enabled: true
    },
    {
      id: 'moderation',
      title: 'Moderação',
      description: 'Configure sistemas de moderação como warns, mutas e bans.',
      icon: <FaShieldAlt size={28} />,
      color: 'red',
      path: `/dashboard/${guild.id}/moderation`,
      enabled: false
    },
    {
      id: 'welcome',
      title: 'Mensagens de Boas-Vindas',
      description: 'Personalize mensagens de entrada e saída de membros.',
      icon: <FaUsers size={28} />,
      color: 'blue',
      path: `/dashboard/${guild.id}/welcome`,
      enabled: false
    },
    {
      id: 'bot-config',
      title: 'Configurações do Bot',
      description: 'Configure prefixo, logs e outras preferências do bot.',
      icon: <FaRobot size={28} />,
      color: 'purple',
      path: `/dashboard/${guild.id}/config`,
      enabled: false
    },
    {
      id: 'general',
      title: 'Configurações Gerais',
      description: 'Configurações gerais do servidor e integrações.',
      icon: <FaCog size={28} />,
      color: 'gray',
      path: `/dashboard/${guild.id}/general`,
      enabled: false
    }
  ];

  const colorClasses = {
    emerald: {
      border: "hover:border-emerald-500/50",
      bg: "group-hover:bg-emerald-500/5",
      text: "text-emerald-400",
      button: "bg-emerald-500 hover:bg-emerald-600",
      badge: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
    },
    red: {
      border: "hover:border-red-500/50",
      bg: "group-hover:bg-red-500/5",
      text: "text-red-400",
      button: "bg-red-500 hover:bg-red-600",
      badge: "bg-red-500/10 border-red-500/20 text-red-400"
    },
    blue: {
      border: "hover:border-blue-500/50",
      bg: "group-hover:bg-blue-500/5",
      text: "text-blue-400",
      button: "bg-blue-500 hover:bg-blue-600",
      badge: "bg-blue-500/10 border-blue-500/20 text-blue-400"
    },
    purple: {
      border: "hover:border-purple-500/50",
      bg: "group-hover:bg-purple-500/5",
      text: "text-purple-400",
      button: "bg-purple-500 hover:bg-purple-600",
      badge: "bg-purple-500/10 border-purple-500/20 text-purple-400"
    },
    gray: {
      border: "hover:border-gray-500/50",
      bg: "group-hover:bg-gray-500/5",
      text: "text-gray-400",
      button: "bg-gray-500 hover:bg-gray-600",
      badge: "bg-gray-500/10 border-gray-500/20 text-gray-400"
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f12] relative">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.03] via-transparent to-purple-500/[0.03] pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto px-6 py-8">
        {/* Botão Voltar */}
        <button
          onClick={handleBackToDashboard}
          className="group flex items-center gap-2 px-4 py-2 mb-8 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 text-gray-400 hover:text-white"
        >
          <FaArrowLeft size={14} />
          <span className="text-sm font-medium">Voltar ao Dashboard</span>
        </button>

        {/* Header do Servidor */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-4">
            {iconUrl ? (
              <img
                src={iconUrl}
                alt={guild.name}
                className="w-20 h-20 rounded-2xl object-cover ring-2 ring-white/10"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                <FaDiscord size={40} className="text-white" />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-1">{guild.name}</h1>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-gray-400 font-mono">
                  ID: {guild.id}
                </span>
                {guild.features?.includes('COMMUNITY') && (
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-400">
                    Comunidade
                  </span>
                )}
                {guild.features?.includes('VERIFIED') && (
                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400">
                    Verificado
                  </span>
                )}
                <span className="text-xs px-2 py-1 rounded-full bg-white/5 text-gray-400">
                  {guild.approximate_member_count || '?'} membros
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Grid de Configurações */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FaCog size={18} className="text-emerald-400" />
            Módulos Disponíveis
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {configCards.map((card) => {
              const colors = colorClasses[card.color];
              
              if (!card.enabled) {
                return (
                  <div
                    key={card.id}
                    className="relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden opacity-60"
                  >
                    <div className="relative p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`${colors.text}`}>
                          {card.icon}
                        </div>
                        <div className="px-2 py-1 rounded-md bg-gray-500/10 border border-gray-500/20">
                          <span className="text-[10px] font-bold text-gray-400 tracking-wider">EM BREVE</span>
                        </div>
                      </div>

                      <h3 className="text-xl font-bold text-white mb-2">
                        {card.title}
                      </h3>
                      
                      <p className="text-gray-400 text-sm leading-relaxed mb-5">
                        {card.description}
                      </p>

                      <div className="flex items-center justify-between pt-3 border-t border-white/10">
                        <span className="text-xs text-gray-500 font-mono">Em desenvolvimento</span>
                        <div className="w-9 h-9 rounded-full bg-gray-500/20 flex items-center justify-center">
                          <FaChevronRight size={14} className="text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
              
              return (
                <Link
                  key={card.id}
                  href={card.path}
                  className="group cursor-pointer"
                >
                  <div className={`relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${colors.border}`}>
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${colors.bg}`} />
                    
                    <div className="relative p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`${colors.text} transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                          {card.icon}
                        </div>
                        <div className={`px-2 py-1 rounded-md ${colors.badge}`}>
                          <span className="text-[10px] font-bold tracking-wider">DISPONÍVEL</span>
                        </div>
                      </div>

                      <h3 className="text-xl font-bold text-white mb-2 group-hover:translate-x-1 transition-transform duration-300">
                        {card.title}
                      </h3>
                      
                      <p className="text-gray-400 text-sm leading-relaxed mb-5">
                        {card.description}
                      </p>

                      <div className="flex items-center justify-between pt-3 border-t border-white/10">
                        <span className="text-xs text-gray-500 font-mono">Clique para configurar</span>
                        <div className={`w-9 h-9 rounded-full ${colors.button} flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:translate-x-1 shadow-lg`}>
                          <FaChevronRight size={14} className="text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-8 border-t border-white/5 text-center">
          <p className="text-gray-600 text-xs">
            Gerencie as configurações do servidor {guild.name}
          </p>
        </div>
      </div>
    </div>
  );
}