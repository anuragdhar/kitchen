// Pure checks for the Main entry's outer door and round ceiling lights (no React, Three.js or DOM).
// Frames: ENTRY (config/entryConfig.js) is in A501 plan pixels, plan x growing WEST and plan y growing NORTH, with
// ENTRY.planScale giving metres per pixel; every size this module reports is in millimetres.

export const LIGHT_TO_WALL_MM = 250      // a panel's centre stays this far from every wall, so its cut-out clears trims and battens
export const LIGHT_SPACING_MAX_MM = 1800 // neighbouring lights in one section are no further apart than this
export const LIGHT_TO_END_MAX_MM = 1200  // each end of a section is within this of its nearest light, so no end is dark
export const LUMENS_PER_M2_MIN = 300     // a small passage: generous light to see shoes, keys and faces
export const VENT_OPEN_FRACTION_MIN = 0.3 // "ventilated": at least this much of the leaf is free air through grille and mesh
export const LOCK_HEIGHT_MM = [900, 1100]

const mmX = (entry, px) => px * entry.planScale.xMetresPerPixel * 1000
const mmZ = (entry, px) => px * entry.planScale.zMetresPerPixel * 1000

/**
 * The four parts of the Main entry in walking order, as plan rectangles with their sizes in mm (widthMm east-west,
 * lengthMm north-south). Only two are walked through: 1 the corridor and 4 the inner gallery; 2 is the services shaft and 3 the
 * pocket with the two cabinets. "The 4th section" in the owner's question (2026-10-04) is read as the inner gallery.
 */
export function entrySections(entry) {
  const b = entry.planBounds, s = entry.shaft, c = entry.wallCavity, doorX = entry.arrivalDoor.wallPlanX
  const rect = (x1, y1, x2, y2) => ({x1, y1, x2, y2, widthMm: Math.round(mmX(entry, x2 - x1)), lengthMm: Math.round(mmZ(entry, y2 - y1))})
  return [
    {id: 'corridor', order: 1, label: 'Unlocked corridor from the landing opening to the paired arrival doors', walkable: true, ceiling: 'PVC planks (false ceiling)', ...rect(doorX, s.planY2, b.x2, b.y2)},
    {id: 'shaft', order: 2, label: 'Services shaft on the right of the corridor', walkable: false, ...rect(s.planX1, s.planY1, s.planX2, s.planY2)},
    {id: 'pocket', order: 3, label: 'Pocket behind the Drawing Room wall: east cabinet and west cabinet', walkable: false, ...rect(c.planX1, c.wallPlanY2, b.x2, s.planY1)},
    {id: 'gallery', order: 4, label: 'Inner gallery from the arrival door past the shoe rack to the Drawing Room door', walkable: true, ceiling: 'plaster slab', ...rect(b.x1, b.y1, doorX, b.y2)},
  ]
}

