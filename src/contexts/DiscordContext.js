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
      // Evita rodar no Server-Side Rendering (SSR) do Next.js
      if (typeof window === 'undefined') return;

      try {
        const params = new URLSearchParams(window.location.search);
        const frameId = params.get('frame_id');
        
        // Forma robusta de detectar se está no cliente incorporado do Discord
        const isFrame = !!frameId || 
                        window.location.ancestorOrigins?.contains('https://discord.com') ||
                        (typeof navigator !== 'undefined' && navigator.userAgent.includes('Discord'));
        
        setIsDiscordFrame(isFrame);
        
        if (!isFrame) {
          console.log("Modo standalone - Navegador Web convencional ativo");
          setLoading(false);
          return; 
        }

        console.log('Ambiente Discord detectado. Inicializando SDK...');
        const sdk = getDiscordSDK();
        setDiscordSdk(sdk);
        
        // Nota: Certifique-se de que dentro de setupDiscordSdk() você chama await sdk.ready()
        const userAuth = await setupDiscordSdk();
        setAuth(userAuth);
      } catch (err) {
        console.error("Erro crítico ao inicializar Discord:", err);
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
    isAuthenticated: !!(auth && auth.user),
    isContextReady: !loading // Nova flag crucial para segurar a UI enquanto decide o ambiente
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