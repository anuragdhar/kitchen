import test from 'node:test'
import assert from 'node:assert/strict'
import {checkBedroom1Layout, bedroom1Plan, bedroom1CabinetSpan, leafSweep, routeExists} from '../src/domain/bedroom1Layout.mjs'
import {BEDROOM1_DESIGN, BEDROOM1_LAYOUT_KEYS, bedroom1LightingFor} from '../src/config/bedroom1LayoutConfig.js'
import {BEDROOM1_LIGHTING} from '../src/config/bedroom1LightingConfig.js'
import {checkTrackLighting} from '../src/domain/drawingLighting.mjs'
import {buildRoomReview} from '../src/domain/roomReview.mjs'
import {EMPTY_ROOM_SHELLS} from '../src/config/roomShellConfig.js'

const room = EMPTY_ROOM_SHELLS.bedroom1
const box = r => [Math.round(r.x1), Math.round(r.x2), Math.round(r.z1), Math.round(r.z2)]
// The layout as it stood before 2026-10-05: hamper and rug by the lobby door, hinged doors on the balcony wardrobe.
const before = () => {
  const design = structuredClone(BEDROOM1_DESIGN), old = structuredClone(room)
  Object.assign(design.layouts.present.loose.hamper, {centerXmm: 850, centerZmm: 2650})
  design.layouts.present.loose.rug.centerZmm = 2550
  delete old.balconyExtension.poojaWallWardrobe.doors
  return {design, old}
}

test('the present layout is the default and its fixed furniture is exactly roomShellConfig\'s', () => {
  assert.equal(BEDROOM1_DESIGN.defaultLayout, 'present')
  assert.deepEqual(BEDROOM1_LAYOUT_KEYS, ['present', 'headSouth'])
  assert.equal(BEDROOM1_DESIGN.layouts.present.bed, undefined, 'the default bed is not copied out of roomShellConfig')
  const plan = bedroom1Plan(room)
  assert.deepEqual(room.furniture.bed, {lengthMm: 1829, widthMm: 1524, fromWestMm: 1524, fromSouthMm: 0})
  assert.deepEqual(box(plan.bed), [1524, 3353, 1716, 3240]); assert.equal(plan.bed.headWall, 'east')
  assert.deepEqual(box(plan.wardrobe), [0, 508, 0, 1800]); assert.equal(plan.wardrobe.leafMm, 600)
  assert.deepEqual(box(plan.recessWardrobe), [2503, 3353, -400, 0])
  // The planned lobby door stays 100 mm off the west wall, in step with the lobby's entry.
  assert.deepEqual(room.doors.find(d => d.wall === 'south'), {wall: 'south', fromMm: 100, widthMm: 900, heightMm: 2100, leadsTo: 'Lobby / Dining'})
  assert.equal(EMPTY_ROOM_SHELLS.lobby.doors.find(d => d.leadsTo === 'Bedroom 1').fromMm, 100)
  assert.match(BEDROOM1_DESIGN.status, /not measured on site/)
  assert.throws(() => bedroom1Plan(room, 'nope'), /Unknown Bedroom 1 layout/)
})

test('the medicine cabinet sits on the south wall behind the present bed', () => {
  const span = bedroom1CabinetSpan(room), plan = bedroom1Plan(room)
  assert.deepEqual([Math.round(span.start), Math.round(span.end)], [2381, 3201])
  assert.ok(plan.bed.x1 < span.start && plan.bed.x2 > span.end && plan.bed.z2 === room.lengthMm, 'the bed covers the whole cabinet')
  assert.equal(Math.round(plan.medicineCabinet.leafMm), 407)
})

test('before 2026-10-05: the hamper stood in the lobby door swing and the window AC stopped a balcony wardrobe door', () => {
  const {design, old} = before(), result = checkBedroom1Layout(old, 'present', design), text = result.issues.join(' | ')
  assert.match(text, /laundry hamper stands within 600 mm inside the door to Lobby/)
  assert.match(text, /if hinged on its west jamb, opens only 25 degrees before it meets the laundry hamper/)
  assert.match(text, /if hinged on its east jamb, opens only 48 degrees before it meets the laundry hamper/)
  assert.match(text, /only 474 mm beyond the foot of the bed/)
  assert.match(text, /the east door of the balcony wardrobe opens only 41 degrees before it meets the window AC/)
  assert.match(result.notes.join(' | '), /the rug lies under the swing of the door to Lobby/)
  assert.equal(result.issues.length, 9)
})

