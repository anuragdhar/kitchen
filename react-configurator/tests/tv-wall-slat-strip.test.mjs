// The layout C TV wall's second treatment: a floor-to-ceiling slat strip over the hidden door (owner idea 2026-10-06, not chosen;
// room.southLayout.slatStrip, src/domain/tvWallSlatStrip.mjs, docs/changes/2026-10-06-slat-strip.md). The full-width
// panelling stays the default, and every default figure and text is unchanged.
import test from 'node:test'
import assert from 'node:assert/strict'
import {EMPTY_ROOM_SHELLS} from '../src/config/roomShellConfig.js'
import {checkSlatStrip, DEFAULT_TV_WALL, slatLeafSwing, slatStripGeometry, TV_WALL_TREATMENTS, tvWallTreatment} from '../src/domain/tvWallSlatStrip.mjs'
import {checkSouthLayout, southTvGeometry} from '../src/domain/drawingRoomLayout.mjs'
import {checkExistingElectrical, plannedBlockers} from '../src/domain/existingElectrical.mjs'
import {buildRoomReview, drawingSlatStripCheck} from '../src/domain/roomReview.mjs'

const room = EMPTY_ROOM_SHELLS.drawing, s = room.southLayout.slatStrip
const withStrip = patch => { const r = structuredClone(room); patch(r.southLayout.slatStrip, r); return r }

test('the slat strip is an owner idea marked as not chosen; full panelling stays the default', () => {
  assert.match(s.status, /owner idea 2026-10-06, not chosen/)
  assert.match(s.colorStatus, /proposal/)
  assert.match(s.restOfWall.status, /proposal/)
  assert.equal(DEFAULT_TV_WALL, 'panel')
  assert.deepEqual(TV_WALL_TREATMENTS.map(t => t.key), ['panel', 'slatStrip'])
  assert.equal(tvWallTreatment(room), 'panel')
  assert.equal(tvWallTreatment(room, 'slatStrip'), 'slatStrip')
  const none = structuredClone(room); delete none.southLayout.slatStrip
  assert.equal(tvWallTreatment(none, 'slatStrip'), 'panel', 'without the config block the panelling is drawn')
  // The default treatment's figures are untouched by the new block.
  assert.deepEqual(room.southLayout.wallPanel, {fromWestMm: 40, toMm: 2100, bottomMm: 0, thicknessMm: 18, grooveMm: 100, grooveWidthMm: 5, color: '#a47a52', grooveColor: '#5b3d27', cap: {heightMm: 25, projectionMm: 45}})
  assert.deepEqual(checkSouthLayout(room).issues, [])
})

test('the strip: 12 round-fronted slats 40 x 14 every 50 mm, x 40-645, floor to ceiling; 10 of them on the door leaf', () => {
  assert.deepEqual([s.fromWestMm, s.slatWidthMm, s.slatDepthMm, s.gapMm, s.fixedSlatsEastOfDoor], [40, 40, 14, 10, 1])
  const g = slatStripGeometry(room)
  assert.equal(g.pitchMm, 50)
  assert.deepEqual(g.band, {x1: 40, x2: 645})
  assert.deepEqual(g.counts, {total: 12, leaf: 10, westOfDoor: 1, eastOfDoor: 1})
  assert.deepEqual(g.slats.map(slat => slat.x1), [55, 105, 155, 205, 255, 305, 355, 405, 455, 505, 555, 605])
  assert.equal(g.cornerGapMm, 15, 'a 15 mm dark shadow gap in the corner')
  assert.deepEqual(g.rows, {lower: {y1: 10, y2: 1797}, reveal: {y1: 1797, y2: 1809}, upper: {y1: 1809, y2: 2700}})
  assert.deepEqual(g.leaf, {x1: 103, x2: 595, bottomMm: 10, topMm: 1797})
  assert.ok(Math.abs(g.profile.radiusMm - 21.29) < .01, 'a circular segment 40 across and 14 deep')
  assert.ok(Math.abs(g.areaM2 - 1.63) < .01)
})

