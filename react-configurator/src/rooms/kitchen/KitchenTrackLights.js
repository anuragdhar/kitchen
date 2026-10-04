import {KITCHEN_LIGHTING} from '../../config/kitchenLightingConfig.js'
import {mirrorTrackConfig} from '../../domain/drawingLighting.mjs'
import {createTrackLights} from '../drawing/DrawingRoomLighting.js'

// The kitchen's ceiling track (config/kitchenLightingConfig.js) for the kitchen planner's 3D view (App.jsx ThreeDRender).
//
// FRAMES. The lighting config is in millimetres, x from the west wall, z from the north wall (like every room). The planner's
// scene is in CENTIMETRES (App.jsx: s = mm / 10) with the origin at the room centre on the floor; its X runs WEST (an item at
// x_mm from the west wall sits at X = (W/2 - x_mm) / 10), Y is height, and its Z runs NORTH (an item y_mm from the south
// wall sits at Z = (y_mm - L/2) / 10, so a point z_mm from the north wall sits at Z = (L/2 - z_mm) / 10).
// createTrackLights builds in metres with x east and z south, so the config is MIRRORED first (domain/drawingLighting.mjs
// mirrorTrackConfig: x' = W - x, z' = L - z, aims swapped), which makes its x' run west and z' run north; the group is then
// scaled by 100 (metres to centimetres, with the real lights' reach and strength scaled by createTrackLights) and moved so
// x' = 0, z' = 0 lands at X = -W/20, Z = -L/20. A mirror by negative scale was avoided: it flips face winding and does not
// scale light falloff.
export function createKitchenTrackLights({realLights = true} = {}) {
  const {widthMm: W, lengthMm: L, heightMm: H} = KITCHEN_LIGHTING.room, unitsPerMetre = 100
  const group = createTrackLights(mirrorTrackConfig(KITCHEN_LIGHTING.tracks, W, L), H / 1000, {realLights, room: {x: W / 1000, z: L / 1000}, unitsPerMetre})
  group.name = 'Kitchen track lights'
  group.position.set(-W / 20, 0, -L / 20)
  return group
}

// Room light circuits of the kitchen 3D view: the ceiling track ('K1') and the existing under-cabinet LED strips ('led':
// the planner's own LED point lights and the glow of its strip material), each dimmable from 0 to 1.5 of the planned level.
// `studio` lists the scene's general lights (ambient, sky, key, fill, glows); "dark room" hides them so only the circuits
// light the kitchen. Hiding (visible=false) rather than dimming leaves the planner's own Daylight toggle free to keep
// setting their colours and strengths.
// The "Home Interior proposed lighting" overlay (render/interiorLighting.js) is added to the scene AFTER this and keeps
// re-applying itself: outside its 'original' mode it sets every scene light it found to zero and lights the room with its
// own generic area lights. Left alone, that undid the sliders and kept the kitchen bright with everything "off" and Dark
// room ticked (owner 2026-10-05). So the levels are re-asserted just before every frame (scene.onBeforeRender), and Dark
// room also hides that overlay, as the other room pages do.
export function createKitchenRoomLights(scene, {studio = [], ledMaterial = null, realLights = true} = {}) {
  const tracks = createKitchenTrackLights({realLights}); scene.add(tracks)
  const led = []
  scene.traverse(object => { if (object.isPointLight && /led light|task glow/.test(object.name || '')) led.push({light: object, base: object.intensity}) })
  const ledGlow = ledMaterial ? ledMaterial.emissiveIntensity ?? 1 : 1
  const levels = {led: 1}
  for (const run of KITCHEN_LIGHTING.tracks.runs) levels[run.id] = 1
  const apply = (circuit, level) => {
    if (circuit === 'led') {
      for (const {light, base} of led) { light.userData.dimLevel = level; light.intensity = base * level }
      if (ledMaterial && ledMaterial.emissive) ledMaterial.emissiveIntensity = ledGlow * Math.min(level, 1.5)
    } else tracks.userData.setLevel(circuit, level)
  }
  const setLevel = (circuit, level) => { if (circuit in levels) { levels[circuit] = level; apply(circuit, level) } }
  let dark = false, background = null, environment = 1
  const enforce = () => {
    for (const circuit in levels) apply(circuit, levels[circuit])
    if (!dark) return
    for (const light of studio) light.visible = false
    const overlay = scene.getObjectByName('Home Interior proposed lighting'); if (overlay) overlay.visible = false
    scene.background?.set?.('#0b0d10'); if (scene.fog) scene.fog.color.set('#0b0d10'); scene.environmentIntensity = .02
  }
  const setDarkRoom = on => {
    if (on && !dark) { environment = scene.environmentIntensity; if (scene.background?.isColor) background = scene.background.clone() }
    dark = on
    if (!on) {
      for (const light of studio) light.visible = true
      const overlay = scene.getObjectByName('Home Interior proposed lighting'); if (overlay) overlay.visible = true
      if (background) { scene.background.copy(background); if (scene.fog) scene.fog.color.copy(background) }
      scene.environmentIntensity = environment
    }
    enforce()
  }
  scene.onBeforeRender = enforce
  return {tracks, setLevel, setDarkRoom, levels}
}
