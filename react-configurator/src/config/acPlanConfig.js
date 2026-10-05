// One air-conditioning plan for the whole home (2026-10-05). A PROPOSAL built on typical figures: nothing here is measured
// on site and an AC dealer / installer confirms every size, route and clearance. Checks: src/domain/acPlan.mjs;
// owner's summary: docs/AC_PLAN.md.
//
// UNITS AND FRAMES
//  - Millimetres unless a name says otherwise (M = metres, W = watts).
//  - A point on a route is a "waypoint", in one of these forms (resolved by resolveWaypoint in the domain module):
//      at(frame, xMm, zMm, heightMm)  a room frame: x from that room's WEST wall growing east, z from its NORTH wall growing
//                                     south, height above the floor. Negative or past-the-wall values are outside the room.
//      {outdoor: id, heightMm?}       the centre of an outdoor unit of acOutdoorUnitsConfig.js (default height: its valves)
//      {discharge: id, heightMm?}     a drain point of AC_DISCHARGE_POINTS (default height: the point itself)
//      {planX, planY, heightMm}       plan pixels of the 800 x 875 plan image: x grows WEST, y grows NORTH (the same frame as
//                                     acOutdoorUnitsConfig.js); ENTRY.planScale gives metres per pixel.
//  - The room frames map onto the plan through each room's plan bounds (AC_FRAMES), exactly as Whole home 3D places rooms.
// Positions come from the existing room, lighting and electrical configs wherever those hold the number; only what is new
// (waypoint offsets, heights of pipe runs) is typed here.
import {EMPTY_ROOM_SHELLS} from './roomShellConfig.js'
import {HOME_ROOM_LAYOUTS} from './homeRoomViews.js'
import {STUDY_ROOM} from './studyRoomConfig.js'
import {BALCONY_OFFICE} from './balconyOfficeConfig.js'
import {KITCHEN} from './kitchenConfig.js'
import {ENTRY} from './entryConfig.js'
import {AC_OUTDOOR_UNITS, AC_OUTDOOR_UNIT_SIZES} from './acOutdoorUnitsConfig.js'
import {DRAWING_LIGHTING} from './drawingLightingConfig.js'
import {LOBBY_LIGHTING} from './lobbyLightingConfig.js'
import {BEDROOM1_LIGHTING, bedroom1DownTargets} from './bedroom1LightingConfig.js'
import {BEDROOM3_LIGHTING, bedroom3DownTargets} from './bedroom3LightingConfig.js'
import {STUDY_LIGHTING} from './studyLightingConfig.js'
import {DRAWING_ELECTRICAL} from './drawingElectricalConfig.js'

const {drawing, lobby, bedroom1, bedroom3} = EMPTY_ROOM_SHELLS
const study = STUDY_ROOM.dimensions, office = BALCONY_OFFICE.dimensions
const bounds = key => HOME_ROOM_LAYOUTS.find(room => room.key === key).bounds
const at = (frame, xMm, zMm, heightMm) => ({frame, xMm, zMm, heightMm})

// ---- Rules of thumb (all typical; the dealer's heat-load sheet and the chosen model's installation manual govern) ----
export const AC_PLAN_RULES = {
  // LOAD ESTIMATE. watts = area x (base + roof) + sun-facing glass x glass figure + people + equipment; tons = watts / 3517.
  //  baseWPerM2      walls, air leakage and lights of an ordinary room in a hot climate
  //  roofWPerM2      extra for a top-floor room under an uninsulated roof slab (this flat is on the top floor)
  //  sunGlassWPerM2  per square metre of glass facing east, south or west; halved (shadedGlassFactor) where a balcony shades
  //                  it; glass facing north counts as nothing. Compass sides are the plan's nominal ones.
  //  personW         per person normally in the room
  //  marketTons      the sizes sold; the smallest one that covers the estimate is "recommended"; above marginalAbove of a
  //                  size the room is at that size's limit on the hottest afternoons.
  load: {baseWPerM2: 150, roofWPerM2: 50, sunGlassWPerM2: 200, shadedGlassFactor: .5, personW: 120, wattsPerTon: 3517, marketTons: [1, 1.5, 2], marginalAbove: .9,
    sunFacing: ['east', 'south', 'west']},
  // REFRIGERANT PIPE. Most 1 to 2 ton inverter splits sold in India are charged at the factory for about 5 m of pipe (3 to
  // 7.5 m by brand) and allow about 15 m with extra gas (about 20 g per extra metre); many manuals ask for at least 3 m so
  // the unit runs quietly. allowanceM is added to every drawn route for bends and the tails at both ends.
  //  valveAboveBottomMm  where a route ends on an outdoor unit, above its underside
  pipe: {prechargedM: 5, maxM: 15, minM: 3, maxLiftM: 7, allowanceM: .5, extraGasGPerM: 20, valveAboveBottomMm: 250, coreHoleDiameterMm: 65},
  // DRAIN. Condensate runs by gravity only: never uphill, at least 1 in 100 on every sloping stretch.
  drain: {minFall: 1 / 100},
  // INDOOR UNIT.
  //  ceilingClearMm   free height above the casing (it breathes in through its top)
  //  trackClearMm     no ceiling track within this distance in front of the casing (sideTrackClearMm beside it)
  //  fanClearMm       from the casing to the tip of a ceiling fan blade
  //  tall*            furniture standing within tallFrontMm in front of / tallSideMm beside the casing must stay
  //                   tallBelowMm under its underside, or it blocks the air
  //  draft            the stream of cold air on the floor plan: it starts nearMm in front of a wall unit (a window AC blows
  //                   level, so 0), reaches throwMm and widens spreadMm each side. A seat or bed counts as "blown onto"
  //                   when the stream covers minOverlap of its area.
  //  bedHeadMm        the pillow end of a bed
  indoor: {ceilingClearMm: 100, trackClearMm: 300, sideTrackClearMm: 100, fanClearMm: 300, tallFrontMm: 500, tallSideMm: 150, tallBelowMm: 300,
    draft: {nearMm: 1200, throwMm: 3500, spreadMm: 300, minOverlap: .3}, bedHeadMm: 700, powerPointWithinMm: 1000},
  // OUTDOOR UNIT. A technician must reach it from a floor he can stand on, through a balcony or an opening window.
  outdoor: {serviceReachMm: 900},
}

