# Drawing Room finishes and lighting

The focused scene uses the current shared home model, with soft window daylight,
warm chandelier and sconce light, ivory plaster, walnut cabinetry, olive fabric,
honed stone, and brushed bronze. Added seat cushions, accent pillows, sofa feet,
a woven rug, narrow linen drapes, a book and an open ceramic vase give the simple
source furniture more detail. The existing photographed Wood095 maps are reused.

## Files and reproduction

Source: `blender/whole_home/lighting/A501-whole-home-lighting.blend`.
Generator: `blender/photoreal_drawing_room.py`.
Derived scene and two images: `blender/drawing_room/elegant/`.

```powershell
& 'C:/Program Files/Blender Foundation/Blender 5.2/blender.exe' --background --python-exit-code 1 --python blender/photoreal_drawing_room.py
& 'C:/Program Files/Blender Foundation/Blender 5.2/blender.exe' --background --python-exit-code 1 --python blender/bake_web_lighting.py -- --scene drawing --size 4096 --samples 96
Copy-Item blender/drawing_room/elegant/overview.png react-configurator/public/renders/home-lighting/drawing-room.png
Copy-Item blender/drawing_room/elegant/seating.png react-configurator/public/renders/drawing-room-elegant-seating.png
```

Uses Blender 5.2.2, Cycles HIP, 192 samples, denoising, AgX and 1600 × 1100
images. Append `-- --preview` to the first command for 32 samples at half size.
Source textures are packed into the derived blend. Provenance files record source
and generator hashes; the bake also records export hashes and geometry checks.

## Preserved layout

Coordinates are metres, Z up in Blender; glTF maps `(x,y,z)` to `(x,z,-y)`.
All 1,069 authored meshes retain their raw vertices and world transforms, checked
by the generator. Materials change, and sofa bevel modifiers soften corners
within the existing furniture envelope. New decorative meshes are separate.

| Existing measurement | Before | After |
| --- | --- | --- |
| Room plan span | approximately 3.322 × 5.348 m | unchanged |
| Wall height | 2.700 m | unchanged |
| Sofa base footprint | approximately 0.872 × 2.255 m | unchanged |
| Oval table footprint | approximately 0.644 × 1.103 m | unchanged |

Openings, cabinetry positions, object IDs and saved layouts remain unchanged.
The focused derivative hides adjacent rooms for export. A separate ceiling
contributes to light transport but is omitted from the interactive cutaway.
The original source scene is never saved by either script.

For the drawing-room bake, the temporary lighting surface uses a 0.05 mm normal
bias to reduce self-intersections. Exported geometry stays unchanged. Four overlapping wall
finish objects carry a small depth offset for the web renderer, avoiding flicker
between coplanar surfaces without hiding or moving authored objects.

## Viewing and limits

Open **Drawing Room → Blender model → Blender lighting → Eye-level view**.
Brightness keeps the existing 10–200% range. The **Blender render** tab shows the
new overview and seating detail; the earlier chandelier concept remains available.

The interactive model bakes diffuse illumination into a 4096 atlas. Reflections
and transparent surfaces use browser PBR, so they differ from Cycles stills.
The imported thick window pane uses an interior daylight proxy to avoid excessive
attenuation. Small fabric detail is clearer in the stills than in the atlas.
Lighting changes require rebaking. The whole-home and original studio models
retain the earlier shared scene; this update applies to the dedicated Drawing Room.

Visual inspection still shows atlas seams on curved cushions and the vase, mild
gradient banding, and dark lines above the window in the interactive export.
The Cycles stills do not show these artifacts. The bake is an interactive preview,
not a visual match to the still renderer. Its embedded 4096 atlas makes the GLB
approximately 42 MB; physical mobile performance has not been benchmarked.

## Validation, 2026-09-28

- Final Cycles generator: exit 0, two 1600 × 1100 images inspected; assertions
  preserved 1,069 source mesh vertex arrays and transforms.
- Drawing bake: exit 0, 90 evaluated exported meshes, 74 baked meshes; geometry
  assertions passed. Source, generator and output hashes are in provenance JSON.
- Node 22 `npm.cmd run check`: exit 0, 151 tests passed and production build
  completed. The existing Vite large-chunk warning remains.
- `KITCHEN_APP_URL=http://127.0.0.1:5174 npm.cmd run test:baked-lighting`
  (PowerShell environment): exit 0, desktop 1440 × 1100 and simulated mobile
  390 × 844, no console/page errors. Drawing-room eye-level, orbit/zoom and
  still-tab checks passed alongside the existing bedroom, Pooja and whole-home
  checks. Reviewed drawing-room screenshots on both viewport sizes; this is
  smoke evidence, not approved visual regression testing.
- `python -m py_compile blender/photoreal_drawing_room.py blender/bake_web_lighting.py`
  and `git diff --check`: exit 0.

Changed application sources are `src/config/homeRoomViews.js` (dedicated model,
camera and stills), `src/BlenderHomeView.jsx` (coplanar surface depth bias),
`tests/blender-room-views.test.mjs` (asset contracts), and
`scripts/baked-lighting-browser.cjs` (drawing-room eye-level/orbit/still checks).
Generated model, atlas, scene, stills and provenance accompany the two Blender
scripts. Architecture and interactive-lighting documentation describe the split
between dedicated room exports and the shared whole-home export.
