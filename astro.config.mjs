// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// SITE: the public origin, for example https://anekix.github.io
// BASE_PATH: "/" for a user site (repo named <user>.github.io),
// or "/<repo>/" for a project site. The deploy workflow sets both.
const site = process.env.SITE ?? 'https://anekix.github.io';
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  integrations: [sitemap()],
  markdown: {
    shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' } },
  },
});
