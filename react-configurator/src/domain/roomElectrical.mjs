// Generic checks and positions for a room's proposed electrical plan (pure: no React, Three.js or DOM).
// Plans: ROOM_ELECTRICAL in config/roomElectricalConfig.js (the point vocabulary is in its header). Room models:
// roomElectricalModels.mjs, which builds for each room the plain description this module works on:
//
//   {key, name, widthMm, lengthMm, heightMm,
//    walls        {name: {x, z, dx, dz, nx, nz, lengthMm, label, axis}}  where a wall starts (x, z), the unit direction its
//                 alongMm runs in (dx, dz) and the unit normal pointing into the room (nx, nz); rectWalls() gives the four
//                 walls of a rectangular room, a model may add more (a balcony parapet, the walls of the Main entry)
//    openings     [{name, wall, a, b, bottom, top}]   doors, windows, open sides, cabinet fronts: no box may go there
//    blockers     [{name, wall, a, b, bottom, top, leaf}]  furniture against the wall, or (leaf) a door leaf standing open
//    doors        [{id, name, wall, fromMm, widthMm, latch: 'from' | 'to', latchAt: {x, z}, boardRadiusMm, latchAssumed}]
//    chargeSpots  [{name, x, z}]   bed sides, desks and seats that need a charging point within reach
//    acs          [{id, name, wall, a, b, bottom, top}]   AC units on a wall
//    tracks       [{id, label, axis, atMm, fromMm, toMm, driverWatts}]   track-light runs (one driver each)
//    fans         [{name, x, z}]   ceiling fans
//    fittings     {id: {x, z, watts}}   ceiling fittings a point may sit on
//    lightingCircuits [{id, label}]  everything that needs a switch
//    anchors      {name: {wall, alongMm} | {wall: 'ceiling' | 'free', xMm, zMm}}   positions computed from furniture config
//    existing     {id: existing point in the room frame}   (existingElectrical.mjs)
//    extraPoints  [point]   points that live in another config (the Home Office desk points)}
//
// Millimetres; x from the west wall, z from the north wall, y up (the Main entry model documents its own frame).
import {ELECTRICAL_LOAD_W, CIRCUIT_LOADING_MAX, SUPPLY_VOLTS} from '../config/roomElectricalConfig.js'

export const SWITCH_HEIGHT_MM = [1100, 1400]   // a switch plate's centre (nominal 1200)
export const SOCKET_REACH_MM = [150, 1300]     // a socket that is not hidden on purpose
export const CHARGE_REACH_MM = 1500            // a bed side, desk or seat to its nearest charging point, in plan
export const BOARD_TO_LATCH_MAX_MM = 700       // a door's switchboard to its latch-side jamb, in plan
export const AC_POINT_MAX_MM = 1000            // an AC point to the nearest edge of its unit, along the wall
export const DRIVER_TO_RUN_MAX_MM = 800        // a driver feed to the nearest point of its track run (the 48 V lead)
export const FAN_POINT_MAX_MM = 150            // a fan point to the fan centre, in plan
const OPENING_MARGIN_MM = 50, BLOCKER_MARGIN_MM = 40

/** The four walls of a rectangular room, each measured as roomShellConfig.js does: north/south along x, east/west along z. */
export function rectWalls(widthMm, lengthMm) {
  return {
    north: {x: 0, z: 0, dx: 1, dz: 0, nx: 0, nz: 1, lengthMm: widthMm, label: 'north wall', axis: 'x'},
    south: {x: 0, z: lengthMm, dx: 1, dz: 0, nx: 0, nz: -1, lengthMm: widthMm, label: 'south wall', axis: 'x'},
    west: {x: 0, z: 0, dx: 0, dz: 1, nx: 1, nz: 0, lengthMm, label: 'west wall', axis: 'z'},
    east: {x: widthMm, z: 0, dx: 0, dz: 1, nx: -1, nz: 0, lengthMm, label: 'east wall', axis: 'z'},
  }
}

const isWallPoint = p => p.wall && !['ceiling', 'free', 'cabinet'].includes(p.wall)

/** The connected load of a point for the estimate (W): its own loadW, else what it feeds, else the default of its kind. */
function loadOf(model, p) {
  if (p.noLoad) return 0
  if (p.loadW != null) return p.loadW
  if (p.driverFor) return model.tracks?.find(t => t.id === p.driverFor)?.driverWatts ?? 0
  if (p.fitting) return model.fittings?.[p.fitting]?.watts ?? 0
  if (p.fan) return ELECTRICAL_LOAD_W.fan
  return {charging: ELECTRICAL_LOAD_W.socket6A, power: ELECTRICAL_LOAD_W.socket16A, lighting: ELECTRICAL_LOAD_W.lightPoint, data: 0}[p.kind] ?? 0
}

