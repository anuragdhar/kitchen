import test from 'node:test'
import assert from 'node:assert/strict'
import {AC_PLAN, AC_SPACES, AC_PLAN_RULES, AC_FRAMES, AC_INDOOR_UNIT_SIZES, AC_DISCHARGE_POINTS, AC_OUTDOOR_SERVICE} from '../src/config/acPlanConfig.js'
import {AC_OUTDOOR_UNITS} from '../src/config/acOutdoorUnitsConfig.js'
import {checkAcPlan, estimateLoad, roomToPlan, resolveWaypoint, resolveRoute, pipeRoute, indoorUnitBox, draftZone, checkDrain} from '../src/domain/acPlan.mjs'
import {EMPTY_ROOM_SHELLS} from '../src/config/roomShellConfig.js'
import {STUDY_ROOM} from '../src/config/studyRoomConfig.js'
import {DRAWING_ELECTRICAL} from '../src/config/drawingElectricalConfig.js'
import {ENTRY} from '../src/config/entryConfig.js'

const result = checkAcPlan(AC_PLAN), row = id => result.rows.find(r => r.id === id), space = id => AC_SPACES.find(s => s.id === id)
// A copy of the plan with one space changed; the pure checks take the whole bundle, so a test can break one thing at a time.
const changed = (id, patch) => { const spaces = AC_SPACES.map(s => s.id === id ? patch(structuredClone(s)) : s); return checkAcPlan({...AC_PLAN, spaces}) }

test('one entry per conditioned space: what cools it, at what size and status', () => {
  assert.deepEqual(AC_SPACES.map(s => [s.id, s.type, s.status, s.tons, s.outdoorUnitId]), [
    ['drawing', 'split', 'proposed', 1.5, 'drawing'],
    ['lobby', 'split', 'proposed', 1.5, 'bedroom1'],
    ['bedroom1', 'window', 'owned', 1.5, null],
    ['study', 'split', 'existing', 1.5, 'study'],
    ['bedroom3', 'split', 'existing', 1.5, 'bedroom3'],
    ['kitchen', 'none', 'none', 0, null]])
  assert.match(space('kitchen').decision, /^No AC\./)
  // Every machine has a drain to a listed discharge point and a power supply; every split has pipes and a wall hole.
  for (const s of AC_SPACES.filter(s => s.type !== 'none')) {
    assert.ok(AC_DISCHARGE_POINTS[s.drain.at(-1).discharge], `${s.id} drain ends at a discharge point`)
    assert.ok(s.power.needs && (s.power.configPoint || s.power.newPoint || s.power.existing), `${s.id} power`)
    if (s.type === 'split') assert.ok(s.pipe.length >= 3 && s.coreHole.at && s.coreHole.wall && AC_OUTDOOR_SERVICE[s.outdoorUnitId], `${s.id} pipes, hole, service`)
  }
})

test('the plan as drawn has no faults; its compromises and assumptions are listed, not hidden', () => {
  assert.deepEqual(result.issues, [])
  const warnings = result.warnings.join(' | '), notes = result.notes.join(' | ')
  assert.match(warnings, /Drawing Room: the estimate \(1\.46 ton\) is at the limit of a 1\.5 ton unit/)
  assert.match(warnings, /Drawing Room: the outdoor unit cannot be reached from a balcony or window/)
  assert.match(warnings, /Bedroom 2 \(Study\) \+ Home Office: the estimate is 1\.68 ton against a 1\.5 ton unit/)
  assert.match(warnings, /Bedroom 2 \(Study\) \+ Home Office: the air blows straight onto the bed/)
  assert.match(warnings, /Bedroom 3: the indoor unit hangs above the head of the bed/)
  assert.match(warnings, /Bedroom 3: the indoor unit sits inside the slatted AC bay/)
  // The two proposed units (Drawing Room, Lobby) raise nothing about seats, tracks, fans or each other.
  assert.equal(result.warnings.filter(w => /^Lobby/.test(w)).length, 0)
  assert.equal(result.warnings.filter(w => /^Drawing Room/.test(w)).length, 2)
  assert.match(notes, /Bedroom 2 \(Study\) \+ Home Office: where the existing indoor unit hangs was not recorded/)
  assert.match(notes, /Lobby \/ Dining: needs a new AC power point/)
  // No discharge point is confirmed on site, and the checks say so for every drain.
  assert.equal(result.notes.filter(n => /not confirmed on site/.test(n)).length, 5)
  assert.ok(Object.values(AC_DISCHARGE_POINTS).every(p => p.confirmed === false))
})

