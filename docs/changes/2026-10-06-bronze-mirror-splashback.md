# Bronze mirror behind the kitchen hob and sink — 2026-10-06

Owner, dictated 2026-10-06: **"Can we have bronze mirror splashback behind gas and sink."**

The editable Kitchen workspace now shows proposed bronze mirror finishes behind the moving gas hob and sink. The same calculated rectangles appear in the east/west wall drawings and the BOM / Quote panel, CSV and Markdown. This is a finish proposal, not an approved glass order.

## Before and after (millimetres)

Distances along the kitchen walls are measured northward from the south wall; heights are above the floor. These are the implemented defaults, not a site survey. Saved layouts can have different positions, and the panels follow those positions.

| Item | Before | After |
| --- | --- | --- |
| East hob | 700 wide, starts at 2400 | Unchanged |
| Finish behind hob | 102-deep slider body in front of patterned wall tile; no mirror | Proposed mirror on the existing slider face, 1000 wide × 426 high; along-wall 2250–3250, height 900–1326 |
| West sink | 762 wide, starts at 1210 | Unchanged |
| Finish behind sink | Patterned tile; no mirror | Proposed wall mirror, 1062 wide × 450 high; along-wall 1060–2122, height 900–1350 |
| East slider storage | 4746 long × 102 deep × 450 high, starts at height 900 | Unchanged, including tracks and the existing open-panel depiction |
| West slider storage | 552 long × 152 deep × 450 high, starts at 2572 / height 900 | Unchanged; trims the sink mirror if the sink is moved alongside it |
| Room and openings | Room 2324 × 4746 × 2700; west entry clear through 610 | Unchanged |

The default mirror finish totals 0.9039 m² (BOM displays 0.90 m²). The existing gross backsplash allowance remains unchanged. Mirror is identified as a finish within that allowance, not an additional tiled area; this is not a net tile take-off or a cost update.

## Defaults chosen without asking — all PROPOSALS / ASSUMPTIONS

- Enabled the feature by default, with **150 mm proposed margin on each side** of each appliance. Margins stop at the run boundaries or objects occupying the splashback zone, including the garage, west slider and shaft. Washing/dishwasher bodies below the counter do not trim the margin. Hidden/absent appliances get no mirror.
- **Proposed east slider-face treatment:** the slider already fills height 900–1350, and the upper cabinets start at 1350. There is no exposed wall height above the slider and below those cabinets. A wall-only mirror would therefore be concealed in the current model. The mirror is drawn flush on the existing slider face; there is no added storage depth or altered slider geometry. Existing rails/open-panel details remain in front. This does not settle the real sliding-leaf sizes, joints or hardware.
- The panel top uses the lowest overlapping overhead underside, capped by the tile zone. The current east hood vent starts at 1326 and the upper run at 1350; the sink uses 1350. A single rectangular top is proposed across each clear span, so the hob's side margins also stop at 1326. A lower moved overhead item trims the top further. Without an overhead limit the tile-zone top is the fallback (1500 in the current model).
- If a changed east slider covers only part of the panel, the finish is split between slider face and wall. The helper follows the slider's current width, depth and height. It does not rebuild the storage.
- Warm bronze `#b99470`, metalness 1, roughness 0.08, clearcoat 1, clearcoat roughness 0.04 and environment intensity 1 are **proposed appearance settings**, not measured glass properties. The finish uses the existing scene environment; it does not reflect live kitchen objects with a real-time mirror camera. A proposed depth-buffer bias of -1 / -1 makes the flush finish visible without adding physical thickness. The drawing label reuses an 11-pixel text size.
- Counter 900, upper underside 1350, hood underside 1326 and tile face depth 18 are recorded assumptions from the existing builder, shared through config without changing those dimensions. The feature has its own config and material entry; saved material IDs, appliance IDs, hidden flags and project format are unchanged.

## Practical cautions to confirm with the fabricator

These are the owner-requested cautions for advice and review, **not verified suitability findings for this kitchen**. Behind a gas hob, require the fabricator to confirm toughened, heat-rated glass and the complete mirror/coating system's suitability for the selected hob. Many fabricators advise against mirror directly behind burners. Confirm the appliance manufacturer's clearances as well as the glass specification. Grease and splash marks show strongly on mirror. Socket cut-outs must be made before toughening; agree their locations before ordering. No socket cut-outs or glass thickness have been designed here.

## Questions for the owner (for the other owner to transfer to OPEN_ITEMS)

1. Is mirror on the east slider face acceptable, subject to a fabricator confirming the leaves, joints, rails, heat exposure and cleaning access? A mirror on the wall above that slider has no visible height in the current arrangement.
2. Would you prefer **bronze mirror behind the sink only, with bronze back-painted toughened glass behind the hob**, subject to fabricator and hob-manufacturer approval?
3. Are the proposed 150 mm side margins and warm bronze shade acceptable? Confirm a physical sample and the final glass/edge specification before ordering.
4. Where will the sockets and other cut-outs be? These need agreement before toughening.

