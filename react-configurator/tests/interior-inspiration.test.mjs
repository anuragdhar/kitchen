import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {HOME_ROOMS} from '../src/home/rooms.mjs';import {validateInspiration,parseInspiration,mergeInspiration} from '../src/home/inspiration.mjs';
const item=()=>({id:'pin-1',room:'entry',title:'Wood entry',url:'https://www.pinterest.com/pin/123/',tags:['wood'],notes:'Concealed lighting',status:'idea'});
const library=items=>({schemaVersion:1,items});
const projectLibrary=()=>parseInspiration(fs.readFileSync(new URL('../../inspiration/library.json',import.meta.url),'utf8'));
test('room IDs unique and tour covers entry to balcony',()=>{assert.equal(new Set(HOME_ROOMS.map(r=>r.id)).size,12);assert.equal(HOME_ROOMS[0].id,'entry');assert.equal(HOME_ROOMS.at(-1).id,'balcony');});
test('reference JSON round trip and no mutation',()=>{const data={schemaVersion:1,items:[item()]};assert.deepEqual(parseInspiration(JSON.stringify(data)),data);});
test('unsupported schemas, duplicate IDs and unknown rooms rejected',()=>{for(const d of [{schemaVersion:2,items:[]},{schemaVersion:1,items:[item(),item()]},{schemaVersion:1,items:[{...item(),room:'unknown'}]}])assert.throws(()=>validateInspiration(d));});
test('unsafe reference URLs rejected',()=>{for(const url of ['javascript:alert(1)','data:text/html,bad','http://example.com','https://user:pass@example.com'])assert.throws(()=>validateInspiration({schemaVersion:1,items:[{...item(),url}]}));});
test('repository reference library is valid',()=>{assert.ok(Array.isArray(projectLibrary().items));});
test('requested Pinterest ideas are assigned to the correct rooms with design notes',()=>{
  const expected=[
    ['10133167907344307','drawing',/without a false ceiling/i],
    ['1124422231981618360','drawing',/without a false ceiling/i],
    ['10133167907411816','kitchen',/shaft wall/i],
    ['10133167907317939','kitchen',/appliance.garage/i],
    ['10133167907322682','kitchen',/wood texture/i],
    ['10133167907311153','kitchen',/spice/i],
    ['10133167907020356','bedroom3',/side of the bed/i],
  ];
  const data=projectLibrary();
  for(const [pin,room,note] of expected){
    const matches=data.items.filter(i=>i.url===`https://in.pinterest.com/pin/${pin}/`);
    assert.equal(matches.length,1,`Pin ${pin} must appear once`);
    assert.equal(matches[0].room,room);assert.match(matches[0].notes,note);
  }
  const bedroom=data.items.find(i=>i.id==='pinterest-10133167907020356');
  assert.match(bedroom.notes,/not used throughout the day/i);
});
test('project references can be added to an existing empty browser library',()=>{
  const seed=projectLibrary();assert.deepEqual(mergeInspiration(library([]),seed),seed);
});
test('merge preserves local edits and decisions, adds missing references and does not mutate',()=>{
  const local=library([{...item(),notes:'Keep my note',status:'rejected'}]);
  const incoming=library([item(),{...item(),id:'pin-2',url:'https://example.com/idea'}]);
  const before=JSON.stringify([local,incoming]);const merged=mergeInspiration(local,incoming);
  assert.equal(merged.items.length,2);assert.deepEqual(merged.items[0],local.items[0]);
  assert.equal(JSON.stringify([local,incoming]),before);
  assert.deepEqual(mergeInspiration(merged,incoming),merged);
});
test('merge deduplicates a Pinterest pin across regional hosts, tracking queries and IDs',()=>{
  const local=library([{...item(),id:'my-pin',url:'https://in.pinterest.com/pin/123/?tracking=local#saved',status:'selected'}]);
  const incoming=library([item(),{...item(),id:'pin-2',url:'https://pinterest.com/pin/123'}]);
  assert.deepEqual(mergeInspiration(local,incoming),local);
});
test('same reference can be used in another room but ID collisions never overwrite local data',()=>{
  const local=library([item()]);
  const incoming=library([{...item(),id:'other-room',room:'kitchen'}, {...item(),room:'bedroom3',notes:'Do not overwrite'}]);
  const merged=mergeInspiration(local,incoming);
  assert.equal(merged.items.length,2);assert.deepEqual(merged.items[0],local.items[0]);
  assert.equal(merged.items[1].room,'kitchen');
});
test('merge deduplicates other HTTPS references without treating lookalike hosts as Pinterest',()=>{
  const local=library([{...item(),url:'https://example.com/idea'}]);
  assert.equal(mergeInspiration(local,library([{...item(),id:'same-url',url:'https://example.com/idea'}])).items.length,1);
  const incoming=library([{...item(),id:'not-pinterest',url:'https://notpinterest.com/pin/123/'}]);
  assert.equal(mergeInspiration(library([item()]),incoming).items.length,2);
});
test('merge rejects invalid input and combined overflow without changing the browser library',()=>{
  const local=library([item()]);const before=JSON.stringify(local);
  assert.throws(()=>mergeInspiration(local,library([{...item(),room:'unknown'}])));
  assert.throws(()=>mergeInspiration(local,library([{...item(),url:'javascript:alert(1)'}])));
  assert.throws(()=>mergeInspiration({schemaVersion:2,items:[]},local));
  const full=library(Array.from({length:1000},(_,i)=>({...item(),id:`full-${i}`,url:`https://example.com/${i}`})));
  assert.throws(()=>mergeInspiration(full,local),/1000/);assert.equal(full.items.length,1000);
  assert.equal(JSON.stringify(local),before);
});
