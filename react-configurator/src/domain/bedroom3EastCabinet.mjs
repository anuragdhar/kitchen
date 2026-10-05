// Pure checks for the Bedroom 3 east cabinetry (roomShellConfig.js bedroom3.furniture.eastCabinet). No React, Three.js
// or DOM. Millimetres in the room frame: x east from the west wall, z south from the north wall, heights above the floor.
//
// Owner 2026-10-05: the mirror dressing cabinet moved to the SOUTH end of the east wall and a full-height storage cabinet
// took its place at the NORTH end (docs/changes/2026-10-05-bedroom3-dressing-swap.md). These checks answer what that swap
// raises: can the doors of both units open, can a person stand at the mirror, is the toilet door clear, and what stands in
// front of the balcony window. Door leaves are taken open at 90 degrees; their swing is the quarter circle of their width.

export const EAST_CABINET_RULES = {
  toiletFrameMinMm: 100, // the front of the north unit stays at least this far east of the toilet door frame
  doorApproachMm: 900,   // the floor in front of a door, into the room, that a person walks through
  doorwayLineMm: 600,    // an open leaf this close to a door's wall, across the door's width, narrows the way through
  windowFrontMm: 600,    // anything taller than the sill within this of the window plane, across its width, covers part of it
  leafClearMm: 25,       // an open door leaf keeps at least this far from a wall or the bed
}

const round = v => Math.round(v * 10) / 10
const overlap = (a1, a2, b1, b2) => Math.min(a2, b2) - Math.max(a1, b1)

/** The units in plan and height: {key, label, x1, x2, z1, z2, bottom, top}. */
export function eastCabinetUnits(room) {
  const c = room.furniture.eastCabinet, W = room.widthMm
  const unit = (key, label, spec) => {
    const depth = spec.depthMm ?? c.depthMm, bottom = spec.bottomMm ?? 0
    return {key, label, x1: W - depth, x2: W, z1: spec.fromNorthMm, z2: spec.fromNorthMm + spec.widthMm, bottom, top: bottom + spec.heightMm, depthMm: depth}
  }
  const label = spec => spec.kind === 'dressing' ? 'mirror dressing cabinet' : spec.kind === 'storage' ? 'full-height storage cabinet' : 'low cabinet'
  return [unit('north', `north ${label(c.north)}`, c.north), unit('south', `south ${label(c.south)}`, c.south), unit('bridge', 'overhead run', c.bridge)]
}

/** The dressing unit (the one with a mirror) and the storage unit, whichever end they are at. */
export function eastCabinetRoles(room) {
  const c = room.furniture.eastCabinet, keys = ['north', 'south']
  return {dressing: keys.find(k => c[k].mirrorTopMm != null) ?? null, storage: keys.find(k => c[k].kind === 'storage') ?? null}
}

/** Where a unit standing at x1 with its front facing west leaves the toilet door frame (mm; negative = in the doorway). */
export function toiletFrameGapMm(room, depthMm) {
  const toilet = room.doors.find(d => /toilet/i.test(d.leadsTo ?? ''))
  return round(room.widthMm - depthMm - (toilet.fromMm + toilet.widthMm))
}

function bedRect(room) {
  const b = room.furniture.bed, W = room.widthMm
  return {x1: W - b.lengthMm, x2: W, z1: b.centerFromNorthMm - b.widthMm / 2, z2: b.centerFromNorthMm + b.widthMm / 2}
}

/**
 * A door leaf hinged on the front edge of a unit at zHinge, `widthMm` wide, lying toward `toward` (+1 south, -1 north)
 * when shut. Open at 90 degrees it stands out west from the hinge; while it turns it sweeps the quarter circle between.
 */
function leaf(xFront, zHinge, widthMm, toward, thicknessMm) {
  const [s1, s2] = toward > 0 ? [zHinge, zHinge + widthMm] : [zHinge - widthMm, zHinge]
  return {zHinge, widthMm, open: {x1: xFront - widthMm, x2: xFront, z1: zHinge - thicknessMm / 2, z2: zHinge + thicknessMm / 2}, sweep: {x1: xFront - widthMm, x2: xFront, z1: s1, z2: s2}}
}

