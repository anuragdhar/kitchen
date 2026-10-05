import * as THREE from 'three'

// Soft goods for the beds (furniture quality pass, 2026-10-06): procedural fabric, a duvet or throw draped over a mattress,
// crowned pillows and a rolled hem. Pure geometry plus materials; no downloaded models or textures. Used by Bed.js.
//
// Frame: the bed's own frame in metres, length along x with the head at +x, width along z, y up from the floor. Draped
// surfaces get UVs in metres of cloth (the arc length along the fabric), so a texture keeps one scale over the folds.
// Small duplication with the seating agent's softForms.js / fabric.js (same round) is deliberate: the lead can unify them.

// ---- fabric textures ---------------------------------------------------------------------------------------------------
// Height fields baked to tangent-space normal and roughness maps once per module (DataTexture, so it also runs in Node tests,
// where there is no canvas). Linear data: NoColorSpace. Shared by every bed; pages dispose materials, not these maps, and a
// disposed texture would simply be uploaded again.
const SIZE = 128
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }

function bake(height, {strength, roughBase, roughSpan}) {
  const h = new Float32Array(SIZE * SIZE)
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) h[y * SIZE + x] = height(x / SIZE, y / SIZE)
  const at = (x, y) => h[((y + SIZE) % SIZE) * SIZE + ((x + SIZE) % SIZE)]
  const normal = new Uint8Array(SIZE * SIZE * 4), rough = new Uint8Array(SIZE * SIZE * 4)
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const dx = (at(x + 1, y) - at(x - 1, y)) * strength, dy = (at(x, y + 1) - at(x, y - 1)) * strength
    const len = Math.hypot(dx, dy, 1), i = (y * SIZE + x) * 4
    normal[i] = (-dx / len * .5 + .5) * 255; normal[i + 1] = (-dy / len * .5 + .5) * 255; normal[i + 2] = (1 / len * .5 + .5) * 255; normal[i + 3] = 255
    const r = (roughBase + roughSpan * (1 - at(x, y))) * 255
    rough[i] = rough[i + 1] = rough[i + 2] = r; rough[i + 3] = 255
  }
  const texture = data => {
    const t = new THREE.DataTexture(data, SIZE, SIZE, THREE.RGBAFormat)
    t.colorSpace = THREE.NoColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = 4
    t.needsUpdate = true; return t
  }
  return {normal: texture(normal), roughness: texture(rough)}
}

// Plain weave with slubbed threads (cotton percale / linen look): 32 threads a tile, alternate over-under, each thread a
// little thicker or thinner than its neighbours.
const weave = (u, v) => {
  const n = 32, tx = u * n, ty = v * n, i = Math.floor(tx), j = Math.floor(ty), fx = tx - i, fy = ty - j
  const warp = Math.sin(Math.PI * fx) ** .7 * (.55 + .45 * Math.cos(Math.PI * (ty + i))) * (.82 + .3 * hash(i % n))
  const weft = Math.sin(Math.PI * fy) ** .7 * (.55 + .45 * Math.cos(Math.PI * (tx + j + 1))) * (.82 + .3 * hash(100 + j % n))
  return Math.max(warp, weft)
}
// Rib knit (chunky throw): 12 ribs a tile, each a column of V stitches.
const knit = (u, v) => {
  const n = 12, tx = u * n, ty = v * n * 1.6, fx = tx - Math.floor(tx), side = fx < .5 ? fx : 1 - fx
  const stitch = ty + side * 1.2, fy = stitch - Math.floor(stitch)
  return Math.sin(Math.PI * fx) ** .5 * (.6 + .4 * Math.sin(Math.PI * fy))
}

let cache = null
const maps = () => cache || (cache = {
  weave: bake(weave, {strength: 2.2, roughBase: .78, roughSpan: .2}),
  knit: bake(knit, {strength: 3.4, roughBase: .8, roughSpan: .18}),
})

/**
 * A fabric material: physically based with sheen (the soft rim light of cloth), a woven normal and roughness map tiled every
 * `tileMetres` of cloth. Colour is the owner's hex (sRGB). `pattern`: 'weave' (bed linen) or 'knit' (throw).
 */
