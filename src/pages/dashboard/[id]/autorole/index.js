// pages/dashboard/[id]/autorole.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useDiscord } from '@/contexts/DiscordContext';
import Link from 'next/link';
import { 
  FaArrowLeft, 
  FaDiscord, 
  FaUserPlus, 
  FaRobot, 
  FaSave, 
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTrash,
  FaPlus
} from 'react-icons/fa';

export default function AutorolePage() {
  const router = useRouter();
  const { id: guildId } = router.query;
  const { auth, isDiscordFrame, loading: discordLoading } = useDiscord();
  
  const [guild, setGuild] = useState(null);
  const [roles, setRoles] = useState([]);
  const [autorole, setAutorole] = useState({ users: [], apps: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedUserRole, setSelectedUserRole] = useState('');
  const [selectedAppRole, setSelectedAppRole] = useState('');

  useEffect(() => {
    if (!guildId || discordLoading) return;

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

    async function fetchData() {
      try {
        setLoading(true);
        
        // Buscar informações do servidor
        const guildsResponse = await fetch(`/api/discord/guilds?access_token=${auth.access_token}`);
        if (!guildsResponse.ok) throw new Error('Erro ao buscar servidor');
        const guilds = await guildsResponse.json();
        const foundGuild = guilds.find(g => g.id === guildId);
        if (!foundGuild) throw new Error('Servidor não encontrado');
        setGuild(foundGuild);

        // Buscar cargos do servidor
        const rolesResponse = await fetch(`/api/discord/guild-roles?access_token=${auth.access_token}&guildId=${guildId}`);
        if (!rolesResponse.ok) throw new Error('Erro ao buscar cargos');
        const rolesData = await rolesResponse.json();
        setRoles(rolesData.roles || []);

        // Buscar configuração atual de autorole
        const autoroleResponse = await fetch(`/api/guild/${guildId}/autorole`);
        if (autoroleResponse.ok) {
          const autoroleData = await autoroleResponse.json();
          setAutorole({
            users: autoroleData.users || [],
            apps: autoroleData.apps || []
          });
        }

      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [guildId, auth, isDiscordFrame, discordLoading]);

  // Obter cargos disponíveis (todos os cargos)
  const getAvailableRolesForUsers = () => {
    return roles.filter(role => !autorole.users.some(r => r.id === role.id));
  };

  const getAvailableRolesForApps = () => {
    return roles.filter(role => !autorole.apps.some(r => r.id === role.id));
  };

  const handleAddUserRole = () => {
    if (!selectedUserRole) return;
    const role = roles.find(r => r.id === selectedUserRole);
    if (!role) return;
    
    if (!autorole.users.some(r => r.id === role.id)) {
      setAutorole(prev => ({
        ...prev,
        users: [...prev.users, { id: role.id, name: role.name }]
      }));
    }
    setSelectedUserRole('');
  };

  const handleAddAppRole = () => {
    if (!selectedAppRole) return;
    const role = roles.find(r => r.id === selectedAppRole);
    if (!role) return;
    
    if (!autorole.apps.some(r => r.id === role.id)) {
      setAutorole(prev => ({
        ...prev,
        apps: [...prev.apps, { id: role.id, name: role.name }]
      }));
    }
    setSelectedAppRole('');
  };

  const handleRemoveUserRole = (roleId) => {
    setAutorole(prev => ({
      ...prev,
      users: prev.users.filter(r => r.id !== roleId)
    }));
  };

  const handleRemoveAppRole = (roleId) => {
    setAutorole(prev => ({
      ...prev,
      apps: prev.apps.filter(r => r.id !== roleId)
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/guild/${guildId}/autorole`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          users: autorole.users,
          apps: autorole.apps
        })
      });

      if (!response.ok) throw new Error('Erro ao salvar configuração');

      setSuccess('Configurações salvas com sucesso!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Erro ao salvar:', err);
      setError(err.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const getIconUrl = () => {
    if (!guild?.icon) return null;
    return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128`;
  };

  if (discordLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0f0f12] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  if (error && !guild) {
    return (
      <div className="min-h-screen bg-[#0f0f12] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-4">
            <FaExclamationTriangle size={32} className="text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Erro</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.push(`/dashboard/${guildId}`)}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  const iconUrl = getIconUrl();
  const availableRolesForUsers = getAvailableRolesForUsers();
  const availableRolesForApps = getAvailableRolesForApps();

  return (
    <div className="min-h-screen bg-[#0f0f12] relative">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.03] via-transparent to-purple-500/[0.03] pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto px-6 py-8">
        {/* Botão Voltar */}
        <button
          onClick={() => router.push(`/dashboard/${guildId}`)}
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
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white/10"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                <FaDiscord size={32} className="text-white" />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white mb-1">Auto Role</h1>
              <p className="text-gray-400 text-sm">
                Configure cargos automáticos para {guild.name}
              </p>
            </div>
          </div>
        </div>

        {/* Mensagens de feedback */}
        {success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 animate-fade-in">
            <FaCheckCircle className="text-emerald-400" size={20} />
            <span className="text-emerald-400">{success}</span>
          </div>
        )}
        
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 animate-fade-in">
            <FaExclamationTriangle className="text-red-400" size={20} />
            <span className="text-red-400">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Auto Role para Usuários */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <FaUserPlus className="text-emerald-400" size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Cargos para Usuários</h2>
                  <p className="text-gray-400 text-sm">
                    Cargos atribuídos automaticamente quando um novo membro entra
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Lista de cargos atuais */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Cargos configurados ({autorole.users.length})
                </label>
                {autorole.users.length === 0 ? (
                  <div className="text-center py-8 bg-white/5 rounded-xl border border-dashed border-white/10">
                    <p className="text-gray-500 text-sm">Nenhum cargo configurado</p>
                    <p className="text-gray-600 text-xs mt-1">Adicione cargos abaixo</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {autorole.users.map(role => (
                      <div
                        key={role.id}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-emerald-400" />
                          <span className="text-white text-sm">{role.name}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveUserRole(role.id)}
                          className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Adicionar novo cargo */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Adicionar novo cargo
                </label>
                <div className="flex gap-3">
                  <select
                    value={selectedUserRole}
                    onChange={(e) => setSelectedUserRole(e.target.value)}
                    className="flex-1 px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                  >
                    <option value="">Selecione um cargo</option>
                    {availableRolesForUsers.map(role => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddUserRole}
                    disabled={!selectedUserRole}
                    className="px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaPlus size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Auto Role para Apps/Bots */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <FaRobot className="text-purple-400" size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Cargos para Apps/Bots</h2>
                  <p className="text-gray-400 text-sm">
                    Cargos atribuídos automaticamente quando um bot entra no servidor
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Lista de cargos atuais */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Cargos configurados ({autorole.apps.length})
                </label>
                {autorole.apps.length === 0 ? (
                  <div className="text-center py-8 bg-white/5 rounded-xl border border-dashed border-white/10">
                    <p className="text-gray-500 text-sm">Nenhum cargo configurado</p>
                    <p className="text-gray-600 text-xs mt-1">Adicione cargos abaixo</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {autorole.apps.map(role => (
                      <div
                        key={role.id}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-purple-400" />
                          <span className="text-white text-sm">{role.name}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveAppRole(role.id)}
                          className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Adicionar novo cargo */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Adicionar novo cargo
                </label>
                <div className="flex gap-3">
                  <select
                    value={selectedAppRole}
                    onChange={(e) => setSelectedAppRole(e.target.value)}
                    className="flex-1 px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                  >
                    <option value="">Selecione um cargo</option>
                    {availableRolesForApps.map(role => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddAppRole}
                    disabled={!selectedAppRole}
                    className="px-4 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 text-purple-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaPlus size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botão Salvar */}
        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={() => router.push(`/dashboard/${guildId}`)}
            className="px-6 py-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <FaSpinner className="animate-spin" size={16} />
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

        {/* Footer */}
        <div className="mt-8 pt-8 border-t border-white/5 text-center">
          <p className="text-gray-600 text-xs">
            Os cargos serão atribuídos automaticamente quando novos membros ou bots entrarem no servidor
          </p>
          <p className="text-gray-600 text-xs mt-1">
            💡 O mesmo cargo pode ser usado para usuários E apps/bots simultaneamente
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}