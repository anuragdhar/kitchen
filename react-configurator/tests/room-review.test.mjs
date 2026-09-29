import test from 'node:test'
import assert from 'node:assert/strict'
import {buildRoomReview, FRAME_NOTE, REVIEW_TASKS} from '../src/domain/roomReview.mjs'
import {EMPTY_ROOM_SHELLS} from '../src/config/roomShellConfig.js'

const date = new Date('2026-09-29T10:00:00Z')

test('drawing room review carries orientation, openings, layout, measurements and tasks', () => {
  const r = buildRoomReview({roomKey: 'drawing', room: EMPTY_ROOM_SHELLS.drawing, layoutKey: 'cornerSofas', date})
  assert.match(r.title, /Drawing Room - Layout B/)
  assert.equal(r.iso, '2026-09-29')
  for (const needle of ['3353 x 5335 x 2700', 'NORTH wall', 'Door on the north wall', 'Window on the south wall', 'Open (no wall) on the east side', 'Bass Module 500', 'degrees off', 'It opens INTO this room', 'from the east jamb']) {
    assert.ok(r.text.includes(needle), `text should mention "${needle}"`)
  }
  assert.ok(r.text.includes(FRAME_NOTE.slice(0, 40)))
  for (const task of REVIEW_TASKS) assert.ok(r.text.includes(task))
  assert.ok(r.planItems.length >= 5, 'the top plan gets labelled boxes')
  for (const item of r.planItems) assert.ok(item.x2 > item.x1 && item.z2 > item.z1, `${item.label} has a positive size`)
})

test('layouts A and B describe different arrangements of the same room', () => {
  const a = buildRoomReview({roomKey: 'drawing', room: EMPTY_ROOM_SHELLS.drawing, layoutKey: 'northTv', date})
  const b = buildRoomReview({roomKey: 'drawing', room: EMPTY_ROOM_SHELLS.drawing, layoutKey: 'cornerSofas', date})
  assert.match(a.text, /TV cabinet on the north wall/)
  assert.match(b.text, /wall-mounted flat on the solid east wall/)
  assert.notEqual(a.text, b.text)
  assert.equal(a.dims, b.dims)
})

test('other rooms still produce a usable brief from generic config', () => {
  const r = buildRoomReview({roomKey: 'bedroom1', room: EMPTY_ROOM_SHELLS.bedroom1, date})
  assert.match(r.text, /Bedroom 1/)
  assert.match(r.text, /Door on the north wall/)
  assert.match(r.text, /bed: /)
  assert.equal(r.layoutLabel, null)
})

test('references are listed as links with tags and notes, and the limits are stated', () => {
  const r = buildRoomReview({roomKey: 'drawing', room: EMPTY_ROOM_SHELLS.drawing, layoutKey: 'northTv', date,
    references: [{title: 'Warm living room', url: 'https://example.com/p', tags: ['living-room'], notes: 'cream sofa'}]})
  assert.match(r.text, /Warm living room \[living-room\]: https:\/\/example.com\/p - cream sofa/)
  assert.match(r.text, /not a survey/)
})

test('the text names the picture it belongs with, so a stale image is easy to spot', () => {
  const r = buildRoomReview({roomKey: 'lobby', room: EMPTY_ROOM_SHELLS.lobby, date})
  assert.match(r.text, /The attached image should have the title "Lobby \/ Dining" in its top-left corner/)
})

test('the lobby and bedrooms get labelled plan boxes and their exact ranges in the text', () => {
  const lobby = buildRoomReview({roomKey: 'lobby', room: EMPTY_ROOM_SHELLS.lobby, date})
  assert.ok(lobby.planItems.some(i => /Table/.test(i.label)) && lobby.planItems.some(i => /Ironing/.test(i.label)))
  assert.match(lobby.text, /Table 1200x700: x 1850-2550, z 20-1220/)
  assert.match(lobby.text, /chairRowsZmm: 290, 950/)
  assert.match(lobby.text, /Pooja alcove on the north wall: 1200 mm wide starting 3793 mm/)
  for (const key of ['bedroom1', 'bedroom3']) {
    const r = buildRoomReview({roomKey: key, room: EMPTY_ROOM_SHELLS[key], date})
    assert.ok(r.planItems.length >= 2, `${key} has plan boxes`)
    for (const i of r.planItems) {
      assert.ok(i.x1 >= 0 && i.z1 >= 0 && i.x2 <= EMPTY_ROOM_SHELLS[key].widthMm && i.z2 <= EMPTY_ROOM_SHELLS[key].lengthMm && i.x2 > i.x1 && i.z2 > i.z1, `${key} ${i.label} stays inside the room`)
    }
  }
})

test('the lobby brief mentions the closed old Bedroom 1 door as plain wall', () => {
  const r = buildRoomReview({roomKey: 'lobby', room: EMPTY_ROOM_SHELLS.lobby, date})
  assert.match(r.text, /Closed old door on the north wall to Bedroom 1, x 2400-3226/)
  assert.match(r.text, /fibre-cement sheet/)
  assert.match(r.text, /100 mm from the west end/)
})
