// components/Navbar.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FiLogOut, FiUser } from 'react-icons/fi';
import { useDiscord } from '@/contexts/DiscordContext';

export default function Navbar() {
  const { isContextReady, isDiscordFrame, username: discordUsername, userAvatar } = useDiscord();
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const localUser = localStorage.getItem('user');
    if (localUser) {
      setUser(JSON.parse(localUser));
    }
  }, [router.asPath]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  const isAuthPage = ['/login', '/register'].includes(router.pathname);
  if (isAuthPage) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#05050a]/60 backdrop-blur-xl border-b border-white/10 px-6 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-purple-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <span className="text-white font-bold text-sm">🌌</span>
          </div>
          <span className="text-white font-semibold tracking-wider text-sm hidden sm:block group-hover:text-cyan-400 transition-colors">
            COSMO CORE
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {isDiscordFrame && discordUsername ? (
            <div className="flex items-center gap-3 text-white/80 text-sm bg-white/5 px-4 py-1.5 rounded-xl border border-white/5">
              <img src={userAvatar} alt={discordUsername} className="w-6 h-6 rounded-full border border-purple-500/30" />
              <span>Olá, <b className="text-purple-400">{discordUsername}</b></span>
            </div>
          ) : (
            user && (
              <div className="flex items-center gap-3 text-white/80 text-sm bg-white/5 px-4 py-1.5 rounded-xl border border-white/5">
                <div className="w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <FiUser size={13} />
                </div>
                <span>Jogador: <b className="text-cyan-400">{user.username}</b></span>
                
                <button 
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-red-400 transition-colors flex items-center gap-1 border-l border-white/10 pl-3 ml-1"
                  title="Sair da Conta"
                >
                  <FiLogOut size={15} />
                  <span className="text-xs">Sair</span>
                </button>
              </div>
            )
          )}
        </div>

      </div>
    </nav>
  );
}