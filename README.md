# Home Interior

A design model of one flat (A501) for its renovation: a React and Three.js web app where each room has its own page
and a whole-home 3D view, plus tools that measure phone scans, check the design, and keep a work plan and budget.
The app starts at `react-configurator/src/main.jsx` -> `HomeApp.jsx`. The kitchen planner is `src/App.jsx`.

This README is written so that a new contributor, human or AI, can start work without prior knowledge of the project.

## Read these first

| Read | For |
| --- | --- |
| [AGENTS.md](AGENTS.md) | The rules: what must not change, required checks, how to report. It overrides habits. |
| [docs/CURRENT_STATE.md](docs/CURRENT_STATE.md) | What is implemented today, newest at the bottom, and known conflicts. |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Where to make a change, and the coordinate contracts. |
| [docs/TESTING.md](docs/TESTING.md) | Commands, and what a pass does and does not prove. |
| [docs/changes/](docs/changes/) | One dated note per piece of work, written for the owner: before/after, defaults chosen, what is not verified. |
| [work-plan/OPEN_ITEMS.md](work-plan/OPEN_ITEMS.md) | Every question still open with the owner (A measure, B find out, C decide, D people). |

**Do not treat a filename containing Current, or an old Rule #9 note, as proof of an approved design.** The previous
kitchen-focused README is kept in [docs/archive/README-rule9.md](docs/archive/README-rule9.md) for reference only.

## Run

**Windows: double-click `start-server.bat` in the repository root.** Install Node 22 with npm first. It installs locked
dependencies when needed, starts the app on loopback (port 5173 if free) and opens the browser.

On any platform, with Node 22 (`.nvmrc`) and npm:

```sh
cd react-configurator
npm ci
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Open `http://127.0.0.1:5173/` and choose a room. Keep the committed `package-lock.json`; do not switch package manager.

## Verify

From `react-configurator/`:

| Command | What it does |
| --- | --- |
| `npm test` | Node's built-in test runner, no third-party packages. About 430 tests. |
| `npm run build` | Production build. `npm run check` runs the tests and then the build. |
| `node scripts/room-shots.cjs --room "Drawing Room" --views "Overview,Top" --out test-results/shots` | Saves the 3D picture of each named view of a room page (about 35 s, uses the GPU). `--whole` for Whole home 3D, `--press "<button>"` to press a toggle first, `--url` for another port. Needs the dev server. |
| `node scripts/work-plan-estimate.mjs` then `--check` | Regenerates the budget figures in `work-plan/plan.json` and two generated docs. A test fails if they drift. |
| `node scripts/electrical-doc-sync.mjs` then `--check` | Refreshes the config-derived rows of `docs/ELECTRICAL_PLAN.md`. A test fails if they drift. |

Things to know before reading a result:

- **Seven failures are expected on this Windows machine:** the tests named `Windows: ...` from
  `scripts/windows/launchers.test.mjs`. Any other failure is real. Because of them `npm run check` stops before the
  build here, so run `npm run build` separately.
- `tests/balcony-desk.test.mjs` occasionally fails once when the machine is busy; re-run before investigating.
- A screenshot is evidence to look at, not an approved baseline. Open the PNG; "no page errors" is not the same as "looks right".
- `npm run test:bolt` is a historical check of an older kitchen design and is expected to fail. Do not make it pass.
- Browser suites (`test:browser`, `test:persistence`, `test:materials`, `test:lighting`, `visual:qa`, `inspect`) exist
  for the kitchen planner and the lighting and material overlays; see [docs/TESTING.md](docs/TESTING.md).

## How the code is organised

Paths are under `react-configurator/`. The pattern for every design element is the same:

```
src/config/<thing>Config.js     the numbers (millimetres), with comments saying who decided them and when
src/domain/<thing>.mjs          pure checks and geometry: no React, no Three.js, no DOM
src/rooms/<room>/<Thing>.js     the Three.js builder that draws it from the config
tests/<thing>.test.mjs          freezes the config values and exercises the checks
docs/...                        the explanation for the owner
```

