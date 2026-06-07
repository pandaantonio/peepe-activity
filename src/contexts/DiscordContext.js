// contexts/DiscordContext.js
import { createContext, useContext, useEffect, useState } from 'react';
import { getDiscordSDK, setupDiscordSdk } from '@/lib/discord';

// Criar e exportar o contexto
export const DiscordContext = createContext(null);

// Exportar o Provider
export function DiscordProvider({ children }) {
  const [discordSdk, setDiscordSdk] = useState(null);
  const [auth, setAuth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDiscordFrame, setIsDiscordFrame] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        // Verifica se está no Discord
        const params = new URLSearchParams(window.location.search);
        const frameId = params.get('frame_id');
        const isFrame = !!frameId;
        setIsDiscordFrame(isFrame);
        
        const sdk = getDiscordSDK();
        setDiscordSdk(sdk);
        
        // Só tenta autenticar se estiver no Discord
        if (isFrame) {
          const userAuth = await setupDiscordSdk();
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
    isAuthenticated: !!auth && !!auth?.user
  };

  return (
    <DiscordContext.Provider value={value}>
      {children}
    </DiscordContext.Provider>
  );
}

// Exportar o hook useDiscord
export const useDiscord = () => {
  const context = useContext(DiscordContext);
  if (!context) {
    throw new Error('useDiscord must be used within DiscordProvider');
  }
  return context;
};

// Exportação padrão
export default DiscordProvider;