import * as THREE from 'three'
import {slatStripGeometry, slatLeafSwing} from '../../domain/tvWallSlatStrip.mjs'
import {grainAlong, grainScaleOf, merged, woodMaterial} from '../shared/furniture/hardForms.js'

// The second treatment of the layout C TV wall (room.southLayout.slatStrip, owner idea 2026-10-06): a floor-to-ceiling strip of
// round-fronted timber slats over the hidden west cabinet door, on a dark-painted wall. Every position comes from
// slatStripGeometry() (src/domain/tvWallSlatStrip.mjs); nothing is measured here. Room frame: millimetres in the config, metres
// in the scene; x from the west wall, z from the north wall line, y up. `wallFaceMm` is the drawn inside face of the wall.
// Each slat is a closed part-cylinder (the round front; its flat sector lies behind the wall face), and all slats of one piece
// are merged into one mesh: the fixed strip is one mesh of 14 slats, the leaf one of 10. Grain runs vertically (u along y).

let slatMaterialCache = null
const slatMaterial = color => {
  // One material per page and colour (the veneer maps are shared and loaded once).
  if (!slatMaterialCache || slatMaterialCache.color !== color) slatMaterialCache = {color, material: woodMaterial(color, {roughness: .52, clearcoat: .12})}
  return slatMaterialCache.material
}

/** Slat geometries (metres) for the given slats and height range; `zFace` is the face they stand on (mm, in the target frame). */
function slatGeometries(g, slats, rows, xOffset, zFace, material) {
  const {radiusMm: R, halfAngleRad: a} = g.profile, list = []
  for (const {y1, y2} of rows) for (const slat of slats) {
    const geometry = new THREE.CylinderGeometry(R / 1000, R / 1000, (y2 - y1) / 1000, 10, 1, false, -a, 2 * a)
    geometry.translate(((slat.x1 + slat.x2) / 2 - xOffset) / 1000, (y1 + y2) / 2000, (zFace + g.depthMm - R) / 1000)
    list.push(grainAlong(geometry, [0, 1, 0], grainScaleOf(material)))
  }
  return list
}

const darkPaint = color => new THREE.MeshStandardMaterial({color, roughness: .9})

/**
 * The fixed part: the slats beside the door (full height, broken only by the head reveal) and over it (above the reveal), and
 * the dark paint on the wall behind them. The door opening is left to the leaf (createSlatStripLeaf).
 */
export function createSlatStripFixed(room, {wallFaceMm = 0} = {}) {
  const s = room.southLayout.slatStrip, g = slatStripGeometry(room)
  const group = new THREE.Group(); group.name = 'TV wall slat strip (owner idea 2026-10-06)'
  const material = slatMaterial(s.color), fixed = g.slats.filter(slat => !slat.onLeaf), leafSlats = g.slats.filter(slat => slat.onLeaf)
  const slats = new THREE.Mesh(merged([
    ...slatGeometries(g, fixed, [g.rows.lower, g.rows.upper], 0, wallFaceMm, material),
    ...slatGeometries(g, leafSlats, [g.rows.upper], 0, wallFaceMm, material), // above the door: fixed slats on the same lines
  ]), material)
  slats.name = 'fixed slats'; slats.castShadow = true; slats.receiveShadow = true; group.add(slats)
  // Dark paint behind the slats: the band less the door opening (the leaf has its own dark face).
  const paint = darkPaint(s.backingColor), z = (wallFaceMm + .6) / 1000
  const rect = (x1, x2, y1, y2) => {
    if (x2 <= x1 || y2 <= y1) return
    const mesh = new THREE.Mesh(new THREE.BoxGeometry((x2 - x1) / 1000, (y2 - y1) / 1000, .001), paint)
    mesh.position.set((x1 + x2) / 2000, (y1 + y2) / 2000, z); mesh.receiveShadow = true; group.add(mesh)
  }
  rect(g.band.x1, g.door.x1, 0, room.heightMm)
  rect(g.door.x2, g.band.x2, 0, room.heightMm)
  rect(g.door.x1, g.door.x2, g.door.headMm, room.heightMm)
  // The joints round the leaf show the door frame, not the closet: a dark stop behind the leaf on both jambs and the head
  // (room.wallStorage.stopMm wide; the leaf opens outward, away from it), and the jamb faces in front of it painted dark.
  const ws = room.wallStorage, T = ws.leafThicknessMm ?? 40, stop = ws.stopMm ?? 10, back = wallFaceMm - T
  const block = (x1, x2, y1, y2, z1, z2) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry((x2 - x1) / 1000, (y2 - y1) / 1000, (z2 - z1) / 1000), paint)
    mesh.position.set((x1 + x2) / 2000, (y1 + y2) / 2000, (z1 + z2) / 2000); mesh.receiveShadow = true; group.add(mesh)
  }
  block(g.door.x1, g.door.x1 + stop, 0, g.door.headMm, back - 12, back)
  block(g.door.x2 - stop, g.door.x2, 0, g.door.headMm, back - 12, back)
  block(g.door.x1, g.door.x2, g.door.headMm - stop, g.door.headMm, back - 12, back)
  block(g.door.x1, g.door.x1 + 1, 0, g.door.headMm, back, wallFaceMm)
  block(g.door.x2 - 1, g.door.x2, 0, g.door.headMm, back, wallFaceMm)
  block(g.door.x1, g.door.x2, g.door.headMm - 1, g.door.headMm, back, wallFaceMm)
  return group
}

/**
 * The slatted door leaf, hung on its pivot: a group at the pivot axis (the front face of the slats on the hinge edge, as
 * checked by slatLeafSwing) holding the dark leaf body and its ten slats. Turn it with rotation.y = -angle to open outward.
 * `openDeg` is the angle to draw it open: 95 degrees, or less if the check finds it would touch something sooner.
 */
export function createSlatStripLeaf(room, {wallFaceMm = 0} = {}) {
  const s = room.southLayout.slatStrip, g = slatStripGeometry(room), ws = room.wallStorage, T = ws.leafThicknessMm ?? 40
  const material = slatMaterial(s.color)
  const pivot = new THREE.Group(); pivot.name = 'hidden door leaf with slats'
  const pivotZ = s.pivot.axis === 'slat front' ? wallFaceMm + g.depthMm : wallFaceMm
  pivot.position.set(g.leaf.x1 / 1000, 0, pivotZ / 1000)
  // In the pivot's frame x runs along the leaf from its hinge edge and z is out from the pivot plane.
  const body = new THREE.Mesh(new THREE.BoxGeometry((g.leaf.x2 - g.leaf.x1) / 1000, (g.leaf.topMm - g.leaf.bottomMm) / 1000, T / 1000), darkPaint(s.backingColor))
  body.position.set((g.leaf.x2 - g.leaf.x1) / 2000, (g.leaf.topMm + g.leaf.bottomMm) / 2000, (wallFaceMm - pivotZ - T / 2) / 1000)
  body.castShadow = true; body.receiveShadow = true; pivot.add(body)
  const slats = new THREE.Mesh(merged(slatGeometries(g, g.slats.filter(slat => slat.onLeaf), [{y1: g.leaf.bottomMm, y2: g.leaf.topMm}], g.leaf.x1, wallFaceMm - pivotZ, material)), material)
  slats.name = 'leaf slats'; slats.castShadow = true; slats.receiveShadow = true; pivot.add(slats)
  const touches = slatLeafSwing(room).touchesAtDeg
  return {pivot, openDeg: touches == null ? 95 : Math.min(95, touches - 1)}
}
