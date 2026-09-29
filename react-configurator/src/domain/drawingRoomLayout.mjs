// Pure checks for the Drawing Room TV wall and seating (millimetres, no React/Three).
// Room frame: x from the west wall, z from the north wall, y up. Sofas are widthMm deep
// and lengthMm long; the west sofa faces east, the south sofa faces north.

const rect = (cx, cz, sizeX, sizeZ) => ({x1: cx - sizeX / 2, x2: cx + sizeX / 2, z1: cz - sizeZ / 2, z2: cz + sizeZ / 2})
const gap = (a, b) => Math.max(a.x1 - b.x2, b.x1 - a.x2, a.z1 - b.z2, b.z1 - a.z2)

export function tvWallGeometry(room) {
  const w = room.tvWall
  const bayWidth = w.widthMm - 2 * w.columnWidthMm
  const clearColumn = w.columnWidthMm - 2 * w.panelMm
  const depthClear = w.depthMm - w.backMm
  return {
    bayWidth, clearColumn, depthClear,
    bayWest: w.fromWestMm + w.columnWidthMm,
    bayCenterX: w.fromWestMm + w.columnWidthMm + bayWidth / 2,
    tvCenterY: w.tv.bottomMm + w.tv.heightMm / 2,
    tvTopMm: w.tv.bottomMm + w.tv.heightMm,
    endMm: w.fromWestMm + w.widthMm,
    columns: {west: w.fromWestMm, east: w.fromWestMm + w.widthMm - w.columnWidthMm},
  }
}

/** Viewing distance (mm) and angle off the direction a sofa faces (deg) to the TV centre. */
export function viewingFrom(room, sofa, faces, seatOffsetsMm = [0]) {
  const {bayCenterX} = tvWallGeometry(room)
  const tvZ = room.tvWall.depthMm - room.tvWall.tv.setbackMm - room.tvWall.tv.depthMm
  return seatOffsetsMm.map(offset => {
    const seatX = faces === 'east' ? sofa.centerXmm : sofa.centerXmm + offset
    const seatZ = faces === 'east' ? sofa.centerZmm + offset : sofa.centerZmm
    const dx = bayCenterX - seatX, dz = tvZ - seatZ
    const facing = faces === 'east' ? [1, 0] : [0, -1]
    const distance = Math.hypot(dx, dz)
    const angle = Math.acos((dx * facing[0] + dz * facing[1]) / distance) * 180 / Math.PI
    return {distanceMm: Math.round(distance), angleDeg: Math.round(angle)}
  })
}

