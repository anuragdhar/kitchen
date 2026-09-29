// The empty pocket behind the Drawing Room's north wall, on the Main Entry side (pure: no React or Three.js). Millimetres.
// Plan pixels are converted with the same per-axis scales the app uses: metres per plan pixel from ENTRY.planScale for
// world sizes, and the Drawing Room's own px-to-mm ratio (3353 mm over its 173 px) for positions along its north wall.

export const SKIN_MM = 40 // finish and backing that must stay on the far side of any niche cut into the pocket
export const SOLID_WALL_SAFE_FRACTION = 0.5 // if the wall is kept, recess no more than about half of its 9 inches

export function cavityGeometry(entry, drawing) {
  const c = entry.wallCavity
  const xmm = entry.planScale.xMetresPerPixel * 1000, zmm = entry.planScale.zMetresPerPixel * 1000
  const [bx1, , bx2] = drawing.bounds, mmPerPx = drawing.widthMm / (bx2 - bx1)
  const wallMm = (c.wallPlanY2 - c.wallPlanY1) * zmm
  return {
    depthMm: (c.planY2 - c.planY1) * zmm, // the pocket itself
    wallMm, // the wall between the Drawing Room face and the pocket
    widthMm: (c.planX2 - c.planX1) * xmm,
    heightMm: c.heightMm,
    // Position along the Drawing Room's north wall, measured from its west wall (x = 0), the same frame as roomShellConfig.
    roomX1Mm: (bx2 - c.planX2) * mmPerPx,
    roomX2Mm: (bx2 - c.planX1) * mmPerPx,
    // 9 inches is 229 mm: a drawn wall that thick is a normal solid wall, so opening it needs the builder or engineer.
    nearNineInchWall: Math.abs(wallMm - 229) < 30,
  }
}

/**
 * How deep a niche may go measured from the Drawing Room face: through the wall into the pocket (keeping a skin on the
 * far side), or, if the wall must stay, only about half of it.
 */
export function usableDepth(geometry) {
  return {
    ifOpenedMm: Math.max(0, Math.floor((geometry.wallMm + geometry.depthMm - SKIN_MM) / 5) * 5),
    ifKeptMm: Math.floor(geometry.wallMm * SOLID_WALL_SAFE_FRACTION / 5) * 5,
  }
}

/**
 * What a recess would do for each item on the north wall: fits (item span inside the pocket span), and how far the item
 * then sticks out into the room. Items are {name, x1, x2, depthMm}; recessing can never exceed the item's own depth.
 */
export function recessOptions(geometry, items) {
  const use = usableDepth(geometry)
  return items.map(item => {
    const fits = item.x1 >= geometry.roomX1Mm && item.x2 <= geometry.roomX2Mm
    const recess = which => (fits ? Math.min(item.depthMm, use[which]) : 0)
    return {
      name: item.name, fits,
      ifOpened: {recessMm: recess('ifOpenedMm'), protrudesMm: item.depthMm - recess('ifOpenedMm')},
      ifKept: {recessMm: recess('ifKeptMm'), protrudesMm: item.depthMm - recess('ifKeptMm')},
    }
  })
}
