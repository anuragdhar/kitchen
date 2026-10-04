import test from 'node:test'
import assert from 'node:assert/strict'
import {checkTrackLighting, mirrorTrackConfig, readingTarget, readingTiltDeg, headPosition} from '../src/domain/drawingLighting.mjs'
import {KITCHEN_LIGHTING, KITCHEN_DIMMER_CIRCUITS, KITCHEN_WORK_SPOTS, KITCHEN_CEILING_OBSTACLES} from '../src/config/kitchenLightingConfig.js'
import {ROOM_WIDTH, ROOM_LENGTH, EAST_INIT, WEST_INIT, EAST_TOP_UPPER_DEPTH, WEST_TOP_UPPER_DEPTH} from '../src/config/kitchenConfig.js'
import {ROOM_LIGHTING} from '../src/home/lighting.mjs'

const config = KITCHEN_LIGHTING, room = config.room
const check = c => checkTrackLighting(room, c, {downTargets: KITCHEN_WORK_SPOTS, obstacles: KITCHEN_CEILING_OBSTACLES, needsSpots: false, needsReading: true})

test('Kitchen: one track down the middle of the walkway, clear of the wall cabinets that reach the ceiling and of the shaft', () => {
  const result = check(config)
  assert.deepEqual(result.issues, [])
  assert.deepEqual(result.totals, {watts: 69, lumens: 6200, spots: 0, diffused: 3, reading: 2, heads: 5, lumensPerM2: 562, trackMetres: 3.95})
  assert.deepEqual(result.runs, {K1: {watts: 69, lumens: 6200, heads: 5, driverWatts: 100, driverLoad: 69, metres: 3.95}})
  const [run] = config.tracks.runs
  assert.equal(run.axis, 'z')
  assert.equal(run.atMm, Math.round((WEST_TOP_UPPER_DEPTH + ROOM_WIDTH - EAST_TOP_UPPER_DEPTH) / 2), 'centred between the top wall cabinets')
  assert.ok(Object.values(result.clearances).every(mm => mm >= 500), JSON.stringify(result.clearances))
  assert.equal(config.ceilingFans, null, 'no ceiling fan in the kitchen')
  assert.deepEqual(KITCHEN_DIMMER_CIRCUITS.map(([id]) => id), ['K1', 'led'])
  assert.equal(config.underCabinetLed.kept, true, 'the under-cabinet LED strips of the cabinet design stay')
  assert.equal(ROOM_LIGHTING.kitchen.ownFixtures, true, 'the generic overlay strips are not drawn any more')
})

test('the down lights follow the hob and the sink of the default layout (z measured from the north wall)', () => {
  const gas = EAST_INIT.find(i => i.id === 'gas'), sink = WEST_INIT.find(i => i.id === 'sink'), [run] = config.tracks.runs
  const [hob, basin] = run.heads.filter(h => h.kind === 'reading')
  assert.equal(hob.atMm, Math.round(ROOM_LENGTH - gas.y - gas.w / 2))
  assert.equal(basin.atMm, Math.round(ROOM_LENGTH - sink.y - sink.w / 2))
  const hobTarget = readingTarget(run, hob), sinkTarget = readingTarget(run, basin)
  assert.ok(hobTarget.x > gas.x && hobTarget.x < ROOM_WIDTH && sinkTarget.x > 0 && sinkTarget.x < sink.d)
  for (const h of [hob, basin]) { assert.equal(h.targetHeightMm, 900, 'onto the worktop'); assert.ok(readingTiltDeg(run, h, room.heightMm) < 30) }
})

test('the mirrored config for the planner view flips both axes and swaps aims, and mirrors back to itself', () => {
  const mirrored = mirrorTrackConfig(config.tracks, ROOM_WIDTH, ROOM_LENGTH), [run] = mirrored.runs, [original] = config.tracks.runs
  assert.equal(run.atMm, ROOM_WIDTH - original.atMm)
  assert.deepEqual([run.fromMm, run.toMm], [ROOM_LENGTH - original.toMm, ROOM_LENGTH - original.fromMm])
  assert.ok(run.toMm > run.fromMm)
  const hob = run.heads[1]
  assert.deepEqual(headPosition(run, hob), {x: ROOM_WIDTH - original.atMm, z: ROOM_LENGTH - original.heads[1].atMm})
  assert.deepEqual(hob.targetMm, {xMm: ROOM_WIDTH - original.heads[1].targetMm.xMm, zMm: ROOM_LENGTH - original.heads[1].targetMm.zMm})
  assert.deepEqual(mirrorTrackConfig(mirrored, ROOM_WIDTH, ROOM_LENGTH), config.tracks)
  const spots = {runs: [{id: 'X', axis: 'x', atMm: 400, fromMm: 100, toMm: 900, heads: [{kind: 'spot', atMm: 200, aim: 'north'}]}]}
  assert.deepEqual(mirrorTrackConfig(spots, 1000, 2000).runs[0], {id: 'X', axis: 'x', atMm: 1600, fromMm: 100, toMm: 900, heads: [{kind: 'spot', atMm: 800, aim: 'south'}]})
})

test('the checks catch a run under the east wall cabinets and a down light off the hob', () => {
  const bad = patch => { const c = structuredClone(config); patch(c); return check(c).issues.join(' | ') }
  assert.match(bad(c => { c.tracks.runs[0].atMm = 1700 }), /K1 passes .* from the east top wall cabinets/)
  assert.match(bad(c => { c.tracks.runs[0].heads[1].targetMm = {xMm: 1200, zMm: 1996} }), /which is not over a sofa, bed or work spot/)
})
