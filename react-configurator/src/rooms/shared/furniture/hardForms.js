import * as THREE from 'three'
import {mergeGeometries, mergeVertices} from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import {tagSurfaceMaterial} from '../../../render/surfaceRoles.mjs'

// Procedural "hard" furniture forms (tables, chairs, stools, lamps): eased-edge slabs, turned (lathe) parts, tapered legs,
// bent panels, wood with real grain, metal and a few textures, all built in code (no downloaded models, no new dependency).
// Units: metres, y up. Furniture-tables-and-chairs round, 2026-10-06; see docs/changes/2026-10-06-furniture-tables-chairs.md.
//
// GRAIN. The interior theme (render/interiorScene.js projectSurfaceUV) re-projects UVs on every mesh whose material is tagged
// 'wood': on a face that points up or down u runs along the mesh's LOCAL x; on a face that points along local z u runs along
// x; on a face that points along local x u runs along z. The bundled veneer maps have their grain along u. So a wooden part
// whose grain should run along some direction is built with that direction as its local x and turned into place by a mesh
// rotation of a multiple of 90 degrees (which also keeps axis-aligned bounding boxes exact). grainUV() writes the same
// projection for untagged wood, so a piece looks the same whether or not the theme is applied.
// Small duplication with the seating agent's softForms.js (rounded slabs) is deliberate this round: each file has one owner.

export const mm = value => value / 1000

// ---- geometry ----------------------------------------------------------------------------------------------------------

/** UVs in metres / repeat, with the theme's box projection (see GRAIN above). */
export function grainUV(geometry, metresPerRepeat = 1) {
  const position = geometry.getAttribute('position'), normal = geometry.getAttribute('normal')
  const uv = new Float32Array(position.count * 2), k = 1 / metresPerRepeat
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i), y = position.getY(i), z = position.getZ(i)
    const nx = Math.abs(normal.getX(i)), ny = Math.abs(normal.getY(i)), nz = Math.abs(normal.getZ(i))
    const [u, v] = ny > nx && ny > nz ? [x, z] : nx > nz ? [z, y] : [x, y]
    uv[i * 2] = u * k; uv[i * 2 + 1] = v * k
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  return geometry
}

/**
 * UVs for untagged wood whose geometry is already in its final frame: u runs along `axis` (the grain), v across it.
 * Use for pieces merged into one mesh (legs, columns and tops together), which the theme never re-projects.
 */
export function grainAlong(geometry, axis, metresPerRepeat = 1) {
  const position = geometry.getAttribute('position'), normal = geometry.getAttribute('normal')
  const g = new THREE.Vector3(...axis).normalize(), n = new THREE.Vector3(), p = new THREE.Vector3()
  const dominant = (v, skip = -1) => { let best = -1, index = 0; for (let a = 0; a < 3; a++) if (a !== skip && Math.abs(v.getComponent(a)) > best) { best = Math.abs(v.getComponent(a)); index = a } return index }
  const gi = dominant(g), uv = new Float32Array(position.count * 2), k = 1 / metresPerRepeat
  for (let i = 0; i < position.count; i++) {
    p.fromBufferAttribute(position, i); n.fromBufferAttribute(normal, i)
    // v: the world axis that is neither the grain's nor the face's (a box projection across the grain, as the theme does).
    const ni = dominant(n, gi), vi = 3 - gi - ni
    uv[i * 2] = p.dot(g) * k; uv[i * 2 + 1] = p.getComponent(vi) * k
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  return geometry
}

/** Scales/translates several geometries together so their joint box is exactly the given ranges (null keeps an axis). */
export function fitGeometries(list, {x = null, y = null, z = null}) {
  const box = new THREE.Box3()
  for (const g of list) { g.computeBoundingBox(); box.union(g.boundingBox) }
  const ranges = [x, y, z], s = [1, 1, 1], t = [0, 0, 0]
  for (let i = 0; i < 3; i++) {
    const r = ranges[i]; if (!r) continue
    const lo = box.min.getComponent(i), hi = box.max.getComponent(i)
    s[i] = (r[1] - r[0]) / (hi - lo); t[i] = r[0] - lo * s[i]
  }
  for (const g of list) { g.scale(...s); g.translate(...t); g.computeBoundingBox() }
  return s
}

/** Welds a geometry's vertices and recomputes smooth normals (removes faceting on curved and bevelled surfaces). */
export function smoothed(geometry) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry
  g.clearGroups(); g.deleteAttribute('normal'); g.deleteAttribute('uv')
  const welded = mergeVertices(g, 1e-6)
  welded.computeVertexNormals()
  if (g !== geometry) g.dispose()
  if (welded !== geometry) geometry.dispose()
  return welded
}

