import test from 'node:test'
import assert from 'node:assert/strict'
import {checkTrackLighting, headPosition, readingTiltDeg} from '../src/domain/drawingLighting.mjs'
import {BEDROOM1_LIGHTING, BEDROOM1_DIMMER_CIRCUITS, bedroom1DownTargets} from '../src/config/bedroom1LightingConfig.js'
import {EMPTY_ROOM_SHELLS} from '../src/config/roomShellConfig.js'
import {ROOM_LIGHTING} from '../src/home/lighting.mjs'

const room = EMPTY_ROOM_SHELLS.bedroom1, config = BEDROOM1_LIGHTING
const check = c => checkTrackLighting(room, c, {downTargets: bedroom1DownTargets(room), needsReading: true})

test('Bedroom 1: a wardrobe/general track and a bed track, each its own circuit, clear of the assumed ceiling fan', () => {
  const result = check(config)
  assert.deepEqual(result.issues, [])
  assert.deepEqual(result.totals, {watts: 82, lumens: 7200, spots: 4, diffused: 2, reading: 2, heads: 8, lumensPerM2: 663, trackMetres: 3.8})
  assert.deepEqual(result.runs, {
    B1: {watts: 51, lumens: 4600, heads: 5, driverWatts: 100, driverLoad: 51, metres: 2.6},
    B2: {watts: 31, lumens: 2600, heads: 3, driverWatts: 60, driverLoad: 52, metres: 1.2},
  })
  assert.deepEqual(BEDROOM1_DIMMER_CIRCUITS.map(([id]) => id), config.tracks.runs.map(run => run.id))
  assert.equal(ROOM_LIGHTING.bedroom1.ownFixtures, true, 'the generic overlay strips are not drawn any more')
})

test('the fan is assumed at the room centre until measured, and every run keeps well clear of its blades', () => {
  const fan = config.ceilingFans.fans[0]
  assert.equal(fan.status, 'assumed')
  assert.ok(Math.abs(fan.xMm - room.widthMm / 2) <= 1 && Math.abs(fan.zMm - room.lengthMm / 2) <= 1, 'at the room centre')
  const {clearances} = check(config)
  for (const [key, mm] of Object.entries(clearances)) assert.ok(mm >= 200, `${key}: ${mm} mm`)
})

test('track 1 grazes the wardrobe doors; track 2 puts a reading head over each sleeper, 750 mm from the headboard', () => {
  const [t1, t2] = config.tracks.runs, wardrobe = room.furniture.wardrobe, bed = room.furniture.bed
  assert.equal(t1.axis, 'z'); assert.ok(t1.atMm > wardrobe.depthMm + 250 && t1.atMm < 1000)
  assert.equal(t1.heads.filter(h => h.kind === 'spot' && h.aim === 'west' && h.atMm < wardrobe.lengthMm).length, wardrobe.doorCount, 'one spot per wardrobe door')
  assert.equal(t2.axis, 'z'); assert.equal(room.widthMm - t2.atMm, 753)
  const reading = t2.heads.filter(h => h.kind === 'reading')
  assert.equal(reading.length, 2)
  const bedCentreZ = room.lengthMm - bed.fromSouthMm - bed.widthMm / 2
  assert.deepEqual(reading.map(h => Math.sign(h.atMm - bedCentreZ)), [-1, 1], 'one head each side of the bed centre')
  for (const h of reading) { assert.equal(h.targetMm, undefined); assert.equal(readingTiltDeg(t2, h, room.heightMm), 0) }
  assert.deepEqual(headPosition(t2, reading[0]), {x: 2600, z: 2130})
})

test('the checks catch a reading head off the bed, a spot aimed across the room and a run through the fan', () => {
  const bad = patch => { const c = structuredClone(config); patch(c); return check(c).issues.join(' | ') }
  assert.match(bad(c => { c.tracks.runs[1].atMm = 1400 }), /not over a sofa, bed or work spot/)
  assert.match(bad(c => { c.tracks.runs[0].heads[0].aim = 'east' }), /across the room/)
  assert.match(bad(c => { c.tracks.runs[0].atMm = 1500 }), /B1 passes .* from the blades/)
})
