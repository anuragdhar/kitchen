import * as THREE from 'three'
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js'
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js'
import {GTAOPass} from 'three/examples/jsm/postprocessing/GTAOPass.js'
import {OutputPass} from 'three/examples/jsm/postprocessing/OutputPass.js'
import {FullScreenQuad} from 'three/examples/jsm/postprocessing/Pass.js'

// "Designer render" for the live 3D views (owner request 2026-10-03: renders at an interior-designer level). It changes how
// the scene is shaded, never what is in it: no geometry, position, material choice or visibility is touched.
//  - The scene renders into a multisampled half-float buffer, so light above 1.0 survives until tone mapping.
//  - Ground-truth ambient occlusion (GTAO) darkens corners, skirting lines, the floor under furniture and the inside of
//    cabinets, which is what makes a model read as a built room instead of floating boxes.
//  - Tone mapping stays each view's own (ACES, applied once in the output pass): the lighting rigs were tuned for it. AgX and
//    Khronos Neutral were tried on 2026-10-03 and rejected: AgX greyed the wood and floors, Neutral exposed the warm rigs as pink.
// Only solid, opaque, visible surfaces feed the AO: labels, lines, translucent overlays (glass, ghosts, door swings) and
// the shadow-only ceilings (colorWrite false) are hidden from its depth/normal pass so they cannot cast dark halos.
// Those same non-solid objects (labels, ghosts, glass, door swings, measuring lines) are then drawn last, straight to the
// screen with the view's own per-material tone mapping, against the depth copied from the main pass. So
// the AO never darkens them, they are still hidden behind walls, and their translucency looks exactly as it did before
// (blending translucent colours in linear light before tone mapping made the ghosts look far more opaque).

const solid = material => material && material.visible !== false && material.colorWrite !== false && !(material.transparent && material.opacity < .95) && material.depthWrite !== false

const materialsOf = object => Array.isArray(object.material) ? object.material : [object.material]
// Drawn in the final pass: everything visible that is not a solid surface, except the invisible shadow-only ceilings.
const isOverlay = object => {
  if (!object.visible || !(object.isSprite || object.isMesh || object.isLine || object.isLine2 || object.isPoints)) return false
  const materials = materialsOf(object)
  if (materials.every(material => material && material.colorWrite === false)) return false
  // Transmission glass samples the solid scene behind it, which only the main pass has; it stays there (still kept out of the AO).
  if (materials.some(material => material?.transmission > 0)) return false
  return object.isSprite || object.isLine || object.isLine2 || object.isPoints || !materials.every(solid)
}

// The ambient occlusion is computed one sample per pixel, but the scene beside it is multisampled. On a silhouette pixel the
// two disagree (the AO belongs to either the floor or the cabinet), which drew a dotted light seam along every contact line
// and left the AO's 5x5 noise visible near edges (render-quality pass, 2026-10-05). The blend therefore reads the AO through
// a 3x3 tent filter: one pixel of softening, no visible blur.
const tentBlendShader = /* glsl */`
  uniform float intensity;
  uniform sampler2D tDiffuse;
  uniform vec2 texel;
  varying vec2 vUv;
  void main() {
    vec4 ao = texture2D( tDiffuse, vUv ) * 4.0;
    ao += ( texture2D( tDiffuse, vUv + vec2( texel.x, 0.0 ) ) + texture2D( tDiffuse, vUv - vec2( texel.x, 0.0 ) )
      + texture2D( tDiffuse, vUv + vec2( 0.0, texel.y ) ) + texture2D( tDiffuse, vUv - vec2( 0.0, texel.y ) ) ) * 2.0;
    ao += texture2D( tDiffuse, vUv + texel ) + texture2D( tDiffuse, vUv - texel )
      + texture2D( tDiffuse, vUv + vec2( texel.x, - texel.y ) ) + texture2D( tDiffuse, vUv + vec2( - texel.x, texel.y ) );
    ao /= 16.0;
    gl_FragColor = vec4( mix( vec3( 1.0 ), ao.rgb, intensity ), ao.a );
  }`

