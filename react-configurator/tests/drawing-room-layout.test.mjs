import test from 'node:test'
import assert from 'node:assert/strict'
import {checkDrawingRoomLayout, checkCornerLayout, checkCornerConsole, checkCornerProjector, doorBlockedAt, doorSwingIssues, tvWallGeometry} from '../src/domain/drawingRoomLayout.mjs'
import {EMPTY_ROOM_SHELLS} from '../src/config/roomShellConfig.js'

const room = EMPTY_ROOM_SHELLS.drawing
const clone = () => structuredClone(room)

test('the Drawing Room TV wall and two-sofa layout fit with no issues', () => {
  const result = checkDrawingRoomLayout(room)
  assert.deepEqual(result.issues, [])
  assert.equal(tvWallGeometry(room).bayWidth, 1540)
})

test('the brief is encoded: 65-inch TV, one-foot cabinet, two same-size 3-seaters, no window seat', () => {
  assert.equal(room.tvWall.tv.diagonalInches, 65)
  assert.ok(Math.abs(room.tvWall.depthMm - 304.8) < 1)
  assert.equal(room.furniture.windowSeat, undefined)
  assert.equal(room.television, undefined)
  const {sofa, southSofa} = room.furniture
  assert.deepEqual([southSofa.widthMm, southSofa.lengthMm], [sofa.widthMm, sofa.lengthMm])
  assert.deepEqual(sofa, {centerXmm: 580, centerZmm: 2420, widthMm: 880, lengthMm: 2250}, 'west sofa is unchanged')
})

test('the entry door has not moved, and it opens INTO the room (owner, 2026-09-30)', () => {
  const [door] = room.doors
  assert.equal(room.doors.length, 1)
  assert.deepEqual([door.wall, door.fromMm, door.widthMm, door.heightMm, door.leadsTo], ['north', 2150, 1000, 2100, 'Main entry'])
  assert.equal(door.opensInto, 'Drawing Room')
  assert.ok(door.leafMm > 0 && door.leafMm < door.widthMm)
})

test('every device sits where the brief put it', () => {
  const w = room.tvWall, g = tvWallGeometry(room)
  assert.equal(w.bassModule.model, 'Bose Bass Module 500')
  assert.equal(w.speaker, undefined, 'the Home Speaker 500 was replaced by the Bass Module 500')
  assert.equal(w.phones.column, 'east', 'phones are on the door side')
  assert.ok(w.router.shelfMm >= w.bay.topMm, 'router is above the TV bay')
  assert.ok(g.bayCenterX > 900 && g.bayCenterX < 1200)
})

test('the checker catches an oversized TV, a blocked door, a bass module that does not fit or sits in the corner', () => {
  const big = clone(); big.tvWall.tv.widthMm = 1600
  assert.ok(checkDrawingRoomLayout(big).issues.some(m => /TV bay/.test(m)))
  const wide = clone(); wide.tvWall.widthMm = 2300
  assert.ok(checkDrawingRoomLayout(wide).issues.some(m => /entry door/.test(m)))
  const bass = clone(); bass.tvWall.bassModule.heightMm = 600
  assert.ok(checkDrawingRoomLayout(bass).issues.some(m => /bass module/.test(m)))
  const corner = clone(); corner.tvWall.bassModule.centerFromBayWestFraction = 0.02
  assert.ok(checkDrawingRoomLayout(corner).issues.some(m => /corner boom/.test(m)))
  const table = clone(); table.furniture.coffeeTable.centerXmm = 1400
  assert.ok(checkDrawingRoomLayout(table).issues.some(m => /coffee table/.test(m)))
})

// Both corner sofas cut to a common 2100 mm: the longest that stays clear of the inward-opening door.
const withShorterSofas = () => {
  const r = structuredClone(room), f = r.cornerLayout.furniture
  f.northSofa.lengthMm = 2100; f.northSofa.centerXmm = 30 + 1050
  f.westSofa.lengthMm = 2100; f.westSofa.centerZmm = 1040 + 1050
  return r
}

test('layout B as drawn has exactly one problem: the north sofa stops the inward-opening door', () => {
  const result = checkCornerLayout(room)
  assert.equal(result.issues.length, 1, result.issues.join(' | '))
  assert.match(result.issues[0], /north sofa stops the inward-opening entry door at \d+ degrees/)
  assert.equal(result.clearances.sofaToSofa, 100)
})

test('the door problem holds for either hinge side, and clears once both sofas are 2100 mm long', () => {
  const northSofa = {x1: 30, z1: 60, x2: 2280, z2: 940}
  assert.ok(doorBlockedAt(room, northSofa, 'east') < 10)
  assert.ok(doorBlockedAt(room, northSofa, 'west') < 30)
  const fixed = withShorterSofas()
  assert.deepEqual(checkCornerLayout(fixed).issues, [])
  assert.deepEqual(checkCornerConsole(fixed).issues, [])
  assert.deepEqual(checkCornerProjector(fixed).issues, [])
  assert.equal(doorBlockedAt(fixed, {x1: 30, z1: 60, x2: 2130, z2: 940}, 'east'), null)
  assert.equal(doorBlockedAt(fixed, {x1: 30, z1: 60, x2: 2130, z2: 940}, 'west'), null)
})

test('layout A is clear of the door swing on either hinge side', () => {
  assert.deepEqual(doorSwingIssues(room, {cabinet: {x1: 0, z1: 0, x2: 2100, z2: 305}}), [])
  assert.deepEqual(checkDrawingRoomLayout(room).issues.filter(m => /door/.test(m)), [])
})

test('layout B keeps the two sofas the same size as each other and as layout A', () => {
  const b = room.cornerLayout.furniture
  assert.deepEqual([b.northSofa.widthMm, b.northSofa.lengthMm], [880, 2250])
  assert.deepEqual([b.westSofa.widthMm, b.westSofa.lengthMm], [880, 2250])
  assert.equal(room.cornerLayout.tv.diagonalInches, 65)
  assert.equal(room.cornerLayout.bassModule.model, 'Bose Bass Module 500')
})

test('layout B known trade-offs: west sofa sees the TV well, north sofa sees it side-on, the walkway passes it', () => {
  const r = checkCornerLayout(room)
  assert.ok(r.views.westSofa.every(v => v.angleDeg <= 35 && v.distanceMm > 2500 && v.distanceMm < 3300))
  assert.ok(r.views.northSofa.every(v => v.angleDeg > 60), 'the north sofa is 60+ degrees off the TV')
  assert.equal(r.clearances.northSofaPastDoorJambLine, 130, 'the north sofa end passes the door jamb line by 130 mm')
  assert.ok(r.clearances.doorClearPastNorthSofa >= 800)
  assert.ok(r.clearances.tvFrontBeyondDoorEastJamb < 100, 'the TV front is within 100 mm of the door edge line')
})

test('layout B checker catches a TV too close to the door, a blocked lane and a low cabinet', () => {
  const near = structuredClone(room); near.cornerLayout.tv.centerFromNorthMm = 900
  assert.ok(checkCornerLayout(near).issues.some(m => /door wall/.test(m)))
  const long = structuredClone(room); long.cornerLayout.furniture.northSofa.centerXmm = 1500
  assert.ok(checkCornerLayout(long).issues.some(m => /lane|entry door/.test(m)))
  const low = structuredClone(room); low.cornerLayout.routerCabinet.bottomMm = 1000
  assert.ok(checkCornerLayout(low).issues.some(m => /1400/.test(m)))
})
