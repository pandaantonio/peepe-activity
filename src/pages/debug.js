// pages/debug.js
import { useDiscord } from '@/contexts/DiscordContext';

export default function DebugPage() {
  const { auth, loading, error, isDiscordFrame, isAuthenticated } = useDiscord();

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Info</h1>
      
      <div className="space-y-4">
        <div className="bg-white/10 p-4 rounded">
          <h2 className="font-bold mb-2">Status:</h2>
          <p>Loading: {loading ? 'Yes' : 'No'}</p>
          <p>Is Discord Frame: {isDiscordFrame ? 'Yes' : 'No'}</p>
          <p>Is Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
          {error && <p className="text-red-500">Error: {error}</p>}
        </div>

        <div className="bg-white/10 p-4 rounded">
          <h2 className="font-bold mb-2">URL Info:</h2>
          <p>URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}</p>
          <p>Frame ID param: {typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('frame_id') : 'N/A'}</p>
        </div>

        <div className="bg-white/10 p-4 rounded">
          <h2 className="font-bold mb-2">User Agent:</h2>
          <p>{typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}</p>
        </div>

        <div className="bg-white/10 p-4 rounded">
          <h2 className="font-bold mb-2">Auth Data:</h2>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(auth, null, 2)}
          </pre>
        </div>

        <div className="bg-white/10 p-4 rounded">
          <h2 className="font-bold mb-2">Environment:</h2>
          <p>NEXT_PUBLIC_DISCORD_CLIENT_ID: {process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || 'Not set'}</p>
          <p>NODE_ENV: {process.env.NODE_ENV}</p>
        </div>
      </div>
    </div>
  );
}