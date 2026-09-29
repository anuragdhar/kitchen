import test from 'node:test'
import assert from 'node:assert/strict'
import {BEDROOM1_CLOSED_DOOR as door, closedDoorSpanMm, closedDoorCavityMm} from '../src/config/bedroom1ClosedDoor.js'
import {HOME_ROOM_LAYOUTS} from '../src/config/homeRoomViews.js'
import {EMPTY_ROOM_SHELLS} from '../src/config/roomShellConfig.js'

const lobbyPlan = HOME_ROOM_LAYOUTS.find(room => room.name === 'Lobby / Dining')
const lobby = EMPTY_ROOM_SHELLS.lobby

test('closed door sits on the Lobby/Bedroom 1 wall, in the plan area the owner marked', () => {
  assert.equal(door.wallPlanY, lobbyPlan.bounds[3], 'wall line is the lobby north edge, shared with Bedroom 1')
  // Owner's plan mark: x 346-400 (door leaf and swing).
  assert.ok(door.planXEast >= 346 && door.planXWest <= 400)
})

test('opening span converts plan px to lobby-local mm and clears every other opening', () => {
  const span = closedDoorSpanMm(door, lobbyPlan.bounds, lobby.widthMm)
  const width = span.end - span.start
  assert.ok(width > 750 && width < 900, `opening ${width} mm should be a normal single-leaf door`)
  const others = [
    ...lobby.doors.filter(d => d.wall === 'north').map(d => [d.fromMm, d.fromMm + d.widthMm]),
    [lobby.poojaAlcove.fromMm, lobby.poojaAlcove.fromMm + lobby.poojaAlcove.widthMm],
  ]
  for (const [start, end] of others) assert.ok(span.end <= start || span.start >= end, 'no overlap with existing openings')
  // The replacement door stays where roomShellConfig puts it.
  assert.equal(lobby.doors.find(d => d.wall === 'north').fromMm, 100)
})

test('cavity depth is what remains after the sheet, and the cabinet must fit it', () => {
  const {cavity, usableShelf} = closedDoorCavityMm(door, 85)
  assert.equal(cavity, 85 - door.sheet.thicknessMm)
  assert.equal(usableShelf, cavity - door.cabinet.doorMm - door.cabinet.backMm)
  assert.throws(() => closedDoorCavityMm(door, 30), /too thin/)
})

test('rejects reversed or out-of-room jambs', () => {
  assert.throws(() => closedDoorSpanMm({...door, planXEast: 390, planXWest: 347}, lobbyPlan.bounds, lobby.widthMm), /reversed/)
  assert.throws(() => closedDoorSpanMm({...door, planXEast: 100, planXWest: 400}, lobbyPlan.bounds, lobby.widthMm), /outside/)
})