export function checkDrawingRoomLayout(room) {
  const issues = [], w = room.tvWall, g = tvWallGeometry(room), f = room.furniture
  const need = (ok, message) => { if (!ok) issues.push(message) }
  const door = room.doors.find(d => d.wall === 'north')

  need(g.endMm <= door.fromMm - 30, `cabinet ends at ${g.endMm} mm but the entry door opening starts at ${door.fromMm} mm (needs 30 mm clear)`)
  need(w.depthMm >= 290 && w.depthMm <= 330, `cabinet depth ${w.depthMm} mm is not about one foot (305 mm)`)
  need(w.heightMm < room.heightMm, 'cabinet must be lower than the ceiling')
  need(g.bayWidth >= w.tv.widthMm + 80, `TV bay ${g.bayWidth} mm is under TV width ${w.tv.widthMm} + 80 mm`)
  need(w.tv.diagonalInches <= 65, 'TV larger than the 65-inch brief')
  need(w.tv.depthMm + w.tv.setbackMm + 20 <= g.depthClear, 'TV and its set-back do not fit the cabinet depth')
  need(w.tv.bottomMm >= w.bay.floorMm + w.soundbar.heightMm + 10, 'TV bottom edge is not above the soundbar')
  need(g.tvTopMm + 60 <= w.bay.topMm, `TV top ${g.tvTopMm} mm leaves under 60 mm below the bay top ${w.bay.topMm} mm`)
  need(w.soundbar.widthMm <= g.bayWidth - 100, 'soundbar is too wide for the TV bay')
  need(w.soundbar.depthMm + w.soundbar.frontSetbackMm <= g.depthClear, 'soundbar does not fit the bay depth')
  const niche = (name, item, shelf, top) => {
    need(item.widthMm + 10 <= g.clearColumn, `${name} is ${item.widthMm} mm wide but the niche is ${g.clearColumn} mm clear`)
    need(item.heightMm + 20 <= top - shelf - w.panelMm, `${name} is too tall for its niche`)
    need(item.depthMm + 20 <= g.depthClear, `${name} is too deep for its niche`)
  }
  const bm = w.bassModule, bmX = g.bayWest + g.bayWidth * bm.centerFromBayWestFraction
  need(bm.widthMm + 100 <= g.bayWidth / 2, 'bass module does not fit the west half of the centre base')
  need(bm.heightMm + 40 <= w.bay.floorMm - (w.plinthMm + w.panelMm) - w.panelMm, 'bass module is too tall for the centre base')
  need(bm.depthMm + bm.frontGapMm <= g.depthClear, `bass module ${bm.depthMm} mm deep does not fit ${g.depthClear} mm behind its lattice`)
  need(bmX - bm.widthMm / 2 >= 300, 'bass module is within 300 mm of the west wall (corner boom)')
  need(Math.abs(bmX - g.bayCenterX) <= 1000, 'bass module is more than 1 m from the soundbar')
  niche('landline phone', w.phones.landline, w.phones.shelfMm, w.phones.nicheTopMm)
  need(w.phones.intercom.bottomMm >= w.phones.shelfMm + w.phones.landline.heightMm + 20, 'intercom overlaps the landline phone')
  need(w.phones.intercom.bottomMm + w.phones.intercom.heightMm + 20 <= w.phones.nicheTopMm, 'intercom is too tall for the phone niche')
  need(w.router.shelfMm >= w.bay.topMm && w.router.shelfMm + w.router.heightMm + w.router.antennaMm + 20 <= w.router.topMm, 'router and antennas do not fit their ventilated bay')
  need(g.bayWidth >= w.router.widthMm + 100, 'router is wider than its bay')

  const cabinet = {x1: w.fromWestMm, x2: g.endMm, z1: 0, z2: w.depthMm}
  const items = {
    westSofa: rect(f.sofa.centerXmm, f.sofa.centerZmm, f.sofa.widthMm, f.sofa.lengthMm),
    southSofa: rect(f.southSofa.centerXmm, f.southSofa.centerZmm, f.southSofa.lengthMm, f.southSofa.widthMm),
    table: rect(f.coffeeTable.centerXmm, f.coffeeTable.centerZmm, f.coffeeTable.widthMm, f.coffeeTable.lengthMm),
  }
  for (const [name, r] of Object.entries(items)) {
    need(r.x1 >= 0 && r.x2 <= room.widthMm && r.z1 >= 0 && r.z2 <= room.lengthMm, `${name} leaves the room`)
    need(gap(r, cabinet) > 600, `${name} is within 600 mm of the TV cabinet`)
  }
  const clearances = {
    westSofaToTable: gap(items.westSofa, items.table),
    southSofaToTable: gap(items.southSofa, items.table),
    westSofaToSouthSofa: gap(items.westSofa, items.southSofa),
    southSofaEastEnd: items.southSofa.x2,
    tableEastEdge: items.table.x2,
  }
  need(clearances.westSofaToTable >= 400, 'west sofa is under 400 mm from the coffee table')
  need(clearances.southSofaToTable >= 400, 'south sofa is under 400 mm from the coffee table')
  need(clearances.westSofaToSouthSofa >= 600, 'passage between the two sofas is under 600 mm')
  need(clearances.southSofaEastEnd <= door.fromMm + 200, 'south sofa blocks the walking line from the entry door to the east opening')
  need(clearances.tableEastEdge <= door.fromMm, 'coffee table reaches into the walking line from the entry door')
  // Same size, as asked: the second sofa matches the first.
  need(f.southSofa.widthMm === f.sofa.widthMm && f.southSofa.lengthMm === f.sofa.lengthMm, 'south sofa must match the west sofa size')

  issues.push(...doorSwingIssues(room, {
    'TV cabinet': cabinet, 'west sofa': items.westSofa, 'south sofa': items.southSofa, 'coffee table': items.table,
  }))

  const views = {
    westSofa: viewingFrom(room, f.sofa, 'east', [-750, 0, 750]),
    southSofa: viewingFrom(room, f.southSofa, 'north', [-750, 0, 750]),
  }
  need(views.southSofa.every(v => v.angleDeg <= 25 && v.distanceMm >= 2500 && v.distanceMm <= 5500), 'south sofa seats are outside 2.5-5.5 m and 25 degrees of the TV')
  return {ok: issues.length === 0, issues, clearances, views, geometry: g}
}

