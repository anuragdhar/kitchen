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
| **Recess the small router and phone cabinet** in layout B/B2/B3 (then x 500-1600; now wall-hung at x 800-1900, see below) | yes | disappears into the wall; the north sofa can sit against a flat wall |
| **Full-height storage** flush with the wall | yes | up to about 1 m deep by 2 m wide |
| **Recess the whole 2100 mm cabinet** | no | its west 116 mm is outside the cavity |
| **Keep the wall** | shallow only | about 110 mm: a slim shelf or cable chase |

The drawing shows no door onto the Entry, but the owner (2026-09-30, from the Blender render) says the pocket has **two openings**:
one on its **east** side and one cut from the Drawing Room; on 2026-10-03 they made clear these belong to two separate cabinets (below). The Blender top view shows the pocket open on
the plan-left side toward the Entry gallery, which is the east side in the Drawing Room frame (the plan is drawn south-up).

## Two separate cabinets (owner, 2026-10-03; supersedes the 2026-09-30 wall storage and east opening)

The owner marked plan x 575-682, y 726-773 and said the pocket is **two separate cabinets opening in different directions**:
one opens on the **east** side, the other is entered from the **south** side (the Drawing Room) at the **extreme west** end,
"as the Blender model shows". The Blender model (`public/models/A501-blender-lighting.glb`) was read mesh by mesh and the
editable 3D now matches it:

| Part | Blender model (plan pixels) | Editable 3D |
| --- | --- | --- |
| Partition, floor to ceiling | x 649-650, y 716-773 | `ENTRY.wallCavity.partitionPlanX` = 650, a wall in `ENTRY_WALL_SEGMENTS`; about 736 mm from the Drawing Room west wall |
| East cabinet | x 577-649, whole east side open (no wall, no lintel at x 575) | `eastOpening` covers y 715-775 floor to ceiling, so no wall is drawn on that side |
| West cabinet door, through the Drawing Room wall | x 653-684, 0-2,100 high, two leaves, pulls on the room side | `room.wallStorage`: x 80-680 (600 wide, two 300 mm leaves), 0-2,100 high |
| West cabinet closet | x 650-688, to the back of the pocket | x 40-690, 1,105 deep from the room face |
| West cabinet shelves | y 754-773, at 0.12, 0.55, 1.00, 1.45, 1.90, 2.35 m | 380 mm deep against the back, same heights |

Source: `ENTRY.wallCavity` in `src/config/entryConfig.js` (plan reference) and `wallStorage` in `src/config/roomShellConfig.js`
(Drawing Room frame), checked against each other and the pocket in `tests/wall-storage.test.mjs` and
`tests/entry-cavity.test.mjs`. Checks: `checkWallStorage()` in `src/domain/wallStorage.mjs`. The door is cut through the shared
wall in Whole home 3D, the Main entry workspace and the Drawing Room page (`wallPiecesAroundStorage()`), in every layout.

Consequences, stated plainly:
- The wide 2026-09-30 opening above the north sofa (x 200-2050, 1,000-2,350 high) is gone: it would have opened into the east
  cabinet too. The router, landline and intercom cabinet is wall-hung again, moved from x 500 to **x 800-1900** so it clears the
  new door by 120 mm.
- **The new door is blocked by furniture in every Drawing Room layout**: the north sofa (B, B2, B3; x 30-2280) stands in front of
  all 600 mm of it, and in layout A the TV wall cabinet covers it. `checkWallStorage().blockedBy` reports this; nothing was
  moved. To use the door, shorten or shift the north sofa east by about 700 mm, or accept a door used only with the sofa pulled out.
- The east cabinet has no doors or shelves in the Blender model, so none are drawn.
- Sizes come from the Blender model and the plan, not from site measurement. Whether the pocket is hollow and whether the 9-inch
  wall may be opened still need the builder or engineer.

In the app: "Open west cabinet doors" (Whole home 3D and the Drawing Room page) hides the two leaves to show the shelves; the
Drawing Room page's "North wall view" faces the door.

## What the model does and does not show

- Shown: the cavity as a teal translucent volume and the wall as an amber ghost, with labels (toggle: Show entry wall cavity,
  hidden by default). The measure tool ignores both. The west cabinet's closet is drawn translucent so it reads from the
  Drawing Room page too, where the pocket walls are not part of the scene.
- The Drawing Room's north wall is still drawn 85 mm thick like every other wall in the model, so the real 221 mm thickness
  is only visible through the amber ghost.
- Blender exports and renders were not regenerated; the Blender model already had this layout.

## West cabinet doors open inward (owner, 2026-10-03)

Used about twice a year (winter clothes and the like), so the two 300 mm leaves swing INTO the closet (`wallStorage.opens`),
leaving 725 mm between the door and the 380 mm shelves; `checkWallStorage()` checks that clearance. In Drawing Room layout C
nothing stands in front of the door (layouts A, B, B2 and B3 still block it, as reported).

## East cabinet exists (owner, 2026-10-03)

The owner marked the east compartment on a Whole home 3D screenshot and said a cabinet exists there. It is now drawn in
Whole home 3D and the Main entry view (`src/rooms/entry/EntryEastCabinet.js`), from `ENTRY.wallCavity.eastCabinet`:
plan x 577-648, y 726-772, so about **925 mm** across its face (north-south), **1,363 mm** deep (back to the partition) and
2,700 mm high, with its doors on the east face toward the Entry gallery. This supersedes "the east cabinet has no doors or
shelves, so none are drawn" above.

Only the cabinet's presence and position come from the owner. The two door leaves, the loft pair above 2,100 mm, the four
shelves and the 18 mm panels are assumed; nothing is measured on site. Check: `eastCabinetGeometry()` in
`src/domain/entryCavity.mjs`, tested in `tests/entry-cavity.test.mjs`. The Blender models and renders were not regenerated.

## Narrow hidden door to the west cabinet (owner, later 2026-10-03)

The door through the Drawing Room wall is now one concealed flush leaf, x 100-600 (500 wide, 450 clear), 1,800 high, opening
inward, hidden behind the loose end module of the wall-to-wall TV console. It lies inside the Blender door position but no
longer matches its size. Details and reasons: `docs/DRAWING_ROOM_TV_WALL.md`, last section. The app button is now "Open hidden
west cabinet".
