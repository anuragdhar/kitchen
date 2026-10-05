// Room models for the generic electrical check (roomElectrical.mjs): what each room's shell, openings, furniture, doors,
// AC units, track runs and fans look like to an electrician, read from the existing configs. Pure: no React, Three.js or DOM.
// Nothing is measured here; every figure comes from the config named beside it. Millimetres, x from the room's west wall,
// z from its north wall, y up (the Main entry has its own frame: see entryModel).
import {EMPTY_ROOM_SHELLS} from '../config/roomShellConfig.js'
import {STUDY_ROOM} from '../config/studyRoomConfig.js'
import {BALCONY_OFFICE} from '../config/balconyOfficeConfig.js'
import {ENTRY} from '../config/entryConfig.js'
import {ENTRY_LIGHTING} from '../config/entryLightingConfig.js'
import {LOBBY_LIGHTING} from '../config/lobbyLightingConfig.js'
import {BEDROOM1_LIGHTING, bedroom1DownTargets} from '../config/bedroom1LightingConfig.js'
import {BEDROOM3_LIGHTING, bedroom3DownTargets} from '../config/bedroom3LightingConfig.js'
import {STUDY_LIGHTING} from '../config/studyLightingConfig.js'
import {BEDROOM1_CLOSED_DOOR, closedDoorSpanMm} from '../config/bedroom1ClosedDoor.js'
import {HOME_ROOM_LAYOUTS} from '../config/homeRoomViews.js'
import {ROOM_ELECTRICAL, ELECTRICAL_LOAD_W} from '../config/roomElectricalConfig.js'
import {AC_PLAN, AC_INDOOR_UNIT_SIZES} from '../config/acPlanConfig.js'
import {existingPointsFor, plannedOpenings, plannedBlockers} from './existingElectrical.mjs'
import {balconyDeskLayout} from './balconyDesk.mjs'
import {rectWalls, checkRoomElectrical, resolveRoomPoints, describePointPlace} from './roomElectrical.mjs'

// Split AC indoor units as drawn by rooms/shared/RoomAirConditioning.js (concept positions; that file holds them as
// literals, so they are repeated here once, in mm): the wall, the unit's extent along it and its height range.
export const AC_INDOOR_UNITS = {
  // The Lobby unit comes from the whole-home AC plan (config/acPlanConfig.js), which moved it beside the Pooja alcove.
  lobby: (() => { const s = AC_PLAN.spaces.find(space => space.id === 'lobby'), size = AC_INDOOR_UNIT_SIZES[s.tons]
    return {id: 'split', name: 'split AC indoor unit', wall: s.indoor.wall, a: s.indoor.centreMm - size.widthMm / 2, b: s.indoor.centreMm + size.widthMm / 2, bottom: s.indoor.bottomMm, top: s.indoor.bottomMm + size.heightMm} })(),
  bedroom1: {id: 'split', name: 'split AC indoor unit', wall: 'west', a: 2030, b: 2930, bottom: 2230, top: 2510},
}
const BED_TOP_MM = 600, HEADBOARD_TOP_MM = 1170 // mattress top and headboard top as the room pages draw the beds
const NEAR_WALL_MM = 250       // furniture within this of a wall line counts as standing against it
const PILLOW_FROM_HEAD_MM = 350
const SOLID_MARGIN_MM = 100    // a bedside box keeps this far from the edge of an opening

const byId = points => Object.fromEntries(points.map(p => [p.id, p]))
const trackCircuits = lighting => lighting.tracks.runs.map(r => ({id: r.id, label: r.label}))
const fanList = lighting => (lighting.ceilingFans?.fans ?? []).map(f => ({name: f.label.toLowerCase(), x: f.xMm, z: f.zMm}))
const fanCircuits = fans => fans.map((f, i) => ({id: `fan${i + 1}`, label: f.name}))

