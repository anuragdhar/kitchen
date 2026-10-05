# Better tables, chairs and decor in the live 3D views (2026-10-06)

Owner request: "Can we improve the asset quality? Can we use better quality sofas, dining table, bed etc., which render more
naturally." This round covers the tables, chairs and loose decor. The sofas, cushions and rugs, and the beds, were done by
two other agents at the same time and have their own notes.

Nothing was downloaded: every piece is built in code from rounded slabs, turned (lathe) parts, tapered legs and bent panels,
with the wood maps already bundled with the app (public/materials). No new package; the lockfile is unchanged.

## What looks different

- **Dining set (Lobby / Dining page and Whole home 3D).** One shared builder now draws it in both views, so they match.
  - Table: an oval pale-oak top 32 mm thick with a rounded edge and its grain running along the table, a set-in oval
    apron, a turned oak column with a brass collar, and an oval foot with a brass ring. I kept the pedestal-and-oval style
    the room page already had (chosen 2026-09-28) rather than switching to four legs.
  - Chairs: tapered charcoal steel legs with an H-shaped stretcher, an upholstered seat pad in the same oatmeal as before,
    and a curved oak back that leans back slightly, with the grain running across it. Seat 455 mm high, back top 860 mm.
    The four chairs share one geometry.
- **Coffee table (Drawing Room, every layout):** dark walnut oval top with a rounded edge and real grain, a set-in apron,
  four tapered legs that splay slightly, all inside the top's outline.
- **Lamp / corner tables (Drawing Room):** round walnut top with a rounded edge on a turned column and a round foot.
- **Table lamps (Drawing Room layouts A and B):** a glossy turned ceramic body, a brass neck, and a linen shade that now
  has thickness and glows warmer on the inside.
- **Bedroom 1:** balcony work table (oak top with rounded edge on a slim steel frame with rails), balcony chair and the
  layout B dressing stool (upholstered, on tapered steel legs).
- **Study:** the desk (rounded-edge top, desk pad, tapered steel legs and side rails) and the desk chair.
- **Decor:** floor lamp (weighted turned base, slim stem with a switch, linen drum shade with thickness on a wire frame,
  warm bulb); potted plants (a planter with a rolled rim and soil, ten arching stems with layered, folded leaves in
  several greens instead of a cluster of green balls), including the plant beside the Drawing Room's south window;
  laundry hamper (woven body, cane bands, rope handles, lid with a knob).
- Clicking the dining table, a dining chair, the coffee table, a lamp table, the desk, the balcony table or chair or the
  stool now reports that whole piece by name with its size (before, many of these reported a single board).

## What did not change, and three things that did by a few centimetres

- Every footprint, height and centre comes from config as before. A new test (tests/furniture-bounds.test.mjs) measures
  the drawn boxes against config, to the millimetre: the dining table, the four chairs, the coffee tables of layouts A, B
  and C, the corner table, the Bedroom 1 balcony table, chair and stool in both layouts, and the decor.
- **The dining table on the room page was drawn turned by 90 degrees.** Config, the walkway/AC/pendant checks and Whole
  home 3D all have it 700 mm east-west and 1200 mm north-south (one short end at the north wall); the room page drew it
  1200 east-west, so its chairs stood partly inside the table. It now follows config on both views. No config number
  changed.
- **Lamp and corner tables were drawn 20 mm too tall** (top face at 570 for a configured 550); they are now exactly the
  configured height. The table lamps stand on the new top.
- **Study desk chair:** its back used to be drawn as a 390 mm wide fin sticking out behind the seat (outside its seat);
  it is now a proper back within the 390 x 380 seat footprint. The desk pad now lies 4 mm on the top (it stood 16 mm
  proud).
