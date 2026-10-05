import test from 'node:test'
import assert from 'node:assert/strict'
import {EMPTY_ROOM_SHELLS} from '../src/config/roomShellConfig.js'
import {LOBBY_LIGHTING} from '../src/config/lobbyLightingConfig.js'
import {AC_PLAN} from '../src/config/acPlanConfig.js'
import {checkLobbyIroningStorage, ironingStorageTopMm} from '../src/domain/lobbyIroningStorage.mjs'
import {estimateTask} from '../src/home/workPlanEstimate.mjs'

const room = EMPTY_ROOM_SHELLS.lobby, s = room.furniture.eastIroningStorage

test('2026-10-06 owner ceiling extension preserves the entire lower-unit configuration', () => {
  assert.deepEqual([s.fromNorthMm, s.lengthMm, s.depthMm, s.heightMm, s.doorCount, s.centerBayWidthMm, s.boardLengthMm, s.boardWidthMm], [650, 1450, 400, 1000, 3, 600, 950, 300])
  assert.equal(ironingStorageTopMm(room), 2670)
  assert.equal(checkLobbyIroningStorage(room, LOBBY_LIGHTING).upperHeightMm, 1670)
  assert.equal(AC_PLAN.spaces.find(s => s.id === 'lobby').tall[0].topMm, 2670)
  assert.match(estimateTask('carp-lobby-ironing').estimateBasis, /upper storage 1450 x 1670/)
})

test('tall unit clears east opening, L2, its head envelopes and probable fan; open gap avoids corner ring', () => {
  const r = checkLobbyIroningStorage(room, LOBBY_LIGHTING)
  assert.equal(r.eastOpeningClearanceMm, 77)
  assert.equal(r.trackClearanceMm, 482)
  assert.deepEqual(r.heads.map(h => h.clearanceMm), [333, 333])
  assert.equal(r.fans[0].clearanceMm, 1388)
  const east = r.mouldings.find(m => m.name === 'east border moulding'), corner = r.mouldings.find(m => m.name === 'north-east corner ring')
  assert.equal(east.planGapMm, 50)
  assert.deepEqual([corner.planGapMm, corner.verticalGapMm, corner.meets], [0, 15, false])
  const bad = structuredClone(room); bad.furniture.eastIroningStorage.upper.scribeGapMm = 0
  assert.equal(checkLobbyIroningStorage(bad, LOBBY_LIGHTING).mouldings.find(m => m.name === corner.name).meets, true)
})
