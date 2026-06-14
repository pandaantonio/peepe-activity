// contexts/DiscordContext.js
import { createContext, useContext, useEffect, useState } from 'react';
import { getDiscordSDK, setupDiscordSdk } from '@/lib/discord';
import { logInfo, logWarn, logError, logSuccess } from '@/lib/debugLogger';

export const DiscordContext = createContext(null);

export function DiscordProvider({ children }) {
  const [discordSdk, setDiscordSdk] = useState(null);
  const [auth, setAuth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDiscordFrame, setIsDiscordFrame] = useState(false);

  useEffect(() => {
    async function init() {
      if (typeof window === 'undefined') {
        logInfo("[CONTEXT] window undefined (SSR), pulando init");
        return;
      }

      logInfo("[CONTEXT] === INICIANDO DiscordProvider ===");

      // 1. Identificação do ambiente
      const params = new URLSearchParams(window.location.search);
      const frameId = params.get('frame_id');
      const isFrame = !!frameId || 
                      window.location.ancestorOrigins?.contains('https://discord.com') ||
                      (typeof navigator !== 'undefined' && navigator.userAgent.includes('Discord'));

      logInfo("[CONTEXT] Detecção de ambiente", {
        frameId,
        isFrame,
        ancestorOrigins: window.location.ancestorOrigins?.[0],
        userAgent: navigator.userAgent?.substring(0, 50),
        href: window.location.href
      });

      setIsDiscordFrame(isFrame);

      if (!isFrame) {
        logWarn("[CONTEXT] Modo standalone detectado - Navegador Web convencional");
        setLoading(false);
        return;
      }

      // 2. Inicialização do SDK
      try {
        logInfo("[CONTEXT] Ambiente Discord detectado. Inicializando SDK...");

        const sdk = getDiscordSDK();
        if (!sdk) {
          throw new Error("Não foi possível instanciar o Discord SDK.");
        }
        setDiscordSdk(sdk);

        logInfo("[CONTEXT] Chamando setupDiscordSdk()...");
        const userAuth = await setupDiscordSdk();

        if (userAuth) {
          logSuccess("[CONTEXT] Autenticação obtida com sucesso", {
            hasUser: !!userAuth.user,
            username: userAuth.user?.username,
            hasAccessToken: !!userAuth.access_token
          });
          setAuth(userAuth);
        } else {
          logError("[CONTEXT] setupDiscordSdk() retornou null - autenticação falhou");
          setError("Falha na autenticação com Discord.");
        }

      } catch (err) {
        logError("[CONTEXT] Erro crítico na inicialização", {
          message: err.message,
          name: err.name
        });
        setError(err.message || String(err));
      } finally {
        logInfo("[CONTEXT] Init finalizado, setLoading(false)");
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
    isContextReady: !loading
  };

  logInfo("[CONTEXT] Renderizando provider", {
    loading,
    isDiscordFrame,
    isAuthenticated: value.isAuthenticated,
    hasAuth: !!auth,
    hasError: !!error
  });

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