/** Every light is round, in a walkable section, off the walls, evenly spread along its section, and the section is bright enough. */
export function checkEntryLighting(entry, lighting) {
  const issues = [], need = (ok, message) => { if (!ok) issues.push(message) }
  const sections = Object.fromEntries(entrySections(entry).map(s => [s.id, s]))
  const perSection = {}
  let watts = 0, lumens = 0
  for (const f of lighting.fittings) {
    const s = sections[f.section]
    need(s?.walkable, `${f.id}: "${f.section}" is not a part of the entry a person walks through`)
    need(!f.lengthMm && f.diameterMm > 0 && ['recessed', 'surface'].includes(f.kind), `${f.id}: not a round panel light`)
    if (!s?.walkable) continue
    const toWalls = {west: mmX(entry, s.x2 - f.planX), east: mmX(entry, f.planX - s.x1), north: mmZ(entry, s.y2 - f.planY), south: mmZ(entry, f.planY - s.y1)}
    const nearest = Math.min(...Object.values(toWalls))
    need(nearest >= LIGHT_TO_WALL_MM, `${f.id}: ${Math.round(nearest)} mm from a wall of the ${s.id} (needs ${LIGHT_TO_WALL_MM})`)
    need(s.id !== 'corridor' || f.kind === 'recessed', `${f.id}: the corridor gets a PVC false ceiling, so its lights are recessed`)
    need(s.id !== 'gallery' || f.kind === 'surface', `${f.id}: the gallery keeps its plaster slab, so its lights are surface-mounted`)
    const p = (perSection[s.id] ??= {fittings: [], watts: 0, lumens: 0})
    p.fittings.push({...f, toWalls: Object.fromEntries(Object.entries(toWalls).map(([k, v]) => [k, Math.round(v)]))})
    p.watts += f.watts; p.lumens += f.lumens; watts += f.watts; lumens += f.lumens
  }
  for (const s of Object.values(sections).filter(s => s.walkable)) {
    const p = perSection[s.id]
    need(p, `no light in the ${s.id}`)
    if (!p) continue
    const alongX = s.widthMm >= s.lengthMm, length = alongX ? s.widthMm : s.lengthMm
    const positions = p.fittings.map(f => alongX ? mmX(entry, f.planX - s.x1) : mmZ(entry, f.planY - s.y1)).sort((a, b) => a - b)
    need(positions[0] <= LIGHT_TO_END_MAX_MM && length - positions.at(-1) <= LIGHT_TO_END_MAX_MM, `${s.id}: an end of it is more than ${LIGHT_TO_END_MAX_MM} mm from the nearest light`)
    for (let i = 1; i < positions.length; i++) need(positions[i] - positions[i - 1] <= LIGHT_SPACING_MAX_MM, `${s.id}: two lights are ${Math.round(positions[i] - positions[i - 1])} mm apart (max ${LIGHT_SPACING_MAX_MM})`)
    p.lumensPerM2 = Math.round(p.lumens / (s.widthMm * s.lengthMm / 1e6))
    need(p.lumensPerM2 >= LUMENS_PER_M2_MIN, `${s.id}: ${p.lumensPerM2} lm per square metre (needs ${LUMENS_PER_M2_MIN})`)
  }
  for (const sw of lighting.switching ?? []) for (const id of sw.lights) need(lighting.fittings.some(f => f.id === id), `switch ${sw.id} controls an unknown light ${id}`)
  return {ok: issues.length === 0, issues, totals: {count: lighting.fittings.length, watts, lumens}, sections: perSection}
}

/** Sizes of the outer door from the opening drawn on the plan and ENTRY.outerDoor: leaf, panels and the free air through it. */
export function entryOuterDoorGeometry(entry) {
  const d = entry.outerDoor, o = entry[d.mountedAt]
  const openingWidthMm = Math.round(mmZ(entry, o.toPlanY - o.fromPlanY)), openingHeightMm = o.heightMm
  const leafWidthMm = openingWidthMm - 2 * (d.frameMm + d.leafJambGapMm), leafHeightMm = openingHeightMm - d.frameMm - d.floorGapMm
  const leafAreaM2 = leafWidthMm * leafHeightMm / 1e6
  const panels = d.panels.map(p => {
    const heightMm = p.toMm - p.fromMm, areaM2 = leafWidthMm * heightMm / 1e6
    const openFraction = p.kind === 'grille' ? (p.pitchMm - p.barMm) / p.pitchMm * p.meshOpenFraction : 0
    return {...p, heightMm, areaM2: Math.round(areaM2 * 1000) / 1000, openAreaM2: Math.round(areaM2 * openFraction * 1000) / 1000}
  })
  const ventOpenAreaM2 = Math.round(panels.reduce((sum, p) => sum + p.openAreaM2, 0) * 1000) / 1000
  return {openingWidthMm, openingHeightMm, leafWidthMm, leafHeightMm, leafAreaM2: Math.round(leafAreaM2 * 1000) / 1000, panels, ventOpenAreaM2, ventOpenFraction: Math.round(ventOpenAreaM2 / leafAreaM2 * 100) / 100}
}

