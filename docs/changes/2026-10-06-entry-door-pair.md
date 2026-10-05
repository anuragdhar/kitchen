# Entry: open landing access and proposed paired arrival doors — 2026-10-06

Owner's dictated correction, 2026-10-06:

> In the entry we need to make a correction. Right now in the north-west corner we show a steel door. Where this steel door is, it's just an opening; we are not allowed to put a door there. So let's move this door inside, where the current wooden door is. That would fix the issue.

The landing opening now has no door, frame, grille or lock. Its existing wall edges and lintel remain. “A door is not
allowed there” is recorded as the owner's statement; the reason may be a society/common-area restriction, but that reason
has not been confirmed. The steel door is now at the arrival opening, beside the retained wooden door.

The **two-door arrangement is a proposal**, not an owner decision. It clears the modelled obstacles only with a reversed,
limited wooden swing and narrower leaves. Its conservative passage allowance is only about **508 mm**, so this is a
reviewable drawing, not a satisfactory access/fabrication approval. Replacing the wooden door with the steel door is an
alternative for the owner to decide, not the implemented default.

## Before and after

All dimensions are millimetres, scaled from the existing drawing rather than measured on site. Plan x grows WEST and
plan y grows NORTH. Plan differences are multiplied by ENTRY.planScale and 1000 for millimetres; builders divide by 1000
for metres. Door offsets below are relative to the arrival wall, positive toward the corridor/west.

| Item | Before | After |
| --- | --- | --- |
| Landing opening | Plan x688, y822–867; about 905 × 2200, containing steel door | Same opening and wall edges, completely door-free |
| Arrival opening | Plan x575, y810–874; about 1287 × 2200, wooden door | Same opening, proposed steel outside/wood inside |
| Steel leaf | 815 wide × 2145 high × 40 thick, at landing | 1127 × 2145 × 40, at arrival, centre plane +100 |
| Wooden leaf | About 1197 wide × 2130 high × 45 thick, centre plane 0 | 1127 × 2130 × 45, centre plane −60; about 70 narrower |
| Steel swing | North hinge, west onto landing; drawn closed | North hinge, west into corridor, proposed stop 85° |
| Wooden swing | North hinge, west into corridor, shown at 80° | Same hinge side, **reversed east into gallery**, proposed stop 60° |
| Jamb allowance | Steel 45 each; wood leaf 45 in from each opening end | 45 + proposed 35 packing each = 80; width follows arrival opening |
| Key tray/hooks | x575 +45 mm, plan y830, floating in the opening | x575 −65 mm, plan y795, on solid gallery-side shaft wall |

The steel material, brushed finish, bar pitch, insect mesh, kick plate, lock rail, panels, floor gap and mechanical lock
are retained. The nominal steel frame specification remains 45 mm; the additional 35 mm at each jamb is a proposed packed
reveal, shown as part of the jamb assembly. The key tray/hook sizes and heights stay. The fold seat's existing 340 deep ×
360 wide seat at 460 high was moved into config unchanged so the drawing and clearance check read the same sizes.
Room dimensions, wall lines, openings, shoe rack, AC bay, east cabinet, lights and appliance positions stay unchanged.

## Why these swings, and what the checks mean

The steel leaf stays on the corridor face and swings outward. Keeping the old outward wooden swing would make the two
leaves swing through the same space, so the wooden leaf changes direction. Retaining its north hinge avoids moving the
hinges to the other jamb and keeps the south latch/switch side. A south wooden hinge also clears the model at the limited
stop, but requires those extra changes; it does not solve the narrow gallery.

A 90° wooden swing strikes the gallery east wall. A 90° steel swing brings its handle into the corridor north wall.
The old full-width wooden leaf with the proposed new faces also fails the wall check. The proposed packing, 160 mm leaf
centre-plane separation and stops avoid those clashes. Reusing/trimming the wooden door by about 70 mm needs a carpenter's
assessment; its construction and stile widths are not known. Frame fixing, rebates, hinges and stops are not detailed.

`checkEntryDoorPair` is pure JavaScript with no React, Three.js or DOM. It checks the whole arc from closed to each stop
in 0.5° steps, with an additional radius-based allowance covering the space between samples. It includes leaf thickness,
handle envelopes, walls, closed shoe-rack fronts and pulls, the proposed AC bay/service front, deployed fold seat, closed
east cabinet, relocated keys, switches, bell and future lock conduit. The proposed minimum obstacle margin is 10 mm.
Opposing sweep envelopes provide at least 40 mm separation between the two leaves/handles, even when operated independently.

