# Antonio Rivera — Portfolio

An editorial portfolio with a detailed Wendelstein 7-X stellarator, interactive Three.js views, real GitHub contribution data, and focused project stories.

## Develop

```sh
npm install
npm run dev
```

`npm run build` builds the Cloudflare Worker and browser assets. The Sites project is recorded in `.openai/hosting.json`.

## Content

- `app/page.tsx`: profile and project entry points. LivedMatch and AICorn are real projects.
- `app/project-cards.tsx`: shared card artwork, also used during the card-to-page transition.
- `app/project-experience.tsx` and `.css`: three themed mini landing pages with reversible card expansion, accessible dialog controls, an illustrative matching shortlist, a Conductor walkthrough, and Kernel’s local scripted permission demo. Kernel remains explicitly a proposed project.
- `public/images/aicorn-conductor.webp`: custom Blender-rendered Conductor network, with animated signal paths layered over the render.
- `app/sculpture.tsx`: Form, Magnetic, and Particle controls, with Particle displayed immediately and no introductory fade.
- `lib/stellarator-scene.ts`: detailed machine, numerical field traces and GPU particle animation.
- `docs/stellarator-research.md`: source ledger, computational method and scientific limitations.
- `public/images/stellarator.glb`: Blender machine built from published W7-X coil centerlines and plasma boundary.
- `public/data/stellarator-fieldlines.json`: verified vacuum field traces, with computation metadata and primary sources.
- `app/activity.tsx`: keyboard-accessible 30-day contribution landscape.
- `app/api/contributions/route.ts`: retrieves exact public GitHub contribution counts, validates every requested day, and falls back to the dated snapshot if GitHub is unavailable or changes its markup.
- `app/data/contributions.json`: verified public calendar snapshot, including source and retrieval time.

No private repository details, fabricated achievements, or invented project metrics are included. Contact uses the email provided by Antonio: antoniolrivera03@gmail.com. The footer includes Antonio’s supplied résumé as a PDF download, plus his LinkedIn and GitHub profiles. The original PDF is preserved at `public/documents/Antonio-Rivera-Resume.pdf`.

## Design

Manrope and IBM Plex Mono are served locally. The stellarator was created in a separate Blender scene without altering existing scene objects. Its coil centerlines and plasma boundary use published Simsopt data (MIT), while casings and supports are visual reconstructions. 3D respects reduced motion and visibility, supports touch/keyboard rotation, and falls back to the selected view’s still image if WebGL is unavailable. The magnetic field is stationary; plasma particle motion is explicitly illustrative. Touch scrolling remains native.

## Sources

- https://www.livedmatch.com
- https://github.com/AntonioRivera03/AIcorn
- https://github.com/waseem-polus/aycorn
- https://github.com/AntonioRivera03

The project illustrations are explanatory workflow studies, not screenshots of the products. LivedMatch’s sample people and compatibility scores are labeled as illustrative. The expanded project copy reflects the project descriptions supplied by Antonio. Role: Software Engineer (provided by Antonio). Location: Austin, Texas (provided by Antonio). About copy and skills reflect Antonio’s supplied résumé.

The hero quotes Zora Neale Hurston, *Dust Tracks on a Road* (1942): “Research is formalized curiosity. It is poking and prying with a purpose.” Source: https://sites.google.com/tc.columbia.edu/watchinggod/invitations-to-create/invitation-20-formalized-curiosity
