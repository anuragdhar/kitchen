// Simplified sun-path model for daylight previews. Pure math, no Three.js.
//
// This is an indicative design-study model (equinox day, 06:00 sunrise,
// 18:00 sunset, symmetric elevation arc), not an astronomical ephemeris.
// It exists so the app can show "where does morning/evening light come from"
// consistently with the plan's real orientation.
//
// Coordinate contract (matches WholeHome3D's world frame, which is derived
// from the south-up plan image; see docs/ARCHITECTURE.md):
//   +Z = plan north (screen down)   -Z = plan south
//   +X = plan west  (screen right)  -X = plan east
//   +Y = up
// True north is rotated TRUE_NORTH_OFFSET_DEG clockwise on screen from plan
// north (see config/orientationConfig.js); the sun's compass bearing is
// defined against TRUE north and converted into the plan frame here.

const rad = d => d * Math.PI / 180

/**
 * Sun state for a decimal hour of day (0-24).
 * Returns {up:boolean, elevationDeg, azimuthDeg (compass, from true north),
 * direction:[x,y,z] unit vector pointing from the scene toward the sun}.
 */
export function sunAt(hour, {trueNorthOffsetDeg = 0, latitudeDeg = 18.5} = {}) {
  if (!Number.isFinite(hour) || hour < 0 || hour > 24) throw new Error('hour must be 0-24')
  const t = (hour - 6) / 12 // 0 at sunrise, 1 at sunset
  const maxElevationDeg = 90 - latitudeDeg
  const elevationDeg = maxElevationDeg * Math.sin(Math.PI * Math.min(Math.max(t, 0), 1))
  const up = t > 0 && t < 1 && elevationDeg > 0
  const azimuthDeg = 90 + 180 * t // east at sunrise, south at noon, west at sunset

  // Ground bearing toward the sun, in the TRUE-north frame, then rotated into
  // the plan frame. Screen-clockwise rotation by theta maps (x,z) ->
  // (x cos - z sin, x sin + z cos); plan-north=(0,1), plan-east=(-1,0).
  const theta = rad(trueNorthOffsetDeg)
  const north = [-Math.sin(theta), Math.cos(theta)]
  const east = [-Math.cos(theta), -Math.sin(theta)]
  const az = rad(azimuthDeg)
  const gx = Math.cos(az) * north[0] + Math.sin(az) * east[0]
  const gz = Math.cos(az) * north[1] + Math.sin(az) * east[1]
  const elev = rad(Math.max(elevationDeg, up ? elevationDeg : -8))
  const direction = [gx * Math.cos(elev), Math.sin(Math.max(elev, rad(-8))), gz * Math.cos(elev)]
  const len = Math.hypot(...direction)
  return {up, elevationDeg, azimuthDeg, direction: direction.map(v => v / len)}
}

/**
 * Lighting recipe for a given hour: colors/intensities for a hemisphere
 * light, a directional sun, and the scene background. Values are tuned for
 * the app's ACES-toned Three.js scenes; night returns the scene's existing
 * warm-interior look with the sun off.
 */
export function daylightPreset(hour, opts) {
  const sun = sunAt(hour, opts)
  if (!sun.up) {
    return {...sun, mode: 'night', sunIntensity: 0, sunColor: '#ffffff',
      hemiSky: '#3d465c', hemiGround: '#2a2622', hemiIntensity: .55, background: '#171a22'}
  }
  const e = sun.elevationDeg
  const low = Math.min(e / 14, 1) // 0 near horizon -> 1 above ~14 deg
  const mix = (a, b) => Math.round(a + (b - a) * low)
  const hex = (r, g, b) => `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`
  return {
    ...sun,
    mode: low < 1 ? 'golden' : 'day',
    sunColor: hex(mix(255, 255), mix(150, 244), mix(90, 228)),
    sunIntensity: 1.2 + 1.6 * low,
    hemiSky: hex(mix(255, 214), mix(210, 232), mix(180, 255)),
    hemiGround: '#b9a893',
    hemiIntensity: .6 + .75 * low,
    background: hex(mix(250, 226), mix(214, 238), mix(184, 249)),
  }
}
