import * as THREE from 'three'
import {markItem} from '../../../render/dimensionPick.js'
import {
  mm, grainUV, grainAlong, easedSlab, ellipseOutline, ellipseRingOutline, roundedRectOutline, easedBox, turned, legBetween, merged,
  GRAIN_ALONG_Z, woodMaterial, grainScaleOf, metalMaterial, solid,
} from './hardForms.js'
import {createDiningChair} from './chairs.js'

// Tables (and the dining set) for the live 3D views, built procedurally (hardForms.js). Every builder takes the sizes from
// config (millimetres, room frame: x east from the west wall, z south from the north wall) and its outer box is exactly that
// size at that centre (tests/furniture-bounds.test.mjs); details inside the box (legs, aprons, edge radii) are design choices.
// Furniture-tables-and-chairs round, 2026-10-06.

/** Pale oak and brass of the dining set (the owner's colours of the earlier room-page table). */
function diningMaterials() {
  return {
    oak: woodMaterial('#a98259', {roughness: .5, tag: true, asset: 'red_oak_veneer'}),
    oakDark: woodMaterial('#8f6a44', {roughness: .48, tag: true, asset: 'red_oak_veneer'}),
    brass: metalMaterial('#b08d57', {roughness: .28, metalness: .85}),
    upholstery: null, // set by the chairs
  }
}

/**
 * Oval pedestal dining table: an eased-edge oak top with its grain along the table, a set-in oval apron, a turned oak column
 * with a brass collar, and an oval foot with a brass ring. Built in its own frame: centre of the floor footprint at the origin,
 * the length along z. `table`: {widthMm (x), lengthMm (z), heightMm}.
 */
export function createDiningTable(table, mat = diningMaterials()) {
  const W = mm(table.widthMm), L = mm(table.lengthMm), H = mm(table.heightMm)
  const group = new THREE.Group(); group.name = 'Dining table'
  markItem(group, `Dining table · oval ${table.lengthMm} x ${table.widthMm}, ${table.heightMm} high`)
  const topT = .032, apronH = .058, apronInset = .085, footT = .036, footL = Math.min(.76, L * .62), footW = Math.min(.56, W * .8)
  // Parts whose grain runs along the table are built with their length on local x and turned by GRAIN_ALONG_Z.
  const top = easedSlab(ellipseOutline(L, W), topT, .011, {curveSegments: 40, bevelSegments: 3})
  top.translate(0, H - topT, 0); grainUV(top, grainScaleOf(mat.oak))
  const apron = easedSlab(ellipseRingOutline(L - 2 * apronInset, W - 2 * apronInset, .02), apronH, .004, {curveSegments: 32, bevelSegments: 1})
  apron.translate(0, H - topT - apronH + .001, 0)
  const foot = easedSlab(ellipseOutline(footL, footW), footT, .012, {curveSegments: 32, bevelSegments: 2})
  const along = merged([apron, foot]); grainUV(along, grainScaleOf(mat.oakDark))
  const topMesh = solid(top, mat.oak, 'dining table top'); topMesh.rotation.y = GRAIN_ALONG_Z
  const lowMesh = solid(along, mat.oakDark, 'dining table apron and foot'); lowMesh.rotation.y = GRAIN_ALONG_Z
  // Turned column, standing; built along local x (grain along the column) and turned upright.
  const y0 = footT - .002, y1 = H - topT + .001, h = y1 - y0
  const column = turned([[0, 0], [.105, 0], [.1, .012], [.07, .03], [.058, .07], [.05, h * .45], [.047, h * .7], [.052, h - .06], [.07, h - .022], [.085, h - .008], [.085, h], [0, h]], 28)
  column.translate(0, y0, 0); column.rotateZ(-Math.PI / 2); grainUV(column, grainScaleOf(mat.oakDark))
  const columnMesh = solid(column, mat.oakDark, 'dining table column'); columnMesh.rotation.z = Math.PI / 2
  const collar = turned([[.049, 0], [.066, .004], [.066, .022], [.049, .026]], 28); collar.translate(0, y1 - .09, 0)
  const footRing = new THREE.TorusGeometry(1, .006, 6, 48); footRing.rotateX(Math.PI / 2); footRing.scale((footL / 2 - .03), 1, (footW / 2 - .03)); footRing.translate(0, footT + .002, 0)
  // the torus scale makes its tube elliptical in plan; that is invisible at 6 mm
  const brass = solid(merged([collar, footRing]), mat.brass, 'dining table brass'); brass.rotation.y = GRAIN_ALONG_Z
  group.add(topMesh, lowMesh, columnMesh, brass)
  return group
}

