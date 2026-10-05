// Existing electrical points (phone scan 2026-10-04) against the planned design: positions for drawing and plain-language
// conflict checks. Pure: no React, Three.js or DOM. Millimetres, room frame: x from the west wall, z from the north wall,
// y up. Points: EXISTING_ELECTRICAL in config/existingElectricalConfig.js.
import {EXISTING_ELECTRICAL} from '../config/existingElectricalConfig.js'
import {southTvGeometry, consoleGeometry, WALL_FACE_MM} from './drawingRoomLayout.mjs'

const SOFA_BACK_MM = 950 // a point lower than this, behind a sofa standing against the wall, cannot be reached
const NEAR_WALL_MM = 250 // a sofa within this of a wall line counts as standing against it
const LEAF_NEAR_WALL_MM = 300 // an inward-opening door hinged this close to a side wall lays its open leaf along that wall
const ALONG_X = new Set(['north', 'south'])

/**
 * The ONE place where a measured figure is turned into the room frame: the room entry's `measured.xOffsetMm` (how far the
 * scan's "from the west" origin is west of the room's x = 0) is subtracted from every x-type figure. z has no offset.
 * The measured figures stay on the point as measuredFromMm/measuredToMm (walls) or measuredXmm (ceiling).
 */
export function toRoomFrame(entry, p) {
  const dx = entry.measured?.xOffsetMm ?? 0
  if (p.wall === 'ceiling') return {...p, xMm: p.xMm - dx, measuredXmm: p.xMm}
  if (ALONG_X.has(p.wall)) return {...p, fromMm: p.fromMm - dx, toMm: p.toMm - dx, measuredFromMm: p.fromMm, measuredToMm: p.toMm}
  return {...p, measuredFromMm: p.fromMm, measuredToMm: p.toMm}
}

export function hasExistingElectrical(roomKey, config = EXISTING_ELECTRICAL) {
  return Boolean(config[roomKey]?.points?.length)
}

/** The room's existing points in the room frame (empty for a room without a scan). */
export function existingPointsFor(roomKey, config = EXISTING_ELECTRICAL) {
  const entry = config[roomKey]
  return entry ? entry.points.map(p => toRoomFrame(entry, p)) : []
}

/**
 * Where to draw a point (room frame, mm, already converted): the plate centre, its face size and which axis is its depth.
 * `wallFaceMm` is the drawn inside face of the walls. Ceiling points lie flat on the ceiling.
 */
export function existingPointPlacement(room, p, {wallFaceMm = WALL_FACE_MM} = {}) {
  if (p.wall === 'ceiling') return {x: p.xMm, y: room.heightMm, z: p.zMm, widthMm: p.diameterMm, heightMm: p.diameterMm, depthAxis: 'y'}
  const along = (p.fromMm + p.toMm) / 2, y = (p.bottomMm + p.topMm) / 2, widthMm = p.toMm - p.fromMm, heightMm = p.topMm - p.bottomMm
  switch (p.wall) {
    case 'north': return {x: along, y, z: wallFaceMm, widthMm, heightMm, depthAxis: 'z'}
    case 'south': return {x: along, y, z: room.lengthMm - wallFaceMm, widthMm, heightMm, depthAxis: 'z'}
    case 'west': return {x: wallFaceMm, y, z: along, widthMm, heightMm, depthAxis: 'x'}
    case 'east': return {x: room.widthMm - wallFaceMm, y, z: along, widthMm, heightMm, depthAxis: 'x'}
    default: throw new Error(`Unknown existing electrical point wall: ${p.wall}`)
  }
}

// ---- What the plan puts on the walls ----

