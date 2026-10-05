import test from 'node:test'
import assert from 'node:assert/strict'
import {EMPTY_ROOM_SHELLS} from '../src/config/roomShellConfig.js'
import {LOBBY_LIGHTING} from '../src/config/lobbyLightingConfig.js'
import {AC_PLAN} from '../src/config/acPlanConfig.js'
import {checkLobbyIroningStorage, ironingStorageTopMm, ironingStorageBays} from '../src/domain/lobbyIroningStorage.mjs'
import {estimateTask} from '../src/home/workPlanEstimate.mjs'

const room = EMPTY_ROOM_SHELLS.lobby, s = room.furniture.eastIroningStorage

test('2026-10-06 proposal adds a north bay while preserving original bays and board position', () => {
  assert.deepEqual([s.fromNorthMm, s.lengthMm, s.depthMm, s.heightMm, s.doorCount, s.centerBayWidthMm, s.boardLengthMm, s.boardWidthMm], [200, 1900, 400, 1000, 4, 600, 950, 300])
  const bays = ironingStorageBays(room)
  assert.deepEqual(bays.map(b => [b.from, b.width, b.ironing]), [[200, 450, false], [650, 425, false], [1075, 600, true], [1675, 425, false]])
  assert.equal(bays.find(b => b.ironing).center, 1375)
  assert.equal(ironingStorageTopMm(room), 2670)
  assert.equal(checkLobbyIroningStorage(room, LOBBY_LIGHTING).upperHeightMm, 1670)
  assert.deepEqual(AC_PLAN.spaces.find(s => s.id === 'lobby').tall[0], {label: 'ironing storage', x1: 4593, x2: 4993, z1: 200, z2: 2100, topMm: 2670})
  assert.match(estimateTask('carp-lobby-ironing').estimateBasis, /upper storage 1900 x 1670/)
  assert.match(estimateTask('carp-pooja').estimateBasis, /platform 1200 x 1150, drawer 660 x 700/)
})

test('tall unit clears east opening, L2, its head envelopes and probable fan; open gap avoids corner ring', () => {
  const r = checkLobbyIroningStorage(room, LOBBY_LIGHTING)
  assert.equal(r.eastOpeningClearanceMm, 77)
  assert.equal(r.trackClearanceMm, 482)
  assert.deepEqual(r.heads.map(h => h.clearanceMm), [333, 333])
  assert.equal(r.fans[0].clearanceMm, 1388)
  assert.equal(r.domes[0].clearanceMm, 603, 'conservative rosette radius, actual dome not measured')
  assert.equal(r.platformGapMm, s.platformGapMm)
  assert.equal(r.drawerCabinetClearanceMm, 18, 'includes existing lower handles')
  assert.equal(r.straightApproachMm, 800)
  assert.equal(r.approachPastHandlesMm, 748)
  const east = r.mouldings.find(m => m.name === 'east border moulding'), corner = r.mouldings.find(m => m.name === 'north-east corner ring')
  assert.equal(east.planGapMm, 50)
  assert.deepEqual([corner.planGapMm, corner.verticalGapMm, corner.meets], [0, 15, false])
  const bad = structuredClone(room); bad.furniture.eastIroningStorage.upper.scribeGapMm = 0
  assert.equal(checkLobbyIroningStorage(bad, LOBBY_LIGHTING).mouldings.find(m => m.name === corner.name).meets, true)
})
