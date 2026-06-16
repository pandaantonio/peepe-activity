// contexts/DiscordContext.js
import { createContext, useContext, useEffect, useState } from 'react';
import { getDiscordSDK, setupDiscordSdk } from '@/lib/discord';
import { logInfo, logWarn, logError, logSuccess } from '@/lib/debugLogger';

// Importando os Eventos do SDK do Discord para o Listener Multiplayer
import { Events } from '@discord/embedded-app-sdk';

export const DiscordContext = createContext(null);

export function DiscordProvider({ children }) {
  const [discordSdk, setDiscordSdk] = useState(null);
  const [auth, setAuth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDiscordFrame, setIsDiscordFrame] = useState(false);
  
  // Novos estados para Multiplayer e Perfil
  const [participants, setParticipants] = useState([]);
  const [userData, setUserData] = useState({ username: '', avatarSrc: '' });

  useEffect(() => {
    let sdkInstance = null;
    let isSubscribed = false;

    // Função de callback para quando a lista de participantes mudar (alguém entra/sai)
    function handleParticipantsUpdate(data) {
      logInfo("[MULTIPLAYER] Participantes atualizados via evento", data.participants);
      setParticipants(data.participants || []);
    }

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
        sdkInstance = sdk; // Guarda a referência local para limpar o evento no return do useEffect
        setDiscordSdk(sdk);

        logInfo("[CONTEXT] Chamando setupDiscordSdk()...");
        const userAuth = await setupDiscordSdk();

        if (userAuth) {
          logSuccess("[CONTEXT] Autenticação obtida com sucesso", {
            hasUser: !!userAuth.user,
            username: userAuth.user?.username,
          });
          setAuth(userAuth);

          // === PROCESSANDO DADOS DO USUÁRIO LOGADO ===
          const user = userAuth.user;
          let avatarUrl = '';
          
          if (user.avatar) {
            avatarUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`;
          } else {
            // Fallback para o índice de avatar padrão baseado na ID (Bitwise shift)
            const defaultAvatarIndex = Number((BigInt(user.id) >> 22n) % 6n);
            avatarUrl = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`;
          }

          const finalUsername = user.global_name ?? `${user.username}${user.discriminator !== '0' ? `#${user.discriminator}` : ''}`;
          
          setUserData({
            username: finalUsername,
            avatarSrc: avatarUrl,
            raw: user // Guarda o objeto original se precisar de IDs depois
          });

          // === LÓGICA MULTIPLAYER (PARTICIPANTES) ===
          logInfo("[MULTIPLAYER] Buscando participantes iniciais...");
          const initialParticipants = await sdk.commands.getInstanceConnectedParticipants();
          setParticipants(initialParticipants.participants || []);

          // Se inscrevendo no evento em tempo real
          logInfo("[MULTIPLAYER] Ativando Listener de entrada/saída de usuários...");
          sdk.subscribe(Events.ACTIVITY_INSTANCE_PARTICIPANTS_UPDATE, handleParticipantsUpdate);
          isSubscribed = true;

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

    // Função de limpeza (Cleanup): Desinscreve do evento quando o app fecha/reinicia
    return () => {
      if (sdkInstance && isSubscribed) {
        try {
          sdkInstance.unsubscribe(Events.ACTIVITY_INSTANCE_PARTICIPANTS_UPDATE, handleParticipantsUpdate);
          console.log("[MULTIPLAYER] Listener removido com sucesso.");
        } catch (e) {
          console.error("Erro ao remover listener do Discord:", e);
        }
      }
    };
  }, []);

  const value = {
    discordSdk,
    auth,
    loading,
    error,
    isDiscordFrame,
    isAuthenticated: !!(auth && auth.user),
    isContextReady: !loading,
    
    // Novas propriedades expostas globalmente
    participants,
    userAvatar: userData.avatarSrc,
    username: userData.username,
    currentUserRaw: userData.raw
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