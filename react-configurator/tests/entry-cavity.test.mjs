import test from 'node:test'
import assert from 'node:assert/strict'
import {eastCabinetGeometry, cavityGeometry, usableDepth, recessOptions} from '../src/domain/entryCavity.mjs'
import {ENTRY, ENTRY_WALL_SEGMENTS, entryPocketEastWallSpans} from '../src/config/entryConfig.js'
import {HOME_ROOM_LAYOUTS} from '../src/config/homeRoomViews.js'
import {EMPTY_ROOM_SHELLS} from '../src/config/roomShellConfig.js'

const drawingPlan = HOME_ROOM_LAYOUTS.find(room => room.name === 'Drawing Room')
const drawing = {bounds: drawingPlan.bounds, widthMm: EMPTY_ROOM_SHELLS.drawing.widthMm}
const geometry = cavityGeometry(ENTRY, drawing)

test('the owner-marked area lies inside the pocket and the pocket is 3 ft deep', () => {
  const m = ENTRY.ownerMark, c = ENTRY.wallCavity
  assert.ok(m.planX1 >= c.planX1 - 5 && m.planX2 <= c.planX2 && m.planY1 === c.planY1 && m.planY2 === c.planY2)
  assert.ok(Math.abs(geometry.depthMm - 914.4) < 30, `pocket depth ${geometry.depthMm}`)
  assert.ok(geometry.widthMm > 1900 && geometry.widthMm < 2100, `pocket width ${geometry.widthMm}`)
})

test('the wall between the pocket and the Drawing Room is about 220 mm, the size of a 9-inch wall, and the pocket runs floor to ceiling', () => {
  assert.ok(geometry.wallMm > 200 && geometry.wallMm < 240, `wall ${geometry.wallMm}`)
  assert.equal(geometry.nearNineInchWall, true)
  assert.equal(geometry.heightMm, 2700)
})

test('the pocket lines up with the free north wall of the Drawing Room, left of the entry door', () => {
  const door = EMPTY_ROOM_SHELLS.drawing.doors[0]
  assert.ok(geometry.roomX1Mm > 80 && geometry.roomX1Mm < 220, `starts ${geometry.roomX1Mm}`)
  assert.ok(geometry.roomX2Mm > 2100 && geometry.roomX2Mm <= door.fromMm + 50, `ends ${geometry.roomX2Mm}`)
})

test('usable depth: about 1.1 m if the wall may be opened into the pocket, about 110 mm if the wall must stay', () => {
  const use = usableDepth(geometry)
  assert.ok(use.ifOpenedMm >= 1090 && use.ifOpenedMm <= 1130, `opened ${use.ifOpenedMm}`)
  assert.ok(use.ifKeptMm >= 100 && use.ifKeptMm <= 120, `kept ${use.ifKeptMm}`)
})

test('recess options: the TV bay and the router cabinet fit the pocket completely, the whole 2100 mm cabinet does not', () => {
  const t = EMPTY_ROOM_SHELLS.drawing.tvWall, c = EMPTY_ROOM_SHELLS.drawing.cornerLayout.routerCabinet
  const [bay, router, whole, deep] = recessOptions(geometry, [
    {name: 'TV bay', x1: t.fromWestMm + t.columnWidthMm, x2: t.fromWestMm + t.widthMm - t.columnWidthMm, depthMm: t.depthMm},
    {name: 'router cabinet', x1: c.fromWestMm, x2: c.fromWestMm + c.widthMm, depthMm: c.depthMm},
    {name: 'whole cabinet', x1: t.fromWestMm, x2: t.fromWestMm + t.widthMm, depthMm: t.depthMm},
    {name: '18-inch TV bay', x1: t.fromWestMm + t.columnWidthMm, x2: t.fromWestMm + t.widthMm - t.columnWidthMm, depthMm: 457},
  ])
  assert.equal(bay.fits, true)
  assert.equal(router.fits, true)
  assert.equal(whole.fits, false, 'the west end of the cabinet (x 0-116) is outside the pocket')
  assert.equal(whole.ifOpened.recessMm, 0)
  assert.equal(router.ifOpened.protrudesMm, 0, 'the router cabinet disappears into the pocket when the wall is opened')
  assert.equal(deep.ifOpened.protrudesMm, 0, 'an 18-inch bay fits entirely in the pocket')
  assert.ok(deep.ifKept.protrudesMm > 340, 'if the wall must stay, an 18-inch bay still sticks out about 350 mm')
})

test('the east cabinet is open over its whole east side onto the Entry gallery, as in the Blender model', () => {
  const c = ENTRY.wallCavity, o = c.eastOpening
  assert.ok(o.wallPlanX < c.planX1, 'the opening is in the plan-left (east) wall of the pocket')
  assert.deepEqual([o.fromPlanY, o.toPlanY, o.heightMm], [c.wallPlanY1, ENTRY.shaft.planY1, c.heightMm])
  // Every wall piece left on that side is empty (zero length or zero height), so neither 3D view draws one.
  const empty = ([[x1, y1, x2, y2], bottom, top]) => Math.hypot(x2 - x1, y2 - y1) < 0.01 || top <= bottom
  assert.ok(entryPocketEastWallSpans(2.7).every(empty))
})

test('a full-height partition splits the pocket into an east and a west cabinet', () => {
  const c = ENTRY.wallCavity, x = c.partitionPlanX
  assert.ok(x > c.planX1 + 50 && x < c.planX2, 'the partition is inside the pocket, nearer its west end')
  assert.ok(ENTRY_WALL_SEGMENTS.some(([x1, y1, x2, y2]) => x1 === x && x2 === x && y1 === c.wallPlanY1 && y2 === ENTRY.shaft.planY1))
  assert.ok(Math.abs(geometry.partitionRoomXMm - 736) < 20, `partition ${geometry.partitionRoomXMm} mm from the Drawing Room west wall`)
})

test('the existing east cabinet fills the east compartment and faces the Entry gallery', () => {
  const g = eastCabinetGeometry(ENTRY), e = ENTRY.wallCavity.eastCabinet
  assert.equal(g.inside, true, 'east of the partition and within the pocket')
  assert.ok(Math.abs(g.faceWidthMm - 925) < 15, `face ${g.faceWidthMm} mm`)
  assert.ok(Math.abs(g.depthMm - 1363) < 15, `depth ${g.depthMm} mm`)
  assert.ok(g.leafWidthMm > 300 && g.leafWidthMm < 600, 'a normal door leaf')
  assert.ok(e.shelfHeightsMm.every(y => y > 0 && y < e.doorHeightMm))
})
