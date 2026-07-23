import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://mj04-sangjo-site-3l8v.vercel.app',
  integrations: [mdx(), sitemap()],
});
