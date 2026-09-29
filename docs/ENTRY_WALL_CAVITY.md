# Entry wall cavity behind the 3 ft cabinet

Owner mark, 2026-09-30: plan x 573-643, y 726-772, near the Main Entry. A cabinet 3 ft deep stands there, and the
band of wall behind it is empty, floor to ceiling. This note records what the plan shows, how deep the unused space is
and what the Drawing Room can do with it. The model shows it (**Hide/Show entry wall cavity** in Whole home 3D).

## What the plan shows

| Item | Plan pixels | Size |
| --- | --- | --- |
| Wall between the Drawing Room and the Main Entry (the "band") | x 577-680, y 715-726 | about **221 mm** deep x 1978 mm wide x 2700 mm high |
| Entry cabinet on the Entry side of the band | x 577-680, y 726-772 | about **925 mm** (3 ft) deep x 1978 mm wide |
| Your mark | x 573-643, y 726-772 | the southern 70 px of that cabinet |

Along the Drawing Room's north wall (measured from its west wall, the same frame as the layouts) the band runs from
**x 155 to x 2151 mm**. That is almost exactly the free wall west of the entry door (the door starts at x 2150), so it sits
directly behind the layout A TV cabinet (x 0-2100), the layout B north sofa and the small router cabinet.

## How deep is the unused space?

- **Gross: about 220 mm** (plus or minus one plan pixel, 20 mm), floor to ceiling, about 2000 mm wide.
- **If it is a real void:** about **180 mm** is usable, keeping 40 mm of finish and backing on the Entry side.
- **If it is solid brickwork:** about **110 mm** (half the wall) is the most a niche should take.

The drawing cannot tell these apart. 221 mm is almost exactly a standard 9-inch (229 mm) brick wall, which the plan draws as
two lines with nothing between them, so it may simply be the wall. Check on site before designing around the 180 mm:
drill a small test hole from the Drawing Room side, look for cables, pipes or a beam above, and ask whether the wall is
load-bearing. Any niche in it needs the builder or engineer to agree.

## What the Drawing Room can do with it

All figures come from `src/domain/entryCavity.mjs` (`recessOptions`), tested in `tests/entry-cavity.test.mjs`.

| Idea | Fits the band? | Result |
| --- | --- | --- |
| **Recess the layout A TV bay** (bay x 280-1820, 1540 wide) so the TV sits in the wall | yes | with a 305 mm cabinet it sticks out 125 mm (void) or 195 mm (brick) instead of 305 |
| **Keep the 18-inch (457 mm) deep unit you wanted** and recess it | yes | it sticks out 277 mm (void) or 347 mm (brick), less than today's one-foot cabinet |
| **Recess the small router, landline and intercom cabinet** in layout B, B2 or B3 (x 500-1600, 250 deep) | yes | it sticks out 70 mm (void) or 140 mm (brick): nearly flush above the north sofa |
| **Cable and power chase**, floor to ceiling, to hide the TV, soundbar and projector cabling you asked about | yes | about 180 mm of duct: room for conduit, sockets and a network cable, with no visible wiring |
| **Slim full-height storage** (books, games) with doors, flush with the wall | yes | 180 mm deep by about 1945 mm wide, x 155-2100 |
| **Recess the whole 2100 mm cabinet** | no | its west end (x 0-155) is outside the band |

The Entry cabinet on the other side blocks any access from the Entry, so the Drawing Room is the only way in.

## What the model does and does not show

- Shown: the band as a teal translucent volume, the Entry cabinet as an amber ghost box (its height is not confirmed; it is
  drawn as tall as the shoe rack, 2134 mm), with labels. Neither can be measured through: the measure tool ignores them.
- Not shown: an actual niche cut into the Drawing Room wall. That needs the void-or-brick answer first; then a recessed
  version of the layout A cabinet or the router cabinet can be added.
- The Drawing Room's north wall is still drawn 85 mm thick like every other wall in the model, so the real 221 mm thickness
  is only visible through the cavity volume.