test('both door edges fall in the middle of a 10 mm gap and no slat is cut; the head joint sits in the reveal', () => {
  const r = drawingSlatStripCheck(room)
  assert.deepEqual(r.issues, [])
  assert.deepEqual(r.clearances.edgeGaps, {'west (hinge)': {westSlatEndsMm: 5, eastSlatStartsMm: 5}, 'east (lock)': {westSlatEndsMm: 5, eastSlatStartsMm: 5}})
  const odd = structuredClone(room); odd.wallStorage.widthMm = 530
  assert.match(checkSlatStrip(odd).issues.join(' '), /not a whole number of 50 mm slat pitches/)
  assert.match(checkSlatStrip(withStrip(x => { x.gapMm = 4 })).issues.join(' '), /joint at the door's .* edge is not inside the slat gap|whole number/)
  assert.match(checkSlatStrip(withStrip(x => { x.headReveal.belowHeadMm = 20 })).issues.join(' '), /door head \(1800\) is not inside the reveal/)
})

test('the leaf opens outward past 90 degrees on an offset pivot; an ordinary hinge would hit the fixed corner slat', () => {
  assert.deepEqual(s.pivot.axis, 'slat front')
  const offset = slatLeafSwing(room), ordinary = slatLeafSwing(room, {axis: 'leaf face'})
  assert.equal(offset.touchesAtDeg, 98)
  assert.equal(offset.what, 'the west wall')
  assert.equal(ordinary.touchesAtDeg, 43)
  assert.equal(ordinary.what, 'the fixed slat at x 55-95')
  // The wider lock-side joint lets the leaf's back corner clear the east jamb.
  const tight = withStrip(x => { x.leafJointsMm.lock = 1 })
  assert.equal(slatLeafSwing(tight).what, 'the east jamb')
  assert.match(checkSlatStrip(tight).issues.join(' '), /touches the east jamb/)
})

test('the console drag-out rule still holds; the console and the TV in both sizes stay clear of the strip', () => {
  const r = drawingSlatStripCheck(room), c = r.clearances
  assert.equal(c.leafReachMm, 506)
  assert.equal(c.leafClearOfDraggedConsoleMm, 112, 'the console dragged out 600 mm stands 112 mm clear of the swinging leaf')
  assert.equal(c.consoleOverlapMm, 145, 'the console west end stands in front of x 500-645')
  assert.equal(c.consoleClearMm, 4, 'its back is 4 mm off the slat fronts')
  assert.deepEqual(c.tvs, {55: {xGapMm: 155, zGapMm: 39}, 65: {xGapMm: 45, zGapMm: 39}})
  // The console and TV positions are those of the panelling option (they do not move).
  assert.equal(southTvGeometry(room).console.z1, 58)
  assert.match(checkSlatStrip(withStrip(x => { x.slatDepthMm = 20 })).issues.join(' '), /TV console's back .* keep 3/)
  assert.match(checkSlatStrip(withStrip(x => { x.fixedSlatsEastOfDoor = 2 })).issues.join(' '), /65-inch TV .* from the strip/)
  const short = structuredClone(room); short.southLayout.console.dragOutMm = 500
  assert.match(checkSlatStrip(short).issues.join(' '), /sweeps 506 mm into the room/)
})

test('ceiling mouldings, Track 1, planned points and cable routes against the full-height strip', () => {
  const c = drawingSlatStripCheck(room).clearances
  assert.deepEqual(c.ceiling, {toBorderMm: 296, toCornerRingMm: 256, T1: {xGapMm: 175, zGapMm: 486}})
  assert.equal(c.nearestNorthPointMm, 85, 'N4 (router point, x 730) is 85 mm east of the strip')
  assert.deepEqual(c.routesUnderStrip.map(r => [r.id, r.xFromMm, r.xToMm, r.heightMm]), [['C3', 640, 645, 2700]], 'the Track 2 feed turns onto the ceiling at x 640, 5 mm inside the strip')
})

test('existing electrical: with the strip the old switchboard X-D1 is behind the TV only; the default text is unchanged', () => {
  const xd1 = tvWall => checkExistingElectrical('drawing', room, {layoutKey: 'southSofas', tvWall}).conflicts.find(c => c.id === 'X-D1')
  assert.match(xd1().finding, /covered by the planned fluted wall panelling \(x 40-2100, 0-1825 mm high\), 55-inch TV/)
  assert.match(xd1('panel').message, /main switchboard E1 on the east wall/)
  const strip = xd1('slatStrip')
  assert.match(strip.finding, /would be covered by the planned 55-inch TV \(x 800-2030, 795-1505 mm high\) and 65-inch TV/)
  assert.doesNotMatch(strip.finding, /panelling|slat strip/)
  assert.ok(strip.resolved, 'the planned relocation to E1 still resolves it')
  assert.ok(plannedBlockers('drawing', room, 'southSofas', 'slatStrip').some(b => b.name === 'timber slat strip over the hidden door' && b.a === 40 && b.b === 645 && b.top === 2700))
  assert.ok(!plannedBlockers('drawing', room, 'cornerSofas', 'slatStrip').some(b => /slat|panelling/.test(b.name)), 'other layouts are not affected')
})

test('the review sheet describes the chosen TV wall; the default sheet is unchanged', () => {
  const date = new Date('2026-10-06T10:00:00Z')
  const panel = buildRoomReview({roomKey: 'drawing', room, layoutKey: 'southSofas', date})
  assert.equal(panel.title, 'Drawing Room - Layout C: sofas south + west, TV on the north wall')
  assert.doesNotMatch(panel.text, /slat strip/i)
  assert.match(panel.text, /in front of fluted wall panelling/)
  const strip = buildRoomReview({roomKey: 'drawing', room, layoutKey: 'southSofas', tvWall: 'slatStrip', date})
  assert.equal(strip.title, 'Drawing Room - Layout C: sofas south + west, TV on the north wall, TV wall: slat strip at the hidden door')
  assert.match(strip.text, /floor-to-ceiling strip of 12 round-fronted timber slats over the hidden door only, x 40-645/)
  assert.match(strip.text, /hidden in the slat strip/)
  assert.match(strip.text, /Slat strip 605: x 40-645/)
  assert.match(strip.text, /RESOLVED: Switchboard X-D1 .* 55-inch TV/)
  assert.doesNotMatch(strip.text, /Known problems/)
  assert.equal(buildRoomReview({roomKey: 'drawing', room, layoutKey: 'cornerSofas', tvWall: 'slatStrip', date}).title, 'Drawing Room - Layout B: corner sofas, 65-inch TV flat on the east wall')
})
