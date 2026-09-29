import test from 'node:test'
import assert from 'node:assert/strict'
import {checkDrawingRoomLayout, tvWallGeometry} from '../src/domain/drawingRoomLayout.mjs'
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
  assert.equal(w.speaker.column, 'west')
  assert.equal(w.phones.column, 'east', 'phones are on the door side')
  assert.ok(w.router.shelfMm >= w.bay.topMm, 'router is above the TV bay')
  assert.ok(g.bayCenterX > 900 && g.bayCenterX < 1200)
})

test('the checker catches an oversized TV, a blocked door and a too-small niche', () => {
  const big = clone(); big.tvWall.tv.widthMm = 1600
  assert.ok(checkDrawingRoomLayout(big).issues.some(m => /TV bay/.test(m)))
  const wide = clone(); wide.tvWall.widthMm = 2300
  assert.ok(checkDrawingRoomLayout(wide).issues.some(m => /entry door/.test(m)))
  const speaker = clone(); speaker.tvWall.speaker.widthMm = 260
  assert.ok(checkDrawingRoomLayout(speaker).issues.some(m => /niche/.test(m)))
  const table = clone(); table.furniture.coffeeTable.centerXmm = 1400
  assert.ok(checkDrawingRoomLayout(table).issues.some(m => /coffee table/.test(m)))
})
