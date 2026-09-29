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

## Alternative layout B: corner sofas, TV on the east wall

Requested afterwards: one sofa against the north wall, one against the west wall, a table in front, the TV
across from them, and a small cabinet on the north wall for the router and phones. Both layouts are built into
the model. Switch with the **Layout** list in the Drawing Room workspace or in Whole home 3D (B2, below, is shown first). Config: `roomShellConfig.js` `drawing.cornerLayout`; checks: `checkCornerLayout` in `drawingRoomLayout.mjs`.

Where things go in B (millimetres, room frame):

| Item | Position |
| --- | --- |
| North sofa (faces south) | centre (1155, 500), 880 x 2250; back on the north wall |
| West sofa (faces east) | centre (580, 2165), 880 x 2250; 100 mm south of the north sofa, forming an L |
| Coffee table | (1745, 1900), 400+ mm from both sofas; rug under the L |
| 65-inch TV | wall-mounted on the east wall, centred 1080 from the north wall (355-1805), bottom edge 730; sticks out 90 mm |
| Soundbar 300 | on the wall under the TV, 20 mm below it, sticks out 102 mm |
| Bass Module 500 | on the floor under the TV, centre 1560 from the north wall, 100 mm off the wall |
| Router bay | recessed flush into the north-wall storage opening above the north sofa (see `docs/ENTRY_WALL_CAVITY.md`), x 500-1600, 1450-2100 high, 250 deep: router (open lattice) / landline / intercom |

The TV must stay on the solid part of the east wall: the wall is solid only from the north wall to z 2058,
after which the folding partition opens to the lobby. That leaves a 355 mm gap between the TV and the door wall
and 253 mm to the end of the solid wall.

### Layout A against layout B (computed, not measured)

| | A: TV on north wall | B: corner sofas, east-wall TV |
| --- | --- | --- |
| Best-placed sofa | south sofa, 4.62-4.70 m, 1-10 degrees off straight | west sofa, 2.7-3.2 m, 7-35 degrees off (centre seat 2.9 m, 22) |
| Other sofa | west sofa, 1.6-3.0 m but 72-81 degrees off | north sofa, 1.4-2.9 m but 66-78 degrees off |
| Distance for a 65-inch | too far (aim for about 2-3.5 m) | right |
| Entry door (opens INTO the room) | swing zone is clear | clear (see "Entry door swing" below); the walking lane passes the TV |
| Walking lane past the TV | not applicable | 943 mm (north sofa to TV), 1153 mm (table to TV), 902 mm at the Bass Module |
| Sofa vs entry door | clear | the north sofa end passes the door jamb line by 130 mm but clears the swing (owner confirmed) |
| TV vs door edge | not applicable | TV front is only 73 mm beyond the door's east edge line |
| Soundbar and Bass Module | in the cabinet, beside each other | soundbar on the wall, module on the floor below |
| Router and phones | in the cabinet | in the small cabinet above the north sofa |

What to know about B:

- **Correction (2026-09-30):** an earlier version of this note said the entry door swings out into the Main Entry, taken
  from the floor-plan drawing. The owner says it opens INTO the Drawing Room, so the sofa placement in B was wrong; see
  "Entry door swing" below.
- **The walking route** is unchanged: everyone who comes in walks down the strip between the north sofa and the east
  wall, past the TV and across the west sofa's line of sight.
- **The 2250 mm north sofa is 130 mm longer than the wall it sits on** (the free stretch is 2150 mm to the door edge), and
  with an inward-opening door that is a real conflict, not just a tight fit.
- **The small cabinet is above sofa-back height.** Its bottom edge is 1450 mm so seated heads clear it; the phones
  and intercom are therefore standing-height, not sit-and-reach.
- **Only one sofa can face the TV in either layout**; two sofas at right angles cannot both point at one screen.
  A puts the good seat at the far end of the room; B puts it in the right distance range but beside the walkway.
- Both layouts share the same entry door, east opening, window, sofa size and 65-inch TV.

## East wall options after choosing layout B (2026-09-30)

Chosen direction: layout B, an 18-inch (457 mm) deep unit on the east wall, all devices kept, a 55-inch TV now and
possibly a 65-inch later, a telescopic wall arm, and maybe a ceiling projector once the current TV dies. Pick them in the
**Layout** list (B2 is shown first): *B2 low 18-inch console + arm TV* and *B3 (future) ceiling projector*. Checks:
`checkCornerConsole` and `checkCornerProjector` in `drawingRoomLayout.mjs`, tests in `tests/drawing-room-console.test.mjs`.

### 1. Floor-to-ceiling 18-inch cabinet: does not fit here

| | Value |
| --- | --- |
| East-wall unit front with 457 mm depth | x 2856 |
| Walkway beside the north sofa (its east end is x 2280) | **576 mm** (needs 800+) |
| Deepest unit that still leaves an 800 mm walkway there | 233 mm |
| Wall clear of the north sofa (z 960 to the end of the solid wall, 2058) | 1098 mm |
| TV bay needed: 55-inch / 65-inch | 1310 mm / 1530 mm |

So a tall unit either blocks the entry walkway or is too short to hold a TV. The wish behind it, hidden cabling, is met
differently: a recessed in-wall conduit and outlet box behind the TV, running down to the console (an electrician job;
not modelled).

