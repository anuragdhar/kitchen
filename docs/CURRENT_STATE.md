# Current implementation state

Baseline inspected: commit `898a7654726886aa73cabbd5910ba4a1a7765a5f` (2026-09-28).
This records implemented behavior, not approval of physical measurements or work.
Update this document and the baseline tests together for an intentional design change.

## Authority and entry points

The web entry point is `react-configurator/src/main.jsx` -> `HomeApp.jsx`.
The kitchen is mounted only when its room is opened. Its live defaults come from
`KITCHEN`, `EAST_INIT`, `WEST_INIT`, and `AIRY_WEST_INIT` in
`react-configurator/src/config/kitchenConfig.js`, with versioned state/persistence in useKitchenProject.js and src/persistence/.
Browser localStorage and saved variants may override startup values.

Other rooms have their own config modules in `src/config/`; the kitchen baseline
does not define their dimensions or coordinate frames.

## Implemented kitchen baseline (millimeters)

| Property | Implemented value |
| --- | --- |
| Room width / length / height | 2324 / 4746 / 2700 |
| West door clear zone along room y | 0 through 610 (end boundary excluded) |
| South opening width | 855 |
| North window width / sill | 1100 / 914 |
| East / west base depths | 600 / 600 |
| Nominal floor aisle | 2324 - 600 - 600 = 1124 |
| East hob y in EAST_INIT | NORTH_HOB_OPTION_Y_MM = 2400 |
| West baseline washing / sink / dishwasher y | 610 / 1210 / 1972 |
| West shaft y / along-wall length / depth | 3908 / 838 / 609 |

AIRY_WEST_INIT is a separate reversible variant: dishwasher y1946, sink and upper
rack y2546, washing y3308, slider y1200. Do not collapse it into WEST_INIT.
The tests freeze the implemented baseline, not every possible valid arrangement.

## Known conflicts: do not silently reconcile

- The archived original README describes a 1220 mm west clear zone, a 400 mm west
  counter, an 1100 mm door, and east wet appliances. These are not live defaults.
- The old `scripts/validate-3d-bolt.mjs` expects an east tall garage/wet-appliance
  layout. It remains available as `npm run test:bolt`, but is not the active gate.
- Even within kitchenConfig.js, `APPLIANCES` is older metadata. `LAYOUT_MODEL`
  references `CURRENT_APPLIANCES`, whose gas y is 1200; EAST_INIT uses 2400.
  CURRENT_VALIDATION_RULES and LAYOUT_MODEL.metadata also mention the older hob
  position. Do not directly export those constants assuming they match live state.
- The FreeCAD generator prefers a root React export containing layoutModel, then
  falls back to `freecad/kitchenConfig.json`; it also has legacy fallback dimensions.
  Inspect the actual input and resulting geometry before treating a CAD file as current.
- Runtime validation now lives in src/domain/kitchenValidation.mjs. UI, browser API
  and exported validation share the same required-row aggregation. Nominal floor
  aisle, fixed-object bounds/clearances, and all-pair 3D collisions are checked.
  Backing slider panels and electrical markers are excluded from collisions;
  the legacy hob collider is retained. No door-swing or installation checks exist.
- SVG and DXF plan depths and dimension labels now use the same nominal base-run
  measurements as the UI (600/600, aisle 1124 mm for the implemented baseline).
  The shared export metadata is not fully unified. Project saves now use the
  versioned codec documented in PROJECT_FORMAT.md; the live east/west arrays are
  authoritative when a document also carries a derived layoutModel.

A follow-up export/state unification must first capture behavior and migration
fixtures. Do not resolve disagreements during a cosmetic or structural refactor.

## Asset policy

Source code, live configurations, source drawings, authored models, and runtime
assets stay versioned. Dependency backups are not source. New test reports and
Blender backups are ignored; existing tracked evidence is not blanket-deleted.
When regenerating exports, record input variant, source commit/hash, generator, and
command. Historical notes and prompt files are context, not instructions to restore
an old layout.

## Persistence update

Unversioned array and layoutModel projects are migrated without moving supplied
items. New autosaves and named versions use :schema-1 keys, retaining their original
legacy keys. Imports reject malformed data and mismatched room dimensions before
changing active state. Original unreadable autosaves are protected until explicit
recovery. Existing project rules still flag non-preset designs; loading does not
convert those designs to defaults. Undo/redo and export-model unification remain
separate work.

## Whole-home 3D: closed Bedroom 1 door and in-home light dial (2026-09-29)

Owner change, live Editable 3D only (Blender exports/renders are not updated).

- The old door drawn on the A501 plan between Lobby/Dining and Bedroom 1
  (plan x 347-390, wall line y 612; owner mark x 346-400, y 601-661) is closed
  with a 12 mm fibre-cement sheet flush with the lobby face. The cavity behind
  it is a shallow medicine cabinet with two flush doors opening into Bedroom 1
  (toolbar: Open/Close medicine cabinet). Source: `src/config/bedroom1ClosedDoor.js`,
  built by `src/rooms/lobby/Bedroom1DoorInfill.js`. The replacement door
  (lobby/bedroom1 `doors`, fromMm 100) is unchanged.
- The opening (~0.83 m wide, 2.1 m high) is scaled from the plan drawing, not
  surveyed. Cabinet depth follows the drawn wall thickness (`WALL_THICKNESS_M`
  = 85 mm): about 73 mm cavity, about 50 mm usable behind the doors. Plan lines
  suggest a thicker real wall; confirm on site before ordering.
