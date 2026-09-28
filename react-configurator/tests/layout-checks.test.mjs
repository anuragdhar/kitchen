import test from 'node:test';
import assert from 'node:assert/strict';
import {checkLayoutBasics} from '../src/domain/layoutChecks.mjs';

const constraints = {eastDepthMm: 600, westDepthMm: 600, minimumWalkwayMm: 1124,
  westClearFromMm: 0, westClearToMm: 610};
const fixture = () => ({room: {width: 2324, length: 4746, height: 2700}, east: [],
  west: [{id: 'washer', x: 0, y: 610, z: 0, w: 600, d: 600, h: 880}]});
const has = (result, rule) => result.issues.some(issue => issue.ruleId === rule);

test('valid fixture passes without mutation', () => {
  const layout = fixture(); const before = structuredClone(layout);
  assert.deepEqual(checkLayoutBasics(layout, constraints), {
    valid: true, issues: [], measurements: {walkwayFloorMm: 1124},
  });
  assert.deepEqual(layout, before);
});
test('a real reduction in the nominal aisle fails', () => {
  const result = checkLayoutBasics(fixture(), {...constraints, eastDepthMm: 650});
  assert.equal(result.valid, false); assert.equal(result.measurements.walkwayFloorMm, 1074);
  assert.ok(has(result, 'walkway-minimum'));
});
test('door-zone violation reports its object and overlap', () => {
  const layout = fixture(); layout.west[0].y = 560;
  const result = checkLayoutBasics(layout, constraints);
  assert.equal(result.valid, false);
  const issue = result.issues.find(value => value.ruleId === 'door-clear-zone');
  assert.deepEqual(issue.objectIds, ['washer']); assert.equal(issue.measured.overlapMm, 50);
});
test('full-height clear zone also checks fixed items', () => {
  const layout = fixture(); Object.assign(layout.west[0], {y: 20, z: 1500, h: 500, fixed: true});
  assert.ok(has(checkLayoutBasics(layout, constraints), 'door-clear-zone'));
});
for (const [key, value] of [['x', -1], ['y', 4700], ['z', -1], ['h', 2800], ['d', 2400]]) {
  test(`out-of-room ${key} fails`, () => {
    const layout = fixture(); layout.west[0][key] = value;
    assert.ok(has(checkLayoutBasics(layout, constraints), 'bounds'));
  });
}
for (const value of [NaN, Infinity, '600', null, 0, -1]) {
  test(`invalid dimension ${String(value)} fails`, () => {
    const layout = fixture(); layout.west[0].w = value;
    assert.ok(has(checkLayoutBasics(layout, constraints), 'item-shape'));
  });
}
test('malformed layout fails rather than reporting an empty success', () => {
  for (const input of [null, {}, {room: {width: 0, length: 1, height: 1}, east: [], west: []}]) {
    assert.ok(has(checkLayoutBasics(input, constraints), 'layout-shape'));
  }
});
test('constraints must be explicit, finite and in-room', () => {
  for (const input of [undefined, {}, {...constraints, minimumWalkwayMm: NaN},
    {...constraints, westClearToMm: 5000}, {...constraints, westClearFromMm: 700}]) {
    assert.ok(has(checkLayoutBasics(fixture(), input), 'constraints-shape'));
  }
});
test('duplicate IDs across walls fail', () => {
  const layout = fixture(); layout.east.push({...layout.west[0], x: 1724});
  assert.ok(has(checkLayoutBasics(layout, constraints), 'duplicate-id'));
});
test('hidden zero-sized placeholders are retained but inactive', () => {
  const layout = fixture(); layout.west.push({id: 'old', hidden: true, x: 0, y: 0, w: 0, d: 0, h: 0});
  assert.equal(checkLayoutBasics(layout, constraints).valid, true);
  layout.west[1].hidden = false;
  assert.ok(has(checkLayoutBasics(layout, constraints), 'item-shape'));
});
test('a string hidden flag must not hide an invalid item', () => {
  const layout = fixture(); layout.west[0].hidden = 'false';
  assert.ok(has(checkLayoutBasics(layout, constraints), 'item-shape'));
});
test('material changes do not change basic geometry-check results', () => {
  const layout = fixture(); const before = checkLayoutBasics(layout, constraints);
  layout.west[0].color = '#abcdef'; layout.materials = {cabinetBody: '#123456'};
  assert.deepEqual(checkLayoutBasics(layout, constraints), before);
});
test('touching an interval end is allowed; missing z means floor level', () => {
  const layout = fixture(); delete layout.west[0].z;
  assert.equal(checkLayoutBasics(layout, constraints).valid, true);
});