// Typical wall-mounted indoor units (casing only). 1.5 ton is the size the room pages already draw (1020 x 280 x 220).
export const AC_INDOOR_UNIT_SIZES = {
  1: {widthMm: 850, heightMm: 280, depthMm: 210},
  1.5: {widthMm: 1020, heightMm: 280, depthMm: 220},
  2: {widthMm: 1100, heightMm: 330, depthMm: 240},
}

// Room frames: plan bounds [x1, y1, x2, y2] and the room box they stand for. Bedroom 1's frame is the bedroom itself, from
// its west wall to the inner edge of the balcony (as in Whole home 3D); the balcony continues past widthMm.
export const AC_FRAMES = {
  drawing: {bounds: bounds('drawing'), widthMm: drawing.widthMm, lengthMm: drawing.lengthMm, heightMm: drawing.heightMm},
  lobby: {bounds: bounds('lobby'), widthMm: lobby.widthMm, lengthMm: lobby.lengthMm, heightMm: lobby.heightMm},
  bedroom1: {bounds: [bounds('bedroom1-balcony')[2], ...bounds('bedroom1').slice(1)], widthMm: bedroom1.widthMm, lengthMm: bedroom1.lengthMm, heightMm: bedroom1.heightMm},
  bedroom3: {bounds: bounds('bedroom3'), widthMm: bedroom3.widthMm, lengthMm: bedroom3.lengthMm, heightMm: bedroom3.heightMm},
  study: {bounds: bounds('study'), widthMm: study.widthMm, lengthMm: study.lengthMm, heightMm: study.heightMm},
  office: {bounds: bounds('balcony'), widthMm: office.widthMm, lengthMm: office.lengthMm, heightMm: office.floorToCeilingMm},
}

// ---- Where condensate may end. NONE of these is confirmed on site: the installer must find each one. ----
const b1Balcony = bedroom1.balconyExtension, b3Balcony = bedroom3.southExtension.balcony
export const AC_DISCHARGE_POINTS = {
  lobbyToilet: {label: 'floor trap of the toilet south of the Lobby (it backs the Study west wall and the Home Office north wall)', confirmed: false,
    at: at('lobby', 860, lobby.lengthMm + 1280, 0), note: 'the trap position is a guess at the middle of the toilet'},
  bedroom1Balcony: {label: 'floor drain of the Bedroom 1 balcony', confirmed: false,
    at: at('bedroom1', bedroom1.widthMm + b1Balcony.depthMm - 100, b1Balcony.lengthMm - b1Balcony.poojaWallWardrobe.northShiftMm - 100, 0),
    note: 'ASSUMED to exist (the balcony was open before it was glazed); drawn at the east side just north of the wardrobe'},
  bedroom3Balcony: {label: 'floor drain of the Bedroom 3 balcony', confirmed: false,
    at: at('bedroom3', bedroom3.widthMm - 300, bedroom3.lengthMm + b3Balcony.depthMm - 200, 0), note: 'ASSUMED at the outer east corner of the balcony'},
}

