# Lobby / Dining review

Owner: `feat/archviz/lobby`. Status: detailing hook implemented; real-export visuals UNVERIFIED.

## Change (patch lobby-realistic-v1)
- `blender/archviz/rooms/lobby.py`: shading-only finishes, pendant light, table styling, ceiling.
  - Untextured plan-colour (teal) floor -> 600 x 1200 mm greige porcelain, 2.5 mm grout (`FLOOR` block).
  - Wood: satin lacquer coat over existing maps. Plaster: matte, fine relief if no relief map.
  - Chair upholstery: woven sheen/relief. Dark metal: powder coat (large) / brushed (pulls). Brass kept.
  - Transparent panes get transmission; authored tint (pooja amber glass) kept.
  - Emissive diffuser directly over the dining top gets a matching 32 W area light.
  - Linen runner + ceramic bowl placed from the detected table top (skipped if not found).
  - Painted ceiling at wall top over floor footprint, only when the export has no ceiling.
- `configs/archviz/rooms/lobby.json`: lens 30, eye 1.2, corner [0.08,0.3], target [0.635,0.648].
  Old hero stood in the Bedroom 1 doorway against the table corner.

## Evidence
- Test scene rebuilt from repo three.js modules (shell, partition, concealed door, task lighting,
  AC, ironing storage, dining set, pooja), imported into Blender 5.0.1, rendered 560 px / 32 samples CPU.
- Framework geometry check passed; added meshes use the `ArchvizDetail | lobby |` prefix.
- test_parallel_profiles.py OK; parallel-profiles.test.mjs 5/5; room scope check OK.

## Known defects / unverified
- Reverse view: background visible in the 305 mm gap above the closed west partition (hanging beam
  is not in the editable export). Fix belongs to the export or a later beam detail.
- Teak veneer textures are not in the repo, so the textured-wood path was not rendered.
- No render from a real app export or on the Windows worker yet.

## Next render
py -3 scripts/render_archviz_rooms.py --export-defaults --rooms lobby --quality draft