// ---- Alternative layout "B": corner sofas, TV wall-mounted on the east wall ----

export const WALL_FACE_MM = 40 // half of the drawn wall thickness, see WholeHome3D WALL_THICKNESS_M

export function cornerTvFrontX(room) {
  const c = room.cornerLayout
  return room.widthMm - WALL_FACE_MM - c.tv.depthMm - c.tv.mountMm
}

/** Distance and off-axis angle from a seat to the east-wall TV centre. facing is a unit [dx, dz]. */
export function viewingToCornerTv(room, seatX, seatZ, facing) {
  const c = room.cornerLayout
  const dx = cornerTvFrontX(room) - seatX, dz = c.tv.centerFromNorthMm - seatZ
  const distance = Math.hypot(dx, dz)
  const angle = Math.acos((dx * facing[0] + dz * facing[1]) / distance) * 180 / Math.PI
  return {distanceMm: Math.round(distance), angleDeg: Math.round(angle)}
}

export function checkCornerLayout(room) {
  const issues = [], c = room.cornerLayout, f = c.furniture
  const need = (ok, message) => { if (!ok) issues.push(message) }
  const door = room.doors.find(d => d.wall === 'north')
  const doorEast = door.fromMm + door.widthMm
  const stubEnd = room.wallOpenings.east.fromMm // the east wall is solid from z 0 to here
  const northSofa = rect(f.northSofa.centerXmm, f.northSofa.centerZmm, f.northSofa.lengthMm, f.northSofa.widthMm)
  const westSofa = rect(f.westSofa.centerXmm, f.westSofa.centerZmm, f.westSofa.widthMm, f.westSofa.lengthMm)
  const table = rect(f.coffeeTable.centerXmm, f.coffeeTable.centerZmm, f.coffeeTable.widthMm, f.coffeeTable.lengthMm)
  const tvFront = cornerTvFrontX(room)
  const bm = c.bassModule, tv = c.tv, sb = c.soundbar, rc = c.routerCabinet

  need(f.northSofa.widthMm === f.westSofa.widthMm && f.northSofa.lengthMm === f.westSofa.lengthMm, 'the two sofas must be the same size')
  for (const [name, r] of Object.entries({northSofa, westSofa, table})) {
    need(r.x1 >= 0 && r.x2 <= room.widthMm && r.z1 >= 0 && r.z2 <= room.lengthMm, `${name} leaves the room`)
  }
  const sofaGap = gap(northSofa, westSofa)
  need(sofaGap >= 0 && sofaGap <= 150, `sofas are ${sofaGap} mm apart; an L needs 0-150 mm`)
  const clearances = {
    northSofaToTable: gap(northSofa, table),
    westSofaToTable: gap(westSofa, table),
    sofaToSofa: sofaGap,
    laneNorthSofaToTv: tvFront - northSofa.x2,
    laneTableToTv: tvFront - table.x2,
    doorClearPastNorthSofa: doorEast - northSofa.x2,
    northSofaPastDoorJambLine: Math.max(0, northSofa.x2 - door.fromMm),
    tvFrontBeyondDoorEastJamb: tvFront - doorEast,
  }
  need(clearances.northSofaToTable >= 400 && clearances.westSofaToTable >= 400, 'a sofa is under 400 mm from the coffee table')
  need(clearances.laneNorthSofaToTv >= 900, `the lane between the north sofa and the TV is ${clearances.laneNorthSofaToTv} mm (needs 900)`)
  need(clearances.doorClearPastNorthSofa >= 800, `only ${clearances.doorClearPastNorthSofa} mm of the entry door stays clear past the north sofa`)
  need(clearances.tvFrontBeyondDoorEastJamb >= 50, 'TV front is inside the entry door opening line')

  const tvZ1 = tv.centerFromNorthMm - tv.widthMm / 2, tvZ2 = tv.centerFromNorthMm + tv.widthMm / 2
  need(tv.diagonalInches <= 65, 'TV larger than the 65-inch brief')
  need(tvZ1 >= 300, `TV starts ${tvZ1} mm from the door wall (needs 300)`)
  need(tvZ2 <= stubEnd - 200, `TV ends ${tvZ2} mm from the north wall but the solid wall stops at ${stubEnd - 200} mm`)
  need(tv.bottomMm >= sb.heightMm + sb.gapBelowTvMm + 600, 'no room for the soundbar under the TV')
  need(sb.widthMm <= tv.widthMm, 'soundbar wider than the TV')
  need(sb.depthMm <= 120, 'wall-mounted soundbar protrudes more than 120 mm into the walkway')
  need(bm.centerFromNorthMm - bm.widthMm / 2 >= 300 && bm.centerFromNorthMm + bm.widthMm / 2 <= stubEnd - 150, 'bass module is in the door corner or beyond the solid wall')
  const bmFront = room.widthMm - WALL_FACE_MM - bm.fromWallMm - bm.depthMm
  // The lane at the module is bounded by whatever stands level with it (same z range), not by the north sofa.
  const bmZ1 = bm.centerFromNorthMm - bm.widthMm / 2, bmZ2 = bm.centerFromNorthMm + bm.widthMm / 2
  const beside = [northSofa, westSofa, table].filter(r => r.z1 < bmZ2 && r.z2 > bmZ1)
  clearances.laneBassModule = bmFront - Math.max(0, ...beside.map(r => r.x2))
  need(clearances.laneBassModule >= 700, `bass module narrows the walking lane to ${clearances.laneBassModule} mm (needs 700)`)
  need(rc.fromWestMm >= northSofa.x1 && rc.fromWestMm + rc.widthMm <= northSofa.x2, 'router cabinet is not above the north sofa')
  need(rc.bottomMm >= 1400 && rc.bottomMm + rc.heightMm <= 2200, 'router cabinet is outside 1400-2200 mm high')
  const compartment = (rc.widthMm - 4 * rc.panelMm) / 3
  need(rc.router.widthMm + 20 <= compartment && rc.router.depthMm + 20 <= rc.depthMm, 'router does not fit its compartment')
  need(rc.router.heightMm + rc.router.antennaMm + 40 <= rc.heightMm - 2 * rc.panelMm, 'router antennas do not fit')

  issues.push(...doorSwingIssues(room, {
    'north sofa': northSofa, 'west sofa': westSofa, 'coffee table': table, 'wall-mounted TV': {x1: tvFront, z1: tvZ1, x2: room.widthMm, z2: tvZ2}, 'north cabinet': {x1: rc.fromWestMm, z1: 0, x2: rc.fromWestMm + rc.widthMm, z2: rc.depthMm},
  }))
  const seats = [-750, 0, 750]
  const views = {
    westSofa: seats.map(o => viewingToCornerTv(room, f.westSofa.centerXmm, f.westSofa.centerZmm + o, [1, 0])),
    northSofa: seats.map(o => viewingToCornerTv(room, f.northSofa.centerXmm + o, f.northSofa.centerZmm, [0, 1])),
  }
  need(views.westSofa.every(v => v.angleDeg <= 35 && v.distanceMm >= 2000 && v.distanceMm <= 4000), 'west sofa seats are outside 2-4 m and 35 degrees of the TV')
  return {ok: issues.length === 0, issues, clearances, views, tvFront}
}

