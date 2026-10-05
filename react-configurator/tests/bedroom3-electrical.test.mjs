import test from 'node:test'
import assert from 'node:assert/strict'
import {EMPTY_ROOM_SHELLS} from '../src/config/roomShellConfig.js'
import {BEDROOM3_CEILING_FAN, BEDROOM3_LIGHTING} from '../src/config/bedroom3LightingConfig.js'
import {issuesWith, loads, passingReport, pointOf} from './room-electrical-helpers.mjs'

const room = EMPTY_ROOM_SHELLS.bedroom3, cab = room.furniture.eastCabinet

// Baselines changed on purpose (owner 2026-10-05: "In room 3 swap the place of dressing, move it to south side; in place of
// dressing show full depth cabinet till ceiling"). Before: 11 points, B3-light 705 W, total 4465 W; the dressing socket was
// part of B3-N2 on the north wall. Now B3-S1 follows the dressing to the south end, and the track 2 driver is 100 W (was 60).
test('Bedroom 3: the proposed plan passes every rule', () => {
  const r = passingReport('bedroom3')
  assert.equal(r.points.length, 12)
  assert.deepEqual(r.model.lightingCircuits.map(c => c.id), ['B1', 'B2', 'fan1', 'wallLight'])
  assert.deepEqual(loads(r), {circuits: [['B3-light', 745], ['B3-power', 2060], ['B3-ac', 1700]], totalW: 4505})
})

test('Bedroom 3 (dressing swap 2026-10-05): the dressing socket follows the mirror cabinet to the south end', () => {
  const r = passingReport('bedroom3'), s = room.furniture.eastCabinet.south, b = room.southExtension.balcony
  const socket = pointOf(r, 'B3-S1'), front = room.widthMm - s.depthMm
  assert.equal(socket.where, 'south wall, x 3455, 750 high')
  assert.equal(socket.alongMm, Math.round(front - 250), '250 mm west of the dressing cabinet front, beside the standing spot')
  assert.ok(socket.alongMm > front - s.standDepthMm && socket.alongMm < front)
  assert.ok(socket.heightMm < b.windowSillMm - 100, 'under the window sill')
  assert.equal(socket.dependsOn, 'dressing cabinet')
  assert.equal(pointOf(r, 'B3-N2').name, 'Toilet switches')
  assert.doesNotMatch(pointOf(r, 'B3-N2').outlets, /socket/, 'the north board no longer carries the dressing socket')
  assert.match(issuesWith('bedroom3', 'B3-S1', {heightMm: 1100}), /is in the balcony window/)
  assert.match(issuesWith('bedroom3', 'B3-S1', {anchor: undefined, wall: 'east', alongMm: 3200}), /hidden behind the south-east dressing cabinet/)
  assert.match(pointOf(r, 'B3-C3').outlets, /100 W \/ 48 V track driver/)
})

test('Bedroom 3: the scanned switchboard, wall light and fan point are reused where they are', () => {
  const r = passingReport('bedroom3')
  assert.equal(pointOf(r, 'B3-N1').where, 'north wall, x 1468, 1300 high') // X-B1: plate x 1385-1550, 1235-1365 high
  assert.equal(pointOf(r, 'B3-W2').where, 'west wall, z 1880, 2230 high')  // X-B2
  assert.equal(pointOf(r, 'B3-C1').where, `ceiling, x ${BEDROOM3_CEILING_FAN.xMm}, z ${BEDROOM3_CEILING_FAN.zMm}`)
  const entry = r.model.doors.find(d => d.id === 'entry')
  assert.ok(pointOf(r, 'B3-N1').alongMm - (entry.fromMm + entry.widthMm) <= 700, 'the existing board is within reach of the latch side of the entry door')
  assert.match(issuesWith('bedroom3', 'B3-N1', {switches: ['B1', 'B2', 'fan1']}), /no switch for existing wall light/)
})

