// Pure placement and checks for the AC outdoor units of config/acOutdoorUnitsConfig.js (no React, Three.js or DOM).
// Plan frame: pixels, x growing WEST and y growing NORTH; `scale` is ENTRY.planScale (metres per pixel). Sizes in mm.

const COMPASS = {east: [-1, 0], west: [1, 0], north: [0, 1], south: [0, -1]} // unit vectors in plan pixels (x west, y north)

/** The compass direction as a vector: in the plan frame (x west, y north) or a room frame (x east, z south). */
export function compassVector(direction, frame = 'plan') {
  const [x, y] = COMPASS[direction]
  return frame === 'room' ? {x: -x, z: -y} : {x, z: y}
}

/** Where one unit stands: its casing rectangle on the plan (pixels and mm), against the rectangle the owner marked. */
export function outdoorUnitPlacement(unit, sizes, scale) {
  const size = sizes[unit.tons], mmX = scale.xMetresPerPixel * 1000, mmY = scale.zMetresPerPixel * 1000
  const alongY = unit.longAxis === 'north-south'
  const spanXmm = alongY ? size.depthMm : size.widthMm, spanYmm = alongY ? size.widthMm : size.depthMm
  const halfX = spanXmm / mmX / 2, halfY = spanYmm / mmY / 2
  const casing = {x1: unit.centre.planX - halfX, x2: unit.centre.planX + halfX, y1: unit.centre.planY - halfY, y2: unit.centre.planY + halfY}
  const markMm = {x: Math.round((unit.mark.x2 - unit.mark.x1) * mmX), y: Math.round((unit.mark.y2 - unit.mark.y1) * mmY)}
  const markCentre = {planX: (unit.mark.x1 + unit.mark.x2) / 2, planY: (unit.mark.y1 + unit.mark.y2) / 2}
  return {
    id: unit.id, size, casing, spanXmm, spanYmm, markMm,
    longerThanMarkMm: Math.max(0, Math.round((alongY ? spanYmm - markMm.y : spanXmm - markMm.x))),
    movedFromMarkMm: Math.round(Math.hypot((unit.centre.planX - markCentre.planX) * mmX, (unit.centre.planY - markCentre.planY) * mmY)),
    topMm: unit.bottomMm + size.heightMm,
  }
}

/** A plan point as millimetres in a room frame (x from the west wall, z from the north wall), given that room's plan bounds. */
export function planToRoomMm(bounds, widthMm, lengthMm, planX, planY) {
  return {x: (bounds[2] - planX) / (bounds[2] - bounds[0]) * widthMm, z: (bounds[3] - planY) / (bounds[3] - bounds[1]) * lengthMm}
}

/** Every unit has a known size, a sensible direction and its own place; `notes` say what is assumed for each. */
export function checkOutdoorUnits(units, sizes, scale) {
  const issues = [], notes = [], need = (ok, message) => { if (!ok) issues.push(message) }
  const placed = units.map(unit => {
    need(sizes[unit.tons], `${unit.serves}: no casing size for ${unit.tons} ton`)
    need(COMPASS[unit.fanFaces], `${unit.serves}: unknown fan direction ${unit.fanFaces}`)
    need((unit.longAxis === 'north-south') === ['east', 'west'].includes(unit.fanFaces), `${unit.serves}: the fan is on a long face, so it cannot blow ${unit.fanFaces} with the long side running ${unit.longAxis}`)
    const p = outdoorUnitPlacement(unit, sizes, scale)
    if (p.longerThanMarkMm > 0) notes.push(`${unit.serves}: the marked area is ${p.markMm.x} x ${p.markMm.y} mm; a ${unit.tons} ton casing is ${p.size.widthMm} x ${p.size.depthMm}, so it runs ${p.longerThanMarkMm} mm past the mark`)
    if (!unit.tonsKnown) notes.push(`${unit.serves}: tonnage not given; drawn as ${unit.tons} ton`)
    return p
  })
  for (let i = 0; i < placed.length; i++) for (let j = i + 1; j < placed.length; j++) {
    const a = placed[i].casing, b = placed[j].casing
    need(a.x2 <= b.x1 || b.x2 <= a.x1 || a.y2 <= b.y1 || b.y2 <= a.y1, `${units[i].serves} and ${units[j].serves}: the casings overlap`)
  }
  return {ok: issues.length === 0, issues, notes, placed}
}
