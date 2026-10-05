# Bedroom 1: a checked layout, three small changes, and one alternative (2026-10-05)

Nothing in Bedroom 1 is measured on site. The room has not been scanned: its size (3353 x 3240 mm), the doors, the
balcony and the old door's position all come from the A501 floor plan, and the window AC's casing is a typical size.
Everything below is true of the model, and has to be confirmed with a tape before anything is ordered.

All positions are in millimetres, x from the west wall, z from the north wall.

## What was done

1. A check for the room now exists (`react-configurator/src/domain/bedroom1Layout.mjs`). It tests that furniture stays
   inside the room, that nothing stands in a door opening or in a door's swing, that the walkways are at least 600 mm
   (750 is the comfortable figure beside a bed), that the wardrobe doors and the medicine cabinet doors can open, that
   the medicine cabinet can be reached by a standing person, that the balcony opening stays clear, that nothing stands
   in front of the window AC or in its air stream, and that there is a 600 mm way from the lobby door to the washroom
   door, the balcony and each wardrobe.
2. The check was run on the present layout. It found nine problems. Five went away with two small changes (a third small
   change moved the rug); four cannot be fixed without moving the bed, so they are still reported (on the Bedroom 1 page, under the 3D view, and in the
   review brief).
3. One alternative layout was designed and passes every check. It is behind a new button on the Bedroom 1 page,
   "Layout B: bed head on the south wall". The present layout is still the default everywhere, including Whole home 3D.

## Problems found in the present layout

| # | Problem | Status |
| --- | --- | --- |
| 1 | The laundry hamper stood within 600 mm inside the planned lobby door's opening. | Fixed |
| 2 | With the lobby door hinged on its west jamb, it opened only 25 degrees before hitting the hamper. | Fixed |
| 3 | With the lobby door hinged on its east jamb, it opened only 48 degrees before hitting the hamper. | Fixed |
| 4 | The hamper left only 474 mm beyond the foot of the bed. | Fixed |
| 5 | The balcony wardrobe's east door hit the window AC that was added today: the AC's corner is 217 mm in front of the wardrobe, so a 600 mm hinged door opened only 41 degrees. | Fixed |
| 6 | The bed's south side is against the wall. For a bed for two, the person on the wall side has to climb over the other. | Not fixed |
| 7, 8 | Neither door of the medicine cabinet (in the closed old door, x 2381-3201 on the south wall) can open at all: the bed stands in front of the whole cabinet. | Not fixed |
| 9 | The medicine cabinet cannot be reached standing. The nearest place to stand is 1713 mm from it, across the bed. | Not fixed |

The check also noted that the rug lay under the swing of the lobby door (a door catches on a rug); that is fixed too.

Problems 6 to 9 share one cause: the bed lies along the south wall, over the cabinet. No small move solves them. Moving
the bed off the wall would put its head across the balcony opening and into the window AC's air stream; sliding it
west would block the lobby door. That is why an alternative layout was designed.

Things the check notes about the present layout that are not problems but are worth knowing:

- The bed head stands across 484 mm of the balcony opening (1716 of 2200 mm stay clear), so that part of the headboard
  has no wall behind it.
- The headboard is 33 mm to the side of the window AC's air stream. A taller headboard, or the bed 40 mm further
  north, would stand in the stream.
- The balcony chair is 303 mm from the window AC: out of the cold air, but next to the machine's noise.
- The balcony wardrobe is drawn 208 mm deeper than the balcony, so its back sits inside the wall to the Pooja Ghar,
  which the plan draws about 180 mm thick. This was not changed. It needs a look on site: either there is a niche that
  deep, or the wardrobe has to come 208 mm further into the balcony (its front would then be 9 mm from the AC's side)
  or be made shallower.

## What changed, before and after

| Item | Before | After | Why |
| --- | --- | --- | --- |
| Laundry hamper (centre) | x 850, z 2650 | x 250, z 2050 | Out of both possible swings of the lobby door. It now stands on the west wall just south of the wardrobe. |
| Rug (centre; size unchanged, 1200 x 1300) | x 1050, z 2550 | x 1050, z 1650 | Out from under the lobby door's swing (900 mm north). |
| Balcony wardrobe doors | two hinged doors of 600 mm (assumed) | two sliding panels (`doors:'sliding'`) | The window AC stops a hinged east door at 41 degrees. No hinged arrangement clears the AC; sliding panels need no swing. The wardrobe's size and position are unchanged. The drawing of its fronts is unchanged. |

The hamper and rug positions used to be numbers inside the drawing code. They now live in
`src/config/bedroom1LayoutConfig.js`, with the bed's mattress and headboard heights. The bed, the west wardrobe, the
recess wardrobe, the balcony table and chair, the doors and the window AC are exactly as they were.

The Bedroom 1 page also shows the medicine cabinet's doors on the south wall now (they were only drawn in Whole home
3D before), because the layout question turns on them.

