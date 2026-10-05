import test from 'node:test'
import assert from 'node:assert/strict'
import {checkTrackLighting, headPosition, pendantCeilingReport, pendantRodAnchors, TRACK_TO_MOULDING_MM} from '../src/domain/drawingLighting.mjs'
import {LOBBY_LIGHTING, LOBBY_DIMMER_CIRCUITS, LOBBY_CEILING_MOULDINGS} from '../src/config/lobbyLightingConfig.js'
import {EMPTY_ROOM_SHELLS} from '../src/config/roomShellConfig.js'
import {ROOM_LIGHTING} from '../src/home/lighting.mjs'

const room = EMPTY_ROOM_SHELLS.lobby, s = room.furniture.eastIroningStorage
// The ironing board pulled out westward from the east-wall storage.
const board = {x1: room.widthMm - s.depthMm - s.boardLengthMm, x2: room.widthMm - s.depthMm, z1: s.fromNorthMm, z2: s.fromNorthMm + s.lengthMm}

test('the Lobby has two wall-hugging tracks with wall spots, diffused heads and a down spot over the ironing board', () => {
  const result = checkTrackLighting(room, LOBBY_LIGHTING, {downTargets: [board]})
  assert.deepEqual(result.issues, [])
  assert.deepEqual(result.totals, {watts: 63, lumens: 5600, spots: 3, diffused: 2, reading: 1, heads: 6, lumensPerM2: 342, trackMetres: 3.5})
})

test('each track is its own circuit with its own driver, and the sliders are pendant, track 1, track 2', () => {
  const result = checkTrackLighting(room, LOBBY_LIGHTING, {downTargets: [board]})
  assert.equal(LOBBY_LIGHTING.tracks.driverWatts, undefined, 'the shared 100 W driver is gone')
  assert.deepEqual(result.runs, {
    L1: {watts: 44, lumens: 4000, heads: 4, driverWatts: 60, driverLoad: 73, metres: 2},
    L2: {watts: 19, lumens: 1600, heads: 2, driverWatts: 60, driverLoad: 32, metres: 1.5},
  })
  assert.deepEqual(LOBBY_DIMMER_CIRCUITS.map(([id]) => id), ['chandelier', 'L1', 'L2'])
})

test('the old strip lights are gone from the Lobby and the Pooja alcove; the pendant and tracks stay', () => {
  // The generic overlay (render/interiorLighting.js) no longer draws its cove/cabinet/accent strips in rooms with their own
  // fixtures (owner 2026-10-04: "old strip lights ... remove them").
  assert.equal(ROOM_LIGHTING.lobby.ownFixtures, true)
  assert.equal(ROOM_LIGHTING.pooja.ownFixtures, true)
  assert.equal(ROOM_LIGHTING.balcony.ownFixtures, false, 'rooms without their own fixtures keep the overlay')
  assert.equal(LOBBY_LIGHTING.pendant.label, 'Dining shelf light')
  assert.equal(LOBBY_LIGHTING.tracks.runs.length, 2)
})

test('both tracks leave the middle of the ceiling free and stay clear of the doors and the dining pendant', () => {
  const [l1, l2] = LOBBY_LIGHTING.tracks.runs, toilet = room.doors.find(d => d.wall === 'south'), table = room.furniture.diningTable
  assert.ok(l1.atMm > room.lengthMm - 700 && l1.fromMm > toilet.fromMm + toilet.widthMm, 'track 1 is on the south wall, east of the toilet door')
  assert.ok(l2.atMm > room.widthMm - 1100 && l2.toMm <= room.wallOpenings.east.fromMm, 'track 2 is in front of the ironing storage, north of the east opening')
  assert.ok(l2.atMm - (table.centerXmm + table.widthMm / 2) > 1000, 'well clear of the dining table and its pendant')
  const centre = {x: room.widthMm / 2, z: room.lengthMm / 2}
  for (const run of [l1, l2]) assert.ok(Math.abs((run.axis === 'x' ? centre.z : centre.x) - run.atMm) >= 1000, `${run.id} is at least 1 m from the room centre`)
  assert.deepEqual(headPosition(l2, l2.heads[1]), {x: 4100, z: 1375})
  // Phone scan 2026-10-04: the toilet door as it stands, the Bedroom 1 door where the civil work will put it.
  assert.deepEqual([toilet.fromMm, toilet.widthMm], [1060, 605])
  const bedroom = room.doors.find(d => d.wall === 'north')
  assert.deepEqual([bedroom.fromMm, bedroom.widthMm], [100, 900])
  assert.deepEqual(LOBBY_LIGHTING.existingCeilingPoints.map(p => [p.xMm, p.zMm]), [[2645, 1600], [3810, 1615]])
})

