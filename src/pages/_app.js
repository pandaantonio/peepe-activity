// pages/_app.js
import { DiscordProvider } from '@/contexts/DiscordContext';
import DebugPanel from '@/components/DebugPanel';
import "@/styles/globals.css";

export default function App({ Component, pageProps }) {
  return (
    <DiscordProvider>
      <Component {...pageProps} />
      <DebugPanel />
    </DiscordProvider>
  );
}
