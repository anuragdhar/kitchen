# Bedroom 3 scan, and the window design in the Drawing Room and Bedroom 3 (2026-10-04)

Plain-language notes for the owner. Millimetres; x from the west wall, z from the north wall, heights above the floor.

## 1. What the Bedroom 3 scan showed

The scan only covers the enclosed balcony at the south end of the room and the room's ceiling seen from there. The
doors, the bed wall, the chest wall and the south-west bay were not scanned. Full table: `docs/SITE_SCAN_2026-10-04_BEDROOM3.md`.

The important finding: the balcony is **enclosed and joined to the room**. There is no door and no window on the old
balcony line; the room simply opens into the balcony under a beam (opening 1,847 wide, 2,440 high), and the window is
on the balcony's outer wall (1,238 wide, sill 1,060, head 2,060, in the east half). The balcony is 2,425 wide between
its end walls and 1,065 deep, with a soffit at 2,690. The room ceiling scanned at about 2,800.

### Changed in the app (before -> after)

| Item | Before | After |
| --- | --- | --- |
| South-west bay ("cabinet") | x 0-1,771, 610 deep, 2,400 high | x 0-1,538 (the balcony's west wall is at 1,538); depth and height unchanged, not scanned |
| Balcony | x 1,771-3,963, 1,200 deep, open with railings | x 1,538-3,963, 1,065 deep, enclosed: end walls and outer wall 2,690 high (the soffit height; no lid is drawn so the overview still sees in) |
| Balcony door | glass door x 1,771-2,771, 2,200 high | removed: the room line is open x 1,538-3,385 under a beam (underside 2,440, 250 wide) |
| Window | on the room line, x 2,771-3,963, sill 900, head 2,200 | on the outer wall, x 2,725-3,963, sill 1,060, head 2,060, two sliding panes, light frame |
| East end of the room line | nothing | 340 of wall (x 3,385-3,725) and a column (x 3,725-3,963) 415 into the balcony |
| West jamb of the opening | nothing | a pier 250 into the room, 230 wide (width assumed, hidden by the bay) |
| Room box 3,963 x 3,726 x 2,700 | | unchanged on purpose (whole-home model); tape items added |

Decisions taken without asking: the balcony's west wall position (1,538) is also applied to the bay width because
the two share that wall; the window is drawn with two panes because the scan shows one division near the middle; the
room ceiling stays 2,700 (see OPEN_ITEMS A15); the jamb width 230 is a guess.

### Check of the new Bedroom 3 design against the scan

Only the south end could be checked. The east bedside cabinetry (457 mm deep) stands against the 578 mm of wall and
column left at the east end of the room line, so it does not reach the opening; the overhead run stops 150 mm short of
the room line. The west chest and the doors could not be checked. The AC was not seen. No clash found; nothing moved.

### Fan

Not found. The ceiling was scanned at a grazing angle from the balcony and shows no rosette, hub or blade shadow, and
no gap where a running fan would hide the ceiling. It needs a tape (OPEN_ITEMS A16). Nothing was added to any
lighting file.

### Existing electrical points (balcony only)

On the balcony's west end wall (x 1,538, facing east), measured from the room line into the balcony: a small geyser at
525-805, 2,030-2,500 high; two plates at 465-535 and 295-395, about 1,700-1,800 high; one plate on the jamb at the room
line (-35 to 135), about 1,470-1,570 high. Two small fittings under the outer window at about 940 high, purpose unknown.

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

Bedroom 3's window is drawn with the same builder on the balcony's outer wall, as two sliding panes with a light
frame. It has no shutters, nets or screen recorded: nothing has been decided for it, and the scan shows an ordinary
sliding window. If the owner wants the same treatment there, the same fields can be added to `outerWindow`.

## 3. Checks run

- `npm test`: see the commit message / lead report for the exact count; the only failures are the seven known
  "Windows: ..." launcher tests.
- `npm run build`: passed (existing large-chunk warning).
- Screenshots (`scripts/room-shots.cjs` on port 5182): Bedroom 3 Overview, Top, Balcony opening + window; Drawing Room
  Overview, Top; Whole home 3D. Reviewed by eye; they are smoke evidence, not approved baselines.

## 4. Not verified

- Anything about Bedroom 3 outside the balcony: doors, the bay's depth and height, the fan, the AC, the ceiling height.
- The real wood shade, the exact top-band height, the net cassette position, and the window frame construction.
- Blender exports, the archviz pipeline and the Bedroom 3 stills were not regenerated.
