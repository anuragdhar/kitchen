import * as THREE from 'three'
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import {softBoxGeometry, softBoxSeam, pipingGeometry, pillowGeometry, taperedLegGeometry} from './softForms.js'
import {fabricMaterial} from './fabric.js'

// An upholstered sofa built from soft procedural forms: tapered wooden legs with a shadow gap under a padded base, rounded
// arms, a back frame, crowned seat cushions with piping, leaning back cushions and knife-edge scatter cushions.
//
// Frame: the sofa is built facing +x (its seat front) with its back at -x, centred on the origin in x and z, standing on
// y = 0; the caller turns it with rotation.y and places it. Units: the spec is in millimetres, the model in metres.
// The OUTER BOX is exactly depthMm (x) by lengthMm (z): the back frame and the arms set it and nothing bulges past them
// (tests/sofa-models.test.mjs measures it). heightMm is the top of the back cushions. Proportions inside the box (seat
// height, arm height, cushion sizes) are a design choice of this model, listed in SOFA_PROPORTIONS, not plan measurements.
//
// Scatter cushions are decor: their group carries userData.archvizExclude, so the Blender export skips them as before.
// Geometry and materials are cached and shared between sofas of the same size; disposing them is harmless (three.js
// uploads them again if a page reuses them).

/** Proportions of the upholstery inside the configured box, metres. A model choice (2026-10-06), not from the plan. */
export const SOFA_PROPORTIONS = Object.freeze({
  legHeight: .10,        // shadow gap under the base
  baseTop: .29,          // padded deck the seat cushions sit on
  seatTop: .445,         // crowned seat height, middle of a seat cushion (usual range 430-450)
  armHeight: .655,
  armWidth: .17,
  armRadius: .06,
  backFrameDepth: .16,
  backFrameTop: .78,
  backCushionDepth: .16,
  backCushionLean: .14,  // radians, about 8 degrees
  frontSetBack: .01,     // the base sits 10 mm behind the seat front, so the cushions overhang it slightly
})

const cache = new Map()
let materials = null

function sofaMaterials(colours) {
  const key = JSON.stringify(colours)
  materials ??= new Map()
  if (!materials.has(key)) {
    materials.set(key, {
      frame: fabricMaterial({color: colours.frame, name: 'sofa frame fabric', sheen: .45}),
      cushion: fabricMaterial({color: colours.cushion, name: 'sofa cushion fabric', sheen: .5}),
      legs: new THREE.MeshStandardMaterial({color: colours.legs, roughness: .55, name: 'sofa legs'}),
      scatter: fabricMaterial({vertexColors: true, name: 'scatter cushion fabric', tileMetres: .04, sheen: .7, sheenColor: '#ffe9d6', sheenRoughness: .55}),
    })
  }
  return materials.get(key)
}

// Places a soft box: size {w,h,d}, centre, optional rotation about z.
function placed(spec, {x = 0, y = 0, z = 0, rotZ = 0} = {}) {
  const geometry = softBoxGeometry(spec)
  if (rotZ) geometry.rotateZ(rotZ)
  return geometry.translate(x, y, z)
}

