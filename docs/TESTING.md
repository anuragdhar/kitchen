# Testing and reproducibility

Use Node 22 and npm, from `react-configurator/`. The committed npm lockfile is the
installation authority. The lockfile includes the previously omitted dxf-viewer dependency tree; existing locked package versions are preserved.

## Fast gate

```sh
npm test
npm ci
npm run check
```

`npm test` runs Node's test runner with explicit test-file paths (including on Windows) with no external packages.
`npm run check` runs that suite and `vite build`. Run these commands locally;
the repository has no GitHub-hosted test workflows. The Windows render worker
runs its checks in an isolated local checkout before publishing render evidence.
The fast gate currently has no repository-wide lint or type-check stage; do not
claim those checks ran. Add them incrementally rather than reformatting all files.

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