Conservative minimum separations over those arcs, rounded down, after the sampling allowance:

| Obstacle | Steel | Wood |
| --- | ---: | ---: |
| Corridor north wall | 12 | 12 |
| Corridor south wall | 32 | 32 |
| Landing wall | 898 | 2118 |
| Gallery east wall | 1148 | 57 |
| Shoe rack / proposed closed AC service front | 228 | 42 |
| Deployed fold seat | 851 | 137 |
| Closed east cabinet | 838 | 838 |
| Corridor switch EN-1 | 26 | 291 |
| Bell EN-2 / conduit EN-7 | 75 | 491 |
| Gallery switch EN-3 | 174 | 174 |

These are model-space separation bounds, not surveyed installation gaps. The 508 mm passage figure conservatively
projects the wooden leaf and handles at its stop; it is not an accessible or comfortable passage certification. A 700 mm
comparison used to raise the warning is an explicit planning assumption, not a building-rule claim. Open rack/cabinet/service
doors, a seated person, people passing, carrying furniture, and emergency use are not validated.

## Electrical and budget handoff

The existing electrical IDs stay. These locations are PROPOSALS dated 2026-10-06:

- EN-1 corridor switch moves from 250 mm in from the landing wall to 350 mm west of the arrival wall, on the corridor's
  south wall. Its Main entry page x changes from about 3072 to 1502. Height remains 1200.
- EN-2 bell and optional EN-7 door-phone/future-lock conduit move from the landing wall to the same corridor south wall,
  550 mm west of the arrival wall (page x1702). Heights remain 1100 and 1500. Their old landing-wall position was page
  x3322, z2031; their new wall-line z is about 1910. EN-3 remains on the gallery shaft wall, 150 mm south of the arrival jamb.
- The mechanical lock moves with the steel leaf; no powered lock was added. A future powered connection must terminate
  at the arrival frame, not the now-empty landing opening. The existing Drawing Room chime stays.

The electrical sync script updated EN-1, EN-2 and EN-7 location rows in ELECTRICAL_PLAN.md; explanatory text was also corrected.
The work-plan estimator is intentionally untouched: `src/home/workPlanEstimate.mjs` still prices `main-gate` from
`ENTRY.outerEntryOpening`, **905 × 2200**, rather than the new arrival opening **1287 × 2200** (about 42% greater nominal area).
Its current quote basis is therefore wrong for this proposal. The work-plan owner must update the source quantity and
regenerate the budget after the door arrangement is decided; wooden joinery changes also need pricing.

## Security: the new locked line

The corridor between the landing opening and the paired arrival doors is now outside the locked line. Anyone on the
landing can enter it and reach whatever is stored there. In the current drawing this zone is plan x575–688, y810–874:
it contains the corridor light switch/socket EN-1, bell EN-2, optional conduit EN-7, ceiling panels E1/E2 and the proposed
PVC ceiling, bounded by the shaft wall. It has no modelled storage cabinet. Do not leave keys or valuables in that zone.

**There is a discrepancy with the requested security premise:** the shoe rack is at plan x522–567, east of the arrival
wall x575, so its mirror doors and the proposed AC bay's gallery-side service door remain *inside* the new locked line in
this model. The fold seat, relocated keys, utility socket and east cabinet also remain inside. They were not moved into
the corridor. It would be misleading to say the drawn rack/service door is now reachable from the landing without passing
the locked arrival doors. If the real rack is in the approach corridor, then its contents, AC service door and anything
else kept there would be exposed; confirm its actual location. Access to the projecting cage from outside the north wall
is a separate site question that this drawing cannot settle.

## Defaults chosen without asking / owner questions

Defaults chosen: retain both doors; steel outside/wood inside; keep north hinges; reverse the wood; proposed 85°/60° stops,
+100/−60 face offsets and packed jambs; narrower leaves; move keys to the solid gallery shaft wall; put bell/conduit and
corridor switch by the new south latch. Both pages initially show the pair closed and provide an open/close button.

Questions for the work-plan owner to add to OPEN_ITEMS (that file was not edited):

1. Keep a safety door + wooden main door pair, or should the steel door **replace** the wooden door? The current pair's
   narrow passage and wooden-leaf rework are serious drawbacks; replacement is not implemented by default.
2. Is reversing and narrowing the existing wooden leaf acceptable, and can its construction support it? Confirm measured
   opening, jamb depth, hinge positions, handles and a practical passage before selecting the pair or ordering a door.