/**
 * A slab with an eased (rounded) edge all round, from a 2D outline in the x-z plane; thickness along y from 0 to `thickness`.
 * The outline is the slab's outer edge; the edge radius is taken out of it. `curveSegments` samples the outline's curves.
 */
export function easedSlab(shapeOf, thickness, edge, {curveSegments = 48, bevelSegments = 4} = {}) {
  const r = Math.min(edge, thickness / 2 - 1e-4)
  const shape = shapeOf(r)
  const g = new THREE.ExtrudeGeometry(shape, {depth: Math.max(thickness - 2 * r, 1e-4), bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelOffset: 0, bevelSegments, curveSegments})
  g.rotateX(Math.PI / 2) // the extrusion (z) becomes -y, the outline's y becomes z
  // The flat faces keep flat normals (their triangles span the whole top; welding them to the bevel would shade the top in
  // streaks); the rounded edge and the sides are welded smooth.
  const [caps, sides] = [g.groups[0], g.groups[1]].map(group => {
    const part = new THREE.BufferGeometry(), position = g.getAttribute('position'), normal = g.getAttribute('normal')
    part.setAttribute('position', new THREE.BufferAttribute(position.array.slice(group.start * 3, (group.start + group.count) * 3), 3))
    part.setAttribute('normal', new THREE.BufferAttribute(normal.array.slice(group.start * 3, (group.start + group.count) * 3), 3))
    return part
  })
  g.dispose()
  const out = merged([caps, smoothed(sides).toNonIndexed()])
  out.computeBoundingBox(); out.translate(0, -out.boundingBox.min.y, 0)
  return out
}

/** Ellipse outline lengthX x lengthZ (outer), for easedSlab. */
export const ellipseOutline = (lengthX, lengthZ) => inset => { const s = new THREE.Shape(); s.absellipse(0, 0, lengthX / 2 - inset, lengthZ / 2 - inset, 0, Math.PI * 2, false, 0); return s }
/** Elliptical ring (an apron band seen from above): outer lengthX x lengthZ, band `band` wide, for easedSlab. */
export const ellipseRingOutline = (lengthX, lengthZ, band) => inset => {
  const s = new THREE.Shape(); s.absellipse(0, 0, lengthX / 2 - inset, lengthZ / 2 - inset, 0, Math.PI * 2, false, 0)
  const hole = new THREE.Path(); hole.absellipse(0, 0, lengthX / 2 - band + inset, lengthZ / 2 - band + inset, 0, Math.PI * 2, true, 0); s.holes.push(hole)
  return s
}
/** Rounded-rectangle outline lengthX x lengthZ (outer) with corner radius `corner` (outer), for easedSlab. */
export const roundedRectOutline = (lengthX, lengthZ, corner) => inset => {
  const w = lengthX / 2 - inset, d = lengthZ / 2 - inset, c = Math.max(1e-4, Math.min(corner - inset, w, d) )
  const s = new THREE.Shape()
  s.moveTo(-w + c, -d); s.lineTo(w - c, -d); s.absarc(w - c, -d + c, c, -Math.PI / 2, 0, false)
  s.lineTo(w, d - c); s.absarc(w - c, d - c, c, 0, Math.PI / 2, false)
  s.lineTo(-w + c, d); s.absarc(-w + c, d - c, c, Math.PI / 2, Math.PI, false)
  s.lineTo(-w, -d + c); s.absarc(-w + c, -d + c, c, Math.PI, Math.PI * 1.5, false)
  return s
}
/** Eased-edge box (all edges rounded by `edge`), centred on x/z, from y 0 to h. */
export const easedBox = (w, h, d, edge, corner = edge, options) => easedSlab(roundedRectOutline(w, d, Math.max(corner, edge)), h, edge, {curveSegments: 3, bevelSegments: 2, ...options})

