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

## Phase 1 — One place for tests and scripts (partly done 2026-09-28)

- [x] `npm test` now also runs `tests/archviz.test.mjs`,
      `tests/parallel-profiles.test.mjs`, and `tests/whole-home-render.test.mjs`
      (all pass, no external deps, ~65ms). They were previously only run as a
      separate `archviz-tests` stage inside `scripts/render_worker.py`; that
      stage is left in place (harmless duplicate run) rather than edited, since
      it also drives the committed render-evidence pipeline.
- [x] Added `.github/workflows/check.yml`: runs `npm ci` + `npm run check` on
      push/PR (`.github/workflows/` was empty). Deliberately does **not**
      attempt `test:browser`/`test:persistence`/`test:materials`/`test:lighting`/
      `test:baked-lighting`/`visual:qa` or the Python/Blender checks — those
      need a managed local server, Chromium and/or Blender that a hosted
      runner doesn't have configured here. Do not read a green run of this
      workflow as covering those checks.
- [x] Added `scripts/run_python_tests.py` so the `blender/test_*.py` and
      `scripts/tests/test_*.py` suites can be run directly (`python
      scripts/run_python_tests.py`) without going through
      `scripts/render_worker.py`. Running it surfaced a **pre-existing**
      disagreement (not introduced here, not fixed here): `blender/test_parallel_profiles.py`'s
      `test_actual_room_registry_and_source_modes` expects
      `rooms.bedroom3.native` to be set, while
      `react-configurator/tests/archviz.test.mjs` asserts the opposite. Needs
      a decision (Phase 5) about which is current.
- Deferred (real blast radius on live infrastructure, not done autonomously):
  - Renaming `react-configurator/scripts/*-browser.cjs` into a `tests/browser/`
    folder. These are referenced from `package.json` scripts *and* from
    `scripts/render_worker.py`'s stage list, which produces the render
    evidence used to gate merges (see recent `render-review/` commits). A
    cosmetic rename here is low value for the risk of breaking that pipeline
    without a full run on the actual render worker to confirm.
  - Moving `blender/test_*.py` into `blender/tests/`. Same reasoning: three
    docs and `render_worker.py`'s `unittest discover -s blender -p ...` calls
    reference the current flat location.
  - Both are still recommended, just as their own reviewed change with a real
    render-worker run to confirm, not bundled into this cleanup pass.

## Phase 2 — Shared definitions instead of copies (partly done 2026-09-28,
## partly corrected/deferred after closer inspection)

- [x] The floor-plan image is 800×875 px, and that pixel size was genuinely
      duplicated: named `PLAN_WIDTH`/`PLAN_HEIGHT` in `WholeHome3D.jsx`, and
      as the bare magic-number divisors `/8`/`/8.75` in `HomeApp.jsx`'s
      `planRect()`. Both now read `PLAN_IMAGE` from
      `src/config/entryConfig.js`. Numerically identical (800/100=8,
      875/100=8.75); confirmed with a Playwright screenshot of the whole-home
      page after the change — every hotspot still lands exactly on its room.
- **Correcting the original survey**: the plan-scale factors
  (`xMetresPerPixel`/`zMetresPerPixel`) were *not* actually duplicated between
  `HomeApp.jsx`/`WholeHome3D.jsx` as first reported — `ENTRY.planScale` in
  `entryConfig.js` was already the single source `WholeHome3D.jsx`,
  `EntryGallery3D.jsx`, `ArchivedBlenderHomeView.jsx`, and
  `WholeHomeRenderStudio.jsx` all import. No change was needed there.
- **Deferred, not a safe mechanical extraction**: unifying "the room list"
  across `HomeApp.jsx`'s `rooms` (navigation copy/color), `homeRoomViews.js`'s
  `HOME_ROOM_LAYOUTS`/`BLENDER_ROOM_VIEWS` (render bounds, baked-model camera
  framing), `roomShellConfig.js`'s `EMPTY_ROOM_SHELLS` (room-shell geometry,
  doors, furniture), and `home/rooms.mjs`'s `HOME_ROOMS` (inspiration/material/
  lighting tag order). On inspection these are not four copies of the same
  data: each carries different, purpose-specific fields, and some values
  genuinely differ between them on purpose (e.g. kitchen's hotspot color is
  `#b45309` in `HomeApp.jsx` vs `#dca56c` in `homeRoomViews.js` — a UI accent
  color vs. a render/plan tint, not a bug). Forcing these into one shape would
  be a real design decision with behavior risk, not a mechanical move; it
  needs its own reviewed change with visual verification per affected view,
  not a blind merge.
- One shared Three.js viewer hook/module (renderer, camera, `OrbitControls`)
  used by the 8 components that currently each set one up independently: not
  attempted yet. Same caution applies — needs a fixture/visual check per
  component, one at a time.

