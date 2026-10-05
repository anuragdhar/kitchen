import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import {ROOM_ELECTRICAL_PAGES, CIRCUIT_LOADING_MAX} from '../src/config/roomElectricalConfig.js'
import {DRAWING_ELECTRICAL} from '../src/config/drawingElectricalConfig.js'
import {checkRoomElectrical, describePointPlace, estimateRoomLoad, rectWalls, resolveRoomPoint, roomPointPosition, ROOM_ELECTRICAL_CHECKS} from '../src/domain/roomElectrical.mjs'
import {hasRoomElectrical, roomElectricalKeys, roomElectricalReport, roomElectricalModel} from '../src/domain/roomElectricalModels.mjs'

// A small made-up room, 4000 x 3000 x 2700: a door in the north wall (x 500-1400, latch at 1400), a window in the south
// wall, a bed against the east wall, an AC on the west wall, one track run and one fan.
const model = () => ({
  key: 'test', name: 'Test room', widthMm: 4000, lengthMm: 3000, heightMm: 2700, walls: rectWalls(4000, 3000),
  openings: [{name: 'door', wall: 'north', a: 500, b: 1400, bottom: 0, top: 2100}, {name: 'window', wall: 'south', a: 1000, b: 3000, bottom: 900, top: 2100}],
  blockers: [{name: 'bed', wall: 'east', a: 1000, b: 2800, bottom: 0, top: 600}, {name: 'door leaf', wall: 'west', a: 0, b: 900, bottom: 0, top: 2100, leaf: true}],
  doors: [{id: 'door', name: 'door', wall: 'north', fromMm: 500, widthMm: 900, latch: 'to'}],
  chargeSpots: [{name: 'pillow', x: 3600, z: 1300}],
  acs: [{id: 'ac', name: 'AC unit', wall: 'west', a: 1500, b: 2500, bottom: 2230, top: 2510}],
  tracks: [{id: 'T1', label: 'Track 1', axis: 'x', atMm: 600, fromMm: 500, toMm: 3500, driverWatts: 60}],
  fans: [{name: 'ceiling fan', x: 2000, z: 1500}],
  lightingCircuits: [{id: 'T1', label: 'Track 1'}, {id: 'fan1', label: 'ceiling fan'}],
  anchors: {bedside: {wall: 'east', alongMm: 1200}}, existing: {'X-1': {id: 'X-1', wall: 'south', fromMm: 300, toMm: 500, bottomMm: 1150, topMm: 1250}},
})
const plan = () => ({
  points: [
    {id: 'SB', name: 'Switchboard', kind: 'lighting', wall: 'north', alongMm: 1600, heightMm: 1200, switchboard: true, forDoor: 'door', switches: ['T1', 'fan1'], loadW: 100},
    {id: 'BS', name: 'Bedside', kind: 'charging', anchor: 'bedside', heightMm: 800},
    {id: 'AC', name: 'AC point', kind: 'dedicated', wall: 'west', alongMm: 2700, heightMm: 2300, forAc: 'ac', loadW: 1700},
    {id: 'DR', name: 'Driver feed', kind: 'lighting', driverFor: 'T1', runEnd: 'from'},
    {id: 'FN', name: 'Fan', kind: 'lighting', fan: 1},
    {id: 'US', name: 'Utility socket', kind: 'power', wall: 'south', alongMm: 3500, heightMm: 300},
  ],
  circuits: [{id: 'light', name: 'Lights', mcbA: 10, rcd: true, points: ['SB', 'BS', 'DR', 'FN']}, {id: 'power', name: 'Power', mcbA: 16, rcd: true, points: ['US']}, {id: 'ac', name: 'AC', mcbA: 20, rcd: false, points: ['AC']}],
})
const change = (id, patch) => { const p = plan(); return {...p, points: p.points.flatMap(x => x.id !== id ? [x] : patch === null ? [] : [{...x, ...patch}])} }
const issues = (id, patch, m = model()) => checkRoomElectrical(m, change(id, patch)).issues.join(' | ')