test('load estimate: area, top floor, sun-facing glass, people and equipment, by the stated rule of thumb', () => {
  assert.deepEqual(AC_PLAN_RULES.load, {baseWPerM2: 150, roofWPerM2: 50, sunGlassWPerM2: 200, shadedGlassFactor: .5, personW: 120, wattsPerTon: 3517, marketTons: [1, 1.5, 2], marginalAbove: .9, sunFacing: ['east', 'south', 'west']})
  assert.deepEqual(result.rows.map(r => [r.id, r.load.areaM2, r.load.sunGlassM2, r.load.watts, r.load.tons, r.load.recommendedTons]), [
    ['drawing', 17.9, 4, 5135, 1.46, 1.5], ['lobby', 16.4, 0, 3752, 1.07, 1.5], ['bedroom1', 13.5, 3.7, 3689, 1.05, 1.5],
    ['study', 19, 7.3, 5918, 1.68, 2], ['bedroom3', 14.8, 3, 3491, 0.99, 1], ['kitchen', 11, 0, 3826, 1.09, 1.5]])
  // By hand for the Drawing Room: 17.89 m2 x (150 + 50) + 4.04 m2 of south glass x 200 + 5 people x 120 + 150 W.
  const d = estimateLoad(space('drawing'), AC_PLAN_RULES)
  assert.equal(Math.round(d.parts.room + d.parts.roof), 3578); assert.equal(Math.round(d.parts.glass), 807); assert.equal(d.parts.people, 600)
  // Not a top floor, no glass: the same room needs less; north glass adds nothing; shaded glass counts half.
  assert.equal(estimateLoad({...space('drawing'), load: {...space('drawing').load, topFloor: false, glass: []}}, AC_PLAN_RULES).tons, 0.98)
  assert.equal(estimateLoad(space('kitchen'), AC_PLAN_RULES).parts.glass, 0)
  const b3 = space('bedroom3'), open = {...b3, load: {...b3.load, glass: b3.load.glass.map(g => ({...g, shaded: false}))}}
  assert.ok(Math.abs(estimateLoad(open, AC_PLAN_RULES).parts.glass - 2 * estimateLoad(b3, AC_PLAN_RULES).parts.glass) < 1e-6)
  // The Drawing Room and Lobby together (glass doors open) are far past any single wall unit.
  assert.ok(row('drawing').load.tons + row('lobby').load.tons > 2.5)
})

test('frames: a room point lands on the plan where Whole home 3D puts it, and routes end on the outdoor units', () => {
  // Drawing Room: its west wall is plan x 688, its north wall plan y 715.
  assert.deepEqual(roomToPlan(AC_FRAMES.drawing, 0, 0), {planX: 688, planY: 715})
  assert.deepEqual(roomToPlan(AC_FRAMES.drawing, EMPTY_ROOM_SHELLS.drawing.widthMm, EMPTY_ROOM_SHELLS.drawing.lengthMm), {planX: 515, planY: 449})
  // Bedroom 1's frame stops at the balcony's inner edge (plan x 339); the balcony continues past widthMm.
  assert.deepEqual(AC_FRAMES.bedroom1.bounds, [339, 612, 515, 794])
  const b1 = EMPTY_ROOM_SHELLS.bedroom1, glazing = roomToPlan(AC_FRAMES.bedroom1, b1.widthMm + b1.balconyExtension.depthMm, 0)
  assert.ok(Math.abs(glazing.planX - 273) < 4, `balcony glazing at plan x ${glazing.planX}`)
  for (const s of AC_SPACES.filter(s => s.type === 'split')) {
    const unit = AC_OUTDOOR_UNITS.find(u => u.id === s.outdoorUnitId), end = row(s.id).pipe.points.at(-1)
    assert.deepEqual([end.planX, end.planY, end.heightMm], [unit.centre.planX, unit.centre.planY, unit.bottomMm + AC_PLAN_RULES.pipe.valveAboveBottomMm])
  }
  assert.throws(() => resolveWaypoint({outdoor: 'nowhere'}, AC_PLAN), /no outdoor unit/)
  // A 3-4-5 triangle in plan millimetres, then 1 m straight up.
  const mmX = ENTRY.planScale.xMetresPerPixel * 1000, mmY = ENTRY.planScale.zMetresPerPixel * 1000
  const route = resolveRoute([{planX: 0, planY: 0, heightMm: 0}, {planX: 3000 / mmX, planY: 4000 / mmY, heightMm: 0}, {planX: 3000 / mmX, planY: 4000 / mmY, heightMm: 1000}], AC_PLAN)
  assert.equal(Math.round(route.lengthMm), 6000)
})

