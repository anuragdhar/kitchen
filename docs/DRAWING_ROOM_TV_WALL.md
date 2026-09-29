# Drawing Room: TV wall and two-sofa layout

Owner brief, 2026-09-29. Live in the app under **Drawing Room -> Editable workspace -> TV wall view**
and in **Whole home 3D -> Editable 3D** (toolbar: *Show TV wall labels*). The Blender model and stills
for this room still show the old layout; they were not regenerated.

All figures are millimetres in the room frame: x from the west wall, z from the north wall, y up.
Everything below lives in `roomShellConfig.js` (`drawing.tvWall`, `drawing.furniture`) and is checked by
`src/domain/drawingRoomLayout.mjs` (`tests/drawing-room-layout.test.mjs`).

## What was asked

- Replace the window seat with a second 3-seater, the same size as the existing one.
- Put the TV on the **north wall**, in a cabinet with a centre cavity for a TV up to 65 inches, about one foot deep.
- Place a Bose Smart Soundbar 300, a Bose Bass Module 500, a landline phone, an intercom and a Wi-Fi router.
  (The first brief said "wireless 500 speaker"; the owner later confirmed the pieces are the Soundbar 300 and the
  **Bass Module 500**, so the Home Speaker 500 was dropped from the plan.)
- Use the references saved in Inspiration for the room.

The entry door on the north wall stays exactly where it is (x 2150-3150). I read "ignore the entry" as
"do not move it", so the cabinet uses the free wall west of it. Change this if you meant otherwise.

## What the two references say

Both are warm cream plaster, cream 3-seaters with terracotta cushions, dark carved-wood panels on the
wall, a dark wood coffee table on a patterned rug, a brass or rattan pendant, and table lamps on small
side tables. Neither has a TV. So the TV wall borrows their language rather than copying a room:
dark walnut cabinet, carved-lattice doors that hide clutter, warm light. The model adds two carved wall
panels above the west sofa, terracotta cushions, a rug and one side table with a lamp.

## The cabinet

2100 wide x 305 deep (one foot) x 2400 high, from the west wall to 50 mm short of the entry door.
Three vertical bands (each column is 280 wide, 244 clear inside):

| Band | x from west wall | Contents (heights from floor) |
| --- | --- | --- |
| West column | 0-280 | One full-height storage door (98-2382) |
| Centre bay | 280-1820 (1540 wide) | Base 98-632: **west half is an open lattice with the Bass Module 500 behind it**, east half a storage door; **open TV bay 650-1700**; header 1700-1740; **ventilated lattice bay 1740-2050 for the router**; storage doors above |
| East column (door side) | 1820-2100 | Storage door 98-882; **open niche 900-1500: landline on the shelf, intercom on the back wall (1150-1380)**; storage door above |

Inside the TV bay: the 65-inch TV (1450 x 830 x 55 with bezel) is centred at x 1050, bottom edge at 730, top at
1560, and set back 60 mm from the cabinet face so the frame hides the bezel. The Soundbar 300
(699 x 58 x 102) stands on the bay floor at 650, in front of the TV's lower edge: its top (708) is under the
TV's bottom edge (730), so it cannot cover the picture.

## Why each device is where it is

- **Soundbar 300:** directly under the TV on the bay floor, centred, open to the room. Nothing in front of it.
- **Bass Module 500 (subwoofer):** in the front of the room next to the soundbar, not at the opposite end.
  Low bass has no clear direction, but a subwoofer behind the listeners makes effects seem to come from behind
  you instead of the screen. It stands on the base deck, west half of the centre base (centre x 665), behind an
  open lattice so it can breathe and be heard. It is 254 x 254 x 241 mm (10 x 10 x 9.5 in, Bose specifications),
  538 mm from the west wall (not in the corner, which would boom), about 385 mm from the soundbar's centre line,
  with 30 mm free in front of it. It talks to the soundbar wirelessly, so it needs only a mains socket.
- **Router:** above the TV bay, on the room's centre line and high, which helps coverage. It sits behind an
  open lattice, not a solid door, so signal and heat pass. Its cables have a short vertical run down to the TV.
- **Landline and intercom:** on the door side of the wall, within a step of the entry, at hand height.
  Intercom on the niche back wall at 1150-1380; landline base on the shelf at 900.
- **Everything else stays hidden** behind the lattice doors: set-top box, cables, chargers, remotes.

## Seating

| Item | Before | After |
| --- | --- | --- |
| West 3-seater | centre (580, 2420), 880 x 2250, faces east | **unchanged** |
| South seating | window seat (1650, 5045), 2150 x 510 x 450 | **3-seater (1140, 4810), 880 x 2250, faces north** (identical size to the west sofa) |
| Coffee table | (1745, 2420), 650 x 1100 | (1750, 3300), between the sofas |
| Chandelier (live model) | over the old table | moved with the table |
| Old TV | 55-inch on a swivel arm, east wall | removed |

Clearances (all checked in the test): west sofa to table 405, south sofa to table 520, gap between the two
sofas 825, and the walk from the entry door down the east side to the partition opening stays clear
(table ends at x 2075, south sofa at 2265; the door opening starts at 2150 and the partition opening is at the
east wall from z 2058).

## Viewing (computed, not measured)

- **South sofa:** 4.62-4.70 m from the TV, within 10 degrees of straight on. Good angle. A 65-inch 4K set is
  usually comfortable from about 2-4 m, so this is at the far end; text and fine detail will be smaller.
- **West sofa:** 1.6-3.0 m away but **72-81 degrees off its facing direction**, i.e. people turn their heads
  almost sideways. It suits conversation, not long viewing.

If TV watching from the west sofa matters, the options are (a) turn that sofa about 30-40 degrees toward the
TV, (b) use a full-motion arm in the bay (limited by the 305 depth), or (c) accept it as guest seating.
None of these was applied; the brief said to keep the west sofa.

## Things to confirm before building

- **Wall depth:** the cabinet is 305 deep by request. That is a cabinet, not a recess; it is not cut into the wall.
- **Window:** the south sofa's back (about 850 high) is in front of the lower part of the window (sill 550).
- **Power and data (suggestion, needs an electrician):** two mains sockets and an HDMI/ARC lead in the TV bay,
  one socket each for the soundbar, the Bass Module compartment and the router bay, a data cable from router bay to TV bay,
  phone and intercom cable ends in the east niche. Keep mains and low-voltage runs apart. Not modelled.
- **Ventilation:** TV bay and router bay are open at the front; keep them that way.
- **Device sizes:** Soundbar 300 is 698.5 x 57.1 x 101.6 mm (Bose specifications, via web search); a 65-inch
  16:9 screen is about 1439 x 809 mm. Check the exact TV model's outer size and depth before fixing the bay.

## Not done

- Blender model and stills for the Drawing Room were not regenerated.
- The Materials panel does not recolor the new cabinet, sofas and table: they are intentionally left
  untagged so they keep the dark walnut of the references.
- No visual regression baseline exists; the new view was checked by eye in a software-rendered browser.
