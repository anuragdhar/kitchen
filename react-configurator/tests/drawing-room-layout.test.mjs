import test from 'node:test'
import assert from 'node:assert/strict'
import {checkDrawingRoomLayout, checkCornerLayout, tvWallGeometry} from '../src/domain/drawingRoomLayout.mjs'
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

test('the entry door and its opening are untouched', () => {
  assert.deepEqual(room.doors, [{wall: 'north', fromMm: 2150, widthMm: 1000, heightMm: 2100, leadsTo: 'Main entry'}])
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

test('layout B (corner sofas, east-wall TV) fits with no issues', () => {
  const result = checkCornerLayout(room)
  assert.deepEqual(result.issues, [])
  assert.equal(result.clearances.sofaToSofa, 100)
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
