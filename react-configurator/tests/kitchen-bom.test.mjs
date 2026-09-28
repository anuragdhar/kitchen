import test from 'node:test'
import assert from 'node:assert/strict'
import {buildBOM, buildBOMCsv, buildBOMMarkdown} from '../src/kitchen/export/bom.mjs'

// Extracted from App.jsx (docs/REFACTOR_PLAN.md Phase 4); a minimal synthetic
// fixture rather than the live kitchenConfig.js defaults, since those are
// already covered by a byte-identical live-browser snapshot (CSV/Markdown/
// getBOM() JSON) taken before/after the extraction.
const isCabinetLikeItem = it => !String(it.id||'').startsWith('powerPoint')
const planLabel = id => ({gas:'Gas cooktop', sink:'Sink'}[id] || id)

function bomCtx(overrides = {}) {
  const KITCHEN = {westGap: {to: 600}, shaft: {y: 3800}}
  return {
    KITCHEN, eastRunLength: 4000, westRunLength: 3400, BACKSPLASH_HEIGHT: 600,
    eastModules: [{width: 700, drawers: 2}, {width: 300, drawers: 0}],
    westModules: [{width: 600, drawers: 1}],
    activeEast: [{id: 'gas', y: 500, w: 700, d: 600}],
    activeWest: [{id: 'sink', y: 700, w: 600, d: 600}, {id: 'powerPointWest1', y: 200, w: 100, d: 50}],
    isCabinetLikeItem, planLabel, ...overrides,
  }
}

test('buildBOM counts modules/drawers and excludes power points from the appliance list', () => {
  const bom = buildBOM(bomCtx())
  assert.equal(bom.baseCount, 3) // 2 east + 1 west modules
  assert.equal(bom.drawerCount, 3) // 2 + 0 + 1
  assert.equal(bom.counterLenMm, 7400) // 4000 + 3400
  assert.equal(bom.counterLenM, '7.40')
  assert.deepEqual(bom.appliances.map(a => a.id), ['gas', 'sink']) // powerPointWest1 excluded
  assert.equal(bom.appliances[0].label, 'Gas cooktop')
})

test('buildBOM does not mutate its input', () => {
  const ctx = bomCtx()
  const before = structuredClone({...ctx, isCabinetLikeItem: undefined, planLabel: undefined})
  buildBOM(ctx)
  assert.deepEqual({...ctx, isCabinetLikeItem: undefined, planLabel: undefined}, before)
})

test('buildBOMCsv quotes every field and includes one row per appliance and note', () => {
  const bom = buildBOM(bomCtx())
  const csv = buildBOMCsv({bom, eastTopUpperDepth: 350, westTopUpperDepth: 450, COUNTER_THICKNESS: 20, BACKSPLASH_HEIGHT: 600, planLabel})
  const rows = csv.split('\n')
  assert.equal(rows[0], '"Item","Quantity","Dimensions","Notes"')
  assert.ok(rows.some(r => r.includes('"Appliance gas"') && r.includes('"Gas cooktop"')))
  assert.ok(rows.some(r => r.includes('"Appliance sink"') && r.includes('"Sink"')))
  assert.ok(rows.some(r => r.includes('"Door clear zone y0-y600"')))
  assert.equal(rows.length, 9 /* header + 8 summary rows */ + 2 /* appliances */ + 6 /* notes */)
})

test('buildBOMMarkdown lists every module row and every appliance', () => {
  const bom = buildBOM(bomCtx())
  const renderMaterials = {cabinetBody: '#111', shutters: '#222', counter: '#333', backsplash: '#444', floor: '#555', wall: '#666'}
  const md = buildBOMMarkdown({bom, KITCHEN: bomCtx().KITCHEN, COUNTER_THICKNESS: 20, BACKSPLASH_HEIGHT: 600, eastRunLength: 4000, westRunLength: 3400, eastTopUpperDepth: 350, westTopUpperDepth: 450, renderMaterials})
  assert.match(md, /^# Kitchen BOM/)
  assert.match(md, /\| 1 \| 700 \| undefined \|/) // east module row (fixture has no `type`)
  assert.match(md, /\| east \| gas \| 500 \| 700x600 \|/)
  assert.match(md, /\| west \| sink \| 700 \| 600x600 \|/)
  assert.match(md, /Cabinet body #111/)
})
