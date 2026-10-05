# Electrical plan, room by room

Owner request, 2026-10-05: proposed electrical points for the rooms that had none, and a decision on the three places where
an existing point clashes with the planned design.

**This is a planning layout to hand to a licensed electrician. It is not a wiring design.** It says where a box is wanted,
what should be on it and why. It does not size a cable, a breaker or a conduit, and it does not certify the existing
wiring or earthing. Nothing here has been verified on site.

| Room | Where the plan is | In the app |
| --- | --- | --- |
| Drawing Room | `docs/DRAWING_ROOM_ELECTRICAL.md` (`drawingElectricalConfig.js`), unchanged except for the links to the existing points below | Show electrical points (layout C) |
| Lobby / Dining, Bedroom 1, Bedroom 3 | this document | Show electrical points on each room page |
| Study (Bedroom 2) | this document | Show electrical points on the Study page |
| Home Office | desk and equipment points: `balconyOfficeConfig.js` `electrical` (already there); room light and switch: this document. Its labels E1, E2, N1-N4, D1 and P1 are the Home Office page's own and are not the Drawing Room's E1, N1... | Show electrical points on the Home Office page |
| Main entry | this document | Show electrical points on the Main entry page |
| Kitchen | NOT planned here. It has a services overlay derived from the appliance positions (`src/kitchen/services.mjs`, `tests/kitchen-services.test.mjs`): power points for the washing machine, dishwasher, chimney and the other appliances, with water, drain and gas. It has no switchboard, lighting-circuit or load plan | Kitchen page, services overlay |

Source: `react-configurator/src/config/roomElectricalConfig.js` (points, circuits, what to verify). Room models (what each
room looks like to the check, read from the room configs): `src/domain/roomElectricalModels.mjs`. Generic check:
`src/domain/roomElectrical.mjs`. Tests: `tests/room-electrical.test.mjs` and one `tests/<room>-electrical.test.mjs` per room.
The tables below are generated from the config, and a test fails if a row here no longer matches it.

In the app, **Show electrical points** puts a coloured pin and a tag at every box, and lists the check results, the
circuits and the items to verify under the 3D view. Colours: red = sockets, green = charging (sockets with USB-A/C),
amber = lights, switches, fans and driver feeds, teal = data and bell, purple = its own circuit, grey = optional.

## How to read the positions

All millimetres. In every room **x** is measured from the room's west wall and **z** from its north wall; heights are to the
centre of the box above the floor. "north wall, x 1200, 1200 high" is a box on the north wall, 1200 mm from the west wall,
1200 mm up. The Main entry is the exception: its x is measured from the gallery's east wall (the wall the fold-down seat is
on) going west, and its z from the Drawing Room wall going north, as on the Main entry page.

Heights follow common Indian practice: switchboards 1200; low sockets 300; a socket above a desk, chest or table 150-250
above its top; bedside points 1300, just above the headboard (the beds are drawn with a headboard to 1170); AC points beside
the indoor unit at 2300; track-driver feeds at the ceiling, at the end of each run.

## What the app checks in every room

1. Every point has a place on a wall, the ceiling or in a cabinet.
2. No point is in a door, window, cabinet front or open side.
3. Nothing is behind furniture or an open door leaf unless it is marked hidden on purpose, and every open socket is
   between 150 and 1300 mm high.
4. Every door has a switchboard on its latch side, within 700 mm of the frame, between 1100 and 1400 mm high.
5. Every bed side, desk and seat has a charging point within 1.5 m.
6. Every AC unit has one dedicated point on its own circuit, on its wall, beside it and not behind it, within 1 m.
7. Every track-light run has a feed for its driver within 800 mm of the run, and every ceiling fan has a point.
8. Every lighting circuit (track run, pendant, fan, entry light group) is switched at some switchboard.
9. Every point is on exactly one circuit, an AC or heater is alone on its circuit, and no circuit carries more than 80% of
   its proposed breaker.

Which way a door hangs is known for few doors. Where it is not, the latch side is assumed and the room's verify list says so.

## Load estimate: how the figures are made

Connected load, from rule-of-thumb figures (`ELECTRICAL_LOAD_W` in the config): 100 W per 6 A outlet point, 1000 W per 16 A
outlet point, 100 W per switchboard with a socket, 75 W per ceiling fan, track runs at their driver watts, lights at their
fitting watts, 1700 W for a 1.5 ton split AC, 1900 W for the 1.5 ton window AC, 2000 W for the storage water heater. This is
what could be plugged in, not what runs together; real demand is much lower. It is for a first conversation about the
number of circuits, and sizes nothing.