## The alternative: layout B, bed head on the south wall

The same bed (1829 x 1524) is turned a quarter turn, so its head is on the south wall and its foot points north.

| Piece | Position | Size |
| --- | --- | --- |
| Bed | x 1150-2674, z 1411-3240, head on the south wall | unchanged |
| Dressing table with wall mirror and stool | north wall, x 1510-2410, between the washroom door and the recess wardrobe | 900 wide, 350 deep, 750 high |
| Bedside table | east of the bed head, x 2694-3094, z 2890-3240 | 400 x 350 x 550 high |
| Hamper | west wall south of the wardrobe, as in layout A | |
| West wardrobe, recess wardrobe, balcony | unchanged | |
| Medicine cabinet | same place; PROPOSED change for this layout: doors start 1250 mm above the floor, fixed panel below | |

What the check measures in layout B:

- Walkway on both sides of the bed: 642 mm on the west (to the wardrobe front) and 679 mm on the east (to the wall).
  Both are above the 600 mm minimum and below the comfortable 750.
- 911 mm beyond the foot of the bed to the stool, 1061 mm to the dressing table; 611 mm stays free behind a person
  sitting at the dressing table.
- The west wardrobe's doors, fully open, clear the bed by 42 mm.
- Either hinge side of the lobby door clears the bed (the bed starts 150 mm east of the door jamb).
- The balcony opening is clear for its full 2200 mm, and the window AC blows across the foot of the bed, not at the
  pillows.
- The medicine cabinet's two doors open fully above the headboard, and a person standing in the east walkway is within
  668 mm of both halves.
- The check reports no problem.

### Recommendation: layout B

I recommend layout B. It removes all four problems that layout A cannot fix: both sleepers get their own side of the
bed, the medicine cabinet becomes usable, the bed head is on a full wall, and the balcony opening and the AC's air
stream are clear. It also gives the room a dressing spot it does not have today, on the only free stretch of wall.

The costs are real and you should weigh them:

- The walkways beside the bed are 642 and 679 mm, not 750. They work, but they are not generous, and they depend on
  the room really being 3353 mm wide. If the room is 100 mm narrower on site, one side drops below 600.
- The open floor in the middle of the room goes. Layout A leaves about 1.7 x 2.8 m clear north of the bed; layout B
  leaves a strip about 1 m deep at the foot.
- The head of the bed is against the lobby wall, partly against the closed old door (a fibre-cement sheet and a
  shallow cabinet). Sound from the lobby and dining table will come through there more than through brick. A layer
  of acoustic board in that infill would help.
- The lobby door opens right beside the bed's west side, so the bed is the first thing seen from the lobby.
- There is a bedside table on the east side only. The lobby door leaves no room on the west side; a headboard with a
  ledge, or a small wall shelf, would serve that sleeper.
- The medicine cabinet has to be built with its doors starting 1250 mm above the floor (above the headboard). The
  lower part becomes a fixed panel or is reached from above.
- The west wardrobe's doors clear the bed by only 42 mm. Sliding doors there would make the west walkway easier, but
  that is a change to a wardrobe that works, so it is left as a suggestion.

If you prefer the open floor and the bed is used by one person, layout A is still workable, but the medicine cabinet
should then move somewhere else: behind the bed it cannot be used.

Two other arrangements were tried on paper and dropped. With the head on the west wall, the bed has to sit between the
washroom door and the lobby door's swing, and the 1800 mm west wardrobe is lost with nowhere to rebuild it. With the
head on the north wall there is no free stretch wide enough (1087 mm between the washroom door and the recess
wardrobe).

### The balcony

