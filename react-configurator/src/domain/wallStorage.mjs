// The west cabinet of the entry-side pocket, reached from the Drawing Room through a door in its north wall (pure: no React or
// Three.js). Millimetres; x from the Drawing Room's west wall, z from its north wall. Depth is measured from the Drawing Room
// face of the wall. Sizes: room.wallStorage (roomShellConfig.js); plan reference: ENTRY.wallCavity (entryConfig.js).
import {SKIN_MM} from './entryCavity.mjs'

export const DOOR_HEAD_CLEAR_MM = 200 // keep this much wall above the door head, under the ceiling

/**
 * Checks the cabinet against the pocket ({@link cavityGeometry}), the partition and the entry door, and lists the furniture
 * that stands in front of its doors in each layout (`blockedBy`; reported, not an error: the owner decides). `use` is
 * usableDepth(cavity).
 */
export function checkWallStorage(room, cavity, use) {
  const s = room.wallStorage, cab = s.cabinet, door = room.doors.find(d => d.wall === 'north')
  const issues = []
  const need = (ok, message) => { if (!ok) issues.push(message) }
  const x1 = s.fromWestMm, x2 = s.fromWestMm + s.widthMm, top = s.bottomMm + s.heightMm
  const cx1 = cab.fromWestMm, cx2 = cab.fromWestMm + cab.widthMm
  need(x1 >= cx1 && x2 <= cx2, `the door opening (x ${x1}-${x2}) is wider than the cabinet behind it (x ${cx1}-${cx2})`)
  need(cx1 >= SKIN_MM, `the cabinet (x ${cx1}) cuts into the outer wall`)
  need(cavity.partitionRoomXMm != null && cx2 <= cavity.partitionRoomXMm, `the cabinet (to x ${cx2}) runs past the partition at x ${Math.round(cavity.partitionRoomXMm)} into the east cabinet`)
  need(x2 <= door.fromMm - 50, 'the cabinet door runs into the entry door frame')
  need(s.depthMm <= use.ifOpenedMm, `the cabinet is ${s.depthMm} mm deep but only ${use.ifOpenedMm} mm is available`)
  need(top <= room.heightMm - DOOR_HEAD_CLEAR_MM, `the door reaches ${top} mm of a ${room.heightMm} mm ceiling; keep ${DOOR_HEAD_CLEAR_MM} mm of wall above it`)
  need(s.shelves.depthMm < s.depthMm, 'the shelves are deeper than the cabinet')
  need(s.shelves.heightsMm.every(y => y > 0 && y < room.heightMm), 'a shelf is outside the cabinet height')

  // Footprints standing against the north wall in front of the doors, per layout (z1 = 0 at the wall).
  const f = room.cornerLayout.furniture, t = room.tvWall
  const fronts = [
    {layouts: ['cornerSofas', 'cornerConsole', 'cornerProjector'], item: 'north sofa', x1: f.northSofa.centerXmm - f.northSofa.lengthMm / 2, x2: f.northSofa.centerXmm + f.northSofa.lengthMm / 2},
    {layouts: ['northTv'], item: 'TV wall cabinet', x1: t.fromWestMm, x2: t.fromWestMm + t.widthMm},
  ]
  const blockedBy = fronts.filter(r => r.x1 < x2 && r.x2 > x1).map(r => ({layouts: r.layouts, item: r.item, overlapMm: Math.round(Math.min(r.x2, x2) - Math.max(r.x1, x1))}))
  const litres = cab.widthMm * (room.heightMm - DOOR_HEAD_CLEAR_MM) * s.depthMm / 1e6
  return {ok: issues.length === 0, issues, blockedBy, doorMm: s.widthMm, leafMm: Math.round(s.widthMm / s.doorCount), topMm: top, grossLitres: Math.round(litres)}
}

/**
 * Where the door opening crosses a plan wall segment on the Drawing Room's north edge, as [segment, bottomM, topM] pieces
 * (the wall left and right of it, and above and below it), or null if the segment does not span it. `bounds` are the
 * Drawing Room plan bounds [x1, y1, x2, y2]; the plan is south-up, so room x grows toward plan x1.
 */
export function wallPiecesAroundStorage(segment, room, bounds, ceilingM) {
  const s = room.wallStorage, [ax, ay, bx, by] = segment
  const planX = mm => bounds[2] - (mm / room.widthMm) * (bounds[2] - bounds[0])
  const cx1 = planX(s.fromWestMm + s.widthMm), cx2 = planX(s.fromWestMm), y = bounds[3]
  const lo = Math.min(ax, bx), hi = Math.max(ax, bx)
  if (ay !== y || by !== y || lo >= cx1 || hi <= cx2) return null
  const bottom = s.bottomMm / 1000, top = (s.bottomMm + s.heightMm) / 1000
  return [
    [[lo, y, cx1, y], 0, ceilingM], [[cx1, y, cx2, y], 0, bottom], [[cx1, y, cx2, y], top, ceilingM], [[cx2, y, hi, y], 0, ceilingM],
  ]
}
