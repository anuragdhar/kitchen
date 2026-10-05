// Checks and positions for the Drawing Room electrical plan (pure: no React or Three.js). Millimetres, room frame: x from the
// west wall, z from the north wall, y up. Points: DRAWING_ELECTRICAL in config/drawingElectricalConfig.js.
import {southTvGeometry, WALL_FACE_MM} from './drawingRoomLayout.mjs'
import {indoorUnitBox} from './acPlan.mjs'
import {AC_PLAN} from '../config/acPlanConfig.js'

const SOFA_BACK_MM = 950 // a point lower than this, behind a sofa standing against the wall, cannot be reached
const NEAR_WALL_MM = 250 // a sofa within this of a wall line counts as standing against it

/** Where a point's box sits, in the room frame (mm). `wallFaceMm` is the drawn inside face of the walls. */
export function electricalPointPosition(room, p, {wallFaceMm = WALL_FACE_MM} = {}) {
  switch (p.wall) {
    case 'north': return {x: p.alongMm, y: p.heightMm, z: wallFaceMm}
    case 'south': return {x: p.alongMm, y: p.heightMm, z: room.lengthMm - wallFaceMm}
    case 'west': return {x: wallFaceMm, y: p.heightMm, z: p.alongMm}
    case 'east': return {x: room.widthMm - wallFaceMm, y: p.heightMm, z: p.alongMm}
    case 'ceiling': return {x: p.xMm, y: room.heightMm, z: p.zMm}
    case 'floor': return {x: p.xMm, y: 0, z: p.zMm}
    case 'closet': return {x: p.xMm, y: p.heightMm, z: wallFaceMm - room.wallStorage.depthMm / 2}
    default: throw new Error(`Unknown electrical point wall: ${p.wall}`)
  }
}

// Layout C footprints standing against a wall: [wall, along1, along2, top height].
function againstWalls(room) {
  const f = room.southLayout.furniture, rows = []
  const sofa = (r, along) => along === 'x'
    ? {x1: r.centerXmm - r.lengthMm / 2, x2: r.centerXmm + r.lengthMm / 2, z1: r.centerZmm - r.widthMm / 2, z2: r.centerZmm + r.widthMm / 2}
    : {x1: r.centerXmm - r.widthMm / 2, x2: r.centerXmm + r.widthMm / 2, z1: r.centerZmm - r.lengthMm / 2, z2: r.centerZmm + r.lengthMm / 2}
  for (const [name, r] of [['south sofa', sofa(f.southSofa, 'x')], ['west sofa', sofa(f.westSofa, 'z')]]) {
    if (r.x1 < NEAR_WALL_MM) rows.push({name, wall: 'west', a: r.z1, b: r.z2, top: SOFA_BACK_MM})
    if (room.widthMm - r.x2 < NEAR_WALL_MM) rows.push({name, wall: 'east', a: r.z1, b: r.z2, top: SOFA_BACK_MM})
    if (r.z1 < NEAR_WALL_MM) rows.push({name, wall: 'north', a: r.x1, b: r.x2, top: SOFA_BACK_MM})
    if (room.lengthMm - r.z2 < NEAR_WALL_MM) rows.push({name, wall: 'south', a: r.x1, b: r.x2, top: SOFA_BACK_MM})
  }
  return rows
}

