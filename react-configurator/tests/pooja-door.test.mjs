import test from 'node:test'
import assert from 'node:assert/strict'
import {EMPTY_ROOM_SHELLS} from '../src/config/roomShellConfig.js'
import {checkPoojaDoors, checkPoojaDoor, poojaDoorLeaves, poojaLeafBox, poojaDoorObstacles} from '../src/domain/poojaDoor.mjs'
import {poojaPlatformGeometry} from '../src/domain/poojaPlatform.mjs'

const room = EMPTY_ROOM_SHELLS.lobby, p = room.poojaAlcove
const report = checkPoojaDoors(), option = style => report.options.find(o => o.style === style)

test('2026-10-06 owner inward west bi-fold is default; four former choices remain', () => {
  assert.equal(report.defaultStyle, 'bifoldInWest')
  assert.equal(p.door.style, report.defaultStyle)
  assert.deepEqual(Object.keys(p.door.options), ['bifoldEast', 'slideWest', 'fixedEastSlideWest', 'fixedEastSwingIn', 'bifoldInWest'])
  assert.ok(option('slideWest').reasons.includes('Parked leaf meets a dining chair'))
  assert.equal(option('slideWest').clearance.acMm, 90)
  assert.equal(option('fixedEastSlideWest').clearance.cabinetMm, 0, 'former default now conflicts with extended cabinet')
  assert.equal(option('bifoldEast').clearance.cabinetMm, 0, 'former lobby parking is no longer available')
  const closed = poojaDoorLeaves(p, 'bifoldEast', false)
  assert.deepEqual(closed.map(l => [l.x, l.z, l.width, l.direction, l.angle]), [[4918, 95, 525, -1, 0], [4393, 95, 525, -1, -0]])
})

test('west fold shares a middle hinge throughout travel and parks wholly inside, short of shelf and back wall', () => {
  for (let i = 0; i <= 20; i++) {
    const [a, b] = poojaDoorLeaves(p, 'bifoldInWest', i / 20)
    assert.equal(a.width, 485); assert.equal(b.width, 485)
    assert.ok(Math.abs(a.x + a.width * Math.cos(a.angle) - b.x) < 1e-8)
    assert.ok(Math.abs(a.z - a.width * Math.sin(a.angle) - b.z) < 1e-8)
    assert.ok(Math.abs(b.z - b.width * Math.sin(b.angle) - p.door.inwardFaceMm) < 1e-8, 'free end follows doorway line')
  }
  const r = option('bifoldInWest')
  assert.deepEqual(r.foldedStack, {widthMm: 151, depthMm: 509})
  assert.equal(r.parkedLeafRectangle.x1, 3867.5)
  assert.equal(r.parkedLeafRectangle.x2, 4018.5)
  assert.equal(r.parkedLeafRectangle.z1, -537)
  assert.ok(Math.abs(r.parkedLeafRectangle.z2 + 28) < 1e-8)
  assert.equal(r.parksInLobby, false)
  assert.equal(r.clearOpeningMm, 894.5)
  assert.equal(r.straightThroughMm, 522.5, 'aligned passage past cabinet handles and folded stack, before turning on the step')
  assert.equal(r.sweep.centreLineDepthMm, 485)
  assert.equal(r.sweep.singleLeafDepthMm, 970)
  assert.ok(r.sweep.centreLineAreaMm2 > 230900 && r.sweep.centreLineAreaMm2 < 231000)
  assert.ok(r.sweep.centreLineAreaMm2 < r.sweep.singleLeafAreaMm2 / 3)
  assert.ok(r.sweep.clearance.shelf > 40)
  assert.ok(r.sweep.backWallClearanceMm > 450)
  assert.ok(r.sweep.clearance.cabinet > 150)
})

test('occupied position and west electrical access honestly conflict, including after folding', () => {
  const r = option('bifoldInWest')
  assert.equal(r.seatedPersonInSwing, true)
  assert.equal(r.parkedPersonClearanceMm, 0)
  assert.equal(r.seatedShiftEastMm, 125.5)
  assert.deepEqual(r.coveredPoints, ['L-P1'])
  assert.equal(r.verdict, 'conflict')
  const shifted = structuredClone(room); shifted.poojaAlcove.seatedPersonFromWestMm += 150
  const later = checkPoojaDoor(shifted, 'bifoldInWest')
  assert.ok(later.parkedPersonClearanceMm > 0)
  assert.equal(later.seatedPersonInSwing, true, 'even shifted, sit only after folding')
  const bad = structuredClone(room); bad.poojaAlcove.templeDepthMm = 1000
  assert.equal(checkPoojaDoor(bad, 'bifoldInWest').templeShelfInSwing, true)
  bad.poojaAlcove.depthMm = 400
  assert.ok(checkPoojaDoor(bad, 'bifoldInWest').sweep.backWallClearanceMm < 0)
})

test('proposed step and narrower drawer retain the back, gain depth, and clear cabinet through full travel', () => {
  const g = poojaPlatformGeometry(p)
  assert.deepEqual([g.front, g.depthMm, g.top], [150, 1150, 190])
  assert.deepEqual([g.drawer.x1, g.drawer.x2, g.drawer.z1, g.drawer.z2], [3863, 4523, -550, 150])
  assert.equal(g.drawerPull.z2, 881, '700 full travel plus existing 31 handle projection')
  for (const floor of [0, 77.5]) for (const style of Object.keys(p.door.options)) {
    assert.equal(checkPoojaDoor(room, style, undefined, floor).drawerUsable, true)
    for (const open of [false, true]) for (const leaf of poojaDoorLeaves(p, style, open)) {
      assert.equal(poojaLeafBox(p, leaf, floor).bottom - floor - p.platformHeightMm, 20)
    }
  }
  const bad = structuredClone(room); bad.poojaAlcove.drawerWidthMm = 1060
  assert.equal(checkPoojaDoor(bad, 'bifoldInWest').drawerUsable, false, 'retaining nearly full width blocks its east end')
  bad.poojaAlcove.drawerWidthMm = p.drawerWidthMm; bad.poojaAlcove.door.bottomGapMm = 0
  assert.equal(checkPoojaDoor(bad, 'bifoldInWest').drawerUsable, false)
})

test('obstacles are checked without overriding the owner style or mutating inputs', () => {
  const obstacles = poojaDoorObstacles(room), before = JSON.stringify(room)
  obstacles.chairs = []
  assert.equal(checkPoojaDoors(room, obstacles).defaultStyle, 'bifoldInWest')
  obstacles.cabinet = {x1: 3850, x2: 4993, z1: -600, z2: 2100, bottom: 0, top: 2670}
  const blocked = checkPoojaDoor(room, 'bifoldInWest', obstacles)
  assert.equal(blocked.clearance.cabinetMm, 0); assert.equal(blocked.drawerUsable, false)
  assert.ok(blocked.reasons.includes('Inward fold meets the cabinet'))
  assert.equal(JSON.stringify(room), before)
  assert.throws(() => poojaDoorLeaves(p, 'unknown'), /Unknown/)
})