### 2. Option B2: low 18-inch console with a telescopic wall arm (fits)

- Console: 457 deep x 500 high x 1080 long, z 960-2040 on the solid east wall, just south of the north sofa. It holds the
  Bass Module 500 (in an open-lattice bay at the north end, so it can be heard) and a lattice-fronted storage door for the
  set-top box, cables and chargers. The Soundbar 300 stands on top. Walkway between the console and the coffee table: 811 mm
  (the corner-layout coffee table is 600 wide, not 650, to make this work).
- TV on a full-motion arm, centred z 1300, bottom edge 650. The 55-inch (1230 x 710) fits now; the 65-inch (1450 x 830)
  fits the same wall later (z 575-2025, 33 mm spare). Use the **TV size** button to see both.
- Router, landline and intercom stay in the small cabinet above the north sofa (router higher is better for Wi-Fi; it
  could go in the console if you prefer, at some cost in coverage).

### 3. Does the arm help the sofa on the side? Not for neck strain

| 55-inch TV | Flat on the wall | Pulled out 200 mm, turned 10 degrees north |
| --- | --- | --- |
| North sofa: head turn (angle off the way the sofa faces) | 69 | 68 |
| North sofa: picture seen off-axis | 21 | 12 |
| West sofa: head turn | 18 | 20 |
| West sofa: picture seen off-axis | 18 | 30 |
| Walkway between the TV and the coffee table | 1188 mm | 885 mm |

- The north-sofa viewer must still turn their head about 69 degrees: pulling the TV forward barely changes the direction
  they look in. Only turning the sofa itself would.
- Turning the TV toward the north sofa gives that sofa a better picture but worsens the west sofa's (18 to 30 degrees), so a
  small turn (about 10 degrees) is the compromise.
- At full arm reach (450 mm) the walkway falls to about 640 mm, so the arm must be folded when people walk through.
- If the north sofa matters, the fix is a swivel armchair at its east end that can turn toward the TV, not the arm.

### 4. Option B3 (future): ceiling projector and drop-down screen

- Screen: 80-inch 16:9 (1771 x 996), bottom edge 700, centred z 1029. It is the widest that leaves 140 mm either side on the
  solid wall; a 92-inch screen (2037 wide) does not fit.
- Projector: throw ratio 1.2 puts it 2125 mm from the wall, hanging 200 mm below the ceiling, over the open floor between
  the west sofa and the coffee table; a shorter throw ratio moves it toward the wall. It needs a power and HDMI or network
  run to the ceiling. A projector picture is visible from wide angles, so the side-sofa picture problem goes away, but
  the neck turn does not.
- Kept from B2: the console (soundbar on top, Bass Module inside) and the router and phones bay, now recessed into the wall storage opening.
- Daylight matters: this room has a large south window, so plan blackout curtains or an ambient-light-rejecting screen.

### 5. The ten-year-old TV

Nothing has to be replaced now. Build B2 with the 55-inch on the arm; when the TV wears out, choose a 65-inch on the same
arm (the bay already allows it) or move to the projector. The console, the soundbar spot, the Bass Module bay and the router
cabinet serve all three.

## Entry door swing (the door opens INTO the room)

The door is 1000 mm wide in the north wall (x 2150-3150) and opens INTO the room. The floor-plan drawing shows the swing on
the entry side, so it is not trusted for this. The red zone in the model shows the sweep (**Hide/Show entry door swing**).

**What is settled (owner, 2026-09-30):** the north-wall sofa (2250 x 880, x 30-2280, z 60-940) does not touch the door.
Working backwards, that is only possible with the hinge on the **east** jamb (the one nearest the TV wall, as the plan draws
it) and a leaf no wider than about **855 mm**: with a west hinge the sofa arm stops the door for any leaf width, and a 950 mm
leaf (my first assumption) would clip the arm after 3 degrees. The model records `hinge: 'east'`, `hingeKnown: true` and
`leafMm: 850`; the leaf width is a working value, so **measure the real leaf** to confirm. An earlier version of this note
recommended shortening both sofas to 2100 mm; that is not needed and would waste floor space, so the sofas stay full size.

| Layout | Result (door must open at least 85 degrees, east hinge, 850 mm leaf) |
| --- | --- |
| A: TV cabinet on the north wall | clear; the cabinet ends at x 2100, 50 mm short of the leaf |
| B, B2, B3: north-wall sofa (x 30-2280) | clear: the leaf tip starts 20 mm from the sofa arm and moves away as the door opens |
| B2 console (x 2856-3313, z 960-2040) | clear: the fully open leaf ends 10 mm short of its north face |
| B2 with the TV arm pulled out | the TV stops the door at 63-70 degrees: fold the arm flat before opening the door |
| B, wall-mounted TV | the fully open leaf ends about 73 mm from the TV front |

If the measured leaf turns out wider than 855 mm (or the hinge is on the west), the north sofa will hit it. The fallbacks,
already checked in the tests, are: shorten both corner sofas to 2100 mm; or a sliding or pocket door; or re-hang the door to open
outward. `maxLeafThatClears` in `drawingRoomLayout.mjs` computes the limit for any furniture rectangle.

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
