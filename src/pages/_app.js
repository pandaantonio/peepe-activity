// pages/_app.js
import { useEffect, useState } from 'react';
import { setupDiscordSdk } from '@/lib/discord';
import "@/styles/globals.css";

export default function App({ Component, pageProps }) {
  const [discordReady, setDiscordReady] = useState(false);
  const [isDiscordFrame, setIsDiscordFrame] = useState(false);

  useEffect(() => {
    async function initDiscord() {
      // Verifica se está rodando dentro do Discord
      const params = new URLSearchParams(window.location.search);
      const frameId = params.get('frame_id');
      
      if (frameId) {
        setIsDiscordFrame(true);
        await setupDiscordSdk();
      } else {
        console.log("Executando fora do Discord (modo standalone)");
      }
      
      setDiscordReady(true);
    }
    
    initDiscord();
  }, []);

  if (!discordReady) {
    return (
      <div className="min-h-screen bg-[#0f0f12] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">
            {isDiscordFrame ? "Conectando ao Discord..." : "Carregando..."}
          </p>
        </div>
      </div>
    );
  }

  return <Component {...pageProps} />;
}