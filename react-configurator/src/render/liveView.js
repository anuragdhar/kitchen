import * as THREE from 'three'
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js'
import {createDesignerRender} from './designerRender.js'
import {QUALITY, readQualityChoice, resolveQuality, subscribeQuality} from './renderQuality.mjs'

// ONE RENDER SETUP FOR EVERY LIVE 3D VIEW (render-quality pass, 2026-10-05). Each page used to build its own renderer with its
// own tone mapping exposure (0.84 to 1.08), pixel-ratio cap (2 to 2.5), shadow type and shadow camera, so the rooms looked like
// different apps, and most suns kept three.js's default 512 px shadow over a fixed 10 m square. createLiveView() builds the
// renderer, colour management, ACES tone mapping at one exposure, the image-based environment, the "Designer render" post
// chain, the quality level and the sun shadows; a page keeps its own scene, camera, lights and controls and calls
// view.render() / view.setSize() instead of renderer.render().
//
// What it changes is shading only. Geometry, positions, visibility, materials (except their shadow flags, see below) and the
// lights' own colours and strengths are the page's. Units: metres unless the page passes metresPerUnit (the kitchen planner is
// in centimetres: 0.01).
//
// SHADOWS. Every shadow-casting directional light (the sun or key light) gets a shadow camera fitted to the box of the solid
// surfaces of the scene, seen from the light, so the whole map lands on the model (about 2-3 mm per texel in one room at
// Standard), a soft PCF radius, and a depth/normal bias scaled to the texel. The fit is redone every frame (eight corner
// transforms), so a moving sun (Whole home 3D's time slider) stays fitted. The box is recomputed when the mesh count changes.
// CONTACT SHADOWS. At Standard and High, solid opaque meshes standing in the room (furniture, decor, cabinets, people) cast
// sun shadows and every solid opaque surface receives them, so furniture sits on the floor instead of floating; ceiling-height
// fittings (fans, tracks, mouldings, AC units) keep the page's choice, because the cutaway rooms have no ceiling and their
// overhead sun would otherwise print fan blades on the floor. Draft restores the page's own flags.
export const VIEW_LOOK = Object.freeze({
  exposure: 1.1,
  environmentBlur: .04,
  environmentIntensity: .6,
  shadowMarginMetres: .25,
  normalBiasTexels: 1.6,
  depthBiasTexels: .6,
  // Contact shadows: meshes that start below fittingBottomMetres and end below fittingTopMetres (furniture, decor, cabinets,
  // people), not ceiling-hung fittings (fans, chandeliers, pendants, tracks, AC units) nor full-height walls.
  fittingBottomMetres: 1.6,
  fittingTopMetres: 2.45,
})

const materialsOf = object => Array.isArray(object.material) ? object.material : [object.material]
// A surface that should cast or receive shadows: lit, opaque, drawn, not a label/overlay/helper.
const solidLit = material => material && material.visible !== false && material.colorWrite !== false && material.depthWrite !== false &&
  !(material.transparent && material.opacity < .95) && !material.isMeshBasicMaterial && !material.isSpriteMaterial && !material.isLineBasicMaterial && !material.isShaderMaterial
const insideFixture = object => { for (let o = object; o; o = o.parent) if (o.userData?.interiorFixture || o.userData?.archvizExclude) return true; return false }

let lastLevel = QUALITY.standard
/** Texture anisotropy of the current quality level (render/interiorScene.js asks when it loads finish maps). */
export const currentAnisotropy = renderer => Math.min(lastLevel.anisotropy, renderer.capabilities.getMaxAnisotropy())

function probeOf(renderer) {
  let gpu = ''
  try { const gl = renderer.getContext(), info = gl.getExtension('WEBGL_debug_renderer_info'); gpu = info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER) } catch {}
  return {gpu, maxTextureSize: renderer.capabilities.maxTextureSize, cores: globalThis.navigator?.hardwareConcurrency || 4, screenWidth: Math.min(globalThis.screen?.width || 1920, globalThis.innerWidth || 1920)}
}

/**
 * mount: element the canvas is appended to (optional). designer: initial "Designer render" state. exposure: tone-mapping
 * exposure (leave the default so views match). preserveDrawingBuffer: for pages that read the canvas back outside a frame.
 * metresPerUnit: scene units. Returns {renderer, render, setSize, setDesigner, setExposure, setQuality, savePicture,
 * refreshShadows, dispose, ...}; setEnabled/setExposure keep the designer-render API the pages already used.
 */