test('present layout after the small fixes: what is left cannot be fixed without moving the bed', () => {
  const result = checkBedroom1Layout(room)
  assert.deepEqual(result.issues, [
    'the bed\'s south side is against the wall: whoever sleeps there has to climb over the other person (needs 600 mm)',
    'the west door of the medicine cabinet opens 0 degrees: the bed is in front of it',
    'the east door of the medicine cabinet opens 0 degrees: the bed is in front of it',
    'the medicine cabinet cannot be reached standing: the nearest place to stand is 1713 mm from it (an arm reaches about 750)',
  ])
  const c = result.clearances
  assert.deepEqual(c.bedSides, {north: 1196, south: 0}); assert.equal(c.bedFoot, 1016)
  assert.deepEqual(c.doorSwings, {'Bedroom 1 washroom': {west: 90, east: 90}, 'Lobby / Dining': {west: 90, east: 90}})
  assert.deepEqual(c.routes, {'washroom door': true, 'balcony opening': true, 'west wardrobe': true, 'recess wardrobe': true})
  assert.equal(c.westWardrobeLeafToBed, 416)
  assert.equal(c.balconyOpeningClear, 1716); assert.equal(c.acStreamMargin, 33); assert.equal(c.acToBalconyWardrobe, 217)
  const notes = result.notes.join(' | ')
  assert.match(notes, /the bed stands across 484 mm of the balcony opening \(1716 of 2200 mm stay clear\)/)
  assert.match(notes, /the bed headboard stands 33 mm beside the window AC's air stream/)
  assert.match(notes, /balcony wardrobe is drawn 208 mm deeper than the balcony/)
  assert.match(notes, /balcony chair is 303 mm from the window AC/)
  // The moved loose pieces: hamper on the west wall south of the wardrobe, rug 900 mm further north.
  assert.deepEqual(box(result.plan.loose.hamper), [50, 450, 1850, 2250]); assert.deepEqual(box(result.plan.loose.rug), [450, 1650, 1000, 2300])
  assert.equal(room.balconyExtension.poojaWallWardrobe.doors, 'sliding')
  assert.equal(room.balconyExtension.poojaWallWardrobe.northShiftMm, 300, 'the wardrobe itself did not move')
})

test('layout B: bed head on the south wall passes every check', () => {
  const result = checkBedroom1Layout(room, 'headSouth'), c = result.clearances, plan = result.plan
  assert.deepEqual(result.issues, [])
  assert.equal(result.ok, true)
  assert.deepEqual(box(plan.bed), [1150, 2674, 1411, 3240]); assert.equal(plan.bed.headWall, 'south')
  assert.equal(plan.bed.lengthMm, room.furniture.bed.lengthMm); assert.equal(plan.bed.widthMm, room.furniture.bed.widthMm)
  assert.deepEqual(c.bedSides, {west: 642, east: 679}); assert.equal(c.bedFoot, 911); assert.equal(c.behindDressingSeat, 611)
  assert.equal(c.westWardrobeLeafToBed, 42)
  assert.deepEqual(c.medicineCabinetLeaves, {west: 90, east: 90}); assert.ok(c.medicineCabinetReach <= 750)
  assert.equal(plan.medicineCabinet.doorBottomMm, 1250); assert.ok(plan.medicineCabinet.doorBottomMm > plan.bed.headboardTopMm, 'the cabinet doors start above the headboard')
  assert.equal(c.balconyOpeningClear, 2200); assert.equal(c.routes['dressing table'], true)
  assert.deepEqual(box(plan.dressingTable), [1510, 2410, 0, 350]); assert.deepEqual(box(plan.bedsideTable), [2694, 3094, 2890, 3240])
  const washroom = plan.doors.find(d => d.wall === 'north'), lobby = plan.doors.find(d => d.wall === 'south')
  assert.ok(plan.dressingTable.x1 > washroom.x2 && plan.dressingTable.x2 < plan.recessWardrobe.x1, 'between the washroom door and the recess wardrobe')
  assert.equal(plan.bed.x1 - lobby.x2, 150)
  const notes = result.notes.join(' | ')
  assert.match(notes, /642 mm beside the bed on its west side: enough to walk \(600\), under the comfortable 750/)
  assert.match(notes, /679 mm beside the bed on its east side/)
  // The unchanged pieces are the same objects in both layouts.
  assert.deepEqual(box(plan.wardrobe), box(bedroom1Plan(room).wardrobe)); assert.deepEqual(plan.balcony.wardrobe, bedroom1Plan(room).balcony.wardrobe)
})

test('the checks catch the mistakes they are there for', () => {
  const bad = (patch, key = 'headSouth') => { const design = structuredClone(BEDROOM1_DESIGN), r = structuredClone(room); patch(design.layouts[key], r, design); return checkBedroom1Layout(r, key, design).issues.join(' | ') }
  assert.match(bad(l => { l.bed.fromWestMm = 900 }), /bed stands within 600 mm inside the door to Lobby.*if hinged on its east jamb, opens only/)
  assert.match(bad(l => { l.bed.fromWestMm = 1000 }), /bed stands where the west wardrobe doors swing/)
  assert.match(bad(l => { l.bed.fromWestMm = 1300 }), /only 529 mm beside the bed on its east side \(needs 600\)/)
  assert.match(bad(l => { l.bed.fromWestMm = 2000 }), /bed leaves the room/)
  assert.match(bad(l => { delete l.medicineCabinet }), /the west door of the medicine cabinet opens 0 degrees: the bed is in front of it.*the east door of the medicine cabinet opens \d+ degrees: the bedside table/)
  assert.match(bad(l => { l.dressingTable.fromWestMm = 800 }), /dressing table stands within 600 mm inside the door to Bedroom 1 washroom/)
  assert.match(bad(l => { l.dressingTable.fromWestMm = 2000 }), /dressing table stands where the recess wardrobe doors swing/)
  assert.match(bad(l => { l.dressingTable.depthMm = 500 }), /only 461 mm between a person sitting at the dressing table and the foot of the bed/)
  assert.match(bad(l => { l.loose.hamper = {centerXmm: 800, centerZmm: 1000, diameterMm: 400, heightMm: 490} }), /laundry hamper stands where the west wardrobe doors swing/)
  // A tall screen in the window AC's stream, and one right in front of it.
  assert.match(bad(l => { l.loose.plant = {centerXmm: 2950, centerZmm: 1350, diameterMm: 400, heightMm: 1500} }), /plant \(1500 mm high\) stands in the window AC's air stream/)
  assert.match(bad((l, r) => { r.balconyExtension.furniture.chair.centerFromNorthMm = 1350 }), /balcony chair stands within 600 mm in front of the window AC/)
  assert.match(bad((l, r) => { r.balconyExtension.furniture.table.centerFromNorthMm = 1700 }), /balcony table stands within 450 mm in front of the balcony wardrobe/)
  // Present layout: the bed pulled off the wall blocks the balcony opening and the AC.
  assert.match(bad((l, r) => { r.furniture.bed.fromSouthMm = 700 }, 'present'), /bed headboard \(1170 mm high\) stands in the window AC's air stream/)
  assert.match(bad((l, r) => { r.furniture.bed.fromSouthMm = 1716 }, 'present'), /only 0 mm of the balcony opening is clear|only \d+ mm of the balcony opening is clear/)
})

test('a hinged leaf stops at the first thing it meets; touching an edge is not a hit', () => {
  const wall = {name: 'post', x1: 300, x2: 400, z1: -400, z2: -300, topMm: 2000, kind: 'fixed'}
  const leaf = {hinge: {x: 0, z: 0}, fromDeg: 0, toDeg: -90, leafMm: 600}
  assert.deepEqual(leafSweep(leaf, []), {openDeg: 90, blockedBy: null})
  const hit = leafSweep(leaf, [wall])
  assert.equal(hit.blockedBy, 'post'); assert.ok(hit.openDeg > 30 && hit.openDeg < 45, `${hit.openDeg}`)
  assert.equal(leafSweep({...leaf, bottomMm: 2000}, [wall]).openDeg, 90, 'a leaf that starts above the obstacle clears it')
  assert.equal(leafSweep(leaf, [{...wall, x1: -200, x2: 0}]).openDeg, 90, 'flush with the hinge line')
  assert.equal(leafSweep(leaf, [{...wall, kind: 'flat'}]).openDeg, 90, 'a rug does not stop a door')
})

test('a walkway needs its full width: a 500 mm gap is not a 600 mm route', () => {
  const plan = {widthMm: 3000, lengthMm: 3000, obstacles: [{name: 'a', x1: 0, x2: 1250, z1: 1400, z2: 1600, topMm: 900, kind: 'fixed'}, {name: 'b', x1: 1750, x2: 3000, z1: 1400, z2: 1600, topMm: 900, kind: 'fixed'}]}
  const from = {x1: 0, x2: 3000, z1: 2400, z2: 3000}, to = {x1: 0, x2: 3000, z1: 0, z2: 600}
  assert.equal(routeExists(plan, from, to, 600, 200), false)
  assert.equal(routeExists(plan, from, to, 500, 200), true)
  plan.obstacles[1].x1 = 1850
  assert.equal(routeExists(plan, from, to, 600, 200), true)
})

test('lighting: the default config is untouched for layout A; layout B turns the bed track and still passes', () => {
  assert.equal(bedroom1LightingFor(BEDROOM1_LIGHTING, 'present'), BEDROOM1_LIGHTING)
  const config = bedroom1LightingFor(BEDROOM1_LIGHTING, 'headSouth'), bed = bedroom1Plan(room, 'headSouth').bed
  assert.equal(config.tracks.runs[0], BEDROOM1_LIGHTING.tracks.runs[0], 'track 1 (wardrobe) stays')
  const b2 = config.tracks.runs[1]
  assert.equal(b2.id, 'B2'); assert.equal(b2.axis, 'x'); assert.equal(room.lengthMm - b2.atMm, 720)
  const result = checkTrackLighting(room, config, {downTargets: [{...bed, label: 'bed'}], needsReading: true})
  assert.deepEqual(result.issues, [])
  const reading = b2.heads.filter(h => h.kind === 'reading').map(h => h.atMm), centre = (bed.x1 + bed.x2) / 2
  assert.deepEqual(reading.map(x => Math.sign(x - centre)), [-1, 1], 'one reading head each side of the bed centre')
  // The default bed track would be wrong for layout B: its reading heads are not over the turned bed's pillows.
  assert.equal(BEDROOM1_LIGHTING.tracks.runs[1].atMm, 2600); assert.ok(Math.abs(2600 - bed.x2) < 100, 'today\'s track would run along the turned bed\'s east edge')
})

test('the review brief: default layout keeps its title and gains checks; layout B is named and described', () => {
  const date = new Date(2026, 9, 5)
  const a = buildRoomReview({roomKey: 'bedroom1', room, date}), same = buildRoomReview({roomKey: 'bedroom1', room, layoutKey: 'present', date})
  assert.equal(a.layoutLabel, null); assert.equal(a.text, same.text)
  assert.match(a.text, /Bed 1829x1524: x 1524-3353, z 1716-3240/)
  assert.match(a.text, /## Known problems\n- the bed's south side is against the wall/)
  assert.match(a.text, /Nothing in this room is measured on site/)
  const b = buildRoomReview({roomKey: 'bedroom1', room, layoutKey: 'headSouth', date})
  assert.equal(b.title, 'Bedroom 1 - Layout B: bed head on the south wall, a walkway on both sides')
  assert.match(b.text, /Bed 1829x1524: x 1150-2674, z 1411-3240/)
  assert.match(b.text, /Dressing table on the north wall: x 1510-2410, z 0-350/)
  assert.doesNotMatch(b.text, /## Known problems/)
  for (const i of [...a.planItems, ...b.planItems]) assert.ok(i.x1 >= 0 && i.z1 >= 0 && i.x2 <= room.widthMm && i.z2 <= room.lengthMm && i.x2 > i.x1 && i.z2 > i.z1, i.label)
})
