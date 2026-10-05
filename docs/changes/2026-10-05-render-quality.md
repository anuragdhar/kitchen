# Better-looking live 3D views (2026-10-05)

This changes how the live "Editable" 3D views are lit and drawn. Nothing was moved, resized or re-coloured: no dimension,
position, opening or saved layout changed. The Blender stills and baked models are snapshots of older designs and were
not touched.

## What looks different

- **One look for every room.** Each page used to set up its own renderer, with its own exposure, shadow type and light
  strengths, so the rooms looked like different apps. They now share one setup (`src/render/liveView.js`) and one
  daylight rig (`src/render/lightRig.js`).
- **Walls are no longer washed out.** The ivory walls used to clip to flat white. The light is rebalanced (more sun,
  less flat fill), so walls facing away from the sun step down in tone and the rooms read as three-dimensional.
- **Furniture sits on the floor.** At Standard and High quality, furniture and cabinets cast soft sun shadows, and the
  shadow map is fitted to the room so it is sharp enough to show (it used to be a small map spread over a fixed 10 m
  square). Ceiling fittings such as fans and tracks do not cast, because the rooms are drawn without a ceiling and the
  overhead sun would otherwise print fan blades on the floor.
- **Lamp colour is real.** A lamp's colour temperature now reaches the renderer with one white balance, so neutral
  light reads neutral and warm light warm. The kitchen and the bedrooms have lost most of their orange cast.
- **Smoother edges** on the views that use the "Designer render" pass, and wood surfaces have a light lacquer sheen.

Room by room, comparing the same view before and after: the Kitchen, Bedroom 1, Bedroom 3 and the Study show the
clearest difference (less orange, visible shadows, wall tones). The Drawing Room and Lobby are a little less bright with
slightly more shape. The Home Office and Main entry look almost the same as before. Whole home 3D is slightly cooler in
tone and otherwise the same.

## New controls

- **Quality: Auto / Draft / Standard / High**, on each 3D view, remembered across reloads. Auto picks a level from the
  graphics card the browser reports; this machine's graphics card gets High. Draft turns the furniture shadows off and
  lowers resolution for weak hardware.
- **Save picture** on each 3D view saves the current view as an image.
- The kitchen 3D view now also has the **Designer render** switch the other rooms have.

## Checked

- Full test suite: 445 of 452 pass; the 7 failures are the known Windows launcher tests. Build and the import check pass.
- Every page was captured before (main) and after at the same view and compared by eye; no page errors.
- Light controls driven in the browser on the Drawing Room, Kitchen and Bedroom 3. Mean picture brightness (0-255):

  | View | As opened | All off + Dark room | Planned level + Dark room |
  | --- | --- | --- | --- |
  | Drawing Room | 218 (was 225) | 15 (was 15) | 25 (was 24) |
  | Kitchen | 186 (was 196) | 10 (was 10) | 26 (was 24) |
  | Bedroom 3 | 224 (was 231) | 16 (was 15) | 29 (was 28) |

  So "All off" with "Dark room" is still nearly black, and the dimmers still work. "Designer render" on/off still works.
- Frame rate, measured in a headless browser: room pages 75 frames per second before and after; Whole home 3D 27
  before and after. The whole-home figure is below the 30 aimed for, but this change did not lower it.

## Not verified

- The agent doing this work was cut off twice before writing its own report, so its notes on what it tried and dropped
  are lost. The lead finished the merge and ran the checks above.
- The Evening mode, the palette preview, click-for-dimensions and the review-sheet capture were not driven after the
  change. The Quality switch and Save picture were not clicked; they are present on the pages.
- The browser suites `npm run test:materials`, `test:lighting` and `test:baked-lighting` were not run.
- The cleanup agent's report that the baked "Blender model" view for Bedroom 3 and the Drawing Room can no longer be
  reached was not investigated.
- Draft and Standard quality were not looked at; only the automatic level on this machine.