/**
 * One plan point with its place worked out: `existing`, `driverFor`, `fan`, `fitting` and `anchor` are turned into
 * wall + alongMm + heightMm (or ceiling / free xMm, zMm). `unresolved` names what could not be found. Explicit figures on
 * the point win over the looked-up ones; `loadW` is filled in.
 */
export function resolveRoomPoint(model, p) {
  let at = {}, unresolved = null
  if (p.existing) {
    const e = model.existing?.[p.existing]
    if (!e) unresolved = `existing point ${p.existing}`
    else at = e.wall === 'ceiling' ? {wall: 'ceiling', xMm: e.xMm, zMm: e.zMm} : {wall: e.wall, alongMm: (e.fromMm + e.toMm) / 2, heightMm: (e.bottomMm + e.topMm) / 2}
  } else if (p.driverFor) {
    const t = model.tracks?.find(t => t.id === p.driverFor)
    if (!t) unresolved = `track run ${p.driverFor}`
    else { const along = p.runEnd === 'to' ? t.toMm : t.fromMm; at = t.axis === 'x' ? {wall: 'ceiling', xMm: along, zMm: t.atMm} : {wall: 'ceiling', xMm: t.atMm, zMm: along} }
  } else if (p.fan) {
    const f = model.fans?.[p.fan - 1]
    if (!f) unresolved = `ceiling fan ${p.fan}`; else at = {wall: 'ceiling', xMm: f.x, zMm: f.z}
  } else if (p.fitting) {
    const f = model.fittings?.[p.fitting]
    if (!f) unresolved = `ceiling fitting ${p.fitting}`; else at = {wall: 'ceiling', xMm: f.x, zMm: f.z}
  } else if (p.anchor) {
    const a = model.anchors?.[p.anchor]
    if (!a) unresolved = `anchor ${p.anchor}`; else at = {...a, ...(a.alongMm != null ? {alongMm: a.alongMm + (p.alongOffsetMm ?? 0)} : {})}
  }
  const out = {...at, ...p}
  if (at.alongMm != null && p.alongMm == null) out.alongMm = at.alongMm
  out.loadW = loadOf(model, p)
  if (unresolved) out.unresolved = unresolved
  for (const key of ['alongMm', 'heightMm', 'xMm', 'zMm']) if (out[key] != null) out[key] = Math.round(out[key])
  return out
}

/** Every point of the room: the plan's own, then the model's extra points (those that live in another config). */
export function resolveRoomPoints(model, plan) {
  return [...plan.points, ...(model.extraPoints ?? [])].map(p => resolveRoomPoint(model, p))
}

/** Where a resolved point's box sits (mm, room frame), `wallFaceMm` in from the wall line. null if it has no drawn position. */
export function roomPointPosition(model, p, {wallFaceMm = 0} = {}) {
  if (p.unresolved) return null
  if (p.wall === 'ceiling') return p.xMm == null ? null : {x: p.xMm, y: model.heightMm, z: p.zMm}
  if (p.wall === 'free') return p.xMm == null ? null : {x: p.xMm, y: p.heightMm ?? 0, z: p.zMm}
  const w = model.walls[p.wall]
  if (!w || p.alongMm == null) return null
  return {x: w.x + w.dx * p.alongMm + w.nx * wallFaceMm, y: p.heightMm, z: w.z + w.dz * p.alongMm + w.nz * wallFaceMm}
}

/** "north wall, x 1200, 1200 high" */
export function describePointPlace(model, p) {
  if (p.unresolved) return `not placed (${p.unresolved} not found)`
  if (p.wall === 'ceiling') return `ceiling, x ${p.xMm}, z ${p.zMm}`
  if (p.wall === 'free') return `${p.place ?? model.anchors?.[p.anchor]?.place ?? 'off the walls'}, x ${p.xMm}, z ${p.zMm}, ${p.heightMm} high`
  if (p.wall === 'cabinet') return p.place ?? 'inside the cabinetry'
  const w = model.walls[p.wall]
  if (!w) return `unknown wall ${p.wall}`
  const along = w.axis === 'x' ? Math.round(w.x + p.alongMm) : Math.round(w.z + p.alongMm)
  return `${w.label}, ${w.axis} ${along}, ${p.heightMm} high`
}