/** What a bed standing against walls hides: the mattress height on a side wall, the headboard height on its head wall. */
function bedBlockers(rect, headWall, W, L) {
  const rows = [], add = (wall, a, b) => rows.push({name: wall === headWall ? 'bed headboard' : 'bed', wall, a, b, bottom: 0, top: wall === headWall ? HEADBOARD_TOP_MM : BED_TOP_MM})
  if (rect.x1 < NEAR_WALL_MM) add('west', rect.z1, rect.z2)
  if (W - rect.x2 < NEAR_WALL_MM) add('east', rect.z1, rect.z2)
  if (rect.z1 < NEAR_WALL_MM) add('north', rect.x1, rect.x2)
  if (L - rect.z2 < NEAR_WALL_MM) add('south', rect.x1, rect.x2)
  return rows
}

/**
 * Two bedside positions on the head wall, one per sleeper, and the two pillow spots. A is 150 mm in from the low edge of
 * the bed, B 250 mm in from the high edge; each is pushed along the wall to the nearest solid stretch if an opening is there.
 */
function bedside(rect, headWall, openings, W, L) {
  const alongZ = headWall === 'east' || headWall === 'west', [a, b] = alongZ ? [rect.z1, rect.z2] : [rect.x1, rect.x2]
  const solid = along => {
    let v = along
    for (const o of openings.filter(o => o.wall === headWall)) if (v > o.a - SOLID_MARGIN_MM && v < o.b + SOLID_MARGIN_MM) v = Math.abs(v - o.a) < Math.abs(v - o.b) ? o.a - SOLID_MARGIN_MM : o.b + SOLID_MARGIN_MM
    return v
  }
  const quarter = (b - a) / 4, off = PILLOW_FROM_HEAD_MM
  const pillow = along => alongZ ? {x: headWall === 'east' ? W - off : off, z: along} : {x: along, z: headWall === 'south' ? L - off : off}
  return {
    anchors: {bedsideA: {wall: headWall, alongMm: solid(a + 150)}, bedsideB: {wall: headWall, alongMm: solid(b - 250)}},
    spots: [{name: 'first sleeper\'s pillow', ...pillow(a + quarter)}, {name: 'second sleeper\'s pillow', ...pillow(b - quarter)}],
  }
}

/** Where an inward-opening door leaf stands when open: flat along the side wall its hinge is next to (as existingElectrical.mjs). */
const leafBlocker = (name, wall, a, b, heightMm) => ({name: `${name} leaf when the door stands open`, wall, a, b, bottom: 0, top: heightMm, leaf: true})

function lobbyModel() {
  const room = EMPTY_ROOM_SHELLS.lobby, f = room.furniture, t = f.diningTable, iron = f.eastIroningStorage, alcove = room.poojaAlcove
  const [toilet, bed1] = [room.doors.find(d => d.leadsTo === 'Toilet'), room.doors.find(d => d.leadsTo === 'Bedroom 1')]
  const existing = byId(existingPointsFor('lobby')), ac = AC_INDOOR_UNITS.lobby
  const fans = [{name: 'ceiling fan (existing centre point X-L4)', x: existing['X-L4'].xMm, z: existing['X-L4'].zMm}]
  return {
    key: 'lobby', name: room.name, widthMm: room.widthMm, lengthMm: room.lengthMm, heightMm: room.heightMm, walls: rectWalls(room.widthMm, room.lengthMm),
    // The west side is open to the Drawing Room (openSide), so nothing can be fixed there.
    openings: [...plannedOpenings(room), {name: 'open west side to the Drawing Room', wall: 'west', a: 0, b: room.lengthMm, bottom: 0, top: room.heightMm}],
    blockers: plannedBlockers('lobby', room),
    doors: [
      {id: 'bedroom1', name: 'door to Bedroom 1', wall: 'north', fromMm: bed1.fromMm, widthMm: bed1.widthMm, latch: 'to', latchAssumed: true},
      {id: 'toilet', name: 'toilet door', wall: 'south', fromMm: toilet.fromMm, widthMm: toilet.widthMm, latch: 'to', latchAssumed: true},
    ],
    chargeSpots: [-1, 1].flatMap(side => f.chairRowsZmm.map(z => ({name: `dining chair at x ${t.centerXmm + side * f.chairOffsetXmm}, z ${z}`, x: t.centerXmm + side * f.chairOffsetXmm, z}))),
    acs: [ac], tracks: LOBBY_LIGHTING.tracks.runs, fans,
    lightingCircuits: [{id: 'chandelier', label: LOBBY_LIGHTING.pendant.label}, ...trackCircuits(LOBBY_LIGHTING), ...fanCircuits(fans)],
    anchors: {
      bedroom1DoorLatch: {wall: 'north', alongMm: bed1.fromMm + bed1.widthMm + 200},
      toiletDoorLatch: {wall: 'south', alongMm: toilet.fromMm + toilet.widthMm + 150},
      diningTableWall: {wall: 'north', alongMm: t.centerXmm},
      diningTableCentre: {wall: 'ceiling', xMm: t.centerXmm, zMm: t.centerZmm},
      ironingStorageMiddle: {wall: 'east', alongMm: iron.fromNorthMm + iron.lengthMm / 2},
      // West of the unit: the Pooja alcove opens on its east side. The same place as the AC plan's power point.
      'acBeside:split': {wall: ac.wall, alongMm: ac.a - 150},
      poojaAlcoveSide: {wall: 'free', xMm: alcove.fromMm + 40, zMm: -alcove.depthMm / 2, place: 'west return of the Pooja alcove'},
    },
    existing,
  }
}

