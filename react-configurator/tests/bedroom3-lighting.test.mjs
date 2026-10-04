import test from 'node:test'
import assert from 'node:assert/strict'
import {checkTrackLighting, readingTarget, readingTiltDeg, READING_TILT_MAX_DEG} from '../src/domain/drawingLighting.mjs'
import {BEDROOM3_LIGHTING, BEDROOM3_CEILING_FAN, BEDROOM3_DIMMER_CIRCUITS, bedroom3DownTargets, bedroom3Obstacles} from '../src/config/bedroom3LightingConfig.js'
import {EMPTY_ROOM_SHELLS} from '../src/config/roomShellConfig.js'
import {ROOM_LIGHTING} from '../src/home/lighting.mjs'

const room = EMPTY_ROOM_SHELLS.bedroom3, config = BEDROOM3_LIGHTING
const check = c => checkTrackLighting(room, c, {downTargets: bedroom3DownTargets(room), obstacles: bedroom3Obstacles(room), needsReading: true})

test('Bedroom 3: a north and a south track, each its own circuit, clear of the fan and of the east cabinet bridge', () => {
  const result = check(config)
  assert.deepEqual(result.issues, [])
  assert.deepEqual(result.totals, {watts: 87, lumens: 7600, spots: 3, diffused: 2, reading: 3, heads: 8, lumensPerM2: 515, trackMetres: 6.1})
  assert.deepEqual(result.runs, {
    B1: {watts: 46, lumens: 4000, heads: 4, driverWatts: 60, driverLoad: 77, metres: 3.05},
    B2: {watts: 41, lumens: 3600, heads: 4, driverWatts: 60, driverLoad: 68, metres: 3.05},
  })
  assert.ok(result.clearances['B1 to east cabinet bridge'] >= 100 && result.clearances['B2 to east cabinet bridge'] >= 100, JSON.stringify(result.clearances))
  assert.deepEqual(BEDROOM3_DIMMER_CIRCUITS.map(([id]) => id), config.tracks.runs.map(run => run.id))
  assert.equal(ROOM_LIGHTING.bedroom3.ownFixtures, true, 'the generic overlay strips are not drawn any more')
})

test('the fan point is one field, at the scanned medallion; the checks hold with the fan anywhere within 400 mm of the room centre', () => {
  assert.equal(config.ceilingFans.fans[0], BEDROOM3_CEILING_FAN)
  assert.deepEqual([BEDROOM3_CEILING_FAN.xMm, BEDROOM3_CEILING_FAN.zMm], [2030, 1820], 'phone scan 2026-10-04')
  assert.match(BEDROOM3_CEILING_FAN.status, /phone scan of 2026-10-04; blade size and drop still assumed/)
  const centre = {xMm: Math.round(room.widthMm / 2), zMm: Math.round(room.lengthMm / 2)}
  assert.ok(Math.hypot(BEDROOM3_CEILING_FAN.xMm - centre.xMm, BEDROOM3_CEILING_FAN.zMm - centre.zMm) < 100, 'the scanned point is within 100 mm of the room centre')
  assert.deepEqual(check(config).issues, [], 'no issues with the fan at the scanned point')
  assert.equal(config.ceilingFans.toleranceMm, 400)
  for (let i = 0; i < 16; i++) for (const r of [200, 400]) {
    const a = i * Math.PI / 8, c = structuredClone(config)
    c.ceilingFans.fans[0].xMm = centre.xMm + Math.round(r * Math.cos(a)); c.ceilingFans.fans[0].zMm = centre.zMm + Math.round(r * Math.sin(a))
    assert.deepEqual(check(c).issues, [], `fan moved ${r} mm at ${Math.round(a * 180 / Math.PI)} degrees`)
  }
})

test('reading heads are aimed at each sleeper\'s chest from the foot side with a gentle tilt, plus a dressing down light', () => {
  const [north, south] = config.tracks.runs, bed = room.furniture.bed, headboardX = room.widthMm
  const sleepers = [bed.centerFromNorthMm - bed.widthMm * .23, bed.centerFromNorthMm + bed.widthMm * .23]
  const aimed = [north, south].map(run => run.heads.find(h => h.kind === 'reading' && h.targetMm))
  aimed.forEach((h, i) => {
    const run = [north, south][i], target = readingTarget(run, h), tilt = readingTiltDeg(run, h, room.heightMm)
    assert.ok(Math.abs(target.z - sleepers[i]) <= 30, `target z ${target.z} near sleeper ${Math.round(sleepers[i])}`)
    assert.ok(headboardX - target.x >= 700 && headboardX - target.x <= 850, 'over the chest, not the pillow')
    assert.ok(tilt > 15 && tilt <= READING_TILT_MAX_DEG, `tilt ${tilt}`)
  })
  const dressing = north.heads.find(h => h.kind === 'reading' && !h.targetMm), n = room.furniture.eastCabinet.north
  assert.ok(dressing.atMm > room.widthMm - room.furniture.eastCabinet.depthMm - 650 && north.atMm < n.fromNorthMm + n.widthMm, 'straight down in front of the mirror cabinet')
  assert.equal(south.heads.filter(h => h.kind === 'spot' && h.aim === 'south').length, 2, 'two spots on the wardrobe fronts')
})

test('the checks catch a run into the bridge, a reading head tilted too far, and an aimed head that misses the bed', () => {
  const bad = patch => { const c = structuredClone(config); patch(c); return check(c).issues.join(' | ') }
  assert.match(bad(c => { c.tracks.runs[0].toMm = 3600 }), /B1 passes .* from the east cabinet bridge/)
  assert.match(bad(c => { c.tracks.runs[0].heads[2].targetMm = {xMm: 3200, zMm: 2500} }), /tilted \d+ degrees/)
  assert.match(bad(c => { c.tracks.runs[1].heads[3].targetMm = {xMm: 1000, zMm: 2900} }), /aims at \(1000, 2900\), which is not over a sofa, bed or work spot/)
})