Change the config first. Never copy a measurement into drawing code. If a test freezes a value you changed on purpose,
update the test and say why in it.

### Pages

| Page | File |
| --- | --- |
| Home page with the plan and room cards | `src/HomeApp.jsx` |
| Most room pages (Drawing Room, Lobby / Dining, Bedroom 1, Bedroom 3) | `src/EmptyRoomGallery.jsx` (one component, room chosen by key) |
| Kitchen planner (its own state, saving and exports) | `src/App.jsx` |
| Study (Bedroom 2), Home Office (its balcony), Main entry, Storage | `src/StudyRoom3D.jsx`, `src/BalconyOffice3D.jsx`, `src/EntryGallery3D.jsx`, `src/StorageGallery3D.jsx` |
| Whole home 3D | `src/WholeHome3D.jsx` |
| Work plan and budget, Palette | `src/WorkPlan.jsx`, `src/PaletteView.jsx` |

### Where each subject lives

| Subject | Config | Checks | Explained in |
| --- | --- | --- | --- |
| Room boxes, doors, windows, furniture | `src/config/roomShellConfig.js` (`EMPTY_ROOM_SHELLS`), `studyRoomConfig.js`, `balconyOfficeConfig.js`, `entryConfig.js` | `drawingRoomLayout.mjs`, `bedroom1Layout.mjs`, `balconyDesk.mjs`, `entryFittings.mjs`, `wallStorage.mjs`, `windowDesign.mjs` | `docs/DRAWING_ROOM_TV_WALL.md`, `docs/ENTRY_WALL_CAVITY.md`, notes in `docs/changes/` |
| Kitchen | `src/config/kitchenConfig.js` | `kitchenValidation.mjs`, `layoutChecks.mjs` | `docs/CURRENT_STATE.md`, `docs/PROJECT_FORMAT.md` |
| Track lighting, fans, ceiling mouldings | `src/config/*LightingConfig.js` | `drawingLighting.mjs` (`checkTrackLighting`) | `docs/LIGHTING.md` |
| Proposed electrical points | `drawingElectricalConfig.js`, `roomElectricalConfig.js` | `drawingElectrical.mjs`, `roomElectrical.mjs`, `roomElectricalModels.mjs` | `docs/ELECTRICAL_PLAN.md`, `docs/DRAWING_ROOM_ELECTRICAL.md` |
| Existing electrical points from scans | `existingElectricalConfig.js` | `existingElectrical.mjs` | `docs/SITE_SCAN_2026-10-04*.md` |
| Air conditioning | `acPlanConfig.js`, `acOutdoorUnitsConfig.js` | `acPlan.mjs`, `acOutdoorUnits.mjs` | `docs/AC_PLAN.md` |
| Colours and materials | `homePaletteConfig.js`, `renderConfig.js` | `src/home/palette.mjs` | `docs/PALETTE.md`, `docs/MATERIALS.md` |
| Work plan, order of work, budget | `work-plan/plan.json` | `src/home/workPlan.mjs`, `workPlanEstimate.mjs` | `docs/WORK_PLAN.md`, `docs/WORK_PLAN_BUDGET.md`, `docs/NEXT_STEPS.md` |
| Room positions on the plan | `src/config/homeRoomViews.js` | | `docs/ARCHITECTURE.md` |

## Units and frames: the usual source of mistakes

- **Millimetres everywhere in config.** Builders divide by 1000 for Three.js metres.
- **Room frame:** x from the room's west wall growing east, z from its north wall growing south, y up.
- **Plan frame:** pixels of the 800 x 875 plan image, which is drawn south-up. Plan x grows WEST and plan y grows NORTH.
  `ENTRY.planScale` gives metres per pixel. Marks the owner draws on the plan arrive in this frame.
- **Kitchen planner:** its own older frame (y from the SOUTH wall) and a scene in centimetres. See the header of
  `src/rooms/kitchen/KitchenTrackLights.js` before placing anything in it.
