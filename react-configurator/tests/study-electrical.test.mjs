import test from 'node:test'
import assert from 'node:assert/strict'
import {STUDY_ROOM} from '../src/config/studyRoomConfig.js'
import {STUDY_LIGHTING} from '../src/config/studyLightingConfig.js'
import {issuesWith, loads, passingReport, pointOf} from './room-electrical-helpers.mjs'

const o = STUDY_ROOM.openings, L = STUDY_ROOM.dimensions.lengthMm

test('Study: the proposed plan passes every rule', () => {
  const r = passingReport('study')
  assert.equal(r.points.length, 9)
  assert.deepEqual(r.model.lightingCircuits.map(c => c.id), ['S1', 'S2', 'fan1'])
  assert.deepEqual(r.model.acs, [], 'the AC indoor unit is not modelled, so no rule covers ST-W2')
  assert.equal(pointOf(r, 'ST-W2').assumed, true)
  assert.deepEqual(loads(r), {circuits: [['ST-light', 635], ['ST-power', 2020], ['ST-ac', 1700]], totalW: 4355})
})

test('Study: the switchboard fits between the entry door and the bed; bedside and desk points follow the kids layout', () => {
  const r = passingReport('study'), bed = STUDY_LIGHTING.downTargets.find(t => t.label === 'bed'), desk = STUDY_LIGHTING.downTargets.find(t => t.label === 'desk')
  const board = pointOf(r, 'ST-E1')
  assert.equal(board.where, 'east wall, z 975, 1200 high')
  assert.ok(board.alongMm > o.mainDoor.offsetFromNorthMm + o.mainDoor.widthMm + 50 && board.alongMm < bed.z1 - 40)
  assert.equal(pointOf(r, 'ST-E2').alongMm, bed.z1 + 300); assert.equal(pointOf(r, 'ST-E3').alongMm, desk.z1 + 240)
  assert.deepEqual(r.check.reach.map(x => [x.spot, x.point]), [['pillow of the bed', 'ST-E2'], ['desk chair', 'ST-E3']])
  assert.match(issuesWith('study', 'ST-E1', {anchor: undefined, alongMm: 500}), /is in the entry door/)
  assert.match(issuesWith('study', 'ST-E2', {heightMm: 500}), /hidden behind the bed/)
  assert.match(issuesWith('study', 'ST-E3', {heightMm: 600}), /hidden behind the desk/)
  assert.match(issuesWith('study', 'ST-E3', {kind: 'power'}), /no charging point within 1.5 m of the desk chair/)
})

test('Study: nothing in the Home Office opening, the terrace door, the south cabinet or behind the bookshelf', () => {
  const r = passingReport('study')
  const office = [L - o.balconyOffice.offsetFromSouthMm - o.balconyOffice.widthMm, L - o.balconyOffice.offsetFromSouthMm]
  assert.deepEqual(office, [2546, 4375])
  assert.ok(pointOf(r, 'ST-W1').alongMm < office[0] - 50 && pointOf(r, 'ST-W2').alongMm < office[0] - 50)
  assert.match(issuesWith('study', 'ST-W1', {alongMm: 3000}), /is in the opening to the Home Office/)
  assert.match(issuesWith('study', 'ST-W1', {alongMm: 300}), /hidden behind the north bookshelf \(its side\)/)
  assert.match(issuesWith('study', 'ST-W1', {wall: 'north', alongMm: 1000}), /hidden behind the north bookshelf/)
  assert.match(issuesWith('study', 'ST-W1', {wall: 'north', alongMm: 2800}), /hidden behind the entry door leaf/)
  assert.equal(pointOf(r, 'ST-S1').where, 'south wall, x 1839, 1200 high')
  assert.match(issuesWith('study', 'ST-S1', {anchor: undefined, alongMm: 2500}), /is in the terrace door/)
  assert.match(issuesWith('study', 'ST-S1', {anchor: undefined, alongMm: 1000}), /is in the raised south-wall cabinet/)
  assert.match(issuesWith('study', 'ST-S1', {anchor: undefined, alongMm: 3100}), /hinge side of the terrace door/)
})

test('Study: a feed at the end of each track run and at the fan', () => {
  const r = passingReport('study'), [s1, s2] = STUDY_LIGHTING.tracks.runs, fan = STUDY_LIGHTING.ceilingFans.fans[0]
  assert.equal(pointOf(r, 'ST-C2').where, `ceiling, x ${s1.toMm}, z ${s1.atMm}`)
  assert.equal(pointOf(r, 'ST-C3').where, `ceiling, x ${s2.atMm}, z ${s2.fromMm}`); assert.equal(pointOf(r, 'ST-C3').loadW, s2.driverWatts)
  assert.equal(pointOf(r, 'ST-C1').where, `ceiling, x ${fan.xMm}, z ${fan.zMm}`)
  assert.match(issuesWith('study', 'ST-C2', null), /no driver feed for track run S1/)
})