3. Is the shoe rack/service door really east of the arrival door as drawn, or is it in the unlocked approach corridor?
   Confirm what storage and service access must be protected, including any access to the projecting AC cage.
4. Confirm the bell, corridor switch and conduit positions, the actual existing wiring, and the reason for the owner's
   no-door restriction at the landing opening. Nothing here assumes permission for common-area work.

Suggested CURRENT_STATE entry for the other owner (CURRENT_STATE.md was not edited):

> Entry correction, 2026-10-06: the landing opening is door-free per owner. Steel `outerDoor` is mounted at `arrivalDoor`,
> on the corridor face of a proposed steel + retained-wood pair. Wood reverses inward with a 60° stop; steel stops at 85°;
> packed jambs leave 1127 mm leaves. Pure arc checks pass model obstacle margins, but flag only about 508 mm conservative
> passage: owner/fabricator review required. Bell/conduit/corridor switch follow the new locked line; keys move to the solid
> gallery shaft wall. The drawn shoe rack/AC service door remains inside the locked line, contrary to the initial security
> premise. Estimator still prices the old opening; see changes/2026-10-06-entry-door-pair.md for limitations and questions.

## Where the supervisor can inspect it

- **Main entry → Overview / Top → Open entry door pair**, then Close entry door pair: inspect the plain landing opening,
  separate steel/wood faces and opposite swings. The passage warning appears above the view. **Show electrical points**
  shows the relocated EN-1/2/7. **Show AC outdoor unit under the shoe rack** shows the unchanged optional service bay.
- **Whole home 3D → Editable 3D → Top → Open entry door pair**, then Close entry door pair: the same shared door builders
  are used. The existing perspective view is also useful. Archived Blender views are unchanged.

No dev server, browser or screenshot capture was started, as instructed. Appearance, camera framing, runtime interaction,
physical measurements, hardware, walking/carrying space, electrical installation, society restrictions and fabrication
are **not verified**. Saved-layout code and stable electrical/config IDs were retained; browser persistence checks were
not run. No room or appliance geometry was changed.

## Checks and changed files

Node 22.23.3 from `C:\source\kitchen\tmp\node22\node-v22.23.3-win-x64` was prepended to PATH. From react-configurator:

- `npm test`: final ordinary parallel run 490 reported tests, 482 pass / 8 fail: seven expected `Windows: ...` launcher
  failures and a Node access-violation crash (exit 3221225477) of entry-fittings.test.mjs. Earlier parallel attempts also
  crashed bed-furniture, mirror-splashback and whole-home-kitchen files; those files passed on targeted rerun.
- `node --test tests/entry-fittings.test.mjs`: 9/9 pass after the crash. Earlier targeted entry/room-electrical run: 17/17.
  Targeted corrected entry-electrical plus the three initially crashed files: 24/24 pass.
- `npm test -- --test-concurrency=1`: the appended option did not prevent the same parallel crash (482/490 pass).
- `node --test --test-concurrency=1 "tests/*.test.mjs" ../scripts/windows/launchers.test.mjs`: **491/498 pass, exactly the
  seven expected Windows launcher failures**, no other failures or skipped tests. This is the complete suite run serially.
- `npm run lint`: pass (`check-imports: no problems`). This is the project's import lint, not a general type check.
- `npm run build`: pass; existing warning about chunks above 500 kB.
- `node scripts/electrical-doc-sync.mjs`: updated three rows; subsequent `--check`: pass, rows up to date.
- `node scripts/work-plan-estimate.mjs --check`: **fails**, reporting work-plan/plan.json and docs/WORK_PLAN_BUDGET.md stale.
  A read-only loader audit substituting HEAD versions of all changed source modules reports the same drift and totals;
  it predates this change. No work-plan files or generated budget files were rewritten.
- `git diff --check`: pass (only Git's line-ending notices).

Changed files under react-configurator: src/config/entryConfig.js, entryLightingConfig.js and roomElectricalConfig.js;
src/domain/entryFittings.mjs and roomElectricalModels.mjs; src/rooms/entry/EntryOuterDoor.js, EntryArrivalDoor.js and
EntryFoldSeat.js; src/EntryGallery3D.jsx and WholeHome3D.jsx; tests/entry-fittings.test.mjs and entry-electrical.test.mjs.
Documentation: docs/ELECTRICAL_PLAN.md and this note. Scratch logs/audit loader are in the ignored
react-configurator/test-results/codex-entry folder. No dependencies were installed, no git add/commit was run, and
CURRENT_STATE.md, OPEN_ITEMS.md and plan.json were not edited.