export function checkElectricalPlan(room, plan) {
  const issues = [], need = (ok, message) => { if (!ok) issues.push(message) }
  const door = room.doors.find(d => d.wall === 'north'), ws = room.wallStorage, win = room.windows.find(w => w.wall === 'south')
  const tvs = Object.keys(room.southLayout.tv.tvs).map(key => southTvGeometry(room, key)), console = tvs[0].console
  const blockers = againstWalls(room)
  // The west-wall indoor unit as the AC plan places it (config/acPlanConfig.js) and the room pages draw it
  // (rooms/shared/RoomAirConditioning.js): along z1-z2 of the west wall, from bottomMm up.
  const acBox = indoorUnitBox(AC_PLAN.spaces.find(s => s.id === 'drawing'), AC_PLAN)
  const ac = {z1: acBox.z1, z2: acBox.z2, y1: acBox.bottomMm, y2: acBox.topMm}
  const ids = new Set()
  for (const p of plan.points) {
    const label = `${p.id} (${p.name})`
    need(!ids.has(p.id), `${p.id} is listed twice`); ids.add(p.id)
    const along = p.alongMm, h = p.heightMm
    if (['north', 'south'].includes(p.wall)) need(along > 0 && along < room.widthMm, `${label} is off the ${p.wall} wall`)
    if (['east', 'west'].includes(p.wall)) need(along > 0 && along < room.lengthMm, `${label} is off the ${p.wall} wall`)
    if (p.wall === 'north') {
      need(!(along > door.fromMm - 50 && along < door.fromMm + door.widthMm + 50), `${label} is in the entry door opening`)
      need(!(along > ws.fromWestMm - 50 && along < ws.fromWestMm + ws.widthMm + 50 && h < ws.bottomMm + ws.heightMm + 50), `${label} is in the west cabinet door opening`)
    }
    if (p.wall === 'east') {
      need(along < room.wallOpenings.east.fromMm - 50, `${label} is in the lobby opening, not on solid wall`)
      need(along >= (door.leafMm ?? door.widthMm) || h >= door.heightMm, `${label} is behind the entry door when it is open`)
    }
    if (p.wall === 'south' && win) need(!(along > win.fromMm - 50 && along < win.fromMm + win.widthMm + 50 && h > win.bottomMm - 100 && h < win.topMm + 50), `${label} is in the window`)
    if (p.wall === 'west') need(!(along > ac.z1 && along < ac.z2 && h > ac.y1 - 100), `${label} is hidden behind the AC indoor unit`)
    if (p.kind === 'dedicated' && p.wall === 'west') need(Math.min(Math.abs(along - ac.z1), Math.abs(along - ac.z2)) <= 1000, `${label} is more than 1 m from the AC unit`)
    if (!p.hidden && ['north', 'south', 'east', 'west'].includes(p.wall)) {
      for (const b of blockers) if (b.wall === p.wall && along > b.a - 50 && along < b.b + 50 && h < b.top) issues.push(`${label} is hidden behind the ${b.name}`)
      if (p.wall === 'north') for (const g of tvs) if (along > g.x1 && along < g.x2 && h > g.bottomMm && h < g.topMm) issues.push(`${label} is hidden behind the ${g.tv.diagonalInches}-inch TV`)
      if (p.wall === 'north') need(!(along > console.x1 && along < console.x2 && h > console.bottomMm && h < console.topMm), `${label} is hidden behind the TV console`)
      if (p.kind === 'power' || p.kind === 'charging') need(h >= 150 && h <= 1100, `${label} at ${h} mm is outside the 150-1100 mm reach for a socket`)
    }
    if (p.kind === 'lighting' && /switchboard/i.test(p.name)) need(h >= 1100 && h <= 1400, `${label} at ${h} mm is outside the 1100-1400 mm switch height`)
  }
  // The TV box must stay hidden behind every TV size, and the router point behind the console's router bay.
  const tvBox = plan.points.find(p => p.id === 'N1')
  if (tvBox) for (const g of tvs) need(tvBox.alongMm > g.x1 + 100 && tvBox.alongMm < g.x2 - 100 && tvBox.heightMm > g.bottomMm + 100 && tvBox.heightMm < g.topMm - 100, `N1 is not hidden behind the ${g.tv.diagonalInches}-inch TV`)
  const router = plan.points.find(p => p.id === 'N4'), bay = tvs[0].routerBay
  if (router) need(router.wall === 'north' && router.alongMm > bay.x1 && router.alongMm < bay.x2 && router.heightMm > console.bottomMm && router.heightMm < console.topMm, 'N4 is not behind the router bay of the TV console')
  // Every seat needs a charging point within reach (about 1.5 m of the seat centre).
  const f = room.southLayout.furniture, seats = [
    ...[-750, 0, 750].map(o => ({name: `south sofa seat at x ${f.southSofa.centerXmm + o}`, x: f.southSofa.centerXmm + o, z: f.southSofa.centerZmm})),
    ...[-750, 0, 750].map(o => ({name: `west sofa seat at z ${f.westSofa.centerZmm + o}`, x: f.westSofa.centerXmm, z: f.westSofa.centerZmm + o})),
  ]
  const chargers = plan.points.filter(p => p.kind === 'charging' && !p.optional).map(p => electricalPointPosition(room, p, {wallFaceMm: 0}))
  const reach = seats.map(seat => ({seat: seat.name, nearestMm: Math.round(Math.min(...chargers.map(c => Math.hypot(c.x - seat.x, c.z - seat.z))))}))
  for (const r of reach) need(r.nearestMm <= 1500, `no charging point within 1.5 m of the ${r.seat} (nearest ${r.nearestMm} mm)`)
  const byKind = {}
  for (const p of plan.points) byKind[p.kind] = (byKind[p.kind] ?? 0) + 1
  return {ok: issues.length === 0, issues, byKind, reach}
}

