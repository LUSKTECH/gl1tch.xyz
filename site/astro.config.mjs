// @ts-check
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

const SITE = process.env.URL ?? 'https://gl1tch.xyz';

export default defineConfig({
  site: SITE,
  output: 'static',
  adapter: netlify({ imageCDN: true }),
  integrations: [sitemap()],
  vite: { plugins: [tailwindcss()] },
  prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },
});