export function fabricMaterial(color, {pattern = 'weave', tileMetres = .09, normalScale = .45, sheen = .55, roughness = 1, side = THREE.FrontSide, vertexColors = false} = {}) {
  const source = maps()[pattern], repeat = 1 / tileMetres
  const clone = t => { const c = t.clone(); c.repeat.set(repeat, repeat); c.needsUpdate = true; return c }
  const base = new THREE.Color(color)
  const material = new THREE.MeshPhysicalMaterial({
    color: base, roughness, metalness: 0, side, vertexColors,
    normalMap: clone(source.normal), normalScale: new THREE.Vector2(normalScale, normalScale), roughnessMap: clone(source.roughness),
    // Sheen tinted by the cloth's own colour, so the hue stays the owner's instead of washing out to white.
    sheen, sheenRoughness: .75, sheenColor: base.clone().lerp(new THREE.Color('#ffffff'), .15),
  })
  material.name = `fabric/${pattern}`
  return material
}

// ---- small geometry helpers ------------------------------------------------------------------------------------------------
/** Box-projected UVs in metres (grain/weave keeps one scale on every face). */
export function metricUV(geometry) {
  const p = geometry.getAttribute('position'), n = geometry.getAttribute('normal'), uv = new Float32Array(p.count * 2)
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i))
    const [u, v] = ay > ax && ay > az ? [p.getX(i), p.getZ(i)] : ax > az ? [p.getZ(i), p.getY(i)] : [p.getX(i), p.getY(i)]
    uv[i * 2] = u; uv[i * 2 + 1] = v
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  return geometry
}

/**
 * Smooth normals across soft edges, hard across creases sharper than `crease` radians (ExtrudeGeometry is non-indexed and
 * comes faceted). Vertices are matched to 0.01 mm (three's own toCreasedNormals rounds positions to 1 cm, too coarse here).
 */
export function creasedNormals(geometry, crease = .9) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry, p = g.getAttribute('position'), count = p.count
  const normals = new Float32Array(count * 3), cos = Math.cos(crease)
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), fn = []
  for (let f = 0; f < count / 3; f++) {
    a.fromBufferAttribute(p, f * 3); b.fromBufferAttribute(p, f * 3 + 1); c.fromBufferAttribute(p, f * 3 + 2)
    const n = c.sub(b).cross(a.sub(b)), area = n.length()
    fn.push([n.x / (area || 1), n.y / (area || 1), n.z / (area || 1), area])
  }
  const groups = new Map(), key = i => `${Math.round(p.getX(i) * 1e5)},${Math.round(p.getY(i) * 1e5)},${Math.round(p.getZ(i) * 1e5)}`
  for (let i = 0; i < count; i++) { const k = key(i); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(i) }
  for (const members of groups.values()) for (const i of members) {
    const own = fn[Math.floor(i / 3)]
    let x = 0, y = 0, z = 0
    for (const j of members) {
      const other = fn[Math.floor(j / 3)]
      if (own[0] * other[0] + own[1] * other[1] + own[2] * other[2] < cos) continue
      x += other[0] * other[3]; y += other[1] * other[3]; z += other[2] * other[3]
    }
    const len = Math.hypot(x, y, z) || 1
    normals[i * 3] = x / len; normals[i * 3 + 1] = y / len; normals[i * 3 + 2] = z / len
  }
  g.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
  return g
}

/** A rounded rectangle centred on the origin, as a THREE.Shape (half sizes hx, hy, corner radius r). */
export function roundedRectShape(hx, hy, r) {
  r = Math.min(r, hx, hy)
  const s = new THREE.Shape()
  s.moveTo(-hx + r, -hy); s.lineTo(hx - r, -hy); s.absarc(hx - r, -hy + r, r, -Math.PI / 2, 0)
  s.lineTo(hx, hy - r); s.absarc(hx - r, hy - r, r, 0, Math.PI / 2)
  s.lineTo(-hx + r, hy); s.absarc(-hx + r, hy - r, r, Math.PI / 2, Math.PI)
  s.lineTo(-hx, -hy + r); s.absarc(-hx + r, -hy + r, r, Math.PI, Math.PI * 1.5)
  return s
}

/**
 * A soft-edged slab whose plan outline is exactly x0..x1 by z0..z1 and which runs from y0 to y1: a rounded rectangle in plan
 * (corner radius `corner`) extruded upward with a rounded edge of radius `edge` top and bottom. Used for the mattress and base.
 */
