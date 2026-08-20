# Kitchen Galley Layout

Current layout: Rule #9 locked galley kitchen, 2324 mm wide x 4746 mm long x 2700 mm high.

## Current Rules

- East wall, 600 mm deep: spice slider near gas, gas cooktop in the middle with compact hidden chimney, dishwasher north of gas, washing machine last near the north window.
- East wall elevation is shown with North `(N)` on the left and South `(S)` on the right.
- West wall, 400 mm deep after the door zone: South 0 to y1220 is a full-height clear door zone with no counter, no upper cabinet, and no LED strip.
- West wall after y1220: microwave, food processor, purifier near sink, sink almost touching shaft, then shaft last at the north-west end.
- North clear zone: 300 mm at the north end with no counter.
- Window: north wall, 1100 mm wide x 1800 mm high, sill 900 mm.
- Door: south side, 1100 mm wide.

## Main Files

- `react-configurator/` - React configurator app.
- `react-configurator/src/App.jsx` - Top, front, east wall, west wall, and interactive 3D views.
- `react-configurator/src/config/kitchenConfig.js` - Current kitchen dimensions and item positions.
- `Kitchen-design-2D-layout.ps1` - PowerShell helper that checks the current React app files and copies the layout JSON for FreeCAD/SweetHome3D.
- `Run-Kitchen-React-App.bat` - Double-click launcher for the React app.
- `Run-Kitchen-design.bat` - Double-click launcher for the PowerShell generator.
- `freecad/generate_kitchen_rule9.py` - FreeCAD model generator.
- `freecad/kitchen_rule9.FCStd` - Generated FreeCAD 3D model.
- `Open-FreeCAD-3D.bat` - Opens the FreeCAD model.
- `Generate-FreeCAD-3D.bat` - Regenerates the FreeCAD model.
- `docs/3D_Render_Rule9_Current.webp` - Existing rendered concept image.
- `docs/react-3d-desktop.png` and `docs/react-3d-mobile.png` - Verification screenshots of the React 3D view.
- `docs/react-east-wall.png` and `docs/react-west-wall.png` - Verification screenshots of the current wall elevations.

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

## React Features

- Top View: draggable plan view.
- Front View: simplified front perspective.
- East Wall View: elevation with North `(N)` on the left and South `(S)` on the right.
- West Wall View: elevation with clear full-height door zone from y0 to y1220.
- Create 3D Render: interactive Three.js model.
- 3D Screenshot: downloads the current 3D canvas camera view as `kitchen-3d-render.png`.
- Export JSON: exports the current layout.

## Browser API

Open the app and use the browser console:

```js
window.kitchenAPI.moveItem('west','sink',3550)
window.kitchenAPI.moveItem('east','washing',3800)
window.kitchenAPI.moveItem('west','waterpurifier',3350)
window.kitchenAPI.getLayout()
window.kitchenAPI.validate()
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

## Validation

Current validation checks:

- East order: gas before dishwasher before washing.
- West order: microwave before food processor before purifier before sink before shaft.
- Purifier remains near the sink.
- Shaft remains last at the north-west end.