/** The outer door is stainless, fills its opening, is built of panels that meet, breathes, and has its lock on a solid rail. */
export function checkEntryOuterDoor(entry) {
  const d = entry.outerDoor, g = entryOuterDoorGeometry(entry), issues = [], need = (ok, message) => { if (!ok) issues.push(message) }
  need(/stainless/i.test(d.material), 'the outer door is not stainless steel')
  need(d.mountedAt === 'arrivalDoor', 'steel door must be mounted at arrivalDoor; the landing opening must stay plain')
  need(g.leafWidthMm > 0 && g.leafWidthMm < g.openingWidthMm, `leaf ${g.leafWidthMm} mm wide: does not fit the arrival opening`)
  need(g.leafHeightMm >= 1950, `leaf only ${g.leafHeightMm} mm high`)
  let cursor = 0
  for (const p of d.panels) {
    need(['sheet', 'grille'].includes(p.kind), `unknown panel kind ${p.kind}`)
    need(p.fromMm === cursor, `panel at ${p.fromMm} leaves a gap or overlaps the one below (expected ${cursor})`)
    need(p.toMm > p.fromMm, `panel at ${p.fromMm} has no height`)
    if (p.kind === 'grille') need(p.barMm > 0 && p.pitchMm > p.barMm && p.meshOpenFraction > 0 && p.meshOpenFraction <= 1, `grille at ${p.fromMm}: bar, pitch or mesh figures are wrong`)
    cursor = p.toMm
  }
  need(cursor === g.leafHeightMm, `the panels end at ${cursor} mm but the leaf is ${g.leafHeightMm} mm high`)
  need(d.panels[0]?.kind === 'sheet' && d.panels[0].toMm >= 250, 'no solid kick plate at the bottom')
  need(g.ventOpenFraction >= VENT_OPEN_FRACTION_MIN, `only ${Math.round(g.ventOpenFraction * 100)}% of the leaf is open for air (needs ${VENT_OPEN_FRACTION_MIN * 100}%)`)
  const lockPanel = d.panels.find(p => d.lock.heightMm >= p.fromMm && d.lock.heightMm <= p.toMm)
  need(lockPanel?.kind === 'sheet', 'the lock is not on a solid rail')
  need(d.lock.heightMm >= LOCK_HEIGHT_MM[0] && d.lock.heightMm <= LOCK_HEIGHT_MM[1], `lock at ${d.lock.heightMm} mm, outside ${LOCK_HEIGHT_MM.join('-')}`)
  need(d.opens === 'west-outside', 'the proposed safety door opens outward into the corridor')
  need(['north', 'south'].includes(d.hinge), 'hinge must be on the north or south jamb of this west-wall opening')
  return {ok: issues.length === 0, issues, ...g}
}

export const GRILLE_OPEN_FRACTION_MIN = 0.7 // a condenser grille must be mostly air, or the fan pushes against it

/** Shared leaf transforms, in mm in the south-up plan frame (+x west, +z north), relative to the arrival wall/south jamb.
 * Builders translate by their own plan converters, then divide these lengths by 1000. No room/pixel offsets are guessed.
 */
export function entryDoorLeaf(entry, key) {
  const d = entry[key], o = key === 'outerDoor' ? entry[d.mountedAt] : d
  const openingWidthMm = Math.round(mmZ(entry, o.toPlanY - o.fromPlanY)), jambMm = d.frameMm + d.leafJambGapMm
  const sign = d.hinge === 'north' ? -1 : 1, outward = d.opens === 'west-outside' ? 1 : -1
  return {key, opening: o, widthMm: openingWidthMm - 2 * jambMm, heightMm: key === 'outerDoor' ? entryOuterDoorGeometry(entry).leafHeightMm : d.heightMm - d.headAllowanceMm,
    hingeX: d.faceOffsetMm, hingeZ: d.hinge === 'north' ? openingWidthMm - jambMm : jambMm, sign,
    rotationSign: sign * outward, thicknessMm: d.leafThicknessMm, maxDegrees: d.maxOpenAngleDegrees}
}

// SAT separation of convex rectangles: positive is a conservative lower bound on their true distance; negative overlaps.
function polygonGap(a, b) {
  let gap = -Infinity
  for (const p of [a, b]) for (let i = 0; i < p.length; i++) {
    const q = p[(i + 1) % p.length], dx = q.x - p[i].x, dz = q.z - p[i].z, length = Math.hypot(dx, dz)
    const project = r => r.map(v => (v.x * -dz + v.z * dx) / length), aa = project(a), bb = project(b)
    gap = Math.max(gap, Math.min(...bb) - Math.max(...aa), Math.min(...aa) - Math.max(...bb))
  }
  return gap
}
const rectangle = (x1, z1, x2, z2) => [{x:x1,z:z1},{x:x2,z:z1},{x:x2,z:z2},{x:x1,z:z2}]

