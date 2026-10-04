// Pure checks for the Bedroom 1 layouts (millimetres, no React/Three/DOM).
// Room frame (roomShellConfig.js bedroom1): x east from the west wall, z south from the north wall, y up; the balcony
// continues the frame east of the room (x > widthMm). Angles below are measured from +x (east) toward +z (south).
// Nothing in this room is measured on site: the checks test the MODEL (A501 plan sizes and the assumptions recorded in
// config/bedroom1LayoutConfig.js), not the flat.
import {BEDROOM1_DESIGN} from '../config/bedroom1LayoutConfig.js'
import {BEDROOM1_CLOSED_DOOR, closedDoorSpanMm} from '../config/bedroom1ClosedDoor.js'
import {HOME_ROOM_LAYOUTS} from '../config/homeRoomViews.js'

const square = (item) => ({x1: item.centerXmm - item.diameterMm / 2, x2: item.centerXmm + item.diameterMm / 2, z1: item.centerZmm - item.diameterMm / 2, z2: item.centerZmm + item.diameterMm / 2})
const overlaps = (a, b) => a.x1 < b.x2 && b.x1 < a.x2 && a.z1 < b.z2 && b.z1 < a.z2
const distanceTo = (x, z, r) => Math.hypot(Math.max(r.x1 - x, 0, x - r.x2), Math.max(r.z1 - z, 0, z - r.z2))
const round = v => Math.round(v)

/** The closed old door (medicine cabinet) along the south wall, in Bedroom 1 millimetres from the west wall. */
export function bedroom1CabinetSpan(room) {
  const whole = HOME_ROOM_LAYOUTS.find(r => r.key === 'bedroom1').bounds, balcony = HOME_ROOM_LAYOUTS.find(r => r.key === 'bedroom1-balcony').bounds
  // The bedroom proper runs from the balcony's inner edge to the west wall (plan x 339-515); see WholeHome3D.jsx.
  return closedDoorSpanMm(BEDROOM1_CLOSED_DOOR, [balcony[2], whole[1], whole[2], whole[3]], room.widthMm)
}

/**
 * Everything the checks and the 3D drawing need for one layout, resolved to rectangles in the room frame.
 * `obstacles` are the things standing in the room; `balcony.obstacles` those in the balcony. topMm is the tallest point,
 * bottomMm (default 0) the underside of something hung off the floor; kind 'flat' is a rug.
 */
