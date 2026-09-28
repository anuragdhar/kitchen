# Interactive Blender lighting

The Blender model view now defaults to **Blender lighting**. Drag to orbit and
scroll/pinch to zoom; the baked shadows, daylight and fixture light pools remain
on the surfaces. **Original studio model** opens the previous export. Bedroom 3 and
Drawing Room have **Eye-level view**, using their detailed room scenes.

**Brightness** defaults to 150% and adjusts exposure from 10% to 200% without
reloading the model or resetting the orbit camera. The original studio model
keeps its existing exposure. Baked materials restore their range from
`bakedLightingScale`, including older exports without the emission-strength
extension; the scale is applied once. Versioned bake URLs refresh older cached
textures. This viewer adjustment changes no model geometry or source lighting.

## How it works

`blender/bake_web_lighting.py` uses Cycles on the local AMD HIP GPU to bake direct
and indirect diffuse light plus emission into a shared UV atlas. Geometry is
evaluated with its existing modifiers before unwrapping, so beveled edges match
the exported model. A temporary joined copy speeds up the bake. Original object
names, evaluated vertices and transforms are retained and asserted before export.
No source Blender file, plan dimensions, openings or saved layouts are changed.

The bake uses linear radiance with four stops of headroom, explicitly encoded to
sRGB PNG under Standard color management. `KHR_materials_emissive_strength`
restores that range in the GLB. The web viewer uses an unlit material for tagged
baked surfaces, avoiding a second diffuse lighting calculation. Reflective and
transparent surfaces keep their PBR materials and environment reflections.

This follows Blender's [baking workflow](https://docs.blender.org/manual/en/4.3/render/cycles/baking.html).
Ordinary glTF export does not carry Blender area lights or world lighting; see
the [official exporter documentation](https://github.com/KhronosGroup/glTF-Blender-IO/blob/main/docs/blender_docs/scene_gltf2.rst).

## Sources and coordinates

| Model | Source | Atlas |
| --- | --- | --- |
| Whole home and clipped room views | `blender/whole_home/lighting/A501-whole-home-lighting.blend` | 4096 × 4096 |
| Bedroom 3 | `blender/bedroom3/daylight/A501-bedroom3-realistic.blend` | 2048 × 2048 |
| Drawing Room | `blender/drawing_room/elegant/A501-drawing-elegant.blend` | 4096 × 4096 |

The dedicated Bedroom 3 and Drawing Room models use Blender metres, converted to glTF by
`(x,y,z) = (Blender x, Blender z, -Blender y)`. Its camera settings live in
`src/config/homeRoomViews.js`. The other room views retain their existing
plan-pixel clipping planes and coordinate conversion. The whole-home export
remains the older shared scene; it does not incorporate the dedicated rooms' new furniture
finish pass. Its geometry has not been replaced to make those sources agree.

Ceilings are omitted from the orbitable cutaway. Source hidden objects remain
excluded, and source ceilings that contribute to the bake retain their visibility
during light transport. Orbiting outside the room shows the exterior surfaces;
this is not a screen-space photograph.

## Rebuild

From the repository root (Blender 5.2.2 on this machine):

```powershell
& 'C:/Program Files/Blender Foundation/Blender 5.2/blender.exe' --background --python-exit-code 1 --python blender/bake_web_lighting.py -- --scene bedroom3 --size 2048 --samples 64
& 'C:/Program Files/Blender Foundation/Blender 5.2/blender.exe' --background --python-exit-code 1 --python blender/bake_web_lighting.py -- --scene home --size 4096 --samples 64
& 'C:/Program Files/Blender Foundation/Blender 5.2/blender.exe' --background --python-exit-code 1 --python blender/bake_web_lighting.py -- --scene drawing --size 4096 --samples 96
```

Outputs are `public/models/A501-bedroom3-baked.glb`, `A501-drawing-baked.glb` and `A501-home-baked.glb`.

> 2026-09-28: Bedroom 3 became a single-source (parity) room whose Blender
> views regenerate from its editable workspace, so its dedicated bake
> `A501-bedroom3-baked.glb` and the `bakedModel`/`bakedView` fields in
> `homeRoomViews.js` were deleted on the owner's request. The bake command
> above still works if that decision is ever explicitly reversed; the drawing
> and whole-home bakes are unaffected.
Atlases and provenance (source/generator/output hashes, parameters and preserved
mesh counts) are under `blender/web-lighting/`. The old GLB remains available for
the Studio option. Regenerate the bedroom source using `photoreal_bedroom3.py`
before baking if its rendering recipe changes.

## Limits

Lighting is fixed to the saved scene. Changing furniture positions or light
settings requires rebaking. The camera can move freely without rebaking. Mirrors
use browser environment reflections, so they do not reproduce Cycles' exact
room reflections. Fine detail is limited by atlas resolution, especially in the
whole-home model; close-up images may show seams or noise. This implements
interactive viewing of precomputed lighting, not live Cycles path tracing.

## Checks

From `react-configurator`, use Node 22 and the locked npm dependencies:

```powershell
npm.cmd run check
# With the app running at localhost:5173 and Chrome installed:
npm.cmd run test:baked-lighting
```

`KITCHEN_APP_URL` overrides the server and `BROWSER_CHANNEL` overrides Chrome.
The browser smoke script captures desktop/mobile Bedroom 3, Drawing Room, Pooja
and whole-home views, checks orbit/zoom changes, switches lighting modes and
visits render/editable tabs. It reports console errors. PNGs are visual evidence,
not approved regression baselines. The Node asset test validates embedded atlas
references, UV channels, unique IDs and portable emission strength in all three GLBs.

### Verified 2026-09-28

- Both bake commands above: exit 0. Bedroom 3 preserved 98 evaluated meshes
  (89 baked); whole home preserved 1,061 (852 baked). Their geometry/transform
  assertions passed. GLBs are approximately 7.6 MB and 21 MB respectively.
- Node 22.23.3 was downloaded into ignored `tmp/node22` and its distribution
  SHA-256 verified against nodejs.org. `npm.cmd ci`: exit 0. Existing Vite
  processes held esbuild open on the first attempt; after stopping those two
  workspace servers, installation succeeded and both ports 5173/5174 were restored.
- `npm.cmd run check`: exit 0, **151 tests passed**, production build completed.
  Vite reports its existing large-chunk warning; no repository lint/type gate exists.
- `KITCHEN_APP_URL=http://127.0.0.1:5174 npm.cmd run test:baked-lighting` (environment
  variable set with PowerShell): exit 0. Desktop 1440 × 1100 and simulated mobile
  390 × 844 passed orbit/zoom image changes, lighting switching and room/whole-home
  render/editable/model tab round trips, with no page or console errors. Favicon
  requests were stubbed to avoid an unrelated missing-icon 404.
- Reviewed the bedroom eye/overview/orbit, Drawing Room, Pooja and whole-home
  captures under `react-configurator/test-results/baked-lighting/`.
- `python -m py_compile blender/bake_web_lighting.py` and `git diff --check`: exit 0.
- Not verified: physical mobile devices/touch gestures, frame-rate benchmarks,
  live relocation of lights/furniture, exact Cycles mirror reflections, or
  third-party glTF applications. Browser checks are smoke evidence, not visual
  regression certification.
