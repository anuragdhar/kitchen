// Room mm, x east / z south. Drawer depth is its full travel; no room box is enlarged.
export function poojaPlatformGeometry(p, floorTopMm = 0) {
  const front = p.platformProjectionMm ?? 0, x1 = p.fromMm + (p.drawerFromWestMm ?? 70)
  const width = p.drawerWidthMm ?? p.widthMm - 140 // original builder front insets
  return {front, depthMm: p.depthMm + front, top: floorTopMm + p.platformHeightMm,
    drawer: {x1, x2: x1 + width, z1: front - p.drawerDepthMm, z2: front, bottom: floorTopMm, top: floorTopMm + p.platformHeightMm},
    // Existing handle extends 31 mm beyond the drawer front (original z 62 minus z 31).
    drawerPull: {x1, x2: x1 + width, z1: front, z2: front + p.drawerDepthMm + 31, bottom: floorTopMm, top: floorTopMm + p.platformHeightMm}}
}
