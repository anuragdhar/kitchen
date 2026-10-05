import * as THREE from 'three'

// Procedural fabric surface maps, generated once at build time from a fixed seed (no image files, no DOM: they are
// DataTextures, so the builders also run in the Node tests). A woven upholstery cloth and a short wool pile, each as a
// tileable set of
//   map          a near-white tone map (sRGB) that the material colour multiplies: thread tops lighter, gaps darker;
//   normalMap    the weave relief (linear data);
//   roughnessMap thread tops a touch smoother than the gaps (linear data, green channel as three.js reads it).
// The maps are shared by every material that asks for the same kind (cached), so each is uploaded to the graphics card once.
// The material's own `color` is the owner's colour; the maps only add texture, so the hue does not change.

const cache = new Map()

// Small deterministic random generator (mulberry32), so every build draws the same cloth.
function random(seed) {
  let a = seed >>> 0
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

// Periodic 1-D value noise: `period` random values, smoothly interpolated, wrapping round.
function periodicNoise(period, rand) {
  const values = Array.from({length: period}, rand)
  return x => {
    const i = Math.floor(x), f = x - i, s = f * f * (3 - 2 * f)
    const a = values[((i % period) + period) % period], b = values[(((i + 1) % period) + period) % period]
    return a + (b - a) * s
  }
}

function dataTexture(data, size, colorSpace) {
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.UnsignedByteType)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.magFilter = THREE.LinearFilter; texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.generateMipmaps = true; texture.anisotropy = 4
  texture.colorSpace = colorSpace
  texture.needsUpdate = true
  return texture
}

// Height field (0..1, size x size, tileable) -> tone, normal and roughness textures.
function mapsFromHeight(height, size, {tone, roughness, relief, toneVariation}) {
  const toneData = new Uint8Array(size * size * 4), normalData = new Uint8Array(size * size * 4), roughData = new Uint8Array(size * size * 4)
  const at = (x, y) => height[((y + size) % size) * size + ((x + size) % size)]
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = y * size + x, h = height[i], o = i * 4
    const dx = (at(x + 1, y) - at(x - 1, y)) * relief, dy = (at(x, y + 1) - at(x, y - 1)) * relief
    const l = Math.hypot(dx, dy, 1)
    normalData[o] = Math.round((-dx / l * .5 + .5) * 255); normalData[o + 1] = Math.round((-dy / l * .5 + .5) * 255); normalData[o + 2] = Math.round((1 / l * .5 + .5) * 255); normalData[o + 3] = 255
    const t = Math.round(255 * Math.min(1, tone[0] + (tone[1] - tone[0]) * h + (toneVariation ? toneVariation[i] : 0)))
    toneData[o] = toneData[o + 1] = toneData[o + 2] = t; toneData[o + 3] = 255
    const r = Math.round(255 * (roughness[0] + (roughness[1] - roughness[0]) * h))
    roughData[o] = roughData[o + 1] = roughData[o + 2] = r; roughData[o + 3] = 255
  }
  return {
    map: dataTexture(toneData, size, THREE.SRGBColorSpace),
    normalMap: dataTexture(normalData, size, THREE.NoColorSpace),
    roughnessMap: dataTexture(roughData, size, THREE.NoColorSpace),
  }
}

