import "@/styles/globals.css";
import { DiscordProvider } from '@/contexts/DiscordContext';

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <DiscordProvider>
      <Component {...pageProps} />
    </DiscordProvider>
  );
}