- In the model the bed (`bedroom1.furniture.bed`, against this south wall) sits in
  front of the lower part of the cabinet, and the open leaves sweep over it.
- The Daylight bar has an "In-home light" dial (100% default). It scales ambient
  fill, environment light, interior lights and emissive fixture glow together;
  0% leaves only the sun. It does not change the sun or saved state.

## Drawing Room TV wall and second sofa (2026-09-29)

Owner change, live Editable 3D and the Drawing Room editable workspace only (the Blender model and stills keep
the old layout). Full plan and reasoning: `docs/DRAWING_ROOM_TV_WALL.md`.

- Removed: 55-inch swivel TV on the east wall (`television`) and the window seat (`furniture.windowSeat`).
- Added: `drawing.tvWall` (305 mm deep, 2100 wide north-wall cabinet with a 65-inch TV bay, Soundbar 300,
  Bass Module 500, landline, intercom and router) and `furniture.southSofa` (same 880 x 2250
  footprint as the west sofa, facing north at centre 1140, 4810).
- Moved: coffee table (1745, 2420) -> (1750, 3300); the live-model chandelier and lighting anchors moved with
  them. The west sofa, the entry door (x 2150-3150) and the east opening are unchanged.
- `src/domain/drawingRoomLayout.mjs` checks fits and clearances; the west sofa sees the TV about 72-81 degrees
  off-axis, the south sofa about 4.6-4.7 m straight on.
- Alternative layout B (`drawing.cornerLayout`): north-wall sofa + west-wall sofa in an L, the 65-inch TV wall-mounted
  on the solid east wall (z 355-1805), Soundbar 300 on the wall and Bass Module 500 on the floor beneath it, and a small
  router/landline/intercom cabinet above the north sofa. Built alongside layout A and switched with the Layout toggle
  (B is shown first). Analysis and trade-offs in `docs/DRAWING_ROOM_TV_WALL.md`.

## Room review sheet (2026-09-29)

The room workspace has a **Review sheet for AI** button: one PNG (dimensioned top plan, overview, four walls from the room centre, key facts) plus a copyable text brief. Details and limits: `docs/REVIEW_SHEET.md`. Pure brief builder: `src/domain/roomReview.mjs`; canvas composer: `src/render/reviewSheet.js`; capture: `EmptyRoomGallery.jsx`.

## Drawing Room east-wall options (2026-09-30)

Layout list now has A (north-wall cabinet), B (65-inch TV flat on the east wall), **B2** (18-inch deep low console under a
55 or 65-inch arm-mounted TV; shown first) and **B3** (future ceiling projector with an 80-inch drop-down screen). The corner
layouts use a 600 mm coffee table (was 650) so the walkway beside the 457 mm console stays at 811 mm. A floor-to-ceiling
18-inch unit was checked and rejected (576 mm walkway beside the north sofa). Analysis: `docs/DRAWING_ROOM_TV_WALL.md`.

## Drawing Room entry door opens inward (2026-09-30)

Owner: the entry door opens INTO the Drawing Room (the floor-plan drawing shows the swing on the entry side, so it is not
trusted here) and the north-wall sofa does not touch it. `drawing.doors[0]` records `opensInto`, `hinge: 'east'`,
`hingeKnown: true` and a working `leafMm: 850`. That is the only combination that lets the 2250 mm north sofa clear the swing
(east hinge, leaf up to about 855 mm), so the hinge side is inferred, not measured; measure the leaf on site. If `hingeKnown`
is false every check tests both hinge sides. The sofas stay full size; shortening them to 2100 mm is only a fallback if the
real door is wider. Details: `docs/DRAWING_ROOM_TV_WALL.md`.

## Entry wall cavity and live measuring (2026-09-30)

Whole home 3D (Editable) shows the empty pocket on the Main Entry side of the Drawing Room north wall (plan x 577-680, y 726-772: about 925 mm = 3 ft deep, about 2 m wide, floor to ceiling; along the Drawing Room wall x 116-2149 mm) as a teal volume, with the 9-inch (about 221 mm) wall between as an amber ghost; toggle "Hide/Show entry wall cavity". First version (commit 77a227f) mistook the wall for the cavity; corrected after the owner sent a screenshot of the pocket. Whether the pocket is really hollow and the wall may be opened is unconfirmed. Analysis and uses: `docs/ENTRY_WALL_CAVITY.md`. The Measure tool now follows the mouse after the first click with a live line, axis legs (E-W, N-S, height), a tooltip and status bar readout; the second click fixes it and Esc cancels. Transparent overlays (cavity, door swing, projector beam) and hidden layouts are ignored by it.

Drawing Room corner layouts (B, B2, B3) now have a wall storage opening cut through the north wall into the cavity: x 200-2050, 1000-2350 high, 1105 deep, with the router, landline and intercom bay recessed flush in its middle; layout A keeps the wall closed. Details, limits and the on-site checks it still needs: `docs/ENTRY_WALL_CAVITY.md`. New: `Open wall storage doors` and, on the Drawing Room page, `North wall view`.

Entry pocket east opening (2026-09-30): the editable 3D (Whole home 3D and Main entry) now builds the pocket as a walled box with an east opening in its plan-left wall (plan x 575, y 729-769, 2100 mm high; working size, not measured) next to the north opening from the Drawing Room. The cavity ghost is hidden by default. Details and the open storage-panel conflict: `docs/ENTRY_WALL_CAVITY.md`.
