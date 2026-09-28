import test from 'node:test'
import assert from 'node:assert/strict'
import {sunAt, daylightPreset} from '../src/render/daylight.mjs'

// Plan frame (docs/ARCHITECTURE.md): +Z = plan north, -X = plan east, +Y = up.
const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} !~ ${b}`)

test('with no offset, sunrise comes from plan east and sunset from plan west', () => {
  const rise = sunAt(6, {trueNorthOffsetDeg: 0})
  close(rise.elevationDeg, 0, 1e-6)
  assert.ok(rise.direction[0] < -0.9, 'sunrise direction points east (-X)')
  const set = sunAt(18, {trueNorthOffsetDeg: 0})
  assert.ok(set.direction[0] > 0.9, 'sunset direction points west (+X)')
})

test('solar noon is the highest sun and lies toward plan south', () => {
  const noon = sunAt(12, {trueNorthOffsetDeg: 0, latitudeDeg: 18.5})
  close(noon.elevationDeg, 90 - 18.5, 1e-6)
  assert.equal(noon.azimuthDeg, 180)
  assert.ok(noon.direction[2] < 0, 'toward -Z (plan south)')
  assert.ok(noon.direction[1] > sunAt(9).direction[1], 'noon higher than 9am')
})

test('direction is always a unit vector and hour is validated', () => {
  for (const h of [0, 5.5, 6, 9.25, 12, 15, 18, 21, 24]) {
    close(Math.hypot(...sunAt(h).direction), 1, 1e-9)
  }
  assert.throws(() => sunAt(-1))
  assert.throws(() => sunAt(25))
  assert.throws(() => sunAt(NaN))
})

test('the true-north offset rotates the whole sun path by the same angle', () => {
  const a = sunAt(9, {trueNorthOffsetDeg: 0}).direction
  const b = sunAt(9, {trueNorthOffsetDeg: 30}).direction
  // Same elevation, so the ground components differ by a 30-degree rotation.
  const dot = a[0] * b[0] + a[2] * b[2]
  const ga = Math.hypot(a[0], a[2]), gb = Math.hypot(b[0], b[2])
  close(Math.acos(dot / (ga * gb)) * 180 / Math.PI, 30, 1e-6)
  close(a[1], b[1], 1e-9)
})

test('presets: night before sunrise and after sunset, golden near horizon, day at noon', () => {
  assert.equal(daylightPreset(4).mode, 'night')
  assert.equal(daylightPreset(4).sunIntensity, 0)
  assert.equal(daylightPreset(21).mode, 'night')
  assert.equal(daylightPreset(6.4).mode, 'golden')
  assert.equal(daylightPreset(12).mode, 'day')
  assert.ok(daylightPreset(12).sunIntensity > daylightPreset(6.4).sunIntensity)
  for (const key of ['sunColor', 'hemiSky', 'hemiGround', 'background']) {
    assert.match(daylightPreset(12)[key], /^#[0-9a-f]{6}$/)
  }
})
