import test from 'node:test'
import assert from 'node:assert/strict'
import {checkDrawingLighting, headPosition, DRIVER_LOAD_FRACTION} from '../src/domain/drawingLighting.mjs'
import {DRAWING_LIGHTING, DRAWING_DIMMER_CIRCUITS} from '../src/config/drawingLightingConfig.js'
import {EMPTY_ROOM_SHELLS} from '../src/config/roomShellConfig.js'

const room = EMPTY_ROOM_SHELLS.drawing, config = DRAWING_LIGHTING.southSofas

test('layout C has two tracks with spot and diffused heads, clear of both ceiling fans and the chandelier', () => {
  const result = checkDrawingLighting(room, config)
  assert.deepEqual(result.issues, [])
  assert.deepEqual(result.totals, {watts: 87, lumens: 7600, spots: 3, diffused: 2, reading: 3, heads: 8, lumensPerM2: 425, trackMetres: 4.7})
  assert.ok(Object.values(result.clearances).every(mm => mm >= 50), JSON.stringify(result.clearances))
})

test('one run = one circuit: each run has its own driver loaded to 80% at most, and one slider per circuit', () => {
  const result = checkDrawingLighting(room, config)
  // Owner 2026-10-04: heads on a run cannot be dimmed one by one, so the single 150 W driver became one per run.
  assert.equal(config.tracks.driverWatts, undefined)
  assert.deepEqual(result.runs, {
    T1: {watts: 21, lumens: 1800, heads: 3, driverWatts: 60, driverLoad: 35, metres: 2},
    T2: {watts: 66, lumens: 5800, heads: 5, driverWatts: 100, driverLoad: 66, metres: 2.7},
  })
  for (const run of config.tracks.runs) assert.ok(run.heads.reduce((w, h) => w + h.watts, 0) <= run.driverWatts * DRIVER_LOAD_FRACTION, run.id)
  assert.deepEqual(DRAWING_DIMMER_CIRCUITS.map(([id]) => id), ['chandelier', ...config.tracks.runs.map(run => run.id)])
})

test('the chandelier stays; the old north-west wall light is removed in layout C only', () => {
  assert.equal(config.ambient.length, 1)
  assert.equal(config.wallUplight, null)
  assert.ok(DRAWING_LIGHTING.northTv.wallUplight && DRAWING_LIGHTING.cornerSofas.wallUplight)
  assert.equal(config.ceilingFans.fans.length, 2)
  // Positions come from the phone scan of 2026-10-04 (docs/SITE_SCAN_2026-10-04.md); blade size and drop are still assumed.
  assert.match(config.ceilingFans.status, /phone scan of 2026-10-04.*blade size and drop assumed/)
  assert.deepEqual(config.ceilingFans.fans.map(f => [f.xMm, f.zMm]), [[1650, 1290], [1580, 4075]])
  assert.deepEqual([config.ambient[0].xMm, config.ambient[0].zMm], [1600, 2705])
})

test('track 1 grazes the TV panel wall and track 2 runs along the west wall over the sofa', () => {
  const [t1, t2] = config.tracks.runs, sofa = room.southLayout.furniture.westSofa
  assert.equal(t1.axis, 'x'); assert.ok(t1.atMm < 600 && t1.heads.every(h => h.kind === 'spot' && h.aim === 'north'))
  assert.ok(t1.heads.every(h => h.atMm > room.southLayout.wallPanel.fromWestMm && h.atMm < room.southLayout.wallPanel.toMm), 'spots are over the panelled stretch')
  assert.equal(t2.axis, 'z'); assert.ok(t2.atMm < sofa.centerXmm + sofa.widthMm / 2)
  assert.deepEqual(headPosition(t2, t2.heads[0]), {x: 640, z: 2470})
})

test('track 2 is one circuit of mixed reading and diffused heads over the seats, not a swing-arm wall light', () => {
  const t2 = config.tracks.runs[1], reading = t2.heads.filter(h => h.kind === 'reading')
  assert.equal(config.reading, null)
  assert.equal(reading.length, 3)
  assert.ok(reading.every(h => h.lumens >= 1000))
  assert.ok(t2.heads.some(h => h.kind === 'diffuse'), 'the diffused heads stay on the same run; the whole run dims together')
  const bad = patch => { const c = structuredClone(config); patch(c); return checkDrawingLighting(room, c).issues.join(' | ') }
  assert.match(bad(c => { c.tracks.runs[1].heads[0].atMm = 2050 }), /not over a sofa, bed or work spot/)
  assert.match(bad(c => { c.tracks.runs[1].heads = c.tracks.runs[1].heads.filter(h => h.kind !== 'reading') }), /no reading light/)
})

test('the checks catch a track under a fan, a diffused head near the blades, a spot aimed across the room and an overloaded run', () => {
  const bad = patch => { const c = structuredClone(config); patch(c); return checkDrawingLighting(room, c).issues.join(' | ') }
  assert.match(bad(c => { c.tracks.runs[0].atMm = 1000 }), /T1 passes .* from the blades of the North ceiling fan/)
  assert.match(bad(c => { c.tracks.runs[1].atMm = 1000; c.tracks.runs[1].heads[1].atMm = 4300 }), /would flicker/)
  assert.match(bad(c => { c.tracks.runs[0].heads[0].aim = 'south' }), /across the room/)
  assert.match(bad(c => { c.tracks.runs[1].driverWatts = 60 }), /T2: the heads draw 66 W, over 80% of its 60 W driver/)
  assert.match(bad(c => { delete c.tracks.runs[0].driverWatts }), /T1: no driver; each run is one circuit/)
  assert.match(bad(c => { c.ceilingFans.fans[1].zMm = 3600 }), /blades come within .* of the chandelier/)
})
