import {EMPTY_ROOM_SHELLS} from '../config/roomShellConfig.js'
import {AC_PLAN, AC_INDOOR_UNIT_SIZES} from '../config/acPlanConfig.js'
import {ROOM_ELECTRICAL} from '../config/roomElectricalConfig.js'
import {roomElectricalModel} from './roomElectricalModels.mjs'
import {resolveRoomPoints, roomPointPosition} from './roomElectrical.mjs'
import {ironingStorageAccessBox, planGapMm, boxesMeet} from './lobbyIroningStorage.mjs'
import {poojaPlatformGeometry} from './poojaPlatform.mjs'

// Shared kinematics for check and builder. mm, x east / z south; rotation is Three's y rotation in radians.
// Legacy bi-fold transforms are flattened here without changing their hinge positions or angles.
export function poojaDoorLeaves(pooja, style = pooja.door.style, open = true) {
  const d = pooja.door, west = pooja.fromMm, east = west + pooja.widthMm, half = pooja.widthMm / 2
  if (!Object.hasOwn(d.options, style)) throw new Error(`Unknown Pooja door style: ${style}`)
  const leaf = (id, x, z, width, direction = 1, angle = 0) => ({id, x, z, width, direction, angle})
  if (style === 'bifoldInWest') {
    const w = (pooja.widthMm - d.inwardHingeInsetMm - d.jambMm) / 2
    // A numeric open value is fold progress 0..1; both leaves share their middle hinge.
    const angle = Number(open) * Math.PI / 2, x = west + d.inwardHingeInsetMm, z = d.inwardFaceMm
    return [leaf('west', x, z, w, 1, angle), leaf('east', x + w * Math.cos(angle), z - w * Math.sin(angle), w, 1, -angle)].map(l => ({...l, faceOffset: d.inwardFaceOffsetMm, hingeRadius: l.id === 'west' ? d.hingeRadiusMm : 0}))
  }
  if (style === 'bifoldEast') {
    const w = half - d.bifoldInsetMm, angle = open ? d.bifoldAngleDeg * Math.PI / 180 : 0, x = east - d.bifoldInsetMm
    return [leaf('east', x, d.faceMm, w, -1, angle), leaf('west', x - w * Math.cos(angle), d.faceMm + w * Math.sin(angle), w, -1, -angle)]
  }
  if (style === 'slideWest') return [leaf('full', west - (open ? pooja.widthMm : 0), d.faceMm, pooja.widthMm)]
  return [leaf('fixedEast', west + half, d.faceMm, half), style === 'fixedEastSlideWest'
    ? leaf('west', west + (open ? half : 0), d.faceMm + d.slidingLaneMm, half)
    : leaf('west', west + d.jambMm, d.faceMm, half - d.jambMm, 1, open ? Math.PI / 2 : 0)]
}
export function poojaLeafCorners(pooja, leaf) {
  const d = pooja.door, r = leaf.hingeRadius ?? 0, back = Math.min(d.leafBackMm + (leaf.faceOffset ?? 0), -r), front = d.leafFrontMm + (leaf.faceOffset ?? 0)
  // Conservative rectangle also contains the outer and middle hinge barrels on the first inward leaf.
  const a = -r, b = leaf.direction * leaf.width + r
  return [[a, back], [b, back], [b, front], [a, front]].map(([x, z]) => ({x: leaf.x + x * Math.cos(leaf.angle) + z * Math.sin(leaf.angle), z: leaf.z - x * Math.sin(leaf.angle) + z * Math.cos(leaf.angle)}))
}
export function poojaLeafBox(pooja, leaf, floorTopMm = 0) {
  const d = pooja.door, corners = poojaLeafCorners(pooja, leaf)
  return {x1: Math.min(...corners.map(p => p.x)), x2: Math.max(...corners.map(p => p.x)), z1: Math.min(...corners.map(p => p.z)), z2: Math.max(...corners.map(p => p.z)), bottom: floorTopMm + pooja.platformHeightMm + d.bottomGapMm, top: d.heightMm - d.headInsetMm}
}
const union = boxes => ({x1: Math.min(...boxes.map(b => b.x1)), x2: Math.max(...boxes.map(b => b.x2)), z1: Math.min(...boxes.map(b => b.z1)), z2: Math.max(...boxes.map(b => b.z2))})

const rectCorners = b => [{x: b.x1, z: b.z1}, {x: b.x2, z: b.z1}, {x: b.x2, z: b.z2}, {x: b.x1, z: b.z2}]
function polygonGap(a, b) {
  const edges = p => p.map((v, i) => [v, p[(i + 1) % p.length]])
  const separated = [...edges(a), ...edges(b)].some(([u, v]) => {
    const project = p => p.map(q => q.x * (u.z - v.z) + q.z * (v.x - u.x)), aa = project(a), bb = project(b)
    return Math.max(...aa) < Math.min(...bb) || Math.max(...bb) < Math.min(...aa)
  })
  if (!separated) return 0
  const pointEdge = (p, [a, b]) => {
    const dx = b.x - a.x, dz = b.z - a.z, t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / (dx * dx + dz * dz)))
    return Math.hypot(p.x - a.x - t * dx, p.z - a.z - t * dz)
  }
  return Math.min(...a.flatMap(p => edges(b).map(e => pointEdge(p, e))), ...b.flatMap(p => edges(a).map(e => pointEdge(p, e))))
}