/**
 * The dining set of the Lobby: the table and four chairs, two each side of the table's long sides, facing it. One chair
 * geometry is shared by the four chairs. `f`: room.furniture of the Lobby ({diningTable, chairRowsZmm, chairOffsetXmm}).
 * Returned group is in the room frame (metres); add it to the room's furniture.
 */
export function createDiningSet(f) {
  const t = f.diningTable, group = new THREE.Group(); group.name = 'Dining set'
  const mat = diningMaterials()
  const table = createDiningTable(t, mat); table.position.set(mm(t.centerXmm), 0, mm(t.centerZmm)); group.add(table)
  const chair = createDiningChair({oak: mat.oak})
  for (const side of [-1, 1]) for (const zMm of f.chairRowsZmm) {
    const c = chair.instance()
    // Built facing +x; the chairs west of the table (side -1) face east, those east of it face west.
    c.position.set(mm(t.centerXmm + side * f.chairOffsetXmm), 0, mm(zMm)); c.rotation.y = side < 0 ? 0 : Math.PI
    group.add(c)
  }
  return group
}

/** Dark walnut of the Drawing Room pieces (owner references, untagged so the Materials panel does not repaint them). */
const walnut = () => woodMaterial('#4a2f1e', {roughness: .56, asset: 'teak_veneer', clearcoat: .14})

/**
 * Oval coffee table: an eased-edge walnut top over a set-in apron on four tapered, slightly splayed legs, all inside the
 * top's outline. `t`: {centerXmm, centerZmm, widthMm (x), lengthMm (z)}; `heightM` the height of the top (the present
 * drawing: 457.5 mm; not in config).
 */
export function createCoffeeTable(t, {heightM = .4575, material = walnut()} = {}) {
  const W = mm(t.widthMm), L = mm(t.lengthMm), H = heightM
  const group = new THREE.Group(); group.name = 'Coffee table'
  markItem(group, `Coffee table · oval ${t.lengthMm} x ${t.widthMm}`)
  const topT = .034, apronH = .05, inset = .07
  const top = easedSlab(ellipseOutline(W, L), topT, .012, {curveSegments: 40, bevelSegments: 3}); top.translate(0, H - topT, 0)
  grainAlong(top, [0, 0, 1], grainScaleOf(material))
  const band = .018, apron = easedSlab(ellipseRingOutline(W - 2 * inset, L - 2 * inset, band), apronH, .004, {curveSegments: 32, bevelSegments: 1})
  apron.translate(0, H - topT - apronH + .001, 0); grainAlong(apron, [0, 0, 1], grainScaleOf(material))
  // Legs meet the apron's inside (on its inner ellipse, 50 degrees off the short axis) and splay out, staying well inside the
  // top's outline.
  const legs = [], ai = W / 2 - inset - band - .021, bi = L / 2 - inset - band - .021, a = 50 * Math.PI / 180
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const tx = sx * ai * Math.cos(a), tz = sz * bi * Math.sin(a)
    const leg = legBetween([tx * 1.22, 0, tz * 1.13], [tx, H - topT + .001, tz], .011, .02, 14)
    grainAlong(leg, [0, 1, 0], grainScaleOf(material)); legs.push(leg)
  }
  group.add(solid(merged([top, apron, ...legs]), material, 'coffee table'))
  group.position.set(mm(t.centerXmm), 0, mm(t.centerZmm))
  return group
}

/**
 * Round side (lamp) table on a turned pedestal and a round foot. {xMm, zMm, diameterMm, heightMm}: the outer box is diameter x
 * diameter x height (the earlier drawing put the top's upper face 20 mm above heightMm; it is now exactly heightMm).
 */
export function createRoundSideTable({xMm, zMm, diameterMm = 380, heightMm = 550}, {material = walnut(), name = 'Lamp table'} = {}) {
  const D = mm(diameterMm), H = mm(heightMm), group = new THREE.Group(); group.name = name
  markItem(group, `${name} · ${diameterMm} across, ${heightMm} high`)
  const topT = .028, footT = .024, footD = D * .62
  const top = easedSlab(ellipseOutline(D, D), topT, .01, {curveSegments: 28, bevelSegments: 3}); top.translate(0, H - topT, 0)
  grainAlong(top, [1, 0, 0], grainScaleOf(material))
  const foot = easedSlab(ellipseOutline(footD, footD), footT, .009, {curveSegments: 24, bevelSegments: 2}); grainAlong(foot, [1, 0, 0], grainScaleOf(material))
  const h = H - topT - footT
  const column = turned([[footD * .3, 0], [footD * .26, .01], [.05, .035], [.036, .07], [.028, h * .5], [.03, h * .78], [.042, h - .03], [.07, h - .008], [.07, h], [0, h]], 24)
  column.translate(0, footT, 0); grainAlong(column, [0, 1, 0], grainScaleOf(material))
  group.add(solid(merged([top, foot, column]), material, name.toLowerCase()))
  group.position.set(mm(xMm), 0, mm(zMm))
  return group
}

