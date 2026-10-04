# Site scan, Bedroom 3 (2026-10-04)

The owner scanned "the third room" with a phone (Scaniverse, LiDAR) and exported `Scaniverse 2026-10-04 201236.glb`
(12.8 MB, 113,285 vertices, 151,700 faces, one texture; kept in the owner's Downloads folder, not in this repository).
This file records what was measured from it, what was put into the app, and what was deliberately left alone.
Method, tool and accuracy are the same as `docs/SITE_SCAN_2026-10-04.md` (Drawing Room and Lobby): wall-aligned point
cloud (rotated 0.45 degrees), 5 mm histograms for planes, textured elevations at 300 px/m for small items. Room sizes
+/- 30-50 mm, small items +/- 20 mm; nothing here replaces a tape for anything that will be cut or ordered.

Orientation was fixed from the A501 plan and the furniture: the wall carrying the toilet door and the entry door is the
NORTH wall (app frame), the wall with the wide olive wardrobe, the glass door and the window is the SOUTH wall, and the
bed head and the AC are on the EAST wall. Conversion from the scan: app x (east from the west wall) = 3963 - (scan z
+ 1878); app z (south from the north wall) = scan x + 1938. Units are millimetres; heights are above the floor.

Not captured: the balcony beyond the glass (only glimpses through it), the depth of the wardrobe bay (closed doors
flush with the wall), the fan body (only its medallion and hub), anything behind the headboard, the wall organiser and
the wardrobe, and wall thickness. The entry door's leaf has clothes hanging on it, so its head is unclear.

## Bedroom 3

| Item | Scan | App before | Action |
| --- | --- | --- | --- |
| Width, east-west | 3915 (wall faces at scan z -1.878 and 2.037) | 3963 | consistent (48 less), unchanged |
| Length, north-south | 3665 (north wall face at scan x -1.938; both door leaves sit 90 back in their reveals) | 3726 | NOT changed (61 less); tape it (OPEN_ITEMS A18) |
| Ceiling height | 2770 (ceiling plane 2.762, floor -0.007) | 2700 | NOT changed, whole-home ceiling; A18 |
| Entry door, north wall | frame against the west wall; clear about 125-895 (770); leaf 90 back in the reveal; head not readable (about 2000-2130) | 0-900, 2100 high | unchanged (within the frame-versus-clear difference); head on A19 |
| Toilet door, north wall | jambs 2525 and 3305 (780 clear), head 2000; leaf 90 back in the reveal; handle and two tower bolts on the room side | 2850-3550, 2100 high | APPLIED 2525 + 780, 2000 high |
| South bay ("cabinet"), the plan's 1925 projection | filled by the existing olive-green wardrobe, doors flush with the south wall line: x 365-1905, floor to about 2450 (two rows of doors, lofts above 2000, plinth about 100); depth hidden | 0-1771 x 610 deep x 2400 high | APPLIED x 365 + 1540, 2450 high; depth 610 kept (A20) |
| Balcony door, south wall | jambs 2005 and 2705 (700 clear), leaf with a handle at 900, frosted glass panels, transom at 2040, top light to 2360 | 1771-2771, 2200 high | APPLIED 2005 + 700, 2360 high, transom 2040 |
| Balcony window, south wall | jambs 2785 and 3705 (920 clear); sill 920; rails at 1350 and 1910; head 2360 (top light 1910-2360 continuous with the door's); mullion 2705-2785 between door and window; solid wall 3705-3963 | 2771-3963, sill 900, head 2200 | APPLIED 2785 + 920, sill 920, head 2360, transom 1910, mid rail 1350 |
| Balcony floor | not scanned (glimpses only) | 1771-3963 x 1200 deep | start moved to 1905 (end of the wardrobe bay); depth 1200 kept |
| Ceiling fan point | medallion (four-lobed plaster, about 700 across) centred 2030 from the west wall, 1820 from the north wall; hub about 100 across hanging 70 below the ceiling; the blades are not in the scan | assumed at the room centre, 1981 / 1863 | APPLIED in `bedroom3LightingConfig.js` (`BEDROOM3_CEILING_FAN`) after the merge with main; blade size and drop still assumed |
| Existing corner cupboard | north-east corner, x 3273-3963 (690 deep east-west), z 0-970 along the north wall, 1990 high, wooden doors facing west; bags on top | not drawn | recorded in `bedroom3.existing.northEastCupboard`, not drawn (the planned east cabinetry replaces it) |
| AC indoor unit | east wall, 1348-2278 from the north (930 wide), 2280-2600 high, 200 off the wall | placeholder 1000 x 280 x 230 centred 1863, bottom 2280 | recorded in `bedroom3.existing.acUnit` for the check below |
| Beams or pillars | none; flat ceiling with a plaster border about 400 in from the walls and corner rings, like the Drawing Room | none | - |
| Switchboard and sockets | see below | not drawn | switchboard and wall light added to `existingElectricalConfig.js` (`bedroom3`, X-B1, X-B2) |

Other existing items (recorded, not drawn): the bed (1840 wide x about 2050 long with its headboard, head on the east
wall, z 1160-3000, mattress top 530) which is 300 further south and 220 longer than the planned 1829 x 1829 bed; a striped
daybed in front of the wardrobe (x 1015-3260, z 2960-3665, seat 530); a wall-hung organiser on the east wall, z 2240-2990,
1050-1700 high, about 40 deep; an open shelf unit in the south-east corner, x 3640-3963, z 3110-3665, about 1800 high;
a small dark cabinet on the west wall, z 2880-3220, about 330 wide x 170 deep x 700 high; a round mirror and a hook rail
on the north wall at x about 1000-1400, 2000-2250 high; a bath mat in front of the toilet door.

Existing electrical points (X-B1 and X-B2 are in `existingElectricalConfig.js`; positions along the wall from the west end for the north wall, from
the north end for the east and west walls):

| Item | Wall | Position | Height |
| --- | --- | --- | --- |
| Switchboard, about 170 x 140 (white area up to 200 x 260: possibly two plates) | north | 1385-1550 from the west (485 east of the entry door jamb) | 1235-1365 (white points 1230-1490) |
| AC indoor unit (its point is behind it) | east | 1348-2278 from the north | 2280-2600 |
| Wall light, dark fitting with a flex | west | 1740-2020 from the north | 2110-2350 |
| Ceiling fan point | ceiling | 2030 from the west, 1820 from the north | hub 2700 |

No socket plates could be identified on the east, west or south walls: the headboard, the organiser, the daybed and the
wardrobe cover the lower walls.

## What changed in the app

- `roomShellConfig.js` `bedroom3`: toilet door 2850 + 700 x 2100 -> 2525 + 780 x 2000; `southExtension.cabinet`
  0 + 1771 x 2400 -> 365 + 1540 x 2450; `southExtension.balcony` 1771 + 2192 -> 1905 + 2058, door 1771 + 1000 x 2200 ->
  2005 + 700 x 2360 with `doorTransomMm 2040`, window 2771 + 1192 sill 900 / 2200 -> 2785 + 920 sill 920 / 2360 with
  `windowTransomMm 1910` and `windowRailsMm [1350]`; new `existing` record (corner cupboard, AC unit), not drawn.
- The balcony door and window are drawn by the shared window builder (`rooms/shared/WindowDetail.js`) with their
  transoms and the mid rail, on the room page and in Whole home 3D.
- `tests/bedroom3-east-cabinet.test.mjs` (doors, cabinet) and `tests/window-design.test.mjs` (south side fixture and
  the design check below).

## Check of the planned east cabinetry, chest and AC bay against the scan

- Toilet door: the north dressing cabinet (x 3506-3963, z 150-900) was 44 mm inside the plan door's x range; against
  the scanned door (2525-3305) it is 201 mm clear. The door leaf opens into the toilet.
- Corner cupboard: the planned north unit (750 x 457, from z 150) lies inside the existing cupboard's footprint
  (690 x 970, from z 0); the design replaces that cupboard, as the owner intended when the cabinetry moved east.
- AC: the existing unit (930 wide, centre 1813 from the north) sits inside the 1200 mm slatted bay centred 1863, 2280
  to 2600 high; the bay's top panel is at 2632, so about 30 mm of headroom if the unit stays. It is 200 deep (the
  placeholder assumes 230). Tape and the unit's service clearances are on A20.
- Bed: the existing bed is 220 longer and 300 further south than the planned one, so the south-east low cabinet
  (z 2826-3576) would overlap it; the design assumes the bed is moved to centre 1863, as drawn.
- Window and door: the east cabinetry ends at z 3576, 150 short of the south line, and the window's east jamb is 258
  from the corner; the cabinetry does not cover the window. The daybed stands in front of the wardrobe doors.
- West chest (z 1163-2563): the only existing item on that wall is the small cabinet at z 2880-3220, outside the chest.
- No change to the planned furniture was needed.

## Left alone, and why

- **Room box and ceiling.** The whole-home model draws every room inside the A501 outline with one 2700 mm ceiling
  (the same reason as for the Drawing Room). Items measured from the west and north walls keep those distances.
- **Entry door**: 770 clear is the leaf-plus-frame reading on a door covered with clothes; the 900 opening stays.
- **Existing furniture** is recorded, not drawn; the planned furniture is the design.
