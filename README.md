# anekix (v2)

Personal site: portfolio, about page and logbook (blog). Built with [Astro](https://astro.build) and deployed to GitHub Pages.

## Run locally

```sh
npm install
npm run dev        # http://localhost:4321, reloads on save
npm run build      # writes the static site to dist/
```

## Edit content

| What | Where |
| --- | --- |
| Name, tagline, links, projects, experience, coordinates | `src/config.ts` |
| About page text | `src/pages/about.astro` |
| Blog posts | `src/content/posts/*.md` |

A post needs this front matter. Set `draft: true` to hide it from the built site.

```md
---
title: My post
date: 2026-11-11
description: One sentence for the list and the RSS feed.
tags: [web]
---
```

## Deploy

1. Push to the `main` branch.
2. In the repo, open **Settings → Pages** and set **Source** to **GitHub Actions**.

The workflow in `.github/workflows/deploy.yml` builds and publishes the site. It reads the base path from GitHub, so it works for both repo types:

- A repo named `anekix.github.io` serves at `https://anekix.github.io/`.
- Any other repo name, for example `anekix-profile`, serves at `https://anekix.github.io/anekix-profile/`.

## Background

The sea is one WebGL fragment shader in `src/scripts/sea.ts`.

- **Live sky.** In auto mode the sun and moon are drawn where they really are over `SITE.coords`, right now. The maths is in `src/lib/sky.ts`. Sunrise and sunset turn the sky warm.
- **Lighthouse.** An island on the horizon has a lighthouse. Its lamp turns on at dusk and the beam sweeps the sky.
- **Light modes.** The footer button cycles auto, day and night. The choice is saved in the browser.
- **Ripples.** Clicking the water starts a ripple.
- **Fallbacks.** With reduced motion turned on, the shader draws still frames. Without WebGL, the page shows a CSS gradient.

## Other features

- **Command palette.** Press `/`, Cmd+K or Ctrl+K to jump to any page, post, project or link.
- **Message in a bottle.** The bottle on the home page opens a short form that starts an email to `SITE.email`.