| Room | Points | Circuits | Connected load |
| --- | --- | --- | --- |
| Lobby / Dining | 12 | 3 | about 4405 W |
| Bedroom 1 | 11 | 4 | about 5295 W |
| Bedroom 3 | 11 | 3 | about 4465 W |
| Study (Bedroom 2) | 9 | 3 | about 4355 W |
| Home Office | 9 (7 from the office config) | 3 | about 3320 W |
| Main entry | 11 | 2 | about 1252 W |
| Total of these six | 63 | 18 | about 23,092 W |

The Drawing Room (17 points, `docs/DRAWING_ROOM_ELECTRICAL.md`) and the Kitchen are not in this total. Six AC or heater
circuits make up 10,700 W of it.

## The three clashes with existing points, and how each is resolved

The phone scan of 2026-10-04 recorded what is on the walls today (`existingElectricalConfig.js`). Each existing point now
carries a **disposition**: keep, relocate to a planned point, or blank off. "Show existing electrical points" shows the
resolution beside each clash instead of an open conflict.

**1. Drawing Room switchboard X-D1** (north wall, x 1710-1905, 1235-1495 high) is behind the planned fluted wall panelling
and the TV.
*Resolution: relocate to E1.* The switches move to the new main switchboard E1 on the east wall (z 1250, 1200 high), just
past the swing of the entry door. E1 is 350 mm from the distribution board X-D2, so the circuits are run from the board
straight to E1 and the old run to X-D1 is withdrawn. The old box is emptied and plastered over before the panelling goes
up, so nothing live is buried. Only if a cable cannot be re-pulled does the box stay as a junction box, and then behind a
screwed access cover cut in the panelling at that spot (it is behind the TV: lift the TV off its bracket to reach it).

**2. Three socket plates X-D5** (west wall, z 4050-4500, 260-375 high) are partly behind the west sofa (z 2095-4345).
*Resolution: keep, hidden on purpose, as the feed for W4 and W6.* The boxes stay. The two plates behind the sofa get blank
plates, or one keeps a permanently plugged lamp; the third plate, in the gap south of the sofa, stays in use. The outlets
people actually reach are the new W4 (above the sofa back, 1000 high) and W6 (above the corner table, 700 high), chased
straight up from these boxes, so no new run across the wall is needed.

**3. Lobby switchboard X-L1** (north wall, x 375-575, 1215-1495 high) is inside the planned Bedroom 1 door (x 100-1000).
*Resolution: relocate to L-N1.* The switches move to a new switchboard L-N1 on the latch side of the new door (x 1200,
1200 high). The old box goes with the wall when the opening is cut. Its riser is cut back to a junction box above the new
door head (L-N2, x 475, 2300 high) with a screwed blank plate that stays reachable, and the cables run across the lintel
to L-N1. This has to be done before the door opening is cut, and it assumes the feed drops from above: the electrician
must check that first.

The other existing points: the distribution board X-D2 and the door chime X-D3 stay (both are behind the entry door leaf
when it stands open, which is acceptable for breakers and for a chime); the low socket X-D4 stays; the old wall light X-D6
comes off and is blanked. In the Lobby the wall light X-L2 stays, the tube light X-L3 and the small ceiling light X-L5 come
off and their points feed the two track drivers (L-S2, L-C3), and the centre ceiling point X-L4 stays as the fan point
(L-C2). In Bedroom 3 the switchboard X-B1 stays as the room switchboard (B3-N1) and the wall light X-B2 as a picture light
(B3-W2).

## Lobby / Dining

Status: proposed 2026-10-05; nothing verified on site. Shown on: Lobby / Dining page. 12 points; connected load about 4405 W.