export function entryDoorLeafPolygons(entry, key, degrees) {
  const leaf = entryDoorLeaf(entry, key), p = entry.doorPair, wood = key === 'arrivalDoor'
  const reach = wood ? p.woodHandleReachMm : p.steelHandleReachMm
  const tip = wood ? p.woodHandleFromTipMm : p.steelHandleFromTipMm, width = wood ? p.woodHandleWidthMm : p.steelHandleWidthMm
  const angle = leaf.rotationSign * degrees * Math.PI / 180, c = Math.cos(angle), s = Math.sin(angle)
  return [rectangle(-leaf.thicknessMm / 2, 0, leaf.thicknessMm / 2, leaf.widthMm),
    rectangle(-reach, leaf.widthMm - tip - width / 2, reach, leaf.widthMm - tip + width / 2)]
    .map(poly => poly.map(v => ({x:leaf.hingeX + v.x * c + leaf.sign * v.z * s, z:leaf.hingeZ - v.x * s + leaf.sign * v.z * c})))
}

/** Static obstacles include deployed seat, closed rack/AC service fronts and cabinet; open storage leaves are not modelled.
 * Electrical point boxes use the same config anchors as roomElectricalModels. Height-independent projections are conservative.
 */
export function entryDoorObstacles(entry) {
  const o = entry.arrivalDoor, b = entry.planBounds, p = entry.doorPair, rack = entry.shoeRack, seat = entry.foldSeat, c = entry.wallCavity.eastCabinet
  const X = px => mmX(entry, px - o.wallPlanX), Z = py => mmZ(entry, py - o.fromPlanY), half = p.wallThicknessMm / 2
  const rect = (name, x1, z1, x2, z2) => ({name, polygon:rectangle(x1,z1,x2,z2)})
  const north = Z(b.y2), west = X(b.x2), east = X(b.x1), rackX = X((rack.planX1 + rack.planX2) / 2)
  const point = (name, x, z, onHorizontalWall) => rect(name,
    x - (onHorizontalWall ? p.electricalHalfWidthMm : p.electricalDepthMm), z - (onHorizontalWall ? p.electricalDepthMm : p.electricalHalfWidthMm),
    x + (onHorizontalWall ? p.electricalHalfWidthMm : p.electricalDepthMm), z + (onHorizontalWall ? p.electricalDepthMm : p.electricalHalfWidthMm))
  return [rect('corridor north wall', X(p.northWallFromPlanX), north-half, west, north+half),
    rect('corridor south / shaft wall', 0, -half, west, half), rect('landing wall (conservative full plane)', west-half, 0, west+half, north),
    rect('shaft gallery face', -half, Z(entry.shaft.planY1), half, 0),
    rect('gallery east wall', east-half, Z(b.y1), east+half, north),
    rect('shoe rack and pulls', rackX-rack.widthMm/2, north-p.rackPullProjectionMm, rackX+rack.widthMm/2, north+rack.projectionMm-p.rackFrontOffsetMm),
    rect('AC bay and closed service door', rackX-rack.widthMm/2, north-p.rackPullProjectionMm, rackX+rack.widthMm/2, north+shoeRackAcBayGeometry(entry).bayDepthMm),
    rect('deployed fold seat', X(seat.wallPlanX), Z(seat.centrePlanY)-seat.widthMm/2, X(seat.wallPlanX)+seat.depthMm, Z(seat.centrePlanY)+seat.widthMm/2),
    rect('east cabinet (closed)', X(c.planX1)-c.panelMm, Z(c.planY1), X(c.planX2), Z(c.planY2)),
    rect('key tray and hooks', X(entry.keyStation.wallPlanX)+entry.keyStation.faceOffsetMm-p.keyStationHalfDepthMm, Z(entry.keyStation.planY)-p.keyStationHalfWidthMm,
      X(entry.keyStation.wallPlanX)+entry.keyStation.faceOffsetMm+p.keyStationHalfDepthMm, Z(entry.keyStation.planY)+p.keyStationHalfWidthMm),
    point('EN-1 corridor switch', p.corridorSwitchAlongMm, p.electricalFaceMm, true),
    point('EN-2 bell / EN-7 conduit', p.bellAlongMm, p.electricalFaceMm, true),
    point('EN-3 gallery switch', -p.electricalFaceMm, -p.gallerySwitchFromDoorMm, false)]
}

