import test from 'node:test';
import assert from 'node:assert/strict';
import {getInitialKitchenView} from '../src/app/kitchenNavigation.mjs';

test('normal and unknown view requests keep the existing 3D default', () => {
  for (const search of ['', '?x=top', '?kitchenView=', '?kitchenView=invalid', '?kitchenView=TOP']) {
    assert.equal(getInitialKitchenView(search), 'three');
  }
});
test('recognized view preference is explicit and works with other query parameters', () => {
  for (const view of ['top', 'front', 'east', 'west', 'north', 'south', 'three', 'references']) {
    assert.equal(getInitialKitchenView(`?x=1&kitchenView=${view}&y=2`), view);
  }
});
