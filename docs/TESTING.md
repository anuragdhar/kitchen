# Testing and reproducibility

Use Node 22 and npm, from `react-configurator/`. The committed npm lockfile is the
installation authority. No dependency versions are changed by this foundation update.

## Fast gate

```sh
npm test
npm ci
npm run check
```

`npm test` runs Node's test runner with explicit test-file paths (including on Windows) with no external packages.
`npm run check` runs that suite and `vite build`. CI executes the tests before
installing packages so a registry/install failure is not confused with a test failure.
The fast gate currently has no repository-wide lint or type-check stage; do not
claim those checks ran. Add them incrementally rather than reformatting all files.

Current-default tests preserve dimensions, item geometry, IDs, variant positions,
door clearances, nominal aisle calculations, shaft placement, and module lengths.
Synthetic negative tests verify invalid inputs produce failures rather than silently
passing. Baseline tests are intentionally changed only for an approved design change.

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

A passing browser validator is only as complete as the legacy app validator. In
particular the existing unconditional walkway pass is documented in CURRENT_STATE.md.

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
