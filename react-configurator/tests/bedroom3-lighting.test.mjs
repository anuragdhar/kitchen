import test from 'node:test'
import assert from 'node:assert/strict'
import {checkTrackLighting, readingTarget, readingTiltDeg, READING_TILT_MAX_DEG, TRACK_TO_MOULDING_MM} from '../src/domain/drawingLighting.mjs'
import {BEDROOM3_LIGHTING, BEDROOM3_CEILING_FAN, BEDROOM3_CEILING_MOULDINGS, BEDROOM3_DIMMER_CIRCUITS, bedroom3DownTargets, bedroom3Obstacles} from '../src/config/bedroom3LightingConfig.js'
import {EMPTY_ROOM_SHELLS} from '../src/config/roomShellConfig.js'
import {ROOM_LIGHTING} from '../src/home/lighting.mjs'

const room = EMPTY_ROOM_SHELLS.bedroom3, config = BEDROOM3_LIGHTING
const check = c => checkTrackLighting(room, c, {downTargets: bedroom3DownTargets(room), obstacles: bedroom3Obstacles(room), needsReading: true})

// Baselines changed on purpose (owner 2026-10-05: "In room 3 swap the place of dressing, move it to south side; in place of
// dressing show full depth cabinet till ceiling"): the 12 W dressing down light moved from B1 to B2, and B2's driver went
// from 60 to 100 W to carry it (53 W is over 80% of 60 W). Before: B1 46 W / 4 heads (77%), B2 41 W / 4 heads (68%).
test('Bedroom 3: a north and a south track, each its own circuit, clear of the fan, the east cabinet bridge and the full-height cabinet', () => {
  const result = check(config)
  assert.deepEqual(result.issues, [])
  assert.deepEqual(result.totals, {watts: 87, lumens: 7600, spots: 3, diffused: 2, reading: 3, heads: 8, lumensPerM2: 515, trackMetres: 5.5})
  assert.deepEqual(result.runs, {
    B1: {watts: 34, lumens: 3000, heads: 3, driverWatts: 60, driverLoad: 57, metres: 2.75},
    B2: {watts: 53, lumens: 4600, heads: 5, driverWatts: 100, driverLoad: 53, metres: 2.75},
  })
  assert.deepEqual(bedroom3Obstacles(room).map(o => [o.label, o.z1, o.z2]), [['east cabinet bridge', 900, 3576], ['full-height storage cabinet', 150, 900]])
  for (const key of ['B1 to east cabinet bridge', 'B2 to east cabinet bridge', 'B1 to full-height storage cabinet', 'B2 to full-height storage cabinet']) assert.ok(result.clearances[key] >= 100, JSON.stringify(result.clearances))
  assert.equal(result.clearances['B1 to full-height storage cabinet'], 156)
  assert.deepEqual(BEDROOM3_DIMMER_CIRCUITS.map(([id]) => id), config.tracks.runs.map(run => run.id))
  assert.equal(ROOM_LIGHTING.bedroom3.ownFixtures, true, 'the generic overlay strips are not drawn any more')
})

test('the fan point is one field, at the scanned medallion; the checks hold with the fan anywhere within 150 mm of it', () => {
  assert.equal(config.ceilingFans.fans[0], BEDROOM3_CEILING_FAN)
  assert.deepEqual([BEDROOM3_CEILING_FAN.xMm, BEDROOM3_CEILING_FAN.zMm], [2030, 1820], 'phone scan 2026-10-04')
  assert.match(BEDROOM3_CEILING_FAN.status, /phone scan of 2026-10-04; blade size and drop still assumed/)
  const centre = {xMm: Math.round(room.widthMm / 2), zMm: Math.round(room.lengthMm / 2)}
  assert.ok(Math.hypot(BEDROOM3_CEILING_FAN.xMm - centre.xMm, BEDROOM3_CEILING_FAN.zMm - centre.zMm) < 100, 'the scanned point is within 100 mm of the room centre')
  assert.deepEqual(check(config).issues, [], 'no issues with the fan at the scanned point')
  // Was 400 mm about the room centre while the fan was only assumed; the scan fixed the point (+/- 50) and the corner
  // rings of the ceiling moulding moved both runs inboard (2026-10-05), so the margin is now 150 mm about the scanned point.
  assert.equal(config.ceilingFans.toleranceMm, 150)
  for (let i = 0; i < 16; i++) for (const r of [75, config.ceilingFans.toleranceMm]) {
    const a = i * Math.PI / 8, c = structuredClone(config)
    c.ceilingFans.fans[0].xMm = BEDROOM3_CEILING_FAN.xMm + Math.round(r * Math.cos(a)); c.ceilingFans.fans[0].zMm = BEDROOM3_CEILING_FAN.zMm + Math.round(r * Math.sin(a))
    assert.deepEqual(check(c).issues, [], `fan moved ${r} mm at ${Math.round(a * 180 / Math.PI)} degrees`)
  }
})

