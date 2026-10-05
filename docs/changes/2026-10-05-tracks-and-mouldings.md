# Track lights against the plaster work that is really on the ceilings (2026-10-05)

## In short

The phone scans show plaster mouldings on the Drawing Room, Lobby and Bedroom 3 ceilings that the track plan had
ignored. A surface track cannot be screwed flat across a raised moulding. All six track runs in those rooms were on, or
ran through, a moulding. Each has now been moved or shortened so it sits on flat ceiling. **No run crosses a moulding
any more, so no spacers and no cutting of plaster are needed.** No furniture, fan or chandelier was moved. The mouldings
are now drawn on the ceilings of the three room pages and in Whole home 3D, so you can see the tracks against them.

## What is on each ceiling

All three ceilings have the same pattern, working in from the wall:

1. a flat painted border along each wall (orange in the Drawing Room, pink in Bedroom 3, cream in the Lobby). It is
   flat, so a track could sit on it;
2. a raised plaster line, 60 to 80 mm wide, about 350 to 450 mm in from the wall;
3. in each corner, a plaster ring about 300 mm across with a leaf beside it, reaching 740 to 960 mm in from the walls;
4. round medallions at the ceiling points.

Measured from the scans on 2026-10-05 (ceiling pictures at 4 mm per pixel, and height and colour profiles every 20 mm).
All distances are from the wall named, in millimetres.

| Room | Moulding line: north / east / south / west | Corner rings reach: north / east / south / west | Medallions (centre from the west and north walls, width) |
| --- | --- | --- | --- |
| Drawing Room | 350-430 / 350-420 / 370-450 / 370-440 | 770 / 770 / 800 / 770 | chandelier (1600, 2705) 830; north fan (1650, 1290) 330; south fan (1580, 4075) 350 |
| Lobby / Dining | 390-450 / 450-520 / 370-440 / 580-640 | 770 / 820 / 790 / 960 | centre, probably the fan (2605, 1600) 810; domed light (3770, 1615) 440 |
| Bedroom 3 | 360-430 / 380-450 / 380-450 / 440-520 | 740 / 780 / 750 / 800 | fan (2030, 1820) 760 with its outer ripple rings |

In the Lobby the west figures are larger because the beam between the Lobby and the Drawing Room takes the first 215 mm.
Lobby positions "from the west" are in the app's frame, which starts 40 mm east of the Drawing Room face of that beam
(the scan document measures from that face: 2645 and 3810).

Accuracy: edges are good to about 20-30 mm (the faint rings on the west side of the Lobby to about 50 mm). **How far the
plaster stands down from the ceiling could not be measured**: the scan shows only 5-8 mm, but a phone scan smooths small
relief, so 15 mm is assumed. It does not change any position; it would only matter if a track ever had to bridge one.

## The rule now checked

The centre line of every track, and of every lamp head's base, must be at least 40 mm from the edge of any moulding
(11 mm for half the track, about 9 mm for a fixing clip, 20 mm for scan accuracy). If a run cannot avoid a moulding it
must say, in the config, which moulding it crosses and how (stand-off spacers bridging it, or the moulding cut and made
good); a crossing without a method fails the check. One smaller rule was added: a wall spot must be within 1000 mm of the
wall it lights. All the older rules still hold: 300 mm off the walls, 50 mm from fan blades (300 mm for heads that shine
down), reading heads onto their seat or bed with at most 35 degrees of tilt, each driver loaded to 80 % at most.

## What moved

| Run | Before | After | Why | Now clear by |
| --- | --- | --- | --- | --- |
| Drawing Room, Track 1 (TV wall) | 440 from the north wall, from 300 to 2300 from the west wall; spots at 700 / 1300 / 1900 | 540 from the north wall, from 820 to 2320; spots at 920 / 1420 / 1920 | at 440 it lay on the inner edge of the north moulding, and its west end ran through the north-west corner ring | 110 from the moulding, 50 from the ring, 150 from the north fan's blades |
| Drawing Room, Track 2 (west sofa) | 640 from the west wall, from 2000 to 4700 from the north wall; last reading head at 4600 | same line, from 2000 to 4450; last reading head at 4410, tilted about 8 degrees to light the same seat | its south end and last head were inside the south-west corner ring | 85 from the ring, 200 from the west moulding, 340 from the south fan's blades |
| Lobby, L1 (south wall) | 537 from the south wall, from 2100 to 4700; soft heads at 3700 / 4300 | same line, from 2100 to 4100 (a standard 2 m length); soft heads at 3550 / 3930 | its east end ran through the south-east corner ring and across the east moulding | 73 from the ring, 97 from the south moulding |
| Lobby, L2 (ironing storage) | 943 from the east wall (x 4050) | 893 from the east wall (x 4100) | it was only 60 mm from the rosette of the domed light | 110 from the rosette, 73 from the north-east ring, 50 from the north moulding |
| Bedroom 3, B1 (north side) | 650 from the north wall, from 300 to 3350 | 820 from the north wall, from 600 to 3350 | it crossed the west moulding and ran through both north corner rings; the dressing light sat on the north-east ring | 80 from the rings and the west moulding, 400 from the fan blades |
| Bedroom 3, B2 (south side) | 626 from the south wall, from 300 to 3350 | 820 from the south wall, from 600 to 3350 | the same, at the south corners | 70 from the rings, 80 from the west moulding, 486 from the fan blades |