| ID | Point | Where | What to fit | Use |
| --- | --- | --- | --- | --- |
| L-N1 | Main switchboard | north wall, x 1200, 1200 high | dimmers for the dining pendant, track 1 and track 2; fan regulator; wall-light switch; 1 x 6 A socket | takes over from the existing switchboard X-L1, which stands in the planned Bedroom 1 door; on the latch side of that door, 200 mm past the frame, and the first wall you pass coming from the Drawing Room |
| L-N2 | Junction box above the door | north wall, x 475, 2300 high | junction box with a screwed blank plate, kept reachable (never plastered over) | the riser of the old switchboard X-L1 is cut back to here, above the new door head (2100), and extended across the lintel to L-N1 |
| L-N3 | Dining point | north wall, x 2200, 900 high | 2 x 6 A sockets + 1 USB-A + USB-C | phones and a laptop at the dining table, 155 mm above the table top; a kettle or toaster stays in the kitchen (no 16 A outlet here: owner to confirm) |
| L-N4 | AC point | north wall, x 3250, 2300 high | 1 x 16 A socket (or isolator) on its own circuit | the split AC indoor unit on the north wall; beside the unit, not behind it |
| L-E1 | Iron point | east wall, z 1375, 1250 high | 1 x 16 A socket with a switch and an indicator lamp | the iron, above the ironing storage unit (1000 high) where the board pulls out |
| L-E2 | Utility socket | east wall, z 350, 300 high | 1 x 6/16 A combined socket | vacuum cleaner, festival lights, a room heater; in the corner between the Pooja opening and the ironing storage |
| L-S1 | Toilet switches | south wall, x 1815, 1200 high | switches for the toilet light and exhaust fan | outside the toilet door, on its latch side (the hinge side of the concealed door is not decided: mirror this if it hangs the other way) |
| L-S2 | Track 1 driver feed | south wall, x 2735, 2260 high | switched 230 V point for the 60 W / 48 V track driver (dimmer at L-N1) | reuses the existing tube-light point on the south wall, 540 mm from the run; the tube light comes off |
| L-C1 | Dining pendant | ceiling, x 2200, z 620 | ceiling light point with a hook | the linear pendant over the dining table, dimmed at L-N1 |
| L-C2 | Ceiling fan | ceiling, x 2605, z 1600 | ceiling fan point with a hook rated for the fan | the existing centre ceiling point (medallion); regulator at L-N1 |
| L-C3 | Track 2 driver feed | ceiling, x 3770, z 1615 | switched 230 V point for the 60 W / 48 V track driver (dimmer at L-N1) | reuses the existing small ceiling light point, 280 mm from the run; that light comes off |
| L-P1 | Pooja light and socket | west return of the Pooja alcove, x 3833, z -500, 1200 high | switch for the alcove light + 1 x 6 A socket (hidden on purpose) | inside the Pooja alcove, on its west return behind the doors: the alcove light and an electric diya or bell |

Circuits (proposed breakers; the electrician sizes cables and breakers):

| Circuit | What | Breaker | Points | Connected load | Protection |
| --- | --- | --- | --- | --- | --- |
| L-light | Lighting, fan and 6 A outlets | 10 A | L-N1, L-N3, L-S1, L-S2, L-C1, L-C2, L-C3, L-P1 | 705 W | 30 mA RCBO/RCCB |
| L-power | Power sockets | 16 A | L-E1, L-E2 | 2000 W | 30 mA RCBO/RCCB |
| L-ac | AC | 20 A | L-N4 | 1700 W | MCB sized to the unit nameplate |

Checked by the app: 9 of 9 rules pass (12 points; 5 openings; 1 piece of furniture or door leaf; 2 doors; 4 bed sides, desks and seats; 1 AC unit; 3 track runs and fans; 4 lighting circuits; 3 circuits).

The electrician must verify:

- Where the feed of the existing switchboard X-L1 comes from (ceiling or floor) before the Bedroom 1 door opening is cut; the junction box L-N2 assumes it drops from above.
- Which way the Bedroom 1 door and the concealed toilet door hang: L-N1 and L-S1 assume the latch on the east jamb.
- Whether the centre ceiling point X-L4 is a fan point with a hook rated for a fan.
- Whether the toilet already has its switches outside the door (not visible in the scan).
- Two-way switching for the lobby lights from the kitchen side (east opening) is not planned: owner to decide.

## Bedroom 1

Status: proposed 2026-10-05; the room is being redesigned: the points marked dependsOn follow the furniture config. Shown on: Bedroom 1 page. 11 points; connected load about 5295 W.

