import * as THREE from 'three'
import {softBoxGeometry} from './softForms.js'
import {fabricMaps} from './fabric.js'

// A wool rug: a thin slab with a rounded, bound pile edge, a short-pile surface and a soft woven pattern (border band, a
// fine guard stripe, and a faint lattice in the field) drawn procedurally in the owner's two colours. Units: millimetres
// in the spec, metres in the model. The rug is centred on the origin, lying on y = 0, widthMm along x and lengthMm along
// z, heightMm thick (its top). It is decor: the group carries userData.archvizExclude, as the flat rug did.

const patterns = new Map()

const linear = hex => { const c = new THREE.Color(hex); return [c.r, c.g, c.b] } // THREE.Color holds linear values
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) }
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t)

// Colours are blended in linear light and written as sRGB bytes (the map is tagged sRGB).
function patternTexture(W, L, {border, field, borderMm}) {
  const key = JSON.stringify([W, L, border, field, borderMm])
  if (patterns.has(key)) return patterns.get(key)
  const width = 512, height = Math.max(4, Math.round(width * L / W / 4) * 4)
  const data = new Uint8Array(width * height * 4)
  const B = linear(border), F = linear(field)
  const lattice = mix(F, B, .28), guard = mix(F, [1, .92, .8], .35), motif = mix(F, B, .55)
  const toByte = v => Math.round(255 * Math.min(1, Math.max(0, v <= .0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - .055)))
  const bw = borderMm / 1000, cell = .36
  for (let j = 0; j < height; j++) for (let i = 0; i < width; i++) {
    const x = (i + .5) / width * W, z = (j + .5) / height * L
    const edge = Math.min(x, W - x, z, L - z), soft = W / width * 1.2
    let c = F
    // Field lattice: diamonds of about `cell` metres, soft-edged lines, a small motif at each crossing.
    const u = (x - W / 2) / cell, v = (z - L / 2) / cell
    const d1 = Math.abs(((u + v) % 1 + 1) % 1 - .5), d2 = Math.abs(((u - v) % 1 + 1) % 1 - .5)
    const line = Math.max(smooth(.47, .5, d1), smooth(.47, .5, d2)) * .7
    c = mix(c, lattice, line)
    const cu = Math.abs(((u + v + .5) % 1 + 1) % 1 - .5), cv = Math.abs(((u - v + .5) % 1 + 1) % 1 - .5)
    c = mix(c, motif, (1 - smooth(.06, .1, Math.hypot(cu, cv))) * .6)
    // Guard stripe just inside the border, then the border band.
    c = mix(c, guard, smooth(bw + .012 - soft, bw + .012, edge) * (1 - smooth(bw + .028, bw + .028 + soft, edge)))
    c = mix(c, B, 1 - smooth(bw - soft, bw + soft, edge))
    // Abrash: slow tonal bands along the length, as in a hand-knotted rug.
    const band = 1 + .035 * Math.sin(z * 2.1 + Math.sin(z * .7) * 2) + .015 * Math.sin(x * 5.3)
    const o = (j * width + i) * 4
    data[o] = toByte(c[0] * band); data[o + 1] = toByte(c[1] * band); data[o + 2] = toByte(c[2] * band); data[o + 3] = 255
  }
  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.UnsignedByteType)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.magFilter = THREE.LinearFilter; texture.minFilter = THREE.LinearMipmapLinearFilter; texture.generateMipmaps = true
  texture.anisotropy = 4
  // The rug's UVs are metres from its centre: scale them onto the 0..1 picture.
  texture.repeat.set(1 / W, 1 / L); texture.offset.set(.5, .5)
  texture.needsUpdate = true
  patterns.set(key, texture)
  return texture
}

/**
 * widthMm x lengthMm rug, heightMm thick. colours: {border, field} (the owner's rug colours). borderMm: border band width.
 * Returns a Group named 'rug' (archvizExclude) holding one mesh; position it with the group.
 */
export function createRug({widthMm, lengthMm, heightMm = 15, colours = {border: '#8f4f34', field: '#b98058'}, borderMm = 80}) {
  const W = widthMm / 1000, L = lengthMm / 1000, H = heightMm / 1000
  const geometry = softBoxGeometry({width: W, height: H, depth: L, radius: H / 2, arc: 3, inner: [1, 0, 1], uv: 'planarY'}).translate(0, H / 2, 0)
  const pile = fabricMaps('pile'), tile = .03
  const normalMap = pile.normalMap.clone(), roughnessMap = pile.roughnessMap.clone()
  normalMap.repeat.set(1 / tile, 1 / tile); roughnessMap.repeat.set(1 / tile, 1 / tile)
  const material = new THREE.MeshPhysicalMaterial({
    name: 'rug wool', color: '#ffffff', map: patternTexture(W, L, {...colours, borderMm}), roughness: 1, roughnessMap, normalMap,
    normalScale: new THREE.Vector2(.6, .6), sheen: .45, sheenColor: new THREE.Color('#ffe2c4'), sheenRoughness: .8,
  })
  const group = new THREE.Group(); group.name = 'rug'; group.userData.archvizExclude = true
  const mesh = new THREE.Mesh(geometry, material); mesh.name = 'rug pile'; mesh.receiveShadow = true
  group.add(mesh)
  return group
}
