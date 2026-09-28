import test from 'node:test'
import assert from 'node:assert/strict'
import {svgY, buildPlanSvg} from '../src/kitchen/export/planSvg.mjs'
import {buildPlanDxf} from '../src/kitchen/export/planDxf.mjs'

// Extracted from App.jsx (docs/REFACTOR_PLAN.md Phase 4); a minimal synthetic
// fixture rather than the live kitchenConfig.js defaults, since those are
// already covered end-to-end by tests/current-project.test.mjs and by a
// byte-identical live-browser snapshot taken before/after the extraction.
function fixture(overrides = {}) {
  const KITCHEN = {
    width: 2000, length: 4000, height: 2700,
    window: {x: 700, w: 600, h: 1200, sill: 900},
    door: {x: 100, w: 800},
    windowBelow: {x: 700, w: 600, depth: 300},
    westGap: {from: 0, to: 600},
    shaft: {y: 3800},
    westCounterDepth: 600,
    southWallReturn: {lengthMm: 1100},
  }
  const activeEast = [{id: 'gas', x: 1400, y: 500, w: 700, d: 600, h: 900, color: '#abc'}]
  const activeWest = [{id: 'sink', x: 0, y: 700, w: 600, d: 600, h: 880, color: '#def'}]
  const eastModules = [{width: 700, type: 'standard'}, {width: 300, type: 'filler'}]
  const westModules = [{width: 600, type: 'standard'}]
  const moduleSegmentsFromNorth = (mods, startY = 0, endY = KITCHEN.length) => {
    let cursor = endY
    return mods.map((m, i) => {
      const y0 = Math.max(startY, cursor - (m.width || 0))
      const width = Math.max(0, cursor - y0)
      const seg = {...m, index: i, y: y0, width}
      cursor = y0
      return seg
    }).filter(m => m.width > 0)
  }
  const renderStyle = {baseCabinet: '#c8b39d'}
  const materials = {wall: '#fffefb'}
  const planDimensions = {eastDepthMm: 600, westDepthMm: 600, walkwayMm: 800}
  return {KITCHEN, materials, grid: 0, planDimensions, activeEast, activeWest,
    eastModules, westModules, moduleSegmentsFromNorth, renderStyle, ...overrides}
}

test('svgY converts south-origin Y to SVG top-origin Y', () => {
  const KITCHEN = {length: 4000}
  assert.equal(svgY(KITCHEN, 0, 600), 3400)
  assert.equal(svgY(KITCHEN, 3400, 600), 0)
})

test('buildPlanSvg renders room, openings, runs and both active items without mutating its input', () => {
  const ctx = fixture()
  const before = structuredClone({...ctx, moduleSegmentsFromNorth: undefined})
  const svg = buildPlanSvg(ctx)
  assert.match(svg, /^<\?xml version="1\.0" encoding="UTF-8"\?>/)
  assert.match(svg, /<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="2000mm" height="4000mm"/)
  assert.match(svg, /NORTH WINDOW/)
  assert.match(svg, /SOUTH OPENING/)
  assert.match(svg, /EAST 600D RUN/)
  assert.match(svg, /WEST 600D RUN/)
  assert.match(svg, /DOOR CLEAR ZONE/)
  assert.match(svg, /BELOW WINDOW AREA/)
  assert.match(svg, /GAS y50cm/)
  assert.match(svg, /SINK y70cm/)
  assert.match(svg, /<\/svg>$/)
  assert.deepEqual({...ctx, moduleSegmentsFromNorth: undefined}, before)
})

test('buildPlanSvg draws grid lines only when grid is 50 or 100', () => {
  assert.doesNotMatch(buildPlanSvg(fixture({grid: 0})), /stroke-dasharray="10 14"/)
  assert.match(buildPlanSvg(fixture({grid: 50})), /stroke-dasharray="10 14"/)
  assert.match(buildPlanSvg(fixture({grid: 100})), /stroke-dasharray="10 14"/)
})

test('buildPlanSvg marks a filler module with a dashed outline', () => {
  const svg = buildPlanSvg(fixture())
  assert.match(svg, /stroke="#7b3f21" stroke-width="5" stroke-dasharray="18 12"/)
})

test('buildPlanDxf emits a valid entities section with room, openings and labeled appliances', () => {
  const dxf = buildPlanDxf(fixture())
  assert.match(dxf, /^0\nSECTION\n2\nENTITIES/)
  assert.match(dxf, /\nEAST_GAS\n/)
  assert.match(dxf, /\nWEST_SINK\n/)
  assert.match(dxf, /EAST gas y500mm/)
  assert.match(dxf, /WEST sink y700mm/)
  assert.match(dxf, /0\nENDSEC\n0\nEOF$/)
})

test('buildPlanDxf includes GRID-layer lines only when grid is 50 or 100', () => {
  assert.doesNotMatch(buildPlanDxf(fixture({grid: 0})), /\nGRID\n/)
  assert.match(buildPlanDxf(fixture({grid: 50})), /\nGRID\n/)
})

test('buildPlanSvg and buildPlanDxf agree on which depth each wall uses', () => {
  const ctx = fixture({planDimensions: {eastDepthMm: 550, westDepthMm: 650, walkwayMm: 800}})
  assert.match(buildPlanSvg(ctx), /EAST 550D RUN/)
  assert.match(buildPlanSvg(ctx), /WEST 650D RUN/)
  assert.match(buildPlanDxf(ctx), /East base depth 550 mm/)
  assert.match(buildPlanDxf(ctx), /West counter depth 650 mm/)
})