test('refrigerant pipes: every run is inside the usual factory charge of 5 m; the shoe rack alternative is not', () => {
  assert.deepEqual([AC_PLAN_RULES.pipe.prechargedM, AC_PLAN_RULES.pipe.maxM, AC_PLAN_RULES.pipe.minM, AC_PLAN_RULES.pipe.allowanceM], [5, 15, 3, .5])
  assert.deepEqual(result.rows.filter(r => r.pipe).map(r => [r.id, r.pipe.drawnM, r.pipe.lengthM, r.pipe.extraGasG]), [
    ['drawing', 3.8, 4.3, 0], ['lobby', 3.9, 4.4, 0], ['study', 3, 3.5, 0], ['bedroom3', 2.4, 2.9, 0]])
  assert.match(result.notes.join(' | '), /Bedroom 3: the pipe run is only 2\.9 m/)
  // (a) the same indoor unit piped to the bottom of the shoe rack: about 11 m, so extra gas and a little lost capacity.
  const rack = row('drawing').alternatives.find(a => a.id === 'shoeRackBay')
  assert.equal(rack.pipe.lengthM, 11); assert.equal(rack.pipe.extraGasG, 120)
  assert.ok(rack.pipe.lengthM > AC_PLAN_RULES.pipe.prechargedM && rack.pipe.lengthM < AC_PLAN_RULES.pipe.maxM)
  const viaRack = changed('drawing', s => { s.pipe = s.alternatives[0].pipe; return s })
  assert.match(viaRack.warnings.join(' | '), /Drawing Room: the pipe run is 11 m, past the usual 5 m factory charge: about 120 g of extra gas/)
  // Negative: a run past the maximum is a fault, as is an outdoor unit that does not exist or is used twice.
  const far = changed('drawing', s => { s.pipe.splice(2, 0, {planX: 688, planY: 100, heightMm: 2270}); return s })
  assert.match(far.issues.join(' | '), /Drawing Room: the pipe run is [\d.]+ m, past the usual 15 m maximum/)
  assert.match(changed('lobby', s => { s.outdoorUnitId = 'none'; return s }).issues.join(' | '), /no outdoor unit "none"/)
  assert.match(changed('lobby', s => { s.outdoorUnitId = 'drawing'; return s }).issues.join(' | '), /both use the outdoor unit "drawing"/)
})

test('drains: every stretch falls at least 1 in 100, all the way to a discharge point', () => {
  assert.equal(AC_PLAN_RULES.drain.minFall, 1 / 100)
  for (const r of result.rows.filter(r => r.drain)) {
    for (const s of r.drain.segments) assert.ok(s.fallMm >= 0 && (s.runMm < 1 || s.fallMm / s.runMm >= 1 / 100), `${r.id}: ${Math.round(s.fallMm)} in ${Math.round(s.runMm)}`)
    assert.equal(r.drain.points.at(-1).heightMm, 0, `${r.id} ends at floor level`)
  }
  assert.deepEqual(result.rows.filter(r => r.drain).map(r => [r.id, r.drain.lengthM]), [['drawing', 10], ['lobby', 4.8], ['bedroom1', 1.6], ['study', 3.7], ['bedroom3', 4.9]])
  // The Drawing Room drain crosses the south face below the window sill.
  const sill = EMPTY_ROOM_SHELLS.drawing.windows[0].bottomMm, south = row('drawing').drain.points.slice(3, 6)
  assert.ok(south.every(p => p.heightMm < sill), `under the ${sill} mm sill`)
  // Negative: a drain that rises, one that is too flat, one that ends nowhere.
  const messages = [], say = {issue: m => messages.push(m), warn: () => {}, note: () => {}}
  checkDrain('Up', [{planX: 0, planY: 0, heightMm: 2000}, {planX: 50, planY: 0, heightMm: 2010}, {discharge: 'lobbyToilet'}], AC_PLAN, say)
  checkDrain('Flat', [{planX: 0, planY: 0, heightMm: 2000}, {planX: 100, planY: 0, heightMm: 1995}, {discharge: 'lobbyToilet'}], AC_PLAN, say)
  checkDrain('Nowhere', [{planX: 0, planY: 0, heightMm: 2000}, {planX: 10, planY: 0, heightMm: 0}], AC_PLAN, say)
  assert.match(messages.join(' | '), /Up: the drain rises 10 mm on stretch 1.*Flat: drain stretch 1 falls only 5 mm in 1920 mm \(needs 1 in 100\).*Nowhere: the drain does not end at a discharge point/)
})

