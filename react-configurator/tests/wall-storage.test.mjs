import test from 'node:test'
import assert from 'node:assert/strict'
import {checkWallStorage, wallPiecesAroundStorage} from '../src/domain/wallStorage.mjs'
import {cavityGeometry, usableDepth} from '../src/domain/entryCavity.mjs'
import {checkCornerLayout} from '../src/domain/drawingRoomLayout.mjs'
import {ENTRY} from '../src/config/entryConfig.js'
import {HOME_ROOM_LAYOUTS} from '../src/config/homeRoomViews.js'
import {EMPTY_ROOM_SHELLS} from '../src/config/roomShellConfig.js'

const room = EMPTY_ROOM_SHELLS.drawing
const plan = HOME_ROOM_LAYOUTS.find(r => r.name === 'Drawing Room')
const cavity = cavityGeometry(ENTRY, {bounds: plan.bounds, widthMm: room.widthMm})
const use = usableDepth(cavity)
const mmPerPx = room.widthMm / (plan.bounds[2] - plan.bounds[0])
const roomX = planX => (plan.bounds[2] - planX) * mmPerPx

test('the west cabinet fits west of the partition, inside the pocket depth, clear of the entry door', () => {
  const result = checkWallStorage(room, cavity, use)
  assert.deepEqual(result.issues, [])
  assert.equal(result.ok, true)
  assert.equal(result.topMm, 2100)
  assert.equal(result.leafMm, 300)
})

test('the west cabinet matches the Blender model: door at plan x 653-684, partition at plan x 650, 2100 mm high', () => {
  const s = room.wallStorage, ref = ENTRY.wallCavity.westDoorPlan
  assert.ok(Math.abs(s.fromWestMm - roomX(ref.toPlanX)) < 20, `door starts ${s.fromWestMm}, Blender ${roomX(ref.toPlanX)}`)
  assert.ok(Math.abs(s.fromWestMm + s.widthMm - roomX(ref.fromPlanX)) < 20, `door ends ${s.fromWestMm + s.widthMm}, Blender ${roomX(ref.fromPlanX)}`)
  assert.equal(s.heightMm, ref.heightMm)
  assert.equal(s.bottomMm, 0)
  assert.ok(s.cabinet.fromWestMm + s.cabinet.widthMm <= cavity.partitionRoomXMm, 'the closet stops at the partition')
  const zmm = ENTRY.planScale.zMetresPerPixel * 1000
  assert.ok(Math.abs(s.shelves.depthMm - (ENTRY.wallCavity.planY2 + 1 - ref.shelfFromPlanY) * zmm) < 30, 'shelf depth as in the Blender model')
})

test('the router cabinet is wall-hung again, above the north sofa, and clear of the west cabinet door', () => {
  const rc = room.cornerLayout.routerCabinet, s = room.wallStorage
  assert.ok(rc.fromWestMm >= s.fromWestMm + s.widthMm + 100)
  assert.deepEqual(checkCornerLayout(room).issues, [])
})

test('the furniture standing in front of the west cabinet door is reported for every layout', () => {
  const {blockedBy} = checkWallStorage(room, cavity, use)
  const covered = blockedBy.flatMap(b => b.layouts).sort()
  assert.deepEqual(covered, ['cornerConsole', 'cornerProjector', 'cornerSofas', 'northTv'])
  assert.ok(blockedBy.every(b => b.overlapMm === room.wallStorage.widthMm))
})

test('the checks catch a door wider than the closet, past the partition, too deep or too tall', () => {
  const bad = patch => { const r = structuredClone(room); patch(r.wallStorage); return checkWallStorage(r, cavity, use).issues.join(' | ') }
  assert.match(bad(s => { s.widthMm = 700 }), /wider than the cabinet/)
  assert.match(bad(s => { s.cabinet.widthMm = 900 }), /partition/)
  assert.match(bad(s => { s.depthMm = 1300 }), /available/)
  assert.match(bad(s => { s.heightMm = 2600 }), /ceiling/)
  assert.match(bad(s => { s.shelves.heightsMm = [2800] }), /shelf/)
})

test('the shared Drawing Room / Entry wall is cut only across the door, from the floor to the door head', () => {
  const pieces = wallPiecesAroundStorage([570, 715, 688, 715], room, plan.bounds, 2.7)
  const [left, below, above, right] = pieces
  assert.equal(left[0][0], 570); assert.equal(right[0][2], 688)
  assert.equal(below[1], 0); assert.equal(below[2], 0, 'nothing under the door: it starts at the floor')
  assert.deepEqual([above[1], above[2]], [2.1, 2.7])
  assert.equal(wallPiecesAroundStorage([515, 715, 515, 874], room, plan.bounds, 2.7), null)
})
