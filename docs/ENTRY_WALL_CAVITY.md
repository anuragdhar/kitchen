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

## Wall storage (built in the model, 2026-09-30)

Owner decision: open the wall and use the depth for storage, with the router and phones at the front. Corner layouts B, B2 and
B3 only; layout A keeps the wall closed behind its cabinet (a plug fills the opening).

| Part | Size (Drawing Room frame: x from the west wall, height from the floor) |
| --- | --- |
| Opening through the north wall | x 200-2050 (1,850 wide), 1,000-2,350 high (1,350), **1,105 deep** from the room face, i.e. through the 221 mm wall and into the cavity |
| Router, landline and intercom bay, **in front** | x 500-1600, 1,450-2,100 high, 250 deep, recessed so its face is flush with the wall; open lattice so the router's signal is not blocked |
| Storage either side and behind | left bay 300 wide, right bay 450 wide, both 1,105 deep; the space behind the router bay is reached from the sides; shelves at 1,350, 1,700 and 2,050 |
| Doors | flush panels either side of the router bay and above and below it |
| Gross volume | about 2,600 litres (2.6 m3) |

Limits, stated plainly:
- The opening starts at 1,000 mm because the north sofa back is about 900 mm; you reach it by kneeling on the sofa or with a
  step, so it suits things used a few times a year (bedding, luggage, festival items), not daily storage.
- Both side bays are narrow (300 and 450 mm) but very deep; use deep shelves or boxes on runners.
- The router bay is at eye level with no door; the router's antennas and cables sit at the back, with power from the cavity side.
- Not confirmed on site: that the cavity is hollow and that the 9-inch wall may be opened. Do not cut until the builder or
  engineer agrees. Checks live in `src/domain/wallStorage.mjs`, tests in `tests/wall-storage.test.mjs`.

In the app: "Open wall storage doors" (Whole home 3D and the Drawing Room page) hides the doors to show the shelves, and the
Drawing Room page has a "North wall view" button.

## What the model does and does not show

- Shown: the cavity as a teal translucent volume and the wall as an amber ghost, with labels. The measure tool ignores both.
  In the corner layouts the opening is cut through the Drawing Room wall and the shared Entry wall, and the storage stands in the cavity.
- Layout A still has no opening; recessing its TV bay into the cavity is possible (see the table above) but not modelled.
- The Drawing Room's north wall is still drawn 85 mm thick like every other wall in the model, so the real 221 mm thickness
  is only visible through the amber ghost.
