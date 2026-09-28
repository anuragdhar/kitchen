# Agent guide

## Project and entry points

This repository contains a home-design web application, room configurations,
reference assets, and CAD/rendering tools.

- Web application: `react-configurator/`.
- Application entry: `react-configurator/src/main.jsx` -> `HomeApp.jsx`.
- Kitchen configurator: `react-configurator/src/App.jsx` (not the whole-app entry).
- Implemented kitchen defaults: `react-configurator/src/config/kitchenConfig.js`,
  especially `KITCHEN`, `EAST_INIT`, `WEST_INIT`, and `AIRY_WEST_INIT`.
- Other room configurations: `react-configurator/src/config/`.
- Shared rendering: `src/config/renderConfig.js` and `src/render/materialFactory.js`
  within the web application.
- CAD generation: `freecad/`; offline rendering: `blender/`.

## Preserve design intent

For refactors and appearance-only tasks, preserve dimensions, openings, item
positions, stable IDs, hidden/active state, and saved-layout compatibility.
Do not treat an implemented dimension as an independently verified site measurement.

Prefer configuration changes for layout edits. Avoid duplicating physical
measurements in rendering code. Check the coordinate frame and dimension meanings
before editing: screen directions and physical directions are not interchangeable,
and legacy `w`/`d` fields are not always global X/Y extents.

README rules, historical tests, static exported models, and files named `Current`
can disagree with the implemented defaults. Read the relevant consumers, report
conflicts, and preserve existing behavior unless the task explicitly changes it.
Do not silently restore a historical design to make a test pass.

## Existing verification commands

Run from `react-configurator/`:

```sh
npm ci
npm run build
npm test
```

Record baseline results before changing code. `npm test` currently invokes
`scripts/validate-3d-bolt.mjs`, which contains historical-layout assertions.
A failing baseline is evidence to investigate, not permission to delete checks.

Browser tools include `scripts/headless-query.cjs` and `scripts/visual-qa.cjs`.
They require a running application and Playwright browser support. Ensure the
kitchen workspace is open before waiting for `window.kitchenAPI`; the initial
screen is the whole-home view. Saved screenshots alone are not visual regression
comparisons or proof of correct geometry.

## Change boundaries and completion

Keep changes small and reviewable. Extract pure domain functions before large
component refactors. Add behavioral tests instead of source-string assertions.

Do not overwrite reference drawings, authored models, or user layouts. Some images
under `Interior/` are runtime imports; do not classify a directory as disposable
without checking its consumers. Edit generators rather than only their outputs.

Work on a separate branch unless instructed otherwise. Do not force-push or merge
without authorization. Never commit credentials or dependency directories.

Report changed files, checks actually run and their outcomes, baseline failures,
and anything unverified. For layout changes, state the geometry differences; for
visual changes, inspect the affected views without claiming unperformed checks.