const latchPoint = (model, d) => {
  if (d.latchAt) return d.latchAt
  const w = model.walls[d.wall], along = d.latch === 'to' ? d.fromMm + d.widthMm : d.fromMm
  return {x: w.x + w.dx * along, z: w.z + w.dz * along}
}

function distanceToRun(model, track, at) {
  const [a, b] = [track.fromMm, track.toMm], clamp = v => Math.min(b, Math.max(a, v))
  const nearest = track.axis === 'x' ? {x: clamp(at.x), z: track.atMm} : {x: track.atMm, z: clamp(at.z)}
  return Math.hypot(at.x - nearest.x, at.z - nearest.z, at.y - model.heightMm)
}

export const ROOM_ELECTRICAL_CHECKS = [
  ['placed', 'Every point has a place on a wall, the ceiling or in a cabinet'],
  ['openings', 'No point in a door, window, cabinet front or open side'],
  ['hidden', 'Nothing behind furniture or an open door leaf unless it is hidden on purpose; sockets within reach'],
  ['doors', 'A switchboard on the latch side of every door, at switch height'],
  ['charging', 'A charging point within 1.5 m of every bed side, desk and seat'],
  ['ac', 'A dedicated point beside every AC unit'],
  ['feeds', 'A feed for every track-light driver and every ceiling fan'],
  ['switches', 'Every lighting circuit has a switch'],
  ['circuits', 'Every point is on one circuit and no circuit is loaded past 80% of its breaker'],
]

/**
 * The generic check: {ok, issues: [text], results: [{id, label, ok, issues, note}], points (resolved), reach, load}.
 * `results` has one row per rule of ROOM_ELECTRICAL_CHECKS; `note` says how much the rule had to look at in this room.
 */
