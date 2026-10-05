import test from 'node:test'
import assert from 'node:assert/strict'
import {checkElectricalPlan, electricalPointPosition, checkLightFeeds, feedRouteLengthMm} from '../src/domain/drawingElectrical.mjs'
import {DRAWING_ELECTRICAL, DRAWING_LIGHT_FEEDS} from '../src/config/drawingElectricalConfig.js'
import {DRAWING_LIGHTING} from '../src/config/drawingLightingConfig.js'
import {EXISTING_ELECTRICAL} from '../src/config/existingElectricalConfig.js'
import {EMPTY_ROOM_SHELLS} from '../src/config/roomShellConfig.js'
import {AC_PLAN} from '../src/config/acPlanConfig.js'
import {indoorUnitBox} from '../src/domain/acPlan.mjs'

const room = EMPTY_ROOM_SHELLS.drawing
const withPoint = (id, patch) => ({...DRAWING_ELECTRICAL, points: DRAWING_ELECTRICAL.points.map(p => p.id === id ? {...p, ...patch} : p)})

test('the layout C electrical plan passes: no point in an opening, behind a sofa or behind the AC', () => {
  const result = checkElectricalPlan(room, DRAWING_ELECTRICAL)
  assert.deepEqual(result.issues, [])
  assert.equal(DRAWING_ELECTRICAL.layout, 'southSofas')
})

test('every sofa seat has a charging point within 1.5 m, without counting the optional floor box', () => {
  const {reach} = checkElectricalPlan(room, DRAWING_ELECTRICAL)
  assert.equal(reach.length, 6)
  assert.ok(reach.every(r => r.nearestMm <= 1500), JSON.stringify(reach))
})

test('the TV box stays hidden behind both TV sizes and the router point is behind the console router bay', () => {
  assert.match(checkElectricalPlan(room, withPoint('N1', {alongMm: 900})).issues.join(' '), /N1 is not hidden/)
  assert.match(checkElectricalPlan(room, withPoint('N4', {alongMm: 1700})).issues.join(' '), /N4 is not behind the router bay/)
})

test('the checks catch points in openings, behind furniture or out of reach', () => {
  const issues = (id, patch) => checkElectricalPlan(room, withPoint(id, patch)).issues.join(' | ')
  assert.match(issues('N2', {alongMm: 2500}), /entry door opening/)
  assert.match(issues('N2', {alongMm: 400}), /west cabinet door/)
  assert.match(issues('S2', {alongMm: 1500, heightMm: 1000}), /window/)
  assert.match(issues('S2', {alongMm: 1500}), /hidden behind the south sofa/)
  assert.match(issues('W3', {alongMm: 3000}), /hidden behind the west sofa/)
  assert.match(issues('E1', {alongMm: 500}), /behind the entry door/)
  assert.match(issues('E4', {alongMm: 2500}), /lobby opening/)
  assert.match(issues('W1', {alongMm: 2400}), /behind the AC/)
  assert.match(issues('E1', {heightMm: 1600}), /switch height/)
})

test('the AC the checks keep clear of is the indoor unit the AC plan places and the room pages draw', () => {
  const box = indoorUnitBox(AC_PLAN.spaces.find(s => s.id === 'drawing'), AC_PLAN)
  const issues = patch => checkElectricalPlan(room, withPoint('W1', patch)).issues.join(' | ')
  assert.match(issues({alongMm: box.z1 + 10, heightMm: box.bottomMm - 90}), /behind the AC/)
  assert.doesNotMatch(issues({alongMm: box.z1 - 10, heightMm: box.bottomMm}), /behind the AC/)
  assert.doesNotMatch(issues({alongMm: box.z2 + 10, heightMm: box.bottomMm}), /behind the AC/)
  assert.match(issues({alongMm: box.z2 + 1010, heightMm: 2300}), /more than 1 m from the AC unit/)
})

test('point positions land on the right wall', () => {
  const at = id => electricalPointPosition(room, DRAWING_ELECTRICAL.points.find(p => p.id === id), {wallFaceMm: 0})
  assert.deepEqual(at('N1'), {x: 1600, y: 1000, z: 0})
  assert.deepEqual(at('E1'), {x: room.widthMm, y: 1200, z: 1250})
  assert.deepEqual(at('C1'), {x: 1600, y: room.heightMm, z: 2705})
  assert.ok(at('N3').z < 0, 'the closet light is behind the north wall')
})

test('each track has a feed at its end, a dimmer and a cable route from the switchboard beside the TV (owner 2026-10-06)', () => {
  const lighting = DRAWING_LIGHTING.southSofas, result = checkLightFeeds(room, DRAWING_ELECTRICAL, lighting, DRAWING_LIGHT_FEEDS)
  assert.deepEqual(result.issues, [])
  assert.deepEqual(result.routes, [{id: 'C2', run: 'T1', lengthMm: 2387}, {id: 'C3', run: 'T2', lengthMm: 4503}])
  assert.equal(result.totalMm, 6890)
  assert.deepEqual(DRAWING_LIGHT_FEEDS.dimmer.circuits, ['chandelier', 'T1', 'T2'])
  assert.match(DRAWING_LIGHT_FEEDS.dimmer.kind, /rotary LED dimmer/)
  // The switchboard is the existing board from the scan, at its centre.
  const board = EXISTING_ELECTRICAL.drawing.points.find(p => p.id === 'X-D1'), s = DRAWING_LIGHT_FEEDS.switchboard
  assert.deepEqual([s.xMm, s.heightMm], [Math.round((board.fromMm + board.toMm) / 2), (board.bottomMm + board.topMm) / 2])
  // The feed points follow the track runs: moving a run without its feed is caught.
  const moved = structuredClone(lighting); moved.tracks.runs[0].toMm = 2200
  assert.match(checkLightFeeds(room, DRAWING_ELECTRICAL, moved, DRAWING_LIGHT_FEEDS).issues.join(' | '), /C2 is not at an end of T1/)
  const bent = structuredClone(DRAWING_LIGHT_FEEDS); bent.routes[1].points[2] = {xMm: 640, zMm: 300, yMm: 2700}
  assert.match(checkLightFeeds(room, DRAWING_ELECTRICAL, lighting, bent).issues.join(' | '), /C3: leg 2 is not a single straight run/)
  assert.equal(feedRouteLengthMm({points: [{xMm: 0, zMm: 0, yMm: 0}, {xMm: 0, zMm: 0, yMm: 1000}, {xMm: 500, zMm: 0, yMm: 1000}]}), 1500)
})
