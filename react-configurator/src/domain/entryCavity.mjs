// The empty band behind the Main Entry cabinet, seen from the Drawing Room (pure: no React or Three.js). Millimetres.
// Plan pixels are converted with the same per-axis scales the app uses: metres per plan pixel from ENTRY.planScale for
// world sizes, and the Drawing Room's own px-to-mm ratio (3353 mm over its 173 px) for positions along its north wall.

export const SKIN_MM = 40 // finish and backing that must stay on the far side of any niche cut into the band
export const SOLID_WALL_SAFE_FRACTION = 0.5 // if the band is really 9-inch brickwork, recess no more than about half of it

export function cavityGeometry(entry, drawing) {
  const c = entry.wallCavity, k = entry.entryCabinet
  const xmm = entry.planScale.xMetresPerPixel * 1000, zmm = entry.planScale.zMetresPerPixel * 1000
  const [bx1, , bx2] = drawing.bounds, mmPerPx = drawing.widthMm / (bx2 - bx1)
  const depthMm = (c.planY2 - c.planY1) * zmm
  return {
    depthMm,
    widthMm: (c.planX2 - c.planX1) * xmm,
    heightMm: c.heightMm,
    // Position along the Drawing Room's north wall, measured from its west wall (x = 0), the same frame as roomShellConfig.
    roomX1Mm: (bx2 - c.planX2) * mmPerPx,
    roomX2Mm: (bx2 - c.planX1) * mmPerPx,
    cabinetDepthMm: (k.planY2 - k.planY1) * zmm,
    cabinetWidthMm: (k.planX2 - k.planX1) * xmm,
    // 9 inches is 229 mm: a drawn band that thick is a normal solid wall unless the owner knows of a void.
    nearNineInchWall: Math.abs(depthMm - 229) < 30,
  }
}

/** How deep a niche may go: into a real void (keeping a skin), or into solid brickwork (about half the wall). */
export function usableDepth(geometry) {
  return {
    ifHollowMm: Math.max(0, Math.floor((geometry.depthMm - SKIN_MM) / 5) * 5),
    ifSolidMm: Math.floor(geometry.depthMm * SOLID_WALL_SAFE_FRACTION / 5) * 5,
  }
}

/**
 * What a recess would do for each item on the north wall: fits (item span inside the cavity span), and how far the item
 * then sticks out into the room. Items are {name, x1, x2, depthMm}; recessing can never exceed the item's own depth.
 */
export function recessOptions(geometry, items) {
  const use = usableDepth(geometry)
  return items.map(item => {
    const fits = item.x1 >= geometry.roomX1Mm && item.x2 <= geometry.roomX2Mm
    const recess = which => (fits ? Math.min(item.depthMm, use[which]) : 0)
    return {
      name: item.name, fits,
      ifHollow: {recessMm: recess('ifHollowMm'), protrudesMm: item.depthMm - recess('ifHollowMm')},
      ifSolid: {recessMm: recess('ifSolidMm'), protrudesMm: item.depthMm - recess('ifSolidMm')},
    }
  })
}