test('the Bedroom 3 mouldings are recorded and both tracks sit on flat slab inboard of the corner rings, with nothing crossing', () => {
  const m = BEDROOM3_CEILING_MOULDINGS, result = check(config), [b1, b2] = config.tracks.runs
  assert.equal(config.ceilingMouldings, m)
  assert.match(m.source, /phone scan 2026-10-04/); assert.match(m.accuracy, /projection not measurable/)
  assert.deepEqual(m.border, {north: {fromMm: 360, toMm: 430}, east: {fromMm: 380, toMm: 450}, south: {fromMm: 380, toMm: 450}, west: {fromMm: 440, toMm: 520}})
  assert.deepEqual(m.cornerRings, {fromMm: 330, reachMm: {north: 740, east: 780, south: 750, west: 800}})
  assert.deepEqual(m.medallions.map(p => [p.xMm, p.zMm, p.diameterMm]), [[BEDROOM3_CEILING_FAN.xMm, BEDROOM3_CEILING_FAN.zMm, 760]])
  assert.deepEqual(result.crossings, [])
  assert.ok(Object.values(result.mouldingClearances).every(mm => mm >= TRACK_TO_MOULDING_MM), JSON.stringify(result.mouldingClearances))
  assert.equal(result.mouldingClearances['B1 to north-west corner ring'], 80)
  assert.equal(result.mouldingClearances['B1 to west border moulding'], 80)
  assert.equal(result.mouldingClearances['B2 to south-east corner ring'], 70)
  assert.deepEqual([result.clearances['B1 to Ceiling fan'], result.clearances['B2 to Ceiling fan']], [400, 486])
  // Before and after (2026-10-05): B1 was 650 off the north wall and B2 626 off the south wall, both from x 300.
  // Dressing swap (later 2026-10-05): the head at 3300 moved from B1 to B2; the runs themselves did not move.
  assert.deepEqual([b1.atMm, b1.fromMm, b1.toMm, b1.heads.map(h => h.atMm)], [820, 600, 3350, [1300, 2300, 2950]])
  assert.deepEqual([room.lengthMm - b2.atMm, b2.fromMm, b2.toMm, b2.heads.map(h => h.atMm)], [820, 600, 3350, [650, 1135, 1620, 2950, 3300]])
  const bad = patch => { const c = structuredClone(config); patch(c); return check(c).issues.join(' | ') }
  const old = bad(c => { c.tracks.runs[0].atMm = 650; c.tracks.runs[0].fromMm = 300 })
  assert.match(old, /B1 lies across the west border moulding/); assert.match(old, /B1 lies across the north-west corner ring/)
  assert.match(old, /B1 lies across the north-east corner ring/)
  assert.match(bad(c => { c.tracks.runs[1].atMm = 3100 }), /B2 lies across the south-west corner ring/)
})

test('reading heads are aimed at each sleeper\'s chest from the foot side with a gentle tilt, plus a dressing down light on the south run (moved 2026-10-05)', () => {
  const [north, south] = config.tracks.runs, bed = room.furniture.bed, headboardX = room.widthMm
  const sleepers = [bed.centerFromNorthMm - bed.widthMm * .23, bed.centerFromNorthMm + bed.widthMm * .23]
  const aimed = [north, south].map(run => run.heads.find(h => h.kind === 'reading' && h.targetMm))
  aimed.forEach((h, i) => {
    const run = [north, south][i], target = readingTarget(run, h), tilt = readingTiltDeg(run, h, room.heightMm)
    assert.ok(Math.abs(target.z - sleepers[i]) <= 30, `target z ${target.z} near sleeper ${Math.round(sleepers[i])}`)
    assert.ok(headboardX - target.x >= 700 && headboardX - target.x <= 850, 'over the chest, not the pillow')
    assert.ok(tilt > 15 && tilt <= READING_TILT_MAX_DEG, `tilt ${tilt}`)
  })
  // Owner 2026-10-05: the mirror dressing cabinet is now the south unit, so its down light is on B2 and B1 has none.
  const c = room.furniture.eastCabinet, s = c.south, dressing = south.heads.find(h => h.kind === 'reading' && !h.targetMm)
  assert.equal(north.heads.filter(h => h.kind === 'reading' && !h.targetMm).length, 0, 'no dressing light left on the north run')
  assert.ok(s.mirrorTopMm != null && c.north.mirrorTopMm == null, 'the mirror is on the south unit')
  assert.equal(dressing.atMm, 3300)
  assert.ok(dressing.atMm > room.widthMm - c.depthMm - s.standDepthMm && dressing.atMm < room.widthMm - c.depthMm, 'over the standing spot, in front of the mirror')
  assert.ok(south.atMm > s.fromNorthMm && south.atMm < s.fromNorthMm + s.widthMm, 'the south run crosses the standing spot')
  const spot = bedroom3DownTargets(room).find(t => /dressing/.test(t.label))
  assert.deepEqual([spot.x1, spot.x2, spot.z1, spot.z2].map(Math.round), [2856, 3506, 2826, 3576])
  const moved = structuredClone(config); moved.tracks.runs[1].heads.pop(); moved.tracks.runs[0].heads.push({kind: 'reading', atMm: 3300, watts: 12, lumens: 1000})
  assert.match(check(moved).issues.join(' | '), /B1: the down-pointing head at 3300 is not over a sofa, bed or work spot/, 'the old place no longer has a dressing spot under it')
  const small = structuredClone(config); small.tracks.runs[1].driverWatts = 60
  assert.match(check(small).issues.join(' | '), /B2: the heads draw 53 W, over 80% of its 60 W driver/)
  assert.equal(south.heads.filter(h => h.kind === 'spot' && h.aim === 'south').length, 2, 'two spots on the wardrobe fronts')
})

test('the checks catch a run into the bridge, a reading head tilted too far, and an aimed head that misses the bed', () => {
  const bad = patch => { const c = structuredClone(config); patch(c); return check(c).issues.join(' | ') }
  assert.match(bad(c => { c.tracks.runs[0].toMm = 3600 }), /B1 passes .* from the east cabinet bridge/)
  assert.match(bad(c => { c.tracks.runs[0].toMm = 3500 }), /B1 passes \d+ mm from the full-height storage cabinet/)
  assert.match(bad(c => { c.tracks.runs[0].heads[2].targetMm = {xMm: 3200, zMm: 2500} }), /tilted \d+ degrees/)
  assert.match(bad(c => { c.tracks.runs[1].heads[3].targetMm = {xMm: 1000, zMm: 2900} }), /aims at \(1000, 2900\), which is not over a sofa, bed or work spot/)
})
