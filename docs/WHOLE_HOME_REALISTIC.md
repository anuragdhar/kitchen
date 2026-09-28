# Whole-home realistic Blender stills and artifact selection

## Scope and status

This is a render-only extension of the existing shared home scene. It reuses
`photoreal_drawing_room.py`'s `material`, `texture`, `wood` and `box` helpers,
uses Cycles with denoising, and adds a whole-home cutaway plus a still for every
entry in `BLENDER_ROOM_VIEWS`. Room measurements come from `homeRoomViews.js`
and `ENTRY.planScale` through the exporter, not duplicated Python constants.

**This implementation has not yet been executed in Blender or visually accepted.**
The first full run must be reviewed before merging. Source-level checks are
recorded below; they are not evidence of photorealistic output or performance.

The finish palette follows the existing Drawing Room: warm mineral plaster,
walnut grain, oatmeal linen, honed limestone, champagne bronze, and ivory ceramic.
Known shared wall/floor/ceiling/trim materials are upgraded explicitly. Unknown
imported material IDs are retained. Furniture can opt into a finish with an
object custom property `finishRole` set to `walnut`, `linen`, `stone`, `bronze`,
`plaster`, `ceramic` or `olive` in a separately reviewed source-scene change.
Do not guess material roles from numeric imported IDs.

The dedicated Drawing Room/Bedroom 3 furniture additions are **not transplanted**
into the shared model. This work adds whole-home still rendering and decor
selection; it does not yet replace the existing interactive baked GLBs. Their
current viewer and the original lighting gallery/tour remain available.

## Run on Windows

From the repository root, with Node 22 and Blender on PATH:

```powershell
node react-configurator/scripts/export-home-render-job.mjs
blender --background --python-exit-code 1 --python blender/render_whole_home_realistic.py -- --inspect
```

When Blender is not on PATH, replace `blender` with PowerShell's invocation of
its actual installed executable, for example `& 'C:/Program Files/Blender Foundation/Blender 5.2/blender.exe'`.
The installation path is an example, not a requirement for Blender 5.2.
The existing helper uses Blender's current Principled material sockets and AgX;
verify compatibility with the installed Blender version on the first run.

In the app, open **Whole home 3D -> the Blender stills/tour gallery**. The new
**Whole-home Blender render studio** is above the original gallery. Click
**Load Blender surfaces**, choose a room, select artifacts and support objects,
then choose day/evening/night and draft/final. Download the job and save it as
`blender/whole_home/realistic/job.json`. Re-running the Node exporter replaces
that file with an empty-decor draft job, so do not rerun it over selected decor.
The web picker is session-only; its downloaded JSON is the saved selection.

```powershell
blender --background --python-exit-code 1 --python blender/render_whole_home_realistic.py -- --device AUTO
```

Alternatively, render the download directly with `--job 'C:/Users/you/Downloads/whole-home-render-job.json'`.
A job with no artifacts renders all rooms immediately and does not need `--inspect`.
After successful completion, click **Load completed renders** in the studio.
No browser endpoint launches Blender, reads arbitrary local files, or executes
shell commands. Downloading a job is not a render submission.

AUTO tries available OPTIX, CUDA, HIP, ONEAPI and METAL backends, then CPU. An
explicit unavailable GPU backend fails with an explanation. `--device CPU`
forces CPU. Draft is 960x540 at 32 samples; final is 1920x1080 at 192 samples.
These are implementation presets, not measured speed/quality guarantees.
Day/evening/night changes the saved world's strength and existing fixture powers;
it is not a geographically calibrated sun/daylight simulation. No light moves.

## Starter artifacts and safe placement

The starter collection contains an ivory ceramic vase (14x14x22 cm), a walnut
bowl (26x26x9 cm), cloth-bound books (28x20x7 cm), and a small stylized planter
(24x24x38 cm). These are original procedural meshes, not downloaded photo-scanned
assets. Their support envelope is conservative; preview the appearance before use.

The inventory lists candidate surfaces using evaluated scene geometry, actual
ray hits, surface normals, footprint fit, and upward clearance. Select an exact
existing Blender object ID. The renderer checks support again before rendering,
limits each support to one piece, and refuses unavailable/obstructed placements
instead of silently floating an artifact or moving furniture.

**A horizontal surface is not proof it is a table.** Inspect the object name and
coordinates; do not pick a chair/sofa or an active appliance/work surface. The
sampling checks are not full mesh collision, door-swing, fire/accessibility,
appliance-service, or construction-clearance certification. The source already
contains the large furniture; no additional floor-standing furniture is inserted.

Third-party asset candidates can be reviewed separately from these built-ins.
Poly Haven and ambientCG provide CC0 downloadable assets, but this implementation
does not automatically download them or import arbitrary models. Keep per-asset
source/license records before redistributing. Reference license pages:
https://polyhaven.com/license and https://docs.ambientcg.com/license/.
Poly Haven's website previews are not covered by its asset CC0 grant; do not
copy those preview images into the app as if they were CC0 assets.

## Files and preservation

- Source: `blender/whole_home/lighting/A501-whole-home-lighting.blend` (opened with script execution disabled; never overwritten).
- Job: `blender/whole_home/realistic/job.json` or an explicit `--job` path.
- Surface candidates: `react-configurator/public/renders/whole-home-realistic/surfaces.json`.
- New images: `react-configurator/public/renders/whole-home-realistic/<job-hash>/*.png`.
- Generated scene/provenance: `blender/whole_home/realistic/<job-hash>/`.
- Gallery index: `react-configurator/public/renders/whole-home-realistic/manifest.json`, published only after every image and the generated scene succeed.

The job uses metres with Blender Z-up. A plan-pixel rectangle `[x1,y1,x2,y2]`
becomes `[x1*sx,-y2*sy,x2*sx,-y1*sy]`. This preserves the existing south-up plan
contract. It is not a conversion of live kitchen edits into the historical Blender
source. Saved kitchen edits still belong to the editable workspace, as before.

Authored mesh vertices, face topology, names, transforms, hidden flags and modifier
names/types are asserted unchanged before and after rendering. Known generated
ceiling panels become visible temporarily for room lighting, are hidden for the
cutaway, then return to their original state. No source .blend, reference model,
room config, project persistence file, existing GLB, image or batch file is edited.
Provenance includes source/helper/texture hashes, job, Blender/device, image hashes,
material changes, added objects, and preserved mesh count.

## Checks and required acceptance

From the repository root:

```powershell
node --test react-configurator/tests/whole-home-render.test.mjs
python -m unittest discover -s blender -p 'test_whole_home_render.py' -v
python -m py_compile blender/render_whole_home_realistic.py blender/whole_home_render_contract.py
```

Also run the normal app gate from `react-configurator/`: `npm ci`, then
`npm run check`. The focused test is deliberately runnable without dependencies
and is included in the Windows worker's local contracts; it is not part of `npm test`.

Before acceptance, render a no-decor draft, inspect candidate surfaces, add a
single item, and rerender. Review a large room, the narrow balcony/Pooja views,
all cameras and the complete cutaway. Check object support, room enclosure,
lighting, reflective materials and floor-plan consistency. Then exercise the
studio on desktop and mobile and verify the old model/render/editable tabs.

Local development validation: focused Node and Python contract tests and Python
compilation were executed; JSX was syntax-checked separately. **NOT RUN:** Blender,
full npm dependency installation/build, browser interaction, image review, GPU
performance and construction checks. Do not treat contract tests as visual acceptance.