| ID | Point | Where | What to fit | Use |
| --- | --- | --- | --- | --- |
| B1-S1 | Main switchboard | south wall, x 1150, 1200 high | dimmers for track 1 and track 2 (2-way with the bedside points); fan regulator; 1 x 6 A socket | on the latch side of the door from the Lobby, 150 mm past the frame |
| B1-S2 | Utility socket | south wall, x 1350, 300 high | 1 x 6/16 A combined socket | vacuum cleaner, a room heater, an iron; between the door and the foot of the bed |
| B1-N1 | Washroom switches | north wall, x 1566, 1200 high | switches for the washroom light and exhaust; 20 A double-pole switch with indicator for the geyser | outside the washroom door, on its latch side; the geyser point itself is inside the washroom and is not planned here |
| B1-W1 | AC point (split unit) | west wall, z 3060, 2300 high | 1 x 16 A socket (or isolator) on its own circuit | the split AC indoor unit on the west wall south of the wardrobe; beside the unit, above the open door leaf |
| B1-E1 | Bedside point, north sleeper | east wall, z 2300, 1300 high | 1 x 6 A socket + 1 USB-A + USB-C + 2-way switch for track 2 (reading) | above the headboard on the first solid stretch of the head wall; phone, lamp, and the reading lights without getting up |
| B1-E2 | Bedside point, south sleeper | east wall, z 2990, 1300 high | 1 x 6 A socket + 1 USB-A + USB-C + 2-way switch for track 2 (reading) | above the headboard, 250 mm in from the wall-side edge of the bed |
| B1-C1 | Ceiling fan | ceiling, x 1676, z 1620 | ceiling fan point with a hook rated for the fan | ceiling fan (position assumed at the room centre, not measured); regulator at B1-S1 |
| B1-C2 | Track 1 driver feed | ceiling, x 800, z 2900 | switched 230 V point for the 100 W / 48 V track driver (dimmer at B1-S1) | at the south end of the wardrobe run, the end nearest the switchboard |
| B1-C3 | Track 2 driver feed | ceiling, x 2600, z 3050 | switched 230 V point for the 60 W / 48 V track driver (dimmer at B1-S1, 2-way at the bed) | at the south end of the run over the bed |
| B1-B1 | Window AC point | balcony east parapet, inside face, z 923, 850 high | 1 x 16 A socket in an AC starter box with a 20 A double-pole MCB, on its own circuit | the owner's 1.5 ton window AC on the balcony parapet: on the inside face of the parapet just north of the unit, below its underside, within its cord |
| B1-B2 | Balcony table point | balcony east parapet, inside face, z 500, 900 high | 1 x 6 A socket + 1 USB-A + USB-C | laptop and phone at the balcony table, on the parapet 160 mm above the table top |

Circuits (proposed breakers; the electrician sizes cables and breakers):

| Circuit | What | Breaker | Points | Connected load | Protection |
| --- | --- | --- | --- | --- | --- |
| B1-light | Lighting, fan and 6 A outlets | 10 A | B1-S1, B1-N1, B1-E1, B1-E2, B1-C1, B1-C2, B1-C3, B1-B2 | 695 W | 30 mA RCBO/RCCB |
| B1-power | Power socket | 16 A | B1-S2 | 1000 W | 30 mA RCBO/RCCB |
| B1-ac | Split AC | 20 A | B1-W1 | 1700 W | MCB sized to the unit nameplate |
| B1-wac | Window AC | 20 A | B1-B1 | 1900 W | MCB sized to the unit nameplate |

Points that follow furniture and must be re-checked if it moves: B1-S2 (bed), B1-E1 (bed), B1-E2 (bed), B1-C3 (bed), B1-B2 (balcony table).

Checked by the app: 9 of 9 rules pass (11 points; 6 openings; 7 pieces of furniture and door leaves; 2 doors; 3 bed sides, desks and seats; 2 AC units; 3 track runs and fans; 3 lighting circuits; 4 circuits).

The electrician must verify:

- The room has no scan: where today's switchboard, sockets and fan point are. Reuse them where they fall within 300 mm of a planned point.
- Whether the room keeps BOTH the split AC on the west wall and the window AC in the balcony; each has its own circuit here and one of them can be dropped.
- The window AC nameplate current and plug; the starter box and its MCB follow the nameplate.
- Which way the Lobby door and the washroom door hang (latch assumed on the east jamb of both).
- B1-E1, B1-E2, B1-S2 and B1-C3 follow the bed in roomShellConfig.js (bedroom1.furniture.bed) and must be re-checked if the bed moves.
- The old Lobby door is closed and its cavity becomes a medicine cabinet in the south wall (x 2400-3226): no box may go there.

## Bedroom 3

Status: proposed 2026-10-05; switchboard, wall light and fan point reuse the scanned positions. Shown on: Bedroom 3 page. 11 points; connected load about 4465 W.

