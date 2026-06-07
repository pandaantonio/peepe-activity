// pages/_app.js
import { DiscordProvider } from '@/contexts/DiscordContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import "@/styles/globals.css";

function AppContent({ Component, pageProps }) {
  const router = useRouter();
  
  useEffect(() => {
    // Verifica se está rodando dentro do Discord APENAS em produção
    // E APENAS se não for a página blocked
    if (process.env.NODE_ENV === 'production') {
      const params = new URLSearchParams(window.location.search);
      const frameId = params.get('frame_id');
      const isDiscord = !!frameId;
      const isBlockedPage = router.pathname === '/blocked';
      
      // Se não estiver no Discord e não estiver na página blocked, redireciona
      if (!isDiscord && !isBlockedPage) {
        router.replace('/blocked');
      }
    }
  }, [router]);
  
  return <Component {...pageProps} />;
}

export default function App({ Component, pageProps }) {
  return (
    <DiscordProvider>
      <AppContent Component={Component} pageProps={pageProps} />
    </DiscordProvider>
  );
}