export function checkRoomElectrical(model, plan) {
  const found = Object.fromEntries(ROOM_ELECTRICAL_CHECKS.map(([id]) => [id, []]))
  const need = (group, ok, message) => { if (!ok) found[group].push(message) }
  const points = resolveRoomPoints(model, plan), byId = new Map(), label = p => `${p.id} (${p.name})`
  const at0 = p => roomPointPosition(model, p)

  for (const p of points) {
    need('placed', !byId.has(p.id), `${p.id} is listed twice`); byId.set(p.id, p)
    need('placed', !p.unresolved, `${label(p)} has no place: ${p.unresolved} not found`)
    if (p.unresolved || p.wall === 'cabinet') continue
    if (p.wall === 'ceiling') { need('placed', p.xMm > 0 && p.xMm < model.widthMm && p.zMm > 0 && p.zMm < model.lengthMm, `${label(p)} is off the ceiling of the room`); continue }
    if (p.wall === 'free') { need('placed', p.xMm != null && p.zMm != null && p.heightMm != null, `${label(p)} needs xMm, zMm and heightMm`); continue }
    const w = model.walls[p.wall]
    need('placed', Boolean(w), `${label(p)} names an unknown wall (${p.wall})`)
    if (!w) continue
    const along = p.alongMm, h = p.heightMm
    need('placed', along > 0 && along < w.lengthMm && h > 0 && h < model.heightMm, `${label(p)} is off the ${w.label}`)
    for (const o of model.openings ?? []) if (o.wall === p.wall && along > o.a - OPENING_MARGIN_MM && along < o.b + OPENING_MARGIN_MM && h > o.bottom - OPENING_MARGIN_MM && h < o.top + OPENING_MARGIN_MM) found.openings.push(`${label(p)} is in the ${o.name}`)
    if (!p.hidden) {
      for (const b of model.blockers ?? []) if (b.wall === p.wall && along > b.a - BLOCKER_MARGIN_MM && along < b.b + BLOCKER_MARGIN_MM && h > b.bottom - BLOCKER_MARGIN_MM && h < b.top + BLOCKER_MARGIN_MM) found.hidden.push(`${label(p)} is hidden behind the ${b.name}`)
      if (p.kind === 'power' || p.kind === 'charging') need('hidden', h >= SOCKET_REACH_MM[0] && h <= SOCKET_REACH_MM[1], `${label(p)} at ${h} mm is outside the ${SOCKET_REACH_MM[0]}-${SOCKET_REACH_MM[1]} mm reach for a socket`)
    }
    if (p.switchboard) need('doors', h >= SWITCH_HEIGHT_MM[0] && h <= SWITCH_HEIGHT_MM[1], `${label(p)} at ${h} mm is outside the ${SWITCH_HEIGHT_MM[0]}-${SWITCH_HEIGHT_MM[1]} mm switch height`)
  }

  // A switchboard on the latch side of each door.
  const doors = model.doors ?? []
  for (const p of points) if (p.forDoor) need('doors', doors.some(d => d.id === p.forDoor), `${label(p)} serves an unknown door (${p.forDoor})`)
  for (const d of doors) {
    const boards = points.filter(p => p.switchboard && p.forDoor === d.id && !p.unresolved)
    need('doors', boards.length > 0, `no switchboard for the ${d.name}`)
    const latch = latchPoint(model, d)
    for (const p of boards) {
      const at = at0(p), gap = Math.round(Math.hypot(at.x - latch.x, at.z - latch.z)), max = d.boardRadiusMm ?? BOARD_TO_LATCH_MAX_MM
      need('doors', gap <= max, `${label(p)} is ${gap} mm from the latch side of the ${d.name} (at most ${max})`)
      if (p.wall === d.wall && !d.latchAt) need('doors', d.latch === 'to' ? p.alongMm > d.fromMm + d.widthMm : p.alongMm < d.fromMm, `${label(p)} is on the hinge side of the ${d.name}, or in it`)
    }
  }

  // Charging within reach of every bed side, desk and seat (optional points do not count).
  const chargers = points.filter(p => p.kind === 'charging' && !p.optional && !p.unresolved).map(p => ({p, at: at0(p)})).filter(c => c.at)
  const reach = (model.chargeSpots ?? []).map(spot => {
    const nearest = chargers.map(c => ({id: c.p.id, mm: Math.round(Math.hypot(c.at.x - spot.x, c.at.z - spot.z))})).sort((a, b) => a.mm - b.mm)[0]
    return {spot: spot.name, nearestMm: nearest?.mm ?? Infinity, point: nearest?.id ?? null}
  })
  for (const r of reach) need('charging', r.nearestMm <= CHARGE_REACH_MM, `no charging point within ${CHARGE_REACH_MM / 1000} m of the ${r.spot} (nearest ${r.nearestMm} mm)`)

  // A dedicated point beside every AC, on its wall, not behind the unit.
  for (const p of points) if (p.forAc) need('ac', (model.acs ?? []).some(a => a.id === p.forAc), `${label(p)} serves an unknown AC (${p.forAc})`)
  for (const ac of model.acs ?? []) {
    const mine = points.filter(p => p.kind === 'dedicated' && p.forAc === ac.id && !p.unresolved)
    need('ac', mine.length === 1, `${mine.length ? 'more than one' : 'no'} dedicated point for the ${ac.name}`)
    for (const p of mine) {
      need('ac', p.wall === ac.wall, `${label(p)} is not on the wall of the ${ac.name}`)
      if (p.wall !== ac.wall) continue
      const edge = Math.round(Math.max(ac.a - p.alongMm, p.alongMm - ac.b, 0)), behind = p.alongMm > ac.a && p.alongMm < ac.b && p.heightMm > ac.bottom - 100 && p.heightMm < ac.top + 100
      need('ac', !behind, `${label(p)} is hidden behind the ${ac.name}`)
      need('ac', edge <= AC_POINT_MAX_MM, `${label(p)} is ${edge} mm from the ${ac.name} (at most ${AC_POINT_MAX_MM})`)
    }
  }

  // One feed per track driver and per ceiling fan.
  for (const t of model.tracks ?? []) {
    const mine = points.filter(p => p.driverFor === t.id && !p.unresolved)
    need('feeds', mine.length === 1, `${mine.length ? 'more than one' : 'no'} driver feed for track run ${t.id}`)
    for (const p of mine) { const gap = Math.round(distanceToRun(model, t, at0(p))); need('feeds', gap <= DRIVER_TO_RUN_MAX_MM, `${label(p)} is ${gap} mm from track run ${t.id} (at most ${DRIVER_TO_RUN_MAX_MM})`) }
  }
  for (const p of points) if (p.driverFor) need('feeds', (model.tracks ?? []).some(t => t.id === p.driverFor), `${label(p)} feeds an unknown track run (${p.driverFor})`)
  ;(model.fans ?? []).forEach((fan, i) => {
    const mine = points.filter(p => p.fan === i + 1 && !p.unresolved)
    need('feeds', mine.length === 1, `${mine.length ? 'more than one' : 'no'} point for the ${fan.name}`)
    for (const p of mine) { const at = at0(p), gap = Math.round(Math.hypot(at.x - fan.x, at.z - fan.z)); need('feeds', p.wall === 'ceiling' && gap <= FAN_POINT_MAX_MM, `${label(p)} is ${gap} mm from the ${fan.name}`) }
  })

  // Every lighting circuit is switched somewhere, and no switch names a circuit the room does not have.
  const circuits = model.lightingCircuits ?? [], switched = new Set(points.filter(p => p.switchboard).flatMap(p => p.switches ?? []))
  for (const c of circuits) need('switches', switched.has(c.id), `no switch for ${c.label} (${c.id})`)
  for (const id of switched) need('switches', circuits.some(c => c.id === id), `a switchboard switches "${id}", which is not a lighting circuit of this room`)
  for (const p of points) if (p.light) need('switches', circuits.some(c => c.id === p.light), `${label(p)} is on an unknown lighting circuit (${p.light})`)

  // Circuits: every loaded point on exactly one, dedicated points alone, and the 80% rule.
  const load = estimateRoomLoad(model, plan, points), on = new Map()
  for (const c of plan.circuits ?? []) for (const id of c.points) {
    need('circuits', byId.has(id), `circuit ${c.id} lists ${id}, which is not a point`)
    need('circuits', !on.has(id), `${id} is on two circuits (${on.get(id)} and ${c.id})`); on.set(id, c.id)
  }
  for (const p of points) if (p.loadW > 0) need('circuits', on.has(p.id), `${label(p)} is on no circuit`)
  for (const c of load.circuits) {
    need('circuits', c.watts <= c.limitW, `circuit ${c.id} (${c.name}) carries ${c.watts} W, more than ${Math.round(CIRCUIT_LOADING_MAX * 100)}% of its ${c.mcbA} A breaker (${c.limitW} W)`)
    const dedicated = c.points.map(id => byId.get(id)).filter(p => p?.kind === 'dedicated')
    need('circuits', !dedicated.length || c.points.length === 1, `circuit ${c.id} puts the dedicated point ${dedicated[0]?.id} together with other points`)
  }

  const count = {placed: points.length, openings: (model.openings ?? []).length, hidden: (model.blockers ?? []).length, doors: doors.length, charging: reach.length,
    ac: (model.acs ?? []).length, feeds: (model.tracks ?? []).length + (model.fans ?? []).length, switches: circuits.length, circuits: (plan.circuits ?? []).length}
  const unit = {placed: ['point', 'points'], openings: ['opening', 'openings'], hidden: ['piece of furniture or door leaf', 'pieces of furniture and door leaves'], doors: ['door', 'doors'],
    charging: ['bed side, desk or seat', 'bed sides, desks and seats'], ac: ['AC unit', 'AC units'], feeds: ['track run or fan', 'track runs and fans'], switches: ['lighting circuit', 'lighting circuits'], circuits: ['circuit', 'circuits']}
  const results = ROOM_ELECTRICAL_CHECKS.map(([id, text]) => ({id, label: text, ok: found[id].length === 0, issues: found[id], note: count[id] ? `${count[id]} ${unit[id][count[id] === 1 ? 0 : 1]}` : `none in this room's model`}))
  const issues = results.flatMap(r => r.issues), byKind = {}
  for (const p of points) byKind[p.kind] = (byKind[p.kind] ?? 0) + 1
  return {ok: issues.length === 0, issues, results, points, reach, byKind, load}
}

/**
 * Connected load: {circuits: [{id, name, mcbA, rcd, points, watts, limitW}], totalW}. An ESTIMATE from the per-point
 * figures of ELECTRICAL_LOAD_W, for a first conversation with the electrician; it sizes nothing.
 */
export function estimateRoomLoad(model, plan, points = resolveRoomPoints(model, plan)) {
  const byId = new Map(points.map(p => [p.id, p]))
  const circuits = (plan.circuits ?? []).map(c => ({...c, watts: c.points.reduce((sum, id) => sum + (byId.get(id)?.loadW ?? 0), 0), limitW: Math.round(c.mcbA * SUPPLY_VOLTS * CIRCUIT_LOADING_MAX)}))
  return {circuits, totalW: points.reduce((sum, p) => sum + p.loadW, 0)}
}
