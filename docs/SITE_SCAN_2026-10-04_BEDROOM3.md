# Site scan, Bedroom 3 (2026-10-04)

The owner scanned "the third room" with a phone (Scaniverse, LiDAR) and exported `Scaniverse 2026-10-04 201236.glb`
(113,285 vertices, 151,700 faces, one texture; kept in the owner's Downloads folder, not in this repository).
This file records what was measured from it, what was put into the app, and what was deliberately left alone.
Method, tool and accuracy are the same as `docs/SITE_SCAN_2026-10-04.md` (Drawing Room and Lobby).

## What the scan covers, and what it does not

The scan is PARTIAL. The phone tracked the walls, floor and furniture of the ENCLOSED BALCONY only (about 2.4 x 1.1 m
at the south end of the room) and, from there, the bedroom's ceiling at a grazing angle (about 4.0 x 3.3 m of it).
The bedroom's own walls and floor were not captured: there is nothing of the north wall (entry door, toilet door), the
west wall (chest), the east wall (bed, new cabinetry, AC) or the south-west bay that the app draws as a projecting
cabinet. A second scan walked round the room at chest height, pointing at each wall, is needed for those.

The mesh was rotated 0.45 degrees to line the walls up with the axes. Orientation from the A501 plan: the balcony is at
the room's south-east (app frame), its east end wall is in line with the room's east wall, and the bedroom ceiling runs
north from it; that fixes scan -z = south and scan +x = WEST. Conversion used throughout:
app x (east from the west wall) = 3963 - (scan x + 1658), app z (south from the north wall) = 3726 - (scan z + 635),
where 3726 is the room's south wall line and the balcony lies beyond it (app z > 3726). Units are millimetres; heights
are above the balcony floor (scan y -0.002), which is continuous with the room floor.

Also not captured: the fan (see below), anything behind the curtain on the balcony's outer wall (x 1538-2725 above
about 1000), the depth of anything recessed, wall thickness.

## Bedroom 3

| Item | Scan | App before | Action |
| --- | --- | --- | --- |
| Room width, east-west | about 4000 (the ceiling patch spans scan x -1.65 to 2.35; edges are fuzzy) | 3963 | consistent, unchanged |
| Room length, north-south | not measured (the ceiling patch ends 200-500 mm short of the north wall) | 3726 | unchanged |
| Ceiling height, bedroom | about 2800 (ceiling plane at scan y 2.797) | 2700 | NOT changed (whole-home 2700 ceiling); tape it (OPEN_ITEMS A15) |
| Ceiling height, balcony | 2690 (soffit at scan y 2.68-2.70) | 2700 (same as the room) | recorded as `ceilingMm: 2690`; it sets the balcony wall heights (no slab is drawn, so the overview still sees into the balcony) |
| Entry door, north wall | not in the scan | 0-900, 2100 high | unchanged |
| Toilet door, north wall | not in the scan | 2850-3550, 2100 high | unchanged |
| South-west bay ("cabinet", the plan's 1925 projection) | not in the scan; its east side is the balcony's west end wall at x 1538 | 0-1771 x 610 deep x 2400 high | width APPLIED 1771 -> 1538; depth and height unchanged |
| Balcony width, between end walls | 2425 (x 1538-3963) | 2192 (x 1771-3963); plan says 2383 | APPLIED |
| Balcony depth, room wall line to the inner face of the outer wall | 1065 | 1200 (plan figure, probably to the outer face) | APPLIED |
| Balcony door and window on the room line | NONE: the balcony is enclosed and merged with the room. The room line is open 1538-3385 (1847 clear) under a beam | glass door 1771-2771 (2200 high) + window 2771-3963 (sill 900, head 2200), open balcony with railings | APPLIED: door and window removed, opening + beam drawn, walls round the balcony |
| Beam over the opening | 250 wide (its north face 250 into the room), underside 2440 (300 below the balcony soffit, about 360 below the room ceiling) | none | APPLIED |
| West jamb of the opening | at x 1538, runs 250 into the room, flush with the beam face (a column; its width is hidden by the bay) | none | APPLIED with an assumed 230 width |
| East end of the room line | 340 of wall left at x 3385-3725, then a column x 3725-3963 projecting 415 into the balcony (z 3726-4141) | wall 0 (the window reached the east wall) | APPLIED |
| Window on the balcony's outer wall | frame x 2725-3963 (1238 wide; the frame reaches the east end wall), sill 1060, head 2060; one vertical division near the middle, read as two sliding panes; cream frame; glass seen as night sky | none (the app's window was on the room line) | APPLIED as `outerWindow` |
| Outer wall x 1538-2725 | wall up to about 1000, then hidden by a floral curtain to the soffit; a desk with a monitor stands against it | solid in the app | unchanged; whether a second window is behind the curtain is unknown |
| Ceiling fan | NOT FOUND: the room ceiling was seen only at a grazing angle from the balcony; no rosette, hub, rod or blade shadow is visible, and no data gap of fan size (a running fan usually leaves one) | fan not drawn | not recorded; tape it (OPEN_ITEMS A16) |
| AC | none in the scanned part; the east wall was not scanned | placeholder in the east overhead run | unchanged |
| Switchboards, sockets | see the table below | not drawn | recorded here only |
| Beams or pillars inside the room | none seen on the ceiling patch; the beam and two columns above are all on the balcony line | none | as above |

