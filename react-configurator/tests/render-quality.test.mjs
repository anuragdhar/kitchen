import test from 'node:test'
import assert from 'node:assert/strict'
import {QUALITY, QUALITY_CHOICES, autoQuality, resolveQuality, readQualityChoice, writeQualityChoice, lampColour, lampLinear, LAMP_WHITE_KELVIN} from '../src/render/renderQuality.mjs'
import {KITCHEN_LIGHTING} from '../src/config/kitchenLightingConfig.js'
import {DRAWING_LIGHTING} from '../src/config/drawingLightingConfig.js'

const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16))

test('quality levels spend more from Draft to High and Auto is a choice, not a level', () => {
  const order = ['draft', 'standard', 'high']
  for (const key of ['pixelRatioMax', 'shadowMapSize', 'shadowRadius', 'aoSamples', 'denoiseSamples', 'anisotropy', 'msaa'])
    for (let i = 1; i < order.length; i++) assert.ok(QUALITY[order[i]][key] >= QUALITY[order[i - 1]][key], `${key} ${order[i]}`)
  assert.equal(QUALITY.draft.contactShadows, false); assert.equal(QUALITY.high.contactShadows, true)
  assert.deepEqual(QUALITY_CHOICES, ['auto', ...order])
  assert.equal(resolveQuality('draft', {}), 'draft')
})

test('auto quality: High on a discrete card, Standard on integrated or unknown graphics, Draft on software rendering', () => {
  assert.equal(autoQuality({gpu: 'ANGLE (AMD, AMD Radeon RX 6750 XT (0x000073DF) Direct3D11 vs_5_0 ps_5_0, D3D11)', maxTextureSize: 16384, cores: 16}), 'high')
  assert.equal(autoQuality({gpu: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)', maxTextureSize: 16384, cores: 8}), 'high')
  assert.equal(autoQuality({gpu: 'ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11)', maxTextureSize: 16384, cores: 8}), 'standard')
  assert.equal(autoQuality({gpu: 'ANGLE (AMD, AMD Radeon(TM) Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)', maxTextureSize: 16384, cores: 8}), 'standard')
  assert.equal(autoQuality({gpu: '', maxTextureSize: 16384}), 'standard')
  assert.equal(autoQuality({gpu: 'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)), SwiftShader driver)', maxTextureSize: 8192}), 'draft')
  assert.equal(autoQuality({gpu: 'ANGLE (AMD, AMD Radeon RX 6750 XT)', maxTextureSize: 16384, screenWidth: 400}), 'draft')
})

test('the quality preference fails closed', () => {
  assert.equal(readQualityChoice(), 'auto') // no localStorage in Node
  assert.throws(() => writeQualityChoice('ultra'))
})

test('lamp colour follows Kelvin: 3000 K warm, 4000 K neutral, 4500 K white, and 3000 K stays near the old warm tint', () => {
  const [warm, neutral, white, candle] = [3000, 4000, LAMP_WHITE_KELVIN, 2700].map(k => lampColour(k))
  assert.equal(white, '#ffffff')
  assert.ok(rgb(warm)[2] < rgb(neutral)[2] && rgb(neutral)[2] < rgb(white)[2], 'blue rises with colour temperature')
  assert.ok(rgb(candle)[2] < rgb(warm)[2])
  // The 3000 K rooms were drawn with #ffd9a8 before; the white balance was chosen so they keep that look.
  rgb(warm).forEach((value, i) => assert.ok(Math.abs(value - rgb('#ffd9a8')[i]) <= 20, `channel ${i}: ${warm}`))
  // The 4000 K kitchen track is now a neutral white, not the 3000 K tint.
  assert.ok(rgb(lampColour(KITCHEN_LIGHTING.tracks.kelvin))[2] >= 215)
  assert.ok(rgb(lampColour(DRAWING_LIGHTING.southSofas.tracks.kelvin))[2] < 170)
  for (const k of [2700, 3000, 4000, 6500]) { const linear = lampLinear(k); assert.equal(Math.max(...linear), 1); assert.ok(linear.every(v => v >= 0 && v <= 1)) }
})
