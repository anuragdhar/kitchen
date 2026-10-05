import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import {EMPTY_ROOM_SHELLS} from '../src/config/roomShellConfig.js'
import {createDrawingRoomSeating, createDrawingRoomCornerSeating, createDrawingRoomSouthSeating} from '../src/rooms/drawing/DrawingRoomSeating.js'
import {createSofa} from '../src/rooms/shared/furniture/Sofa.js'
import {fabricMaps} from '../src/rooms/shared/furniture/fabric.js'
import {softBoxGeometry} from '../src/rooms/shared/furniture/softForms.js'

// The soft sofa and rug models (2026-10-06) must occupy exactly the boxes the config gives, in every Drawing Room layout:
// the pure layout checks, the electrical plan ("hidden behind the sofa back"), click-for-dimensions and the review sheet
// all assume them. Measured in millimetres in the room frame (x from the west wall, z from the north wall).

const room = EMPTY_ROOM_SHELLS.drawing
const LAYOUTS = [
  {name: 'A (northTv)', build: createDrawingRoomSeating, furniture: room.furniture, sofas: [['sofa', 'east'], ['southSofa', 'north']]},
  {name: 'B, B2, B3 (corner)', build: createDrawingRoomCornerSeating, furniture: room.cornerLayout.furniture, sofas: [['northSofa', 'south'], ['westSofa', 'east']]},
  {name: 'C (southSofas)', build: createDrawingRoomSouthSeating, furniture: room.southLayout.furniture, sofas: [['southSofa', 'north'], ['westSofa', 'east']]},
]
const SOFA_TOP_MM = 968.8 // tallest scatter cushion, as the block model drew it before 2026-10-06
const BACK_TOP_MM = 925 // top of the sofa back ("about 925 mm" in the review sheet and electrical plan)

const boxMm = object => { object.updateWorldMatrix(true, true); const b = new THREE.Box3().setFromObject(object); return {x1: b.min.x * 1000, x2: b.max.x * 1000, y1: b.min.y * 1000, y2: b.max.y * 1000, z1: b.min.z * 1000, z2: b.max.z * 1000} }
const near = (actual, expected, label, tolerance = 1) => assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: ${actual.toFixed(2)} mm, expected ${expected} mm`)
const sofasIn = group => { const out = []; group.traverse(o => { if (o.name === 'Three-seater sofa') out.push(o) }); return out }
const triangles = object => { let n = 0; object.traverse(o => { if (o.isMesh) n += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3 }); return n }

for (const layout of LAYOUTS) {
  test(`layout ${layout.name}: each sofa's built box is its configured footprint and height`, () => {
    const group = layout.build(room, {wallFaceMm: 37}), built = sofasIn(group)
    assert.equal(built.length, layout.sofas.length)
    for (const [key, faces] of layout.sofas) {
      const s = layout.furniture[key], across = faces === 'east' || faces === 'west'
      const sx = across ? s.widthMm : s.lengthMm, sz = across ? s.lengthMm : s.widthMm
      const match = built.find(o => Math.abs(o.position.x * 1000 - s.centerXmm) < 1 && Math.abs(o.position.z * 1000 - s.centerZmm) < 1)
      assert.ok(match, `${key} built at its centre`)
      const b = boxMm(match)
      near(b.x1, s.centerXmm - sx / 2, `${key} west edge`); near(b.x2, s.centerXmm + sx / 2, `${key} east edge`)
      near(b.z1, s.centerZmm - sz / 2, `${key} north edge`); near(b.z2, s.centerZmm + sz / 2, `${key} south edge`)
      near(b.y1, 0, `${key} stands on the floor`); near(b.y2, SOFA_TOP_MM, `${key} overall height`)
      // Without its scatter cushions (decor) the sofa's back tops out at 925 mm.
      const body = match.clone(); body.remove(body.getObjectByName('sofa cushions'))
      near(boxMm(body).y2, BACK_TOP_MM, `${key} back height`)
    }
  })

  test(`layout ${layout.name}: the rug covers its configured area, 15 mm thick, and stays decor`, () => {
    const group = layout.build(room, {wallFaceMm: 37}), rug = group.getObjectByName('rug'), r = layout.furniture.rug
    const b = boxMm(rug)
    near(b.x1, r.centerXmm - r.widthMm / 2, 'rug west'); near(b.x2, r.centerXmm + r.widthMm / 2, 'rug east')
    near(b.z1, r.centerZmm - r.lengthMm / 2, 'rug north'); near(b.z2, r.centerZmm + r.lengthMm / 2, 'rug south')
    near(b.y1, 0, 'rug on the floor'); near(b.y2, 15, 'rug top')
    assert.equal(rug.userData.archvizExclude, true)
  })
}