export function bedroom1Plan(room, layoutKey = BEDROOM1_DESIGN.defaultLayout, design = BEDROOM1_DESIGN) {
  const layout = design.layouts[layoutKey]
  if (!layout) throw new Error(`Unknown Bedroom 1 layout: ${layoutKey}`)
  const W = room.widthMm, L = room.lengthMm, f = room.furniture, p = design.bedProfile
  const b = layout.bed ?? {...f.bed, headWall: 'east'}
  const alongX = b.headWall === 'east'
  if (!alongX && b.headWall !== 'south') throw new Error(`Bed head wall ${b.headWall} is not supported`)
  const z2 = L - b.fromSouthMm, x1 = b.fromWestMm
  const bed = alongX
    ? {x1, x2: x1 + b.lengthMm, z1: z2 - b.widthMm, z2}
    : {x1, x2: x1 + b.widthMm, z1: z2 - b.lengthMm, z2}
  Object.assign(bed, {headWall: b.headWall, lengthMm: b.lengthMm, widthMm: b.widthMm, baseMm: p.baseMm, mattressMm: p.mattressMm,
    mattressTopMm: p.baseMm + p.mattressMm, pillowTopMm: p.pillowTopMm, headboardTopMm: p.headboardTopMm, headboardMm: p.headboardMm,
    head: alongX ? {x1: bed.x2 - p.headboardMm, x2: bed.x2, z1: bed.z1, z2: bed.z2} : {x1: bed.x1, x2: bed.x2, z1: bed.z2 - p.headboardMm, z2: bed.z2}})

  const wd = f.wardrobe
  const wardrobe = {x1: 0, x2: wd.depthMm, z1: wd.fromNorthMm, z2: wd.fromNorthMm + wd.lengthMm, heightMm: wd.heightMm, doorCount: wd.doorCount, leafMm: wd.lengthMm / wd.doorCount}
  const rw = f.northEastRecessWardrobe
  const recessWardrobe = {x1: W - rw.fromEastMm - rw.widthMm, x2: W - rw.fromEastMm, z1: -rw.depthMm, z2: 0, heightMm: rw.heightMm, doorCount: rw.doorCount, leafMm: rw.widthMm / rw.doorCount}

  const doors = room.doors.map(d => ({leadsTo: d.leadsTo, wall: d.wall, x1: d.fromMm, x2: d.fromMm + d.widthMm, heightMm: d.heightMm, leafMm: d.widthMm,
    opensIntoRoom: design.doorSwings[d.leadsTo]?.opensInto === room.name, ...design.doorSwings[d.leadsTo]}))

  const span = bedroom1CabinetSpan(room), c = BEDROOM1_CLOSED_DOOR.cabinet
  const medicineCabinet = {x1: span.start, x2: span.end, heightMm: BEDROOM1_CLOSED_DOOR.heightMm, doorCount: c.doorCount,
    leafMm: (span.end - span.start - (c.doorCount + 1) * c.doorGapMm) / c.doorCount, doorBottomMm: layout.medicineCabinet?.doorBottomMm ?? 0}

  const obstacles = [
    {name: 'bed', ...bed, topMm: p.pillowTopMm, kind: 'fixed'},
    {name: 'bed headboard', ...bed.head, topMm: p.headboardTopMm, kind: 'fixed'},
    {name: 'west wardrobe', x1: wardrobe.x1, x2: wardrobe.x2, z1: wardrobe.z1, z2: wardrobe.z2, topMm: wardrobe.heightMm, kind: 'fixed'},
  ]
  let dressingTable = null, bedsideTable = null
  if (layout.dressingTable) {
    const t = layout.dressingTable, s = t.stool, cx = t.fromWestMm + t.widthMm / 2
    dressingTable = {x1: t.fromWestMm, x2: t.fromWestMm + t.widthMm, z1: 0, z2: t.depthMm, heightMm: t.heightMm, mirror: t.mirror,
      // The stool stands half under the table; `seat` is the floor a seated person takes up.
      stool: {x1: cx - s.widthMm / 2, x2: cx + s.widthMm / 2, z1: t.depthMm - s.depthMm / 2, z2: t.depthMm + s.depthMm / 2, heightMm: s.heightMm},
      seat: {x1: cx - s.widthMm / 2, x2: cx + s.widthMm / 2, z1: t.depthMm, z2: t.depthMm + design.clearances.seatMm}}
    obstacles.push({name: 'dressing table', x1: dressingTable.x1, x2: dressingTable.x2, z1: 0, z2: t.depthMm, topMm: t.heightMm, kind: 'fixed'})
    obstacles.push({name: 'dressing stool', ...dressingTable.stool, topMm: s.heightMm, kind: 'loose'})
  }
  if (layout.bedsideTable) {
    const t = layout.bedsideTable
    if (alongX || t.side !== 'east') throw new Error('bedside table: only the east side of a south-headed bed is supported')
    bedsideTable = {x1: bed.x2 + t.gapMm, x2: bed.x2 + t.gapMm + t.widthMm, z1: L - t.depthMm, z2: L, heightMm: t.heightMm}
    obstacles.push({name: 'bedside table', ...bedsideTable, topMm: t.heightMm, kind: 'bedside'})
  }
  const loose = {}
  for (const [name, item] of Object.entries(layout.loose ?? {})) {
    if (name === 'rug') { loose.rug = {x1: item.centerXmm - item.widthMm / 2, x2: item.centerXmm + item.widthMm / 2, z1: item.centerZmm - item.lengthMm / 2, z2: item.centerZmm + item.lengthMm / 2}; obstacles.push({name: 'rug', ...loose.rug, topMm: 25, kind: 'flat'}) }
    else { loose[name] = {...square(item), heightMm: item.heightMm, centerXmm: item.centerXmm, centerZmm: item.centerZmm}; obstacles.push({name: name === 'hamper' ? 'laundry hamper' : name, ...square(item), topMm: item.heightMm, kind: 'loose'}) }
  }

  const be = room.balconyExtension, pw = be.poojaWallWardrobe, ac = be.windowAc, bf = be.furniture
  const frontZ = be.lengthMm - (pw.northShiftMm || 0)
  const balcony = {
    x1: W, x2: W + be.depthMm, z1: 0, z2: be.lengthMm,
    opening: {z1: room.wallOpenings.east.fromMm, z2: room.wallOpenings.east.toMm},
    wardrobe: {x1: W, x2: W + pw.widthMm, z1: frontZ, z2: frontZ + pw.depthMm, frontZ, heightMm: pw.heightMm, doorCount: pw.doorCount, leafMm: pw.widthMm / pw.doorCount,
      doors: pw.doors ?? 'hinged', intoWallMm: frontZ + pw.depthMm - be.lengthMm},
    table: {x1: W + bf.table.centerFromBedroomWallMm - bf.table.depthMm / 2, x2: W + bf.table.centerFromBedroomWallMm + bf.table.depthMm / 2, z1: bf.table.centerFromNorthMm - bf.table.widthMm / 2, z2: bf.table.centerFromNorthMm + bf.table.widthMm / 2, heightMm: bf.table.heightMm},
    chair: {x1: W + bf.chair.centerFromBedroomWallMm - bf.chair.depthMm / 2, x2: W + bf.chair.centerFromBedroomWallMm + bf.chair.depthMm / 2, z1: bf.chair.centerFromNorthMm - bf.chair.widthMm / 2, z2: bf.chair.centerFromNorthMm + bf.chair.widthMm / 2, heightMm: bf.chair.backHeightMm, seatHeightMm: bf.chair.seatHeightMm},
    // The part of the window AC inside the balcony: frontX is its room-side face.
    ac: ac ? {frontX: W + be.depthMm - ac.insideMm, x1: W + be.depthMm - ac.insideMm, x2: W + be.depthMm, z1: ac.centerFromNorthMm - ac.widthMm / 2, z2: ac.centerFromNorthMm + ac.widthMm / 2, bottomMm: ac.bottomMm, topMm: ac.bottomMm + ac.heightMm} : null,
  }
  balcony.obstacles = [
    {name: 'balcony wardrobe', x1: balcony.wardrobe.x1, x2: balcony.wardrobe.x2, z1: balcony.wardrobe.z1, z2: balcony.wardrobe.z2, topMm: pw.heightMm, kind: 'fixed'},
    {name: 'balcony table', ...balcony.table, topMm: bf.table.heightMm, kind: 'loose'},
    {name: 'balcony chair', ...balcony.chair, topMm: bf.chair.backHeightMm, kind: 'loose'},
    ...(balcony.ac ? [{name: 'window AC', x1: balcony.ac.x1, x2: balcony.ac.x2, z1: balcony.ac.z1, z2: balcony.ac.z2, bottomMm: balcony.ac.bottomMm, topMm: balcony.ac.topMm, kind: 'fixed'}] : []),
  ]
  return {key: layoutKey, label: layout.label, widthMm: W, lengthMm: L, bed, wardrobe, recessWardrobe, doors, medicineCabinet, dressingTable, bedsideTable, loose, obstacles, balcony}
}

