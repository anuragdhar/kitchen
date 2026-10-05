import * as THREE from 'three'

// Soft upholstery forms built procedurally (no downloaded models): rounded and crowned boxes for frames and cushions, knife-edge
// scatter cushions, piping tubes, tapered legs. Units are metres; every function returns a fresh BufferGeometry the caller
// owns (dispose it, or cache and share it between identical pieces). Pure geometry: no materials, no DOM.
//
// softBoxGeometry: a box of size width (x) x height (y) x depth (z), centred on the origin, whose edges and corners are
// rounded with `radius` and whose faces can bulge outwards ("crown") by a few millimetres in the middle, as a filled cushion
// does. The rounding is exact (vertices are spaced at equal angles round each edge, so curves are not faceted); the crown
// fades to nothing at the edges, so the outer size stays width x height x depth except on crowned faces, which grow by
// their crown. UVs are in metres (a texture with repeat 1/tile tiles every `tile` metres), so fabric is never stretched.

const FACES = [
  // axis, sign, u axis, v axis (u x v points outward for sign +1)
  {key: 'px', a: 0, s: 1, u: 1, v: 2}, {key: 'nx', a: 0, s: -1, u: 1, v: 2},
  {key: 'py', a: 1, s: 1, u: 2, v: 0}, {key: 'ny', a: 1, s: -1, u: 2, v: 0},
  {key: 'pz', a: 2, s: 1, u: 0, v: 1}, {key: 'nz', a: 2, s: -1, u: 0, v: 1},
]

// Coordinates along one axis from -h to +h: `arc` steps round each rounded edge (equal angles once projected), `inner` steps
// across the flat middle.
function axisCoordinates(h, r, arc, inner) {
  const c = Math.max(0, h - r), out = []
  const onArc = k => c + r * Math.tan(k / arc * Math.PI / 4)
  for (let k = arc; k >= 1; k--) out.push(-onArc(k))
  if (c > 1e-9) for (let i = 0; i <= inner; i++) out.push(-c + 2 * c * i / Math.max(1, inner))
  else out.push(0)
  for (let k = 1; k <= arc; k++) out.push(onArc(k))
  return out
}

/** Averages normals of vertices that share a position (face seams), so a soft surface shades without creases. */
export function smoothSeams(geometry, precision = 1e5) {
  const pos = geometry.attributes.position, nor = geometry.attributes.normal, sums = new Map(), keys = []
  for (let i = 0; i < pos.count; i++) {
    const key = `${Math.round(pos.getX(i) * precision)},${Math.round(pos.getY(i) * precision)},${Math.round(pos.getZ(i) * precision)}`
    keys.push(key)
    const sum = sums.get(key) ?? [0, 0, 0]
    sum[0] += nor.getX(i); sum[1] += nor.getY(i); sum[2] += nor.getZ(i); sums.set(key, sum)
  }
  for (let i = 0; i < pos.count; i++) {
    const [x, y, z] = sums.get(keys[i]), l = Math.hypot(x, y, z) || 1
    nor.setXYZ(i, x / l, y / l, z / l)
  }
  nor.needsUpdate = true
  return geometry
}

/**
 * Rounded, optionally crowned box.
 * width/height/depth: outer size before crown. radius: edge rounding (clamped to half the smallest side).
 * arc: steps per 45 degrees of rounding. inner: [x, y, z] steps across each flat middle (more where a face is crowned).
 * crown: {px, nx, py, ny, pz, nz} outward bulge in metres at the middle of that face.
 * skip: face keys not to build (hidden faces, for example the underside of a seat cushion on its deck).
 * uv: 'faces' (each face mapped flat in metres) or 'planarY' (everything mapped from above, x and z in metres).
 */