class SolidSurfaceGTAOPass extends GTAOPass {
  constructor(...args) {
    super(...args)
    this.blendMaterial.uniforms.texel = {value: new THREE.Vector2(1 / Math.max(1, this.width), 1 / Math.max(1, this.height))}
    this.blendMaterial.fragmentShader = tentBlendShader
    this.blendMaterial.needsUpdate = true
  }
  setSize(width, height) {
    super.setSize(width, height)
    this.blendMaterial.uniforms.texel.value.set(1 / Math.max(1, width), 1 / Math.max(1, height))
  }
  _overrideVisibility() {
    const cache = this._visibilityCache
    this.scene.traverse(object => {
      if (!object.visible) return
      const skip = object.isPoints || object.isLine || object.isLine2 || object.isSprite || (object.isMesh && !materialsOf(object).every(solid))
      if (skip) { object.visible = false; cache.push(object) }
    })
  }
  // The depth/normal pass needs no shadows; without this every frame would re-render every shadow map a second time.
  render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
    const autoUpdate = renderer.shadowMap.autoUpdate
    renderer.shadowMap.autoUpdate = false
    try { super.render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) } finally { renderer.shadowMap.autoUpdate = autoUpdate }
  }
}

// Tone mapping and sRGB as OutputPass, plus a triangular dither of one 8-bit step: the scene is lit in half-float, and the
// smooth light falloff across a large plain wall otherwise bands into visible steps on an 8-bit screen.
class DitheredOutputPass extends OutputPass {
  constructor() {
    super()
    const source = this.material.fragmentShader, end = source.lastIndexOf('}')
    this.material.fragmentShader = source.slice(0, end) + `
      vec2 ditherSeed = gl_FragCoord.xy;
      float ditherA = fract( sin( dot( ditherSeed, vec2( 12.9898, 78.233 ) ) ) * 43758.5453 );
      float ditherB = fract( sin( dot( ditherSeed + 0.5, vec2( 63.7264, 10.873 ) ) ) * 28001.8384 );
      gl_FragColor.rgb += ( ditherA + ditherB - 1.0 ) / 255.0;
    ` + source.slice(end)
    this.material.needsUpdate = true
  }
}

// Writes a depth texture into the current framebuffer's depth buffer, colour untouched.
const depthCopyMaterial = () => new THREE.ShaderMaterial({
  uniforms: {tDepth: {value: null}},
  vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
  fragmentShader: 'uniform sampler2D tDepth; varying vec2 vUv; void main() { gl_FragDepth = texture2D(tDepth, vUv).x; gl_FragColor = vec4(0.0); }',
  colorWrite: false, depthTest: true, depthFunc: THREE.AlwaysDepth, depthWrite: true,
})

// Repaints the scene's plain background colour, untouched by tone mapping (as a direct render clears it), wherever the main
// pass drew nothing: drawn at the far plane against the copied depth, so only empty pixels pass.
const backgroundMaterial = () => new THREE.ShaderMaterial({
  uniforms: {color: {value: new THREE.Color()}},
  vertexShader: 'void main() { gl_Position = vec4(position.xy, 1.0, 1.0); }',
  fragmentShader: 'uniform vec3 color; void main() { gl_FragColor = vec4(color, 1.0); }',
  depthTest: true, depthFunc: THREE.LessEqualDepth, depthWrite: false,
})

const OVERLAY_LAYER = 31

// radius is in metres: wide enough for the soft shading a room corner or a sofa base gets from indirect light, not only a
// hairline at each edge (a 0.32 m radius was tried first and only outlined edges in the whole-home view).
export const DESIGNER_LOOK = {
  toneMapping: null, // null keeps the view's own tone mapping
  exposureGain: 1,
  ao: {radius: 1.2, distanceExponent: 2.2, thickness: 3, scale: 1.9, samples: 16, distanceFallOff: 1},
  denoise: {lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16},
  blendIntensity: 1,
}

/**
 * Wraps an existing renderer/scene/camera. Call render() instead of renderer.render(scene, camera) and setSize() from the
 * view's resize handler. setEnabled(false) returns to the view's original direct rendering and tone mapping exactly.
 */
