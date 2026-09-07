# Antonio Rivera — Portfolio

An editorial portfolio with a custom Blender sculpture, interactive Three.js views, real GitHub contribution data, and focused project stories.

## Develop

```sh
npm install
npm run dev
```

`npm run build` builds the Cloudflare Worker and browser assets. The Sites project is recorded in `.openai/hosting.json`.

## Content

- `app/page.tsx`: profile and project details. LivedMatch and AIcorn are real projects. Kernel is explicitly a proposed project, with an entirely local, scripted simulation.
- `app/sculpture.tsx`: progressively enhanced 3D hero, using `public/images/sculpture.glb` and a transparent render fallback.
- `app/activity.tsx`: keyboard-accessible 30-day contribution landscape.
- `app/api/contributions/route.ts`: retrieves exact public GitHub contribution counts, validates every requested day, and falls back to the dated snapshot if GitHub is unavailable or changes its markup.
- `app/data/contributions.json`: verified public calendar snapshot, including source and retrieval time.

No private repository details, fabricated achievements, or invented project metrics are included. Contact uses the email provided by Antonio: antoniolrivera03@gmail.com. A résumé link can be added once a résumé is provided.

## Design

Manrope and IBM Plex Mono are served locally. The sculpture was created in a separate Blender scene without altering existing scene objects. 3D respects reduced motion, supports manual rotation and material views, and falls back to a rendered image if WebGL is unavailable. Touch scrolling remains native.

## Sources

- https://www.livedmatch.com
- https://github.com/AntonioRivera03/AIcorn
- https://github.com/waseem-polus/aycorn
- https://github.com/AntonioRivera03

The project illustrations are explanatory workflow studies, not screenshots of the products. Role: Software Engineer (provided by Antonio). Location: Dallas, Texas (public GitHub profile).