/**
 * Turned part: profile [[radius, y], ...] revolved about y. List the profile counter-clockwise (out along the bottom, up the
 * outside, in along the top) so the faces point outwards. Sharp profile corners get two extra points 1.5 mm either side, so
 * smooth shading stays on the corner instead of bending the whole face. UVs: u around (0..1), v = height in metres.
 */
export function turned(profile, segments = 32) {
  const pts = profile.map(([r, y]) => new THREE.Vector2(Math.max(r, 0), y)), out = [pts[0]]
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1], b = pts[i], c = pts[i + 1], d1 = b.clone().sub(a), d2 = c.clone().sub(b)
    const sharp = d1.length() > 1e-6 && d2.length() > 1e-6 && d1.clone().normalize().dot(d2.clone().normalize()) < Math.cos(Math.PI / 6)
    if (sharp) {
      const e1 = Math.min(.0015, d1.length() / 3), e2 = Math.min(.0015, d2.length() / 3)
      out.push(b.clone().sub(d1.normalize().multiplyScalar(e1)), b, b.clone().add(d2.normalize().multiplyScalar(e2)))
    } else out.push(b)
  }
  out.push(pts[pts.length - 1])
  // LatheGeometry's own normals are smooth around and along the profile, and its seam keeps separate UVs.
  const g = new THREE.LatheGeometry(out, segments), position = g.getAttribute('position'), uv = g.getAttribute('uv')
  for (let i = 0; i < uv.count; i++) uv.setY(i, position.getY(i))
  return g
}

/** A round leg tapering from rTop to rBottom between two points (bottom, top: [x, y, z]); orientation baked in. */
export function legBetween(bottom, top, rBottom, rTop, radialSegments = 12) {
  const a = new THREE.Vector3(...bottom), b = new THREE.Vector3(...top), length = a.distanceTo(b)
  const g = new THREE.CylinderGeometry(rTop, rBottom, length, radialSegments, 1, false)
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize())
  g.applyQuaternion(q); g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2)
  // A splayed leg's end is cut level, so the foot stands on the floor (and never dips below it).
  const floor = Math.min(a.y, b.y), p = g.getAttribute('position')
  for (let i = 0; i < p.count; i++) if (p.getY(i) < floor) p.setY(i, floor)
  return g
}

/** A tube of constant radius through points ([x, y, z] list), with closed ends. */
export function rodThrough(points, radius, {tubular = 16, radial = 10} = {}) {
  const curve = points.length === 2 ? new THREE.LineCurve3(new THREE.Vector3(...points[0]), new THREE.Vector3(...points[1])) : new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)))
  const tube = new THREE.TubeGeometry(curve, points.length === 2 ? 1 : tubular, radius, radial, false)
  const caps = [0, 1].map(t => {
    const disc = new THREE.CircleGeometry(radius, radial), p = curve.getPointAt(t), dir = curve.getTangentAt(t).multiplyScalar(t ? 1 : -1)
    disc.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir)); disc.translate(p.x, p.y, p.z)
    return disc
  })
  return merged([tube, ...caps])
}

