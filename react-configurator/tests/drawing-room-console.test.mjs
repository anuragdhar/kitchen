import test from 'node:test'
import assert from 'node:assert/strict'
import {checkCornerConsole, checkCornerProjector, fullHeightEastUnit, armPose, pictureOffAxis, projectorPlacement, consoleGeometry} from '../src/domain/drawingRoomLayout.mjs'
import {buildRoomReview} from '../src/domain/roomReview.mjs'
import {EMPTY_ROOM_SHELLS} from '../src/config/roomShellConfig.js'

const room = EMPTY_ROOM_SHELLS.drawing
const clone = () => structuredClone(room)

test('the 18-inch low console fits east of the coffee table with a walkway of at least 800 mm', () => {
  const r = checkCornerConsole(room)
  assert.deepEqual(r.issues, [])
  assert.ok(r.lane >= 800)
  assert.equal(room.cornerLayout.console.depthMm, 457)
})

test('both the 55-inch now and the 65-inch later fit the same solid stretch of wall', () => {
  const r = checkCornerConsole(room)
  for (const key of ['55', '65']) {
    const [z1, z2] = r.tvs[key].zRange
    assert.ok(z1 >= 300 && z2 <= room.wallOpenings.east.fromMm - 30, `${key}-inch fits`)
  }
  assert.equal(room.cornerLayout.console.installedTv, '55')
})

test('a floor-to-ceiling 18-inch unit is rejected: no walkway beside the north sofa and no room for a TV bay', () => {
  const fh = fullHeightEastUnit(room)
  assert.equal(fh.fits, false)
  assert.ok(fh.laneBesideNorthSofa < 800, `walkway ${fh.laneBesideNorthSofa}`)
  assert.ok(fh.lengthClearOfNorthSofa < fh.bayNeeded['55'], 'the wall clear of the sofa is shorter than the smallest TV bay')
  assert.ok(fh.deepestUnitForAWalkableLane < 250, 'only a very shallow unit would leave a walkable lane')
})

test('the wall arm improves the north-sofa PICTURE angle but barely the head turn, and worsens the west sofa picture', () => {
  const r = checkCornerConsole(room), p = r.poses['55']
  const headGain = p.parked.headTurn.northSofa.angleDeg - p.watch.headTurn.northSofa.angleDeg
  assert.ok(headGain >= 0 && headGain <= 3, `head turn changes by only ${headGain} degrees`)
  assert.ok(p.watch.pictureOffAxis.northSofa < p.parked.pictureOffAxis.northSofa)
  assert.ok(p.watch.pictureOffAxis.westSofa > p.parked.pictureOffAxis.westSofa)
  assert.ok(p.parked.headTurn.northSofa.angleDeg > 60, 'the north sofa is still side-on')
})

test('the arm blocks the walkway at full reach, so it must be folded away when walking through', () => {
  const p = checkCornerConsole(room).poses['55']
  assert.ok(p.watch.laneToTable >= 700)
  assert.ok(p.fullReachLaneToTable < 700)
})

test('arm geometry: turning north brings the SOUTH end of the screen forward', () => {
  const flat = armPose(room, '55', 0, 0), turned = armPose(room, '55', 0, 20)
  assert.ok(turned.frontX < flat.frontX)
  assert.ok(pictureOffAxis(flat, {x: 1155, z: 500}) > pictureOffAxis(turned, {x: 1155, z: 500}))
})

test('the console checker catches a console too close to the sofa, too deep, or with an oversized TV', () => {
  const near = clone(); near.cornerLayout.console.fromNorthMm = 900
  assert.ok(checkCornerConsole(near).issues.some(m => /north sofa/.test(m)))
  const deep = clone(); deep.cornerLayout.console.depthMm = 600
  assert.ok(checkCornerConsole(deep).issues.some(m => /18 inches|walkway/.test(m)))
  const huge = clone(); huge.cornerLayout.console.tvs['65'].widthMm = 1900
  assert.ok(checkCornerConsole(huge).issues.some(m => /solid wall stops/.test(m)))
})

test('the ceiling projector option fits: an 80-inch 16:9 screen, projector over open floor, hung above head height', () => {
  const r = checkCornerProjector(room)
  assert.deepEqual(r.issues, [])
  assert.equal(projectorPlacement(room).over, 'open floor')
  assert.ok(room.cornerLayout.projector.screenDiagonalInches === 80)
  const big = clone(); big.cornerLayout.projector.widthMm = 2037; big.cornerLayout.projector.heightMm = 1146; big.cornerLayout.projector.screenDiagonalInches = 92
  assert.ok(checkCornerProjector(big).issues.some(m => /spare either side/.test(m)), 'a 92-inch screen is too wide for the wall')
})

test('console geometry sits on the solid east wall south of the north sofa', () => {
  const g = consoleGeometry(room)
  assert.ok(g.z1 >= 940 + 20 && g.z2 <= room.wallOpenings.east.fromMm)
  assert.equal(g.face - g.frontX, 457)
})

test('review briefs describe each corner option and state the full-height rejection', () => {
  const date = new Date('2026-09-30T00:00:00Z')
  const b2 = buildRoomReview({roomKey: 'drawing', room, layoutKey: 'cornerConsole', date})
  assert.match(b2.title, /B2/)
  assert.match(b2.text, /does NOT fit/)
  assert.match(b2.text, /full-motion wall arm/)
  assert.match(b2.text, /hardly changes how far the north-sofa viewer/)
  const b3 = buildRoomReview({roomKey: 'drawing', room, layoutKey: 'cornerProjector', date})
  assert.match(b3.title, /B3/)
  assert.match(b3.text, /Ceiling projector/)
  assert.match(b3.text, /Drop-down screen/)
  assert.ok(b3.planItems.some(i => /Projector/.test(i.label)))
})
