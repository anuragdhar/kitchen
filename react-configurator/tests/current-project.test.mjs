import test from 'node:test';
import assert from 'node:assert/strict';
import {KITCHEN,EAST_INIT,WEST_INIT,AIRY_WEST_INIT,EAST_TOP_UPPER_DEPTH,WEST_TOP_UPPER_DEPTH,autoFillModules,LAYOUT_MODEL} from '../src/config/kitchenConfig.js';
import {DEFAULT_MATERIALS} from '../src/config/renderConfig.js';
import {decodeProject,encodeProject} from '../src/persistence/projectCodec.mjs';
const defaults={east:EAST_INIT,west:WEST_INIT,grid:0,materials:DEFAULT_MATERIALS,
  eastModules:autoFillModules(KITCHEN.length),westModules:autoFillModules(KITCHEN.length-KITCHEN.westGap.to),
  eastTopUpperDepth:EAST_TOP_UPPER_DEPTH,westTopUpperDepth:WEST_TOP_UPPER_DEPTH,hide3DObstructions:true};
const options={kitchen:KITCHEN,defaults};
for(const [name,west] of [['baseline',WEST_INIT],['airy',AIRY_WEST_INIT]])test(`real ${name} configuration has a lossless v1 round trip`,()=>{
  const state=structuredClone({...defaults,west});
  assert.deepEqual(decodeProject(JSON.stringify(encodeProject(state,KITCHEN)),options).state,state);
});
test('real custom hob and shelf elevation survive legacy migration without changing configuration',()=>{
  const before=JSON.stringify(EAST_INIT);const state=structuredClone(defaults);
  state.east.find(item=>item.id==='gas').y=2222;state.west.find(item=>item.id==='sinkUpperDishRack').z=1501;
  const result=decodeProject(state,options);
  assert.deepEqual(result.state,state);assert.equal(JSON.stringify(EAST_INIT),before);
});
test('real model-only format maps shaft dimensions and does not reset the stored hob',()=>{
  const {state}=decodeProject({layoutModel:LAYOUT_MODEL},options);
  assert.equal(state.west.find(item=>item.id==='shaft').w,KITCHEN.shaft.l);
  assert.equal(state.west.find(item=>item.id==='shaft').d,KITCHEN.shaft.w);
  assert.equal(state.east.find(item=>item.id==='gas').y,1200);
});
