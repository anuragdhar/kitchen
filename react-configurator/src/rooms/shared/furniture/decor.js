import * as THREE from 'three'
import {turned, rodThrough, merged, fitGeometries, metalMaterial, weaveTexture, solid} from './hardForms.js'

// Loose decor for the live 3D views, built procedurally (hardForms.js): floor lamp, table lamp, potted plant, laundry hamper.
// Metres, y up, the centre of the floor footprint at the origin; the caller positions them. Decor groups carry
// archvizExclude (the Blender renders skip them, owner 2026-09-28) except the hamper, which is a real fixture.
// Furniture-tables-and-chairs round, 2026-10-06.

const decorGroup = name => { const group = new THREE.Group(); group.name = name; group.userData.archvizExclude = true; return group }
// Deterministic pseudo-random numbers, so a plant looks the same on every load and in both views.
const seeded = seed => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }

/**
 * A lamp shade with real thickness: a closed lathe of the outer wall, the rims and the inner wall (single-sided, so no open
 * double-sided cylinder; an open one crashed Cycles once). Returns {outer, inner} so the inside can glow more than the outside.
 */
function shadeForms(rTop, rBottom, height, wall = .004) {
  const outer = turned([[rBottom - wall, 0], [rBottom - .0015, 0], [rBottom, .004], [rTop, height - .004], [rTop - .0015, height], [rTop - wall, height]], 40)
  // Listed downwards, it closes the outer profile's loop, so its faces point at the axis (into the shade).
  const inner = turned([[rTop - wall, height], [rBottom - wall, 0]], 40)
  return {outer, inner}
}

/** Linen shade materials; the inside glows warm (the lamp is drawn on, as before). */
function shadeMaterials(color = '#f1e4cd') {
  const outer = new THREE.MeshPhysicalMaterial({color, roughness: .9, sheen: .4, sheenRoughness: .8, sheenColor: new THREE.Color('#ffffff'), emissive: '#ffcf8a', emissiveIntensity: .16})
  const inner = new THREE.MeshStandardMaterial({color: '#fff1d8', roughness: .95, emissive: '#ffcf8a', emissiveIntensity: .85})
  return {outer, inner}
}

/**
 * Floor lamp: a weighted, turned steel base, a slim bronze stem with an in-line switch, a linen drum shade with thickness on a
 * spider frame, and a warm bulb. Box: 0.40 across (the shade's foot) x 1.58 high, as the earlier drawing.
 */
export function createFloorLamp() {
  const group = decorGroup('decor floor lamp')
  const base = turned([[0, 0], [.152, 0], [.16, .004], [.16, .016], [.148, .026], [.06, .034], [.024, .042], [.016, .05], [0, .05]], 32)
  const shadeBottom = 1.32, shadeH = .26
  const stem = rodThrough([[0, .045, 0], [0, shadeBottom + .14, 0]], .0105, {radial: 14})
  const switchBox = turned([[0, 0], [.017, .002], [.018, .03], [.016, .045], [0, .047]], 16); switchBox.translate(0, .62, 0)
  const spokes = [], ringTop = shadeBottom + shadeH - .01
  for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; spokes.push(rodThrough([[0, ringTop, 0], [Math.cos(a) * .155, ringTop, Math.sin(a) * .155]], .0025, {radial: 6})) }
  const ring = new THREE.TorusGeometry(.155, .003, 6, 40); ring.rotateX(Math.PI / 2); ring.translate(0, ringTop, 0)
  const socket = turned([[0, 0], [.022, 0], [.022, .055], [0, .055]], 20); socket.translate(0, shadeBottom + .09, 0)
  const bronze = metalMaterial('#4a4038', {roughness: .32, metalness: .75}), dark = metalMaterial('#3a362f', {roughness: .45, metalness: .6})
  const {outer, inner} = shadeForms(.16, .2, shadeH); outer.translate(0, shadeBottom, 0); inner.translate(0, shadeBottom, 0)
  const sm = shadeMaterials()
  const bulb = new THREE.SphereGeometry(.032, 20, 14); bulb.scale(1, 1.25, 1); bulb.translate(0, shadeBottom + .17, 0)
  group.add(
    solid(base, dark, 'floor lamp base'),
    solid(merged([stem, switchBox, ...spokes, ring, socket]), bronze, 'floor lamp stem'),
    solid(outer, sm.outer, 'floor lamp shade'),
    new THREE.Mesh(inner, sm.inner),
    new THREE.Mesh(bulb, new THREE.MeshStandardMaterial({color: '#ffe6b8', emissive: '#ffcf8a', emissiveIntensity: 1.2})),
  )
  return group
}

/**
 * Table lamp for a lamp table: a glazed ceramic body (turned), a brass neck and a linen shade with thickness. Same size as the
 * earlier drawing: body 0.26 high on the table top, shade 0.22 high, 0.38 across at its foot. `glow` is the page's shade
 * material (a taskLightGlow material, so it is not shadowed); its inside glows warmer.
 */