Track lengths: Drawing Room 2.0 + 2.7 m became 1.5 + 2.45 m; Lobby 2.6 + 1.5 m became 2.0 + 1.5 m; Bedroom 3 3.05 + 3.05 m
became 2.75 + 2.75 m. The number of heads, the watts, the lumens and the drivers are unchanged in every room.

Why these positions and not others:

- **Drawing Room Track 1** could go outboard (on the painted border, at most 310 mm from the wall) or inboard. Inboard
  is better: the spots wash the TV panelling from a more useful angle, and at 540 it would still clear the north fan by
  the 50 mm rule even if the fans turn out to be 1400 mm wide, not the assumed 1200. The usable strip is only 470 to 640
  mm from the wall (moulding on one side, fan blades on the other).
- **Drawing Room Track 2** cannot move further into the room to get past the corner ring: its reading head beside the
  south fan would then be 177 mm from the blades (300 is needed, or the light flickers). So it stops short of the ring
  and the last head is aimed.
- **Bedroom 3**: moving both runs 820 mm off their walls takes them inboard of the corner rings with every head kept. The
  reading heads now tilt about 19 degrees instead of 24. Keeping the old lines and shortening them instead would have
  lost the dressing light and one wardrobe spot.
- **Lobby L2** at 4100 is the position that stays clear of both the rosette and the corner ring whichever wall the scan
  positions are measured from (see "Not verified").

## What crosses a moulding, and how

Nothing. If a later change forces a crossing, the config field is `crossings` on the run, and the check will insist on a
stated method. The usual methods would be 10-15 mm stand-off spacers either side so the track bridges a low moulding, or
cutting the moulding for the width of the track and making the ends good.

## Lobby: the fan and the dining pendant

- **Fan.** The centre medallion (810 mm across, with a dark hub and rod) is now modelled as a ceiling fan marked
  "probable, from the scan", with the same assumed 1200 mm blades as the other rooms, and it is drawn. Both tracks are
  well clear of it: L1 by 540 mm, L2 by 895 mm.
- **Domed light.** The small rosette 1165 mm east of the fan carries a domed ceiling light today. L2 passes 110 mm from
  its rosette. The plan does not say whether that light stays; it is listed below.
- **Dining pendant.** The pendant is drawn over the table, 2200 from the west wall and 620 from the north wall. There
  is **no ceiling point there**. The two real points are on the centre line of the room, about 1600 from the north wall;
  the nearer one is the fan's own medallion, 1060 mm away, and the fan occupies it. Three things follow:
  1. the pendant needs a new ceiling point over the table (a new feed, run on the surface or in the plaster, since
     the slab cannot be chased), or it has to hang as a swag from a hook over the table with its cable looped across
     from the domed-light point 1860 mm away, which would look poor;
  2. its long bar canopy (750 mm, as drawn) would lie across the north moulding, so it cannot be fixed flat either. A
     single round canopy up to about 200 mm at the same spot sits on flat ceiling, 70 mm inboard of the moulding;
  3. it is beside the fan. Looking straight down, the canopy is 101 mm and the pendant body 22 mm outside the circle the
     blades sweep. The body hangs 670 mm lower than the blades, so nothing touches, but a 1400 mm fan would reach the
     canopy, and the pendant will sway in the draught.
  The dining table was not moved and the pendant is still drawn as before. The decision is yours: see the list below.

## Bedroom 1, the Study and the Kitchen