function bodyGeometries(D, L, H) {
  const P = SOFA_PROPORTIONS, halfD = D / 2, halfL = L / 2
  const frameBack = -halfD + P.backFrameDepth // front face of the back frame
  const span = L - 2 * P.armWidth // between the arms

  // Frame: base, back, two arms. Outer faces carry no crown, so the outer box is exactly D x L.
  const base = placed({width: D - P.frontSetBack, height: P.baseTop - P.legHeight, depth: span + .06, radius: .025, arc: 2, inner: [1, 1, 2]},
    {x: -P.frontSetBack / 2, y: (P.baseTop + P.legHeight) / 2})
  const back = placed({width: P.backFrameDepth, height: P.backFrameTop - P.legHeight, depth: L - .02, radius: .05, arc: 2, inner: [1, 1, 2], crown: {py: .004}},
    {x: -halfD + P.backFrameDepth / 2, y: (P.backFrameTop + P.legHeight) / 2})
  const arm = side => placed({width: D, height: P.armHeight - P.legHeight, depth: P.armWidth, radius: P.armRadius, arc: 3, inner: [1, 1, 1],
    crown: {py: .006, [side > 0 ? 'nz' : 'pz']: .008}},
  {y: (P.armHeight + P.legHeight) / 2, z: side * (halfL - P.armWidth / 2)})
  const frame = mergeGeometries([base, back, arm(-1), arm(1)])
  ;[base, back].forEach(g => g.dispose())

  // Seat cushions: three across the span, front just inside the outer box, crowned top and front, piped top and bottom edges.
  const seatDepth = halfD - frameBack, seatWidth = span / 3 - .004, seatHeight = P.seatTop - .012 - P.baseTop
  const seatSpec = {width: seatDepth - .006, height: seatHeight, depth: seatWidth, radius: .035, arc: 2, inner: [3, 1, 3], crown: {py: .012, px: .006, pz: .004, nz: .004}}
  const seatX = frameBack + seatDepth / 2 - .003, seatY = P.baseTop + seatHeight / 2
  const parts = []
  for (let i = 0; i < 3; i++) {
    const z = -span / 2 + span / 3 * (i + .5)
    parts.push(placed({...seatSpec, skip: ['ny']}, {x: seatX, y: seatY, z}))
    for (const face of ['py', 'ny']) parts.push(pipingGeometry(softBoxSeam(seatSpec, face, 2), .0045, 4).translate(seatX, seatY, z))
  }
  // Back cushions: lean back against the frame, sitting on the rear of the seat cushions; tops at H.
  const lean = P.backCushionLean, t = P.backCushionDepth, seatRear = P.seatTop - .02
  const backHeight = (H - seatRear - t * Math.sin(lean)) / Math.cos(lean)
  const backSpec = {width: t, height: backHeight, depth: seatWidth, radius: .05, arc: 2, inner: [1, 2, 2], crown: {px: .02, py: .006, pz: .005, nz: .005}}
  // Bottom-back corner on the frame face at seat level, then rotate: centre = corner + rotated half size.
  const cx = frameBack + t / 2 * Math.cos(lean) - backHeight / 2 * Math.sin(lean), cy = seatRear + t / 2 * Math.sin(lean) + backHeight / 2 * Math.cos(lean)
  const backs = []
  for (let i = 0; i < 3; i++) {
    const z = -span / 2 + span / 3 * (i + .5)
    const cushion = softBoxGeometry(backSpec).rotateZ(lean)
    const piping = pipingGeometry(softBoxSeam(backSpec, 'px', 2), .0045, 4).rotateZ(lean)
    backs.push(cushion.translate(cx, cy, z), piping.translate(cx, cy, z))
  }
  const backCushions = mergeGeometries(backs)
  // The crown and rounding move the very top a few millimetres; set it exactly at H.
  backCushions.computeBoundingBox(); backCushions.translate(0, H - backCushions.boundingBox.max.y, 0)
  const seats = mergeGeometries(parts)
  ;[...parts, ...backs].forEach(g => g.dispose())

  // Legs: four tapered legs set in from the corners.
  const legs = mergeGeometries([-1, 1].flatMap(sx => [-1, 1].map(sz =>
    taperedLegGeometry({height: P.legHeight}).translate(sx * (halfD - .075), 0, sz * (halfL - .075)))))
  // Contact shadow: the floor under a sofa is darker than the sun shadow alone makes it (light is blocked from every
  // side). A soft dark patch inside the footprint, just above a 15 mm rug, fading to nothing at the footprint's edge.
  const shadow = new THREE.PlaneGeometry(D, L).rotateX(-Math.PI / 2).translate(0, .017, 0)
  return {frame, seats, backCushions, legs, shadow, shadowMap: contactShadowTexture(D, L)}
}

function contactShadowTexture(D, L) {
  const w = 64, h = Math.max(8, Math.round(w * L / D / 4) * 4), data = new Uint8Array(w * h * 4)
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const x = (i + .5) / w * D, z = (j + .5) / h * L, edge = Math.min(x, D - x, z, L - z)
    const t = Math.min(1, edge / .14), a = t * t * (3 - 2 * t)
    const o = (j * w + i) * 4; data[o] = data[o + 1] = data[o + 2] = Math.round(255 * a); data[o + 3] = 255
  }
  const texture = new THREE.DataTexture(data, w, h, THREE.RGBAFormat, THREE.UnsignedByteType)
  texture.magFilter = THREE.LinearFilter; texture.minFilter = THREE.LinearFilter; texture.needsUpdate = true
  return texture
}

// Scatter cushions: [{colour, size (m, square), thickness, z (centre along the sofa), layer (0 = against the back
// cushions, 1 = in front), yaw, roll}]. The default is the owner's styling (2026-10-03 references): two each of terracotta,
// ochre and sand, arranged symmetrically: a large cushion in each corner, a medium one overlapping it towards the middle,
// a smaller one in front.
export const DEFAULT_SCATTER = Object.freeze([
  {colour: '#b5573a', size: .55, thickness: .15, z: -.675, layer: 0, yaw: .16, roll: .05},
  {colour: '#c9803f', size: .48, thickness: .14, z: -.24, layer: 0, yaw: .06, roll: -.04, nudge: .03},
  {colour: '#e2c7a0', size: .42, thickness: .13, z: -.47, layer: 1, yaw: .2, roll: .07},
  {colour: '#b5573a', size: .55, thickness: .15, z: .675, layer: 0, yaw: -.16, roll: -.05},
  {colour: '#c9803f', size: .48, thickness: .14, z: .24, layer: 0, yaw: -.06, roll: .04, nudge: .03},
  {colour: '#e2c7a0', size: .42, thickness: .13, z: .47, layer: 1, yaw: -.2, roll: -.07},
])