export function softBoxGeometry({width, height, depth, radius = .03, arc = 3, inner = [2, 2, 2], crown = {}, skip = [], uv = 'faces'}) {
  const half = [width / 2, height / 2, depth / 2]
  const r = Math.min(radius, ...half.map(h => h * .999))
  const coords = half.map((h, i) => axisCoordinates(h, r, arc, inner[i]))
  const core = half.map(h => Math.max(0, h - r))
  const positions = [], uvs = [], indices = []
  const p = [0, 0, 0], q = [0, 0, 0], n = [0, 0, 0]
  for (const face of FACES) {
    if (skip.includes(face.key)) continue
    const us = coords[face.u], vs = coords[face.v], base = positions.length / 3
    for (let j = 0; j < vs.length; j++) for (let i = 0; i < us.length; i++) {
      p[face.a] = face.s * half[face.a]; p[face.u] = us[i]; p[face.v] = vs[j]
      // Project onto the rounded box: nearest point of the inner core, pushed out by the radius.
      for (let k = 0; k < 3; k++) { q[k] = Math.min(core[k], Math.max(-core[k], p[k])); n[k] = p[k] - q[k] }
      const l = Math.hypot(n[0], n[1], n[2]) || 1
      for (let k = 0; k < 3; k++) { n[k] /= l; p[k] = q[k] + n[k] * r }
      const flat = [p[0], p[1], p[2]]
      // Crown: each face bulges along its own axis, most in the middle, nothing at its edges.
      for (const other of FACES) {
        const amount = crown[other.key]; if (!amount || n[other.a] * other.s <= 0) continue
        let bell = n[other.a] * n[other.a]
        for (let k = 0; k < 3; k++) if (k !== other.a) bell *= Math.max(0, 1 - (flat[k] / half[k]) ** 2)
        p[other.a] += other.s * amount * bell
      }
      positions.push(p[0], p[1], p[2])
      if (uv === 'planarY') uvs.push(flat[0], flat[2])
      else uvs.push(flat[face.u === 1 ? face.v : face.u], flat[face.u === 1 ? face.u : face.v])
    }
    const row = us.length
    for (let j = 0; j < vs.length - 1; j++) for (let i = 0; i < us.length - 1; i++) {
      const a = base + j * row + i, b = a + 1, c = a + row + 1, d = a + row
      if (face.s > 0) indices.push(a, b, c, a, c, d); else indices.push(a, c, b, a, d, c)
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return smoothSeams(geometry)
}

/**
 * A closed loop on a soft box: the seam where the face `faceKey` meets the sides, at 45 degrees round the edge (where piping
 * sits). Returns points in the box's own frame, crown included, ready for pipingGeometry. Same options as softBoxGeometry.
 */
export function softBoxSeam({width, height, depth, radius = .03, crown = {}}, faceKey, cornerSteps = 4) {
  const face = FACES.find(f => f.key === faceKey), half = [width / 2, height / 2, depth / 2]
  const r = Math.min(radius, ...half.map(h => h * .999)), core = half.map(h => Math.max(0, h - r))
  const e = Math.SQRT1_2, points = []
  // Corner centres of the loop, walking round the face counter-clockwise seen from outside.
  const corners = [[1, 1], [-1, 1], [-1, -1], [1, -1]]
  for (const [su, sv] of corners) {
    const start = Math.atan2(sv, su) - Math.PI / 4 // each corner turns a quarter circle centred on its diagonal
    for (let s = 0; s <= cornerSteps; s++) {
      const t = start + s / cornerSteps * Math.PI / 2
      const n = [0, 0, 0]
      n[face.a] = face.s * e; n[face.u] = Math.cos(t) * e; n[face.v] = Math.sin(t) * e
      const p = [0, 0, 0]
      p[face.a] = face.s * core[face.a]; p[face.u] = su * core[face.u]; p[face.v] = sv * core[face.v]
      for (let k = 0; k < 3; k++) p[k] += n[k] * r
      const flat = [...p]
      for (const other of FACES) {
        const amount = crown[other.key]; if (!amount || n[other.a] * other.s <= 0) continue
        let bell = n[other.a] * n[other.a]
        for (let k = 0; k < 3; k++) if (k !== other.a) bell *= Math.max(0, 1 - (flat[k] / half[k]) ** 2)
        p[other.a] += other.s * amount * bell
      }
      points.push(new THREE.Vector3(...p))
    }
  }
  if (face.s < 0) points.reverse()
  return points
}

/** A round tube (piping cord) along a closed loop of points. radial: sides round the tube. */
export function pipingGeometry(points, radius = .005, radial = 5) {
  const count = points.length, positions = [], normals = [], uvs = [], indices = []
  const tangent = new THREE.Vector3(), normal = new THREE.Vector3(), binormal = new THREE.Vector3(), up = new THREE.Vector3()
  // A planar-ish loop: the reference "up" is the loop's own normal (Newell's method), so rings never twist.
  for (let i = 0; i < count; i++) {
    const a = points[i], b = points[(i + 1) % count]
    up.x += (a.y - b.y) * (a.z + b.z); up.y += (a.z - b.z) * (a.x + b.x); up.z += (a.x - b.x) * (a.y + b.y)
  }
  up.normalize()
  let along = 0
  for (let i = 0; i < count; i++) {
    const prev = points[(i - 1 + count) % count], next = points[(i + 1) % count]
    tangent.subVectors(next, prev).normalize()
    binormal.crossVectors(tangent, up).normalize(); normal.crossVectors(binormal, tangent).normalize()
    if (i) along += points[i].distanceTo(points[i - 1])
    for (let k = 0; k < radial; k++) {
      const t = k / radial * Math.PI * 2, c = Math.cos(t), s = Math.sin(t)
      const nx = normal.x * c + binormal.x * s, ny = normal.y * c + binormal.y * s, nz = normal.z * c + binormal.z * s
      positions.push(points[i].x + nx * radius, points[i].y + ny * radius, points[i].z + nz * radius)
      normals.push(nx, ny, nz); uvs.push(along, k / radial * radius * Math.PI * 2)
    }
  }
  for (let i = 0; i < count; i++) for (let k = 0; k < radial; k++) {
    const a = i * radial + k, b = i * radial + (k + 1) % radial, c = ((i + 1) % count) * radial + (k + 1) % radial, d = ((i + 1) % count) * radial + k
    indices.push(a, c, d, a, b, c)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  return geometry
}

/**
 * Knife-edge scatter cushion in the x-y plane, thickness along z (front face +z): full in the middle, closing to a seam at
 * the edges, corners slightly pulled out as a filled cover does. Its outer size is width x height x thickness.
 * steps: grid steps per side (denser towards the seam).
 */
export function pillowGeometry({width, height, thickness, steps = 8, pinch = .06}) {
  const positions = [], uvs = [], indices = []
  const grid = Array.from({length: steps + 1}, (_, i) => Math.sin((i / steps * 2 - 1) * Math.PI / 2))
  const fill = t => Math.pow(Math.max(0, 1 - Math.abs(t) ** 2.4), .55)
  for (const side of [1, -1]) {
    const base = positions.length / 3
    for (let j = 0; j <= steps; j++) for (let i = 0; i <= steps; i++) {
      const u = grid[i], v = grid[j]
      const x = u * width / 2 * (1 - pinch * (1 - v * v)), y = v * height / 2 * (1 - pinch * (1 - u * u))
      positions.push(x, y, side * thickness / 2 * fill(u) * fill(v)); uvs.push(x, y)
    }
    const row = steps + 1
    for (let j = 0; j < steps; j++) for (let i = 0; i < steps; i++) {
      const a = base + j * row + i, b = a + 1, c = a + row + 1, d = a + row
      if (side > 0) indices.push(a, b, c, a, c, d); else indices.push(a, c, b, a, d, c)
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals() // the two faces keep separate normals at the seam: a crisp sewn edge
  return geometry
}

/** A slightly tapered round leg standing on y = 0, `height` tall. */
export function taperedLegGeometry({height, topRadius = .022, bottomRadius = .016, radial = 10}) {
  const geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, height, radial, 1)
  geometry.translate(0, height / 2, 0)
  return geometry
}
