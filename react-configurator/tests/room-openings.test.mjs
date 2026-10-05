import test from 'node:test'
import assert from 'node:assert/strict'
import {EMPTY_ROOM_SHELLS} from '../src/config/roomShellConfig.js'
import {roomWallOpenings} from '../src/domain/roomOpenings.mjs'

const {drawing, bedroom1, bedroom3, lobby} = EMPTY_ROOM_SHELLS
const spans = (room, side) => roomWallOpenings(room, side).map(o => [o.kind, Math.round(o.from * 1000), Math.round(o.to * 1000)])

test('openings come from the shell config, sorted along each wall, in metres', () => {
  const store = drawing.wallStorage, door = drawing.doors.find(d => d.wall === 'north')
  assert.deepEqual(spans(drawing, 'north'), [['passage', store.fromWestMm, store.fromWestMm + store.widthMm], ['door', door.fromMm, door.fromMm + door.widthMm]])
  assert.deepEqual(spans(drawing, 'east'), [['passage', drawing.wallOpenings.east.fromMm, drawing.wallOpenings.east.toMm]])
  const window = roomWallOpenings(drawing, 'south')[0]
  assert.equal(window.kind, 'window'); assert.equal(window.top, drawing.windows[0].topMm / 1000)
  for (const room of Object.values(EMPTY_ROOM_SHELLS)) for (const side of ['north', 'south', 'west', 'east']) {
    const list = roomWallOpenings(room, side)
    for (let i = 1; i < list.length; i++) assert.ok(list[i - 1].from <= list[i].from, `${room.name} ${side} is sorted`)
  }
})

test('a full-height passage cuts the whole wall; the storage recess keeps wall above and below it', () => {
  const lobbyEast = roomWallOpenings(lobby, 'east')[0]
  assert.deepEqual([lobbyEast.bottom, lobbyEast.top], [0, lobby.heightMm / 1000])
  const store = roomWallOpenings(drawing, 'north')[0], ws = drawing.wallStorage
  assert.deepEqual([store.bottom, store.top], [ws.bottomMm / 1000, (ws.bottomMm + ws.heightMm) / 1000])
})

test('Bedroom 1 cuts its north-east recess wardrobe; Bedroom 3 opens its south wall onto the balcony extension', () => {
  const recess = bedroom1.furniture.northEastRecessWardrobe
  assert.deepEqual(spans(bedroom1, 'north').find(o => o[0] === 'passage'), ['passage', bedroom1.widthMm - recess.fromEastMm - recess.widthMm, bedroom1.widthMm - recess.fromEastMm])
  assert.deepEqual(roomWallOpenings(bedroom3, 'south').map(o => o.kind), ['passage', 'glassDoor', 'window'])
  assert.deepEqual(roomWallOpenings(bedroom3, 'south').map(o => o.frameStyle), [undefined, 'dark', 'dark'])
})
