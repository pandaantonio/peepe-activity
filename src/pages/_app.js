// pages/_app.js
import { DiscordProvider } from '@/contexts/DiscordContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import "@/styles/globals.css";

function AppContent({ Component, pageProps }) {
  const router = useRouter();
  
  useEffect(() => {
    // Verifica se está rodando dentro do Discord
    const params = new URLSearchParams(window.location.search);
    const frameId = params.get('frame_id');
    const isDiscord = !!frameId;
    
    // Se não estiver no Discord, redireciona para página de bloqueio
    if (!isDiscord && process.env.NODE_ENV !== 'development') {
      router.replace('/blocked');
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