test('Drawing Room unit: west wall where the electrical plan expects it, clear of the tracks, fans and seats', () => {
  const room = EMPTY_ROOM_SHELLS.drawing, box = row('drawing').box, size = AC_INDOOR_UNIT_SIZES[1.5]
  assert.deepEqual([box.wall, box.x1, box.x2, box.z1, box.z2, box.bottomMm, box.topMm, box.blows], ['west', 0, 220, 1910, 2930, 2230, 2510, 'east'])
  assert.equal((box.z1 + box.z2) / 2, room.furniture.sofa.centerZmm)
  assert.deepEqual(size, {widthMm: 1020, heightMm: 280, depthMm: 220})
  // The AC point W1 of the electrical plan sits beside the unit (150 mm past its south end), not behind it.
  const w1 = DRAWING_ELECTRICAL.points.find(p => p.id === 'W1')
  assert.deepEqual([space('drawing').power.configPoint.alongMm, w1.alongMm - box.z2, w1.wall], [w1.alongMm, 150, 'west'])
  // The stream starts 1.2 m out and misses both sofas of layout C; Track 2 runs 420 mm in front of the casing.
  const zone = draftZone(box, AC_PLAN_RULES)
  assert.deepEqual([zone.x1, zone.x2, zone.z1, zone.z2], [1420, 3720, 1610, 3230])
  // Negative: at the south end of the wall it would blow along the south sofa; a track or a fan too close is a fault.
  assert.match(changed('drawing', s => { s.indoor.centreMm = 4700; return s }).warnings.join(' | '), /Drawing Room: the air blows straight onto the south sofa/)
  assert.match(changed('drawing', s => { s.ceiling.tracks[1].atMm = 450; return s }).issues.join(' | '), /ceiling track T2 runs within 300 mm in front of the indoor unit/)
  assert.match(changed('drawing', s => { s.ceiling.fans[0] = {xMm: 900, zMm: 2400, label: 'North ceiling fan'}; return s }).issues.join(' | '), /is 80 mm from the blade tips of the north ceiling fan/)
  assert.match(changed('drawing', s => { s.indoor.bottomMm = 2400; return s }).issues.join(' | '), /reaches 2680 mm, less than 100 mm under the 2700 mm ceiling/)
  assert.match(changed('drawing', s => { s.power.configPoint.alongMm = 2400; return s }).issues.join(' | '), /power point W1 is hidden behind the indoor unit/)
  assert.match(changed('drawing', s => { s.tall = [{label: 'bookcase', x1: 0, x2: 400, z1: 2000, z2: 2800, topMm: 2100}]; return s }).issues.join(' | '), /the bookcase \(2100 mm high\) stands in the air path/)
})

