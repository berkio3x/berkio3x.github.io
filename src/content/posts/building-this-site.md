---
title: Notes on building this site
date: 2026-11-08
description: Astro, a WebGL sea, a live sky and four typefaces.
tags: [web, astro]
---

The site is built with Astro and deployed to GitHub Pages. Every page is plain HTML at build time. The only script that runs all the time draws the sea behind the text.

## The sea

The background is a single fragment shader. Each pixel casts a ray from a camera one unit above a flat plane. If the ray points down, it hits the water. The water height is a sum of a few sine waves plus some noise. The surface normal then decides how much sky it reflects.

```glsl
float t = camHeight / -rd.y;   // distance to the water
vec3 p = ro + rd * t;          // the point we hit
```

Clicking the water adds a ripple: a ring that travels outward and fades over a few seconds.

## A live sky

The sun and moon are not decoration. The page works out where they really are over my desk, right now, from the date and my coordinates. At sunset the sky turns warm. After dark the lighthouse on the little island switches on and its beam sweeps across the horizon. The moon shows its real phase.

## Type

My name on the home page uses Bodoni Moda in italic. Titles use Fraunces with its soft, slightly wonky shapes turned on. Long text uses Newsreader. Everything else uses JetBrains Mono. All four are open-source fonts and are served from this site, so no third party sees your visit.

---

This is a sample post. Replace it, or keep it as a colophon.
