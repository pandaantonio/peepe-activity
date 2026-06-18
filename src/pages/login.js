// pages/login.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FiUser, FiLock, FiArrowRight } from 'react-icons/fi';
import { FaDiscord } from 'react-icons/fa';
import { useDiscord } from '@/contexts/DiscordContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { isDiscordFrame, isContextReady, currentUserRaw } = useDiscord();
  const router = useRouter();

  // Busca a conta vinculada ao ID do Discord ativo e autocompleta o username
  const handleFetchDiscordAccount = async () => {
    if (!currentUserRaw?.id) return;
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/discord-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discordId: currentUserRaw.id })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Conta do Discord não vinculada.');
      }

      setUsername(data.username);
      setSuccess('Conta localizada! Agora basta digitar a sua senha.');
    } catch (err) {
      setError(err.message + ' Cadastre-se ou use o formulário tradicional.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Erro ao fazer login.');
      }

      localStorage.setItem('user', JSON.stringify({ 
        username: data.username, 
        discordId: data.discordId 
      }));

      router.push('/');
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
        <div className="absolute inset-0 bg-[radial-gradient(at_50%_30%,rgba(34,211,238,0.1)_0%,transparent_60%)]"></div>
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.6) 0.8px, transparent 1px)', backgroundSize: '70px 70px', opacity: 0.45 }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[130px]" />
        <div className="absolute top-1/4 right-1/3 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="glass-card p-8 rounded-3xl border border-cyan-500/20 shadow-cyan-500/10 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent mb-2 drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]">
              Iniciar Missão
            </h1>
            <p className="text-gray-400 text-sm">Insira suas credenciais de acesso</p>
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
              onClick={handleFetchDiscordAccount}
              className="w-full mb-5 bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#5865F2]/20 text-sm"
            >
              <FaDiscord size={18} />
              Encontrar conta via Discord
            </button>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-gray-400 text-xs uppercase font-semibold tracking-wider mb-2">Username</label>
              <div className="relative">
                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-zA-Z0-9_.]/g, ''))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder="Seu username"
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
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? 'Autenticando...' : 'Entrar'}
              <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            Novo por aqui?{' '}
            <Link href="/register" className="text-cyan-400 hover:underline">
              Criar uma conta
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