/**
 * How far a hinged leaf opens before it meets something. The leaf turns about `hinge` from angle `fromDeg` (closed) to
 * `toDeg` (open, 90 degrees on); it is `leafMm` long and spans heights bottomMm-topMm. Returns the angle reached (90 = fully
 * open) and what stopped it. Touching an edge does not count as a hit.
 */
export function leafSweep({hinge, fromDeg, toDeg, leafMm, bottomMm = 0, topMm = Infinity}, obstacles) {
  const candidates = obstacles.filter(o => o.kind !== 'flat' && o.topMm > bottomMm && (o.bottomMm ?? 0) < topMm)
  const steps = 180, sign = Math.sign(toDeg - fromDeg)
  for (let i = 1; i <= steps; i++) {
    const deg = fromDeg + sign * i * 90 / steps, rad = deg * Math.PI / 180, cos = Math.cos(rad), sin = Math.sin(rad)
    for (let r = 20; r <= leafMm; r += 10) {
      const x = hinge.x + r * cos, z = hinge.z + r * sin
      const hit = candidates.find(o => x > o.x1 + .5 && x < o.x2 - .5 && z > o.z1 + .5 && z < o.z2 - .5)
      if (hit) return {openDeg: Math.floor((i - 1) * 90 / steps), blockedBy: hit.name}
    }
  }
  return {openDeg: 90, blockedBy: null}
}

