// The openings in each wall of a room shell (config/roomShellConfig.js), as the room pages cut them (pure: no React,
// Three.js or DOM). Metres in the room frame: x east from the west wall, z south from the north wall; `from`/`to` run
// along the wall from its west (north and south walls) or north (east and west walls) end, `bottom`/`top` are heights.
const mm = value => value / 1000

/**
 * Openings of one wall, sorted along it. `kind` is 'passage' (an open gap or a built-in recess: wall cut, nothing drawn in
 * it), 'door', 'window' or 'glassDoor'. A window or glass door carries `design` (the millimetre config entry) when the
 * entry has design fields, so the shared window builder can draw the transom, shutters, nets and outside screen.
 */
export function roomWallOpenings(room, side) {
  const W = mm(room.widthMm), H = mm(room.heightMm)
  const result = []
  const passage = room.wallOpenings?.[side]
  if (passage) result.push({kind: 'passage', from: mm(passage.fromMm), to: mm(passage.toMm), bottom: 0, top: H})
  if (side === 'north' && room.wallStorage) { const st = room.wallStorage; result.push({kind: 'passage', from: mm(st.fromWestMm), to: mm(st.fromWestMm + st.widthMm), bottom: mm(st.bottomMm), top: mm(st.bottomMm + st.heightMm)}) }
  const recess = room.furniture?.northEastRecessWardrobe
  if (side === 'north' && recess) result.push({kind: 'passage', from: W - mm(recess.fromEastMm + recess.widthMm), to: W - mm(recess.fromEastMm), bottom: 0, top: H})
  if (side === 'south' && room.southExtension) {
    const {cabinet, balcony} = room.southExtension
    result.push({kind: 'passage', from: mm(cabinet.fromWestMm), to: mm(cabinet.fromWestMm + cabinet.widthMm), bottom: mm(cabinet.floorClearanceMm), top: mm(cabinet.floorClearanceMm + cabinet.heightMm)})
    // `design` (transom, rails) lets the shared window builder draw the scanned top lights and mid rail; absent fields draw as before.
    const doorDesign = balcony.doorTransomMm ? {fromMm: balcony.doorFromWestMm, widthMm: balcony.doorWidthMm, bottomMm: 0, topMm: balcony.doorHeightMm, transomMm: balcony.doorTransomMm} : undefined
    const windowDesign = balcony.windowTransomMm || balcony.windowRailsMm ? {fromMm: balcony.windowFromWestMm, widthMm: balcony.windowWidthMm, bottomMm: balcony.windowSillMm, topMm: balcony.windowTopMm, transomMm: balcony.windowTransomMm, railsMm: balcony.windowRailsMm} : undefined
    result.push({kind: 'glassDoor', from: mm(balcony.doorFromWestMm), to: mm(balcony.doorFromWestMm + balcony.doorWidthMm), bottom: 0, top: mm(balcony.doorHeightMm), frameStyle: 'dark', design: doorDesign})
    result.push({kind: 'window', from: mm(balcony.windowFromWestMm), to: mm(balcony.windowFromWestMm + balcony.windowWidthMm), bottom: mm(balcony.windowSillMm), top: mm(balcony.windowTopMm), frameStyle: 'dark', mullionFractions: [], design: windowDesign})
  }
  for (const door of room.doors || []) if (door.wall === side) result.push({kind: 'door', from: mm(door.fromMm), to: mm(door.fromMm + door.widthMm), bottom: 0, top: mm(door.heightMm)})
  for (const window of room.windows || []) if (window.wall === side) result.push({kind: 'window', from: mm(window.fromMm), to: mm(window.fromMm + window.widthMm), bottom: mm(window.bottomMm), top: mm(window.topMm), frameStyle: window.frameStyle, mullionFractions: window.mullionFractions, design: window.transomMm || window.bays || window.rollerNet || window.outsideScreen || window.frameColor ? window : undefined})
  return result.sort((a, b) => a.from - b.from)
}
