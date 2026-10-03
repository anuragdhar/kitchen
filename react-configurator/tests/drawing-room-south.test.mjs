import test from 'node:test'
import assert from 'node:assert/strict'
import {checkSouthLayout, southTvGeometry} from '../src/domain/drawingRoomLayout.mjs'
import {checkWallStorage} from '../src/domain/wallStorage.mjs'
import {cavityGeometry, usableDepth} from '../src/domain/entryCavity.mjs'
import {buildRoomReview} from '../src/domain/roomReview.mjs'
import {ENTRY} from '../src/config/entryConfig.js'
import {HOME_ROOM_LAYOUTS} from '../src/config/homeRoomViews.js'
import {EMPTY_ROOM_SHELLS} from '../src/config/roomShellConfig.js'

const room = EMPTY_ROOM_SHELLS.drawing

test('layout C passes its checks: south sofa against the window wall, west sofa in an L with it, table inside', () => {
  const r = checkSouthLayout(room)
  assert.deepEqual(r.issues, [])
  assert.ok(r.clearances.southWallGapMm <= 100)
  assert.ok(r.clearances.sofaToSofa >= 0 && r.clearances.sofaToSofa <= 150)
  assert.ok(r.clearances.southSofaToTable >= 400 && r.clearances.westSofaToTable >= 400)
})

test('the west sofa moved south and the old north-wall sofa is now on the south wall', () => {
  const b = room.cornerLayout.furniture, c = room.southLayout.furniture
  assert.ok(c.westSofa.centerZmm > b.westSofa.centerZmm + 900)
  assert.ok(c.southSofa.centerZmm + c.southSofa.widthMm / 2 > room.lengthMm - 100)
  assert.ok(c.coffeeTable.centerZmm > b.coffeeTable.centerZmm + 1000)
})

test('the TV is on the north wall between the west cabinet door and the entry door, in both sizes', () => {
  const ws = room.wallStorage, door = room.doors.find(d => d.wall === 'north')
  for (const key of ['55', '65']) {
    const g = southTvGeometry(room, key)
    assert.ok(g.x1 >= ws.fromWestMm + ws.widthMm && g.x2 <= door.fromMm, `${key}: x ${g.x1}-${g.x2}`)
  }
  assert.equal(checkSouthLayout(room).clearances.tvMarginsMm['55'], 120)
})

test('nothing stands in front of the west cabinet door', () => {
  assert.ok(checkSouthLayout(room).clearances.cabinetDoorFrontClearMm >= 600)
})

test('the TV console holds the router, landline and intercom; there is no east-wall cabinet', () => {
  const g = southTvGeometry(room), k = room.southLayout.console
  assert.equal(room.southLayout.routerCabinet, undefined)
  assert.ok(g.routerBay.x1 >= g.console.x1 && g.routerBay.x2 < g.bay.x1, 'router bay at the west end, Bass Module bay at the east end')
  assert.ok(g.landlineX < g.soundbar.x1 && g.intercomX > g.soundbar.x2, 'landline west of the soundbar, intercom east of it')
  assert.ok(g.console.x1 >= room.wallStorage.fromWestMm + room.wallStorage.widthMm && g.console.x2 <= room.doors[0].fromMm)
  assert.ok(k.routerBayMm >= g.router.widthMm + 40)
})

test('the south sofa moved east and a small lamp table stands at its west end', () => {
  const f = room.southLayout.furniture, r = checkSouthLayout(room)
  assert.equal(f.southSofa.centerXmm, 1605)
  assert.ok(f.cornerTable.centerXmm < f.southSofa.centerXmm - f.southSofa.lengthMm / 2)
  assert.ok(r.clearances.cornerTable.southSofa >= 0 && r.clearances.cornerTable.southSofa <= 80)
  assert.ok(r.clearances.cornerTable.westWall >= 0 && r.clearances.cornerTable.westSofa >= 0)
})

test('the west cabinet leaves open inward and clear the shelves; no layout C furniture blocks them', () => {
  const plan = HOME_ROOM_LAYOUTS.find(r => r.name === 'Drawing Room')
  const cavity = cavityGeometry(ENTRY, {bounds: plan.bounds, widthMm: room.widthMm})
  const result = checkWallStorage(room, cavity, usableDepth(cavity))
  assert.equal(room.wallStorage.opens, 'inward')
  assert.deepEqual(result.issues, [])
  assert.ok(!result.blockedBy.some(b => b.layouts.includes('southSofas')))
  const tooDeep = structuredClone(room); tooDeep.wallStorage.shelves.depthMm = 900
  assert.match(checkWallStorage(tooDeep, cavity, usableDepth(cavity)).issues.join(' '), /cannot swing in/)
})

test('the review sheet describes layout C and is the default', () => {
  const review = buildRoomReview({roomKey: 'drawing', room, layoutKey: 'southSofas'})
  assert.match(review.title, /C: sofas south/)
  assert.match(review.text, /TV: 55-inch/)
  assert.equal(buildRoomReview({roomKey: 'drawing', room}).sections.find(s => s.heading === 'This layout').lines[0].startsWith('South-wall 3-seater'), true)
})
