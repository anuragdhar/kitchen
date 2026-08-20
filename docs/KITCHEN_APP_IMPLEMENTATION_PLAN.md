# Kitchen App Implementation Plan

This plan upgrades the current kitchen workflow into a construction-ready design system. It is written as sequential implementation phases so an AI coding agent can implement and verify each phase independently.

## Implementation Status

As of the current repo state, all phases have a working baseline implementation:

| Phase | Status | Current output |
| --- | --- | --- |
| 1 | Done | React shared layout model in `kitchenConfig.js`. |
| 2 | Done | Dimension/ruler overlay, wall labels, grid snap, 2D export scale text. |
| 3 | Done | Detailed validation panel and exported validation rows. |
| 4 | Done | Cabinet module definitions, auto-fill, editor, plan/elevation splits. |
| 5 | Done | Improved Three.js gas, chimney, sink, cabinet details, labels, camera presets. |
| 6 | Done | East, West, North, and South elevations with SVG/PNG export buttons. |
| 7 | Done | Material/finish selector stored in JSON and reflected in views. |
| 8 | Done | BOM calculator with CSV and Markdown exports. |
| 9 | Done | Save/load JSON, localStorage autosave, Rule #9 reset, named local versions. |
| 10 | Done | FreeCAD generator normalizes React shared export shape and keeps BIM-style names. |
| 11 | Done | FreeCAD script emits plan SVG/DXF and dimension summary. |
| 12 | Done | Blender automation script and launcher added; requires Blender on PATH to run renders. |
| 13 | Done | Browser ZIP package export with layout, plan, BOM, guide, validation, and manifest. |

Remaining work is polish and deeper QA, not first implementation: cross-browser testing, prettier UI separation, richer cabinet editing, real pricing, optional PDF export, and final Blender render validation after Blender is installed.

## Tool Strategy

Use this tool ownership model:

- **React 4-View is primary for implementation.** It is the main design UI and fast AI playground for Top, Front, East Wall, West Wall, 3D preview, exports, validation, and `window.kitchenAPI` experiments.
- **Shared JSON is the layout data source.** React owns editing and exports the layout model. FreeCAD and Blender pipelines should consume this data instead of duplicating design rules manually.
- **FreeCAD BIM is the construction/export target.** It produces exact millimeter geometry, construction-ready objects, cabinetry depths, wall openings, shaft, counters, upper cabinets, LED strips, and dimensional validation from the shared JSON.
- **Blender is for final photoreal renders.** Use it only after the React layout and FreeCAD BIM model are correct and export-ready. Blender should not become the design source of truth.
- **Coohom is optional/background-only.** Use Coohom only if a designer needs a quick native-cabinet rebuild reference. Do not depend on Coohom for precise construction decisions.

## Non-Negotiable Geometry Rules

- All geometry must use millimeters.
- Capture the exact cabinet depth levels:
  - East base run: 600D.
  - East lower upper cabinets: 320D.
  - East top upper cabinets: 550D.
  - West counter run: 400D.
  - West lower upper cabinets: 320D.
  - West top upper cabinets: 450D.
- Preserve west full-height door clear zone from y0 to y1220.
- Preserve north 300 mm clear zone.
- Preserve warm LED strips under lower upper cabinets.
- Do not represent the gas/chimney as one tall box. Use a cooktop plus a compact chimney/hood form.
- Preserve current Rule #9 appliance order unless a later phase explicitly creates design alternatives.

## Current Baseline

- FreeCAD generator exists in `freecad/generate_kitchen_rule9.py`.
- Generated FreeCAD model exists at `freecad/kitchen_rule9.FCStd`.
- React app exists in `react-configurator/`.
- Main UI file: `react-configurator/src/App.jsx`.
- Current config file: `react-configurator/src/config/kitchenConfig.js`.
- Current features:
  - Top plan view.
  - Front view.
  - East wall elevation.
  - West wall elevation.
  - Interactive Three.js 3D render.
  - 3D screenshot export.
  - 2D SVG/PNG/DXF export.
  - Coohom rebuild guide export.
  - JSON layout export.
- Current locked layout:
  - Room: 2324 mm wide x 4746 mm long x 2700 mm high.
  - East wall: 600D run with gas, spice, dishwasher, washing machine.
  - West wall: y0-y1220 full-height clear door zone, then 400D run with microwave, processor, purifier, sink, shaft.
  - North: 300 mm clear zone and window reference.

## Phase 1: React Shared Layout Model

