// components/ProtectedRoute.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

// Lista de páginas que QUALQUER UM pode acessar sem estar logado
const PUBLIC_ROUTES = ['/login', '/register'];

export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Função que valida se a rota atual exige login
    const authCheck = (url) => {
      const path = url.split('?')[0];
      const localUser = localStorage.getItem('user');

      if (!localUser && !PUBLIC_ROUTES.includes(path)) {
        setAuthorized(false);
        router.push('/login');
      } else {
        setAuthorized(true);
      }
    };

    // Executa a checagem assim que o componente entra na tela
    authCheck(router.asPath);

    // Monitora mudanças de rota (caso o usuário tente mudar de página)
    router.events.on('routeChangeComplete', authCheck);

    return () => {
      router.events.off('routeChangeComplete', authCheck);
    };
  }, [router]);

  // Enquanto estiver verificando se está logado, exibe uma tela preta de carregamento cósmico
  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#05050a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-t-cyan-400 border-white/5 rounded-full animate-spin" />
      </div>
    );
  }

  return children;
}