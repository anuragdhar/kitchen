import test from 'node:test'
import assert from 'node:assert/strict'
import {ENTRY} from '../src/config/entryConfig.js'
import {ENTRY_LIGHTING} from '../src/config/entryLightingConfig.js'
import {roomPointPosition} from '../src/domain/roomElectrical.mjs'
import {issuesWith, loads, passingReport, pointOf} from './room-electrical-helpers.mjs'

// The entry frame is the Main entry page's: x = (plan x - 515) x scale, z = (plan y - 715) x scale, in mm.
const s = ENTRY.planScale, X = px => (px - ENTRY.planBounds.x1) * s.xMetresPerPixel * 1000, Z = py => (py - ENTRY.planBounds.y1) * s.zMetresPerPixel * 1000
const near = (a, b, tolerance = 1) => Math.abs(a - b) <= tolerance

test('Main entry: the proposed plan passes every rule', () => {
  const r = passingReport('entry')
  assert.equal(r.points.length, 11)
  assert.deepEqual(Object.keys(r.model.walls), ['galleryEast', 'shaftFace', 'corridorSouth', 'outerWall', 'galleryNorth'])
  assert.deepEqual(r.model.lightingCircuits.map(c => c.id), ENTRY_LIGHTING.switching.map(g => g.id))
  assert.deepEqual(loads(r), {circuits: [['EN-light', 252], ['EN-power', 1000]], totalW: 1252})
})

test('Main entry: the named walls sit on the plan lines the page draws', () => {
  const {model} = passingReport('entry'), w = model.walls
  assert.ok(near(model.widthMm, X(688)) && near(model.lengthMm, Z(874)))
  assert.ok(near(w.shaftFace.x, X(ENTRY.arrivalDoor.wallPlanX)) && near(w.shaftFace.z, Z(ENTRY.shaft.planY1)) && near(w.shaftFace.lengthMm, Z(ENTRY.shaft.planY2) - Z(ENTRY.shaft.planY1)))
  assert.ok(near(w.corridorSouth.z, Z(ENTRY.shaft.planY2)) && near(w.outerWall.x, X(ENTRY.outerEntryOpening.wallPlanX)))
  const door = model.openings.find(o => o.name === 'outer door')
  assert.ok(near(w.outerWall.z + door.a, Z(ENTRY.outerEntryOpening.fromPlanY)) && near(w.outerWall.z + door.b, Z(ENTRY.outerEntryOpening.toPlanY)))
})

test('Main entry: a switch at each door, on the latch side where there is a wall', () => {
  const r = passingReport('entry'), at = id => roomPointPosition(r.model, pointOf(r, id))
  // Corridor switch: on the corridor's south wall, 250 mm in from the outer wall, by the outer door's latch (south) jamb.
  assert.ok(near(at('EN-1').x, X(688) - 250) && near(at('EN-1').z, Z(810)))
  // Gallery switch: on the shaft wall, 150 mm from the arrival door's latch (south) end.
  assert.ok(near(at('EN-3').x, X(575)) && near(at('EN-3').z, Z(810) - 150))
  assert.deepEqual([pointOf(r, 'EN-1').switches, pointOf(r, 'EN-3').switches, pointOf(r, 'EN-4').switches], [['S1'], ['S2'], ['S2']])
  assert.match(issuesWith('entry', 'EN-1', null), /no switchboard for the outer steel door.*no switch for E1 \+ E2/)
  assert.match(issuesWith('entry', 'EN-3', {anchor: undefined, alongMm: 50, wall: 'galleryNorth'}), /mm from the latch side of the arrival door \(at most 700\)/)
  assert.match(issuesWith('entry', 'EN-4', {alongMm: 1500}), /mm from the latch side of the Drawing Room door \(at most 1200\)/)
  assert.equal(r.model.doors.find(d => d.id === 'outer').latchAssumed, true, 'the outer door hinge side is not settled in entryConfig.js')
})

test('Main entry: lights sit on the fittings of the lighting config; nothing in the outer door, behind the seat or the rack', () => {
  const r = passingReport('entry')
  for (const [id, fitting] of [['EN-L1', 'E1'], ['EN-L2', 'E2'], ['EN-L3', 'E3'], ['EN-L4', 'E4']]) {
    const f = ENTRY_LIGHTING.fittings.find(x => x.id === fitting), p = pointOf(r, id)
    assert.ok(near(p.xMm, X(f.planX)) && near(p.zMm, Z(f.planY)), id); assert.equal(p.loadW, f.watts)
  }
  assert.match(issuesWith('entry', 'EN-2', {anchor: undefined, alongMm: 700}), /EN-2 \(Bell push\) is in the outer door/)
  assert.match(issuesWith('entry', 'EN-5', {alongMm: 1900}), /hidden behind the fold-down shoe seat/)
  assert.match(issuesWith('entry', 'EN-6', {hidden: false}), /hidden behind the shoe rack/)
  assert.equal(pointOf(r, 'EN-6').optional, true); assert.equal(pointOf(r, 'EN-7').optional, true)
  assert.match(issuesWith('entry', 'EN-L4', {fitting: 'E9'}), /has no place: ceiling fitting E9 not found/)
})