export function createTableLamp(glow) {
  const group = new THREE.Group(); group.name = 'table lamp'
  const body = turned([[0, 0], [.055, 0], [.058, .006], [.085, .06], [.092, .12], [.078, .2], [.045, .24], [.028, .26], [0, .26]], 40)
  const neck = turned([[0, 0], [.03, 0], [.03, .01], [.012, .016], [.011, .1], [0, .1]], 20); neck.translate(0, .26, 0)
  const {outer, inner} = shadeForms(.13, .19, .22); outer.translate(0, .29, 0); inner.translate(0, .29, 0)
  const ceramic = new THREE.MeshPhysicalMaterial({color: '#3b2a1e', roughness: .25, clearcoat: .8, clearcoatRoughness: .12})
  const glowInside = glow.clone(); glowInside.emissiveIntensity = (glow.emissiveIntensity || .5) * 1.8; glowInside.side = THREE.FrontSide
  glow.side = THREE.FrontSide
  group.add(solid(body, ceramic, 'table lamp body'), solid(neck, metalMaterial('#b08d57', {roughness: .3, metalness: .85}), 'table lamp neck'),
    new THREE.Mesh(outer, glow), new THREE.Mesh(inner, glowInside))
  return group
}

/** One leaf: an ovate blade folded along its midrib and arched, tip along +x. Vertex colours vary the green. */
function leafGeometry(length, width, {fold = .35, arch = .25, along = 6, across = 2} = {}) {
  const positions = [], indices = []
  for (let i = 0; i <= along; i++) {
    const t = i / along, half = width / 2 * Math.sin(Math.PI * Math.pow(t, .8)) * (1 - .15 * t)
    for (let j = -across; j <= across; j++) {
      const s = j / across, x = t * length, z = s * half
      const y = Math.abs(s) * half * fold - arch * length * t * t
      positions.push(x, y, z)
    }
  }
  const row = 2 * across + 1
  for (let i = 0; i < along; i++) for (let j = 0; j < row - 1; j++) { const a = i * row + j, b = a + row; indices.push(a, b, a + 1, a + 1, b, b + 1) }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); g.setIndex(indices); g.computeVertexNormals()
  return g
}

/**
 * Potted plant: a turned planter with a rolled rim and soil, several arching stems carrying layered, folded leaves (one merged
 * leaf mesh, one stem mesh). `size`: a number (the earlier scale: about 0.70 x scale high, 0.42 x scale across) or
 * {heightM, spreadM} for a plant whose size is configured (Bedroom 1: 1000 high, 400 across).
 */
export function createPottedPlant(size = 1) {
  const group = decorGroup('decor plant')
  const H = typeof size === 'number' ? .7 * size : size.heightM, spread = typeof size === 'number' ? .42 * size : size.spreadM
  const random = seeded(Math.round(H * 1000) * 31 + 7)
  // Planter in unit proportions, fitted with the plant below.
  const potH = .26, potR = .135
  const pot = turned([[0, .004], [potR * .7, 0], [potR * .72, .008], [potR * .9, potH * .55], [potR, potH - .025], [potR + .014, potH - .016], [potR + .016, potH - .004], [potR + .008, potH], [potR - .008, potH], [potR - .01, potH - .03], [0, potH - .03]], 28)
  const soil = new THREE.CircleGeometry(potR - .01, 24); soil.rotateX(-Math.PI / 2); soil.translate(0, potH - .035, 0)
  const stems = [], leaves = []
  const greens = ['#4c7a4a', '#3f6e3d', '#5a8a4f', '#466f40', '#6a9a5a', '#55804a']
  const stemCount = 10
  for (let s = 0; s < stemCount; s++) {
    const a = s / stemCount * Math.PI * 2 + random() * .4, lean = .1 + random() * .2, top = potH + .3 + random() * .45 * (s % 3 ? 1 : .6)
    const pts = [[Math.cos(a) * .02, potH - .035, Math.sin(a) * .02], [Math.cos(a) * lean * .35, (potH + top) / 2, Math.sin(a) * lean * .35], [Math.cos(a) * lean * .6, top, Math.sin(a) * lean * .6]]
    stems.push(rodThrough(pts, .0035, {tubular: 8, radial: 5}))
    const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)))
    const count = 5 + Math.floor(random() * 3)
    for (let k = 0; k < count; k++) {
      const t = .18 + .82 * (k + .5) / count, at = curve.getPointAt(Math.min(t, 1))
      const length = .12 + random() * .07 + (1 - t) * .06, leaf = leafGeometry(length, length * (.5 + random() * .14), {fold: .2 + random() * .25, arch: .18 + random() * .25})
      leaf.rotateZ(.35 + random() * .5) // rises from the stem, then the arch bends it down
      leaf.rotateY(-(a + (k % 2 ? 1 : -1) * (.6 + random() * .8)))
      leaf.translate(at.x, at.y, at.z)
      const c = new THREE.Color(greens[Math.floor(random() * greens.length)]), n = leaf.getAttribute('position').count
      const shade = new Float32Array(n * 3); for (let i = 0; i < n; i++) { shade[i * 3] = c.r; shade[i * 3 + 1] = c.g; shade[i * 3 + 2] = c.b }
      leaf.setAttribute('color', new THREE.BufferAttribute(shade, 3)); leaves.push(leaf)
    }
  }
  const leafMerged = mergeWithColor(leaves)
  const stemMerged = merged(stems)
  const potMerged = pot
  fitGeometries([potMerged, soil, stemMerged, leafMerged], {y: [0, H]})
  // Spread: scale x/z about the pot's axis so the widest leaf reaches half the asked width (the pot stays centred).
  const box = new THREE.Box3(); [potMerged, stemMerged, leafMerged].forEach(g => { g.computeBoundingBox(); box.union(g.boundingBox) })
  const reach = Math.max(-box.min.x, box.max.x, -box.min.z, box.max.z), k = spread / 2 / reach
  for (const g of [potMerged, soil, stemMerged, leafMerged]) g.scale(k, 1, k)
  const leafMaterial = new THREE.MeshStandardMaterial({color: '#ffffff', vertexColors: true, roughness: .55, side: THREE.DoubleSide})
  group.add(solid(potMerged, new THREE.MeshStandardMaterial({color: '#8a6f5c', roughness: .8}), 'plant pot'),
    solid(soil, new THREE.MeshStandardMaterial({color: '#3f342b', roughness: 1}), 'plant soil'),
    solid(stemMerged, new THREE.MeshStandardMaterial({color: '#5b5a37', roughness: .8}), 'plant stems'),
    solid(leafMerged, leafMaterial, 'plant leaves'))
  return group
}