/** Complete arcs, not just open endpoints. A sampling-error allowance bounds every intermediate angle by the furthest
 * hardware radius times half the sample step in radians. Opposite half-plane envelopes prove independent leaf operation.
 * This is a geometric fit check, NOT approval of the narrow passage, hardware, installation or accessible egress.
 */
export function checkEntryDoorPair(entry) {
  const issues = [], warnings = [], p = entry.doorPair, obstacles = entryDoorObstacles(entry), leaves = {}
  const need = (ok, message) => { if (!ok) issues.push(message) }
  need(entry.outerDoor.mountedAt === 'arrivalDoor', 'steel door must share the arrival opening')
  need(entry.outerDoor.opens === 'west-outside' && entry.arrivalDoor.opens === 'east-inside', 'paired leaves must open away from each other')
  for (const key of ['outerDoor', 'arrivalDoor']) {
    const d = entry[key], leaf = entryDoorLeaf(entry, key), steps = Math.ceil(leaf.maxDegrees / p.sampleDegrees)
    need(['north','south'].includes(d.hinge), `${key}: unknown hinge side`)
    need(leaf.maxDegrees > 0 && leaf.maxDegrees <= 90 && d.openAngleDegrees >= 0 && d.openAngleDegrees <= leaf.maxDegrees, `${key}: display angle / stop outside the checked arc`)
    const errorMm = Math.hypot(leaf.widthMm, Math.max(p.woodHandleReachMm,p.steelHandleReachMm)) * p.sampleDegrees * Math.PI / 360
    const clearances = obstacles.map(o => ({name:o.name, clearanceMm:Infinity}))
    for (let i = 0; i <= steps; i++) {
      const polygons = entryDoorLeafPolygons(entry,key,leaf.maxDegrees*i/steps)
      obstacles.forEach((o,j) => { clearances[j].clearanceMm = Math.min(clearances[j].clearanceMm, ...polygons.map(poly => polygonGap(poly,o.polygon)-errorMm)) })
    }
    for (const c of clearances) { need(c.clearanceMm >= p.obstacleMarginMm, `${key}: arc too close to ${c.name} (${Math.floor(c.clearanceMm)} mm)`); c.clearanceMm = Math.floor(c.clearanceMm) }
    leaves[key] = {...leaf, clearances}
  }
  const leafSeparationMm = entry.outerDoor.faceOffsetMm - entry.arrivalDoor.faceOffsetMm - p.woodHandleReachMm - p.steelHandleReachMm
  need(leafSeparationMm >= p.obstacleMarginMm, `closed and independently moving leaves lack face clearance (${leafSeparationMm} mm)`)
  // Remaining south-end throat with both leaves at their stops; conservative projection includes the entire wood handle envelope.
  const a = entry.arrivalDoor.maxOpenAngleDegrees * Math.PI / 180, wood = leaves.arrivalDoor
  const passageMm = Math.floor(wood.widthMm * (1 - Math.cos(a)) - p.woodHandleReachMm * Math.sin(a))
  if (passageMm < p.preferredPassageMm) warnings.push(`only about ${passageMm} mm conservative passage at the wooden stop; owner/fabricator must review access before adopting the pair`)
  warnings.push('wide single steel leaf and wooden leaf resizing need fabricator review; storage doors closed, no person or carrying-space check')
  return {ok:issues.length===0, issues, warnings, leaves, leafSeparationMm, passageMm}
}

/**
 * The owner's proposal (2026-10-05) to stand the AC outdoor unit in the bottom of the shoe rack (ENTRY.shoeRack.acBay), as
 * sizes in mm for one orientation ('across' or 'lengthwise'; default: the configured one): the width the unit needs across
 * the rack, how deep the bay becomes and how far it projects beyond the wall and the rack, and what is left for shoes.
 */