export function createDesignerRender(renderer, scene, camera, {enabled = true, look = DESIGNER_LOOK, quality = null, metresPerUnit = 1} = {}) {
  const original = {toneMapping: renderer.toneMapping, exposure: renderer.toneMappingExposure}
  const size = renderer.getDrawingBufferSize(new THREE.Vector2())
  // The depth texture lets the final pass test overlays against, and repaint the background around, what the main pass drew.
  const target = new THREE.WebGLRenderTarget(Math.max(1, size.x), Math.max(1, size.y), {type: THREE.HalfFloatType, samples: quality?.msaa ?? 4, depthTexture: new THREE.DepthTexture(Math.max(1, size.x), Math.max(1, size.y))})
  const composer = new EffectComposer(renderer, target)
  composer.addPass(new RenderPass(scene, camera))
  // radius and thickness are distances: in the scene's units (the kitchen planner is in centimetres).
  const aoParameters = {...look.ao, radius: look.ao.radius / metresPerUnit, thickness: look.ao.thickness / metresPerUnit, ...(quality ? {samples: quality.aoSamples} : {})}
  const ao = new SolidSurfaceGTAOPass(scene, camera, size.x, size.y, undefined, aoParameters, {...look.denoise, ...(quality ? {samples: quality.denoiseSamples} : {})})
  ao.blendIntensity = look.blendIntensity
  composer.addPass(ao)
  composer.addPass(new DitheredOutputPass())
  const depthCopy = new FullScreenQuad(depthCopyMaterial()), backdrop = new FullScreenQuad(backgroundMaterial())
  let on = false

  const apply = value => {
    on = value
    renderer.toneMapping = on && look.toneMapping != null ? look.toneMapping : original.toneMapping
    renderer.toneMappingExposure = on ? original.exposure * look.exposureGain : original.exposure
  }
  apply(enabled)

  const api = {
    composer, ao,
    get enabled() { return on },
    setEnabled: apply,
    /** Keep the base exposure the view sets (e.g. a brightness slider) and re-apply the designer gain on top. */
    setExposure: exposure => { original.exposure = exposure; apply(on) },
    setSize: (width, height) => { composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(width, height) },
    /** Sample counts of a QUALITY level (render/renderQuality.mjs): multisampling of the buffers and AO/denoise samples. */
    setQuality: level => {
      for (const buffer of [composer.renderTarget1, composer.renderTarget2]) if (buffer.samples !== level.msaa) { buffer.samples = level.msaa; buffer.dispose() }
      ao.updateGtaoMaterial({samples: level.aoSamples}); ao.updatePdMaterial({samples: level.denoiseSamples})
    },
    render: () => {
      if (!on) { renderer.render(scene, camera); return }
      // Move overlays to their own layer for this frame, render the solid scene with AO, then draw them on top.
      const overlays = [], masks = []
      // Lights join the overlay layer too (keeping their own), or the overlay pass would draw glass and ghosts unlit.
      scene.traverse(object => {
        if (isOverlay(object)) { overlays.push(object); masks.push(object.layers.mask); object.layers.set(OVERLAY_LAYER) }
        else if (object.isLight) { overlays.push(object); masks.push(object.layers.mask); object.layers.enable(OVERLAY_LAYER) }
      })
      const cameraMask = camera.layers.mask, autoClear = renderer.autoClear, background = scene.background, shadows = renderer.shadowMap.autoUpdate
      const mainTarget = composer.readBuffer // the RenderPass draws into the current read buffer
      try {
        composer.render()
        renderer.setRenderTarget(null); renderer.autoClear = false; renderer.clearDepth()
        depthCopy.material.uniforms.tDepth.value = mainTarget.depthTexture; depthCopy.render(renderer)
        if (background?.isColor) { backdrop.material.uniforms.color.value.copy(background).convertLinearToSRGB(); backdrop.render(renderer) }
        if (overlays.some(object => !object.isLight)) {
          camera.layers.set(OVERLAY_LAYER); scene.background = null; renderer.shadowMap.autoUpdate = false
          renderer.render(scene, camera)
        }
      } finally {
        camera.layers.mask = cameraMask; renderer.autoClear = autoClear; scene.background = background; renderer.shadowMap.autoUpdate = shadows
        overlays.forEach((object, i) => { object.layers.mask = masks[i] })
      }
    },
    dispose: () => { apply(false); ao.dispose(); depthCopy.material.dispose(); depthCopy.dispose(); backdrop.material.dispose(); backdrop.dispose(); composer.dispose(); target.dispose(); if (globalThis.__designerRender === api) globalThis.__designerRender = null },
  }
  if (import.meta.env?.DEV) globalThis.__designerRender = api // dev-only handle for screenshot checks
  return api
}

// One switch for every live view, remembered across reloads (default on).
const PREFERENCE_KEY = 'home-interior.designer-render.v1'
export const readDesignerPreference = () => { try { return localStorage.getItem(PREFERENCE_KEY) !== 'off' } catch { return true } }
export const writeDesignerPreference = on => { try { localStorage.setItem(PREFERENCE_KEY, on ? 'on' : 'off') } catch {} }
