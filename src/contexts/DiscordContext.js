// contexts/DiscordContext.js
import { createContext, useContext, useEffect, useState } from 'react';
import { getDiscordSDK, setupDiscordSdk } from '@/lib/discord';

export const DiscordContext = createContext(null);

export function DiscordProvider({ children }) {
  const [discordSdk, setDiscordSdk] = useState(null);
  const [auth, setAuth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDiscordFrame, setIsDiscordFrame] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        // Verifica se está rodando no navegador
        if (typeof window === 'undefined') {
          setLoading(false);
          return;
        }

        // Verifica se está no Discord pelo frame_id OU pelo user agent
        const params = new URLSearchParams(window.location.search);
        const frameId = params.get('frame_id');
        
        // Também verifica se está no Discord pelo user agent
        const isDiscordUserAgent = navigator.userAgent.includes('Discord');
        
        const isFrame = !!frameId || isDiscordUserAgent;
        setIsDiscordFrame(isFrame);
        
        console.log('Discord detection:', { frameId, isDiscordUserAgent, isFrame, url: window.location.href });
        
        const sdk = getDiscordSDK();
        setDiscordSdk(sdk);
        
        // Só tenta autenticar se estiver no Discord
        if (isFrame) {
          console.log('Tentando autenticar no Discord...');
          const userAuth = await setupDiscordSdk();
          console.log('Autenticação resultado:', userAuth);
          setAuth(userAuth);
        } else {
          console.log("Modo standalone - autenticação Discord desabilitada");
          setAuth(null);
        }
      } catch (err) {
        console.error("Erro ao inicializar Discord:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    init();
  }, []);

  const value = {
    discordSdk,
    auth,
    loading,
    error,
    isDiscordFrame,
    isAuthenticated: !!(auth && auth.user)
  };

  return (
    <DiscordContext.Provider value={value}>
      {children}
    </DiscordContext.Provider>
  );
}

export const useDiscord = () => {
  const context = useContext(DiscordContext);
  if (!context) {
    throw new Error('useDiscord must be used within DiscordProvider');
  }
  return context;
};

export default DiscordProvider;