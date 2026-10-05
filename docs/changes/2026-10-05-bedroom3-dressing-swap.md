# Bedroom 3: the dressing cabinet moves to the south side (2026-10-05)

## What you asked

"In room 3 swap the place of dressing, move it to south side; in place of dressing show full depth cabinet till ceiling."

## What changed

The two cabinets on the east wall have swapped jobs. The mirror dressing cabinet now stands at the south end of the east
wall, beside the balcony window. At the north end, where the dressing used to be, there is now a storage cabinet that
goes from the floor to the ceiling. The bed, the headboard shelf and the slatted AC cover above the bed have not moved.

All sizes are in millimetres. "From the north wall" is measured along the east wall.

| Part | Before | After |
| --- | --- | --- |
| North unit | mirror dressing cabinet, 750 wide x 457 deep x 2,200 high, from 150 to 900 off the north wall, mirror 580-2,130 | full-height storage cabinet, 750 wide x 457 deep x 2,700 high (floor to ceiling), same place (150 to 900) |
| South unit | low cabinet with two drawers, 750 wide x 457 deep x 600 high, from 2,826 to 3,576 | the mirror dressing cabinet, 750 wide x 457 deep x 2,200 high, mirror 580-2,130, two drawers below the mirror, same place (2,826 to 3,576) |
| Overhead cupboards | 3,426 long, from 150 to 3,576, 2,200-2,650 high, 4 doors | 2,676 long, from 900 to 3,576 (they now start where the tall cabinet ends), 2,200-2,650 high, 3 doors (1 north of the AC cover, 2 south of it) |
| AC cover, headboard shelf, bed | unchanged | unchanged (AC cover centred 1,863 and 1,200 wide; shelf at 1,650; bed centred 1,863) |

The gap between each cabinet and the bed stays 48.5 mm.

The storage cabinet has a pair of solid doors up to 2,200 and a pair of loft doors above that, on the same line as the
bottom of the overhead cupboards. Inside it has shelves at 400, 800, 1,200 and 1,600. The model's ceiling is 2,700, but
the phone scan read about 2,770, so the carpenter should allow a filler at the top and scribe it to the real ceiling.

## "Full depth": what I chose

I kept the storage cabinet at the same 18 inch (457 mm) depth as the rest of the east cabinetry, which is your decision of
2026-10-03. Its depth is now its own setting, so it can be changed without touching the other units. A deeper 24 inch
(610 mm) wardrobe-depth cabinet would leave only about 48 mm between its front and the toilet door frame (the frame is at
3,305 from the west wall), which is too tight to walk past comfortably. At 457 mm the gap is about 201 mm. The app's check
now flags anything under 100 mm.

## What moved with the dressing

- **The dressing light.** The 12 W down light over the dressing spot moved from ceiling track 1 (north) to track 2
  (south). It sits at 3,300 from the west wall and shines straight down on the standing spot in front of the mirror. With
  that light added, track 2 draws 53 W, which is more than 80% of a 60 W driver. So track 2 now has a 100 W driver
  (53% loaded) instead of a 60 W one. Track 1 keeps its 60 W driver and now draws 34 W. The track runs themselves did not
  move. They still clear the plaster mouldings, the fan blades and the cabinets, and the reading lights still pass their
  checks. Track 1 still runs to 3,350, but nothing hangs on its last 370 mm now; it could be shortened later.
- **The dressing socket.** Before, it shared the board by the toilet door. That board (B3-N2) now holds only the toilet
  switches and the geyser switch. A new 6/16 A socket, B3-S1, is on the south wall under the balcony window sill, 750 mm
  high and 3,256 from the west wall. That is 250 mm west of the dressing cabinet's front, beside where you stand. It is on
  the power-socket circuit. The electrical plan (docs/ELECTRICAL_PLAN.md) has been updated: 12 points, about 4,505 W
  connected load (was 11 points, 4,465 W).
- **The mirror button** on the Bedroom 3 page and in Whole home 3D is now called "Open dressing mirror (south-east)". It
  opens the mirror door of the south cabinet.
- **Estimates.** The Bedroom 3 cabinetry estimate went up from Rs 63,500-1,01,000 to Rs 82,000-1,28,000: a full-height
  cabinet costs more than a low one, and the overhead cupboards are shorter. The Bedroom 3 track lights went up by about
  Rs 1,000-1,500 for the bigger driver.

## What the checks found

A new check (src/domain/bedroom3EastCabinet.mjs) looks at the doors, the standing spot, the toilet door and the window.

- **The mirror door opens freely.** It is hinged on its north edge. When open, it stands beside the bed, 66 mm clear of
  it, and 873 mm away from the window wall. If it were hinged on the south edge instead, it would stand 159 mm in front of
  the window when open, so the north edge is the default.
- **You can stand at the mirror.** The standing spot is 650 mm deep in front of the mirror. It is clear of the bed, and it
  is 151 mm east of the path through the balcony door (the door is at 2,005-2,705).
- **The storage cabinet clears the toilet door.** Its front is about 201 mm east of the toilet door frame, and both of its
  doors can open without hitting the walls or the bed. But when its north door stands open, it reaches 156 mm into the
  line of the toilet doorway, about 160 mm out from the north wall. You would shut it to walk through. A single door hinged
  on the bed side would avoid this, but a single door 714 mm wide and over 2 m tall is heavy, so I kept the usual pair.
