// hooks/useDiscord.js
import { useEffect, useState } from 'react';
import { getAuth, getDiscordSDK } from '@/lib/discord';

export function useDiscord() {
  const [auth, setAuth] = useState(null);
  const [sdk, setSdk] = useState(null);

  useEffect(() => {
    setAuth(getAuth());
    setSdk(getDiscordSDK());
  }, []);

  return { auth, sdk };
}