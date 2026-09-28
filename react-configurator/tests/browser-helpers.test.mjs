import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const {parseArgs, openKitchen, readKitchenState, strictFailure, hasNonBlankCanvas} = require('../scripts/browser-helpers.cjs');

test('CLI accepts separated and equals arguments', () => {
  assert.deepEqual(parseArgs(['--url=http://localhost:5173', '--screenshot', 'a b.png', '--strict']),
    {url: 'http://localhost:5173', screenshot: 'a b.png', strict: true});
});
test('CLI rejects missing values, unknown flags, and unsupported schemes', () => {
  for (const args of [['--url'], ['--screenshot'], ['--url='], ['--screenshot='],
    ['--url', '--strict'], ['--unknown'], ['--url=file:///tmp/x'], ['--url=not-a-url']]) {
    assert.throws(() => parseArgs(args));
  }
});
test('help does not require Playwright', () => { assert.equal(parseArgs(['--help']).help, true); });

function withAPI(api, callback) {
  const original = globalThis.window;
  globalThis.window = {kitchenAPI: api};
  try { return callback(); }
  finally { if (original === undefined) delete globalThis.window; else globalThis.window = original; }
}
const api = () => ({getLayout: () => ({east: [], west: []}), validate: () => ({all: true}),
  getDimensions: () => ({width: 2324})});

test('inspection records unavailable optional APIs explicitly', () => {
  const summary = withAPI(api(), readKitchenState);
  assert.ok(summary.capabilities.unavailable.includes('getWalkway'));
  assert.equal(summary.walkway, null); assert.equal(strictFailure(summary), false);
});
test('missing required API is an error, not an empty result', () => {
  for (const name of ['getLayout', 'validate', 'getDimensions']) {
    const value = api(); delete value[name];
    assert.throws(() => withAPI(value, readKitchenState), new RegExp(name));
  }
});
test('thrown API calls are not swallowed', () => {
  const value = api(); value.validate = () => { throw new Error('broken'); };
  assert.throws(() => withAPI(value, readKitchenState), /validate failed/);
});
test('malformed required returns fail', () => {
  for (const [name, result] of [['getLayout', {}], ['getLayout', null], ['getDimensions', []],
    ['validate', {}], ['validate', {all: 'true'}], ['getValidationRows', [{status: 'unknown'}]]]) {
    const value = api(); value[name] = () => result;
    assert.throws(() => withAPI(value, readKitchenState), /Malformed/);
  }
});
test('strict mode rejects false and inconsistent validation', () => {
  assert.equal(strictFailure({validation: {all: false, rows: []}}), true);
  assert.equal(strictFailure({validation: {all: true, rows: [{status: 'fail'}]}}), true);
  assert.equal(strictFailure({validation: {all: true, rows: [{status: 'pass'}]}}), false);
  assert.equal(strictFailure(null), true);
});
test('whole-home page is opened before waiting for kitchen API', async () => {
  const calls = [];
  const page = {goto: async () => calls.push('goto'), evaluate: async () => false,
    getByRole: (role, options) => {
      assert.equal(role, 'button'); assert.equal(options.name, 'Open Kitchen');
      return {first: () => ({click: async () => calls.push('click')})};
    }, waitForFunction: async () => calls.push('wait')};
  await openKitchen(page, 'http://localhost:5173');
  assert.deepEqual(calls, ['goto', 'click', 'wait']);
});
test('already mounted kitchen needs no navigation click', async () => {
  let waited = false;
  const page = {goto: async () => {}, evaluate: async () => true,
    waitForFunction: async () => { waited = true; }};
  await openKitchen(page, 'http://localhost:5173'); assert.equal(waited, true);
});
test('missing canvas fails smoke inspection', async () => {
  assert.equal(await hasNonBlankCanvas({locator: () => ({first: () => ({count: async () => 0})})}), false);
});
