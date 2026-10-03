import test from 'node:test'
import assert from 'node:assert/strict'
import {checkDrawingLighting, headPosition} from '../src/domain/drawingLighting.mjs'
import {DRAWING_LIGHTING} from '../src/config/drawingLightingConfig.js'
import {EMPTY_ROOM_SHELLS} from '../src/config/roomShellConfig.js'

const room = EMPTY_ROOM_SHELLS.drawing, config = DRAWING_LIGHTING.southSofas

test('layout C has two tracks with spot and diffused heads, clear of both ceiling fans and the chandelier', () => {
  const result = checkDrawingLighting(room, config)
  assert.deepEqual(result.issues, [])
  assert.deepEqual(result.totals, {watts: 87, lumens: 7600, spots: 3, diffused: 2, reading: 3, heads: 8, lumensPerM2: 425, trackMetres: 4.7})
  assert.ok(Object.values(result.clearances).every(mm => mm >= 50), JSON.stringify(result.clearances))
})

test('the chandelier stays; the old north-west wall light is removed in layout C only', () => {
  assert.equal(config.ambient.length, 1)
  assert.equal(config.wallUplight, null)
  assert.ok(DRAWING_LIGHTING.northTv.wallUplight && DRAWING_LIGHTING.cornerSofas.wallUplight)
  assert.equal(config.ceilingFans.fans.length, 2)
  assert.match(config.ceilingFans.status, /assumed/)
})

test('track 1 grazes the TV panel wall and track 2 runs along the west wall over the sofa', () => {
  const [t1, t2] = config.tracks.runs, sofa = room.southLayout.furniture.westSofa
  assert.equal(t1.axis, 'x'); assert.ok(t1.atMm < 600 && t1.heads.every(h => h.kind === 'spot' && h.aim === 'north'))
  assert.ok(t1.heads.every(h => h.atMm > room.southLayout.wallPanel.fromWestMm && h.atMm < room.southLayout.wallPanel.toMm), 'spots are over the panelled stretch')
  assert.equal(t2.axis, 'z'); assert.ok(t2.atMm < sofa.centerXmm + sofa.widthMm / 2)
  assert.deepEqual(headPosition(t2, t2.heads[0]), {x: 640, z: 2470})
})

test('reading is done by stronger dimmable heads over the seats, not by a swing-arm wall light', () => {
  const t2 = config.tracks.runs[1], reading = t2.heads.filter(h => h.kind === 'reading')
  assert.equal(config.reading, null)
  assert.equal(reading.length, 3)
  assert.ok(reading.every(h => h.lumens >= 1000))
  const bad = patch => { const c = structuredClone(config); patch(c); return checkDrawingLighting(room, c).issues.join(' | ') }
  assert.match(bad(c => { c.tracks.runs[1].heads[0].atMm = 2050 }), /not over a sofa/)
  assert.match(bad(c => { c.tracks.runs[1].heads = c.tracks.runs[1].heads.filter(h => h.kind !== 'reading') }), /no reading light/)
})

test('the checks catch a track under a fan, a diffused head near the blades, a spot aimed across the room and an overloaded driver', () => {
  const bad = patch => { const c = structuredClone(config); patch(c); return checkDrawingLighting(room, c).issues.join(' | ') }
  assert.match(bad(c => { c.tracks.runs[0].atMm = 1000 }), /T1 passes .* from the blades of the North ceiling fan/)
  assert.match(bad(c => { c.tracks.runs[1].atMm = 1000; c.tracks.runs[1].heads[1].atMm = 4300 }), /would flicker/)
  assert.match(bad(c => { c.tracks.runs[0].heads[0].aim = 'south' }), /across the room/)
  assert.match(bad(c => { c.tracks.driverWatts = 100 }), /over 80% of the 100 W driver/)
  assert.match(bad(c => { c.ceilingFans.fans[1].zMm = 3600 }), /blades come within .* of the chandelier/)
})