- Sizes that were drawn but are not in config were kept: coffee table height 457.5 mm, dining chair 440 x 440 (as
  acPlanConfig's DINING_CHAIR_MM), floor lamp 400 x 1580, hamper 400 x 490, desk 580 x 800 x 762.5, desk chair seat 480.
  The Bedroom 1 plant is now its configured 400 x 1000 (it was drawn about 450 x 670); the other rooms' plants keep their
  earlier size.
- Colours are the owner's present ones. The Materials / palette tags are kept on the same pieces as before (dining table,
  chair backs, balcony table top, desk top and pad), so the palette preview still repaints them; the walnut Drawing Room
  pieces stay untagged as before. Decor stays out of the Blender renders; the hamper and the lamp tables stay in them.
- Not touched: the sofas, cushions, rugs (including the lobby rug), beds, the dining pendant, track lights, fans, room
  geometry, config.

## Defaults chosen without asking

- Dining table style: oval pedestal (as the room page had), pale oak and brass, grain along the table.
- Dining chairs: steel legs kept dark (the colour they had), oak back, oatmeal seat.
- Wood grain uses the bundled red-oak veneer for the oak pieces and the teak veneer, darkened to the walnut colour, for the
  Drawing Room pieces. With the default Materials setting (teak) the tagged oak pieces show teak, as every other tagged
  wood in the flat does.

## Size of the new pieces (triangles)

Dining table 4,100; each dining chair 1,100 (one geometry shared by the four; the whole set 8,500); coffee table 2,200;
lamp/corner table 1,900; table lamp 2,000; floor lamp 2,900; plant 2,800; hamper 3,000; balcony table 1,200; balcony chair
1,250; dressing stool 830; study desk 1,100. Wooden parts that share a grain direction, and all the steel of one piece, are
merged, so the number of separate objects drawn went down slightly (Lobby 913 to 871 draw calls per frame, Whole home 3D
4,899 to 4,861).

## Frame rates

Measured in a headless Chrome on this machine's graphics card, alternating the code before this round and after it on the
same server port, four times (other agents were using the graphics card at the same time, so single readings vary by
2-4 frames per second):

- Room pages (Lobby / Dining, Drawing Room, Bedroom 1): 75 frames per second before and after (the display rate, never
  below it in any run).
- Whole home 3D: 22.2 frames per second before, 21.6 after (mean of four runs each; runs ranged 21.2-23.3 before and
  19.6-22.9 after). The difference is smaller than the spread between runs; I cannot say it is a real drop, nor rule out
  about half a frame per second.

## Not verified

- The pictures were looked at for the Lobby (overview, top, four close-ups, electrical points on), the Drawing Room
  layouts C and A (overview, top, coffee, side and corner tables, the window plant), Bedroom 1 layouts A and B (balcony,
  stool, hamper), the Study (desk, chair, floor lamp) and Whole home 3D (top with electrical points, existing points and
  AC routes on, close-ups of the dining set and coffee table). Layouts B, B2 and B3 of the Drawing Room and Bedroom 3's
  plant were not looked at closely (they use the same builders).
- Evening mode, Draft and Standard quality, the palette preview with another palette, and click-for-dimensions were not
  driven in the browser; the new names come from the same markItem call the other pieces use.
- The Blender export was not run. The lamp tables, coffee table, dining set and hamper now carry wood maps or a woven
  texture; the export copies materials with their maps, but no render was made to see how they come out.
- In Whole home 3D the north end of the dining table touches the wall drawing (the table is configured 20 mm from the north
  wall and the wall is drawn thick); this was the same with the old box table and was left alone.
- The lobby rug (1.9 x 1.5 m, not mine to change this round) still runs under the north wall as before.
- Browser suites `npm run test:materials`, `test:lighting`, `test:browser` were not run.
- Small duplication: hardForms.js has its own rounded-slab and fabric helpers; the sofa agent's softForms.js / fabric.js
  may hold similar ones. They can be merged in a later round.

## Questions for the owner (not added to work-plan/OPEN_ITEMS.md this round; the lead owns that file)

- Dining table: keep the oval pedestal, or would you prefer a rectangular top on four legs? Either fits the same 700 x 1200
  footprint.
- The dining table is configured with its short end 20 mm from the north wall (centre z 620, length 1200). Is that the
  intended position (table end against the wall), or should it come out from the wall?
