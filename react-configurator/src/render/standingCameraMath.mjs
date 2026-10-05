// Pure maths for the "Stand here" camera (render/standingCamera.js). No Three.js, React or DOM.
// Scene frame: metres, y up. Heading is measured in the floor plane: 0 degrees looks along -z (north on a room page, where
// z grows south from the north wall), 90 degrees looks along +x (east on a room page). Pitch is up (+) or down (-).

export const STAND = Object.freeze({
  eyeMm: 1600, eyeMinMm: 800, eyeMaxMm: 2400, // eye height above the floor
  pitchMaxDeg: 80,                            // how far up or down one can look
  fovDeg: 60, fovMinDeg: 35, fovMaxDeg: 90,   // field of view; the mouse wheel changes it
  walkMps: 1.2,                               // walking speed
  lookDegPerPixel: 0.25,                      // drag sensitivity
})

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
export const clampPitchDeg = pitch => clamp(pitch, -STAND.pitchMaxDeg, STAND.pitchMaxDeg)
export const clampFovDeg = fov => clamp(fov, STAND.fovMinDeg, STAND.fovMaxDeg)
export const clampEyeMm = eye => clamp(Number.isFinite(eye) ? eye : STAND.eyeMm, STAND.eyeMinMm, STAND.eyeMaxMm)
/** Heading wrapped into 0-360 degrees. */
export const wrapHeadingDeg = heading => ((heading % 360) + 360) % 360

/** Unit vector the camera looks along for a heading and pitch in degrees: {x, y, z}. */
export function lookDirection(headingDeg, pitchDeg) {
  const h = headingDeg * Math.PI / 180, p = pitchDeg * Math.PI / 180
  return {x: Math.sin(h) * Math.cos(p), y: Math.sin(p), z: -Math.cos(h) * Math.cos(p)}
}

/** Heading in degrees (0-360) of a horizontal direction {x, z}; 0 when the direction has no horizontal part. */
export function headingOf(x, z) {
  return Math.hypot(x, z) < 1e-9 ? 0 : wrapHeadingDeg(Math.atan2(x, -z) * 180 / Math.PI)
}

/**
 * Floor step in metres for the keys held, the heading and the time since the last frame.
 * keys: {forward, back, left, right} booleans. Diagonals are not faster than straight lines.
 */
export function walkStep(keys, headingDeg, seconds, speed = STAND.walkMps) {
  const ahead = (keys.forward ? 1 : 0) - (keys.back ? 1 : 0), side = (keys.right ? 1 : 0) - (keys.left ? 1 : 0)
  const length = Math.hypot(ahead, side)
  if (!length || !(seconds > 0)) return {dx: 0, dz: 0}
  const h = headingDeg * Math.PI / 180, distance = speed * Math.min(seconds, 0.1) / length
  return {dx: (Math.sin(h) * ahead + Math.cos(h) * side) * distance, dz: (-Math.cos(h) * ahead + Math.sin(h) * side) * distance}
}

/** Which walking key an event key is, or null: arrows and W A S D. */
export function walkKey(key) {
  return {ArrowUp: 'forward', w: 'forward', W: 'forward', ArrowDown: 'back', s: 'back', S: 'back', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right'}[key] ?? null
}

/** The position as the control strip shows it: whole millimetres and whole degrees. */
export function standReadout({x, z, eyeM, headingDeg, pitchDeg, fovDeg}) {
  return {xMm: Math.round(x * 1000), zMm: Math.round(z * 1000), eyeMm: Math.round(eyeM * 1000), headingDeg: Math.round(wrapHeadingDeg(headingDeg)) % 360, pitchDeg: Math.round(pitchDeg), fovDeg: Math.round(fovDeg)}
}