Existing items in the balcony that are not building fabric (recorded, not drawn): a desk with a monitor against the
outer wall under the curtain, x about 1540-2700, top about 820-880 high; an office chair; a small wooden panel with a
handle on the balcony's east end wall, about 550 wide x 700 high, 300-1000 above the floor, z 4190-4740 (465-1015
beyond the room line); it reads as a cabinet door, flush with or recessed into the wall, depth not measurable. If this
is "the existing cabinet" the owner means, its size is as given here and its depth needs a tape.

Existing electrical points (recorded here only, for the "existing electrical" layer). Positions on the balcony's west
end wall are measured from the room's south wall line (z 3726) SOUTH into the balcony; that wall is at x 1538 and faces
east.

| Item | Wall | Position | Height |
| --- | --- | --- | --- |
| Water heater (small storage geyser, about 280 wide, 320 deep) | balcony west end wall (x 1538, faces east) | 525-805 beyond the room line (z 4251-4531) | 2030-2500 |
| Two switch/socket plates side by side (each about 70 x 70) | balcony west end wall | 465-535 and 295-395 beyond the room line (z 4191-4261 and 4021-4121) | about 1700-1800 |
| One plate (about 70 x 90) | balcony west end wall, on the jamb at the room line | -35 to 135 (z 3691-3861, straddling the room line) | about 1470-1570 |
| Two small white fittings (about 40 each), purpose unknown | balcony outer wall (z 4791, faces north), under the window | x about 3800-3860 (100-160 from the east end wall) | about 940 |

Cables run on the surface of the west end wall from the plates up to the geyser and down to the desk.

## What changed in the app

- `roomShellConfig.js` `bedroom3.southExtension`: cabinet width 1771 -> 1538; balcony 1771 + 2192 x 1200 open with a
  door and a window -> 1538 + 2425 x 1065, `enclosed: true`, `ceilingMm 2690`, `opening 1538-3385 head 2440`,
  `beam 250 / 2440`, `westJamb 250 into the room (230 wide, assumed)`, `eastColumn 3725-3963 x 415`,
  `outerWindow 2725 + 1238, sill 1060, head 2060, two panes`.
- `Bedroom3SouthExtension.js`: draws the enclosed balcony (end walls to 2690, outer wall with the window, beam,
  jamb and column) when `enclosed` is set; the railed balcony path is unchanged otherwise.
- `EmptyRoomGallery.jsx` and `WholeHome3D.jsx`: the south room line gets a passage for the opening instead of the glass
  door and the window. The view button reads "Balcony opening + window".
- `tests/bedroom3-east-cabinet.test.mjs` (cabinet width) and `tests/window-design.test.mjs` (balcony fixture).

## Left alone, and why

- **Room box and ceiling.** The whole-home model draws every room inside the A501 outline with one 2700 mm ceiling
  (the same reason as for the Drawing Room). The balcony's own 2690 soffit is recorded and sets its wall heights.
- **Doors, the east cabinetry, the west chest, the AC.** Not in the scan. The design check against the scan is therefore
  limited to the south end: the opening ends 578 mm from the east wall (340 of wall plus the 238 column), so the
  457 mm deep east cabinetry stands against that wall stub and does not reach the opening; the overhead run ends at
  z 3576, 150 mm short of the room line; nothing in the new design stands in the balcony. No clash found there.
- **The desk, chair and curtain** in the balcony are existing furniture, not design.
