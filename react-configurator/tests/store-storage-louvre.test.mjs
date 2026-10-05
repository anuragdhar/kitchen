import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import {KITCHEN_STORE_STORAGE as STORAGE,KITCHEN_REFRIGERATOR as FRIDGE,ROOM_HEIGHT,KITCHEN} from '../src/config/kitchenConfig.js'
import {HOME_ROOM_LAYOUTS} from '../src/config/homeRoomViews.js'
import {ENTRY} from '../src/config/entryConfig.js'
import {checkStoreStorageLouvre,storeStorageLouvre,louvreSlatPositions} from '../src/domain/storeStorageLouvre.mjs'
import {createStoreStorage,storeStorageParts} from '../src/rooms/shared/StoreStorage.js'

test('owner 2026-10-06: full-height louvre covers the existing recess without moving racks or fridge',()=>{
  // Intentional new fixtures: owner asked to hide the whole storage and the space above the fridge.
  // 30 x 20 / 45 pitch, 15 + 50 clearances, 50 ventilation and 10 passing gap are PROPOSALS, not surveyed sizes.
  assert.deepEqual(STORAGE.slidingCover,{fromSouthMm:1058,widthMm:1092,heightMm:2635,travelMm:1000,frontOffsetMm:120})
  assert.deepEqual([STORAGE.fromKitchenWestMm,STORAGE.fromKitchenSouthMm,STORAGE.widthMm,STORAGE.depthMm,STORAGE.heightMm],[1000,1058,1092,1000,2600])
  assert.deepEqual([STORAGE.racks.lengthMm,STORAGE.racks.widthMm,STORAGE.racks.heightMm,STORAGE.racks.gapMm],[762,355.6,1644.65,150])
  assert.deepEqual(FRIDGE,{model:'LG GL-B257HDS3',depthMm:735,widthMm:913,heightMm:1790,fromKitchenWestMm:1400,southWallThicknessMm:45,faces:'west'})
  const result=checkStoreStorageLouvre(STORAGE,FRIDGE),{slider,fixed}=result.parts
  assert.equal(result.ok,true,result.issues.join('; '))
  assert.equal(STORAGE.louvre.ceilingHeightMm,ROOM_HEIGHT)
  assert.deepEqual([slider.x,slider.y,slider.z,slider.w,slider.h,slider.d],[860,15,1058,38,2635,1092])
  assert.deepEqual([fixed.x,fixed.y,fixed.z,fixed.w,fixed.h,fixed.d],[908,1840,45,38,810,1013])
  assert.deepEqual([result.passingGapMm,result.ventilationGapMm],[10,50])
})

test('closed slats share one pitch lattice across the joint, including a split edge slat',()=>{
  const {slider,fixed}=storeStorageLouvre(STORAGE,FRIDGE),l=STORAGE.louvre
  assert.deepEqual([l.slatWidthMm,l.slatDepthMm,l.pitchMm],[30,20,45])
  const full=louvreSlatPositions(fixed.z,slider.z+slider.d,FRIDGE.southWallThicknessMm,l.slatWidthMm,l.pitchMm)
  const joined=new Map()
  for(const s of [...fixed.slats,...slider.slats]){
    const previous=joined.get(s.index)
    joined.set(s.index,previous?{...previous,widthMm:previous.widthMm+s.widthMm}:s)
  }
  assert.deepEqual([...joined.values()],full)
  assert.equal(fixed.slats.at(-1).fromMm+fixed.slats.at(-1).widthMm,slider.slats[0].fromMm)
  assert.equal(fixed.slats.at(-1).index,slider.slats[0].index)
})

test('slider clears the fixed panel throughout travel and exposes both rack fronts',()=>{
  const closed=storeStorageLouvre(STORAGE,FRIDGE)
  for(const fraction of [0,.25,.5,.75,1]){
    const {slider,fixed}=storeStorageLouvre(STORAGE,FRIDGE,fraction)
    assert.deepEqual(fixed,closed.fixed)
    assert.equal(slider.z,closed.slider.z-1000*fraction)
    assert.equal(slider.slats[0].fromMm,closed.slider.slats[0].fromMm-1000*fraction)
    assert.equal(fixed.x-slider.x-slider.w,10)
  }
  const {slider}=storeStorageLouvre(STORAGE,FRIDGE,1),r=STORAGE.racks
  const firstRack=STORAGE.fromKitchenSouthMm+(STORAGE.widthMm-2*r.widthMm-r.gapMm)/2
  assert.ok(slider.z+slider.d<firstRack)
})

