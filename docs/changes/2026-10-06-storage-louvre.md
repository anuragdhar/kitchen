# Storage beside the fridge: full-height louvre cover

Owner, dictated 2026-10-06: "let's use louvre cover from ceiling to the floor, and hide space above the fridge also using this" and "we can slide it to gain access. It looks seamless from ceiling to floor."

The plain sliding cover is now warm timber vertical slats over an opaque dark board. A matching fixed panel hides the space above the fridge. Both share one slat pattern when closed. The existing Open/Close storage cover buttons still work in Storage and Whole home Editable 3D. Close the cover before opening the fridge doors: the parked leaf blocks their approach. The warning is now explicit on both pages.

## Before and after (millimetres)

Dimensions below use the Storage page frame: x east from the kitchen west edge, z south from its south edge, y up from floor level. Builders divide by 1000 to draw metres.

| Part | Before | After |
| --- | --- | --- |
| Scene ceiling | 2700 | 2700, unchanged; scanned heights not applied |
| Storage opening | z 1058-2150, width 1092, height 2600 | Unchanged |
| Slider | Config 1000 wide x 2200 high; z 1100-2100. Actual board y 12-2200, 28 thick | 1092 wide x 2635 high; z 1058-2150, y 15-2650; 38 thick including slats |
| Closed cover coverage | Missed 42 at the north end and 50 at the south end of the configured opening | Full opening width, plus full height except the proposed floor clearance |
| Slide travel | 1000 toward fridge | 1000, unchanged; parked z 58-1150 |
| Above fridge | Open | Fixed panel y 1840-2650, height 810; width 1013 over the fridge's 913 plus the existing 100 gap to storage |
| Fridge | 735 deep x 913 wide x 1790 high; front x 1400, z 45-958; faces west | Unchanged |
| Sliding track | 2000 long, y 2235-2280 | 2092 long, y 2655-2700; 65 deep x 45 high |
| Floor guide | None | Stationary 10 deep x 30 along the run x 20 high side guide |

The wider slider still travels only 1000, so the last 92 of the opening remains covered when open. The first rack starts at z 1173.4; the parked leaf ends at 1150, leaving 23.4 between them. Both existing rack fronts are exposed. The racks, their dimensions and all room openings stay as before. No saved-project state or stable IDs were changed; the existing cover-front mesh name and setCoverOpen API remain.

## Defaults chosen without asking: PROPOSALS

- Slats 30 wide x 20 deep at 45 pitch, on an 18 thick opaque dark backing. The existing warm wood colour is retained and slats carry the storage wood palette role. The backing stays dark when a palette changes.
- Floor clearance 15; ceiling clearance 50 for the 45-high top track (5 between leaf top and track bottom). These are planning clearances, not specified hardware.
- A 50 gap above the 1790-high fridge. **The fridge needs air; the manufacturer's installation clearances and airflow route have not been verified.** Slats on an opaque board do not themselves provide ventilation through the panel.
- The fixed panel extends across the existing 100 gap above fridge height to avoid a visible empty strip between the panels.
- The old backing front remains x 880. New slats project to x 860; backing ends at 898. The fixed slats start at x 908, its backing at 928, and its rear is 946. Thus the fixed face is recessed 48, leaving **10 clear behind the moving panel** throughout its travel. Solid full-height panels cannot occupy exactly the same depth plane and slide past one another. This small two-track step preserves the continuous frontal slat pattern, rather than claiming literal coplanarity.
- The slat grid starts at the fridge's north edge and continues across the joint; a slat crossing the joint is split between the leaves. The pattern aligns when closed, not while moving.
- Track 65 deep x 45 high, projecting 12 in front of the slat face; guide 10 x 30 x 20 alongside the backing. Handle dimensions remain 20 deep x 18 wide x 180 high, bottom 950, inset 85 from the leaf end; its x/z position follows the new leaf face/end.

Whole home has an existing coordinate mismatch: storage inherits the kitchen plan's width/length scale while the fridge body is drawn at its real width. Its new fixed panel converts the fridge span into that room frame. In that view it extends behind the closed slider where required, still with the 10 mm local passing gap. The racks and appliance retain their previous world positions and dimensions. This is a display-frame adaptation, not a different proposed cabinet. The standalone Storage page gives the undistorted dimensions above.

## Implementation and checks

Changed files:

- `react-configurator/src/config/kitchenConfig.js`: proposed sizes, clearances, hardware and finishes; owner quote.
- `react-configurator/src/domain/storeStorageLouvre.mjs`: pure panel rectangles, clipped slat positions, complete swept-volume separation, opening coverage, track/guide engagement and ventilation checks. No React, Three.js or DOM.
- `react-configurator/src/rooms/shared/StoreStorage.js`: shared builder, two InstancedMesh slat batches, dark boards, top track and floor guide. Existing racks unchanged.
- `react-configurator/src/StorageGallery3D.jsx`: description, clearance/ventilation warning and ceiling source.
- `react-configurator/src/WholeHome3D.jsx`: fridge span conversion and parked-cover warning.
- `react-configurator/tests/store-storage-louvre.test.mjs`: six tests, including negative fixtures, closed pitch alignment, moving/fixed separation, Whole home scaling, actual Three.js bounds and reversible cover movement.
- This owner note.

