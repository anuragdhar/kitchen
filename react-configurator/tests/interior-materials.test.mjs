import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {MATERIALS,getMaterial,mapPath} from '../src/home/materialCatalog.mjs';
import {DEFAULT_APPEARANCE,validateAppearance,effectiveMaterials,parseAppearance} from '../src/home/appearance.mjs';
import {tagSurfaceMaterial} from '../src/render/surfaceRoles.mjs';
const copy=()=>structuredClone(DEFAULT_APPEARANCE);
test('four independently sourced wood species and plaster finishes exist',()=>{
 assert.equal(new Set(MATERIALS.map(m=>m.id)).size,MATERIALS.length);
 assert.deepEqual(MATERIALS.filter(m=>m.role==='wood').map(m=>m.asset),['teak_veneer','white_oak_veneer','red_oak_veneer','cherry_veneer']);
 for(const material of MATERIALS){assert.ok(material.sizeMetres>0);assert.equal(getMaterial(material.id,material.role),material);assert.match(mapPath(material,'normal'),/^materials\//);}
 assert.equal(getMaterial('original','wood'),null);assert.throws(()=>getMaterial('teak','plaster'));
});
test('appearance roundtrip and inheritance preserve distinct room overrides',()=>{
 const data=copy();data.rooms.entry={wood:'white-oak'};const clean=validateAppearance(data);
 assert.deepEqual(parseAppearance(JSON.stringify(clean)),clean);assert.equal(effectiveMaterials(clean,'entry').wood,'white-oak');assert.equal(effectiveMaterials(clean,'kitchen').wood,'teak');
 data.rooms.entry.wood='red-oak';assert.equal(clean.rooms.entry.wood,'white-oak');assert.ok(Object.isFrozen(clean.rooms.entry));
});
test('unknown IDs, room and invalid grain scales fail closed',()=>{
 for(const mutate of [s=>s.wood='pine',s=>s.plaster='teak',s=>s.grainScale=NaN,s=>s.grainScale=0,s=>s.grainScale=5,s=>s.rooms.unknown={wood:'teak'},s=>s.rooms.entry={metal:'teak'},s=>s.schemaVersion=2]){const data=copy();mutate(data);assert.throws(()=>validateAppearance(data));}
 assert.throws(()=>parseAppearance('x'.repeat(100001)));
});
test('surface tags do not alter material properties',()=>{
 const material={color:'#123456',metalness:0,userData:{original:true}};assert.equal(tagSurfaceMaterial(material,'wood','entry'),material);
 assert.equal(material.color,'#123456');assert.deepEqual(material.userData,{original:true,interiorRole:'wood',interiorRoom:'entry'});assert.throws(()=>tagSurfaceMaterial(material,'metal'));
});
test('bundled PBR maps match their documented source checksums',()=>{
 const root=path.resolve('public/materials');const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json')));
 assert.equal(manifest.assets.length,5);assert.equal(manifest.license,'CC0-1.0');
 for(const asset of manifest.assets){assert.equal(asset.license,'CC0-1.0');assert.match(asset.sourceUrl,/^https:\/\/polyhaven\.com\/a\//);assert.equal(asset.resolution,'1k');
  for(const channel of ['basecolor','normal','roughness']){const map=asset.maps[channel];const name=path.resolve(root,map.path);assert.ok(name.startsWith(root+path.sep));const bytes=fs.readFileSync(name);assert.equal(bytes.length,map.bytes);assert.equal(bytes.readUInt16BE(0),0xffd8);assert.equal(createHash('sha256').update(bytes).digest('hex'),map.sha256);}
 }
});
