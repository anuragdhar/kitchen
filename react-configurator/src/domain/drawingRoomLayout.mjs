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

  const views = {
    westSofa: viewingFrom(room, f.sofa, 'east', [-750, 0, 750]),
    southSofa: viewingFrom(room, f.southSofa, 'north', [-750, 0, 750]),
  }
  need(views.southSofa.every(v => v.angleDeg <= 25 && v.distanceMm >= 2500 && v.distanceMm <= 5500), 'south sofa seats are outside 2.5-5.5 m and 25 degrees of the TV')
  return {ok: issues.length === 0, issues, clearances, views, geometry: g}
}
