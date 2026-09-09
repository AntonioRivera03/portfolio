# DeepField — Array Observatory

An original fictional observatory with one 18 m primary aperture, five smaller stations, a correlator hall, and an instrument workshop. Geometry is authored in Blender Z-up and exported in glTF Y-up, in metres.

## Repository paths

Checked-in source: `observatory.blend` and `generate-observatory.py` in this directory, with `metadata.json`. The GLB is `public/models/deep-field/observatory.glb`; delivery renders are WebP in `public/images/deep-field/`. Set `DEEP_FIELD_ASSET_OUTPUT` before running the generator. Filenames below describe the generator output contract.

## Generator output files

- `deep-field.glb` — only the observatory scene; geometry shared across the six stations.
- `deep-field.blend` — complete editable scene, studio sky, sunlight, and four cameras.
- `generator.py` — reproducible procedural source. Run `blender --background --python generator.py -- --render`.
- `metadata.json` — station coordinates, pivot axes and defaults, camera positions/FOVs, building bounds, signal routes, mechanical ranges.
- `deep-field-wide.png`, `deep-field-hero.png`, `deep-field-service.png` — 1600 × 1000 RGBA previews.
- `deep-field-wide-rgb.png` — opaque wide preview.

## Articulation

`HeroStation` stays at `[8,0,8]`. Its fixed foundation is a direct child. `Hero_Azimuth` rotates about local Y at `[0,4,0]`. `Hero_Elevation`, a child of the azimuth yoke, rotates about local X at `[0,8,0]`, making the elevation axle 12 m above grade. The aperture is offset 1.7 m forward of that axle. The rear torque box is 5.2 m wide, providing 0.17 m lateral clearance to each yoke column, and the axle shafts extend inward to ±2.4 m. Elevation zero points the aperture normal toward +Y (zenith). The hero's saved elevation is **+35°**, azimuth **−18°**. Use the saved base rotation and animate small deltas or read the absolute defaults in metadata.

`Station_1` … `Station_5` each have independently named `_Azimuth` and `_Elevation` parents. Their root scale is already applied to the complete mechanism and foundation. Station meshes are shared; do not mutate shared vertex data when highlighting one station. Change an individual object's material instance or parent transform.

`Gantry_Bridge` moves along the workshop's Z rail direction. `Gantry_Trolley` moves along X beneath it. `Gantry_Hoist` moves along local Y beneath the trolley. Its saved parked position is Y = −2.75 m, clearing the instrument cabinet below; the default cable scale is `[1,0.9,1]`. `Gantry_Cables` has its top origin fixed beneath the trolley: set `scale.y = (-hoist.position.y - 0.5) / 2.5` to keep the lower cable ends attached to the moving hoist. Four independent `CoolingFan_0` … `CoolingFan_3` parents rotate about local Y.

## Rendering and integration

All materials are opaque, moderately rough, and texture-free. The `.blend` contains a low afternoon sun and sky fill. The GLB exports no lights or cameras, so add a directional key and hemisphere/ambient fill in Three.js. The camera metadata includes vertical FOVs for the 1.6 landscape aspect ratio.

The terrain extends to ±1000 m so its perimeter does not appear as a floating island. **Do not scale or frame the scene using its complete terrain bounds.** Use the camera targets and positions or station/building bounds. The large coordinates only belong to the simple ground slab; the observatory itself occupies about 80 × 100 m.

Dish detailing includes 384 curved primary panels, fine radial seams, mounting studs, rear radial trusses with circular bracing, four feed-support legs, a secondary receiver flange, horizontal axle shafts, drive gearboxes, hydraulic linkages, access platforms, ladders, bearing bolts, a 96-tooth azimuth ring, and fixed cable wraps. Building detailing includes modular cladding, structural bays, glazing, photovoltaic panels, roof plant, cable trays, open crane framing, workbench, parts cabinets, loading cradle, floor joints, bollards, service roads, and segmented underground duct covers.
