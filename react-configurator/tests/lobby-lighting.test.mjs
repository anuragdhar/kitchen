import test from 'node:test'
import assert from 'node:assert/strict'
import {checkTrackLighting, headPosition} from '../src/domain/drawingLighting.mjs'
import {LOBBY_LIGHTING, LOBBY_DIMMER_CIRCUITS} from '../src/config/lobbyLightingConfig.js'
import {EMPTY_ROOM_SHELLS} from '../src/config/roomShellConfig.js'
import {ROOM_LIGHTING} from '../src/home/lighting.mjs'

const room = EMPTY_ROOM_SHELLS.lobby, s = room.furniture.eastIroningStorage
// The ironing board pulled out westward from the east-wall storage.
const board = {x1: room.widthMm - s.depthMm - s.boardLengthMm, x2: room.widthMm - s.depthMm, z1: s.fromNorthMm, z2: s.fromNorthMm + s.lengthMm}

test('the Lobby has two wall-hugging tracks with wall spots, diffused heads and a down spot over the ironing board', () => {
  const result = checkTrackLighting(room, LOBBY_LIGHTING, {downTargets: [board]})
  assert.deepEqual(result.issues, [])
  assert.deepEqual(result.totals, {watts: 63, lumens: 5600, spots: 3, diffused: 2, reading: 1, heads: 6, lumensPerM2: 342, trackMetres: 4.1})
})

test('each track is its own circuit with its own driver, and the sliders are pendant, track 1, track 2', () => {
  const result = checkTrackLighting(room, LOBBY_LIGHTING, {downTargets: [board]})
  assert.equal(LOBBY_LIGHTING.tracks.driverWatts, undefined, 'the shared 100 W driver is gone')
  assert.deepEqual(result.runs, {
    L1: {watts: 44, lumens: 4000, heads: 4, driverWatts: 60, driverLoad: 73, metres: 2.6},
    L2: {watts: 19, lumens: 1600, heads: 2, driverWatts: 60, driverLoad: 32, metres: 1.5},
  })
  assert.deepEqual(LOBBY_DIMMER_CIRCUITS.map(([id]) => id), ['chandelier', 'L1', 'L2'])
})

test('the old strip lights are gone from the Lobby and the Pooja alcove; the pendant and tracks stay', () => {
  // The generic overlay (render/interiorLighting.js) no longer draws its cove/cabinet/accent strips in rooms with their own
  // fixtures (owner 2026-10-04: "old strip lights ... remove them").
  assert.equal(ROOM_LIGHTING.lobby.ownFixtures, true)
  assert.equal(ROOM_LIGHTING.pooja.ownFixtures, true)
  assert.equal(ROOM_LIGHTING.balcony.ownFixtures, false, 'rooms without their own fixtures keep the overlay')
  assert.equal(LOBBY_LIGHTING.pendant.label, 'Dining pendant')
  assert.equal(LOBBY_LIGHTING.tracks.runs.length, 2)
})

test('both tracks leave the middle of the ceiling free and stay clear of the doors and the dining pendant', () => {
  const [l1, l2] = LOBBY_LIGHTING.tracks.runs, toilet = room.doors.find(d => d.wall === 'south'), table = room.furniture.diningTable
  assert.ok(l1.atMm > room.lengthMm - 700 && l1.fromMm > toilet.fromMm + toilet.widthMm, 'track 1 is on the south wall, east of the toilet door')
  assert.ok(l2.atMm > room.widthMm - 1100 && l2.toMm <= room.wallOpenings.east.fromMm, 'track 2 is in front of the ironing storage, north of the east opening')
  assert.ok(l2.atMm - (table.centerXmm + table.widthMm / 2) > 1000, 'well clear of the dining table and its pendant')
  const centre = {x: room.widthMm / 2, z: room.lengthMm / 2}
  for (const run of [l1, l2]) assert.ok(Math.abs((run.axis === 'x' ? centre.z : centre.x) - run.atMm) >= 1000, `${run.id} is at least 1 m from the room centre`)
  assert.deepEqual(headPosition(l2, l2.heads[1]), {x: 4050, z: 1375})
  // Phone scan 2026-10-04: the toilet door as it stands, the Bedroom 1 door where the civil work will put it.
  assert.deepEqual([toilet.fromMm, toilet.widthMm], [1060, 605])
  const bedroom = room.doors.find(d => d.wall === 'north')
  assert.deepEqual([bedroom.fromMm, bedroom.widthMm], [100, 900])
  assert.deepEqual(LOBBY_LIGHTING.existingCeilingPoints.map(p => [p.xMm, p.zMm]), [[2645, 1600], [3810, 1615]])
})

test('the checks catch a down spot that misses the ironing board, a spot aimed across the room and an overloaded run', () => {
  const bad = patch => { const c = structuredClone(LOBBY_LIGHTING); patch(c); return checkTrackLighting(room, c, {downTargets: [board]}).issues.join(' | ') }
  assert.match(bad(c => { c.tracks.runs[1].heads[1].atMm = 600 }), /not over a sofa, bed or work spot/)
  assert.match(bad(c => { c.tracks.runs[0].heads[0].aim = 'north' }), /across the room/)
  assert.match(bad(c => { c.tracks.runs[0].driverWatts = 50 }), /L1: the heads draw 44 W, over 80% of its 50 W driver/)
})