// ---- How each outdoor unit of acOutdoorUnitsConfig.js is reached for service (keys are its unit ids) ----
//  from      the floor the technician stands on and the opening he works through; null = none on that wall
//  reachMm   from that opening to the far side of the casing, ESTIMATED from the plan
export const AC_OUTDOOR_SERVICE = {
  bedroom3: {from: 'the Bedroom 3 balcony floor (the unit hangs inside the balcony, at its east end)', reachMm: 400},
  study: {from: 'the Home Office west window: the unit hangs just outside it, north end, 1524 mm up', reachMm: 500},
  bedroom1: {from: 'the Bedroom 1 balcony glazing beside it (an opening panel is needed there) or the kitchen north window', reachMm: 800},
  drawing: {from: null, reachMm: null,
    note: 'the west wall has no opening. The nearest is the west bay of the south window, round the corner (about 1.1 m, and the casing hangs below the sill). Being the top floor, rope access from the roof is the realistic way: agree it with the installer, or hang the unit at sill height close to the south-west corner'},
}

// ---- Things in each room the indoor unit must respect (rectangles in that room's frame, mm) ----
const rectAt = (centerXmm, centerZmm, alongXmm, alongZmm) => ({x1: centerXmm - alongXmm / 2, x2: centerXmm + alongXmm / 2, z1: centerZmm - alongZmm / 2, z2: centerZmm + alongZmm / 2})
const sofas = drawing.southLayout.furniture, dining = lobby.furniture, shelf = STUDY_ROOM.cabinetry.northBookshelf
const DINING_CHAIR_MM = 440 // as drawn in Whole home 3D (440 x 430)
const studyTargets = Object.fromEntries(STUDY_LIGHTING.downTargets.map(t => [t.label, t]))
const b3Bed = bedroom3DownTargets(bedroom3)[0], b1Bed = bedroom1DownTargets(bedroom1)[0]
const lobbyFan = LOBBY_LIGHTING.existingCeilingPoints[0] // "probably a ceiling fan" (phone scan); blade size assumed as elsewhere

const DRAWING_AC_POINT = DRAWING_ELECTRICAL.points.find(point => point.id === 'W1')
const windowAc = b1Balcony.windowAc, existingB3 = bedroom3.existing.acUnit, b3Bay = bedroom3.furniture.eastCabinet.ac
const officeOpening = STUDY_ROOM.openings.balconyOffice
const officeOpeningNorthMm = study.lengthMm - officeOpening.offsetFromSouthMm - officeOpening.widthMm // north jamb, from the Study north wall
const INDOOR_BOTTOM_MM = 2230 // underside of a wall unit, as the room pages already draw it (2230-2510 under a 2700 ceiling)
const size15 = AC_INDOOR_UNIT_SIZES[1.5]
const AC_SOCKET = '16/20 A socket (or isolator with indicator) on its own 20 A breaker, 4 sq mm copper with earth; nothing else on the circuit'

// Lobby unit: on the north wall, hard up to the Pooja alcove (150 mm short of its opening). It hangs above the head of the
// closed old Bedroom 1 door (bedroom1ClosedDoor.js: 2100 high, about 2400-3226 from the west wall), on the masonry over it.
const lobbyCentreMm = lobby.poojaAlcove.fromMm - 150 - size15.widthMm / 2
const lobbyPipeXmm = lobby.poojaAlcove.fromMm + 80 // along the inside of the alcove's west cheek
// Study unit: on the west wall, hard up to the Home Office opening (150 mm short of its north jamb).
const studyCentreMm = officeOpeningNorthMm - 150 - size15.widthMm / 2
const studyPipeZmm = studyCentreMm + size15.widthMm / 2 - 80
const drawingCentreMm = drawing.furniture.sofa.centerZmm // the position the electrical plan's AC point W1 was set out for
const drawingPipeZmm = drawingCentreMm + size15.widthMm / 2 - 80
const b3PipeZmm = existingB3.fromNorthMm + existingB3.widthMm - 80
const b1East = bedroom1.widthMm + b1Balcony.depthMm // the balcony's east glazing line in the Bedroom 1 frame
const WALL_MM = 250 // an outer wall with plaster, ASSUMED 9 inches (work-plan/OPEN_ITEMS.md A3)

