import * as THREE from 'three'
import {tagSurfaceMaterial} from '../../../render/surfaceRoles.mjs'
import {markItem} from '../../../render/dimensionPick.js'
import {createDuvet, createThrow, creasedNormals, fabricMaterial, mergeGeometries, metricUV, pillowGeometry, roundedRectLoop, softSlab, tubeAlong} from './bedding.js'

// A made bed, built procedurally (furniture quality pass, 2026-10-06; docs/changes/2026-10-06-furniture-beds.md): a timber
// base standing on a recessed dark plinth (a shadow gap) or on short legs, a mattress with rounded corners and piped edges, a
// duvet that falls over the sides and foot in soft folds and is turned back under the pillows, crowned pillows, a folded knit
// throw at the foot and, if asked, accent cushions leaning on the pillows. Shared by Bedroom 1 (both layouts, and Whole home
// 3D), Bedroom 3 and the Study (Bedroom 2) kids bed.
//
// FRAME: the bed's own frame, metres: origin at the centre of the footprint on the floor, length along x with the HEAD at +x,
// width along z (the "left" side is -z, "right" +z), y up. The caller positions and turns the group.
// WHAT IS EXACT: the base's plan outline is the footprint (lengthMm x widthMm), the mattress top is base top + mattress, the
// headboard (inside the footprint at the head, as before) reaches headboard.topMm. Everything the caller does not pass is a
// finishing detail of a few centimetres chosen by eye (plinth recess, mattress inset, fall of the duvet, pillow size).
// Duvet, throw and hems overhang the base by at most about 30 mm; they carry userData.noMeasure so click-for-dimensions
// (render/dimensionPick.js) still reports the bed's footprint. Throw and cushions are decor: userData.archvizExclude.
const m = v => v / 1000

/**
 * Materials for one or more beds of one room. colours: {frame, headboard, mattress, duvet, pillow, throw, cushions: [hex...],
 * plinth}. Frame and headboard are tagged 'wood' (for the palette preview and the whole-home finish) with `roomId`, as before.
 */
export function createBedMaterials(colours, {roomId} = {}) {
  const wood = (color, roughness) => { const material = new THREE.MeshStandardMaterial({color, roughness}); tagSurfaceMaterial(material, 'wood', roomId); return material }
  const piping = new THREE.Color(colours.mattress).multiplyScalar(.86)
  return {
    frame: wood(colours.frame, .68),
    headboard: wood(colours.headboard, .74),
    plinth: new THREE.MeshStandardMaterial({color: colours.plinth || '#2b2724', roughness: .8}),
    // Weave tiles of 45-60 mm (32 threads each): visible as a soft texture close up, averaged away by mip-mapping at a distance.
    mattress: fabricMaterial(colours.mattress, {tileMetres: .045, normalScale: .35, sheen: .35}),
    piping: fabricMaterial(`#${piping.getHexString()}`, {tileMetres: .03, normalScale: .3, sheen: .3}),
    duvet: fabricMaterial(colours.duvet, {tileMetres: .06, normalScale: .3, sheen: .55, vertexColors: true}),
    pillow: fabricMaterial(colours.pillow, {tileMetres: .05, normalScale: .28, sheen: .45, vertexColors: true}),
    throw: colours.throw ? fabricMaterial(colours.throw, {pattern: 'knit', tileMetres: .07, normalScale: .7, sheen: .7, vertexColors: true}) : null,
    cushions: (colours.cushions || []).map(color => fabricMaterial(color, {tileMetres: .04, normalScale: .45, sheen: .7, vertexColors: true})),
  }
}

/**
 * spec (millimetres): {
 *   name, lengthMm, widthMm,
 *   base: {topMm, bottomMm = 0, plinthMm = 70, recessMm = 50} or with legs: {topMm, bottomMm (leg height), legs: true},
 *   mattressMm,                                     thickness; top = base.topMm + mattressMm
 *   headboard: {thicknessMm, topMm, bottomMm} | null      inside the footprint at +x
 *   backboard: {zMm (centre, bed frame), thicknessMm, bottomMm, topMm} | null   a board along the +z side (day bed)
 *   pillows: 1 | 2, duvet: {sideDropMm: {left, right}, footDropMm, turnBack = true},
 *   throw: {fromFootMm, lengthMm, dropMm: {left, right}} | null, cushions: number (needs materials.cushions),
 *   backCushions: number (leaning on the backboard; day seat), seed }
 */