Goal: make React the primary implementation surface while creating a layout model that FreeCAD and Blender can consume later.

Tasks:

1. Create a shared layout schema in React that includes:
   - `room`
   - `openings`
   - `walls`
   - `cabinetRuns`
   - `appliances`
   - `validationRules`
   - `materials`
   - `exports`
2. Keep `react-configurator/src/config/kitchenConfig.js` as the first implementation location.
3. Preserve compatibility with current `EAST_INIT` and `WEST_INIT` while migrating to the richer model.
4. Add stable IDs for all room objects and design entities.
5. Add exact named constants for:
   - room width: 2324 mm.
   - room length: 4746 mm.
   - room height: 2700 mm.
   - west clear zone: y0-y1220.
   - north clear zone: 300 mm.
   - shaft position: y4146.
6. Add metadata to each item:
   - `category`
   - `wall`
   - `x`
   - `y`
   - `z`
   - `width`
   - `depth`
   - `height`
   - `locked`
   - `color`
   - `material`
   - `clearance`
7. Make JSON export include the full shared model.

Acceptance checks:

- React app still builds with `npm run build`.
- Existing top, front, east elevation, west elevation, 3D preview, and exports still render.
- Exported JSON includes the richer shared model.
- Current Rule #9 remains the default layout.

## Phase 2: React Dimension And Ruler Overlay

Goal: make the React 2D plan usable as a design drawing, not only a rough visual.

Tasks:

1. Add dimension lines for:
   - Room width: 2324 mm.
   - Room length: 4746 mm.
   - East base depth: 600 mm.
   - West counter depth: 400 mm.
   - Walkway width.
   - North clear zone: 300 mm.
   - West door clear zone: y0-y1220.
2. Add wall labels:
   - North `(N)`
   - South `(S)`
   - East `(E)`
   - West `(W)`
3. Add a grid toggle:
   - 50 mm grid.
   - 100 mm grid.
   - Off.
4. Add snap-to-grid for item dragging.
5. Add scale text in exported SVG/PNG/DXF.

Acceptance checks:

- Dimension text is readable in desktop and mobile widths.
- Dragging remains usable.
- Exported 2D plan contains all major dimensions.

## Phase 3: React Validation Panel

Goal: show clear pass/fail design rules instead of only a single valid/invalid badge.

Tasks:

1. Create validation functions for:
   - East order: gas before dishwasher before washing.
   - West order: microwave before processor before purifier before sink before shaft.
   - Purifier near sink.
   - Door clear zone empty from y0 to y1220.
   - North 300 mm clear zone empty.
   - Walkway minimum.
   - Cabinet/appliance collision.
   - Item outside room bounds.
2. Add a validation panel with rows:
   - status icon.
   - rule name.
   - measured value.
   - expected value.
   - fix suggestion.
3. Use validation results in export metadata.

Acceptance checks:

- Moving an item into the door clear zone creates a visible warning.
- Valid Rule #9 layout shows all core rules passing.
- JSON export includes validation details.

## Phase 4: React Cabinet Module System

Goal: replace long block cabinets with modular cabinet units that resemble real kitchen planning.

Tasks:

1. Add cabinet module definitions:
   - 300 mm base.
   - 450 mm base.
   - 600 mm base.
   - 750 mm base.
   - 900 mm base.
   - corner/filler panels.
   - end panels.
2. Create an algorithm to fill a cabinet run using available modules.
3. Add cabinet properties:
   - carcass width.
   - shutter type.
   - drawer count.
   - handle style.
   - plinth height.
   - counter overhang.
4. Add visual split lines in top view and elevations.
5. Add a simple module editor panel:
   - choose wall.
   - choose run.
   - auto-fill modules.
   - manually change module width.

Acceptance checks:

- East 600D run renders as multiple base modules.
- West 400D run starts only after y1220.
- No module is created in the west door clear zone.
- Build passes.

## Phase 5: Improved React 3D Preview

Goal: make the React 3D preview clearer while keeping FreeCAD as the construction export target.

Tasks:

1. Replace block gas with:
   - thin cooktop slab.
   - four burner rings.
   - compact chimney hood.
2. Replace block sink with:
   - counter cutout.
   - sink bowl.
   - faucet.
3. Add cabinet details:
   - doors.
   - drawer lines.
   - handles.
   - plinth.
   - countertop thickness.
4. Add wall labels in 3D:
   - East.
   - West.
   - North.
   - South.
5. Add camera presets:
   - Top.
   - East wall.
   - West wall.
   - North view.
   - South view.
   - Walkthrough.
