import test from 'node:test'
import assert from 'node:assert/strict'
import {ARTIFACTS,buildHomeRenderJob,readRenderIndex} from '../src/domain/wholeHomeRender.mjs'

const rooms={drawing:{key:'drawing',name:'Drawing Room',bounds:[515,449,688,715]}}
const scale={xMetresPerPixel:4.993/260,zMetresPerPixel:3.277/163}

test('exports the existing plan directions into Blender metres without mutation',()=>{
  const before=structuredClone(rooms)
  const job=buildHomeRenderJob(rooms,scale)
  assert.deepEqual(job.rooms[0].bounds,[515*scale.xMetresPerPixel,-715*scale.zMetresPerPixel,688*scale.xMetresPerPixel,-449*scale.zMetresPerPixel])
  assert.deepEqual(rooms,before)
  assert.equal(job.axes,'BLENDER_Z_UP')
  assert.deepEqual(job.rooms[0].artifacts,[])
})

test('supports all preset and quality combinations',()=>{
  for(const preset of ['day','evening','night'])for(const quality of ['draft','final']){
    assert.equal(buildHomeRenderJob(rooms,scale,{},preset,quality).quality,quality)
  }
})

test('exports a selected artifact and its exact support ID',()=>{
  for(const asset of ARTIFACTS){
    const selections={drawing:[{kind:asset.id,support:'Element 167'}]}
    const before=structuredClone(selections)
    assert.deepEqual(buildHomeRenderJob(rooms,scale,selections).rooms[0].artifacts,selections.drawing)
    assert.deepEqual(selections,before)
  }
})

test('refuses invalid presets, scales, dimensions and output IDs',()=>{
  assert.throws(()=>buildHomeRenderJob(rooms,scale,{},'unknown'))
  for(const value of [NaN,Infinity,0,-1,'0.02'])assert.throws(()=>buildHomeRenderJob(rooms,{...scale,xMetresPerPixel:value}))
  for(const bounds of [[1,2,1,4],[1,2,3,NaN],[1,2,3]])assert.throws(()=>buildHomeRenderJob({x:{...rooms.drawing,bounds}},scale))
  assert.throws(()=>buildHomeRenderJob({x:{...rooms.drawing,key:'../../x'}},scale))
})

test('refuses floating, unknown and overlapping artifact selections',()=>{
  for(const selected of [
    [{kind:'ceramic-vase',support:''}],
    [{kind:'not-a-model',support:'table'}],
    [{kind:'books',support:'table'},{kind:'planter',support:'table'}],
  ])assert.throws(()=>buildHomeRenderJob(rooms,scale,{drawing:selected}))
})

test('accepts only generated same-origin PNG paths',()=>{
  const index={schema:'a501.whole-home-output',version:1,preset:'day',quality:'draft',rooms:[{id:'drawing',name:'Drawing Room',image:'/renders/whole-home-realistic/0123456789ab/drawing.png'}]}
  assert.equal(readRenderIndex(index),index)
  for(const image of ['https://example.com/x.png','/renders/whole-home-realistic/../../x.png','javascript:alert(1)','/renders/whole-home-realistic/0123456789ab/x.svg']){
    assert.throws(()=>readRenderIndex({...index,rooms:[{...index.rooms[0],image}]}))
  }
})

test('refuses shared support across room boundaries',()=>{
  const second={...rooms,other:{...rooms.drawing,key:'other'}}
  assert.throws(()=>buildHomeRenderJob(second,scale,{drawing:[{kind:'books',support:'table'}],other:[{kind:'planter',support:'table'}]}))
})