/**
 * {ok, issues, warnings, units, measures, windowCover}. `issues` are clashes (a door that cannot open, a unit in a doorway,
 * a standing spot in the balcony door's path, an open door in front of the window); `warnings` are things the owner has to
 * accept or change (a unit standing in front of part of the window, an open leaf narrowing the toilet doorway).
 */
export function checkBedroom3EastCabinet(room, rules = EAST_CABINET_RULES) {
  const c = room.furniture.eastCabinet, p = c.panelMm, W = room.widthMm, L = room.lengthMm, H = room.heightMm
  const issues = [], warnings = [], need = (ok, text) => { if (!ok) issues.push(text) }
  const units = eastCabinetUnits(room), byKey = Object.fromEntries(units.map(u => [u.key, u])), bed = bedRect(room)
  const toilet = room.doors.find(d => /toilet/i.test(d.leadsTo ?? '')), b = room.southExtension.balcony
  const door = {x1: b.doorFromWestMm, x2: b.doorFromWestMm + b.doorWidthMm}, win = {x1: b.windowFromWestMm, x2: b.windowFromWestMm + b.windowWidthMm, bottom: b.windowSillMm, top: b.windowTopMm}
  const measures = {}

  for (const u of units) {
    need(u.z1 >= 0 && u.z2 <= L && u.x1 >= 0 && u.top <= H, `the ${u.label} leaves the room`)
    if (u.bottom < 600) {
      const gap = Math.max(bed.z1 - u.z2, u.z1 - bed.z2)
      need(gap >= 0 || overlap(u.x1, u.x2, bed.x1, bed.x2) <= 0, `the ${u.label} overlaps the bed`)
      measures[`${u.key}ToBedMm`] = round(gap)
    }
  }
  for (let i = 0; i < units.length; i++) for (let j = i + 1; j < units.length; j++) {
    const [a, q] = [units[i], units[j]]
    need(!(overlap(a.z1, a.z2, q.z1, q.z2) > 0 && overlap(a.bottom, a.top, q.bottom, q.top) > 0 && overlap(a.x1, a.x2, q.x1, q.x2) > 0), `the ${a.label} and the ${q.label} overlap`)
  }

  // The toilet door: no unit in its approach, and the north front a fair way east of its frame.
  const approach = {x1: toilet.fromMm, x2: toilet.fromMm + toilet.widthMm, z1: 0, z2: rules.doorApproachMm}
  for (const u of units) if (u.bottom < toilet.heightMm) need(!(overlap(u.x1, u.x2, approach.x1, approach.x2) > 0 && overlap(u.z1, u.z2, approach.z1, approach.z2) > 0), `the ${u.label} stands in front of the toilet door`)
  measures.toiletFrameGapMm = round(byKey.north.x1 - approach.x2)
  need(measures.toiletFrameGapMm >= rules.toiletFrameMinMm, `the north unit's front is ${measures.toiletFrameGapMm} mm from the toilet door frame (at least ${rules.toiletFrameMinMm})`)

  const leafIssues = (name, l) => {
    need(l.sweep.z1 >= rules.leafClearMm && l.sweep.z2 <= L - rules.leafClearMm, `the ${name} hits a wall as it opens`)
    const toBed = Math.max(bed.z1 - l.sweep.z2, l.sweep.z1 - bed.z2)
    need(toBed >= rules.leafClearMm || overlap(l.sweep.x1, l.sweep.x2, bed.x1, bed.x2) <= 0, `the ${name} hits the bed as it opens (${round(toBed)} mm)`)
    return round(toBed)
  }

  // The storage unit's leaves: a row of equal leaves, each pair hinged on its outer edges.
  const roles = eastCabinetRoles(room)
  if (roles.storage) {
    const s = c[roles.storage], u = byKey[roles.storage], count = s.doorCount || 2, width = (s.widthMm - 2 * p) / count
    measures.storageLeaves = []
    for (let i = 0; i < count; i++) {
      const north = i < count / 2, l = leaf(u.x1, north ? u.z1 + p : u.z2 - p, width, north ? 1 : -1, p)
      const name = `${north ? 'north' : 'south'}-hinged door ${i + 1} of the ${u.label}`, toBed = leafIssues(name, l)
      const intoDoorway = l.open.z1 < rules.doorwayLineMm ? round(overlap(l.open.x1, l.open.x2, approach.x1, approach.x2)) : 0
      if (intoDoorway > 0) warnings.push(`standing open, the ${name} reaches ${intoDoorway} mm into the line of the toilet doorway, ${round(l.open.z1)} mm off the north wall; shut it to walk through`)
      measures.storageLeaves.push({hinge: north ? 'north' : 'south', widthMm: round(width), toBedMm: toBed, intoToiletDoorwayMm: Math.max(0, intoDoorway)})
    }
  }

  // The dressing unit: its mirror door opens, and a person stands in front of the mirror.
  if (roles.dressing) {
    const s = c[roles.dressing], u = byKey[roles.dressing], hinge = s.mirrorHinge ?? 'north'
    const l = leaf(u.x1, hinge === 'north' ? u.z1 + p : u.z2 - p, s.widthMm - 2 * p, hinge === 'north' ? 1 : -1, p)
    const toBed = leafIssues('mirror door', l)
    const inFront = overlap(l.open.x1, l.open.x2, win.x1, win.x2) > 0 && L - l.open.z2 < rules.windowFrontMm
    need(!inFront, `standing open, the mirror door is ${round(L - l.open.z2)} mm in front of the balcony window`)
    need(overlap(l.sweep.x1, l.sweep.x2, door.x1, door.x2) <= 0 || l.sweep.z2 < L - rules.doorApproachMm, 'the mirror door swings into the path of the balcony door')
    measures.mirrorDoor = {hinge, widthMm: round(s.widthMm - 2 * p), toBedMm: toBed, openToSouthWallMm: round(L - l.open.z2), sweepToSouthWallMm: round(L - l.sweep.z2)}
    const depth = s.standDepthMm ?? 650, spot = {x1: u.x1 - depth, x2: u.x1, z1: u.z1, z2: u.z2}
    need(spot.x1 > 0 && spot.z1 >= 0 && spot.z2 <= L, 'the standing spot at the mirror leaves the room')
    need(overlap(spot.z1, spot.z2, bed.z1, bed.z2) <= 0 || overlap(spot.x1, spot.x2, bed.x1, bed.x2) <= 0, 'the bed is in the standing spot at the mirror')
    const doorPath = {x1: door.x1, x2: door.x2, z1: L - rules.doorApproachMm, z2: L}
    const inPath = overlap(spot.x1, spot.x2, doorPath.x1, doorPath.x2) > 0 && overlap(spot.z1, spot.z2, doorPath.z1, doorPath.z2) > 0
    need(!inPath, 'the standing spot at the mirror is in the path of the balcony door')
    measures.standingSpot = {...Object.fromEntries(Object.entries(spot).map(([k, v]) => [k, round(v)])), toBedMm: round(Math.max(bed.z1 - spot.z2, spot.z1 - bed.z2)), toBalconyDoorPathMm: round(spot.x1 - door.x2)}
  }

  // The balcony window: anything above the sill standing close in front of it, across its width.
  const windowCover = []
  for (const u of units) {
    const across = overlap(u.x1, u.x2, win.x1, win.x2), gap = L - u.z2, from = Math.max(u.bottom, win.bottom), to = Math.min(u.top, win.top)
    if (across > 0 && gap < rules.windowFrontMm && to > from) windowCover.push({unit: u.key, label: u.label, x1: round(Math.max(u.x1, win.x1)), x2: round(Math.min(u.x2, win.x2)), acrossMm: round(across), gapMm: round(gap), fromMm: from, toMm: to})
  }
  for (const w of windowCover) warnings.push(`the ${w.label} stands ${w.gapMm} mm in front of the east ${w.acrossMm} mm of the balcony window (x ${w.x1}-${w.x2}), from ${w.fromMm} to ${w.toMm} mm high`)
  return {ok: issues.length === 0, issues, warnings, units, measures, windowCover}
}
