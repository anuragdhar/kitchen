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

## Entry pocket: two separate cabinets; Whole home 3D starts south-up (2026-10-03)

Owner: the pocket behind the Drawing Room north wall is two separate cabinets, as the Blender model shows. Editable 3D now has a
full-height partition at plan x 650; the east cabinet is open over its whole east side onto the Entry gallery; the west cabinet
is entered from the Drawing Room by a narrow hidden door at the west end of the north wall (one flush leaf in fluted wall panelling, x 100-600, 1,800 high, 490 mm clear, opening outward; was two leaves x 80-680, 2,100 high) with shelves at
the back. This replaces the 2026-09-30 wide wall storage opening (x 200-2050) and the door-height east opening; the router
cabinet is wall-hung again at x 800-1900. The north sofa (B, B2, B3) and the TV cabinet (A) stand in front of the new door; this is
reported, not fixed. Details: `docs/ENTRY_WALL_CAVITY.md`. The Whole home 3D Blender model now opens looking from the north, so
south is at the top like the plan, with a compass in the corner.


Designer render (2026-10-03): the live 3D views now default to an ambient-occlusion render (switch: "Designer render") that
grounds furniture and shades corners without changing any geometry, material or colour. Details: `docs/LIGHTING.md`.

Drawing Room layout C (2026-10-03, now the default): south sofa against the window wall, west sofa slid south into an L, table
inside it, 55-inch TV (65-inch option) on the north wall between the west cabinet door and the entry door, router cabinet moved
to the east wall. The TV console is one free-standing piece (x 500-2100) in front of fluted wall panelling (x 40-2100, to 1,800 high) that hides the west cabinet's door; drag the console out 600 mm before opening the door outward. Details: `docs/DRAWING_ROOM_TV_WALL.md`.

Drawing Room electrical plan (2026-10-03, layout C): 17 proposed points (TV box, media point, router and intercom, main
switchboard with a drop-zone charger, AC, lamps, USB charging within 1.5 m of every seat, closet light, spares, optional
floor box), shown with "Show electrical points". Planning only, for a licensed electrician: `docs/DRAWING_ROOM_ELECTRICAL.md`.

Drawing Room layout C update (2026-10-03): a wall-hung TV console under the TV now holds the router, set-top storage and the Bass
Module, with the soundbar, landline and a desk intercom on top; the east-wall cabinet is gone. The south sofa moved 450 mm east
with a round lamp table at its west end.
Whole home 3D: Bedroom 1 is fitted to its own walls (plan x 339-515), not stretched over its balcony, which had pushed the bed
and the east wall into the Pooja Ghar.

Click for dimensions (2026-10-03): in Whole home 3D (editable) and the room pages, clicking furniture or a cabinet outlines it
and shows its width (east-west), depth (north-south), height and height off the floor in room millimetres
(`src/render/dimensionPick.js`, `ItemDimensionsPanel.jsx`). Sizes are the modelled outer box, not site measurements. Clicking a
wall still marks the wall. Not in the kitchen planner, Study, Balcony office, Entry or Storage views.

Work plan (2026-10-03): `work-plan/plan.json` tracks renovation tasks by phase and trade with dependencies and status; the
Work plan page (header button) edits it and saves to the file when run locally. Details: `docs/WORK_PLAN.md`.

