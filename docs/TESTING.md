# Testing and reproducibility

Use Node 22 and npm, from `react-configurator/`. The committed npm lockfile is the
installation authority. The lockfile includes the previously omitted dxf-viewer dependency tree; existing locked package versions are preserved.

## Fast gate

```sh
npm test
npm ci
npm run check
```

`npm test` runs Node's test runner on every `tests/*.test.mjs` (Node expands the quoted glob itself, also on Windows)
plus the Windows launcher test in `../scripts/windows/`, with no external packages. A new test file is picked up without
editing `package.json`. `npm run check` runs that suite and `vite build`. Run these commands locally.
`.github/workflows/check.yml` also runs `npm ci` + `npm run check` (only) on
push/PR; it does not cover `test:browser`, `test:persistence`, `test:materials`,
`test:lighting`, `test:baked-lighting`, `visual:qa`, or the Python/Blender
checks below. The Windows render worker still runs the full check list,
including those, in an isolated local checkout before publishing render
evidence. The fast gate has no full linter or type-check stage; do not claim
those checks ran. The one lint-like check is dependency-free:
`scripts/check-imports.mjs` (`npm run lint` lists the problems;
`tests/check-imports.test.mjs` makes `npm test` fail on them) reports imported
names a file never uses and `.jsx` files with JSX that do not import React
(this project uses the classic JSX transform, so that fails only at run time).
It does not find undefined identifiers. Add further checks incrementally rather
than reformatting all files.

`npm test` now also runs `tests/archviz.test.mjs`, `tests/parallel-profiles.test.mjs`,
and `tests/whole-home-render.test.mjs` (previously only run as a separate
`archviz-tests` stage inside `scripts/render_worker.py`; that stage still runs
there too, so a render-worker run exercises them twice — harmless, and kept
for now so its per-stage evidence reporting is unchanged).

The Python tests under `blender/test_*.py` and `scripts/tests/test_*.py` can be
run directly with `python scripts/run_python_tests.py` from the repo root,
without going through `scripts/render_worker.py`. As of 2026-09-28,
`test_actual_room_registry_and_source_modes` in `blender/test_parallel_profiles.py`
fails against the current `configs/archviz-profiles.json`/room profiles: it
expects `rooms.bedroom3.native` to be set, while
`react-configurator/tests/archviz.test.mjs` asserts the opposite
(`p.rooms.bedroom3.native === undefined`). This predates this document's
edit and was not introduced by it; the two suites disagree and need a decision
about which is current before either is changed.

Current-default tests preserve dimensions, item geometry, IDs, variant positions,
door clearances, nominal aisle calculations, shaft placement, and module lengths.
Synthetic negative tests verify invalid inputs produce failures rather than silently
passing. Baseline tests are intentionally changed only for an approved design change.

## Local update control

The local update control can be checked on the whole-home page. It requires a
clean Git checkout before pulling, so a checkout with working changes should
display its refusal without modifying files. The isolated `local-update.test.mjs`
fixture checks a real fast-forward from a temporary local Git remote; it does
not need access to GitHub. `config.test.mjs` checks that the Codespaces preview
includes the same endpoint, and `local-update-plugin.test.mjs` checks forwarded
host and origin restrictions.

## Blender view inspection

For Blender whole-home view changes, inspect the exported GLB on desktop and
mobile, switch to the stills/tour and back to Editable 3D, and check browser
errors. A build confirms assets are bundled but does not verify camera framing.
For room view changes, inspect a large and a narrow room, switch to its render
and editable workspace, and verify the model displays the intended room.

`npm run test:baked-lighting` checks the baked Blender viewer against a running
server (default localhost:5173; override KITCHEN_APP_URL). Chrome is the default
browser channel; BROWSER_CHANNEL can override it. It covers desktop/mobile
viewports, orbit/zoom, lighting selection and room/whole-home tab switching.
Screenshots and results go to `test-results/baked-lighting`. See
INTERACTIVE_BLENDER_LIGHTING.md for the bake commands and recorded limitations.

## Browser inspection

Start the server in a separate terminal:

```sh
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Then:

```sh
npx playwright install chromium
npm run inspect -- --strict
npm run inspect -- --url http://127.0.0.1:5173 --screenshot tmp-inspection/kitchen.png
npm run visual:qa
```

Fresh browser contexts avoid reading or overwriting the user's saved browser data.
The helper opens the kitchen from the whole-home page before waiting for kitchenAPI.
Required inspection methods are getLayout, validate, and getDimensions. A missing
method, thrown API call, malformed required return value, runtime error, or malformed
validation row fails inspection. `--strict` also returns exit status 1 for reported
validation failures. Optional APIs are explicitly reported as unavailable.

The runtime validator checks every required row. A pass is not a door-swing,
appliance-service or construction-safety assessment. See CURRENT_STATE.md for scope.

## Screenshots are smoke evidence, not approved baselines

`visual:qa` captures desktop/mobile views and checks canvas pixel variation from
an actual canvas screenshot. A missing 2D context is no longer considered a pass.
The smoke check catches a missing/solid canvas, but pixel variation cannot establish
that the right geometry rendered. There are no approved image-comparison baselines
or explicit application scene-ready events yet. Manually review affected screenshots;
fixed delays and GPU-dependent rendering remain limitations until that follow-up.

## Historical test

`npm run test:bolt` is retained unchanged for historical investigation and is expected
to fail against current defaults. It describes a different east-wet-wall design.
It is no longer `npm test`; current defaults are protected by the replacement suite.
Do not delete its assertions or move appliances back to satisfy it.

## Definition of done

Record exact commands and results, including NOT RUN and the reason. For UI work,
record which affected views were reviewed. For design changes, document the geometric
diff and baseline update. A unit pass is not proof of a build, browser pass, export
round trip, FreeCAD/Blender execution, or construction suitability.

## Validation/export regression checks

`npm test` also covers overall-rule aggregation, non-neighbor and cross-wall 3D
collisions, fixed-object bounds/clearance, nominal aisle failures, and baseline/airy
variants with baseline/refined east cabinets. `npm run test:browser` starts its own
Vite server on loopback port 4175 unless KITCHEN_APP_URL is supplied. Install Chromium
first. It checks live API/panel/project agreement, SVG/DXF geometry and labels,
material-only geometry preservation, and API cleanup on room navigation. Browser
outputs go to test-results/correctness; screenshots are evidence, not approved baselines.

The read-only getPlanSvg(), getPlanDxf(), and getProjectData() browser API methods
call the same builders as the existing exports. Project saving/loading is now versioned; see PROJECT_FORMAT.md.

The correctness browser suite uses the actual application with `?kitchenView=top`.
This optional view preference leaves normal startup in 3D and never changes layout
or saved data. The suite verifies plan/API/export behavior, not WebGL performance.
Default headless 3D startup exceeded a 60-second API wait on the initial runner;
3D startup/performance and visual comparison remain separate follow-up work.

## Save/load regression checks

The Node suite covers v1 round trips, explicit v0 adapters, unknown versions,
finite dimensions, visibility/metadata, malformed late-stage modules, room mismatch,
size/depth limits, quota failures, backups, and observed cross-tab conflicts.
`npm run test:persistence` starts a loopback Vite server on port 4176 (or uses
KITCHEN_APP_URL) and exercises actual JSON upload/download, named versions, reload,
legacy migration, stale file reads, corrupt autosaves, and injected quota failures.
Browser contexts are isolated from user data; all runs use kitchenView=top and do
not establish 3D performance. Artifacts go to test-results/persistence/.

## Quick room screenshots and scan measuring (2026-10-04)

`node scripts/room-shots.cjs --room "Drawing Room" --views "Overview,Top" --out test-results/shots` (from
`react-configurator/`, against a running dev server; `--whole` for Whole home 3D, `--url` for another port) saves the 3D
canvas for each named view button and reports page errors. It asks Chrome for the GPU, which takes about 30-40 s per room
here; software WebGL took 5-10 minutes and sometimes hung (`--software` keeps that path). The output is smoke evidence
to look at, not an approved baseline.

`python scripts/scan_measure.py` (repo root; numpy and Pillow) measures a room from a phone scan: wall-aligned plans,
flat-surface positions, textured wall elevations and ceiling plans. Usage is in the file; a worked example and the
accuracy limits are in `docs/SITE_SCAN_2026-10-04.md`.