export function softSlab({x0, x1, z0, z1, y0, y1, corner = .03, edge = .015, cornerSegments = 4, edgeSegments = 3}) {
  const hx = (x1 - x0) / 2 - edge, hz = (z1 - z0) / 2 - edge, depth = y1 - y0 - 2 * edge
  const geometry = new THREE.ExtrudeGeometry(roundedRectShape(hx, hz, Math.max(.001, corner - edge)), {
    depth, bevelEnabled: edge > 0, bevelThickness: edge, bevelSize: edge, bevelSegments: edgeSegments, curveSegments: cornerSegments,
  })
  geometry.rotateX(-Math.PI / 2) // extrusion (+z) becomes up; shape y becomes -z (symmetric, so no matter)
  geometry.translate((x0 + x1) / 2, y0 + edge, (z0 + z1) / 2)
  return metricUV(creasedNormals(geometry))
}

/** A round tube swept along a polyline of Vector3 (closed or open): mattress piping and rolled hems. */
export function tubeAlong(points, radius, {closed = false, radial = 5} = {}) {
  const count = points.length, rings = closed ? count : count, pos = [], uv = [], index = []
  const tangent = new THREE.Vector3(), side = new THREE.Vector3(), up = new THREE.Vector3(), ref = new THREE.Vector3(0, 1, 0)
  let along = 0
  for (let i = 0; i < rings; i++) {
    const prev = points[closed ? (i - 1 + count) % count : Math.max(0, i - 1)], next = points[closed ? (i + 1) % count : Math.min(count - 1, i + 1)]
    tangent.subVectors(next, prev).normalize()
    side.crossVectors(tangent, Math.abs(tangent.y) > .9 ? new THREE.Vector3(1, 0, 0) : ref).normalize()
    up.crossVectors(side, tangent).normalize()
    if (i > 0) along += points[i].distanceTo(points[i - 1])
    for (let k = 0; k <= radial; k++) {
      const a = k / radial * Math.PI * 2, c = Math.cos(a) * radius, s = Math.sin(a) * radius
      pos.push(points[i].x + side.x * c + up.x * s, points[i].y + side.y * c + up.y * s, points[i].z + side.z * c + up.z * s)
      uv.push(along, k / radial * Math.PI * 2 * radius)
    }
  }
  const segments = closed ? rings : rings - 1
  for (let i = 0; i < segments; i++) {
    const a = i * (radial + 1), b = ((i + 1) % rings) * (radial + 1)
    for (let k = 0; k < radial; k++) index.push(a + k, b + k, a + k + 1, b + k, b + k + 1, a + k + 1)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  geometry.setIndex(index)
  geometry.computeVertexNormals()
  return geometry
}

/** Points around a rounded rectangle in the x-z plane at height y (corner radius r, `per` points a corner). */
export function roundedRectLoop(x0, x1, z0, z1, y, r, per = 5) {
  const out = [], corners = [[x1 - r, z1 - r, 0], [x0 + r, z1 - r, Math.PI / 2], [x0 + r, z0 + r, Math.PI], [x1 - r, z0 + r, Math.PI * 1.5]]
  for (const [cx, cz, start] of corners) for (let i = 0; i <= per; i++) {
    const a = start + i / per * Math.PI / 2
    out.push(new THREE.Vector3(cx + Math.cos(a) * r, y, cz + Math.sin(a) * r))
  }
  return out
}

// ---- grids ---------------------------------------------------------------------------------------------------------------
/**
 * An indexed grid surface from rows x columns of points (arrays of [x,y,z]) with UVs; winding chosen so normals face
 * `outward`. `shade` (optional, one number a vertex, 1 = unshaded) becomes a grey vertex colour: a baked occlusion for seams,
 * the inside of folds and the cloth under a hem, which screen-space occlusion is too coarse to catch at these sizes.
 */
function gridGeometry(points, uvs, rows, cols, outwardProbe, shade = null) {
  const pos = new Float32Array(rows * cols * 3), uv = new Float32Array(rows * cols * 2), color = new Float32Array(rows * cols * 3).fill(1), index = []
  for (let i = 0; i < rows * cols; i++) { pos.set(points[i], i * 3); uv.set(uvs[i], i * 2); if (shade) color.fill(shade[i], i * 3, i * 3 + 3) }
  for (let r = 0; r < rows - 1; r++) for (let c = 0; c < cols - 1; c++) {
    const a = r * cols + c, b = a + 1, d = a + cols, e = d + 1
    index.push(a, d, b, b, d, e)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  geometry.setAttribute('color', new THREE.BufferAttribute(color, 3))
  geometry.setIndex(index)
  geometry.computeVertexNormals()
  if (outwardProbe) {
    const [i, direction] = outwardProbe, n = geometry.getAttribute('normal')
    if (n.getX(i) * direction[0] + n.getY(i) * direction[1] + n.getZ(i) * direction[2] < 0) {
      const ix = geometry.index.array
      for (let k = 0; k < ix.length; k += 3) { const t = ix[k + 1]; ix[k + 1] = ix[k + 2]; ix[k + 2] = t }
      geometry.computeVertexNormals()
    }
  }
  return geometry
}

const smooth = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t)
const spread = (from, to, n, ease = t => t) => Array.from({length: n + 1}, (_, i) => from + (to - from) * ease(i / n))

// ---- drape -------------------------------------------------------------------------------------------------------------
/**
 * The surface of cloth lying on a mattress and falling over its rounded edges, as a function of "unfolded" cloth coordinates.
 * mattress: {x0, x1, z0, z1, top, edge} (plan outline, top height, edge radius). gap: cloth half-thickness above the mattress.
 * point(s, a, lift, options) -> {p:[x,y,z], n:[x,y,z]}:
 *   s  across the bed (z), measured as cloth from the centre line: |s| up to the flat top's edge is flat, beyond it the cloth
 *      wraps the edge (radius edge + gap + lift) and hangs straight down.
 *   a  along the bed (x): the x of the flat top when a >= 0 ... or foot overhang when footExcess > 0.
 * The corner where a side and the foot both fall is wrapped radially (like a tablecloth); the surplus cloth there becomes
 * folds. Folds and the duvet's loft are added by the caller through `relief`.
 */
export function createDrape({x0, x1, z0, z1, top, edge}, gap, limit = Infinity) {
  const fx0 = x0 + edge, fz0 = z0 + edge, fz1 = z1 - edge, cy = top - edge
  return function point(s, x, lift, footExcess = 0) {
    const R = edge + gap + lift
    const zc = Math.min(fz1, Math.max(fz0, s)), ds = s > fz1 ? s - fz1 : s < fz0 ? fz0 - s : 0, sign = s < fz0 ? -1 : 1
    const xc = Math.max(fx0, x), du = Math.max(0, footExcess) + Math.max(0, fx0 - x)
    const d0 = Math.hypot(ds, du), d = Math.min(d0, limit)
    if (d < 1e-9) return {p: [xc, cy + R, zc], n: [0, 1, 0], drop: 0, dir: [0, 0], corner: 0}
    const dirX = -du / d0, dirZ = sign * ds / d0, theta = d / R
    let h, y, nx, ny
    if (theta <= Math.PI / 2) { h = R * Math.sin(theta); y = cy + R * Math.cos(theta); nx = Math.sin(theta); ny = Math.cos(theta) }
    else { h = R; y = cy - (d - R * Math.PI / 2); nx = 1; ny = 0 }
    return {p: [xc + dirX * h, y, zc + dirZ * h], n: [dirX * nx, ny, dirZ * nx], drop: Math.max(0, cy + R - y), dir: [dirX, dirZ],
      corner: ds > 0 && du > 0 ? Math.atan2(ds, du) : -1}
  }
}

/**
 * A duvet: lies on the mattress from the foot (falling over it) to `foldX`, turns back on itself (fold radius = its own
 * half-thickness) and lies doubled for `bandMetres` toward the foot. Sides fall `drop` metres of cloth (left = -z, right = +z),
 * the foot `footDrop`. Returns {geometry, hem (open polyline of Vector3), bandHem, surface(s, x) -> top surface point}.
 * Folds: vertical folds in the hanging cloth (amplitude grows with the drop), soft folds gathering at the foot corners, a
 * gentle loft and two long shallow creases on top. Everything is deterministic (same bed, same folds).
 */
export function createDuvet({mattress, gap = .012, drop = {left: .16, right: .16}, footDrop = .16, foldX = null, bandMetres = .3, seed = 1, folds = 1}) {
  // Cloth beyond 1.1 x the longest fall (only at the foot corners) gathers at the hem instead of hanging lower.
  const point = createDrape(mattress, gap, Math.max(drop.left, drop.right, footDrop) * 1.1), {x0, x1, z0, z1, edge} = mattress
  const thick = gap, fx0 = x0 + edge, fz0 = z0 + edge, fz1 = z1 - edge, width = z1 - z0
  const ph = k => hash(seed * 13 + k) * Math.PI * 2
  // Rows: foot fall, flat top, the turn-back arc, the doubled band.
  const rows = []
  const foot = spread(footDrop, 0, footDrop > 0 ? 5 : 0, t => 1 - (1 - t) ** 1.4).slice(0, -1)
  for (const e of foot) rows.push({x: fx0, foot: e, lift: 0, a: -e})
  const turned = foldX !== null && foldX < x1 - edge
  const flatEnd = turned ? foldX : x1 - edge
  for (const x of spread(fx0, flatEnd, Math.max(8, Math.round((flatEnd - fx0) / .06)))) rows.push({x, foot: 0, lift: 0, a: x - fx0})
  if (turned) {
    for (let k = 1; k <= 5; k++) { const t = k / 5 * Math.PI; rows.push({x: foldX + thick * Math.sin(t), foot: 0, lift: thick * (1 - Math.cos(t)), a: foldX - fx0 + thick * t, arc: true}) }
    for (const x of spread(foldX, foldX - bandMetres, 6).slice(1)) rows.push({x, foot: 0, lift: 2 * thick, a: foldX - fx0 + thick * Math.PI + (foldX - x), band: true})
  }
  // Columns: left fall, flat top, right fall (cloth arc length across).
  const cols = [...spread(fz0 - drop.left, fz0, drop.left > 0 ? 5 : 0, t => 1 - (1 - t) ** 1.4).slice(0, -1), ...spread(fz0, fz1, Math.max(6, Math.round((fz1 - fz0) / .08))), ...spread(fz1, fz1 + drop.right, drop.right > 0 ? 5 : 0, t => t ** (1 / 1.4)).slice(1)]
  const maxFall = Math.max(drop.left, drop.right, footDrop)
  const relief = (s, row, q) => {
    // Loft: fuller in the middle, settling toward the edges; soft diagonal creases. Wavelengths stay above about 4 grid
    // steps, so nothing aliases into a saw-tooth.
    const across = (s - (z0 + z1) / 2) / (width / 2), along = (row.x - x0) / (x1 - x0)
    let up = row.lift >= 2 * thick - 1e-9 && !row.arc ? .002 : 0
    if (q.drop === 0) up += .011 * Math.max(0, 1 - across * across) ** .6 + .004 * Math.sin(across * 4.3 + along * 3.1 + ph(1)) * Math.sin(along * 6.2 - across * 1.7 + ph(2)) + .0025 * Math.sin(along * 11 + across * 2.4 + ph(3))
    // Falls: soft vertical folds that open up toward the hem (cloth may swing up to 7 mm in toward the mattress side, which
    // is 12 mm inside the hanging cloth, and out by the amplitude); at the foot corners the surplus cloth gathers.
    let out = 0
    if (q.drop > 0) {
      const g = smooth(q.drop / (maxFall * .9))
      const t = Math.abs(q.dir[1]) >= Math.abs(q.dir[0]) ? row.x : s // along the edge the cloth hangs from
      const wave = q.corner >= 0
        ? .25 + .75 * Math.sin(q.corner * 4 + ph(4))
        : .65 * Math.sin(t * 14.5 + ph(5)) + .35 * Math.sin(t * (t === s ? 18 : 23) + ph(6))
      out = Math.max(-.007, folds * (q.corner >= 0 ? .018 : .012) * g * wave * (row.band ? .5 : 1))
    }
    return {up, out}
  }
  const points = [], uvs = [], shade = [], surfaceRows = []
  rows.forEach((row, ri) => {
    const line = []
    for (const s of cols) {
      const q = point(s, row.x, row.lift, row.foot), r = relief(s, row, q)
      const p = [q.p[0] + q.dir[0] * r.out + q.n[0] * r.up, q.p[1] + q.n[1] * r.up, q.p[2] + q.dir[1] * r.out + q.n[2] * r.up]
      points.push(p); uvs.push([s, row.a]); line.push(p)
      // Darker in the valleys of the folds, toward the hem and in the throat of the turn-down (under the doubled band).
      const valley = q.drop > 0 ? smooth(1 - (r.out + .007) / .02) * .1 : 0
      const throat = turned && ri < rows.length - 1 && row.lift === 0 && foldX - row.x < .05 ? (1 - (foldX - row.x) / .05) * .12 : 0
      shade.push(1 - valley - smooth(q.drop / maxFall) * .06 - throat)
    }
    surfaceRows.push(line)
  })
  const nCols = cols.length, nRows = rows.length, probe = Math.floor(nRows / 2) * nCols + Math.floor(nCols / 2)
  const geometry = gridGeometry(points, uvs, nRows, nCols, [probe, [0, 1, 0]], shade)
  // Hems: down the left fall edge, across the foot, up the right fall edge; and the free end of the turned-back band.
  const v = p => new THREE.Vector3(...p)
  const hem = [...surfaceRows.map(line => line[0]).reverse(), ...surfaceRows[0].slice(1, -1), ...surfaceRows.map(line => line[nCols - 1])].map(v)
  const bandHem = turned ? surfaceRows[nRows - 1].map(v) : null
  /** Height of the duvet's upper face at (x, z) on the flat top (for things laid on it). */
  const surface = (s, x, extra = 0) => {
    const row = {x, foot: 0, lift: extra}, q = point(s, x, extra, 0), r = relief(s, row, q)
    return {p: [q.p[0] + q.dir[0] * r.out + q.n[0] * r.up, q.p[1] + q.n[1] * r.up, q.p[2] + q.dir[1] * r.out + q.n[2] * r.up], n: q.n}
  }
  return {geometry, hem, bandHem, surface, point, relief, rows: nRows, cols: nCols}
}

/**
 * A folded throw lying across the bed over the duvet: a band from xFrom to xTo (along the bed) whose ends fall `drop` metres
 * over the sides ({left, right} metres of cloth), following the duvet below (`under`, from createDuvet) at `lift` above it.
 * Returns {geometry, hem}.
 */
export function createThrow({under, mattress, xFrom, xTo, drop = {left: .1, right: .1}, lift = .016, seed = 3}) {
  const {z0, z1, edge} = mattress, fz0 = z0 + edge, fz1 = z1 - edge
  const fall = (from, to, n, ease) => n ? spread(from, to, n, ease) : [from]
  const cols = [...fall(fz0 - drop.left, fz0, drop.left > 0 ? 4 : 0, t => 1 - (1 - t) ** 1.4).slice(0, -1), ...spread(fz0, fz1, 12), ...fall(fz1, fz1 + drop.right, drop.right > 0 ? 4 : 0, t => t ** (1 / 1.4)).slice(1)]
  const rows = spread(xFrom, xTo, 8), points = [], uvs = [], shade = []
  for (const x of rows) for (const s of cols) {
    // Over the duvet's own surface (with its loft and folds), pushed out along the wrap normal by `lift`.
    const q = under.point(s, x, 0, 0), r = under.relief(s, {x, foot: 0, lift: 0}, q)
    const crumple = .003 * Math.sin(s * 19 + x * 7 + seed) * smooth(q.drop / .05)
    const k = lift + crumple
    points.push([q.p[0] + q.dir[0] * r.out + q.n[0] * (r.up + k), q.p[1] + q.n[1] * (r.up + k), q.p[2] + q.dir[1] * r.out + q.n[2] * (r.up + k)])
    uvs.push([x, s]) // knit ribs run down the fall, across the bed
    shade.push(1 - smooth(q.drop / .1) * .08)
  }
  const nCols = cols.length, nRows = rows.length
  const geometry = gridGeometry(points, uvs, nRows, nCols, [Math.floor(nRows / 2) * nCols + Math.floor(nCols / 2), [0, 1, 0]], shade)
  const at = (r, c) => new THREE.Vector3(...points[r * nCols + c])
  const hem = [...Array.from({length: nCols}, (_, c) => at(0, c)), ...Array.from({length: nRows - 2}, (_, r) => at(r + 1, nCols - 1)), ...Array.from({length: nCols}, (_, c) => at(nRows - 1, nCols - 1 - c)), ...Array.from({length: nRows - 2}, (_, r) => at(nRows - 2 - r, 0))]
  return {geometry, hem} // hem is a closed loop
}

/**
 * A pillow lying flat: plan length `length` (x) by `width` (z), crowned to `height`, its seam at `seamHeight` above the
 * bottom, the sides pulled in between the corners, a shallow dent where a head lies (`dent`, metres). Bottom rests on y = 0.
 * About 380 triangles.
 */
export function pillowGeometry({length, width, height, seamHeight = .03, pinch = .05, dent = .012, seed = 2, nu = 12, nv = 8}) {
  const ph = k => hash(seed * 7 + k) * Math.PI * 2
  const us = spread(-1, 1, nu, t => -Math.cos(Math.PI * t) * .5 + .5), vs = spread(-1, 1, nv, t => -Math.cos(Math.PI * t) * .5 + .5)
  const crown = (u, v) => Math.max(0, (1 - Math.abs(u) ** 2.2)) ** .8 * Math.max(0, (1 - Math.abs(v) ** 2.2)) ** .8
  const outline = (u, v) => [u * length / 2 * (1 - pinch * (1 - v * v)), v * width / 2 * (1 - pinch * .8 * (1 - u * u))]
  const half = upper => {
    const pts = [], uv = [], shade = []
    for (const u of us) for (const v of vs) {
      const [x, z] = outline(u, v), f = crown(u, v)
      const wrinkle = .004 * Math.sin(u * 4.2 + v * 2.1 + ph(1)) * f + .003 * Math.sin(v * 6.5 - u * 1.7 + ph(2)) * f
      const y = upper
        ? seamHeight + (height - seamHeight) * f - dent * Math.exp(-((u + .1) ** 2 / .18 + v * v / .25)) + wrinkle
        : seamHeight * (1 - f ** .35)
      pts.push([x, y, z]); uv.push([x, z])
      // A little darker toward the seam and underneath, so a white pillow keeps its shape in bright light.
      shade.push(upper ? .8 + .2 * Math.sqrt(f) : .72)
    }
    return gridGeometry(pts, uv, us.length, vs.length, [Math.floor(us.length / 2) * vs.length + Math.floor(vs.length / 2), [0, upper ? 1 : -1, 0]], shade)
  }
  return mergeGeometries([half(true), half(false)])
}

/**
 * Merge geometries (indexed or not; position, normal, uv, and a grey vertex colour that defaults to white) into one indexed
 * geometry, so pieces sharing a material are one draw call. An entry may be [geometry, matrix] to bake a placement in. The
 * inputs are disposed.
 */
export function mergeGeometries(list) {
  const names = ['position', 'normal', 'uv'], out = {position: [], normal: [], uv: [], color: []}, index = []
  let offset = 0, colours = false
  for (const entry of list) {
    const [source, matrix] = Array.isArray(entry) ? entry : [entry, null]
    const g = matrix ? source.clone().applyMatrix4(matrix) : source
    for (const name of names) { const array = g.getAttribute(name).array; for (let i = 0; i < array.length; i++) out[name].push(array[i]) }
    const count = g.getAttribute('position').count, color = g.getAttribute('color')
    colours ||= !!color
    for (let i = 0; i < count * 3; i++) out.color.push(color ? color.array[i] : 1)
    if (g.index) for (const i of g.index.array) index.push(i + offset)
    else for (let i = 0; i < count; i++) index.push(i + offset)
    offset += count
    g.dispose(); if (g !== source) source.dispose()
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(out.position, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(out.normal, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(out.uv, 2))
  if (colours) geometry.setAttribute('color', new THREE.Float32BufferAttribute(out.color, 3))
  geometry.setIndex(index)
  return geometry
}

/** Triangles in a geometry (for budgets and tests). */
export const triangleCount = geometry => (geometry.index ? geometry.index.count : geometry.getAttribute('position').count) / 3