export function createLiveView({mount = null, scene, camera, designer = true, exposure = VIEW_LOOK.exposure, preserveDrawingBuffer = false, metresPerUnit = 1, environment = true} = {}) {
  const renderer = new THREE.WebGLRenderer({antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer})
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = exposure
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap // PCFSoftShadowMap is deprecated in r185 (it warned and fell back to this)
  const probe = probeOf(renderer)
  let choice = readQualityChoice(), levelName = resolveQuality(choice, probe), level = QUALITY[levelName]
  lastLevel = level
  const pixelRatio = () => Math.min(globalThis.devicePixelRatio || 1, level.pixelRatioMax)
  renderer.setPixelRatio(pixelRatio())
  if (mount) mount.appendChild(renderer.domElement)
  let pmrem = null, envTexture = null
  // The image-based environment gives metal, glass and lacquer something to reflect and a soft fill; its default strength is
  // the daylight rig's (render/lightRig.js), lower than the 1.0 every page used, which flattened the rooms.
  if (environment) { pmrem = new THREE.PMREMGenerator(renderer); envTexture = pmrem.fromScene(new RoomEnvironment(), VIEW_LOOK.environmentBlur).texture; scene.environment = envTexture; scene.environmentIntensity = VIEW_LOOK.environmentIntensity }
  const post = createDesignerRender(renderer, scene, camera, {enabled: designer, quality: level, metresPerUnit})
  let cssWidth = 1, cssHeight = 1, updateStyle = false

  // ---- shadows -------------------------------------------------------------------------------------------------------
  const box = new THREE.Box3(), meshBox = new THREE.Box3(), corner = new THREE.Vector3()
  const autoCast = new Set(), autoReceive = new Set()
  let meshCount = -1, frame = 0, suns = []
  const prepare = () => {
    scene.updateMatrixWorld()
    let count = 0
    box.makeEmpty(); suns = []
    const bottom = VIEW_LOOK.fittingBottomMetres / metresPerUnit, top = VIEW_LOOK.fittingTopMetres / metresPerUnit
    scene.traverse(object => {
      if (object.isDirectionalLight) suns.push(object)
      if (!object.isMesh || !object.geometry) return
      count++
      const materials = materialsOf(object)
      if (!object.geometry.boundingBox) object.geometry.computeBoundingBox()
      meshBox.copy(object.geometry.boundingBox).applyMatrix4(object.matrixWorld)
      if (level.contactShadows && materials.every(solidLit) && !insideFixture(object) && !materials.some(m => m.userData?.taskLightGlow)) {
        if (!object.receiveShadow) { object.receiveShadow = true; autoReceive.add(object) }
        if (!object.castShadow && meshBox.min.y < bottom && meshBox.max.y <= top) { object.castShadow = true; autoCast.add(object) }
      }
      if (object.castShadow || object.receiveShadow) box.union(meshBox)
    })
    if (!level.contactShadows) { autoCast.forEach(o => { o.castShadow = false }); autoReceive.forEach(o => { o.receiveShadow = false }); autoCast.clear(); autoReceive.clear() }
    meshCount = count
  }
  const countMeshes = () => { let n = 0; scene.traverse(o => { if (o.isMesh && o.geometry) n++ }); return n }
  const fit = light => {
    const shadow = light.shadow, size = level.shadowMapSize
    if (shadow.mapSize.x !== size) { shadow.mapSize.set(size, size); shadow.map?.dispose(); shadow.map = null }
    if (box.isEmpty()) return
    light.updateMatrixWorld(); light.target.updateMatrixWorld()
    shadow.updateMatrices(light)
    const view = shadow.camera.matrixWorldInverse
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, z0 = Infinity, z1 = -Infinity
    for (let i = 0; i < 8; i++) {
      corner.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).applyMatrix4(view)
      x0 = Math.min(x0, corner.x); x1 = Math.max(x1, corner.x); y0 = Math.min(y0, corner.y); y1 = Math.max(y1, corner.y); z0 = Math.min(z0, corner.z); z1 = Math.max(z1, corner.z)
    }
    const margin = VIEW_LOOK.shadowMarginMetres / metresPerUnit, cam = shadow.camera
    // An orthographic near plane may be negative: the box can reach behind the light's nominal position.
    cam.left = x0 - margin; cam.right = x1 + margin; cam.bottom = y0 - margin; cam.top = y1 + margin; cam.near = -z1 - margin; cam.far = -z0 + margin
    cam.updateProjectionMatrix()
    const texel = Math.max(cam.right - cam.left, cam.top - cam.bottom) / size
    shadow.normalBias = texel * VIEW_LOOK.normalBiasTexels
    shadow.bias = -texel * VIEW_LOOK.depthBiasTexels / Math.max(cam.far - cam.near, 1e-6)
    shadow.radius = level.shadowRadius
  }
  const fitShadows = () => {
    if (meshCount < 0 || (++frame % 90 === 0 && countMeshes() !== meshCount)) prepare()
    for (const sun of suns) if (sun.castShadow && sun.parent) fit(sun)
  }

  // ---- quality ---------------------------------------------------------------------------------------------------------
  const applySize = () => { renderer.setSize(cssWidth, cssHeight, updateStyle); post.setSize(cssWidth, cssHeight) }
  const applyQuality = name => {
    levelName = name; level = QUALITY[name]; lastLevel = level
    renderer.setPixelRatio(pixelRatio()); post.setQuality(level); applySize()
    meshCount = -1 // re-run contact shadows and anisotropy
    scene.traverse(object => {
      if (!object.isMesh) return
      for (const material of materialsOf(object)) for (const key of ['map', 'normalMap', 'roughnessMap', 'bumpMap']) {
        const texture = material?.[key]; if (!texture || texture.isRenderTargetTexture) continue
        const value = Math.min(level.anisotropy, renderer.capabilities.getMaxAnisotropy())
        if (texture.anisotropy !== value) { texture.anisotropy = value; texture.needsUpdate = true }
      }
    })
  }
  const unsubscribe = subscribeQuality(next => { choice = next; applyQuality(resolveQuality(next, probe)) })

  const render = () => { fitShadows(); post.render() }
  const api = {
    renderer, post, scene, camera,
    get quality() { return levelName },
    get qualityChoice() { return choice },
    get enabled() { return post.enabled },
    render,
    /** CSS size of the canvas; updateStyle as renderer.setSize. */
    setSize: (width, height, style = false) => { cssWidth = Math.max(1, width); cssHeight = Math.max(1, height); updateStyle = style; applySize() },
    setDesigner: on => post.setEnabled(on),
    setEnabled: on => post.setEnabled(on),
    setExposure: value => post.setExposure(value),
    setQuality: name => applyQuality(QUALITY[name] ? name : resolveQuality(name, probe)),
    /** Recompute the shadow box and contact-shadow casters now (after adding or removing a lot of objects). */
    refreshShadows: () => { meshCount = -1 },
    /**
     * Renders the current camera view at a higher resolution (long edge `longEdge` CSS pixels, at most the GPU's limit) and
     * resolves a PNG Blob. The canvas returns to its normal size afterwards.
     */
    savePicture: ({longEdge = levelName === 'high' ? 3000 : levelName === 'standard' ? 2200 : 1600} = {}) => {
      const scale = Math.min(longEdge, renderer.capabilities.maxTextureSize / 2) / Math.max(cssWidth, cssHeight)
      const width = Math.round(cssWidth * Math.max(1, scale)), height = Math.round(cssHeight * Math.max(1, scale))
      const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height
      try {
        renderer.setPixelRatio(1); renderer.setSize(width, height, false); post.setSize(width, height)
        render()
        canvas.getContext('2d').drawImage(renderer.domElement, 0, 0, width, height)
      } finally { renderer.setPixelRatio(pixelRatio()); applySize(); render() }
      return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not encode the picture.')), 'image/png'))
    },
    dispose: () => {
      unsubscribe(); post.dispose(); envTexture?.dispose(); pmrem?.dispose()
      autoCast.forEach(o => { o.castShadow = false }); autoReceive.forEach(o => { o.receiveShadow = false })
      if (globalThis.__liveRender === api) globalThis.__liveRender = null
    },
  }
  if (import.meta.env?.DEV) globalThis.__liveRender = api // dev-only handle for screenshot and frame-time checks
  return api
}

/** Downloads a Blob as a file. */
export function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob), link = document.createElement('a')
  link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
}
