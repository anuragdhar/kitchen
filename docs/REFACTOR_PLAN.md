# Refactor plan: reducing scatter

Written 2026-09-28 after a read-only survey of the repo. This is a plan document,
not a record of finished work; check off phases here as they land, and keep this
file and `docs/CURRENT_STATE.md` in sync with what is actually true.

Each phase below is its own commit (or small commit series) and must pass
`npm run check` (from `react-configurator/`) before moving to the next phase.
Per `AGENTS.md`, no phase changes geometry, stable IDs, saved-layout compatibility,
or deletes reference images/authored models/saved user layouts. Moves are `git mv`
so history is preserved; nothing is deleted unless it is genuinely unreferenced
scratch/junk (verified by grep across the repo before removal).

## Why this plan exists

The repo is scattered in three ways:
- **Placement:** code, tests and scripts each sit in 4-6 separate trees.
- **Size:** one 3,006-line kitchen component (`react-configurator/src/App.jsx`)
  holds most of the kitchen logic (state, exports, 3D rendering, panels).
- **Duplication:** the same concept (room list, plan scale, appliance lists,
  Node-lookup logic) is defined independently in multiple places, and some of
  those copies disagree (see `docs/CURRENT_STATE.md` "Known conflicts").

## Phase 0 — Startup fix and low-risk cleanup (done 2026-09-28)

- [x] `start-server.bat` falls back to the ignored `tmp/node22` Node copy (same
      one `PatchToApply/permanent-patch-runner.ps1` already uses) when Node is
      not on PATH, instead of failing immediately.
- [x] `react-configurator/package.json` declares `"engines": { "node": "22.x" }`
      matching the root `.nvmrc`.
- [x] `.gitignore` ignores `react-configurator/vite-*.log` (dev-server logs were
      untracked but not ignored before).
- [x] Removed genuine junk with no references anywhere in the repo: root
      `Testme`, `react-configurator/pnpm-workspace.yaml` (placeholder pnpm file
      in an npm project), `react-configurator/diagnose-codex.cjs` (untracked
      one-off script).
- [x] Moved (not deleted) one-off root tools into `tools/legacy/`:
      `moroccan-east-shaft.html`, `sink-3d-viewer.html`,
      `reference-galley-ideas.html`, `Kitchen-design-2D-layout.ps1`,
      `window-designer/`. Updated `scripts/windows/Run-Kitchen-design.bat`'s
      path to match.
- [x] Moved stale docs and old AI prompts into `docs/archive/` (matching the
      existing `docs/archive/README-rule9.md` convention): the August/September
      planning docs, `docs/references.md`, the `muse-*-prompt.txt` files, and
      `docs/rendering/*.md`.
- Deliberately **not** touched in this phase (needs a user decision, see Phase 5):
  duplicate images/DXF/JSON files, `react-configurator/output/` (55 committed
  screenshots), `render-review/` (committed render evidence). `AGENTS.md`
  forbids deleting reference images, authored models, or saved layouts, and
  some of the "duplicates" in `configs/` are user-saved layouts, not junk.

## Phase 1 — One place for tests and scripts

- Make `npm test` pick up `tests/*.test.mjs` automatically (glob or a manifest)
  instead of an explicit file list, so `archviz.test.mjs`,
  `parallel-profiles.test.mjs`, and `whole-home-render.test.mjs` stop being
  silently excluded.
- Rename/move the Playwright drivers (`scripts/*-browser.cjs`) into
  `tests/browser/*.cjs` so "tests" and "scripts" aren't mixed by convention.
- Move `blender/test_*.py` into `blender/tests/`.
- Add `npm run test:py` (wraps the existing `unittest discover` calls) and a
  GitHub Actions workflow that runs `npm run check` + `npm run test:py` on
  push/PR (`.github/workflows/` is currently empty).

## Phase 2 — Shared definitions instead of copies

- One room list (id, label, plan bounds, hotspot) in `src/home/rooms.mjs`;
  `HomeApp.jsx`, `homeRoomViews.js`, and `roomShellConfig.js` read from it
  instead of keeping their own.
- One `src/config/planGeometry.js` for the floor-plan pixel size and scale
  factors currently duplicated between `HomeApp.jsx` and `WholeHome3D.jsx`,
  with the screen/room/Three.js coordinate conversions written down explicitly
  (see `docs/ARCHITECTURE.md` "Coordinate contract").
- One shared Three.js viewer hook/module (renderer, camera, `OrbitControls`)
  used by the 8 components that currently each set one up independently.
- Add a fixture test before each consolidation, per `AGENTS.md`'s refactoring
  sequence: capture behavior first, then extract.

## Phase 3 — Folder structure for `src/`

Pure file moves, one room per commit, imports updated, no logic changes:

```
src/
  app/        HomeApp, main, navigation
  kitchen/    App.jsx split into its parts (Phase 4)
  rooms/      bedroom3/, lobby/, pooja/, study/, balcony/, drawing/, entry/
  viewer/     shared Three.js viewer + materials (from render/)
  home/       archviz, lighting, materials panels
  config/  domain/  persistence/  hooks/   (unchanged locations)
```

## Phase 4 — Split `App.jsx`

One piece per commit, each verified against the plan/elevation/3D views before
and after (a build is not sufficient per `AGENTS.md` "Completion"):

1. Exports to `kitchen/export/`: plan SVG, plan DXF, Coohom guide, BOM, project
   zip. Pure functions — easiest to give fixture tests to first.
2. Browser API + named-versions localStorage logic into hooks.
3. `WallElevation`, `NorthSouthElevation`, `ReferencesView` become their own
   components; replace the hard-coded `2324`/`4746`/`2700` literals (42
   occurrences of `2324` alone) with the `KITCHEN`/`EAST_INIT`/`WEST_INIT`
   constants from `kitchenConfig.js`, with a test asserting the values match.
4. `ThreeDRender` split into scene setup, envelope, cabinets/uppers, appliance
   meshes, and interaction (drag/measure/open-cabinet).
5. Top-plan SVG and side panels become their own components.

Target: `App.jsx` under ~400 lines, acting as composition only.

## Phase 5 — Needs a user decision before acting

Not started; each of these changes data, history, or removes committed evidence,
which `AGENTS.md` reserves for explicit user direction:

- Resolve the `APPLIANCES` / `CURRENT_APPLIANCES` / `LAYOUT_MODEL` disagreement
  documented in `docs/CURRENT_STATE.md`.
- Decide whether `react-configurator/output/` and `render-review/` (generated
  evidence) should stay tracked in git, move to release artifacts, or be pruned.
- Decide what to do with the byte-identical duplicate files (images, DXF,
  `configs/*.json`) — some `configs/` duplicates are user-saved layouts with
  intentional alternate names, not accidental copies.
- Merge/rationalize the three room-render entry points
  (`scripts/render_archviz_rooms.py`, `react-configurator/scripts/export-archviz-rooms.mjs`,
  `blender/render_archviz.py`).
