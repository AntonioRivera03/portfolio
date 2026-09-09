# Option 3 — Deep Field

A standalone `/projects-yard` experience. Six articulated project stations occupy an original high-desert observatory. The main portfolio retains its design and links here.

## Explore the field

- **Survey** establishes the whole site; a direct project index remains available below it.
- **Acquire** selects a project, steers its azimuth/elevation mechanism, and flies the camera to its station along a smooth arc.
- **Signal** elevates the camera and adds explicitly explanatory receiver-to-processing-hall paths, with moving packets.
- **Service** parks dishes near zenith and enters the shared workshop. The unloaded hoist rises before the bridge and trolley move; cables remain attached throughout the 36-second cycle.
- A user-started guided tour visits all six stations. Manual selection, camera interaction, or a mode change ends the tour. Hidden/offscreen scenes suspend rendering. Reduced motion starts paused; manual orbit and direct navigation still work.
- Field notes contain capabilities, technical context, an interface example and a clearly labeled browser-only simulation. No demo calls a real agent, repository, process or external system.

## Research and design decisions

This is a fictional facility, informed by real engineering rather than a reconstruction of a named observatory.

- [NRAO VLA Servo Shop](https://www.vla.nrao.edu/genpub/work/servo/) informed independent azimuth and elevation axes, controlled steering, and stationary foundations.
- [ESO ALMA antennas](https://www.eso.org/public/teles-instr/alma/antennas/) informed segmented reflecting surfaces, truss-backed apertures, and coherent arrays.
- [NRAO antenna mechanics](https://www.vla.nrao.edu/genpub/work/antmech2.shtml) informed the geared mounts, bearings and service structures.
- [NASA Deep Space Network antenna types](https://www.nasa.gov/directorates/somd/space-communications-navigation-program/antennas-of-the-dsn/) informed receiver-to-ground infrastructure. The displayed luminous paths are explanatory overlays, not visible physical radio beams.
- [ESO ALMA interferometry](https://www.eso.org/public/unitedkingdom/teles-instr/alma/interferometry/) informed the central correlator concept and connected site layout. The software projects are metaphorically assigned to stations, not claimed observatory systems.

## Content provenance




Project data lives in `lib/yard-projects.ts`. AICorn and LivedMatch are existing projects. Kernel, Latch, Tracepoint, and Pagecache are clearly labeled design concepts; their interfaces and capabilities are proposals, not claims of released implementations. AICorn credits its upstream project, [Aycorn](https://github.com/waseem-polus/aycorn).

Actual AICorn functionality was checked against its [README](https://github.com/AntonioRivera03/AIcorn/blob/main/README.md) and [Conductor documentation](https://github.com/AntonioRivera03/AIcorn/blob/main/Documentation/conductor-mode.md). One agent runs at a time; human review precedes local merging. LivedMatch descriptions follow the existing portfolio and [public website](https://www.livedmatch.com).

The open-source section lists verified merged PRs to Antonio's own public repositories, not external upstream contributions. Exact source URLs and titles are in `lib/yard-contributions.ts`; verified September 9, 2026.



## Original Blender assets

The observatory was authored via the connected Blender MCP in a new scene, preserving existing scenes. It contains six independently rigged dishes, a correlator hall, an open instrument workshop and an articulated bridge/trolley/hoist/cable hierarchy. The largest reflector has 384 panels, rear radial trusses, a quadripod feed assembly, an offset elevation axle, ladders, platforms, bearing bolts, gearboxes and a 96-tooth azimuth ring. The campus includes structural bays, solar panels, ventilation, four animated cooling fans, racks, cabinets, loading apron, underground duct covers, roads and foundations.

- `public/models/deep-field/observatory.glb`: 4,327,868 bytes, 85,268 unique triangles, 318,976 rendered triangles through shared geometry, 134 mesh draws.
- `assets/deep-field/observatory.blend`: editable original.
- `assets/deep-field/generate-observatory.py`: reproducible generator; set `DEEP_FIELD_ASSET_OUTPUT` to select output directory.
- `assets/deep-field/metadata.json`: measured camera specifications, named rigs, pivots, limits and routing coordinates.
- `assets/deep-field/README.md`: detailed asset and articulation notes.
- `public/images/deep-field/observatory.webp`, `reflector.webp`, `workshop.webp`: inspected Blender renders. The wide render is a no-WebGL fallback.
- `public/images/deep-field/plateau.webp`: original imagegen landscape plate. A radial material fade blends the distant Blender ground into it.

The PNG sources were encoded as WebP for delivery, preserving dimensions and transparency while reducing image transfer size.

## Validation

TypeScript, targeted lint, production build and GitHub Pages export checks; existing project tests plus mechanical tests that verify the gantry stays within its travel limits, raises before translation, loops continuously and preserves cable attachment. Read-only review of lifecycle, camera transitions, reduced motion, responsive overflow and content claims. Blender wide, aperture and workshop renders were visually inspected. Frustum checks covered desktop, tablet and narrow-phone camera poses. Exact geometry checks confirmed clearance at all selected dish poses and the service pose; the parked hook clears its loading cabinet. Browser interaction testing was not requested or performed.

## Imagegen provenance


- Original absolute output path: `/home/hal/.codex/generated_images/01a08461-0441-7c32-9a39-612798acc320/exec-de4b0322-db3e-466f-a98c-daeebebe3f8d.png`
- Dimensions: 1536 × 1024 pixels
- Mode: built-in imagegen, original generation
- Inspection: empty terraced basalt plateau, distant low blue-gray ridges, clear Earth sky and upper-left sunlight; no artificial structures. Skyline approximately 35% from the top.

### Exact prompt

```text
Use case: photorealistic-natural
Asset type: original environment background plate for a monumental fictional scientific observatory called Deep Field; landscape 1536x1024.
Primary request: an empty remote high-desert plateau on Earth, photographed across vast terraced ochre and gray basalt terrain toward layered distant blue-gray mountain ridges. The architecture will be added later, so the landscape must contain no buildings, observatory dishes, antennas, people, roads, vehicles or visible infrastructure.
Scene/backdrop: a huge pale mineral-blue clear Earth sky with only sparse faint low cloud bands. Horizon and distant ridge skyline around 40% from the top of the frame. Mountains are modest, low, rounded or gently stratified and extremely far away; no enormous or dramatic spiky peaks. Broad spatial openness and strong atmospheric depth.
Composition/framing: wide camera view from the edge of a gently elevated plateau. The near foreground and lower half are mostly an empty gently sloping dusty plateau with subtle fine rock texture, large unoccupied contiguous areas suitable for compositing complex observatory architecture, and some natural terracing toward the middle distance. Uninterrupted expansive view; no foreground boulders blocking the scene.
Style/medium: premium cinema location photography on large-format film, physically real Earth geology, tactile dust and basalt rock, elegant subdued natural color, slight atmospheric haze. Grand isolated scientific field site.
Lighting/mood: warm early-morning directional sunlight coming from the upper left, natural shadows falling to the right, pale clear sky, quiet remote grandeur.
Color palette: mineral pale blue sky, soft blue-gray distant ridges, muted dusty ochre, warm gray and subtle basalt earth tones. Natural restrained saturation. The later architecture will be white ceramic and brushed metal with small vermilion hardware accents, but none of that architecture is present in this image.
Constraints: no structures of any kind, no observatory dishes, no antennas, no buildings, no people, no artificial signage, no text or logos. Background landscape only, one original image.
Avoid: Mars or alien planet appearance, red desert exaggeration, fantasy, illustration, CGI-looking terrain, neon, dramatic storm clouds, large Montana-style jagged peaks, vegetation-heavy scenery, visible fencing, roads, tire tracks or man-made pathways.
```

