// contexts/DiscordContext.js
import { createContext, useContext, useEffect, useState } from 'react';
import { getDiscordSDK, getAuth, setupDiscordSdk } from '@/lib/discord';

const DiscordContext = createContext(null);

export function DiscordProvider({ children }) {
  const [discordSdk, setDiscordSdk] = useState(null);
  const [auth, setAuth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const sdk = getDiscordSDK();
      const userAuth = await setupDiscordSdk();
      setDiscordSdk(sdk);
      setAuth(userAuth);
      setLoading(false);
    }
    
    init();
  }, []);

  return (
    <DiscordContext.Provider value={{ discordSdk, auth, loading }}>
      {children}
    </DiscordContext.Provider>
  );
}

export function useDiscord() {
  const context = useContext(DiscordContext);
  if (!context) {
    throw new Error('useDiscord must be used within DiscordProvider');
  }
  return context;
}