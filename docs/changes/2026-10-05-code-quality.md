# Code quality pass (2026-10-05)

Plain-language note for the owner. This was a tidy-up of the code, not a design change: no size, position, opening,
colour or saved layout changed, and every page draws what it drew before. One real bug was found and fixed (below).

## What was changed, and why it lowers risk

1. **No more Node warning on every run.** Each test and script run printed 35 "Module type of file ... is not specified"
   warnings and re-read every config file twice. `react-configurator/package.json` now says `"type": "module"`, which is
   what every `.js` file in the app already is. Scripts ending `.cjs` (the browser checks) are unaffected.
2. **New test files run automatically.** `npm test` used to be one 2,000-character line listing 56 files by name; every
   new test had to edit it (so parallel work kept colliding there), and a file left off the list silently never ran. It
   now runs every `tests/*.test.mjs`, plus the Windows launcher test as before.
3. **A small import check (`npm run lint`).** The repo has no linter and must not add packages. A short script now
   reports imports a file never uses, and `.jsx` files that would fail with "React is not defined" (a mistake that once
   blanked a page). `npm test` fails if either appears. It found four unused imports, now removed.
4. **Numbers taken from the config instead of copied.** The Drawing Room electrical check kept its own copy of where
   the AC unit hangs; it now asks the AC plan, so moving the AC moves the check too. The folding partition used a typed
   305 mm for the beam drop; it now reads the beam from the room config. Today's values are identical.
5. **One label maker instead of five copies.** The dark labels in the Drawing Room layouts and on the whole-home cavity
   overlay were drawn by five copies of the same code; now one (`rooms/shared/LabelSprite.js`).
6. **Smaller page files, with the logic tested.** Pieces moved out of the two largest 3D pages, unchanged:
   - Whole home 3D: the entry wall cavity overlay (`rooms/entry/EntryWallCavity.js`) and the reading of the saved
     kitchen with its cabinet runs (`kitchen/wholeHomeKitchen.mjs`, now with tests). `WholeHome3D.jsx` 1,008 -> 958 lines.
   - The four room pages: the list of door, window and passage openings in each wall (`domain/roomOpenings.mjs`, with
     tests). `EmptyRoomGallery.jsx` 638 -> 618 lines.
7. **Names and comments.** The light-dimmer sliders are used by every room, so `DrawingLightDimmer` became
   `rooms/shared/RoomLightDimmer.jsx` (the old file name still works). A Bedroom 1 comment still said the AC hangs on the
   west wall; it now says the window AC in the balcony cools the room. The repeated wall-face offset in Whole home 3D is a
   named constant.

## Bug found and fixed

**Whole home 3D did not show your kitchen edits.** Since saving became versioned, the kitchen page saves under a new
name (`...:schema-1`), but the whole-home model kept reading the old one, so it showed the default kitchen (or an old
save). It now reads the current save first and the old one only if there is no new one. It only reads; nothing is
rewritten. A test saves a kitchen the way the kitchen page does and checks the whole home reads it.

## Deliberately left alone

- **The shoe rack is drawn twice and the two copies differ** (Main entry page vs Whole home 3D: handle size, position
  and colour, door thickness, wood roughness). Merging them would change one page's look, so it needs your choice of
  which version is right.
- **Bedroom 1 furniture in Whole home 3D** is drawn from the room config directly, not from the Bedroom 1 layout you
  pick on the room page, so the whole home does not follow a layout change. Changing that changes the drawing.
- **The Bedroom 1 wardrobes** (north-east recess, balcony Pooja-wall unit) are the same code in both pages. They were not
  merged, because clicking a cabinet to measure it could then report the whole unit instead of one door.
- **Electrical plan wording** for the Study ("the AC indoor unit is not in the model") is out of date: Whole home 3D now
  draws the planned Study unit. That text feeds `docs/ELECTRICAL_PLAN.md`, so it was not touched here.
- Material colours, lighting, shadows and the renderer set-up belong to the parallel render work and were not touched.

## Files that look unused

- `react-configurator/src/rooms/lobby/LobbyNorthStorage.js`: nothing imports it (already noted in REFACTOR_PLAN.md).
- `react-configurator/src/rooms/drawing/DrawingLightDimmer.jsx`: now only points to the renamed file; it can go once no
  other branch imports the old name.

## How sameness was checked

- Every moved piece of logic was run side by side with the old code in a scratch script: the saved-kitchen runs on the
  defaults and three saved projects, the wall openings on all 20 walls of the room configs. Identical results.
- Screenshots (same camera, default lighting) of Drawing Room, Lobby / Dining, Bedroom 1, Bedroom 3, Study, Balcony
  office, Main entry (Overview and Top), the Kitchen 3D render, Whole home 3D, its Top view with and without the entry
  cavity, and all five Drawing Room seating layouts, before and after. Two runs of the unchanged code already differ by
  0.4-4.2 % of pixels (soft lighting and shadow edges); after the changes each view differs from the "before" run by the
  same amount (largest gap 0.13 points), the Kitchen render by 0.00 %. Difference maps showed every changed pixel on
  shadow and light edges, none on labels, cabinets, walls or openings. No page errors.
- The dimmer sliders appear on all six pages that use them.
- `npm test`: 448 tests, 441 pass; the 7 failures are the known "Windows: ..." launcher tests (433 tests and the same 7
  failures before; 15 tests are new). `npm run build`, `node scripts/work-plan-estimate.mjs --check`,
  `node scripts/electrical-doc-sync.mjs --check` and `npm run lint` pass.

## Not verified

- The browser suites (`test:browser`, `test:persistence`, `test:materials`, `test:lighting`, `test:baked-lighting`,
  `visual:qa`) and the Python/Blender checks were not run.
- The whole-home bug fix was checked by a test, by confirming in a browser which name the kitchen saves under, and by a
  Whole home 3D screenshot with a planted new-style save (shortened base runs show up). A kitchen edited by hand on the
  kitchen page and then viewed in Whole home 3D was not tried.
- Screenshots are evidence to look at, not approved baselines; views other than those listed (for example the evening
  lighting mode or the review sheet) were not captured.
