import test from 'node:test'
import assert from 'node:assert/strict'
import {EMPTY_ROOM_SHELLS} from '../src/config/roomShellConfig.js'
import {checkPoojaDoors, checkPoojaDoor, poojaDoorLeaves, poojaLeafBox, poojaDoorObstacles} from '../src/domain/poojaDoor.mjs'

const room = EMPTY_ROOM_SHELLS.lobby, p = room.poojaAlcove
const report = checkPoojaDoors(), option = style => report.options.find(o => o.style === style)

test('2026-10-06: half slider is the configured default because the full west slider meets a dining chair', () => {
  assert.equal(report.defaultStyle, 'fixedEastSlideWest')
  assert.equal(p.door.style, report.defaultStyle)
  assert.deepEqual(option('slideWest').reasons, ['Parked leaf meets a dining chair'])
  assert.equal(option('slideWest').clearance.acMm, 90, 'leaf passes BELOW the AC, not through it')
  assert.deepEqual(option('slideWest').coveredPoints, [])
  assert.equal(option('fixedEastSlideWest').verdict, 'clear in model')
  assert.deepEqual(option('fixedEastSlideWest').parkedLeafRectangle, {x1: 4393, x2: 4993, z1: 182.5, z2: 257.5})
  assert.equal(option('fixedEastSlideWest').clearance.cabinetMm, 392.5)
  assert.deepEqual(report.options.map(o => Math.round(o.clearOpeningMm)), [907, 1040, 520, 448])
})

test('old east bi-fold retains its hinges, leaf sizes and angles; L-E2 is covered', () => {
  const closed = poojaDoorLeaves(p, 'bifoldEast', false), open = option('bifoldEast')
  assert.deepEqual(closed.map(l => [l.x, l.z, l.width, l.direction, l.angle]), [[4918, 95, 525, -1, 0], [4393, 95, 525, -1, -0]])
  assert.ok(Math.abs(open.parkedLeafRectangle.z2 - 623.516345) < .001)
  assert.ok(Math.abs(open.clearance.cabinetMm - 26.483655) < .001)
  assert.deepEqual(open.coveredPoints, ['L-E2'])
})

test('all four options leave the platform drawer usable, open and closed, in both page floor frames', () => {
  for (const floor of [0, 77.5]) for (const style of Object.keys(p.door.options)) {
    assert.equal(checkPoojaDoor(room, style, undefined, floor).drawerUsable, true)
    for (const open of [false, true]) for (const leaf of poojaDoorLeaves(p, style, open)) {
      assert.equal(poojaLeafBox(p, leaf, floor).bottom - floor - p.platformHeightMm, 20)
    }
  }
  for (const style of ['slideWest', 'fixedEastSlideWest']) {
    assert.equal(option(style).topHung, true); assert.equal(option(style).floorTrack, false)
  }
  const bad = structuredClone(room); bad.poojaAlcove.door.floorTrack = true
  assert.equal(checkPoojaDoor(bad, 'fixedEastSlideWest').drawerUsable, false)
  bad.poojaAlcove.door.floorTrack = false; bad.poojaAlcove.door.bottomGapMm = 0
  assert.equal(checkPoojaDoor(bad, 'fixedEastSlideWest').drawerUsable, false)
})

test('inward sweep enters the seated body, while the east temple shelf is clear; deeper shelf is detected', () => {
  assert.equal(option('fixedEastSwingIn').seatedPersonInSwing, true)
  assert.equal(option('fixedEastSwingIn').templeShelfInSwing, false)
  const bad = structuredClone(room); bad.poojaAlcove.templeDepthMm = 1000
  assert.equal(checkPoojaDoor(bad, 'fixedEastSwingIn').templeShelfInSwing, true)
})

test('default rule responds to chair, AC, cabinet and electrical obstructions; no inputs are mutated', () => {
  const obstacles = poojaDoorObstacles(room), before = JSON.stringify(room)
  obstacles.chairs = []
  assert.equal(checkPoojaDoors(room, obstacles).defaultStyle, 'slideWest')
  const originalAc = obstacles.ac
  obstacles.ac = {...originalAc, bottom: 2000}
  assert.equal(checkPoojaDoors(room, obstacles).defaultStyle, 'fixedEastSlideWest')
  obstacles.ac = originalAc
  obstacles.points.push({id: 'test-switch', wall: 'north', x: 3000, y: 1200, z: 0})
  assert.deepEqual(checkPoojaDoor(room, 'slideWest', obstacles).coveredPoints, ['test-switch'])
  assert.equal(checkPoojaDoors(room, obstacles).defaultStyle, 'fixedEastSlideWest')
  obstacles.cabinet = {x1: 4500, x2: 4993, z1: 200, z2: 2100, bottom: 0, top: 2670}
  const blocked = checkPoojaDoor(room, 'fixedEastSlideWest', obstacles)
  assert.equal(blocked.clearance.cabinetMm, 0); assert.equal(blocked.drawerUsable, false)
  assert.equal(JSON.stringify(room), before)
  assert.throws(() => poojaDoorLeaves(p, 'unknown'), /Unknown/)
})