test('Whole home upper panel covers the unscaled fridge while retaining the existing scaled rack placement',()=>{
  const bounds=HOME_ROOM_LAYOUTS.find(r=>r.key==='kitchen').bounds
  const scale=(bounds[3]-bounds[1])*ENTRY.planScale.zMetresPerPixel/(KITCHEN.length/1000)
  const fridge={...FRIDGE,widthMm:FRIDGE.widthMm/scale,southWallThicknessMm:FRIDGE.southWallThicknessMm/scale}
  const result=checkStoreStorageLouvre(STORAGE,fridge)
  assert.equal(result.ok,true,result.issues.join('; '))
  const {fixed,slider}=result.parts
  assert.ok(Math.abs(fixed.z*scale-FRIDGE.southWallThicknessMm)<1e-6)
  assert.ok((fixed.z+fixed.d)*scale>=FRIDGE.southWallThicknessMm+FRIDGE.widthMm)
  assert.ok(fixed.z+fixed.d>slider.z,'Fixed panel bridges behind the closed slider in the plan-scaled scene')
  const racks=parts=>parts.filter(p=>!p.name.startsWith('storage '))
  assert.deepEqual(racks(storeStorageParts(fridge)),racks(storeStorageParts()))
  const model=createStoreStorage({fridge});model.scale.z=scale;model.updateWorldMatrix(true,true)
  const box=new THREE.Box3().setFromObject(model.getObjectByName(fixed.id))
  assert.ok(Math.abs(box.min.z-FRIDGE.southWallThicknessMm/1000)<1e-6)
  assert.ok(Math.abs(box.max.z-(FRIDGE.southWallThicknessMm+FRIDGE.widthMm)/1000)<1e-6)
  model.traverse(mesh=>{mesh.geometry?.dispose();mesh.material?.dispose()})
})

test('negative checks reject short/narrow covers, missing ventilation, colliding planes and oversized hardware',()=>{
  const reject=(change,pattern)=>{
    const storage=structuredClone(STORAGE);change(storage)
    const result=checkStoreStorageLouvre(storage,FRIDGE)
    assert.equal(result.ok,false);assert.match(result.issues.join('; '),pattern)
  }
  reject(s=>{s.slidingCover.widthMm=1000},/full storage opening/)
  reject(s=>{s.slidingCover.heightMm=2200},/floor to ceiling/)
  reject(s=>{s.louvre.ventilationGapMm=0},/Invalid/)
  reject(s=>{s.louvre.ventilationGapMm=1000},/Ventilation gap/)
  reject(s=>{s.louvre.passingGapMm=-1},/Invalid/)
  reject(s=>{s.louvre.track.heightMm=60},/Track/)
  reject(s=>{s.louvre.bridgeToStorage=false},/must meet/)
  reject(s=>{s.louvre.pitchMm=0},/Invalid/)
  reject(s=>{s.slidingCover.travelMm=2000},/guide/)
  assert.throws(()=>louvreSlatPositions(0,100,0,30,0),RangeError)
  assert.throws(()=>storeStorageLouvre(STORAGE,FRIDGE,NaN),RangeError)
})

test('shared Three builder matches pure panel bounds and reversibly slides only the moving leaf',()=>{
  const group=createStoreStorage(),parts=storeStorageLouvre(STORAGE,FRIDGE)
  const instanced=group.children.filter(m=>m.isInstancedMesh)
  assert.equal(instanced.length,2)
  const bounds=mesh=>{mesh.updateWorldMatrix(true,false);return new THREE.Box3().setFromObject(mesh)}
  const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`) // Floating point conversion tolerance, metres.
  for(const panel of [parts.slider,parts.fixed]){
    const backing=group.getObjectByName(panel.id),slats=group.getObjectByName(`${panel.id} slats`)
    assert.equal(slats.count,panel.slats.length)
    assert.equal(slats.material.userData.interiorRole,'wood')
    assert.equal(backing.material.userData.interiorRole,undefined) // Dark opaque board stays dark under palette changes.
    assert.equal(backing.material.transparent,false)
    const box=bounds(backing).union(bounds(slats))
    for(const [axis,size] of [['x','w'],['y','h'],['z','d']]){
      near(box.min[axis],panel[axis]/1000);near(box.max[axis],(panel[axis]+panel[size])/1000)
    }
  }
  const initial=group.children.map(mesh=>({mesh,box:bounds(mesh).clone()}))
  group.userData.setCoverOpen(true);group.userData.setCoverOpen(true)
  for(const {mesh,box} of initial){
    const shift=/^storage sliding cover/.test(mesh.name)?-1:0
    near(bounds(mesh).min.z,box.min.z+shift)
    near(bounds(mesh).min.x,box.min.x)
  }
  group.userData.setCoverOpen(false)
  for(const {mesh,box} of initial)near(bounds(mesh).min.z,box.min.z)
  group.traverse(mesh=>{mesh.geometry?.dispose();mesh.material?.dispose()})
})
