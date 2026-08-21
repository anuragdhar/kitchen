# Diagnostic Folder

This folder is where code is — you (Muse) have full read rights.

- **Images:** `diagnostic-001.png`, `diagnostic-002.png`, ... — agnostic PNG screenshots from 3D render (canvas `toDataURL`)
- **Formation / view settings:** `diagnostic-001.json`, `diagnostic-002.json`, ... — paired JSON with:
  - `cameraPosition {x,y,z}`, `cameraTarget {x,y,z}`, `cameraFov/Aspect/Near/Far`
  - `viewport {innerWidth,innerHeight,devicePixelRatio,canvasWidth/Height,canvasStyleWidth/Height}`
  - `rendererSize`, `hide3DObstructions`, `east`/`west` snapshot, `validation`, `openedCabinets`, `timestamp`, `note`

**How it is filled:**
- In app 3D view click **Diagnostic Screenshot** — browser downloads `diagnostic-###.png` + `diagnostic-###.json` to your Downloads; move them here (or use **Export All JSON** in Diagnostic Folder panel which gives `diagnostic-folder.json` with all entries + images as data URLs).
- I (Muse) can read any `diagnostic/diagnostic-###.png` + `.json` you place here to see the unit and describe what is wrong, with exact viewport formation.

**Alternative agnostic:** Images are plain PNG, JSON is plain text — readable on any OS, no app needed. You can also keep them in `react-configurator/diagnostic/` (mirrored).