test('the checks catch a down spot that misses the ironing board, a spot aimed across the room and an overloaded run', () => {
  const bad = patch => { const c = structuredClone(LOBBY_LIGHTING); patch(c); return checkTrackLighting(room, c, {downTargets: [board]}).issues.join(' | ') }
  assert.match(bad(c => { c.tracks.runs[1].heads[1].atMm = 600 }), /not over a sofa, bed or work spot/)
  assert.match(bad(c => { c.tracks.runs[0].heads[0].aim = 'north' }), /across the room/)
  assert.match(bad(c => { c.tracks.runs[0].driverWatts = 50 }), /L1: the heads draw 44 W, over 80% of its 50 W driver/)
})

test('the centre medallion is modelled as a probable fan, and both tracks are clear of its blades', () => {
  const fans = LOBBY_LIGHTING.ceilingFans, result = checkTrackLighting(room, LOBBY_LIGHTING, {downTargets: [board]})
  assert.equal(fans.status, 'probable, from the scan')
  assert.equal(fans.fans.length, 1); assert.equal(fans.fans[0].status, 'probable, from the scan')
  // The scan's x is from the Drawing Room face of the beam, 40 mm west of this room's x = 0.
  assert.deepEqual([fans.fans[0].xMm, fans.fans[0].zMm], [LOBBY_LIGHTING.existingCeilingPoints[0].xMm - 40, LOBBY_LIGHTING.existingCeilingPoints[0].zMm])
  assert.deepEqual([fans.bladeDiameterMm, fans.dropMm], [1200, 300], 'assumed, as in the other rooms')
  assert.deepEqual(result.clearances, {'L1 to Ceiling fan': 540, 'L2 to Ceiling fan': 895})
  const bad = patch => { const c = structuredClone(LOBBY_LIGHTING); patch(c); return checkTrackLighting(room, c, {downTargets: [board]}).issues.join(' | ') }
  assert.match(bad(c => { c.tracks.runs[0].atMm = 2100 }), /L1 passes -100 mm from the blades of the Ceiling fan/)
})

