// pages/dashboard/[id].js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useDiscord } from '@/contexts/DiscordContext';
import Link from 'next/link';
import { FaShieldAlt, FaLink, FaArrowLeft, FaDiscord, FaGlobe, FaSave, FaTrash } from 'react-icons/fa';
import { FiSettings, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';

export default function GuildDashboard() {
  const router = useRouter();
  const { id } = router.query;
  const { auth, isDiscordFrame } = useDiscord();
  
  const [guild, setGuild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Configurações
  const [antiInvite, setAntiInvite] = useState({
    enabled: false,
    action: 'delete', // delete, kick, ban, warn
    message: '❌ Convites não são permitidos neste servidor!'
  });
  
  const [antiLink, setAntiLink] = useState({
    enabled: false,
    action: 'delete', // delete, kick, ban, warn
    whitelist: ['youtube.com', 'youtu.be', 'twitch.tv', 'github.com', 'discord.gg'], // links permitidos
    message: '🔗 Links externos não são permitidos neste servidor!'
  });
  
  const [whitelistInput, setWhitelistInput] = useState('');

  // Buscar configurações do servidor
  useEffect(() => {
    if (!id) return;
    
    const fetchGuildSettings = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/discord/guild/${id}/settings`, {
          headers: {
            'Authorization': `Bearer ${auth?.access_token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.antiInvite) setAntiInvite(data.antiInvite);
          if (data.antiLink) setAntiLink(data.antiLink);
        }
      } catch (err) {
        console.error('Erro ao carregar configurações:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (auth?.access_token) {
      fetchGuildSettings();
    } else {
      setLoading(false);
    }
  }, [id, auth]);

  // Buscar informações do servidor
  useEffect(() => {
    if (!id || !auth?.access_token) return;
    
    const fetchGuild = async () => {
      try {
        const response = await fetch(`/api/discord/guilds?access_token=${auth.access_token}`);
        const data = await response.json();
        const foundGuild = data.find(g => g.id === id);
        if (foundGuild) setGuild(foundGuild);
      } catch (err) {
        console.error('Erro ao buscar servidor:', err);
      }
    };
    
    fetchGuild();
  }, [id, auth]);

  const addToWhitelist = () => {
    if (whitelistInput && !antiLink.whitelist.includes(whitelistInput.toLowerCase())) {
      setAntiLink(prev => ({
        ...prev,
        whitelist: [...prev.whitelist, whitelistInput.toLowerCase()]
      }));
      setWhitelistInput('');
    }
  };

  const removeFromWhitelist = (domain) => {
    setAntiLink(prev => ({
      ...prev,
      whitelist: prev.whitelist.filter(d => d !== domain)
    }));
  };

  const saveSettings = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch(`/api/discord/guild/${id}/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth?.access_token}`
        },
        body: JSON.stringify({
          antiInvite,
          antiLink
        })
      });
      
      if (!response.ok) throw new Error('Erro ao salvar configurações');
      
      setSuccess('✅ Configurações salvas com sucesso!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const ActionButton = ({ action, currentAction, onChange, label }) => (
    <button
      onClick={() => onChange(action)}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
        currentAction === action
          ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-400'
          : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
      }`}
    >
      {label}
    </button>
  );

  const getActionLabel = (action) => {
    const labels = {
      delete: '🗑️ Deletar',
      kick: '👢 Kickar',
      ban: '🔨 Banir',
      warn: '⚠️ Avisar'
    };
    return labels[action] || action;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f12] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f12]">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-emerald-500/[0.02] via-transparent to-purple-500/[0.02] pointer-events-none" />

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-[#0f0f12]/80 backdrop-blur-md border-b border-white/10 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                <FaArrowLeft className="text-gray-400" />
              </Link>
              <div className="flex items-center gap-3">
                {guild?.icon ? (
                  <img
                    src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=64`}
                    alt={guild?.name}
                    className="w-10 h-10 rounded-xl"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                    <FaDiscord className="text-white" />
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-bold text-white">{guild?.name || 'Servidor'}</h1>
                  <p className="text-xs text-gray-500">ID: {id}</p>
                </div>
              </div>
            </div>
            
            <button
              onClick={saveSettings}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-xl font-medium text-white transition-all disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <FaSave size={16} />
                  <span>Salvar Configurações</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative pt-24 pb-12 px-6 max-w-5xl mx-auto">
        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
            <FiCheckCircle className="text-emerald-400" size={20} />
            <span className="text-emerald-400">{success}</span>
          </div>
        )}
        
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
            <FiAlertTriangle className="text-red-400" size={20} />
            <span className="text-red-400">{error}</span>
          </div>
        )}

        {/* Anti Invite Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <FaDiscord size={24} className="text-red-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Anti Invite</h2>
                  <p className="text-sm text-gray-400">Bloqueia convites de Discord no servidor</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={antiInvite.enabled}
                  onChange={(e) => setAntiInvite(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {antiInvite.enabled && (
              <div className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Ação ao detectar convite</label>
                  <div className="flex gap-2 flex-wrap">
                    <ActionButton action="delete" currentAction={antiInvite.action} onChange={(a) => setAntiInvite(prev => ({ ...prev, action: a }))} label="🗑️ Deletar" />
                    <ActionButton action="warn" currentAction={antiInvite.action} onChange={(a) => setAntiInvite(prev => ({ ...prev, action: a }))} label="⚠️ Avisar" />
                    <ActionButton action="kick" currentAction={antiInvite.action} onChange={(a) => setAntiInvite(prev => ({ ...prev, action: a }))} label="👢 Kickar" />
                    <ActionButton action="ban" currentAction={antiInvite.action} onChange={(a) => setAntiInvite(prev => ({ ...prev, action: a }))} label="🔨 Banir" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Mensagem de resposta</label>
                  <textarea
                    value={antiInvite.message}
                    onChange={(e) => setAntiInvite(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white resize-none"
                    rows="2"
                    placeholder="Mensagem enviada ao usuário..."
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Anti Link Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <FaLink size={24} className="text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Anti Link</h2>
                  <p className="text-sm text-gray-400">Bloqueia links suspeitos no servidor</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={antiLink.enabled}
                  onChange={(e) => setAntiLink(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {antiLink.enabled && (
              <div className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Ação ao detectar link</label>
                  <div className="flex gap-2 flex-wrap">
                    <ActionButton action="delete" currentAction={antiLink.action} onChange={(a) => setAntiLink(prev => ({ ...prev, action: a }))} label="🗑️ Deletar" />
                    <ActionButton action="warn" currentAction={antiLink.action} onChange={(a) => setAntiLink(prev => ({ ...prev, action: a }))} label="⚠️ Avisar" />
                    <ActionButton action="kick" currentAction={antiLink.action} onChange={(a) => setAntiLink(prev => ({ ...prev, action: a }))} label="👢 Kickar" />
                    <ActionButton action="ban" currentAction={antiLink.action} onChange={(a) => setAntiLink(prev => ({ ...prev, action: a }))} label="🔨 Banir" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Whitelist (domínios permitidos)</label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={whitelistInput}
                      onChange={(e) => setWhitelistInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addToWhitelist()}
                      className="flex-1 px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white"
                      placeholder="Ex: youtube.com"
                    />
                    <button
                      onClick={addToWhitelist}
                      className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400 hover:bg-emerald-500/30 transition-all"
                    >
                      Adicionar
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {antiLink.whitelist.map(domain => (
                      <div key={domain} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg">
                        <FaGlobe size={12} className="text-emerald-400" />
                        <span className="text-sm text-gray-300">{domain}</span>
                        <button
                          onClick={() => removeFromWhitelist(domain)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                  {antiLink.whitelist.length === 0 && (
                    <p className="text-sm text-gray-500">Nenhum domínio na whitelist. Todos os links serão bloqueados.</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Mensagem de resposta</label>
                  <textarea
                    value={antiLink.message}
                    onChange={(e) => setAntiLink(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white resize-none"
                    rows="2"
                    placeholder="Mensagem enviada ao usuário..."
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
              <FiSettings size={20} className="text-purple-400" />
            </div>
            <div>
              <h3 className="text-white font-medium mb-1">Sobre as configurações</h3>
              <p className="text-sm text-gray-400">
                • <strong>Deletar</strong>: Remove a mensagem automaticamente<br />
                • <strong>Avisar</strong>: Envia um aviso para o usuário<br />
                • <strong>Kickar</strong>: Expulsa o usuário do servidor<br />
                • <strong>Banir</strong>: Bane o usuário permanentemente<br />
                • <strong>Whitelist</strong>: Domínios que não serão bloqueados
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}