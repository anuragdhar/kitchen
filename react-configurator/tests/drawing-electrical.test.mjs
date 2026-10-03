import test from 'node:test'
import assert from 'node:assert/strict'
import {checkElectricalPlan, electricalPointPosition} from '../src/domain/drawingElectrical.mjs'
import {DRAWING_ELECTRICAL} from '../src/config/drawingElectricalConfig.js'
import {EMPTY_ROOM_SHELLS} from '../src/config/roomShellConfig.js'

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
  assert.match(issues('S2', {alongMm: 1500, heightMm: 800}), /window/)
  assert.match(issues('S2', {alongMm: 1500}), /hidden behind the south sofa/)
  assert.match(issues('W3', {alongMm: 3000}), /hidden behind the west sofa/)
  assert.match(issues('E1', {alongMm: 500}), /behind the entry door/)
  assert.match(issues('E4', {alongMm: 2500}), /lobby opening/)
  assert.match(issues('W1', {alongMm: 2400}), /behind the AC/)
  assert.match(issues('E1', {heightMm: 1600}), /switch height/)
})

test('point positions land on the right wall', () => {
  const at = id => electricalPointPosition(room, DRAWING_ELECTRICAL.points.find(p => p.id === id), {wallFaceMm: 0})
  assert.deepEqual(at('N1'), {x: 1600, y: 1000, z: 0})
  assert.deepEqual(at('E1'), {x: room.widthMm, y: 1200, z: 1250})
  assert.equal(at('C1').y, room.heightMm)
  assert.ok(at('N3').z < 0, 'the closet light is behind the north wall')
})
