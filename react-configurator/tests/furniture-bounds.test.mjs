import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import {EMPTY_ROOM_SHELLS} from '../src/config/roomShellConfig.js'
import {createDiningSet} from '../src/rooms/shared/furniture/tables.js'
import {createDrawingRoomSeating, createDrawingRoomCornerSeating, createDrawingRoomSouthSeating} from '../src/rooms/drawing/DrawingRoomSeating.js'
import {createBedroom1Layouts} from '../src/rooms/bedroom1/Bedroom1Layouts.js'
import {bedroom1Plan} from '../src/domain/bedroom1Layout.mjs'
import {BEDROOM1_LAYOUT_KEYS} from '../src/config/bedroom1LayoutConfig.js'
import {createFloorLamp, createLaundryHamper, createPottedPlant} from '../src/rooms/shared/furniture/decor.js'

// The procedural furniture (rooms/shared/furniture, 2026-10-06) is drawn inside exactly the boxes the pure checks use:
// walkways, the AC draft on the dining seats, charging reach, the pendant over the table and the balcony clearances all
// read these sizes from config, so the drawn piece must not grow or move. Boxes are vertex-exact (Box3 precise), in metres,
// in the room frame (x east from the west wall, z south from the north wall).

const TOL = .001 // 1 mm
const boxOf = object => { object.updateWorldMatrix(true, true); return new THREE.Box3().setFromObject(object, true) }
const named = (root, name) => { const found = []; root.traverse(o => { if (o.name === name) found.push(o) }); return found }
function assertBox(box, {x, y, z}, label) {
  for (const [axis, range] of Object.entries({x, y, z})) {
    if (!range) continue
    assert.ok(Math.abs(box.min[axis] - range[0]) <= TOL && Math.abs(box.max[axis] - range[1]) <= TOL,
      `${label}: ${axis} ${box.min[axis].toFixed(4)}..${box.max[axis].toFixed(4)}, expected ${range[0].toFixed(4)}..${range[1].toFixed(4)}`)
  }
}
const triangles = object => { let n = 0; object.traverse(o => { if (o.isMesh) n += (o.geometry.index ? o.geometry.index.count : o.geometry.getAttribute('position').count) / 3 }); return n }

test('the dining table is the configured 700 x 1200 x 745 at its configured centre, long side north-south', () => {
  const f = EMPTY_ROOM_SHELLS.lobby.furniture, t = f.diningTable, set = createDiningSet(f)
  const [table] = named(set, 'Dining table')
  assertBox(boxOf(table), {
    x: [(t.centerXmm - t.widthMm / 2) / 1000, (t.centerXmm + t.widthMm / 2) / 1000],
    y: [0, t.heightMm / 1000],
    z: [(t.centerZmm - t.lengthMm / 2) / 1000, (t.centerZmm + t.lengthMm / 2) / 1000],
  }, 'dining table')
})

test('the four dining chairs stand on the configured spots, 440 x 440 (acPlanConfig DINING_CHAIR_MM), clear of the table', () => {
  const f = EMPTY_ROOM_SHELLS.lobby.furniture, t = f.diningTable, set = createDiningSet(f)
  const chairs = named(set, 'Dining chair'), half = .22
  assert.equal(chairs.length, 4)
  const expected = [-1, 1].flatMap(side => f.chairRowsZmm.map(z => [(t.centerXmm + side * f.chairOffsetXmm) / 1000, z / 1000]))
  for (const [x, z] of expected) {
    const chair = chairs.find(c => Math.abs(c.position.x - x) < 1e-9 && Math.abs(c.position.z - z) < 1e-9)
    assert.ok(chair, `a chair at ${x}, ${z}`)
    const box = boxOf(chair)
    assertBox(box, {x: [x - half, x + half], z: [z - half, z + half], y: [0, .86]}, `chair at ${x}, ${z}`)
    // It faces the table and does not reach into the table's footprint.
    const tableX1 = (t.centerXmm - t.widthMm / 2) / 1000, tableX2 = (t.centerXmm + t.widthMm / 2) / 1000
    assert.ok(box.max.x <= tableX1 || box.min.x >= tableX2, 'outside the table top in plan')
  }
  // One chair geometry for all four.
  const geometries = new Set(chairs.flatMap(c => c.children.map(m => m.geometry)))
  assert.equal(geometries.size, 3)
  assert.ok(triangles(chairs[0]) < 3000, `a chair has ${triangles(chairs[0])} triangles`)
})

