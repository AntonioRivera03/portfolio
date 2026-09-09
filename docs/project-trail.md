# Montana project trail

The dedicated `/projects-yard/` page is a six-stop landscape journey, linked from the homepage navigation and selected-work section. The homepage retains its existing cards and detail experiences. The yard has independent field-note dialogs, with real external links for LivedMatch and AICorn and a proposed-project note for Kernel. Switchback, Current, and Fieldnotes are fictional design concepts, labeled as such in the cards, project index, and field notes.

## Sources and editing

- `app/projects-yard/page.tsx`: standalone route and page metadata.

- `app/project-trail.tsx`: project cards, index, settings, and accessible dialogs.
- `app/project-trail.css`: scoped field-guide visual design and responsive layout.
- `lib/trail-projects.ts`: project descriptions, categories, and fallback marker positions.
- `lib/trail-scene.ts`: Three.js camera travel, projected waypoints, sky, birds, wind, lighting, and resource cleanup.
- `public/models/trail/montana-trail.glb`: original Blender landscape, about 2 MB, 23,846 triangles, eight meshes, no texture or decoder dependencies.
- `assets/trail/montana-trail.blend`: editable Blender source created through the Blender MCP in a fresh scene, preserving the original scene.
- `assets/trail/build-montana.py`: deterministic Blender generator. Run with `blender --background --factory-startup --python assets/trail/build-montana.py`. Outputs default to the script directory; set `MONTANA_OUTPUT` to choose another directory. Copy the exported GLB to the public model path to update the website.
- `assets/trail/montana-trail.json`: surveyed stop locations and asset metadata. Its camera is a reference asset-render camera; the responsive website uses camera settings in `trail-scene.ts`.
- `public/images/trail/montana-field.png`: original artwork generated with the built-in imagegen tool, used for the illustrated fallback and Fieldnotes card.

The Three.js module and model load only near the section. Rendering pauses outside the viewport and when the browser tab is hidden. Reduced-motion preferences stop continuous movement by default. All projects remain accessible through HTML buttons and dialogs when WebGL is unavailable.

## Imagegen prompt

Generated with the built-in imagegen tool, not the CLI fallback. Final output: 1536 × 1024 PNG.

```text
Use case: illustration-story
Asset type: standalone landscape artwork for an interactive Montana project trail, 1536x1024 wide landscape composition.
Primary request: an original, crafted Montana mountain-and-prairie adventure landscape, like a hand-painted national park field guide or painterly screenprint.
Scene/backdrop: expansive ochre grass prairie, with a narrow warm cream hiking trail winding through dark evergreen foothills toward jagged slate blue Montana peaks with irregular patches of snow. Dusty pale blue sky with loose cream clouds.
Style/medium: editorial landscape illustration with strong layered silhouettes, dry-brush edges, subtle paper grain, confident simplified forms and restrained natural details. Handcrafted matte ink and gouache character.
Composition/framing: one full-bleed wide landscape with mountains occupying the middle 55%, sky upper 30%, lower foreground dark evergreen accents; thin trail begins at bottom slightly right of center and snakes toward the central mountain pass. Open scenic composition that will read well as website artwork.
Lighting/mood: warm late-afternoon light, inviting quiet wilderness and a sense of exploration.
Color palette: ochre grass, warm cream, muted evergreen, slate blue peaks, dusty pale blue sky.
Constraints: no UI, no text, no borders, no people, no logos, no watermark. Avoid generic glossy AI illustration, plastic surfaces, photorealism, 3D rendering, neon colors, oversaturated gradients.
```
