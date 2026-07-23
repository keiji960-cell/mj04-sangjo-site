import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // 미배포 상태 — 실제 배포 시 확정 도메인으로 교체 필요
  site: 'https://mj04-sangjo-site.vercel.app',
  integrations: [mdx(), sitemap()],
});
