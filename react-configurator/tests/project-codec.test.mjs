import test from 'node:test';
import assert from 'node:assert/strict';
import {decodeProject,encodeProject,MAX_PROJECT_BYTES} from '../src/persistence/projectCodec.mjs';
import {kitchen,defaults,options,customProject} from './project-fixture.mjs';

const document=()=>encodeProject(customProject(),kitchen);
test('v1 round trip preserves custom positions, elevations, metadata, zeros and modules',()=>{
  const project=customProject();
  const saved=encodeProject(project,kitchen);
  assert.equal(saved.schemaVersion,1);
  assert.deepEqual(decodeProject(JSON.stringify(saved),options).state,project);
});
test('returned states/documents share no mutable references with input/defaults',()=>{
  const project=customProject();const saved=encodeProject(project,kitchen);const result=decodeProject(saved,options);
  result.state.east[0].subcomponents[0].label='changed';saved.east[0].y=1;
  assert.equal(project.east[0].y,2255);assert.equal(project.east[0].subcomponents[0].label,'Custom hob');
  assert.equal(defaults.east[0].y,2400);
});
test('legacy array shape never resets a non-preset hob or zero-sized placeholders',()=>{
  const legacy=customProject();
  assert.deepEqual(decodeProject(legacy,options).state,legacy);
  assert.equal(decodeProject(legacy,options).migratedFrom,0);
});
test('legacy partial settings use defaults not the currently open project',()=>{
  const legacy={east:customProject().east,west:customProject().west};
  const result=decodeProject(legacy,options);
  assert.equal(result.state.east[0].y,2255);
  assert.deepEqual(result.state.materials,defaults.materials);
  assert.ok(result.warnings.some(text=>text.includes('modules')));
});
test('legacy layoutModel conversion preserves z, hidden, fixed and shaft axis semantics',()=>{
  const model={room:kitchen,unit:'mm',appliances:[
    {id:'shaft',wall:'west',x:0,y:3908,z:0,width:609,depth:838,height:2700,locked:true},
    {id:'customShelf',wall:'east',x:1724,y:2111,z:1400,width:400,depth:300,height:200,hidden:true},
  ]};
  const {state}=decodeProject({layoutModel:model},options);
  assert.equal(state.west[0].w,838);assert.equal(state.west[0].d,609);assert.equal(state.west[0].fixed,true);
  assert.equal(state.east[0].z,1400);assert.equal(state.east[0].hidden,true);assert.equal(state.east[0].y,2111);
});
test('explicit legacy short aliases take precedence over rich shaft extents',()=>{
  const result=decodeProject({layoutModel:{room:kitchen,appliances:[{...defaults.west[0],wall:'west',width:838,depth:609}]}},options);
  assert.equal(result.state.west[0].w,838);assert.equal(result.state.west[0].d,609);
});
test('live arrays are authoritative over obsolete derived layoutModel geometry',()=>{
  const data=document();data.layoutModel={room:kitchen,appliances:[{id:'gas',y:1200}]};
  assert.equal(decodeProject(data,options).state.east[0].y,2255);
});
test('draft rule violations remain loadable rather than reset to preset geometry',()=>{
  const project=customProject();project.east[0].x=-10;
  assert.equal(decodeProject(encodeProject(project,kitchen),options).state.east[0].x,-10);
});
for(const schemaVersion of [0,2,'1',null])test(`unsupported schema ${JSON.stringify(schemaVersion)} rejected`,()=>{
  const data=document();data.schemaVersion=schemaVersion;assert.throws(()=>decodeProject(data,options),/Unsupported/);
});
for(const key of ['width','length','height'])test(`room ${key} mismatch rejected`,()=>{
  const data=document();data.kitchen[key]++;assert.throws(()=>decodeProject(data,options),/does not match/);
});
for(const mutate of [
  d=>{d.format='other-app';},d=>{d.unit='cm';},d=>{d.east='bad';},d=>{delete d.west;},
  d=>{d.west[1].id=d.east[0].id;},d=>{d.east[0].y='2255';},d=>{d.east[0].hidden='false';},
  d=>{d.east[0].color='red" onclick="bad';},d=>{d.materials.cabinetBody='url(bad)';},
  d=>{d.modules.west=[{id:'bad',width:-1}];},d=>{d.modules='bad';},d=>{d.grid=30;},
  d=>{d.viewOptions.hide3DObstructions='false';},d=>{d.eastTopUpperDepth=0;},
  d=>{delete d.materials;},d=>{d.east[0].d=0;},
])test(`invalid document ${mutate.toString()} rejected without mutation`,()=>{
  const data=document();mutate(data);const before=structuredClone(data);
  assert.throws(()=>decodeProject(data,options));assert.deepEqual(data,before);
});
test('nonfinite numbers are rejected before stringify can conceal them',()=>{
  for(const value of [NaN,Infinity,-Infinity]){const p=customProject();p.east[0].y=value;assert.throws(()=>encodeProject(p,kitchen),/finite/);}
});
test('invalid JSON, missing arrays and nonsupported payloads are rejected',()=>{
  for(const data of ['{','null','[]','{}',{east:defaults.east},{schemaVersion:1}])assert.throws(()=>decodeProject(data,options));
});
test('byte order mark is accepted',()=>assert.deepEqual(decodeProject('\uFEFF'+JSON.stringify(document()),options).state,customProject()));
test('oversized and too deeply nested documents fail predictably',()=>{
  assert.throws(()=>decodeProject(' '.repeat(MAX_PROJECT_BYTES+1),options),/2 MiB/);
  const d=document();let cursor=d;for(let i=0;i<30;i++){cursor.extra={};cursor=cursor.extra;}
  assert.throws(()=>decodeProject(d,options),/nested/);
});
test('prototype-pollution keys and non-JSON values are rejected',()=>{
  assert.throws(()=>decodeProject('{"__proto__":{"polluted":true}}',options),/metadata key/);
  const d=document();d.east[0].meta={constructor:{prototype:{polluted:true}}};
  assert.throws(()=>decodeProject(d,options),/metadata key/);assert.equal({}.polluted,undefined);
  const p=customProject();p.east[0].extra=undefined;assert.throws(()=>encodeProject(p,kitchen));
});
test('explicit null fields are invalid, not silently replaced by legacy defaults',()=>{
  for(const mutate of [p=>{p.kitchen=null;},p=>{p.modules={east:null};},p=>{p.viewOptions={hide3DObstructions:null};},p=>{p.east[0].w=null;p.east[0].width=700;}]){
    const p=customProject();mutate(p);assert.throws(()=>decodeProject(p,options));
  }
});

test('known colorless hidden placeholders retain absent color during legacy migration',()=>{
  const base=structuredClone(defaults);delete base.east[1].color;
  const original=structuredClone(base);
  const result=decodeProject(base,{kitchen,defaults:original});
  assert.deepEqual(result.state,base);
  assert.equal(Object.hasOwn(result.state.east[1],'color'),false);
});
