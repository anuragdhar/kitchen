# Empty cavity behind the Drawing Room north wall

Owner mark, 2026-09-30: plan x 573-643, y 726-772, near the Main Entry. The owner reads the closed rectangle there as an
empty cavity from floor to ceiling, and sent a screenshot of the dark pocket in the 3D model to show which one. The model
shows it (**Hide/Show entry wall cavity** in Whole home 3D). Commit 77a227f first drew only the thin wall band as the
cavity; that was wrong and is corrected here.

## What the plan shows

| Item | Plan pixels | Size |
| --- | --- | --- |
| The cavity: a closed rectangle on the Entry side, nothing drawn in it, no door onto the Entry | x 577-680, y 726-772 | about **925 mm (3 ft)** deep x about **2,000 mm** wide x 2,700 mm high |
| Wall between the Drawing Room and the cavity | y 715-726 | about **221 mm** (a 9-inch wall) |
| Shaft box (the crossed rectangle) south of the cavity | x 575-688, y 775-810 | services shaft; keep clear |
| Your mark | x 573-643, y 726-772 | the western 70 px of the cavity |

Along the Drawing Room's north wall (measured from its west wall, the same frame as the layouts) the cavity runs from
**x 116 to x 2149 mm**, almost exactly the free wall west of the entry door (the door starts at x 2150). It sits directly
behind the layout A TV cabinet, the layout B/B2/B3 north sofa and the small router cabinet.

## How deep is the unused space?

- **Cavity: about 925 mm**, floor to ceiling, about 2 m wide.
- **If the 221 mm wall may be opened** from the Drawing Room: about **1,105 mm** reach from the Drawing Room face (wall + cavity, keeping 40 mm of finish on the far side).
- **If the wall must stay**: only about **110 mm** (half the wall) as a shallow niche.

The drawing cannot say whether the cavity is really hollow, nor whether that 9-inch wall is load-bearing. Check on site
(test-drill from the Drawing Room side, look for the shaft services and a beam above) and get the builder or engineer to
agree before any opening.

## What the Drawing Room can do with it (opened wall)

All figures come from `src/domain/entryCavity.mjs` (`recessOptions`), tested in `tests/entry-cavity.test.mjs`.

| Idea | Fits? | Result |
| --- | --- | --- |
| **Recess the layout A TV bay** (x 280-1820) so the TV sits in the wall | yes | a 305 mm or the 18-inch (457 mm) unit sits fully inside; the wall face stays flat |
| **Hidden AV closet** behind a door in the wall: router, landline, intercom, Bass Module 500, cable box, with a vent | yes | 925 mm deep gives room to stand the Bass Module and route all cabling; doors face the Drawing Room |
| **Recess the small router and phone cabinet** in layout B/B2/B3 (x 500-1600) | yes | disappears into the wall; the north sofa can sit against a flat wall |
| **Full-height storage** flush with the wall | yes | up to about 1 m deep by 2 m wide |
| **Recess the whole 2100 mm cabinet** | no | its west 116 mm is outside the cavity |
| **Keep the wall** | shallow only | about 110 mm: a slim shelf or cable chase |

The pocket has no door to the Entry, so the Drawing Room is the only way in.

## What the model does and does not show

- Shown: the cavity as a teal translucent volume and the wall as an amber ghost, with labels. The measure tool ignores both.
- Not shown: an opening cut into the Drawing Room wall. That needs the answers above; then a recessed version of the layout A
  cabinet or an AV closet can be added.
- The Drawing Room's north wall is still drawn 85 mm thick like every other wall in the model, so the real 221 mm thickness
  is only visible through the amber ghost.