/** A square leg w x w at the top tapering to wBottom, from y 0 to h, centred on x/z; per-face normals (crisp edges). */
export function taperedSquareLeg(wTop, wBottom, h) {
  const g = new THREE.BoxGeometry(1, h, 1), p = g.getAttribute('position')
  for (let i = 0; i < p.count; i++) { const w = p.getY(i) > 0 ? wTop : wBottom; p.setX(i, p.getX(i) * w); p.setZ(i, p.getZ(i) * w) }
  g.translate(0, h / 2, 0); g.computeVertexNormals()
  return g
}

/**
 * A panel width (x) x height (y) x thickness (z), bent about a vertical axis so its front (+z) is concave with radius R, and
 * leaning back by `rake` radians (top towards -z). Centred at the origin.
 */
export function bentPanel(width, height, thickness, R, rake = 0, segments = 16) {
  const g = new THREE.BoxGeometry(width, height, thickness, segments, 2, 1), p = g.getAttribute('position')
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), angle = x / R, r = R - z
    p.setX(i, r * Math.sin(angle)); p.setZ(i, R - r * Math.cos(angle))
  }
  g.rotateX(-rake); g.computeVertexNormals()
  return g
}

/** Merges geometries (same attributes) into one; non-indexed inputs are fine. */
export function merged(list) {
  const prepared = list.map(g => { const n = g.index ? g.toNonIndexed() : g; if (!n.getAttribute('uv')) n.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n.getAttribute('position').count * 2), 2)); return n })
  for (const n of prepared) for (const name of Object.keys(n.attributes)) if (!['position', 'normal', 'uv'].includes(name)) n.deleteAttribute(name)
  const out = mergeGeometries(prepared, false)
  prepared.forEach((n, i) => { if (n !== list[i]) n.dispose() }); list.forEach(g => g.dispose())
  return out
}

/** Grain along the part's local x, turned to run along world z: rotate a mesh built with its length on x. */
export const GRAIN_ALONG_Z = Math.PI / 2

// ---- materials ---------------------------------------------------------------------------------------------------------

// Linear-light average colour of each bundled veneer's base map (measured 2026-10-06 over the 1k JPEGs in public/materials),
// used to tint a map so the wood keeps the owner's colour on average.
const VENEER_AVERAGE = {teak_veneer: [.4416, .2287, .0938], red_oak_veneer: [.5522, .4170, .2898], white_oak_veneer: [.2847, .1955, .1239]}
const VENEER_SIZE_M = {teak_veneer: 1, red_oak_veneer: 1, white_oak_veneer: .5} // physical size of one map (manifest.json)
const veneerCache = new Map()
const browser = () => typeof document !== 'undefined' && typeof window !== 'undefined'
const baseUrl = () => { try { return import.meta.env?.BASE_URL ?? '/' } catch { return '/' } }

/** The bundled veneer maps (shared, loaded once per page); null outside a browser (node tests). */
export function veneerMaps(asset = 'teak_veneer') {
  if (!browser()) return null
  if (!veneerCache.has(asset)) {
    const loader = new THREE.TextureLoader(), maps = {}
    for (const channel of ['basecolor', 'normal', 'roughness']) {
      const texture = loader.load(`${baseUrl()}materials/${asset}/${channel}.jpg`)
      texture.colorSpace = channel === 'basecolor' ? THREE.SRGBColorSpace : THREE.NoColorSpace
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.anisotropy = 8
      maps[channel] = texture
    }
    veneerCache.set(asset, maps)
  }
  return veneerCache.get(asset)
}

/**
 * Wood: the owner's colour as the average of a bundled veneer (grain along u, one repeat per veneerSize metres, matching the
 * theme's scale). `tag` keeps the Materials/palette role ('wood'), with an optional room id.
 */