| ID | Point | Where | What to fit | Use |
| --- | --- | --- | --- | --- |
| B3-N1 | Main switchboard (existing) | north wall, x 1468, 1300 high | new modular plate in the existing box: dimmers for track 1 and track 2, fan regulator, wall-light switch, 1 x 6 A socket | the existing switchboard X-B1 stays: it is on the latch side of the entry door (scan: 1300 high, 100 above the usual 1200) |
| B3-N2 | Toilet switches + dressing socket | north wall, x 3405, 1200 high | switches for the toilet light and exhaust; 20 A double-pole switch with indicator for the geyser; 1 x 6/16 A socket | on the 200 mm of wall between the toilet door and the mirrored dressing cabinet: the hair dryer at the mirror, and the toilet switches outside its door |
| B3-N3 | Utility socket | north wall, x 1750, 300 high | 1 x 6/16 A combined socket | vacuum cleaner, a room heater; on the free north wall between the two doors |
| B3-E1 | Bedside point, north sleeper | east wall, z 1099, 1300 high | 1 x 6 A socket + 1 USB-A + USB-C + 2-way switch for track 1 (north reading) | above the headboard and under the shelf (1650), 150 mm in from the north edge of the bed |
| B3-E2 | Bedside point, south sleeper | east wall, z 2528, 1300 high | 1 x 6 A socket + 1 USB-A + USB-C + 2-way switch for track 2 (south reading) | above the headboard and under the shelf, 250 mm in from the south edge of the bed |
| B3-E3 | AC point | east wall, z 2613, 2400 high | 1 x 16 A socket (or isolator) on its own circuit (hidden on purpose) | inside the overhead cabinet run, in the bay next to the AC bay: reached by opening that cabinet door, never behind the unit |
| B3-W1 | Chest-top point | west wall, z 2488, 950 high | 2 x 6 A sockets + 1 USB-A + USB-C | a lamp and chargers on the chest, 150 mm above its top and clear of the artwork |
| B3-W2 | Picture light (existing) | west wall, z 1880, 2230 high | the existing wall light point | kept as a picture light above the artwork over the chest; switched at B3-N1 |
| B3-C1 | Ceiling fan | ceiling, x 2030, z 1820 | the existing ceiling fan point | ceiling fan at the scanned medallion; regulator at B3-N1 |
| B3-C2 | Track 1 driver feed | ceiling, x 300, z 650 | switched 230 V point for the 60 W / 48 V track driver (dimmer at B3-N1) | at the west end of the north run, the end nearest the switchboard |
| B3-C3 | Track 2 driver feed | ceiling, x 300, z 3100 | switched 230 V point for the 60 W / 48 V track driver (dimmer at B3-N1) | at the west end of the south run |

Circuits (proposed breakers; the electrician sizes cables and breakers):

| Circuit | What | Breaker | Points | Connected load | Protection |
| --- | --- | --- | --- | --- | --- |
| B3-light | Lighting, fan and 6 A outlets | 10 A | B3-N1, B3-E1, B3-E2, B3-W1, B3-W2, B3-C1, B3-C2, B3-C3 | 705 W | 30 mA RCBO/RCCB |
| B3-power | Power sockets | 16 A | B3-N2, B3-N3 | 2060 W | 30 mA RCBO/RCCB |
| B3-ac | AC | 20 A | B3-E3 | 1700 W | MCB sized to the unit nameplate |

Points that follow furniture and must be re-checked if it moves: B3-E1 (bed), B3-E2 (bed), B3-W1 (west chest).

Checked by the app: 9 of 9 rules pass (11 points; 5 openings; 7 pieces of furniture and door leaves; 2 doors; 2 bed sides, desks and seats; 1 AC unit; 3 track runs and fans; 4 lighting circuits; 3 circuits).

The electrician must verify:

- No socket plate could be seen in the scan (furniture covers the lower walls): find today's sockets and reuse the boxes that fall near a planned point.
- Whether the white area above X-B1 in the scan is a second plate.
- Where the existing AC is fed from: the AC point moves into the overhead cabinet next to the AC bay.
- The geyser switch at B3-N2 assumes the toilet has a geyser fed from this room's board.

## Study (Bedroom 2)

Status: proposed 2026-10-05; no scan of this room: nothing existing is reused. Shown on: Study page. 9 points; connected load about 4355 W.