## Phase 3 — Folder structure for `src/` (partly done 2026-09-28)

Pure file moves, imports updated, no logic changes:

```
src/
  app/        HomeApp, main, navigation                          (not done)
  kitchen/    App.jsx split into its parts (Phase 4)               (not started)
  rooms/      bedroom3/, lobby/, pooja/, study/, drawing/, entry/,
              shared/ (cross-room factories)                       [x] done
  viewer/     shared Three.js viewer + materials (from render/)   (not done)
  home/       archviz, lighting, materials panels                 (already exists)
  config/  domain/  persistence/  hooks/   (unchanged locations)
```

- [x] Moved the ~21 flat room-part factory files (`Bedroom3*.js`, `Lobby*.js`,
      `Pooja*.js`, `DrawingLobbyPartition.js`, `DrawingRoomTelevision.js`,
      `EntryArrivalDoor.js`, `EntryRecessStorage.js`, `StudyFurniture.js`,
      `StudyTerrace.js`, `RoomAirConditioning.js`, `RoomTaskLighting.js`,
      `StoreStorage.js`) into `src/rooms/{bedroom3,lobby,pooja,drawing,entry,
      study,shared}/`, with import paths in the 6 importers
      (`App.jsx`, `EmptyRoomGallery.jsx`, `EntryGallery3D.jsx`,
      `StorageGallery3D.jsx`, `StudyRoom3D.jsx`, `WholeHome3D.jsx`) and the
      files' own relative imports of `render/`/`config/` fixed to match the
      new depth. `LobbyNorthStorage.js` (already-known dead code, no
      importers) moved as-is rather than deleted.
  - Verified: `npm test`/`npm run build` pass. Also visually verified with the
    dev server + Playwright screenshots (no console/page errors) across every
    consumer, both the "Editable workspace"/"Editable 3D" tab and the
    room-gallery selector for each affected room: Bedroom 1, Bedroom 3,
    Lobby/Dining, Drawing Room, Main entry, Study, Storage, Kitchen, and the
    whole-home 3D overview.
- `app/`, `viewer/`, and the `kitchen/` App.jsx split are not started — see
  Phase 4.

## Phase 4 — Split `App.jsx` (started 2026-09-28)

One piece per commit, each verified against the plan/elevation/3D views before
and after (a build is not sufficient per `AGENTS.md` "Completion"):

1. Exports to `kitchen/export/`: plan SVG, plan DXF, BOM, project zip. Pure
   functions — easiest to give fixture tests to first.
   - [x] `buildPlanSvg`/`svgY` moved to `src/kitchen/export/planSvg.mjs`,
     `buildPlanDxf` to `src/kitchen/export/planDxf.mjs`. Copied verbatim, then
     parameterized (closure variables became an explicit `ctx` argument) —
     App.jsx now holds a one-line wrapper that assembles `ctx` from its state
     and calls the pure function. **Not moved: the Coohom guide.** The user
     flagged it's "not used anymore" while this was in progress, and the code
     already agreed — its button was commented out in App.jsx with "hidden
     for now, code preserved" and the project-zip manifest already says
     "Coohom guide export is currently paused." Left as-is inline in App.jsx;
     removing it outright is a product decision for the user, not bundled
     into this refactor.
   - Verified three ways: (a) `npm run build` passes; (b) a live-browser
     snapshot of `kitchenAPI.getPlanSvg()`/`getPlanDxf()`/`getBOM()`/
     `getProjectData()` taken immediately before and after the change is
     **byte-identical**; (c) added `tests/kitchen-export.test.mjs` (7 cases)
     giving these two functions their first direct unit coverage — room/
     opening/run/appliance rendering, filler-module dashed outlines, grid
     on/off, and that SVG and DXF agree on which wall uses which depth.
   - [x] `buildBOM`/`buildBOMCsv`/`buildBOMMarkdown` moved to
     `src/kitchen/export/bom.mjs`, same verbatim-then-parameterize approach.
     `isCabinetLikeItem` and `planLabel` (both still App.jsx-local, the
     second used widely elsewhere in its JSX) are threaded through `ctx`
     rather than duplicated. App.jsx: 2892 -> 2844 lines. Verified the same
     three ways: build passes; a live-browser snapshot of `getBOM()`/the
     "Export BOM CSV"/"Export BOM Markdown" button downloads taken
     immediately before and after (via `git stash`) is byte-identical; added
     `tests/kitchen-bom.test.mjs` (4 cases) — module/drawer counts, the
     power-point exclusion from the appliance list, CSV quoting/row count,
     and that Markdown lists every module and appliance row.
   - `exportProjectPackage` (the project zip, which calls the now-extracted
     builders plus a generated PDF) not moved yet — it has real side effects
     (JSZip, dynamic `import('jspdf')`) rather than being a pure string
     builder, so it's a different, riskier kind of extraction than the four
     above. Left for its own pass.
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