function bedroom1Model() {
  const room = EMPTY_ROOM_SHELLS.bedroom1, W = room.widthMm, L = room.lengthMm, f = room.furniture, bal = room.balconyExtension, wac = bal.windowAc
  const [wash, lobbyDoor] = [room.doors.find(d => /washroom/i.test(d.leadsTo)), room.doors.find(d => /Lobby/.test(d.leadsTo))]
  const bed = bedroom1DownTargets(room)[0], headWall = f.bed.headWall ?? 'east', ac = AC_INDOOR_UNITS.bedroom1
  // The closed old Lobby door becomes a medicine cabinet in this room's south wall (bedroom1ClosedDoor.js). The Lobby and
  // Bedroom 1 share their west wall line, so the Lobby-frame span is this room's x.
  const lobby = EMPTY_ROOM_SHELLS.lobby, old = closedDoorSpanMm(BEDROOM1_CLOSED_DOOR, HOME_ROOM_LAYOUTS.find(r => r.key === 'lobby').bounds, lobby.widthMm)
  const recess = f.northEastRecessWardrobe, wardrobe = f.wardrobe, pooja = bal.poojaWallWardrobe, table = bal.furniture.table, chair = bal.furniture.chair
  const openings = [...plannedOpenings(room),
    {name: 'north-east recess wardrobe doors', wall: 'north', a: W - recess.fromEastMm - recess.widthMm, b: W - recess.fromEastMm, bottom: 0, top: recess.heightMm},
    {name: 'medicine cabinet in the closed old door', wall: 'south', a: old.start, b: old.end, bottom: 0, top: BEDROOM1_CLOSED_DOOR.heightMm},
    {name: 'balcony glazing above the parapet', wall: 'balconyEast', a: 0, b: bal.lengthMm, bottom: bal.railingHeightMm, top: room.heightMm}]
  const side = bedside(bed, headWall, openings, W, L)
  const fans = fanList(BEDROOM1_LIGHTING)
  const window = {id: 'window', name: '1.5 ton window AC', wall: 'balconyEast', a: wac.centerFromNorthMm - wac.widthMm / 2, b: wac.centerFromNorthMm + wac.widthMm / 2, bottom: wac.bottomMm, top: wac.bottomMm + wac.heightMm}
  const tableHalf = table.widthMm / 2 // the table's long side runs along the parapet
  return {
    key: 'bedroom1', name: room.name, widthMm: W, lengthMm: L, heightMm: room.heightMm,
    walls: {...rectWalls(W, L),
      // Inside face of the balcony's east parapet (1 m high, the glazing and the window AC above it); alongMm is z.
      balconyEast: {x: W + bal.depthMm - 60, z: 0, dx: 0, dz: 1, nx: -1, nz: 0, lengthMm: bal.lengthMm, label: 'balcony east parapet, inside face', axis: 'z'}},
    openings,
    blockers: [
      {name: 'west wardrobe', wall: wardrobe.wall, a: wardrobe.fromNorthMm, b: wardrobe.fromNorthMm + wardrobe.lengthMm, bottom: 0, top: wardrobe.heightMm},
      {name: 'west wardrobe (its side)', wall: 'north', a: 0, b: wardrobe.depthMm, bottom: 0, top: wardrobe.heightMm},
      ...bedBlockers(bed, headWall, W, L),
      // The Lobby door stands 100 mm off the west wall; hinged there and opening in, its leaf lies along the west wall.
      leafBlocker('Lobby door', 'west', L - lobbyDoor.widthMm, L, lobbyDoor.heightMm),
      {name: 'balcony table', wall: 'balconyEast', a: table.centerFromNorthMm - tableHalf, b: table.centerFromNorthMm + tableHalf, bottom: 0, top: table.heightMm},
      {name: 'Pooja-wall wardrobe', wall: 'balconyEast', a: bal.lengthMm - pooja.northShiftMm, b: bal.lengthMm, bottom: 0, top: pooja.heightMm},
    ],
    doors: [
      {id: 'lobby', name: 'door from the Lobby', wall: 'south', fromMm: lobbyDoor.fromMm, widthMm: lobbyDoor.widthMm, latch: 'to', latchAssumed: true},
      {id: 'washroom', name: 'washroom door', wall: 'north', fromMm: wash.fromMm, widthMm: wash.widthMm, latch: 'to', latchAssumed: true},
    ],
    chargeSpots: [...side.spots, {name: 'balcony chair', x: W + chair.centerFromBedroomWallMm, z: chair.centerFromNorthMm}],
    acs: [ac, window], tracks: BEDROOM1_LIGHTING.tracks.runs, fans,
    lightingCircuits: [...trackCircuits(BEDROOM1_LIGHTING), ...fanCircuits(fans)],
    anchors: {
      ...side.anchors,
      lobbyDoorLatch: {wall: 'south', alongMm: lobbyDoor.fromMm + lobbyDoor.widthMm + 150},
      washroomDoorLatch: {wall: 'north', alongMm: wash.fromMm + wash.widthMm + 150},
      'acBeside:split': {wall: ac.wall, alongMm: ac.b + 130},
      windowAcSocket: {wall: 'balconyEast', alongMm: window.a - 100},
      balconyTable: {wall: 'balconyEast', alongMm: table.centerFromNorthMm},
    },
    existing: {},
  }
}

