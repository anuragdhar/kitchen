import test from 'node:test'
import assert from 'node:assert/strict'
import {ENTRY} from '../src/config/entryConfig.js'
import {ENTRY_LIGHTING} from '../src/config/entryLightingConfig.js'
import {ROOM_LIGHTING} from '../src/home/lighting.mjs'
import {entrySections, checkEntryLighting, checkEntryOuterDoor, entryOuterDoorGeometry, VENT_OPEN_FRACTION_MIN, checkShoeRackAcBay, checkEntryDoorPair, entryDoorLeafPolygons} from '../src/domain/entryFittings.mjs'
import {roomElectricalReport} from '../src/domain/roomElectricalModels.mjs'

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

test('owner 2026-10-06: steel moves to arrivalDoor; landing remains an unchanged plain opening', () => {
  const result = checkEntryOuterDoor(ENTRY)
  assert.deepEqual(result.issues, [])
  // Owner relocation; proposed packed jambs leave 1127 mm leaves in the 1287 mm arrival opening.
  assert.deepEqual([result.openingWidthMm, result.openingHeightMm, result.leafWidthMm, result.leafHeightMm], [1287, 2200, 1127, 2145])
  assert.equal(ENTRY.outerDoor.mountedAt, 'arrivalDoor')
  assert.ok(result.ventOpenFraction >= VENT_OPEN_FRACTION_MIN && result.ventOpenAreaM2 > 0.6, `free air ${result.ventOpenAreaM2} m2, ${result.ventOpenFraction} of the leaf`)
  assert.deepEqual(result.panels.map(p => p.kind), ['sheet', 'grille', 'sheet', 'grille', 'sheet'])
  assert.equal(ENTRY.outerDoor.openAngleDegrees, 0)
  // Opening positions/heights and the Drawing Room door stay; only the arrival leaf's proposed fit/swing changes.
  assert.deepEqual([ENTRY.arrivalDoor.wallPlanX, ENTRY.arrivalDoor.fromPlanY, ENTRY.arrivalDoor.toPlanY, ENTRY.arrivalDoor.heightMm], [575, 810, 874, 2200])
  assert.deepEqual([ENTRY.innerOpening.wallPlanY, ENTRY.innerOpening.fromPlanX, ENTRY.innerOpening.toPlanX, ENTRY.innerOpening.heightMm], [715, 515, 570, 2100])
  assert.deepEqual([ENTRY.outerEntryOpening.fromPlanY, ENTRY.outerEntryOpening.toPlanY, ENTRY.outerEntryOpening.heightMm], [822, 867, 2200])
})

test('proposed paired leaves clear complete arcs, walls, fittings, AC bay and controls, but warn about access', () => {
  const r = checkEntryDoorPair(ENTRY)
  assert.deepEqual(r.issues, [])
  assert.equal(r.leafSeparationMm, 40)
  assert.equal(r.passageMm, 508)
  assert.match(r.warnings.join(' '), /passage.*review access/)
  assert.deepEqual([ENTRY.outerDoor.hinge,ENTRY.outerDoor.opens,ENTRY.outerDoor.maxOpenAngleDegrees], ['north','west-outside',85])
  assert.deepEqual([ENTRY.arrivalDoor.hinge,ENTRY.arrivalDoor.opens,ENTRY.arrivalDoor.maxOpenAngleDegrees], ['north','east-inside',60])
  for (const leaf of Object.values(r.leaves)) {
    assert.ok(leaf.clearances.length >= 12)
    assert.ok(leaf.clearances.every(c => c.clearanceMm >= ENTRY.doorPair.obstacleMarginMm))
  }
  // Plan +x WEST: steel swings toward +x; wood toward -x. Same pure transforms feed both builders.
  const steel = entryDoorLeafPolygons(ENTRY,'outerDoor',85)[0], wood = entryDoorLeafPolygons(ENTRY,'arrivalDoor',60)[0]
  assert.ok(Math.max(...steel.map(p=>p.x)) > 1200)
  assert.ok(Math.min(...wood.map(p=>p.x)) < -1000)
})