In both layouts the balcony keeps what it has: the wardrobe on the Pooja wall, the window AC in the east glazing, and
the small table and chair at the north end. The table is a fair place to sit in the morning with the AC off. With the
AC running it is a noisy seat, which is one more reason for the dressing table inside the room in layout B. I did not
remove the table and chair.

## Lighting

`bedroom1LightingConfig.js` is not changed and its test still passes for the default layout.

If layout B is built, track 1 (along the wardrobe) stays where it is. Track 2 (over the bed) turns: instead of
running north-south 753 mm from the east wall, it runs east-west, 720 mm from the south wall, from x 1300 to x 2520,
with a reading head over each sleeper (x 1560 and x 2264) and a spot on the headboard wall between them. It is 720 and
not 750 mm so that the reading heads stay 300 mm clear of the fan's blades; the fan is still assumed at the room centre.
The Bedroom 1 page draws this turned track when layout B is on; the two dimmer sliders are wired to it but were not tried on screen. The replacement
run is recorded in `bedroom1LayoutConfig.js` and passes the same lighting check.

## Defaults chosen (no questions were asked)

- The lobby door (planned civil work) opens into the bedroom; both hinge sides are tested; its leaf is as wide as the
  opening (900 mm).
- The washroom door opens into the washroom. If it opens into the bedroom instead, nothing in either layout is in its
  way.
- Hinge sides of the room wardrobes are not decided, so the whole strip a door can sweep must be clear.
- Minimum walkway 600 mm, comfortable 750 mm beside a bed; 600 mm clear inside a door; a person needs a 400 mm square
  to stand and reaches 750 mm from its middle; nothing within 600 mm in front of the window AC and nothing taller than
  its underside (1000 mm) for 2500 mm along its air stream.
- The bed's heights (mattress top 440 mm, headboard top 1170 mm) are the ones the model already drew.
- Dressing table 900 x 350 and bedside table 400 x 350 x 550 are my proposals, not owner decisions.
- The split AC's indoor unit on the west wall is not part of this check (it has no config of its own and its file
  belongs to another task). It is drawn above head height south of the wardrobe and nothing in either layout is near it.

## Not verified

- No dimension of the room, its doors, the balcony, the old door or the window AC has been measured on site.
- Door swing directions and hinge sides are assumptions.
- Whether the wall behind the balcony wardrobe has a niche 208 mm deep.
- Whether the closed old door is where the plan draws it (x 2381-3201). Layout B's bedside table and cabinet doors
  depend on it.
- The pictures were checked in the Bedroom 1 page's Overview and Top views for both layouts, and in the Whole home 3D
  default view (which is unchanged). The new button was exercised by the screenshot tool. The check panel under the 3D
  view and the review sheet for layout B were not looked at on screen. Whole home 3D and the Blender renders do not
  show layout B.
- The balcony wardrobe is still drawn with the same two fronts; sliding hardware is not drawn.
- `npm run inspect`, `test:browser`, `test:persistence` and `visual:qa` were not run.

## For the work plan

Tasks:

- Measure Bedroom 1 on site (or scan it): room width and length, the washroom door, the balcony opening and depth, the
  solid stretch of the east wall, and the old door's jambs on the south wall.
- Decide layout A or layout B for Bedroom 1 (owner decision). If B: build the medicine cabinet with doors from
  1250 mm up, turn lighting track 2 as described above, and move any bedside sockets and switches to the south wall
  either side of x 1150-2674.
- Decide the lobby door's hinge side and swing when the door is moved; hinged on the west jamb it parks against the
  west wall and suits both layouts.
- Balcony wardrobe: order it with sliding doors, and check the depth of the niche in the Pooja wall before fixing its
  depth and position.
- Measure the window AC's real casing; the wardrobe clearance (217 mm) and the headboard margin (33 mm in layout A)
  both depend on it.
- If layout B is chosen: add acoustic board to the closed old door's infill behind the bed head.

Open items (questions for the owner):

- Is the bed in Bedroom 1 used by two people? (Layout A works for one person; for two it does not.)
- Which way does the washroom door open, and which way should the new lobby door open?
- Is the balcony table used as a desk? If not, the balcony could hold a drying rack instead.
- Should the west wardrobe get sliding doors? It would make the west walkway of layout B easier.
