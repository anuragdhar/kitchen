import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import {EMPTY_ROOM_SHELLS} from '../src/config/roomShellConfig.js'
import {STUDY_ROOM} from '../src/config/studyRoomConfig.js'
import {STUDY_LIGHTING} from '../src/config/studyLightingConfig.js'
import {BEDROOM1_LAYOUT_KEYS} from '../src/config/bedroom1LayoutConfig.js'
import {bedroom1Plan} from '../src/domain/bedroom1Layout.mjs'
import {createBedroom1Bed} from '../src/rooms/bedroom1/Bedroom1Layouts.js'
import {createBedroom3Bed} from '../src/rooms/bedroom3/Bedroom3Bed.js'
import {createStudyFurniture} from '../src/rooms/study/StudyFurniture.js'
import {itemDimensions} from '../src/render/dimensionPick.js'

// The made beds of rooms/shared/furniture/Bed.js (furniture quality pass, 2026-10-06) measured as built, in the room frame
// (millimetres: x east, z south, y up), against the configured footprints and the heights the pure checks rely on.
const mm = v => v * 1000
function parts(bed) {
  bed.updateMatrixWorld(true)
  const out = {}, triangles = {count: 0, meshes: 0}
  bed.traverse(o => {
    if (!o.isMesh) return
    const g = o.geometry, key = o.userData.bedPart
    triangles.count += (g.index ? g.index.count : g.getAttribute('position').count) / 3; triangles.meshes++
    const b = new THREE.Box3().setFromObject(o)
    out[key] = out[key] ? out[key].union(b) : b
  })
  return {box: key => { const b = out[key]; assert.ok(b, `no ${key}`); return {x1: mm(b.min.x), x2: mm(b.max.x), y1: mm(b.min.y), y2: mm(b.max.y), z1: mm(b.min.z), z2: mm(b.max.z)} }, has: key => !!out[key], triangles}
}
const near = (actual, expected, label, tol = 1) => assert.ok(Math.abs(actual - expected) <= tol, `${label}: ${actual.toFixed(1)} vs ${expected} (within ${tol} mm)`)
const samePlan = (box, rect, label) => { near(box.x1, rect.x1, `${label} west`); near(box.x2, rect.x2, `${label} east`); near(box.z1, rect.z1, `${label} north`); near(box.z2, rect.z2, `${label} south`) }
const overhang = (box, rect) => Math.max(rect.x1 - box.x1, box.x2 - rect.x2, rect.z1 - box.z1, box.z2 - rect.z2)
const apart = (a, b) => a.x2 <= b.x1 || b.x2 <= a.x1 || a.z2 <= b.z1 || b.z2 <= a.z1
const BUDGET = {triangles: 9000, meshes: 12} // per bed; see the owner note for the figures

test('Bedroom 1: each layout\'s bed stands on its configured footprint with the heights the checks use', () => {
  const room = EMPTY_ROOM_SHELLS.bedroom1
  for (const key of BEDROOM1_LAYOUT_KEYS) {
    const plan = bedroom1Plan(room, key), bed = plan.bed, built = parts(createBedroom1Bed(room, key))
    samePlan(built.box('base'), bed, `${key} base`)
    near(built.box('base').y2, bed.baseMm, `${key} base top`)
    near(built.box('mattress').y2, bed.mattressTopMm, `${key} mattress top`)
    near(built.box('headboard').y2, bed.headboardTopMm, `${key} headboard top`)
    samePlan(built.box('headboard'), bed.head, `${key} headboard`)
    assert.ok(built.box('pillow').y2 <= bed.pillowTopMm, `${key} pillows stay under pillowTopMm`)
    for (const soft of ['duvet', 'throw']) assert.ok(overhang(built.box(soft), bed) <= 40, `${key} ${soft} overhangs the base by at most 40 mm`)
    if (plan.bedsideTable) for (const soft of ['duvet', 'throw']) assert.ok(apart(built.box(soft), plan.bedsideTable), `${key} ${soft} clear of the bedside table`)
    assert.ok(built.triangles.count <= BUDGET.triangles && built.triangles.meshes <= BUDGET.meshes, `${key}: ${built.triangles.count} triangles in ${built.triangles.meshes} meshes`)
  }
})

test('Whole home 3D draws the Bedroom 1 bed of layout A, and click-for-dimensions reports the footprint', () => {
  const room = EMPTY_ROOM_SHELLS.bedroom1, bed = createBedroom1Bed(room)
  samePlan(parts(bed).box('base'), bedroom1Plan(room, 'present').bed, 'default bed')
  assert.equal(bed.userData.dimensionItem, 'Bedroom 1 bed')
  const size = itemDimensions(bed) // rounded to 5 mm; the duvet and throw overhang is left out (userData.noMeasure)
  assert.deepEqual([size.widthMm, size.depthMm, size.heightMm], [1830, 1525, 1170])
})

