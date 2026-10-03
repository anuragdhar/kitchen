import test from 'node:test'
import assert from 'node:assert/strict'
import {checkTrackLighting, headPosition} from '../src/domain/drawingLighting.mjs'
import {LOBBY_LIGHTING, LOBBY_DIMMER_KINDS} from '../src/config/lobbyLightingConfig.js'
import {EMPTY_ROOM_SHELLS} from '../src/config/roomShellConfig.js'

const room = EMPTY_ROOM_SHELLS.lobby, s = room.furniture.eastIroningStorage
// The ironing board pulled out westward from the east-wall storage.
const board = {x1: room.widthMm - s.depthMm - s.boardLengthMm, x2: room.widthMm - s.depthMm, z1: s.fromNorthMm, z2: s.fromNorthMm + s.lengthMm}

test('the Lobby has two wall-hugging tracks with wall spots, diffused heads and a down spot over the ironing board', () => {
  const result = checkTrackLighting(room, LOBBY_LIGHTING, {downTargets: [board]})
  assert.deepEqual(result.issues, [])
  assert.deepEqual(result.totals, {watts: 63, lumens: 5600, spots: 3, diffused: 2, reading: 1, heads: 6, lumensPerM2: 342, trackMetres: 4.1})
})

test('both tracks leave the middle of the ceiling free and stay clear of the doors and the dining pendant', () => {
  const [l1, l2] = LOBBY_LIGHTING.tracks.runs, toilet = room.doors.find(d => d.wall === 'south'), table = room.furniture.diningTable
  assert.ok(l1.atMm > room.lengthMm - 700 && l1.fromMm > toilet.fromMm + toilet.widthMm, 'track 1 is on the south wall, east of the toilet door')
  assert.ok(l2.atMm > room.widthMm - 1100 && l2.toMm <= room.wallOpenings.east.fromMm, 'track 2 is in front of the ironing storage, north of the east opening')
  assert.ok(l2.atMm - (table.centerXmm + table.widthMm / 2) > 1000, 'well clear of the dining table and its pendant')
  const centre = {x: room.widthMm / 2, z: room.lengthMm / 2}
  for (const run of [l1, l2]) assert.ok(Math.abs((run.axis === 'x' ? centre.z : centre.x) - run.atMm) >= 1000, `${run.id} is at least 1 m from the room centre`)
  assert.deepEqual(headPosition(l2, l2.heads[1]), {x: 4050, z: 1375})
  assert.deepEqual(LOBBY_DIMMER_KINDS.map(([kind]) => kind), ['chandelier', 'spot', 'diffuse', 'reading'])
})

test('the checks catch a down spot that misses the ironing board and a spot aimed across the room', () => {
  const bad = patch => { const c = structuredClone(LOBBY_LIGHTING); patch(c); return checkTrackLighting(room, c, {downTargets: [board]}).issues.join(' | ') }
  assert.match(bad(c => { c.tracks.runs[1].heads[1].atMm = 600 }), /not over a sofa or work spot/)
  assert.match(bad(c => { c.tracks.runs[0].heads[0].aim = 'north' }), /across the room/)
})