// ---- The plan: one entry per conditioned space ----
//  type      'split' | 'window' | 'none'
//  status    'existing' (there today, per the owner) | 'owned' (the owner has the machine; position proposed) | 'proposed' | 'none'
//  tons      the size installed or to buy; tonsKnown false = the existing unit's size was not given
//  area      the floor the machine has to cool; load: what heats it (see AC_PLAN_RULES.load)
//  indoor    wall + centreMm along that wall (from its north or west end) + bottomMm, or `rect` for a unit that is not on a
//            room wall; `blows` is the compass side the air goes; positionKnown false = not recorded on site
//  outdoorUnitId  id in acOutdoorUnitsConfig.js
//  coreHole  where the pipes pass the wall (a waypoint) and how
//  pipe      refrigerant route, indoor unit to outdoor unit (waypoints); drain: condensate route to a discharge point
//  power     the supply it needs; `configPoint` is a point that already exists in an electrical config. Owner 2026-10-05:
//            "we need power points for these ACs also, define them along with the pipe path and the water out": every
//            machine has `at` (where its socket or isolator goes, in the room frame) and `electricalId` (the same point in
//            drawingElectricalConfig.js / roomElectricalConfig.js); the AC routes overlay draws it.
//  occupied / ceiling / tall   what the placement checks look at
export const AC_SPACES = [
  {
    id: 'drawing', name: 'Drawing Room', frame: 'drawing', type: 'split', status: 'proposed', tons: 1.5, tonsKnown: true,
    area: [{label: 'Drawing Room', widthMm: drawing.widthMm, lengthMm: drawing.lengthMm}],
    load: {topFloor: true, people: 5, equipmentW: 150, equipment: 'TV and sound',
      glass: drawing.windows.map(w => ({label: 'south window', facing: w.wall, widthMm: w.widthMm, heightMm: w.topMm - w.bottomMm})),
      assumes: 'the sliding glass doors to the Lobby are CLOSED; open, the two rooms together need about twice this'},
    indoor: {wall: 'west', centreMm: drawingCentreMm, bottomMm: INDOOR_BOTTOM_MM, blows: 'east',
      why: 'the west wall is the only outside wall with free height (the south wall is all window up to 2430); the hole goes straight out behind the unit, the air crosses the short way over the seating without hitting a seat, and it is the position the electrical plan already serves'},
    outdoorUnitId: 'drawing',
    coreHole: {at: at('drawing', 0, drawingPipeZmm, INDOOR_BOTTOM_MM + 60), wall: 'Drawing Room west wall, behind the south end of the indoor unit', note: 'sloping down to the outside'},
    pipe: [at('drawing', 0, drawingPipeZmm, INDOOR_BOTTOM_MM + 60), at('drawing', -WALL_MM, drawingPipeZmm, INDOOR_BOTTOM_MM + 40),
      {outdoor: 'drawing', heightMm: INDOOR_BOTTOM_MM + 40}, {outdoor: 'drawing'}],
    pipeNote: 'through the wall behind the unit, then down the OUTSIDE of the west wall to the outdoor unit at its south end',
    // Out with the pipes, down the west face to below the south window sill, round the south-west corner, along the south
    // face under the sill, and into the toilet at the south-east corner. Long, but every stretch falls.
    drain: [at('drawing', 0, drawingPipeZmm, INDOOR_BOTTOM_MM + 20), at('drawing', -WALL_MM, drawingPipeZmm, INDOOR_BOTTOM_MM),
      at('drawing', -WALL_MM, drawingPipeZmm, 860), at('drawing', -WALL_MM, drawing.lengthMm + WALL_MM, 820),
      at('drawing', drawing.widthMm, drawing.lengthMm + WALL_MM, 770), {discharge: 'lobbyToilet', heightMm: 740}, {discharge: 'lobbyToilet'}],
    drainNote: 'out through the same hole, down the west face, round the south-west corner and along the south face BELOW the window sill to the toilet at the south-east corner; if a rainwater pipe stands nearer on either face, use that instead',
    power: {configPoint: {config: 'drawingElectricalConfig.js', id: DRAWING_AC_POINT.id, wall: DRAWING_AC_POINT.wall, alongMm: DRAWING_AC_POINT.alongMm, heightMm: DRAWING_AC_POINT.heightMm}, needs: AC_SOCKET,
      at: at('drawing', 0, DRAWING_AC_POINT.alongMm, DRAWING_AC_POINT.heightMm), electricalId: DRAWING_AC_POINT.id, place: 'west wall, 660 mm south of the unit centre, beside the unit'},
    occupied: {
      seats: [{label: 'west sofa', ...rectAt(sofas.westSofa.centerXmm, sofas.westSofa.centerZmm, sofas.westSofa.widthMm, sofas.westSofa.lengthMm)},
        {label: 'south sofa', ...rectAt(sofas.southSofa.centerXmm, sofas.southSofa.centerZmm, sofas.southSofa.lengthMm, sofas.southSofa.widthMm)}],
      beds: []},
    ceiling: {tracks: DRAWING_LIGHTING.southSofas.tracks.runs, fans: DRAWING_LIGHTING.southSofas.ceilingFans.fans, bladeDiameterMm: DRAWING_LIGHTING.southSofas.ceilingFans.bladeDiameterMm},
    tall: [],
    // The other place the owner asked about: the bottom of the shoe rack (ENTRY.shoeRack.acBay). Same indoor unit; the pipes
    // run north along the west wall, east along the north wall over the entry door, and up the gallery to the rack.
    alternatives: [{id: 'shoeRackBay', label: 'outdoor unit in the bottom of the shoe rack (ENTRY.shoeRack.acBay)',
      pipe: [at('drawing', 0, drawingCentreMm - size15.widthMm / 2 + 80, INDOOR_BOTTOM_MM + 100), at('drawing', 40, 40, INDOOR_BOTTOM_MM + 100),
        at('drawing', drawing.doors[0].fromMm + drawing.doors[0].widthMm + 100, 40, INDOOR_BOTTOM_MM + 100),
        at('drawing', drawing.doors[0].fromMm + drawing.doors[0].widthMm + 100, -WALL_MM, INDOOR_BOTTOM_MM + 100),
        {planX: (ENTRY.shoeRack.planX1 + ENTRY.shoeRack.planX2) / 2, planY: ENTRY.shoeRack.planNorthY, heightMm: INDOOR_BOTTOM_MM + 100},
        {planX: (ENTRY.shoeRack.planX1 + ENTRY.shoeRack.planX2) / 2, planY: ENTRY.shoeRack.planNorthY, heightMm: ENTRY.shoeRack.acBay.unit.heightMm / 2}]}],
  },
  {
    id: 'lobby', name: 'Lobby / Dining', frame: 'lobby', type: 'split', status: 'proposed', tons: 1.5, tonsKnown: true,
    area: [{label: 'Lobby / Dining', widthMm: lobby.widthMm, lengthMm: lobby.lengthMm}],
    load: {topFloor: true, people: 4, equipmentW: 0, glass: [],
      assumes: 'the sliding glass doors to the Drawing Room are closed, or that room\'s AC is running too. No outside wall and no window, so the roof is the main heat'},
    indoor: {wall: 'north', centreMm: lobbyCentreMm, bottomMm: INDOOR_BOTTOM_MM, blows: 'south',
      why: 'beside the Pooja alcove: the shortest way out, on the masonry above the closed old door, east of the dining table (not over it), blowing across the room and not at the Drawing Room unit'},
    outdoorUnitId: 'bedroom1',
    outdoorNote: 'the place the owner marked for a Bedroom 1 split unit (outside the kitchen north wall, beside the balcony); Bedroom 1 gets the window AC instead, so this place is free for the Lobby',
    coreHole: {at: at('lobby', lobbyPipeXmm, -lobby.poojaAlcove.depthMm, INDOOR_BOTTOM_MM + 100), wall: 'back wall of the Pooja alcove, at its west cheek, into the south end of the Bedroom 1 balcony', note: 'a second opening is needed in the balcony glazing head, above the window AC'},
    pipe: [at('lobby', lobbyCentreMm + size15.widthMm / 2, 40, INDOOR_BOTTOM_MM + 100), at('lobby', lobbyPipeXmm, 40, INDOOR_BOTTOM_MM + 100),
      at('lobby', lobbyPipeXmm, -lobby.poojaAlcove.depthMm, INDOOR_BOTTOM_MM + 100), at('lobby', lobbyPipeXmm, -lobby.poojaAlcove.depthMm - WALL_MM, INDOOR_BOTTOM_MM + 100),
      at('bedroom1', b1East - 60, b1Balcony.lengthMm - 60, INDOOR_BOTTOM_MM + 100), at('bedroom1', b1East - 60, windowAc.centerFromNorthMm, INDOOR_BOTTOM_MM + 100),
      {outdoor: 'bedroom1', heightMm: INDOOR_BOTTOM_MM + 100}, {outdoor: 'bedroom1'}],
    pipeNote: 'east along the wall into the Pooja alcove, along its west cheek at ceiling level, through its back wall into the top of the balcony wardrobe, along the balcony east side and out through the glazing head above the window AC',
    drain: [at('lobby', lobbyCentreMm + size15.widthMm / 2, 40, INDOOR_BOTTOM_MM + 20), at('lobby', lobbyPipeXmm, 40, INDOOR_BOTTOM_MM + 14),
      at('lobby', lobbyPipeXmm, -lobby.poojaAlcove.depthMm, INDOOR_BOTTOM_MM), at('lobby', lobbyPipeXmm, -lobby.poojaAlcove.depthMm - WALL_MM, INDOOR_BOTTOM_MM - 6),
      at('bedroom1', b1East - 60, b1Balcony.lengthMm - 60, INDOOR_BOTTOM_MM - 20), {discharge: 'bedroom1Balcony', heightMm: INDOOR_BOTTOM_MM - 30}, {discharge: 'bedroom1Balcony'}],
    drainNote: 'in the same casing as the pipes as far as the balcony, then down the balcony corner to its floor drain',
    power: {newPoint: {wall: 'north', alongMm: lobbyCentreMm - size15.widthMm / 2 - 150, heightMm: 2300, note: 'point L-N4 of the Lobby electrical plan'}, needs: AC_SOCKET,
      at: at('lobby', lobbyCentreMm - size15.widthMm / 2 - 150, 0, 2300), electricalId: 'L-N4', place: 'north wall, 150 mm west of the unit (the Pooja alcove is on its east side)'},
    occupied: {
      seats: dining.chairRowsZmm.flatMap(z => [-1, 1].map(side => ({label: 'dining chair', ...rectAt(dining.diningTable.centerXmm + side * dining.chairOffsetXmm, z, DINING_CHAIR_MM, DINING_CHAIR_MM)}))),
      beds: []},
    ceiling: {tracks: LOBBY_LIGHTING.tracks.runs, fans: [lobbyFan], bladeDiameterMm: DRAWING_LIGHTING.southSofas.ceilingFans.bladeDiameterMm},
    tall: [{label: 'ironing storage', x1: lobby.widthMm - dining.eastIroningStorage.depthMm, x2: lobby.widthMm, z1: dining.eastIroningStorage.fromNorthMm, z2: dining.eastIroningStorage.fromNorthMm + dining.eastIroningStorage.lengthMm, topMm: dining.eastIroningStorage.heightMm}],
  },
  {
    id: 'bedroom1', name: 'Bedroom 1 + balcony', frame: 'bedroom1', type: 'window', status: 'owned', tons: windowAc.tons, tonsKnown: true,
    area: [{label: 'Bedroom 1', widthMm: bedroom1.widthMm, lengthMm: bedroom1.lengthMm}, {label: 'balcony', widthMm: b1Balcony.depthMm, lengthMm: b1Balcony.lengthMm}],
    load: {topFloor: true, people: 2, equipmentW: 0,
      glass: [{label: 'balcony east glazing', facing: 'east', widthMm: b1Balcony.lengthMm, heightMm: bedroom1.heightMm - b1Balcony.railingHeightMm},
        {label: 'balcony north glazing', facing: 'north', widthMm: b1Balcony.depthMm, heightMm: bedroom1.heightMm - b1Balcony.railingHeightMm}],
      assumes: 'the opening between the bedroom and its balcony stays open and clear'},
    // The owner's window AC, exactly where roomShellConfig.js puts it: in the balcony's east side, front `insideMm` into the balcony.
    indoor: {rect: {x1: b1East - windowAc.insideMm, x2: b1East + windowAc.depthMm - windowAc.insideMm, z1: windowAc.centerFromNorthMm - windowAc.widthMm / 2, z2: windowAc.centerFromNorthMm + windowAc.widthMm / 2},
      bottomMm: windowAc.bottomMm, heightMm: windowAc.heightMm, blows: 'west', level: true, source: 'bedroom1.balconyExtension.windowAc'},
    outdoorUnitId: null, coreHole: null, pipe: null,
    drain: [at('bedroom1', b1East + windowAc.depthMm - windowAc.insideMm - 50, windowAc.centerFromNorthMm, windowAc.bottomMm),
      at('bedroom1', b1East - 60, windowAc.centerFromNorthMm + windowAc.widthMm / 2 + 60, windowAc.bottomMm - 30), {discharge: 'bedroom1Balcony', heightMm: windowAc.bottomMm - 100}, {discharge: 'bedroom1Balcony'}],
    drainNote: 'a tray and tube from the drain nipple at the back of the casing, brought back in beside the casing and down to the balcony floor drain; it must not drip on the floors below',
    power: {newPoint: {wall: 'balcony east parapet, inside face', alongMm: windowAc.centerFromNorthMm - windowAc.widthMm / 2 - 100, heightMm: 850, note: 'point B1-B1 of the Bedroom 1 electrical plan'}, needs: AC_SOCKET,
      at: at('bedroom1', b1East - 30, windowAc.centerFromNorthMm - windowAc.widthMm / 2 - 100, 850), electricalId: 'B1-B1', place: 'inside face of the balcony parapet, 100 mm north of the casing and below its underside, within its cord'},
    occupied: {seats: [{label: 'balcony chair', ...rectAt(bedroom1.widthMm + b1Balcony.furniture.chair.centerFromBedroomWallMm, b1Balcony.furniture.chair.centerFromNorthMm, b1Balcony.furniture.chair.depthMm, b1Balcony.furniture.chair.widthMm)}],
      beds: [{label: 'bed', headWall: 'east', x1: b1Bed.x1, x2: b1Bed.x2, z1: b1Bed.z1, z2: b1Bed.z2}]},
    ceiling: {tracks: BEDROOM1_LIGHTING.tracks.runs, fans: BEDROOM1_LIGHTING.ceilingFans.fans, bladeDiameterMm: BEDROOM1_LIGHTING.ceilingFans.bladeDiameterMm},
    tall: [],
    // The split AC that was drawn as a concept for this room (west wall, south of the wardrobe) with the outdoor unit the
    // owner marked outside the kitchen wall. NOT recommended now that the window AC serves the room: see docs/AC_PLAN.md (b).
    // Kept so the idea is on record; set `active` true to check it (it then counts as a second machine in the room).
    splitAlternative: {active: false, recommendation: 'not needed: the 1.5 ton window AC covers Bedroom 1 and its balcony; a second machine in the same room is money and wall space for nothing',
      tons: 1.5, indoor: {wall: 'west', centreMm: 2480, bottomMm: INDOOR_BOTTOM_MM, blows: 'east'}, outdoorUnitId: 'bedroom1',
      tall: [{label: 'wardrobe', x1: 0, x2: bedroom1.furniture.wardrobe.depthMm, z1: bedroom1.furniture.wardrobe.fromNorthMm, z2: bedroom1.furniture.wardrobe.fromNorthMm + bedroom1.furniture.wardrobe.lengthMm, topMm: bedroom1.furniture.wardrobe.heightMm}]},
  },
  {
    id: 'study', name: 'Bedroom 2 (Study) + Home Office', frame: 'study', type: 'split', status: 'existing', tons: AC_OUTDOOR_UNITS.find(u => u.id === 'study').tons, tonsKnown: false,
    area: [{label: 'Study', widthMm: study.widthMm, lengthMm: study.lengthMm}, {label: 'Home Office', widthMm: office.widthMm, lengthMm: office.lengthMm}],
    load: {topFloor: true, people: 2, equipmentW: 400, equipment: 'PC, two monitors, printer',
      glass: [{label: 'terrace door', facing: STUDY_ROOM.openings.terraceDoor.wall, widthMm: STUDY_ROOM.openings.terraceDoor.widthMm, heightMm: STUDY_ROOM.openings.terraceDoor.heightMm},
        {label: 'Home Office south window', facing: 'south', widthMm: office.widthMm, heightMm: BALCONY_OFFICE.envelope.windowBandMm},
        {label: 'Home Office west window', facing: 'west', widthMm: office.lengthMm, heightMm: BALCONY_OFFICE.envelope.windowBandMm}],
      assumes: 'the Home Office is open to the Study (there is no door between them)'},
    // The owner says the AC exists, but where its indoor unit hangs was never recorded. This is where it SHOULD be (and
    // most likely is): the only wall with free height within reach of the outdoor unit.
    indoor: {wall: 'west', centreMm: studyCentreMm, bottomMm: INDOOR_BOTTOM_MM, blows: 'east', positionKnown: false,
      why: 'the Study west wall just north of the Home Office opening: the bookshelf fills the north wall to 2395, the south wall has the tall cabinet and the terrace door, the Home Office walls are window and cabinet, and the wall above the opening is only 330 mm'},
    outdoorUnitId: 'study',
    coreHole: {at: at('office', 0, 40, 2450), wall: 'Home Office west wall, in the solid band above the window, at the north corner', note: 'refrigerant pipes only: they may rise to it; the drain cannot'},
    pipe: [at('study', 0, studyPipeZmm, INDOOR_BOTTOM_MM + 100), at('office', office.widthMm, 40, 2450), at('office', 0, 40, 2450), at('office', -WALL_MM, 40, 2450),
      {outdoor: 'study', heightMm: 2450}, {outdoor: 'study'}],
    pipeNote: 'south along the wall to the Home Office, along its north wall behind the upper cabinet (rear cable chase), out through the solid band above the west window and down to the outdoor unit',
    drain: [at('study', 0, studyPipeZmm, INDOOR_BOTTOM_MM + 20), at('study', -200, studyPipeZmm, INDOOR_BOTTOM_MM), {discharge: 'lobbyToilet', heightMm: INDOOR_BOTTOM_MM - 30}, {discharge: 'lobbyToilet'}],
    drainNote: 'straight through the wall behind the unit into the toilet and down to its floor trap (the Home Office window band is too low for the drain to leave with the pipes)',
    power: {existing: true, needs: AC_SOCKET, note: 'the existing point was not recorded; confirm it is on its own breaker',
      at: at('study', 0, 2350, 2300), electricalId: 'ST-W2', assumed: true, place: 'west wall just south of the unit (ASSUMED: neither the unit nor its point is recorded)'},
    occupied: {seats: [{label: 'desk and chair', ...studyTargets.desk}], beds: [{label: 'bed', headWall: 'north', ...studyTargets.bed}]},
    ceiling: {tracks: STUDY_LIGHTING.tracks.runs, fans: STUDY_LIGHTING.ceilingFans.fans, bladeDiameterMm: STUDY_LIGHTING.ceilingFans.bladeDiameterMm},
    tall: [{label: 'bookshelf', x1: shelf.offsetFromWestMm, x2: shelf.offsetFromWestMm + shelf.widthMm, z1: 0, z2: shelf.depthMm, topMm: shelf.heightMm}],
  },
  {
    id: 'bedroom3', name: 'Bedroom 3', frame: 'bedroom3', type: 'split', status: 'existing', tons: AC_OUTDOOR_UNITS.find(u => u.id === 'bedroom3').tons, tonsKnown: true,
    area: [{label: 'Bedroom 3', widthMm: bedroom3.widthMm, lengthMm: bedroom3.lengthMm}],
    load: {topFloor: true, people: 2, equipmentW: 0,
      glass: [{label: 'balcony door', facing: 'south', widthMm: b3Balcony.doorWidthMm, heightMm: b3Balcony.doorHeightMm, shaded: true},
        {label: 'balcony window', facing: 'south', widthMm: b3Balcony.windowWidthMm, heightMm: b3Balcony.windowTopMm - b3Balcony.windowSillMm, shaded: true}]},
    // From the phone scan (bedroom3.existing.acUnit): on the east wall, above the bed head.
    indoor: {wall: existingB3.wall, centreMm: existingB3.fromNorthMm + existingB3.widthMm / 2, bottomMm: existingB3.bottomMm, blows: 'west',
      size: {widthMm: existingB3.widthMm, heightMm: existingB3.topMm - existingB3.bottomMm, depthMm: existingB3.depthMm}, source: 'bedroom3.existing.acUnit (phone scan 2026-10-04)',
      enclosure: {label: 'the slatted AC bay of the planned east cabinetry (bedroom3.furniture.eastCabinet.ac)', fromMm: b3Bay.centerFromNorthMm - b3Bay.bayWidthMm / 2, toMm: b3Bay.centerFromNorthMm + b3Bay.bayWidthMm / 2}},
    outdoorUnitId: 'bedroom3',
    coreHole: {at: at('bedroom3', bedroom3.widthMm - 60, bedroom3.lengthMm, 2380), wall: 'Bedroom 3 south wall, in the solid stretch east of the balcony window', note: 'ASSUMED: the existing pipes were not traced'},
    pipe: [at('bedroom3', bedroom3.widthMm - 60, b3PipeZmm, 2380), at('bedroom3', bedroom3.widthMm - 60, bedroom3.lengthMm, 2380), at('bedroom3', bedroom3.widthMm - 60, bedroom3.lengthMm + WALL_MM, 2380), {outdoor: 'bedroom3'}],
    pipeNote: 'ASSUMED route of the existing pipes: south along the east wall (inside the planned bridge cabinet) and out through the south wall to the unit on the balcony wall',
    drain: [at('bedroom3', bedroom3.widthMm - 60, b3PipeZmm, existingB3.bottomMm + 20), at('bedroom3', bedroom3.widthMm - 60, bedroom3.lengthMm, existingB3.bottomMm),
      at('bedroom3', bedroom3.widthMm - 60, bedroom3.lengthMm + WALL_MM, existingB3.bottomMm - 5), {discharge: 'bedroom3Balcony', heightMm: existingB3.bottomMm - 20}, {discharge: 'bedroom3Balcony'}],
    drainNote: 'ASSUMED: with the pipes to the balcony and down to its floor drain',
    power: {existing: true, needs: AC_SOCKET, note: 'the existing point was not seen in the scan (the lower walls were covered)',
      at: at('bedroom3', bedroom3.widthMm, 2613, 2400), electricalId: 'B3-E3', assumed: true, place: 'east wall inside the overhead cabinet, in the bay next to the AC bay (planned position; the existing point was not seen)'},
    occupied: {seats: [], beds: [{label: 'bed', headWall: bedroom3.furniture.bed.headWall, x1: b3Bed.x1, x2: b3Bed.x2, z1: b3Bed.z1, z2: b3Bed.z2}]},
    ceiling: {tracks: BEDROOM3_LIGHTING.tracks.runs, fans: BEDROOM3_LIGHTING.ceilingFans.fans, bladeDiameterMm: BEDROOM3_LIGHTING.ceilingFans.bladeDiameterMm},
    tall: [],
  },
  {
    id: 'kitchen', name: 'Kitchen', frame: null, type: 'none', status: 'none', tons: 0, tonsKnown: true,
    area: [{label: 'Kitchen', widthMm: KITCHEN.width, lengthMm: KITCHEN.length}],
    load: {topFloor: true, people: 1, equipmentW: 1500, equipment: 'hob while cooking, fridge', glass: [{label: 'north window', facing: 'north', widthMm: KITCHEN.window.w, heightMm: KITCHEN.window.h}]},
    indoor: null, outdoorUnitId: null, coreHole: null, pipe: null, drain: null, power: null,
    decision: 'No AC. The hob puts more heat into this small room than a home AC can remove, the chimney throws the cooled air straight out, and cooking grease clogs an indoor coil within months. Keep it comfortable with the chimney, the north window and a wall or pedestal fan; with the kitchen door open it also borrows cool air from the Lobby unit, which is one more reason to give the Lobby its own.',
  },
]

// Rooms that share air when their doors are open: units in them are checked against each other.
export const AC_CONNECTED = [['drawing', 'lobby']]

/** Everything the pure checks need, in one object. */
export const AC_PLAN = {
  spaces: AC_SPACES, frames: AC_FRAMES, rules: AC_PLAN_RULES, indoorSizes: AC_INDOOR_UNIT_SIZES,
  outdoorUnits: AC_OUTDOOR_UNITS, outdoorSizes: AC_OUTDOOR_UNIT_SIZES, discharge: AC_DISCHARGE_POINTS, service: AC_OUTDOOR_SERVICE,
  connected: AC_CONNECTED, scale: ENTRY.planScale,
}
