// components/Navbar.js
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FiUser, FiCpu, FiLogOut } from 'react-icons/fi';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const localUser = localStorage.getItem('user');
    if (localUser) {
      try {
        setUser(JSON.parse(localUser));
      } catch (e) {
        console.error("Erro ao carregar utilizador na Navbar", e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#020205]/90 backdrop-blur-md border-b border-white/5 px-6 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        
        {/* MENU ESQUERDO */}
        <div className="flex items-center gap-8">
          <Link href="/" className="text-lg font-semibold hover:text-cyan-400 transition-colors">
            Inicio
          </Link>
        </div>

        {/* PERFIL / LOGOUT */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3 text-white/80 text-sm bg-white/5 px-4 py-1.5 rounded-xl border border-white/5">
              <Link href="/config" className="flex items-center gap-2 hover:text-cyan-400 transition-colors cursor-pointer">
                <div className="w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <FiUser size={13} />
                </div>
                <span className="text-cyan-400 font-bold">{user.username}</span>
              </Link>
              
              <button 
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-400 transition-colors flex items-center border-l border-white/10 pl-3 ml-1"
                title="Sair da Conta"
              >
                <FiLogOut size={16} />
              </button>
            </div>
          ) : (
            <Link href="/login" className="bg-cyan-500 text-black font-semibold text-xs px-4 py-1.5 rounded-xl hover:bg-cyan-400 transition-all">
              Entrar
            </Link>
          )}
        </div>

      </div>
    </nav>
  );
}