- **The dressing cabinet stands in front of part of the balcony window.** This could not be avoided at the position you
  asked for. The window runs to 3,705 from the west wall, but the 457 mm deep cabinets start at 3,506. So the
  2,200 mm high dressing cabinet stands 150 mm in front of the east 199 mm of the window, from the sill (920) up to 2,200.
  That is about a fifth of the window's width; part of it is the aluminium frame. The old 600 mm low cabinet was below the
  sill, so this is new. The overhead cupboards were already in front of the top light there (2,200 to 2,360) before this
  change. You have two choices:
  1. Accept it. It shades a narrow strip at the east edge, and that part of the window will be hard to reach for cleaning.
  2. Make the dressing cabinet no more than about 258 mm deep, so that it clears the window completely. You would lose
     shelf depth behind the mirror.
  Making the cabinet narrower would not help: the overlap comes from its depth, not its width.

## Not verified

- Nothing here was measured on site. The cabinet sizes are model sizes. The window's east edge (3,705) and the solid wall
  beyond it (258 mm) come from the phone scan of 2026-10-04.
- How the balcony window opens is not recorded (sliding or hinged). If its east panel slides or opens, check that the
  dressing cabinet does not stop it, and that the latch can still be reached.
- The real ceiling height (scan: about 2,770) and whether the ceiling is level over the storage cabinet.
- Whether the wall under the window sill is solid masonry that can take the B3-S1 socket box, and that the sill does not
  project over it.
- The door, drawer and shelf layout inside both cabinets is a proposal for the carpenter, not a design.
- The screenshots on the Bedroom 3 page and in Whole home 3D were looked at, but they are smoke checks, not approved
  visual baselines.

## For the lead: things I did not edit

- docs/CURRENT_STATE.md, section "Bedroom 3 east bedside cabinets": should now say the north unit is a full-height storage
  cabinet (750 x 457 x 2,700, depth a field of its own), the south unit is the mirror dressing cabinet (750 x 457 x 2,200,
  mirror door hinged north), the overhead run is 900-3,576 (2,676 long, 3 doors), the dressing light is on track B2
  (100 W driver), and the dressing socket is B3-S1. Record the window finding above.
- work-plan/OPEN_ITEMS.md: add an owner decision on the dressing cabinet in front of the east 199 mm of the balcony window
  (accept, or a cabinet no deeper than about 258 mm), and a site item for how the window opens.
- work-plan/plan.json wording outside the cabinetry task (I only changed that one task's detail, plus what the generator
  wrote): "lights-track-bedroom3" still says "two 60 W drivers" (now one 60 W and one 100 W); "lighting-plan-bedroom3"
  still describes the dressing down light on track 1 (now on track 2: track 1 34 W, track 2 53 W); and
  "bedroom3-cupboard-remove" says the mirror dressing cabinet replaces the corner cupboard (it is now the full-height
  storage cabinet).
- src/config/acPlanConfig.js, Bedroom 3 `tall: []`: the full-height storage cabinet (z 150-900) could be listed there. It
  stands 448 mm north of the existing AC unit, outside the 150 mm side zone, so it would pass. I left the file alone because
  you are editing it.

## Later the same day: the two cabinet depths (owner)

The owner settled the two open points: "make this one cabinet about 258 mm deep, reduce the depth of the mirror cabinet;
increase the depth of the north-east cabinet so that it matches the wall".

| Cabinet | Depth before | Depth now | Why |
| --- | --- | --- | --- |
| Mirror dressing cabinet, south end | 457 mm | 258 mm | it stops at the east edge of the balcony window, so it no longer stands in front of the glass |
| Storage cabinet to the ceiling, north end | 457 mm | 658 mm | it fills the whole wall between the east wall and the toilet door, its side in line with the door jamb |

The overhead run keeps its 457 mm depth, so over the dressing cabinet it overhangs by about 200 mm. It still crosses the
top 160 mm of the window's east end (2200 to 2360), as it did before the swap.

What had to follow:

- **Toilet switches:** they were on the 200 mm of wall between the toilet door and the cabinet. That wall is now behind
  the cabinet, so they moved to the west side of the toilet door (north wall, 2375 from the west wall, 1200 high), and
  the door is taken to latch on that side.
- **North ceiling track:** it ended 3350 from the west wall, which is now inside the deeper cabinet. It ends at 3150,
  155 mm short of the cabinet; it is 2.55 m long (was 2.75 m). Its three heads did not move.
- **Dressing socket:** it follows the shallower cabinet, now 3455 from the west wall under the window sill.
- **Standing spot at the mirror** moved 200 mm east with the cabinet front; it is now 350 mm clear of the balcony door path.

To know before building:

- The storage cabinet's side is exactly at the scanned door jamb. A real door has a frame and trim outside the jamb, so
  the carpenter must scribe the cabinet to them on site, or stop a little short.
- Its north door, standing open, reaches 357 mm into the line of the toilet doorway (it was 156 mm with the shallower
  cabinet). Shut it to walk through, or hinge that door on the other edge.
- A 258 mm deep dressing cabinet holds folded items and toiletries, not hanging clothes.
