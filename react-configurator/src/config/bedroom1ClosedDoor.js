// Owner change (2026-09-29): the old door between Lobby/Dining and Bedroom 1
// is closed with a fibre-cement sheet on the lobby face instead of brickwork.
// The cavity left behind is used, from the Bedroom 1 side, as a shallow
// medicine cabinet. The replacement door near the west corner is unchanged
// (roomShellConfig.js lobby/bedroom1 doors, fromMm 100).
//
// The old door exists only in the A501 plan image. Its opening is scaled from
// that drawing (leaf swing arc, plan px), so treat it as +/- one pixel
// (about 20 mm) until surveyed. Units: plan px in the south-up A501 image,
// everything else millimetres. Coordinates in the built geometry are the
// Lobby/Dining room frame: x runs from the lobby's west wall (plan x = 515),
// z = 0 on the shared wall line, +z into the Lobby, -z into Bedroom 1.
export const BEDROOM1_CLOSED_DOOR = {
  // Jamb-to-jamb opening. planXEast is the east (image-left) jamb.
  wallPlanY: 612,
  planXEast: 347,
  planXWest: 390,
  heightMm: 2100,
  sheet: {thicknessMm: 12, gapMm: 2},
  cabinet: {
    carcassMm: 16, backMm: 6, doorMm: 16, doorGapMm: 2,
    shelfCount: 5, doorCount: 2, handleHeightMm: 1050,
  },
}

/**
 * Opening span along the Lobby's shared (north) wall, in Lobby-local mm from
 * the lobby's west wall. `bounds` is the lobby plan rectangle [x1,y1,x2,y2].
 */
export function closedDoorSpanMm(door, bounds, roomWidthMm) {
  const [x1, , x2] = bounds
  const mmPerPx = roomWidthMm / (x2 - x1)
  const start = (x2 - door.planXWest) * mmPerPx
  const end = (x2 - door.planXEast) * mmPerPx
  if (!(end > start)) throw new Error('closed door jambs are reversed')
  if (start < 0 || end > roomWidthMm) throw new Error('closed door lies outside its room wall')
  return {start, end}
}

/** Depth left between the bedroom face and the back of the lobby-side sheet. */
export function closedDoorCavityMm(door, wallThicknessMm) {
  const depth = wallThicknessMm - door.sheet.thicknessMm
  const interior = depth - door.cabinet.doorMm - door.cabinet.backMm
  if (interior <= 0) throw new Error('wall is too thin for the sheet and cabinet')
  return {cavity: depth, usableShelf: interior}
}
