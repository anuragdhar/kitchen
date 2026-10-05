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
| C2 | Track 1 driver feed | ceiling, x 2320, z 540 | switched and dimmed 230 V point for the 60 W / 48 V track driver | at the east end of Track 1 (the TV-wall spots); its own dimmer at the switchboard |
| C3 | Track 2 driver feed | ceiling, x 640, z 2000 | switched and dimmed 230 V point for the 100 W / 48 V track driver | at the north end of Track 2 (west wall: general and reading light); its own dimmer at the switchboard |
| F1 | Floor box at the coffee table (optional) | floor, x 1230, z 3425 | flush floor box: 1 x 6 A + USB-A/C, lid closes over plugs | charging at the table and the west sofa; must be chased into the floor before tiling, under the rug |

Totals: 19 points: 5 socket points, 5 charging points (1 optional), 7 lighting and switch points, 1 data point and 1 dedicated AC point.

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
`docs/SITE_SCAN_2026-10-04.md` and, since 2026-10-04, in the app (next section). The south window sill is 935 mm (was taken
as 550), so the south-wall points at 300 mm stay well below it.

## Existing points: where the switchboards and sockets are today

Owner question, 2026-10-04: "Will the location of switchboards be visible in the map?" Yes. On the **Drawing Room** page and
the **Lobby / Dining** page, click **Show existing electrical points** (right end of the toolbar). Grey plates with a blue
outline appear on the walls at the true size and height of each plate, each with a square white tag ("Existing: Switchboard
195x260"); ceiling points are blue rings the size of the rosette. They show in the 3D view, the Top view and the wall views
(it is one scene), and in **Whole home 3D** behind a button of the same name. Under the toolbar a list repeats every point and,
in red, every place where the planned design lands on one. The "Review sheet for AI" text brief carries the same list
("Existing electrical points (site scan)"). The proposed points (coloured pins, "Show electrical points") can be shown at
the same time; the two styles do not look alike.

Source: `react-configurator/src/config/existingElectricalConfig.js` (one key per room; add a key to extend it to another
room). Checks and positions: `src/domain/existingElectrical.mjs`; tests: `tests/existing-electrical.test.mjs`. Positions
are from the scan, about +/- 20 mm; the widths of the two wall lights and the height of the Lobby tube light were not readable
and are marked `assumed` in the config and in the list.

Drawing Room, as measured (x from the west wall, z from the north wall, heights to the plate edges):

| ID | Point | Where |
| --- | --- | --- |
| X-D1 | Switchboard, 195 x 260 | north wall, x 1710-1905, 1235-1495 high (east edge 230 mm from the door jamb) |
| X-D2 | Distribution board (MCBs), 350 x 185 | east wall, z 555-905, 1500-1685 high |
| X-D3 | Door chime | east wall, z 270-535, 1520-1670 high |
| X-D4 | Socket plate | west wall, z 970-1165, 255-370 high |
| X-D5 | Three socket plates | west wall, z 4050-4500, 260-375 high |
| X-D6 | Wall light | west wall, about z 1150, 2130-2350 high (width assumed 150) |

Lobby / Dining: switchboard on the north wall at x 375-575 (measured 415-615 from the Drawing Room face of the dividing beam,
which is 40 mm west of the Lobby's x = 0; the config stores the measured figure and subtracts the 40 mm in one place),
1215-1495 high; wall light on the north wall at about x 1560, 2100-2400; tube light on the south wall at x 2160-3310, about
2260 high; ceiling medallion (probably a fan) at (2605, 1600), about 810 across; small ceiling light rosette at (3770, 1615).

Conflicts with the planned design, as the app reports them (layout C):

- The Drawing Room switchboard X-D1 would be covered by the fluted wall panelling (x 40-2100, up to 1825) and by the TV
  (55-inch x 800-2030, 795-1505; 65-inch x 690-2140, 735-1565). Move it (the proposed plan puts the main switchboard E1 on
  the east wall), or cut the panelling and the TV bracket around it and keep it reachable.
- The distribution board X-D2 is partly, and the door chime X-D3 fully, behind the entry door leaf when the door stands open
  (the leaf covers the first 850 mm of the east wall). Acceptable for MCBs that are rarely touched and harmless for a chime;
  keep a clear way to the board.
- The three socket plates X-D5 are partly behind the west sofa (z 2095-4345): plugs there cannot be reached without moving
  the sofa. Move the point, or accept it for a lamp or a permanently plugged device.
- The Lobby switchboard is inside the planned Bedroom 1 door opening (x 100-1000): it has to be moved before the door is cut
  (already noted in the scan record and in `roomShellConfig.js`).

The checks cover: a point inside a planned door, window, open side or the hidden cabinet door; a point behind planned
panelling, a TV, a cabinet or console, a sofa standing against that wall, or the open entry door leaf. They do not check
wiring routes, whether a point can be moved, or anything the scan did not capture (what is behind curtains or furniture).
The Drawing Room's three ceiling points are not repeated here: they are already the fan and chandelier positions in
`drawingLightingConfig.js` and C1 above.

## How the lights are dimmed, and the wires to the tracks (2026-10-06)

**Dimming.** Each lighting circuit has its own knob at the switchboard: a modular rotary LED dimmer. It looks and turns
like a fan speed regulator, but it is a different part, and a fan regulator must not be used on a light. Three knobs:
the chandelier, Track 1 and Track 2. The two fans keep their regulators. A track cannot dim one head on its own; the
whole track goes up and down together.

The dimmer has to match the track's driver (the small box that turns mains power into the 48 V the track runs on). The
proposal is a "phase-cut" (triac) dimmable driver with a trailing-edge rotary dimmer, because it needs no extra control
wire. The alternative, a 0-10 V or DALI driver, dims more smoothly at low levels but needs two more wires in the same
conduit. Buy the track, drivers and dimmers as one matched set from one maker (open item C17).

**Wires.** One feed per track, at the end nearest the switchboard, in a 20 mm conduit chased up the wall and into the
ceiling plaster. Shown as orange lines when "Show electrical points" is on.

| Feed | From the switchboard | Length |
| --- | --- | --- |
| C2, Track 1 | up the north wall to the ceiling, 0.5 m east along the wall, then 0.54 m out to the east end of Track 1 | about 2.4 m |
| C3, Track 2 | up the north wall to the ceiling, 1.2 m west along the wall, then 2.0 m south to the north end of Track 2 | about 4.5 m |

Total about 6.9 m of conduit; allow 10 % more for bends and tails. Where a chase crosses the plaster ceiling moulding it
is cut through and the moulding made good: the conduit is buried, unlike the track, which must sit on flat ceiling.

**Which switchboard.** The routes start at the existing switchboard beside the TV on the north wall, which the owner
takes as the board for these lights (2026-10-06). As drawn, that board is behind the 55-inch TV and inside the wall
panelling, so either the board or the TV has to move (open item C28). If the board moves along the same wall, only the
first vertical leg moves with it. If it moves to the east wall (point E1), each route gets about 2.5 m longer.
