# Home Office (balcony of Bedroom 2), 2026-10-04

Two things were done: the owner's phone scan was measured and recorded, and the long sit-stand desk was split into a
fixed south corner and a shorter moving top, as the owner asked.

## 1. Phone scan

Full table: `docs/SITE_SCAN_2026-10-04_HOME_OFFICE.md`. In short: the room measures about 2460 long (plan 2623) and about
1065 wide to the beam line of the opening (plan 1200); the ceiling is about 2680 (app 2642, fine). The opening into
Bedroom 2 is 1830 wide from the north wall with a beam at 2440; south of it is wall, with a column in the south-east
corner. The present desk top is at 840, the same as the app's seated preset. Three socket/switch plates on the north wall
and the water heater were measured (see the tables). Nothing about the room box was changed in the app: tape items A15-A17
were added to `work-plan/OPEN_ITEMS.md`.

Applied from the scan: the heater's scanned size and position in the inventory text, the three scanned plates as
`electrical.scannedWallPoints` (grey X1-X3 markers in the 3D electrical overlay and a block in the carpenter PDF), and two
corrected labels (`location`, `access.side`: the balcony is west of the Study and opens east; the old text said east/west).

## 2. Desk: fixed south corner plus a shorter sit-stand top

Owner: "we can't have this much long table ... let's fix some of the south corner of this table as fixed ... keep [a
gap of] one inch".

| | Before | After |
| --- | --- | --- |
| Sit-stand top | 2268 x 762 x 25, from 355 to 2623 (the south wall), against the west wall | 1500 x 762 x 25, from 355 to 1855, set 25 off the west wall |
| Fixed section | none | 743 x 762 x 25 top at 838 (the seated preset), from 1880 to 2623 (south corner), 25 off the wall so the fronts align; full-depth cabinet below (toe 80, body to 813) with a 700 x 450 printer shelf, a shelf at 460 and two-panel bypass sliding fronts facing east |
| Gap between them | - | 25 (one inch), also to the west wall |
| Frame (FLEXISPOT, span 1290) | centred then shifted 152 south; feet 641 / 337 inside the ends; top beyond the maker's 1600 limit | centred; feet 105 / 105 inside the ends; top inside the 1000-1600 range |
| Rear cabinet under the moving top | 2268 long, 3 bays of 756 (PC / printer + clamp chase / storage) | 1500 long, 2 bays of 720 (PC + north foot pocket) and 780 (clamp chase + south foot slot + storage) |
| Foot slots | north pocket 229, south slot 120 | north pocket 150, south slot 120 (both inside the end panels) |
| Top rail of the rear cabinet | solid except at the pocket and the chase | open between the two foot slots, 40 mm front tie; the bay divider stops at 612 so the frame beam clears it by 25 at the lowest height |
| Printer | centre bay of the rear cabinet | pull-out shelf in the fixed section's cabinet |
| Laptop | south end of the moving top | on the fixed section |
| Monitors | north end of the moving top, 6 in south of its edge | unchanged (355 + 152 = 492 from the north wall to the first screen) |
| North cabinet gap | 228 | 228 |

Decisions taken without asking (all are plain numbers in `balconyOfficeConfig.js` under `worktop`, marked "owner default"):

- 1500 for the moving top: inside the frame maker's range, both monitors (about 1300 together) fit on it with room beside.
- 743 for the fixed section: the rest of the old 2268 run, so the desk still starts 228 from the north cabinet. The scan says
  the room is about 160 shorter than the plan; the fixed section is the piece to cut on site, the moving top stays 1500.
- Fixed top at 838 = seated preset, so the two read as one surface when seated. At other heights the moving top is clear
  of it by the one-inch gap on its south edge.
- Storage under the fixed section: a full-depth cabinet (printer shelf low, shelf above) with sliding fronts, not a hinged
  door or pull-outs. Reason: the scan shows that south of the 1830 opening the balcony's east side is a wall about 1060 from
  the west wall, with a column about 785 from the west wall in the last 270 mm of the corner. A 762-deep section set 25 off
  the wall reaches 787, so it touches that column (within scan error) and leaves only about 270 mm of floor in front of its
  cabinet: nothing can swing or pull out there. The app's room is still drawn 1200 wide and open along its east side, so
  the 3D view does not show this. The scan also found a shallow boxing with a small door under the south window where this
  cabinet will stand. Both are tape items (A17); the owner may prefer a shallower or shorter fixed section there.
- The moving top is also set one inch off the west wall (the owner said "same gap to any wall"), so the fixed section is set
  out the same to keep the fronts in line; a scribe strip closes the gap behind the fixed section.

## Where the numbers live

- `src/config/balconyOfficeConfig.js`: `worktop.movingGapMm`, `worktop.westAdjustable` (width, frame set-out, wall gap),
  `worktop.southFixed` (length, top height, what is below), `worktop.rearCabinet` (two bays), inventory and electrical text.
- `src/domain/balconyDesk.mjs` (pure, no React or Three.js): `balconyDeskLayout(office)` works out every position in
  millimetres; `checkBalconyDesk(office)` sweeps the moving top, its frame beam, the monitor clamp and the monitors through
  the whole 737-1209 range against the fixed section, the walls, the north cabinet, the rear cabinet carcass and the PC, and
  requires the one-inch gap everywhere. `BalconyOffice3D.jsx`, `WholeHome3D.jsx` and the carpenter PDF draw from the same
  layout, so the drawings cannot disagree with the check.
- `tests/balcony-desk.test.mjs` freezes the defaults, the layout and the check (8 tests), and checks that the check fails on a
  smaller gap, a top outside the frame range, a wrong fixed height, a taller rear cabinet and a misplaced clamp.

Saved desk heights: the `balcony-office-desk-height-mm` browser value is unchanged in meaning and range (737-1209), so
earlier saved heights still load.

## Checked

- `npm test`: 298 tests, 291 pass, the 7 known "Windows: ..." launcher failures only.
- `npm run build`: passes.
- Balcony office page at 5183: Overview, North cabinet and Top views at 29 in, 33 in, 39 in and 47.6 in; Whole home 3D.
  Screenshots looked at (see the lead report for what was seen and fixed).

## Not verified

- No tape measurement: every scan figure is +/- 30-50 mm (room) or +/- 20 mm (plates, heater).
- The FLEXISPOT frame's real foot, column and beam envelope (the model uses 229 x 75 feet, 75 mm columns and a 75 mm deep
  beam directly under the top).
- The carpenter PDF was not opened in a PDF viewer; its code paths run in the build only.
- Which of X1-X3 is the heater's point and which the router's.
