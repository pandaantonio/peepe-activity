// pages/dashboard/[id]/antilink.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useDiscord } from '@/contexts/DiscordContext';
import { 
  FaArrowLeft, 
  FaLink, 
  FaPlus, 
  FaTrashAlt, 
  FaSave, 
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle
} from 'react-icons/fa';

export default function AntiLinkConfig() {
  const router = useRouter();
  const { id: guildId } = router.query;
  const { auth, isDiscordFrame, loading: discordLoading } = useDiscord();

  // Estados de Configuração
  const [enabled, setEnabled] = useState(false);
  const [allowMedia, setAllowMedia] = useState(false);
  const [allowSocials, setAllowSocials] = useState(false);
  const [allowedDomains, setAllowedDomains] = useState([]);
  const [newDomain, setNewDomain] = useState('');

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

    async function fetchAntiLinkSettings() {
      try {
        const response = await fetch(`/api/guild/${guildId}/antilink`);
        if (!response.ok) throw new Error('Erro ao carregar dados do servidor.');
        
        const data = await response.json();
        setEnabled(data.enabled);
        setAllowMedia(data.allowMedia);
        setAllowSocials(data.allowSocials);
        setAllowedDomains(data.allowedDomains);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchAntiLinkSettings();
  }, [guildId, discordLoading, isDiscordFrame]);

  // Salva as configurações modificadas
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/guild/${guildId}/antilink`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled,
          allowMedia,
          allowSocials,
          allowedDomains
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

  // Adiciona um domínio à Whitelist
  const handleAddDomain = (e) => {
    e.preventDefault();
    let domain = newDomain.trim().toLowerCase();
    if (!domain) return;
    
    // Regex simples para limpar prefixos comuns de URL se colados pelo usuário
    domain = domain.replace(/^(https?:\/\/)?(www\.)?/, '');

    if (allowedDomains.includes(domain)) {
      setNewDomain('');
      return;
    }

    setAllowedDomains([...allowedDomains, domain]);
    setNewDomain('');
  };

  // Remove um domínio da Whitelist
  const handleRemoveDomain = (domainToRemove) => {
    setAllowedDomains(allowedDomains.filter(domain => domain !== domainToRemove));
  };

  if (discordLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0f0f12] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Carregando módulo Anti-Link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f12] text-white relative">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.02] via-transparent to-transparent pointer-events-none" />
      
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
          <div className="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
            <FaLink size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Proteção Anti-Link</h1>
            <p className="text-gray-400 text-sm">Controle o envio de links externos e filtre o conteúdo do chat.</p>
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
            <span>Configurações atualizadas com sucesso!</span>
          </div>
        )}

        {/* Caixa de Configurações Principais */}
        <div className="space-y-6">
          
          {/* Toggle Geral */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">Ativar Anti-Link</h3>
              <p className="text-gray-400 text-sm max-w-md">Bloqueia globalmente quaisquer mensagens de texto que contenham URLs.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={enabled} 
                onChange={(e) => setEnabled(e.target.checked)} 
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-gray-400 peer-checked:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500" />
            </label>
          </div>

          {/* Subopções (Apenas visíveis/editáveis se o sistema estiver ativo) */}
          <div className={`space-y-6 transition-all duration-300 ${enabled ? 'opacity-100 pointer-events-auto' : 'opacity-40 pointer-events-none'}`}>
            
            {/* Grid de Regras Dinâmicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Permitir Mídias */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between gap-4">
                <div>
                  <h4 className="font-bold text-md">Permitir Links de Mídia</h4>
                  <p className="text-gray-400 text-xs mt-1">Ignora links de imagens e streamings de vídeo comuns (ex: YouTube, Imgur, Tenor).</p>
                </div>
                <div className="flex justify-end">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={allowMedia} 
                      disabled={!enabled}
                      onChange={(e) => setAllowMedia(e.target.checked)} 
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 peer-checked:after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500" />
                  </label>
                </div>
              </div>

              {/* Permitir Redes Sociais */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between gap-4">
                <div>
                  <h4 className="font-bold text-md">Permitir Redes Sociais</h4>
                  <p className="text-gray-400 text-xs mt-1">Ignora hiperlinks que direcionem para perfis externos (ex: Twitter/X, Instagram, TikTok).</p>
                </div>
                <div className="flex justify-end">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={allowSocials} 
                      disabled={!enabled}
                      onChange={(e) => setAllowSocials(e.target.checked)} 
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 peer-checked:after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500" />
                  </label>
                </div>
              </div>

            </div>

            {/* Whitelist de Domínios */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-1">Domínios Confiáveis (Whitelist)</h3>
              <p className="text-gray-400 text-sm mb-4">Adicione sites específicos que o seu Bot deve ignorar e sempre permitir o envio.</p>
              
              <form onSubmit={handleAddDomain} className="flex gap-2 mb-6">
                <input 
                  type="text" 
                  value={newDomain}
                  disabled={!enabled}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="github.com, google.com.br..."
                  className="flex-1 bg-white/5 border border-white/10 focus:border-purple-500 outline-none rounded-xl px-4 py-2.5 text-sm transition-all text-white placeholder-gray-500"
                />
                <button
                  type="submit"
                  disabled={!enabled}
                  className="px-4 bg-purple-500 hover:bg-purple-600 disabled:bg-white/5 disabled:text-gray-500 rounded-xl transition-colors flex items-center justify-center"
                >
                  <FaPlus size={14} />
                </button>
              </form>

              {/* Lista de tags inseridas */}
              <div className="flex flex-wrap gap-2">
                {allowedDomains.length === 0 ? (
                  <p className="text-gray-500 text-xs italic">Nenhum domínio permitido adicionado.</p>
                ) : (
                  allowedDomains.map((domain) => (
                    <div 
                      key={domain}
                      className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs px-3 py-1.5 rounded-lg"
                    >
                      <span className="font-mono">{domain}</span>
                      <button 
                        type="button"
                        onClick={() => handleRemoveDomain(domain)}
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