Inspiration applied (2026-10-03; details in each entry's notes in `inspiration/library.json`): kitchen shaft wall herb grid
(replaces the three pottery planters), kitchen default wood is white oak, Drawing Room curtains and floor plant, and a
Bedroom 3 bedside-cabinet preview toggle (idea only, layout unchanged). The appliance-garage door/tray and the full-height
spice pull-out are not modelled: positions are undecided.

Whole home 3D sync (2026-10-03): the page now opens on Editable 3D, which is always the current design. The Blender model tab
is a baked snapshot of an earlier design; its Drawing Room TV meshes are moved onto the north wall at load time
(`ArchivedBlenderHomeView.jsx`), but its sofas, kitchen and everything else stay as baked until the whole home is re-baked in
Blender. The slot between the Pooja Ghar and Bedroom 1 (plan x 317-339) is filled as masonry, an assumption from the drawing.

## Bedroom 3 east bedside cabinets (2026-10-03)

Owner request: move the west-wall cabinetry to both sides of the east-wall bed,
using the supplied mirror/overhead-cabinet and slatted-AC references, the existing
honey-oak shade, and an overall depth of 18 inches (457.2 mm).

- Removed the west run: 2676 mm along the wall x 580 deep x 2500 high, starting
  1050 mm from north, including its 600 mm dressing bay. The former preview is now
  replaced by the current furniture, visible in Bedroom 3 and Whole home Editable 3D.
- Northeast mirror dressing cabinet: 750 wide along the wall x 457.2 deep x 2200
  high, starting 150 mm from north. Southeast low cabinet: 750 x 457.2 x 600,
  starting 2826 mm from north. The low cabinet is the working interpretation of
  the owner's small southeast cabinet. Both have 48.5 mm separation from the bed.
- Overhead run: 3426 wide x 457.2 deep x 450 high, from 2200 to 2650 above floor.
  Central 1200 mm slatted AC bay, open underneath, with a 1000 x 280 x 230 mm
  placeholder unit. AC selection, airflow, removable-panel hardware, service
  access and installation clearances require equipment-specific review.
- The bed remains 1829 x 1829, head east, centre 1863 from north; room, doors,
  south projecting cabinet and balcony retain their configured dimensions.
  The 457.2 mm depth reaches x 3505.8, 44.2 mm into the toilet opening's x range,
  but starts 150 mm south of its wall plane. It does not occupy the opening;
  the approach and open mirror leaf still need on-site review.
- Configuration: roomShellConfig.js; shared geometry: Bedroom3EastCabinet.js.
  Coordinates are millimetres, x east from west wall / z south from north wall /
  y up; builders divide by 1000 for Three.js metres. Depth includes closed fronts.
  The existing mirror control opens the new dressing cabinet.
- Added an East cabinetry view. Previous Blender stills remain available under
  Show previous renders, labelled as the earlier layout; they were not regenerated.
  Layout and review-plan fixtures: bedroom3-east-cabinet.test.mjs.

Verification completed 2026-10-04 (Node 22.23.3):
- `npm.cmd run check`: 274/281 tests passed; seven unchanged Windows launcher
  tests failed with ENOENT for temporary caller-cwd.log. Its build stage did not run.
- `node --test tests/bedroom3-east-cabinet.test.mjs tests/room-review.test.mjs`:
  10/10 passed. `npm.cmd run build`: passed, with the existing large-chunk warning.
- Chrome/Playwright against the existing loopback server: reviewed east elevation,
  open mirror, top plan, mobile east elevation and Whole home Editable 3D; no page
  errors. Generated Three.js bounds confirm both closed cabinet assemblies have
  457.2 mm depth. Local evidence is under react-configurator/test-results/bedroom3-*.
- `git diff --check`: passed. Blender/CAD regeneration, physical installation,
  AC performance and site measurements were not verified.

Changed source files for this request: src/config/roomShellConfig.js,
src/rooms/bedroom3/Bedroom3EastCabinet.js, Bedroom3DressingTable.js and
Bedroom3Wardrobe.js in that same directory, src/EmptyRoomGallery.jsx,
src/domain/roomReview.mjs, tests/bedroom3-east-cabinet.test.mjs, package.json,
and this document. Existing changes in .claude/settings.json and
inspiration/library.json were left as found.

## Bedroom 3 west chest and artwork (2026-10-04)

Owner accepted the low-chest proposal to balance the east cabinetry and add drawer
storage while keeping the west wall light. Previously this wall was empty after
the east-cabinet change. Added a honey-oak chest, 1400 mm along the wall x 450 deep
x 800 high, with six drawers and a clear top. It occupies x 0-450, z 1163-2563,
centred opposite the existing bed. Closed chest-to-bed-foot clearance changes from
2134 mm (empty wall) to 1684 mm. Its north end is 1163 mm off the north wall,
beyond the 900 mm entry-leaf envelope; its south end is 1163 mm from the south
storage wall. Existing bed, east cabinetry, room and openings are unchanged.

A 1100 x 700 x 30 mm framed geometric artwork is centred above it, bottom 1050 mm
above floor (250 mm over the chest). Shared builder Bedroom3WestChest.js serves
Bedroom 3 and Whole home Editable 3D. Config is in roomShellConfig.js, in mm with
x east / z south / y up; the builder converts to metres. Width here runs along z.
The room has a West chest view button; review sheets include the chest footprint
and clearance. Layout fixtures are in bedroom3-east-cabinet.test.mjs.

Changed files: src/config/roomShellConfig.js, src/rooms/bedroom3/Bedroom3WestChest.js,
src/EmptyRoomGallery.jsx, src/WholeHome3D.jsx, src/domain/roomReview.mjs,
tests/bedroom3-east-cabinet.test.mjs, and this document. Earlier working changes
were retained. Blender snapshots and CAD exports were not regenerated.

Verification (Node 22.23.3): `npm.cmd run check` returned 275/282 passing, with
the same seven documented Windows launcher ENOENT failures; its build stage was
not reached. Separate `npm.cmd run build` passed (existing large-chunk warning).
`node --test tests/bedroom3-east-cabinet.test.mjs tests/room-review.test.mjs` passed
11/11. `node test-results/bedroom3-west-check.cjs` passed with Chrome: rendered
chest bounds 450 x 800 x 1400 mm in x/y/z, artwork 30 x 700 x 1100 mm, no page
errors. Reviewed west desktop/mobile, top, east, and Whole home Editable 3D
screenshots in test-results/bedroom3-*.png. The first SwiftShader run crashed
during the mobile screenshot; the completed run used Chrome's default renderer.
The artwork mounts 50 mm from x=0 to clear the room shell's inside face.
`git diff --check` passed. Physical fit, installation, drawer mechanisms and
Blender/CAD output were not verified; browser evidence is visual smoke QA.

## Phone scan of the Drawing Room and Lobby (2026-10-04)

The owner's Scaniverse scan was measured and partly applied; the full table, method and accuracy are in
`docs/SITE_SCAN_2026-10-04.md`. Applied: Drawing Room south window 471 + 2298, sill 550, head 2100 -> 233 + 2700, sill 935,
head 2430, three bays; layout C chandelier (1676, 2850) -> (1600, 2705) and ceiling fans (1676, 1150), (1676, 4550) ->
(1650, 1290), (1580, 4075); Lobby toilet door 1000 + 900 -> 1060 + 605. Not applied: the scanned room box (Drawing Room
3150 x 5276 x 2775, Lobby ceiling 2760, beam 260 wide with its underside at 2445) because the whole-home model uses the
A501 outline and one 2700 ceiling; the Lobby north door, which the app shows at its planned position after civil work
(today it is at about 2580-3530). Fan blade size and drop are still assumed. Blender exports and stills were not regenerated.

## Changes of 2026-10-04 (evening): entry, lighting, scans, home office

Five pieces of work were built in parallel and merged; each has its own note in `docs/changes/` with before/after
dimensions, the defaults chosen without asking the owner, and what is not verified.

- **Main entry** (`2026-10-04-entry.md`): the outer opening has a ventilated stainless steel door (leaf 815 x 2145, grille
  panels, about 38 % open); the generic linear strips are replaced by four round 8 W panel lights; no track there. The
  wooden door to the Drawing Room stays.
- **Lighting** (`2026-10-04-lighting.md`, `docs/LIGHTING.md`): one track run = one circuit with its own driver and wall
  dimmer (individual heads cannot be dimmed); sliders are per circuit. The old overlay strips are gone from the Lobby and
  Pooja alcove. Bedroom 1, Bedroom 3, the Study (Bedroom 2) and the Kitchen have track lighting configs, checks and
  sliders. Fans in Bedroom 1 and the Study are assumed at the room centre.
- **Existing electrical points** (`2026-10-04-existing-electrical.md`): "Show existing electrical points" on the Drawing
  Room, Lobby and Bedroom 3 pages and in Whole home 3D, from the phone scans, with a list of conflicts against the plan.
- **Bedroom 3 scan and windows** (`2026-10-04-bedroom3-windows.md`, `docs/SITE_SCAN_2026-10-04_BEDROOM3.md`): toilet door
  2850 + 700 x 2100 -> 2525 + 780 x 2000; south wardrobe bay 0 + 1771 x 2400 -> 365 + 1540 x 2450; balcony door 1771 +
  1000 x 2200 -> 2005 + 700 x 2360 with a transom at 2040; window 2771 + 1192, sill 900, head 2200 -> 2785 + 920, sill
  920, head 2360; fan point (2030, 1820) from the scan; wardrobe spots on track B2 moved from x 450 / 1350 to 650 / 1620.
  The room box (scan 3915 x 3665 x 2770) is not changed. Windows are drawn by a shared builder with transoms, top lights,
  shutters, roller nets and the outside screen (Drawing Room) from config.
- **Home Office, the balcony of Bedroom 2** (`2026-10-04-home-office.md`, `docs/SITE_SCAN_2026-10-04_HOME_OFFICE.md`):
  sit-stand top 2268 -> 1500 long; a fixed 743 section at the south end at 838 high with a cabinet below; 25 mm gaps. The
  scanned room box (2460 x 1065) and the wall and column at the south-east corner are recorded, not drawn.

Tools added the same day: `react-configurator/scripts/room-shots.cjs` and `scripts/scan_measure.py` (docs/TESTING.md).
Blender exports and stills were not regenerated for any of this.

## 2026-10-05: ceiling heights left at 2700; AC outdoor unit under the shoe rack (proposal)

- Ceiling heights from the phone scans (2760-2775) are NOT applied: where a taped height exists (Home Office, 2642) the
  scan read about 38 mm high. Reasoning in `docs/SITE_SCAN_2026-10-04.md`; tape items A13 and A18.
- Owner proposal, not decided: the Drawing Room AC outdoor unit on the shoe rack platform, in the bottom of the rack.
  `ENTRY.shoeRack.acBay`, checks in `src/domain/entryFittings.mjs`, a toggle on the Main entry page (off by default; the
  plain rack 865 x 2134 x 381 is unchanged). By typical sizes it fits lengthwise (platform about 900 mm beyond the wall)
  and not across (needs 1200 of width). Details and conditions: `docs/changes/2026-10-05-shoe-rack-ac-bay.md`.

- AC outdoor units at the owner's four plan marks (Bedroom 3 and Bedroom 2 existing; Bedroom 1 and Drawing Room proposals),
  typical 1.5 ton casings 800 x 550 x 300: `src/config/acOutdoorUnitsConfig.js`, drawn in Whole home 3D and on the Bedroom 3
  page. The Lobby concept condenser moved about 1 m south on the same strip to clear Bedroom 1's. Kitchen 3D: Dark room now
  also hides the general preview lighting and the slider levels hold. Details: `docs/changes/2026-10-05-ac-outdoor-units.md`.
- Later 2026-10-05: Bedroom 3 outdoor unit on the wall at 1830 (6 ft), Bedroom 2's at 1524 (5 ft); the owner's 1.5 ton window
  AC in the east side of the Bedroom 1 balcony on an iron frame (`bedroom1.balconyExtension.windowAc`, typical casing
  660 x 430 x 700, on the 1 m parapet, centred 1353 from the north end); Bedroom 1's split outdoor unit raised to 1800 above it.

## 2026-10-05 (later): parallel design round

Six pieces of work, each with a note in `docs/changes/2026-10-05-*.md`:
- **Tracks and mouldings:** every track run in the Drawing Room, Lobby and Bedroom 3 moved or shortened onto flat slab,
  40 mm clear of the scanned plaster mouldings (`ceilingMouldings` in the lighting configs); Lobby fan modelled as probable.
- **Bedroom 1:** layout checks (`src/domain/bedroom1Layout.mjs`), hamper and rug moved, balcony wardrobe sliding; an
  alternative layout B (bed head on the south wall) behind a toggle, recommended but NOT chosen by the owner.
- **Work plan:** 101 tasks in buildable order with dependency checks and a rough budget (about Rs 15.1 to 26.6 lakh for 91
  tasks; planning ranges, not quotes): `docs/WORK_PLAN_BUDGET.md`, `docs/NEXT_STEPS.md`, generator
  `react-configurator/scripts/work-plan-estimate.mjs`.
- **AC plan:** `src/config/acPlanConfig.js`, `docs/AC_PLAN.md`; pipe, drain and power point per machine, shown by "Show AC
  pipe routes" in Whole home 3D. Recommendations not yet confirmed by the owner: no split AC in Bedroom 1 (the window AC
  covers it), a 1.5 ton unit for the Lobby using the outdoor place marked for Bedroom 1, Drawing Room outdoor unit on the
  west wall.