test('the Lobby mouldings are recorded and both tracks sit on flat slab, with nothing crossing', () => {
  const m = LOBBY_CEILING_MOULDINGS, result = checkTrackLighting(room, LOBBY_LIGHTING, {downTargets: [board]}), [l1, l2] = LOBBY_LIGHTING.tracks.runs
  assert.equal(LOBBY_LIGHTING.ceilingMouldings, m)
  assert.match(m.source, /phone scan 2026-10-04/); assert.match(m.accuracy, /projection assumed/)
  assert.deepEqual(m.border, {north: {fromMm: 390, toMm: 450}, east: {fromMm: 450, toMm: 520}, south: {fromMm: 370, toMm: 440}, west: {fromMm: 580, toMm: 640}})
  assert.deepEqual(m.cornerRings, {fromMm: 300, reachMm: {north: 770, east: 820, south: 790, west: 960}})
  assert.deepEqual(m.medallions.map(p => [p.xMm, p.zMm, p.diameterMm]), [[2605, 1600, 810], [3770, 1615, 440]])
  assert.deepEqual(result.crossings, [])
  assert.ok(Object.values(result.mouldingClearances).every(mm => mm >= TRACK_TO_MOULDING_MM), JSON.stringify(result.mouldingClearances))
  assert.equal(result.mouldingClearances['L1 to south border moulding'], 97)
  assert.equal(result.mouldingClearances['L1 to south-east corner ring'], 73)
  assert.equal(result.mouldingClearances['L2 to north-east corner ring'], 73)
  assert.equal(result.mouldingClearances['L2 to rosette of the domed ceiling light'], 110)
  // Before and after (2026-10-05): L1 ran to x 4700 with diffused heads at 3700 / 4300; L2 was at x 4050.
  assert.deepEqual([l1.atMm, l1.fromMm, l1.toMm, l1.heads.map(h => h.atMm)], [2740, 2100, 4100, [2500, 3100, 3550, 3930]])
  assert.deepEqual([l2.atMm, l2.fromMm, l2.toMm, l2.heads.map(h => h.atMm)], [4100, 500, 2000, [800, 1375]])
  const bad = patch => { const c = structuredClone(LOBBY_LIGHTING); patch(c); return checkTrackLighting(room, c, {downTargets: [board]}).issues.join(' | ') }
  const old = bad(c => { c.tracks.runs[0].toMm = 4700; c.tracks.runs[0].heads[3].atMm = 4300 })
  assert.match(old, /L1 lies across the south-east corner ring/); assert.match(old, /L1 lies across the east border moulding/)
  assert.match(old, /L1: the base of the diffuse head at 4300 is 0 mm from the south-east corner ring/)
  // L2 stays clear of the rosette and of the corner ring even if the scan's west-based positions are 130 mm out (FRAME NOTE).
  assert.match(bad(c => { c.tracks.runs[1].atMm = 4010 }), /L2 is 20 mm from the rosette of the domed ceiling light/)
  assert.match(bad(c => { c.tracks.runs[1].atMm = 4150 }), /L2 is 23 mm from the north-east corner ring/)
})

test('the dining shelf keeps the table and circuit, avoids the north moulding, and still has no ceiling feed', () => {
  const table = room.furniture.diningTable, points = LOBBY_LIGHTING.existingCeilingPoints.map(p => ({...p, xMm: p.xMm - 40}))
  const report = pendantCeilingReport(room, LOBBY_LIGHTING, {x: table.centerXmm, z: table.centerZmm}, points)
  assert.deepEqual([table.centerXmm, table.centerZmm], [2200, 620], 'the dining table is not moved')
  // The real points are on the room's centre line (z about 1600); the nearest is the fan's own medallion.
  assert.deepEqual(report.existingPoints.map(p => p.distanceMm), [1060, 1859])
  assert.match(LOBBY_LIGHTING.pendant.ceilingPoint.status, /none exists over the table; a new point or a swag is needed/)
  assert.deepEqual(report.canopyOnMouldings, [])
  // Owner 2026-10-06: "Let's use this as a dining table light." The dimensions below freeze our PROPOSAL, not a survey.
  const p = LOBBY_LIGHTING.pendant
  assert.deepEqual([p.lengthMm, p.bodyWidthMm, p.thicknessMm, p.bottomMm, p.axis, p.led.kelvin], [1000, 300, 40, 1780, 'z', 3000])
  assert.deepEqual([table.widthMm, table.lengthMm, table.heightMm], [700, 1200, 745])
  assert.deepEqual(LOBBY_DIMMER_CIRCUITS[0], ['chandelier', 'Dining shelf light'])
  assert.deepEqual(report.rodAnchors.map(a => [a.x, a.z]), [[2090, 300], [2310, 300], [2090, 940], [2310, 940]])
  assert.ok(report.rodAnchors.every(a => a.insideRoom && a.clearOfMouldings && a.clearOfBlades))
  assert.equal(Math.min(...report.rodAnchors.flatMap(a => a.mouldings.map(g => g.gapMm))), 70)
  assert.equal(Math.min(...report.rodAnchors.flatMap(a => a.fans.map(g => g.gapMm))), 103)
  assert.equal(report.fans[0].bodyToBladesMm, -56, 'the wider shelf overlaps the blade circle in plan: height matters')
  assert.equal(report.fans[0].boardBelowBladesMm, 566)
  assert.equal(report.fans[0].foliageBelowBladesMm, 216)
  const bigger = structuredClone(LOBBY_LIGHTING); bigger.ceilingFans.bladeDiameterMm = 1400
  const largerFan = pendantCeilingReport(room, bigger, {x: table.centerXmm, z: table.centerZmm})
  assert.equal(largerFan.rodAnchors[3].fans[0].gapMm, 3)
  assert.equal(largerFan.rodAnchors[3].clearOfBlades, false, 'assumed blade diameter cannot certify the mounts')
})