// Plain-weave upholstery cloth (a linen/cotton blend look): `threads` warp and weft threads per tile, each thread a rounded
// ridge that rises where it passes over the crossing thread and dips where it passes under; threads vary slightly in
// thickness along their length (slubs) and in tone.
function wovenCloth({size = 256, threads = 32, seed = 7} = {}) {
  const rand = random(seed), pitch = size / threads
  const warpSlub = Array.from({length: threads}, () => periodicNoise(8, rand)), weftSlub = Array.from({length: threads}, () => periodicNoise(8, rand))
  const warpTone = Array.from({length: threads}, () => rand() - .5), weftTone = Array.from({length: threads}, () => rand() - .5)
  const height = new Float32Array(size * size), toneVariation = new Float32Array(size * size)
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = Math.floor(x / pitch), j = Math.floor(y / pitch), fx = x / pitch - i, fy = y / pitch - j
    const warpOver = (i + j) % 2 === 0
    const warpWidth = .82 + .18 * warpSlub[i](y / size * 8), weftWidth = .82 + .18 * weftSlub[j](x / size * 8)
    const across = (f, w) => Math.max(0, Math.sin(Math.PI * Math.min(1, Math.max(0, (f - (1 - w) / 2) / w)))) ** .6
    const warp = across(fx, warpWidth) * (warpOver ? .55 + .45 * Math.sin(Math.PI * fy) : .35 * (1 - .5 * Math.sin(Math.PI * fy)))
    const weft = across(fy, weftWidth) * (!warpOver ? .55 + .45 * Math.sin(Math.PI * fx) : .35 * (1 - .5 * Math.sin(Math.PI * fx)))
    const k = y * size + x
    height[k] = Math.max(warp, weft) * (.92 + .08 * rand())
    toneVariation[k] = .02 * (warp >= weft ? warpTone[i] : weftTone[j])
  }
  // Tone stays close to white (sRGB .92-1) so the owner's colour is darkened only slightly on average.
  return mapsFromHeight(height, size, {tone: [.92, 1], roughness: [.98, .86], relief: 2.2, toneVariation})
}

// Short cut wool pile: soft random tufts, blurred so they read as pile rather than grit.
function woolPile({size = 128, seed = 11} = {}) {
  const rand = random(seed)
  let height = Float32Array.from({length: size * size}, rand)
  for (let pass = 0; pass < 2; pass++) {
    const next = new Float32Array(size * size)
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      let sum = 0
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) sum += height[((y + dy + size) % size) * size + ((x + dx + size) % size)]
      next[y * size + x] = sum / 9
    }
    height = next
  }
  let lo = Infinity, hi = -Infinity
  for (const h of height) { lo = Math.min(lo, h); hi = Math.max(hi, h) }
  height = height.map(h => (h - lo) / (hi - lo || 1))
  return mapsFromHeight(height, size, {tone: [.9, 1], roughness: [1, .9], relief: 3})
}

const KINDS = {woven: wovenCloth, pile: woolPile}

/** The shared maps of one kind: 'woven' (upholstery) or 'pile' (rug). Do not dispose them; they are reused. */
export function fabricMaps(kind = 'woven') {
  if (!cache.has(kind)) cache.set(kind, KINDS[kind]())
  return cache.get(kind)
}

/**
 * A fabric material in the owner's colour. tileMetres: size of one repeat of the weave on the furniture (the geometry's UVs
 * are in metres). sheen: the soft bright rim fabric shows at grazing angles (0 = none). vertexColors: colour per vertex
 * (several cushions in one mesh) instead of `color`. Maps are shared; each material gets its own UV scale.
 */
export function fabricMaterial({color = '#ffffff', kind = 'woven', tileMetres = .05, sheen = .5, sheenColor = '#fff4e2', sheenRoughness = .7, normalStrength = .35, vertexColors = false, name = 'fabric'} = {}) {
  const maps = fabricMaps(kind), scaled = {}
  for (const [key, texture] of Object.entries(maps)) {
    const copy = texture.clone() // shares the image (and its upload); own repeat only
    copy.repeat.set(1 / tileMetres, 1 / tileMetres)
    scaled[key] = copy
  }
  const material = new THREE.MeshPhysicalMaterial({
    name, color: vertexColors ? '#ffffff' : color, vertexColors, roughness: 1, metalness: 0,
    map: scaled.map, normalMap: scaled.normalMap, normalScale: new THREE.Vector2(normalStrength, normalStrength), roughnessMap: scaled.roughnessMap,
    sheen, sheenColor: new THREE.Color(sheenColor), sheenRoughness,
  })
  material.userData.fabric = kind
  return material
}