function bedroom3Model() {
  const room = EMPTY_ROOM_SHELLS.bedroom3, W = room.widthMm, L = room.lengthMm, f = room.furniture, c = f.eastCabinet, chest = f.westChest, s = room.southExtension
  const [entry, toilet] = [room.doors.find(d => d.leadsTo === 'Bedroom 3'), room.doors.find(d => /toilet/i.test(d.leadsTo))]
  const bed = bedroom3DownTargets(room).find(t => t.label === 'bed'), headWall = f.bed.headWall
  const openings = [...plannedOpenings(room),
    {name: 'wardrobe bay in the south wall', wall: 'south', a: s.cabinet.fromWestMm, b: s.cabinet.fromWestMm + s.cabinet.widthMm, bottom: 0, top: s.cabinet.heightMm},
    {name: 'balcony door', wall: 'south', a: s.balcony.doorFromWestMm, b: s.balcony.doorFromWestMm + s.balcony.doorWidthMm, bottom: 0, top: s.balcony.doorHeightMm},
    {name: 'balcony window', wall: 'south', a: s.balcony.windowFromWestMm, b: s.balcony.windowFromWestMm + s.balcony.windowWidthMm, bottom: s.balcony.windowSillMm, top: s.balcony.windowTopMm}]
  const side = bedside(bed, headWall, openings, W, L)
  const ac = {id: 'split', name: 'split AC in the east cabinet bay', wall: 'east', a: c.ac.centerFromNorthMm - c.ac.bayWidthMm / 2, b: c.ac.centerFromNorthMm + c.ac.bayWidthMm / 2, bottom: c.ac.bottomMm, top: c.ac.bottomMm + c.ac.unitHeightMm}
  const fans = fanList(BEDROOM3_LIGHTING), art = chest.artwork, artEnd = chest.fromNorthMm + chest.widthMm / 2 + art.widthMm / 2
  // The mirror dressing cabinet (the south unit since 2026-10-05) and the wall at its end of the run.
  const dressing = [c.north, c.south].find(u => u.mirrorTopMm != null), dressingEnd = dressing === c.south ? 'south' : 'north'
  return {
    key: 'bedroom3', name: room.name, widthMm: W, lengthMm: L, heightMm: room.heightMm, walls: rectWalls(W, L), openings,
    blockers: [...plannedBlockers('bedroom3', room), ...bedBlockers(bed, headWall, W, L),
      // The entry door stands against the west wall; hinged there and opening in, its leaf lies along the west wall.
      leafBlocker('entry door', 'west', 0, entry.widthMm, entry.heightMm)],
    doors: [
      {id: 'entry', name: 'entry door', wall: 'north', fromMm: entry.fromMm, widthMm: entry.widthMm, latch: 'to', latchAssumed: true},
      // The storage cabinet now fills the wall east of this door (owner 2026-10-05), so the latch and the switches go on its west side.
      {id: 'toilet', name: 'toilet door', wall: 'north', fromMm: toilet.fromMm, widthMm: toilet.widthMm, latch: 'from', latchAssumed: true},
    ],
    chargeSpots: side.spots, acs: [ac], tracks: BEDROOM3_LIGHTING.tracks.runs, fans,
    lightingCircuits: [...trackCircuits(BEDROOM3_LIGHTING), ...fanCircuits(fans), {id: 'wallLight', label: 'existing wall light (picture light)'}],
    anchors: {
      ...side.anchors,
      toiletDoorLatch: {wall: 'north', alongMm: toilet.fromMm - 150},
      'acBeside:split': {wall: 'east', alongMm: ac.b + 150},
      // On the strip of wall above the chest, between the end of the artwork and the end of the chest.
      westChestSouthEnd: {wall: 'west', alongMm: (artEnd + chest.fromNorthMm + chest.widthMm) / 2},
      // On the end wall beside the mirror, 250 mm west of the dressing cabinet front (south wall: under the window sill).
      dressingSocket: {wall: dressingEnd, alongMm: W - (dressing.depthMm ?? c.depthMm) - 250},
    },
    existing: byId(existingPointsFor('bedroom3')),
  }
}

