// Proposed electrical points for the rooms other than the Drawing Room and the Kitchen (owner request 2026-10-05). The
// Drawing Room keeps its own file (drawingElectricalConfig.js, same vocabulary) and the Kitchen its services overlay
// (src/kitchen/services.mjs). A PLANNING LAYOUT for a licensed electrician, NOT a wiring design: existing wiring, earthing,
// cable and breaker sizes, and every position must be verified on site. Doc: docs/ELECTRICAL_PLAN.md.
//
// Checks: src/domain/roomElectrical.mjs (generic, pure) on the room models of src/domain/roomElectricalModels.mjs, which
// read the shells, furniture, doors, lighting runs, fans and AC units from the existing configs. Nothing here repeats a
// room size or a furniture position: a point that follows a piece of furniture names an `anchor` and the model computes it.
//
// UNITS AND FRAMES. Millimetres. Every room: x from the room's west wall, z from its north wall, heightMm = box centre above
// the floor (the frames of roomShellConfig.js, studyRoomConfig.js, balconyOfficeConfig.js). The Main entry is the exception:
// its frame is the Main entry page's (entryConfig.js plan pixels x ENTRY.planScale): x from the plan x 515 wall (the gallery's
// EAST wall) growing WEST, z from the Drawing Room wall (plan y 715) growing NORTH, and its walls have their own names
// (roomElectricalModels.mjs, entryModel).
//
// A POINT
//   id, name, outlets (what to fit), use (why)
//   kind      'power' (socket outlets) | 'charging' (sockets with USB-A/C, within reach of a bed, desk or seat) |
//             'lighting' (light point, switchboard, fan, driver feed, junction box) | 'data' | 'dedicated' (its own circuit)
//   where it is, ONE of:
//     wall + alongMm + heightMm   wall 'north' | 'south' (alongMm is x) or 'east' | 'west' (alongMm is z), or a wall the
//                                 room model names (Bedroom 1 'balconyEast', the Main entry walls); alongMm from the wall's start
//     wall 'ceiling' + xMm, zMm   on the ceiling;   wall 'free' + xMm, zMm, heightMm: anywhere else (inside an alcove or a cabinet)
//     anchor: '<name>' (+ heightMm)   a position the model computes from furniture or equipment config (it follows the furniture)
//     existing: 'X-..'            the position of an existing point of existingElectricalConfig.js, which this point reuses
//     driverFor: '<run>' + runEnd 'from' | 'to'   on the ceiling at that end of a track-light run (the lighting config)
//     fan: n                      at the room's n-th ceiling fan (1-based; the lighting config or the scan)
//     fitting: '<id>'             at a ceiling fitting of the room's lighting config (Main entry)
//   switchboard: true   a switch plate: must be at switch height (1100-1400);  forDoor: the door (model door id) it serves
//   switches: [...]     the lighting circuits switched here (track run ids, 'chandelier', 'fan1', entry switch groups)
//   driverFor / fan / forAc / light   what the point feeds: a track driver, a ceiling fan, an AC unit, a light circuit
//   hidden: true        behind furniture, a door leaf or inside a cabinet ON PURPOSE;  optional: true  nice to have (grey marker)
//   dependsOn           the furniture whose position this point follows (it must be re-checked when that furniture moves)
//   loadW               connected load for the estimate when it is not the default of its kind (ELECTRICAL_LOAD_W below)
//   drawnBy: 'page'     the room's own page already draws this point (Home Office); the shared markers skip it
// A CIRCUIT: {id, name, mcbA (PROPOSED breaker, the electrician sizes it), rcd (30 mA protection), points: [ids]}. Every point
// is on exactly one circuit, except data-only points and junction boxes (`noLoad: true`).
//
// HEIGHTS, by common Indian practice (as drawingElectricalConfig.js): switchboards 1200; low sockets 300; a socket above a
// desk, chest or table 150-250 above its top; bedside points above the headboard (1170 in these models) at 1300; AC points
// beside the indoor unit at 2300; driver feeds at the ceiling.
export const ELECTRICAL_HEIGHTS_MM = {switchboard: 1200, lowSocket: 300, aboveHeadboard: 1300, splitAc: 2300}