/** Both leaves of a pair of doors in a wall at z = wallZ that open toward `into` ('north' or 'south'). */
function pairSweeps(x1, x2, wallZ, into, leafMm, bottomMm, topMm, obstacles) {
  const open = into === 'north' ? -90 : 90
  return {
    west: leafSweep({hinge: {x: x1, z: wallZ}, fromDeg: 0, toDeg: open, leafMm, bottomMm, topMm}, obstacles),
    east: leafSweep({hinge: {x: x2, z: wallZ}, fromDeg: 180, toDeg: 180 - open, leafMm, bottomMm, topMm}, obstacles),
  }
}

const GRID_MM = 50

/** Can a body `widthMm` wide get from the `from` rectangle to the `to` rectangle without squeezing past anything? */
export function routeExists(plan, from, to, widthMm, stepOverMm) {
  const half = widthMm / 2, blocks = plan.obstacles.filter(o => o.kind !== 'flat' && o.topMm > stepOverMm)
  const nx = Math.floor(plan.widthMm / GRID_MM) + 1, nz = Math.floor(plan.lengthMm / GRID_MM) + 1
  const free = (i, j) => {
    const x = i * GRID_MM, z = j * GRID_MM
    return x >= half && x <= plan.widthMm - half && z >= half && z <= plan.lengthMm - half && blocks.every(o => distanceTo(x, z, o) >= half)
  }
  const inside = (i, j, r) => i * GRID_MM >= r.x1 && i * GRID_MM <= r.x2 && j * GRID_MM >= r.z1 && j * GRID_MM <= r.z2
  const seen = new Set(), queue = []
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) if (inside(i, j, from) && free(i, j)) { seen.add(i * 1000 + j); queue.push([i, j]) }
  while (queue.length) {
    const [i, j] = queue.shift()
    if (inside(i, j, to)) return true
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const a = i + di, b = j + dj, key = a * 1000 + b
      if (a < 0 || b < 0 || a >= nx || b >= nz || seen.has(key) || !free(a, b)) continue
      seen.add(key); queue.push([a, b])
    }
  }
  return false
}

/** Distance from `target` to the nearest spot where a person can stand (a personMm square clear of everything). */
function nearestStandingSpot(plan, target, personMm, stepOverMm) {
  const half = personMm / 2, blocks = plan.obstacles.filter(o => o.kind !== 'flat' && o.topMm > stepOverMm)
  let best = Infinity
  for (let x = half; x <= plan.widthMm - half; x += GRID_MM) for (let z = half; z <= plan.lengthMm - half; z += GRID_MM) {
    const d = Math.hypot(x - target.x, z - target.z)
    if (d < best && blocks.every(o => distanceTo(x, z, o) >= half)) best = d
  }
  return best
}

/** Clear floor beside the bed's two long sides and beyond its foot (to the nearest wall or piece of furniture). */
function bedClearances(plan, bedsideAllowanceMm = 600) {
  const {bed, widthMm: W, lengthMm: L} = plan
  const others = plan.obstacles.filter(o => !o.name.startsWith('bed') && o.kind !== 'flat' && o.kind !== 'bedside')
  // Gap from one edge of `range` (a rectangle swept outward from the bed) to the nearest thing in that direction.
  const gapTo = (direction, edge, lo, hi, wallGap) => {
    let gap = wallGap
    for (const o of others) {
      if (direction === 'north' || direction === 'south') { if (o.x2 <= lo || o.x1 >= hi) continue; const d = direction === 'north' ? edge - o.z2 : o.z1 - edge; if (d >= 0) gap = Math.min(gap, d) }
      else { if (o.z2 <= lo || o.z1 >= hi) continue; const d = direction === 'west' ? edge - o.x2 : o.x1 - edge; if (d >= 0) gap = Math.min(gap, d) }
    }
    return round(gap)
  }
  if (bed.headWall === 'east') return {
    sides: {north: gapTo('north', bed.z1, bed.x1, bed.x2 - bedsideAllowanceMm, bed.z1), south: gapTo('south', bed.z2, bed.x1, bed.x2 - bedsideAllowanceMm, L - bed.z2)},
    foot: gapTo('west', bed.x1, bed.z1, bed.z2, bed.x1),
  }
  return {
    sides: {west: gapTo('west', bed.x1, bed.z1, bed.z2 - bedsideAllowanceMm, bed.x1), east: gapTo('east', bed.x2, bed.z1, bed.z2 - bedsideAllowanceMm, W - bed.x2)},
    foot: gapTo('north', bed.z1, bed.x1, bed.x2, bed.z1),
  }
}