test('the generic check passes a sound plan and reports one row per rule', () => {
  const result = checkRoomElectrical(model(), plan())
  assert.deepEqual(result.issues, []); assert.equal(result.ok, true)
  assert.deepEqual(result.results.map(r => r.id), ROOM_ELECTRICAL_CHECKS.map(([id]) => id))
  assert.equal(result.results.find(r => r.id === 'doors').note, '1 door')
  assert.deepEqual(result.reach, [{spot: 'pillow', nearestMm: 412, point: 'BS'}])
  assert.deepEqual(result.byKind, {lighting: 3, charging: 1, dedicated: 1, power: 1})
})

test('points resolve from anchors, track ends, fans and existing points, and land on the right wall', () => {
  const m = model(), at = (p, face = 0) => roomPointPosition(m, resolveRoomPoint(m, p), {wallFaceMm: face})
  assert.deepEqual(at({id: 'a', anchor: 'bedside', heightMm: 800}), {x: 4000, y: 800, z: 1200})
  assert.deepEqual(at({id: 'a', anchor: 'bedside', heightMm: 800}, 40), {x: 3960, y: 800, z: 1200})
  assert.deepEqual(at({id: 'a', anchor: 'bedside', alongOffsetMm: 100, heightMm: 800}), {x: 4000, y: 800, z: 1300})
  assert.deepEqual(at({id: 'b', driverFor: 'T1', runEnd: 'to'}), {x: 3500, y: 2700, z: 600})
  assert.deepEqual(at({id: 'c', fan: 1}), {x: 2000, y: 2700, z: 1500})
  assert.deepEqual(at({id: 'd', existing: 'X-1'}), {x: 400, y: 1200, z: 3000})
  assert.deepEqual(at({id: 'e', wall: 'south', alongMm: 500, heightMm: 300}, 40), {x: 500, y: 300, z: 2960})
  assert.deepEqual(at({id: 'f', wall: 'free', xMm: 10, zMm: -20, heightMm: 30}), {x: 10, y: 30, z: -20})
  assert.equal(at({id: 'g', wall: 'cabinet'}), null)
  assert.equal(describePointPlace(m, resolveRoomPoint(m, {id: 'h', wall: 'west', alongMm: 700, heightMm: 300})), 'west wall, z 700, 300 high')
  assert.match(checkRoomElectrical(m, {points: [{id: 'z', name: 'Lost', kind: 'power', anchor: 'nowhere', heightMm: 300}], circuits: []}).issues.join(' | '), /z \(Lost\) has no place: anchor nowhere not found/)
  // Default loads: a 6 A charging point, a 16 A power point, the driver of the run, a fan.
  assert.deepEqual(['BS', 'US', 'DR', 'FN'].map(id => resolveRoomPoint(m, plan().points.find(p => p.id === id)).loadW), [100, 1000, 60, 75])
})

test('a point in an opening, behind furniture or a door leaf, or out of reach is caught; hidden points may be covered', () => {
  assert.match(issues('US', {wall: 'north', alongMm: 900}), /US \(Utility socket\) is in the door/)
  assert.match(issues('US', {alongMm: 2000, heightMm: 1200}), /is in the window/)
  assert.equal(issues('US', {alongMm: 2000, heightMm: 300}), '', 'below the sill is solid wall')
  assert.equal(issues('US', {wall: 'north', alongMm: 900, heightMm: 2300, kind: 'lighting', loadW: 1000}), '', 'above the door head is solid wall')
  assert.match(issues('BS', {heightMm: 400}), /BS \(Bedside\) is hidden behind the bed/)
  assert.equal(issues('BS', {heightMm: 400, hidden: true}), '')
  assert.match(issues('US', {wall: 'west', alongMm: 400}), /hidden behind the door leaf/)
  assert.match(issues('US', {heightMm: 1500}), /outside the 150-1300 mm reach for a socket/)
  assert.match(issues('US', {alongMm: 4200}), /is off the south wall/)
  assert.match(issues('US', {wall: 'attic'}), /unknown wall \(attic\)/)
  assert.match(issues('US', {id: 'SB'}), /SB is listed twice/)
})