// ---- Options B2 (18-inch low console + arm TV) and B3 (ceiling projector) ----

const faceX = room => room.widthMm - WALL_FACE_MM
const bearing = (seat, facing, target) => {
  const dx = target.x - seat.x, dz = target.z - seat.z, distance = Math.hypot(dx, dz)
  return {distanceMm: Math.round(distance), angleDeg: Math.round(Math.acos((dx * facing[0] + dz * facing[1]) / distance) * 180 / Math.PI)}
}

export function consoleGeometry(room) {
  const k = room.cornerLayout.console, face = faceX(room)
  return {face, frontX: face - k.depthMm, z1: k.fromNorthMm, z2: k.fromNorthMm + k.lengthMm, topMm: k.heightMm}
}

/**
 * Where the TV centre and its most forward edge are when the wall arm is pulled out `extendMm` and the screen is turned
 * `swivelDeg` toward the NORTH (door and north-sofa side). Turning north brings the SOUTH end of the screen forward.
 */
export function armPose(room, tvKey, extendMm = 0, swivelDeg = 0) {
  const k = room.cornerLayout.console, tv = k.tvs[tvKey], phi = swivelDeg * Math.PI / 180
  const x = faceX(room) - k.arm.plateMm - tv.depthMm / 2 - extendMm * Math.cos(phi)
  const z = k.tvCenterFromNorthMm - extendMm * Math.sin(phi)
  return {x, z, yawDeg: swivelDeg, frontX: x - (tv.widthMm / 2 * Math.sin(phi) + tv.depthMm / 2 * Math.cos(phi))}
}