const axisName = wall => (ALONG_X.has(wall) ? 'x' : 'z')
const r = v => Math.round(v)
const span = (wall, a, b) => `${axisName(wall)} ${r(a)}-${r(b)}`
const rect = (cx, cz, sizeX, sizeZ) => ({x1: cx - sizeX / 2, x2: cx + sizeX / 2, z1: cz - sizeZ / 2, z2: cz + sizeZ / 2})
const sofaRect = (s, along) => (along === 'x' ? rect(s.centerXmm, s.centerZmm, s.lengthMm, s.widthMm) : rect(s.centerXmm, s.centerZmm, s.widthMm, s.lengthMm))

/** Openings the plan cuts in the walls: [{name, wall, a, b, bottom, top}], a-b along the wall. */
export function plannedOpenings(room) {
  const rows = []
  for (const d of room.doors ?? []) rows.push({name: `${d.leadsTo ? `door to ${d.leadsTo}` : 'door'} on the ${d.wall} wall`, wall: d.wall, a: d.fromMm, b: d.fromMm + d.widthMm, bottom: 0, top: d.heightMm})
  for (const w of room.windows ?? []) rows.push({name: `window on the ${w.wall} wall`, wall: w.wall, a: w.fromMm, b: w.fromMm + w.widthMm, bottom: w.bottomMm, top: w.topMm})
  for (const [wall, o] of Object.entries(room.wallOpenings ?? {})) rows.push({name: `open side on the ${wall} wall`, wall, a: o.fromMm, b: o.toMm, bottom: 0, top: room.heightMm})
  const ws = room.wallStorage
  if (ws) rows.push({name: 'hidden west cabinet door on the north wall', wall: 'north', a: ws.fromWestMm, b: ws.fromWestMm + ws.widthMm, bottom: ws.bottomMm, top: ws.bottomMm + ws.heightMm})
  return rows
}

// Sofas standing against a wall hide anything on that wall below their back.
function sofaBlockers(room, sofas) {
  const rows = []
  for (const [name, q] of sofas) {
    if (q.x1 < NEAR_WALL_MM) rows.push({name, wall: 'west', a: q.z1, b: q.z2, bottom: 0, top: SOFA_BACK_MM})
    if (room.widthMm - q.x2 < NEAR_WALL_MM) rows.push({name, wall: 'east', a: q.z1, b: q.z2, bottom: 0, top: SOFA_BACK_MM})
    if (q.z1 < NEAR_WALL_MM) rows.push({name, wall: 'north', a: q.x1, b: q.x2, bottom: 0, top: SOFA_BACK_MM})
    if (room.lengthMm - q.z2 < NEAR_WALL_MM) rows.push({name, wall: 'south', a: q.x1, b: q.x2, bottom: 0, top: SOFA_BACK_MM})
  }
  return rows
}

/**
 * Planned things that stand on or against a wall and would cover a point: [{name, wall, a, b, bottom, top}]. The Drawing
 * Room depends on the layout (default C, 'southSofas'); other rooms list their wall-mounted furniture from config.
 */
