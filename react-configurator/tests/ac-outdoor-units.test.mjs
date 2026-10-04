import test from 'node:test'
import assert from 'node:assert/strict'
import {AC_OUTDOOR_UNITS, AC_OUTDOOR_UNIT_SIZES, AC_OUTDOOR_CLEARANCE} from '../src/config/acOutdoorUnitsConfig.js'
import {checkOutdoorUnits, outdoorUnitPlacement, planToRoomMm, compassVector} from '../src/domain/acOutdoorUnits.mjs'
import {ENTRY} from '../src/config/entryConfig.js'
import {EMPTY_ROOM_SHELLS} from '../src/config/roomShellConfig.js'
import {HOME_ROOM_LAYOUTS} from '../src/config/homeRoomViews.js'

const scale = ENTRY.planScale, bounds = key => HOME_ROOM_LAYOUTS.find(r => r.key === key).bounds
const unit = id => AC_OUTDOOR_UNITS.find(u => u.id === id)

test('four outdoor units stand at the owner\'s plan marks of 2026-10-05, at a typical 1.5 ton casing size', () => {
  const result = checkOutdoorUnits(AC_OUTDOOR_UNITS, AC_OUTDOOR_UNIT_SIZES, scale)
  assert.deepEqual(result.issues, [])
  assert.deepEqual(AC_OUTDOOR_UNITS.map(u => [u.id, u.tons, u.status, u.longAxis, u.fanFaces]), [
    ['bedroom3', 1.5, 'existing', 'north-south', 'east'], ['study', 1.5, 'existing', 'north-south', 'west'], ['bedroom1', 1.5, 'proposal', 'east-west', 'north'], ['drawing', 1.5, 'proposal', 'north-south', 'west']])
  assert.deepEqual(AC_OUTDOOR_UNITS.map(u => [u.mark.x1, u.mark.y1, u.mark.x2, u.mark.y2]), [[45, 144, 64, 187], [494, 274, 513, 319], [238, 701, 265, 715], [686, 454, 708, 506]])
  assert.deepEqual(AC_OUTDOOR_UNIT_SIZES[1.5], {widthMm: 800, heightMm: 550, depthMm: 300, weightKg: 35})
  // Only Bedroom 3's tonnage was given; the other two are drawn at the same size and say so.
  assert.equal(result.notes.filter(n => /tonnage not given/.test(n)).length, 3)
  // The Bedroom 1 mark (about 518 x 281 mm) is shorter than the casing, and the note says by how much.
  assert.match(result.notes.join(' | '), /Bedroom 1: the marked area is 519 x 281 mm; a 1.5 ton casing is 800 x 300, so it runs 281 mm past the mark/)
  assert.ok(result.placed.every(p => p.movedFromMarkMm <= 250), JSON.stringify(result.placed.map(p => p.movedFromMarkMm)))
})

test('the Bedroom 3 unit stands inside the east end of its balcony, fan toward the open east side', () => {
  const room = EMPTY_ROOM_SHELLS.bedroom3, u = unit('bedroom3'), p = outdoorUnitPlacement(u, AC_OUTDOOR_UNIT_SIZES, scale)
  const b = bounds('bedroom3'), balcony = room.southExtension.balcony
  const sw = planToRoomMm(b, room.widthMm, room.lengthMm, p.casing.x2, p.casing.y2), ne = planToRoomMm(b, room.widthMm, room.lengthMm, p.casing.x1, p.casing.y1)
  assert.ok(sw.x >= balcony.fromWestMm && ne.x <= room.widthMm, `casing x ${Math.round(sw.x)}-${Math.round(ne.x)} of ${room.widthMm}`)
  assert.ok(sw.z >= room.lengthMm && ne.z <= room.lengthMm + balcony.depthMm, `casing z ${Math.round(sw.z)}-${Math.round(ne.z)}; balcony ${room.lengthMm}-${room.lengthMm + balcony.depthMm}`)
  assert.ok(room.widthMm - ne.x < 100, 'the fan face is at the east edge')
  assert.equal(u.roomPage, 'bedroom3')
  assert.deepEqual(compassVector('east', 'room'), {x: 1, z: -0})
  assert.deepEqual(compassVector('north', 'plan'), {x: 0, z: 1})
})

test('the Home Office and kitchen-wall units hang outside their walls with air behind the coil', () => {
  const office = outdoorUnitPlacement(unit('study'), AC_OUTDOOR_UNIT_SIZES, scale), officeWest = bounds('balcony')[2]
  assert.ok((office.casing.x1 - officeWest) * scale.xMetresPerPixel * 1000 >= AC_OUTDOOR_CLEARANCE.rearMm, 'coil clear of the Home Office west wall')
  const b1 = outdoorUnitPlacement(unit('bedroom1'), AC_OUTDOOR_UNIT_SIZES, scale), kitchen = bounds('kitchen'), balconyEast = bounds('bedroom1-balcony')[0]
  assert.ok((b1.casing.y1 - kitchen[3]) * scale.zMetresPerPixel * 1000 >= AC_OUTDOOR_CLEARANCE.rearMm, 'coil clear of the kitchen north wall')
  assert.ok(b1.casing.x2 < balconyEast, 'east of the Bedroom 1 balcony glazing')
  // West of the kitchen north window (612-1712 mm from the west wall), so it is not under the window.
  const windowWestPlanX = kitchen[2] - 612 / 2324 * (kitchen[2] - kitchen[0])
  assert.ok(b1.casing.x1 > windowWestPlanX, 'not under the kitchen window')
  // Drawing Room: outside the west wall at its south end, about 2 m of wall from the planned indoor unit (west wall, centre 2420 from the north).
  const d = outdoorUnitPlacement(unit('drawing'), AC_OUTDOOR_UNIT_SIZES, scale), drawing = bounds('drawing'), room = EMPTY_ROOM_SHELLS.drawing
  assert.ok((d.casing.x1 - drawing[2]) * scale.xMetresPerPixel * 1000 >= AC_OUTDOOR_CLEARANCE.rearMm, 'coil clear of the Drawing Room west wall')
  const along = planToRoomMm(drawing, room.widthMm, room.lengthMm, unit('drawing').centre.planX, unit('drawing').centre.planY)
  assert.ok(along.z > 4200 && along.z < 5200 && along.x < 0, `centre ${Math.round(along.x)}, ${Math.round(along.z)} in the Drawing Room frame`)
  assert.match(checkOutdoorUnits([{...unit('bedroom1'), fanFaces: 'east'}], AC_OUTDOOR_UNIT_SIZES, scale).issues.join(' '), /cannot blow east/)
  assert.match(checkOutdoorUnits([unit('bedroom3'), {...unit('study'), centre: unit('bedroom3').centre}], AC_OUTDOOR_UNIT_SIZES, scale).issues.join(' '), /overlap/)
})