test('Bedroom 3: the square bed keeps its footprint, heights and the 48.5 mm to the bedside cabinets', () => {
  const room = EMPTY_ROOM_SHELLS.bedroom3, f = room.furniture.bed, built = parts(createBedroom3Bed(room))
  const rect = {x1: room.widthMm - f.lengthMm, x2: room.widthMm, z1: f.centerFromNorthMm - f.widthMm / 2, z2: f.centerFromNorthMm + f.widthMm / 2}
  samePlan(built.box('base'), rect, 'base')
  near(built.box('mattress').y2, 440, 'mattress top'); near(built.box('headboard').y2, 1170, 'headboard top')
  samePlan(built.box('headboard'), {...rect, x1: room.widthMm - 85}, 'headboard')
  const cab = room.furniture.eastCabinet, cabinets = ['north', 'south'].map(k => ({x1: room.widthMm - (cab[k].depthMm ?? cab.depthMm), x2: room.widthMm, z1: cab[k].fromNorthMm, z2: cab[k].fromNorthMm + cab[k].widthMm}))
  assert.deepEqual(cabinets.map(c => c.z2 <= rect.z1 ? rect.z1 - c.z2 : c.z1 - rect.z2), [48.5, 48.5], 'the cabinets stand 48.5 mm from the bed')
  for (const soft of ['duvet', 'throw', 'pillow']) {
    assert.ok(overhang(built.box(soft), rect) <= 40, `${soft} overhangs by at most 40 mm`)
    for (const c of cabinets) assert.ok(apart(built.box(soft), c), `${soft} clear of the bedside cabinet at z ${c.z1}-${c.z2}`)
  }
  assert.ok(built.triangles.count <= BUDGET.triangles && built.triangles.meshes <= BUDGET.meshes, `${built.triangles.count} triangles`)
})

test('Study (Bedroom 2): the kids bed and the day seat keep the footprint the reading lights aim at', () => {
  const W = STUDY_ROOM.dimensions.widthMm, target = STUDY_LIGHTING.downTargets.find(t => t.label === 'bed')
  const {nightBeds, daySeats} = createStudyFurniture(STUDY_ROOM)
  for (const [group, depth] of [[nightBeds, 900], [daySeats, 550]]) {
    const built = parts(group), rect = {x1: W - 55 - depth, x2: W - 55, z1: 1050, z2: 3050}
    samePlan(built.box('base'), rect, `${depth} base`)
    near(built.box('base').y1, 40, `${depth} legs lift the box`); near(built.box('leg').y1, 0, `${depth} legs on the floor`)
    near(built.box('mattress').y2, 490, `${depth} mattress top`); near(built.box('backboard').y2, 690, `${depth} back board top`)
    assert.ok(built.box('mattress').z1 >= target.z1 && built.box('mattress').z2 <= target.z2 && built.box('mattress').x2 <= target.x2, 'inside the reading-light target')
    assert.ok(overhang(built.box('duvet'), {...rect, x2: W}) <= 40, `${depth} duvet overhang`)
    assert.ok(built.box('duvet').x2 <= built.box('backboard').x1, `${depth} duvet stays in front of the back board`)
    assert.ok(built.triangles.count <= BUDGET.triangles && built.triangles.meshes <= BUDGET.meshes, `${depth}: ${built.triangles.count} triangles`)
  }
})

test('bed materials: wood tags kept for the palette, fabric maps in linear colour space, decor kept out of the archviz export', () => {
  const beds = [createBedroom1Bed(EMPTY_ROOM_SHELLS.bedroom1), createBedroom3Bed(EMPTY_ROOM_SHELLS.bedroom3), createStudyFurniture(STUDY_ROOM).nightBeds]
  for (const bed of beds) {
    const seen = new Set()
    bed.traverse(o => {
      if (!o.isMesh) return
      const part = o.userData.bedPart, material = o.material
      seen.add(part)
      if (['base', 'headboard', 'backboard'].includes(part)) assert.equal(material.userData.interiorRole, 'wood', `${part} is tagged wood`)
      if (['mattress', 'duvet', 'pillow', 'throw'].includes(part)) {
        assert.ok(material.isMeshPhysicalMaterial && material.sheen > 0, `${part} is a sheen fabric`)
        assert.equal(material.normalMap.colorSpace, THREE.NoColorSpace)
      }
      if (['duvet', 'throw'].includes(part)) assert.ok(o.userData.noMeasure, `${part} is not measured`)
      let decor = false; for (let n = o; n; n = n.parent) decor ||= !!n.userData.archvizExclude
      assert.equal(decor, ['throw', 'cushion'].includes(part), `${part}: archvizExclude only on decor`)
    })
    for (const part of ['base', 'mattress', 'piping', 'duvet', 'throw']) assert.ok(seen.has(part), `${bed.name || 'bed'} has a ${part}`)
  }
})