export function plannedBlockers(roomKey, room, layoutKey = null) {
  const rows = []
  if (roomKey === 'drawing') {
    const layout = layoutKey ?? 'southSofas'
    const door = room.doors.find(d => d.wall === 'north')
    // The entry door opens into the room; hinged next to a side wall, its open leaf lies flat along that wall.
    if (door?.opensInto === room.name && door.hingeKnown) {
      const leaf = door.leafMm ?? door.widthMm
      if (door.hinge === 'east' && room.widthMm - (door.fromMm + door.widthMm) <= LEAF_NEAR_WALL_MM) rows.push({name: 'entry door leaf when the door stands open', wall: 'east', a: 0, b: leaf, bottom: 0, top: door.heightMm, leaf: true})
      if (door.hinge === 'west' && door.fromMm <= LEAF_NEAR_WALL_MM) rows.push({name: 'entry door leaf when the door stands open', wall: 'west', a: 0, b: leaf, bottom: 0, top: door.heightMm, leaf: true})
    }
    if (layout === 'southSofas') {
      const s = room.southLayout, f = s.furniture, ws = room.wallStorage
      rows.push(...sofaBlockers(room, [['south sofa', sofaRect(f.southSofa, 'x')], ['west sofa', sofaRect(f.westSofa, 'z')]]))
      const ct = f.cornerTable
      if (ct && ct.centerXmm - ct.diameterMm / 2 < NEAR_WALL_MM) rows.push({name: 'corner lamp table', wall: 'west', a: ct.centerZmm - ct.diameterMm / 2, b: ct.centerZmm + ct.diameterMm / 2, bottom: 0, top: ct.heightMm})
      const wp = s.wallPanel
      if (wp) rows.push({name: 'fluted wall panelling', wall: 'north', a: wp.fromWestMm, b: wp.toMm, bottom: wp.bottomMm, top: ws.bottomMm + ws.heightMm + (wp.cap?.heightMm ?? 0), panel: true})
      for (const key of Object.keys(s.tv.tvs)) { const g = southTvGeometry(room, key); rows.push({name: `${g.tv.diagonalInches}-inch TV`, wall: 'north', a: g.x1, b: g.x2, bottom: g.bottomMm, top: g.topMm}) }
      const g = southTvGeometry(room)
      rows.push({name: 'TV console', wall: 'north', a: g.console.x1, b: g.console.x2, bottom: g.console.bottomMm, top: g.console.topMm})
    } else if (layout === 'northTv') {
      const f = room.furniture, w = room.tvWall
      rows.push(...sofaBlockers(room, [['west sofa', sofaRect(f.sofa, 'z')], ['south sofa', sofaRect(f.southSofa, 'x')]]))
      rows.push({name: 'TV cabinet', wall: 'north', a: w.fromWestMm, b: w.fromWestMm + w.widthMm, bottom: 0, top: w.heightMm})
    } else {
      const c = room.cornerLayout, f = c.furniture, rc = c.routerCabinet
      rows.push(...sofaBlockers(room, [['north sofa', sofaRect(f.northSofa, 'x')], ['west sofa', sofaRect(f.westSofa, 'z')]]))
      rows.push({name: 'router cabinet', wall: 'north', a: rc.fromWestMm, b: rc.fromWestMm + rc.widthMm, bottom: rc.bottomMm, top: rc.bottomMm + rc.heightMm})
      if (layout === 'cornerSofas') rows.push({name: `${c.tv.diagonalInches}-inch TV`, wall: 'east', a: c.tv.centerFromNorthMm - c.tv.widthMm / 2, b: c.tv.centerFromNorthMm + c.tv.widthMm / 2, bottom: c.tv.bottomMm, top: c.tv.bottomMm + c.tv.heightMm})
      else { const g = consoleGeometry(room); rows.push({name: 'low console', wall: 'east', a: g.z1, b: g.z2, bottom: 0, top: g.topMm}) }
    }
  }
  if (roomKey === 'bedroom3') {
    // Planned furniture against the walls (roomShellConfig.js): the west chest and its artwork, the east cabinetry.
    const chest = room.furniture?.westChest, c = room.furniture?.eastCabinet
    if (chest) {
      rows.push({name: 'west chest', wall: 'west', a: chest.fromNorthMm, b: chest.fromNorthMm + chest.widthMm, bottom: 0, top: chest.heightMm})
      const art = chest.artwork, mid = chest.fromNorthMm + chest.widthMm / 2
      if (art) rows.push({name: 'artwork above the west chest', wall: 'west', a: mid - art.widthMm / 2, b: mid + art.widthMm / 2, bottom: art.bottomMm, top: art.bottomMm + art.heightMm})
    }
    if (c) {
      rows.push({name: 'north-east dressing cabinet', wall: 'east', a: c.north.fromNorthMm, b: c.north.fromNorthMm + c.north.widthMm, bottom: 0, top: c.north.heightMm})
      rows.push({name: 'south-east bedside cabinet', wall: 'east', a: c.south.fromNorthMm, b: c.south.fromNorthMm + c.south.widthMm, bottom: 0, top: c.south.heightMm})
      rows.push({name: 'overhead cabinet run', wall: 'east', a: c.bridge.fromNorthMm, b: c.bridge.fromNorthMm + c.bridge.widthMm, bottom: c.bridge.bottomMm, top: c.bridge.bottomMm + c.bridge.heightMm})
    }
  }
  if (roomKey === 'lobby') {
    const s = room.furniture?.eastIroningStorage
    if (s) rows.push({name: 'ironing storage unit', wall: 'east', a: s.fromNorthMm, b: s.fromNorthMm + s.lengthMm, bottom: 0, top: s.heightMm})
  }
  return rows
}