function studyModel() {
  const d = STUDY_ROOM.dimensions, W = d.widthMm, L = d.lengthMm, o = STUDY_ROOM.openings, cab = STUDY_ROOM.cabinetry
  const [bed, desk] = [STUDY_LIGHTING.downTargets.find(t => t.label === 'bed'), STUDY_LIGHTING.downTargets.find(t => t.label === 'desk')]
  const office = {a: L - o.balconyOffice.offsetFromSouthMm - o.balconyOffice.widthMm, b: L - o.balconyOffice.offsetFromSouthMm}
  const main = {a: o.mainDoor.offsetFromNorthMm, b: o.mainDoor.offsetFromNorthMm + o.mainDoor.widthMm}
  const terrace = {a: o.terraceDoor.offsetFromWestMm, b: o.terraceDoor.offsetFromWestMm + o.terraceDoor.widthMm}
  const south = cab.southBuiltIn, shelf = cab.northBookshelf, fans = fanList(STUDY_LIGHTING)
  return {
    key: 'study', name: 'Study (Bedroom 2)', widthMm: W, lengthMm: L, heightMm: d.heightMm, walls: rectWalls(W, L),
    openings: [
      {name: 'entry door', wall: 'east', a: main.a, b: main.b, bottom: 0, top: o.mainDoor.heightMm},
      {name: 'terrace door', wall: 'south', a: terrace.a, b: terrace.b, bottom: 0, top: o.terraceDoor.heightMm},
      {name: 'opening to the Home Office', wall: 'west', a: office.a, b: office.b, bottom: 0, top: o.balconyOffice.heightMm},
      {name: 'raised south-wall cabinet', wall: 'south', a: south.offsetFromWestMm, b: south.offsetFromWestMm + south.widthMm, bottom: south.floorClearanceMm, top: south.floorClearanceMm + south.heightMm},
    ],
    blockers: [
      {name: 'north bookshelf', wall: 'north', a: shelf.offsetFromWestMm, b: shelf.offsetFromWestMm + shelf.widthMm, bottom: 0, top: shelf.heightMm},
      {name: 'north bookshelf (its side)', wall: 'west', a: 0, b: shelf.depthMm, bottom: 0, top: shelf.heightMm},
      {name: 'bed', wall: 'east', a: bed.z1, b: bed.z2, bottom: 0, top: 700},
      {name: 'desk', wall: 'east', a: desk.z1, b: desk.z2, bottom: 0, top: 765},
      // The entry door is in the north-east corner, hinged at the corner: open, its leaf lies along the north wall.
      leafBlocker('entry door', 'north', W - o.mainDoor.widthMm, W, o.mainDoor.heightMm),
    ],
    doors: [
      {id: 'main', name: 'entry door', wall: 'east', fromMm: main.a, widthMm: o.mainDoor.widthMm, latch: 'to', latchAssumed: true},
      {id: 'terrace', name: 'terrace door', wall: 'south', fromMm: terrace.a, widthMm: o.terraceDoor.widthMm, latch: 'from', latchAssumed: true},
    ],
    chargeSpots: [
      {name: 'pillow of the bed', x: (bed.x1 + bed.x2) / 2, z: bed.z1 + 300},
      {name: 'desk chair', x: desk.x1 - 300, z: (desk.z1 + desk.z2) / 2},
    ],
    acs: [], // the indoor unit is not in any config: see ROOM_ELECTRICAL.study.verify
    tracks: STUDY_LIGHTING.tracks.runs, fans,
    lightingCircuits: [...trackCircuits(STUDY_LIGHTING), ...fanCircuits(fans)],
    anchors: {
      mainDoorLatch: {wall: 'east', alongMm: main.b + 75},
      terraceDoorLatch: {wall: 'south', alongMm: terrace.a - 200},
      bedside: {wall: 'east', alongMm: bed.z1 + 300},
      desk: {wall: 'east', alongMm: desk.z1 + 240},
    },
    existing: {},
  }
}