test('every door needs a switchboard on its latch side at switch height', () => {
  assert.match(issues('SB', null), /no switchboard for the door/)
  assert.match(issues('SB', {alongMm: 300}), /on the hinge side of the door/)
  assert.match(issues('SB', {alongMm: 2300}), /SB \(Switchboard\) is 900 mm from the latch side of the door \(at most 700\)/)
  assert.match(issues('SB', {heightMm: 1600}), /outside the 1100-1400 mm switch height/)
  assert.match(issues('SB', {forDoor: 'gate'}), /serves an unknown door \(gate\).*no switchboard for the door/)
  // A door described only by its latch point (the Main entry) is measured from that point, with its own radius.
  const m = {...model(), doors: [{id: 'door', name: 'door', latchAt: {x: 1400, z: 0}, boardRadiusMm: 150}]}
  assert.match(issues('SB', {}, m), /200 mm from the latch side of the door \(at most 150\)/)
})

test('charging reach, AC points, driver and fan feeds, switches', () => {
  assert.match(issues('BS', {kind: 'power'}), /no charging point within 1.5 m of the pillow/)
  assert.match(issues('BS', {optional: true}), /no charging point within 1.5 m/, 'an optional point does not count')
  assert.match(issues('AC', null), /no dedicated point for the AC unit/)
  assert.match(issues('AC', {alongMm: 2000}), /hidden behind the AC unit/)
  assert.match(issues('AC', {alongMm: 200, heightMm: 2300}), /1300 mm from the AC unit \(at most 1000\)/)
  assert.match(issues('AC', {wall: 'east', alongMm: 500}), /not on the wall of the AC unit/)
  assert.match(issues('AC', {forAc: 'cooler'}), /unknown AC \(cooler\)/)
  assert.match(issues('DR', null), /no driver feed for track run T1/)
  assert.match(issues('DR', {driverFor: undefined, wall: 'ceiling', xMm: 2000, zMm: 2500}), /no driver feed for track run T1/)
  assert.match(issues('FN', null), /no point for the ceiling fan/)
  assert.match(issues('SB', {switches: ['T1']}), /no switch for ceiling fan \(fan1\)/)
  assert.match(issues('SB', {switches: ['T1', 'fan1', 'T9']}), /switches "T9", which is not a lighting circuit/)
  // A driver feed on a wall counts when it is within the 48 V lead of the run.
  const wallFeed = {driverFor: 'T1', wall: 'north', alongMm: 2000, heightMm: 2300, existing: undefined}
  assert.equal(issues('DR', wallFeed), '')
  assert.match(issues('DR', {...wallFeed, wall: 'south'}), /DR \(Driver feed\) is 2433 mm from track run T1 \(at most 800\)/)
})

test('circuits: every loaded point on exactly one, dedicated points alone, at most 80% of the breaker', () => {
  const run = circuits => checkRoomElectrical(model(), {...plan(), circuits}).issues.join(' | ')
  const [light, power, ac] = plan().circuits
  assert.match(run([light, power]), /AC \(AC point\) is on no circuit/)
  assert.match(run([light, power, ac, {id: 'x', name: 'Extra', mcbA: 6, points: ['US']}]), /US is on two circuits \(power and x\)/)
  assert.match(run([light, {...power, points: ['US', 'AC']}]), /circuit power puts the dedicated point AC together with other points/)
  assert.match(run([light, {...power, points: ['US', 'XX']}, ac]), /circuit power lists XX, which is not a point/)
  assert.match(run([{...light, mcbA: 1}, power, ac]), /circuit light \(Lights\) carries 335 W, more than 80% of its 1 A breaker \(184 W\)/)
  const load = estimateRoomLoad(model(), plan())
  assert.equal(load.totalW, 100 + 100 + 1700 + 60 + 75 + 1000)
  assert.deepEqual(load.circuits.map(c => [c.id, c.watts, c.limitW]), [['light', 335, 1840], ['power', 1000, 2944], ['ac', 1700, 3680]])
  assert.equal(CIRCUIT_LOADING_MAX, .8)
})

