# gl1tch.xyz

The Toronto gl1tch site — a static Astro app deployed to Netlify.

## Develop

```bash
cd site
npm install
npm run dev      # http://localhost:4321
npm run build    # static output → site/dist/
```

## Deploy

`site/netlify.toml` wires the build. Required env vars on Netlify:

| Var | Purpose |
|-----|---------|
| `TWITCH_CLIENT_ID` | Live-status indicator on `/stream` |
| `TWITCH_CLIENT_SECRET` | OAuth client-credentials grant for the Helix API |

Without these, the live pill falls back to "Offline".

## Stack

- Astro 6 (static output) + `@astrojs/netlify` adapter
- Tailwind CSS v4 via `@tailwindcss/vite`
- Self-hosted Orbitron + JetBrains Mono via `@fontsource/*`
- Netlify Forms for the Join Us application
- Netlify Function at `/api/live` for Twitch Helix status
