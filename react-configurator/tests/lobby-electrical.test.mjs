import test from 'node:test'
import assert from 'node:assert/strict'
import {EMPTY_ROOM_SHELLS} from '../src/config/roomShellConfig.js'
import {issuesWith, loads, passingReport, pointOf} from './room-electrical-helpers.mjs'

const room = EMPTY_ROOM_SHELLS.lobby

test('Lobby / Dining: the proposed plan passes every rule', () => {
  const r = passingReport('lobby')
  assert.equal(r.points.length, 12)
  assert.deepEqual(r.check.results.map(x => x.note), ['12 points', '5 openings', '1 piece of furniture or door leaf', '2 doors', '4 bed sides, desks and seats', '1 AC unit', '3 track runs and fans', '4 lighting circuits', '3 circuits'])
  assert.deepEqual(r.model.lightingCircuits.map(c => c.id), ['chandelier', 'L1', 'L2', 'fan1'])
  assert.deepEqual(loads(r), {circuits: [['L-light', 705], ['L-power', 2000], ['L-ac', 1700]], totalW: 4405})
})

test('Lobby: the new switchboard stands clear of the planned Bedroom 1 door, on its latch side, and takes over from X-L1', () => {
  const r = passingReport('lobby'), door = room.doors.find(d => d.leadsTo === 'Bedroom 1')
  const board = pointOf(r, 'L-N1'), box = pointOf(r, 'L-N2')
  assert.equal(board.where, 'north wall, x 1200, 1200 high')
  assert.equal(board.alongMm, door.fromMm + door.widthMm + 200, 'it follows the door in roomShellConfig.js')
  assert.equal(board.replaces, 'X-L1'); assert.deepEqual(board.switches, ['chandelier', 'L1', 'L2', 'fan1'])
  assert.equal(box.where, 'north wall, x 475, 2300 high'); assert.ok(box.heightMm > door.heightMm + 50, 'the junction box is above the door head')
  assert.match(issuesWith('lobby', 'L-N1', {anchor: undefined, alongMm: 475}), /L-N1 \(Main switchboard\) is in the door to Bedroom 1 on the north wall/)
  assert.match(issuesWith('lobby', 'L-N2', {heightMm: 1300}), /L-N2 .* is in the door to Bedroom 1/)
  assert.match(issuesWith('lobby', 'L-N1', {anchor: undefined, alongMm: 50}), /hinge side of the door to Bedroom 1/)
})

test('Lobby: existing ceiling and tube-light points are reused for the fan and the two track drivers', () => {
  const r = passingReport('lobby')
  assert.equal(pointOf(r, 'L-C2').where, 'ceiling, x 2605, z 1600')   // X-L4, 40 mm beam offset already taken off
  assert.equal(pointOf(r, 'L-C3').where, 'ceiling, x 3770, z 1615')   // X-L5
  assert.equal(pointOf(r, 'L-S2').where, 'south wall, x 2735, 2260 high') // X-L3
  assert.equal(pointOf(r, 'L-S2').loadW, 60); assert.equal(pointOf(r, 'L-C3').loadW, 60)
  assert.match(issuesWith('lobby', 'L-C3', null), /no driver feed for track run L2/)
  assert.match(issuesWith('lobby', 'L-S2', {existing: undefined, wall: 'north', alongMm: 2735, heightMm: 2260}), /L-S2 .* is 2775 mm from track run L1/)
  assert.match(issuesWith('lobby', 'L-C2', null), /no point for the ceiling fan/)
})

test('Lobby: dining, iron, AC and toilet points follow the furniture and stay clear of it', () => {
  const r = passingReport('lobby'), f = room.furniture
  assert.equal(pointOf(r, 'L-N3').alongMm, f.diningTable.centerXmm)
  assert.ok(pointOf(r, 'L-N3').heightMm > f.diningTable.heightMm)
  assert.ok(r.check.reach.every(x => x.point === 'L-N3' && x.nearestMm <= 1500), JSON.stringify(r.check.reach))
  assert.equal(pointOf(r, 'L-C1').where, `ceiling, x ${f.diningTable.centerXmm}, z ${f.diningTable.centerZmm}`)
  assert.equal(pointOf(r, 'L-E1').where, 'east wall, z 1375, 1250 high')
  assert.match(issuesWith('lobby', 'L-E1', {heightMm: 800}), /hidden behind the ironing storage unit/)
  assert.match(issuesWith('lobby', 'L-E2', {alongMm: 2500}), /is in the open side on the east wall/)
  assert.match(issuesWith('lobby', 'L-N4', {anchor: undefined, alongMm: 3133}), /hidden behind the split AC indoor unit/)
  assert.match(issuesWith('lobby', 'L-N4', {anchor: undefined, alongMm: 4300}), /is in the open side on the north wall/)
  assert.match(issuesWith('lobby', 'L-S1', {anchor: undefined, alongMm: 1300}), /is in the door to Toilet/)
  assert.match(issuesWith('lobby', 'L-N3', {kind: 'power'}), /no charging point within 1.5 m of the dining chair/)
  assert.match(issuesWith('lobby', 'L-E2', {wall: 'west'}), /open west side to the Drawing Room/)
  assert.equal(pointOf(r, 'L-P1').hidden, true); assert.ok(pointOf(r, 'L-P1').zMm < 0, 'the Pooja point is inside the alcove, north of the room')
})
