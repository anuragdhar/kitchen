import test from 'node:test';
import assert from 'node:assert/strict';
import {KITCHEN, EAST_INIT, WEST_INIT, AIRY_WEST_INIT, EAST_BASE_DEPTH,
  WEST_COUNTER_DEPTH, autoFillModules} from '../src/config/kitchenConfig.js';
import {checkLayoutBasics} from '../src/domain/layoutChecks.mjs';

// Characterization of 898a765, not approval of the real-world design.
// Deliberate geometry changes need reviewed updates, not blanket rebaselining.
const geometry = items => items.filter(item => !item.hidden).map(item =>
  [item.id, item.x, item.y, item.z ?? 0, item.w, item.d, item.h]);
const constraints = {eastDepthMm: EAST_BASE_DEPTH, westDepthMm: WEST_COUNTER_DEPTH,
  minimumWalkwayMm: 1124, westClearFromMm: KITCHEN.westGap.from, westClearToMm: KITCHEN.westGap.to};

test('room, opening and clearance baseline is preserved', () => {
  assert.deepEqual([KITCHEN.width, KITCHEN.length, KITCHEN.height], [2324, 4746, 2700]);
  assert.deepEqual(KITCHEN.door, {w: 855, x: 0});
  assert.deepEqual(KITCHEN.westGap, {from: 0, to: 610, w: 610});
  assert.deepEqual([KITCHEN.window.w, KITCHEN.window.sill, KITCHEN.window.x], [1100, 914, 612]);
  assert.equal(KITCHEN.window.h + KITCHEN.window.sill, KITCHEN.height);
  assert.deepEqual([EAST_BASE_DEPTH, WEST_COUNTER_DEPTH], [600, 600]);
});
test('active east geometry stays on the cooking/appliance wall', () => {
  assert.deepEqual(geometry(EAST_INIT), [
    ['microwave', 1924, 0, 1360, 600, 400, 350],
    ['applianceGarage', 1724, 0, 900, 850, 600, 450],
    ['eastBacksplashSlider', 2222, 0, 900, 4746, 102, 450],
    ['gas', 1724, 2400, 0, 700, 600, 900],
  ]);
});
test('active west geometry stays on the wet wall', () => {
  assert.deepEqual(geometry(WEST_INIT), [
    ['shaft', 0, 3908, 0, 838, 609, 2700],
    ['washing', 0, 610, 0, 600, 600, 880],
    ['sink', 0, 1210, 0, 762, 457, 900],
    ['sinkUpperDishRack', 0, 1210, 1350, 762, 320, 700],
    ['dishwasher', 0, 1972, 0, 600, 600, 880],
    ['westSixInchSlider', 0, 2572, 900, 552, 152, 450],
  ]);
});
test('historical placeholders remain hidden, with stable IDs', () => {
  assert.deepEqual(EAST_INIT.filter(item => item.hidden).map(item => item.id),
    ['garage_NE', 'garage_SE', 'geyserEastTop']);
  assert.deepEqual(WEST_INIT.filter(item => item.hidden).map(item => item.id),
    ['waterpurifier', 'trashCan', 'geyser', 'westGarage', 'gasWestRemoved',
      'powerPointWest1', 'powerPointWest2', 'powerPointEast1', 'powerPointEast2']);
});
test('baseline and airy variants pass the documented basic checks', () => {
  for (const west of [WEST_INIT, AIRY_WEST_INIT]) {
    const result = checkLayoutBasics({room: KITCHEN, east: EAST_INIT, west}, constraints);
    assert.equal(result.valid, true, JSON.stringify(result.issues));
    assert.equal(result.measurements.walkwayFloorMm, KITCHEN.walkway.floor);
  }
});
test('airy option changes only the intended y positions', () => {
  const positions = {dishwasher: 1946, sink: 2546, sinkUpperDishRack: 2546, washing: 3308, westSixInchSlider: 1200};
  assert.deepEqual(AIRY_WEST_INIT, WEST_INIT.map(item =>
    positions[item.id] === undefined ? {...item} : {...item, y: positions[item.id]}));
});
test('shaft ends at the north wall and rack follows baseline sink', () => {
  const byId = Object.fromEntries(WEST_INIT.map(item => [item.id, item]));
  assert.equal(byId.shaft.y + byId.shaft.w, KITCHEN.length);
  assert.equal(byId.sinkUpperDishRack.y, byId.sink.y);
  assert.equal(byId.sinkUpperDishRack.w, byId.sink.w);
});
test('module fill preserves run lengths including fractional fillers', () => {
  for (const length of [0, 18, 299.5, 300, 900, 4746, 4136]) {
    const modules = autoFillModules(length);
    assert.equal(modules.reduce((sum, item) => sum + item.width, 0), length);
    assert.ok(modules.every(item => item.width > 0));
    assert.equal(new Set(modules.map(item => item.id)).size, modules.length);
  }
});