function mergeWithColor(list) {
  const prepared = list.map(g => { const n = g.index ? g.toNonIndexed() : g; return n })
  const total = prepared.reduce((sum, g) => sum + g.getAttribute('position').count, 0)
  const position = new Float32Array(total * 3), normal = new Float32Array(total * 3), color = new Float32Array(total * 3)
  let offset = 0
  for (const g of prepared) { const n = g.getAttribute('position').count; position.set(g.getAttribute('position').array, offset * 3); normal.set(g.getAttribute('normal').array, offset * 3); color.set(g.getAttribute('color').array, offset * 3); offset += n }
  prepared.forEach((g, i) => { if (g !== list[i]) g.dispose() }); list.forEach(g => g.dispose())
  const out = new THREE.BufferGeometry()
  out.setAttribute('position', new THREE.BufferAttribute(position, 3)); out.setAttribute('normal', new THREE.BufferAttribute(normal, 3)); out.setAttribute('color', new THREE.BufferAttribute(color, 3))
  return out
}

/**
 * Laundry hamper (a real fixture, so it stays in the Blender renders): a woven body with a rounded foot and two rope handles,
 * cane bands, and a lift lid with a knob. 0.40 across (the lid) x 0.49 high, as the earlier drawing.
 */
export function createLaundryHamper() {
  const group = new THREE.Group(); group.name = 'laundry hamper'
  const body = turned([[0, 0], [.15, 0], [.158, .006], [.162, .02], [.19, .455], [.182, .46], [0, .46]], 36)
  const weave = weaveTexture({cells: 16, strands: 4, contrast: .55})
  const weaveMaterial = new THREE.MeshStandardMaterial({color: '#c9a876', roughness: .92})
  if (weave) {
    const map = weave.clone(); map.repeat.set(6, 3); map.colorSpace = THREE.NoColorSpace; map.needsUpdate = true
    weaveMaterial.map = map; weaveMaterial.bumpMap = map; weaveMaterial.bumpScale = 2.2
    weaveMaterial.addEventListener('dispose', () => map.dispose())
  }
  const rim = new THREE.MeshStandardMaterial({color: '#8a6f4a', roughness: .6})
  const bands = [.1, .36].map(y => { const r = .162 + (.19 - .162) * (y - .02) / .435, t = new THREE.TorusGeometry(r + .004, .009, 6, 36); t.rotateX(Math.PI / 2); t.translate(0, y, 0); return t })
  const lid = turned([[0, .462], [.186, .462], [.186, .456], [.2, .458], [.2, .468], [.17, .485], [.04, .494], [0, .495]], 36)
  const knob = turned([[0, 0], [.012, 0], [.009, .006], [.016, .012], [.014, .02], [0, .022]], 16); knob.translate(0, .494, 0)
  // Rope handles: half loops lying on the body's sides (in the x-y plane, at the body's surface).
  const handles = [-1, 1].map(s => { const h = new THREE.TorusGeometry(.045, .006, 6, 16, Math.PI); h.translate(0, .37, s * .188); return h })
  fitGeometries([body, ...bands, lid, knob, ...handles], {y: [0, .49]})
  group.add(solid(body, weaveMaterial, 'hamper body'), solid(merged([...bands, lid, knob, ...handles]), rim, 'hamper lid and bands'))
  return group
}