- **Bedroom 1** is fitted to its own walls on the plan, not to the bounds listed for it; the Home Office is drawn about
  15 % stretched. Use the conversion helpers (`planToRoomMm`, `roomToPlan`, the `roomPoint` function in
  `WholeHome3D.jsx`) and add a test, never a hand-computed offset.

## What is real and what is not

Every number is one of four kinds, and comments in the config say which:

1. **From the builder's plan** (A501). Scaled from a drawing, not measured.
2. **From a phone scan** (`docs/SITE_SCAN_*.md`). Good to about 1-2 %: room sizes +/- 30-50 mm, small items +/- 20 mm.
   Scans read ceilings about 40 mm high, so scanned room boxes and ceiling heights are recorded but NOT applied.
3. **Decided by the owner**, with a date in the comment. Do not change these without being asked.
4. **A proposal or an assumption** (words like `proposal`, `assumed`, `not decided`, `status:`). Keep them marked as such;
   do not present them as decided, and do not let a default quietly become a decision.

Some positions are **planned, not existing**: for example the door from the Lobby into Bedroom 1 is where civil work
will put it, not where it is today. Do not overwrite a planned position with a scan measurement.

## Doing a piece of work

1. Read the rows of the tables above for your subject, and the latest notes in `docs/changes/` that touch it.
2. Change config, then the pure check, then the builder. Keep dimensions, stable IDs and saved-layout compatibility for
   anything you were not asked to change.
3. Add or update tests. Run `npm test`, `npm run build`, and the two `--check` generators if you touched cabinet sizes,
   track lengths or electrical points.
4. Look at every affected page with `room-shots.cjs`, including Whole home 3D when a shared builder changed. One render
   error blanks a whole page, and several pages share one component.
5. Write a dated note in `docs/changes/` in plain language for the owner (who is not a programmer): what changed with
   before and after figures, what you chose without asking, what you did not verify. Add a short entry to the end of
   `docs/CURRENT_STATE.md`, and put any new question for the owner in `work-plan/OPEN_ITEMS.md`.
6. Report honestly: failed, skipped and unverified checks are named as such.

### Measuring a phone scan

The owner scans rooms with Scaniverse and exports `.glb` files (kept in Downloads, not in the repository).
`python scripts/scan_measure.py` (numpy and Pillow) turns one into wall-aligned plans, flat-surface positions, wall
elevations and ceiling plans; usage is in the file and a worked example in `docs/SITE_SCAN_2026-10-04.md`. Before
measuring, open the plan image and confirm it is the room you think it is, and use a scratch folder of your own.

### Working in parallel

Several agents can work at once if each has its own git worktree, its own dev-server port, and files that do not
overlap. What has gone wrong before, and the rule that prevents it:

- Two agents shared a scratch folder and one measured the other's scan: **name scratch folders after your branch.**
- Two sessions edited the same working tree and a file was lost: **never work in a tree someone else is editing.**
- Every agent adding a test edits the single `test` line of `package.json`: **expect that conflict; keep both sides.**
- One agent should own `work-plan/plan.json` and `OPEN_ITEMS.md` in a round; the others list what they want added.
- In a worktree, link `react-configurator/node_modules` to the main checkout's as a junction, and remove only the link
  afterwards. Do not run `npm ci` there and do not delete through the link.

## Other tools in the repository

`blender/`, `freecad/`, `scripts/` (render worker, archviz export) and `configs/` hold rendering and CAD tools. The
Blender models and stills are snapshots of earlier designs and are not regenerated by app changes; the live "Editable"
views are always the current design. Generated exports are not a source of geometry. Do not delete reference images,
authored models or saved layouts: some files under `Interior/` are imported by the app.

## Limits

This is a planning model. Nothing here is a structural, electrical or installation design; the electrical, AC and budget
documents say so and list what a licensed electrician, an AC installer, a structural engineer or a quote must confirm.