export function woodMaterial(color, {roughness = .55, tag = false, room, asset = 'teak_veneer', clearcoat = .2} = {}) {
  const maps = veneerMaps(asset), target = new THREE.Color(color)
  const params = {color: target, roughness, metalness: 0, clearcoat, clearcoatRoughness: .4}
  if (maps) {
    const avg = VENEER_AVERAGE[asset]
    params.color = new THREE.Color(target.r / avg[0], target.g / avg[1], target.b / avg[2])
    Object.assign(params, {map: maps.basecolor, normalMap: maps.normal, roughnessMap: maps.roughness, normalScale: new THREE.Vector2(.35, .35)})
  }
  const material = new THREE.MeshPhysicalMaterial(params)
  material.userData.veneerSizeMetres = VENEER_SIZE_M[asset]
  if (tag) tagSurfaceMaterial(material, 'wood', room)
  return material
}
/** UV scale for a wood material (metres per map repeat). */
export const grainScaleOf = material => material?.userData?.veneerSizeMetres ?? 1

/** Powder-coated or brushed metal; reflects the room's environment map. */
export const metalMaterial = (color, {roughness = .35, metalness = .8} = {}) => new THREE.MeshStandardMaterial({color, roughness, metalness})

let weaveCache = null
/** A small tileable plain-weave canvas (grey levels) for upholstery and basketry; null outside a browser. */
export function weaveTexture({cells = 16, strands = 4, contrast = .28} = {}) {
  if (!browser()) return null
  const key = `${cells}/${strands}/${contrast}`
  weaveCache ??= new Map()
  if (!weaveCache.has(key)) {
    const size = 256, canvas = document.createElement('canvas'); canvas.width = canvas.height = size
    const ctx = canvas.getContext('2d'), cell = size / cells
    ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, size, size)
    for (let i = 0; i < cells; i++) for (let j = 0; j < cells; j++) {
      const over = (i + j) % 2 === 0, x = i * cell, y = j * cell
      // one strand bundle per cell, running across (over) or along (under), shaded to read as round
      for (let s = 0; s < strands; s++) {
        const t = (s + .5) / strands, light = Math.round(128 + 127 * contrast * Math.sin(t * Math.PI) - 40 * contrast)
        ctx.fillStyle = `rgb(${light},${light},${light})`
        if (over) ctx.fillRect(x, y + s * cell / strands, cell, cell / strands - .6)
        else ctx.fillRect(x + s * cell / strands, y, cell / strands - .6, cell)
      }
      ctx.fillStyle = `rgba(0,0,0,${.35 * contrast})`; if (over) { ctx.fillRect(x, y, 1, cell); ctx.fillRect(x + cell - 1, y, 1, cell) } else { ctx.fillRect(x, y, cell, 1); ctx.fillRect(x, y + cell - 1, cell, 1) }
    }
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.anisotropy = 8; texture.colorSpace = THREE.NoColorSpace
    weaveCache.set(key, texture)
  }
  return weaveCache.get(key)
}

/** Upholstery: a woven fabric with a fine bump, matte with a little sheen; repeat = weave cells per metre / cells. */
export function upholsteryMaterial(color, {roughness = .92, repeat = 14} = {}) {
  const weave = weaveTexture({cells: 16, strands: 3, contrast: .22})
  const material = new THREE.MeshPhysicalMaterial({color, roughness, metalness: 0, sheen: .2, sheenRoughness: .8, sheenColor: new THREE.Color(color)})
  if (weave) {
    const bump = weave.clone(); bump.repeat.set(repeat, repeat); bump.needsUpdate = true
    material.bumpMap = bump; material.bumpScale = .6
    material.addEventListener('dispose', () => bump.dispose())
  }
  return material
}

/** A mesh that casts and receives shadows. */
export function solid(geometry, material, name) {
  const mesh = new THREE.Mesh(geometry, material)
  mesh.castShadow = true; mesh.receiveShadow = true
  if (name) mesh.name = name
  return mesh
}

/** The exact (vertex-level) box of an object in its parent's frame. */
export function preciseBox(object) {
  const parent = object.parent; object.removeFromParent()
  object.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(object, true)
  if (parent) parent.add(object)
  return box
}
