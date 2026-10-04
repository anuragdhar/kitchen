import test from 'node:test'
import assert from 'node:assert/strict'
import {EXISTING_ELECTRICAL} from '../src/config/existingElectricalConfig.js'
import {EMPTY_ROOM_SHELLS} from '../src/config/roomShellConfig.js'
import {checkExistingElectrical, describeExistingElectrical, existingPointPlacement, existingPointsFor, hasExistingElectrical, plannedBlockers, toRoomFrame} from '../src/domain/existingElectrical.mjs'
import {buildRoomReview} from '../src/domain/roomReview.mjs'

const drawing = EMPTY_ROOM_SHELLS.drawing, lobby = EMPTY_ROOM_SHELLS.lobby
const messages = (roomKey, room, layoutKey) => checkExistingElectrical(roomKey, room, {layoutKey}).conflicts.map(c => c.message)

test('every room with existing points is a real room, every point is well formed and sourced', () => {
  for (const [roomKey, entry] of Object.entries(EXISTING_ELECTRICAL)) {
    const room = EMPTY_ROOM_SHELLS[roomKey]
    assert.ok(room, `${roomKey} is a room key in EMPTY_ROOM_SHELLS`)
    assert.ok(entry.points.length, `${roomKey} has points`)
    assert.equal(typeof entry.measured.xOffsetMm, 'number', `${roomKey} says how its x was measured`)
    const ids = new Set()
    for (const p of entry.points) {
      assert.ok(!ids.has(p.id), `${p.id} is listed twice`); ids.add(p.id)
      assert.equal(p.source, 'phone scan 2026-10-04', `${p.id} names its source`)
      assert.ok(p.kind && p.name, `${p.id} has a kind and a name`)
      const q = toRoomFrame(entry, p)
      if (p.wall === 'ceiling') {
        assert.ok(q.xMm > 0 && q.xMm < room.widthMm && q.zMm > 0 && q.zMm < room.lengthMm && q.diameterMm > 0, `${p.id} is on the ceiling inside the room`)
      } else {
        assert.ok(['north', 'south', 'east', 'west'].includes(p.wall), `${p.id} names a wall`)
        assert.ok(q.toMm > q.fromMm && q.topMm > q.bottomMm, `${p.id} has a positive size`)
        const length = p.wall === 'north' || p.wall === 'south' ? room.widthMm : room.lengthMm
        assert.ok(q.fromMm >= 0 && q.toMm <= length && q.bottomMm >= 0 && q.topMm <= room.heightMm, `${p.id} stays on its wall (${q.fromMm}-${q.toMm} of ${length})`)
      }
    }
  }
  assert.ok(hasExistingElectrical('drawing') && hasExistingElectrical('lobby') && !hasExistingElectrical('bedroom1'))
  assert.deepEqual(existingPointsFor('kitchenShell'), [])
})

test('the lobby x figures are converted from the beam face to the room frame once, z is not touched', () => {
  const entry = EXISTING_ELECTRICAL.lobby
  assert.equal(entry.measured.xOffsetMm, 40)
  const board = existingPointsFor('lobby').find(p => p.id === 'X-L1')
  assert.equal(board.fromMm, 375); assert.equal(board.toMm, 575)
  assert.equal(board.measuredFromMm, 415); assert.equal(board.measuredToMm, 615)
  assert.equal(board.bottomMm, 1215)
  const fan = existingPointsFor('lobby').find(p => p.id === 'X-L4')
  assert.equal(fan.xMm, 2605); assert.equal(fan.measuredXmm, 2645); assert.equal(fan.zMm, 1600)
  // The Drawing Room has no offset: the switchboard stays where the scan put it.
  const sb = existingPointsFor('drawing').find(p => p.id === 'X-D1')
  assert.equal(sb.fromMm, 1710); assert.equal(sb.toMm, 1905)
})

