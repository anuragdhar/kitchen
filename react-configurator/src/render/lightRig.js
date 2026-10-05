import * as THREE from 'three'

// THE STANDARD DAYLIGHT RIG of the room pages (render-quality pass, 2026-10-05): a sky/ground hemisphere fill and one sun that
// casts the shadows (render/liveView.js fits its shadow camera to the room). Each page used its own strengths (sky 1.0 to 1.7,
// sun 1.3 to 2.6, environment always 1) and, with the image-based environment on top, every room page clipped its ivory walls
// to flat white. The rig keeps each page's sun DIRECTION and background colours and its Daylight / Evening / Dark room
// controls; only the balance changes: a stronger sun share (so the shadows that ground the furniture read), less flat
// sky fill and environment, so walls facing away from the sun step down in tone instead of all reaching white.
//
// Strengths are artist-tuned for ACES at exposure 1.1 (VIEW_LOOK), not lux. `environment` is scene.environmentIntensity.
export const DAYLIGHT_RIG = Object.freeze({
  day: Object.freeze({sky: '#e9f2ff', ground: '#b3a897', hemisphere: .9, sun: '#fff6e6', sunIntensity: 2.6, environment: .6}),
  evening: Object.freeze({sky: '#c3d2e8', ground: '#4e463e', hemisphere: .32, sun: '#ffd9a8', sunIntensity: .45, environment: .22}),
  // Dark room: only the room's own fittings light it (the dimmer sliders); this is the faint spill that stops it reading as void.
  dark: Object.freeze({sky: '#c3d2e8', ground: '#4e463e', hemisphere: .03, sun: '#ffd9a8', sunIntensity: 0, environment: .02}),
})

/**
 * Adds the hemisphere and sun to `scene`. sunPosition/target: the page's sun direction (metres, or the scene's units).
 * backgrounds: {day, evening, dark} colours of scene.background for each mode (a page's own colours).
 * setMode('day' | 'evening' | 'dark') applies the strengths; `scale` multiplies sky, sun and environment (Whole home's
 * in-home light dial, or a page's own level), default 1.
 */
export function createDaylightRig(scene, {sunPosition = [-2, 6, 4], target = [0, 0, 0], backgrounds = null, rig = DAYLIGHT_RIG} = {}) {
  const hemisphere = new THREE.HemisphereLight(rig.day.sky, rig.day.ground, rig.day.hemisphere)
  const sun = new THREE.DirectionalLight(rig.day.sun, rig.day.sunIntensity)
  sun.position.set(...sunPosition); sun.target.position.set(...target); sun.castShadow = true
  hemisphere.name = 'Daylight rig sky'; sun.name = 'Daylight rig sun'
  scene.add(hemisphere, sun, sun.target)
  let mode = 'day'
  const setMode = (next = mode, {scale = 1} = {}) => {
    mode = next
    const values = rig[next] || rig.day
    hemisphere.color.set(values.sky); hemisphere.groundColor.set(values.ground); hemisphere.intensity = values.hemisphere * scale
    sun.color.set(values.sun); sun.intensity = values.sunIntensity * scale
    scene.environmentIntensity = values.environment * scale
    const background = backgrounds?.[next]
    if (background && scene.background?.isColor) scene.background.set(background)
  }
  setMode('day')
  return {hemisphere, sun, setMode, get mode() { return mode }, dispose: () => { scene.remove(hemisphere, sun, sun.target); sun.dispose(); hemisphere.dispose() }}
}
