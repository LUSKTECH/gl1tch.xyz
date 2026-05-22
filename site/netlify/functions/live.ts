import type { Context } from '@netlify/functions';

type CacheEntry = { token: string; expiresAt: number };
let tokenCache: CacheEntry | null = null;

async function getAppToken(): Promise<string | null> {
  const id = Netlify.env.get('TWITCH_CLIENT_ID');
  const secret = Netlify.env.get('TWITCH_CLIENT_SECRET');
  if (!id || !secret) return null;

  if (tokenCache && tokenCache.expiresAt > Date.now() + 30_000) return tokenCache.token;

  const params = new URLSearchParams({ client_id: id, client_secret: secret, grant_type: 'client_credentials' });
  const res = await fetch('https://id.twitch.tv/oauth2/token', { method: 'POST', body: params });
  if (!res.ok) return null;
  const data = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return tokenCache.token;
}

const ALLOWED = new Set(['TorontoGl1tch', 'realstrain']);

export default async (req: Request, _ctx: Context) => {
  const url = new URL(req.url);
  const channel = url.searchParams.get('channel') ?? '';

  if (!ALLOWED.has(channel)) {
    return Response.json({ error: 'invalid channel' }, { status: 400 });
  }

  const headers = {
    'content-type': 'application/json',
    'cache-control': 'public, s-maxage=60, stale-while-revalidate=300',
  };

  const id = Netlify.env.get('TWITCH_CLIENT_ID');
  const token = await getAppToken();
  if (!id || !token) {
    return new Response(JSON.stringify({ live: false, reason: 'not-configured' }), { status: 200, headers });
  }

  const helix = await fetch(`https://api.twitch.tv/helix/streams?user_login=${encodeURIComponent(channel)}`, {
    headers: { 'Client-ID': id, Authorization: `Bearer ${token}` },
  });

  if (!helix.ok) {
    return new Response(JSON.stringify({ live: false, reason: 'helix-error' }), { status: 200, headers });
  }

  const data = (await helix.json()) as { data: Array<{ viewer_count: number; title: string; game_name: string; started_at: string }> };
  const stream = data.data[0];

  if (!stream) {
    return new Response(JSON.stringify({ live: false }), { status: 200, headers });
  }

  return new Response(
    JSON.stringify({
      live: true,
      viewers: stream.viewer_count,
      title: stream.title,
      game: stream.game_name,
      startedAt: stream.started_at,
    }),
    { status: 200, headers },
  );
};

export const config = { path: '/api/live' };