/**
 * Checks one Bedroom 1 layout. `issues` are real problems in the model; `notes` are things to know or verify that do not
 * stop the layout working. `clearances` holds the measured gaps (mm) and how far each leaf opens (degrees).
 */
export function checkBedroom1Layout(room, layoutKey = BEDROOM1_DESIGN.defaultLayout, design = BEDROOM1_DESIGN) {
  const plan = bedroom1Plan(room, layoutKey, design), k = design.clearances
  const {widthMm: W, lengthMm: L, bed, wardrobe, recessWardrobe, medicineCabinet: mc, balcony} = plan
  const issues = [], notes = [], clearances = {}
  const need = (ok, message) => { if (!ok) issues.push(message) }
  const solid = plan.obstacles.filter(o => o.kind !== 'flat'), tall = solid.filter(o => o.topMm > k.stepOverMm)
  const everything = [...solid, ...balcony.obstacles]

  // 1. Everything stands inside the room (or inside the balcony).
  for (const o of plan.obstacles) need(o.x1 >= 0 && o.x2 <= W && o.z1 >= 0 && o.z2 <= L, `${o.name} leaves the room`)
  for (const o of balcony.obstacles.filter(o => o.kind === 'loose')) need(o.x1 >= balcony.x1 && o.x2 <= balcony.x2 && o.z1 >= balcony.z1 && o.z2 <= balcony.z2, `${o.name} leaves the balcony`)
  const pieces = solid.filter(o => o.name !== 'bed headboard' && o.name !== 'dressing stool')
  for (let i = 0; i < pieces.length; i++) for (let j = i + 1; j < pieces.length; j++) need(!overlaps(pieces[i], pieces[j]), `${pieces[i].name} and ${pieces[j].name} overlap`)

  // 2. Doors: nothing in the opening or just inside it, nothing in the swing.
  clearances.doorSwings = {}
  for (const d of plan.doors) {
    const wallZ = d.wall === 'north' ? 0 : L, into = d.wall === 'north' ? 'south' : 'north'
    const approach = {x1: d.x1, x2: d.x2, z1: d.wall === 'north' ? 0 : L - k.doorApproachMm, z2: d.wall === 'north' ? k.doorApproachMm : L}
    for (const o of solid) need(!overlaps(o, approach), `${o.name} stands within ${k.doorApproachMm} mm inside the door to ${d.leadsTo}`)
    const sweeps = pairSweeps(d.x1, d.x2, wallZ, into, d.leafMm, 0, d.heightMm, solid)
    const hinges = d.hingeKnown ? [d.hinge] : ['west', 'east']
    clearances.doorSwings[d.leadsTo] = Object.fromEntries(hinges.map(h => [h, sweeps[h].openDeg]))
    for (const h of hinges) {
      const s = sweeps[h]
      if (s.openDeg >= 90) continue
      const text = `the door to ${d.leadsTo}${d.hingeKnown ? '' : `, if hinged on its ${h} jamb,`} opens only ${s.openDeg} degrees before it meets the ${s.blockedBy}`
      if (d.opensIntoRoom) issues.push(text)
      else notes.push(`${text} (only if it opens into the bedroom; it is assumed to open into ${d.opensInto})`)
    }
    const rug = plan.loose.rug
    if (d.opensIntoRoom && rug) {
      const swept = {x1: d.x1, x2: d.x2, z1: into === 'north' ? L - d.leafMm : 0, z2: into === 'north' ? L : d.leafMm}
      if (overlaps(rug, swept)) notes.push(`the rug lies under the swing of the door to ${d.leadsTo}; a door can catch on a rug`)
    }
  }

  // 3. Walkways: both sides and the foot of the bed, and a 600 mm way from the lobby door to everything that is used.
  const bc = bedClearances(plan)
  clearances.bedSides = bc.sides; clearances.bedFoot = bc.foot
  for (const [side, gap] of Object.entries(bc.sides)) {
    if (gap < k.walkwayMinMm) issues.push(gap === 0 ? `the bed's ${side} side is against the wall: whoever sleeps there has to climb over the other person (needs ${k.walkwayMinMm} mm)` : `only ${gap} mm beside the bed on its ${side} side (needs ${k.walkwayMinMm})`)
    else if (gap < k.bedsidePreferredMm) notes.push(`${gap} mm beside the bed on its ${side} side: enough to walk (${k.walkwayMinMm}), under the comfortable ${k.bedsidePreferredMm}`)
  }
  need(bc.foot >= k.walkwayMinMm, `only ${bc.foot} mm beyond the foot of the bed (needs ${k.walkwayMinMm})`)
  if (plan.dressingTable) {
    const behind = round(bed.z1 - plan.dressingTable.seat.z2)
    clearances.behindDressingSeat = behind
    need(behind >= k.walkwayMinMm, `only ${behind} mm between a person sitting at the dressing table and the foot of the bed (needs ${k.walkwayMinMm})`)
  }
  const lobbyDoor = plan.doors.find(d => d.wall === 'south'), washroomDoor = plan.doors.find(d => d.wall === 'north')
  const start = {x1: lobbyDoor.x1, x2: lobbyDoor.x2, z1: L - k.doorApproachMm, z2: L}
  const destinations = {
    'washroom door': {x1: washroomDoor.x1, x2: washroomDoor.x2, z1: 0, z2: k.doorApproachMm},
    'balcony opening': {x1: W - k.doorApproachMm, x2: W, z1: balcony.opening.z1, z2: balcony.opening.z2},
    'west wardrobe': {x1: wardrobe.x2, x2: wardrobe.x2 + wardrobe.leafMm + k.walkwayMinMm / 2, z1: wardrobe.z1, z2: wardrobe.z2},
    'recess wardrobe': {x1: recessWardrobe.x1, x2: recessWardrobe.x2, z1: 0, z2: recessWardrobe.leafMm + k.walkwayMinMm},
    ...(plan.dressingTable ? {'dressing table': {x1: plan.dressingTable.x1, x2: plan.dressingTable.x2, z1: plan.dressingTable.z2, z2: plan.dressingTable.z2 + k.walkwayMinMm + k.seatMm}} : {}),
  }
  clearances.routes = {}
  for (const [name, zone] of Object.entries(destinations)) {
    const ok = routeExists(plan, start, zone, k.walkwayMinMm, k.stepOverMm)
    clearances.routes[name] = ok
    need(ok, `no ${k.walkwayMinMm} mm wide way from the lobby door to the ${name}`)
  }

  // 4. Wardrobe doors. The hinge sides of the room wardrobes are not decided, so the whole strip a leaf can sweep must be clear.
  const strips = {
    'west wardrobe': {x1: wardrobe.x2, x2: wardrobe.x2 + wardrobe.leafMm, z1: wardrobe.z1, z2: wardrobe.z2},
    'recess wardrobe': {x1: recessWardrobe.x1, x2: recessWardrobe.x2, z1: 0, z2: recessWardrobe.leafMm},
  }
  for (const [name, strip] of Object.entries(strips)) for (const o of solid) if (o.name !== name) need(!overlaps(o, strip), `${o.name} stands where the ${name} doors swing (${round(name === 'west wardrobe' ? wardrobe.leafMm : recessWardrobe.leafMm)} mm leaves)`)
  clearances.westWardrobeLeafToBed = round(bed.x1 - (wardrobe.x2 + wardrobe.leafMm))
  const bw = balcony.wardrobe
  if (bw.doors === 'sliding') {
    const stand = {x1: bw.x1, x2: bw.x2, z1: bw.frontZ - k.sliderStandMm, z2: bw.frontZ}
    for (const o of balcony.obstacles) if (o.name !== 'balcony wardrobe' && !(o.bottomMm > 0)) need(!overlaps(o, stand), `${o.name} stands within ${k.sliderStandMm} mm in front of the balcony wardrobe`)
  } else {
    const sweeps = pairSweeps(bw.x1, bw.x2, bw.frontZ, 'north', bw.leafMm, 0, bw.heightMm, everything.filter(o => o.name !== 'balcony wardrobe'))
    clearances.balconyWardrobeLeaves = {west: sweeps.west.openDeg, east: sweeps.east.openDeg}
    for (const [side, s] of Object.entries(sweeps)) need(s.openDeg >= 90, `the ${side} door of the balcony wardrobe opens only ${s.openDeg} degrees before it meets the ${s.blockedBy}`)
  }
  if (balcony.ac) clearances.acToBalconyWardrobe = round(bw.frontZ - balcony.ac.z2)
  if (bw.intoWallMm > 0) notes.push(`the balcony wardrobe is drawn ${round(bw.intoWallMm)} mm deeper than the balcony: its back sits inside the wall to the Pooja Ghar, which the plan draws about 180 mm thick. Check on site that there is a niche that deep; otherwise the wardrobe comes ${round(bw.intoWallMm)} mm further into the balcony or is made shallower`)

  // 5. The medicine cabinet in the closed old door: its leaves open, and a person can stand within reach of it.
  const cabinetSweeps = pairSweeps(mc.x1, mc.x2, L, 'north', mc.leafMm, mc.doorBottomMm, mc.heightMm, solid)
  clearances.medicineCabinetLeaves = {west: cabinetSweeps.west.openDeg, east: cabinetSweeps.east.openDeg}
  for (const [side, s] of Object.entries(cabinetSweeps)) need(s.openDeg >= 90, `the ${side} door of the medicine cabinet opens ${s.openDeg} degrees: the ${s.blockedBy} is in front of it`)
  const quarter = (mc.x2 - mc.x1) / 4
  const reach = Math.max(...[mc.x1 + quarter, mc.x2 - quarter].map(x => nearestStandingSpot(plan, {x, z: L}, k.personMm, k.stepOverMm)))
  clearances.medicineCabinetReach = round(reach)
  need(reach <= k.reachMm, `the medicine cabinet cannot be reached standing: the nearest place to stand is ${round(reach)} mm from it (an arm reaches about ${k.reachMm})`)

  // 6. The balcony opening and the window AC.
  const inOpening = tall.filter(o => o.x2 > W - 150 && o.z2 > balcony.opening.z1 && o.z1 < balcony.opening.z2)
  const blockedFrom = Math.min(balcony.opening.z2, ...inOpening.map(o => o.z1)), blockedTo = Math.max(balcony.opening.z1, ...inOpening.map(o => o.z2))
  const clearWidth = inOpening.length ? Math.max(blockedFrom - balcony.opening.z1, balcony.opening.z2 - blockedTo) : balcony.opening.z2 - balcony.opening.z1
  clearances.balconyOpeningClear = round(clearWidth)
  need(clearWidth >= k.walkwayMinMm + 300, `only ${round(clearWidth)} mm of the balcony opening is clear`)
  if (inOpening.length) notes.push(`the ${inOpening[0].name} stands across ${round(balcony.opening.z2 - balcony.opening.z1 - clearWidth)} mm of the balcony opening (${round(clearWidth)} of ${balcony.opening.z2 - balcony.opening.z1} mm stay clear), so part of the bed head has no wall behind it`)
  if (balcony.ac) {
    const ac = balcony.ac
    const front = {x1: ac.frontX - k.acFrontClearMm, x2: ac.frontX, z1: ac.z1, z2: ac.z2}
    const stream = {x1: ac.frontX - k.acThrowMm, x2: ac.frontX, z1: ac.z1, z2: ac.z2}
    const others = everything.filter(o => o.name !== 'window AC' && o.kind !== 'flat')
    for (const o of others) {
      if (o.topMm > k.stepOverMm && overlaps(o, front)) issues.push(`the ${o.name} stands within ${k.acFrontClearMm} mm in front of the window AC`)
      else if (o.topMm > ac.bottomMm && overlaps(o, stream)) issues.push(`the ${o.name} (${o.topMm} mm high) stands in the window AC's air stream, ${round(ac.frontX - o.x2)} mm in front of it`)
    }
    need(ac.z1 >= balcony.opening.z1 && ac.z2 <= balcony.opening.z2 && !inOpening.some(o => o.topMm > ac.bottomMm && o.z1 < ac.z2 && o.z2 > ac.z1), 'the window AC does not face the clear part of the balcony opening')
    const beside = others.filter(o => o.topMm > ac.bottomMm && o.x1 < stream.x2 && o.x2 > stream.x1 && !overlaps(o, stream)).map(o => ({name: o.name, gap: Math.max(o.z1 - ac.z2, ac.z1 - o.z2)})).sort((a, b) => a.gap - b.gap)[0]
    clearances.acStreamMargin = beside ? round(beside.gap) : null
    if (beside && beside.gap < k.acStreamMarginNoteMm) notes.push(`the ${beside.name} stands ${round(beside.gap)} mm beside the window AC's air stream: anything taller or further north there would stand in it`)
    const seatGap = Math.max(ac.z1 - balcony.chair.z2, balcony.chair.z1 - ac.z2)
    clearances.acToBalconyChair = round(seatGap)
    if (seatGap < 600) notes.push(`the balcony chair is ${round(seatGap)} mm from the window AC: the seat is out of the air stream but next to the machine's noise`)
  }
  return {ok: issues.length === 0, issues, notes, clearances, plan}
}