export function shoeRackAcBayGeometry(entry, orientation = entry.shoeRack.acBay.orientation) {
  const rack = entry.shoeRack, bay = rack.acBay, u = bay.unit, c = bay.clearance, lengthwise = orientation === 'lengthwise'
  const shoeBottomMm = bay.heightMm + bay.dividerMm
  // Across: coil at the back, fan face out. Lengthwise: valves at the wall line, coil end toward the outer grille.
  const neededWidthMm = lengthwise ? c.rearMm + u.depthMm + c.frontGapMm : u.widthMm + c.intakeSideMm + c.serviceSideMm
  const bayDepthMm = bay.wallThicknessMm + (lengthwise ? u.widthMm + c.intakeSideMm : c.rearMm + u.depthMm + c.frontGapMm)
  return {
    orientation, bayWidthMm: rack.widthMm, bayHeightMm: bay.heightMm, bayDepthMm, neededWidthMm,
    neededHeightMm: c.feetMm + u.heightMm + c.topMm,
    beyondWallMm: bayDepthMm - bay.wallThicknessMm, beyondRackMm: Math.max(0, bayDepthMm - rack.projectionMm),
    dischargeThrough: lengthwise ? `the ${bay.dischargeSide} side of the cage` : 'the outer face of the cage',
    grilleOpenFraction: Math.round((bay.grille.pitchMm - bay.grille.barMm) / bay.grille.pitchMm * 100) / 100,
    shoeBottomMm, shoeHeightLeftMm: rack.heightMm - shoeBottomMm,
    shoeHeightLostFraction: Math.round(shoeBottomMm / rack.heightMm * 100) / 100,
  }
}

/**
 * Does the outdoor unit fit the bay with room to breathe and be serviced? `issues` are things that do not work as drawn;
 * `unknowns` are site facts the answer still depends on. Typical figures only: the chosen model's manual governs.
 */
export function checkShoeRackAcBay(entry, orientation = entry.shoeRack.acBay.orientation) {
  const bay = entry.shoeRack.acBay, c = bay.clearance, g = shoeRackAcBayGeometry(entry, orientation)
  const issues = [], unknowns = [], need = (ok, message) => { if (!ok) issues.push(message) }
  need(['across', 'lengthwise'].includes(orientation), `unknown orientation ${orientation}`)
  need(g.bayWidthMm >= g.neededWidthMm, orientation === 'lengthwise'
    ? `the bay is ${g.bayWidthMm} mm wide; the unit turned lengthwise with air behind its coil needs ${g.neededWidthMm} mm`
    : `the bay is ${g.bayWidthMm} mm wide; the unit with air on one side and hands on the valve side needs ${g.neededWidthMm} mm`)
  need(g.bayHeightMm >= g.neededHeightMm, `the bay is ${g.bayHeightMm} mm high; the unit on its pads with air above needs ${g.neededHeightMm} mm`)
  need(c.frontGapMm <= c.frontToGrilleMaxMm, `the fan face would sit ${c.frontGapMm} mm behind the grille (at most ${c.frontToGrilleMaxMm}), so hot air would come back round into the intake`)
  need(g.grilleOpenFraction >= GRILLE_OPEN_FRACTION_MIN, `the grille is only ${Math.round(g.grilleOpenFraction * 100)}% open (needs ${GRILLE_OPEN_FRACTION_MIN * 100}%)`)
  need(g.shoeHeightLeftMm >= 1000, `only ${g.shoeHeightLeftMm} mm of rack height is left for shoes`)
  if (bay.outsideClearMm == null) unknowns.push(`free air beyond ${g.dischargeThrough} is not measured (needs about ${c.outsideFrontMm} mm, open to the sky, not a closed shaft or corridor)`)
  else need(bay.outsideClearMm >= c.outsideFrontMm, `only ${bay.outsideClearMm} mm of free air beyond ${g.dischargeThrough} (needs ${c.outsideFrontMm})`)
  if (orientation === 'lengthwise') unknowns.push('the opposite side of the cage must be open air too: the coil breathes through it')
  unknowns.push(`the platform would project ${g.beyondWallMm} mm beyond the outer wall face and carry about ${bay.unit.weightKg} kg more, with vibration (structural engineer and fabricator)`)
  unknowns.push(`the wall is assumed ${bay.wallThicknessMm} mm thick and the opening width is not measured (work-plan/OPEN_ITEMS.md A3); the rack is drawn ${g.bayWidthMm} mm wide`)
  return {ok: issues.length === 0, issues, unknowns, ...g}
}
