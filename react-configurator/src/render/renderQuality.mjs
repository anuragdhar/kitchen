// Render quality levels and lamp colour for the live 3D views. Pure: no Three.js, React or DOM (the preference helpers only
// touch localStorage when it exists), so the choices are testable in Node (tests/render-quality.test.mjs).
import {kelvinRgb} from '../home/lighting.mjs'

// One switch for every live view (render/RenderQualityControls.jsx), remembered across reloads. 'auto' picks a level from
// the graphics card the browser reports (autoQuality below).
export const QUALITY_KEY = 'home-interior.render-quality.v1'
export const QUALITY_CHOICES = Object.freeze(['auto', 'draft', 'standard', 'high'])

// What each level spends. pixelRatioMax caps the canvas resolution against the screen's device pixel ratio; msaa is the
// multisample count of the post-processing buffer (it is what keeps edges smooth once ambient occlusion is on); shadowMapSize
// and shadowRadius are the sun's shadow map (fitted to the room, so 2048 is already about 3 mm per texel in one room);
// aoSamples/denoiseSamples are the ambient-occlusion sample counts; anisotropy is the texture filtering for floors and walls
// seen at a grazing angle; contactShadows lets the furniture cast sun shadows (render/liveView.js).
export const QUALITY = Object.freeze({
  draft: Object.freeze({label: 'Draft', pixelRatioMax: 1, msaa: 0, shadowMapSize: 1024, shadowRadius: 2, aoSamples: 8, denoiseSamples: 8, anisotropy: 4, contactShadows: false}),
  standard: Object.freeze({label: 'Standard', pixelRatioMax: 1.5, msaa: 4, shadowMapSize: 2048, shadowRadius: 3, aoSamples: 12, denoiseSamples: 12, anisotropy: 8, contactShadows: true}),
  high: Object.freeze({label: 'High', pixelRatioMax: 2, msaa: 4, shadowMapSize: 4096, shadowRadius: 4, aoSamples: 16, denoiseSamples: 16, anisotropy: 16, contactShadows: true}),
})

/**
 * Level for 'auto' from what the browser reports. A discrete desktop GPU gets High; integrated graphics, a software
 * renderer, a phone-sized screen or a small texture limit get Standard or Draft. Unknown hardware gets Standard.
 * gpu: the WEBGL_debug_renderer_info string (may be empty), maxTextureSize: gl.MAX_TEXTURE_SIZE, cores: hardwareConcurrency.
 */
export function autoQuality({gpu = '', maxTextureSize = 4096, cores = 4, screenWidth = 1920} = {}) {
  const name = String(gpu).toLowerCase()
  if (/swiftshader|llvmpipe|software|microsoft basic render/.test(name)) return 'draft'
  if (maxTextureSize < 4096 || screenWidth < 700) return 'draft'
  const discrete = /(radeon\s*(rx|pro)|geforce|rtx|gtx|quadro|nvidia|arc\s*a\d)/.test(name) && !/radeon\(tm\)\s*graphics|vega\s*\d+\s*graphics/.test(name)
  if (discrete && maxTextureSize >= 8192 && cores >= 4) return 'high'
  if (/apple m\d/.test(name) && maxTextureSize >= 8192) return 'high'
  return 'standard'
}

export function resolveQuality(choice, probe) {
  return QUALITY[choice] ? choice : autoQuality(probe)
}

export function readQualityChoice() {
  try { const value = globalThis.localStorage?.getItem(QUALITY_KEY); return QUALITY_CHOICES.includes(value) ? value : 'auto' } catch { return 'auto' }
}
export function writeQualityChoice(choice) {
  if (!QUALITY_CHOICES.includes(choice)) throw new Error(`Unknown render quality: ${choice}`)
  try { globalThis.localStorage?.setItem(QUALITY_KEY, choice) } catch {}
}

// Live views subscribe, so changing the switch on one page applies to whichever view is open.
const listeners = new Set()
export const subscribeQuality = listener => { listeners.add(listener); return () => listeners.delete(listener) }
export function setQualityChoice(choice) { writeQualityChoice(choice); listeners.forEach(listener => listener(choice)) }

// LAMP COLOUR. The live views had no white balance: every lamp was drawn with a hand-picked warm tint (#ffd9a8 and
// neighbours), whatever its Kelvin, so the 4000 K kitchen track looked as warm as the 3000 K bedrooms, and the Interior
// studio overlay converted Kelvin to RGB with daylight (6500 K) as white, which made its 4500 K "day" light peach.
// lampColour() renders a colour temperature as a camera white-balanced to LAMP_WHITE_KELVIN would: 3000 K stays a warm
// white close to the old tint, 4000 K is a neutral, very slightly warm white, 4500 K is white and 2700 K is warmer.
// The ratio is taken in linear light (where light adds), then normalised so the brightest channel is 1 (intensity is set
// separately on the light).
export const LAMP_WHITE_KELVIN = 4500
const toLinear = c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4
const toSrgb = c => c <= .0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - .055

/** Linear-light RGB (0-1, brightest channel 1) of a lamp of `kelvin`, white-balanced to LAMP_WHITE_KELVIN. */
export function lampLinear(kelvin, whiteKelvin = LAMP_WHITE_KELVIN) {
  const lamp = kelvinRgb(kelvin).map(toLinear), white = kelvinRgb(whiteKelvin).map(toLinear)
  const ratio = lamp.map((value, i) => value / Math.max(white[i], 1e-6)), top = Math.max(...ratio)
  return ratio.map(value => value / top)
}

/** The same colour as an sRGB hex string, for THREE.Color.set(). */
export function lampColour(kelvin, whiteKelvin = LAMP_WHITE_KELVIN) {
  return '#' + lampLinear(kelvin, whiteKelvin).map(value => Math.round(Math.min(1, Math.max(0, toSrgb(value))) * 255).toString(16).padStart(2, '0')).join('')
}
