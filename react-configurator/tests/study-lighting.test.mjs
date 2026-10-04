import test from 'node:test'
import assert from 'node:assert/strict'
import {checkTrackLighting, readingTarget, readingTiltDeg} from '../src/domain/drawingLighting.mjs'
import {STUDY_LIGHTING, STUDY_DIMMER_CIRCUITS} from '../src/config/studyLightingConfig.js'
import {STUDY_ROOM} from '../src/config/studyRoomConfig.js'
import {ROOM_LIGHTING} from '../src/home/lighting.mjs'

const room = STUDY_ROOM.dimensions, config = STUDY_LIGHTING
const check = c => checkTrackLighting(room, c, {downTargets: c.downTargets, needsReading: true})

test('Study (Bedroom 2): a bookshelf/general track and a bed/desk track, each its own circuit, clear of the assumed fan', () => {
  const result = check(config)
  assert.deepEqual(result.issues, [])
  assert.deepEqual(result.totals, {watts: 90, lumens: 8000, spots: 3, diffused: 3, reading: 2, heads: 8, lumensPerM2: 503, trackMetres: 5.2})
  assert.deepEqual(result.runs, {
    S1: {watts: 36, lumens: 3200, heads: 4, driverWatts: 60, driverLoad: 60, metres: 2.6},
    S2: {watts: 54, lumens: 4800, heads: 4, driverWatts: 100, driverLoad: 54, metres: 2.6},
  })
  assert.deepEqual(STUDY_DIMMER_CIRCUITS.map(([id]) => id), config.tracks.runs.map(run => run.id))
  assert.equal(ROOM_LIGHTING.study.ownFixtures, true, 'the generic overlay strips are not drawn any more')
  const fan = config.ceilingFans.fans[0]
  assert.equal(fan.status, 'assumed'); assert.deepEqual([fan.xMm, fan.zMm], [Math.round(room.widthMm / 2), room.lengthMm / 2])
})

test('track 1 puts a spot on each bookshelf bay; track 2 lights the bed from the foot side and the desk from above', () => {
  const [s1, s2] = config.tracks.runs, shelf = STUDY_ROOM.cabinetry.northBookshelf, bay = shelf.widthMm / 3
  assert.equal(s1.axis, 'x'); assert.ok(s1.atMm > shelf.depthMm + 300 && s1.atMm < shelf.depthMm + 500)
  const spots = s1.heads.filter(h => h.kind === 'spot')
  assert.equal(spots.length, 3)
  spots.forEach((h, i) => assert.ok(Math.abs(h.atMm - (shelf.offsetFromWestMm + (i + .5) * bay)) < 80 && h.aim === 'north', `spot ${i} on bay ${i}`))
  const [bed, desk] = config.downTargets, [bedHead, deskHead] = s2.heads.filter(h => h.kind === 'reading')
  const bedTarget = readingTarget(s2, bedHead), deskTarget = readingTarget(s2, deskHead)
  assert.ok(bedTarget.x >= bed.x1 && bedTarget.x <= bed.x2 && bedTarget.z >= bed.z1 && bedTarget.z <= bed.z2)
  assert.ok(bedHead.atMm > bedTarget.z, 'the lamp is further from the pillow than its target: light from the foot side')
  assert.ok(readingTiltDeg(s2, bedHead, room.heightMm) < 20)
  assert.ok(deskTarget.x >= desk.x1 && deskTarget.x <= desk.x2 && deskTarget.z >= desk.z1 && deskTarget.z <= desk.z2)
  assert.equal(deskHead.targetHeightMm, 740, 'aimed at the desk top, not a lap')
  assert.ok(readingTiltDeg(s2, deskHead, room.heightMm) < 10)
})

test('the checks catch a desk light that misses the desk and a run too close to the east wall', () => {
  const bad = patch => { const c = structuredClone(config); patch(c); return check(c).issues.join(' | ') }
  assert.match(bad(c => { c.tracks.runs[1].heads[2].targetMm = {xMm: 2000, zMm: 3560} }), /which is not over a sofa, bed or work spot/)
  assert.match(bad(c => { c.tracks.runs[1].atMm = 3000 }), /closer than 300 mm to a wall/)
})