export function createMadeBed(spec, materials) {
  const group = markItem(new THREE.Group(), spec.name); group.name = spec.name // a click anywhere on it reports the whole bed
  const add = (geometry, material, part, extra = {}) => {
    const mesh = new THREE.Mesh(geometry, material); mesh.name = `${spec.name}: ${part}`
    mesh.castShadow = true; mesh.receiveShadow = true; mesh.userData.bedPart = part; Object.assign(mesh.userData, extra)
    group.add(mesh); return mesh
  }
  const L = m(spec.lengthMm), W = m(spec.widthMm), X0 = -L / 2, X1 = L / 2, Z0 = -W / 2, Z1 = W / 2
  const b = spec.base, baseTop = m(b.topMm), baseBottom = m(b.bottomMm || 0)

  // ---- base: timber box on a recessed plinth (shadow gap) or on legs ------------------------------------------------------
  if (b.legs) {
    add(softSlab({x0: X0, x1: X1, z0: Z0, z1: Z1, y0: baseBottom, y1: baseTop, corner: .012, edge: .006, cornerSegments: 2, edgeSegments: 2}), materials.frame, 'base')
    const leg = .045, inset = .06, legGeometry = metricUV(new THREE.BoxGeometry(leg, baseBottom, leg)), legs = []
    for (const x of [X0 + inset, X1 - inset]) for (const z of [Z0 + inset, Z1 - inset]) legs.push([legGeometry, new THREE.Matrix4().makeTranslation(x, baseBottom / 2, z)])
    add(mergeGeometries(legs), materials.frame, 'leg')
  } else {
    const plinth = m(b.plinthMm ?? 70), recess = m(b.recessMm ?? 50)
    add(metricUV(new THREE.BoxGeometry(L - 2 * recess, plinth, W - 2 * recess)), materials.plinth, 'plinth').position.set(0, baseBottom + plinth / 2, 0)
    add(softSlab({x0: X0, x1: X1, z0: Z0, z1: Z1, y0: baseBottom + plinth, y1: baseTop, corner: .012, edge: .006, cornerSegments: 2, edgeSegments: 2}), materials.frame, 'base')
  }

  // ---- headboard (timber: a back slab and a framed front panel) and the day bed's backboard -------------------------------
  const hb = spec.headboard
  let headFace = X1
  if (hb) {
    const t = m(hb.thicknessMm), top = m(hb.topMm), bottom = m(hb.bottomMm ?? b.topMm), panel = Math.min(.018, t * .25)
    headFace = X1 - t
    // A back slab and, in front of it, a panel inset 60 mm at the sides and top and proud of the slab by `panel`.
    add(mergeGeometries([headboardSlab(X1 - t + panel, X1, Z0, Z1, bottom, top, .035), headboardSlab(X1 - t, X1 - t + panel + .002, Z0 + .06, Z1 - .06, bottom, top - .06, .02)]), materials.headboard, 'headboard')
  }
  let mattressZ1 = Z1 - .02
  const bb = spec.backboard
  if (bb) {
    const zc = m(bb.zMm), t = m(bb.thicknessMm)
    add(softSlab({x0: X0, x1: X1, z0: zc - t / 2, z1: zc + t / 2, y0: m(bb.bottomMm), y1: m(bb.topMm), corner: .006, edge: .006, cornerSegments: 2, edgeSegments: 2}), materials.frame, 'backboard')
    mattressZ1 = Math.min(mattressZ1, zc - t / 2 - .008)
  }

  // ---- mattress with piping ---------------------------------------------------------------------------------------------
  const thickness = m(spec.mattressMm), top = baseTop + thickness, edge = Math.min(.022, thickness * .16), corner = .05
  const mattress = {x0: X0 + .02, x1: headFace - (hb ? .01 : .02), z0: Z0 + .02, z1: mattressZ1, top, edge}
  add(softSlab({...mattress, y0: baseTop, y1: top, corner, edge, cornerSegments: 5, edgeSegments: 3}), materials.mattress, 'mattress')
  const k = edge * (1 - Math.SQRT1_2), pipe = .0042
  add(mergeGeometries([top - k, baseTop + k].map(y => tubeAlong(roundedRectLoop(mattress.x0 + k, mattress.x1 - k, mattress.z0 + k, mattress.z1 - k, y, corner - k, 4), pipe, {closed: true, radial: 5}))), materials.piping, 'piping')

  // ---- pillows (one mesh) -------------------------------------------------------------------------------------------------
  const pillowCount = spec.pillows ?? 2, mattressWidth = mattress.z1 - mattress.z0, zMid = (mattress.z0 + mattress.z1) / 2
  const pillowWidth = Math.min(.66, pillowCount > 1 ? (mattressWidth - .06) / 2 - .02 : mattressWidth - .12), pillowLength = .42
  const pillowFront = mattress.x1 - pillowLength - .005
  if (pillowCount > 0) {
    const pillows = []
    for (let i = 0; i < pillowCount; i++) {
      const z = pillowCount > 1 ? zMid + (i - (pillowCount - 1) / 2) * (pillowWidth + .025) : zMid
      const place = new THREE.Matrix4().compose(new THREE.Vector3(pillowFront + pillowLength / 2, top, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), (i % 2 ? 1 : -1) * .025), new THREE.Vector3(1, 1, 1))
      pillows.push([pillowGeometry({length: pillowLength, width: pillowWidth, height: .12, seamHeight: .032, seed: (spec.seed || 1) * 5 + i}), place])
    }
    add(mergeGeometries(pillows), materials.pillow, 'pillow')
  }

  // ---- duvet, turned back below the pillows, with its rolled hems (one mesh) ---------------------------------------------
  const d = spec.duvet || {}, drop = {left: m(d.sideDropMm?.left ?? 160), right: m(d.sideDropMm?.right ?? 160)}
  const duvet = createDuvet({mattress, drop, footDrop: m(d.footDropMm ?? 160), foldX: d.turnBack === false ? null : pillowFront - .07, bandMetres: d.bandMm ? m(d.bandMm) : .3, seed: spec.seed || 1, folds: d.folds ?? 1})
  add(mergeGeometries([duvet.geometry, tubeAlong(duvet.hem, .008, {radial: 4}), ...(duvet.bandHem ? [tubeAlong(duvet.bandHem, .011, {radial: 4})] : [])]), materials.duvet, 'duvet', {noMeasure: true})

  // ---- throw and cushions (decor) ---------------------------------------------------------------------------------------
  if (spec.throw && materials.throw) {
    const t = spec.throw, from = mattress.x0 + m(t.fromFootMm ?? 120)
    const piece = createThrow({under: duvet, mattress, xFrom: from, xTo: from + m(t.lengthMm ?? 420), drop: {left: m(t.dropMm?.left ?? 100), right: m(t.dropMm?.right ?? 100)}, lift: .02, seed: (spec.seed || 1) + 2})
    add(mergeGeometries([piece.geometry, tubeAlong(piece.hem, .01, {closed: true, radial: 4})]), materials.throw, 'throw', {noMeasure: true, archvizExclude: true})
  }
  const cushions = Math.min(spec.cushions || 0, materials.cushions.length)
  for (let i = 0; i < cushions; i++) {
    // Leaning back on the pillows at about 48 degrees, turned a little, lower edge on the sheet in front of them.
    const size = .34, lean = .84, holder = new THREE.Group(); holder.name = `${spec.name}: cushion`; holder.userData.archvizExclude = true
    const cushion = new THREE.Mesh(pillowGeometry({length: size, width: size, height: .12, seamHeight: .04, pinch: .08, dent: 0, seed: 11 + i}), materials.cushions[i])
    cushion.castShadow = cushion.receiveShadow = true; cushion.userData.bedPart = 'cushion'
    cushion.rotation.z = lean; cushion.position.set(size / 2 * Math.cos(lean) - .02, size / 2 * Math.sin(lean) + .004, 0)
    holder.add(cushion)
    const z = zMid + (i - (cushions - 1) / 2) * Math.min(.62, mattressWidth * .4)
    holder.position.set(pillowFront - .06, top, z); holder.rotation.y = (i % 2 ? -1 : 1) * .12
    group.add(holder)
  }
  // Day seat: cushions standing against the backboard along the length.
  for (let i = 0; i < (spec.backCushions || 0); i++) {
    const size = .4, holder = new THREE.Group(); holder.name = `${spec.name}: back cushion`; holder.userData.archvizExclude = true
    const cushion = new THREE.Mesh(pillowGeometry({length: size, width: size, height: .13, seamHeight: .04, pinch: .08, dent: 0, seed: 21 + i}), materials.cushions[i % materials.cushions.length] || materials.pillow)
    cushion.castShadow = cushion.receiveShadow = true; cushion.userData.bedPart = 'cushion'
    // Stood up against the +z board, leaning back about 15 degrees from upright.
    cushion.rotation.x = -(Math.PI / 2 - .26); cushion.position.set(0, size / 2 * Math.cos(.26) + .01, -.02)
    holder.add(cushion)
    const span = mattress.x1 - mattress.x0, x = mattress.x0 + span * (i + .5) / spec.backCushions
    holder.position.set(x, top, mattress.z1 - .09); group.add(holder)
  }
  return group
}

/** Geometry of a headboard slab between x0 and x1 (thickness), z0..z1, y0..y1, top corners rounded `radius`, edges eased 5 mm. */
function headboardSlab(x0, x1, z0, z1, y0, y1, radius) {
  const bevel = .005, hz = (z1 - z0) / 2 - bevel, h = y1 - y0 - 2 * bevel, r = Math.min(radius, hz, h)
  const s = new THREE.Shape()
  s.moveTo(-hz, 0); s.lineTo(hz, 0); s.lineTo(hz, h - r); s.absarc(hz - r, h - r, r, 0, Math.PI / 2); s.lineTo(-hz + r, h); s.absarc(-hz + r, h - r, r, Math.PI / 2, Math.PI); s.lineTo(-hz, 0)
  const geometry = new THREE.ExtrudeGeometry(s, {depth: x1 - x0 - 2 * bevel, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 4})
  geometry.rotateY(Math.PI / 2) // extrusion along x; shape x along -z (symmetric)
  geometry.translate(x0 + bevel, y0 + bevel, (z0 + z1) / 2)
  return metricUV(creasedNormals(geometry))
}