| ID | Point | Where | What to fit | Use |
| --- | --- | --- | --- | --- |
| ST-E1 | Main switchboard | east wall, z 975, 1200 high | dimmers for track 1 and track 2; fan regulator; 1 x 6 A socket | on the latch side of the entry door, in the 150 mm between the frame and the head of the bed |
| ST-E2 | Bedside point | east wall, z 1350, 900 high | 1 x 6 A socket + 1 USB-A + USB-C + 2-way switch for track 2 (reading) | beside the pillow, 200 mm above the bed's wall rail |
| ST-E3 | Desk point | east wall, z 3400, 950 high | 2 x 6 A sockets + 1 USB-A + USB-C + 1 CAT6 (optional) | laptop, lamp and chargers, 200 mm above the desk top |
| ST-S1 | Terrace door switch + socket | south wall, x 1839, 1200 high | switch for the terrace light; 1 x 6/16 A socket | between the south cabinet and the terrace door: the terrace light, and a socket for a heater or cooler |
| ST-W1 | Utility socket | west wall, z 1500, 300 high | 1 x 6/16 A combined socket | vacuum cleaner; on the free west wall between the bookshelf and the Home Office opening |
| ST-W2 | AC point (unit position assumed) | west wall, z 2350, 2300 high | 1 x 16 A socket (or isolator) on its own circuit | the Study has an AC (its outdoor unit is outside the Home Office west wall) but the indoor unit is not in the model: assumed on the west wall north of the opening; move this point beside the real unit |
| ST-C1 | Ceiling fan | ceiling, x 1620, z 2454 | ceiling fan point with a hook rated for the fan | ceiling fan (position assumed at the room centre, not measured); regulator at ST-E1 |
| ST-C2 | Track 1 driver feed | ceiling, x 2900, z 850 | switched 230 V point for the 60 W / 48 V track driver (dimmer at ST-E1) | at the east end of the bookshelf run, the end nearest the switchboard |
| ST-C3 | Track 2 driver feed | ceiling, x 2700, z 1900 | switched 230 V point for the 100 W / 48 V track driver (dimmer at ST-E1, 2-way at the bed) | at the north end of the bed-and-desk run |

Circuits (proposed breakers; the electrician sizes cables and breakers):

| Circuit | What | Breaker | Points | Connected load | Protection |
| --- | --- | --- | --- | --- | --- |
| ST-light | Lighting, fan and 6 A outlets | 10 A | ST-E1, ST-E2, ST-E3, ST-C1, ST-C2, ST-C3 | 635 W | 30 mA RCBO/RCCB |
| ST-power | Power sockets | 16 A | ST-S1, ST-W1 | 2020 W | 30 mA RCBO/RCCB |
| ST-ac | AC | 20 A | ST-W2 | 1700 W | MCB sized to the unit nameplate |

Points that follow furniture and must be re-checked if it moves: ST-E2 (bed (kids layout)), ST-E3 (desk (kids layout)).

