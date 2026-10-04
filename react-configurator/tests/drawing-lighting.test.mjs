import test from 'node:test'
import assert from 'node:assert/strict'
import {checkDrawingLighting, headPosition, mouldingShapes, readingTiltDeg, DRIVER_LOAD_FRACTION, TRACK_TO_MOULDING_MM} from '../src/domain/drawingLighting.mjs'
import {DRAWING_LIGHTING, DRAWING_DIMMER_CIRCUITS, DRAWING_CEILING_MOULDINGS} from '../src/config/drawingLightingConfig.js'
import {EMPTY_ROOM_SHELLS} from '../src/config/roomShellConfig.js'

const room = EMPTY_ROOM_SHELLS.drawing, config = DRAWING_LIGHTING.southSofas

test('layout C has two tracks with spot and diffused heads, clear of both ceiling fans and the chandelier', () => {
  const result = checkDrawingLighting(room, config)
  assert.deepEqual(result.issues, [])
  assert.deepEqual(result.totals, {watts: 87, lumens: 7600, spots: 3, diffused: 2, reading: 3, heads: 8, lumensPerM2: 425, trackMetres: 3.95})
  assert.ok(Object.values(result.clearances).every(mm => mm >= 50), JSON.stringify(result.clearances))
})

test('one run = one circuit: each run has its own driver loaded to 80% at most, and one slider per circuit', () => {
  const result = checkDrawingLighting(room, config)
  // Owner 2026-10-04: heads on a run cannot be dimmed one by one, so the single 150 W driver became one per run.
  assert.equal(config.tracks.driverWatts, undefined)
  assert.deepEqual(result.runs, {
    T1: {watts: 21, lumens: 1800, heads: 3, driverWatts: 60, driverLoad: 35, metres: 1.5},
    T2: {watts: 66, lumens: 5800, heads: 5, driverWatts: 100, driverLoad: 66, metres: 2.45},
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
  assert.match(bad(c => { c.tracks.runs[0].atMm = 1100; c.ceilingFans.fans = [] }), /T1: a spot is 1100 mm from the north wall; beyond 1000 it no longer washes the wall/)
})

test('the ceiling mouldings from the phone scan are recorded per wall, with source, accuracy and an assumed projection', () => {
  const m = DRAWING_CEILING_MOULDINGS
  assert.equal(config.ceilingMouldings, m)
  assert.match(m.source, /phone scan 2026-10-04/); assert.match(m.accuracy, /\+\/- 20-30 mm/); assert.equal(m.projectionMm, 15)
  assert.deepEqual(m.border, {north: {fromMm: 350, toMm: 430}, east: {fromMm: 350, toMm: 420}, south: {fromMm: 370, toMm: 450}, west: {fromMm: 370, toMm: 440}})
  assert.deepEqual(m.cornerRings, {fromMm: 310, reachMm: {north: 770, east: 770, south: 800, west: 770}})
  // The medallions are the three ceiling points: the chandelier and the two fans hang from them.
  assert.deepEqual(m.medallions.map(p => [p.xMm, p.zMm, p.diameterMm]), [[1600, 2705, 830], [1650, 1290, 330], [1580, 4075, 350]])
  assert.deepEqual(m.medallions.map(p => [p.xMm, p.zMm]), [[config.ambient[0].xMm, config.ambient[0].zMm], ...config.ceilingFans.fans.map(f => [f.xMm, f.zMm])])
  // Shapes in the room frame: bands keep their distance from each wall of the app's (slightly larger) room.
  const shapes = Object.fromEntries(mouldingShapes(room, m).map(s => [s.label, s]))
  assert.equal(Object.keys(shapes).length, 11)
  assert.deepEqual(shapes['south border moulding'], {label: 'south border moulding', kind: 'border', x1: 370, x2: room.widthMm - 350, z1: room.lengthMm - 450, z2: room.lengthMm - 370})
  assert.deepEqual(shapes['south-west corner ring'], {label: 'south-west corner ring', kind: 'ring', x1: 310, x2: 770, z1: room.lengthMm - 800, z2: room.lengthMm - 310})
  assert.deepEqual(shapes['north-east corner ring'], {label: 'north-east corner ring', kind: 'ring', x1: room.widthMm - 770, x2: room.widthMm - 310, z1: 310, z2: 770})
  assert.deepEqual(mouldingShapes(room, undefined), [])
})

test('both tracks sit on flat slab: clear of the border, the corner rings and the rosettes, with nothing crossing', () => {
  const result = checkDrawingLighting(room, config), [t1, t2] = config.tracks.runs
  assert.deepEqual(result.crossings, [])
  assert.ok(Object.values(result.mouldingClearances).every(mm => mm >= TRACK_TO_MOULDING_MM), JSON.stringify(result.mouldingClearances))
  assert.equal(result.mouldingClearances['T1 to north border moulding'], 110)   // was on its inner edge (z 440 against 350-430)
  assert.equal(result.mouldingClearances['T1 to north-west corner ring'], 50)   // started at x 300, inside the ring
  assert.equal(result.mouldingClearances['T2 to west border moulding'], 200)
  assert.equal(result.mouldingClearances['T2 to south-west corner ring'], 85)   // ended at z 4700, inside the ring
  // Before and after (2026-10-05).
  assert.deepEqual([t1.atMm, t1.fromMm, t1.toMm, t1.heads.map(h => h.atMm)], [540, 820, 2320, [920, 1420, 1920]])
  assert.deepEqual([t2.atMm, t2.fromMm, t2.toMm, t2.heads.map(h => h.atMm)], [640, 2000, 4450, [2470, 2950, 3500, 3970, 4410]])
  // Track 1 still clears the north fan by the 50 mm rule even if the fans are 1400 mm, not the assumed 1200.
  assert.equal(result.clearances['T1 to North ceiling fan'], 150)
  const bigger = structuredClone(config); bigger.ceilingFans.bladeDiameterMm = 1400
  assert.equal(checkDrawingLighting(room, bigger).clearances['T1 to North ceiling fan'], 50)
  // The last reading head stops short of the corner ring and is aimed at the south sofa's west seat with a small tilt.
  const last = t2.heads.at(-1), s = room.southLayout.furniture.southSofa
  assert.deepEqual(last.targetMm, {xMm: 640, zMm: 4700})
  assert.ok(last.targetMm.zMm > s.centerZmm - s.widthMm / 2 && readingTiltDeg(t2, last, room.heightMm) < 10)
})

test('the checks catch a run on a moulding, a head on one, and a crossing that is undeclared, vague or stale', () => {
  const bad = patch => { const c = structuredClone(config); patch(c); return checkDrawingLighting(room, c).issues.join(' | ') }
  // The positions before 2026-10-05 fail: Track 1 at z 440 from x 300, Track 2 running to z 4700.
  assert.match(bad(c => { c.tracks.runs[0].atMm = 440 }), /T1 is 10 mm from the north border moulding \(needs 40 of flat slab\)/)
  assert.match(bad(c => { c.tracks.runs[0].fromMm = 300 }), /T1 lies across the north-west corner ring/)
  const old = bad(c => { c.tracks.runs[1].toMm = 4700; c.tracks.runs[1].heads[4].atMm = 4600 })
  assert.match(old, /T2 lies across the south-west corner ring/)
  assert.match(old, /T2: the base of the reading head at 4600 is 0 mm from the south-west corner ring/)
  assert.match(bad(c => { c.tracks.runs[0].atMm = 400 }), /T1 lies across the north border moulding .*a track cannot be screwed flat over a raised moulding/)
  // Outboard, on the flat painted border, is allowed as far as the mouldings go (the 300 mm wall rule still applies).
  assert.doesNotMatch(bad(c => { c.tracks.runs[0].atMm = 305 }), /moulding|ring/)
  // A declared crossing with a method is accepted, and reported; without a method, or for a moulding not reached, it is not.
  const crossing = {moulding: 'south-west corner ring', method: '10 mm stand-off spacers either side of the ring, track bridging it'}
  const declared = structuredClone(config); Object.assign(declared.tracks.runs[1], {toMm: 4700, crossings: [crossing]})
  const result = checkDrawingLighting(room, declared)
  assert.deepEqual(result.issues, [])
  assert.deepEqual(result.crossings, [{run: 'T2', ...crossing}])
  assert.match(bad(c => { Object.assign(c.tracks.runs[1], {toMm: 4700, crossings: [{moulding: 'south-west corner ring', method: 'tbd'}]}) }), /does not say how it is done/)
  assert.match(bad(c => { c.tracks.runs[1].crossings = [crossing] }), /T2: a crossing of the south-west corner ring is declared, but the run is 85 mm clear of it/)
  assert.match(bad(c => { c.tracks.runs[1].crossings = [{moulding: 'cornice', method: 'spacers under the track'}] }), /names "cornice", which is not a moulding of this room/)
  // A run through the chandelier medallion is caught as well.
  assert.match(bad(c => { c.tracks.runs[1].atMm = 1250; c.ceilingFans.fans = [] }), /T2 lies across the centre medallion/)
})
