# Dining shelf light — 2026-10-06

Owner, with the supplied photo: "Let's use this as a dining table light."

The Lobby / Dining light is now a light-oak planter shelf with four thin ceiling rods, three potted plants with trailing
vines, and a warm recessed linear LED underneath. It follows the long, north-south side of the dining table. The existing
slider is labelled **Dining shelf light**; its circuit remains `chandelier`, and it now dims the strip's glow as well as
the existing point-light preview. The room page and Whole home Editable 3D use the same builder. Whole home retains its
existing fixtures-only approach for this light. Plants and vines carry `archvizExclude`.

## Before and after; defaults chosen without asking

All new sizes, clearances, plant choices, weights and preview settings are **PROPOSALS/ASSUMPTIONS**, dated in the config.
The photo approves the idea, not measured hardware or an installation design.

| Item | Before | Proposed now |
| --- | --- | --- |
| Hanging body, long x wide x thick | Linear bar, 900 x 160 x 75 mm | Light-oak board, 1000 x 300 x 40 mm |
| Recorded underside above floor | 1657 mm | 1780 mm, 123 mm higher |
| Clearance over the 745 mm table top | 912 mm | 1035 mm |
| Ceiling fitting | 750 x 100 mm bar canopy crossing the north moulding | 80 x 60 x 20 mm electrical cap, plus four separate 40 mm diameter x 12 mm rod mounts |
| Suspension | Two drawn supports | Four 6 mm rods; anchors at x 2090/2310, z 300/940 mm |
| Light source | Glowing bar and point-light preview | 880 x 16 mm LED diffuser, recessed 2 mm into a 900 x 22 x 8 mm underside channel, 3000 K |
| Plants | None | Three, 350 mm high above the shelf, 220 mm spread; centres -310/0/+310 mm along its length |

The dining table stays 700 mm east-west x 1200 mm north-south x 745 mm high, centred at (2200, 620). Room dimensions,
openings, appliances, other lights, electrical point IDs and save formats are unchanged. Config uses room millimetres:
x east from the west wall, z south from the north wall, y up. The builder divides by 1000 for Three.js metres.

I chose 1780 mm to raise the solid board above seated sight lines while retaining a visible hanging feature. It is still
too low to stand underneath. The pure report assumes an 1800 mm person and 150 mm head reach over the table edge:
the board has a -20 mm vertical head margin if someone leans beneath it. Its sides are inset 200 mm from the table edges,
its ends only 100 mm; the end approaches therefore flag a board/head conflict under that assumption. A conservative
foliage envelope extends 65 mm beyond the board and reaches about 1553 mm above the floor (808 mm above the table), so
leaning into the leaves is flagged at all edges. This is a warning, not an ergonomic certification. Keep the table below
the fixture; trim the vines. People's heights, standing positions and sight lines need a physical mock-up.

## Ceiling, feed and load

The pure check reports each actual rod mount against every moulding and the probable fan circle. The proposed mounts
have a minimum 70 mm gap to mouldings, and 103 mm to the assumed 1200 mm fan blade circle, including the mount radius.
The working minimums of 40 mm to mouldings and 100 mm to blades are proposals, not installation standards. The fan
margin is small: changing the assumed diameter to 1400 mm leaves just 3 mm at the nearest mount and fails that check.
The existing scan is uncertain; nothing is certified from these numbers.

The board overlaps the assumed blade circle in plan by 56 mm. Its top is 566 mm below the modelled lower blade face;
the proposed plant tops are 216 mm below it. These account for the existing fan sketch's lower blade face being 14 mm
below its nominal 300 mm drop, rather than comparing only to the hub datum. Real blade sag, plant growth, sway and
air movement are not checked.

There is **no existing ceiling point over the table**. The nearest point is the occupied fan medallion, about 1060 mm
away. The little electrical cap and its vertical cable are a proposed fixture detail, not evidence of a supply. New
feed versus swag, its route past the mouldings, and the LED driver location stay open. Keep the driver accessible,
ventilated and dry, away from the pots; select a driver compatible with the existing dimmer plan. The electrical row
L-C1 retains its existing 30 W planning allowance, not a measured LED/driver load. A ceiling hook is no longer described
as sufficient support for this shelf.

Estimated hanging weight is **16 kg**: 8.4 kg for the gross oak blank at an assumed 700 kg/m³ (no deduction for the LED
channel), three wet pots at 2 kg each, and 1.6 kg for rods, mounts, LED and other hardware. **Four anchors into the RCC
slab are needed; the load is not engineered.** Confirm the slab, services/reinforcement, anchor type and capacities,
unequal loading and actual wet weight with the installer/structural professional. Plaster or ceiling mouldings are
not structural support. This estimate is not an anchor specification or a shelf quotation.

## Practical advice and owner questions

Use closed cachepots and remove the inner pots to water and drain away from the dining table and electrics. Good
artificial plants are a practical alternative. Real pothos needs daylight the Lobby may not have; the downward-facing
table LED does not establish adequate plant light. Allow access to lift pots off, wipe the oak and diffuser, dust leaves
and trim trailing growth; do not use the table as an improvised access platform. Confirm the timber finish can tolerate
occasional moisture and repeated cleaning.

Questions for the owner / round owner to transfer to OPEN_ITEMS (not edited here):

