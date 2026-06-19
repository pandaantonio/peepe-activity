// pages/_app.js
import { DiscordProvider } from '@/contexts/DiscordContext';
import "@/styles/globals.css";

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <DiscordProvider>
      <Component {...pageProps} />
    </DiscordProvider>
  );
}