test('plates land on the right wall at the right height, ceiling points on the ceiling', () => {
  const at = (roomKey, room, id) => existingPointPlacement(room, existingPointsFor(roomKey).find(p => p.id === id), {wallFaceMm: 0})
  assert.deepEqual(at('drawing', drawing, 'X-D1'), {x: 1807.5, y: 1365, z: 0, widthMm: 195, heightMm: 260, depthAxis: 'z'})
  assert.deepEqual(at('drawing', drawing, 'X-D2'), {x: drawing.widthMm, y: 1592.5, z: 730, widthMm: 350, heightMm: 185, depthAxis: 'x'})
  assert.deepEqual(at('drawing', drawing, 'X-D5'), {x: 0, y: 317.5, z: 4275, widthMm: 450, heightMm: 115, depthAxis: 'x'})
  assert.deepEqual(at('lobby', lobby, 'X-L3'), {x: 2735, y: 2260, z: lobby.lengthMm, widthMm: 1150, heightMm: 60, depthAxis: 'z'})
  assert.deepEqual(at('lobby', lobby, 'X-L4'), {x: 2605, y: lobby.heightMm, z: 1600, widthMm: 810, heightMm: 810, depthAxis: 'y'})
  const faced = existingPointPlacement(drawing, existingPointsFor('drawing').find(p => p.id === 'X-D2'), {wallFaceMm: 40})
  assert.equal(faced.x, drawing.widthMm - 40)
})

test('the Lobby switchboard is reported inside the planned Bedroom 1 door', () => {
  const found = messages('lobby', lobby)
  assert.equal(found.length, 1, found.join('\n'))
  assert.match(found[0], /Switchboard X-L1 \(north wall, x 375-575, 1215-1495 mm high\) is inside the planned door to Bedroom 1 on the north wall \(x 100-1000\)/)
  assert.match(found[0], /moved before that opening is made/)
})

test('Drawing Room layout C: the switchboard is behind the panelling and the TV, the east boards behind the open door leaf, the south-west sockets behind the west sofa', () => {
  const found = messages('drawing', drawing, 'southSofas'), text = found.join('\n')
  const about = id => found.filter(m => m.includes(`${id} (`))
  assert.equal(about('X-D1').length, 1, text)
  assert.match(about('X-D1')[0], /covered by the planned fluted wall panelling \(x 40-2100, 0-1825 mm high\), 55-inch TV \(x 800-2030, 795-1505 mm high\) and 65-inch TV/)
  assert.match(about('X-D1')[0], /main switchboard E1 on the east wall/)
  assert.equal(about('X-D2').length, 1, text); assert.match(about('X-D2')[0], /partly behind the entry door leaf when the door stands open \(the leaf covers the first 850 mm of the east wall\): it can be reached only with the door closed/)
  assert.equal(about('X-D3').length, 1, text); assert.match(about('X-D3')[0], /^Door chime X-D3 .* is behind the entry door leaf .* harmless/)
  assert.equal(about('X-D5').length, 1, text); assert.match(about('X-D5')[0], /partly covered by the planned west sofa \(z 2095-4345, 0-950 mm high\): anything plugged in there cannot be reached without moving the sofa/)
  assert.equal(about('X-D4').length, 0, 'the north-west socket plate is clear in layout C')
  assert.equal(about('X-D6').length, 0, 'the wall light is clear')
  assert.equal(found.length, 4, text)
})

test('the Drawing Room conflicts follow the layout', () => {
  const b = messages('drawing', drawing, 'cornerSofas').join('\n')
  assert.match(b, /Socket plate X-D4 .* covered by the planned west sofa/, 'layout B puts the west sofa over the north-west socket plate')
  assert.doesNotMatch(b, /Three socket plates X-D5/, 'and leaves the south-west sockets clear')
  assert.doesNotMatch(b, /fluted wall panelling/)
  const a = messages('drawing', drawing, 'northTv').join('\n')
  assert.match(a, /Switchboard X-D1 .* covered by the planned TV cabinet \(x 0-2100, 0-2400 mm high\)/)
  assert.ok(plannedBlockers('drawing', drawing, 'cornerConsole').some(b => b.name === 'low console' && b.wall === 'east'))
})

