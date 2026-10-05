import test from 'node:test'
import assert from 'node:assert/strict'
import {KITCHEN, EAST_INIT, WEST_INIT, KITCHEN_AUTOSAVE_KEY, NORTH_HOB_OPTION_Y_MM, EAST_TOP_UPPER_DEPTH, WEST_TOP_UPPER_DEPTH} from '../src/config/kitchenConfig.js'
import {readSavedKitchen, wholeHomeKitchenItems, wholeHomeBaseSpans, wholeHomeUpperRuns} from '../src/kitchen/wholeHomeKitchen.mjs'

const storageWith = entries => () => ({getItem: key => (key in entries ? entries[key] : null)})

test('with nothing saved the whole-home kitchen draws the default runs', () => {
  assert.deepEqual(readSavedKitchen(storageWith({})), {})
  assert.deepEqual(readSavedKitchen(storageWith({[KITCHEN_AUTOSAVE_KEY]: 'not json'})), {})
  assert.deepEqual(readSavedKitchen(() => { throw new Error('storage blocked') }), {})
  const items = wholeHomeKitchenItems({})
  assert.equal(items.length, EAST_INIT.length + WEST_INIT.length)
  const shaft = items.find(item => item.id === 'shaft')
  assert.deepEqual([shaft.y, shaft.w, shaft.d], [KITCHEN.shaft.y, KITCHEN.shaft.l, KITCHEN.shaft.w])
})

test('default base spans: the east run is solid, the west run stops at the washing machine, sink and dishwasher', () => {
  const spans = wholeHomeBaseSpans({}, wholeHomeKitchenItems({}))
  const east = spans.filter(s => s.side === 'east'), west = spans.filter(s => s.side === 'west')
  assert.equal(east.reduce((sum, s) => sum + s.end - s.start, 0), KITCHEN.length)
  assert.deepEqual(west.map(s => [s.start, s.end]), [[3846, 4746], [2946, 3846], [2572, 2946]])
  const wet = wholeHomeKitchenItems({}).filter(i => ['washing', 'sink', 'dishwasher'].includes(i.id))
  for (const s of west) for (const item of wet) assert.ok(s.end <= item.y || s.start >= item.y + item.w, `${s.start}-${s.end} overlaps ${item.id}`)
})

test('default upper runs: the west lower wall cabinets stop either side of the dish rack', () => {
  const [east, west] = wholeHomeUpperRuns({}, wholeHomeKitchenItems({}))
  assert.deepEqual([east.side, east.start, east.end, east.upperDepth, east.rack], ['east', 0, KITCHEN.length, EAST_TOP_UPPER_DEPTH, null])
  assert.deepEqual([west.side, west.start, west.upperDepth, west.rack.id], ['west', KITCHEN.westGap.to, WEST_TOP_UPPER_DEPTH, 'sinkUpperDishRack'])
  assert.deepEqual(west.lowerSpans, [[KITCHEN.westGap.to, west.rack.y], [west.rack.y + west.rack.w, KITCHEN.length]])
})

test('saved modules, depths and items are used; a hob saved at the old y 1350 moves to the north option', () => {
  const saved = {
    east: EAST_INIT.map(i => i.id === 'gas' ? {...i, y: 1350} : i),
    west: WEST_INIT.map(i => i.id === 'sinkUpperDishRack' ? {...i, hidden: true} : i),
    eastModules: [{width: 600}, {width: 0}, {width: '450'}], westModules: [{width: 1200}],
    eastTopUpperDepth: 400, westTopUpperDepth: '350',
  }
  const items = wholeHomeKitchenItems(saved)
  assert.equal(items.find(i => i.id === 'gas').y, NORTH_HOB_OPTION_Y_MM)
  assert.deepEqual(wholeHomeBaseSpans(saved, items).map(s => [s.side, s.start, s.end]), [['east', 4146, 4746], ['east', 3696, 4146], ['west', 3546, 4746]])
  const [east, west] = wholeHomeUpperRuns(saved, items)
  assert.deepEqual([east.upperDepth, west.upperDepth, west.rack, west.lowerSpans], [400, 350, undefined, [[KITCHEN.westGap.to, KITCHEN.length]]])
})
