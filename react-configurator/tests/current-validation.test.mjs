import test from 'node:test';
import assert from 'node:assert/strict';
import {KITCHEN, EAST_INIT, WEST_INIT, AIRY_WEST_INIT, EAST_BASE_DEPTH, NORTH_HOB_OPTION_Y_MM}
  from '../src/config/kitchenConfig.js';
import {buildKitchenValidationRows, summarizeValidation} from '../src/domain/kitchenValidation.mjs';

for (const [name, west] of [['baseline', WEST_INIT], ['airy', AIRY_WEST_INIT]]) {
  for (const refined of [false, true]) {
    test(`actual ${name} configuration passes with ${refined ? 'refined' : 'baseline'} east`, () => {
      const east = structuredClone(EAST_INIT);
      if (refined) Object.assign(east.find(item => item.id === 'applianceGarage'), {
        w: 600, d: 500, h: 420, x: KITCHEN.width - 500,
      });
      const args = {east, west, kitchen: KITCHEN, eastDepthMm: EAST_BASE_DEPTH, northHobOptionY: NORTH_HOB_OPTION_Y_MM};
      const before = structuredClone(args);
      const result = summarizeValidation(buildKitchenValidationRows(args));
      assert.equal(result.all, true, JSON.stringify(result.rows.filter(row => row.status === 'fail')));
      assert.deepEqual(args, before);
    });
  }
}