Their ceilings have not been scanned, so nothing was added or moved there. **Their tracks carry the same risk.** If those
ceilings have the same border and corner rings, these would be affected: Bedroom 1 track 1 starts 300 mm from the north
wall (through a corner ring and the north moulding) and track 2 ends 190 mm from the south wall (across the south
moulding); Study track 1 starts 300 mm from the west wall and ends about 340 mm from the east wall, and track 2 ends
about 410 mm from the south wall. The Kitchen's one track runs down the middle of the room, so only its two ends
could meet a border. A ceiling photo or scan of each room will
settle it. (Bedroom 1 is also being redesigned by another
piece of work at the moment.)

## Defaults chosen without asking

- 40 mm clearance from a track's centre line to any moulding edge.
- 15 mm assumed plaster projection (drawn; no position depends on it).
- Corner rings treated as the whole square they and their leaf occupy, not as exact circles. In the 3D they are drawn
  as a circle filling that square, so they look a little larger than the real rings.
- Prefer inboard flat ceiling over the painted border, and prefer shortening a run over bridging a moulding.
- Lobby fan and rosette positions taken as 40 mm less than the scan document's figures (app frame).
- Bedroom 3: the allowance for the fan being somewhere else was 400 mm around the room centre while the fan was only
  assumed. The scan has since found it, so the allowance is now 150 mm around the scanned point.
- Mouldings are drawn in every Drawing Room seating layout, because the ceiling does not depend on the seating. The
  painted border colours are not drawn.

## Not verified

- Nothing was taped. All moulding positions come from one phone scan per room.
- The plaster projection (assumed 15 mm).
- Fan blade sizes and drops (assumed 1200 mm and 300 mm everywhere), and that the Lobby medallion really carries a fan.
- The room sizes disagree between scan and app: the Drawing Room is 3150 x 5276 in the scan and 3353 x 5335 in the app;
  the Lobby is about 130 mm wider in the scan; Bedroom 3 is 48 and 61 mm smaller in the scan. Mouldings are stored by
  their distance from each wall, and medallions from the west and north walls. Clearances near the east and south ends
  (Track 1's east end, Track 2's south end, L1's east end, L2) could therefore be up to that much different on site.
  Track 2's south end is the tightest: measured from the north wall of the real, shorter room it would be 26 mm from
  the south-west ring, not 85. Set the runs out on site from the mouldings themselves, not from these numbers.
- The 3D views were checked by eye on the Drawing Room (Overview, Top, North wall view), Lobby and Bedroom 3 (Overview,
  Top) pages and the default Whole home 3D view; these are screenshots looked at, not approved visual tests. The Blender
  views and renders were not rebuilt and do not show the mouldings or the moved tracks.

## For the work plan

Open items to add (the owner of the work plan files will number them):

- Tape the ceiling mouldings in the Drawing Room, Lobby and Bedroom 3: distance of the raised line from each wall, how
  far the corner rings reach, and how far the plaster stands down from the ceiling.
- Lobby dining pendant: there is no ceiling point over the table. Decide between a new point with a small round canopy,
  moving the pendant, or a different fitting. Related: does the fan stay at the centre medallion, and what is its blade
  size (C22)?
- Lobby domed ceiling light on the small rosette: keep, remove, or reuse the point?
- Bedroom 1, Study and Kitchen: photograph or scan the ceilings; if they have the same mouldings, their tracks need the
  same treatment (C23, C25).
- C24 (Bedroom 3 fan) can note that the position is from the scan and only blade size and drop remain.

Tasks to add:

- Electrician: set out every track on site from the mouldings (40 mm clear), using the positions in `docs/LIGHTING.md`.
- Electrician: new feed for the dining pendant once its position is decided.
- If the owner wants the plaster work removed during the repaint instead, the tracks could return to their earlier
  positions; this was not assumed.

## Files

- Config: `react-configurator/src/config/drawingLightingConfig.js`, `lobbyLightingConfig.js`, `bedroom3LightingConfig.js`.
- Check: `react-configurator/src/domain/drawingLighting.mjs` (`mouldingShapes`, `checkTrackLighting`, `pendantCeilingReport`).
- 3D: `react-configurator/src/rooms/drawing/DrawingRoomLighting.js` (`createCeilingMouldings`),
  `react-configurator/src/rooms/shared/RoomTaskLighting.js`.
- Tests: `react-configurator/tests/drawing-lighting.test.mjs`, `lobby-lighting.test.mjs`, `bedroom3-lighting.test.mjs`.
- Docs: `docs/LIGHTING.md` (section "Tracks and the plaster ceiling mouldings").