6. Add material presets:
   - cabinet body.
   - shutters.
   - countertop.
   - backsplash.
   - floor.

Acceptance checks:

- East cabinets appear on east/right side.
- West cabinets appear on west/left side.
- Camera presets work.
- 3D screenshot export still works.

## Phase 6: React Wall Elevation Designer

Goal: make wall elevations exportable shop-style drawings.

Tasks:

1. Add all four elevations:
   - East.
   - West.
   - North.
   - South.
2. Add elevation dimensions:
   - counter height.
   - backsplash height.
   - lower upper cabinet zone.
   - top upper cabinet zone.
   - ceiling height.
3. Add cabinet module divisions in elevation.
4. Add appliance labels with exact y position and size.
5. Add export buttons:
   - East elevation PNG/SVG/PDF.
   - West elevation PNG/SVG/PDF.
   - All elevations ZIP.

Acceptance checks:

- East elevation has North `(N)` on left and South `(S)` on right.
- West elevation has South `(S)` on left and North `(N)` on right.
- West y0-y1220 remains empty from floor to ceiling.

## Phase 7: React Material And Finish Selector

Goal: allow design options without editing code.

Tasks:

1. Add a material panel.
2. Support changing:
   - cabinet carcass color.
   - shutter color.
   - countertop material.
   - backsplash material.
   - wall paint.
   - floor tile.
   - appliance finish.
   - handle finish.
3. Store material choices in layout JSON.
4. Reflect choices in:
   - top view.
   - elevations.
   - 3D render.
   - exports.

Acceptance checks:

- Changing a material updates 2D and 3D views.
- Exported JSON reloads the same material selections.

## Phase 8: React BOM And Quote Export

Goal: generate a practical list for a carpenter/designer from the React module model.

Tasks:

1. Add a bill-of-materials calculator:
   - base cabinet count.
   - wall cabinet count.
   - tall unit count.
   - shutter count.
   - drawer count.
   - handle count.
   - countertop length.
   - backsplash area.
   - appliance list.
2. Add export formats:
   - CSV.
   - Markdown.
   - PDF later.
3. Include dimensions for each module.
4. Include notes:
   - door clear zone.
   - north clear zone.
   - shaft.
   - window.

Acceptance checks:

- BOM matches visible module count.
- CSV opens correctly in Excel.
- Markdown BOM is readable in GitHub.

## Phase 9: Save, Load, And Version Designs

Goal: support iterative design without losing work.

Tasks:

1. Add `Save Project JSON`.
2. Add `Load Project JSON`.
3. Add `Reset to Rule #9`.
4. Add local browser autosave using `localStorage`.
5. Add named design versions:
   - `Rule #9 current`.
   - `Option A`.
   - `Option B`.
6. Add import validation:
   - reject invalid room dimensions.
   - warn for missing item IDs.
   - migrate old JSON shape if possible.

Acceptance checks:

- Saved JSON can be loaded back into the app.
- Invalid JSON does not crash the app.
- Reset restores the committed current layout.

## Phase 10: FreeCAD BIM Export From React JSON

Goal: make FreeCAD produce a construction-ready kitchen model from the React/shared JSON after the React layout model is stable.

Tasks:

1. Refactor `freecad/generate_kitchen_rule9.py` into clear generator functions:
   - room shell.
   - openings.
   - east base run.
   - east 320D lower upper cabinets.
   - east 550D top upper cabinets.
   - west door clear zone.
   - west 400D counter run.
   - west 320D lower upper cabinets.
   - west 450D top upper cabinets.
   - warm LED strips.
   - appliances.
   - labels/dimensions.
2. Read the React/shared JSON export where practical.
3. Add BIM-style object names to every generated shape:
   - `East_600D_Base_Run`
   - `East_320D_Lower_Upper`
   - `East_550D_Top_Upper`
   - `West_Door_Clear_Zone_y0_y1220`
   - `West_400D_Counter_Run`
   - `West_320D_Lower_Upper`
   - `West_450D_Top_Upper`
   - `Warm_LED_East`
   - `Warm_LED_West`
4. Model the gas/chimney as separate objects:
   - cooktop slab.
   - burner circles or ring markers.
   - compact chimney hood.
5. Add validation output from the FreeCAD script:
   - object count.
   - bounding boxes.
   - clear zones preserved.
   - no objects in west y0-y1220 clear zone.
   - no objects in north 300 mm clear zone.

Acceptance checks:

- Running `Generate-FreeCAD-3D.bat` regenerates `freecad/kitchen_rule9.FCStd`.
- FreeCAD model has separate named objects for every depth level.
- West y0-y1220 has no counter, upper cabinet, or LED object.
- Gas/chimney is not a single tall box.
- FreeCAD output matches React JSON.

## Phase 11: FreeCAD Drawings And Dimensions

Goal: generate construction-oriented drawings from FreeCAD, not only visual screenshots.

Tasks:

1. Add FreeCAD-generated 2D exports:
   - plan SVG/DXF.
   - east elevation SVG/DXF.
   - west elevation SVG/DXF.
   - dimension summary Markdown.
2. Add dimensions for:
   - room width.
   - room length.
   - wall height.
   - cabinet depth levels.
   - counter height.
   - lower upper cabinet height.
   - top upper cabinet height.
   - west door clear zone.
   - north clear zone.
3. Add object labels that match BIM object names.

Acceptance checks:

- FreeCAD exports can be generated without opening the GUI.
- Exports show 320D/550D/450D/400D/600D depth levels.
- Dimension summary matches React layout values.

## Phase 12: Blender Photoreal Render Pipeline

Goal: create final 4K renders from the accurate FreeCAD model when photoreal output is needed.

Tasks:

1. Add a FreeCAD export target for Blender:
   - OBJ, GLTF, STEP, or another stable intermediate.
2. Create a Blender automation script under `blender/`.
3. Import the FreeCAD export into Blender.
4. Apply render materials:
   - cabinet carcass.
   - shutter.
   - countertop.
   - backsplash.
   - floor.
   - walls.
   - appliance metal/black glass.
5. Add cameras:
   - wide kitchen view.
   - east wall detail.
   - west wall detail.
   - cooktop/chimney detail.
   - sink/purifier detail.
6. Add lighting:
   - room fill.
   - warm LED strip glow.
   - window daylight.
7. Add batch render script for 4K PNG output.

Acceptance checks:

- Blender renders are generated from the FreeCAD-derived model, not manually rebuilt geometry.
- 4K render output folder is created.
- Warm LED is visible.
- East/West orientation remains correct.

## Phase 13: Complete Export Package

Goal: generate a single package for a carpenter, designer, or external tool.

Tasks:

1. Add one-click `Export Project Package`.
2. Include:
   - layout JSON.
   - FreeCAD `.FCStd`.
   - FreeCAD-generated drawings.
   - 2D plan SVG.
   - 2D plan PNG.
   - 2D plan DXF.
   - wall elevation SVG/PNG files.
   - 3D screenshot.
   - Blender render images if generated.
   - BOM CSV.
   - BOM Markdown.
   - implementation notes.
   - Coohom/native rebuild guide.
3. Generate a ZIP file in the browser.
4. Add package manifest:
   - export date.
   - room dimensions.
   - app version.
   - validation status.

Acceptance checks:

- ZIP downloads correctly.
- ZIP contains every expected file.
- Manifest validation status matches the app validation panel.

## Suggested Implementation Order

1. Phase 1: React shared layout model.
2. Phase 2: React dimension and ruler overlay.
3. Phase 3: React validation panel.
4. Phase 4: React cabinet module system.
5. Phase 5: Improved React 3D preview.
6. Phase 6: React wall elevation designer.
7. Phase 7: React material and finish selector.
8. Phase 8: React BOM and quote export.
9. Phase 9: Save/load/versioning.
10. Phase 10: FreeCAD BIM export from React JSON.
11. Phase 11: FreeCAD drawings and dimensions.
12. Phase 12: Blender photoreal render pipeline.
13. Phase 13: ZIP package export.

## Notes For AI Implementation

- Keep changes small and test after each phase.
- Treat React as the primary implementation surface and validation UI.
- Treat shared JSON as the layout data source.
- Treat FreeCAD BIM as the construction/export target.
- Treat Blender as render-only unless explicitly changing the pipeline.
- Run `npm run build` after each phase.
- Run `Generate-FreeCAD-3D.bat` after every FreeCAD-related phase.
- Preserve current Rule #9 layout as the default.
- Preserve 320D/550D/450D depth levels in FreeCAD object names and geometry.
- Do not put any cabinets or counters in the west y0-y1220 door clear zone.
- Keep East wall orientation as North left to South right in elevation.
- Keep West wall orientation as South left to North right in elevation.
- Update README when user-facing buttons or exports change.
- Refresh screenshots when 3D or wall elevation visuals change.