- **Palette:** `src/config/homePaletteConfig.js`, `docs/PALETTE.md`, a Palette page and a preview selector; the default
  look is unchanged and no palette is chosen.
- **Electrical plans:** `src/config/roomElectricalConfig.js`, `docs/ELECTRICAL_PLAN.md` for the Lobby, Bedroom 1,
  Bedroom 3, Study, Home Office and Main entry; the three clashes with existing points have a resolution each.
- Pooja Ghar: one round surface ceiling light in the middle of the alcove (`lobby.poojaAlcove.ceilingLight`).
- Bedroom 3 east wall (owner 2026-10-05): the mirror dressing cabinet moved to the south end (750 x 457.2 x 2200, from z 2826)
  and a floor-to-ceiling storage cabinet took its place at the north end (750 x 457.2 x 2700, from z 150); the overhead run
  is now z 900-3576 (was 150-3576). The dressing down light moved from track B1 to B2 (B2's driver 60 -> 100 W) and a
  dressing socket B3-S1 was added under the window sill. Checks in `src/domain/bedroom3EastCabinet.mjs`. Flagged, not
  changed: the dressing cabinet stands 150 mm in front of the east 199 mm of the balcony window (open item C46). Note:
  `docs/changes/2026-10-05-bedroom3-dressing-swap.md`.
- Work plan: 112 tasks; rough total about Rs 16.1 to 30.8 lakh for 105 of them (planning ranges, not quotes).
- Bedroom 3, later 2026-10-05 (owner): dressing cabinet depth 457.2 -> 258 (stops at the window edge); north storage
  cabinet depth 457.2 -> 658 (fills the wall to the toilet door jamb at x 3305). Followed: toilet switches B3-N2 to the
  west side of the toilet door (x 2375), track B1 end 3350 -> 3150, dressing socket to x 3455. The overhead run stays 457.2.

## 2026-10-05 (night): cleanup, code quality, render quality

- Cleanup (`docs/changes/2026-10-05-cleanup.md`): five tracked Blender backups, two dead files, the hidden Coohom guide
  builder and dead branches removed; a list of "unsure" files is left for the owner.
- Code quality (`docs/changes/2026-10-05-code-quality.md`): `npm test` runs every `tests/*.test.mjs`; an import check runs
  inside it (`npm run lint`); `"type": "module"`; shared label sprite; pieces extracted from WholeHome3D.jsx and
  EmptyRoomGallery.jsx. Bug fixed: Whole home 3D now reads the kitchen's current (versioned) save.
- Render quality (`docs/changes/2026-10-05-render-quality.md`): every live 3D view is built by `src/render/liveView.js`
  with one exposure, fitted soft sun shadows, a shared daylight rig (`src/render/lightRig.js`), lamp colour from Kelvin,
  a Quality switch (Auto / Draft / Standard / High) and Save picture. Appearance only; no geometry changed.
- 2026-10-06: Drawing Room track feeds. Points C2 and C3 (one driver feed per track, at the run end nearest the
  switchboard), `DRAWING_LIGHT_FEEDS` (rotary LED dimmer per circuit, cable routes from the existing north-wall
  switchboard X-D1: 2.4 m and 4.5 m), `checkLightFeeds`; the routes draw with "Show electrical points".
