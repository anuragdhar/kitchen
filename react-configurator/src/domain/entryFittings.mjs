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
    {id: 'corridor', order: 1, label: 'Corridor from the outer door to the arrival door', walkable: true, ceiling: 'PVC planks (false ceiling)', ...rect(doorX, s.planY2, b.x2, b.y2)},
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
  const o = entry.outerEntryOpening, d = entry.outerDoor
  const openingWidthMm = Math.round(mmZ(entry, o.toPlanY - o.fromPlanY)), openingHeightMm = o.heightMm
  const leafWidthMm = openingWidthMm - 2 * d.frameMm, leafHeightMm = openingHeightMm - d.frameMm - d.floorGapMm
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
  need(g.leafWidthMm >= 750 && g.leafWidthMm <= 1000, `leaf ${g.leafWidthMm} mm wide: not a single door leaf`)
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
  need(/outside$/.test(d.opens), 'a safety door opens outward, so it cannot be pushed in and does not take corridor space')
  need(['north', 'south'].includes(d.hinge), 'hinge must be on the north or south jamb of this west-wall opening')
  return {ok: issues.length === 0, issues, ...g}
}
