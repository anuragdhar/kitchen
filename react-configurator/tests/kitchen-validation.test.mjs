import test from 'node:test';
import assert from 'node:assert/strict';
import {REQUIRED_RULE_IDS, summarizeValidation, getPlanDimensions, findVolumeCollisions,
  buildKitchenValidationRows} from '../src/domain/kitchenValidation.mjs';

const box = (id, overrides = {}) => ({id, x: 0, y: 0, z: 0, w: 100, d: 100, h: 100, ...overrides});
function fixture() {
  return {
    kitchen: {width: 2324, length: 4746, height: 2700, westCounterDepth: 600,
      walkway: {floor: 1124, eye: 1004}, westGap: {from: 0, to: 610}, shaft: {y: 3908}},
    eastDepthMm: 600, northHobOptionY: 2400,
    east: [
      box('microwave', {x: 1924, w: 600, d: 400, h: 350, z: 1360, open: true}),
      box('applianceGarage', {x: 1724, w: 850, d: 600, h: 450, z: 900, open: true}),
      box('gas', {x: 1724, y: 2400, w: 700, d: 600, h: 900, z: undefined}),
      box('eastBacksplashSlider', {x: 2222, w: 4746, d: 102, h: 450, z: 900, backsplashSlider: true}),
    ],
    west: [
      box('shaft', {y: 3908, w: 838, d: 609, h: 2700, fixed: true}),
      box('washing', {y: 610, w: 600, d: 600, h: 880, open: true}),
      box('sink', {y: 1210, w: 762, d: 457, h: 900}),
      box('sinkUpperDishRack', {y: 1210, w: 762, d: 320, h: 700, z: 1350}),
      box('dishwasher', {y: 1972, w: 600, d: 600, h: 880, open: true}),
      box('westSixInchSlider', {y: 2572, w: 552, d: 152, h: 450, z: 900, backsplashSlider: true}),
    ],
  };
}
const validate = input => summarizeValidation(buildKitchenValidationRows(input));
const passRows = () => REQUIRED_RULE_IDS.map(id => ({id, status: 'pass'}));

test('summary requires every rule, including non-order rules', () => {
  assert.equal(summarizeValidation(passRows()).all, true);
  for (const id of REQUIRED_RULE_IDS) {
    const rows = passRows(); rows.find(row => row.id === id).status = 'fail';
    assert.equal(summarizeValidation(rows).all, false, id);
  }
});
test('empty, missing, duplicate and unknown-status rows cannot pass', () => {
  for (const rows of [[], passRows().slice(1), [...passRows(), passRows()[0]],
    [...passRows(), {id: 'pending-check', status: 'unknown'}], [...passRows(), null]]) {
    assert.equal(summarizeValidation(rows).all, false);
  }
  assert.throws(() => summarizeValidation(null), TypeError);
});
test('nominal plan dimensions use both actual base depths', () => {
  assert.equal(getPlanDimensions({width: 2324, length: 4746}, 600, 600).walkwayMm, 1124);
  assert.equal(getPlanDimensions({width: 2400, length: 4800}, 650, 500).walkwayMm, 1250);
  for (const bad of [NaN, Infinity, '600', null, 0, -1]) {
    assert.throws(() => getPlanDimensions({width: 2324, length: 4746}, bad, 600), TypeError);
  }
});
test('all-pair checking finds a non-neighbor overlapping an enclosing interval', () => {
  const boxes = [box('a', {w: 1000}), box('b', {y: 200, z: 200}), box('c', {y: 800})];
  const before = structuredClone(boxes);
  assert.deepEqual(findVolumeCollisions(boxes), [['a', 'c']]);
  assert.deepEqual(boxes, before);
});
test('3D separation and face contact do not collide; true overlap does', () => {
  for (const key of ['x', 'y', 'z']) {
    assert.deepEqual(findVolumeCollisions([box('a'), box('b', {[key]: 100})]), []);
    assert.deepEqual(findVolumeCollisions([box('a'), box('b', {[key]: 99})]), [['a', 'b']]);
  }
});
test('baseline fixture passes without mutation', () => {
  const input = fixture(), before = structuredClone(input);
  assert.equal(validate(input).all, true);
  assert.deepEqual(input, before);
});
test('both orders pass but misaligned rack makes overall result fail', () => {
  const input = fixture(); input.west.find(item => item.id === 'sinkUpperDishRack').y += 1;
  const result = validate(input);
  assert.equal(result.eastOk, true); assert.equal(result.westOk, true); assert.equal(result.all, false);
  assert.equal(result.rows.find(row => row.id === 'sink-storage').status, 'fail');
});
test('nominal aisle below the configured minimum is a real failure', () => {
  const input = fixture(); input.eastDepthMm = 650;
  const result = validate(input);
  assert.equal(result.rows.find(row => row.id === 'walkway-minimum').status, 'fail');
  assert.equal(result.all, false);
});
test('fixed objects are checked for door clearance, bounds and collision', () => {
  const input = fixture(); input.west.push(box('fixed-obstruction', {y: 500, w: 200, fixed: true}));
  const result = validate(input);
  assert.equal(result.rows.find(row => row.id === 'door-clear-zone').status, 'fail');
  assert.equal(result.rows.find(row => row.id === 'collision').status, 'fail');
  input.west.at(-1).z = 2650;
  assert.equal(validate(input).rows.find(row => row.id === 'bounds').status, 'fail');
});
test('collisions are checked across walls, not only within each run', () => {
  const input = fixture();
  input.east.push(box('east-in-aisle', {x: 900, y: 3000, d: 300}));
  input.west.push(box('west-in-aisle', {x: 1000, y: 3000, d: 300}));
  assert.equal(validate(input).rows.find(row => row.id === 'collision').status, 'fail');
});
test('hidden placeholders stay inactive; malformed visibility fails closed', () => {
  const input = fixture(); input.east.push(box('historical', {w: 0, d: 0, h: 0, hidden: true}));
  assert.equal(validate(input).all, true);
  input.east.at(-1).hidden = 'true';
  assert.equal(validate(input).all, false);
});
test('invalid coordinates do not produce a successful or partial success', () => {
  const input = fixture(); input.east[0].x = NaN;
  const result = validate(input);
  assert.equal(result.all, false);
  assert.equal(result.rows[0].id, 'geometry-inputs');
});
test('materials do not alter the geometry-validation result', () => {
  const input = fixture(), before = validate(input);
  for (const item of [...input.east, ...input.west]) item.color = '#123456';
  assert.deepEqual(validate(input), before);
});
