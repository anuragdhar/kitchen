# Current-design room renders

## Correct the source mismatch first

The previous `render_whole_home_realistic.py` uses the historical whole-home
`.blend`, not the current editable kitchen or balcony office. Increasing samples
or changing its materials cannot synchronize furniture, cabinet positions, desk
height or appliances. The new pipeline exports the actual visible editable
meshes, world transforms, chosen materials and camera. It never substitutes the
old shared home model when a current room export is missing.

Blender verifies the package checksum, source mesh IDs, per-object world bounds
(0.1 mm tolerance) and triangle counts before rendering. Those are import checks,
not proof of full geometric identity, collision clearance or construction safety.
Coordinates are glTF metres/Y-up, imported as Blender `(x,-z,y)`. The source
renderer unit scale is applied once, including millimetre-based kitchen scenes.

## Render current saved designs

Open the room's **Editable workspace** and its 3D view. Set the intended camera,
desk height, door/cabinet state and wall visibility. Open **Interior studio >
Blender export**, choose the matching source/profile, and export the ZIP.
It contains `scene.glb`, `scene.json` and, when available, `reference.png`.
The profile does not crop the source; choose the room actually shown.

```powershell
blender --background --python-exit-code 1 --python blender/render_archviz.py -- --bundle 'C:/A501-inputs/A501-kitchen-archviz.zip' --quality draft
```

An extracted bundle folder also works. Use your Blender executable's full path
when it is not on PATH. No source model or saved project is overwritten. Invisible
subtrees remain invisible. Labels, lines and proposed-lighting overlays are
excluded. Animated/skinned/instanced meshes are rejected instead of exporting an
incorrect pose; hide optional reference figures before export when necessary.

## Batch repository defaults

Use Node 22, Python 3.11+, Blender and the locked app dependencies. Install bundled
Playwright Chromium (`npx playwright install chromium` in react-configurator).
The exporter now uses bundled Chromium on Windows and Linux, not a required Chrome
installation. `ARCHVIZ_BROWSER_CHANNEL` can explicitly select an installed channel.

```powershell
python scripts/render_archviz_rooms.py --export-defaults --rooms kitchen,balcony,drawing --quality draft
```

`--export-defaults` opens an isolated browser with repository defaults. It cannot
read saved edits in your normal browser. Inputs go under
`blender/archviz-input/repository-defaults`, separate from user exports. Native
Drawing Room/Bedroom 3 sources are used unless an explicit exported bundle exists.
For selected saved designs, put the room ZIPs in `blender/archviz-input` and omit
`--export-defaults`; `--input` selects another dedicated folder.

The runner discovers Blender through `--blender`, BLENDER_EXE, PATH or its normal
Windows installation directory. Jobs run sequentially and stop on failure.
Each render prints a 30-second heartbeat. AUTO tries supported GPU backends then
CPU; an explicitly requested unavailable backend fails. `--public` selects an
isolated output root for worker runs and is passed to output validation too.

## Photographic treatment, not invented geometry

`configs/archviz-profiles.json` has camera preferences for all 12 named rooms,
not another set of measurements. Live captures produce a current-camera image
for reference comparison, plus proposed hero/reverse views. A short ray test
skips a nearby obstructed generated camera; it is not full camera collision
validation. Review narrow rooms and prefer a carefully composed captured camera.

Source colors, species, maps, UVs and roughness stay intact. Known wood, stone,
plaster and bronze receive Cycles normal-bevel shading without moving vertices.
Live exports receive named photographic fill and daylight proxies near large
transmissive vertical panes. Review that candidates are windows, not glazed
cabinets. These lights are photographic aids, not surveyed electrical fixtures.
No arbitrary furniture, glowing strip geometry or second ceiling is added.

Drawing Room uses `blender/drawing_room/elegant/A501-drawing-elegant.blend`;
Bedroom 3 uses `blender/bedroom3/daylight/A501-bedroom3-realistic.blend`. Their
detailing, cameras and lights are retained. They are explicitly labelled native
snapshots, not current browser edits. Blender must be new enough to read them.
The apartment reference is inspiration, not a source of copied assets or a
promised visual match. More samples alone cannot supply missing design detail.

Quality: draft 960px/48 samples, final 1920px/256, portfolio 2560px/512. Height
follows camera aspect. Adaptive sampling, AgX and denoising are used. The internal
192px test tier is for CI, not approval. `--shots current` limits a single-room
review to the captured camera. No speed or designer-quality guarantee is implied.

Automatic navigation covers kitchen, balcony, study, bedrooms 1/3, drawing,
lobby, pooja, storage and entry. Terrace and Bedroom 1 balcony require a manual
active-scene export; they are not silently replaced with another room.

## Outputs and review

The default gallery is `react-configurator/public/renders/archviz/manifest.json`;
images/provenance use unique `<job>/` subfolders. The gallery is updated only
after all selected shots in that room succeed. Old outputs remain intact.
`--save-scene` optionally saves a new packed `.blend`; it is not needed for review.
**Interior studio > Blender export > Load completed room renders** loads default
outputs, not a worker's separate run folder. Existing interactive baked GLBs and
legacy galleries are unchanged.

```powershell
python blender/validate_archviz_outputs.py
node --test react-configurator/tests/archviz.test.mjs
python -m unittest discover -s blender -p test_archviz.py -v
```

Validation checks matching gallery/provenance, PNG headers/dimensions and SHA-256,
not artistic quality or full image decoding. Review current/reference alignment,
objects, visible state, camera framing, exposure, materials, noise and shadows.
Images remain unreviewed until assessed. The workflow tests source contracts,
app build, browser export, Blender imports and a tiny CPU fixture; it does not
certify full-resolution interiors, physical mobile devices or Windows GPU speed.

See `docs/RENDER_WORKER.md` for the continuous Windows worker, privacy, publication
and local log paths. This delivery's local contract checks passed; full app,
browser and Blender results must be read from actual CI/local execution, not
inferred from publication or merging.
