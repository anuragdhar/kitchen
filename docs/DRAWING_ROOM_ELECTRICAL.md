# Drawing Room electrical points (layout C)

Owner request, 2026-10-03: plan the main electrical points for the Drawing Room, allowing for the devices and for phone
charging. This plan is for **layout C** (sofas on the south and west walls, TV on the north wall; `docs/DRAWING_ROOM_TV_WALL.md`).
It is a planning layout to hand to a licensed electrician, **not a wiring design**.

Source: `react-configurator/src/config/drawingElectricalConfig.js`. Checks: `src/domain/drawingElectrical.mjs`. Tests:
`tests/drawing-electrical.test.mjs`. In the app: **Show electrical points** (Drawing Room page and Whole home 3D, layout C)
puts a coloured marker and tag at every box. Colours: red = sockets, green = charging (sockets with USB-A/C), amber = lighting
and switches, teal = data, purple = dedicated circuit, grey = optional.

Positions are measured inside the room: **x** from the west wall, **z** from the north wall, height to the box centre, all in mm.

## Points

| ID | Point | Where | What to fit | Why |
| --- | --- | --- | --- | --- |
| N1 | TV box (behind the screen) | north wall, x 1600, 1000 high | 2 x 6 A sockets in a recessed media box + 1 CAT6 + end of the HDMI conduit | TV and a streaming stick; recessed so the plugs do not push the TV off the wall |
| N2 | Media point in the TV console | north wall, x 1300, 400 high | 3 x 6 A sockets + 1 TV coax (DTH/cable) + 1 CAT6 (spare) | behind the console back: Bass Module 500, set-top box and Soundbar 300; a 50 mm conduit runs up inside the wall to N1 for HDMI (eARC) |
| N4 | Router, phone and intercom point | north wall, x 730, 400 high | 2 x 6 A sockets + fibre/broadband entry + telephone line + intercom cable + 1 CAT6 to N1 | behind the router bay of the TV console: router and landline base, intercom wiring to the desk intercom on the console top |
| N3 | West cabinet light | inside the west cabinet, x 380, 2450 high | LED batten with a door-contact switch | lights the winter-clothes closet when its doors open; nothing to remember to switch off |
| E1 | Main switchboard + drop-zone charger | east wall, z 1250, 1200 high | switches for chandelier, uplight, reading light (2-way), sofa glow; 1 x 6 A socket; 1 USB-A + USB-C charger | first wall on the left after the entry door swing (850 mm); phones and keys can charge on arrival |
| E4 | Utility socket | east wall, z 1850, 300 high | 1 x 6/16 A combined socket | vacuum cleaner, festival lights, a room heater in winter |
| W1 | AC point | west wall, z 3080, 2300 high | 1 x 16 A socket (or isolator) on its own circuit | the existing split AC indoor unit (centred z 2420); keep beside the unit, not behind it |
| W2 | Wall uplight | west wall, z 850, 1800 high | light point | west wall uplight (drawingLightingConfig), switched at E1 |
| W3 | Lamp + charging, west sofa north end | west wall, z 1835, 300 high | 1 x 6 A socket + 1 USB-A + USB-C | side-table lamp and phones at the end of the west sofa |
| W4 | Charging above the west sofa | west wall, z 3800, 1000 high | 1 USB-A + USB-C charger + 1 x 6 A socket | reachable from the west sofa seats without getting up; just above the sofa back (about 925 mm) |
| W6 | Lamp + charging at the corner table | west wall, z 4835, 700 high | 1 x 6 A socket + 1 USB-A + USB-C | just above the corner lamp table (550 high), for its lamp and phones at the west end of the south sofa |
| W5 | Reading light | west wall, z 4645, 1550 high | light point with a local switch (2-way with E1) | reading light over the corner lamp table and the west end of the south sofa |
| S1 | Sofa glow driver | south wall, x 1605, 300 high | 1 x 6 A switched socket (switched at E1) | LED driver for the low glow strip under the south sofa |
| S2 | Lamp + charging, south sofa east end | south wall, x 2850, 300 high | 1 x 6 A socket + 1 USB-A + USB-C + 2-way chandelier switch | side-table lamp and phones at the open end of the south sofa |
| S3 | Spare / heater socket | south wall, x 3200, 300 high | 1 x 6/16 A combined socket | room heater, air purifier or decorative lights by the window |
| C1 | Chandelier | ceiling, x 1600, z 2705 | ceiling light point with a hook rated for the fitting | existing chandelier on the centre ceiling medallion, between the two ceiling fans (owner 2026-10-04); position from the phone scan of 2026-10-04 |
| F1 | Floor box at the coffee table (optional) | floor, x 1230, z 3425 | flush floor box: 1 x 6 A + USB-A/C, lid closes over plugs | charging at the table and the west sofa; must be chased into the floor before tiling, under the rug |

Totals: 17 points: 5 socket points, 5 charging points (1 optional), 5 lighting and switch points, 1 data point and 1 dedicated AC point.

## Phone charging

Every sofa seat has a USB charging point within 1.5 m, not counting the optional floor box:

- south sofa seat at x 855: 855 mm
- south sofa seat at x 1605: 1342 mm
- south sofa seat at x 2355: 704 mm
- west sofa seat at z 2470: 860 mm
- west sofa seat at z 3220: 820 mm
- west sofa seat at z 3970: 604 mm

Also: the drop-zone charger at the main switchboard (E1) for phones on arrival. The middle seat of the south sofa is the
furthest (about 1.35 m): the window takes the wall behind it, so the optional floor box F1, or a 2 m cable, covers it best.

## Circuits

- Lighting: one 6 A MCB circuit for C1, W2, W5, N3 and the sofa glow (S1).
- Sockets: one 16 A MCB circuit for N1, N2, E1, E2, E3, E4, W3, W4, S2, S3 and F1, protected by a 30 mA RCBO/RCCB.
- AC: W1 on its own circuit sized to the AC nameplate (typically 16-20 A), with its own MCB.
- Media: plug-in surge protection (or a surge device at the board) for N1, N2 and E2.
- Data: CAT6 from E2 to N1 and N2, coax to N2, phone line to E2; run low-voltage cables in their own conduits, crossing mains only at right angles.

## Safety

All sockets three-pin with an effective earth, BIS-marked (IS 1293); modular boxes and plates; concealed PVC conduit. A licensed electrician must confirm the existing wiring, earthing, MCB/RCBO ratings and the intercom and broadband entry before any chasing.

## What the checks guarantee, and what they do not

The checks confirm that no box sits in a door opening (the entry door, the west cabinet door), in the window, in the lobby
opening, behind the open entry door, or behind the AC unit. They confirm that every reachable socket is clear of the sofas
and 150-1100 mm high, that the switchboard is 1100-1400 mm high, that the TV box stays hidden behind both the 55- and 65-inch
TV, and that the router point is behind the TV console's router bay.

Not checked or not known: the existing points and wiring in the room, where the building's intercom, broadband and DTH cables
enter, the AC's actual rating, and whether the floor can be chased for F1. Decide F1 before any flooring work. If the
layout changes, the plan has to be redone: the points follow the furniture.

Existing points found by the phone scan of 2026-10-04 (switchboard, distribution board, sockets, wall light) are listed in
`docs/SITE_SCAN_2026-10-04.md`. The south window sill is 935 mm (was taken as 550), so the south-wall points at 300 mm stay well below it.
