import test from 'node:test'
import assert from 'node:assert/strict'
import {cavityGeometry, usableDepth, recessOptions} from '../src/domain/entryCavity.mjs'
import {ENTRY} from '../src/config/entryConfig.js'
import {HOME_ROOM_LAYOUTS} from '../src/config/homeRoomViews.js'
import {EMPTY_ROOM_SHELLS} from '../src/config/roomShellConfig.js'

const drawingPlan = HOME_ROOM_LAYOUTS.find(room => room.name === 'Drawing Room')
const drawing = {bounds: drawingPlan.bounds, widthMm: EMPTY_ROOM_SHELLS.drawing.widthMm}
const geometry = cavityGeometry(ENTRY, drawing)

test('the owner-marked area lies inside the entry cabinet outline and the cabinet is 3 ft deep', () => {
  const m = ENTRY.ownerMark, k = ENTRY.entryCabinet
  assert.ok(m.planX1 >= k.planX1 - 5 && m.planX2 <= k.planX2 && m.planY1 === k.planY1 && m.planY2 === k.planY2)
  assert.ok(Math.abs(geometry.cabinetDepthMm - 914.4) < 30, `cabinet depth ${geometry.cabinetDepthMm}`)
})

test('the band behind the cabinet is about 220 mm deep, the size of a 9-inch wall, and runs floor to ceiling', () => {
  assert.ok(geometry.depthMm > 200 && geometry.depthMm < 240, `depth ${geometry.depthMm}`)
  assert.equal(geometry.nearNineInchWall, true)
  assert.equal(geometry.heightMm, 2700)
})

test('the cavity lines up with the free north wall of the Drawing Room, left of the entry door', () => {
  const door = EMPTY_ROOM_SHELLS.drawing.doors[0]
  assert.ok(geometry.roomX1Mm > 100 && geometry.roomX1Mm < 220, `starts ${geometry.roomX1Mm}`)
  assert.ok(geometry.roomX2Mm > 2100 && geometry.roomX2Mm <= door.fromMm + 50, `ends ${geometry.roomX2Mm}`)
})

test('usable depth: about 180 mm if it is a real void, about 110 mm if it is solid brickwork', () => {
  const use = usableDepth(geometry)
  assert.ok(use.ifHollowMm >= 170 && use.ifHollowMm <= 190, `hollow ${use.ifHollowMm}`)
  assert.ok(use.ifSolidMm >= 100 && use.ifSolidMm <= 120, `solid ${use.ifSolidMm}`)
})

test('recess options: the TV bay and the router cabinet fit the cavity, the whole 2100 mm cabinet does not', () => {
  const t = EMPTY_ROOM_SHELLS.drawing.tvWall, c = EMPTY_ROOM_SHELLS.drawing.cornerLayout.routerCabinet
  const [bay, router, whole, deep] = recessOptions(geometry, [
    {name: 'TV bay', x1: t.fromWestMm + t.columnWidthMm, x2: t.fromWestMm + t.widthMm - t.columnWidthMm, depthMm: t.depthMm},
    {name: 'router cabinet', x1: c.fromWestMm, x2: c.fromWestMm + c.widthMm, depthMm: c.depthMm},
    {name: 'whole cabinet', x1: t.fromWestMm, x2: t.fromWestMm + t.widthMm, depthMm: t.depthMm},
    {name: '18-inch TV bay', x1: t.fromWestMm + t.columnWidthMm, x2: t.fromWestMm + t.widthMm - t.columnWidthMm, depthMm: 457},
  ])
  assert.equal(bay.fits, true)
  assert.equal(router.fits, true)
  assert.equal(whole.fits, false, 'the west end of the cabinet (x 0-155) is outside the cavity')
  assert.equal(whole.ifHollow.recessMm, 0)
  assert.ok(router.ifHollow.protrudesMm <= 80, 'a recessed router cabinet sticks out under 80 mm')
  assert.ok(deep.ifHollow.protrudesMm < 305, 'an 18-inch bay recessed into a void sticks out less than todays one-foot cabinet')
})