- Accept the proposed 1000 x 300 x 40 mm shelf and 1780 mm underside after a sight-line and standing/leaning mock-up?
- Real pothos in closed cachepots, or good artificial plants? Who will remove/water/clean them and keep growth trimmed?
- Confirm the probable fan, its blade diameter/drop and the four proposed fixing positions against the actual mouldings.
- New ceiling feed or visible swag, and where can the dimmable LED driver remain accessible, dry and ventilated?
- Who will verify the RCC slab, concealed services, fixings and actual wet hanging weight before fabrication?

## Where the supervisor can inspect it

- **Lobby / Dining → Overview**, then **Hide south wall** if it obscures the view. Orbit toward the table to see the
  board underside. **Top** shows the north-south alignment, pots, fan and ceiling mounts.
- Choose **Evening**, tick **Dark room: only these lights**, use **All off**, then adjust **Dining shelf light brightness**
  from off through 100% and 150%. Check that the LED glow and table illumination dim together. **Planned level** restores
  all circuits. **Show electrical points** exposes the renamed L-C1 entry.
- **Whole home 3D → Editable 3D**, look into Lobby / Dining and orbit above/below the shelf. The new fixture is drawn
  automatically; no new toggle is required. The archived Blender model is unchanged.

No dev server or browser was started, per this run's instructions. Screenshots, actual appearance, glare, framing,
daylight suitability and browser interaction are **not verified** here. Saved-layout browser round trips, Blender/CAD
exports and physical/structural/electrical performance were not tested.

## Checks

Node v22.23.3 from `C:\source\kitchen\tmp\node22\node-v22.23.3-win-x64`, prepended to PATH; commands run from
`react-configurator/`. `npm.cmd` is the Windows invocation of npm. No install, commit or staging was run.

- `npm test` (`npm.cmd test`): run repeatedly. The final ordinary concurrent run exited 1: 463 passed, 8 failed;
  seven were the documented `Windows: ...` launcher failures and one was a Node process crash in
  `tests/existing-electrical.test.mjs`. Earlier concurrent runs also crashed in unrelated work-plan, Bedroom 1 layout,
  interior-materials and sofa test files; the work-plan file passed 16/16 alone. These concurrent runs are not passes.
- `node --test --test-concurrency=1 "tests/*.test.mjs" ../scripts/windows/launchers.test.mjs`: final complete rerun
  exited 1, **474 passed / 481 total, exactly the seven known Windows launcher failures; no other failures**. Passing
  concurrency via NODE_OPTIONS was unsupported; appending it through npm did not resolve the crashes. No package-script
  change was made. Logs are under ignored `react-configurator/test-results/dining-shelf-*`.
- `node --test tests/lobby-lighting.test.mjs tests/lobby-electrical.test.mjs`: final **15/15 passed**. Includes larger-fan,
  moulding-clash, shifted/out-of-room anchor, axis-change, low-shelf and heavier-wet-pot cases; legacy report keys retained.
- `npm run lint`: passed, `check-imports: no problems` (the repository's import check, not a full JavaScript linter).
- `npm run build`: passed, 954 modules; existing warning about chunks over 500 kB remains.
- `node scripts/work-plan-estimate.mjs --check`: passed, 112 tasks / 105 estimated; no budget/work-plan regeneration.
- `node scripts/electrical-doc-sync.mjs`: passed, updated the config-derived L-C1 name. The script preserves prose
  columns, so L-N1/L-C1 wording was updated by hand to match config. Final
  `node scripts/electrical-doc-sync.mjs --check`: passed, rows up to date. An earlier parallel check crashed Node;
  subsequent sequential checks passed. Neither final `--check` reports drift caused by this change.
- Direct Node/Three.js smoke inspection (no DOM/browser): passed with real lights both enabled and disabled. Actual
  board vertices span 300 x 1000 x 40 mm with bottom 1780; plant vertices remain inside the report's conservative
  envelope (approximately x 2000–2400, y 1556–2170, z 207–1036 mm). Four rods match the pure helper; all plant descendants
  are excluded from archviz; dim levels 0, 0.5, 1 and 1.5 update glow and real-light intensity/dim metadata together.
- `git diff --check`: passed.

Changed files: `src/config/lobbyLightingConfig.js`, `src/config/roomElectricalConfig.js`,
`src/domain/drawingLighting.mjs`, `src/rooms/shared/RoomTaskLighting.js`, new `src/rooms/shared/DiningShelfLight.js`,
`tests/lobby-lighting.test.mjs` (all under react-configurator), `docs/LIGHTING.md`, `docs/ELECTRICAL_PLAN.md`, and this note.

## CURRENT_STATE entry for the round owner (not applied here)

2026-10-06: Owner's planter-shelf photo replaces the Lobby dining pendant with a proposed light-oak shelf light,
1000 x 300 x 40 mm, underside 1780 mm (was 1657), centred over the unchanged dining table. Three trailing plants,
four rods and a recessed 3000 K LED; stable `chandelier` circuit, renamed Dining shelf light slider dims glow and light.
Pure checks report rod/moulding/fan gaps, table/head clearances and a proposed 16 kg wet hanging weight. Four RCC slab
anchors need engineering/installation review; no ceiling feed exists over the table and feed/driver choices remain open.
See docs/changes/2026-10-06-dining-shelf-light.md. Visual review is deferred to the supervisor; tests completed with only
the seven known Windows launcher failures on a sequential rerun.