export function poojaInwardSweep(p, obstacles) {
  const leaves = poojaDoorLeaves(p, 'bifoldInWest', false), w = leaves[0].width
  // Numerical check: half-degree samples with a Lipschitz travel bound between samples.
  // Any point moves at most (2w + face envelope) * deltaAngle; subtract half a sample's travel.
  const steps = 180, reach = Math.max(Math.abs(p.door.leafBackMm), p.door.leafFrontMm) + p.door.inwardFaceOffsetMm
  const errorMm = (2 * w + reach + p.door.hingeRadiusMm) * Math.PI / (4 * steps)
  const samples = Array.from({length: steps + 1}, (_, i) => poojaDoorLeaves(p, 'bifoldInWest', i / steps).map(l => poojaLeafCorners(p, l)))
  const clearance = Object.fromEntries(Object.entries(obstacles).map(([key, box]) => [key, Math.max(0, Math.min(...samples.flatMap(pair => pair.map(poly => polygonGap(poly, rectCorners(box))))) - errorMm)]))
  const vertices = samples.flat(2), bounds = {x1: Math.min(...vertices.map(v => v.x)) - errorMm, x2: Math.max(...vertices.map(v => v.x)) + errorMm, z1: Math.min(...vertices.map(v => v.z)) - errorMm, z2: Math.max(...vertices.map(v => v.z)) + errorMm}
  // Exact centre-line sweep boundary: circular for x <= w/sqrt(2), then the envelope of the second leaf.
  // Integrate by midpoint quadrature (dimensionless numerical resolution, not a design measurement).
  const n = 10000, dx = 2 * w / n
  let centreLineAreaMm2 = 0
  for (let i = 0; i < n; i++) {
    const x = (i + .5) * dx
    centreLineAreaMm2 += (x <= w / Math.SQRT2 ? Math.sqrt(w * w - x * x) : 2 * w * (1 - (x / (2 * w)) ** (2 / 3)) ** 1.5) * dx
  }
  return {bounds, clearance, sampleErrorMm: errorMm, centreLineAreaMm2, singleLeafAreaMm2: Math.PI * (2 * w) ** 2 / 4,
    centreLineDepthMm: w, singleLeafDepthMm: 2 * w, backWallClearanceMm: p.depthMm + bounds.z1}
}

export function poojaDoorObstacles(room = EMPTY_ROOM_SHELLS.lobby) {
  const d = room.poojaAlcove.door, f = room.furniture, t = f.diningTable, half = d.chairSizeMm / 2
  const chairs = f.chairRowsZmm.flatMap(z => [-1, 1].map(side => ({x1: t.centerXmm + side * f.chairOffsetXmm - half, x2: t.centerXmm + side * f.chairOffsetXmm + half, z1: z - half, z2: z + half, bottom: 0, top: d.chairHeightMm})))
  const ac = AC_PLAN.spaces.find(s => s.id === 'lobby'), size = AC_INDOOR_UNIT_SIZES[ac.tons], model = roomElectricalModel('lobby')
  return {cabinet: ironingStorageAccessBox(room), chairs,
    ac: {x1: ac.indoor.centreMm - size.widthMm / 2, x2: ac.indoor.centreMm + size.widthMm / 2, z1: 0, z2: size.depthMm, bottom: ac.indoor.bottomMm, top: ac.indoor.bottomMm + size.heightMm},
    points: resolveRoomPoints(model, ROOM_ELECTRICAL.lobby).map(p => ({...p, ...roomPointPosition(model, p)}))}
}