/** Text and plan boxes for the room-review brief (src/domain/roomReview.mjs). */
export function bedroom1Review(room, layoutKey = BEDROOM1_DESIGN.defaultLayout, design = BEDROOM1_DESIGN) {
  const check = checkBedroom1Layout(room, layoutKey, design), plan = check.plan, c = check.clearances
  const {bed, wardrobe, medicineCabinet: mc, balcony} = plan
  const box = r => `x ${round(r.x1)}-${round(r.x2)}, z ${round(r.z1)}-${round(r.z2)}`
  const inRoom = (label, r, kind) => ({label, x1: Math.max(0, r.x1), z1: Math.max(0, r.z1), x2: Math.min(plan.widthMm, r.x2), z2: Math.min(plan.lengthMm, r.z2), kind})
  const items = [inRoom(`Bed ${bed.lengthMm}x${bed.widthMm}`, bed, 'seat'), inRoom(`Wardrobe ${round(wardrobe.z2 - wardrobe.z1)}x${wardrobe.x2}`, wardrobe, 'fixed')]
  if (plan.dressingTable) items.push(inRoom(`Dressing table ${round(plan.dressingTable.x2 - plan.dressingTable.x1)}x${plan.dressingTable.z2}`, plan.dressingTable, 'table'))
  if (plan.bedsideTable) items.push(inRoom('Bedside table', plan.bedsideTable, 'table'))
  if (plan.loose.hamper) items.push(inRoom('Hamper', plan.loose.hamper, 'table'))
  const sides = Object.entries(c.bedSides).map(([side, gap]) => `${side} ${gap} mm`).join(', ')
  const lines = [
    `Layout ${plan.label}. Nothing in this room is measured on site; sizes come from the A501 floor plan.`,
    `Bed ${bed.lengthMm} x ${bed.widthMm}: ${box(bed)}, head on the ${bed.headWall} wall, mattress top ${bed.mattressTopMm} mm, headboard top ${bed.headboardTopMm} mm.`,
    `West wardrobe: ${box(wardrobe)}, ${wardrobe.heightMm} mm high, ${wardrobe.doorCount} hinged doors of ${round(wardrobe.leafMm)} mm.`,
    `Medicine cabinet in the closed old door, south wall: x ${round(mc.x1)}-${round(mc.x2)}, two doors of ${round(mc.leafMm)} mm opening into this room${mc.doorBottomMm ? `, doors starting ${mc.doorBottomMm} mm above the floor (proposed for this layout)` : ', floor to door head'}.`,
    ...(plan.dressingTable ? [`Dressing table on the north wall: ${box(plan.dressingTable)}, ${plan.dressingTable.heightMm} mm high, mirror above, stool half under it.`] : []),
    ...(plan.bedsideTable ? [`Bedside table on the east side of the bed head: ${box(plan.bedsideTable)}, ${plan.bedsideTable.heightMm} mm high. None on the west side (the lobby door is there).`] : []),
    `Balcony (x beyond ${plan.widthMm}): wardrobe ${box(balcony.wardrobe)} with ${balcony.wardrobe.doors} doors; table ${box(balcony.table)}; chair ${box(balcony.chair)}${balcony.ac ? `; window AC in the east glazing z ${round(balcony.ac.z1)}-${round(balcony.ac.z2)}, ${balcony.ac.bottomMm}-${balcony.ac.topMm} mm above the floor, blowing west into the room` : ''}.`,
    'Door swings are assumed: the lobby door opens into this room (both hinge sides are checked), the washroom door opens into the washroom.',
  ]
  const measured = [
    `Clear floor beside the bed: ${sides}; beyond its foot ${c.bedFoot} mm.`,
    `Balcony opening clear width: ${c.balconyOpeningClear} mm of ${balcony.opening.z2 - balcony.opening.z1}.`,
    `Medicine cabinet doors open ${c.medicineCabinetLeaves.west} (west) and ${c.medicineCabinetLeaves.east} (east) degrees; nearest standing place ${c.medicineCabinetReach} mm from it.`,
    `West wardrobe doors fully open clear the bed by ${c.westWardrobeLeafToBed} mm.`,
    ...check.notes.map(n => `Note: ${n}.`),
  ]
  return {label: `Layout ${plan.label}`, lines, items, measured, issues: check.issues, notes: check.notes}
}