Node 22.23.3 from `C:\source\kitchen\tmp\node22\node-v22.23.3-win-x64` was prepended to PATH. Commands ran from `react-configurator/`; npm was invoked as `npm.cmd` in PowerShell.

| Command | Result |
| --- | --- |
| `npm test` (final run) | Exit 1: **478/485 passed, exactly seven expected Windows launcher failures**; no other failures, cancellations or skips. All six louvre tests passed. Log: `react-configurator/test-results/louvre/npm-test-final.log`. |
| `npm run lint` | Exit 0, `check-imports: no problems` |
| `npm run build` | Exit 0, 954 modules transformed; existing warning for chunks larger than 500 kB |
| `node scripts/work-plan-estimate.mjs --check` | Exit 1: `work-plan/plan.json` and `docs/WORK_PLAN_BUDGET.md` out of date after the cover size change. No files regenerated. |
| `node scripts/electrical-doc-sync.mjs --check` | Exit 0, rows up to date |
| `git diff --check` | Exit 0 |

The first full suite run had two additional transient failures: a Bedroom 1 `Array.find` TypeError and a room-review Node process crash (3221225477). Running those two files alone passed all 17 tests; the subsequent full rerun had only the seven Windows failures (477/484). After adding the Whole home conversion test, the final full suite had 478/485 as above. No unrelated source was changed to conceal those failures.

The work-plan estimator reads `slidingCover.widthMm` and `heightMm` in `src/home/workPlanEstimate.mjs` under `carp-kitchen-store`. It therefore sees the new 1092 x 2635 leaf instead of 1000 x 2200, causing the reported drift. It still prices an ordinary shallow cover and **does not price the added fixed panel, timber slats or revised hardware separately**. Budget ownership stays with the other owner this round; this is not a complete louvre quotation.

## Visual handoff and things not verified

No dev server or browser was started, as requested. Appearance, camera framing, browser interaction, palette appearance and screenshots remain **unverified**, despite the build and CPU geometry checks.

Supervisor views: **Storage beside the fridge**, **Front** and **Overview**, first closed, then **Open storage cover**, then **Close storage cover**. Use **Top** to inspect the stepped planes. In **Whole home 3D > Editable 3D**, use **3D overview**, orbit toward the fridge from the lobby (west), **Hide walls** if needed, and the same cover button. Check the full-height silhouette, upper-panel coverage and the seam both open and closed. Blender models/stills are unchanged.

Also not verified: on-site dimensions and level ceiling, slab/track fixings, panel weight or deflection, actual sliding hardware and guide engagement, fridge cooling/side/rear clearances, service access, door swing clearance beyond the existing close-before-opening warning, and fabrication tolerance at the split slat. No CAD/Blender regeneration or persistence browser suite was run.

## CURRENT_STATE entry for the other owner to append

2026-10-06 (owner): storage beside the fridge now has a floor-to-ceiling timber louvre slider and matching fixed upper fridge panel in Storage and Whole home Editable 3D. Proposed slats 30 x 20 at 45 pitch on dark backing; slider 1092 x 2635 (was 1000 x 2200), travel unchanged at 1000; 15 floor / 50 ceiling clearance and 50 above-fridge ventilation gap. Fixed face recessed 48 to give 10 passing clearance. Close cover before opening fridge doors. Appliance/rack positions and room openings unchanged. Geometry tests added; budget sync reports expected cover-size drift; visuals and manufacturer ventilation requirements not verified. See `docs/changes/2026-10-06-storage-louvre.md`.

## Questions for the owner / OPEN_ITEMS handoff

- Accept the proposed 30 x 20 slats at 45 pitch, dark backing and existing warm wood tone?
- Accept the 48 mm step between the moving and fixed faces, the upper 100 mm bridging strip, and the 92 mm strip still covered when parked (both racks remain accessible)?
- Have the joiner confirm final leaf size, top fixing/track capacity, floor guide, handle and floor/ceiling clearances after a site measurement.
- Confirm the LG GL-B257HDS3 installation instructions with the appliance installer, including whether this 50 mm top gap and the concealed upper cavity allow the required ventilation and service access.
- Have the work-plan owner add the fixed upper panel, slats and hardware to the estimate and regenerate their owned budget files.

Per this round's instructions, `docs/CURRENT_STATE.md`, `work-plan/OPEN_ITEMS.md` and `work-plan/plan.json` were not edited. No git add/commit or dependency installation was performed.
