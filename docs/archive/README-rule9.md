# Kitchen Galley Layout

Current layout: Rule #9 locked galley kitchen, 2324 mm wide x 4746 mm long x 2700 mm high.

React is now the primary implementation surface. FreeCAD remains the construction-ready 3D/BIM target, Blender is the future photoreal render target, and Coohom is paused for now.

## Current Rules

- East wall, 600 mm deep: appliance garage near the south door at y300-y1150 for microwave + food processor, 3-burner gas cooktop shifted north to y2300 with the chimney body hidden inside the 320D upper cabinet, dishwasher at y3546 directly adjacent to the washing machine, and washing machine last at y4146 touching the north wall. The old right-side spice unit has been removed.
- East render visibility: the covered washing machine and covered dishwasher are still represented behind handleless fronts, with door-swing markers. Washing machine door opens left; dishwasher door opens down.
- East wall elevation is shown with North `(N)` on the left and South `(S)` on the right.
- West wall, 400 mm deep after the door zone: South 0 to y1220 is a full-height clear door zone with no counter, no upper cabinet, and no LED strip.
- West wall after y1220: real sink at y3146, then a 400W x 350D x 550H water purifier cabinet at y3746 filling the gap to the shaft, then shaft last at the north-west end. Clean-dish storage is shown above the sink.
- North window area: the 300 mm marker is only a below-window reference, not a full-width no-counter zone.
- Window: north wall, 1100 mm wide x 1800 mm high, sill 900 mm.
- Door: south side, 1100 mm wide.

## Main Files

- `react-configurator/` - React configurator app.
- `react-configurator/src/App.jsx` - Top, front, east/west/north/south elevations, and interactive 3D render.
- `react-configurator/src/config/kitchenConfig.js` - Shared millimeter layout model, kitchen dimensions, cabinet runs, openings, materials, validation rules, and item positions.
- `Kitchen-design-2D-layout.ps1` - PowerShell helper that checks the current React app files and copies the layout JSON for FreeCAD/SweetHome3D.
- `Run-Kitchen-React-App.bat` - Double-click launcher for the React app.
- `Run-Kitchen-design.bat` - Double-click launcher for the PowerShell generator.
- `freecad/generate_kitchen_rule9.py` - FreeCAD model generator.
- `freecad/kitchen_rule9.FCStd` - Generated FreeCAD 3D model.
- `freecad/exports/` - FreeCAD-generated plan SVG/DXF, OBJ export, and dimension summary.
- `Open-FreeCAD-3D.bat` - Opens the FreeCAD model.
- `Generate-FreeCAD-3D.bat` - Regenerates the FreeCAD model.
- `blender/render_kitchen.py` - Blender batch render script that imports the FreeCAD OBJ export.
- `Render-Blender-Kitchen.bat` - Runs Blender render automation when `blender.exe` is on PATH.
- `docs/3D_Render_Rule9_Current.webp` - Existing rendered concept image.
- `docs/react-3d-desktop.png` and `docs/react-3d-mobile.png` - Verification screenshots of the upgraded React 3D render.
- `docs/react-east-wall.png` and `docs/react-west-wall.png` - Verification screenshots of the current wall elevations.
- `docs/COOHOM_NATIVE_REBUILD_GUIDE.md` - archived Coohom import and native-cabinet rebuild guide.
- `docs/KITCHEN_APP_IMPLEMENTATION_PLAN.md` - Step-by-step implementation plan for future AI-assisted phases.
- `docs/MUSE_SPARK_DELEGATION_GUIDE.md` - Muse Spark CLI usage and supervision rules for this repo.
- `react-configurator/scripts/visual-qa.cjs` - Playwright screenshot smoke test for desktop/mobile views.

## Run The React App

Double-click:

```text
Run-Kitchen-React-App.bat
```

Or run manually:

```powershell
cd react-configurator
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

Then open:

```text
http://127.0.0.1:5173/
```

Run visual QA screenshots:

```powershell
cd react-configurator
npm run visual:qa
```

Screenshots are written to `react-configurator/tmp-visual-qa/`.

## React Features

- Top View: draggable plan view with wall labels, room dimensions, cabinet depths, walkway dimensions, below-window reference area, west door clear zone, and scale text.
- Front View: simplified front perspective.
- East Wall View: render-style wall elevation with handleless panels, warm LED, North `(N)` on the left, South `(S)` on the right, visible covered washing/dishwasher markers, and only a slim hidden chimney vent below the upper cabinet.
- West Wall View: render-style wall elevation with clear full-height door zone from y0 to y1220.
- North Elevation and South Elevation: cross-wall elevations with SVG/PNG/PDF export buttons.
- Grid snap: Off, 50 mm, or 100 mm.
- Validation Panel: detailed pass/fail rows for order, clear zones, walkway, collision, and bounds.
- Cabinet Modules: auto-filled 300/450/600/750/900 mm modules plus fillers, shown in plan/elevations.
- Materials & Finishes: editable colors/finishes stored in exported JSON.
- BOM / Quote: cabinet, shutter, drawer, handle, countertop, backsplash, appliance, CSV, and Markdown outputs.
- Save / Load / Versions: project JSON import/export, autosave, reset to Rule #9, and local Option A/B versions.
- Create 3D Render: interactive Three.js model shown at the top of the page when selected, with handleless cabinet fronts, reveal lines, warm LED strips/glow, PBR environment lighting, procedural wood/counter/floor materials, softer shadows/daylight, a 3-burner gas hob, clean-dish storage above the sink, improved appliances, camera presets, and a `Hide blocking walls/ceiling` live cutaway option. In cutaway mode, walls/ceiling stay hidden and the near-side cabinet run hides dynamically as you rotate.
- Cabinet module marking is interpreted from North to South in plan, elevations, and 3D.
- View buttons render the selected Top/Front/East/West/North/South/3D view directly under the toolbar, before validation, materials, BOM, and save/load panels.
- 3D Screenshot: downloads the current 3D canvas camera view as `kitchen-3d-render.png`.
- Export 2D SVG: downloads `kitchen-2d-plan-coohom-background.svg`.
- Export 2D PNG: downloads `kitchen-2d-plan-coohom-background.png`.
- Export 2D DXF: downloads `kitchen-2d-plan-coohom-background.dxf`.
- Coohom Guide: currently hidden/paused in the React toolbar.
- Export JSON: exports the current layout, validation, grid, dimensions, and shared layout model.
- Export Project Package: downloads a ZIP with layout JSON, 2D SVG/DXF, BOM CSV/Markdown, project summary PDF, validation JSON, and manifest. Coohom guide is excluded while Coohom is out of scope.

## Shared Layout Model

`react-configurator/src/config/kitchenConfig.js` exports the richer React-first model:

- `ROOM`, `OPENINGS`, `WALLS`, `CABINET_RUNS`, `APPLIANCES`, `VALIDATION_RULES`, `MATERIALS`, and `EXPORTS`.
- `LAYOUT_MODEL`, plus compatibility aliases `LAYOUT` and `layoutModel`.
- Legacy compatibility remains through `KITCHEN`, `EAST_INIT`, and `WEST_INIT`.

This model is intended to become the source data for later FreeCAD and Blender automation.

## Coohom Workflow Paused

Coohom is not part of the active workflow right now. The old reference docs remain in the repo in case that path is needed later.

The static guide is also available at:

```text
docs\COOHOM_NATIVE_REBUILD_GUIDE.md
coohom-export\coohom-native-rebuild-guide.md
```

## Browser API

Open the app and use the browser console:

```js
window.kitchenAPI.moveItemMM('east','applianceGarage',300)
window.kitchenAPI.moveItemMM('east','gas',2300)
window.kitchenAPI.moveItemMM('east','dishwasher',3546)
window.kitchenAPI.moveItemMM('west','sink',3146)
window.kitchenAPI.moveItemMM('west','waterpurifier',3746)
window.kitchenAPI.moveItem('east','washing',414.6)
window.kitchenAPI.set3DHideObstructions(true)
window.kitchenAPI.getLayout()
window.kitchenAPI.getLayoutModel()
window.kitchenAPI.validate()
window.kitchenAPI.getGrid()
window.kitchenAPI.setGrid(50) // 0, 50, or 100
window.kitchenAPI.getWalkway()
window.kitchenAPI.getDimensions()
```

## FreeCAD 3D

FreeCAD is expected at:

```text
C:\Users\anurdhar\Downloads\FreeCAD_1.1.3-Windows-x86_64-py311\FreeCAD_1.1.3-Windows-x86_64-py311
```

Generate the model:

```text
Generate-FreeCAD-3D.bat
```

Open the model:

```text
Open-FreeCAD-3D.bat
```

Generated model:

```text
freecad\kitchen_rule9.FCStd
```

Additional FreeCAD exports:

```text
freecad\exports\freecad-plan.svg
freecad\exports\freecad-plan.dxf
freecad\exports\freecad-dimensions.md
freecad\exports\kitchen_rule9.obj
freecad\freecad_validation.json
```

## Blender Renders

First run `Generate-FreeCAD-3D.bat` so `freecad\exports\kitchen_rule9.obj` exists. Then, if Blender is installed and `blender.exe` is on PATH, run:

```text
Render-Blender-Kitchen.bat
```

Rendered images are written to:

```text
blender\renders\
```

## Validation

Current validation checks:

- East order: gas before dishwasher before washing, with dishwasher directly adjacent to washing and the appliance garage allowed near the south door.
- West order: sink before purifier cabinet before shaft.
- Purifier cabinet remains contiguous between the sink and shaft.
- West door clear zone remains empty from y0 to y1220.
- The 300 mm north marker is only a below-window reference; counters and appliances may continue to the north wall outside normal bounds/collision rules.
- Walkway remains 1324 mm floor / 1004 mm eye.
- Cabinet/appliance collision checks include height ranges, so purifier above sink does not falsely fail.
- Movable items stay inside room bounds.

## Muse Spark Supervision

Muse Spark is available through WSL and can be used for heavy implementation work one phase at a time:

```powershell
wsl.exe -d Ubuntu -- /root/.local/bin/muse --version
```

Use the prompts in `docs/muse-phase-prompt.txt` and `docs/muse-phase2-prompt.txt` as examples. Codex should review every Muse diff, run `npm run build`, and do visual checks for UI changes before committing.