// Estimating figures (connected load, not measured): the usual Indian rule of thumb of 100 W per 6 A outlet point and
// 1000 W per 16 A outlet point; light points at their fitting or driver watts; typical nameplates for the fixed appliances.
// The total per room is CONNECTED load; what runs together is much less. The electrician sizes cables and breakers.
export const ELECTRICAL_LOAD_W = {
  socket6A: 100, socket16A: 1000, switchboard: 100, fan: 75, lightPoint: 20,
  splitAc15Ton: 1700, windowAc15Ton: 1900, storageWaterHeater: 2000,
}
// A circuit may carry at most this share of its breaker rating at 230 V (the same 80% rule the track drivers use).
export const CIRCUIT_LOADING_MAX = 0.8
export const SUPPLY_VOLTS = 230

const SAFETY = 'All sockets three-pin with an effective earth, BIS-marked (IS 1293); modular boxes and plates; concealed PVC conduit; every socket circuit behind 30 mA RCBO/RCCB protection. A licensed electrician must confirm the existing wiring, earthing, cable sizes and MCB/RCBO ratings before any chasing.'
const W = ELECTRICAL_LOAD_W

export const ROOM_ELECTRICAL = {
  // ---------------------------------------------------------------- Lobby / Dining
  lobby: {
    room: 'Lobby / Dining', status: 'proposed 2026-10-05; nothing verified on site',
    points: [
      {id: 'L-N1', name: 'Main switchboard', kind: 'lighting', wall: 'north', anchor: 'bedroom1DoorLatch', heightMm: 1200, switchboard: true, forDoor: 'bedroom1', replaces: 'X-L1',
        switches: ['chandelier', 'L1', 'L2', 'fan1'], loadW: W.switchboard,
        outlets: 'dimmers for the dining pendant, track 1 and track 2; fan regulator; wall-light switch; 1 x 6 A socket',
        use: 'takes over from the existing switchboard X-L1, which stands in the planned Bedroom 1 door; on the latch side of that door, 200 mm past the frame, and the first wall you pass coming from the Drawing Room'},
      {id: 'L-N2', name: 'Junction box above the door', kind: 'lighting', wall: 'north', alongMm: 475, heightMm: 2300, noLoad: true, replaces: 'X-L1',
        outlets: 'junction box with a screwed blank plate, kept reachable (never plastered over)',
        use: 'the riser of the old switchboard X-L1 is cut back to here, above the new door head (2100), and extended across the lintel to L-N1'},
      {id: 'L-N3', name: 'Dining point', kind: 'charging', wall: 'north', anchor: 'diningTableWall', heightMm: 900,
        outlets: '2 x 6 A sockets + 1 USB-A + USB-C', loadW: 2 * W.socket6A,
        use: 'phones and a laptop at the dining table, 155 mm above the table top; a kettle or toaster stays in the kitchen (no 16 A outlet here: owner to confirm)'},
      {id: 'L-N4', name: 'AC point', kind: 'dedicated', wall: 'north', anchor: 'acBeside:split', heightMm: 2300, forAc: 'split', loadW: W.splitAc15Ton,
        outlets: '1 x 16 A socket (or isolator) on its own circuit', use: 'the split AC indoor unit on the north wall; beside the unit, not behind it'},
      {id: 'L-E1', name: 'Iron point', kind: 'power', wall: 'east', anchor: 'ironingStorageMiddle', heightMm: 1250, loadW: W.socket16A,
        outlets: '1 x 16 A socket with a switch and an indicator lamp', use: 'the iron, above the ironing storage unit (1000 high) where the board pulls out'},
      {id: 'L-E2', name: 'Utility socket', kind: 'power', wall: 'east', alongMm: 350, heightMm: 300, loadW: W.socket16A,
        outlets: '1 x 6/16 A combined socket', use: 'vacuum cleaner, festival lights, a room heater; in the corner between the Pooja opening and the ironing storage'},
      {id: 'L-S1', name: 'Toilet switches', kind: 'lighting', wall: 'south', anchor: 'toiletDoorLatch', heightMm: 1200, switchboard: true, forDoor: 'toilet', loadW: 60,
        outlets: 'switches for the toilet light and exhaust fan', use: 'outside the toilet door, on its latch side (the hinge side of the door is not recorded: mirror this if it hangs the other way)'},
      {id: 'L-S2', name: 'Track 1 driver feed', kind: 'lighting', existing: 'X-L3', driverFor: 'L1',
        outlets: 'switched 230 V point for the 60 W / 48 V track driver (dimmer at L-N1)', use: 'reuses the existing tube-light point on the south wall, 540 mm from the run; the tube light comes off'},
      {id: 'L-C1', name: 'Dining pendant', kind: 'lighting', anchor: 'diningTableCentre', light: 'chandelier', loadW: 30,
        outlets: 'ceiling light point with a hook', use: 'the linear pendant over the dining table, dimmed at L-N1'},
      {id: 'L-C2', name: 'Ceiling fan', kind: 'lighting', existing: 'X-L4', fan: 1, loadW: W.fan,
        outlets: 'ceiling fan point with a hook rated for the fan', use: 'the existing centre ceiling point (medallion); regulator at L-N1'},
      {id: 'L-C3', name: 'Track 2 driver feed', kind: 'lighting', existing: 'X-L5', driverFor: 'L2',
        outlets: 'switched 230 V point for the 60 W / 48 V track driver (dimmer at L-N1)', use: 'reuses the existing small ceiling light point, 280 mm from the run; that light comes off'},
      {id: 'L-P1', name: 'Pooja light and socket', kind: 'lighting', anchor: 'poojaAlcoveSide', heightMm: 1200, hidden: true, loadW: W.switchboard + W.lightPoint,
        outlets: 'switch for the alcove light + 1 x 6 A socket', use: 'inside the Pooja alcove, on its west return behind the doors: the alcove light and an electric diya or bell'},
    ],
    circuits: [
      {id: 'L-light', name: 'Lighting, fan and 6 A outlets', mcbA: 10, rcd: true, points: ['L-N1', 'L-N3', 'L-S1', 'L-S2', 'L-C1', 'L-C2', 'L-C3', 'L-P1']},
      {id: 'L-power', name: 'Power sockets', mcbA: 16, rcd: true, points: ['L-E1', 'L-E2']},
      {id: 'L-ac', name: 'AC', mcbA: 20, rcd: false, points: ['L-N4']},
    ],
    verify: [
      'Where the feed of the existing switchboard X-L1 comes from (ceiling or floor) before the Bedroom 1 door opening is cut; the junction box L-N2 assumes it drops from above.',
      'Which way the Bedroom 1 door and the toilet door hang: L-N1 and L-S1 assume the latch on the east jamb.',
      'Whether the centre ceiling point X-L4 is a fan point with a hook rated for a fan.',
      'Whether the toilet already has its switches outside the door (not visible in the scan).',
      'Two-way switching for the lobby lights from the kitchen side (east opening) is not planned: owner to decide.',
    ],
    safety: SAFETY,
  },
  // ---------------------------------------------------------------- Bedroom 1
  bedroom1: {
    room: 'Bedroom 1', status: 'proposed 2026-10-05; the room is being redesigned: the points marked dependsOn follow the furniture config',
    points: [
      {id: 'B1-S1', name: 'Main switchboard', kind: 'lighting', wall: 'south', anchor: 'lobbyDoorLatch', heightMm: 1200, switchboard: true, forDoor: 'lobby',
        switches: ['B1', 'B2', 'fan1'], loadW: W.switchboard,
        outlets: 'dimmers for track 1 and track 2 (2-way with the bedside points); fan regulator; 1 x 6 A socket',
        use: 'on the latch side of the door from the Lobby, 150 mm past the frame'},
      {id: 'B1-S2', name: 'Utility socket', kind: 'power', wall: 'south', anchor: 'lobbyDoorLatch', alongOffsetMm: 200, heightMm: 300, dependsOn: 'bed', loadW: W.socket16A,
        outlets: '1 x 6/16 A combined socket', use: 'vacuum cleaner, a room heater, an iron; between the door and the foot of the bed'},
      {id: 'B1-N1', name: 'Washroom switches', kind: 'lighting', wall: 'north', anchor: 'washroomDoorLatch', heightMm: 1200, switchboard: true, forDoor: 'washroom', loadW: 60,
        outlets: 'switches for the washroom light and exhaust; 20 A double-pole switch with indicator for the geyser',
        use: 'outside the washroom door, on its latch side; the geyser point itself is inside the washroom and is not planned here'},
      {id: 'B1-W1', name: 'AC point (split unit)', kind: 'dedicated', wall: 'west', anchor: 'acBeside:split', heightMm: 2300, forAc: 'split', loadW: W.splitAc15Ton,
        outlets: '1 x 16 A socket (or isolator) on its own circuit', use: 'the split AC indoor unit on the west wall south of the wardrobe; beside the unit, above the open door leaf'},
      {id: 'B1-E1', name: 'Bedside point, north sleeper', kind: 'charging', anchor: 'bedsideA', heightMm: 1300, dependsOn: 'bed',
        outlets: '1 x 6 A socket + 1 USB-A + USB-C + 2-way switch for track 2 (reading)', loadW: W.socket6A,
        use: 'above the headboard on the first solid stretch of the head wall; phone, lamp, and the reading lights without getting up'},
      {id: 'B1-E2', name: 'Bedside point, south sleeper', kind: 'charging', anchor: 'bedsideB', heightMm: 1300, dependsOn: 'bed',
        outlets: '1 x 6 A socket + 1 USB-A + USB-C + 2-way switch for track 2 (reading)', loadW: W.socket6A,
        use: 'above the headboard, 250 mm in from the wall-side edge of the bed'},
      {id: 'B1-C1', name: 'Ceiling fan', kind: 'lighting', fan: 1, loadW: W.fan,
        outlets: 'ceiling fan point with a hook rated for the fan', use: 'ceiling fan (position assumed at the room centre, not measured); regulator at B1-S1'},
      {id: 'B1-C2', name: 'Track 1 driver feed', kind: 'lighting', driverFor: 'B1', runEnd: 'to',
        outlets: 'switched 230 V point for the 100 W / 48 V track driver (dimmer at B1-S1)', use: 'at the south end of the wardrobe run, the end nearest the switchboard'},
      {id: 'B1-C3', name: 'Track 2 driver feed', kind: 'lighting', driverFor: 'B2', runEnd: 'to', dependsOn: 'bed',
        outlets: 'switched 230 V point for the 60 W / 48 V track driver (dimmer at B1-S1, 2-way at the bed)', use: 'at the south end of the run over the bed'},
      {id: 'B1-B1', name: 'Window AC point', kind: 'dedicated', wall: 'balconyEast', anchor: 'windowAcSocket', heightMm: 850, forAc: 'window', loadW: W.windowAc15Ton,
        outlets: '1 x 16 A socket in an AC starter box with a 20 A double-pole MCB, on its own circuit',
        use: 'the owner\'s 1.5 ton window AC on the balcony parapet: on the inside face of the parapet just north of the unit, below its underside, within its cord'},
      {id: 'B1-B2', name: 'Balcony table point', kind: 'charging', wall: 'balconyEast', anchor: 'balconyTable', heightMm: 900, dependsOn: 'balcony table',
        outlets: '1 x 6 A socket + 1 USB-A + USB-C', loadW: W.socket6A, use: 'laptop and phone at the balcony table, on the parapet 160 mm above the table top'},
    ],
    circuits: [
      {id: 'B1-light', name: 'Lighting, fan and 6 A outlets', mcbA: 10, rcd: true, points: ['B1-S1', 'B1-N1', 'B1-E1', 'B1-E2', 'B1-C1', 'B1-C2', 'B1-C3', 'B1-B2']},
      {id: 'B1-power', name: 'Power socket', mcbA: 16, rcd: true, points: ['B1-S2']},
      {id: 'B1-ac', name: 'Split AC', mcbA: 20, rcd: false, points: ['B1-W1']},
      {id: 'B1-wac', name: 'Window AC', mcbA: 20, rcd: false, points: ['B1-B1']},
    ],
    verify: [
      'The room has no scan: where today\'s switchboard, sockets and fan point are. Reuse them where they fall within 300 mm of a planned point.',
      'Whether the room keeps BOTH the split AC on the west wall and the window AC in the balcony; each has its own circuit here and one of them can be dropped.',
      'The window AC nameplate current and plug; the starter box and its MCB follow the nameplate.',
      'Which way the Lobby door and the washroom door hang (latch assumed on the east jamb of both).',
      'B1-E1, B1-E2, B1-S2 and B1-C3 follow the bed in roomShellConfig.js (bedroom1.furniture.bed) and must be re-checked if the bed moves.',
      'The old Lobby door is closed and its cavity becomes a medicine cabinet in the south wall (x 2400-3226): no box may go there.',
    ],
    safety: SAFETY,
  },
  // ---------------------------------------------------------------- Bedroom 3
  bedroom3: {
    room: 'Bedroom 3', status: 'proposed 2026-10-05; switchboard, wall light and fan point reuse the scanned positions',
    points: [
      {id: 'B3-N1', name: 'Main switchboard (existing)', kind: 'lighting', existing: 'X-B1', switchboard: true, forDoor: 'entry',
        switches: ['B1', 'B2', 'fan1', 'wallLight'], loadW: W.switchboard,
        outlets: 'new modular plate in the existing box: dimmers for track 1 and track 2, fan regulator, wall-light switch, 1 x 6 A socket',
        use: 'the existing switchboard X-B1 stays: it is on the latch side of the entry door (scan: 1300 high, 100 above the usual 1200)'},
      // Owner 2026-10-05: the dressing moved to the south end of the east wall, so the dressing socket left this board (was
      // 'Toilet switches + dressing socket', 1060 W with a 6/16 A socket) and became B3-S1 beside the mirror.
      {id: 'B3-N2', name: 'Toilet switches', kind: 'lighting', wall: 'north', anchor: 'toiletDoorLatch', heightMm: 1200, switchboard: true, forDoor: 'toilet', loadW: 60,
        outlets: 'switches for the toilet light and exhaust; 20 A double-pole switch with indicator for the geyser',
        use: 'on the wall just west of the toilet door (the storage cabinet now fills the wall east of it): the toilet switches outside its door'},
      {id: 'B3-S1', name: 'Dressing socket', kind: 'power', wall: 'south', anchor: 'dressingSocket', heightMm: 750, dependsOn: 'dressing cabinet', loadW: W.socket16A,
        outlets: '1 x 6/16 A combined socket',
        use: 'the hair dryer and a trimmer at the mirror: on the south wall under the balcony window sill (920), 250 mm west of the dressing cabinet front, beside the standing spot'},
      {id: 'B3-N3', name: 'Utility socket', kind: 'power', wall: 'north', alongMm: 1750, heightMm: 300, loadW: W.socket16A,
        outlets: '1 x 6/16 A combined socket', use: 'vacuum cleaner, a room heater; on the free north wall between the two doors'},
      {id: 'B3-E1', name: 'Bedside point, north sleeper', kind: 'charging', anchor: 'bedsideA', heightMm: 1300, dependsOn: 'bed',
        outlets: '1 x 6 A socket + 1 USB-A + USB-C + 2-way switch for track 1 (north reading)', loadW: W.socket6A,
        use: 'above the headboard and under the shelf (1650), 150 mm in from the north edge of the bed'},
      {id: 'B3-E2', name: 'Bedside point, south sleeper', kind: 'charging', anchor: 'bedsideB', heightMm: 1300, dependsOn: 'bed',
        outlets: '1 x 6 A socket + 1 USB-A + USB-C + 2-way switch for track 2 (south reading)', loadW: W.socket6A,
        use: 'above the headboard and under the shelf, 250 mm in from the south edge of the bed'},
      {id: 'B3-E3', name: 'AC point', kind: 'dedicated', wall: 'east', anchor: 'acBeside:split', heightMm: 2400, hidden: true, forAc: 'split', loadW: W.splitAc15Ton,
        outlets: '1 x 16 A socket (or isolator) on its own circuit', use: 'inside the overhead cabinet run, in the bay next to the AC bay: reached by opening that cabinet door, never behind the unit'},
      {id: 'B3-W1', name: 'Chest-top point', kind: 'charging', wall: 'west', anchor: 'westChestSouthEnd', heightMm: 950, dependsOn: 'west chest',
        outlets: '2 x 6 A sockets + 1 USB-A + USB-C', loadW: 2 * W.socket6A, use: 'a lamp and chargers on the chest, 150 mm above its top and clear of the artwork'},
      {id: 'B3-W2', name: 'Picture light (existing)', kind: 'lighting', existing: 'X-B2', light: 'wallLight', loadW: 10,
        outlets: 'the existing wall light point', use: 'kept as a picture light above the artwork over the chest; switched at B3-N1'},
      {id: 'B3-C1', name: 'Ceiling fan', kind: 'lighting', fan: 1, loadW: W.fan,
        outlets: 'the existing ceiling fan point', use: 'ceiling fan at the scanned medallion; regulator at B3-N1'},
      {id: 'B3-C2', name: 'Track 1 driver feed', kind: 'lighting', driverFor: 'B1', runEnd: 'from',
        outlets: 'switched 230 V point for the 60 W / 48 V track driver (dimmer at B3-N1)', use: 'at the west end of the north run, the end nearest the switchboard'},
      {id: 'B3-C3', name: 'Track 2 driver feed', kind: 'lighting', driverFor: 'B2', runEnd: 'from',
        outlets: 'switched 230 V point for the 100 W / 48 V track driver (dimmer at B3-N1)', use: 'at the west end of the south run (its driver went from 60 to 100 W when the dressing light joined it, 2026-10-05)'},
    ],
    circuits: [
      {id: 'B3-light', name: 'Lighting, fan and 6 A outlets', mcbA: 10, rcd: true, points: ['B3-N1', 'B3-E1', 'B3-E2', 'B3-W1', 'B3-W2', 'B3-C1', 'B3-C2', 'B3-C3']},
      // B3-N2 stays here for the geyser switch it carries (see verify).
      {id: 'B3-power', name: 'Power sockets', mcbA: 16, rcd: true, points: ['B3-N2', 'B3-N3', 'B3-S1']},
      {id: 'B3-ac', name: 'AC', mcbA: 20, rcd: false, points: ['B3-E3']},
    ],
    verify: [
      'No socket plate could be seen in the scan (furniture covers the lower walls): find today\'s sockets and reuse the boxes that fall near a planned point.',
      'Whether the white area above X-B1 in the scan is a second plate.',
      'Where the existing AC is fed from: the AC point moves into the overhead cabinet next to the AC bay.',
      'The geyser switch at B3-N2 assumes the toilet has a geyser fed from this room\'s board.',
      'B3-S1 follows the dressing cabinet (moved to the south end 2026-10-05): under the balcony window sill, so check the wall below the sill is solid masonry and the sill does not project over the box.',
    ],
    safety: SAFETY,
  },
  // ---------------------------------------------------------------- Study (Bedroom 2)
  study: {
    room: 'Study (Bedroom 2)', status: 'proposed 2026-10-05; no scan of this room: nothing existing is reused',
    points: [
      {id: 'ST-E1', name: 'Main switchboard', kind: 'lighting', wall: 'east', anchor: 'mainDoorLatch', heightMm: 1200, switchboard: true, forDoor: 'main',
        switches: ['S1', 'S2', 'fan1'], loadW: W.switchboard,
        outlets: 'dimmers for track 1 and track 2; fan regulator; 1 x 6 A socket', use: 'on the latch side of the entry door, in the 150 mm between the frame and the head of the bed'},
      {id: 'ST-E2', name: 'Bedside point', kind: 'charging', wall: 'east', anchor: 'bedside', heightMm: 900, dependsOn: 'bed (kids layout)',
        outlets: '1 x 6 A socket + 1 USB-A + USB-C + 2-way switch for track 2 (reading)', loadW: W.socket6A, use: 'beside the pillow, 200 mm above the bed\'s wall rail'},
      {id: 'ST-E3', name: 'Desk point', kind: 'charging', wall: 'east', anchor: 'desk', heightMm: 950, dependsOn: 'desk (kids layout)',
        outlets: '2 x 6 A sockets + 1 USB-A + USB-C + 1 CAT6 (optional)', loadW: 2 * W.socket6A, use: 'laptop, lamp and chargers, 200 mm above the desk top'},
      {id: 'ST-S1', name: 'Terrace door switch + socket', kind: 'power', wall: 'south', anchor: 'terraceDoorLatch', heightMm: 1200, switchboard: true, forDoor: 'terrace', loadW: W.socket16A + W.lightPoint,
        outlets: 'switch for the terrace light; 1 x 6/16 A socket', use: 'between the south cabinet and the terrace door: the terrace light, and a socket for a heater or cooler'},
      {id: 'ST-W1', name: 'Utility socket', kind: 'power', wall: 'west', alongMm: 1500, heightMm: 300, loadW: W.socket16A,
        outlets: '1 x 6/16 A combined socket', use: 'vacuum cleaner; on the free west wall between the bookshelf and the Home Office opening'},
      {id: 'ST-W2', name: 'AC point (unit position assumed)', kind: 'dedicated', wall: 'west', alongMm: 2350, heightMm: 2300, loadW: W.splitAc15Ton, assumed: true,
        outlets: '1 x 16 A socket (or isolator) on its own circuit', use: 'beside the AC indoor unit of the Study, which the AC plan draws on the west wall just north of the Home Office opening (its real position was never recorded; the outdoor unit is outside the Home Office west wall): move this point beside the real unit'},
      {id: 'ST-C1', name: 'Ceiling fan', kind: 'lighting', fan: 1, loadW: W.fan,
        outlets: 'ceiling fan point with a hook rated for the fan', use: 'ceiling fan (position assumed at the room centre, not measured); regulator at ST-E1'},
      {id: 'ST-C2', name: 'Track 1 driver feed', kind: 'lighting', driverFor: 'S1', runEnd: 'to',
        outlets: 'switched 230 V point for the 60 W / 48 V track driver (dimmer at ST-E1)', use: 'at the east end of the bookshelf run, the end nearest the switchboard'},
      {id: 'ST-C3', name: 'Track 2 driver feed', kind: 'lighting', driverFor: 'S2', runEnd: 'from',
        outlets: 'switched 230 V point for the 100 W / 48 V track driver (dimmer at ST-E1, 2-way at the bed)', use: 'at the north end of the bed-and-desk run'},
    ],
    circuits: [
      {id: 'ST-light', name: 'Lighting, fan and 6 A outlets', mcbA: 10, rcd: true, points: ['ST-E1', 'ST-E2', 'ST-E3', 'ST-C1', 'ST-C2', 'ST-C3']},
      {id: 'ST-power', name: 'Power sockets', mcbA: 16, rcd: true, points: ['ST-S1', 'ST-W1']},
      {id: 'ST-ac', name: 'AC', mcbA: 20, rcd: false, points: ['ST-W2']},
    ],
    verify: [
      'This room has no scan: where today\'s switchboard, sockets, fan point and AC indoor unit are.',
      'The AC indoor unit is drawn where the AC plan assumes it (docs/AC_PLAN.md); ST-W2 follows that assumed position and must move with the real unit.',
      'The bed and desk follow the kids layout of rooms/study/StudyFurniture.js (mirrored in studyLightingConfig.js downTargets), which has no furniture config of its own.',
      'Which way the entry door and the terrace door hang (latch assumed at the south jamb of the entry door and the west jamb of the terrace door).',
      'Whether a terrace light exists and where it is switched today.',
    ],
    safety: SAFETY,
  },
  // ---------------------------------------------------------------- Home Office (the Balcony office)
  // The desk, PC, printer, heater, router and data points are NOT repeated here: they are BALCONY_OFFICE.electrical in
  // balconyOfficeConfig.js, read by the model (officeModel) and drawn by the Home Office page's own markers (E1-E2, N1-N4,
  // D1, P1). Only what that block lacks is added: the room light and its switch.
  office: {
    room: 'Home Office', status: 'the desk and equipment points are balconyOfficeConfig.js electrical (preliminary); the two points below are added 2026-10-05',
    fromConfig: 'BALCONY_OFFICE.electrical',
    points: [
      {id: 'HO-E1', name: 'Light switch + socket', kind: 'lighting', wall: 'east', anchor: 'eastReturn', heightMm: 1200, switchboard: true, switches: ['officeLight'], loadW: W.switchboard,
        outlets: 'switch for the ceiling light; 1 x 6 A socket', use: 'on the east return wall just south of the opening from the Study: the first wall at hand as you walk in'},
      {id: 'HO-C1', name: 'Ceiling light', kind: 'lighting', wall: 'ceiling', anchor: 'roomCentre', light: 'officeLight', loadW: W.lightPoint,
        outlets: 'ceiling light point', use: 'general light for the office; the Study tracks do not light this room'},
    ],
    circuits: [
      {id: 'HO-heater', name: 'Water heater (existing, dedicated)', mcbA: 16, rcd: true, points: ['E1']},
      {id: 'HO-office', name: 'Office electronics', mcbA: 16, rcd: true, points: ['E2', 'N1', 'N2', 'N4', 'HO-E1']},
      {id: 'HO-light', name: 'Light (from the Study lighting circuit)', mcbA: 10, rcd: true, points: ['HO-C1']},
    ],
    verify: [
      'Everything in balconyOfficeConfig.js electrical.protection.verification.',
      'Which of the scanned north-wall plates X1-X3 is the heater point and which the router point.',
      'The east return wall south of the opening is from the phone scan (about 1830 mm from the north wall); tape it before fixing HO-E1.',
      'Whether the office already has a ceiling or wall light.',
    ],
    safety: SAFETY,
  },
  // ---------------------------------------------------------------- Main entry (walls named in roomElectricalModels.mjs)
  entry: {
    room: 'Main entry', status: 'proposed 2026-10-05; nothing measured on site (OPEN_ITEMS A7)',
    points: [
      {id: 'EN-1', name: 'Corridor switch', kind: 'lighting', wall: 'corridorSouth', anchor: 'outerDoorInside', heightMm: 1200, switchboard: true, forDoor: 'outer', switches: ['S1'], loadW: W.switchboard,
        outlets: 'switch for the corridor lights E1 + E2; 1 x 6 A socket', use: 'inside the corridor beside the outer door, on its latch side (owner: one switch at the door for the corridor lights)'},
      {id: 'EN-2', name: 'Bell push', kind: 'data', wall: 'outerWall', anchor: 'outerDoorLatchStrip', heightMm: 1100, noLoad: true,
        outlets: 'bell push on the landing face of the wall', use: 'wired to the existing door chime X-D3 in the Drawing Room, which stays'},
      {id: 'EN-3', name: 'Gallery switch (arrival door)', kind: 'lighting', wall: 'shaftFace', anchor: 'arrivalDoorLatch', heightMm: 1200, switchboard: true, forDoor: 'arrival', switches: ['S2'], loadW: W.switchboard,
        outlets: '2-way switch for the gallery lights E3 + E4; 1 x 6 A socket', use: 'on the shaft wall beside the arrival door, on its latch side: the gallery lights as you step in'},
      {id: 'EN-4', name: 'Gallery switch (Drawing Room door)', kind: 'lighting', wall: 'galleryEast', alongMm: 250, heightMm: 1200, switchboard: true, forDoor: 'drawing', switches: ['S2'], noLoad: true,
        outlets: '2-way switch for the gallery lights E3 + E4', use: 'beside the Drawing Room door (the lighting config\'s place for this switch). The latch side of that door is the east cabinet\'s doors, so the switch is on the hinge-side wall; the door swings away, into the Drawing Room'},
      {id: 'EN-5', name: 'Utility socket', kind: 'power', wall: 'galleryEast', alongMm: 2700, heightMm: 300, loadW: W.socket16A,
        outlets: '1 x 6/16 A combined socket', use: 'vacuum cleaner, a shoe dryer, festival lights; between the fold-down seat and the shoe rack'},
      {id: 'EN-6', name: 'Shoe rack light', kind: 'lighting', wall: 'galleryNorth', anchor: 'shoeRackMiddle', heightMm: 2000, hidden: true, optional: true, loadW: W.lightPoint,
        outlets: 'LED strip with a door-contact switch', use: 'inside the shoe rack: lights the shelves when the mirror doors open'},
      {id: 'EN-7', name: 'Video door phone conduit', kind: 'data', wall: 'outerWall', anchor: 'outerDoorLatchStrip', heightMm: 1500, optional: true, noLoad: true,
        outlets: '25 mm conduit with a CAT6 and a 12 V pair, ending in a blank plate', use: 'for a video doorbell or smart lock later, above the bell push'},
      {id: 'EN-L1', name: 'Corridor light E1', kind: 'lighting', fitting: 'E1', light: 'S1',
        outlets: 'ceiling light point for the round LED panel, recessed in the PVC ceiling', use: 'fitting E1 of entryLightingConfig.js; switched at EN-1'},
      {id: 'EN-L2', name: 'Corridor light E2', kind: 'lighting', fitting: 'E2', light: 'S1',
        outlets: 'ceiling light point for the round LED panel, recessed in the PVC ceiling', use: 'fitting E2 of entryLightingConfig.js; switched at EN-1'},
      {id: 'EN-L3', name: 'Gallery light E3', kind: 'lighting', fitting: 'E3', light: 'S2',
        outlets: 'ceiling light point for the round LED panel, surface-mounted on the slab', use: 'fitting E3 of entryLightingConfig.js; switched at EN-3 and EN-4 (2-way)'},
      {id: 'EN-L4', name: 'Gallery light E4', kind: 'lighting', fitting: 'E4', light: 'S2',
        outlets: 'ceiling light point for the round LED panel, surface-mounted on the slab', use: 'fitting E4 of entryLightingConfig.js; switched at EN-3 and EN-4 (2-way)'},
    ],
    circuits: [
      {id: 'EN-light', name: 'Lighting and 6 A outlets', mcbA: 10, rcd: true, points: ['EN-1', 'EN-3', 'EN-6', 'EN-L1', 'EN-L2', 'EN-L3', 'EN-L4']},
      {id: 'EN-power', name: 'Power socket', mcbA: 16, rcd: true, points: ['EN-5']},
    ],
    verify: [
      'Nothing in the entry is measured; every position is from the A501 plan image.',
      'Which way the outer steel door hangs (hingeKnown is false in entryConfig.js); EN-1 and the bell push assume the latch on the south jamb.',
      'Where the existing bell push and the corridor light switch are today.',
      'If the AC outdoor unit goes in the bottom of the shoe rack (proposal, not decided), its supply and isolator come with that decision: not planned here.',
      'The key station drawn beside the arrival door has no charger: phones charge at E1 inside the Drawing Room.',
    ],
    safety: SAFETY,
  },
}

// Where each plan is shown: the room key of EmptyRoomGallery.jsx, or the page that draws it.
export const ROOM_ELECTRICAL_PAGES = {
  lobby: 'Lobby / Dining page', bedroom1: 'Bedroom 1 page', bedroom3: 'Bedroom 3 page', study: 'Study page',
  office: 'Home Office page (its own markers, plus HO-E1 and HO-C1)', entry: 'Main entry page',
}
