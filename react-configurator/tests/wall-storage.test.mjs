import test from 'node:test'
import assert from 'node:assert/strict'
import {checkWallStorage} from '../src/domain/wallStorage.mjs'
import {cavityGeometry, usableDepth} from '../src/domain/entryCavity.mjs'
import {ENTRY} from '../src/config/entryConfig.js'
import {HOME_ROOM_LAYOUTS} from '../src/config/homeRoomViews.js'
import {EMPTY_ROOM_SHELLS} from '../src/config/roomShellConfig.js'

const room = EMPTY_ROOM_SHELLS.drawing
const plan = HOME_ROOM_LAYOUTS.find(r => r.name === 'Drawing Room')
const cavity = cavityGeometry(ENTRY, {bounds: plan.bounds, widthMm: room.widthMm})
const use = usableDepth(cavity)

test('the configured wall storage fits the cavity, the sofa, the door and the router bay', () => {
  const result = checkWallStorage(room, cavity, use)
  assert.deepEqual(result.issues, [])
  assert.equal(result.ok, true)
  assert.ok(result.bays.leftMm >= 250 && result.bays.rightMm >= 250)
  assert.ok(result.grossLitres > 2000 && result.grossLitres < 3000, `gross ${result.grossLitres} litres`)
})

test('wall storage is used only by the corner-sofa layouts', () => {
  assert.deepEqual(room.wallStorage.layouts, ['cornerSofas', 'cornerConsole', 'cornerProjector'])
})

test('the checks catch an opening that is too deep, too low, too wide or off the router bay', () => {
  const bad = patch => { const r = structuredClone(room); patch(r.wallStorage); return checkWallStorage(r, cavity, use).issues.join(' | ') }
  assert.match(bad(s => { s.depthMm = 1300 }), /available/)
  assert.match(bad(s => { s.bottomMm = 900; s.heightMm = 1450 }), /sofa back/)
  assert.match(bad(s => { s.fromWestMm = 50; s.widthMm = 2000 }), /leaves the cavity/)
  assert.match(bad(s => { s.fromWestMm = 900; s.widthMm = 1000 }), /router bay/)
  assert.match(bad(s => { s.heightMm = 1600 }), /ceiling/)
  assert.match(bad(s => { s.shelves = [500] }), /shelf/)
})