/** Angle between the screen normal and the line from the screen centre to a seat (how far off-axis the picture is seen). */
export function pictureOffAxis(pose, seat) {
  const phi = pose.yawDeg * Math.PI / 180, nx = -Math.cos(phi), nz = -Math.sin(phi)
  const dx = seat.x - pose.x, dz = seat.z - pose.z, d = Math.hypot(dx, dz)
  return Math.round(Math.acos((dx * nx + dz * nz) / d) * 180 / Math.PI)
}

/** Why a floor-to-ceiling unit of the given depth cannot go on the east wall in layout B. */
export function fullHeightEastUnit(room, depthMm = 457) {
  const c = room.cornerLayout, f = c.furniture, face = faceX(room), k = c.console
  const northSofaEnd = f.northSofa.centerXmm + f.northSofa.lengthMm / 2
  const northSofaZ2 = f.northSofa.centerZmm + f.northSofa.widthMm / 2
  const stubEnd = room.wallOpenings.east.fromMm
  const southOfSofa = stubEnd - (northSofaZ2 + 20)
  return {
    laneBesideNorthSofa: face - depthMm - northSofaEnd,
    deepestUnitForAWalkableLane: face - northSofaEnd - 800,
    lengthClearOfNorthSofa: southOfSofa,
    bayNeeded: Object.fromEntries(Object.entries(k.tvs).map(([key, tv]) => [key, tv.widthMm + 80])),
    fits: false,
  }
}