// The Home Office page labels for the points of BALCONY_OFFICE.electrical (BalconyOffice3D.jsx draws them under these names).
const OFFICE_PAGE_LABELS = {'heater-existing': 'E1', 'router-existing': 'E2', 'desk-feed': 'N1', 'pc-ups': 'N2', printer: 'N4'}

function officeModel() {
  const office = BALCONY_OFFICE, d = office.dimensions, W = d.widthMm, L = d.lengthMm, e = office.electrical, env = office.envelope
  const layout = balconyDeskLayout(office), m = layout.moving, opening = office.survey.studyOpening
  const window = wall => ({name: `window band on the ${wall} wall`, wall, a: 0, b: wall === 'south' ? W : L, bottom: env.lowerBrickParapetMm, top: env.lowerBrickParapetMm + env.windowBandMm})
  const cabinet = (id, name, kind, src, extra = {}) => ({id, name, kind, wall: 'cabinet', drawnBy: 'page', place: src.location, outlets: src.rating ?? `${src.outlets} outlets`, use: src.use ?? src.circuit, ...extra})
  const [heater, router] = e.existingPoints, [feed, pc, printer] = e.newFixedPoints, rail = e.movingDeskPower
  return {
    key: 'office', name: 'Home Office', widthMm: W, lengthMm: L, heightMm: d.floorToCeilingMm, walls: rectWalls(W, L),
    openings: [...env.windowWalls.map(window),
      // The opening from the Study, from the phone scan (survey.studyOpening): at the north end of the east side.
      {name: 'opening from the Study', wall: 'east', a: opening.fromNorthMm, b: opening.fromNorthMm + opening.widthMm, bottom: 0, top: opening.headMm}],
    blockers: [], doors: [], acs: [], tracks: [], fans: [],
    chargeSpots: [{name: 'desk chair', x: m.x1 + 350, z: (m.zStart + m.zEnd) / 2}],
    lightingCircuits: [{id: 'officeLight', label: 'ceiling light'}],
    anchors: {
      eastReturn: {wall: 'east', alongMm: opening.fromNorthMm + opening.widthMm + 170},
      roomCentre: {wall: 'ceiling', xMm: W / 2, zMm: L / 2},
    },
    existing: {},
    // The desk and equipment points of BALCONY_OFFICE.electrical, under the labels the Home Office page draws them with.
    extraPoints: [
      cabinet(OFFICE_PAGE_LABELS[heater.id], 'Water heater point (existing)', 'dedicated', heater, {loadW: ELECTRICAL_LOAD_W.storageWaterHeater}),
      cabinet(OFFICE_PAGE_LABELS[router.id], 'Router point (existing)', 'power', router, {loadW: router.outlets * ELECTRICAL_LOAD_W.socket6A}),
      cabinet(OFFICE_PAGE_LABELS[feed.id], 'Desk feed', 'power', feed, {loadW: rail.outlets * ELECTRICAL_LOAD_W.socket6A}),
      cabinet(OFFICE_PAGE_LABELS[pc.id], 'PC / UPS points (N2 + N3)', 'power', pc, {loadW: pc.outlets * ELECTRICAL_LOAD_W.socket6A}),
      cabinet(OFFICE_PAGE_LABELS[printer.id], 'Printer point', 'power', printer, {loadW: printer.outlets * ELECTRICAL_LOAD_W.socket6A}),
      {id: 'D1', name: 'Data: CAT6 runs', kind: 'data', wall: 'cabinet', drawnBy: 'page', noLoad: true, place: e.data.route, outlets: `${e.data.cat6Runs} x CAT6`, use: e.data.separation},
      // The eight-outlet rail under the moving top is the desk's charging point; its load is counted at its feed, N1.
      {id: 'P1', name: 'Moving desk power rail', kind: 'charging', wall: 'free', drawnBy: 'page', noLoad: true, xMm: (m.x0 + m.x1) / 2, zMm: (m.zStart + m.zEnd) / 2, heightMm: m.defaultHeightMm - 110,
        place: 'under the sit-stand top', outlets: `${rail.outlets}-outlet rail (${rail.spares} spare)`, use: `${rail.loads.join(', ')}; fed by ${rail.feed}`},
    ],
  }
}