/**
 * Bedroom 1 balcony work table: eased-edge oak top (grain along its length, north-south) on a slim steel frame.
 * `t`: {x1, x2, z1, z2, heightMm} in room millimetres (bedroom1Plan().balcony.table).
 */
export function createBalconyTable(t, {top: topMaterial, frame: frameMaterial}) {
  const D = mm(t.x2 - t.x1), Wz = mm(t.z2 - t.z1), H = mm(t.heightMm)
  const group = new THREE.Group(); group.name = 'Balcony table'
  markItem(group, `Balcony table · ${t.z2 - t.z1} x ${t.x2 - t.x1}, ${t.heightMm} high`)
  const topT = .026
  const top = easedSlab(roundedRectOutline(Wz, D, .018), topT, .006, {curveSegments: 4, bevelSegments: 2}); top.translate(0, H - topT, 0)
  grainUV(top, grainScaleOf(topMaterial))
  const topMesh = solid(top, topMaterial, 'balcony table top'); topMesh.rotation.y = GRAIN_ALONG_Z
  const s = .022, ix = D / 2 - .03 - s / 2, iz = Wz / 2 - .03 - s / 2, railY = H - topT - .045
  const parts = []
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const leg = easedBox(s, H - topT, s, .003, .003, {curveSegments: 1, bevelSegments: 1}); leg.translate(sx * ix, 0, sz * iz); parts.push(leg) }
  for (const sz of [-1, 1]) { const r = easedBox(2 * ix, .04, .012, .002, .002, {curveSegments: 1, bevelSegments: 1}); r.translate(0, railY, sz * (iz)); parts.push(r) }
  for (const sx of [-1, 1]) { const r = easedBox(.012, .04, 2 * iz, .002, .002, {curveSegments: 1, bevelSegments: 1}); r.translate(sx * ix, railY, 0); parts.push(r) }
  group.add(topMesh, solid(merged(parts), frameMaterial, 'balcony table frame'))
  group.position.set(mm((t.x1 + t.x2) / 2), 0, mm((t.z1 + t.z2) / 2))
  return group
}

/**
 * Study desk: an eased-edge top (grain along its length, north-south), a slim inlaid tray, on four tapered steel legs with a
 * set-back rail. Box: x [x0, x0 + depth], z centred on zC, y [0, height]. Sizes are the earlier drawing's (not in config).
 */
export function createStudyDesk({centerX, centerZ, depth = .58, length = .8, height = .7625, materials}) {
  const group = new THREE.Group(); group.name = 'Study desk'
  markItem(group, `Study desk · ${Math.round(length * 1000)} x ${Math.round(depth * 1000)}`)
  const topT = .03
  const top = easedSlab(roundedRectOutline(length, depth, .012), topT, .007, {curveSegments: 4, bevelSegments: 2}); top.translate(0, height - topT, 0)
  grainUV(top, grainScaleOf(materials.top))
  const topMesh = solid(top, materials.top, 'study desk top'); topMesh.rotation.y = GRAIN_ALONG_Z
  // The navy inlay of the earlier drawing, now a 4 mm desk pad lying on the top (the earlier one stood 16 mm proud).
  const tray = easedBox(.28, .004, .22, .0015); tray.translate(0, height, 0); grainUV(tray, grainScaleOf(materials.accent))
  const trayMesh = solid(tray, materials.accent, 'study desk pad'); trayMesh.rotation.y = GRAIN_ALONG_Z
  const legs = []
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) legs.push(legBetween([sx * (depth / 2 - .045), 0, sz * (length / 2 - .045)], [sx * (depth / 2 - .05), height - topT, sz * (length / 2 - .05)], .011, .016, 12))
  for (const sx of [-1, 1]) { const rail = easedBox(.014, .05, length - .1, .003, .003, {curveSegments: 1, bevelSegments: 1}); rail.translate(sx * (depth / 2 - .05), height - topT - .05, 0); legs.push(rail) }
  group.add(topMesh, trayMesh, solid(merged(legs), materials.metal, 'study desk frame'))
  group.position.set(centerX, 0, centerZ)
  return group
}