export function checkCornerConsole(room) {
  const issues = [], c = room.cornerLayout, k = c.console, f = c.furniture, g = consoleGeometry(room)
  const need = (ok, message) => { if (!ok) issues.push(message) }
  const stubEnd = room.wallOpenings.east.fromMm
  const northSofa = rect(f.northSofa.centerXmm, f.northSofa.centerZmm, f.northSofa.lengthMm, f.northSofa.widthMm)
  const westSofa = rect(f.westSofa.centerXmm, f.westSofa.centerZmm, f.westSofa.widthMm, f.westSofa.lengthMm)
  const table = rect(f.coffeeTable.centerXmm, f.coffeeTable.centerZmm, f.coffeeTable.widthMm, f.coffeeTable.lengthMm)
  const overlapsZ = r => r.z1 < g.z2 && r.z2 > g.z1

  need(Math.abs(k.depthMm - 457) <= 15, 'the console is not about 18 inches (457 mm) deep')
  need(k.heightMm <= 600, 'the console is too tall to sit under a wall-mounted TV')
  need(g.z1 >= northSofa.z2 + 20, `the console starts at z ${g.z1}, under 20 mm clear of the north sofa (ends ${northSofa.z2})`)
  need(g.z2 <= stubEnd, `the console runs to z ${g.z2} but the solid east wall stops at ${stubEnd}`)
  const lane = g.frontX - Math.max(0, ...[northSofa, westSofa, table].filter(overlapsZ).map(r => r.x2))
  need(lane >= 800, `the walkway beside the console is ${lane} mm (needs 800)`)

  issues.push(...doorSwingIssues(room, {
    'north sofa': northSofa, 'west sofa': westSofa, 'coffee table': table, 'console': {x1: g.frontX, z1: g.z1, x2: g.face, z2: g.z2},
  }))
  const bm = c.bassModule, sb = c.soundbar
  need(bm.widthMm + 100 <= k.moduleBayMm, 'the bass module does not fit its bay')
  need(bm.depthMm + 30 <= k.depthMm - k.backMm - 20, 'the bass module is too deep for the console')
  need(bm.heightMm + 40 <= k.heightMm - 2 * k.panelMm, 'the bass module is too tall for the console')
  const sbZ1 = k.soundbarCenterFromNorthMm - sb.widthMm / 2, sbZ2 = k.soundbarCenterFromNorthMm + sb.widthMm / 2
  need(sbZ1 >= g.z1 && sbZ2 <= g.z2, 'the soundbar hangs over an end of the console')
  need(sb.depthMm <= k.depthMm - 40, 'the soundbar is too deep for the console top')

  const tvs = {}
  for (const [key, tv] of Object.entries(k.tvs)) {
    const z1 = k.tvCenterFromNorthMm - tv.widthMm / 2, z2 = k.tvCenterFromNorthMm + tv.widthMm / 2
    need(z1 >= 300, `the ${key}-inch TV starts ${z1} mm from the door wall (needs 300)`)
    need(z2 <= stubEnd - 30, `the ${key}-inch TV ends at z ${z2}; the solid wall stops at ${stubEnd} (needs 30 mm spare)`)
    need(k.tvBottomMm >= k.heightMm + sb.heightMm + 40, `the ${key}-inch TV bottom edge is not clear of the soundbar`)
    need(k.tvBottomMm + tv.heightMm <= 1900, `the ${key}-inch TV top is above 1900 mm`)
    tvs[key] = {zRange: [z1, z2], top: k.tvBottomMm + tv.heightMm}
  }

  // Arm poses: parked flat on the wall, and pulled out and turned toward the north sofa.
  const seats = {northSofa: {x: f.northSofa.centerXmm, z: f.northSofa.centerZmm, facing: [0, 1]}, westSofa: {x: f.westSofa.centerXmm, z: f.westSofa.centerZmm, facing: [1, 0]}}
  const poses = {}
  for (const key of Object.keys(k.tvs)) {
    const parked = armPose(room, key, 0, 0)
    const watch = armPose(room, key, k.arm.watchExtendMm, k.arm.watchSwivelDeg)
    const full = armPose(room, key, k.arm.maxExtendMm, k.arm.watchSwivelDeg)
    const result = {}
    for (const [name, pose] of [['parked', parked], ['watch', watch]]) {
      result[name] = {
        frontX: Math.round(pose.frontX),
        headTurn: Object.fromEntries(Object.entries(seats).map(([s, seat]) => [s, bearing(seat, seat.facing, pose)])),
        pictureOffAxis: Object.fromEntries(Object.entries(seats).map(([s, seat]) => [s, pictureOffAxis(pose, seat)])),
        laneToTable: Math.round(pose.frontX - table.x2),
      }
    }
    result.fullReachLaneToTable = Math.round(full.frontX - table.x2)
    const tvBox = pose => ({x1: pose.frontX, z1: pose.z - k.tvs[key].widthMm / 2, x2: pose.frontX + k.tvs[key].depthMm + 60, z2: pose.z + k.tvs[key].widthMm / 2})
    result.doorBlockedByTvAtDeg = {parked: doorBlockedAt(room, tvBox(parked), 'east'), watch: doorBlockedAt(room, tvBox(watch), 'east')}
    poses[key] = result
    need(result.parked.laneToTable >= 800, `with the ${key}-inch TV flat, the walkway to the coffee table is ${result.parked.laneToTable} mm`)
    need(result.watch.laneToTable >= 700, `with the ${key}-inch TV pulled out for watching, the walkway is ${result.watch.laneToTable} mm`)
  }
  return {ok: issues.length === 0, issues, geometry: g, lane, tvs, poses, fullHeight: fullHeightEastUnit(room)}
}

export function projectorPlacement(room) {
  const c = room.cornerLayout, p = c.projector, face = faceX(room)
  const x = face - p.throwRatio * p.widthMm
  const z = p.centerFromNorthMm
  const f = c.furniture
  const over = x >= f.westSofa.centerXmm - f.westSofa.widthMm / 2 && x <= f.westSofa.centerXmm + f.westSofa.widthMm / 2 ? 'west sofa'
    : Math.abs(x - f.coffeeTable.centerXmm) < f.coffeeTable.widthMm / 2 + 200 ? 'coffee table' : 'open floor'
  return {x, z, y: room.heightMm - p.ceilingDropMm, throwMm: p.throwRatio * p.widthMm, over}
}

