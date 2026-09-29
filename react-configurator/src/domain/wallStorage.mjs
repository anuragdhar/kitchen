// The storage opening cut through the Drawing Room's north wall into the empty cavity behind it (pure: no React or Three.js).
// Millimetres; x from the Drawing Room's west wall. Depth is measured from the Drawing Room face of the wall.
import {SKIN_MM} from './entryCavity.mjs'

export const SOFA_BACK_MM = 900 // assumed height of the north sofa back; the opening starts above it
export const MIN_SIDE_BAY_MM = 250 // narrowest useful storage bay beside the router bay

/**
 * Checks the opening against the cavity ({@link cavityGeometry}) and the router bay, and returns the sizes the docs quote.
 * `use` is usableDepth(cavity).
 */
export function checkWallStorage(room, cavity, use) {
  const s = room.wallStorage, rc = room.cornerLayout.routerCabinet, door = room.doors.find(d => d.wall === 'north')
  const issues = []
  const need = (ok, message) => { if (!ok) issues.push(message) }
  const x1 = s.fromWestMm, x2 = s.fromWestMm + s.widthMm, top = s.bottomMm + s.heightMm
  need(x1 >= cavity.roomX1Mm + SKIN_MM && x2 <= cavity.roomX2Mm - SKIN_MM, `the opening (x ${x1}-${x2}) leaves the cavity (x ${Math.round(cavity.roomX1Mm)}-${Math.round(cavity.roomX2Mm)}) less ${SKIN_MM} mm of wall each side`)
  need(x2 <= door.fromMm - 50, 'the opening runs into the entry door frame')
  need(s.depthMm <= use.ifOpenedMm, `the opening is ${s.depthMm} mm deep but only ${use.ifOpenedMm} mm is available`)
  need(s.bottomMm >= SOFA_BACK_MM + 50, `the opening starts at ${s.bottomMm} mm, too near the sofa back (about ${SOFA_BACK_MM} mm)`)
  need(top <= room.heightMm - 200, `the opening reaches ${top} mm of a ${room.heightMm} mm ceiling; keep 200 mm of wall above it`)
  need(rc.fromWestMm >= x1 && rc.fromWestMm + rc.widthMm <= x2 && rc.bottomMm >= s.bottomMm && rc.bottomMm + rc.heightMm <= top, 'the router bay is not inside the opening')
  need(rc.depthMm <= s.depthMm, 'the router bay is deeper than the opening')
  const left = rc.fromWestMm - x1, right = x2 - (rc.fromWestMm + rc.widthMm)
  need(left >= MIN_SIDE_BAY_MM && right >= MIN_SIDE_BAY_MM, `a storage bay beside the router bay is under ${MIN_SIDE_BAY_MM} mm wide (${left}, ${right})`)
  need(s.shelves.every(y => y > s.bottomMm && y < top), 'a shelf is outside the opening')
  const litres = (s.widthMm * s.heightMm * s.depthMm - rc.widthMm * rc.heightMm * rc.depthMm) / 1e6
  return {ok: issues.length === 0, issues, bays: {leftMm: left, rightMm: right, routerMm: rc.widthMm}, topMm: top, grossLitres: Math.round(litres)}
}