// ---- Checks ----

const overlap = (p, q) => Math.min(p.toMm, q.b) - Math.max(p.fromMm, q.a) > 0 && Math.min(p.topMm, q.top) - Math.max(p.bottomMm, q.bottom) > 0
const coverage = (p, q) => (Math.min(p.toMm, q.b) - Math.max(p.fromMm, q.a)) / (p.toMm - p.fromMm)

/** "Switchboard X-D1 (north wall, x 1710-1905, 1235-1495 mm high)" */
export function describeExistingPoint(p) {
  if (p.wall === 'ceiling') return `${p.name} ${p.id} (ceiling, x ${r(p.xMm)}, z ${r(p.zMm)}, about ${r(p.diameterMm)} across)`
  return `${p.name} ${p.id} (${p.wall} wall, ${span(p.wall, p.fromMm, p.toMm)}, ${r(p.bottomMm)}-${r(p.topMm)} mm high)`
}

const list = names => names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`

const sentence = text => { const t = String(text).trim(); return t.charAt(0).toUpperCase() + t.slice(1) + (/[.!?]$/.test(t) ? '' : '.') }

/**
 * What the proposed plan does with an existing point (its `disposition` in existingElectricalConfig.js), as one line:
 * "Relocate to E1. ...", "Blank off. ...", "Keep. ...". Empty when the point has no disposition yet.
 */
export function describeDisposition(p) {
  const d = p.disposition
  if (!d) return ''
  const head = d.action === 'relocate' ? `Relocate to ${d.to}.` : d.action === 'blank' ? `Blank off${d.to ? `; the box is reused by ${d.to}` : ''}.` : `Keep${d.to ? ` (planned point ${d.to})` : ''}.`
  return [head, d.note ? sentence(d.note) : '', d.feeds?.length ? `Feeds ${list(d.feeds)}.` : '', d.oldBox ? `Old box: ${sentence(d.oldBox)}` : ''].filter(Boolean).join(' ')
}

/** Does the point's disposition deal with a clash? Moving it or blanking it does; keeping it does only if marked `accept`. */
export function dispositionResolves(p) {
  const d = p.disposition
  return Boolean(d && (d.action === 'relocate' || d.action === 'blank' || (d.action === 'keep' && d.accept)))
}

/**
 * Existing points against the planned design: {points, conflicts: [{id, name, kind, finding, message, resolved, resolution}],
 * open, ok}. kind is 'opening' (the point is inside a planned door, window or open side) or 'hidden' (planned panelling,
 * furniture or the open entry door leaf covers it). `finding` is the clash itself; `message` adds the general advice (one
 * sentence the owner can act on). A clash whose point has a disposition that deals with it is `resolved` and carries the
 * `resolution` line; `open` lists the clashes still without one, and `ok` means there is none of those.
 */
export function checkExistingElectrical(roomKey, room, {layoutKey = null, config = EXISTING_ELECTRICAL} = {}) {
  const points = existingPointsFor(roomKey, config), conflicts = []
  const openings = plannedOpenings(room), blockers = plannedBlockers(roomKey, room, layoutKey)
  for (const p of points) {
    if (p.wall === 'ceiling') continue
    const label = describeExistingPoint(p)
    const inOpenings = openings.filter(o => o.wall === p.wall && overlap(p, o))
    const add = (kind, finding, advice) => {
      const resolved = dispositionResolves(p)
      conflicts.push({id: p.id, name: p.name, kind, finding, message: `${finding}: ${advice}.`, resolved, resolution: resolved ? describeDisposition(p) : ''})
    }
    if (inOpenings.length) add('opening', `${label} is inside the planned ${list(inOpenings.map(o => `${o.name} (${span(o.wall, o.a, o.b)})`))}`, 'it has to be moved before that opening is made, or the opening must shift')
    const covered = blockers.filter(b => b.wall === p.wall && overlap(p, b))
    const leaf = covered.filter(b => b.leaf), fixed = covered.filter(b => !b.leaf)
    if (fixed.length) {
      const partly = fixed.every(b => coverage(p, b) < .999)
      const what = list(fixed.map(b => `${b.name} (${span(b.wall, b.a, b.b)}, ${r(b.bottom)}-${r(b.top)} mm high)`))
      const sofa = fixed.some(b => /sofa/.test(b.name)), panel = fixed.some(b => b.panel)
      const advice = panel ? 'move it (the proposed plan puts the main switchboard E1 on the east wall), or cut the panelling and the TV bracket around it and keep it reachable'
        : sofa ? 'anything plugged in there cannot be reached without moving the sofa; move the point, or accept it for a lamp or a permanently plugged device'
        : 'move the point, or cut the piece around it and keep it reachable'
      add('hidden', `${label} would be ${partly ? 'partly ' : ''}covered by the planned ${what}`, advice)
    }
    if (leaf.length) {
      const b = leaf[0], partly = coverage(p, b) < .999
      const advice = p.kind === 'chime' ? 'a chime only has to be heard, so this is harmless'
        : p.kind === 'distribution board' ? 'it can be reached only with the door closed, which is acceptable for MCBs that are rarely touched; keep a clear way to it'
        : p.kind === 'switchboard' ? 'a switch must be reachable as you come in, so move it clear of the leaf'
        : 'it can be used only with the door closed; move it if it is needed daily'
      add('hidden', `${label} is ${partly ? 'partly ' : ''}behind the ${b.name} (the leaf covers the first ${r(b.b)} mm of the ${b.wall} wall)`, advice)
    }
  }
  const open = conflicts.filter(c => !c.resolved)
  return {points, conflicts, open, ok: open.length === 0}
}

/**
 * Lines for the review brief: what exists, where it was measured from, what the plan does with each point, and every clash
 * (RESOLVED with its resolution, or CONFLICT while it is open). Empty for a room without a scan.
 */
export function describeExistingElectrical(roomKey, room, {layoutKey = null, config = EXISTING_ELECTRICAL} = {}) {
  if (!hasExistingElectrical(roomKey, config)) return []
  const entry = config[roomKey], {points, conflicts} = checkExistingElectrical(roomKey, room, {layoutKey, config})
  const source = points[0]?.source ?? 'site scan'
  const lines = [`What is on the walls and ceiling TODAY, from the ${source} (small items about +/- 20 mm). These are records, not the proposed plan.`]
  if (entry.measured?.xOffsetMm) lines.push(`The scan measured x ${entry.measured.x}; ${entry.measured.xOffsetMm} mm has been subtracted so the figures below are from this room's west wall.`)
  for (const p of points) lines.push(`${describeExistingPoint(p)}${p.note ? `; ${p.note}` : ''}${p.assumed ? ` [assumed: ${p.assumed}]` : ''}.${p.disposition ? ` Plan: ${describeDisposition(p)}` : ''}`)
  if (conflicts.length) for (const c of conflicts) lines.push(c.resolved ? `RESOLVED: ${c.finding}. ${c.resolution}` : `CONFLICT: ${c.message}`)
  else lines.push('No planned door, window, panel or piece of furniture lands on an existing point in this layout.')
  return lines
}