export function checkCornerProjector(room) {
  const issues = [], c = room.cornerLayout, p = c.projector, k = c.console, sb = c.soundbar
  const need = (ok, message) => { if (!ok) issues.push(message) }
  const stubEnd = room.wallOpenings.east.fromMm
  const z1 = p.centerFromNorthMm - p.widthMm / 2, z2 = p.centerFromNorthMm + p.widthMm / 2
  need(z1 >= 100 && z2 <= stubEnd - 100, `the ${p.screenDiagonalInches}-inch screen (z ${Math.round(z1)}-${Math.round(z2)}) needs 100 mm spare either side on the solid wall`)
  need(p.bottomMm >= k.heightMm + sb.heightMm + 50, 'the screen bottom edge would sit on the soundbar')
  need(Math.abs(Math.hypot(p.widthMm, p.heightMm) / 25.4 - p.screenDiagonalInches) < 0.6, 'screen width and height do not match the stated diagonal')
  need(Math.abs(p.widthMm / p.heightMm - 16 / 9) < 0.02, 'the screen is not 16:9')
  const f = c.furniture, sofaRect = (item, alongX) => alongX ? {x1: item.centerXmm - item.lengthMm / 2, z1: item.centerZmm - item.widthMm / 2, x2: item.centerXmm + item.lengthMm / 2, z2: item.centerZmm + item.widthMm / 2} : {x1: item.centerXmm - item.widthMm / 2, z1: item.centerZmm - item.lengthMm / 2, x2: item.centerXmm + item.widthMm / 2, z2: item.centerZmm + item.lengthMm / 2}
  issues.push(...doorSwingIssues(room, {'north sofa': sofaRect(f.northSofa, true), 'west sofa': sofaRect(f.westSofa, false)}))
  const place = projectorPlacement(room)
  need(place.x > 300 && place.x < faceX(room), 'the projector would be outside the room')
  need(room.heightMm - p.ceilingDropMm - p.body.heightMm >= 2300, 'the projector hangs lower than 2300 mm')
  return {ok: issues.length === 0, issues, placement: place, screen: {zRange: [z1, z2]}}
}

// ---- Entry door swing (the door opens INTO the room) ----

export const DOOR_MIN_OPEN_DEG = 85 // a door that cannot open at least this far is treated as blocked
const LEAF_THICKNESS_MM = 40

/** Smallest opening angle (degrees) at which the door leaf touches the rectangle, or null if it never does. */
export function doorBlockedAt(room, rectangle, hinge) {
  const d = room.doors.find(door => door.wall === 'north')
  const hingeX = hinge === 'east' ? d.fromMm + d.widthMm : d.fromMm
  const direction = hinge === 'east' ? -1 : 1
  const half = LEAF_THICKNESS_MM / 2
  for (let deg = 0; deg <= 90; deg += 1) {
    const a = deg * Math.PI / 180
    for (let t = 0; t <= 1; t += 0.01) {
      const x = hingeX + direction * d.leafMm * t * Math.cos(a), z = d.leafMm * t * Math.sin(a)
      if (x > rectangle.x1 - half && x < rectangle.x2 + half && z > rectangle.z1 - half && z < rectangle.z2 + half) return deg
    }
  }
  return null
}

/** Widest door leaf (mm) for which the rectangle never stops the door before DOOR_MIN_OPEN_DEG; null if no leaf width clears it. */
export function maxLeafThatClears(room, rectangle, hinge) {
  let widest = null
  for (let leaf = 100; leaf <= room.doors.find(door => door.wall === 'north').widthMm; leaf += 5) {
    const test = {...room, doors: room.doors.map(door => (door.wall === 'north' ? {...door, leafMm: leaf} : door))}
    const stopped = doorBlockedAt(test, rectangle, hinge)
    if (stopped === null || stopped >= DOOR_MIN_OPEN_DEG) widest = leaf
    else break
  }
  return widest
}

/** Issues for every item (name -> {x1,z1,x2,z2}) that stops the inward-opening entry door before DOOR_MIN_OPEN_DEG. */
export function doorSwingIssues(room, items) {
  const d = room.doors.find(door => door.wall === 'north')
  if (d.opensInto !== room.name) return []
  const hinges = d.hingeKnown ? [d.hinge] : ['east', 'west']
  const issues = []
  for (const [name, rectangle] of Object.entries(items)) {
    const blocks = hinges.map(hinge => ({hinge, deg: doorBlockedAt(room, rectangle, hinge)})).filter(b => b.deg !== null && b.deg < DOOR_MIN_OPEN_DEG)
    if (blocks.length) issues.push(`the ${name} stops the inward-opening entry door at ${Math.min(...blocks.map(b => b.deg))} degrees (${blocks.map(b => `${b.hinge} hinge: ${b.deg}`).join(', ')}); it must open ${DOOR_MIN_OPEN_DEG}+`)
  }
  return issues
}
