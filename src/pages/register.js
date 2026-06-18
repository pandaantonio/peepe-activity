// pages/register.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FiUser, FiLock, FiArrowRight } from 'react-icons/fi';
import { FaDiscord } from 'react-icons/fa';
import { useDiscord } from '@/contexts/DiscordContext';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [discordId, setDiscordId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { isDiscordFrame, isContextReady, currentUserRaw } = useDiscord();
  const router = useRouter();

  // Função para injetar dados do Discord no Form
  const handleAutofillDiscord = () => {
    if (currentUserRaw?.username) {
      // Sanitiza o nome do discord transformando espaços/caracteres inválidos em pontos ou removendo-os
      const sanitized = currentUserRaw.username
        .toLowerCase()
        .trim()
        .replace(/[^a-zA-Z0-9_.]/g, '.');
      
      setUsername(sanitized);
      setDiscordId(currentUserRaw.id);
      setSuccess('Dados obtidos do Discord! Defina uma senha para prosseguir.');
      setError('');
    } else {
      setError('Não foi possível obter seus dados do Discord.');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, discordId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Erro ao registrar.');
      }

      router.push('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020205] relative overflow-hidden flex items-center justify-center px-6">
      {/* Fundo Universo (Espacial) */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(at_50%_30%,rgba(139,92,246,0.1)_0%,transparent_60%)]"></div>
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.6) 0.8px, transparent 1px)', backgroundSize: '70px 70px', opacity: 0.45 }}></div>
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[130px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="glass-card p-8 rounded-3xl border border-purple-500/20 shadow-purple-500/10 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent mb-2 drop-shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              Criar Conta Cósmica
            </h1>
            <p className="text-gray-400 text-sm">Escolha seu codinome de explorador</p>
          </div>

          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-sm text-center">
              {success}
            </div>
          )}

          {/* Botão de Integração do Discord */}
          {isDiscordFrame && isContextReady && currentUserRaw && (
            <button
              type="button"
              onClick={handleAutofillDiscord}
              className="w-full mb-5 bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#5865F2]/20 text-sm"
            >
              <FaDiscord size={18} />
              Preencher via Discord
            </button>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-gray-400 text-xs uppercase font-semibold tracking-wider mb-2">Username</label>
              <div className="relative">
                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-zA-Z0-9_.]/g, ''))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="ex: astro.gamer"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-400 text-xs uppercase font-semibold tracking-wider mb-2">Senha</label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {discordId && (
              <input type="hidden" value={discordId} />
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? 'Criando órbita...' : 'Cadastrar'}
              <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            Já tem uma conta?{' '}
            <Link href="/login" className="text-purple-400 hover:underline">
              Fazer Login
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .glass-card {
          background: rgba(10, 10, 15, 0.8);
          backdrop-filter: blur(24px);
        }
      `}</style>
    </div>
  );
}