test('Lobby unit: north wall beside the Pooja alcove, not over the table, not against the Drawing Room unit', () => {
  const room = EMPTY_ROOM_SHELLS.lobby, box = row('lobby').box
  assert.deepEqual([box.wall, box.x1, box.x2, box.z1, box.z2, box.blows], ['north', 2623, 3643, 0, 220, 'south'])
  assert.equal(room.poojaAlcove.fromMm - box.x2, 150)
  const table = room.furniture.diningTable
  assert.ok(box.x1 > table.centerXmm + table.widthMm / 2, 'east of the dining table top')
  // Its outdoor unit is the one the owner marked outside the kitchen north wall (first meant for Bedroom 1).
  assert.equal(row('lobby').outdoor.id, 'bedroom1'); assert.equal(row('lobby').outdoor.bottomMm, 1800)
  // Negative: on the east wall it would blow at the diners; hung on the Drawing Room's east wall it would fight that unit.
  const east = changed('lobby', s => { s.indoor = {wall: 'east', centreMm: 1375, bottomMm: 2230, blows: 'west'}; return s })
  assert.match(east.warnings.join(' | '), /Lobby \/ Dining: the air blows straight onto the dining chair/)
  const facing = changed('lobby', s => { s.frame = 'drawing'; s.indoor = {wall: 'east', centreMm: 2420, bottomMm: 2230, blows: 'west'}; s.ceiling = {tracks: [], fans: []}; s.occupied = {seats: [], beds: []}; return s })
  assert.match(facing.issues.join(' | '), /Drawing Room and Lobby \/ Dining: (one indoor unit blows straight at the other|the two indoor units blow against each other)/)
})

test('Bedroom 1: the window AC is the machine; the split AC stays on record as not recommended', () => {
  const ac = EMPTY_ROOM_SHELLS.bedroom1.balconyExtension.windowAc, box = row('bedroom1').box, s = space('bedroom1')
  assert.equal(s.tons, ac.tons)
  assert.deepEqual([box.z1, box.z2, box.bottomMm, box.topMm, box.x2 - box.x1, box.level], [ac.centerFromNorthMm - ac.widthMm / 2, ac.centerFromNorthMm + ac.widthMm / 2, ac.bottomMm, ac.bottomMm + ac.heightMm, ac.depthMm, true])
  assert.equal(row('bedroom1').pipe, null)
  assert.equal(s.splitAlternative.active, false)
  assert.match(s.splitAlternative.recommendation, /^not needed/)
  // The 1.5 ton window AC covers the estimate for the bedroom and balcony together with room to spare.
  assert.ok(row('bedroom1').load.tons < 1.5 * AC_PLAN_RULES.load.marginalAbove)
  // The outdoor unit proposal is kept and carries the recommendation; nothing was deleted from the owner's marks.
  const marked = AC_OUTDOOR_UNITS.find(u => u.id === 'bedroom1')
  assert.equal(marked.status, 'proposal'); assert.match(marked.planRecommendation, /NOT needed for Bedroom 1/)
  assert.match(AC_OUTDOOR_UNITS.find(u => u.id === 'drawing').planRecommendation, /^KEEP/)
  // Negative: switching the split on puts two machines in one room, and the Lobby's outdoor unit is then taken twice.
  const both = changed('bedroom1', x => { x.splitAlternative.active = true; return x })
  assert.match(both.issues.join(' | '), /Bedroom 1 \+ balcony: two machines cool the same room/)
})

test('Bedroom 2 (Study): the unit belongs on the west wall just north of the Home Office opening', () => {
  const opening = STUDY_ROOM.openings.balconyOffice, d = STUDY_ROOM.dimensions, box = row('study').box
  const northJamb = d.lengthMm - opening.offsetFromSouthMm - opening.widthMm
  assert.deepEqual([box.wall, box.z1, box.z2, box.blows], ['west', 1376, 2396, 'east'])
  assert.equal(northJamb - box.z2, 150)
  assert.equal(space('study').indoor.positionKnown, false)
  // Clear of the bookshelf on the north wall; the wall above the opening (330 mm) is too low for a unit.
  assert.ok(box.z1 - STUDY_ROOM.cabinetry.northBookshelf.depthMm > 500)
  assert.ok(opening.headWallMm < AC_INDOOR_UNIT_SIZES[1.5].heightMm + AC_PLAN_RULES.indoor.ceilingClearMm)
  // The pipes leave through the solid band above the Home Office west window; the drain cannot (it would have to rise).
  const hole = resolveWaypoint(space('study').coreHole.at, AC_PLAN)
  assert.ok(hole.heightMm > box.bottomMm, 'the hole is above the drain outlet, so the drain goes to the toilet instead')
  assert.equal(row('study').drain.discharge, AC_DISCHARGE_POINTS.lobbyToilet.label)
})