/**
 * The Main entry. FRAME: the Main entry page's (EntryGallery3D.jsx): x = (plan x - 515) x planScale, growing WEST from the
 * gallery's east wall; z = (plan y - 715) x planScale, growing NORTH from the Drawing Room wall. The entry is not a rectangle,
 * so its walls are named: alongMm runs from the wall's first end as listed.
 */
function entryModel() {
  const b = ENTRY.planBounds, s = ENTRY.planScale, X = px => (px - b.x1) * s.xMetresPerPixel * 1000, Z = py => (py - b.y1) * s.zMetresPerPixel * 1000
  const door = ENTRY.arrivalDoor.wallPlanX, shaft = ENTRY.shaft, outer = ENTRY.outerEntryOpening, inner = ENTRY.innerOpening, rack = ENTRY.shoeRack
  const walls = {
    galleryEast: {x: 0, z: 0, dx: 0, dz: 1, nx: 1, nz: 0, lengthMm: Z(b.y2), label: 'gallery east wall (plan x 515), from the Drawing Room wall', axis: 'z'},
    shaftFace: {x: X(door), z: Z(shaft.planY1), dx: 0, dz: 1, nx: -1, nz: 0, lengthMm: Z(shaft.planY2) - Z(shaft.planY1), label: 'shaft wall facing the gallery', axis: 'z'},
    corridorSouth: {x: X(door), z: Z(shaft.planY2), dx: 1, dz: 0, nx: 0, nz: 1, lengthMm: X(b.x2) - X(door), label: 'corridor south wall (the shaft side)', axis: 'x'},
    outerWall: {x: X(b.x2), z: Z(shaft.planY2), dx: 0, dz: 1, nx: -1, nz: 0, lengthMm: Z(b.y2) - Z(shaft.planY2), label: 'outer wall with the plain landing opening', axis: 'z'},
    galleryNorth: {x: 0, z: Z(b.y2), dx: 1, dz: 0, nx: 0, nz: -1, lengthMm: X(door), label: 'gallery north wall (the shoe rack)', axis: 'x'},
  }
  const outerA = Z(outer.fromPlanY) - walls.outerWall.z, outerB = Z(outer.toPlanY) - walls.outerWall.z
  const seatZ = Z(shaft.planY1 + 35) // EntryFoldSeat.js
  return {
    key: 'entry', name: 'Main entry', widthMm: X(b.x2), lengthMm: Z(b.y2), heightMm: ENTRY.wallHeightMm, walls,
    openings: [{name: 'plain landing opening (no door)', wall: 'outerWall', a: outerA, b: outerB, bottom: 0, top: outer.heightMm}],
    blockers: [
      {name: 'fold-down shoe seat', wall: 'galleryEast', a: seatZ - 180, b: seatZ + 180, bottom: 0, top: 650},
      {name: 'shoe rack', wall: 'galleryNorth', a: X(rack.planX1), b: X(rack.planX2), bottom: 0, top: rack.heightMm},
    ],
    doors: [
      // Hinges 'north' in entryConfig.js (the higher plan y): the latch is at the lower plan y end of each opening.
      {id: 'outer', name: 'steel safety door at arrival opening', latchAt: {x: X(door)+ENTRY.outerDoor.faceOffsetMm, z: Z(ENTRY.arrivalDoor.fromPlanY)}, latchAssumed: !ENTRY.outerDoor.hingeKnown},
      {id: 'arrival', name: 'arrival door', latchAt: {x: X(door), z: Z(ENTRY.arrivalDoor.fromPlanY)}},
      // The Drawing Room door is hinged on its east jamb (roomShellConfig.js), so its latch is at the plan x 570 end, where the
      // only surface is the east cabinet's doors: the switch may stand on the hinge-side wall, further from the latch.
      {id: 'drawing', name: 'Drawing Room door', latchAt: {x: X(inner.toPlanX), z: 0}, boardRadiusMm: 1200},
    ],
    chargeSpots: [], acs: [], tracks: [], fans: [],
    fittings: Object.fromEntries(ENTRY_LIGHTING.fittings.map(f => [f.id, {x: X(f.planX), z: Z(f.planY), watts: f.watts}])),
    lightingCircuits: ENTRY_LIGHTING.switching.map(g => ({id: g.id, label: `${g.lights.join(' + ')} (${g.where})`})),
    anchors: {
      // PROPOSAL 2026-10-06: retained anchor IDs now follow the paired arrival doors, on the solid south latch-side walls.
      outerDoorInside: {wall: 'corridorSouth', alongMm: ENTRY.doorPair.corridorSwitchAlongMm},
      outerDoorLatchStrip: {wall: 'corridorSouth', alongMm: ENTRY.doorPair.bellAlongMm},
      arrivalDoorLatch: {wall: 'shaftFace', alongMm: walls.shaftFace.lengthMm - ENTRY.doorPair.gallerySwitchFromDoorMm},
      shoeRackMiddle: {wall: 'galleryNorth', alongMm: (X(rack.planX1) + X(rack.planX2)) / 2},
    },
    existing: {},
  }
}

const BUILDERS = {lobby: lobbyModel, bedroom1: bedroom1Model, bedroom3: bedroom3Model, study: studyModel, office: officeModel, entry: entryModel}

export const hasRoomElectrical = key => Boolean(ROOM_ELECTRICAL[key] && BUILDERS[key])
export const roomElectricalKeys = () => Object.keys(ROOM_ELECTRICAL)

/** The model of one room (throws for a room without a plan). */
export function roomElectricalModel(key) {
  if (!hasRoomElectrical(key)) throw new Error(`No electrical plan for room "${key}"`)
  return BUILDERS[key]()
}

/** Model, plan, check result and resolved points of a room in one call: what the page, the doc and the tests use. */
export function roomElectricalReport(key) {
  const model = roomElectricalModel(key), plan = ROOM_ELECTRICAL[key], check = checkRoomElectrical(model, plan)
  return {key, model, plan, check, points: check.points.map(p => ({...p, where: describePointPlace(model, p)}))}
}

export {resolveRoomPoints}
