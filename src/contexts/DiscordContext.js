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
        if (typeof window === 'undefined') {
          setLoading(false);
          return;
        }

        const params = new URLSearchParams(window.location.search);
        const frameId = params.get('frame_id');
        const isDiscordUserAgent = navigator.userAgent.includes('Discord');
        const isFrame = !!frameId || isDiscordUserAgent;
        
        setIsDiscordFrame(isFrame);
        
        // Se NÃO estiver no Discord, pula toda a inicialização pesada do SDK
        if (!isFrame) {
          console.log("Modo standalone - Navegador Web convencional ativo");
          setAuth(null);
          setLoading(false);
          return; 
        }

        // Se estiver no Discord, prossegue com o fluxo da Activity
        console.log('Ambiente Discord detectado. Inicializando SDK...');
        const sdk = getDiscordSDK();
        setDiscordSdk(sdk);
        
        const userAuth = await setupDiscordSdk();
        setAuth(userAuth);
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