/** Length of a feed route in mm: the sum of its straight legs. */
export function feedRouteLengthMm(route) {
  return Math.round(route.points.slice(1).reduce((sum, p, i) => sum + Math.hypot(p.xMm - route.points[i].xMm, p.zMm - route.points[i].zMm, p.yMm - route.points[i].yMm), 0))
}

/**
 * The track feeds of a room: every track run of `lighting` has one feed point in `plan` at an end of the run, and a route in
 * `feeds` that starts at the switchboard, runs in straight legs parallel to the walls or vertical, stays in the room, and
 * ends at that feed point on the ceiling. Returns {ok, issues, routes: [{id, run, lengthMm}], totalMm}.
 */
export function checkLightFeeds(room, plan, lighting, feeds) {
  const issues = [], need = (ok, message) => { if (!ok) issues.push(message) }
  const board = feeds.switchboard, routes = []
  need(feeds.dimmer.circuits.includes('chandelier'), 'the chandelier has no dimmer')
  for (const run of lighting.tracks.runs) {
    const point = plan.points.find(p => p.feedsRun === run.id), route = feeds.routes.find(r => r.run === run.id)
    need(point, `${run.id} has no feed point in the electrical plan`); need(route, `${run.id} has no cable route`)
    need(feeds.dimmer.circuits.includes(run.id), `${run.id} has no dimmer at the switchboard`)
    if (!point || !route) continue
    const along = run.axis === 'x' ? point.xMm : point.zMm, across = run.axis === 'x' ? point.zMm : point.xMm
    need(across === run.atMm && (along === run.fromMm || along === run.toMm), `${point.id} is not at an end of ${run.id}`)
    const first = route.points[0], last = route.points[route.points.length - 1]
    need(first.xMm === board.xMm && first.yMm === board.heightMm && first.zMm === 0, `${route.id}: the route does not start at the switchboard`)
    need(last.xMm === point.xMm && last.zMm === point.zMm && last.yMm === feeds.ceilingMm, `${route.id}: the route does not end at its feed point on the ceiling`)
    route.points.slice(1).forEach((p, i) => {
      const q = route.points[i], moved = [p.xMm !== q.xMm, p.yMm !== q.yMm, p.zMm !== q.zMm].filter(Boolean).length
      need(moved === 1, `${route.id}: leg ${i + 1} is not a single straight run parallel to a wall`)
      need(p.xMm >= 0 && p.xMm <= room.widthMm && p.zMm >= 0 && p.zMm <= room.lengthMm && p.yMm <= feeds.ceilingMm, `${route.id}: leg ${i + 1} leaves the room`)
    })
    routes.push({id: route.id, run: run.id, lengthMm: feedRouteLengthMm(route)})
  }
  return {ok: issues.length === 0, issues, routes, totalMm: routes.reduce((sum, r) => sum + r.lengthMm, 0)}
}
