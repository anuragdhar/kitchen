# Site scan, Home Office (balcony of Bedroom 2), 2026-10-04

The owner scanned the home office with a phone (Scaniverse, LiDAR) and exported `Scaniverse 2026-10-04 202824.glb`
(13.7 MB, 111,269 vertices, one texture; kept in the owner's Downloads folder, not in this repository). In the app this
room is the "Balcony office" (`react-configurator/src/config/balconyOfficeConfig.js`). This file records what was measured,
what was put into the app, and what was deliberately left alone. Method, accuracy and table layout follow
`docs/SITE_SCAN_2026-10-04.md`.

## What the scan covers

The whole balcony (both window walls, the north wall with the sockets and the water heater, the floor and ceiling), the
opening into Bedroom 2 with its beam, and about half a metre of Bedroom 2's floor and ceiling beyond the beam. Nothing else
of Bedroom 2 is usable. The owner's present desk, monitor arm and chair were in the room.

## How it was measured

- The mesh was rotated 62.45 degrees about the vertical axis so the walls line up with the axes, then sampled to a coloured
  point cloud at about 5 mm spacing (`python scripts/scan_measure.py prepare`). Orientation was fixed from the plan: the
  balcony is west of Bedroom 2 and opens into it through its east side, the two window walls are south and west, and the
  water heater is on the north wall near the west corner.
- Wall, jamb, sill, beam and desk positions are the peaks of point histograms along each surface's normal (5 mm bins).
- Switch plates, the heater and the window frame were read off textured orthographic elevations at 300 pixels per metre.
- Phone LiDAR is usually good to 1-2 %. Treat room sizes as +/- 30-50 mm and small items as +/- 20 mm. Nothing here
  replaces a tape for anything that will be cut or ordered.
- Not captured: glass (the windows appear as holes or as the curtains in front of them), anything behind the curtains, the
  top of the heater (glossy; the mesh has a hole there), wall thickness.
- The ceiling mesh bows by about 80 mm between the walls and the middle of the room (a common scan artefact), so the
  ceiling height is given as a range.

Units are millimetres. Positions are from the room's west wall face and north wall face, the same frame as the app
(x east from the west wall, z south from the north wall); heights are above the floor.

## Room

| Item | Scan | App before | Action |
| --- | --- | --- | --- |
| Length, north wall to south wall | 2460 (the parapet face; window glass is recessed to about 2515) | 2623 (A501 plan, "8 ft 7 in") | NOT changed: 160 mm is more than scan error; tape it (OPEN_ITEMS A15). The fixed desk section is cut on site |
| Width, west wall to the beam/wall line of the opening | 1065 (1095 at parapet level); 1320-1380 to the east face of that wall | 1200 (plan, "3 ft 11 in") | NOT changed, goes with the length (A15). The app's east side is open; the real east side is a beam line with a 1830 opening |
| Ceiling height | 2630-2730 (bowed mesh), about 2680; Bedroom 2 side 2770-2790 | 2642 | confirmed within accuracy, unchanged |
| Floor | level within 15 mm, no step at the opening | flat | confirmed |
| Opening to Bedroom 2, east side | from the north wall to 1830 south; head (beam soffit) 2440; the beam is 250 wide (1066-1316 from the west wall) | drawn as a full-length open edge with a low threshold | RECORDED (Study config: 1829 wide, 533 from the south; scan: 630 of wall south of it) |
| Wall south of the opening | 1830-2460 from the north, west face 1060 from the west wall | not drawn | recorded |
| Column in the south-east corner | a step in that wall: from 2190 to the south wall its west face is at 785 (so the column is about 275 x 270) | not drawn | recorded; the new fixed desk section (25 off the wall, 762 deep, to 787) touches it within scan error and has only about 270 mm of floor in front, so its cabinet gets sliding fronts (OPEN_ITEMS A17) |
| West window | sill (parapet top) about 950-1000; a mullion at about 1190 from the north wall; frame members at 2100-2400 suggest a transom at about 2100 and a head at about 2400; curtain to the ceiling hides the rest | parapet 991, window 991-2337, top band 305 | confirmed within accuracy, unchanged |
| South window | sill about 1050; from about 50 to 740 from the west wall (to the column); sash bottom rail at 1210-1250; head not readable (curtain) | same bands | sill 60 mm higher than the app: RECORDED only (within the curtain/frame uncertainty) |
| Boxing below the south window | a shallow wooden panel about 60 mm proud of the wall, 180-730 from the west wall, floor to about 950-1000, with a door about 310 wide x 630 high at 300-610 from the west wall, 70-700 high (probably covering pipes) | not drawn | RECORDED: the fixed desk cabinet will stand in front of this door; decide on site (OPEN_ITEMS A17) |
| Existing desk | top 840 high, 790 deep from the west wall, from about 250 to 1430 from the north wall (about 1180 long); a unit under it at the wall 400-880 from the north | not drawn (the app shows the proposed desk) | recorded. 840 is the app's seated preset (838) |
| Water heater | vertical cylinder about 350 across, 350 proud of the north wall, bottom about 2040, reaching the ceiling (top hidden), centre about 425 from the west wall (250-600) | "provisional 360 diameter x 500 H" in the NW bay of the upper cabinet, bay 286-786 from the west wall | APPLIED to the inventory text. The bay is NOT moved: the heater's west edge is about 35 mm west of the bay's side panel (OPEN_ITEMS A16) |
| Ceiling fan, ceiling light | none: no fan, no fixture body below the ceiling. Two soft bright patches in the ceiling texture at about (720, 720) and (720, 1470) from the west/north, probably reflections or flush lights | none drawn | recorded |
| AC, router | not seen (no indoor unit on any wall; the router is not identifiable) | router proposed in the NE bay | nothing to apply |
| Beams inside the room | none; only the beam over the opening | none | confirmed |

## Existing electrical points (recorded for the "existing electrical" layer)

All on the north wall; positions from the west wall face, heights above the floor, +/- 20 mm. Which plate serves the heater
and which the router is not readable from the scan; the cables from X3 run down to the present desk.

| Item | Wall | Position along the wall | Height |
| --- | --- | --- | --- |
| X1: small plate, about 100 x 80 (switch or socket), near the heater | north | 515-615 | 1730-1810 |
| X2: small plate, about 115 x 80, beside X1 | north | 665-780 | 1730-1810 |
| X3: larger plate, about 220 x 90, two plugs in use | north | 880-1100 | 1470-1560 |
| Brown object at desk height (adapter or cable organiser, not a fixed point) | north | 465-580 | 820-1030 |

No switchboard, socket or light was found on the west, south or east sides. These are also in the config as
`electrical.scannedWallPoints` (X1-X3) and show as grey markers when "Show electrical points" is on in the balcony view.

## What changed in the app from the scan

- `balconyOfficeConfig.js`: `survey` block (room length 2460, width 1065 to the beam, ceiling 2680, opening, column, present
  desk) recorded only; the water-heater inventory line now carries the scanned size and position; `electrical.scannedWallPoints`
  X1-X3; `location` and `access.side` corrected (the balcony is west of the Study and opens east, as the plan and the scan say;
  the old text said the opposite).
- `work-plan/OPEN_ITEMS.md`: A15 (room size by tape), A16 (heater against the proposed bay), A17 (boxing door under the south
  window).

## Left alone, and why

- **Room length, width and height.** The whole-home model draws every room inside the A501 plan outline, and the balcony
  page, the carpenter PDF and the desk layout all start from `dimensions`. A 160 mm shorter room would move the north cabinet
  gap, the desk run and the printer bay; the plan figure may be a structural dimension rather than a clear one. Tape first.
  The new fixed desk section is the piece that absorbs the difference on site.
- **Window bands.** Within accuracy on the west; the south sill reads 60 mm higher but the curtain hides the frame.
- **Heater bay.** The scanned heater overlaps the bay side panel by about 35 mm; whether the cabinet moves or the bay widens
  is a design decision for the owner (A16).
- **Opening and column.** The balcony page shows the east side open along its full length; drawing the real wall, beam and
  column changes the room shell that other rooms share. Recorded for the lead.
