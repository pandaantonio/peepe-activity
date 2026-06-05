// hooks/useDiscord.js
import { useContext } from 'react';
import { DiscordContext } from '@/contexts/DiscordContext';

export function useDiscord() {
  const context = useContext(DiscordContext);
  
  if (!context) {
    throw new Error('useDiscord must be used within DiscordProvider');
  }
  
  return context;
}

// Também exportar como padrão
export default useDiscord;