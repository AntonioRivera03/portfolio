# Option 1 — Systems Yard

A dedicated `/projects-yard` page with a precision-machined compute assembly, five selectable software layers, assembled/exploded views, project filters, feature descriptions, interface examples, and explicitly simulated event sequences.

## Content and provenance

Project data lives in `lib/yard-projects.ts`. AICorn and LivedMatch are existing projects. Kernel, Latch, Tracepoint, and Pagecache are clearly labeled design concepts; their interfaces and capabilities are proposals, not claims of released implementations. AICorn credits its upstream project, [Aycorn](https://github.com/waseem-polus/aycorn).

Actual AICorn functionality was checked against its [README](https://github.com/AntonioRivera03/AIcorn/blob/main/README.md) and [Conductor documentation](https://github.com/AntonioRivera03/AIcorn/blob/main/Documentation/conductor-mode.md). One agent runs at a time; human review precedes local merging. LivedMatch descriptions follow the existing portfolio and [public website](https://www.livedmatch.com).

The open-source section lists verified merged PRs to Antonio's own public repositories, not external upstream contributions. Exact source URLs and titles are in `lib/yard-contributions.ts`; verified September 9, 2026.

## Original assets

- `public/models/systems/compute-stack.glb`: Blender-created five-layer assembly, 1.51 MB, 29,772 triangles and 27 mesh draws. Named parent objects `StackLayer_0` through `StackLayer_4` animate along Y.
- `public/images/systems/compute-stack.png`: transparent 1200 × 1400 Blender render, also the no-WebGL fallback.
- `assets/systems/compute-stack.blend`: editable original scene.
- `assets/systems/generate-stack.py`: reproducible generator, creates a new scene non-destructively. Set `SYSTEMS_ASSET_OUTPUT` to change the output directory.
- `public/images/systems/circuit-landscape.png`: original 1536 × 1024 editorial artwork generated using the built-in imagegen tool.

## Imagegen prompt

```text
Use case: product-mockup
Asset type: original wide editorial photographic banner for a grand, high-end industrial systems observatory featuring experimental agents and low-level software projects. Generate one image, landscape 1536x1024.
Scene/backdrop: a minimal nearly black graphite studio environment.
Subject: macro close-up of a precision-fabricated off-white ceramic compute substrate with oxidized copper-orange signal traces and brushed dark graphite aluminum heat sinks. A few restrained warm amber channels thread through the intricate topology. Sharp milled edges, tiny embossed circuit paths, recessed fasteners and fine mechanical details convey powerful architectural scale.
Style/medium: actual premium studio photograph of a tactile architectural scale model / high-end industrial engineering study. Physically convincing, exquisitely made, no generic synthetic plastic.
Composition/framing: oblique low-angle macro perspective. A diagonal geometric circuit landscape fills the lower and right two thirds of the wide frame, with deep dark negative space in the upper left. Dense fine topology and large sculptural heat-sink forms create a grand sense of scale.
Lighting/mood: dramatic directional raking studio light, controlled shadow, crisp craftsmanship, technical elegance and visual impact.
Color palette: almost black charcoal, off-white ceramic, muted oxidized copper, one minimal controlled amber-orange accent.
Materials/textures: tactile imperfect brushed metal, fine machining striations, matte ceramic microtexture, gently oxidized copper surfaces, beautifully precise fabricated details.
Constraints: absolutely no letters, numbers, text, logos or watermark; visible circuit topology is purely geometric.
Avoid: cyberpunk neon, glowing sci-fi spheres, rainbow RGB, excessive bloom, stock chip brand imagery, cartoon rendering, generic AI plastic, decorative floating particles.
```