test('the coffee tables of every Drawing Room layout keep their configured footprint and the drawn 457.5 mm height', () => {
  const room = EMPTY_ROOM_SHELLS.drawing
  const cases = [
    [createDrawingRoomSeating(room), room.furniture.coffeeTable],
    [createDrawingRoomCornerSeating(room), room.cornerLayout.furniture.coffeeTable],
    [createDrawingRoomSouthSeating(room), room.southLayout.furniture.coffeeTable],
  ]
  for (const [seating, t] of cases) {
    const [table] = named(seating, 'Coffee table')
    assertBox(boxOf(table), {
      x: [(t.centerXmm - t.widthMm / 2) / 1000, (t.centerXmm + t.widthMm / 2) / 1000],
      y: [0, .4575],
      z: [(t.centerZmm - t.lengthMm / 2) / 1000, (t.centerZmm + t.lengthMm / 2) / 1000],
    }, `coffee table ${t.widthMm} x ${t.lengthMm}`)
  }
})

test('the corner lamp table of layout C is the configured 400 across and 550 high, at its centre', () => {
  const room = EMPTY_ROOM_SHELLS.drawing, ct = room.southLayout.furniture.cornerTable
  const [table] = named(createDrawingRoomSouthSeating(room), 'Lamp table')
  const r = ct.diameterMm / 2000
  assertBox(boxOf(table), {x: [ct.centerXmm / 1000 - r, ct.centerXmm / 1000 + r], y: [0, ct.heightMm / 1000], z: [ct.centerZmm / 1000 - r, ct.centerZmm / 1000 + r]}, 'corner table')
})

test('Bedroom 1: balcony table, balcony chair and dressing stool fill exactly the plan rectangles the checks use', () => {
  const room = EMPTY_ROOM_SHELLS.bedroom1, layouts = createBedroom1Layouts(room)
  for (const key of BEDROOM1_LAYOUT_KEYS) {
    layouts.setLayout(key)
    const plan = bedroom1Plan(room, key), visible = o => { for (let n = o; n; n = n.parent) if (!n.visible) return false; return true }
    const pick = name => named(layouts.furniture, name).filter(visible)
    const rect = (r, top) => ({x: [r.x1 / 1000, r.x2 / 1000], y: [0, top / 1000], z: [r.z1 / 1000, r.z2 / 1000]})
    assertBox(boxOf(pick('Balcony table')[0]), rect(plan.balcony.table, plan.balcony.table.heightMm), `${key} balcony table`)
    assertBox(boxOf(pick('Balcony chair')[0]), rect(plan.balcony.chair, plan.balcony.chair.heightMm), `${key} balcony chair`)
    if (plan.dressingTable) assertBox(boxOf(pick('Dressing stool')[0]), rect(plan.dressingTable.stool, plan.dressingTable.stool.heightMm), `${key} dressing stool`)
    if (plan.loose.plant) {
      const p = plan.loose.plant, [plant] = pick('decor plant'), box = boxOf(plant)
      assert.ok(Math.abs(box.max.y - p.heightMm / 1000) <= TOL && box.min.y >= -TOL, `${key} plant height`)
      assert.ok(box.max.x - box.min.x <= (p.x2 - p.x1) / 1000 + TOL && box.max.z - box.min.z <= (p.z2 - p.z1) / 1000 + TOL, `${key} plant spread`)
    }
  }
})

test('decor keeps its earlier size: floor lamp 400 x 1580, hamper 400 x 490; decor is kept out of the Blender renders', () => {
  const lamp = boxOf(createFloorLamp()), hamper = boxOf(createLaundryHamper())
  assert.ok(Math.abs(lamp.max.y - 1.58) <= TOL && Math.abs(lamp.max.x - lamp.min.x - .4) <= .002, `lamp ${lamp.max.y}`)
  assert.ok(Math.abs(hamper.max.y - .49) <= TOL && hamper.max.x - hamper.min.x <= .4 + TOL && hamper.max.z - hamper.min.z <= .4 + TOL, 'hamper')
  assert.equal(createFloorLamp().userData.archvizExclude, true)
  assert.equal(createPottedPlant(1).userData.archvizExclude, true)
  assert.notEqual(createLaundryHamper().userData.archvizExclude, true, 'the hamper is a real fixture and stays in the renders')
})