## Where the supervisor can inspect it

Open **Kitchen → Editable workspace**. Press **Create 3D Render**, then **East wall** for the hob or **West wall** for the sink (the **Sink** preset can also help). Keep the relevant cabinetry visible rather than cut away. There is no new mirror toggle; `KITCHEN_MIRROR_SPLASHBACK.enabled` controls the proposal.

For drawings, use **East Wall View + Cabinets** and **West Wall View + Cabinets**; their existing **Export SVG / PNG / PDF** buttons include the finish. Scroll to **BOM / Quote**, **Export BOM CSV** and **Export BOM Markdown** for the proposed panel sizes. Move the hob/sink in the plan or use **Try airy layout**, then inspect the corresponding panel again. The helper also tests hidden appliances and run-end clipping.

## Verification and limits

Node **22.23.3** was selected by prepending `C:\source\kitchen\tmp\node22\node-v22.23.3-win-x64` to PATH. PowerShell blocked `npm.ps1`, so the commands below used `npm.cmd` with the same npm scripts. No dependencies were installed.

| Check | Result |
| --- | --- |
| `npm.cmd test` — final full rerun | **482 passed / 489 tests; 7 failed**, exactly the seven known `Windows: ...` launcher fixtures. Exit 1; not an all-green test run. |
| First `npm.cmd test` | 476 passed / 484 reported tests; 8 failures: the same seven launcher fixtures plus a process crash in `tests/furniture-bounds.test.mjs`, exit 3221225477. That crash did not recur. |
| `node --test tests/furniture-bounds.test.mjs tests/mirror-splashback.test.mjs tests/kitchen-bom.test.mjs` | **20/20 passed**, including all ten new mirror tests. |
| `npm.cmd run lint` | **Passed**, `check-imports: no problems`. This is the repository's import check, not a full ESLint/type check. |
| `npm.cmd run build` | **Passed**, 955 modules transformed; existing warning for chunks larger than 500 kB. |
| `node scripts/work-plan-estimate.mjs --check` | **Passed**: 112 tasks; 105 estimated; 7 not estimated. No regeneration. |
| `node scripts/electrical-doc-sync.mjs --check` | **Passed**: rows up to date. No regeneration. |
| Node-only Three.js builder smoke | **Passed**: two panels, expected bounds, inward normals and physical material. No WebGL/browser involved. |
| `git diff --check` | **Passed**. |

The initial focused BOM check exposed its old fixed CSV row-count expectation; the fixture was updated for the requested two mirror rows and proposal note, then passed. Tests preserve the existing dimensions and add proposed finish fixtures rather than changing the room or appliance defaults.

**Not verified:** browser appearance, actual environment reflections, cutaway appearance, elevation label legibility and exported image/PDF appearance. No dev server or browser was started, as instructed; supervisor screenshots are still needed. Browser save/load regression was not run. Whole-home simplified kitchen, Blender/CAD renders, plan/DXF views, pricing and fabrication drawings were not extended. Heat suitability, real clearances, slider operation with glass, socket positions, fixings, tolerances, joints and site measurements remain unverified.

## CURRENT_STATE entry text for the other owner

Kitchen bronze mirror proposal (2026-10-06): the editable workspace derives bronze mirror finish panels from the current east gas and west sink items, with proposed 150 mm side margins clipped to the run and splash-zone neighbours. Default panels are 1000 × 426 mm on the unchanged east slider face and 1062 × 450 mm on the west wall, starting at counter height 900. Hidden/absent appliances have no panel. East/west elevations and BOM CSV/Markdown include the proposal. Config/material IDs and saved layouts remain compatible; no room, opening or appliance positions changed. Fabricator approval, the hob alternative and visual inspection remain outstanding; see `docs/changes/2026-10-06-bronze-mirror-splashback.md`.

## Files changed

- `react-configurator/src/config/kitchenConfig.js` — finish proposal and existing reference dimensions.
- `react-configurator/src/config/renderConfig.js` — dedicated bronze appearance.
- `react-configurator/src/domain/mirrorSplashback.mjs` — pure rectangle derivation.
- `react-configurator/src/rooms/kitchen/KitchenMirrorSplashback.js` — small Three.js finish builder.
- `react-configurator/src/App.jsx` — builder wiring, shared reference dimensions and BOM display.
- `react-configurator/src/kitchen/WallElevation.jsx` — proposed mirror rectangles in drawings.
- `react-configurator/src/kitchen/export/bom.mjs` — panel data and CSV/Markdown rows.
- `react-configurator/tests/mirror-splashback.test.mjs` — movement, clipping, overhead, visibility, slider and BOM tests.
- `react-configurator/tests/kitchen-bom.test.mjs` — room bounds and updated CSV fixture for the requested finish rows.
- This owner note. `CURRENT_STATE.md`, `OPEN_ITEMS.md` and `plan.json` were not edited; no commit or staging was performed.
