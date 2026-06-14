// pages/dashboard/[id]/antiinvite.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useDiscord } from '@/contexts/DiscordContext';
import { 
  FaArrowLeft, 
  FaUserShield, 
  FaPlus, 
  FaTrashAlt, 
  FaSave, 
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle
} from 'react-icons/fa';

export default function AntiInviteConfig() {
  const router = useRouter();
  const { id: guildId } = router.query;
  const { auth, isDiscordFrame, loading: discordLoading } = useDiscord();

  // Estados de Configuração
  const [enabled, setEnabled] = useState(false);
  const [allowOwnInvites, setAllowOwnInvites] = useState(false);
  const [allowedInvites, setAllowedInvites] = useState([]);
  const [newInvite, setNewInvite] = useState('');

  // Estados de Controle de UI
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Busca as configurações atuais
  useEffect(() => {
    if (!guildId || discordLoading) return;

    if (!isDiscordFrame) {
      setError('Dashboard disponível apenas dentro do Discord.');
      setLoading(false);
      return;
    }

    async function fetchAntiInviteSettings() {
      try {
        const response = await fetch(`/api/guild/${guildId}/antiinvite`);
        if (!response.ok) throw new Error('Erro ao carregar dados do servidor.');
        
        const data = await response.json();
        setEnabled(data.enabled);
        setAllowOwnInvites(data.allowOwnInvites);
        setAllowedInvites(data.allowedInvites);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchAntiInviteSettings();
  }, [guildId, discordLoading, isDiscordFrame]);

  // Salva as configurações modificadas
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/guild/${guildId}/antiinvite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled,
          allowOwnInvites,
          allowedInvites
        })
      });

      if (!response.ok) throw new Error('Falha ao salvar as configurações.');
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Adiciona um convite permitido à Whitelist
  const handleAddInvite = (e) => {
    e.preventDefault();
    let inviteInput = newInvite.trim();
    if (!inviteInput) return;
    
    // Regex para extrair apenas o código do convite caso colem o link completo
    // Captura discord.gg/codigo, discord.com/invite/codigo, etc.
    const inviteRegex = /(?:https?:\/\/)?(?:www\.)?(?:discord\.gg\/|discord\.com\/invite\/)?([A-Za-z0-9-]+)/;
    const match = inviteInput.match(inviteRegex);
    const inviteCode = match ? match[1] : inviteInput;

    if (allowedInvites.includes(inviteCode)) {
      setNewInvite('');
      return;
    }

    setAllowedInvites([...allowedInvites, inviteCode]);
    setNewInvite('');
  };

  // Remove um convite da Whitelist
  const handleRemoveInvite = (inviteToRemove) => {
    setAllowedInvites(allowedInvites.filter(code => code !== inviteToRemove));
  };

  if (discordLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0f0f12] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Carregando módulo Anti-Invite...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f12] text-white relative">
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/[0.02] via-transparent to-transparent pointer-events-none" />
      
      <div className="relative max-w-4xl mx-auto px-6 py-8">
        
        {/* Botão de Retorno */}
        <button
          onClick={() => router.push(`/dashboard/${guildId}`)}
          className="group flex items-center gap-2 px-4 py-2 mb-8 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-gray-400 hover:text-white"
        >
          <FaArrowLeft size={14} />
          <span className="text-sm font-medium">Voltar ao Servidor</span>
        </button>

        {/* Header do Módulo */}
        <div className="flex items-center gap-4 mb-8 p-6 bg-white/5 border border-white/10 rounded-2xl">
          <div className="w-14 h-14 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 border border-red-500/20">
            <FaUserShield size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Proteção Anti-Invite</h1>
            <p className="text-gray-400 text-sm">Evite a divulgação e o roubo de membros bloqueando convites de outros servidores.</p>
          </div>
        </div>

        {/* Notificações Flash */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
            <FaExclamationTriangle size={16} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-400 text-sm">
            <FaCheckCircle size={16} />
            <span>Configurações do Anti-Invite atualizadas!</span>
          </div>
        )}

        {/* Caixa de Configurações Principais */}
        <div className="space-y-6">
          
          {/* Toggle Geral */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">Ativar Anti-Invite</h3>
              <p className="text-gray-400 text-sm max-w-md">Bloqueia o envio de links de convites externos do Discord no chat.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={enabled} 
                onChange={(e) => setEnabled(e.target.checked)} 
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-gray-400 peer-checked:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500" />
            </label>
          </div>

          {/* Subopções baseadas na ativação */}
          <div className={`space-y-6 transition-all duration-300 ${enabled ? 'opacity-100 pointer-events-auto' : 'opacity-40 pointer-events-none'}`}>
            
            {/* Permitir convites do próprio servidor */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-md">Permitir convites deste Servidor</h4>
                <p className="text-gray-400 text-sm max-w-md">O bot vai validar se o convite enviado pertence a este servidor. Se pertencer, o envio será liberado.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={allowOwnInvites} 
                  disabled={!enabled}
                  onChange={(e) => setAllowOwnInvites(e.target.checked)} 
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-gray-400 peer-checked:after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500" />
              </label>
            </div>

            {/* Whitelist de Convites */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-1">Convites Permitidos (Exceções)</h3>
              <p className="text-gray-400 text-sm mb-4">Adicione códigos ou links de servidores parceiros que são permitidos dentro do chat.</p>
              
              <form onSubmit={handleAddInvite} className="flex gap-2 mb-6">
                <input 
                  type="text" 
                  value={newInvite}
                  disabled={!enabled}
                  onChange={(e) => setNewInvite(e.target.value)}
                  placeholder="Ex: discord.gg/exemplo ou apenas o código"
                  className="flex-1 bg-white/5 border border-white/10 focus:border-red-500 outline-none rounded-xl px-4 py-2.5 text-sm transition-all text-white placeholder-gray-500"
                />
                <button
                  type="submit"
                  disabled={!enabled}
                  className="px-4 bg-red-500 hover:bg-red-600 disabled:bg-white/5 disabled:text-gray-500 rounded-xl transition-colors flex items-center justify-center"
                >
                  <FaPlus size={14} />
                </button>
              </form>

              {/* Lista de tags inseridas */}
              <div className="flex flex-wrap gap-2">
                {allowedInvites.length === 0 ? (
                  <p className="text-gray-500 text-xs italic">Nenhum convite externo liberado.</p>
                ) : (
                  allowedInvites.map((code) => (
                    <div 
                      key={code}
                      className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-300 text-xs px-3 py-1.5 rounded-lg"
                    >
                      <span className="font-mono">discord.gg/{code}</span>
                      <button 
                        type="button"
                        onClick={() => handleRemoveInvite(code)}
                        className="text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <FaTrashAlt size={10} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Botão de Ação Salvar */}
          <div className="flex justify-end pt-4 border-t border-white/5">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/10 cursor-pointer"
            >
              {saving ? (
                <>
                  <FaSpinner className="animate-spin" size={16} />
                  <span>Salvando dados...</span>
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
    </div>
  );
}