test('pair rejects the old wooden swing, untrimmed leaf, wall strike, crossing leaves and displaced controls', () => {
  const bad = patch => { const e=structuredClone(ENTRY); patch(e); return checkEntryDoorPair(e).issues.join(' | ') }
  assert.match(bad(e=>{e.arrivalDoor.opens='west-outside'}), /open away/)
  assert.match(bad(e=>{e.arrivalDoor.maxOpenAngleDegrees=90}), /gallery east wall/)
  assert.match(bad(e=>{e.outerDoor.maxOpenAngleDegrees=90}), /corridor north wall/)
  assert.match(bad(e=>{e.arrivalDoor.leafJambGapMm=0}), /corridor north wall/)
  // South hinge also clears at the limited stop, but adds a hinge relocation and changes the latch/switch side.
  assert.equal(bad(e=>{e.arrivalDoor.hinge='south'}), '')
  assert.match(bad(e=>{e.outerDoor.faceOffsetMm=0}), /face clearance/)
  assert.match(bad(e=>{e.doorPair.electricalFaceMm=300}), /EN-1|EN-2/)
  assert.match(bad(e=>{e.foldSeat.depthMm=1000}), /deployed fold seat/)
  assert.match(bad(e=>{e.shoeRack.widthMm=1800}), /shoe rack|AC bay/)
  assert.match(bad(e=>{e.wallCavity.eastCabinet.planY2=850}), /east cabinet/)
  assert.match(bad(e=>{e.arrivalDoor.openAngleDegrees=80}), /outside the checked arc/)
})

test('bell, future lock conduit and corridor switch follow the new locked line with stable electrical IDs', () => {
  const {points,check,model}=roomElectricalReport('entry')
  assert.deepEqual(check.issues, [])
  for (const [id,along] of [['EN-1',ENTRY.doorPair.corridorSwitchAlongMm],['EN-2',ENTRY.doorPair.bellAlongMm],['EN-7',ENTRY.doorPair.bellAlongMm]]) {
    const p=points.find(p=>p.id===id)
    assert.equal(p.wall,'corridorSouth');assert.equal(p.alongMm,along)
    assert.match(p.use,/PROPOSAL 2026-10-06/)
  }
  assert.equal(points.filter(p=>p.wall==='outerWall').length,0)
  assert.equal(model.doors.find(d=>d.id==='outer').latchAt.x, (ENTRY.arrivalDoor.wallPlanX-ENTRY.planBounds.x1)*ENTRY.planScale.xMetresPerPixel*1000+ENTRY.outerDoor.faceOffsetMm)
  // Security: +plan x is west/outside. The rack/service door is EAST of arrival, not in the unlocked corridor.
  assert.ok(ENTRY.shoeRack.planX2 < ENTRY.arrivalDoor.wallPlanX)
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

test('the AC outdoor unit under the shoe rack (owner proposal 2026-10-05) fits lengthwise, not across, at the drawn 865 mm width', () => {
  const bay = ENTRY.shoeRack.acBay
  assert.match(bay.status, /proposal.*not decided/)
  assert.equal(bay.orientation, 'lengthwise')
  const long = checkShoeRackAcBay(ENTRY)
  assert.deepEqual(long.issues, [])
  assert.deepEqual([long.neededWidthMm, long.bayWidthMm, long.bayDepthMm, long.beyondWallMm, long.neededHeightMm], [440, 865, 1130, 900, 750])
  assert.deepEqual([long.shoeBottomMm, long.shoeHeightLeftMm], [840, 1294])
  assert.ok(long.unknowns.some(u => /free air/.test(u)) && long.unknowns.some(u => /opposite side/.test(u)) && long.unknowns.some(u => /engineer/.test(u)))
  const across = checkShoeRackAcBay(ENTRY, 'across')
  assert.deepEqual([across.neededWidthMm, across.bayDepthMm, across.beyondWallMm], [1200, 670, 440])
  assert.match(across.issues.join(' | '), /865 mm wide.*needs 1200 mm/)
  // The checks catch a bay too low for the unit, a grille that is mostly metal, and a fan face set too far back.
  const bad = patch => { const e = structuredClone(ENTRY); patch(e.shoeRack.acBay); return checkShoeRackAcBay(e).issues.join(' | ') }
  assert.match(bad(b => { b.heightMm = 700 }), /needs 750 mm/)
  assert.match(bad(b => { b.grille.barMm = 30 }), /grille is only 50% open/)
  assert.match(bad(b => { b.clearance.frontGapMm = 120 }), /hot air would come back/)
  assert.match(bad(b => { b.outsideClearMm = 400 }), /only 400 mm of free air/)
  // The plain rack is unchanged: the proposal does not alter its drawn size.
  assert.deepEqual([ENTRY.shoeRack.widthMm, ENTRY.shoeRack.heightMm, ENTRY.shoeRack.projectionMm], [865, 2134, 381])
})
