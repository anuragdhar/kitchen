import test from 'node:test'
import assert from 'node:assert/strict'
import {ENTRY} from '../src/config/entryConfig.js'
import {ENTRY_LIGHTING} from '../src/config/entryLightingConfig.js'
import {ROOM_LIGHTING} from '../src/home/lighting.mjs'
import {entrySections, checkEntryLighting, checkEntryOuterDoor, entryOuterDoorGeometry, VENT_OPEN_FRACTION_MIN} from '../src/domain/entryFittings.mjs'

test('the entry has four sections in walking order; the corridor and the inner gallery are the two a person walks through', () => {
  const sections = entrySections(ENTRY)
  assert.deepEqual(sections.map(s => [s.order, s.id, s.walkable]), [[1, 'corridor', true], [2, 'shaft', false], [3, 'pocket', false], [4, 'gallery', true]])
  const [corridor, , , gallery] = sections
  // The 7 ft corridor of the plan (2134) and the 1.0 m wide gallery; plan pixels, not site measurements.
  assert.ok(corridor.widthMm >= 2130 && corridor.widthMm <= 2180, `corridor ${corridor.widthMm} long`)
  assert.ok(corridor.lengthMm >= 1200 && corridor.lengthMm <= 1300, `corridor ${corridor.lengthMm} wide`)
  assert.ok(gallery.widthMm >= 1100 && gallery.widthMm <= 1200, `gallery ${gallery.widthMm} wide`)
  assert.ok(gallery.lengthMm >= 3150 && gallery.lengthMm <= 3250, `gallery ${gallery.lengthMm} long`)
})

test('the first (outer) door is a ventilated, lockable stainless steel door that fills the opening drawn on the plan', () => {
  const result = checkEntryOuterDoor(ENTRY)
  assert.deepEqual(result.issues, [])
  assert.deepEqual([result.openingWidthMm, result.openingHeightMm, result.leafWidthMm, result.leafHeightMm], [905, 2200, 815, 2145])
  assert.ok(result.ventOpenFraction >= VENT_OPEN_FRACTION_MIN && result.ventOpenAreaM2 > 0.6, `free air ${result.ventOpenAreaM2} m2, ${result.ventOpenFraction} of the leaf`)
  assert.deepEqual(result.panels.map(p => p.kind), ['sheet', 'grille', 'sheet', 'grille', 'sheet'])
  assert.equal(ENTRY.outerDoor.openAngleDegrees, 0)
  // Decided: the wooden doors behind it are unchanged, and nothing wooden is added at the outer opening.
  assert.deepEqual([ENTRY.arrivalDoor.wallPlanX, ENTRY.arrivalDoor.fromPlanY, ENTRY.arrivalDoor.toPlanY, ENTRY.arrivalDoor.heightMm], [575, 810, 874, 2200])
  assert.deepEqual([ENTRY.innerOpening.wallPlanY, ENTRY.innerOpening.fromPlanX, ENTRY.innerOpening.toPlanX, ENTRY.innerOpening.heightMm], [715, 515, 570, 2100])
  assert.deepEqual([ENTRY.outerEntryOpening.fromPlanY, ENTRY.outerEntryOpening.toPlanY, ENTRY.outerEntryOpening.heightMm], [822, 867, 2200])
})

test('the door checks catch a gap between panels, a lock on the grille, a solid door and an inward swing', () => {
  const bad = patch => { const e = structuredClone(ENTRY); patch(e.outerDoor); return checkEntryOuterDoor(e).issues.join(' | ') }
  assert.match(bad(d => { d.panels[1].fromMm = 350 }), /gap or overlaps/)
  assert.match(bad(d => { d.lock.heightMm = 1500 }), /not on a solid rail/)
  assert.match(bad(d => { d.panels = [{kind: 'sheet', fromMm: 0, toMm: 2145}] }), /open for air/)
  assert.match(bad(d => { d.opens = 'east-inside' }), /opens outward/)
  assert.match(bad(d => { d.material = 'mild steel, painted' }), /not stainless/)
  assert.equal(entryOuterDoorGeometry(ENTRY).panels.filter(p => p.kind === 'grille').every(p => p.openAreaM2 > 0.25), true)
})

test('the entry lights are round panels: two recessed in the corridor, two surface-mounted in the gallery, nothing linear', () => {
  const result = checkEntryLighting(ENTRY, ENTRY_LIGHTING)
  assert.deepEqual(result.issues, [])
  assert.deepEqual(result.totals, {count: 4, watts: 32, lumens: 3200})
  assert.deepEqual(ENTRY_LIGHTING.fittings.map(f => [f.id, f.section, f.kind]), [['E1', 'corridor', 'recessed'], ['E2', 'corridor', 'recessed'], ['E3', 'gallery', 'surface'], ['E4', 'gallery', 'surface']])
  assert.ok(ENTRY_LIGHTING.fittings.every(f => f.diameterMm > 0 && !('lengthMm' in f)))
  assert.equal(ENTRY_LIGHTING.kelvin, 4000)
  // Corridor panels about 540 mm in from each end wall; E3 about 780 mm in front of the shoe rack's mirror doors.
  const [e1, e2] = result.sections.corridor.fittings, [e3, e4] = result.sections.gallery.fittings
  assert.ok(e1.toWalls.west >= 500 && e1.toWalls.west <= 580 && e2.toWalls.east >= 500 && e2.toWalls.east <= 580)
  assert.ok(e3.toWalls.north >= 750 && e3.toWalls.north <= 820 && e4.toWalls.south >= 600 && e4.toWalls.south <= 700)
  assert.ok(result.sections.corridor.lumensPerM2 >= 500 && result.sections.gallery.lumensPerM2 >= 400)
  // The generic "Interior studio" overlay must not draw its linear strips in the Entry any more.
  assert.equal(ROOM_LIGHTING.entry.ownFixtures, true)
})

test('the light checks catch a strip, a light over the shaft, one against a wall and a dark end of the gallery', () => {
  const bad = patch => { const c = structuredClone(ENTRY_LIGHTING); patch(c); return checkEntryLighting(ENTRY, c).issues.join(' | ') }
  assert.match(bad(c => { c.fittings[0].lengthMm = 600 }), /not a round panel/)
  assert.match(bad(c => { c.fittings[0].section = 'shaft' }), /not a part of the entry a person walks through/)
  assert.match(bad(c => { c.fittings[0].planY = 868 }), /from a wall of the corridor/)
  assert.match(bad(c => { c.fittings.splice(3, 1) }), /gallery: an end of it/)
  assert.match(bad(c => { c.fittings[2].kind = 'recessed' }), /surface-mounted/)
  assert.match(bad(c => { c.switching[0].lights.push('E9') }), /unknown light E9/)
})