test('Bedroom 3: bedside points above the headboard, AC point hidden in the overhead cabinet beside the AC bay', () => {
  const r = passingReport('bedroom3'), bed = room.furniture.bed
  const [a, b] = [pointOf(r, 'B3-E1'), pointOf(r, 'B3-E2')]
  assert.equal(a.where, 'east wall, z 1099, 1300 high'); assert.equal(b.where, 'east wall, z 2528, 1300 high')
  assert.ok(Math.abs(a.alongMm - (bed.centerFromNorthMm - bed.widthMm / 2 + 150)) <= 1 && Math.abs(b.alongMm - (bed.centerFromNorthMm + bed.widthMm / 2 - 250)) <= 1)
  assert.ok(a.heightMm < cab.shelf.heightMm, 'under the shelf above the bed')
  assert.match(issuesWith('bedroom3', 'B3-E1', {heightMm: 800}), /hidden behind the bed headboard/)
  assert.match(issuesWith('bedroom3', 'B3-E1', {anchor: undefined, wall: 'east', alongMm: 500}), /hidden behind the north-east full-height storage cabinet/)
  assert.match(issuesWith('bedroom3', 'B3-E1', {anchor: undefined, wall: 'east', alongMm: 500, heightMm: 2600}), /hidden behind the north-east full-height storage cabinet/, 'it reaches the ceiling')
  const ac = pointOf(r, 'B3-E3')
  assert.equal(ac.where, 'east wall, z 2613, 2400 high'); assert.equal(ac.hidden, true)
  assert.equal(ac.alongMm, cab.ac.centerFromNorthMm + cab.ac.bayWidthMm / 2 + 150)
  assert.match(issuesWith('bedroom3', 'B3-E3', {hidden: false}), /B3-E3 \(AC point\) is hidden behind the overhead cabinet run/)
  assert.match(issuesWith('bedroom3', 'B3-E3', {anchor: undefined, alongMm: 1863}), /hidden behind the split AC in the east cabinet bay/)
})

test('Bedroom 3: toilet board, chest point and utility socket stay clear of doors, cabinets and the artwork', () => {
  const r = passingReport('bedroom3'), toilet = room.doors.find(d => /toilet/.test(d.leadsTo)), chest = room.furniture.westChest
  const board = pointOf(r, 'B3-N2')
  // Owner, later 2026-10-05: the storage cabinet fills the wall east of the toilet door, so the switches are on its west side.
  assert.equal(board.alongMm, toilet.fromMm - 150)
  assert.equal(room.widthMm - cab.north.depthMm, toilet.fromMm + toilet.widthMm, 'the cabinet side is in line with the east jamb')
  assert.match(issuesWith('bedroom3', 'B3-N2', {anchor: undefined, alongMm: 2900}), /is in the door to Bedroom 3 toilet/)
  const top = pointOf(r, 'B3-W1')
  assert.equal(top.where, 'west wall, z 2488, 950 high'); assert.ok(top.heightMm > chest.heightMm && top.heightMm < chest.artwork.bottomMm + 50)
  assert.match(issuesWith('bedroom3', 'B3-W1', {heightMm: 500}), /hidden behind the west chest/)
  assert.match(issuesWith('bedroom3', 'B3-W1', {anchor: undefined, alongMm: 1800, heightMm: 1300}), /hidden behind the artwork above the west chest/)
  assert.match(issuesWith('bedroom3', 'B3-N3', {wall: 'south', alongMm: 1000}), /is in the wardrobe bay in the south wall/)
  assert.match(issuesWith('bedroom3', 'B3-N3', {wall: 'south', alongMm: 3200, heightMm: 1200}), /is in the balcony window/)
  assert.match(issuesWith('bedroom3', 'B3-N3', {wall: 'west', alongMm: 500}), /hidden behind the entry door leaf/)
})

test('Bedroom 3: a feed at the west end of each track run', () => {
  const r = passingReport('bedroom3'), [t1, t2] = BEDROOM3_LIGHTING.tracks.runs
  assert.equal(pointOf(r, 'B3-C2').where, `ceiling, x ${t1.fromMm}, z ${t1.atMm}`)
  assert.equal(pointOf(r, 'B3-C3').where, `ceiling, x ${t2.fromMm}, z ${t2.atMm}`)
  assert.match(issuesWith('bedroom3', 'B3-C3', {driverFor: 'B9'}), /no driver feed for track run B2.*unknown track run \(B9\)|has no place: track run B9 not found/)
})