test('the shelf report exposes standing/leaning conflicts and wet weight without claiming engineered support', () => {
  const table = room.furniture.diningTable, centre = {x: table.centerXmm, z: table.centerZmm}
  const report = pendantCeilingReport(room, LOBBY_LIGHTING, centre), c = report.clearance, load = report.hangingLoad
  assert.equal(c.aboveTableMm, 1035); assert.equal(c.foliageAboveTableMm, 807.5)
  assert.equal(c.boardHeadMarginMm, -20); assert.equal(c.foliageHeadMarginMm, -247.5)
  assert.deepEqual(c.tableEdges.map(e => [e.edge, e.boardInsetMm, e.foliageInsetMm, e.boardHeadConflict, e.foliageHeadConflict]),
    [['west', 200, 135, false, true], ['east', 200, 135, false, true], ['north', 100, 35, true, true], ['south', 100, 35, true, true]])
  assert.match(c.advice, /not standing headroom/)
  assert.deepEqual([load.boardKg, load.wetPotsKg, load.hardwareKg, load.totalKg, load.anchorCount], [8.4, 6, 1.6, 16, 4])
  assert.match(load.advice, /Four anchors into the RCC slab/); assert.match(load.advice, /not engineered/)
  const heavier = structuredClone(LOBBY_LIGHTING); heavier.pendant.load.wetPotKg = 4
  assert.equal(pendantCeilingReport(room, heavier, centre).hangingLoad.totalKg, 22)
  const low = structuredClone(LOBBY_LIGHTING); low.pendant.bottomMm = 1600
  assert.equal(pendantCeilingReport(room, low, centre).clearance.boardHeadMarginMm, -200)
})

test('rod checks follow the configured axis and catch moulding clashes and mounts outside the room', () => {
  const p = LOBBY_LIGHTING.pendant, centre = {x: 2200, z: 620}
  assert.deepEqual(pendantRodAnchors({...p, axis: 'x'}, centre), [{x: 1880, z: 510}, {x: 1880, z: 730}, {x: 2520, z: 510}, {x: 2520, z: 730}])
  const bad = structuredClone(LOBBY_LIGHTING); bad.pendant.rods.endInsetMm = 300
  const clash = pendantCeilingReport(room, bad, centre).rodAnchors[0]
  assert.equal(clash.clearOfMouldings, false)
  assert.equal(clash.mouldings.find(m => m.label === 'north border moulding').gapMm, -20)
  assert.ok(pendantCeilingReport(room, LOBBY_LIGHTING, {x: 100, z: 100}).rodAnchors.some(a => !a.insideRoom))
  const noFan = structuredClone(LOBBY_LIGHTING); delete noFan.ceilingFans
  assert.deepEqual(pendantCeilingReport(room, noFan, centre).fans, [])
  const legacy = structuredClone(LOBBY_LIGHTING); delete legacy.pendant.kind
  assert.equal(pendantCeilingReport(room, legacy, centre).rodAnchors, undefined, 'legacy report keys remain usable')
})

test('the Pooja Ghar has one round ceiling light in the middle of the alcove (owner 2026-10-05)', () => {
  const light = room.poojaAlcove.ceilingLight
  assert.deepEqual([light.diameterMm, light.depthMm, light.watts, light.lumens, light.centred], [170, 35, 8, 800, true])
  assert.match(light.kind, /round surface LED panel/)
  assert.ok(light.diameterMm < room.poojaAlcove.widthMm / 2 && light.diameterMm < room.poojaAlcove.depthMm / 2, 'it fits the alcove ceiling with room around it')
})
