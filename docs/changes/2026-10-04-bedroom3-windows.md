# Bedroom 3 scan, and the window design in the Drawing Room and Bedroom 3 (2026-10-04)

Plain-language notes for the owner. Millimetres; x from the west wall, z from the north wall, heights above the floor.

## 1. What the Bedroom 3 scan showed

The scan covers the whole room (3,915 x 3,665 at the wall faces, ceiling 2,770). Full table, method and the existing
electrical points: `docs/SITE_SCAN_2026-10-04_BEDROOM3.md`. The first version of this note was written from the wrong
file (the Home Office scan, which another task's `prepare` had written into a shared scratch folder); everything below
was re-measured from `Scaniverse 2026-10-04 201236.glb` in a folder of its own.

### Changed in the app (before -> after)

| Item | Before | After |
| --- | --- | --- |
| Toilet door, north wall | x 2,850-3,550, 2,100 high (from the plan) | x 2,525-3,305 (780 clear), 2,000 high |
| Entry door | x 0-900, 2,100 high | unchanged (scan: about 125-895 clear, head hidden by clothes on the leaf) |
| South bay ("cabinet") | x 0-1,771, 2,400 high | x 365-1,905 (the existing olive wardrobe, doors flush with the wall), 2,450 high; depth 610 still assumed |
| Balcony door | x 1,771-2,771, 2,200 high, plain glass | x 2,005-2,705 (700), 2,360 high with a top light above a transom at 2,040 |
| Balcony window | x 2,771-3,963, sill 900, head 2,200 | x 2,785-3,705 (920), sill 920, mid rail 1,350, transom 1,910, head 2,360; solid wall 3,705-3,963 |
| Balcony floor | from 1,771 | from 1,905 (the end of the wardrobe bay); depth 1,200 still assumed |
| Room box 3,963 x 3,726 x 2,700 | | unchanged on purpose (whole-home model); A18 asks for a tape |

Decisions taken without asking: the entry door stays 900 because a door covered with clothes cannot be read closer
than that; the wardrobe's depth and the balcony's depth stay as they were (not visible); the existing corner cupboard
and AC are recorded in config (`bedroom3.existing`) but not drawn, because the planned east cabinetry replaces the
cupboard and encloses the AC.

### Check of the new Bedroom 3 design against the scan

The toilet door is 300 further west than the plan put it, so the north dressing cabinet now clears it by 201 mm
(it was 44 mm into the plan door). The planned north unit sits inside the footprint of the existing corner cupboard
(690 deep x 970 along the north wall, 1,990 high), which it replaces. The existing AC (930 wide, 2,280-2,600 high,
200 off the wall, centred 1,813 from the north) fits inside the 1,200 mm slatted bay centred 1,863 with about 30 mm
above it. The existing bed is 220 longer and 300 further south than the planned bed; the design moves it, as drawn.
Nothing in the design clashes with the window, the door or the wardrobe. No furniture was moved.

### Fan

The ceiling medallion and the fan's hub are at 2,030 from the west wall and 1,820 from the north wall (the room's
centre is 1,981 / 1,863 in the app). The blades are not in the scan. After the merge with main this point is set in
`bedroom3LightingConfig.js` (`BEDROOM3_CEILING_FAN`: 1,981 / 1,863 assumed -> 2,030 / 1,820 scanned); the two tracks
still pass their clearance checks with it there. Blade diameter (1,200) and drop (300) are still assumed.

### Existing electrical points

Switchboard on the north wall at 1,385-1,550 from the west, 1,235-1,365 high (485 east of the entry door jamb); AC unit
on the east wall at 1,348-2,278 from the north, 2,280-2,600 high; a wall light on the west wall at 1,740-2,020 from the
north, 2,110-2,350 high; the fan point above. No sockets could be seen behind the furniture. The switchboard and the
wall light are in `existingElectricalConfig.js` (key `bedroom3`, X-B1 and X-B2) and show with the room page's
"Show existing electrical points" button; the planned chest, artwork and east cabinetry are checked against them and
nothing lands on either (no conflict).

Notes for the lighting plan (not changed here): Track 2's first wardrobe spot is at x 450, and the wardrobe now starts
at x 365, so that spot is at the wardrobe's west edge rather than a quarter of the way along it; the comment block in
`bedroom3LightingConfig.js` still describes the wardrobe as x 0-1,771 and the toilet door as 2,850-3,550 (a line was
added there pointing at the scanned values).

## 2. Window design: Drawing Room south window and Bedroom 3 window

The south window used to be drawn as a flat frame with two mullions. It is now drawn as it is and as decided:

- three bays (934 / 899 / 867 wide, from the scanned mullions), a transom at 2,040 and a row of fixed top lights above
  it to the head at 2,430 (the owner's "about 1 ft" band is 390 here, from the scan; B6 still asks for the exact figure);
- two outward-opening shutters in every bay, six in all: the centre bay, which was fixed, gets its pair (B5 answered);
- a roller mosquito net per section on the room side, cassette under the transom (decided; "top" is the proposal in C19);
- the outside roll-up sun screen (bamboo chick), 2,500 wide, drawn rolled up 85 mm off the wall in front of the top
  band, as in `docs/drawings/south-window-chick-cord.png`;
- the frame in a wood colour: the proposal in C19 (match the TV panel wall, `#a47a52`) is drawn until the shade is chosen.

How it is built: the design is config on the window entry in `roomShellConfig.js` (`transomMm`, `bays`, `shutters`,
`rollerNet`, `outsideScreen`, `frameStyle`/`frameColor`), read by a pure module `src/domain/windowDesign.mjs`
(bay widths, leaves, nets, screen, and a checker), and drawn by one shared builder `src/rooms/shared/WindowDetail.js`
used by the room page, by Whole home 3D (which otherwise only drew plain glass in the wall) and by the Bedroom 3
balcony. A window without the new fields draws exactly as before (same boxes, same sizes).

Bedroom 3's balcony door and window are drawn with the same builder: the door with its top light above a transom at
2,040, the window with its mid rail at 1,350 and its top light above 1,910, both to a head of 2,360, as scanned. No
shutters, nets or screen are recorded for them: nothing has been decided; the same fields can be added to the balcony
entry (`doorTransomMm`, `windowTransomMm`, `windowRailsMm` are the ones used now).

## 3. Checks run

- `npm test` at the merged head: 334 tests, 327 pass; the only failures are the seven known "Windows: ..." launcher tests.
- `npm run build`: passed (existing large-chunk warning).
- Screenshots (`scripts/room-shots.cjs` on port 5182): Bedroom 3 Overview, Top, Balcony door + window, West chest view,
  and Overview with the existing electrical points shown; Drawing Room
  Overview, Top; Whole home 3D. Reviewed by eye; they are smoke evidence, not approved baselines.

## 4. Not verified

- Bedroom 3: the wardrobe bay's depth, the balcony beyond the glass, the entry door's head, the fan's blades and drop,
  and the switchboard's exact size (tape items A18-A20).
- The real wood shade, the exact top-band height, the net cassette position, and the window frame construction.
- Blender exports, the archviz pipeline and the Bedroom 3 stills were not regenerated.
