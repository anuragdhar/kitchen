import test from 'node:test';
import assert from 'node:assert/strict';
import {createProjectStorage,versionedStorageKey,loadNamedProject,saveNamedProject} from '../src/persistence/projectStorage.mjs';
import {encodeProject} from '../src/persistence/projectCodec.mjs';
import {options,kitchen,defaults,customProject,memoryStorage} from './project-fixture.mjs';
const legacyKey='kitchen-test',key=versionedStorageKey(legacyKey);
const raw=state=>JSON.stringify(encodeProject(state,kitchen));
const session=storage=>createProjectStorage(()=>storage,legacyKey,options);
test('legacy autosave migrates to a new key and original bytes are retained',()=>{
  const old=JSON.stringify(customProject());const storage=memoryStorage({[legacyKey]:old});const store=session(storage);
  const result=store.load();store.save(result.state);
  assert.equal(storage.getItem(legacyKey),old);assert.equal(JSON.parse(storage.getItem(key)).schemaVersion,1);
  assert.deepEqual(session(storage).load().state,customProject());
});
test('saving before load is rejected',()=>assert.throws(()=>session(memoryStorage()).save(defaults),/paused/));
test('new key takes precedence over old legacy state',()=>{
  const storage=memoryStorage({[legacyKey]:JSON.stringify(defaults),[key]:raw(customProject())});
  assert.deepEqual(session(storage).load().state,customProject());
});
test('corrupt versioned autosave is protected, not replaced by valid legacy or defaults',()=>{
  const storage=memoryStorage({[legacyKey]:JSON.stringify(defaults),[key]:'broken'});const store=session(storage);
  assert.throws(()=>store.load(),/Invalid/);assert.throws(()=>store.save(defaults),/paused/);assert.equal(storage.getItem(key),'broken');
});
test('corrupt legacy autosave remains untouched',()=>{
  const storage=memoryStorage({[legacyKey]:'broken'});const store=session(storage);
  assert.throws(()=>store.load());assert.throws(()=>store.save(defaults));assert.equal(storage.getItem(legacyKey),'broken');assert.equal(storage.getItem(key),null);
});
test('previous valid autosave is recoverable without mutating primary',()=>{
  const storage=memoryStorage({[key]:raw(defaults)});const store=session(storage);store.load();store.save(customProject());
  assert.deepEqual(store.previousProject().state,defaults);assert.equal(storage.getItem(key),raw(customProject()));
});
test('unchanged saves do not consume backup writes',()=>{
  const storage=memoryStorage({[key]:raw(defaults)});const store=session(storage);store.load();
  storage.setItem=()=>{throw new Error('must not write');};store.save(defaults);
});
test('quota failure on backup leaves primary unchanged',()=>{
  const storage=memoryStorage({[key]:raw(defaults)});const store=session(storage);store.load();
  storage.setItem=()=>{throw new Error('QuotaExceededError');};assert.throws(()=>store.save(customProject()),/Quota/);
  assert.equal(storage.getItem(key),raw(defaults));
});
test('failed primary write preserves both old primary and backup',()=>{
  const storage=memoryStorage({[key]:raw(defaults)});const store=session(storage);store.load();
  const write=storage.setItem;storage.setItem=(k,v)=>{if(k===key)throw new Error('quota');write(k,v);};
  assert.throws(()=>store.save(customProject()),/quota/);assert.equal(storage.getItem(key),raw(defaults));assert.equal(storage.getItem(key+':previous'),raw(defaults));
});
test('another tab changing or clearing storage blocks stale autosave',()=>{
  for(const changed of [null,raw(customProject())]){
    const storage=memoryStorage({[key]:raw(defaults)});const store=session(storage);store.load();
    if(changed===null)storage.removeItem(key);else storage.setItem(key,changed);
    assert.throws(()=>store.save(defaults),/another tab/);assert.equal(storage.getItem(key),changed);
  }
});
test('explicit resume backs up unreadable/conflicting bytes before replacement',()=>{
  const storage=memoryStorage({[key]:'broken'});const store=session(storage);assert.throws(()=>store.load());
  store.resume(customProject());assert.equal(storage.getItem(key+':recovery'),'broken');
  assert.equal(storage.getItem(key),raw(customProject()));store.save(defaults);
});
test('failed recovery backup never overwrites the damaged original',()=>{
  const storage=memoryStorage({[key]:'broken'});const store=session(storage);assert.throws(()=>store.load());
  storage.setItem=()=>{throw new Error('quota');};assert.throws(()=>store.resume(defaults));assert.equal(storage.getItem(key),'broken');
});
test('blocked storage access is reported, not swallowed',()=>{
  const store=createProjectStorage(()=>{throw new Error('SecurityError');},legacyKey,options);
  assert.throws(()=>store.load(),/SecurityError/);assert.throws(()=>store.resume(defaults),/SecurityError/);
});
test('malformed state never replaces the last stored project',()=>{
  const storage=memoryStorage({[key]:raw(defaults)});const store=session(storage);store.load();const p=customProject();p.grid=null;
  assert.throws(()=>store.save(p));assert.equal(storage.getItem(key),raw(defaults));
});
test('named versions share v1 format and retain original legacy slots',()=>{
  const storage=memoryStorage({slot:JSON.stringify(defaults)});
  assert.deepEqual(loadNamedProject(storage,'slot',options).state,defaults);
  saveNamedProject(storage,'slot',customProject(),kitchen);
  assert.deepEqual(loadNamedProject(storage,'slot',options).state,customProject());
  assert.equal(storage.getItem('slot'),JSON.stringify(defaults));
});
test('named-slot backup failure preserves original named project',()=>{
  const storage=memoryStorage();saveNamedProject(storage,'slot',defaults,kitchen);
  storage.setItem=()=>{throw new Error('quota');};assert.throws(()=>saveNamedProject(storage,'slot',customProject(),kitchen));
  assert.deepEqual(loadNamedProject(storage,'slot',options).state,defaults);
});
test('missing slot and missing previous save are explicit errors',()=>{
  const storage=memoryStorage();assert.throws(()=>loadNamedProject(storage,'missing',options),/No saved/);
  assert.throws(()=>session(storage).previousProject(),/No previous/);
});
