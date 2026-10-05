import test from 'node:test'
import assert from 'node:assert/strict'
import {STAND, clampPitchDeg, clampFovDeg, clampEyeMm, wrapHeadingDeg, lookDirection, headingOf, walkStep, walkKey, standReadout} from '../src/render/standingCameraMath.mjs'

const near = (a, b, eps = 1e-9) => Math.abs(a - b) < eps

test('"Stand here" defaults: eye height 1600 mm, a 60 degree view, limits on pitch, view angle and eye height', () => {
  assert.deepEqual([STAND.eyeMm, STAND.fovDeg, STAND.pitchMaxDeg, STAND.walkMps], [1600, 60, 80, 1.2])
  assert.deepEqual([clampPitchDeg(95), clampPitchDeg(-95), clampPitchDeg(10)], [80, -80, 10])
  assert.deepEqual([clampFovDeg(10), clampFovDeg(120), clampFovDeg(70)], [35, 90, 70])
  assert.deepEqual([clampEyeMm(300), clampEyeMm(5000), clampEyeMm(1450), clampEyeMm(NaN)], [800, 2400, 1450, 1600])
  assert.deepEqual([wrapHeadingDeg(370), wrapHeadingDeg(-90), wrapHeadingDeg(360)], [10, 270, 0])
})

test('heading 0 looks along -z (north on a room page) and 90 along +x (east); headingOf is its inverse', () => {
  const north = lookDirection(0, 0), east = lookDirection(90, 0), up = lookDirection(0, 30)
  assert.ok(near(north.x, 0) && near(north.z, -1) && near(north.y, 0))
  assert.ok(near(east.x, 1) && near(east.z, 0))
  assert.ok(near(up.y, 0.5) && near(Math.hypot(up.x, up.y, up.z), 1))
  for (const heading of [0, 45, 90, 180, 270, 333]) { const d = lookDirection(heading, 20); assert.ok(near(headingOf(d.x, d.z), heading, 1e-6), `heading ${heading}`) }
  assert.equal(headingOf(0, 0), 0)
})

test('walking: forward follows the heading, strafing is at right angles, diagonals are no faster, long frames are capped', () => {
  const none = {forward: false, back: false, left: false, right: false}
  assert.deepEqual(walkStep(none, 0, 0.05), {dx: 0, dz: 0})
  const ahead = walkStep({...none, forward: true}, 0, 0.05)
  assert.ok(near(ahead.dx, 0) && near(ahead.dz, -0.06))
  const east = walkStep({...none, forward: true}, 90, 0.05)
  assert.ok(near(east.dx, 0.06) && near(east.dz, 0, 1e-9))
  const right = walkStep({...none, right: true}, 0, 0.05)
  assert.ok(near(right.dx, 0.06) && near(right.dz, 0, 1e-9))
  const diagonal = walkStep({...none, forward: true, right: true}, 0, 0.05)
  assert.ok(near(Math.hypot(diagonal.dx, diagonal.dz), 0.06))
  const cancel = walkStep({forward: true, back: true, left: false, right: false}, 0, 0.05)
  assert.deepEqual(cancel, {dx: 0, dz: 0})
  const stalled = walkStep({...none, forward: true}, 0, 3)
  assert.ok(near(Math.hypot(stalled.dx, stalled.dz), 0.12), 'a 3 second frame moves no more than 0.1 s of walking')
})

test('arrow keys and W A S D walk; other keys do not; the readout is whole millimetres and degrees', () => {
  assert.deepEqual(['ArrowUp', 'w', 'S', 'ArrowLeft', 'd', 'x', 'Enter'].map(walkKey), ['forward', 'forward', 'back', 'left', 'right', null, null])
  assert.deepEqual(standReadout({x: 1.2344, z: 3.0006, eyeM: 1.6, headingDeg: 359.6, pitchDeg: -4.4, fovDeg: 60}), {xMm: 1234, zMm: 3001, eyeMm: 1600, headingDeg: 0, pitchDeg: -4, fovDeg: 60})
})