test('a synthetic point in a window, in an open side or in the hidden cabinet door is caught; a clear one is not', () => {
  const custom = points => ({drawing: {measured: {xOffsetMm: 0}, points}})
  const one = (patch) => checkExistingElectrical('drawing', drawing, {config: custom([{id: 'T', name: 'Test socket', kind: 'socket', source: 's', ...patch}])}).conflicts.map(c => c.message).join(' | ')
  assert.match(one({wall: 'south', fromMm: 1500, toMm: 1600, bottomMm: 1200, topMm: 1300}), /inside the planned window on the south wall \(x 233-2933\)/)
  assert.match(one({wall: 'east', fromMm: 2500, toMm: 2600, bottomMm: 300, topMm: 400}), /inside the planned open side on the east wall/)
  assert.match(one({wall: 'north', fromMm: 300, toMm: 400, bottomMm: 1200, topMm: 1300}), /hidden west cabinet door/)
  assert.equal(one({wall: 'east', fromMm: 1500, toMm: 1600, bottomMm: 1200, topMm: 1300}), '', 'solid east wall past the door swing is clear')
  assert.match(one({wall: 'south', fromMm: 1500, toMm: 1600, bottomMm: 300, topMm: 400}), /covered by the planned south sofa/)
  assert.equal(one({wall: 'south', fromMm: 2900, toMm: 3000, bottomMm: 300, topMm: 400}), '', 'below the sill, east of the south sofa is clear')
})

test('the review brief lists the existing points and the conflicts, and skips rooms without a scan', () => {
  const lines = describeExistingElectrical('lobby', lobby)
  assert.match(lines[0], /TODAY, from the phone scan 2026-10-04/)
  assert.match(lines[1], /40 mm has been subtracted/)
  assert.ok(lines.some(l => /^Switchboard X-L1 \(north wall, x 375-575/.test(l)))
  assert.ok(lines.some(l => /^CONFLICT: Switchboard X-L1/.test(l)))
  assert.ok(lines.some(l => /probably a fan\) X-L4 \(ceiling, x 2605, z 1600, about 810 across\)/.test(l)))
  assert.deepEqual(describeExistingElectrical('bedroom1', EMPTY_ROOM_SHELLS.bedroom1), [])
  const date = new Date('2026-10-04T10:00:00Z')
  const review = buildRoomReview({roomKey: 'lobby', room: lobby, date})
  assert.match(review.text, /## Existing electrical points \(site scan\)/)
  assert.match(review.text, /CONFLICT: Switchboard X-L1 .* inside the planned door to Bedroom 1/)
  const c = buildRoomReview({roomKey: 'drawing', room: drawing, layoutKey: 'southSofas', date})
  assert.match(c.text, /Distribution board \(MCBs\) X-D2 \(east wall, z 555-905, 1500-1685 mm high\)/)
  assert.match(c.text, /CONFLICT: Switchboard X-D1 .* fluted wall panelling/)
  assert.doesNotMatch(buildRoomReview({roomKey: 'bedroom1', room: EMPTY_ROOM_SHELLS.bedroom1, date}).text, /Existing electrical points/)
  // Bedroom 3 (phone scan 2026-10-04): a switchboard east of the entry door and a wall light on the west wall; nothing planned lands on them.
  const b3 = EMPTY_ROOM_SHELLS.bedroom3, b3Text = buildRoomReview({roomKey: 'bedroom3', room: b3, date}).text
  assert.match(b3Text, /Switchboard X-B1 \(north wall, x 1385-1550, 1235-1365 mm high\)/)
  assert.match(b3Text, /X-B2 \(west wall, z 1740-2020, 2110-2350 mm high\)/)
  assert.deepEqual(checkExistingElectrical('bedroom3', b3).conflicts, [])
  assert.ok(plannedBlockers('bedroom3', b3).some(b => b.name === 'west chest' && b.wall === 'west'))
})