test('every room with a plan has a model, passes, and is well formed', () => {
  assert.deepEqual(roomElectricalKeys(), ['lobby', 'bedroom1', 'bedroom3', 'study', 'office', 'entry'])
  assert.deepEqual(Object.keys(ROOM_ELECTRICAL_PAGES), roomElectricalKeys())
  assert.ok(!hasRoomElectrical('drawing') && !hasRoomElectrical('kitchen'), 'the Drawing Room and the Kitchen keep their own plans')
  assert.throws(() => roomElectricalModel('drawing'), /No electrical plan/)
  const ids = new Set(DRAWING_ELECTRICAL.points.map(p => p.id))
  for (const key of roomElectricalKeys()) {
    const {check, plan, points, model} = roomElectricalReport(key)
    assert.deepEqual(check.issues, [], key)
    assert.ok(plan.room && plan.status && plan.safety && plan.verify.length >= 3, `${key} names its room, status, safety basis and what to verify`)
    for (const p of points) {
      // The Home Office desk points keep the labels its own page draws (E1, N1...), which the Drawing Room also uses.
      if (p.drawnBy !== 'page') { assert.ok(!ids.has(p.id), `${p.id} is used in one room only`); ids.add(p.id) }
      assert.ok(p.name && p.kind && ((p.outlets && p.use) || p.fitting), `${p.id} says what it is, what to fit and why`)
      assert.ok(['power', 'charging', 'lighting', 'data', 'dedicated'].includes(p.kind), `${p.id}: kind ${p.kind}`)
      assert.ok(!/not placed|unknown wall/.test(p.where), `${p.id}: ${p.where}`)
      if (p.drawnBy !== 'page' && p.wall !== 'cabinet') assert.ok(roomPointPosition(model, p, {wallFaceMm: 40}), `${p.id} can be drawn`)
    }
    for (const c of check.load.circuits) assert.ok(c.mcbA > 0 && c.watts > 0 && c.watts <= c.limitW, `${key} ${c.id}: ${c.watts} of ${c.limitW} W`)
  }
})

test('docs/ELECTRICAL_PLAN.md lists every point of every plan, with its place, the circuits and the load totals', () => {
  const doc = readFileSync(fileURLToPath(new URL('../../docs/ELECTRICAL_PLAN.md', import.meta.url)), 'utf8').replace(/\r\n/g, '\n')
  assert.match(doc, /not a wiring design/i)
  for (const key of roomElectricalKeys()) {
    const {points, check, plan} = roomElectricalReport(key)
    for (const p of points) assert.ok(doc.includes(`| ${p.id} | ${p.name} | ${p.where} |`), `${key}: the doc row of ${p.id} is out of date (expected "| ${p.id} | ${p.name} | ${p.where} |")`)
    for (const c of check.load.circuits) assert.ok(doc.includes(`| ${c.id} | ${c.name} | ${c.mcbA} A | ${c.points.join(', ')} | ${c.watts} W |`), `${key}: the doc row of circuit ${c.id} is out of date`)
    assert.ok(doc.includes(`about ${check.load.totalW} W`), `${key}: total load ${check.load.totalW} W is in the doc`)
    for (const line of plan.verify) assert.ok(doc.includes(line), `${key}: "${line.slice(0, 50)}..." is in the doc's verify list`)
  }
})