test('the sofa keeps believable proportions: seat about 445 mm high, back 925 mm, a shadow gap under the base', () => {
  const sofa = createSofa({depthMm: 880, lengthMm: 2250, heightMm: 925, scatterTopMm: SOFA_TOP_MM})
  const part = name => boxMm(sofa.getObjectByName(name))
  const seat = part('sofa seat cushions'), legs = part('sofa legs'), frame = part('sofa frame')
  assert.ok(seat.y2 >= 430 && seat.y2 <= 450, `seat height ${seat.y2.toFixed(0)} mm`)
  near(part('sofa back cushions').y2, 925, 'back cushion top')
  assert.ok(legs.y2 >= 80 && legs.y2 <= 140, `legs ${legs.y2.toFixed(0)} mm tall`)
  near(frame.y1, legs.y2, 'the base starts where the legs end (no floating frame)')
  // Seat depth: from the seat front to the back cushions' front face at seat level.
  const back = sofa.getObjectByName('sofa back cushions').geometry, pos = back.attributes.position
  let backFront = -Infinity
  for (let i = 0; i < pos.count; i++) if (pos.getY(i) < seat.y2 / 1000 + .03) backFront = Math.max(backFront, pos.getX(i))
  const depth = seat.x2 - backFront * 1000
  assert.ok(depth >= 530 && depth <= 600, `seat depth ${depth.toFixed(0)} mm`)
})

test('the scatter cushions are decor, the upholstery is not, and nothing is hidden', () => {
  const sofa = createSofa({depthMm: 880, lengthMm: 2250})
  assert.equal(sofa.getObjectByName('sofa cushions').userData.archvizExclude, true)
  for (const name of ['sofa frame', 'sofa seat cushions', 'sofa back cushions', 'sofa legs']) {
    let excluded = false
    for (let o = sofa.getObjectByName(name); o; o = o.parent) excluded ||= !!o.userData.archvizExclude
    assert.equal(excluded, false, `${name} reaches the Blender export`)
  }
  sofa.traverse(o => assert.notEqual(o.visible, false))
})

test('polygon budget: a sofa is a few thousand triangles and identical sofas share geometry and materials', () => {
  const group = createDrawingRoomSouthSeating(room, {wallFaceMm: 37}), [a, b] = sofasIn(group)
  const count = triangles(a)
  assert.ok(count > 2000 && count < 8000, `${count} triangles`)
  const meshes = o => { const m = []; o.traverse(n => { if (n.isMesh) m.push(n) }); return m }
  meshes(a).forEach((mesh, i) => { assert.equal(mesh.geometry, meshes(b)[i].geometry); assert.equal(mesh.material, meshes(b)[i].material) })
})

test('fabric maps: colour map in sRGB, relief and roughness as linear data, tileable and shared', () => {
  const maps = fabricMaps('woven')
  assert.equal(maps.map.colorSpace, THREE.SRGBColorSpace)
  assert.equal(maps.normalMap.colorSpace, THREE.NoColorSpace)
  assert.equal(maps.roughnessMap.colorSpace, THREE.NoColorSpace)
  assert.equal(maps.map.wrapS, THREE.RepeatWrapping)
  assert.equal(fabricMaps('woven'), maps)
  // Tone map stays near white so the owner's colour is only slightly darkened.
  const data = maps.map.image.data
  let sum = 0; for (let i = 0; i < data.length; i += 4) sum += data[i]
  assert.ok(sum / (data.length / 4) > 225, 'mean tone above 225 of 255')
})

test('softBoxGeometry keeps its outer size and crowns only the faces asked for', () => {
  const g = softBoxGeometry({width: .6, height: .15, depth: .5, radius: .04, crown: {py: .012}})
  g.computeBoundingBox(); const b = g.boundingBox
  near(b.max.x * 1000, 300, 'x'); near(b.min.x * 1000, -300, '-x'); near(b.max.z * 1000, 250, 'z'); near(b.min.y * 1000, -75, 'bottom')
  near(b.max.y * 1000, 87, 'crowned top')
  const n = g.attributes.normal
  for (let i = 0; i < n.count; i++) near(Math.hypot(n.getX(i), n.getY(i), n.getZ(i)) * 1000, 1000, 'unit normal', 1)
})