function scatterGeometry(D, scatter, topY) {
  const P = SOFA_PROPORTIONS, halfD = D / 2, frameBack = -halfD + P.backFrameDepth
  const rest = P.seatTop - .025 // bottom edge sinks a little into the seat cushion
  // Front face of the back cushions at height y (it leans back with the cushions).
  const backFront = y => frameBack + P.backCushionDepth / Math.cos(P.backCushionLean) - (y - (P.seatTop - .02)) * Math.tan(P.backCushionLean)
  const shared = new Map(), parts = []
  const matrix = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler()
  for (const c of scatter) {
    const key = `${c.size}|${c.thickness}`
    if (!shared.has(key)) shared.set(key, pillowGeometry({width: c.size, height: c.size, thickness: c.thickness}))
    const g = shared.get(key).clone()
    // Leaning a little further back than the back cushions, bottom edge on the seat, upper part resting on the cushion
    // behind it (pressed in by about 10 mm); a front-layer cushion rests on the ones behind it instead.
    const lean = P.backCushionLean + (c.layer ? .04 : .07), s = c.size, half = c.thickness / 2
    const cy = rest + s / 2 * Math.cos(lean), contactY = cy + .3 * s * Math.cos(lean)
    const cx = backFront(contactY) + .012 + .3 * s * Math.sin(lean) + .8 * half * Math.cos(lean) - .01 + (c.layer ? .12 : 0) + (c.nudge ?? 0)
    // Front face to +x, then lean back, turn a little towards the middle, tilt a little in its own plane.
    e.set(0, Math.PI / 2, c.roll ?? 0, 'YXZ')
    q.setFromEuler(e)
    const tilt = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), lean)
    const yaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), c.yaw ?? 0)
    q.premultiply(tilt).premultiply(yaw)
    matrix.compose(new THREE.Vector3(cx, cy, c.z), q, new THREE.Vector3(1, 1, 1))
    g.applyMatrix4(matrix)
    const colour = new THREE.Color(c.colour), colours = new Float32Array(g.attributes.position.count * 3)
    for (let i = 0; i < colours.length; i += 3) { colours[i] = colour.r; colours[i + 1] = colour.g; colours[i + 2] = colour.b }
    g.setAttribute('color', new THREE.BufferAttribute(colours, 3))
    parts.push(g)
  }
  const merged = mergeGeometries(parts)
  parts.forEach(g => g.dispose()); shared.forEach(g => g.dispose())
  // Soft cushions settle: drop (or lift) them all together so the tallest top is exactly topY.
  if (topY != null) { merged.computeBoundingBox(); merged.translate(0, topY - merged.boundingBox.max.y, 0) }
  return merged
}

/**
 * depthMm (front to back) x lengthMm (arm to arm), back cushions topping out at heightMm. colours: {frame, cushion, legs}.
 * scatter: scatter cushions (see DEFAULT_SCATTER; [] for none). scatterTopMm: height of the tallest scatter cushion's top,
 * or null to leave them where they rest. Returns a Group named `name`; the scatter cushions are its child 'sofa cushions'.
 */
export function createSofa({depthMm, lengthMm, heightMm = 925, colours = {frame: '#e6dac6', cushion: '#efe5d3', legs: '#4a2f1e'}, scatter = DEFAULT_SCATTER, scatterTopMm = null, name = 'Sofa'}) {
  const D = depthMm / 1000, L = lengthMm / 1000, H = heightMm / 1000
  const key = JSON.stringify([depthMm, lengthMm, heightMm, scatter, scatterTopMm])
  if (!cache.has(key)) cache.set(key, {...bodyGeometries(D, L, H), scatter: scatter.length ? scatterGeometry(D, scatter, scatterTopMm == null ? null : scatterTopMm / 1000) : null})
  const geometry = cache.get(key), material = sofaMaterials(colours)
  const group = new THREE.Group(); group.name = name
  const add = (parent, g, m, label) => { const mesh = new THREE.Mesh(g, m); mesh.name = label; mesh.castShadow = mesh.receiveShadow = true; parent.add(mesh); return mesh }
  add(group, geometry.frame, material.frame, 'sofa frame')
  add(group, geometry.seats, material.cushion, 'sofa seat cushions')
  add(group, geometry.backCushions, material.cushion, 'sofa back cushions')
  add(group, geometry.legs, material.legs, 'sofa legs')
  geometry.shadowMaterial ??= new THREE.MeshBasicMaterial({name: 'sofa contact shadow', color: '#000000', transparent: true, opacity: .5, alphaMap: geometry.shadowMap, depthWrite: false})
  const shadow = new THREE.Mesh(geometry.shadow, geometry.shadowMaterial); shadow.name = 'sofa contact shadow'
  shadow.userData.noMeasure = true; shadow.userData.archvizExclude = true; group.add(shadow)
  if (geometry.scatter) {
    const decor = new THREE.Group(); decor.name = 'sofa cushions'; decor.userData.archvizExclude = true; group.add(decor)
    add(decor, geometry.scatter, material.scatter, 'scatter cushions')
  }
  return group
}
