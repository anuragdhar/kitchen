import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {resolveArchvizProfiles} from '../src/render/archvizProfiles.mjs';
const read = path => JSON.parse(fs.readFileSync(new URL(path, import.meta.url)));
const baseline = () => read('../../blender/tests/fixtures/archviz-profiles-v1.json');
const manifest = () => read('../../configs/archviz-profiles.json');
const room = name => read(`../../configs/${name}`);

test('v1 to independently owned v2 round trip preserves every profile setting', () => {
 const old=baseline(), before=structuredClone(old);
 const split={version:2,quality:old.quality,rooms:Object.fromEntries(Object.keys(old.rooms).map(id=>[id,`archviz/rooms/${id}.json`]))};
 const files=Object.fromEntries(Object.entries(old.rooms).map(([id,p])=>[`archviz/rooms/${id}.json`,p]));
 assert.deepEqual(resolveArchvizProfiles(split,p=>files[p]),old);
 assert.deepEqual(resolveArchvizProfiles(old,()=>assert.fail('Legacy must not read files')),old);
 assert.deepEqual(old,before);
});
test('production profiles retain supported rooms and source routing', () => {
 const p=resolveArchvizProfiles(manifest(),room);
 assert.deepEqual(Object.keys(p.rooms),Object.keys(baseline().rooms));
 assert.equal(p.rooms.kitchen.native,undefined);assert.equal(p.rooms.balcony.native,undefined);
 assert.match(p.rooms.drawing.native,/drawing_room\/elegant/);
});
test('editing one room never mutates another room or the source documents', () => {
 const p=resolveArchvizProfiles(manifest(),room), q=resolveArchvizProfiles(manifest(),room);
 p.rooms.kitchen.lens+=1;
 assert.notDeepEqual(p.rooms.kitchen,q.rooms.kitchen);assert.deepEqual(p.rooms.balcony,q.rooms.balcony);
});
test('missing files and path traversal fail instead of using historical defaults', () => {
 for(const name of ['../secret.json','https://x/a.json','archviz/rooms/drawing.json']){
  const m=manifest();m.rooms.kitchen=name;
  assert.throws(()=>resolveArchvizProfiles(m,()=>assert.fail('Must not read bad paths')));
 }
 assert.throws(()=>resolveArchvizProfiles(manifest(),()=>undefined));
});
test('malformed camera, native source and quality settings are rejected', () => {
 for(const [key,value] of [['lens',true],['eyeHeight',NaN],['corner',[0,2]],['native','blender/../../x.blend'],['cameras','Camera'],['command','no']]){
  const m=baseline();m.rooms.kitchen[key]=value;assert.throws(()=>resolveArchvizProfiles(m));
 }
 for(const version of [true,0,3])assert.throws(()=>resolveArchvizProfiles({...baseline(),version}));
 const m=baseline();m.quality.draft.samples=0;assert.throws(()=>resolveArchvizProfiles(m));
});
