import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {HOME_ROOMS} from '../src/home/rooms.mjs';import {validateInspiration,parseInspiration} from '../src/home/inspiration.mjs';
const item=()=>({id:'pin-1',room:'entry',title:'Wood entry',url:'https://www.pinterest.com/pin/123/',tags:['wood'],notes:'Concealed lighting',status:'idea'});
test('room IDs unique and tour covers entry to balcony',()=>{assert.equal(new Set(HOME_ROOMS.map(r=>r.id)).size,12);assert.equal(HOME_ROOMS[0].id,'entry');assert.equal(HOME_ROOMS.at(-1).id,'balcony');});
test('reference JSON round trip and no mutation',()=>{const data={schemaVersion:1,items:[item()]};assert.deepEqual(parseInspiration(JSON.stringify(data)),data);});
test('unsupported schemas, duplicate IDs and unknown rooms rejected',()=>{for(const d of [{schemaVersion:2,items:[]},{schemaVersion:1,items:[item(),item()]},{schemaVersion:1,items:[{...item(),room:'unknown'}]}])assert.throws(()=>validateInspiration(d));});
test('unsafe reference URLs rejected',()=>{for(const url of ['javascript:alert(1)','data:text/html,bad','http://example.com','https://user:pass@example.com'])assert.throws(()=>validateInspiration({schemaVersion:1,items:[{...item(),url}]}));});
test('repository reference library is valid',()=>{assert.ok(Array.isArray(parseInspiration(fs.readFileSync('../inspiration/library.json','utf8')).items));});