export function checkPoojaDoor(room, style, obstacles = poojaDoorObstacles(room), floorTopMm = 0) {
  const p = room.poojaAlcove, d = p.door, leaves = poojaDoorLeaves(p, style), boxes = leaves.map(l => poojaLeafBox(p, l, floorTopMm))
  const moving = boxes.filter((_, i) => leaves[i].id !== 'fixedEast'), parked = union(moving), reasons = []
  const clearance = other => Math.min(...moving.map(b => Math.hypot(planGapMm(b, other), Math.max(b.bottom - other.top, other.bottom - b.top, 0))))
  const cabinetMm = clearance(obstacles.cabinet), chairsMm = Math.min(...obstacles.chairs.map(clearance)), acMm = clearance(obstacles.ac)
  if (cabinetMm === 0) reasons.push('Parked leaf meets the tall cabinet')
  if (chairsMm === 0) reasons.push('Parked leaf meets a dining chair')
  if (acMm === 0) reasons.push('Parked leaf meets the AC indoor unit')
  // Plate and reach envelope: include hidden alcove points too; a door must not trap their access.
  const plate = d.electricalPlateMm / 2, access = d.electricalAccessMm
  const electrical = obstacles.points.map(q => {
    const b = {x1: q.x - plate, x2: q.x + plate, z1: q.z - plate, z2: q.z + plate, bottom: q.y - plate, top: q.y + plate}
    if (q.wall === 'north') b.z2 += access
    if (q.wall === 'east') b.x1 -= access
    if (q.wall === 'free') b.x2 += access
    return {id: q.id, clearanceMm: clearance(b)}
  })
  const coveredPoints = electrical.filter(q => q.clearanceMm === 0).map(q => q.id)
  if (coveredPoints.length) reasons.push(`Parked leaf covers ${coveredPoints.join(', ')}`)
  // Inward sweep: conservative quarter-disc against the seated body and shelf, not just the final open rectangle.
  const hingeX = p.fromMm + d.jambMm, radius = p.widthMm / 2 - d.jambMm + d.leafFrontMm
  const sweepHits = b => style === 'fixedEastSwingIn' && b.x2 >= hingeX && b.z1 <= d.faceMm && Math.hypot(Math.max(b.x1 - hingeX, 0), Math.max(d.faceMm - b.z2, 0)) <= radius
  const person = {x1: p.fromMm + p.seatedPersonFromWestMm - d.seatedWidthMm / 2, x2: p.fromMm + p.seatedPersonFromWestMm + d.seatedWidthMm / 2, z1: -p.depthMm / 2 - d.seatedDepthMm / 2, z2: -p.depthMm / 2 + d.seatedDepthMm / 2}
  const shelf = {x1: p.fromMm + p.widthMm - p.templeDepthMm, x2: p.fromMm + p.widthMm, z1: -(p.depthMm + p.templeLengthMm) / 2, z2: -(p.depthMm - p.templeLengthMm) / 2}
  const sweep = style === 'bifoldInWest' ? poojaInwardSweep(p, {person, shelf, cabinet: obstacles.cabinet}) : null
  const seatedPersonInSwing = sweep ? sweep.clearance.person === 0 : sweepHits(person), templeShelfInSwing = sweep ? sweep.clearance.shelf === 0 : sweepHits(shelf)
  if (seatedPersonInSwing) reasons.push('Inward swing enters the seated person envelope')
  if (templeShelfInSwing) reasons.push('Inward swing enters the temple shelf envelope')
  const drawer = poojaPlatformGeometry(p, floorTopMm).drawerPull
  const drawerUsable = !d.floorTrack && boxes.every(b => b.bottom > drawer.top) && ![obstacles.cabinet, ...obstacles.chairs].some(b => boxesMeet(drawer, b))
  if (!drawerUsable) reasons.push('Platform drawer pull-out is obstructed')
  const clearOpeningMm = style === 'bifoldInWest' ? p.fromMm + p.widthMm - d.jambMm - parked.x2 : style === 'slideWest' ? p.widthMm - 2 * d.jambMm : style === 'bifoldEast' ? parked.x1 - p.fromMm - d.jambMm : p.widthMm / 2 - d.jambMm - (style === 'fixedEastSwingIn' ? d.leafFrontMm : 0)
  const parkedPersonClearanceMm = Math.min(...moving.map(b => planGapMm(b, person)))
  const straightThroughMm = style === 'bifoldInWest' ? Math.max(0, Math.min(p.fromMm + p.widthMm - d.jambMm, obstacles.cabinet.x1) - Math.max(p.fromMm + d.jambMm, parked.x2)) : null
  if (sweep?.clearance.cabinet === 0) reasons.push('Inward fold meets the cabinet')
  if (sweep && sweep.backWallClearanceMm <= 0) reasons.push('Inward fold meets the back wall')
  return {style, clearOpeningMm, parkedLeafRectangle: parked, leafBoxes: boxes, clearance: {cabinetMm, chairsMm, acMm, electrical}, coveredPoints,
    sweep, foldedStack: style === 'bifoldInWest' ? {widthMm: parked.x2 - parked.x1, depthMm: parked.z2 - parked.z1} : null,
    parkedPersonClearanceMm, seatedShiftEastMm: style === 'bifoldInWest' ? Math.max(0, parked.x2 + d.seatedWidthMm / 2 - (p.fromMm + p.seatedPersonFromWestMm)) : 0,
    parksInLobby: parked.z2 > 0, straightThroughMm,
    seatedPersonInSwing, templeShelfInSwing, drawerUsable, leafBottomMm: boxes[0].bottom, topHung: style.includes('Slide') || style === 'slideWest', floorTrack: d.floorTrack,
    verdict: reasons.length ? 'conflict' : 'clear in model', reasons}
}
export function checkPoojaDoors(room = EMPTY_ROOM_SHELLS.lobby, obstacles = poojaDoorObstacles(room)) {
  const options = Object.keys(room.poojaAlcove.door.options).map(style => checkPoojaDoor(room, style, obstacles))
  // Owner-selected style, not an automatic claim that the occupied seated position is clear.
  return {options, defaultStyle: room.poojaAlcove.door.style}
}
