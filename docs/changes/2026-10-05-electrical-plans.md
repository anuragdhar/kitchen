# Proposed electrical plans for six more rooms, and the three clashes resolved (2026-10-05)

A planning layout for a licensed electrician, not a wiring design. Nothing here is measured on site beyond the phone
scans. The full tables are in `docs/ELECTRICAL_PLAN.md`.

## What was added

Until now only the Drawing Room had a proposed electrical plan. Six more spaces have one, each with a point-by-point
table, circuits and a rough load figure:

| Room | Points | Circuits | Rough connected load |
| --- | ---: | ---: | ---: |
| Lobby / Dining | 12 | 3 | about 4,405 W |
| Bedroom 1 | 11 | 4 | about 5,295 W |
| Bedroom 3 | 11 | 3 | about 4,465 W |
| Study (Bedroom 2) | 9 | 3 | about 4,355 W |
| Home Office | 9 | 3 | about 3,320 W |
| Main entry | 11 | 2 | about 1,252 W |

The Kitchen is not included: it already has its own services plan.

Where to see it: press **Show electrical points** on the Lobby, Bedroom 1 and Bedroom 3 pages, and on the Study, Home
Office and Main entry pages. A panel under the picture lists the points and what the checks found. The Drawing Room's
button works as before.

Every plan passes the same checks with no problems reported: no point in a door, window or opening; none hidden behind
furniture or an open door leaf unless hidden on purpose; a switchboard on the latch side of each door at 1200 mm; a
charging point within 1.5 m of each bed side, desk or seat; a dedicated point beside every AC; a feed for every track
driver and ceiling fan; a switch for every lighting circuit.

## The three clashes, resolved

1. **Drawing Room switchboard behind the TV panel:** it moves to the new main switchboard on the east wall, just past
   the swing of the entry door, 350 mm from the distribution board. The old box is emptied and plastered over before the
   panelling goes up.
2. **Three sockets behind the west sofa:** they stay, hidden on purpose, and feed two new outlets above the sofa back and
   above the corner table. Two get blank plates; the third, in the gap south of the sofa, stays in use.
3. **Lobby switchboard inside the planned Bedroom 1 door:** it moves to a new switchboard on the latch side of the new
   door. The old riser ends in a junction box above the new door head that stays reachable. This must be done before the
   door opening is cut, and it assumes the feed comes down from above, which the electrician must check first.

"Show existing electrical points" now shows these resolutions beside each old point, not open conflicts.

## Defaults chosen without asking

- Heights follow common Indian practice: switchboards 1200, low sockets 300, AC points near the unit.
- Existing points are reused where they suit (the Lobby fan point, the Bedroom 3 switchboard, the Lobby tube-light and
  ceiling-light points as feeds for the track drivers).
- Bedroom 1 is planned for its present layout (layout A). If layout B is chosen, the bedside points move to the south
  wall either side of the bed.

## One disagreement to settle

This plan gives Bedroom 1 two AC points: one for the window AC in the balcony and one for a split AC on the west wall.
The air-conditioning plan (`docs/AC_PLAN.md`) recommends dropping the split AC in Bedroom 1 because the window AC covers
the room. If the owner agrees, the split AC point (B1-W1) and its circuit come out and Bedroom 1's load falls by about
1,700 W.

## How this was finished

The agent doing this work was cut off by a usage limit after the configs, checks, tests, page buttons and the document
were written. The lead merged it with the day's other changes, added a small script that refreshes the document's
figures from the configs (`node scripts/electrical-doc-sync.mjs`, from `react-configurator/`), and ran the checks.

## For the work plan

- Electrician's survey before any chasing: where each feed really comes from, earthing, breaker ratings.
- Relocate the Drawing Room switchboard to the east wall before the TV panelling.
- Relocate the Lobby switchboard before the Bedroom 1 door opening is cut.
- Electrical first fix and second fix per room, from the tables in `docs/ELECTRICAL_PLAN.md`.
- Decide: Bedroom 1 split AC point, yes or no (follows the AC decision).
- Decide: Bedroom 1 layout A or B, before its bedside points are chased.

## Not verified

- No position has been checked on site; existing wiring routes are unknown.
- Loads are rough connected loads from typical figures, not a calculation for cable or breaker sizes.
- The lead looked at the Lobby, Bedroom 1 and Bedroom 3 pages with the points shown; the Study, Home Office and Main
  entry buttons were not looked at on screen.
