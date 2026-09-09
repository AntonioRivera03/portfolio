# Option 2 — Dispatch

A dedicated project network at `/projects-yard`. Selecting an endpoint routes packets, raises its Blender module, opens its internal mechanism, and moves the Three.js camera. The workspace unfolds into a workflow, interface example, feature breakdown, and an explicitly simulated execution log. The direct project index works without WebGL. Motion defaults to paused when reduced motion is requested; pause, signal visibility, camera reset, and full/isolate controls remain available.

## Content provenance



Project data lives in `lib/yard-projects.ts`. AICorn and LivedMatch are existing projects. Kernel, Latch, Tracepoint, and Pagecache are clearly labeled design concepts; their interfaces and capabilities are proposals, not claims of released implementations. AICorn credits its upstream project, [Aycorn](https://github.com/waseem-polus/aycorn).

Actual AICorn functionality was checked against its [README](https://github.com/AntonioRivera03/AIcorn/blob/main/README.md) and [Conductor documentation](https://github.com/AntonioRivera03/AIcorn/blob/main/Documentation/conductor-mode.md). One agent runs at a time; human review precedes local merging. LivedMatch descriptions follow the existing portfolio and [public website](https://www.livedmatch.com).

The open-source section lists verified merged PRs to Antonio's own public repositories, not external upstream contributions. Exact source URLs and titles are in `lib/yard-contributions.ts`; verified September 9, 2026.


## Original assets

- `public/models/dispatch/dispatch.glb`: custom Blender assembly, 2.61 MB, 52,752 triangles, 56 draws. Six independent modules plus MemoryBlades, ComputeDie, VaultLid and StorageCartridges subrigs.
- `public/images/dispatch/dispatch.png`: inspected 1600 × 1000 transparent render, used as no-WebGL fallback.
- `assets/dispatch/dispatch.blend`, `generate-dispatch.py`, `metadata.json`: editable source, generator and pivots/routes. `DISPATCH_ASSET_OUTPUT` sets generator output directory.
- `public/images/dispatch/network-city.png`: original supporting imagegen artwork.

## Imagegen provenance


- Original absolute output path: `/home/hal/.codex/generated_images/01a08461-0441-7c32-9a39-612798acc320/exec-5b20fa03-43b8-4df4-b9fd-2babc9dea17f.png`
- Dimensions: 1536 × 1024 pixels
- Mode: built-in imagegen, original generation
- Inspection: dense graphite rack architecture, lime cable routes, silver connectors, white indicators; no visible text or logos.

### Exact prompt

```text
Use case: product-mockup
Asset type: one original supporting editorial photograph for "Dispatch", a dark technical operational network projects page. Landscape 1536x1024.
Scene/backdrop: night studio, nearly black navy background, a broad black architectural slab receding into depth.
Subject: a dense physical data-routing board imagined as a high-end architectural scale model. Rectilinear graphite rack modules of different heights create a deep operational city across the slab. Small acid-lime fiber traces run in clean purposeful geometric paths between modules. Tiny silver connectors, very fine service paths and a few precise white indicator lights. Exquisitely machined mechanical detail at multiple scales.
Style/medium: believable professional premium product photograph of an actual fabricated model, futuristic engineering with concrete physical light and shadow, tactile matte graphite surfaces and tiny brushed metal details.
Composition/framing: camera very low at one edge, looking diagonally across a broad panoramic network city. Strong depth from foreground modules through many smaller modules receding across the slab. Architecture occupies most of the frame; narrow dark background above. Fine routing paths visibly connect modules rather than appearing as random glowing decoration.
Lighting/mood: dramatic night studio, restrained cold rim light and clear small chartreuse highlights, crisp physically plausible shadows, technical and quietly powerful.
Color palette: nearly black navy and matte graphite, clean bright chartreuse / acid lime accents, tiny silver and white details. Absolutely no ivory or copper.
Constraints: no words, letters, numbers, logos, labels, watermark, screen interfaces, charts, UI or typography. One image only.
Avoid: spherical reactor, rings, glowing orbs, rainbow neon, orange traces, copper-colored circuit boards, white ceramic substrate, cyberpunk streets, people, stock chip branding, excessive bloom, glossy plastic, generic synthetic render.
```

