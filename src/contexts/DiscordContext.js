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
      if (typeof window === 'undefined') return;

      // 1. Identificação imediata do ambiente
      const params = new URLSearchParams(window.location.search);
      const frameId = params.get('frame_id');
      const isFrame = !!frameId || 
                      window.location.ancestorOrigins?.contains('https://discord.com') ||
                      (typeof navigator !== 'undefined' && navigator.userAgent.includes('Discord'));
      
      setIsDiscordFrame(isFrame);
      
      if (!isFrame) {
        console.log("Modo standalone - Navegador Web convencional ativo");
        setLoading(false);
        return; 
      }

      // 2. Inicialização protegida do SDK do Discord
      try {
        console.log('Ambiente Discord detectado. Inicializando SDK...');
        
        // Garante que a importação ou chamada do método não vai quebrar o fluxo global
        const sdk = getDiscordSDK();
        if (!sdk) {
          throw new Error("Não foi possível instanciar o Discord SDK.");
        }
        setDiscordSdk(sdk);
        
        // Executa a autenticação configurada na sua lib
        const userAuth = await setupDiscordSdk();
        setAuth(userAuth);
        
      } catch (err) {
        // Se houver qualquer falha de token, handshake ou configuração no portal, 
        // o app não fica travado em branco. Ele loga o erro e libera a renderização.
        console.error("Erro crítico contornado na inicialização do Discord:", err);
        setError(err.message || String(err));
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
    isContextReady: !loading // Libera a renderização da página mesmo se houve um erro (fallback)
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