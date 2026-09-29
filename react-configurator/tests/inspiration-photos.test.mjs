import test from 'node:test';
import assert from 'node:assert/strict';
import {MAX_PHOTOS,validatePhotos,validateInspiration,parseInspiration,mergeInspiration} from '../src/home/inspiration.mjs';
const item=(overrides={})=>({id:'pin',room:'drawing',title:'Original idea',url:'https://in.pinterest.com/pin/123/',tags:[],notes:'Keep this',status:'selected',...overrides});
const photo=(id='one',overrides={})=>({id,src:`asset:${id}`,caption:id,kind:'image',...overrides});
const library=items=>({schemaVersion:1,items});
test('photo schema remains optional and legacy libraries round-trip unchanged',()=>{
  const old=library([item()]);assert.deepEqual(parseInspiration(JSON.stringify(old)),old);
  const next=library([item({photos:[photo(),photo('two',{src:'/inspiration-media/pin-123-frame-2.webp',kind:'video-frame',timeSeconds:2.5,sourceUrl:'https://www.pinterest.com/pin/123/',sourceMediaUrl:'https://v1.pinimg.com/video.mp4',capturedAt:'2026-09-29T12:00:00Z'})]})]);
  assert.deepEqual(parseInspiration(JSON.stringify(next)),next);
});
test('unsafe or remote photo locations and invalid IDs are rejected',()=>{
  for(const src of ['https://example.com/image.jpg','http://example.com/image.jpg','javascript:alert(1)','data:image/svg+xml,bad','blob:other-origin','/inspiration-media/../private.jpg','/inspiration-media/%2e%2e.jpg','/inspiration-media/x.svg','asset:../../x','//evil.example/image.jpg'])assert.throws(()=>validatePhotos([photo('one',{src})]),undefined,src);
  for(const id of ['', '../x','a b','x'.repeat(101)])assert.throws(()=>validatePhotos([photo(id)]));
});
test('photo limits, duplicate IDs and invalid metadata fail before persistence',()=>{
  assert.equal(validatePhotos(Array.from({length:MAX_PHOTOS},(_,i)=>photo(`p${i}`))).length,MAX_PHOTOS);
  assert.throws(()=>validatePhotos(Array.from({length:MAX_PHOTOS+1},(_,i)=>photo(`p${i}`))));
  assert.throws(()=>validatePhotos([photo(),photo()]));
  for(const value of [null,{},'not an array'])assert.throws(()=>validatePhotos(value));
  for(const overrides of [{kind:'video'},{caption:'x'.repeat(501)},{timeSeconds:-1},{timeSeconds:Infinity},{timeSeconds:'2'},{sourceUrl:'javascript:alert(1)'},{sourceMediaUrl:'https://user:secret@example.com/x'},{capturedAt:'not a date'}])assert.throws(()=>validatePhotos([photo('one',overrides)]));
});
test('explicit merge enriches matching old references while preserving local captions, order and decisions',()=>{
  const local=library([item({id:'local',photos:[photo('cover',{caption:'My caption'})]})]);
  const incoming=library([item({notes:'Replace?',status:'idea',url:'https://www.pinterest.com/pin/123/?tracking=1',photos:[photo('cover',{caption:'Other caption'}),photo('detail')]})]);
  const before=JSON.stringify([local,incoming]),merged=mergeInspiration(local,incoming);
  assert.equal(merged.items.length,1);assert.equal(merged.items[0].notes,'Keep this');assert.equal(merged.items[0].status,'selected');
  assert.deepEqual(merged.items[0].photos,[photo('cover',{caption:'My caption'}),photo('detail')]);
  assert.equal(JSON.stringify([local,incoming]),before);assert.deepEqual(mergeInspiration(merged,incoming),merged);
});
test('merge deduplicates media paths and never attaches photos from unrelated ID collisions',()=>{
  const local=library([item({photos:[photo()]})]);
  const same=library([item({photos:[photo('other-id',{src:'asset:one'})]})]);assert.deepEqual(mergeInspiration(local,same),local);
  const different=library([item({url:'https://example.com/unrelated',photos:[photo('unrelated')]})]);assert.deepEqual(mergeInspiration(local,different),local);
});
test('merge respects per-reference cap and does not resurrect removed photos until requested',()=>{
  const full=library([item({photos:Array.from({length:MAX_PHOTOS},(_,i)=>photo(`p${i}`))})]);
  assert.deepEqual(mergeInspiration(full,library([item({photos:[photo('extra')]})])),full);
  const removed=library([item({photos:[]})]);assert.deepEqual(parseInspiration(JSON.stringify(removed)),removed);
  assert.equal(mergeInspiration(removed,library([item({photos:[photo()]})])).items[0].photos.length,1);
});