test('Bedroom 3: the scanned unit fits the planned cabinet bay; a bay that misses it is a fault', () => {
  const unit = EMPTY_ROOM_SHELLS.bedroom3.existing.acUnit, box = row('bedroom3').box
  assert.deepEqual([box.wall, box.z1, box.z2, box.bottomMm, box.topMm], ['east', unit.fromNorthMm, unit.fromNorthMm + unit.widthMm, unit.bottomMm, unit.topMm])
  assert.match(changed('bedroom3', s => { s.indoor.enclosure.fromMm = 1400; return s }).issues.join(' | '), /Bedroom 3: the unit \(1348-2278\) does not fit the bay/)
})

test('outdoor units: how each is reached for service is recorded', () => {
  assert.deepEqual(Object.keys(AC_OUTDOOR_SERVICE).sort(), AC_OUTDOOR_UNITS.map(u => u.id).sort())
  assert.equal(AC_OUTDOOR_SERVICE.drawing.from, null)
  for (const id of ['bedroom3', 'study', 'bedroom1']) assert.ok(AC_OUTDOOR_SERVICE[id].reachMm <= AC_PLAN_RULES.outdoor.serviceReachMm, id)
  const hard = checkAcPlan({...AC_PLAN, service: {...AC_OUTDOOR_SERVICE, study: {from: 'the terrace', reachMm: 1500}}})
  assert.match(hard.warnings.join(' | '), /Bedroom 2 \(Study\) \+ Home Office: the outdoor unit is a 1500 mm reach from the terrace/)
  assert.equal(pipeRoute(space('study').pipe, AC_PLAN).liftM, 0.7)
  assert.equal(indoorUnitBox(space('kitchen'), AC_PLAN), null)
})

test('every AC has a defined power point, the same point as in the electrical plans (owner 2026-10-05)', async () => {
  const {AC_PLAN: plan} = await import('../src/config/acPlanConfig.js')
  const {resolveWaypoint: resolve} = await import('../src/domain/acPlan.mjs')
  const {roomElectricalReport} = await import('../src/domain/roomElectricalModels.mjs')
  const {DRAWING_ELECTRICAL} = await import('../src/config/drawingElectricalConfig.js')
  const machines = plan.spaces.filter(space => space.power)
  assert.deepEqual(machines.map(space => [space.id, space.power.electricalId]), [['drawing', 'W1'], ['lobby', 'L-N4'], ['bedroom1', 'B1-B1'], ['study', 'ST-W2'], ['bedroom3', 'B3-E3']])
  for (const space of machines) {
    const p = resolve(space.power.at, plan)
    assert.ok(Number.isFinite(p.planX) && Number.isFinite(p.planY) && space.power.at.heightMm > 0, `${space.id}: the power point has a place`)
    assert.ok(space.power.place.length > 20, `${space.id}: the place is described`)
  }
  // Same wall position and height as the electrical plan's point.
  const electrical = {lobby: 'lobby', bedroom1: 'bedroom1', study: 'study', bedroom3: 'bedroom3'}
  for (const [id, key] of Object.entries(electrical)) {
    const space = plan.spaces.find(s => s.id === id), point = roomElectricalReport(key).points.find(p => p.id === space.power.electricalId)
    assert.ok(point, `${id}: ${space.power.electricalId} is in the electrical plan`)
    assert.equal(point.heightMm, space.power.at.heightMm, `${id}: same height`)
    const along = ['north', 'south'].includes(point.wall) ? space.power.at.xMm : space.power.at.zMm
    assert.ok(Math.abs(point.alongMm - along) <= 1, `${id}: ${point.alongMm} along the wall in the electrical plan, ${along} in the AC plan`)
  }
  const w1 = DRAWING_ELECTRICAL.points.find(p => p.id === 'W1'), drawing = plan.spaces.find(s => s.id === 'drawing')
  assert.deepEqual([drawing.power.at.zMm, drawing.power.at.heightMm], [w1.alongMm, w1.heightMm])
  // The Lobby point is beside its unit, on the side away from the Pooja alcove.
  const lobby = plan.spaces.find(s => s.id === 'lobby')
  assert.ok(lobby.power.at.xMm < lobby.indoor.centreMm - 500)
})
