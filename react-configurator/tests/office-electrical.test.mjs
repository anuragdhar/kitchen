import test from 'node:test'
import assert from 'node:assert/strict'
import {BALCONY_OFFICE} from '../src/config/balconyOfficeConfig.js'
import {ROOM_ELECTRICAL} from '../src/config/roomElectricalConfig.js'
import {issuesWith, loads, passingReport, pointOf} from './room-electrical-helpers.mjs'

const e = BALCONY_OFFICE.electrical

test('Home Office: the plan integrates balconyOfficeConfig.js electrical instead of repeating it', () => {
  const r = passingReport('office')
  assert.deepEqual(ROOM_ELECTRICAL.office.points.map(p => p.id), ['HO-E1', 'HO-C1'], 'only the room light and its switch are added')
  assert.equal(ROOM_ELECTRICAL.office.fromConfig, 'BALCONY_OFFICE.electrical')
  // The desk and equipment points come from the office config, under the labels the Home Office page draws.
  assert.deepEqual(r.points.filter(p => p.drawnBy === 'page').map(p => p.id), ['E1', 'E2', 'N1', 'N2', 'N4', 'D1', 'P1'])
  assert.equal(pointOf(r, 'E1').outlets, e.existingPoints[0].rating); assert.equal(pointOf(r, 'E1').where, e.existingPoints[0].location)
  assert.equal(pointOf(r, 'N1').where, e.newFixedPoints[0].location); assert.equal(pointOf(r, 'N4').use, e.newFixedPoints[2].use)
  assert.equal(pointOf(r, 'N2').loadW, e.newFixedPoints[1].outlets * 100)
  assert.equal(pointOf(r, 'N1').loadW, e.movingDeskPower.outlets * 100, 'the rail load is counted once, at its feed')
  assert.equal(pointOf(r, 'P1').loadW, 0)
  const fixed = ['E1', 'E2'].length + e.newFixedPoints.reduce((n, p) => n + p.outlets, 0)
  assert.equal(fixed, e.totals.existingFixedOutlets + e.totals.newFixedOutlets, 'the outlet totals of the office config still add up')
})

test('Home Office: circuits keep the heater on its own and the electronics together', () => {
  const r = passingReport('office')
  assert.deepEqual(loads(r), {circuits: [['HO-heater', 2000], ['HO-office', 1300], ['HO-light', 20]], totalW: 3320})
  assert.deepEqual(r.plan.circuits[0].points, ['E1'])
  assert.match(e.protection.circuits, /dedicated heater circuit/)
})

test('Home Office: the light switch is on the east return south of the Study opening; the desk is served by the rail', () => {
  const r = passingReport('office'), opening = BALCONY_OFFICE.survey.studyOpening
  const sw = pointOf(r, 'HO-E1')
  assert.equal(sw.where, 'east wall, z 2000, 1200 high'); assert.equal(sw.alongMm, opening.fromNorthMm + opening.widthMm + 170)
  assert.ok(sw.alongMm < BALCONY_OFFICE.dimensions.lengthMm)
  assert.equal(pointOf(r, 'HO-C1').where, 'ceiling, x 600, z 1312')
  assert.deepEqual(r.check.reach.map(x => [x.spot, x.point]), [['desk chair', 'P1']])
  assert.match(issuesWith('office', 'HO-E1', {anchor: undefined, alongMm: 900}), /is in the opening from the Study/)
  assert.match(issuesWith('office', 'HO-E1', {wall: 'west', anchor: undefined, alongMm: 1000}), /is in the window band on the west wall/)
  assert.match(issuesWith('office', 'HO-E1', {switches: []}), /no switch for ceiling light \(officeLight\)/)
})
