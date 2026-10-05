import test from 'node:test'
import assert from 'node:assert/strict'
import {EMPTY_ROOM_SHELLS} from '../src/config/roomShellConfig.js'
import {BEDROOM1_LIGHTING, bedroom1DownTargets} from '../src/config/bedroom1LightingConfig.js'
import {issuesWith, loads, passingReport, pointOf} from './room-electrical-helpers.mjs'

const room = EMPTY_ROOM_SHELLS.bedroom1

test('Bedroom 1: the proposed plan passes every rule', () => {
  const r = passingReport('bedroom1')
  assert.equal(r.points.length, 11)
  assert.deepEqual(r.model.acs.map(a => a.id), ['split', 'window'])
  assert.deepEqual(r.model.lightingCircuits.map(c => c.id), ['B1', 'B2', 'fan1'])
  assert.deepEqual(loads(r), {circuits: [['B1-light', 695], ['B1-power', 1000], ['B1-ac', 1700], ['B1-wac', 1900]], totalW: 5295})
})

// These assertions hold for the bed of roomShellConfig.js as it is today. The room is being redesigned: when the bed moves,
// the points move with it (they are anchors), and the expected figures here are the ones to update.
test('Bedroom 1: the bedside points follow the bed, above the headboard, on solid wall', () => {
  const r = passingReport('bedroom1'), bed = bedroom1DownTargets(room)[0], opening = room.wallOpenings.east
  const [a, b] = [pointOf(r, 'B1-E1'), pointOf(r, 'B1-E2')]
  assert.equal(a.wall, 'east'); assert.equal(b.wall, 'east')
  // The first solid stretch of the head wall: the balcony opening ends at 2200, the box stands 100 mm clear of it.
  assert.equal(a.alongMm, Math.max(bed.z1 + 150, opening.toMm + 100)); assert.equal(a.where, 'east wall, z 2300, 1300 high')
  assert.equal(b.alongMm, bed.z2 - 250); assert.equal(b.where, 'east wall, z 2990, 1300 high')
  assert.deepEqual(r.points.filter(p => p.dependsOn).map(p => p.id), ['B1-S2', 'B1-E1', 'B1-E2', 'B1-C3', 'B1-B2'])
  assert.ok(r.check.reach.filter(x => /pillow/.test(x.spot)).every(x => x.nearestMm <= 500), JSON.stringify(r.check.reach))
  assert.match(issuesWith('bedroom1', 'B1-E1', {heightMm: 900}), /B1-E1 .* is hidden behind the bed headboard/)
  assert.match(issuesWith('bedroom1', 'B1-E1', {anchor: undefined, wall: 'east', alongMm: 1900}), /is in the open side on the east wall/)
  assert.match(issuesWith('bedroom1', 'B1-E2', {anchor: undefined, wall: 'south', alongMm: 2950, heightMm: 800}), /is in the medicine cabinet in the closed old door/)
})

test('Bedroom 1: switchboards at the latch side of both doors, clear of the bed and the wardrobe', () => {
  const r = passingReport('bedroom1'), lobbyDoor = room.doors.find(d => /Lobby/.test(d.leadsTo)), wash = room.doors.find(d => /washroom/.test(d.leadsTo))
  assert.equal(pointOf(r, 'B1-S1').alongMm, lobbyDoor.fromMm + lobbyDoor.widthMm + 150); assert.equal(pointOf(r, 'B1-S1').where, 'south wall, x 1150, 1200 high')
  assert.equal(pointOf(r, 'B1-N1').alongMm, wash.fromMm + wash.widthMm + 150)
  assert.deepEqual(pointOf(r, 'B1-S1').switches, ['B1', 'B2', 'fan1'])
  assert.match(issuesWith('bedroom1', 'B1-S1', {anchor: undefined, alongMm: 600}), /is in the door to Lobby \/ Dining/)
  assert.match(issuesWith('bedroom1', 'B1-S2', {alongOffsetMm: 600}), /B1-S2 .* is hidden behind the bed/)
  assert.match(issuesWith('bedroom1', 'B1-N1', {anchor: undefined, alongMm: 300}), /hidden behind the west wardrobe \(its side\)/)
  assert.match(issuesWith('bedroom1', 'B1-N1', {anchor: undefined, alongMm: 2900}), /north-east recess wardrobe doors/)
  assert.match(issuesWith('bedroom1', 'B1-N1', null), /no switchboard for the washroom door/)
})

test('Bedroom 1: one dedicated point beside each AC, the window AC point from its config', () => {
  const r = passingReport('bedroom1'), ac = room.balconyExtension.windowAc, bal = room.balconyExtension
  const p = pointOf(r, 'B1-B1')
  assert.equal(p.wall, 'balconyEast'); assert.equal(p.alongMm, ac.centerFromNorthMm - ac.widthMm / 2 - 100)
  assert.ok(p.heightMm < ac.bottomMm && p.heightMm < bal.railingHeightMm, 'on the parapet, below the unit')
  assert.equal(p.where, 'balcony east parapet, inside face, z 923, 850 high'); assert.equal(p.loadW, 1900)
  const at = r.model.walls.balconyEast
  assert.equal(at.x, room.widthMm + bal.depthMm - 60)
  assert.match(issuesWith('bedroom1', 'B1-B1', null), /no dedicated point for the 1.5 ton window AC/)
  assert.match(issuesWith('bedroom1', 'B1-B1', {heightMm: 1200}), /is in the balcony glazing above the parapet/)
  assert.match(issuesWith('bedroom1', 'B1-B1', {anchor: undefined, alongMm: 2000}), /hidden behind the Pooja-wall wardrobe/)
  assert.match(issuesWith('bedroom1', 'B1-B2', {heightMm: 600}), /hidden behind the balcony table/)
  assert.equal(pointOf(r, 'B1-W1').where, 'west wall, z 3060, 2300 high')
  assert.match(issuesWith('bedroom1', 'B1-W1', {heightMm: 1800}), /hidden behind the Lobby door leaf/)
  assert.match(issuesWith('bedroom1', 'B1-W1', {anchor: undefined, alongMm: 2500}), /hidden behind the split AC indoor unit/)
})

test('Bedroom 1: a feed at the end of each track run and at the fan', () => {
  const r = passingReport('bedroom1'), [t1, t2] = BEDROOM1_LIGHTING.tracks.runs, fan = BEDROOM1_LIGHTING.ceilingFans.fans[0]
  assert.equal(pointOf(r, 'B1-C2').where, `ceiling, x ${t1.atMm}, z ${t1.toMm}`); assert.equal(pointOf(r, 'B1-C2').loadW, t1.driverWatts)
  assert.equal(pointOf(r, 'B1-C3').where, `ceiling, x ${t2.atMm}, z ${t2.toMm}`); assert.equal(pointOf(r, 'B1-C3').loadW, t2.driverWatts)
  assert.equal(pointOf(r, 'B1-C1').where, `ceiling, x ${fan.xMm}, z ${fan.zMm}`)
  assert.match(issuesWith('bedroom1', 'B1-S1', {switches: ['B1', 'fan1']}), /no switch for Bedroom 1 track 2: over the bed \(B2\)/)
})