Checked by the app: 9 of 9 rules pass (9 points; 4 openings; 5 pieces of furniture and door leaves; 2 doors; 2 bed sides, desks and seats; none in this room's model; 3 track runs and fans; 3 lighting circuits; 3 circuits).

The electrician must verify:

- This room has no scan: where today's switchboard, sockets, fan point and AC indoor unit are.
- The AC indoor unit is not modelled; ST-W2 is a placeholder on the west wall and no check covers it.
- The bed and desk follow the kids layout of rooms/study/StudyFurniture.js (mirrored in studyLightingConfig.js downTargets), which has no furniture config of its own.
- Which way the entry door and the terrace door hang (latch assumed at the south jamb of the entry door and the west jamb of the terrace door).
- Whether a terrace light exists and where it is switched today.

## Home Office

Status: the desk and equipment points are balconyOfficeConfig.js electrical (preliminary); the two points below are added 2026-10-05. Shown on: Home Office page (its own markers, plus HO-E1 and HO-C1). 9 points; connected load about 3320 W.

| ID | Point | Where | What to fit | Use |
| --- | --- | --- | --- | --- |
| HO-E1 | Light switch + socket | east wall, z 2000, 1200 high | switch for the ceiling light; 1 x 6 A socket | on the east return wall just south of the opening from the Study: the first wall at hand as you walk in |
| HO-C1 | Ceiling light | ceiling, x 600, z 1312 | ceiling light point | general light for the office; the Study tracks do not light this room |
| E1 | Water heater point (existing) | water-heater service area | verify dedicated 16 A point and accessible double-pole isolator | dedicated heater circuit; do not share with office electronics |
| E2 | Router point (existing) | northeast router bay | existing earthed socket; verify rating and condition | office electronics circuit |
| N1 | Desk feed | south bay of the rear cabinet, high rear service zone | 6/16 A three-pin earthed socket | feeds the moving eight-outlet under-desk power rail through a flexible service loop |
| N2 | PC / UPS points (N2 + N3) | north PC/UPS bay | two 6 A three-pin earthed sockets | PC or UPS plus one service/spare outlet |
| N4 | Printer point | fixed south-section cabinet, behind the printer shelf | 6 A three-pin earthed socket | printer |
| D1 | Data: CAT6 runs | router bay rear chase to the south-bay service zone and the desk dock; one active plus one spare | 2 x CAT6 | route separately from mains and cross mains only at right angles |
| P1 | Moving desk power rail | under the sit-stand top, x 406, z 1105, 728 high | 8-outlet rail (2 spare) | Lenovo monitor, BenQ monitor, laptop charger, dock, iPhone/Apple Watch charger, sit-stand desk motor; fed by single flexible service loop from the fixed centre-cabinet desk-feed point |

Circuits (proposed breakers; the electrician sizes cables and breakers):

| Circuit | What | Breaker | Points | Connected load | Protection |
| --- | --- | --- | --- | --- | --- |
| HO-heater | Water heater (existing, dedicated) | 16 A | E1 | 2000 W | 30 mA RCBO/RCCB |
| HO-office | Office electronics | 16 A | E2, N1, N2, N4, HO-E1 | 1300 W | 30 mA RCBO/RCCB |
| HO-light | Light (from the Study lighting circuit) | 10 A | HO-C1 | 20 W | 30 mA RCBO/RCCB |

Checked by the app: 9 of 9 rules pass (9 points; 3 openings; none in this room's model; none in this room's model; 1 bed side, desk or seat; none in this room's model; none in this room's model; 1 lighting circuit; 3 circuits).

The electrician must verify:

- Everything in balconyOfficeConfig.js electrical.protection.verification.
- Which of the scanned north-wall plates X1-X3 is the heater point and which the router point.
- The east return wall south of the opening is from the phone scan (about 1830 mm from the north wall); tape it before fixing HO-E1.
- Whether the office already has a ceiling or wall light.

## Main entry

Status: proposed 2026-10-05; nothing measured on site (OPEN_ITEMS A7). Shown on: Main entry page. 11 points; connected load about 1252 W.

| ID | Point | Where | What to fit | Use |
| --- | --- | --- | --- | --- |
| EN-1 | Corridor switch | corridor south wall (the shaft side), x 3072, 1200 high | switch for the corridor lights E1 + E2; 1 x 6 A socket | inside the corridor beside the outer door, on its latch side (owner: one switch at the door for the corridor lights) |
| EN-2 | Bell push | outer wall with the steel door, z 2031, 1100 high | bell push on the landing face of the wall | wired to the existing door chime X-D3 in the Drawing Room, which stays |
| EN-3 | Gallery switch (arrival door) | shaft wall facing the gallery, z 1760, 1200 high | 2-way switch for the gallery lights E3 + E4; 1 x 6 A socket | on the shaft wall beside the arrival door, on its latch side: the gallery lights as you step in |
| EN-4 | Gallery switch (Drawing Room door) | gallery east wall (plan x 515), from the Drawing Room wall, z 250, 1200 high | 2-way switch for the gallery lights E3 + E4 | beside the Drawing Room door (the lighting config's place for this switch). The latch side of that door is the east cabinet's doors, so the switch is on the hinge-side wall; the door swings away, into the Drawing Room |
| EN-5 | Utility socket | gallery east wall (plan x 515), from the Drawing Room wall, z 2700, 300 high | 1 x 6/16 A combined socket | vacuum cleaner, a shoe dryer, festival lights; between the fold-down seat and the shoe rack |
| EN-6 | Shoe rack light | gallery north wall (the shoe rack), x 567, 2000 high | LED strip with a door-contact switch (optional) (hidden on purpose) | inside the shoe rack: lights the shelves when the mirror doors open |
| EN-7 | Video door phone conduit | outer wall with the steel door, z 2031, 1500 high | 25 mm conduit with a CAT6 and a 12 V pair, ending in a blank plate (optional) | for a video doorbell or smart lock later, above the bell push |
| EN-L1 | Corridor light E1 | ceiling, x 2785, z 2553 | ceiling light point for the round LED panel, recessed in the PVC ceiling | fitting E1 of entryLightingConfig.js; switched at EN-1 |
| EN-L2 | Corridor light E2 | ceiling, x 1690, z 2553 | ceiling light point for the round LED panel, recessed in the PVC ceiling | fitting E2 of entryLightingConfig.js; switched at EN-1 |
| EN-L3 | Gallery light E3 | ceiling, x 576, z 2413 | ceiling light point for the round LED panel, surface-mounted on the slab | fitting E3 of entryLightingConfig.js; switched at EN-3 and EN-4 (2-way) |
| EN-L4 | Gallery light E4 | ceiling, x 576, z 663 | ceiling light point for the round LED panel, surface-mounted on the slab | fitting E4 of entryLightingConfig.js; switched at EN-3 and EN-4 (2-way) |

Circuits (proposed breakers; the electrician sizes cables and breakers):

| Circuit | What | Breaker | Points | Connected load | Protection |
| --- | --- | --- | --- | --- | --- |
| EN-light | Lighting and 6 A outlets | 10 A | EN-1, EN-3, EN-6, EN-L1, EN-L2, EN-L3, EN-L4 | 252 W | 30 mA RCBO/RCCB |
| EN-power | Power socket | 16 A | EN-5 | 1000 W | 30 mA RCBO/RCCB |

Checked by the app: 9 of 9 rules pass (11 points; 1 opening; 2 pieces of furniture and door leaves; 3 doors; none in this room's model; none in this room's model; none in this room's model; 2 lighting circuits; 2 circuits).

The electrician must verify:

- Nothing in the entry is measured; every position is from the A501 plan image.
- Which way the outer steel door hangs (hingeKnown is false in entryConfig.js); EN-1 and the bell push assume the latch on the south jamb.
- Where the existing bell push and the corridor light switch are today.
- If the AC outdoor unit goes in the bottom of the shoe rack (proposal, not decided), its supply and isolator come with that decision: not planned here.
- The key station drawn beside the arrival door has no charger: phones charge at E1 inside the Drawing Room.

## What the electrician must verify, for the whole flat

- The existing wiring: age and size of the conductors, the earthing, and whether there is any residual-current protection
  today. The plan assumes every socket circuit ends up behind 30 mA RCBO/RCCB protection.
- The distribution board X-D2 in the Drawing Room: how many ways it has, what each breaker feeds today, and whether it can
  take the circuits proposed here (18 for these six rooms, plus the Drawing Room and Kitchen) or needs a larger board or a
  sub-board.
- The sanctioned load of the flat against the air conditioners and heaters that can run together.
- Every breaker rating in the tables is a proposal for discussion. Cable sizes, breaker ratings and conduit routes are the
  electrician's design.
- Every position, on site, before chasing: most rooms are drawn from the A501 plan and a phone scan (about +/- 20 mm on
  small items, more on room sizes), and the furniture is still moving in Bedroom 1.
- Door hinge sides. A switchboard is planned on the latch side of each door; where the hinge side is assumed, the room's
  list says so, and the board mirrors to the other jamb if the door hangs the other way.
- The track-light drivers: each run has one 48 V driver fed from the point listed, switched and dimmed from the room
  switchboard. The driver type, its dimming method and where it physically sits (at the end of the track or in a nearby
  cabinet) follow the track system that is bought.
- Structure: no chase in a beam or column, and none deeper than the wall allows. The 9-inch wall between the Drawing Room
  and the entry pocket, and the walls of the shaft in the entry, need a look before anything is cut.
- Sockets three-pin with an effective earth, BIS-marked (IS 1293); modular boxes and plates; concealed PVC conduit;
  low-voltage cables (data, bell, 48 V track leads) in their own conduits.

## What is not planned

- The Kitchen (see the table at the top), the toilets and washrooms (only their switches outside the door are placed), the
  terrace, the Bedroom 3 balcony and the store.
- The geyser points inside the washrooms, exhaust fans, and the supply of the AC outdoor units (they are fed from the
  indoor units' circuits or as the AC installer specifies).
- Data beyond the Drawing Room and the Home Office: no CAT6 run is planned to the bedrooms except the optional one at the
  Study desk.
- An inverter or UPS circuit, a solar feed, CCTV and an intercom beyond the Drawing Room point.
